import json
import os
from datetime import datetime, timedelta
from typing import List, Dict, Optional


class SheetsClient:
    """Local JSON-backed storage that replaces Google Sheets for history tracking.

    Data layout stored in JSON file:
    {"entries": [ {"product_id":..., "title":..., "article_id":..., "status":..., "ts":...}, ... ]}
    """

    def __init__(self, config: Optional[Dict] = None, path: Optional[str] = None, max_history: int = 50):
        cfg = config or {}
        self.path = path or cfg.get('LOCAL_DB_FILE', cfg.get('GOOGLE_SHEETS_FILE', 'local_db.json'))
        self.max_history = max_history
        if not os.path.exists(self.path):
            self._write({'entries': []})

    def _read(self) -> Dict:
        with open(self.path, 'r', encoding='utf-8') as f:
            return json.load(f)

    def _write(self, data: Dict):
        with open(self.path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def read_rows(self) -> List[Dict]:
        data = self._read()
        return data.get('entries', [])

    def append_row(self, row: Dict):
        data = self._read()
        entries = data.get('entries', [])
        row_copy = dict(row)
        row_copy.setdefault('ts', datetime.utcnow().isoformat())
        entries.append(row_copy)
        # keep history bounded
        if len(entries) > self.max_history:
            entries = entries[-self.max_history:]
        data['entries'] = entries
        self._write(data)
        print(f"Appended row to {self.path}")

    def get_recent_titles(self, n: int = 10) -> List[str]:
        entries = self.read_rows()
        titles = [e.get('title') for e in entries if e.get('title')]
        return titles[-n:]

    def titles_in_last_weeks(self, weeks: int = 4) -> List[str]:
        """Return titles that were added in the last `weeks` weeks."""
        entries = self.read_rows()
        now = datetime.utcnow()
        cutoff = now - timedelta(weeks=weeks)
        recent = []
        for e in entries:
            ts = e.get('ts')
            if not ts:
                continue
            try:
                t = datetime.fromisoformat(ts)
            except Exception:
                continue
            if t >= cutoff:
                title = e.get('title')
                if title:
                    recent.append(title)
        return recent

    def add_recent_title(self, title: str, article_id: str = '', product_id: str = '', status: str = 'created'):
        self.append_row({'product_id': product_id, 'title': title, 'article_id': article_id, 'status': status})

