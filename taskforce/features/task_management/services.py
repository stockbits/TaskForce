from collections.abc import Iterable
from dataclasses import dataclass

from taskforce.features.task_management.models import Task
from taskforce.features.task_management.queries import (
    TaskSearchCriteria,
    filter_tasks,
)
from taskforce.features.task_management.repositories import TaskRepository


@dataclass(frozen=True, slots=True)
class TaskFilterOptions:
    divisions: tuple[str, ...]
    domain_identifiers: tuple[str, ...]
    statuses: tuple[str, ...]
    planning_work_areas: tuple[str, ...]
    capabilities: tuple[str, ...]
    response_codes: tuple[str, ...]
    commitment_types: tuple[str, ...]
    requesters: tuple[str, ...]
    job_types: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class TaskSearchResult:
    tasks: tuple[Task, ...]
    message: str | None = None
    is_error: bool = False


class TaskSearchService:
    def __init__(self, repository: TaskRepository) -> None:
        self._repository = repository

    def filter_options(self) -> TaskFilterOptions:
        tasks = self._repository.list_tasks()
        return TaskFilterOptions(
            divisions=unique(task.division for task in tasks),
            domain_identifiers=unique(task.domain_identifier for task in tasks),
            statuses=unique(task.status for task in tasks),
            planning_work_areas=unique(task.planning_work_area for task in tasks),
            capabilities=unique(
                capability for task in tasks for capability in task.capabilities
            ),
            response_codes=unique(task.response_code for task in tasks),
            commitment_types=unique(task.commitment_type for task in tasks),
            requesters=unique(task.resource_name or "" for task in tasks),
            job_types=unique(task.task_type for task in tasks),
        )

    def search(self, criteria: TaskSearchCriteria) -> TaskSearchResult:
        if not criteria.has_search:
            return TaskSearchResult(tasks=())
        if not criteria.meets_minimum_search_rule:
            return TaskSearchResult(
                tasks=(),
                message=(
                    "Enter a global search, or select Division, Domain and "
                    "Task Status."
                ),
                is_error=True,
            )

        tasks = filter_tasks(self._repository.list_tasks(), criteria)
        message = f"Found {len(tasks)} task{'s' if len(tasks) != 1 else ''}."
        return TaskSearchResult(
            tasks=tasks,
            message=message if tasks else "No matching tasks found.",
            is_error=not tasks,
        )


def unique(values: Iterable[object]) -> tuple[str, ...]:
    return tuple(sorted({str(value) for value in values if value}))
