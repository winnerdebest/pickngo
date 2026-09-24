from datetime import datetime
from decimal import Decimal
from uuid import UUID
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict
from app.models.enums import TrustTier


class RunnerBase(BaseModel):
    full_name: str
    email: EmailStr
    phone: str


class RunnerCreate(RunnerBase):
    password: str


class RunnerUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None


class RunnerAdminUpdate(BaseModel):
    trust_tier: Optional[TrustTier] = None
    trust_score: Optional[float] = None
    max_task_value: Optional[Decimal] = None
    is_active: Optional[bool] = None


class RunnerResponse(RunnerBase):
    id: UUID
    trust_score: float
    trust_tier: TrustTier
    completed_tasks: int
    max_task_value: Decimal
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
