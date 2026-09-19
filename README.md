# TaskForce clean architecture

This branch contains the new application foundation. The previous feature implementation remains available on the main branch while features are redesigned and migrated deliberately.

## Structure

- `src/application`: application entry point, providers, layout, and navigation
- `src/features`: self-contained business features
- `src/shared`: reusable components, theme, types, and utilities
- `src/styles`: global styling
- `documentation`: architecture and migration guidance

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
```
