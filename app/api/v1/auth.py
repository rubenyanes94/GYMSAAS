from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.core import security
from app.models.schema import User, UserRole  
from app.schemas.payloads import UserCreate, UserResponse, UserUpdate, Token
from app.schemas.payloads import PasswordChangePublic

# Instanciamos el router. Esta es la línea que main.py busca.
router = APIRouter(tags=["Autenticación"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_in: UserCreate, 
    db: AsyncSession = Depends(get_db)
):
    """
    Registra un nuevo usuario en la base de datos (Atleta/Cliente).
    """
    result = await db.execute(select(User).filter(User.email == user_in.email))
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El usuario con este correo electrónico ya existe en el sistema."
        )
    
    new_user = User(
        email=user_in.email,
        password_hash=security.get_password_hash(user_in.password),
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        roles=[UserRole.ATHLETE] 
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return new_user

@router.post("/login", response_model=Token)
async def login_access_token(
    db: AsyncSession = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    OAuth2 compatible token login. 
    Retorna un JWT para validación de sesiones o un 403 si requiere cambio de clave.
    """
    result = await db.execute(select(User).filter(User.email == form_data.username))
    user = result.scalars().first()
    
    if not user or not security.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo electrónico o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # ==========================================
    # NUEVA LÓGICA: Bloqueo de contraseña temporal
    # ==========================================
    if user.requires_password_change:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            # Enviamos un código específico para que React lo lea fácilmente 
            # en el bloque catch (e.response.data.detail)
            detail="REQUIRES_PASSWORD_CHANGE" 
        )
        
    access_token = security.create_access_token(subject=user.id)
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

# CORREGIDO: Usamos list (minúscula) nativo de Python 3.9+
@router.get("/users", response_model=list[UserResponse])
async def get_users(
    skip: int = 0, 
    limit: int = 100, 
    db: AsyncSession = Depends(get_db)
):
    """
    Obtiene la lista de usuarios registrados.
    """
    query = select(User)
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    users = result.scalars().all()
    
    return users


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Actualiza la información de un cliente específico.
    """
    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
        
    if user_in.email and user_in.email != user.email:
        email_check = await db.execute(select(User).filter(User.email == user_in.email))
        if email_check.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El correo electrónico ya está registrado por otro usuario"
            )

    update_data = user_in.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(user, field, value)
        
    await db.commit()
    await db.refresh(user)
    
    return user

@router.post("/change-temporary-password", status_code=status.HTTP_200_OK)
async def change_temporary_password(
    payload: PasswordChangePublic,
    db: AsyncSession = Depends(get_db)
):
    """
    Permite a un usuario con credenciales temporales establecer su contraseña definitiva.
    """
    # 1. Buscamos al usuario
    result = await db.execute(select(User).filter(User.email == payload.email))
    user = result.scalars().first()

    # 2. Validamos que exista y que la contraseña temporal sea correcta
    if not user or not security.verify_password(payload.temporary_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas."
        )

    # 3. Validamos que realmente necesite un cambio (evita que se use para saltar la seguridad normal)
    if not user.requires_password_change:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este usuario no requiere un cambio de contraseña."
        )

    # 4. Actualizamos la contraseña y liberamos la cuenta
    user.password_hash = security.get_password_hash(payload.new_password)
    user.requires_password_change = False
    
    await db.commit()
    
    return {"message": "Contraseña actualizada exitosamente. Ya puedes iniciar sesión."}