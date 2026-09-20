# TaskForce Python foundation

TaskForce is a mobile-first FastAPI application rendered with Jinja templates.
It installs and runs with Python and pip only. The application has no Node,
npm, React, Vite, Material UI, CDN, or browser package-manager dependency.

The previous React implementation remains available in Git history and on the
`main` branch while features are migrated deliberately.

## Requirements

- Python 3.12 or newer
- pip

## Local setup

```bash
python -m venv .venv
```

Activate the virtual environment and install the development requirements:

```bash
python -m pip install -r requirements-development.txt
```

Start the application:

```bash
python -m uvicorn taskforce.application:application --reload
```

Open `http://127.0.0.1:8000`. The component catalogue is available at
`/component-library`, and the responsive harness is available at
`/validation/responsive-preview`.

## Validation

```bash
python -m pytest
python -m ruff check .
python -m ruff format --check .
```

## Structure

- `taskforce/application.py`: FastAPI application composition
- `taskforce/routes`: HTTP route modules
- `taskforce/templates/components`: business-independent Jinja macros
- `taskforce/templates/features`: feature-owned pages and compositions
- `taskforce/static`: local styles, scripts, and semantic icon catalogue
- `taskforce/view_models`: presentation-only Python models
- `tests`: route and architecture validation
- `documentation`: architectural and migration guidance

Project-owned Python modules use descriptive snake_case names. Templates,
styles, and scripts use lowercase kebab-case paths. Avoid abbreviations unless
they are part of an external contract that is adapted at the boundary.
