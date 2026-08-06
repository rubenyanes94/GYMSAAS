from uuid import UUID
from datetime import datetime, timedelta, date
from zoneinfo import ZoneInfo
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.core.database import get_db
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

@router.post("/classes", response_model=ClassSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_class_session(
    payload: ClassSessionCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    El Head Coach precarga los horarios de las clases para el gimnasio o los estudios.
    """
    new_class = ClassSession(
        name=payload.name,
        start_time=payload.start_time,
        end_time=payload.end_time,
        coach_id=payload.coach_id,
        capacity=payload.capacity,
        room=payload.room  
    )
    db.add(new_class)
    await db.commit()
    await db.refresh(new_class)
    return new_class


@router.get("/classes", response_model=list[ClassScheduleResponse])
async def list_classes(
    filter_date: Optional[date] = Query(None, description="Filtrar clases por día (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_db)
):
    """
    Cartelera que consume la App Móvil del Atleta.
    Devuelve los horarios y calcula dinámicamente cupos libres y lista de espera.
    """
    query = select(ClassSession).order_by(ClassSession.start_time.asc())
    
    if filter_date:
        start_of_day = datetime.combine(filter_date, datetime.min.time(), tzinfo=CARACAS_TZ)
        end_of_day = datetime.combine(filter_date, datetime.max.time(), tzinfo=CARACAS_TZ)
        query = query.filter(
            ClassSession.start_time >= start_of_day,
            ClassSession.start_time <= end_of_day
        )

    result = await db.execute(query)
    classes = result.scalars().all()

    response = []
    for cls in classes:
        # Conteo de reservados
        res_count_query = await db.execute(
            select(func.count(Booking.id))
            .filter(Booking.class_id == cls.id, Booking.status == "RESERVED")
        )
        reserved_count = res_count_query.scalar() or 0

        # Conteo de lista de espera
        wait_count_query = await db.execute(
            select(func.count(Booking.id))
            .filter(Booking.class_id == cls.id, Booking.status == "WAITLISTED")
        )
        waitlist_count = wait_count_query.scalar() or 0

        available_spots = max(0, cls.capacity - reserved_count)

        response.append({
            "id": cls.id,
            "name": cls.name,
            "room": cls.room, 
            "start_time": cls.start_time,
            "end_time": cls.end_time,
            "coach_id": cls.coach_id,
            "capacity": cls.capacity,
            "available_spots": available_spots,
            "waitlist_count": waitlist_count
        })

    return response


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

    # 3. BLOQUEO DE LA SUSCRIPCIÓN
    sub_result = await db.execute(
        select(UserSubscription)
        .filter(UserSubscription.user_id == payload.user_id)
        .with_for_update()
    )
    subscription = sub_result.scalars().first()

    if not subscription or subscription.status != "ACTIVE" or subscription.renews_at < now_caracas:
        raise HTTPException(status_code=403, detail="No tienes una membresía activa.")
    
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