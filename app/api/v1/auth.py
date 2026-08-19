# app/api/v1/auth.py
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import date
from sqlalchemy import select, and_
from app.models.schema import User, UserSubscription, Plan

from app.core.database import get_db
from app.core import security
from app.models.schema import User, UserRole  
# IMPORTANTE: Agregamos StaffCreate a las importaciones
from app.schemas.payloads import (
    UserCreate, 
    UserResponse, 
    UserUpdate, 
    Token, 
    StaffCreate,
    PasswordChangePublic,
    InstructorCreate,      
    InstructorResponse, 
    StaffPermissionsSchema   
)


# Instanciamos el router. Esta es la línea que main.py busca.
router = APIRouter(tags=["Autenticación"])

# ==========================================
# 1. REGISTRO PÚBLICO (ATLETAS)
# ==========================================
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_in: UserCreate, 
    db: AsyncSession = Depends(get_db)
):
    """
    Registra un nuevo usuario en la base de datos (Atleta/Cliente).
    Forza automáticamente el rol de ATHLETE por seguridad.
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

# Asegúrate de tener estas importaciones arriba
from sqlalchemy import delete
from app.models.schema import User, Booking, UserSubscription

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Elimina permanentemente a un usuario y todo su historial de la base de datos.
    """
    # 1. Verificar que el usuario existe
    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
        
    # 2. Eliminar el historial en cascada manualmente
    # Borrar reservas
    await db.execute(delete(Booking).filter(Booking.user_id == user_id))
    # Borrar suscripciones
    await db.execute(delete(UserSubscription).filter(UserSubscription.user_id == user_id))
    
    # 3. Eliminar al usuario
    await db.delete(user)
    await db.commit()
    
    return None
# ==========================================
# 2. REGISTRO INTERNO (COACH & STAFF)
# ==========================================
@router.post("/register-staff", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_staff(
    user_in: StaffCreate, 
    db: AsyncSession = Depends(get_db)
    # NOTA FUTURA: Aquí deberás inyectar tu dependencia de autenticación para 
    # asegurar que solo el dueño del gimnasio (BOX_OWNER) pueda disparar este endpoint.
):
    """
    Registra un nuevo miembro del staff (Coach o Empleado Administrativo).
    """
    # Validamos que el rol enviado sea válido para este endpoint
    if user_in.role not in [UserRole.COACH, UserRole.STAFF]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rol inválido. Solo se permite COACH o STAFF."
        )

    result = await db.execute(select(User).filter(User.email == user_in.email))
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El usuario con este correo electrónico ya existe en el sistema."
        )
    
    new_staff = User(
        email=user_in.email,
        password_hash=security.get_password_hash(user_in.password),
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        roles=[user_in.role] # Asignamos el rol enviado desde el frontend
    )
    
    db.add(new_staff)
    await db.commit()
    await db.refresh(new_staff)
    
    return new_staff

# ==========================================
# 3. LOGIN & GESTIÓN DE SESIÓN
# ==========================================
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
        
    if user.requires_password_change:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="REQUIRES_PASSWORD_CHANGE" 
        )
        
    access_token = security.create_access_token(subject=str(user.id))
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/change-temporary-password", status_code=status.HTTP_200_OK)
async def change_temporary_password(
    payload: PasswordChangePublic,
    db: AsyncSession = Depends(get_db)
):
    """
    Permite a un usuario con credenciales temporales establecer su contraseña definitiva.
    """
    result = await db.execute(select(User).filter(User.email == payload.email))
    user = result.scalars().first()

    if not user or not security.verify_password(payload.temporary_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas."
        )

    if not user.requires_password_change:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este usuario no requiere un cambio de contraseña."
        )

    user.password_hash = security.get_password_hash(payload.new_password)
    user.requires_password_change = False
    
    await db.commit()
    
    return {"message": "Contraseña actualizada exitosamente. Ya puedes iniciar sesión."}

# ==========================================
# 4. CRUD BÁSICO DE USUARIOS
# ==========================================
@router.get("/users", response_model=list[UserResponse])
async def get_users(
    skip: int = 0, 
    limit: int = 100, 
    db: AsyncSession = Depends(get_db)
):
    """
    Obtiene la lista de usuarios registrados e incluye su membresía activa.
    """
    # Hacemos un JOIN con la suscripción (solo las activas) y luego con el plan
    query = (
        select(
            User, 
            Plan.name.label("plan_name"), 
            Plan.price.label("plan_price"),
            UserSubscription.renews_at.label("plan_expiration"),
        )
        .outerjoin(
            UserSubscription, 
            and_(UserSubscription.user_id == User.id, UserSubscription.status == "ACTIVE")
        )
        .outerjoin(
            Plan, 
            Plan.id == UserSubscription.plan_id
        )
        .offset(skip)
        .limit(limit)
    )
    
    result = await db.execute(query)
    rows = result.all()
    
    users_data = []
    for user_obj, plan_name, plan_price, plan_expiration in rows:
        user_dict = {
            "id": user_obj.id,
            "first_name": user_obj.first_name,
            "last_name": user_obj.last_name,
            "email": user_obj.email,
            "roles": user_obj.roles,
            "plan_name": plan_name,
            "plan_price": plan_price,
            "plan_expiration": plan_expiration,
        }
        users_data.append(user_dict)
    
    return users_data

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

@router.post("/instructors", response_model=InstructorResponse, status_code=status.HTTP_201_CREATED)
async def create_instructor_profile(
    payload: InstructorCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Crea la ficha del instructor/staff con su matriz de permisos
    y marca la cuenta para requerir cambio de contraseña mediante correo.
    """
    # 1. Validar correo duplicado
    existing = await db.execute(select(User).filter(User.email == payload.email))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="El correo ya se encuentra registrado.")

    # 2. Generar contraseña temporal segura
    temp_password = security.generate_random_password()
    
    # 3. Instanciar Usuario con ficha extendida
    new_instructor = User(
        first_name=payload.first_name,
        last_name=payload.last_name,
        second_last_name=payload.second_last_name,
        email=payload.email,
        password_hash=security.get_password_hash(temp_password),
        requires_password_change=True, # Forzará al coach a colocar su clave al entrar
        roles=[payload.role],
        birth_date=payload.birth_date,
        gender=payload.gender,
        phone_mobile=payload.phone_mobile,
        phone_landline=payload.phone_landline,
        country=payload.country,
        city=payload.city,
        address=payload.address,
        postal_code=payload.postal_code,
        notes=payload.notes,
        emergency_contact_name=payload.emergency_contact_name,
        emergency_contact_relation=payload.emergency_contact_relation,
        emergency_contact_phone=payload.emergency_contact_phone,
        emergency_contact_email=payload.emergency_contact_email,
        hired_at=date.today()
    )
    
    db.add(new_instructor)
    await db.flush()

    # 4. Asignar matriz de permisos
    perm_data = payload.permissions.model_dump() if payload.permissions else {}
    instructor_perms = StaffPermissionsSchema(
        user_id=new_instructor.id,
        **perm_data
    )
    db.add(instructor_perms)

    await db.commit()
    await db.refresh(new_instructor)

    # 5. TODO: Disparar servicio de Email con la invitación y temp_password
    # send_instructor_invitation_email(email=new_instructor.email, temp_pwd=temp_password)

    return new_instructor