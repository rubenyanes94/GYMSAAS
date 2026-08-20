from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, DateTime, Date, Time, Enum, Float, Text
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func
import enum
import uuid

Base = declarative_base()

# ================= 1. ENUMS GLOBALES =================
class UserRole(enum.Enum):
    SUPERADMIN = "SUPERADMIN"
    BOX_OWNER = "BOX_OWNER"
    STAFF = "STAFF"
    COACH = "COACH"
    ATHLETE = "ATHLETE"
    GUEST = "GUEST"

class AthleteTier(enum.Enum):
    REGULAR = "REGULAR"
    OPEN_BOX = "OPEN_BOX"

class PlanCategory(enum.Enum):
    RECURRING = "RECURRING"
    DROP_IN = "DROP_IN"

class PaymentProvider(enum.Enum):
    STRIPE = "STRIPE"
    MERCADOPAGO = "MERCADOPAGO"
    ZELLE = "ZELLE"
    PAGO_MOVIL = "PAGO_MOVIL"
    CASH = "CASH"

class ResourceType(enum.Enum):
    COLD_PLUNGE = "COLD_PLUNGE"
    SAUNA = "SAUNA"
    WORKSPACE = "WORKSPACE"

class TrackCategory(enum.Enum):
    CROSSFIT = "CROSSFIT"
    WEIGHTLIFTING = "WEIGHTLIFTING"
    GYMNASTICS = "GYMNASTICS"
    ENDURANCE = "ENDURANCE"
    HYROX = "HYROX"

class WodType(enum.Enum):
    FOR_TIME = "FOR_TIME"
    AMRAP = "AMRAP"
    EMOM = "EMOM"
    TABATA = "TABATA"
    WEIGHTLIFTING = "WEIGHTLIFTING" 
    OTHER = "OTHER"

class UnitOfMeasure(enum.Enum):
    KG = "KG"
    LB = "LB"

class Modality(enum.Enum):
    RX = "RX"
    SCALED = "SCALED"


# ================= 2. DOMINIO CORE & USUARIOS =================
class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    birth_date = Column(Date, nullable=True)
    password_hash = Column(String(255), nullable=False)
    profile_picture_url = Column(String, nullable=True) 
    roles = Column(ARRAY(Enum(UserRole)), default=[UserRole.ATHLETE])
    requires_password_change = Column(Boolean, default=False)
    athlete_type = Column(Enum(AthleteTier), default=AthleteTier.REGULAR)
    biometric_reference_id = Column(String(255), unique=True, nullable=True)
    booking_suspended_until = Column(DateTime(timezone=True), nullable=True)

    instructor_profile = relationship("InstructorProfile", back_populates="user", uselist=False)
    staff_permissions = relationship("StaffPermission", back_populates="user", uselist=False)

# ================= X. DOMINIO STAFF & INSTRUCTORES =================
class InstructorProfile(Base):
    """
    Ficha detallada del instructor/staff. 
    Solo existirá un registro aquí si el usuario tiene el rol COACH o STAFF.
    """
    __tablename__ = "instructor_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)

    # --- Datos de Ficha Personal (AimHarder) ---
    second_last_name = Column(String(100), nullable=True)
    birth_date = Column(Date, nullable=True)
    gender = Column(String(20), nullable=True)            # Ej: MALE, FEMALE, OTHER
    phone_mobile = Column(String(50), nullable=True)
    phone_landline = Column(String(50), nullable=True)
    
    # Dirección
    country = Column(String(100), default="Venezuela")
    city = Column(String(100), nullable=True)
    address = Column(String(255), nullable=True)
    postal_code = Column(String(20), nullable=True)
    notes = Column(Text, nullable=True)
    
    # Contacto de Emergencia
    emergency_contact_name = Column(String(100), nullable=True)
    emergency_contact_relation = Column(String(50), nullable=True)
    emergency_contact_phone = Column(String(50), nullable=True)
    emergency_contact_email = Column(String(255), nullable=True)

    # Datos Operativos
    hired_at = Column(Date, nullable=True)    # Fecha de alta en el box
    
    # Relación inversa
    user = relationship("User", back_populates="instructor_profile")


