# app/api/v1/gym_profile.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.models.schema import GymProfile
from app.schemas.payloads import GymProfileResponse, GymProfileUpdate

router = APIRouter(prefix="/gym-profile", tags=["Perfil del Gimnasio"])

@router.get("/public", response_model=GymProfileResponse)
async def get_public_gym_profile(db: AsyncSession = Depends(get_db)):
    """
    Obtiene la configuración pública del gimnasio (logo, colores, nombre).
    El frontend (App Móvil) consulta este endpoint al arrancar para aplicar
    la identidad visual de la marca.
    """
    # Buscamos el primer (y único) registro en la tabla
    result = await db.execute(select(GymProfile).limit(1))
    profile = result.scalars().first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El perfil del gimnasio no ha sido inicializado."
        )
        
    return profile

@router.put("/", response_model=GymProfileResponse)
async def update_gym_profile(
    payload: GymProfileUpdate, 
    db: AsyncSession = Depends(get_db)
    # Aquí en el futuro puedes agregar una dependencia para que solo el rol BOX_OWNER acceda
):
    """
    Permite al administrador actualizar la identidad gráfica y datos de contacto de su gimnasio.
    """
    result = await db.execute(select(GymProfile).limit(1))
    profile = result.scalars().first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El perfil del gimnasio no existe. Inyecta el registro semilla en la BD."
        )
        
    # Actualización dinámica de los campos enviados
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)
        
    await db.commit()
    await db.refresh(profile)
    
    return profile