import asyncio
from typing import List, Optional
from uuid import UUID
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.enums import TaskType, TaskStatus, PaymentStatus
from app.models.customer import Customer
from app.models.runner import Runner
from app.models.task import Task
from app.schemas.task import (
    TaskCreate,
    TaskStatusUpdate,
    TaskAccept,
    TaskRate,
    TaskDispute,
    TaskCancel,
    TaskResponse,
)
from app.schemas.payment import FundTaskRequest, FundTaskResponse
from app.services.trust import can_runner_accept_task, recalculate_runner_trust
from app.services.payment import (
    fund_task,
    release_task_funds,
    refund_task_funds,
    PaymentGatewayStub,
)
from app.ws import manager

router = APIRouter(prefix="/tasks", tags=["Tasks"])


def _task_to_ws_dict(task: Task) -> dict:
    """Convert a Task ORM object to a complete JSON-serializable dict for WebSocket broadcast."""
    return {
        "id": str(task.id),
        "type": task.type.value if task.type else None,
        "status": task.status.value if task.status else None,
        "customer_id": str(task.customer_id) if task.customer_id else None,
        "runner_id": str(task.runner_id) if task.runner_id else None,
        "description": task.description,
        "pickup_address": task.pickup_address,
        "delivery_address": task.delivery_address,
        "estimated_goods_cost": float(task.estimated_goods_cost) if task.estimated_goods_cost is not None else 0.0,
        "service_fee": float(task.service_fee) if task.service_fee is not None else 0.0,
        "total_amount": float(task.total_amount) if task.total_amount is not None else 0.0,
        "payment_status": task.payment_status.value if task.payment_status else None,
        "customer_rating": task.customer_rating,
        "customer_review": task.customer_review,
        "dispute_reason": task.dispute_reason,
        "created_at": task.created_at.isoformat() if task.created_at else None,
        "updated_at": task.updated_at.isoformat() if task.updated_at else None,
        "customer": {
            "id": str(task.customer.id),
            "full_name": task.customer.full_name,
            "phone": task.customer.phone,
            "email": task.customer.email,
        } if task.customer else None,
        "runner": {
            "id": str(task.runner.id),
            "full_name": task.runner.full_name,
            "phone": task.runner.phone,
            "bike_plate_number": task.runner.bike_plate_number,
            "trust_tier": task.runner.trust_tier.value if task.runner.trust_tier else "BRONZE",
            "trust_score": float(task.runner.trust_score) if task.runner.trust_score else 5.0,
        } if task.runner else None,
    }


def _broadcast_task(task: Task):
    """Thread-safe broadcast of task update to WebSocket subscribers."""
    task_data = _task_to_ws_dict(task)
    task_id = str(task.id)
    manager.broadcast_task_sync(task_id, task_data)


def _broadcast_new_available(task: Task):
    """Thread-safe broadcast to runners that a new task is available."""
    task_data = _task_to_ws_dict(task)
    manager.broadcast_new_available_sync(task_data)


