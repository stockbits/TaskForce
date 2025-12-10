
# Project Structure - Super Simple & Clear

## Overview
All folders use full, descriptive names. Every feature, shared resource, and utility is easy to find.

## Directory Structure

```
src/
├── layout/                # Main layout components (app shell, navigation)
│   ├── AppLayout.tsx      # Main app container
│   └── SidebarNavigation.tsx # Sidebar navigation
├── callout/               # Callout feature (pages, components, logic)
│   ├── CalloutIncidentPanel.tsx
│   ├── CalloutLandingPage.tsx
│   └── ResourcePopoutPanel.tsx
├── schedule/              # Schedule & mapping feature (pages, components, logic)
│   ├── ScheduleLivePage.tsx
│   ├── MapLegend.tsx
│   ├── MapPanel.tsx
│   ├── ResourceTablePanel.tsx
│   ├── SearchModeWrapper.tsx
│   ├── SearchToolPanel.tsx
│   ├── TaskTablePanel.tsx
│   ├── TimelinePanel.tsx
│   └── useLiveSelectEngine.ts
├── tasks/                 # Task management feature (pages, components, logic)
│   ├── TaskManagementPage.tsx
│   ├── TaskDetailsModal.tsx
│   ├── TaskPopoutPanel.tsx
│   ├── TaskSearchCardClean.tsx
│   └── TaskTableAdvanced.tsx
├── shared-config/         # Shared configuration files (menus, pins, etc.)
│   ├── menuRegistry.ts
│   └── pins.ts
├── shared-ui/             # Shared UI components (icons, context menus, etc.)
│   ├── IconTheme.tsx
│   └── TaskRowContextMenu.tsx
├── hooks/                 # Reusable React hooks
│   ├── useExternalWindow.ts
│   ├── usePanelDocking.tsx
│   ├── useSearchLeftMenu.ts
│   ├── menuRegistry.ts
│   └── useCalloutHistory.ts
├── utils/                 # Utility functions
├── data/                  # Mock data and resources
│   ├── ResourceMock.json
│   ├── calloutHistory.json
│   └── mockTasks.json
├── types/                 # TypeScript type definitions
│   └── index.ts
```
├── components/                      # Shared UI components (currently empty)
│
├── App.tsx                          # Root application component
├── main.tsx                         # Application entry point
└── popup-main.tsx                  # Popup window entry point
```

## Key Changes Made

### Renamed Directories
- `A-Navigation_Container/` → `layout/` (clearer purpose)
- Consolidated hooks into `lib/hooks/` 
- Removed duplicate `SCH_Live/` folder

### Renamed Files
- `AppContainer.tsx` → `MainLayout.tsx` (more descriptive)
- `SidePanel.tsx` → `Sidebar.tsx` (simpler name)

### Removed Obsolete Directories
- `A-Navigation_Container/` - moved to layout
- `config/` (root) - consolidated into lib/hooks
- `SCH_Live/` - duplicate of schedule features

### Updated Import Paths
All imports updated to use new paths consistently:
- `@/layout/` - Main layout components
- `@/features/` - Feature modules
- `@/lib/hooks/` - Reusable hooks
- `@/shared/` - Shared config and UI
- `@/data/` - Mock data files
- `@/types/` - Type definitions

### Updated Configuration Files
- `vite.config.ts` - Added `@layout` alias, removed old aliases
- `tsconfig.json` - Updated path mappings

## Path Aliases

The following aliases are configured for easy imports:

```typescript
@/          // Root src folder
@layout/    // Layout components
@features/  // Features
@lib/       // Library code
@hooks/     // Hooks (lib/hooks)
@utils/     // Utilities (lib/utils)
@shared/    // Shared components
@config/    // Config (shared/config)
@ui/        // UI components (shared/ui)
@types/     // Types
@components/ // Components
```

## Component Discovery

- **Layout & Navigation**: `src/layout/`
- **Feature Pages**: `src/features/{feature-name}/`
- **Reusable Hooks**: `src/lib/hooks/`
- **Shared UI Components**: `src/shared/ui/`
- **Mock Data**: `src/data/`

## Build & Development

✅ **Build**: `npm run build` - All imports verified and working
✅ **Dev**: `npm run dev` - Development server running at `http://localhost:5173/`
✅ **Preview**: `npm run preview` - Preview production build

All components are properly organized and imports have been updated throughout the application.
