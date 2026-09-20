# TaskForce clean architecture

This branch contains the new application foundation. The previous feature implementation remains available on the main branch while features are redesigned and migrated deliberately.

## Structure

- `src/application`: application entry point, providers, layout, and navigation
- `src/features`: self-contained business features
- `src/shared`: reusable components, theme, types, and utilities
- `src/styles`: global styling
- `documentation`: architecture and migration guidance

See `documentation/component-catalogue.md` for the main-branch component
inventory and the old-to-new migration decisions.

## Naming

- React components use PascalCase and descriptive full words.
- Hooks use camelCase and start with `use`.
- Utility files use camelCase.
- Folders use lowercase kebab-case.
- File and folder names do not contain spaces.
- Avoid abbreviations in project-owned names.
- External contract fields are not renamed without an adapter.

## Commands

```bash
npm install
npm run dev
npm run build
npm run lint
node --test validation/foundation.test.mjs
```

## Preview the foundation

Open **Component Library** in the navigation to try the reusable controls.
Task Management and Live Schedule remain placeholders.

For mobile checks, open `/validation/responsive-preview.html` on the development
server. Select a viewport width and text scale, navigate inside the preview, and
use **Measure overflow**. Also check with browser zoom and a real mobile device.
The validation harness is development-only and excluded from the production build.

Build, lint, and four architecture checks pass. Visual browser validation is
pending; see `documentation/architecture.md` for the checklist and limitations.
