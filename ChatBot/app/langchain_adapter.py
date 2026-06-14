from __future__ import annotations

from typing import Any, Dict

from .sql import MemoryStore


class SQLiteMemoryAdapter:
    def __init__(self, memory_store: MemoryStore):
        self.memory_store = memory_store

    def load_memory_variables(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        session_id = inputs.get("session_id")
        if not session_id:
            return {"summary": "", "slots": {}, "history": ""}

        summary, slots = self.memory_store.load_thread_state(session_id)
        history = self.memory_store.get_history_as_text(session_id, limit=20)
        return {
            "summary": summary,
            "slots": slots,
            "history": history,
        }

    def save_context(self, inputs: Dict[str, Any], outputs: Dict[str, Any]) -> None:
        session_id = inputs.get("session_id")
        user_text = inputs.get("input", "")
        assistant_text = outputs.get("output", "")
        new_slots = outputs.get("_slots")

        if not session_id:
            return

        thread_id = self.memory_store.get_or_create_thread(session_id, thread_id=session_id)
        if user_text:
            self.memory_store.append_message(thread_id, "user", user_text)
        if assistant_text:
            self.memory_store.append_message(thread_id, "assistant", assistant_text)
        if isinstance(new_slots, dict):
            summary, _ = self.memory_store.load_thread_state(thread_id)
            self.memory_store.update_thread_state(thread_id, summary, new_slots)