@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(payload: TaskCreate, db: Session = Depends(get_db)):
    """
    Create a new errand task (Supermarket Run or Package Pickup).
    Initial status is PENDING and payment_status is UNFUNDED.
    """
    customer = db.query(Customer).filter(Customer.id == payload.customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found."
        )

    estimated_goods = Decimal(str(payload.estimated_goods_cost))
    service_fee = Decimal(str(payload.service_fee))
    total_amount = estimated_goods + service_fee

    task = Task(
        type=payload.type,
        status=TaskStatus.PENDING,
        customer_id=payload.customer_id,
        runner_id=None,
        description=payload.description,
        pickup_address=payload.pickup_address,
        delivery_address=payload.delivery_address,
        estimated_goods_cost=estimated_goods,
        service_fee=service_fee,
        total_amount=total_amount,
        payment_status=PaymentStatus.UNFUNDED,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("/", response_model=List[TaskResponse])
def list_tasks(
    status: Optional[TaskStatus] = Query(None, description="Filter by task status"),
    task_type: Optional[TaskType] = Query(None, alias="type", description="Filter by errand type"),
    customer_id: Optional[UUID] = Query(None, description="Filter by customer UUID"),
    runner_id: Optional[UUID] = Query(None, description="Filter by assigned runner UUID"),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """List tasks with optional filters."""
    query = db.query(Task)
    if status is not None:
        query = query.filter(Task.status == status)
    if task_type is not None:
        query = query.filter(Task.type == task_type)
    if customer_id is not None:
        query = query.filter(Task.customer_id == customer_id)
    if runner_id is not None:
        query = query.filter(Task.runner_id == runner_id)

    tasks = query.order_by(Task.created_at.desc()).offset(skip).limit(limit).all()
    return tasks


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: UUID, db: Session = Depends(get_db)):
    """Retrieve details of a specific task."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found."
        )
    return task


@router.post("/{task_id}/fund", response_model=FundTaskResponse)
def fund_task_endpoint(
    task_id: UUID,
    payload: Optional[FundTaskRequest] = None,
    db: Session = Depends(get_db)
):
    """
    Fund task into escrow.
    In production, this initiates/verifies Paystack or Flutterwave payment.
    Once funded, the task transitions to 'FUNDED' and becomes available in runners' feeds.
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found."
        )

    if task.status not in (TaskStatus.PENDING, TaskStatus.FUNDED):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot fund task in '{task.status.value}' status."
        )

    # Initialize / verify payment transaction via gateway stub
    init_res = PaymentGatewayStub.initialize_transaction(
        amount=float(task.total_amount),
        email=task.customer.email if task.customer else "customer@pickngo.ng",
        task_id=str(task.id),
    )

    # Mark escrow funded
    ref = payload.payment_reference if payload and payload.payment_reference else init_res["reference"]
    task = fund_task(db, task, reference=ref)

    # Broadcast: task is now funded (status update to task watchers)
    _broadcast_task(task)
    # Broadcast: new task available for runners
    _broadcast_new_available(task)

    return FundTaskResponse(
        task_id=task.id,
        payment_status=task.payment_status,
        amount=task.total_amount,
        reference=ref,
        authorization_url=init_res.get("authorization_url"),
        message="Task funded successfully into escrow. Runners can now view and accept the task.",
    )


@router.post("/{task_id}/accept", response_model=TaskResponse)
def accept_task_endpoint(
    task_id: UUID,
    payload: TaskAccept,
    db: Session = Depends(get_db)
):
    """
    Runner accepts a task.
    Enforces server-side trust tier value limits and ensures task is funded in escrow.
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found."
        )

    runner = db.query(Runner).filter(Runner.id == payload.runner_id).first()
    if not runner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Runner not found."
        )

    # Server-side Trust Tier Guard Check
    can_accept, reason = can_runner_accept_task(runner, task)
    if not can_accept:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=reason
        )

    task.runner_id = runner.id
    task.status = TaskStatus.ACCEPTED
    db.add(task)
    db.commit()
    db.refresh(task)

    # Broadcast: task accepted — customer sees runner assigned
    _broadcast_task(task)
    # Broadcast: task is taken — remove from available feed for other runners
    manager.broadcast_task_removed_sync(str(task.id))

    return task


@router.post("/{task_id}/status", response_model=TaskResponse)
def update_task_status(
    task_id: UUID,
    payload: TaskStatusUpdate,
    db: Session = Depends(get_db)
):
    """
    Advance task status through errand execution (IN_PROGRESS -> PICKED_UP -> DELIVERED).
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found."
        )

    # Valid progressive workflow states for runner
    valid_transitions = {
        TaskStatus.ACCEPTED: [TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED, TaskStatus.DISPUTED],
        TaskStatus.IN_PROGRESS: [TaskStatus.PICKED_UP, TaskStatus.CANCELLED, TaskStatus.DISPUTED],
        TaskStatus.PICKED_UP: [TaskStatus.DELIVERED, TaskStatus.DISPUTED],
        TaskStatus.DELIVERED: [TaskStatus.COMPLETED, TaskStatus.DISPUTED],
    }

    allowed = valid_transitions.get(task.status, [])
    if payload.status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot transition status from '{task.status.value}' to '{payload.status.value}'. Allowed transitions: {[s.value for s in allowed]}"
        )

    task.status = payload.status
    db.add(task)
    db.commit()
    db.refresh(task)

    # Broadcast: real-time status update to customer watching this task
    _broadcast_task(task)

    return task


