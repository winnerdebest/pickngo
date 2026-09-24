# PickNGo Backend — Architecture & System Documentation (AGENT.md)

## 1. Project Purpose
PickNGo is a Nigerian bike-based delivery and errand execution platform designed for fast, reliable local logistics. The initial MVP focuses on two core errand/task archetypes:
1. **Supermarket-Gig Runs:** Runner purchases groceries or household items from a specified store and delivers them to the customer.
2. **Package Pickups:** Runner collects a package/parcel from a designated pickup hub or vendor station (e.g., Jumia, DHL, local merchant) and delivers it to the customer.

A core business differentiator is PickNGo's **Server-Enforced Trust & Ranking System**, which mitigates risk by tying the maximum monetary value of tasks a runner can accept to their verified performance history and customer trust score. Furthermore, an **escrow-style, task-scoped payment model** guarantees that runners never handle direct customer cash for goods purchase, and payouts are unlocked only upon verified customer delivery.

---

## 2. System Architecture & Tech Stack

- **Framework:** FastAPI (Python 3.10+)
- **ORM & Database Abstraction:** SQLAlchemy 2.0 (declarative mapping)
- **Database:**
  - **Local Development:** SQLite (`sqlite:///./pickngo.db`)
  - **Production Deployment:** PostgreSQL on Render (`render.yaml` managed Postgres)
- **Admin Panel:** SQLAdmin (FastAPI/Starlette-compatible admin interface with session-based authentication)
- **Settings & Config:** `pydantic-settings` / `python-dotenv` reading environment variables
- **Hosting / Deploy Target:** Render Web Service + Render PostgreSQL database

### Directory Layout
```
PICKNGO/
├── AGENT.md                  # Single source of truth for architecture and system specs
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py           # FastAPI app instance, middleware, router & SQLAdmin mount
│   │   ├── config.py         # App settings & env configuration
│   │   ├── database.py        # SQLAlchemy engine, session factory, Base
│   │   ├── models/           # SQLAlchemy ORM models
│   │   │   ├── __init__.py   # Exposes Base and all models for SQLAdmin and metadata
│   │   │   ├── customer.py   # Customer entity
│   │   │   ├── runner.py     # Runner entity & trust metrics
│   │   │   └── task.py       # Task entity, lifecycle enums, ratings & escrow state
│   │   ├── schemas/          # Pydantic validation & response models
│   │   │   ├── __init__.py
│   │   │   ├── customer.py
│   │   │   ├── runner.py
│   │   │   ├── task.py
│   │   │   └── payment.py
│   │   ├── services/         # Core business logic
│   │   │   ├── __init__.py
│   │   │   ├── trust.py      # Trust tier calculation, rolling average, acceptance guard
│   │   │   └── payment.py    # Escrow state manager & stubbed Paystack/Flutterwave gateway
│   │   ├── routers/          # FastAPI API route handlers
│   │   │   ├── __init__.py
│   │   │   ├── customers.py  # Customer registration & profile
│   │   │   ├── runners.py    # Runner registration, profile, eligible task feed
│   │   │   ├── tasks.py      # Task creation, lifecycle transitions, delivery & ratings
│   │   │   └── payments.py   # Webhook stubs for payment events
│   │   └── admin.py          # SQLAdmin ModelViews & AdminAuth backend
│   ├── render.yaml           # Infrastructure-as-Code for Render deployment
│   ├── .env.example          # Environment variables template
│   ├── requirements.txt      # Python dependencies
│   └── README.md             # Local setup & deployment guide
```

---

## 3. Data Models & Relationships

### 3.1 Customer (`customers`)
Represents users requesting errand or delivery services.
- `id` (UUID, Primary Key): Unique customer identifier (UUIDv4)
- `full_name` (String(120), Not Null): Customer full name
- `email` (String(255), Unique, Indexed, Not Null): Email address
- `phone` (String(20), Unique, Indexed, Not Null): Phone number (e.g., Nigerian MSISDN format)
- `hashed_password` (String(255), Not Null): Password hash
- `created_at` (DateTime, UTC): Record creation timestamp
- `updated_at` (DateTime, UTC): Record update timestamp
- **Relationships:**
  - `tasks` (One-to-Many with `Task`): All tasks posted by this customer

