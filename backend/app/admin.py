from starlette.requests import Request
from starlette.responses import RedirectResponse
from sqladmin import Admin, ModelView
from sqladmin.authentication import AuthenticationBackend
from app.config import settings
from app.models.customer import Customer
from app.models.runner import Runner
from app.models.task import Task


class AdminAuth(AuthenticationBackend):
    """
    Session-based authentication for SQLAdmin dashboard.
    Gated behind ADMIN_USERNAME and ADMIN_PASSWORD environment variables.
    """

    async def login(self, request: Request) -> bool:
        form = await request.form()
        username = form.get("username")
        password = form.get("password")

        if username == settings.ADMIN_USERNAME and password == settings.ADMIN_PASSWORD:
            request.session.update({"token": "pickngo-admin-session-active"})
            return True
        return False

    async def logout(self, request: Request) -> bool:
        request.session.clear()
        return True

    async def authenticate(self, request: Request) -> bool:
        token = request.session.get("token")
        return token == "pickngo-admin-session-active"


class CustomerAdmin(ModelView, model=Customer):
    name = "Customer"
    name_plural = "Customers"
    icon = "fa-solid fa-users"

    column_list = [
        Customer.id,
        Customer.full_name,
        Customer.email,
        Customer.phone,
        Customer.created_at,
    ]
    column_searchable_list = [Customer.full_name, Customer.email, Customer.phone]
    column_sortable_list = [Customer.created_at, Customer.full_name, Customer.email]
    column_details_exclude_list = [Customer.hashed_password]
    form_excluded_columns = [Customer.tasks, Customer.created_at, Customer.updated_at]


class RunnerAdmin(ModelView, model=Runner):
    name = "Runner"
    name_plural = "Runners"
    icon = "fa-solid fa-motorcycle"

    column_list = [
        Runner.id,
        Runner.full_name,
        Runner.email,
        Runner.phone,
        Runner.trust_tier,
        Runner.trust_score,
        Runner.completed_tasks,
        Runner.max_task_value,
        Runner.is_active,
    ]
    column_searchable_list = [Runner.full_name, Runner.email, Runner.phone]
    column_sortable_list = [
        Runner.trust_score,
        Runner.completed_tasks,
        Runner.max_task_value,
        Runner.created_at,
    ]
    column_details_exclude_list = [Runner.hashed_password]
    # Allow full admin edit of trust parameters for rapid testing
    form_columns = [
        Runner.full_name,
        Runner.email,
        Runner.phone,
        Runner.trust_tier,
        Runner.trust_score,
        Runner.completed_tasks,
        Runner.max_task_value,
        Runner.is_active,
    ]


class TaskAdmin(ModelView, model=Task):
    name = "Task"
    name_plural = "Tasks"
    icon = "fa-solid fa-box"

    column_list = [
        Task.id,
        Task.type,
        Task.status,
        Task.customer,
        Task.runner,
        Task.total_amount,
        Task.payment_status,
        Task.customer_rating,
        Task.created_at,
    ]
    column_searchable_list = [Task.description, Task.pickup_address, Task.delivery_address]
    column_sortable_list = [Task.created_at, Task.status, Task.total_amount, Task.payment_status]
    # Allow manually advancing/reversing status & editing all task attributes
    form_columns = [
        Task.type,
        Task.status,
        Task.customer,
        Task.runner,
        Task.description,
        Task.pickup_address,
        Task.delivery_address,
        Task.estimated_goods_cost,
        Task.service_fee,
        Task.total_amount,
        Task.payment_status,
        Task.customer_rating,
        Task.customer_review,
        Task.dispute_reason,
    ]


def setup_admin(app, engine) -> Admin:
    """Configures and attaches SQLAdmin to the FastAPI application."""
    auth_backend = AdminAuth(secret_key=settings.SECRET_KEY)
    admin = Admin(
        app=app,
        engine=engine,
        title="PickNGo Admin Portal",
        authentication_backend=auth_backend,
        base_url="/admin",
    )

    admin.add_view(CustomerAdmin)
    admin.add_view(RunnerAdmin)
    admin.add_view(TaskAdmin)

    return admin