class StaffPermission(Base):
    """
    Representa la matriz de permisos granulares para la gestión del box.
    """
    __tablename__ = "staff_permissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)

    # Permisos Operativos y de Gestión
    payment_management = Column(String(50), default="NONE")      # NONE, PENDING_ONLY, FULL
    client_management = Column(String(50), default="NONE")       # NONE, CREATION_ONLY, VIEW_APP, FULL
    instructor_management = Column(String(50), default="NONE")   # NONE, FULL
    reports_access = Column(String(50), default="NONE")          # NONE, PARALLEL, FULL
    class_management = Column(String(50), default="NONE")        # NONE, FULL
    booking_management = Column(String(50), default="INSTRUCTED_ONLY") # INSTRUCTED_ONLY, ASSIGNED_SCHEDULES, ALL_CLASSES
    
    # Switches boleanos de funcionalidades
    can_publish_wods = Column(Boolean, default=False)
    can_manage_wod_tv = Column(Boolean, default=False)
    can_manage_messages = Column(Boolean, default=False)
    clock_in_mode = Column(String(50), default="DISABLED")       # DISABLED, WEB_APP, GEOLOCATION

    # Relación inversa
    user = relationship("User", back_populates="staff_permissions")
    
# ================= 3. DOMINIO FINANCIERO & MEMBRESÍAS =================
class TenantPaymentSettings(Base):
    __tablename__ = "tenant_payment_settings"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider = Column(Enum(PaymentProvider), nullable=False)
    public_key = Column(String(255))
    secret_key = Column(String(255)) 
    is_active = Column(Boolean, default=True)

class Plan(Base):
    __tablename__ = "plans"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    category = Column(Enum(PlanCategory), default=PlanCategory.RECURRING)
    price = Column(Float, nullable=False, default=0.0)
    credits_per_week = Column(Integer, nullable=True)
    validity_days = Column(Integer, nullable=True) 
    is_unlimited = Column(Boolean, default=False)

class UserSubscription(Base):
    __tablename__ = "user_subscriptions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    plan_id = Column(UUID(as_uuid=True), ForeignKey("plans.id"))
    current_weekly_credits = Column(Integer, default=0)
    status = Column(String, default="ACTIVE")
    renews_at = Column(DateTime(timezone=True), nullable=False)

class DropInPass(Base):
    __tablename__ = "drop_in_passes"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_used = Column(Boolean, default=False)
    used_on_booking_id = Column(UUID(as_uuid=True), nullable=True)


# ================= 4. DOMINIO HARDWARE & AMENITIES =================
class AccessDevice(Base):
    __tablename__ = "access_devices"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    device_token = Column(String(255), unique=True, nullable=False)

class Resource(Base):
    __tablename__ = "resources"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    resource_type = Column(Enum(ResourceType), nullable=False)

