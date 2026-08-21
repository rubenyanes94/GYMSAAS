from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from uuid import UUID
from datetime import datetime, date
from enum import Enum
from app.models.schema import UserRole, PlanCategory

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
    plan_name: Optional[str] = None
    plan_price: Optional[float] = None
    plan_expiration: Optional[datetime] = None

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None

class StaffCreate(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    password: str
    role: UserRole

class PasswordChangePublic(BaseModel):
    email: EmailStr
    temporary_password: str
    new_password: str


# ==========================================
# --- PLANES Y SUSCRIPCIONES ---
# ==========================================
class PlanCreate(BaseModel):
    name: str
    category: PlanCategory = PlanCategory.RECURRING
    price: float = 0.0
    credits_per_week: Optional[int] = None
    validity_days: Optional[int] = None
    is_unlimited: bool = False

class PlanUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[PlanCategory] = None
    price: Optional[float] = None
    credits_per_week: Optional[int] = None
    validity_days: Optional[int] = None
    is_unlimited: Optional[bool] = None

class PlanResponse(PlanCreate):
    id: UUID

    class Config:
        from_attributes = True

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
    payment_method: str  
    notes: Optional[str] = None

    class Config:
        from_attributes = True


# ==========================================
# --- CLASES Y ESTUDIOS (UNIFICADO) ---
# ==========================================
class StudioRoom(str, Enum):
    CROSSFIT = "CROSSFIT"
    WEIGHTLIFTING = "WEIGHTLIFTING"
    GYMNASTICS = "GYMNASTICS"
    ENDURANCE = "ENDURANCE"
    HYROX = "HYROX"
    YOGA_1 = "YOGA_1"
    YOGA_2 = "YOGA_2"
    PILATES = "PILATES"
    SAUNA = "SAUNA"
    PLUNGE = "PLUNGE"



class ClassSessionCreate(BaseModel):
    name: str # Ej: "WOD", "Open", "Vinyasa Flow"
    start_time: datetime
    end_time: datetime
    coach_id: UUID
    capacity: int = 18  # Límite estricto por defecto
    room: Optional[StudioRoom] = None # Valida que la sala exista si es del Piso 3

    class Config:
        from_attributes = True

class ClassSessionResponse(ClassSessionCreate):
    id: UUID
    
    class Config:
        from_attributes = True

class ClassScheduleResponse(BaseModel):
    id: UUID
    name: str
    room: Optional[StudioRoom] = None
    start_time: datetime
    end_time: datetime
    coach_id: UUID
    capacity: int
    available_spots: int
    waitlist_count: int

    class Config:
        from_attributes = True


# ==========================================
# --- RESERVAS ---
# ==========================================
class BookingCreate(BaseModel):
    user_id: UUID
    class_id: UUID

    class Config:
        from_attributes = True

class BookingResponse(BaseModel):
    id: UUID
    user_id: UUID
    class_id: UUID
    status: str 
    created_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# --- PERFIL DEL GIMNASIO Y STAFF ---
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
        from_attributes = True 

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
    first_name: str
    last_name: str
    second_last_name: Optional[str] = None
    email: EmailStr
    birth_date: Optional[date] = None
    gender: Optional[str] = None
    phone_mobile: Optional[str] = None
    phone_landline: Optional[str] = None
    
    country: Optional[str] = "Venezuela"
    city: Optional[str] = None
    address: Optional[str] = None
    postal_code: Optional[str] = None
    notes: Optional[str] = None
    
    emergency_contact_name: Optional[str] = None
    emergency_contact_relation: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_email: Optional[EmailStr] = None

    role: UserRole = UserRole.COACH 
    permissions: Optional[StaffPermissionsSchema] = None

class InstructorResponse(InstructorCreate):
    id: UUID
    is_active: bool
    hired_at: Optional[date] = None

    class Config:
        from_attributes = True


# ==========================================
# --- RECURSOS FÍSICOS (Sauna, Plunge, etc) ---
# ==========================================
class GymAccessLogResponse(BaseModel):
    id: UUID
    user_id: UUID
    entry_time: datetime

    class Config:
        from_attributes = True

class ResourceServicesResponse(BaseModel):
    id: UUID
    name: str
    category: str
    is_active: bool

    class Config:
        from_attributes = True

class ResourceServicesCreate(BaseModel):
    name: str
    category: str  
    is_active: Optional[bool] = True

class ResourceBookingCreate(BaseModel):
    user_id: UUID
    resource_id: UUID
    start_time: datetime
    end_time: datetime

class ResourceBookingResponse(BaseModel):
    id: UUID
    user_id: UUID
    resource_id: UUID
    start_time: datetime
    end_time: datetime
    status: str

    class Config:
        from_attributes = True

class ResourceBookingResponseExtended(BaseModel):
    message: str
    status: str
    booking_id: str
    amount_due: Optional[float] = None
    currency: Optional[str] = "USD"
    payment_reason: Optional[str] = None 

    class Config:
        from_attributes = True

class TransactionCreate(BaseModel):
    user_id: UUID
    plan_id: Optional[UUID] = None
    amount: float
    method: str
    status: str = "COMPLETED"

class WorkoutBase(BaseModel):
    date: date
    title: Optional[str] = None
    category: str
    athlete_id: Optional[UUID] = None
    type: str
    warmup: Optional[str] = None
    strength: Optional[str] = None
    wod: str
    cooldown: Optional[str] = None
    is_published: bool

class WorkoutCreate(WorkoutBase):
    pass

class WorkoutUpdate(BaseModel):
    date: Optional[date] = None
    title: Optional[str] = None
    category: Optional[str] = None
    athlete_id: Optional[UUID] = None
    type: Optional[str] = None
    warmup: Optional[str] = None
    strength: Optional[str] = None
    wod: Optional[str] = None
    cooldown: Optional[str] = None
    is_published: Optional[bool] = None

class WorkoutResponse(WorkoutBase):
    id: UUID

    class Config:
        from_attributes = True