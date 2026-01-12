## Active Blockers
- None.

## Integration Points
- 🟢 Auth + viewer identity ready: use `requireIdentity(ctx)` from `convex/guards.ts` (viewer id = `identity.subject` / Clerk user id).
- 🟢 Saved routes internal helpers ready (POC authz + NOT_FOUND semantics) in `convex/db/savedRoutes.ts`:
  - `internal.db.savedRoutes.getById`, `listByOwner`, `insert`, `patchName`, `deleteById`
- 🟢 Validator-first route shapes ready in `models/saved-routes.ts` (and re-exported from `types/routes.ts`).
- 🟢 Public endpoints ready for Sprint 2: `db.routesPlan.getPlanInit`, `db.savedRoutes.getSavedRoutesList`, `db.savedRoutes.getSavedRouteDetail`, `db.savedRoutes.saveRoute`, `db.savedRoutes.renameRoute`, `db.savedRoutes.deleteRoute` (auth required, NOT_FOUND semantics preserved, bounded list, UI view-model shapes).

## Decisions Needed
- None.

## Cross-Agent Notes
- Public Sprint 2 endpoints should be thin wrappers over Sprint 1 internals and return TRD §4.3.5 view models (`types/routes.ts`).
- Run `npx convex codegen` in a non-sandboxed environment to refresh `_generated/api` with the new public endpoints (sandbox npm permissions blocked codegen).

## Archived Items
- ✅ `pnpm type-check` failing due to app TS errors — resolved in Sprint 2 Task 06.
