from datetime import datetime
from decimal import Decimal
from uuid import UUID
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from app.models.enums import TaskType, TaskStatus, PaymentStatus


class TaskBase(BaseModel):
    type: TaskType
    description: str
    pickup_address: str
    delivery_address: str
    estimated_goods_cost: Decimal = Field(default=Decimal("0.00"), ge=0)
    service_fee: Decimal = Field(default=Decimal("0.00"), ge=0)


class TaskCreate(TaskBase):
    customer_id: UUID


class TaskStatusUpdate(BaseModel):
    status: TaskStatus


class TaskAccept(BaseModel):
    runner_id: UUID


class TaskRate(BaseModel):
    customer_rating: int = Field(ge=1, le=5, description="Rating from 1 (poor) to 5 (excellent)")
    customer_review: Optional[str] = None


class TaskDispute(BaseModel):
    dispute_reason: str = Field(min_length=5, description="Reason for raising the dispute")


class TaskCancel(BaseModel):
    reason: Optional[str] = None


class TaskResponse(TaskBase):
    id: UUID
    status: TaskStatus
    customer_id: UUID
    runner_id: Optional[UUID] = None
    total_amount: Decimal
    payment_status: PaymentStatus
    customer_rating: Optional[int] = None
    customer_review: Optional[str] = None
    dispute_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
