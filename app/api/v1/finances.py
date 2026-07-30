from uuid import UUID
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.models.schema import User, UserRole, Plan, UserSubscription
from app.schemas.payloads import (
    PlanCreate, PlanUpdate, PlanResponse,
    UserSubscriptionCreate, UserSubscriptionResponse
)
# Asume que tienes tu dependencia para obtener el usuario autenticado
# from app.api.dependencies import get_current_active_user

router = APIRouter(tags=["Finanzas y Membresías"])

# ==========================================
# CRUD DE PLANES (BOX OWNER / STAFF)
# ==========================================

@router.post("/plans", response_model=PlanResponse, status_code=status.HTTP_201_CREATED)
async def create_plan(
    plan_in: PlanCreate,
    db: AsyncSession = Depends(get_db),
    # current_user: User = Depends(get_current_active_user)
):
    """
    Crea un nuevo plan de membresía o drop-in para el gimnasio.
    """
    # Ejemplo simulado de tenant heredado del usuario autenticado:
    # tenant_id = current_user.tenant_box_id
    
    new_plan = Plan(
        # tenant_box_id=tenant_id,
        name=plan_in.name,
        category=plan_in.category,
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
    db: AsyncSession = Depends(get_db),
    # current_user: User = Depends(get_current_active_user)
):
    """
    Lista todos los planes disponibles del gimnasio.
    """
    # query = select(Plan).filter(Plan.tenant_box_id == current_user.tenant_box_id)
    query = select(Plan) # Versión abierta para pruebas
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
    Vincula una membresía (Plan) a un atleta, asignando sus créditos iniciales 
    y configurando su fecha de renovación.
    """
    # 1. Verificar que el plan exista para extraer sus créditos predeterminados
    plan_result = await db.execute(select(Plan).filter(Plan.id == sub_in.plan_id))
    plan = plan_result.scalars().first()
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El plan seleccionado no existe."
        )

    # 2. Verificar que el usuario exista
    user_result = await db.execute(select(User).filter(User.id == sub_in.user_id))
    user = user_result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El usuario/atleta no existe."
        )

    # 3. Lógica Clave: Inicializar créditos semanales basados en el plan
    initial_credits = plan.credits_per_week if plan.credits_per_week is not None else 0

    # 4. Crear la suscripción activa
    new_subscription = UserSubscription(
        user_id=sub_in.user_id,
        plan_id=sub_in.plan_id,
        current_weekly_credits=initial_credits,
        status="ACTIVE",
        renews_at=sub_in.renews_at
    )
    
    db.add(new_subscription)
    await db.commit()
    await db.refresh(new_subscription)
    
    return new_subscription