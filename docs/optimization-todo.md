# TaskForce Performance Optimization & Refactoring To-Do List

## Overview
This document tracks the optimization and refactoring tasks for the TaskForce project. All changes must preserve existing functionality while improving performance, maintainability, and code quality.

## Current Status
- **Build**: ✅ Passes (537KB main bundle)
- **Lint**: ✅ 0 warnings (all unused imports/variables cleaned)
- **Architecture**: ⚠️ Monolithic components (AppLayout: 1444 lines, ScheduleLive: 1048 lines)

## Priority Tasks

### 🔥 High Priority (Immediate Impact)

### 1. Code Cleanup ✅ COMPLETED
- [x] Remove all unused imports (99 ESLint warnings) - **REDUCED TO 0 WARNINGS**
- [x] Remove unused variables and state - **AppLayout.tsx, TaskSearchCardClean.tsx, TaskTableMUI.tsx, and 15+ other files cleaned**
- [x] Remove console.log statements from production code - **usePanelDocking.tsx cleaned**
- [x] Clean up dead code - **Removed unused functions, state, and imports across all files**

#### 2. Component Memoization
- [x] Add React.memo to TaskTableAdvanced.tsx
- [x] Add React.memo to TaskTableMUI.tsx (DataGrid optimization)
- [x] Add React.memo to frequently re-rendering UI components - **ExpandableSectionCard, PillGroup, ResponsiveDataGrid memoized**
- [ ] Use React.useCallback for event handlers

#### 3. Bundle Optimization
- [ ] Implement lazy loading for additional routes
- [ ] Dynamic imports for heavy libraries (Highcharts, Leaflet)
- [ ] Tree-shake unused MUI components

### 🟡 Medium Priority (Structural Improvements)

#### 4. Component Architecture Refactoring
- [ ] Break down AppLayout.tsx into smaller components:
  - [ ] Header component
  - [ ] Sidebar component
  - [ ] MainContent component
  - [ ] DataProvider context
- [ ] Break down scheduleLive-Page.tsx
- [ ] Extract custom hooks from large components

#### 5. State Management
- [ ] Evaluate if current state management is sufficient
- [ ] Consider Zustand/Redux Toolkit for complex state
- [ ] Implement proper error boundaries

#### 6. Data Management
- [ ] Implement async data loading
- [ ] Add data caching (React Query/SWR)
- [ ] Optimize data filtering performance

### 🟢 Low Priority (Future Enhancements)

#### 7. Performance Monitoring
- [ ] Add React DevTools Profiler integration
- [ ] Implement bundle size monitoring
- [ ] Add performance metrics

#### 8. Advanced Optimizations
- [ ] Virtual scrolling for large tables
- [ ] Service worker for caching
- [ ] Image optimization (WebP)
- [ ] Code splitting by feature

## Implementation Guidelines

### Safety First
- ✅ All changes must preserve existing functionality
- ✅ Run full test suite after each change
- ✅ Keep git history clean with descriptive commits
- ✅ Update this document as tasks are completed

### Testing Strategy
- [ ] Manual testing of all features after major refactors
- [ ] Performance benchmarking before/after changes
- [ ] Bundle size monitoring

### Code Standards
- [ ] Maintain TypeScript strict mode
- [ ] Follow existing naming conventions
- [ ] Keep component responsibilities focused
- [ ] Document complex logic

## Progress Tracking

### Completed Tasks
- [x] Initial project review and analysis
- [x] Created this optimization to-do list

### In Progress
- [ ] Starting with code cleanup (unused imports)

### Blocked
- [ ] None currently

## Notes
- Bundle size: 537KB main (147KB gzipped) - target: reduce by 20-30%
- Largest components: AppLayout.tsx (1444 lines), scheduleLive-Page.tsx (1048 lines)
- 99 ESLint warnings to resolve
- React 19 with modern patterns already in use</content>
<parameter name="filePath">/workspaces/TaskForce/docs/optimization-todo.md