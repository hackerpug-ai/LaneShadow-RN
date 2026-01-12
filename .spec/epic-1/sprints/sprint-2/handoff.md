## Active Blockers
- 🟡 `pnpm type-check` failing due to app TypeScript errors (carried from Sprint 1). See Task 06 in `tasks.md`.

## Integration Points
- 🟢 Auth + viewer identity ready: use `requireIdentity(ctx)` from `convex/guards.ts` (viewer id = `identity.subject` / Clerk user id).
- 🟢 Saved routes internal helpers ready (POC authz + NOT_FOUND semantics) in `convex/db/savedRoutes.ts`:
  - `internal.db.savedRoutes.getById`, `listByOwner`, `insert`, `patchName`, `deleteById`
- 🟢 Validator-first route shapes ready in `models/saved-routes.ts` (and re-exported from `types/routes.ts`).

## Decisions Needed
- None.

## Cross-Agent Notes
- Public Sprint 2 endpoints should be thin wrappers over Sprint 1 internals and return TRD §4.3.5 view models (`types/routes.ts`).

## Archived Items
- None.
