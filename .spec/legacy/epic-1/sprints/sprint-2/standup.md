## Sprint 2 Standup Log

> Append-only. Add a new dated section for each work session.

## 2026-01-12 - Backend Engineer - Sprint 2 public APIs

### Status
- Current Sprint: sprint-2
- Task: Sprint 2 backend public APIs (routesPlan + savedRoutes)
- Status: Completed

### Work Completed
- Implemented `db.routesPlan.getPlanInit` with auth guard and validated `PlanInitView`.
- Added public saved-routes endpoints: list, detail (NOT_FOUND-safe), save, rename, delete; reuse Sprint 1 internals and shared validators.
- Enforced list bounding, preview computation, capabilities defaults, and explicit return types.
- Ran `pnpm tsc -p convex/tsconfig.json --noEmit` (pass).

### Decisions Made
- Kept client-facing ids stringified; relied on existing internal helpers for authz/NOT_FOUND semantics.

### Issues/Blockers
- Convex codegen not refreshed in sandbox (npm global permission issue). Needs `npx convex codegen` in normal env.

### Next Steps
- Run `npx convex codegen` to refresh `_generated/api` with new public endpoints.
- (Optional) smoke-call new endpoints with/without auth.

## 2026-01-12 - UI Developer - Sprint 2 Task 06 type-check unblock

### Status
- Current Sprint: sprint-2
- Task: Task 06 — Unblock repo-wide `pnpm type-check`
- Status: Completed

### Work Completed
- Fixed Convex strict TS circularity in `convex/db/savedRoutes.ts` by routing same-file internal calls through `internalSavedRoutes` with explicit typings; `pnpm type-check` now passes.
- Added root `CODING_STANDARDS.md` referencing the authoritative rule docs.
- Updated sprint docs: marked Task 06 complete; cleared blocker in handoff.

### Decisions Made
- Kept behavior identical; only typing adjustments for Convex same-file calls.

### Issues/Blockers
- None.

### Next Steps
- None for Task 06.