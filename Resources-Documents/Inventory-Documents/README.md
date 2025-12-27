# Project Notes Directory

This folder contains all project notes, logs, and documentation for easy access.

- Place meeting notes, migration logs, technical decisions, and planning docs here.
- Use Markdown for formatting and organization.

## Example Files
- `migration-log.md` — Record of major refactors and technology changes
- `meeting-YYYY-MM-DD.md` — Notes from team meetings
- `feature-planning.md` — Feature ideas and roadmap

## Recent Updates (2025-12-14)

### Code Cleanup & Optimization
- **Removed debug console.log statements** from production code across multiple files
- **Eliminated duplicate file**: Removed unused `src/layout/MainLayout.tsx`
- **Extracted filtering logic** into reusable `src/hooks/useTaskFilters.ts` hook
- **Implemented code splitting**: Made `ScheduleLivePage` lazy-loaded for better performance
- **Bundle size improvement**: Reduced main bundle from 787KB to 573KB (27% reduction)

### Files Changed
- `src/layout/AppLayout.tsx` - Updated imports, removed duplicate logic
- `src/hooks/useTaskFilters.ts` - New utility hook for task filtering
- `src/shared-ui/ResponsiveTable/TaskTableMUI.tsx` - Removed debug logs
- `src/schedule/ScheduleLivePage.tsx` - Removed debug logs
- `src/tasks/TaskManagementPage.tsx` - Removed debug logs
- `docs/notes/STRUCTURE.md` - Updated to reflect removed duplicate file
- `docs/notes/mui-migration-log.md` - Updated file references
- `docs/notes/mui-component-inventory.md` - Updated file references

---

Add new notes as needed to keep project documentation organized and accessible.
