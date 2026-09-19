# Application architecture

TaskForce is organised by business feature. Application-wide composition lives under `application`; reusable building blocks live under `shared`.

A feature owns its pages, components, hooks, types, and utilities. Features may import from `shared`, but they should not import another feature's internal files. Cross-feature orchestration belongs under `application`.

## Migration order

1. Confirm the foundation builds and renders.
2. Establish shared task and resource contracts.
3. Migrate task management.
4. Migrate live scheduling.
5. Migrate callout management.
6. Migrate task and resource detail windows.
7. Replace mock data with explicit repositories or service adapters.

The previous implementation should be consulted from the main branch rather than copied into a legacy directory.