class ResourceBooking(Base):
    __tablename__ = "resource_bookings"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    resource_id = Column(UUID(as_uuid=True), ForeignKey("resources.id"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    booking_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)


# ================= 5. DOMINIO RESERVAS DE CLASES =================
class ClassSession(Base):
    __tablename__ = "class_sessions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    track_category = Column(Enum(TrackCategory), default=TrackCategory.CROSSFIT)
    coach_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    session_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    max_capacity = Column(Integer, default=12)
    room = Column(String, nullable=True)

class Booking(Base):
    __tablename__ = "bookings"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("class_sessions.id"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    status = Column(String, default="ACTIVE") 


# ================= 6. DOMINIO DE PROGRAMACIÓN (ALTA RESOLUCIÓN) =================
class Exercise(Base):
    __tablename__ = "exercises"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False, unique=True)
    is_benchmark = Column(Boolean, default=False)

class DailyProgram(Base):
    __tablename__ = "daily_programs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    track = Column(Enum(TrackCategory), nullable=False)
    program_date = Column(Date, nullable=False, index=True)
    title = Column(String(100), nullable=True)
    
    blocks = relationship("ProgramBlock", back_populates="program")

class ProgramBlock(Base):
    __tablename__ = "program_blocks"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    daily_program_id = Column(UUID(as_uuid=True), ForeignKey("daily_programs.id"))
    wod_type = Column(Enum(WodType), nullable=False)
    order_index = Column(Integer, default=1)
    name = Column(String(100), nullable=True)
    time_cap_seconds = Column(Integer, nullable=True)
    total_rounds = Column(Integer, nullable=True)
    
    program = relationship("DailyProgram", back_populates="blocks")
    items = relationship("ProgramBlockItem", back_populates="block")

class ProgramBlockItem(Base):
    __tablename__ = "program_block_items"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    block_id = Column(UUID(as_uuid=True), ForeignKey("program_blocks.id"))
    exercise_id = Column(UUID(as_uuid=True), ForeignKey("exercises.id"))
    prescribed_reps = Column(Integer, nullable=True)
    prescribed_weight_male = Column(Float, nullable=True)
    prescribed_weight_female = Column(Float, nullable=True)
    prescribed_percentage = Column(Integer, nullable=True)
    
    block = relationship("ProgramBlock", back_populates="items")


# ================= 7. DOMINIO RESULTADOS & FEED SOCIAL =================
class AthleteBlockResult(Base):
    __tablename__ = "athlete_block_results"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    block_id = Column(UUID(as_uuid=True), ForeignKey("program_blocks.id"))
    modality = Column(Enum(Modality), default=Modality.RX)
    unit_preference = Column(Enum(UnitOfMeasure), default=UnitOfMeasure.LB)
    logged_at = Column(DateTime(timezone=True), default=func.now())
    
    is_completed = Column(Boolean, default=True)
    score_time_seconds = Column(Integer, nullable=True)
    score_reps = Column(Integer, nullable=True)
    score_rounds = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    
    item_results = relationship("AthleteItemResult", back_populates="block_result")
    likes = relationship("FeedLike", back_populates="result")
    comments = relationship("FeedComment", back_populates="result")

class AthleteItemResult(Base):
    __tablename__ = "athlete_item_results"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    athlete_block_result_id = Column(UUID(as_uuid=True), ForeignKey("athlete_block_results.id"))
    exercise_id = Column(UUID(as_uuid=True), ForeignKey("exercises.id"))
    
    weight_lifted = Column(Float, nullable=True)
    reps_completed = Column(Integer, nullable=True)
    is_new_pr = Column(Boolean, default=False)
    
    block_result = relationship("AthleteBlockResult", back_populates="item_results")

class FeedLike(Base):
    __tablename__ = "feed_likes"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    result_id = Column(UUID(as_uuid=True), ForeignKey("athlete_block_results.id"))
    result = relationship("AthleteBlockResult", back_populates="likes")

class FeedComment(Base):
    __tablename__ = "feed_comments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    result_id = Column(UUID(as_uuid=True), ForeignKey("athlete_block_results.id"))
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=func.now())
    
    result = relationship("AthleteBlockResult", back_populates="comments")


class GymProfile(Base):
    __tablename__ = "gym_profile"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(150), nullable=False)
    logo_url = Column(String, nullable=True)
    primary_color = Column(String(50), nullable=True)     # Ej: "#FF5733"
    secondary_color = Column(String(50), nullable=True)   # Ej: "#333333"
    instagram_url = Column(String, nullable=True)
    whatsapp_number = Column(String(50), nullable=True)
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())

# ==========================================
# MÓDULO: GYM TRADICIONAL (PISO 2)
# ==========================================
class GymAccessLog(Base):
    __tablename__ = "gym_access_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    entry_time = Column(DateTime(timezone=True), nullable=False)
    exit_time = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User")


# ==========================================
# MÓDULO: SERVICIOS Y WORKSPACES
# ==========================================
class ResourceServices(Base):
    __tablename__ = "resource_services"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)  # 'SAUNA', 'PLUNGE', 'WORKSPACE'
    is_active = Column(Boolean, default=True)


class ResourceBookingServices(Base):
    __tablename__ = "resource_booking_services"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    resource_id = Column(UUID(as_uuid=True), ForeignKey("resource_services.id"), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    status = Column(String, default="CONFIRMED")  # CONFIRMED, CANCELLED, COMPLETED

    user = relationship("User")
    resource = relationship("ResourceServices")

# ==========================================
# MÓDULO: SERVICIOS Y WORKSPACES
# ==========================================

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    plan_id = Column(UUID(as_uuid=True), ForeignKey("plans.id", ondelete="SET NULL"), nullable=True)
    amount = Column(Float, nullable=False)
    method = Column(String, nullable=False) # 'CASH', 'ZELLE', 'CARD', 'TRANSFER'
    status = Column(String, default="COMPLETED") # 'COMPLETED', 'PENDING'
    created_at = Column(DateTime(timezone=True), server_default=func.now())