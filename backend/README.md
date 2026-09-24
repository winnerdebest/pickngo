# PickNGo Backend API 🛵🇳🇬

Backend service for **PickNGo** — a Nigerian bike-based delivery and errand execution app built with **FastAPI**, **SQLAlchemy**, and **PostgreSQL / SQLite**.

---

## 🚀 Key Features

1. **Two Core Errand Workflows (MVP Scope):**
   - **Supermarket-Gig Runs:** Runner purchases groceries/items from physical supermarkets and delivers them.
   - **Package Pickups:** Runner collects packages from hub stations (e.g. Jumia, DHL, local vendors) and delivers them to the customer.

2. **Server-Enforced Trust & Ranking System (Core Differentiator):**
   - New runners start at **Bronze tier** with a strict **₦10,000 max task cap**.
   - Rolling average trust score calculated over the runner's last 50 completed & rated tasks.
   - Automatic tier leveling and demotions based on performance thresholds.
   - High-value tasks are strictly locked server-side and invisible to runners below the required tier.

3. **Escrow-Style Payment Flow (Task-Scoped):**
   - Customer funds the task into platform escrow before any runner can accept it.
   - Runners are backed by in-app escrow funds rather than direct customer cash.
   - Funds release to runner payout balance only upon customer delivery confirmation.
   - Built-in dispute and cancellation/refund handling.
   - Modular payment adapter structure ready for instant drop-in of **Paystack** or **Flutterwave**.

4. **Built-in Admin Panel (SQLAdmin):**
   - Interactive web UI at `/admin` protected with session authentication.
   - Full search, filter, and CRUD for Customers, Runners, and Tasks.
   - **Manual Status Overrides:** Push tasks forward/backward through lifecycle states for rapid testing.
   - **Runner Metric Overrides:** Manually adjust trust tiers, scores, and task caps to simulate high-trust workflows without grinding real orders.

---

## 📊 Trust Tier Matrix

| Tier | Min Completed Tasks | Min Rolling Trust Score | Max Allowed Task Value (₦ NGN) |
|---|---|---|---|
| **BRONZE** | 0 | 0.0 | **₦10,000** |
| **SILVER** | 10 | 3.5 | **₦50,000** |
| **GOLD** | 30 | 4.0 | **₦150,000** |
| **PLATINUM** | 75 | 4.5 | **₦500,000** |

---

## 🛠 Tech Stack

- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
- **ORM:** [SQLAlchemy 2.0](https://www.sqlalchemy.org/)
- **Database:** SQLite (Local Dev) / Managed PostgreSQL (Production)
- **Admin Portal:** [SQLAdmin](https://aminalaee.dev/sqladmin/)
- **Deployment Target:** [Render](https://render.com/) (Web Service + Managed PostgreSQL via Blueprint)

---

## 💻 Local Development Setup

### 1. Prerequisites
- Python 3.10+ installed
- Git

### 2. Setup Virtual Environment
```bash
cd backend
python -m venv venv

# On Windows:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Copy the environment template:
```bash
cp .env.example .env
```
Default local variables:
```env
PROJECT_NAME="PickNGo API"
ENVIRONMENT="development"
DEBUG=True
DATABASE_URL="sqlite:///./pickngo.db"
SECRET_KEY="local-dev-secret-key"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="adminpassword123"
```

### 5. Seed Demo Data (Optional)
Populate the database with realistic Nigerian customers, tiered runners, and active errand tasks:
```bash
python seed.py
```

### 6. Run Development Server
```bash
uvicorn app.main:app --reload --port 8000
```

### 7. Access Web Interfaces
- **Interactive Swagger API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Documentation:** [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **SQLAdmin Management Dashboard:** [http://localhost:8000/admin](http://localhost:8000/admin)
  - Default Username: `admin`
  - Default Password: `adminpassword123` (configured in `.env`)

---

## 🧪 Running Automated Tests

Run the full end-to-end test suite:
```bash
pytest -v test_flows.py
```

---

## 🌐 Deploying to Render

This repository includes a turnkey **Render Blueprint** (`render.yaml`) that automatically provisions:
1. A **Managed PostgreSQL Database** (`pickngo-postgres`)
2. A **Python Web Service** (`pickngo-api`) with automatic database linking and secret generation

### Deployment Steps:
1. Push this repository to GitHub or GitLab.
2. In the [Render Dashboard](https://dashboard.render.com/), click **New +** -> **Blueprint**.
3. Connect your repository.
4. Render will detect `render.yaml` and configure the database and web service automatically.
5. In the Render Blueprint settings, specify the secret values for:
   - `ADMIN_USERNAME` (e.g. `pickngo_superadmin`)
   - `ADMIN_PASSWORD` (strong production password)
6. Click **Apply**. Render will build and deploy the app and PostgreSQL instance.

---

## 📡 API Endpoints Overview

### Customers (`/api/v1/customers`)
- `POST /` — Register a new customer
- `GET /` — List customers
- `GET /{id}` — Get customer details
- `PATCH /{id}` — Update profile
- `GET /{id}/tasks` — Get customer task history

### Runners (`/api/v1/runners`)
- `POST /` — Register a new runner (initializes at Bronze, ₦10,000 cap)
- `GET /` — List all runners
- `GET /{id}` — Get runner profile & trust statistics
- `GET /{id}/available-tasks` — Feed of tasks eligible for runner (filtered by trust cap)
- `GET /{id}/tasks` — Tasks assigned to runner
- `PATCH /{id}` — Update runner profile

### Tasks (`/api/v1/tasks`)
- `POST /` — Customer creates errand task (`PENDING`, `UNFUNDED`)
- `GET /` — List tasks with filters (`status`, `type`, `customer_id`, `runner_id`)
- `GET /{id}` — Get task details
- `POST /{id}/fund` — Customer funds task into escrow
- `POST /{id}/accept` — Runner accepts task (**Trust cap enforced server-side**)
- `POST /{id}/status` — Runner updates status (`IN_PROGRESS` -> `PICKED_UP` -> `DELIVERED`)
- `POST /{id}/confirm-delivery` — Customer confirms delivery (releases escrow to runner)
- `POST /{id}/rate` — Customer rates runner (1–5) -> triggers trust level recalculation
- `POST /{id}/dispute` — Raise a dispute (freezes escrow for admin review)
- `POST /{id}/cancel` — Cancel task (triggers automatic refund if funded)

### Payments & Webhooks (`/api/v1/payments`)
- `POST /webhook` — Paystack / Flutterwave transaction callback receiver
