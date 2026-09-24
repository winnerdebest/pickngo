import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.database import Base, get_db
from app.models.enums import TrustTier, TaskType, TaskStatus, PaymentStatus
from app.models.customer import Customer
from app.models.runner import Runner
from app.models.task import Task

# Isolated SQLite in-memory engine for lightning-fast tests
TEST_DB_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_database():
    """Reset isolated test database before each test."""
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    yield


def test_customer_registration_and_retrieval():
    payload = {
        "full_name": "Babajide Sanwo",
        "email": "jide@example.ng",
        "phone": "+2348011223344",
        "password": "mypassword123"
    }
    response = client.post("/api/v1/customers/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["full_name"] == payload["full_name"]
    assert data["email"] == payload["email"]
    assert "id" in data

    # Retrieve
    cust_id = data["id"]
    get_res = client.get(f"/api/v1/customers/{cust_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == cust_id


def test_runner_registration_and_initial_trust_tier():
    payload = {
        "full_name": "Segun Biker",
        "email": "segun@pickngo.ng",
        "phone": "+2348099887766",
        "password": "bikerpassword"
    }
    response = client.post("/api/v1/runners/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["trust_tier"] == "BRONZE"
    assert data["trust_score"] == 3.0
    assert data["completed_tasks"] == 0
    assert float(data["max_task_value"]) == 10000.00


def test_task_creation_funding_and_trust_cap_enforcement():
    # 1. Create Customer
    c_res = client.post("/api/v1/customers/", json={
        "full_name": "Funke Akindele",
        "email": "funke@example.ng",
        "phone": "+2348055443322",
        "password": "password"
    })
    cust_id = c_res.json()["id"]

    # 2. Create Runner (Bronze Tier, cap = ₦10,000)
    r_res = client.post("/api/v1/runners/", json={
        "full_name": "Kazeem Runner",
        "email": "kazeem@pickngo.ng",
        "phone": "+2348066778899",
        "password": "password"
    })
    runner_id = r_res.json()["id"]

    # 3. Create a Low-Value Supermarket Task (₦6,000 total - within Bronze cap)
    t1_res = client.post("/api/v1/tasks/", json={
        "type": "SUPERMARKET_RUN",
        "customer_id": cust_id,
        "description": "Carton of Indomie and eggs from Shoprite Surulere",
        "pickup_address": "Shoprite Surulere",
        "delivery_address": "10 Adelabu Street, Surulere",
        "estimated_goods_cost": 4500.00,
        "service_fee": 1500.00
    })
    assert t1_res.status_code == 201
    t1_data = t1_res.json()
    t1_id = t1_data["id"]
    assert t1_data["status"] == "PENDING"
    assert t1_data["payment_status"] == "UNFUNDED"
    assert float(t1_data["total_amount"]) == 6000.00

    # 4. Create a High-Value Pickup Task (₦45,000 total - exceeds Bronze cap ₦10k)
    t2_res = client.post("/api/v1/tasks/", json={
        "type": "PICKUP",
        "customer_id": cust_id,
        "description": "Phone pickup from Slot Ikeja",
        "pickup_address": "Slot Ikeja, Medical Road",
        "delivery_address": "Opebi, Ikeja",
        "estimated_goods_cost": 40000.00,
        "service_fee": 5000.00
    })
    assert t2_res.status_code == 201
    t2_id = t2_res.json()["id"]

    # 5. Fund both tasks
    fund1 = client.post(f"/api/v1/tasks/{t1_id}/fund")
    assert fund1.status_code == 200
    assert fund1.json()["payment_status"] == "FUNDED"

    fund2 = client.post(f"/api/v1/tasks/{t2_id}/fund")
    assert fund2.status_code == 200
    assert fund2.json()["payment_status"] == "FUNDED"

    # 6. Check runner's available tasks feed (Bronze runner should ONLY see t1, not t2)
    feed_res = client.get(f"/api/v1/runners/{runner_id}/available-tasks")
    assert feed_res.status_code == 200
    available_ids = [t["id"] for t in feed_res.json()]
    assert t1_id in available_ids
    assert t2_id not in available_ids

    # 7. Attempt to accept High-Value Task (t2) -> Must be rejected with 403 Forbidden
    accept_high = client.post(f"/api/v1/tasks/{t2_id}/accept", json={"runner_id": runner_id})
    assert accept_high.status_code == 403
    assert "exceeds your current trust tier cap" in accept_high.json()["detail"]

    # 8. Accept Low-Value Task (t1) -> Must succeed
    accept_low = client.post(f"/api/v1/tasks/{t1_id}/accept", json={"runner_id": runner_id})
    assert accept_low.status_code == 200
    assert accept_low.json()["status"] == "ACCEPTED"
    assert accept_low.json()["runner_id"] == runner_id

    # 9. Advance task status: IN_PROGRESS -> PICKED_UP -> DELIVERED
    s1 = client.post(f"/api/v1/tasks/{t1_id}/status", json={"status": "IN_PROGRESS"})
    assert s1.status_code == 200
    assert s1.json()["status"] == "IN_PROGRESS"

    s2 = client.post(f"/api/v1/tasks/{t1_id}/status", json={"status": "PICKED_UP"})
    assert s2.status_code == 200
    assert s2.json()["status"] == "PICKED_UP"

    s3 = client.post(f"/api/v1/tasks/{t1_id}/status", json={"status": "DELIVERED"})
    assert s3.status_code == 200
    assert s3.json()["status"] == "DELIVERED"

    # 10. Customer confirms delivery -> status=COMPLETED, payment_status=RELEASED
    confirm_res = client.post(f"/api/v1/tasks/{t1_id}/confirm-delivery")
    assert confirm_res.status_code == 200
    assert confirm_res.json()["status"] == "COMPLETED"
    assert confirm_res.json()["payment_status"] == "RELEASED"

    # 11. Customer rates runner 5 stars -> Updates runner metrics
    rate_res = client.post(f"/api/v1/tasks/{t1_id}/rate", json={
        "customer_rating": 5,
        "customer_review": "Excellent and punctual errand service!"
    })
    assert rate_res.status_code == 200
    assert rate_res.json()["customer_rating"] == 5

    # Check updated runner profile
    runner_profile = client.get(f"/api/v1/runners/{runner_id}").json()
    assert runner_profile["completed_tasks"] == 1
    assert runner_profile["trust_score"] == 5.0


def test_dispute_and_cancel_flows():
    # Setup Customer and Task
    c_res = client.post("/api/v1/customers/", json={
        "full_name": "Titi Abubakar",
        "email": "titi@example.ng",
        "phone": "+2348077665544",
        "password": "password"
    })
    cust_id = c_res.json()["id"]

    t_res = client.post("/api/v1/tasks/", json={
        "type": "PICKUP",
        "customer_id": cust_id,
        "description": "Package pickup from DHL",
        "pickup_address": "DHL Ikeja",
        "delivery_address": "Alausa, Ikeja",
        "estimated_goods_cost": 5000.00,
        "service_fee": 1500.00
    })
    task_id = t_res.json()["id"]

    # Fund task
    client.post(f"/api/v1/tasks/{task_id}/fund")

    # Raise dispute
    disp_res = client.post(f"/api/v1/tasks/{task_id}/dispute", json={
        "dispute_reason": "Wrong item was picked from the vendor station."
    })
    assert disp_res.status_code == 200
    assert disp_res.json()["status"] == "DISPUTED"
    assert disp_res.json()["payment_status"] == "FUNDED"  # Funds locked in escrow during dispute

    # Cancel task with refund
    cancel_res = client.post(f"/api/v1/tasks/{task_id}/cancel", json={
        "reason": "Dispute resolved by admin with customer refund"
    })
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "CANCELLED"
    assert cancel_res.json()["payment_status"] == "REFUNDED"


def test_tier_progression_logic():
    from app.services.trust import determine_tier
    # Bronze: 0 tasks, 3.0 score
    tier, cap = determine_tier(0, 3.0)
    assert tier == TrustTier.BRONZE
    assert cap == Decimal("10000.00")

    # Silver: 10 tasks, 3.8 score
    tier, cap = determine_tier(10, 3.8)
    assert tier == TrustTier.SILVER
    assert cap == Decimal("50000.00")

    # Gold: 35 tasks, 4.2 score
    tier, cap = determine_tier(35, 4.2)
    assert tier == TrustTier.GOLD
    assert cap == Decimal("150000.00")

    # Platinum: 80 tasks, 4.8 score
    tier, cap = determine_tier(80, 4.8)
    assert tier == TrustTier.PLATINUM
    assert cap == Decimal("500000.00")

    # Demotion case: 80 tasks but score dropped to 3.2 -> Demoted from Platinum/Gold to Bronze (since Silver requires 3.5)
    tier, cap = determine_tier(80, 3.2)
    assert tier == TrustTier.BRONZE
    assert cap == Decimal("10000.00")
