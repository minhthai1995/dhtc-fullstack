from fastapi import APIRouter

from app.api.v1 import (
    admin,
    auth,
    auth_facebook,
    customer,
    health,
    notifications,
    products,
    seller,
    tracking,
    users,
    webhooks,
    ws,
)

api_router = APIRouter(prefix="/v1")
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(auth_facebook.router)
api_router.include_router(users.router)
api_router.include_router(admin.router)
api_router.include_router(seller.router)
api_router.include_router(customer.router)
api_router.include_router(products.router)
api_router.include_router(notifications.router)
api_router.include_router(tracking.router)
api_router.include_router(webhooks.router)
api_router.include_router(ws.router)
