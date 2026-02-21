import sqlite3
import json
import time
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

# ----------------------------
# DB
# ----------------------------

SCHEMA = """
PRAGMA journal_mode=WAL;

CREATE TABLE IF NOT EXISTS threads (
  thread_id TEXT PRIMARY KEY,
  user_id   TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  summary TEXT DEFAULT '',
  slots_json TEXT DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_threads_user ON threads(user_id);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('system','user','assistant','tool')),
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  tokens_est INTEGER DEFAULT 0,
  meta_json TEXT DEFAULT '{}',
  FOREIGN KEY(thread_id) REFERENCES threads(thread_id)
);

CREATE INDEX IF NOT EXISTS idx_messages_thread_time ON messages(thread_id, created_at);
"""

def now_ts() -> int:
    return int(time.time())

def tokens_estimate(text: str) -> int:
    # Aproximación razonable: ~4 chars/token en español+inglés promedio
    return max(1, len(text) // 4)

class MemoryStore:
    def __init__(self, db_path: str = "memory.sqlite"):
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self.conn.executescript(SCHEMA)

    def get_or_create_thread(self, user_id: str, thread_id: Optional[str] = None) -> str:
        # thread_id puede ser user_id si quieres 1 conversación por usuario
        tid = thread_id or f"thread:{user_id}"
        row = self.conn.execute("SELECT thread_id FROM threads WHERE thread_id=?", (tid,)).fetchone()
        if row is None:
            ts = now_ts()
            self.conn.execute(
                "INSERT INTO threads(thread_id,user_id,created_at,updated_at,summary,slots_json) VALUES (?,?,?,?,?,?)",
                (tid, user_id, ts, ts, "", "{}"),
            )
            self.conn.commit()
        return tid

    def append_message(self, thread_id: str, role: str, content: str, meta: Optional[Dict[str, Any]] = None):
        ts = now_ts()
        meta_json = json.dumps(meta or {}, ensure_ascii=False)
        tok = tokens_estimate(content)
        self.conn.execute(
            "INSERT INTO messages(thread_id,role,content,created_at,tokens_est,meta_json) VALUES (?,?,?,?,?,?)",
            (thread_id, role, content, ts, tok, meta_json),
        )
        self.conn.execute("UPDATE threads SET updated_at=? WHERE thread_id=?", (ts, thread_id))
        self.conn.commit()

    def load_thread_state(self, thread_id: str) -> Tuple[str, Dict[str, Any]]:
        row = self.conn.execute("SELECT summary, slots_json FROM threads WHERE thread_id=?", (thread_id,)).fetchone()
        if row is None:
            return "", {}
        summary = row["summary"] or ""
        slots = json.loads(row["slots_json"] or "{}")
        return summary, slots

    def update_thread_state(self, thread_id: str, summary: str, slots: Dict[str, Any]):
        ts = now_ts()
        self.conn.execute(
            "UPDATE threads SET summary=?, slots_json=?, updated_at=? WHERE thread_id=?",
            (summary, json.dumps(slots, ensure_ascii=False), ts, thread_id),
        )
        self.conn.commit()

    def fetch_last_messages(self, thread_id: str, limit: int = 30) -> List[Dict[str, Any]]:
        rows = self.conn.execute(
            "SELECT role, content, created_at, tokens_est, meta_json FROM messages WHERE thread_id=? "
            "ORDER BY created_at DESC LIMIT ?",
            (thread_id, limit),
        ).fetchall()
        # devolver en orden cronológico
        out = []
        for r in reversed(rows):
            out.append({
                "role": r["role"],
                "content": r["content"],
                "created_at": r["created_at"],
                "tokens_est": r["tokens_est"],
                "meta": json.loads(r["meta_json"] or "{}"),
            })
        return out

# ----------------------------
# Construcción de contexto
# ----------------------------

def build_context_messages(
    system_prompt: str,
    summary: str,
    slots: Dict[str, Any],
    last_messages: List[Dict[str, Any]],
    user_message: str,
    max_tokens_budget: int = 2500,
) -> List[Dict[str, str]]:
    """
    Construye el input para el LLM con:
    - system prompt
    - summary + slots (memoria larga)
    - historial recortado
    - mensaje actual del usuario
    """
    messages: List[Dict[str, str]] = [{"role": "system", "content": system_prompt}]

    memory_block_parts = []
    if summary.strip():
        memory_block_parts.append(f"RESUMEN:\n{summary.strip()}")
    if slots:
        memory_block_parts.append(f"SLOTS(JSON):\n{json.dumps(slots, ensure_ascii=False)}")
    if memory_block_parts:
        messages.append({"role": "system", "content": "\n\n".join(memory_block_parts)})

    # Añade historial reciente hasta presupuesto
    budget_used = sum(tokens_estimate(m["content"]) for m in messages)
    # Reservar para user_message
    budget_reserved = tokens_estimate(user_message) + 200
    budget_left = max(0, max_tokens_budget - budget_used - budget_reserved)

    selected_history: List[Dict[str, str]] = []
    used = 0
    # mete desde el final hacia atrás para priorizar lo más reciente
    for m in reversed(last_messages):
        t = m.get("tokens_est") or tokens_estimate(m["content"])
        if used + t > budget_left:
            break
        selected_history.append({"role": m["role"], "content": m["content"]})
        used += t
    selected_history.reverse()

    messages.extend(selected_history)
    messages.append({"role": "user", "content": user_message})
    return messages

# ----------------------------
# Resumen (hook)
# ----------------------------

def should_refresh_summary(total_messages: int, every_n: int = 12) -> bool:
    return total_messages % every_n == 0

#===============================================================================
#===============================================================================
## USAGE ##
#===============================================================================
#===============================================================================

""" store = MemoryStore("memory.sqlite")

user_id = "whatsapp:+34..."
thread_id = store.get_or_create_thread(user_id)

# 1) llega mensaje
incoming_text = "Quiero un pack de proteína vegana, ¿qué me recomiendas?"

# 2) cargas estado + historial
summary, slots = store.load_thread_state(thread_id)
history = store.fetch_last_messages(thread_id, limit=40)

# 3) construyes contexto
system_prompt = "Eres un asistente de soporte y ventas para un eCommerce. Responde breve y útil."
llm_messages = build_context_messages(system_prompt, summary, slots, history, incoming_text)

# 4) llamas a tu LLM aquí (OpenAI/lo que uses) -> assistant_text
assistant_text = "..."

# 5) guardas ambos mensajes
store.append_message(thread_id, "user", incoming_text)
store.append_message(thread_id, "assistant", assistant_text)

# 6) (opcional) cada X mensajes: actualizas summary+slots llamando al LLM con una instrucción de resumen
# store.update_thread_state(thread_id, new_summary, new_slots)
 """