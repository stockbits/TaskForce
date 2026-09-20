from pathlib import Path

from fastapi.testclient import TestClient

from taskforce.application import application
from taskforce.features.task_management.queries import (
    LocationField,
    ScoreCondition,
    TaskSearchCriteria,
    filter_tasks,
)
from taskforce.features.task_management.repositories import JsonTaskRepository
from taskforce.features.task_management.services import TaskSearchService

DATA_PATH = (
    Path(__file__).resolve().parents[1]
    / "taskforce/features/task_management/data/tasks.json"
)
client = TestClient(application)


def test_repository_maps_source_records_to_typed_tasks() -> None:
    tasks = JsonTaskRepository(DATA_PATH).list_tasks()

    assert len(tasks) == 12
    assert tasks[0].task_identifier == "EXAMPLE-TASK-001"
    assert tasks[0].importance_score == 95
    assert tasks[0].capabilities == ("PLANNING",)


def test_global_search_uses_existing_task_identifiers() -> None:
    service = TaskSearchService(JsonTaskRepository(DATA_PATH))

    result = service.search(TaskSearchCriteria(task_search="EXAMPLE-WORK-001"))

    assert not result.is_error
    assert [task.task_identifier for task in result.tasks] == ["EXAMPLE-TASK-001"]


def test_structured_search_requires_division_domain_and_status() -> None:
    service = TaskSearchService(JsonTaskRepository(DATA_PATH))

    result = service.search(TaskSearchCriteria(divisions=("Admin",)))

    assert result.is_error
    assert result.tasks == ()
    assert "Division, Domain and Task Status" in (result.message or "")


def test_advanced_score_and_location_filters_are_composable() -> None:
    tasks = JsonTaskRepository(DATA_PATH).list_tasks()
    criteria = TaskSearchCriteria(
        score_condition=ScoreCondition.GREATER_THAN,
        score_value=90,
        location_field=LocationField.POSTCODE,
        location_value="DEMO",
    )

    results = filter_tasks(tasks, criteria)

    assert results
    assert all(task.importance_score > 90 for task in results)
    assert all("DEMO" in task.postcode for task in results)


def test_task_management_route_renders_filtered_results() -> None:
    response = client.get(
        "/task-management",
        params={"task_search": "EXAMPLE-TASK-002"},
    )

    assert response.status_code == 200
    assert "Found 1 task." in response.text
    assert "EXAMPLE-TASK-002" in response.text
    assert "data-task-selection" in response.text


def test_task_export_uses_the_same_search_contract() -> None:
    response = client.get(
        "/task-management/export",
        params={"task_search": "EXAMPLE-TASK-003"},
    )

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert 'filename="filtered-tasks.csv"' in response.headers["content-disposition"]
    assert "EXAMPLE-TASK-003" in response.text
    assert "EXAMPLE-TASK-002" not in response.text