### 3.2 Runner (`runners`)
Represents bike delivery agents executing tasks.
- `id` (UUID, Primary Key): Unique runner identifier (UUIDv4)
- `full_name` (String(120), Not Null): Runner full name
- `email` (String(255), Unique, Indexed, Not Null): Email address
- `phone` (String(20), Unique, Indexed, Not Null): Phone number
- `hashed_password` (String(255), Not Null): Password hash
- `trust_score` (Float, Default 3.0): Rolling average rating on a 1.0–5.0 scale
- `trust_tier` (Enum: `BRONZE`, `SILVER`, `GOLD`, `PLATINUM`, Default `BRONZE`): Current trust standing
- `completed_tasks` (Integer, Default 0): Total count of successfully completed tasks
- `max_task_value` (Numeric(12, 2), Default 10000.00): Maximum allowed task monetary value (₦)
- `is_active` (Boolean, Default True): Runner account status
- `created_at` (DateTime, UTC): Record creation timestamp
- `updated_at` (DateTime, UTC): Record update timestamp
- **Relationships:**
  - `tasks` (One-to-Many with `Task`): Tasks accepted and handled by this runner

### 3.3 Task (`tasks`)
Represents an individual supermarket-gig or pickup errand.
- `id` (UUID, Primary Key): Unique task identifier (UUIDv4)
- `type` (Enum: `SUPERMARKET_RUN`, `PICKUP`, Not Null): Errand archetype
- `status` (Enum: `PENDING`, `FUNDED`, `ACCEPTED`, `IN_PROGRESS`, `PICKED_UP`, `DELIVERED`, `COMPLETED`, `DISPUTED`, `CANCELLED`, Default `PENDING`): Current lifecycle state
- `customer_id` (UUID, FK -> `customers.id`, Not Null): Owner customer
- `runner_id` (UUID, FK -> `runners.id`, Nullable): Assigned runner
- `description` (Text, Not Null): Task requirements or item list
- `pickup_address` (String(255), Not Null): Source location (supermarket or hub)
- `delivery_address` (String(255), Not Null): Destination drop-off location
- `estimated_goods_cost` (Numeric(12, 2), Default 0.00): Value of goods to purchase
- `service_fee` (Numeric(12, 2), Default 0.00): PickNGo platform fee + delivery charge
- `total_amount` (Numeric(12, 2), Not Null): `estimated_goods_cost + service_fee`
- `payment_status` (Enum: `UNFUNDED`, `FUNDED`, `RELEASED`, `REFUNDED`, Default `UNFUNDED`): Escrow status
- `customer_rating` (Integer 1–5, Nullable): Rating submitted by customer post-delivery
- `customer_review` (Text, Nullable): Optional feedback note
- `dispute_reason` (Text, Nullable): Detail if marked as disputed
- `created_at` (DateTime, UTC): Task creation timestamp
- `updated_at` (DateTime, UTC): Task update timestamp
- **Relationships:**
  - `customer` (Many-to-One with `Customer`)
  - `runner` (Many-to-One with `Runner`)

---

## 4. Trust & Ranking System Rules

The trust engine in `services/trust.py` governs access to tasks based on runner reliability.

### 4.1 Tier Thresholds & Task Value Limits
| Tier | Min Completed Tasks | Min Trust Score (1–5) | Max Allowed Task Value (₦ NGN) |
|---|---|---|---|
| **BRONZE** | 0 | 0.0 | ₦10,000 |
| **SILVER** | 10 | 3.5 | ₦50,000 |
| **GOLD** | 30 | 4.0 | ₦150,000 |
| **PLATINUM** | 75 | 4.5 | ₦500,000 |

### 4.2 Algorithm & Rules
1. **Initial State:** New runners start at `BRONZE` with a default `trust_score = 3.0` and `max_task_value = 10,000.00`.
2. **Rolling Average Trust Score:** Calculated across the runner's most recent **50 rated tasks**.
   $$\text{Trust Score} = \frac{\sum_{i=1}^{N \le 50} \text{Rating}_i}{N}$$
