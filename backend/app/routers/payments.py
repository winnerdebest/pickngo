from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.enums import PaymentStatus, TaskStatus
from app.models.task import Task
from app.schemas.payment import WebhookEventPayload
from app.services.payment import fund_task

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/webhook", status_code=status.HTTP_200_OK)
def payment_webhook(payload: WebhookEventPayload, db: Session = Depends(get_db)):
    """
    Webhook receiver for Paystack or Flutterwave callbacks.
    Handles events such as:
    - `charge.success`: marks task as FUNDED
    - `transfer.success`: logs payout confirmation
    """
    event_type = payload.event
    event_data = payload.data

    if event_type in ("charge.success", "payment.successful"):
        metadata = event_data.get("metadata", {})
        task_id = metadata.get("task_id") or event_data.get("tx_ref")
        if task_id:
            task = db.query(Task).filter(Task.id == task_id).first()
            if task and task.payment_status == PaymentStatus.UNFUNDED:
                fund_task(db, task, reference=event_data.get("reference"))

    return {"status": "success", "event_received": event_type}
