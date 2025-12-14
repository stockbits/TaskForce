# MUI Migration Log

This file tracks all major Material UI migrations, including the source file and date of conversion.

## Migration Entries

- **src/main.tsx** — ThemeProvider, CssBaseline (global setup)
- **src/theme.ts** — createTheme utilities
- **src/layout/AppLayout.tsx** — AppBar, Paper, Toolbar, etc. (layout shell)
- **src/layout/Sidebar.tsx** — Drawer, List, Stack, etc. (sidebar shell)
- **src/features/tasks/TaskManagementPage.tsx** — Box, Paper, Typography, Stack (task main page)
- **src/features/tasks/components/TaskSearchCardClean.tsx** — Autocomplete, Card, Stack, etc. (task search)
- **src/features/tasks/components/TaskPopoutPanel.tsx** — Paper, Stack, etc. (task popout)
- **src/features/tasks/components/TaskDetailsModal.tsx** — Paper, Stack, etc. (task details modal)
- **src/features/tasks/components/TaskTable_Advanced.tsx** — Table, Paper, Stack, etc. (task table)
- **src/features/callout/components/CalloutIncidentPanel.tsx** — Paper, Table, Stack, etc. (callout incident)
- **src/features/callout/components/CalloutLandingPage.tsx** — Paper, Stack, etc. (callout landing)
- **src/features/callout/components/ResourcePopoutPanel.tsx** — Paper, Table, Stack, etc. (resource popout)
- **src/features/schedule/ScheduleLivePage.tsx** — Paper, Box, Toolbar, etc. (schedule shell)
- **src/features/schedule/components/MapLegend.tsx** — Paper, Stack, etc. (map legend)
- **src/features/schedule/components/MapPanel.tsx** — Paper, Box (map panel)
- **src/features/schedule/components/ResourceTablePanel.tsx** — Paper, Stack, etc. (resource table)
- **src/features/schedule/components/SearchToolPanel.tsx** — Paper, Popper, Stack, etc. (search tool)
- **src/features/schedule/components/TaskTablePanel.tsx** — Paper, Stack, etc. (task table)
- **src/features/schedule/components/TimelinePanel.tsx** — Paper (timeline panel)
- **src/shared/ui/TaskRowContextMenu.tsx** — Paper, List, ListItemButton, etc. (context menu)
- **src/popup-main.tsx** — Box, Paper (popup shell)
- **src/lib/hooks/usePanelDocking.tsx** — Paper, Stack, IconButton, etc. (panel docking)
- **src/shared/ui/ExpandableSectionCard.tsx** — Paper, Stack, Collapse, etc. (expandable card)

---

For each migration, see `docs/mui-component-inventory.md` for details on components and hooks used.

_Last updated: 2025-12-14_
