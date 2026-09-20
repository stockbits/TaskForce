from fastapi import Request

from taskforce.view_models.navigation import navigation_items


def page_context(request: Request, title: str, description: str) -> dict[str, object]:
    return {
        "request": request,
        "page_title": title,
        "page_description": description,
        "current_path": request.url.path,
        "navigation_items": navigation_items,
    }
