import uuid
from sqlalchemy import Column, String, Float, Integer, Numeric, Boolean, DateTime, Enum, Uuid, func
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.enums import TrustTier


class Runner(Base):
    __tablename__ = "runners"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    full_name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(20), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)

    trust_score = Column(Float, default=3.0, nullable=False)
    trust_tier = Column(Enum(TrustTier, native_enum=False), default=TrustTier.BRONZE, nullable=False)
    completed_tasks = Column(Integer, default=0, nullable=False)
    max_task_value = Column(Numeric(12, 2), default=10000.00, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    tasks = relationship("Task", back_populates="runner")

    def __repr__(self) -> str:
        return f"<Runner {self.full_name} ({self.trust_tier.value} - ₦{self.max_task_value:,.2f})>"
