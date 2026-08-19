from uuid import UUID
from datetime import datetime, timedelta, date
from zoneinfo import ZoneInfo
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from pydantic import BaseModel

from app.core.database import get_db
from app.models.schema import User # Asegúrate de importar el modelo User si no lo tienes
from app.models.schema import ClassSession, Booking, UserSubscription
from app.schemas.payloads import (
    ClassSessionCreate, 
    ClassSessionResponse, 
    ClassScheduleResponse,
    BookingCreate, 
    BookingResponse
)

CARACAS_TZ = ZoneInfo("America/Caracas")

router = APIRouter(prefix="/operations", tags=["Operaciones y Reservas"])

# ==========================================
# CONFIGURACIÓN DE ACCESOS (TIER-BASED ACL)
# ==========================================
# Mapea el identificador del plan con las salas a las que tiene acceso.
PLANS_WITH_STUDIO_ACCESS = {
    "YOGA_STANDARD": ["YOGA_1", "YOGA_2", "PILATES"],
    "CROSSFIT_PREMIUM": ["YOGA_1", "YOGA_2", "PILATES"], 
    "CROSSFIT_BASIC": [], 
    "HYBRID_PRO": ["YOGA_1"] 
}

# ==========================================
# 1. GESTIÓN Y CARTELERA DE CLASES
# ==========================================

# ==========================================
# 1. GESTIÓN Y CARTELERA DE CLASES
# ==========================================

