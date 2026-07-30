from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.models.schema import TenantBox, User, UserRole
from app.core.security import get_password_hash
# Importamos desde nuestra capa centralizada
from app.schemas.payloads import TenantRegisterRequest, TenantPublicInfo

router = APIRouter(prefix="/tenants", tags=["Tenants & Onboarding"])

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

@router.post("/register-box", status_code=status.HTTP_201_CREATED)
async def register_new_gym_box(
    data: TenantRegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Registra un nuevo gimnasio (TenantBox) y crea su usuario administrador inicial.
    """
    existing_box = await db.execute(select(TenantBox).where(TenantBox.slug == data.gym_slug))
    if existing_box.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El identificador (slug) del gimnasio ya está en uso."
        )

    existing_user = await db.execute(select(User).where(User.email == data.admin_email))
    if existing_user.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electrónico del administrador ya se encuentra registrado."
        )

    try:
        new_box = TenantBox(
            name=data.gym_name,
            slug=data.gym_slug,
            is_active=True
        )
        db.add(new_box)
        await db.flush() # Importante: flush genera el ID del new_box sin hacer commit aún

        hashed_pwd = get_password_hash(data.admin_password)
        new_admin = User(
            tenant_box_id=new_box.id,
            first_name=data.admin_first_name,
            last_name=data.admin_last_name,
            email=data.admin_email,
            password_hash=hashed_pwd,
            roles=[UserRole.BOX_OWNER, UserRole.SUPERADMIN]
        )
        db.add(new_admin)

        await db.commit()
        await db.refresh(new_box)
        await db.refresh(new_admin)

        return {
            "message": "Gimnasio y usuario administrador creados exitosamente",
            "tenant_box": {
                "id": str(new_box.id),
                "name": new_box.name,
                "slug": new_box.slug
            },
            "admin_user": {
                "id": str(new_admin.id),
                "email": new_admin.email
            }
        }

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error crítico durante el registro del tenant: {str(e)}"
        )