from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from app.models.schema import UserRole
from app.models.schema import PlanCategory
from typing import Optional
from datetime import date

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
    birth_date: Optional[date] = None

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

    class Config:
        from_attributes = True
        
class ProcessPaymentSubscription(BaseModel):
    user_id: UUID
    plan_id: UUID
    amount_paid: float
    payment_method: str  # Ej: "Zelle", "Pago Movil", "Efectivo", "Stripe"
    notes: Optional[str] = None

    class Config:
            from_attributes = True

# --- Esquemas de Clases ---
class ClassSessionCreate(BaseModel):
    name: str # Ej: "WOD", "Open", "Weightlifting"
    start_time: datetime
    end_time: datetime
    coach_id: UUID
    capacity: int = 18  # Límite estricto por defecto

    class Config:
            from_attributes = True
class ClassSessionResponse(ClassSessionCreate):
    id: UUID
    
    class Config:
        from_attributes = True

# --- Esquemas de Reservas ---
class BookingCreate(BaseModel):
    user_id: UUID
    class_id: UUID

    class Config:
            from_attributes = True

class BookingResponse(BaseModel):
    id: UUID
    user_id: UUID
    class_id: UUID
    status: str # RESERVED, WAITLISTED, CANCELLED, LATE_CANCEL, ATTENDED
    created_at: datetime

    class Config:
            from_attributes = True

# ==========================================
# --- PERFIL DEL GIMNASIO (WHITE-LABEL) ---
# ==========================================
class GymProfileResponse(BaseModel):
    id: UUID
    name: str
    logo_url: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    instagram_url: Optional[str] = None
    whatsapp_number: Optional[str] = None

    class Config:
        from_attributes = True

class GymProfileUpdate(BaseModel):
    name: Optional[str] = None
    logo_url: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    instagram_url: Optional[str] = None
    whatsapp_number: Optional[str] = None

    class Config:
        from_attributes = True # Permite a Pydantic leer modelos de SQLAlchemy

class StaffPermissionsSchema(BaseModel):
    payment_management: Optional[str] = "NONE"
    client_management: Optional[str] = "NONE"
    instructor_management: Optional[str] = "NONE"
    reports_access: Optional[str] = "NONE"
    class_management: Optional[str] = "NONE"
    booking_management: Optional[str] = "INSTRUCTED_ONLY"
    can_publish_wods: bool = False
    can_manage_wod_tv: bool = False
    can_manage_messages: bool = False
    clock_in_mode: Optional[str] = "DISABLED"

class InstructorCreate(BaseModel):
    # Ficha básica
    first_name: str
    last_name: str
    second_last_name: Optional[str] = None
    email: EmailStr
    birth_date: Optional[date] = None
    gender: Optional[str] = None
    phone_mobile: Optional[str] = None
    phone_landline: Optional[str] = None
    
    # Ubicación
    country: Optional[str] = "Venezuela"
    city: Optional[str] = None
    address: Optional[str] = None
    postal_code: Optional[str] = None
    notes: Optional[str] = None
    
    # Emergencia
    emergency_contact_name: Optional[str] = None
    emergency_contact_relation: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_email: Optional[EmailStr] = None

    # Rol y Permisos
    role: UserRole = UserRole.COACH # COACH o STAFF
    permissions: Optional[StaffPermissionsSchema] = None

class InstructorResponse(InstructorCreate):
    id: UUID
    is_active: bool
    hired_at: Optional[date] = None

    class Config:
        from_attributes = True
