import uuid
from sqlalchemy import Column, String, Text, Integer, Numeric, DateTime, Enum, ForeignKey, Uuid, func
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.enums import TaskType, TaskStatus, PaymentStatus


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    type = Column(Enum(TaskType, native_enum=False), nullable=False)
    status = Column(Enum(TaskStatus, native_enum=False), default=TaskStatus.PENDING, nullable=False, index=True)

    customer_id = Column(Uuid(as_uuid=True), ForeignKey("customers.id"), nullable=False, index=True)
    runner_id = Column(Uuid(as_uuid=True), ForeignKey("runners.id"), nullable=True, index=True)

    description = Column(Text, nullable=False)
    pickup_address = Column(String(255), nullable=False)
    delivery_address = Column(String(255), nullable=False)

    estimated_goods_cost = Column(Numeric(12, 2), default=0.00, nullable=False)
    service_fee = Column(Numeric(12, 2), default=0.00, nullable=False)
    total_amount = Column(Numeric(12, 2), nullable=False)

    payment_status = Column(Enum(PaymentStatus, native_enum=False), default=PaymentStatus.UNFUNDED, nullable=False)

    customer_rating = Column(Integer, nullable=True)
    customer_review = Column(Text, nullable=True)
    dispute_reason = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    customer = relationship("Customer", back_populates="tasks")
    runner = relationship("Runner", back_populates="tasks")

    def __repr__(self) -> str:
        return f"<Task {self.id} [{self.type.value}] - {self.status.value} - ₦{self.total_amount:,.2f}>"
