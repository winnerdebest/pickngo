import hashlib
from typing import List
from uuid import UUID
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.enums import TrustTier, TaskStatus
from app.models.runner import Runner
from app.models.task import Task
from app.schemas.runner import RunnerCreate, RunnerUpdate, RunnerResponse
from app.schemas.task import TaskResponse
from app.services.trust import get_max_task_value_for_tier

router = APIRouter(prefix="/runners", tags=["Runners"])


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


@router.post("/", response_model=RunnerResponse, status_code=status.HTTP_201_CREATED)
def create_runner(payload: RunnerCreate, db: Session = Depends(get_db)):
    """Register a new delivery runner. New runners start at BRONZE tier with a ₦10,000 max task cap."""
    existing_email = db.query(Runner).filter(Runner.email == payload.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A runner with this email address already exists."
        )

    existing_phone = db.query(Runner).filter(Runner.phone == payload.phone).first()
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A runner with this phone number already exists."
        )

    initial_tier = TrustTier.BRONZE
    initial_cap = get_max_task_value_for_tier(initial_tier)

    runner = Runner(
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        hashed_password=hash_password(payload.password),
        trust_score=3.0,
        trust_tier=initial_tier,
        completed_tasks=0,
        max_task_value=initial_cap,
        is_active=True,
    )
    db.add(runner)
    db.commit()
    db.refresh(runner)
    return runner


@router.get("/", response_model=List[RunnerResponse])
def list_runners(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """List all runners."""
    runners = db.query(Runner).offset(skip).limit(limit).all()
    return runners


@router.get("/{runner_id}", response_model=RunnerResponse)
def get_runner(runner_id: UUID, db: Session = Depends(get_db)):
    """Get profile and trust metrics for a specific runner."""
    runner = db.query(Runner).filter(Runner.id == runner_id).first()
    if not runner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Runner not found."
        )
    return runner


@router.get("/{runner_id}/available-tasks", response_model=List[TaskResponse])
def get_available_tasks_for_runner(runner_id: UUID, db: Session = Depends(get_db)):
    """
    Returns the feed of tasks eligible for this runner.
    Server-side filter:
    1. Task must be in FUNDED status (escrow funded).
    2. Task must not already have an assigned runner.
    3. Task total_amount must NOT exceed the runner's max_task_value for their trust tier.
    """
    runner = db.query(Runner).filter(Runner.id == runner_id).first()
    if not runner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Runner not found."
        )

    if not runner.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Runner account is inactive."
        )

    runner_cap = Decimal(str(runner.max_task_value))

    # Query tasks that are FUNDED, unassigned, and within runner's value cap
    available_tasks = (
        db.query(Task)
        .filter(
            Task.status == TaskStatus.FUNDED,
            Task.runner_id.is_(None),
            Task.total_amount <= runner_cap,
        )
        .order_by(Task.created_at.asc())
        .all()
    )
    return available_tasks


@router.get("/{runner_id}/tasks", response_model=List[TaskResponse])
def get_runner_tasks(runner_id: UUID, db: Session = Depends(get_db)):
    """Get all tasks assigned to a specific runner."""
    runner = db.query(Runner).filter(Runner.id == runner_id).first()
    if not runner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Runner not found."
        )
    tasks = db.query(Task).filter(Task.runner_id == runner_id).order_by(Task.updated_at.desc()).all()
    return tasks


@router.patch("/{runner_id}", response_model=RunnerResponse)
def update_runner(runner_id: UUID, payload: RunnerUpdate, db: Session = Depends(get_db)):
    """Update runner profile information."""
    runner = db.query(Runner).filter(Runner.id == runner_id).first()
    if not runner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Runner not found."
        )

    if payload.full_name is not None:
        runner.full_name = payload.full_name
    if payload.phone is not None:
        runner.phone = payload.phone
    if payload.is_active is not None:
        runner.is_active = payload.is_active

    db.add(runner)
    db.commit()
    db.refresh(runner)
    return runner
