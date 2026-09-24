import hashlib
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.customer import Customer
from app.models.task import Task
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse
from app.schemas.task import TaskResponse

router = APIRouter(prefix="/customers", tags=["Customers"])


def hash_password(password: str) -> str:
    """Simple sha256 hash for prototype / MVP."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


@router.post("/", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(payload: CustomerCreate, db: Session = Depends(get_db)):
    """Register a new customer account."""
    existing_email = db.query(Customer).filter(Customer.email == payload.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A customer with this email address already exists."
        )

    existing_phone = db.query(Customer).filter(Customer.phone == payload.phone).first()
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A customer with this phone number already exists."
        )

    customer = Customer(
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        hashed_password=hash_password(payload.password)
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@router.get("/", response_model=List[CustomerResponse])
def list_customers(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """List all registered customers."""
    customers = db.query(Customer).offset(skip).limit(limit).all()
    return customers


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: UUID, db: Session = Depends(get_db)):
    """Retrieve details for a specific customer."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found."
        )
    return customer


@router.patch("/{customer_id}", response_model=CustomerResponse)
def update_customer(customer_id: UUID, payload: CustomerUpdate, db: Session = Depends(get_db)):
    """Update customer profile information."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found."
        )

    if payload.full_name is not None:
        customer.full_name = payload.full_name
    if payload.phone is not None:
        customer.phone = payload.phone

    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@router.get("/{customer_id}/tasks", response_model=List[TaskResponse])
def get_customer_tasks(customer_id: UUID, db: Session = Depends(get_db)):
    """Get all tasks created by a specific customer."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found."
        )
    tasks = db.query(Task).filter(Task.customer_id == customer_id).order_by(Task.created_at.desc()).all()
    return tasks
