## Active Blockers
- 🟡 `pnpm type-check` failing due to unrelated app TypeScript errors in `app/(app)/*` and `app/(auth)/*` (duplicate identifiers / multiple default exports). Convex-only typecheck passes (`pnpm tsc -p convex/tsconfig.json --noEmit`).

## Integration Points
- 🟢 Saved routes validators ready: `models/saved-routes.ts` exports TRD-aligned validators/types for PlanInput, RouteSnapshot (overview+legs only), RouteIndex, SnapshotMeta, SavedRouteCapabilities, and SavedRoute document. Use these directly in `convex/schema.ts` (Task 02) and internal helpers (Task 04) to avoid redefining shapes.
- 🟢 Saved routes schema ready: `convex/schema.ts` now defines `saved_routes` with indexes `by_ownerType_and_ownerId` and `by_createdByUserId`. Consumer queries should use these indexes (ownerType+ownerId, createdByUserId) to avoid filters.
- 🟢 Auth wiring ready: Clerk JWT + Convex gating implemented. Use `requireAuth` from `convex/guards.ts` (viewerUserId = identity.subject). Client uses `ConvexProviderWithClerk` and SecureStore token cache.
- 🟢 Session preload ready: `convex/db/users.ts` exposes `upsertCurrent` and `getSession` keyed by `clerkUserId`. User model/schema updated with `clerkUserId` and `by_clerkUserId` index.
- 🟢 Saved routes internal helpers ready: `convex/db/savedRoutes.ts` provides internalQuery/internalMutation functions (`getById`, `listByOwner`, `insert`, `patchName`, `deleteById`) enforcing POC authz (ownerType=user, visibility=private, ownerId=viewer) and NOT_FOUND semantics (throws `NOT_FOUND` on missing/not-owned for mutations; queries return null).
- 🟢 Shared Epic 1 route contracts ready: `types/routes.ts` re-exports server-derived types from `models/saved-routes.ts` (including `RoutePreview`) and defines view-model types (`PlanInitView`, `SavedRouteListItemView`, `SavedRoutesListView`, `SavedRouteDetailView`).
- 🟢 Clerk webhooks sync ready:
  - `convex/http.ts` POST `/clerk-webhooks` verifies Svix and routes events to internal mutations.
  - Payload is sanitized at the HTTP boundary to match strict Convex validators (prevents `ArgumentValidationError` on extra Clerk fields).
  - Internal reconcile mutations: `convex/db/clerkSync.ts` (users/orgs/memberships).
  - Schema/models: `models/orgs.ts`, `models/org-memberships.ts`, plus `orgs` and `org_memberships` tables/indexes in `convex/schema.ts`.
  - Convex env vars required: `CLERK_WEBHOOK_SECRET`, `CLERK_JWT_ISSUER_DOMAIN`, `CLERK_SECRET_KEY`.
- 🟢 Convex → Clerk profile update path ready:
  - `convex/actions/users.ts:updateCurrentProfile` updates Clerk (name only) via `@clerk/backend` then reconciles local Convex user.
- 🟢 Error code mapping convention ready:
  - Server error codes + human-readable messages centralized in `lib/errors.ts`.
- 🟢 Theme ready: `app/_layout.tsx` now provides `ExtendedTheme` via `getTheme`/`useColorScheme`; semantic tokens updated to copper/dark palette with new keys (`divider`, `scrim`, `routeSelected`, `routeAlternate`). See `styles/theme.ts` and `app/README.md` for usage rules.

## Decisions Needed
- None.

## Cross-Agent Notes
- POC geometry policy is documented in `routeSnapshotValidator` comment (overview + leg polylines only; no step-level storage). Enforcement should remain in access/helpers, not validators.

## Archived Items
- None.
