from app.routers.customers import router as customers_router
from app.routers.runners import router as runners_router
from app.routers.tasks import router as tasks_router
from app.routers.payments import router as payments_router

__all__ = [
    "customers_router",
    "runners_router",
    "tasks_router",
    "payments_router",
]
