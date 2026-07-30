from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.models.schema import TenantBox
# Importamos los esquemas desde nuestra capa centralizada de payloads
from app.schemas.payloads import TenantRegisterRequest, TenantPublicInfo

router = APIRouter()

@router.get("/public/{slug}", response_model=TenantPublicInfo)
async def get_tenant_by_slug(slug: str, db: AsyncSession = Depends(get_db)):
    """
    Obtiene la información pública de un TenantBox mediante su slug.
    El frontend usará esto para obtener el tenant_box_id oculto antes de registrar al atleta.
    """
    result = await db.execute(select(TenantBox).filter(TenantBox.slug == slug, TenantBox.is_active == True))
    tenant = result.scalars().first()
    
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gimnasio no encontrado o inactivo"
        )
        
    return tenant

# Aquí puedes colocar tu endpoint de registro para el Head Coach / Dueño del Box
@router.post("/register-box", status_code=status.HTTP_201_CREATED)
async def register_tenant_box(request: TenantRegisterRequest, db: AsyncSession = Depends(get_db)):
    """
    Registra un nuevo gimnasio (TenantBox) y crea su usuario administrador inicial.
    """
    # ... Tu lógica de registro del box y el admin inicial ...
    pass