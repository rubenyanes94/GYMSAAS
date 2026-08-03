from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from app.models.schema import UserRole
from app.models.schema import PlanCategory
from typing import Optional

# ==========================================
# --- TOKENS ---
# ==========================================
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    sub: Optional[str] = None


# ==========================================
# --- USUARIOS ---
# ==========================================
class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: UUID
    roles: list[str]
    is_active: bool = True
    created_at: Optional[datetime] = None

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None
    # No exponemos la contraseña aquí por seguridad.

class StaffCreate(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    password: str
    role: UserRole # Aquí el frontend envía "COACH" o "STAFF"

class PasswordChangePublic(BaseModel):
    email: EmailStr
    temporary_password: str
    new_password: str

# --- Esquemas de Planes ---
class PlanCreate(BaseModel):
    name: str
    category: PlanCategory = PlanCategory.RECURRING
    credits_per_week: Optional[int] = None
    validity_days: Optional[int] = None
    is_unlimited: bool = False

class PlanUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[PlanCategory] = None
    credits_per_week: Optional[int] = None
    validity_days: Optional[int] = None
    is_unlimited: Optional[bool] = None

class PlanResponse(PlanCreate):
    id: UUID

    class Config:
        from_attributes = True

# --- Esquemas de Suscripciones ---
class UserSubscriptionCreate(BaseModel):
    user_id: UUID
    plan_id: UUID

class UserSubscriptionResponse(BaseModel):
    id: UUID
    user_id: UUID
    plan_id: UUID
    current_weekly_credits: int
    status: str
    renews_at: datetime

class ProcessPaymentSubscription(BaseModel):
    user_id: UUID
    plan_id: UUID
    amount_paid: float
    payment_method: str  # Ej: "Zelle", "Pago Movil", "Efectivo", "Stripe"
    notes: Optional[str] = None

# --- Esquemas de Clases ---
class ClassSessionCreate(BaseModel):
    name: str # Ej: "WOD", "Open", "Weightlifting"
    start_time: datetime
    end_time: datetime
    coach_id: UUID
    capacity: int = 18  # Límite estricto por defecto

class ClassSessionResponse(ClassSessionCreate):
    id: UUID
    
    class Config:
        from_attributes = True

# --- Esquemas de Reservas ---
class BookingCreate(BaseModel):
    user_id: UUID
    class_id: UUID

class BookingResponse(BaseModel):
    id: UUID
    user_id: UUID
    class_id: UUID
    status: str # RESERVED, WAITLISTED, CANCELLED, LATE_CANCEL, ATTENDED
    created_at: datetime

    class Config:
        from_attributes = True # Permite a Pydantic leer modelos de SQLAlchemy