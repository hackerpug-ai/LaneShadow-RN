## Active Blockers
- None.

## Integration Points
- 🟢 Saved routes validators ready: `models/saved-routes.ts` exports TRD-aligned validators/types for PlanInput, RouteSnapshot (overview+legs only), RouteIndex, SnapshotMeta, SavedRouteCapabilities, and SavedRoute document. Use these directly in `convex/schema.ts` (Task 02) and internal helpers (Task 04) to avoid redefining shapes.
- 🟢 Saved routes schema ready: `convex/schema.ts` now defines `saved_routes` with indexes `by_ownerType_and_ownerId` and `by_createdByUserId`. Consumer queries should use these indexes (ownerType+ownerId, createdByUserId) to avoid filters.
- 🟢 Auth wiring ready: Clerk JWT + Convex gating implemented. Use `requireAuth` from `convex/guards.ts` (viewerUserId = identity.subject). Client uses `ConvexProviderWithClerk` and SecureStore token cache.
- 🟢 Session preload ready: `convex/db/users.ts` exposes `upsertCurrent` and `getSession` keyed by `clerkUserId`. User model/schema updated with `clerkUserId` and `by_clerkUserId` index.
- 🟢 Webhooks stub: `convex/http.ts` has POST `/clerk-webhooks` with Svix verification; handlers currently log event types (no entity changes).

## Decisions Needed
- None.

## Cross-Agent Notes
- POC geometry policy is documented in `routeSnapshotValidator` comment (overview + leg polylines only; no step-level storage). Enforcement should remain in access/helpers, not validators.

## Archived Items
- None.
