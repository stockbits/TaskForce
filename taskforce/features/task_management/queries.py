from dataclasses import dataclass
from enum import StrEnum

from taskforce.features.task_management.models import Task


class ScoreCondition(StrEnum):
    GREATER_THAN = "greater-than"
    EQUAL_TO = "equal-to"
    LESS_THAN = "less-than"


class LocationField(StrEnum):
    POSTCODE = "postcode"
    ASSET_NAME = "asset-name"
    CUSTOMER_ADDRESS = "customer-address"


@dataclass(frozen=True, slots=True)
class TaskSearchCriteria:
    task_search: str = ""
    divisions: tuple[str, ...] = ()
    domain_identifiers: tuple[str, ...] = ()
    statuses: tuple[str, ...] = ()
    planning_work_areas: tuple[str, ...] = ()
    capabilities: tuple[str, ...] = ()
    response_codes: tuple[str, ...] = ()
    commitment_types: tuple[str, ...] = ()
    requester: str = ""
    job_type: str = ""
    score_condition: ScoreCondition | None = None
    score_value: int | None = None
    location_field: LocationField | None = None
    location_value: str = ""

    @property
    def has_search(self) -> bool:
        return any(
            (
                self.task_search.strip(),
                self.divisions,
                self.domain_identifiers,
                self.statuses,
                self.planning_work_areas,
                self.capabilities,
                self.response_codes,
                self.commitment_types,
                self.requester.strip(),
                self.job_type.strip(),
                self.score_value is not None,
                self.location_value.strip(),
            )
        )

    @property
    def meets_minimum_search_rule(self) -> bool:
        return bool(
            self.task_search.strip()
            or (self.divisions and self.domain_identifiers and self.statuses)
        )


def filter_tasks(
    tasks: tuple[Task, ...],
    criteria: TaskSearchCriteria,
) -> tuple[Task, ...]:
    return tuple(task for task in tasks if task_matches(task, criteria))


def task_matches(task: Task, criteria: TaskSearchCriteria) -> bool:
    if criteria.task_search.strip():
        query = criteria.task_search.casefold()
        searchable_values = (
            task.task_identifier,
            task.work_identifier,
            task.estimate_number,
            task.employee_identifier or "",
            task.resource_name or "",
            task.asset_name,
            task.description,
        )
        if query not in " ".join(searchable_values).casefold():
            return False

    exact_filters = (
        (criteria.divisions, task.division),
        (criteria.domain_identifiers, task.domain_identifier),
        (criteria.statuses, task.status),
        (criteria.planning_work_areas, task.planning_work_area),
        (criteria.response_codes, task.response_code),
        (criteria.commitment_types, task.commitment_type),
    )
    if any(options and value not in options for options, value in exact_filters):
        return False

    if criteria.capabilities and not set(criteria.capabilities).intersection(
        task.capabilities
    ):
        return False
    if (
        criteria.requester.strip()
        and criteria.requester.casefold() not in (task.resource_name or "").casefold()
    ):
        return False
    if criteria.job_type.strip() and criteria.job_type.casefold() not in (
        task.task_type.casefold()
    ):
        return False
    if not score_matches(task.importance_score, criteria):
        return False
    return location_matches(task, criteria)


def score_matches(score: int, criteria: TaskSearchCriteria) -> bool:
    if criteria.score_value is None or criteria.score_condition is None:
        return True
    if criteria.score_condition is ScoreCondition.GREATER_THAN:
        return score > criteria.score_value
    if criteria.score_condition is ScoreCondition.LESS_THAN:
        return score < criteria.score_value
    return score == criteria.score_value


def location_matches(task: Task, criteria: TaskSearchCriteria) -> bool:
    if not criteria.location_value.strip() or criteria.location_field is None:
        return True
    values = {
        LocationField.POSTCODE: task.postcode,
        LocationField.ASSET_NAME: task.asset_name,
        LocationField.CUSTOMER_ADDRESS: task.customer_address,
    }
    return (
        criteria.location_value.casefold() in values[criteria.location_field].casefold()
    )
