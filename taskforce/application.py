from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from taskforce.routes.pages import router as page_router

APPLICATION_DIRECTORY = Path(__file__).resolve().parent


def create_application() -> FastAPI:
    application = FastAPI(
        title="TaskForce",
        docs_url=None,
        redoc_url=None,
    )
    application.mount(
        "/static",
        StaticFiles(directory=APPLICATION_DIRECTORY / "static"),
        name="static",
    )
    application.include_router(page_router)
    return application


application = create_application()
