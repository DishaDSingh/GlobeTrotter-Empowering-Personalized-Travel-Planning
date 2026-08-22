from fastapi import APIRouter

from . import activities, admin, ai, auth, destinations, shared, trips, users

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(destinations.router)
api_router.include_router(activities.router)
api_router.include_router(trips.router)
api_router.include_router(shared.router)
api_router.include_router(ai.router)
api_router.include_router(admin.router)
