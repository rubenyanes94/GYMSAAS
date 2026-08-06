from uuid import UUID
from datetime import datetime
from zoneinfo import ZoneInfo
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, and_
from sqlalchemy import desc

from app.core.database import get_db
from app.models.schema import UserSubscription, GymAccessLog, ResourceServices, ResourceBookingServices
# Asume que crearás schemas Pydantic simples para estos payloads en schemas.py
from app.schemas.payloads import ResourceBookingCreate 

CARACAS_TZ = ZoneInfo("America/Caracas")

router = APIRouter(prefix="/amenities", tags=["Gimnasio, Servicios y Workspaces"])

# ==========================================
# 1. GYM TRADICIONAL (ACCESO LIBRE PISO 2)
# ==========================================

@router.post("/gym/check-in")
async def gym_traditional_check_in(
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    El cliente pasa su código/QR en el Piso 2.
    Solo valida si tiene una suscripción activa. No descuenta créditos de clases.
    """
    now_caracas = datetime.now(CARACAS_TZ)

    # Validar membresía
    sub_result = await db.execute(
        select(UserSubscription)
        .filter(UserSubscription.user_id == user_id)
    )
    subscription = sub_result.scalars().first()

    if not subscription or subscription.status != "ACTIVE" or subscription.renews_at < now_caracas:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Acceso denegado. Membresía inactiva o vencida."
        )

    # Registrar el acceso
    access_log = GymAccessLog(
        user_id=user_id,
        entry_time=now_caracas
    )
    db.add(access_log)
    await db.commit()
    
    return {"message": "Acceso concedido al Gym Tradicional."}


# ==========================================
# 2. RESERVAS DE ESPACIOS (SAUNA, PLUNGE, WORKSPACE)
# ==========================================

@router.post("/resources/reserve")
async def reserve_resource(
    payload: ResourceBookingCreate, 
    db: AsyncSession = Depends(get_db)
):
    """
    Reserva bloques exactos de tiempo. 
    Aplica cuotas gratuitas a miembros activos (2h Workspace, 2 usos Sauna/Plunge).
    No afiliados o excedentes entran en estado PENDING_PAYMENT.
    """
    now_caracas = datetime.now(CARACAS_TZ)
    
    if payload.start_time < now_caracas:
        raise HTTPException(status_code=400, detail="No puedes reservar en el pasado.")

    # 1. Bloquear el recurso temporalmente para evitar superposición
    resource_result = await db.execute(
        select(ResourceServices).filter(ResourceServices.id == payload.resource_id).with_for_update()
    )
    resource = resource_result.scalars().first()
    
    if not resource or not resource.is_active:
        raise HTTPException(status_code=404, detail="Recurso no disponible.")

    # 2. Comprobar superposición de horarios
    overlap_query = await db.execute(
        select(ResourceBookingServices)
        .filter(
            ResourceBookingServices.resource_id == payload.resource_id,
            ResourceBookingServices.status.in_(["CONFIRMED", "PENDING_PAYMENT"]),
            and_(
                ResourceBookingServices.start_time < payload.end_time,
                ResourceBookingServices.end_time > payload.start_time
            )
        )
    )
    conflict = overlap_query.scalars().first()

    if conflict:
        raise HTTPException(
            status_code=409, 
            detail="El recurso ya está reservado en ese horario por otro usuario."
        )

    # 3. Validar membresía y aplicar reglas de negocio
    sub_result = await db.execute(
        select(UserSubscription).filter(UserSubscription.user_id == payload.user_id)
    )
    subscription = sub_result.scalars().first()
    
    # --- AQUÍ DEFINIMOS LAS VARIABLES QUE DABAN ERROR ---
    is_active_member = (
        subscription is not None and 
        subscription.status == "ACTIVE" and 
        subscription.renews_at > now_caracas
    )

    booking_status = "PENDING_PAYMENT"

    # Lógica de conteo de uso gratuito para miembros
    if is_active_member:
        start_of_day = payload.start_time.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = payload.start_time.replace(hour=23, minute=59, second=59, microsecond=999999)

        today_bookings_query = await db.execute(
            select(ResourceBookingServices)
            .join(ResourceServices, ResourceBookingServices.resource_id == ResourceServices.id)
            .filter(
                ResourceBookingServices.user_id == payload.user_id,
                ResourceBookingServices.status.in_(["CONFIRMED", "PENDING_PAYMENT"]),
                ResourceBookingServices.start_time >= start_of_day,
                ResourceBookingServices.start_time <= end_of_day
            )
        )
        today_bookings = today_bookings_query.scalars().all()

        if resource.category == "WORKSPACE":
            minutes_used_today = sum(
                (b.end_time - b.start_time).total_seconds() / 60 
                for b in today_bookings if b.resource.category == "WORKSPACE"
            )
            requested_minutes = (payload.end_time - payload.start_time).total_seconds() / 60
            
            if (minutes_used_today + requested_minutes) <= 120:
                booking_status = "CONFIRMED"

        elif resource.category in ["SAUNA", "PLUNGE"]:
            uses_today = sum(
                1 for b in today_bookings if b.resource.category in ["SAUNA", "PLUNGE"]
            )
            
            if uses_today < 2:
                booking_status = "CONFIRMED"

    # 4. Crear la reserva
    new_booking = ResourceBookingServices(
        user_id=payload.user_id,
        resource_id=payload.resource_id,
        start_time=payload.start_time,
        end_time=payload.end_time,
        status=booking_status
    )
    db.add(new_booking)
    await db.commit()
    await db.refresh(new_booking)
    
    # 5. Estructurar la respuesta para el Frontend
    if booking_status == "CONFIRMED":
        return {
            "message": f"Reserva de {resource.category} confirmada. Beneficio incluido en tu membresía.",
            "status": new_booking.status,
            "booking_id": str(new_booking.id)
        }
    
    # Precios estáticos temporales (puedes ajustar estos valores a tu criterio comercial)
    PRICES = {
        "WORKSPACE": 5.00,
        "SAUNA": 10.00,
        "PLUNGE": 12.00
    }
    
    amount_to_charge = PRICES.get(resource.category, 10.00)
    reason = "Excediste tu límite diario gratuito." if is_active_member else "No posees una membresía activa."

    return {
        "message": f"Reserva generada. Requiere pago de ${amount_to_charge} para ser confirmada.",
        "status": new_booking.status,
        "booking_id": str(new_booking.id),
        "amount_due": amount_to_charge,
        "currency": "USD",
        "payment_reason": reason
    }



# ==========================================
# 3. ANALÍTICAS Y USABILIDAD (DATA)
# ==========================================

@router.get("/resources/usability")
async def get_resources_usability(
    db: AsyncSession = Depends(get_db)
):
    """
    Data de usabilidad de espacios (Sauna, Plunge, Workspace).
    Devuelve las reservas y calcula automáticamente las horas de uso.
    """
    query = await db.execute(
        select(
            ResourceBookingServices.id,
            ResourceBookingServices.start_time,
            ResourceBookingServices.end_time,
            ResourceBookingServices.status,
            ResourceServices.category,
            ResourceServices.name
        )
        .join(ResourceServices, ResourceBookingServices.resource_id == ResourceServices.id)
        .order_by(desc(ResourceBookingServices.start_time))
    )
    
    results = query.all()
    data = []
    
    for row in results:
        # Calculamos la duración exacta de la reserva en horas
        duration_hours = (row.end_time - row.start_time).total_seconds() / 3600
        
        data.append({
            "booking_id": str(row.id),
            "resource_name": row.name,
            "category": row.category,
            "start_time": row.start_time,
            "end_time": row.end_time,
            "duration_hours": round(duration_hours, 2),
            "status": row.status
        })
        
    return {"total_records": len(data), "data": data}


@router.get("/gym/attendance")
async def get_gym_attendance(
    db: AsyncSession = Depends(get_db)
):
    """
    Data de accesos al gimnasio tradicional.
    Calcula el tiempo de estadía si el usuario ya registró su salida.
    """
    query = await db.execute(
        select(
            GymAccessLog.id,
            GymAccessLog.user_id,
            GymAccessLog.entry_time,
            GymAccessLog.exit_time
        )
        .order_by(desc(GymAccessLog.entry_time))
    )
    
    results = query.all()
    data = []
    
    for row in results:
        hours_spent = None
        
        # Solo podemos calcular las horas si el atleta ya hizo el "check-out"
        if row.exit_time:
            hours_spent = (row.exit_time - row.entry_time).total_seconds() / 3600

        data.append({
            "log_id": str(row.id),
            "user_id": str(row.user_id),
            "entry_time": row.entry_time,
            "exit_time": row.exit_time,
            "hours_spent": round(hours_spent, 2) if hours_spent else None,
            "is_still_in_gym": row.exit_time is None
        })
        
    return {"total_records": len(data), "data": data}

@router.post("/resources/bookings/{booking_id}/confirm-payment")
async def confirm_resource_payment(
    booking_id: UUID,
    # Aquí recibirías el comprobante de pago o el token de Stripe
    db: AsyncSession = Depends(get_db)
):
    """
    Marca una reserva como CONFIRMED tras recibir el pago.
    (Este endpoint asume que el cobro externo ya fue procesado correctamente.)
    """
    # Buscar la reserva
    booking_q = await db.execute(
        select(ResourceBookingServices).filter(ResourceBookingServices.id == booking_id)
    )
    booking = booking_q.scalars().first()

    if not booking:
        raise HTTPException(status_code=404, detail="Reserva no encontrada.")

    if booking.status == "CONFIRMED":
        return {"message": "La reserva ya está confirmada.", "booking_id": str(booking.id), "status": booking.status}

    booking.status = "CONFIRMED"
    db.add(booking)
    await db.commit()
    await db.refresh(booking)

    return {"message": "Pago confirmado. Reserva actualizada.", "booking_id": str(booking.id), "status": booking.status}