from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class NavigationItem:
    label: str
    route_name: str
    path: str
    icon_name: str


navigation_items = (
    NavigationItem("Dashboard", "dashboard", "/", "dashboard"),
    NavigationItem(
        "Task Management",
        "task_management",
        "/task-management",
        "tasks",
    ),
    NavigationItem(
        "Live Schedule",
        "live_schedule",
        "/live-schedule",
        "calendar",
    ),
    NavigationItem(
        "Component Library",
        "component_library",
        "/component-library",
        "components",
    ),
    NavigationItem(
        "Application Settings",
        "application_settings",
        "/application-settings",
        "settings",
    ),
)
