from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .runner import run_once
import os

app = FastAPI(title="SEO Article Writer API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
