from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends
from app.core.database import get_db
import uuid
from app.models.schema import User, UserRole
from app.core.security import get_password_hash  # Tu función existente para hashear contraseñas
# Importa también tu esquema Pydantic de entrada
from app.api.v1 import auth
from app.api.v1 import gym_profile
from app.api.v1.finances import router as finances_router
from app.api.v1 import amenities
from app.api.v1 import studios

app = FastAPI(
    title="GYMSAAS Core Engine API",
    description="Backend SaaS independiente para gimnasios y centros de CrossFit.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En producción cambiaremos esto por la URL de mi frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar rutas
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Autenticación"])
app.include_router(gym_profile.router, prefix="/api/v1")
app.include_router(finances_router, prefix="/api/v1")
app.include_router(amenities.router, prefix="/api/v1")
app.include_router(studios.router, prefix="/api/v1")

@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "ok", 
        "message": "GYMSAAS Core Systems Operational",
        "service": "API Gateway"
    }