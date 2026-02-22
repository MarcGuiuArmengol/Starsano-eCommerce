import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import List, Dict, Any
from datetime import datetime, timedelta

class DBClient:
    def __init__(self, config: dict):
        self.host = os.environ.get("POSTGRES_HOST", "localhost")
        self.user = os.environ.get("POSTGRES_USER", "postgres")
        self.password = os.environ.get("POSTGRES_PASSWORD", "postgres")
        self.dbname = os.environ.get("POSTGRES_DB", "starsano")
        self.port = os.environ.get("POSTGRES_PORT", "5432")

    def _get_connection(self):
        return psycopg2.connect(
            host=self.host,
            user=self.user,
            password=self.password,
            dbname=self.dbname,
            port=self.port,
            cursor_factory=RealDictCursor
        )

    def search_products(self, query: str = '', limit: int = 20) -> List[Dict[str, Any]]:
        """Fetch real products from the database for article context."""
        conn = self._get_connection()
        try:
            with conn.cursor() as cur:
                if query:
                    cur.execute(
                        "SELECT id, name, description, category FROM products WHERE name ILIKE %s OR description ILIKE %s LIMIT %s",
                        (f"%{query}%", f"%{query}%", limit)
                    )
                else:
                    cur.execute("SELECT id, name, description, category FROM products ORDER BY RANDOM() LIMIT %s", (limit,))
                
                products = cur.fetchall()
                # Adapt to the format expected by the runner
                return [{
                    'id': p['id'],
                    'title': p['name'],
                    'description': p['description'],
                    'handle': str(p['id']) # We use ID as handle for local routing
                } for p in products]
        finally:
            conn.close()

    def titles_in_last_weeks(self, weeks: int = 4) -> List[str]:
        """Fetch titles of articles published in the last N weeks to avoid repetition."""
        conn = self._get_connection()
        try:
            with conn.cursor() as cur:
                cutoff = datetime.now() - timedelta(weeks=weeks)
                cur.execute("SELECT title FROM articles WHERE created_at > %s", (cutoff,))
                return [row['title'] for row in cur.fetchall()]
        finally:
            conn.close()

    def create_article(self, title: str, content: str, product_id: str = None) -> Dict[str, Any]:
        """Insert a generated article into the articles table."""
        conn = self._get_connection()
        try:
            with conn.cursor() as cur:
                # We assume a standard articles table exists or we use a basic schema
                # Let's check if articles table exists first or just attempt insert
                cur.execute(
                    "INSERT INTO articles (title, content, created_at) VALUES (%s, %s, %s) RETURNING id",
                    (title, content, datetime.now())
                )
                conn.commit()
                article_id = cur.fetchone()['id']
                return {'id': article_id, 'title': title}
        except Exception as e:
            print(f"Error creating article: {e}")
            return {'id': 'error', 'title': title}
        finally:
            conn.close()
