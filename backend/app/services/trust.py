from decimal import Decimal
from typing import Tuple, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from app.models.enums import TrustTier, TaskStatus
from app.models.runner import Runner
from app.models.task import Task


# Tier Configuration: (tier, min_completed_tasks, min_trust_score, max_task_value)
TIER_CONFIG = [
    (TrustTier.PLATINUM, 75, 4.5, Decimal("500000.00")),
    (TrustTier.GOLD, 30, 4.0, Decimal("150000.00")),
    (TrustTier.SILVER, 10, 3.5, Decimal("50000.00")),
    (TrustTier.BRONZE, 0, 0.0, Decimal("10000.00")),
]

TIER_CAPS = {
    TrustTier.BRONZE: Decimal("10000.00"),
    TrustTier.SILVER: Decimal("50000.00"),
    TrustTier.GOLD: Decimal("150000.00"),
    TrustTier.PLATINUM: Decimal("500000.00"),
}


def get_max_task_value_for_tier(tier: TrustTier) -> Decimal:
    """Returns the maximum allowed task value (in NGN) for a given trust tier."""
    return TIER_CAPS.get(tier, Decimal("10000.00"))


def determine_tier(completed_tasks: int, trust_score: float) -> Tuple[TrustTier, Decimal]:
    """
    Evaluates completed tasks count and rolling trust score against tier criteria
    from highest tier to lowest tier. Returns the matching tier and max value cap.
    """
    for tier, min_tasks, min_score, max_val in TIER_CONFIG:
        if completed_tasks >= min_tasks and trust_score >= min_score:
            return tier, max_val
    return TrustTier.BRONZE, Decimal("10000.00")


def calculate_rolling_trust_score(db: Session, runner_id: UUID, window_size: int = 50) -> float:
    """
    Calculates the rolling average of customer ratings over the runner's last `window_size` rated tasks.
    If no ratings exist yet, defaults to 3.0.
    """
    stmt = (
        select(Task.customer_rating)
        .where(
            Task.runner_id == runner_id,
            Task.customer_rating.isnot(None),
            Task.status == TaskStatus.COMPLETED,
        )
        .order_by(desc(Task.updated_at))
        .limit(window_size)
    )
    ratings = db.scalars(stmt).all()

    if not ratings:
        return 3.0

    avg_score = sum(ratings) / len(ratings)
    return round(float(avg_score), 2)


def recalculate_runner_trust(db: Session, runner: Runner) -> Runner:
    """
    Updates a runner's completed tasks count, rolling trust score, trust tier,
    and max_task_value. Persists changes to the database.
    """
    # Count total completed tasks
    completed_count = db.query(Task).filter(
        Task.runner_id == runner.id,
        Task.status == TaskStatus.COMPLETED
    ).count()

    runner.completed_tasks = completed_count
    runner.trust_score = calculate_rolling_trust_score(db, runner.id)

    new_tier, max_val = determine_tier(runner.completed_tasks, runner.trust_score)
    runner.trust_tier = new_tier
    runner.max_task_value = max_val

    db.add(runner)
    db.commit()
    db.refresh(runner)
    return runner


def can_runner_accept_task(runner: Runner, task: Task) -> Tuple[bool, Optional[str]]:
    """
    Server-side acceptance guard enforcing:
    1. Runner must be active.
    2. Task must be in FUNDED status (escrow funded).
    3. Task total_amount must not exceed runner's tier-capped max_task_value.
    4. Task must not already be claimed.
    """
    if not runner.is_active:
        return False, "Runner account is inactive."

    if task.status != TaskStatus.FUNDED:
        return False, f"Task cannot be accepted in '{task.status.value}' status. It must be 'FUNDED' by the customer first."

    if task.runner_id is not None:
        return False, "Task has already been accepted by another runner."

    task_amount = Decimal(str(task.total_amount))
    runner_cap = Decimal(str(runner.max_task_value))

    if task_amount > runner_cap:
        return (
            False,
            f"Task value (₦{task_amount:,.2f}) exceeds your current trust tier cap (₦{runner_cap:,.2f} - {runner.trust_tier.value}). Level up by completing more tasks with high ratings to unlock higher-value tasks."
        )

    return True, None
