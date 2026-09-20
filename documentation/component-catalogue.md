# Component catalogue and migration map

This catalogue records each reusable-looking component found on the main branch,
its clean-architecture destination, and the migration decision. It prevents old
components from being copied merely because they already exist.

## Decision rules

- `shared` contains presentation and interaction contracts that are independent
  of TaskForce business data.
- A feature owns controls that express its terminology, validation rules, data
  access, or workflows.
- Prefer Material UI directly unless a wrapper adds a consistent accessibility,
  responsive-layout, or application contract.
- Shared components receive options, values, validation, and callbacks. They do
  not import mock records or know valid task and resource identifiers.
- Mobile is the baseline: no fixed character widths, no document-level
  horizontal clipping, and no interaction that depends on hover or right-click.

## Input fields

Input fields are the first completed catalogue category.

| Main-branch component   | Clean destination                                                                       | Decision and status                                                                                         |
| ----------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `BaseField`             | Material UI field APIs                                                                  | Retired. It duplicated state, labels, validation, and unfinished imperative references.                     |
| `FieldContainer`        | Consumer layout                                                                         | Retired. Pages and compound fields own responsive grid or stack layout.                                     |
| `FieldLabel`            | Material UI `label` contract                                                            | Retired. Native Material UI label association is retained.                                                  |
| `useFieldSizes`         | Shared theme and responsive layout                                                      | Retired. Fixed and character-based widths are not reusable.                                                 |
| `TextInputField`        | `shared/components/fields/TextInputField.tsx`                                           | Rebuilt. Full width by default with the normal Material UI text-field API.                                  |
| `SelectField`           | `shared/components/fields/DropdownField.tsx`                                            | Rebuilt for short, fixed lists.                                                                             |
| `SingleSelectField`     | `shared/components/fields/SelectionField.tsx`                                           | Rebuilt as a searchable single selection with stable identifiers.                                           |
| `MultiSelectField`      | `shared/components/fields/MultipleSelectionField.tsx`                                   | Rebuilt. Selected labels wrap; selection limits and select/clear-filtered actions are explicit.             |
| `FreeTypeSelectField`   | `shared/components/fields/CreatableSelectionField.tsx`                                  | Rebuilt. Consumers supply suggestions and may accept a new value.                                           |
| `GlobalSearchField`     | `shared/components/fields/SearchField.tsx`                                              | Rebuilt. Search and validation callbacks are supplied externally; task/resource mock data was removed.      |
| `DateTimeRangePopover`  | `shared/components/fields/DateTimeRangeField.tsx` plus `ApplicationPopover` when needed | Split. The value editor is accessible and responsive; the consumer decides whether it belongs in a popover. |
| `CombinedLocationField` | `features/task-management/components/fields/LocationCriterionField.tsx`                 | Rebuilt in Task Management because the compound value represents a task criterion.                          |
| `ImpScoreField`         | `features/task-management/components/fields/ImportanceScoreField.tsx`                   | Rebuilt in Task Management. The comparison condition is a labelled dropdown instead of a cycling icon.      |

Examples, including validation, disabled states, long labels, filtered multiple
selection, and narrow-screen compound layouts, live in
`features/component-library/examples/InputFieldExamples.tsx`.

## Actions and icons

| Main-branch component         | Clean destination                                                 | Decision and status                                                                                                                                                    |
| ----------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AppButton`                   | `shared/components/buttons/ApplicationButton.tsx`                 | Rebuilt. Shared theme owns appearance and touch-target sizing.                                                                                                         |
| Icon imports and `ThemedIcon` | `shared/icons/applicationIcons.ts`                                | Consolidated into named semantic exports; direct Material UI icon imports are lint-restricted.                                                                         |
| Icon-only actions             | `shared/components/buttons/ApplicationIconButton.tsx`             | Added. An accessible label is required.                                                                                                                                |
| `BulkTaskActions`             | `features/task-management/components/actions/BulkTaskActions.tsx` | Rebuilt with typed selected tasks, explicit permissions, and callbacks.                                                                                                |
| `TaskActionsMenu`             | Task action builder plus `shared/components/menus/ActionMenu.tsx` | Split. Generic presentation is shared; task wording and availability remain in the feature.                                                                            |
| `TaskRowContextMenu`          | `features/task-management/components/actions/TaskRowActions.tsx`  | Replaced by a visible row-action button usable with touch, keyboard, and pointer. A future right-click shortcut may call the same actions but cannot be the only path. |

Task action permissions determine which controls are presented. They are not a
security boundary: repositories and APIs must independently enforce the current
user's authorisation when an action is executed.

## Containers and feedback

| Main-branch component          | Clean destination                                          | Decision and status                                                                       |
| ------------------------------ | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `SectionExpandableCard`        | `shared/components/cards/ExpandableSection.tsx`            | Rebuilt with button semantics and keyboard behaviour.                                     |
| `DraggableDialog`              | `shared/components/dialogs/ApplicationDialog.tsx`          | Rebuilt. It becomes full-screen on small screens and does not retain unsafe drag offsets. |
| `DraggablePopupDialog`         | Feature detail-window composition                          | Queued. Reuse the dialog shell; the feature owns its content and actions.                 |
| `CustomTooltip`                | `shared/components/tooltips/ApplicationTooltip.tsx`        | Rebuilt for supplementary help only.                                                      |
| `SnackbarNotificationProvider` | `shared/components/notifications/NotificationProvider.tsx` | Rebuilt as the application notification boundary.                                         |
| Popup content                  | `shared/components/popovers/ApplicationPopover.tsx`        | Added as a responsive, dismissible shell. Feature rules remain outside it.                |
| `SelectablePillGroup`          | Candidate shared selection control                         | Queued for usage review. Keep only if several features need the same contract.            |

## Tables, search, and schedules

| Main-branch component | Clean destination                                   | Decision and status                                                                         |
| --------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `ResponsiveDataGrid`  | `shared/components/tables/ApplicationDataTable.tsx` | Rebuilt. Consumers supply typed rows and columns; overflow remains inside the table.        |
| `TaskTableMUI`        | Task Management task table                          | Queued. Split columns, row actions, filters, and data access into feature-owned modules.    |
| `ScheduleLiveSearch`  | Live Schedule search                                | Queued. It may compose `SearchField`, but matching rules and results stay in Live Schedule. |
| `TaskTooltip`         | Live Schedule task summary                          | Queued. The feature owns task content; tooltip use must remain supplementary.               |

## Migration sequence

1. Input fields — completed in the foundation catalogue.
2. Buttons, action menus, and task permissions — completed in the foundation
   catalogue.
3. Table primitives, task columns, filters, and responsive table composition.
4. Dialog and detail-window feature composition.
5. Live Schedule search, summaries, and schedule interactions.
6. Review candidate components after real feature migrations; remove wrappers
   that have only one consumer or add no contract.

This document describes structure and disposition, not visual approval. Run the
responsive harness and physical-device checks described in `architecture.md`
before treating a category as mobile-validated.
