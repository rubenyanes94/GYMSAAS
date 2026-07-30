from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from app.models.schema import UserRole
from app.models.schema import PlanCategory

# ==========================================
# --- TOKENS ---
# ==========================================
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    sub: Optional[str] = None

# ==========================================
# --- TENANTS (BOXES / GYMS) ---
# ==========================================
class TenantRegisterRequest(BaseModel):
    gym_name: str
    gym_slug: str
    admin_first_name: str
    admin_last_name: str
    admin_email: EmailStr
    admin_password: str

class TenantPublicInfo(BaseModel):
    id: UUID
    name: str
    slug: str

    class Config:
        from_attributes = True

# ==========================================
# --- USUARIOS ---
# ==========================================
class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str

class UserCreate(UserBase):
    password: str
    tenant_box_id: UUID

class UserResponse(UserBase):
    id: UUID
    tenant_box_id: UUID
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
    tenant_box_id: UUID

    class Config:
        from_attributes = True

# --- Esquemas de Suscripciones ---
class UserSubscriptionCreate(BaseModel):
    user_id: UUID
    plan_id: UUID
    renews_at: datetime

class UserSubscriptionResponse(BaseModel):
    id: UUID
    user_id: UUID
    plan_id: UUID
    current_weekly_credits: int
    status: str
    renews_at: datetime

    class Config:
        from_attributes = True

    class Config:
        from_attributes = True # Permite a Pydantic leer modelos de SQLAlchemy