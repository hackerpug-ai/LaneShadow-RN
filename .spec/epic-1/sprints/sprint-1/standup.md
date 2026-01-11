## 2026-01-11 - Backend Engineer Agent - Task 01 saved-routes validators

### Status
- Current Sprint: sprint-1
- Task: Task 01 — Backend: Add v-first validators for saved routes + route shapes
- Status: Completed

### Work Completed
- Added `models/saved-routes.ts` with Convex `v` validators and inferred types for TRD §3.1–§3.4 + §4.3.3 shapes (PlanInput, RouteSnapshot, RouteIndex, SnapshotMeta, SavedRouteCapabilities, SavedRoute doc).
- Documented POC geometry policy in `routeSnapshotValidator` comment (overview + legs only; no step-level polylines).
- Confirmed lint clean for the new model file.

### Decisions Made
- Kept validators forward-compatible; POC enforcement (user-private, no step-level geometry) remains in access/helpers, not the validators.

### Issues/Blockers
- None.

### Next Steps
- Task 02: wire `saved_routes` table + indexes in `convex/schema.ts` using `savedRouteValidator`.
- Task 04: enforce POC authz/NOT_FOUND semantics in internal saved-routes helpers using these validators.

## 2026-01-11 - Backend Engineer Agent - Task 02 saved_routes schema

### Status
- Current Sprint: sprint-1
- Task: Task 02 — Backend: Add `saved_routes` table + indexes to `convex/schema.ts`
- Status: Completed

### Work Completed
- Imported `savedRouteValidator` into `convex/schema.ts`.
- Added `saved_routes` table with indexes `by_ownerType_and_ownerId` and `by_createdByUserId` (TRD §3.1).

### Decisions Made
- None.

### Issues/Blockers
- Did not run `npx convex dev` or `pnpm type-check` in this session; should be run before shipping.

### Next Steps
- Run `npx convex dev` to confirm schema/codegen.
- Run `pnpm type-check` to confirm no TS regressions.
- Proceed to Task 04 authz/NOT_FOUND helpers using these shapes and indexes.
