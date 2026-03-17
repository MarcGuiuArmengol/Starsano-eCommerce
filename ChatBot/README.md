# 1) Variables
cp .env.example .env
# Rellena OPENAI_API_KEY y, si aplica, las credenciales SMTP

# 2) Entorno
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# 3) Arrancar
uvicorn app.main:app --reload

# 4) Reindexar catálogo (admin)
curl -X POST "http://localhost:8000/admin/reindex"

# 4.1) Ver estado de reindex
curl "http://localhost:8000/admin/reindex/status"

# 5) Chat
curl -X POST "http://localhost:8000/chat" \
  -H "Content-Type: application/json" \
  -d '{"session_id":"u1","message":"¿Qué champú anticaída tenéis y a qué precio?"}'
