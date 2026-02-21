import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import List, Dict, Any

class StoreDB:
    def __init__(self):
        self.host = os.environ.get("POSTGRES_HOST", "db")
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

    def search_products(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Realiza una búsqueda básica por nombre o descripción.
        """
        conn = self._get_connection()
        try:
            with conn.cursor() as cur:
                # Búsqueda simple por similitud de texto
                sql = """
                    SELECT id, name, price, description, category, badges 
                    FROM products 
                    WHERE name ILIKE %s OR description ILIKE %s 
                    LIMIT %s
                """
                search_term = f"%{query}%"
                cur.execute(sql, (search_term, search_term, limit))
                return cur.fetchall()
        finally:
            conn.close()

    def get_all_categories(self) -> List[str]:
        conn = self._get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT DISTINCT category FROM products")
                return [row['category'] for row in cur.fetchall()]
        finally:
            conn.close()

# Singleton instance
db_client = StoreDB()
