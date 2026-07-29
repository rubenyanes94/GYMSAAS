from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="GYMSAAS Core Engine API",
    description="Backend SaaS multi-tenant independiente para gimnasios y centros de CrossFit.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En producción cambiaremos esto por la URL de mi frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "ok", 
        "message": "GYMSAAS Core Systems Operational",
        "service": "API Gateway"
    }