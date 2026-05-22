# Pre-Existing Issues Blocking Commit

## TypeScript Errors
- `server/convex/**` — missing generated Convex modules such as `../_generated/dataModel`, `../../_generated/api`, and `../_generated/server`
- `server/convex/**` — numerous unrelated implicit `any` and stale `@ts-expect-error` diagnostics

## Lint Warnings / Errors
- `biome.json` — schema version mismatch (`2.4.12` config vs `2.4.15` CLI)
- `react-native/app/(app)/_layout.tsx:7` — unused `sessionId`
- `.kb-run-sprint/state.json` — formatting drift outside this task
- `logos/**/*.html` — existing accessibility diagnostics (`useAltText`)

## Test Failures
- No pre-existing iOS failures were required to be fixed for this task.

All issues were observed in repo-wide gates unrelated to the iOS files changed for `FIX-S08-IOS-T02`.
