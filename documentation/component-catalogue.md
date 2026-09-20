# Component catalogue and migration map

This catalogue maps the previous React/Material UI components to the pip-only
FastAPI and Jinja foundation.

## Input fields

| Previous component | Python destination | Decision |
| --- | --- | --- |
| `BaseField`, `FieldContainer`, `FieldLabel` | `templates/components/forms.html` | Replaced by labelled semantic field macros without duplicated state. |
| `useFieldSizes` | Responsive CSS grid | Retired; fixed and character-based field widths are not reusable. |
| `TextInputField` | `text_field` macro | Rebuilt with helper, error, disabled, required, and input-type contracts. |
| `SelectField` | `select_field` macro | Rebuilt for short fixed lists. |
| `SingleSelectField`, `FreeTypeSelectField` | Text field with local `datalist`, or feature-owned search | Native suggestions cover small lists; remote or large-list search stays feature-owned. |
| `MultiSelectField` | Multiple `select_field`, pending feature review | Native multiple selection is available; advanced filtered selection will be added only with a real usage contract. |
| `GlobalSearchField` | Search-type `text_field` | Validation and matching remain outside the shared macro. |
| `DateTimeRangePopover` | Four date/time fields plus native dialog when needed | The editor is responsive; its consumer chooses the containing surface. |
| `CombinedLocationField` | Task Management template composition | Remains feature-specific. |
| `ImpScoreField` | Task Management template composition | Uses an explicit condition select and numeric input. |

## Buttons, actions, and icons

| Previous component | Python destination | Decision |
| --- | --- | --- |
| `AppButton` | `templates/components/actions.html` | Rebuilt as primary, secondary, text, disabled, and icon button macros. |
| `ThemedIcon` and package icons | `static/icons/application-icons.svg` | Replaced by semantic local SVG symbols with no package or CDN dependency. |
| `TaskActionsMenu` | `action_menu` presentation plus feature composition | Shared markup owns accessibility; Task Management owns labels, permissions, and execution. |
| `BulkTaskActions` | Task Management composition | Selection and permission rules remain feature-owned. |
| `TaskRowContextMenu` | Visible action menu trigger | Right-click-only interaction is retired for touch and keyboard access. |

Presentation flags are not a security boundary. Python services and repository
adapters must enforce every task action independently.

## Containers and feedback

| Previous component | Python destination | Decision |
| --- | --- | --- |
| `SectionExpandableCard` | Native `details` when disclosure is required | Prefer the browser's keyboard and state semantics. |
| `DraggableDialog` | Native `dialog` | No drag offsets; full viewport presentation on narrow screens. |
| `DraggablePopupDialog` | Feature template using native `dialog` | Content and actions stay with the owning feature. |
| `CustomTooltip` | Native description text or `title` for supplementary labels | Important information must remain visible without hover. |
| `SnackbarNotificationProvider` | Shared live status region | Local JavaScript progressively announces disposable feedback. |
| `SelectablePillGroup` | Pending usage review | Add only after multiple real consumers demonstrate a common contract. |

## Tables and schedules

| Previous component | Python destination | Decision |
| --- | --- | --- |
| `ResponsiveDataGrid` | `templates/components/table.html` | Rebuilt as a semantic table inside a labelled horizontal-scroll region. |
| `TaskTableMUI` | `features/task_management` query service and feature table template | Read-only search, filters, visible row actions, selection and CSV export are migrated using synthetic example data. Persistence actions remain queued. |
| `ScheduleLiveSearch` | Live Schedule route and template | Queued; schedule matching rules remain feature-owned. |
| `TaskTooltip` | Visible schedule summary | Queued; task information cannot depend only on hover. |

## Current status

The pip-only shell and non-persistent component catalogue are implemented. Task
Management now has a typed read-only vertical slice. The next migration category
is task details and persisted progression/note actions, after defining the real
data-service and authorisation boundary.
