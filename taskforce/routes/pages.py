from fastapi import APIRouter, Request
from fastapi.responses import FileResponse, HTMLResponse

from taskforce.presentation import PROJECT_DIRECTORY, templates
from taskforce.view_models.page import page_context

router = APIRouter()


@router.get("/", name="dashboard")
async def dashboard(request: Request) -> HTMLResponse:
    return templates.TemplateResponse(
        request=request,
        name="features/dashboard.html",
        context=page_context(
            request,
            "Dashboard",
            "A clean Python foundation for the TaskForce workspace.",
        ),
    )


@router.get("/live-schedule", name="live_schedule")
async def live_schedule(request: Request) -> HTMLResponse:
    return templates.TemplateResponse(
        request=request,
        name="features/live-schedule.html",
        context=page_context(
            request,
            "Live Schedule",
            "Schedule search and operational views will be migrated here.",
        ),
    )


@router.get("/component-library", name="component_library")
async def component_library(request: Request) -> HTMLResponse:
    return templates.TemplateResponse(
        request=request,
        name="features/component-library.html",
        context=page_context(
            request,
            "Component Library",
            "Reusable, framework-free controls for the Python application.",
        ),
    )


@router.get("/application-settings", name="application_settings")
async def application_settings(request: Request) -> HTMLResponse:
    return templates.TemplateResponse(
        request=request,
        name="features/application-settings.html",
        context=page_context(
            request,
            "Application Settings",
            "Application-wide preferences and administration belong here.",
        ),
    )


@router.get("/health", name="health")
async def health() -> dict[str, str]:
    return {"status": "healthy"}


@router.get("/validation/responsive-preview", name="responsive_preview")
async def responsive_preview() -> FileResponse:
    return FileResponse(PROJECT_DIRECTORY / "validation/responsive-preview.html")
