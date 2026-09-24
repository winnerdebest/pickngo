import hashlib
from decimal import Decimal
from app.database import SessionLocal, engine, Base
from app.models.enums import TrustTier, TaskType, TaskStatus, PaymentStatus
from app.models.customer import Customer
from app.models.runner import Runner
from app.models.task import Task
from app.services.trust import get_max_task_value_for_tier


def hash_pw(pw: str) -> str:
    return hashlib.sha256(pw.encode("utf-8")).hexdigest()


def seed_database():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(Customer).first():
            print("Database already contains data. Skipping seed.")
            return

        print("Seeding demo customers...")
        c1 = Customer(
            full_name="Chidi Okafor",
            email="chidi.okafor@example.ng",
            phone="+2348031234567",
            hashed_password=hash_pw("securepass123"),
        )
        c2 = Customer(
            full_name="Amina Bello",
            email="amina.bello@example.ng",
            phone="+2348029876543",
            hashed_password=hash_pw("securepass123"),
        )
        c3 = Customer(
            full_name="Olumide Adeyemi",
            email="olumide.adeyemi@example.ng",
            phone="+2348055551212",
            hashed_password=hash_pw("securepass123"),
        )
        db.add_all([c1, c2, c3])
        db.flush()

        print("Seeding runners with different trust tiers...")
        # 1. Bronze Runner (New)
        r_bronze = Runner(
            full_name="Emeka Biker",
            email="emeka.runner@pickngo.ng",
            phone="+2348140000001",
            hashed_password=hash_pw("runnerpass123"),
            trust_score=3.0,
            trust_tier=TrustTier.BRONZE,
            completed_tasks=0,
            max_task_value=get_max_task_value_for_tier(TrustTier.BRONZE),
            is_active=True,
        )

        # 2. Silver Runner (15 tasks completed, 4.2 score)
        r_silver = Runner(
            full_name="Tunde Balogun",
            email="tunde.runner@pickngo.ng",
            phone="+2348140000002",
            hashed_password=hash_pw("runnerpass123"),
            trust_score=4.2,
            trust_tier=TrustTier.SILVER,
            completed_tasks=15,
            max_task_value=get_max_task_value_for_tier(TrustTier.SILVER),
            is_active=True,
        )

        # 3. Gold Runner (40 tasks completed, 4.7 score)
        r_gold = Runner(
            full_name="Fatima Garba",
            email="fatima.runner@pickngo.ng",
            phone="+2348140000003",
            hashed_password=hash_pw("runnerpass123"),
            trust_score=4.7,
            trust_tier=TrustTier.GOLD,
            completed_tasks=40,
            max_task_value=get_max_task_value_for_tier(TrustTier.GOLD),
            is_active=True,
        )

        db.add_all([r_bronze, r_silver, r_gold])
        db.flush()

        print("Seeding sample tasks (Supermarket Runs & Pickups)...")
        # Task 1: Low-value Supermarket run (₦8,500) - FUNDED (Bronze eligible)
        t1 = Task(
            type=TaskType.SUPERMARKET_RUN,
            status=TaskStatus.FUNDED,
            customer_id=c1.id,
            description="Buy 2 crates of eggs, Golden Terra oil, and 5kg rice from Shoprite Ikeja Mall",
            pickup_address="Shoprite, Ikeja City Mall, Alausa, Ikeja, Lagos",
            delivery_address="14 Adeniyi Jones Avenue, Ikeja, Lagos",
            estimated_goods_cost=Decimal("7000.00"),
            service_fee=Decimal("1500.00"),
            total_amount=Decimal("8500.00"),
            payment_status=PaymentStatus.FUNDED,
        )

        # Task 2: Medium-value Pickup (₦35,000) - FUNDED (Silver+ only)
        t2 = Task(
            type=TaskType.PICKUP,
            status=TaskStatus.FUNDED,
            customer_id=c2.id,
            description="Pick up electronics package from Jumia Yaba Hub (Ref: JM-992381)",
            pickup_address="Jumia Hub, 24 Commercial Avenue, Yaba, Lagos",
            delivery_address="Block B, 1004 Housing Estate, Victoria Island, Lagos",
            estimated_goods_cost=Decimal("30000.00"),
            service_fee=Decimal("5000.00"),
            total_amount=Decimal("35000.00"),
            payment_status=PaymentStatus.FUNDED,
        )

        # Task 3: High-value Supermarket run (₦120,000) - FUNDED (Gold+ only)
        t3 = Task(
            type=TaskType.SUPERMARKET_RUN,
            status=TaskStatus.FUNDED,
            customer_id=c3.id,
            description="Bulk grocery haul from Spar Lekki for weekend event",
            pickup_address="Spar Supermarket, Lekki Expressway, Lekki Phase 1, Lagos",
            delivery_address="Plot 12, Admiralty Way, Lekki Phase 1, Lagos",
            estimated_goods_cost=Decimal("110000.00"),
            service_fee=Decimal("10000.00"),
            total_amount=Decimal("120000.00"),
            payment_status=PaymentStatus.FUNDED,
        )

        # Task 4: In-progress run assigned to Tunde (Silver)
        t4 = Task(
            type=TaskType.PICKUP,
            status=TaskStatus.IN_PROGRESS,
            customer_id=c1.id,
            runner_id=r_silver.id,
            description="Pickup parcel from DHL Express Hub Surulere",
            pickup_address="DHL Express, Adeniran Ogunsanya, Surulere, Lagos",
            delivery_address="5 Bode Thomas Street, Surulere, Lagos",
            estimated_goods_cost=Decimal("12000.00"),
            service_fee=Decimal("2500.00"),
            total_amount=Decimal("14500.00"),
            payment_status=PaymentStatus.FUNDED,
        )

        # Task 5: Completed task with 5-star rating
        t5 = Task(
            type=TaskType.SUPERMARKET_RUN,
            status=TaskStatus.COMPLETED,
            customer_id=c2.id,
            runner_id=r_silver.id,
            description="Purchase fresh groceries from Prince Ebeano Supermarket Oniru",
            pickup_address="Prince Ebeano Supermarket, Oniru, Victoria Island, Lagos",
            delivery_address="Palms Court, Victoria Island, Lagos",
            estimated_goods_cost=Decimal("15000.00"),
            service_fee=Decimal("3000.00"),
            total_amount=Decimal("18000.00"),
            payment_status=PaymentStatus.RELEASED,
            customer_rating=5,
            customer_review="Super fast delivery, kept groceries in great condition!",
        )

        db.add_all([t1, t2, t3, t4, t5])
        db.commit()
        print("Database successfully seeded with realistic PickNGo Nigerian demo data!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
