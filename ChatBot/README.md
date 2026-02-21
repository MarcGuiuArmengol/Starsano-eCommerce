# 1) Variables
cp .env.example .env
# Rellena OPENAI_API_KEY, SHOPIFY_STORE_DOMAIN, SHOPIFY_STOREFRONT_TOKEN

# 2) Entorno
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# 3) Arrancar
uvicorn app.main:app --reload

# 4) Crear índice (una vez)
curl -X POST "http://localhost:8000/ingest?limit=120"

# 5) Chat
curl -X POST "http://localhost:8000/chat" \
  -H "Content-Type: application/json" \
  -d '{"session_id":"u1","message":"¿Qué champú anticaída tenéis y a qué precio?"}'
