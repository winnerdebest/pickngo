import enum


class TrustTier(str, enum.Enum):
    BRONZE = "BRONZE"
    SILVER = "SILVER"
    GOLD = "GOLD"
    PLATINUM = "PLATINUM"


class TaskType(str, enum.Enum):
    SUPERMARKET_RUN = "SUPERMARKET_RUN"
    PICKUP = "PICKUP"


class TaskStatus(str, enum.Enum):
    PENDING = "PENDING"
    FUNDED = "FUNDED"
    ACCEPTED = "ACCEPTED"
    IN_PROGRESS = "IN_PROGRESS"
    PICKED_UP = "PICKED_UP"
    DELIVERED = "DELIVERED"
    COMPLETED = "COMPLETED"
    DISPUTED = "DISPUTED"
    CANCELLED = "CANCELLED"


class PaymentStatus(str, enum.Enum):
    UNFUNDED = "UNFUNDED"
    FUNDED = "FUNDED"
    RELEASED = "RELEASED"
    REFUNDED = "REFUNDED"
