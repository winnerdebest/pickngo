import uuid
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.enums import TaskStatus, PaymentStatus
from app.models.task import Task


class PaymentGatewayStub:
    """
    Escrow payment gateway adapter.
    Structured so that a real Nigerian payment provider (Paystack / Flutterwave)
    can replace the stub implementation seamlessly.
    """

    @staticmethod
    def initialize_transaction(amount: float, email: str, task_id: str) -> Dict[str, Any]:
        """
        TODO: Integrate Paystack Standard or Flutterwave Charge API.
        Example:
            response = paystack.transaction.initialize(
                reference=f"PNG-{task_id}-{uuid.uuid4().hex[:6]}",
                amount=int(amount * 100), # in kobo
                email=email,
                metadata={"task_id": task_id}
            )
        """
        mock_reference = f"MOCK-PNG-{task_id[:8]}-{uuid.uuid4().hex[:6]}"
        return {
            "status": "success",
            "message": "Payment initialized (Escrow Hold simulation)",
            "reference": mock_reference,
            "authorization_url": f"https://mock-checkout.pickngo.ng/pay/{mock_reference}",
            "amount": amount,
        }

    @staticmethod
    def verify_transaction(reference: str) -> bool:
        """
        TODO: Call Paystack /transaction/verify/{reference} or Flutterwave /transactions/{id}/verify
        """
        # For MVP stub, all mock references are treated as verified
        return True

    @staticmethod
    def transfer_to_runner_wallet(runner_id: str, amount: float, task_id: str) -> Dict[str, Any]:
        """
        TODO: Call Paystack Transfers API or Flutterwave Transfer to runner's Nigerian bank account or in-app wallet.
        """
        return {
            "status": "success",
            "message": f"₦{amount:,.2f} released to runner wallet for task {task_id}",
            "transfer_code": f"TRF-{uuid.uuid4().hex[:8]}",
        }

    @staticmethod
    def process_refund(customer_id: str, amount: float, task_id: str) -> Dict[str, Any]:
        """
        TODO: Call Paystack Refund API or Flutterwave Refund.
        """
        return {
            "status": "success",
            "message": f"₦{amount:,.2f} refunded to customer for task {task_id}",
            "refund_id": f"REF-{uuid.uuid4().hex[:8]}",
        }


def fund_task(db: Session, task: Task, reference: Optional[str] = None) -> Task:
    """
    Holds task funds in escrow. Once funded, the task is visible and claimable by runners.
    """
    if task.payment_status == PaymentStatus.FUNDED:
        return task

    # Set escrow funded
    task.payment_status = PaymentStatus.FUNDED
    if task.status == TaskStatus.PENDING:
        task.status = TaskStatus.FUNDED

    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def release_task_funds(db: Session, task: Task) -> Task:
    """
    Releases escrowed funds to the runner upon confirmed delivery.
    """
    if task.payment_status == PaymentStatus.RELEASED:
        return task

    # Trigger payout adapter
    PaymentGatewayStub.transfer_to_runner_wallet(
        runner_id=str(task.runner_id),
        amount=float(task.total_amount),
        task_id=str(task.id),
    )

    task.payment_status = PaymentStatus.RELEASED
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def refund_task_funds(db: Session, task: Task, reason: Optional[str] = None) -> Task:
    """
    Refunds escrowed funds back to the customer if task is cancelled or dispute resolved.
    """
    PaymentGatewayStub.process_refund(
        customer_id=str(task.customer_id),
        amount=float(task.total_amount),
        task_id=str(task.id),
    )

    task.payment_status = PaymentStatus.REFUNDED
    task.status = TaskStatus.CANCELLED
    if reason:
        task.dispute_reason = reason

    db.add(task)
    db.commit()
    db.refresh(task)
    return task
