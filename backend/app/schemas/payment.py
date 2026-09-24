from decimal import Decimal
from uuid import UUID
from typing import Optional
from pydantic import BaseModel
from app.models.enums import PaymentStatus


class FundTaskRequest(BaseModel):
    payment_reference: Optional[str] = None


class FundTaskResponse(BaseModel):
    task_id: UUID
    payment_status: PaymentStatus
    amount: Decimal
    reference: str
    authorization_url: Optional[str] = None
    message: str


class ReleaseFundsResponse(BaseModel):
    task_id: UUID
    payment_status: PaymentStatus
    amount_released: Decimal
    message: str


class WebhookEventPayload(BaseModel):
    event: str
    data: dict
