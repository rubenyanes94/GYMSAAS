from uuid import UUID
from datetime import datetime, time
from zoneinfo import ZoneInfo
from dateutil.relativedelta import relativedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.models.schema import User, UserRole, Plan, UserSubscription,Payment
from app.schemas.payloads import (
    PlanCreate, PlanUpdate, PlanResponse,
    UserSubscriptionCreate, UserSubscriptionResponse,TransactionCreate
)

CARACAS_TZ = ZoneInfo("America/Caracas")

def calculate_caracas_expiration(from_date: datetime = None) -> datetime:
    """
    Calcula el vencimiento exacto: mismo día del mes siguiente a las 10:00 PM (22:00) 
    en horario de Caracas, Venezuela.
    """
    if from_date is None:
        from_date = datetime.now(CARACAS_TZ)
    elif from_date.tzinfo is None:
        from_date = from_date.replace(tzinfo=CARACAS_TZ)
        
    next_month = from_date + relativedelta(months=1)
    
    return datetime.combine(
        next_month.date(),
        time(22, 0, 0),
        tzinfo=CARACAS_TZ
    )


router = APIRouter(prefix="/finances", tags=["Finanzas y Membresías"])

# ==========================================
# CRUD DE PLANES (BOX OWNER / STAFF)
# ==========================================

@router.post("/plans", response_model=PlanResponse, status_code=status.HTTP_201_CREATED)
async def create_plan(
    plan_in: PlanCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Crea un nuevo plan de membresía o drop-in para el gimnasio.
    """
    new_plan = Plan(
        name=plan_in.name,
        category=plan_in.category,
        price=plan_in.price,
        credits_per_week=plan_in.credits_per_week,
        validity_days=plan_in.validity_days,
        is_unlimited=plan_in.is_unlimited
    )
    
    db.add(new_plan)
    await db.commit()
    await db.refresh(new_plan)
    
    return new_plan


@router.get("/plans", response_model=list[PlanResponse])
async def list_plans(
    db: AsyncSession = Depends(get_db)
):
    """
    Lista todos los planes disponibles del gimnasio.
    """
    query = select(Plan)
    result = await db.execute(query)
    return result.scalars().all()


@router.put("/plans/{plan_id}", response_model=PlanResponse)
async def update_plan(
    plan_id: UUID,
    plan_in: PlanUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Actualiza los detalles de un plan existente.
    """
    result = await db.execute(select(Plan).filter(Plan.id == plan_id))
    plan = result.scalars().first()
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan no encontrado."
        )
        
    update_data = plan_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(plan, field, value)
        
    await db.commit()
    await db.refresh(plan)
    
    return plan


# ==========================================
# ASIGNACIÓN Y GESTIÓN DE SUSCRIPCIONES
# ==========================================

@router.post("/subscriptions", response_model=UserSubscriptionResponse, status_code=status.HTTP_201_CREATED)
async def assign_subscription_to_athlete(
    sub_in: UserSubscriptionCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Activa o renueva la suscripción de un atleta. 
    Calcula automáticamente la fecha de vencimiento a las 10:00 PM (Caracas) del mes siguiente.
    """
    # 1. Verificar existencia del plan
    plan_result = await db.execute(select(Plan).filter(Plan.id == sub_in.plan_id))
    plan = plan_result.scalars().first()
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El plan seleccionado no existe."
        )

    # 2. Verificar existencia del atleta
    user_result = await db.execute(select(User).filter(User.id == sub_in.user_id))
    user = user_result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El usuario/atleta no existe."
        )

    # 3. Calcular fechas exactas con zona horaria de Caracas
    now_caracas = datetime.now(CARACAS_TZ)
    expiration_date = calculate_caracas_expiration(now_caracas)
    initial_credits = plan.credits_per_week if plan.credits_per_week is not None else 0

    # 4. Buscar si ya existe una suscripción para este atleta (Upsert)
    sub_result = await db.execute(
        select(UserSubscription).filter(UserSubscription.user_id == sub_in.user_id)
    )
    subscription = sub_result.scalars().first()

    if subscription:
        # Actualización por renovación/cambio de plan
        subscription.plan_id = plan.id
        subscription.status = "ACTIVE"
        subscription.current_weekly_credits = initial_credits
        subscription.renews_at = expiration_date
    else:
        # Creación de nueva suscripción (SIN starts_at)
        subscription = UserSubscription(
            user_id=sub_in.user_id,
            plan_id=plan.id,
            status="ACTIVE",
            current_weekly_credits=initial_credits,
            renews_at=expiration_date
        )
        db.add(subscription)

    await db.commit()
    await db.refresh(subscription)
    
    return subscription


# ==========================================
# REGISTRO Y LECTURA DE TRANSACCIONES (PAGOS)
# ==========================================

@router.post("/transactions", status_code=status.HTTP_201_CREATED)
async def create_transaction(
    tx_in: TransactionCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Registra un nuevo pago en el sistema (Caja / Facturación).
    """
    new_payment = Payment(
        user_id=tx_in.user_id,
        plan_id=tx_in.plan_id,
        amount=tx_in.amount,
        method=tx_in.method,
        status=tx_in.status
    )
    
    db.add(new_payment)
    await db.commit()
    await db.refresh(new_payment)
    
    return {"message": "Transacción registrada exitosamente", "id": new_payment.id}


@router.get("/transactions")
async def get_transactions(db: AsyncSession = Depends(get_db)):
    """
    Obtiene todo el historial de pagos cruzando datos con Usuarios y Planes
    para alimentar el FinancesDashboard.
    """
    # Hacemos un JOIN para traer el nombre del usuario y el nombre del plan en una sola consulta
    query = (
        select(
            Payment.id,
            Payment.amount,
            Payment.created_at.label("date"),
            Payment.method,
            Payment.status,
            User.first_name,
            User.last_name,
            Plan.name.label("plan_name")
        )
        .join(User, User.id == Payment.user_id)
        .outerjoin(Plan, Plan.id == Payment.plan_id)
        .order_by(Payment.created_at.desc())
    )
    
    result = await db.execute(query)
    rows = result.all()
    
    # Formateamos la respuesta exactamente como la espera tu componente React
    transactions = []
    for row in rows:
        transactions.append({
            "id": str(row.id),
            "athlete_name": f"{row.first_name} {row.last_name}",
            "plan_name": row.plan_name if row.plan_name else "Concepto General",
            "amount": row.amount,
            "date": row.date.isoformat(),
            "method": row.method,
            "status": row.status
        })
        
    return transactions