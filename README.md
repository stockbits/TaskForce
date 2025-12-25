# TaskForce — Local Development Notes

This repository includes a small scheduler helper used to populate mock task `expectedStartDate` values for the timeline UI.

- Scheduler script: `scripts/assignTasks.cjs`
- Run locally with: `npm run schedule` (adds/updates `src/data/mockTasks.json` with ISO timestamps)

Notes:
- The script is a helper for local/demo purposes only — the app does not import or execute it at runtime.
- If you want to regenerate mock schedules, run `npm run schedule` and then restart the dev server.
