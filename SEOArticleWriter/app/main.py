from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .runner import run_once
import os
import logging

# ============================================
# ENVIRONMENT VALIDATION
# ============================================
required_env_vars = ['OPENAI_API_KEY', 'POSTGRES_PASSWORD', 'POSTGRES_USER']
missing_vars = [v for v in required_env_vars if not os.environ.get(v)]

if missing_vars:
    logging.error(f"❌ FATAL: Missing required environment variables: {', '.join(missing_vars)}")
    logging.error("Please check your .env file with all required variables.")
    exit(1)

app = FastAPI(title="SEO Article Writer API")

# Enable CORS - Restrict to allowed origins
allowed_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:8080").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in allowed_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/generate")
async def generate():
    """Trigger the SEO article generation process."""
    try:
        run_once()
        return {"status": "success", "message": "Article generated successfully"}
    except Exception as e:
        print(f"Error in generation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health():
    return {"status": "ok"}
