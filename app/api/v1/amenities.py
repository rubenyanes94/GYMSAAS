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
    Evita que dos personas reserven el mismo recurso (ej. Cold Plunge) al mismo tiempo.
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

    # 2. Comprobar superposición de horarios (Overlapping check)
    overlap_query = await db.execute(
        select(ResourceBookingServices)
        .filter(
            ResourceBookingServices.resource_id == payload.resource_id,
            ResourceBookingServices.status == "CONFIRMED",
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
            detail="El recurso ya está reservado en ese horario."
        )

    # 3. Validar membresía activa del usuario
    sub_result = await db.execute(
        select(UserSubscription).filter(UserSubscription.user_id == payload.user_id)
    )
    subscription = sub_result.scalars().first()
    
    if not subscription or subscription.status != "ACTIVE" or subscription.renews_at < now_caracas:
        raise HTTPException(status_code=403, detail="Requiere membresía activa para reservar recursos.")

    # 4. Crear la reserva
    new_booking = ResourceBookingServices(
        user_id=payload.user_id,
        resource_id=payload.resource_id,
        start_time=payload.start_time,
        end_time=payload.end_time
    )
    db.add(new_booking)
    await db.commit()
    
    return {"message": f"Reserva de {resource.category} confirmada con éxito."}



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