import os
import json
import uuid
import time
import smtplib
import logging
import asyncio
import threading
import ipaddress
from email.message import EmailMessage
from collections import deque
from concurrent.futures import ThreadPoolExecutor
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, Request, HTTPException, BackgroundTasks
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv

from .sql import MemoryStore, should_refresh_summary
from .intention_classifier import classify_intention, route_message
from .db import db_client
from .vector_store import vector_store

# Cargar variables de entorno desde .env
load_dotenv()

logging.basicConfig(
    level=os.environ.get("CHATBOT_LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s %(message)s"
)
logger = logging.getLogger("starsano-chatbot")

app = FastAPI(title="Starsano ChatBot API")

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SMTP_HOST = os.environ.get("SMTP_HOST")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER")
SMTP_PASS = os.environ.get("SMTP_PASS")
SMTP_FROM = os.environ.get("SMTP_FROM")
ALERT_EMAIL_TO = os.environ.get("ALERT_EMAIL_TO")

MAX_MESSAGE_LENGTH = int(os.environ.get("CHAT_MAX_MESSAGE_LENGTH", "1000"))
RATE_LIMIT_WINDOW_SECONDS = int(os.environ.get("CHAT_RATE_LIMIT_WINDOW_SECONDS", "60"))
RATE_LIMIT_MAX_REQUESTS = int(os.environ.get("CHAT_RATE_LIMIT_MAX_REQUESTS", "12"))
CHAT_TIMEOUT_SECONDS = float(os.environ.get("CHAT_TIMEOUT_SECONDS", "18"))
IO_WORKERS = int(os.environ.get("IO_WORKERS", "4"))
IO_RETRY_ATTEMPTS = int(os.environ.get("IO_RETRY_ATTEMPTS", "3"))
SUMMARY_REFRESH_EVERY = int(os.environ.get("SUMMARY_REFRESH_EVERY", "12"))
SUMMARY_CONTEXT_MESSAGES = int(os.environ.get("SUMMARY_CONTEXT_MESSAGES", "30"))
SUMMARY_MODEL = os.environ.get("SUMMARY_MODEL") or os.environ.get("OPENAI_MODEL", "gpt-4o-mini")

# Inicializar el almacenamiento de memoria
memory_store = MemoryStore("data/chatbot.db")
io_executor = ThreadPoolExecutor(max_workers=max(2, IO_WORKERS))

summary_llm = ChatOpenAI(
    model=SUMMARY_MODEL,
    api_key=os.environ.get("OPENAI_API_KEY"),
    temperature=0
)


class SlidingWindowRateLimiter:
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.hits: Dict[str, deque[float]] = {}
        self.lock = threading.Lock()

    def allow(self, key: str) -> bool:
        now = time.time()
        with self.lock:
            bucket = self.hits.get(key)
            if bucket is None:
                bucket = deque()
                self.hits[key] = bucket

            cutoff = now - self.window_seconds
            while bucket and bucket[0] < cutoff:
                bucket.popleft()

            if len(bucket) >= self.max_requests:
                return False

            bucket.append(now)
            return True


rate_limiter = SlidingWindowRateLimiter(
    max_requests=RATE_LIMIT_MAX_REQUESTS,
    window_seconds=RATE_LIMIT_WINDOW_SECONDS,
)
summary_inflight: set[str] = set()
summary_lock = threading.Lock()

reindex_status: Dict[str, Any] = {
    "running": False,
    "last_started_at": None,
    "last_finished_at": None,
    "last_error": None,
    "indexed": 0,
    "duration_ms": 0,
}
reindex_lock = threading.Lock()

# --- Models ---

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=MAX_MESSAGE_LENGTH)
    session_id: str = Field(..., min_length=1, max_length=120)
    email: Optional[str] = None

    @field_validator("message")
    @classmethod
    def normalize_message(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("message cannot be empty")
        return normalized

class ChatResponse(BaseModel):
    response: str
    session_id: str


class ReindexStatusResponse(BaseModel):
    running: bool
    last_started_at: Optional[int]
    last_finished_at: Optional[int]
    last_error: Optional[str]
    indexed: int
    duration_ms: int

# --- Utilities ---


def get_client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def require_internal_request(request: Request):
    ip = get_client_ip(request)
    try:
        parsed = ipaddress.ip_address(ip)
        if parsed.is_loopback or parsed.is_private:
            return
    except ValueError:
        pass
    raise HTTPException(status_code=403, detail="Reindex endpoint is allowed only from internal network")


def _extract_json_object(content: str) -> Dict[str, Any]:
    text = content.strip()
    try:
        return json.loads(text)
    except Exception:
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            return json.loads(text[start:end + 1])
        raise


def _refresh_summary_task(thread_id: str):
    try:
        summary, slots = memory_store.load_thread_state(thread_id)
        messages = memory_store.fetch_last_messages(thread_id, limit=SUMMARY_CONTEXT_MESSAGES)
        if not messages:
            return

        transcript_lines = [f"{m['role']}: {m['content']}" for m in messages]
        transcript = "\n".join(transcript_lines)

        prompt = (
            "Eres un compactador de memoria conversacional para un chatbot de eCommerce.\n"
            "Devuelve SOLO JSON válido con este formato:"
            " {\"summary\": \"texto\", \"slots\": {\"order_id\": \"...\", \"product_interest\": \"...\"}}\n"
            "Reglas:\n"
            "- Conserva hechos útiles y vigentes, elimina ruido.\n"
            "- No inventes datos.\n"
            "- Mantén summary breve (3-6 líneas).\n"
            "- slots debe ser objeto JSON; conserva valores previos válidos.\n\n"
            f"Resumen actual:\n{summary or '(vacío)'}\n\n"
            f"Slots actuales:\n{json.dumps(slots or {}, ensure_ascii=False)}\n\n"
            f"Conversación reciente:\n{transcript}\n"
        )

        response = summary_llm.invoke(prompt)
        parsed = _extract_json_object(response.content)
        new_summary = str(parsed.get("summary", summary or "")).strip()

        candidate_slots = parsed.get("slots", slots or {})
        if not isinstance(candidate_slots, dict):
            candidate_slots = slots or {}

        merged_slots = dict(slots or {})
        merged_slots.update(candidate_slots)

        memory_store.update_thread_state(thread_id, new_summary, merged_slots)
        logger.info("summary_refreshed thread_id=%s", thread_id)
    except Exception as exc:
        logger.exception("summary_refresh_failed thread_id=%s error=%s", thread_id, exc)
    finally:
        with summary_lock:
            summary_inflight.discard(thread_id)


def schedule_summary_refresh(thread_id: str):
    with summary_lock:
        if thread_id in summary_inflight:
            return
        summary_inflight.add(thread_id)
    io_executor.submit(_refresh_summary_task, thread_id)

def send_alert_email(user_id: str, message_text: str) -> bool:
    destination_email = db_client.get_contact_email_setting() or ALERT_EMAIL_TO

    if not (SMTP_HOST and SMTP_USER and SMTP_PASS and SMTP_FROM and destination_email):
        print("Faltan credenciales de SMTP o destinatario")
        return False

    email_body = (
        f"El usuario: {user_id} está descontento o pide una acción que no se puede realizar automáticamente.\n\n"
        f"Ha mandado el siguiente mensaje: {message_text}\n\n"
        "El asistente lo ha redirigido a atención humana."
    )

    msg = EmailMessage()
    msg["Subject"] = "Alerta: usuario requiere atención humana"
    msg["From"] = SMTP_FROM
    msg["To"] = destination_email
    msg.set_content(email_body)

    for attempt in range(1, IO_RETRY_ATTEMPTS + 1):
        try:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
                server.starttls()
                server.login(SMTP_USER, SMTP_PASS)
                server.send_message(msg)
            return True
        except Exception as exc:
            logger.warning("alert_email_failed attempt=%s user=%s error=%s", attempt, user_id, exc)
            if attempt < IO_RETRY_ATTEMPTS:
                time.sleep(0.4 * attempt)

    return False


def enqueue_alert_email(user_id: str, message_text: str):
    io_executor.submit(send_alert_email, user_id, message_text)


def run_reindex_job():
    started_at = int(time.time())
    with reindex_lock:
        reindex_status["running"] = True
        reindex_status["last_started_at"] = started_at
        reindex_status["last_error"] = None

    try:
        result = vector_store.sync_with_db() or {}
        with reindex_lock:
            reindex_status["indexed"] = int(result.get("indexed", 0))
            reindex_status["duration_ms"] = int(result.get("duration_ms", 0))
    except Exception as exc:
        logger.exception("reindex_failed error=%s", exc)
        with reindex_lock:
            reindex_status["last_error"] = str(exc)
    finally:
        with reindex_lock:
            reindex_status["running"] = False
            reindex_status["last_finished_at"] = int(time.time())

def process_logic(user_id: str, message_text: str, email: Optional[str] = None) -> Dict[str, Any]:
    thread_id = memory_store.get_or_create_thread(user_id)
    summary, slots = memory_store.load_thread_state(thread_id)
    history_text = memory_store.get_history_as_text(thread_id, limit=8)
    
    # Añadir mensaje del usuario a la base de datos ANTES de procesar para que salga en el historial si hace falta
    # Pero aquí lo pasamos por separado a la lógica
    intention = classify_intention(message_text, context=summary, history=history_text)
    logger.info("classified user_id=%s intention=%s", user_id, intention)
    
    result = route_message(intention, message_text, user_id, thread_id, slots, email)
    
    response_text = result.get("response_text") if isinstance(result, dict) else "Lo siento, tuve un problema procesando tu mensaje."
    new_slots = result.get("slots", slots) if isinstance(result, dict) else slots
    notify_email = result.get("notify_email") if isinstance(result, dict) else False

    if notify_email:
        enqueue_alert_email(user_id, message_text)
    
    # Persistir mensajes y nuevo estado
    memory_store.append_message(thread_id, "user", message_text)
    if response_text:
        memory_store.append_message(thread_id, "assistant", response_text)
    
    memory_store.update_thread_state(thread_id, summary, new_slots)

    total_messages = memory_store.count_messages(thread_id)
    if should_refresh_summary(total_messages, every_n=SUMMARY_REFRESH_EVERY):
        schedule_summary_refresh(thread_id)
    
    return {"response_text": response_text, "intention": intention}


@app.middleware("http")
async def log_requests(request: Request, call_next):
    request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
    start = time.time()
    try:
        response = await call_next(request)
    except Exception:
        logger.exception("request_failed request_id=%s method=%s path=%s", request_id, request.method, request.url.path)
        raise

    elapsed_ms = int((time.time() - start) * 1000)
    response.headers["x-request-id"] = request_id
    logger.info(
        "request_completed request_id=%s method=%s path=%s status=%s elapsed_ms=%s",
        request_id,
        request.method,
        request.url.path,
        response.status_code,
        elapsed_ms,
    )
    return response

# --- Endpoints ---

@app.post("/chat", response_model=ChatResponse)
async def chat_web(payload: ChatRequest, request: Request):
    """
    Endpoint for the web frontend chat widget.
    """
    ip = get_client_ip(request)
    if not rate_limiter.allow(f"chat-ip:{ip}"):
        raise HTTPException(status_code=429, detail="Too many requests from this IP")
    if not rate_limiter.allow(f"chat-session:{payload.session_id}"):
        raise HTTPException(status_code=429, detail="Too many requests for this session")

    try:
        res = await asyncio.wait_for(
            run_in_threadpool(process_logic, payload.session_id, payload.message, payload.email),
            timeout=CHAT_TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Chat processing timeout")

    return ChatResponse(
        response=res["response_text"], 
        session_id=payload.session_id
    )


@app.post("/admin/reindex", response_model=ReindexStatusResponse)
async def admin_reindex(request: Request, background_tasks: BackgroundTasks):
    require_internal_request(request)
    with reindex_lock:
        if reindex_status["running"]:
            raise HTTPException(status_code=409, detail="Reindex already running")

    background_tasks.add_task(run_reindex_job)
    with reindex_lock:
        return ReindexStatusResponse(**reindex_status)


@app.get("/admin/reindex/status", response_model=ReindexStatusResponse)
def admin_reindex_status(request: Request):
    require_internal_request(request)
    with reindex_lock:
        return ReindexStatusResponse(**reindex_status)

@app.get("/health")
def health():
    return {"status": "ok"}
