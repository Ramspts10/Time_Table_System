"""
API V1 Main Router.
"""
from fastapi import APIRouter
from backend.app.api.v1.endpoints import (
    auth, faculty, courses, sections, rooms, periods, constraints, timetables, analytics, export
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(faculty.router, prefix="/faculty", tags=["Faculty"])
api_router.include_router(courses.router, prefix="/courses", tags=["Courses"])
api_router.include_router(sections.router, prefix="/sections", tags=["Sections"])
api_router.include_router(rooms.router, prefix="/rooms", tags=["Rooms"])
api_router.include_router(periods.router, prefix="/periods", tags=["Periods"])
api_router.include_router(constraints.router, prefix="/constraints", tags=["Constraints"])
api_router.include_router(timetables.router, prefix="/timetables", tags=["Timetables"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(export.router, prefix="/export", tags=["Export"])
