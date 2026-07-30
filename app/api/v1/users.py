import secrets
import string
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.core import security
from app.models.schema import User, UserRole
from app.schemas.payloads import StaffCreate, UserResponse
# Asumo tu dependencia de autenticación
# from app.api.dependencies import get_current_active_user 

router = APIRouter(tags=["Gestión de Usuarios"])

def generate_temporary_password(length: int = 12) -> str:
    """Genera una contraseña temporal segura de 12 caracteres."""
    alphabet = string.ascii_letters + string.digits + "@$!%*#?&"
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def send_welcome_email(email: str, raw_password: str):
    """
    Simulación del envío de correo. 
    Aquí integraremos SendGrid, AWS SES, Resend o similar.
    """
    print(f"ENVIANDO EMAIL A {email}...")
    print(f"Tu contraseña temporal es: {raw_password}")
    # Lógica real de envío de email iría aquí.

@router.post("/staff", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_staff_member(
    staff_in: StaffCreate, 
    background_tasks: BackgroundTasks, # <--- Inyectamos BackgroundTasks
    db: AsyncSession = Depends(get_db),
    # current_user: User = Depends(get_current_active_user) 
):
    """
    Crea un nuevo miembro del equipo y envía credenciales por correo.
    """
    # 1. (Opcional por ahora) Validar que current_user sea BOX_OWNER
    
    # 2. Verificar si el correo ya existe
    result = await db.execute(select(User).filter(User.email == staff_in.email))
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este correo ya está registrado en el sistema."
        )

    # 3. Generar credenciales temporales
    temp_password = generate_temporary_password()
    hashed_password = security.get_password_hash(temp_password)

    # 4. Crear el usuario
    new_staff = User(
        email=staff_in.email,
        password_hash=hashed_password,
        first_name=staff_in.first_name,
        last_name=staff_in.last_name,
        # tenant_box_id=current_user.tenant_box_id, # Hereda el tenant de quien lo crea
        roles=[staff_in.role],
        requires_password_change=True # <--- Bloquea su cuenta hasta que la cambie
    )
    
    db.add(new_staff)
    await db.commit()
    await db.refresh(new_staff)
    
    # 5. Enviar el correo electrónico de forma asíncrona
    # La API responde inmediatamente al frontend, el correo se envía en segundo plano
    background_tasks.add_task(send_welcome_email, new_staff.email, temp_password)
    
    return new_staff