import csv
from functools import lru_cache
from io import StringIO
from pathlib import Path

from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse, Response

from taskforce.features.task_management.queries import (
    LocationField,
    ScoreCondition,
    TaskSearchCriteria,
)
from taskforce.features.task_management.repositories import JsonTaskRepository
from taskforce.features.task_management.services import TaskSearchService
from taskforce.presentation import templates
from taskforce.view_models.page import page_context

router = APIRouter()
DATA_PATH = Path(__file__).resolve().parent / "data/tasks.json"


@lru_cache(maxsize=1)
def task_search_service() -> TaskSearchService:
    return TaskSearchService(JsonTaskRepository(DATA_PATH))


def search_criteria(request: Request) -> TaskSearchCriteria:
    query = request.query_params
    return TaskSearchCriteria(
        task_search=query.get("task_search", ""),
        divisions=tuple(query.getlist("division")),
        domain_identifiers=tuple(query.getlist("domain_identifier")),
        statuses=tuple(query.getlist("task_status")),
        planning_work_areas=tuple(query.getlist("planning_work_area")),
        capabilities=tuple(query.getlist("capability")),
        response_codes=tuple(query.getlist("response_code")),
        commitment_types=tuple(query.getlist("commitment_type")),
        requester=query.get("requester", ""),
        job_type=query.get("job_type", ""),
        score_condition=parse_score_condition(query.get("score_condition")),
        score_value=parse_integer(query.get("score_value")),
        location_field=parse_location_field(query.get("location_field")),
        location_value=query.get("location_value", ""),
    )


@router.get("/task-management", name="task_management")
async def task_management(request: Request) -> HTMLResponse:
    criteria = search_criteria(request)
    service = task_search_service()
    result = service.search(criteria)
    context = page_context(
        request,
        "Task Management",
        "Search, review and select operational tasks from one responsive workspace.",
    )
    context.update(
        {
            "criteria": criteria,
            "filter_options": service.filter_options(),
            "search_result": result,
        }
    )
    return templates.TemplateResponse(
        request=request,
        name="features/task_management/page.html",
        context=context,
    )


@router.get("/task-management/export", name="export_tasks")
async def export_tasks(request: Request) -> Response:
    result = task_search_service().search(search_criteria(request))
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(
        (
            "Task ID",
            "Division",
            "Domain",
            "Status",
            "Task Type",
            "Primary Skill",
            "Importance Score",
            "Resource",
            "Postcode",
            "Expected Start",
        )
    )
    for task in result.tasks:
        writer.writerow(
            (
                task.task_identifier,
                task.division,
                task.domain_identifier,
                task.status,
                task.task_type,
                task.primary_skill,
                task.importance_score,
                task.resource_name or "",
                task.postcode,
                task.expected_start,
            )
        )
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="filtered-tasks.csv"'},
    )


def parse_integer(value: str | None) -> int | None:
    if value is None or not value.strip():
        return None
    try:
        return int(value)
    except ValueError:
        return None


def parse_score_condition(value: str | None) -> ScoreCondition | None:
    if not value:
        return None
    try:
        return ScoreCondition(value)
    except ValueError:
        return None


def parse_location_field(value: str | None) -> LocationField | None:
    if not value:
        return None
    try:
        return LocationField(value)
    except ValueError:
        return None
