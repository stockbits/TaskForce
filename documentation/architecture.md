# Application architecture

TaskForce is organised by business feature. Application-wide composition lives under `application`; reusable building blocks live under `shared`.

A feature owns its pages, components, hooks, types, and utilities. Features may import from `shared`, but they should not import another feature's internal files. Cross-feature orchestration belongs under `application`.

## Migration order

1. Confirm the foundation builds and renders.
2. Establish shared task and resource contracts.
3. Migrate task management.
4. Migrate live scheduling.
5. Migrate callout management.
6. Migrate task and resource detail windows.
7. Replace mock data with explicit repositories or service adapters.

The previous implementation should be consulted from the main branch rather than copied into a legacy directory.

## Mobile-first foundation

- PageContainer owns outer gutters: 16px mobile, 24px tablet, 40px wide desktop.
- The spacing unit is 4px. Material UI numeric spacing values multiply that unit;
  for example, padding 4 means 16px. Named pixel values must not be passed as
  spacing multipliers.
- The header is in normal document flow, so multiline titles and enlarged text
  cannot cover the page. Do not reintroduce a guessed fixed header offset.
- Flexible children use minWidth: 0. Text wraps, and action groups wrap.
- There is no global overflow-hiding workaround. Tables own internal horizontal
  scrolling; page content must not require horizontal scrolling.
- Dialogs are full-screen below the small breakpoint and preserve default modal
  focus, Escape, and backdrop behaviour. Desktop dragging is deliberately absent.
- Touch buttons have a minimum 44px target. Important information never depends
  on hover, a tooltip, or a right-click menu.
- Palette, typography and interaction sizes belong to the shared theme.
- Theme persistence is best effort; blocked browser storage must not crash it.

## Component contracts

Shared controls receive data and callbacks. They must not import mock data,
fetch business records, use application-wide custom events, or import features.
Use Material UI primitives directly unless a wrapper enforces a useful contract.
TextInputField requires a label; selection fields use stable option identifiers;
ApplicationIconButton requires an accessible label. ApplicationDataTable
receives typed rows and columns; task actions belong to Task Management.

The Component Library navigation page provides non-persistent examples of the
shared controls. It is lazy-loaded so the example data table is not part of the
initial dashboard bundle. It is not a migrated business feature.

## Icons

Use named exports from src/shared/icons/applicationIcons.ts. Import paths to
Material UI icons are restricted elsewhere by lint. Names describe purpose,
not library spelling. Historical Brightness2/WbSunny usages map to DarkThemeIcon/
LightThemeIcon. Do not build a dynamic map containing every library icon.

## Original-component disposition

| Original component                    | Foundation                                                          |
| ------------------------------------- | ------------------------------------------------------------------- |
| AppButton                             | ApplicationButton; shared theme owns styling                        |
| TaskActionsMenu                       | Generic ActionMenu plus feature-owned task action builder           |
| BulkTaskActions                       | Typed task-management component with explicit permissions           |
| TaskRowContextMenu                    | Visible, accessible TaskRowActions control                          |
| BaseField, FieldLabel, FieldContainer | Native labelled Material UI fields; no additional wrapper hierarchy |
| SelectField, SingleSelectField        | SelectionField for searchable choices                               |
| MultiSelectField                      | MultipleSelectionField with filtered actions and selection limits   |
| FreeTypeSelectField                   | CreatableSelectionField; consumer supplies suggestions              |
| GlobalSearchField                     | SearchField; no mock-data dependency                                |
| SectionExpandableCard                 | ExpandableSection                                                   |
| DraggableDialog                       | ApplicationDialog; no unbounded drag offsets                        |
| DraggablePopupDialog                  | Domain-specific detail-window composition remains deferred          |
| SnackbarNotificationProvider          | NotificationProvider                                                |
| CustomTooltip                         | ApplicationTooltip for supplementary help                           |
| ResponsiveDataGrid                    | ApplicationDataTable; feature supplies rows and columns             |
| TaskTableMUI                          | Deferred to task-management table migration                         |
| ScheduleLiveSearch, TaskTooltip       | Deferred to live-schedule migration                                 |
| CombinedLocationField, ImpScoreField  | Rebuilt as task-management feature fields                           |
| DateTimeRangePopover                  | DateTimeRangeField composed with ApplicationPopover when required   |

The full inventory, decisions, and migration order are recorded in
`documentation/component-catalogue.md`.

## Validation

Run npm ci, npm run build and npm run lint. Then start the normal development
server and open /validation/responsive-preview.html. Alternatively, after a build,
run node validation/serve-preview.mjs to serve the production build and harness
on port 4173. The harness is not included in the production build.

The harness uses a same-origin iframe with real CSS viewport widths, including
320, 375, 390, 768, 1024 and 1440px. Use 844 by 390 for landscape and 200% text
scale for enlarged root text (this is not a substitute for browser zoom or a
physical-device keyboard test). Open every navigation page and measure overflow.
Check dialogs, popovers, selections, long content, keyboard focus and dark mode.
Measure overflow with overlays both open and closed. Table content may scroll
inside the grid; the document must not overflow horizontally.

Build and lint checks pass for the foundation. Browser visual and interaction
validation remains pending because the review environment could not connect to
the local preview. Do not interpret compilation as a mobile-layout guarantee.