@router.post("/{task_id}/confirm-delivery", response_model=TaskResponse)
def confirm_delivery_endpoint(task_id: UUID, db: Session = Depends(get_db)):
    """
    Customer confirms goods/package delivery.
    - Transitions task to COMPLETED
    - Releases escrow funds to runner wallet (payment_status = RELEASED)
    - Updates runner's completed tasks count & trust standing
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found."
        )

    if task.status not in (TaskStatus.DELIVERED, TaskStatus.PICKED_UP, TaskStatus.IN_PROGRESS):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot confirm delivery for task in '{task.status.value}' status."
        )

    task.status = TaskStatus.COMPLETED
    task = release_task_funds(db, task)

    # Recalculate runner trust tier & stats
    if task.runner:
        recalculate_runner_trust(db, task.runner)

    # Broadcast: task completed + funds released
    _broadcast_task(task)

    return task


@router.post("/{task_id}/rate", response_model=TaskResponse)
def rate_task_runner(
    task_id: UUID,
    payload: TaskRate,
    db: Session = Depends(get_db)
):
    """
    Customer submits a rating (1 to 5) and optional review for the runner.
    Server updates runner's rolling average trust score and automatically adjusts trust tier.
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found."
        )

    if task.status not in (TaskStatus.COMPLETED, TaskStatus.DELIVERED):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot rate runner until task is delivered or completed."
        )

    task.customer_rating = payload.customer_rating
    task.customer_review = payload.customer_review
    db.add(task)
    db.commit()
    db.refresh(task)

    # Recalculate runner trust and tier
    if task.runner:
        recalculate_runner_trust(db, task.runner)

    # Broadcast: rating submitted
    _broadcast_task(task)

    return task


@router.post("/{task_id}/dispute", response_model=TaskResponse)
def dispute_task_endpoint(
    task_id: UUID,
    payload: TaskDispute,
    db: Session = Depends(get_db)
):
    """
    Raise a dispute for a task.
    Freezes task in DISPUTED status; escrow funds remain held for admin resolution.
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found."
        )

    if task.status in (TaskStatus.COMPLETED, TaskStatus.CANCELLED):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot dispute a task that is already '{task.status.value}'."
        )

    task.status = TaskStatus.DISPUTED
    task.dispute_reason = payload.dispute_reason
    db.add(task)
    db.commit()
    db.refresh(task)

    # Broadcast: dispute raised
    _broadcast_task(task)

    return task


@router.post("/{task_id}/cancel", response_model=TaskResponse)
def cancel_task_endpoint(
    task_id: UUID,
    payload: Optional[TaskCancel] = None,
    db: Session = Depends(get_db)
):
    """
    Cancel a task. If task was funded, processes refund back to customer.
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found."
        )

    if task.status in (TaskStatus.COMPLETED, TaskStatus.CANCELLED):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Task cannot be cancelled in '{task.status.value}' status."
        )

    reason = payload.reason if payload else "Cancelled by user"
    if task.payment_status == PaymentStatus.FUNDED:
        task = refund_task_funds(db, task, reason=reason)
    else:
        task.status = TaskStatus.CANCELLED
        task.dispute_reason = reason
        db.add(task)
        db.commit()
        db.refresh(task)

    # Broadcast: task cancelled
    _broadcast_task(task)
    manager.broadcast_task_removed_sync(str(task.id))

    return task
