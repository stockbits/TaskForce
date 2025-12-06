# src — Project layout and path aliases

This project uses a feature-oriented structure and path aliases to keep imports readable and consistent.

Top-level folders under `src/`:
- `A-Navigation_Container/` — App shell, `AppContainer`, `SidePanel`, and layout-specific pieces (kept small).
- `features/` — Feature-based code (UI + subcomponents + hooks). Example: `features/tasks`, `features/schedule`, `features/callout`.
- `lib/` — Shared low-level libraries and utilities (non-React helpers). `lib/hooks/` contains reusable hooks.
- `shared/` — Shared UI and config used across features. Examples: `shared/ui/`, `shared/config/`.
- `types/` — Centralized TypeScript interfaces and shared types (`src/types/index.ts`).
- `data/` — Static JSON/mock data files.
- `components/` — Legacy / small global components (kept intentionally small). Avoid adding feature-scoped components here.

Path alias conventions (see `tsconfig.json` and `vite.config.ts`):
- `@/` -> `src/`
- `@types` -> `src/types`
- `@lib`  -> `src/lib`
- `@hooks` -> `src/lib/hooks`
- `@utils` -> `src/lib/utils`
- `@features` -> `src/features`
- `@shared` -> `src/shared`
- `@config` -> `src/shared/config`
- `@ui` -> `src/shared/ui`

Best practices
- Feature code lives inside `src/features/<feature>/...` (components, pages, and feature-local hooks).
- Use `@/features/...` or `@/data/...` when importing from other parts of the app.
- Keep `src/components/` for small, truly global components (icons, tiny utilities). Prefer moving larger UI into a feature folder.
- Centralize shared types in `src/types/index.ts` and import from `@types` or `@/types`.
- When moving files, update imports to use the aliases above — this prevents brittle relative paths.

If you want, I can also:
- Move any remaining global items into a `shell/` folder (App layout) or delete leftover duplicates.
- Generate a short script to validate imports (scan for `../..` patterns) and warn about stale relative paths.

---
Generated: December 6, 2025
