# Task Management migration

## Source

The source implementation is preserved on the `Refactor` branch at commit
`f9e4c3e`. The Python migration does not import files from that branch at
runtime.

| Original responsibility | Clean Python destination |
| --- | --- |
| `Task - Model.json` | Schema mapped into typed models; safe synthetic examples are accessed only through `JsonTaskRepository` |
| `Task filtering - component.ts` and page filtering | `features/task_management/queries.py` |
| Search-card state and validation | GET query contract in `routes.py` and validation in `TaskSearchService` |
| Derived filter options | `TaskSearchService.filter_options` |
| Task page orchestration | Feature-owned `routes.py` |
| MUI search card | `templates/features/task_management/page.html` |
| MUI task table | Semantic feature table inside the shared scroll-region contract |
| DataGrid row selection | Native checkboxes with a small local enhancement module |
| Browser-generated CSV | Server-generated `/task-management/export` response |
| Context menu | Visible row action trigger usable by keyboard, touch and pointer |

## Request flow

1. The route maps query-string values into `TaskSearchCriteria`.
2. `TaskSearchService` enforces global search or Division + Domain + Task Status.
3. `TaskRepository` supplies typed `Task` models.
4. Pure query functions apply basic and advanced filters.
5. The route passes a result view model to the feature template.
6. The same criteria contract drives CSV export.

The route never parses JSON or implements filter rules. The template never reads
files, queries a service, or infers authorisation.

## Preserved behaviour

- Global search covers task, work, estimate, employee, resource, asset and
  description values.
- Basic filters include Division, Domain, Task Status, planning work area and
  capability.
- Advanced filters include commitment type, response code, requester, job type,
  importance score and location.
- Results provide selection, visible row actions and CSV export.
- Twelve explicitly synthetic records exercise the original schema behind a
  replaceable repository. Names, addresses, coordinates, operational identifiers
  and field notes from the source fixture were not copied.

## MUI design critique applied

The MUI dependency is intentionally absent because this environment is pip-only.
The useful interaction language is retained: consistent spacing, contained and
outlined actions, surfaced cards, compact status badges, responsive grids,
focus-visible states, a sticky shell, clear empty/error states, and table
overflow contained within a labelled region.

The migration removes page-level height calculations, hidden document overflow,
right-click-only actions, untyped records, direct mock imports, global custom
events and duplicated filter implementations.

## Deliberate deferrals

- Source date strings omit a year and are not a reliable date-time contract.
  Date filtering will be added after the repository supplies ISO timestamps.
- Progress task, progress notes and callout actions are presented as unavailable
  service wiring rather than simulated saves. They require authenticated service
  methods, authorisation checks, validation and persistence.
- Pagination and server-side sorting should be added with the production
  repository rather than optimising the 40-record fixture.
- Task and resource detail routes require stable identifiers and repository
  contracts before their pop-out experience is migrated.