3. **Promotion:** When a task completes and is rated, the system recalculates trust score and increments `completed_tasks`. If both criteria for a higher tier are met, the runner is automatically upgraded, and their `max_task_value` is updated.
4. **Demotion Protection & Penalties:** If poor ratings drive a runner's rolling score below the tier's minimum threshold, the runner is demoted to the highest qualifying tier (down to `BRONZE`), immediately capping their future task eligibility.
5. **Enforcement on Task Acceptance:** When a runner attempts `POST /api/v1/tasks/{id}/accept`:
   - Task `total_amount` must be $\le$ `runner.max_task_value`.
   - Task must currently be in `FUNDED` status.
   - If violated, the server raises HTTP 403 Forbidden.

---

## 5. Task Lifecycle & Payment Escrow Flow

### 5.1 Lifecycle State Machine
```
[ PENDING ] ──(Customer Funds Task)──▶ [ FUNDED ] ──(Runner Accepts)──▶ [ ACCEPTED ]
                                                                             │
[ COMPLETED ] ◀──(Customer Confirms)── [ DELIVERED ] ◀── [ PICKED_UP ] ◀── [ IN_PROGRESS ]
      │                                       ▲
  (Release                                    │
   Escrow)                              (Dispute Raised)
                                              ▼
                                        [ DISPUTED ]
```

### 5.2 Payment Escrow Mechanism
- **Task Creation:** Task created in `PENDING` status with `payment_status = UNFUNDED`.
- **Funding (Escrow Hold):** Customer initiates funding (`POST /tasks/{id}/fund`). In production, this verifies a Paystack/Flutterwave transaction webhook. In MVP stub, it marks `payment_status = FUNDED` and task status `FUNDED`.
- **Task-Scoped Wallet / Funds:** Runner is assigned the task; goods cost is guaranteed by the platform's escrow holding. Runner does not ask or handle customer cash.
- **Delivery Confirmation & Fund Release:** Customer calls `POST /tasks/{id}/confirm-delivery`, transitioning status to `COMPLETED` and triggering `services/payment.release_funds()`, setting `payment_status = RELEASED`.
- **Dispute Flow:** If a dispute arises (`POST /tasks/{id}/dispute`), funds remain frozen in escrow (`FUNDED`) and task is marked `DISPUTED` for admin intervention.

---

## 6. Admin Panel Capabilities (SQLAdmin)
- Gated behind `ADMIN_USERNAME` and `ADMIN_PASSWORD` (configured in environment variables).
- ModelViews for `Customer`, `Runner`, and `Task`.
- Provides full search, filtering, and manual status override:
  - Can force task status forward or backward for integration and manual testing.
  - Can manually edit a runner's `trust_tier`, `trust_score`, and `max_task_value` to test high-trust flows without mock-completing dozens of tasks.

---

## 7. Key Decisions & Change Log
- **2026-09-24 Initial Architecture:** Initialized standard FastAPI structure with SQLite (dev) / PostgreSQL (prod), SQLAdmin integration, 4-tier trust engine with rolling 50-task average, and task-scoped payment escrow stub.
- **2026-09-24 WebSocket Real-Time Updates:** Added `app/ws.py` (ConnectionManager) and two WebSocket endpoints: `ws://.../ws/tasks/{task_id}` for per-task live status tracking (customers & runners), and `ws://.../ws/available-tasks` for runner feed notifications when new tasks become FUNDED. Every task status mutation in `routers/tasks.py` now broadcasts to connected WebSocket clients via fire-and-forget `asyncio.create_task()`. Gracefully degrades during tests (no running event loop).
- **2026-09-24 Mobile App (Expo & React Native):** Built complete cross-platform mobile application in `/mobile` with Expo Router file-based navigation, Charcoal (`#1A1A1A`) and Coral (`#FF6F59`) design system, `AuthContext` backed by `expo-secure-store`, Axios client connected to live Render backend (`https://pickngo.onrender.com`), real-time WebSockets for live errand tracking and available task feeds, 14 screens spanning Customer creation-to-rating and Runner accept-to-delivery loops.
