import json
from pathlib import Path
from typing import Protocol

from taskforce.features.task_management.models import Task


class TaskRepository(Protocol):
    def list_tasks(self) -> tuple[Task, ...]: ...


class JsonTaskRepository:
    """Read-only adapter for the source task fixture during migration."""

    def __init__(self, data_path: Path) -> None:
        self._data_path = data_path

    def list_tasks(self) -> tuple[Task, ...]:
        records = json.loads(self._data_path.read_text(encoding="utf-8"))
        return tuple(Task.model_validate(record) for record in records)
