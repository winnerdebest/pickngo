from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.config import settings
from app.database import engine, Base, get_db
import app.models  # Ensure all models are registered with Base.metadata
from app.routers import (
    customers_router,
    runners_router,
    tasks_router,
    payments_router,
)
from app.admin import setup_admin
from app.ws import manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize tables on startup
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "Backend API for PickNGo — Nigerian bike-based delivery and errand app "
        "featuring server-side trust tier enforcement and task-scoped payment escrow."
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 Routers
app.include_router(customers_router, prefix=settings.API_V1_STR)
app.include_router(runners_router, prefix=settings.API_V1_STR)
app.include_router(tasks_router, prefix=settings.API_V1_STR)
app.include_router(payments_router, prefix=settings.API_V1_STR)

# Mount SQLAdmin Portal
admin = setup_admin(app, engine)


@app.get("/", tags=["Health"])
def root():
    """Root endpoint providing service metadata and portal links."""
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "healthy",
        "docs": "/docs",
        "admin": "/admin",
    }


@app.get("/health", tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    """
    Health check endpoint for Render, load balancers, and uptime monitors.
    Verifies service status and live database connectivity.
    """
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unreachable: {str(e)}"

    return {
        "status": "ok" if db_status == "connected" else "degraded",
        "database": db_status,
        "environment": settings.ENVIRONMENT,
        "version": settings.VERSION,
        "ws_connections": manager.get_active_connections_count(),
    }


# --- WebSocket Endpoints ---

@app.websocket("/ws/tasks/{task_id}")
async def websocket_task_tracker(websocket: WebSocket, task_id: str):
    """
    WebSocket endpoint for real-time task status updates.
    Mobile clients connect here to receive instant status/payment changes
    instead of polling the REST API.

    Connect: ws://host/ws/tasks/{task_id}
    Messages received (JSON):
        {"type": "task_update", "task": { ...full task object... }}
    """
    await manager.connect(task_id, websocket)
    try:
        while True:
            # Keep connection alive; client can send pings or we just wait
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(task_id, websocket)


@app.websocket("/ws/available-tasks")
async def websocket_available_tasks(websocket: WebSocket):
    """
    WebSocket endpoint for runners to receive real-time notifications
    when new tasks become FUNDED and available for acceptance.

    Connect: ws://host/ws/available-tasks
    Messages received (JSON):
        {"type": "new_task_available", "task": { ...full task object... }}
    """
    await manager.connect("available-tasks", websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect("available-tasks", websocket)
