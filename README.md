# Starsano — Código fuente

Repositorio con la aplicación Starsano: frontend React (Vite + Tailwind), backend Node/Express, servicio ChatBot (FastAPI + LLM) y un generador de artículos SEO (FastAPI).

Este README resume cómo ejecutar, inspeccionar y mantener el proyecto en desarrollo y en contenedor.

---

## Arquitectura (resumen)

- Frontend: React + Vite (+ proxy de desarrollo en `frontend/vite.config.ts`).
- Backend: Node.js + Express (API REST bajo `/api/*`).
- ChatBot: FastAPI — memoria conversacional en SQLite (`data/chatbot.db`), búsqueda semántica con FAISS (`data/faiss_index.bin`) y OpenAI embeddings.
- SEO Writer: FastAPI — generador de artículos que accede directamente a PostgreSQL.
- PostgreSQL: fuente de la verdad para productos, usuarios, pedidos y artículos.
- Archivos estáticos: subidos a `uploads/` y servidos por el backend (`/uploads/*`).

---

## 🚀 Ejecutar (Guía Rápida)

**⚠️ IMPORTANTE:** Antes de ejecutar, sigue la [guía de configuración inicial](SETUP.md) para:
1. Generar variables de entorno seguras (JWT_SECRET, ADMIN_PASSWORD, etc.)
2. Crear archivo `.env` con valores reales
3. Validar configuración

### Quick Start (después de seguir SETUP.md):

```bash
docker compose up --build
```

Servicios principales:
- `frontend`: http://localhost:8080
- `backend`: http://localhost:3000
- `chatbot`: http://localhost:8000
- `seo-writer`: http://localhost:8001
- `postgres`: puerto 5432

Acceder a la aplicación en http://localhost:8080 con:
- Email: `admin@starsano.com.mx`
- Password: (la que configuraste en `.env`)

---

## Variables de entorno importantes

- `POSTGRES_*` — conexión a la base de datos principal.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` — correo saliente.
- `OPENAI_API_KEY` — clave para llamadas LLM/embeddings.
- `API_SECRET_KEY` — utilizado por `/api/products/batch` para importaciones.

Cada servicio tiene su propio `.env.example` con variables recomendadas.

---

## Inspección rápida y utilidades

- Inspeccionar base de datos principal (Postgres): usar `psql` o PgAdmin conectando a `POSTGRES_HOST:5432`.
- Inspeccionar memoria del chatbot (SQLite):

```bash
sqlite3 data/chatbot.db ".tables"
sqlite3 data/chatbot.db "SELECT * FROM threads LIMIT 5;"
sqlite3 data/chatbot.db "SELECT * FROM messages WHERE thread_id='thread:... ' ORDER BY created_at DESC LIMIT 20;"
```

- Hacer backup consistente de la DB SQLite:

```bash
sqlite3 data/chatbot.db ".backup data/chatbot-backup.db"
```

---

## Integración LangChain (memoria)

Se utiliza LangChain para llamadas LLM/embeddings y se ha añadido un adaptador (`ChatBot/app/langchain_adapter.py`) que expone la memoria SQLite con la interfaz de memoria de LangChain.

Esto permite usar utilidades de LangChain (chains, memory management) manteniendo la persistencia actual en `data/chatbot.db` — sin necesidad de migrar la arquitectura.

Uso básico (interno en el servicio ChatBot): el adaptador se instancia automáticamente y el flujo de procesamiento de mensajes usa ahora dicho adaptador para cargar/guardar historial, resumen y slots.

---

## Endpoints importantes

- Backend (ejemplos):
   - `GET /api/products` — listar productos
   - `POST /api/auth/login` — autenticar
   - `POST /api/orders` — crear pedido (requiere JWT)
   - `POST /api/admin/upload` — subir imagen (multipart/form-data, admin)
   - `POST /api/admin/articles/generate` — desencadena el SEO Writer

- ChatBot:
   - `POST /chat` — recibe `{ session_id, message, email? }`
   - `POST /admin/reindex` — reindexa FAISS (solo red interna)
   - `GET /admin/reindex/status` — estado de reindex
   - `GET /health` — healthcheck

---

## Reindexar FAISS (ChatBot)

Dentro del contenedor `chatbot`, el índice FAISS se construye desde PostgreSQL. Para forzar reindexación desde la red interna:

```bash
# desde el backend (dentro de la red docker):
curl -X POST http://chatbot:8000/admin/reindex
```

El endpoint está protegido para llamadas desde la red interna/localhost (`require_internal_request`).

