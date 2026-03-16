# SEO Article Writer - Local Automation

Preparación mínima — rellena las claves en `.env` y ejecuta.

```bash
cp .env.example .env
```

Requisitos:
- Python 3.10+

Instalación y prueba rápida:

```bash
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1
# WSL / macOS / Linux
source .venv/bin/activate
pip install -r requirements.txt
```

Editar `.env` y completar las claves necesarias. Archivo `.env` incluye placeholders para:

- `OPENAI_API_KEY` — clave de OpenAI.
- `OPENAI_MODEL` — opcional (p. ej. `gpt-4o-mini`).
- `LOCAL_DB_FILE` — fichero JSON donde se guardan títulos recientes (por defecto `local_db.json`).
- `RECENT_WEEKS` — semanas a evitar duplicar (por defecto 4).

Cómo ejecutar (modo mock si no configuras keys):

```bash
python run.py
```

Qué hace el proyecto ahora:
- Lee productos reales desde PostgreSQL.
- Selección aleatoria de producto ignorando títulos recientes (según `RECENT_WEEKS`).
- Genera un artículo HTML en una sola llamada LLM si `OPENAI_API_KEY` + `langchain` están disponibles; si no, usa un mock local.
- Guarda el artículo y registra el título en `LOCAL_DB_FILE` con timestamp.

La configuración mínima actual es rellenar `.env` y ejecutar como arriba.
