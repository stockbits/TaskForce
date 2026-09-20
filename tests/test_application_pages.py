import pytest
from fastapi.testclient import TestClient

from taskforce.application import application

client = TestClient(application)


@pytest.mark.parametrize(
    ("path", "heading"),
    [
        ("/", "Dashboard"),
        ("/task-management", "Task Management"),
        ("/live-schedule", "Live Schedule"),
        ("/component-library", "Component Library"),
        ("/application-settings", "Application Settings"),
    ],
)
def test_page_renders_application_shell(path: str, heading: str) -> None:
    response = client.get(path)

    assert response.status_code == 200
    assert f"<h1>{heading}</h1>" in response.text
    assert 'id="main-content"' in response.text
    assert 'aria-label="Primary navigation"' in response.text
    assert "application.css" in response.text
    assert "application.js" in response.text


def test_component_library_contains_reusable_control_examples() -> None:
    response = client.get("/component-library")

    assert response.status_code == 200
    assert 'id="standard-text"' in response.text
    assert 'class="action-menu"' in response.text
    assert 'id="example-dialog"' in response.text
    assert "Example records" in response.text


def test_local_static_assets_are_served() -> None:
    for path in (
        "/static/styles/application.css",
        "/static/scripts/application.js",
        "/static/icons/application-icons.svg",
    ):
        response = client.get(path)
        assert response.status_code == 200


def test_health_endpoint_returns_json() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_responsive_preview_is_available() -> None:
    response = client.get("/validation/responsive-preview")

    assert response.status_code == 200
    assert "Responsive validation" in response.text
