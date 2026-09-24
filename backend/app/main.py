from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
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
    }
