from pathlib import Path

PROJECT_DIRECTORY = Path(__file__).resolve().parents[1]
APPLICATION_DIRECTORY = PROJECT_DIRECTORY / "taskforce"


def test_node_build_files_are_absent() -> None:
    forbidden_paths = (
        "package.json",
        "package-lock.json",
        "node_modules",
        "vite.config.ts",
        "tsconfig.json",
        "eslint.config.cjs",
    )

    for relative_path in forbidden_paths:
        assert not (PROJECT_DIRECTORY / relative_path).exists(), relative_path

    legacy_source_directory = PROJECT_DIRECTORY / "src"
    assert not any(
        path.is_file() for path in legacy_source_directory.rglob("*")
    ), "src contains legacy frontend files"


def test_application_paths_use_descriptive_names_without_spaces() -> None:
    for path in APPLICATION_DIRECTORY.rglob("*"):
        relative_path = path.relative_to(APPLICATION_DIRECTORY)
        assert " " not in str(relative_path)
        assert "src" not in relative_path.parts


def test_browser_assets_are_local_and_package_free() -> None:
    browser_files = [
        *APPLICATION_DIRECTORY.rglob("*.html"),
        *APPLICATION_DIRECTORY.rglob("*.css"),
        *APPLICATION_DIRECTORY.rglob("*.js"),
    ]

    for path in browser_files:
        content = path.read_text(encoding="utf-8")
        assert "https://" not in content, path
        assert "http://" not in content, path
        assert "node_modules" not in content, path


def test_shared_component_templates_do_not_contain_data_access() -> None:
    component_directory = APPLICATION_DIRECTORY / "templates/components"
    forbidden_terms = ("fetch(", "requests.", "httpx.", "mock-data", "taskId")

    for path in component_directory.glob("*.html"):
        content = path.read_text(encoding="utf-8")
        for term in forbidden_terms:
            assert term not in content, f"{path.name} contains {term}"


def test_single_semantic_icon_catalogue_exists() -> None:
    icon_files = list((APPLICATION_DIRECTORY / "static/icons").glob("*.svg"))

    assert [path.name for path in icon_files] == ["application-icons.svg"]
    content = icon_files[0].read_text(encoding="utf-8")
    for identifier in ("menu", "dashboard", "tasks", "calendar", "settings"):
        assert f'id="{identifier}"' in content
