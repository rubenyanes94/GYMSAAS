from uuid import UUID
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.core.database import get_db
from app.models.schema import ClassSession, Booking, UserSubscription
from app.schemas.payloads import (
    StudioClassCreate, 
    ClassSessionResponse,
    BookingCreate,
    BookingResponse,
    StudioRoom
)

CARACAS_TZ = ZoneInfo("America/Caracas")

router = APIRouter(prefix="/studios", tags=["Piso 3 - Yoga y Pilates"])

# ==========================================
# 1. CREACIÓN DE CLASES CON CAPACIDAD ESTRICTA
# ==========================================

@router.post("/classes", response_model=ClassSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_studio_class(
    payload: StudioClassCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Crea una clase para el Piso 3.
    Asigna automáticamente la capacidad máxima dependiendo de la sala seleccionada.
    """
    # Regla de negocio comercial: Límites de aforo
    if payload.room in [StudioRoom.YOGA_1, StudioRoom.YOGA_2]:
        room_capacity = 15
    elif payload.room == StudioRoom.PILATES:
        room_capacity = 6
    else:
        raise HTTPException(status_code=400, detail="Sala no válida.")

    new_class = ClassSession(
        name=payload.name,
        room=payload.room,  # Requiere que agregues esta columna en schema.py
        start_time=payload.start_time,
        end_time=payload.end_time,
        coach_id=payload.coach_id,
        capacity=room_capacity
    )
    
    db.add(new_class)
    await db.commit()
    await db.refresh(new_class)
    
    return new_class


# ==========================================
# 2. RESERVAS Y LISTA DE ESPERA (CONCURRENCY-SAFE)
# ==========================================

@router.post("/bookings/reserve", response_model=BookingResponse)
async def reserve_studio_class(
    payload: BookingCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Reserva para Yoga o Pilates. Valida membresía activa (CrossFit o Yoga)
    y gestiona la lista de espera con bloqueo pesimista.
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

    # Validar que la clase pertenece al Piso 3
    if not class_session.room or class_session.room not in [e.value for e in StudioRoom]:
        raise HTTPException(status_code=400, detail="Esta clase no pertenece a los estudios de Yoga/Pilates.")

    if now_caracas > class_session.start_time:
        raise HTTPException(status_code=403, detail="La clase ya comenzó o finalizó.")

    # 2. BLOQUEO DE LA SUSCRIPCIÓN
    sub_result = await db.execute(
        select(UserSubscription)
        .filter(UserSubscription.user_id == payload.user_id)
        .with_for_update()
    )
    subscription = sub_result.scalars().first()

    # Validación de acceso: Debe tener cualquier plan activo (CrossFit o Yoga)
    if not subscription or subscription.status != "ACTIVE" or subscription.renews_at < now_caracas:
        raise HTTPException(
            status_code=403, 
            detail="Requieres un plan activo (CrossFit o Yoga) para reservar en estas salas."
        )
    
    if subscription.current_weekly_credits <= 0:
        raise HTTPException(
            status_code=403, 
            detail="No tienes créditos disponibles en tu plan actual."
        )

    # 3. COMPROBAR CUPOS DISPONIBLES (Capacidad estricta de 15 o 6)
    count_result = await db.execute(
        select(func.count(Booking.id))
        .filter(Booking.class_id == payload.class_id, Booking.status == "RESERVED")
    )
    reserved_count = count_result.scalar() or 0

    # 4. DETERMINAR ESTADO (Reserva o Lista de Espera)
    if reserved_count < class_session.capacity:
        booking_status = "RESERVED"
    else:
        booking_status = "WAITLISTED"

    # 5. DESCONTAR CRÉDITO
    subscription.current_weekly_credits -= 1

    # 6. REGISTRAR RESERVA
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