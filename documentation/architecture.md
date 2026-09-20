# Application architecture

TaskForce uses FastAPI for HTTP routing and Jinja for server-rendered HTML. CSS
and small behaviour enhancements are stored locally. Runtime and development
dependencies are installed exclusively with pip.

## Dependency boundary

The application must not require Node or npm. Do not add `package.json`,
JavaScript package imports, CDN scripts, or browser-time compilation. A small
local JavaScript module may progressively enhance semantic HTML, but core page
content and navigation must work when that enhancement is unavailable.

Material UI cannot run without the React/JavaScript toolchain. The Python
foundation preserves the earlier design principles through semantic HTML,
reusable Jinja macros, CSS variables, and local SVG symbols rather than trying
to imitate Material UI's programming API.

## Layer ownership

- `application.py` creates the FastAPI application and mounts shared services.
- `routes` translates HTTP requests into feature templates and view models.
- `templates/components` contains reusable, business-independent macros.
- `templates/features` owns page composition and business terminology.
- `features` Python packages own services, repositories, domain models,
  validation, routes and authorisation decisions.
- `static` contains the shared theme, progressive enhancement, and icons.

Shared macros receive values and callbacks or form destinations through their
consumer. They do not fetch business records, infer permissions, or import a
feature. UI permission flags only control presentation; service and repository
boundaries must enforce authorisation independently.

## Mobile-first shell

- The smallest supported CSS viewport is 320 pixels.
- Header and page content remain in normal document flow.
- The navigation is an accessible drawer on narrow screens and a persistent
  sidebar from the desktop breakpoint.
- Flexible grid children use `minmax(0, 1fr)` and containers use `min-width: 0`.
- The document never hides horizontal overflow globally.
- Wide tables scroll inside a labelled focusable region.
- Buttons and inputs provide a minimum 44-pixel interaction target.
- Menus and action groups wrap within the viewport.
- Dialogs use the native dialog element and fill narrow screens.
- Theme persistence is optional and cannot crash when storage is blocked.
- Important information and actions never depend on hover or right-click.

## Component contracts

Jinja macros provide consistent semantic markup for page headers, fields,
buttons, menus, icons, and tables. A macro is justified only when it preserves a
useful accessibility, responsive-layout, or application contract. Normal HTML
should be used directly when no contract is added.

The icon catalogue is one local SVG sprite at
`taskforce/static/icons/application-icons.svg`. Symbol names describe purpose,
not an external library name.

## Migration order

1. Validate the pip-only shell and component catalogue.
2. Define task and resource domain models and repository interfaces — Task
   Management task search is complete; shared resource contracts remain queued.
3. Migrate Task Management routes, filters, table and actions — read-only
   search, selection and CSV export are complete; persisted actions are queued.
4. Migrate Live Schedule.
5. Migrate callout management and detail windows.
6. Connect approved internal data services through repository adapters.

The original full implementation is preserved on the `Refactor` branch at
commit `f9e4c3e`. Consult it there; do not copy it into a legacy directory.

## Validation

Install `requirements-development.txt`, then run pytest and Ruff as documented
in the README. Use `/validation/responsive-preview` to check 320, 375, 390, 768,
1024, and 1440-pixel widths, landscape, and enlarged text. Also test keyboard
focus, Escape behaviour, dark theme, browser zoom, and a physical mobile device.

Automated tests establish route and architecture contracts. They do not replace
visual or assistive-technology testing.
