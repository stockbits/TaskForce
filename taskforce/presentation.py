from pathlib import Path

from fastapi.templating import Jinja2Templates

APPLICATION_DIRECTORY = Path(__file__).resolve().parent
PROJECT_DIRECTORY = APPLICATION_DIRECTORY.parent
templates = Jinja2Templates(directory=APPLICATION_DIRECTORY / "templates")
