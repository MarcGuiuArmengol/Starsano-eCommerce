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

## Ejecutar (modo recomendado: Docker Compose)

1. Copia el archivo de entorno y ajusta variables si hace falta:

```bash
cp .env.example .env
# (editar .env con credenciales: POSTGRES_*, SMTP_*, OPENAI_API_KEY, etc.)
```

2. Levanta todos los servicios con Docker Compose:

```bash
docker compose up --build
```

Servicios principales:
- `frontend`: puerto 8080
- `backend` (Node): puerto 3000 (dentro de la red Docker)
- `chatbot`: puerto 8000 (dentro de la red Docker)
- `seo-writer`: puerto 8001 (dentro de la red Docker)
- `postgres` : puerto 5432

Nota: `frontend` en desarrollo usa un proxy (Vite) que reescribe `/api` → `backend:3000` y `/chat_api` → `chatbot:8000`.

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

---

## Preparación para entrega / checklist

- [x] Código revisado y UI básica funcional.
- [x] Adaptador LangChain para memoria agregado (`ChatBot/app/langchain_adapter.py`).
- [x] Correcciones menores en frontend para consistencia (p.ej. `Checkout.tsx`).
- [x] Instrucciones de ejecución y debugging incluidas aquí.

---

## Contacto y soporte

Si necesitas ayuda con el despliegue en un entorno concreto (CI/CD, hosting, etc.), detalla el entorno objetivo y proporciono pasos concretos.

