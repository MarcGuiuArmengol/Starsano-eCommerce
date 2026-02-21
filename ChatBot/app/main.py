import os
import hmac
import hashlib
import smtplib
from email.message import EmailMessage
from typing import Optional, List, Dict, Any

import httpx
from fastapi import FastAPI, Request, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from .sql import MemoryStore
from .intention_classifier import classify_intention, route_message

# Cargar variables de entorno desde .env
load_dotenv()

app = FastAPI(title="Starsano ChatBot API")

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

VERIFY_TOKEN = os.environ.get("WHATSAPP_VERIFY_TOKEN", "pon-un-token-largo")
APP_SECRET = os.environ.get("META_APP_SECRET")
WHATSAPP_PHONE_NUMBER_ID = os.environ.get("WHATSAPP_PHONE_NUMBER_ID")
WHATSAPP_ACCESS_TOKEN = os.environ.get("WHATSAPP_ACCESS_TOKEN")
WHATSAPP_API_VERSION = os.environ.get("WHATSAPP_API_VERSION", "v20.0")

SMTP_HOST = os.environ.get("SMTP_HOST")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER")
SMTP_PASS = os.environ.get("SMTP_PASS")
SMTP_FROM = os.environ.get("SMTP_FROM")
ALERT_EMAIL_TO = os.environ.get("ALERT_EMAIL_TO")

# Inicializar el almacenamiento de memoria
memory_store = MemoryStore("data/chatbot.db")

# --- Models ---

class ChatRequest(BaseModel):
    message: str
    session_id: str

class ChatResponse(BaseModel):
    response: str
    session_id: str

# --- Utilities ---

def verify_signature(app_secret: str, body: bytes, header_value: str) -> bool:
    if not app_secret or not header_value:
        return False
    try:
        algo, their_sig = header_value.split("=", 1)
        if algo != "sha256":
            return False
        mac = hmac.new(app_secret.encode("utf-8"), msg=body, digestmod=hashlib.sha256)
        our_sig = mac.hexdigest()
        return hmac.compare_digest(our_sig, their_sig)
    except Exception:
        return False

def send_whatsapp_message(to_number: str, text: str) -> bool:
    if not WHATSAPP_PHONE_NUMBER_ID or not WHATSAPP_ACCESS_TOKEN:
        print("Faltan credenciales de WhatsApp Cloud API")
        return False
    
    url = f"https://graph.facebook.com/{WHATSAPP_API_VERSION}/{WHATSAPP_PHONE_NUMBER_ID}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "to": to_number,
        "type": "text",
        "text": {"body": text}
    }
    headers = {
        "Authorization": f"Bearer {WHATSAPP_ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }

    try:
        with httpx.Client(timeout=10) as client:
            response = client.post(url, json=payload, headers=headers)
            if response.status_code >= 300:
                print(f"Error enviando WhatsApp: {response.status_code} {response.text}")
                return False
        return True
    except Exception as e:
        print(f"Error enviando WhatsApp: {e}")
        return False

def send_alert_email(user_id: str, message_text: str) -> bool:
    if not (SMTP_HOST and SMTP_USER and SMTP_PASS and SMTP_FROM and ALERT_EMAIL_TO):
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
    msg["To"] = ALERT_EMAIL_TO
    msg.set_content(email_body)

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Error enviando email de alerta: {e}")
        return False

def process_logic(user_id: str, message_text: str) -> Dict[str, Any]:
    thread_id = memory_store.get_or_create_thread(user_id)
    memory_store.append_message(thread_id, "user", message_text)
    summary, slots = memory_store.load_thread_state(thread_id)
    
    intention = classify_intention(message_text, context=summary)
    print(f"[CLASSIFIED] User {user_id}: intention = {intention}")
    
    result = route_message(intention, message_text, user_id, thread_id, slots)
    response_text = result.get("response_text") if isinstance(result, dict) else "Lo siento, tuve un problema procesando tu mensaje."
    notify_email = result.get("notify_email") if isinstance(result, dict) else False

    if notify_email:
        send_alert_email(user_id, message_text)
    
    if response_text:
        memory_store.append_message(thread_id, "assistant", response_text)
    
    return {"response_text": response_text, "intention": intention}

# --- Endpoints ---

@app.get("/webhook")
def webhook_verify(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
):
    if hub_mode == "subscribe" and hub_verify_token == VERIFY_TOKEN:
        return int(hub_challenge)
    raise HTTPException(status_code=403, detail="Forbidden")

@app.post("/webhook")
async def webhook_receive(request: Request, background_tasks: BackgroundTasks):
    sig = request.headers.get("X-Hub-Signature-256")
    raw_body = await request.body()

    if APP_SECRET:
        if not verify_signature(APP_SECRET, raw_body, sig or ""):
            raise HTTPException(status_code=401, detail="Invalid signature")

    payload = await request.json()
    for entry in payload.get("entry", []):
        for change in entry.get("changes", []):
            value = change.get("value", {})
            for msg in value.get("messages", []):
                from_ = msg.get("from")
                msg_type = msg.get("type")
                text = (msg.get("text") or {}).get("body")
                
                if msg_type == "text" and text:
                    # Run processing in background
                    background_tasks.add_task(process_whatsapp_message, from_, text)
    return {"status": "ok"}

def process_whatsapp_message(from_number: str, text: str):
    res = process_logic(from_number, text)
    send_whatsapp_message(from_number, res["response_text"])

@app.post("/chat", response_model=ChatResponse)
async def chat_web(request: ChatRequest):
    """
    Endpoint for the web frontend chat widget.
    """
    res = process_logic(request.session_id, request.message)
    return ChatResponse(response=res["response_text"], session_id=request.session_id)

@app.get("/health")
def health():
    return {"status": "ok"}