@router.post("/classes", response_model=ClassSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_class_session(
    payload: ClassSessionCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    El Head Coach precarga los horarios de las clases para el gimnasio o los estudios.
    """
    # 1. Mapeamos el payload a las columnas reales de ClassSession
    new_class = ClassSession(
        track_category=payload.name,               # En la BD se llama track_category
        session_date=payload.start_time.date(),    # Extraemos solo la fecha (YYYY-MM-DD)
        start_time=payload.start_time.time(),      # Extraemos solo la hora
        end_time=payload.end_time.time(),          # Extraemos solo la hora
        coach_id=payload.coach_id,
        max_capacity=payload.capacity,             # En la BD se llama max_capacity
        room=payload.room.value if payload.room else None  # Extraemos el valor del Enum a String
    )
    
    db.add(new_class)
    await db.commit()
    await db.refresh(new_class)
    
    # 2. Retornamos la respuesta reconstruyendo el formato datetime que espera el Frontend
    return {
        "id": new_class.id,
        "name": new_class.track_category.value if hasattr(new_class.track_category, 'value') else new_class.track_category,
        "start_time": datetime.combine(new_class.session_date, new_class.start_time),
        "end_time": datetime.combine(new_class.session_date, new_class.end_time),
        "coach_id": new_class.coach_id,
        "capacity": new_class.max_capacity,
        "room": new_class.room
    }


@router.get("/classes", response_model=list[ClassScheduleResponse])
async def list_classes(
    filter_date: Optional[date] = Query(None, description="Filtrar clases por día (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_db)
):
    """
    Cartelera que consume la App Móvil del Atleta y el Dashboard Admin.
    """
    query = select(ClassSession).order_by(ClassSession.session_date.asc(), ClassSession.start_time.asc())
    
    if filter_date:
        query = query.filter(ClassSession.session_date == filter_date)

    result = await db.execute(query)
    classes = result.scalars().all()

    response = []
    for cls in classes:
        res_count_query = await db.execute(
            select(func.count(Booking.id))
            .filter(Booking.session_id == cls.id, Booking.status == "RESERVED")
        )
        reserved_count = res_count_query.scalar() or 0

        wait_count_query = await db.execute(
            select(func.count(Booking.id))
            .filter(Booking.session_id == cls.id, Booking.status == "WAITLISTED")
        )
        waitlist_count = wait_count_query.scalar() or 0

        available_spots = max(0, cls.max_capacity - reserved_count)

        response.append({
            "id": cls.id,
            "name": cls.track_category.value if hasattr(cls.track_category, 'value') else cls.track_category,
            "room": cls.room, 
            "start_time": datetime.combine(cls.session_date, cls.start_time),
            "end_time": datetime.combine(cls.session_date, cls.end_time),
            "coach_id": cls.coach_id,
            "capacity": cls.max_capacity,
            "available_spots": available_spots,
            "waitlist_count": waitlist_count
        })

    return response

@router.put("/classes/{class_id}", response_model=ClassSessionResponse)
async def update_class_session(
    class_id: UUID,
    payload: ClassSessionCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Actualiza los detalles de una clase programada (duración, coach, capacidad, etc).
    """
    result = await db.execute(select(ClassSession).filter(ClassSession.id == class_id))
    cls = result.scalars().first()
    
    if not cls:
        raise HTTPException(status_code=404, detail="Clase no encontrada.")

    # Actualizamos los campos
    cls.track_category = payload.name
    cls.session_date = payload.start_time.date()
    cls.start_time = payload.start_time.time()
    cls.end_time = payload.end_time.time()
    cls.coach_id = payload.coach_id
    cls.max_capacity = payload.capacity
    cls.room = payload.room.value if payload.room else None

    await db.commit()
    await db.refresh(cls)
    
    return {
        "id": cls.id,
        "name": cls.track_category.value,
        "start_time": datetime.combine(cls.session_date, cls.start_time),
        "end_time": datetime.combine(cls.session_date, cls.end_time),
        "coach_id": cls.coach_id,
        "capacity": cls.max_capacity,
        "room": cls.room
    }

@router.delete("/classes/{class_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_class_session(
    class_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Cancela y elimina una clase de la cartelera.
    """
    result = await db.execute(select(ClassSession).filter(ClassSession.id == class_id))
    cls = result.scalars().first()
    
    if not cls:
        raise HTTPException(status_code=404, detail="Clase no encontrada.")

    # Opcional: Podrías verificar si hay reservas activas antes de eliminar
    # await db.execute(delete(Booking).where(Booking.session_id == class_id)) 
    
    await db.delete(cls)
    await db.commit()
    
    return None

# ==========================================
# 2. SISTEMA DE RESERVAS Y LISTA DE ESPERA 
# ==========================================

@router.post("/bookings/reserve", response_model=BookingResponse)
async def reserve_class(
    payload: BookingCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Atleta reserva una clase (CrossFit, Yoga o Pilates). 
    Implementa bloqueo pesimista y valida el Tier-Based ACL si la clase es de Estudio.
    """
    now_caracas = datetime.now(CARACAS_TZ)

    # 1. BLOQUEO DE LA CLASE
    class_result = await db.execute(
        select(ClassSession)
        .filter(ClassSession.id == payload.class_id)
        .with_for_update()
    )
    class_session = class_result.scalars().first()
    
    if not class_session:
        raise HTTPException(status_code=404, detail="Clase no encontrada.")

    # 2. Validar Ventana de 22 horas
    booking_opens_at = class_session.start_time - timedelta(hours=22)
    if now_caracas < booking_opens_at:
        raise HTTPException(
            status_code=403, 
            detail="Las reservas para esta clase abren 22 horas antes."
        )
    if now_caracas > class_session.start_time:
        raise HTTPException(status_code=403, detail="La clase ya comenzó o finalizó.")

    # 3. BLOQUEO Y VALIDACIÓN DE LA SUSCRIPCIÓN
    sub_result = await db.execute(
        select(UserSubscription)
        .filter(UserSubscription.user_id == payload.user_id)
        .with_for_update()
    )
    subscription = sub_result.scalars().first()

    # Si no tiene suscripción
    if not subscription:
        raise HTTPException(status_code=403, detail="No tienes una membresía asignada.")

    # Si la suscripción ya pasó su fecha de vencimiento
    if subscription.renews_at < now_caracas:
        # Actualizamos el estado a inactivo si no lo estaba
        if subscription.status == "ACTIVE":
            subscription.status = "INACTIVE"
            await db.commit()
        raise HTTPException(
            status_code=403, 
            detail="Tu membresía ha caducado. Por favor, renueva tu plan para continuar reservando."
        )
        
    # Si la suscripción fue cancelada manualmente
    if subscription.status != "ACTIVE":
         raise HTTPException(status_code=403, detail="Tu membresía se encuentra inactiva.")

    # Validación de créditos
    if subscription.current_weekly_credits <= 0:
        raise HTTPException(
            status_code=403, 
            detail="No tienes créditos disponibles para reservar."
        )
    # 4. LÓGICA TIER-BASED ACCESS
    if class_session.room:
        # Aquí asumo que la relación del plan expone su nombre en `plan_name`. 
        # Ajustar según tu modelo SQL (ej. subscription.plan.name)
        current_plan = getattr(subscription, "plan_name", "CROSSFIT_BASIC")
        
        allowed_rooms = PLANS_WITH_STUDIO_ACCESS.get(current_plan, [])
        
        if class_session.room not in allowed_rooms:
            raise HTTPException(
                status_code=403, 
                detail=f"Tu membresía actual ({current_plan}) no incluye acceso a la sala {class_session.room.value}."
            )

    # 5. Comprobar cupos disponibles matemáticamente seguros
    count_result = await db.execute(
        select(func.count(Booking.id))
        .filter(Booking.class_id == payload.class_id, Booking.status == "RESERVED")
    )
    reserved_count = count_result.scalar() or 0

    # 6. Determinar estado de la reserva
    if reserved_count < class_session.capacity:
        booking_status = "RESERVED"
    else:
        booking_status = "WAITLISTED"

    # 7. Descontar crédito atómicamente
    subscription.current_weekly_credits -= 1

    # 8. Registrar reserva
    new_booking = Booking(
        user_id=payload.user_id,
        class_id=payload.class_id,
        status=booking_status,
        created_at=now_caracas
    )
    db.add(new_booking)
    
    await db.commit()
    await db.refresh(new_booking)
    
    return new_booking


# ==========================================
# 3. CANCELACIONES (ATLETA)
# ==========================================

@router.post("/bookings/{booking_id}/cancel")
async def cancel_booking(
    booking_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Atleta cancela su reserva. 
    - > 1 hora antes: Reintegro de crédito y procesa lista de espera.
    - < 1 hora antes: Penalización (LATE_CANCEL), pierde el crédito.
    """
    now_caracas = datetime.now(CARACAS_TZ)

    # Bloquear la reserva
    booking_result = await db.execute(
        select(Booking).filter(Booking.id == booking_id).with_for_update()
    )
    booking = booking_result.scalars().first()

    if not booking or booking.status not in ["RESERVED", "WAITLISTED"]:
        raise HTTPException(status_code=400, detail="Reserva no válida para cancelación.")

    class_result = await db.execute(select(ClassSession).filter(ClassSession.id == booking.class_id))
    class_session = class_result.scalars().first()
    cancellation_deadline = class_session.start_time - timedelta(hours=1)

    # Suscripción del atleta que cancela
    sub_result = await db.execute(
        select(UserSubscription).filter(UserSubscription.user_id == booking.user_id).with_for_update()
    )
    subscription = sub_result.scalars().first()

    if booking.status == "WAITLISTED":
        booking.status = "CANCELLED"
        if subscription:
            subscription.current_weekly_credits += 1
    
    else: # status == "RESERVED"
        if now_caracas <= cancellation_deadline:
            booking.status = "CANCELLED"
            if subscription:
                subscription.current_weekly_credits += 1
            
            # PROMOCIÓN DE LISTA DE ESPERA (FIFO)
            waitlist_result = await db.execute(
                select(Booking)
                .filter(Booking.class_id == class_session.id, Booking.status == "WAITLISTED")
                .order_by(Booking.created_at.asc())
                .with_for_update()
            )
            next_in_line = waitlist_result.scalars().first()

            if next_in_line:
                # El crédito ya fue retenido al unirse al waitlist, solo asciende
                next_in_line.status = "RESERVED"
        else:
            booking.status = "LATE_CANCEL"

    await db.commit()
    return {"message": f"Reserva actualizada a {booking.status}"}


# ==========================================
# 4. ROSTER Y CHECK-IN DE COACHES
# ==========================================

@router.get("/classes/{class_id}/roster", response_model=list[BookingResponse])
async def get_class_roster(
    class_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    La App del Coach consulta este endpoint para ver el listado de atletas en la clase.
    """
    result = await db.execute(
        select(Booking)
        .filter(Booking.class_id == class_id)
        .filter(Booking.status.in_(["RESERVED", "ATTENDED", "WAITLISTED"]))
        .order_by(Booking.created_at.asc())
    )
    return result.scalars().all()


@router.post("/bookings/{booking_id}/check-in")
async def process_check_in(
    booking_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    El Coach marca la asistencia del atleta desde la App (tap en el Roster).
    """
    booking_result = await db.execute(select(Booking).filter(Booking.id == booking_id))
    booking = booking_result.scalars().first()

    if not booking or booking.status != "RESERVED":
        raise HTTPException(
            status_code=400, 
            detail="El atleta no tiene una reserva válida (RESERVED) para realizar check-in."
        )

    booking.status = "ATTENDED"
    await db.commit()
    
    return {"message": "Check-in exitoso"}


# ==========================================
# 5. RECONCILIACIÓN Y CIERRE DE CLASE
# ==========================================

@router.post("/classes/{class_id}/close")
async def close_class_session(
    class_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Cierre operativo de la clase (lo dispara el Coach al terminar o un Cron Job).
    - Convierte 'WAITLISTED' pendientes en 'EXPIRED_WAITLIST' y les DEVUELVE su crédito.
    - Convierte 'RESERVED' (sin check-in) en 'NO_SHOW' (pierden su crédito).
    """
    result = await db.execute(
        select(Booking)
        .filter(Booking.class_id == class_id)
        .filter(Booking.status.in_(["WAITLISTED", "RESERVED"]))
        .with_for_update()
    )
    pending_bookings = result.scalars().all()

    reimbursed_users = 0
    no_shows = 0

    for booking in pending_bookings:
        if booking.status == "WAITLISTED":
            booking.status = "EXPIRED_WAITLIST"
            sub_result = await db.execute(
                select(UserSubscription).filter(UserSubscription.user_id == booking.user_id).with_for_update()
            )
            sub = sub_result.scalars().first()
            if sub:
                sub.current_weekly_credits += 1
                reimbursed_users += 1
                
        elif booking.status == "RESERVED":
            booking.status = "NO_SHOW"
            no_shows += 1

    await db.commit()

    return {
        "message": "Clase cerrada exitosamente.",
        "expired_waitlist_reimbursed": reimbursed_users,
        "no_shows_recorded": no_shows
    }

# ==========================================
# GESTIÓN DE ROSTER (LISTA DE ASISTENCIA)
# ==========================================
@router.get("/classes/{class_id}/roster")
async def get_class_roster(class_id: UUID, db: AsyncSession = Depends(get_db)):
    """
    Devuelve la lista de atletas (nombre y apellido) inscritos en una clase específica.
    """
    query = (
        select(User)
        .join(Booking, Booking.user_id == User.id)
        .filter(Booking.session_id == class_id, Booking.status == "RESERVED")
    )
    result = await db.execute(query)
    users = result.scalars().all()
    
    return [
        {
            "id": str(u.id), 
            "first_name": u.first_name, 
            "last_name": u.last_name, 
            "email": u.email
        }
        for u in users
    ]

# ==========================================
# APUNTAR CLIENTE DESDE PANEL ADMIN
# ==========================================

class BookClientPayload(BaseModel):
    user_id: UUID

@router.post("/classes/{class_id}/book", status_code=status.HTTP_201_CREATED)
async def book_client_to_class(
    class_id: UUID, 
    payload: BookClientPayload, 
    db: AsyncSession = Depends(get_db)
):
    """
    Inscribe a un cliente específico en una clase (Usado por el Staff/Coach).
    Valida estrictamente que el cliente tenga una membresía activa y vigente.
    Si está vencido, debe ser redirigido a Caja para renovar su plan.
    """
    now_caracas = datetime.now(CARACAS_TZ)

    # 1. Verificar que la clase existe
    result_cls = await db.execute(select(ClassSession).filter(ClassSession.id == class_id))
    cls = result_cls.scalars().first()
    if not cls:
        raise HTTPException(status_code=404, detail="Clase no encontrada.")

    # 2. VALIDAR SUSCRIPCIÓN ACTIVA DEL CLIENTE
    sub_result = await db.execute(
        select(UserSubscription)
        .filter(UserSubscription.user_id == payload.user_id)
        .with_for_update() # Bloqueo para evitar condiciones de carrera al descontar créditos
    )
    subscription = sub_result.scalars().first()

    # Si no tiene suscripción, o ya caducó, o su estado no es ACTIVE
    if not subscription or subscription.renews_at < now_caracas or subscription.status != "ACTIVE":
        # Podrías actualizar su estado a INACTIVE aquí de forma pasiva si caducó
        if subscription and subscription.status == "ACTIVE" and subscription.renews_at < now_caracas:
            subscription.status = "INACTIVE"
            await db.commit()
            
        raise HTTPException(
            status_code=403, 
            detail="El cliente tiene la membresía vencida o inactiva. Debe pasar por caja para renovar su plan."
        )

    # Validar si tiene créditos disponibles
    if subscription.current_weekly_credits <= 0:
        raise HTTPException(
            status_code=403, 
            detail="El cliente no tiene créditos disponibles en su plan actual."
        )

    # 3. Verificar que el usuario no esté ya inscrito (o en lista de espera)
    result_existing = await db.execute(
        select(Booking).filter(Booking.session_id == class_id, Booking.user_id == payload.user_id)
    )
    existing_booking = result_existing.scalars().first()
    if existing_booking:
        raise HTTPException(
            status_code=400, 
            detail="El cliente ya está inscrito o en lista de espera para esta clase."
        )

    # 4. Determinar si va a Reserva o Lista de Espera basado en la capacidad
    count_result = await db.execute(
        select(func.count(Booking.id))
        .filter(Booking.session_id == class_id, Booking.status == "RESERVED")
    )
    reserved_count = count_result.scalar() or 0
    booking_status = "RESERVED" if reserved_count < cls.max_capacity else "WAITLISTED"

    # 5. Descontar el crédito atómicamente
    subscription.current_weekly_credits -= 1

    # 6. Crear la reserva
    new_booking = Booking(
        user_id=payload.user_id,
        session_id=class_id,
        status=booking_status 
    )
    db.add(new_booking)
    
    await db.commit()
    
    # Retornamos el estado para que el frontend pueda avisar si entró a reserva o lista de espera
    return {
        "message": "Cliente procesado con éxito.",
        "status": booking_status
    }