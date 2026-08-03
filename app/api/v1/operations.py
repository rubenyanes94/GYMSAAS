# app/api/v1/operations.py
from uuid import UUID
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.core.database import get_db
from app.models.schema import ClassSession, Booking, UserSubscription
from app.schemas.payloads import ClassSessionCreate, ClassSessionResponse, BookingCreate, BookingResponse

CARACAS_TZ = ZoneInfo("America/Caracas")

router = APIRouter(prefix="/operations", tags=["Operaciones y Reservas"])

# ==========================================
# 1. GESTIÓN DE CLASES (STAFF)
# ==========================================

@router.post("/classes", response_model=ClassSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_class_session(
    payload: ClassSessionCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    El Head Coach precarga los horarios de las clases.
    """
    new_class = ClassSession(
        name=payload.name,
        start_time=payload.start_time,
        end_time=payload.end_time,
        coach_id=payload.coach_id,
        capacity=payload.capacity
    )
    db.add(new_class)
    await db.commit()
    await db.refresh(new_class)
    return new_class


# ==========================================
# 2. SISTEMA DE RESERVAS Y LISTA DE ESPERA (CONCURRENCY-SAFE)
# ==========================================

@router.post("/bookings/reserve", response_model=BookingResponse)
async def reserve_class(
    payload: BookingCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Atleta reserva una clase. 
    Implementa bloqueo pesimista (.with_for_update()) para prevenir 
    sobreventa en picos de alta concurrencia y double-spending de créditos.
    """
    now_caracas = datetime.now(CARACAS_TZ)

    # 1. BLOQUEO DE LA CLASE: Serializa las peticiones entrantes para esta fila
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

    # 3. BLOQUEO DE LA SUSCRIPCIÓN: Evita gastar un crédito múltiple veces simultáneas
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
            detail="No tienes créditos disponibles para reservar o unirte a la lista de espera."
        )

    # 4. Comprobar cupos disponibles matemáticamente seguros
    count_result = await db.execute(
        select(func.count(Booking.id))
        .filter(Booking.class_id == payload.class_id, Booking.status == "RESERVED")
    )
    reserved_count = count_result.scalar()

    # 5. Determinar estado de la reserva
    if reserved_count < class_session.capacity:
        booking_status = "RESERVED"
    else:
        booking_status = "WAITLISTED"

    # 6. Descontar crédito de forma atómica (aplica para RESERVED y WAITLISTED)
    subscription.current_weekly_credits -= 1

    # 7. Registrar reserva
    new_booking = Booking(
        user_id=payload.user_id,
        class_id=payload.class_id,
        status=booking_status,
        created_at=now_caracas
    )
    db.add(new_booking)
    
    # El commit libera los bloqueos para la siguiente petición
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

    # Bloquear la reserva para evitar doble cancelación
    booking_result = await db.execute(select(Booking).filter(Booking.id == booking_id).with_for_update())
    booking = booking_result.scalars().first()

    if not booking or booking.status not in ["RESERVED", "WAITLISTED"]:
        raise HTTPException(status_code=400, detail="Reserva no válida para cancelación.")

    class_result = await db.execute(select(ClassSession).filter(ClassSession.id == booking.class_id))
    class_session = class_result.scalars().first()
    cancellation_deadline = class_session.start_time - timedelta(hours=1)

    # Obtener la suscripción para el posible reintegro
    sub_result = await db.execute(
        select(UserSubscription).filter(UserSubscription.user_id == booking.user_id)
    )
    subscription = sub_result.scalars().first()

    if booking.status == "WAITLISTED":
        booking.status = "CANCELLED"
        # Reintegro por salir de lista de espera
        if subscription:
            subscription.current_weekly_credits += 1
    
    else: # status == "RESERVED"
        if now_caracas <= cancellation_deadline:
            # Cancelación temprana
            booking.status = "CANCELLED"
            if subscription:
                subscription.current_weekly_credits += 1
            
            # --- LÓGICA DE LISTA DE ESPERA ---
            waitlist_result = await db.execute(
                select(Booking)
                .filter(Booking.class_id == class_session.id, Booking.status == "WAITLISTED")
                .order_by(Booking.created_at.asc())
            )
            next_in_line = waitlist_result.scalars().first()

            if next_in_line:
                # El crédito ya fue retenido al entrar a la lista, solo asciende su estado
                next_in_line.status = "RESERVED"
        else:
            # Cancelación tardía: Penalización
            booking.status = "LATE_CANCEL"

    await db.commit()
    return {"message": f"Reserva actualizada a {booking.status}"}


# ==========================================
# 4. GESTIÓN DE CHECK-IN EN APP PARA COACHES
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