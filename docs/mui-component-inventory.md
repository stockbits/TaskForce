# Material UI Component Inventory

## Global Setup
- `src/main.tsx`
	- Components: `ThemeProvider`, `CssBaseline`
- `src/theme.ts`
	- Styling utilities: `createTheme`

## Layout Shell
- `src/layout/MainLayout.tsx`
	- Components: `AppBar`, `Avatar`, `Box`, `Card`, `CardActionArea`, `CardContent`, `Fade`, `Grid`, `IconButton`, `InputAdornment`, `List`, `ListItemButton`, `ListItemText`, `Paper`, `TextField`, `Toolbar`, `Typography`
	- Hooks & styling utilities: `useTheme`, `alpha`
- `src/layout/Sidebar.tsx`
	- Components: `Box`, `Divider`, `Drawer`, `List`, `ListItemButton`, `ListItemIcon`, `ListItemText`, `Stack`, `Typography`
	- Hooks & styling utilities: `useTheme`, `alpha`

## Task Experience
- `src/features/tasks/TaskManagementPage.tsx`
	- Components: `Box`, `Paper`, `Typography`, `Stack`
	- Hooks & styling utilities: MUI `sx` props
- `src/features/tasks/components/TaskSearchCardClean.tsx`
	- Components: `Autocomplete`, `Box`, `Button`, `Card`, `CardActions`, `CardContent`, `Checkbox`, `Chip`, `Collapse`, `Divider`, `FormControl`, `IconButton`, `InputAdornment`, `InputLabel`, `ListItemIcon`, `ListItemText`, `Menu`, `MenuItem`, `Select`, `Stack`, `Tab`, `Tabs`, `TextField`, `Typography`
	- Hooks & styling utilities: `useTheme`
- `src/features/tasks/components/TaskPopoutPanel.tsx`
	- Components: `Box`, `Button`, `Chip`, `Paper`, `Stack`, `Typography`
	- Hooks & styling utilities: `useTheme`, `alpha`
- `src/features/tasks/components/TaskDetailsModal.tsx`
	- Components: `Alert`, `Box`, `Button`, `Chip`, `Grid`, `Paper`, `Stack`, `TextField`, `Typography`
	- Hooks & styling utilities: `useTheme`, `alpha`
- `src/features/tasks/components/TaskTable_Advanced.tsx`
	- Components: `Alert`, `Box`, `Button`, `Checkbox`, `Chip`, `CircularProgress`, `Dialog`, `DialogActions`, `DialogContent`, `DialogTitle`, `Divider`, `FormControl`, `FormControlLabel`, `IconButton`, `InputAdornment`, `InputLabel`, `MenuItem`, `Paper`, `Select`, `Stack`, `Table`, `TableBody`, `TableCell`, `TableHead`, `TableRow`, `TextField`, `Typography`
	- Hooks & styling utilities: `useTheme`, `alpha`

## Callout Tools
- `src/features/callout/components/CalloutIncidentPanel.tsx`
	- Components: `Alert`, `Box`, `Button`, `CircularProgress`, `FormControl`, `IconButton`, `MenuItem`, `Paper`, `Select`, `Stack`, `Table`, `TableBody`, `TableCell`, `TableHead`, `TableRow`, `TextField`, `Tooltip`, `Typography`
	- Hooks & styling utilities: `useTheme`, `alpha`
- `src/features/callout/components/CalloutLandingPage.tsx`
	- Components: `Autocomplete`, `Box`, `Button`, `Paper`, `Stack`, `TextField`, `Typography`
	- Hooks & styling utilities: `useTheme`, `alpha`
- `src/features/callout/components/ResourcePopoutPanel.tsx`
	- Components: `Box`, `Button`, `Chip`, `Grid`, `IconButton`, `Paper`, `Stack`, `Table`, `TableBody`, `TableCell`, `TableContainer`, `TableHead`, `TableRow`, `TextField`, `Typography`
	- Hooks & styling utilities: `useTheme`, `alpha`

## Schedule Tools
- `src/features/schedule/ScheduleLivePage.tsx`
	- Components: `Box`, `Button`, `ClickAwayListener`, `Divider`, `Fade`, `IconButton`, `InputAdornment`, `MenuItem`, `Paper`, `Popper`, `Stack`, `TextField`, `Typography`
	- Hooks & styling utilities: `useTheme`, `alpha`
- `src/features/schedule/components/MapLegend.tsx`
	- Components: `Box`, `IconButton`, `Paper`, `Stack`, `Typography`
	- Hooks & styling utilities: `useTheme`, `alpha`
- `src/features/schedule/components/MapPanel.tsx`
	- Components: `Box`, `Paper`
	- Hooks & styling utilities: `useTheme`, `alpha`
- `src/features/schedule/components/ResourceTablePanel.tsx`
	- Components: `Box`, `Paper`, `Stack`, `Typography`
	- Hooks & styling utilities: `useTheme`, `alpha`
- `src/features/schedule/components/SearchToolPanel.tsx`
	- Components: `Box`, `Button`, `Checkbox`, `ClickAwayListener`, `Divider`, `Fade`, `Grid`, `IconButton`, `Menu`, `MenuItem`, `Paper`, `Popper`, `Stack`, `TextField`, `Typography`
	- Hooks & styling utilities: `useTheme`, `alpha`
- `src/features/schedule/components/TaskTablePanel.tsx`
	- Components: `Box`, `Paper`, `Stack`, `Typography`
	- Hooks & styling utilities: `useTheme`, `alpha`
- `src/features/schedule/components/TimelinePanel.tsx`
	- Components: `Paper`
	- Hooks & styling utilities: `useTheme`, `alpha`

## Shared UI
- `src/shared/ui/TaskRowContextMenu.tsx`
	- Components: `Paper`, `List`, `ListItemButton`, `ListItemIcon`, `Typography`, `Divider`
	- Hooks & styling utilities: MUI `sx` props
- `src/popup-main.tsx`
	- Components: `Box`, `Paper`
	- Hooks & styling utilities: MUI `sx` props
- `src/lib/hooks/usePanelDocking.tsx`
	- Components: `Box`, `IconButton`, `Paper`, `Stack`, `Typography`
	- Hooks & styling utilities: `useTheme`, `alpha`
- `src/shared/ui/ExpandableSectionCard.tsx`
	- Components: `Box`, `Button`, `Collapse`, `Paper`, `Stack`, `Typography`
	- Hooks & styling utilities: `useTheme`, `alpha`

## Shared Utilities
- `@mui/material/Autocomplete` typings used for event signatures in `TaskSearchCardClean.tsx` (`AutocompleteChangeReason`, `AutocompleteChangeDetails`)

> This list will grow as we continue migrating remaining components to Material UI.
