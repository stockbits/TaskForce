# Project Structure - Reorganized & Simplified

## Overview
The project has been reorganized with clear, descriptive folder and file names for easy navigation and component discovery.

## New Directory Structure

```
src/
├── layout/                          # Main application layout components
│   ├── MainLayout.tsx              # Main app container (formerly AppContainer)
│   └── Sidebar.tsx                 # Left sidebar navigation
│
├── features/                        # Feature modules (organized by feature)
│   ├── callout/
│   │   └── components/
│   │       ├── CalloutLandingPage.tsx
│   │       └── CalloutIncidentPanel.tsx
│   ├── schedule/                   # Schedule & mapping features
│   │   ├── ScheduleLivePage.tsx
│   │   ├── hooks/
│   │   │   └── useLiveSelectEngine.ts
│   │   └── components/
│   │       ├── MapLegend.tsx
│   │       ├── MapPanel.tsx
│   │       ├── ResourceTablePanel.tsx
│   │       ├── SearchModeWrapper.tsx
│   │       ├── SearchToolPanel.tsx
│   │       ├── TaskTablePanel.tsx
│   │       └── TimelinePanel.tsx
│   └── tasks/                      # Task management features
│       ├── TaskManagementPage.tsx
│       └── components/
│           ├── TaskDetailsModal.tsx
│           ├── TaskPopoutPanel.tsx
│           ├── TaskSearchCard.tsx
│           └── TaskTable_Advanced.tsx
│
├── shared/                          # Shared utilities and components
│   ├── config/
│   │   ├── menuRegistry.ts         # Menu configuration
│   │   └── pins.ts                 # Map pins configuration
│   └── ui/
│       ├── IconTheme.tsx           # Icon theme utilities
│       └── TaskRowContextMenu.tsx  # Context menu component
│
├── lib/                             # Library code (hooks, utilities)
│   ├── hooks/                      # Reusable React hooks
│   │   ├── useExternalWindow.ts    # External window management
│   │   ├── usePanelDocking.tsx     # Panel docking logic
│   │   ├── useSearchLeftMenu.ts    # Left menu search
│   │   └── menuRegistry.ts         # Menu registry
│   └── utils/                      # Utility functions (empty, ready for expansion)
│
├── data/                            # Mock data and resources
│   ├── mockTasks.json              # Mock task data
│   └── ResourceMock.json           # Mock resource data
│
├── types/                           # TypeScript type definitions
│   └── index.ts
│
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
