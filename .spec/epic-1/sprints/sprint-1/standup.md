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

## 2026-01-11 - Backend Engineer Agent - Task 03 Clerk JWT auth + viewer/sessions/webhooks

### Status
- Current Sprint: sprint-1
- Task: Task 03 — Clerk JWT auth wiring, viewer guard, user session preload, webhooks stub
- Status: Completed

### Work Completed
- Added Clerk + Convex auth wiring with SecureStore token cache and `ConvexProviderWithClerk` in `app/_layout.tsx`.
- Added Convex route gating with `<Authenticated>/<Unauthenticated>` in `app/(auth)/_layout.tsx` and `app/(app)/_layout.tsx`; sign-in/sign-up screens and sign-out button.
- Added `convex/auth.config.ts` (Clerk issuer domain, applicationID “convex”).
- Added `requireAuth` guard in `convex/guards.ts` (viewerUserId = identity.subject).
- Updated user model/schema to include `clerkUserId` + `by_clerkUserId`; added `convex/db/users.ts` (`upsertCurrent`, `getSession`).
- Added `convex/http.ts` POST `/clerk-webhooks` with Svix verification (logs event types, stub handlers).

### Decisions Made
- Guard lives in `convex/guards.ts` (exception to db/actions layout); viewerUserId is identity.subject (Clerk user id).

### Issues/Blockers
- None. Peer warnings from Clerk about React 19 are noted but non-blocking.

### Next Steps
- Run `pnpm type-check` and `npx convex dev` to confirm end-to-end after envs set.
- Wire Task 04 saved-routes authz/NOT_FOUND using `requireAuth`/viewerUserId and the saved_routes indexes.

## 2026-01-11 - UI Developer Agent - Task 06 semantic theme + token mapping

### Status
- Current Sprint: sprint-1
- Task: Task 06 — Frontend: Wire the semantic theme into the app root
- Status: Completed

### Work Completed
- Wired `app/_layout.tsx` to provide `ExtendedTheme` via `getTheme(useColorScheme())` into `PaperProvider`.
- Updated `styles/types.ts` to add semantic keys `divider`, `scrim`, `routeSelected`, `routeAlternate`.
- Remapped `styles/theme.ts` to the Lane Shadow copper/dark palette per `.spec/designs/TOKENS.md`; added new keys for both light/dark themes.
- Documented Epic 1 styling rules in `app/README.md` (useSemanticTheme, Paper Text, no hardcoded values, relative imports).

### Decisions Made
- Standardized `routeSelected`/`routeAlternate` as separate semantic keys (not overloading `primary`) for map rendering.
- Set `onPrimary` to dark text (`#0E0F11`) to align with TOKENS inverse intent.

### Issues/Blockers
- Manual runtime verification not executed in this session; should launch app to confirm screens render with new theme.

### Next Steps
- Run the app to sanity-check `useSemanticTheme()` and new tokens.
- If UI components need specific variants, use the new semantic keys rather than hardcoded colors.

## 2026-01-11 - Backend Engineer Agent - Task 03b Clerk webhooks sync + org/membership data

### Status
- Current Sprint: sprint-1
- Task: Task 03b — Backend: Clerk webhooks sync users/orgs/memberships + profile update action
- Status: Completed

### Work Completed
- Implemented Svix-verified Clerk webhook routing in `convex/http.ts` that dispatches by `event.type` and calls internal mutations for:
  - `user.created`, `user.updated`, `user.deleted`
  - `organization.created`, `organization.updated`, `organization.deleted`
  - `organizationMembership.created`, `organizationMembership.updated`, `organizationMembership.deleted`
- Fixed Convex HTTP runtime error `Buffer is not defined` by verifying Svix using `await req.text()` (raw body string) instead of `Buffer`.
- Added payload sanitization in `convex/http.ts` to strip Clerk webhook objects down to the exact shapes accepted by Convex validators (prevents `ArgumentValidationError` from extra fields like `created_at` inside `email_addresses`).
- Added validator-first models + schema:
  - `models/orgs.ts`, `models/org-memberships.ts`
  - `convex/schema.ts` tables `orgs` and `org_memberships` with indexes `by_clerkOrgId`, `by_userId_and_orgId`, `by_orgId`, `by_userId`
- Added internal reconcile mutations in `convex/db/clerkSync.ts` for idempotent upsert/delete of users/orgs/memberships.
- Added `lastLocalUpdateAt` to user/org models and ensured local user upsert writes it.
- Added `convex/actions/users.ts:updateCurrentProfile` action to push profile name changes to Clerk via `@clerk/backend`, then reconcile local Convex user.
- Centralized server error codes and human-readable messages in `lib/errors.ts` and documented the convention in `.cursor/agents/backend-engineer.md`.

### Decisions Made
- Keep Convex validators strict; sanitize webhook payloads at the HTTP boundary rather than loosening validators to `v.any()`.
- For Convex HTTP actions, avoid Node globals (e.g. `Buffer`) even though webhooks are verified with Svix.

### Issues/Blockers
- `pnpm type-check` currently fails due to unrelated app TypeScript errors in `app/(app)/*` and `app/(auth)/*`; Convex-only typecheck passes with `pnpm tsc -p convex/tsconfig.json --noEmit`.

### Next Steps
- Add ordering / out-of-order guards in `convex/db/clerkSync.ts` (e.g. skip applying older `updated_at` events) if we see webhook delivery reordering in practice.
- Decide if email updates should be supported via Clerk’s dedicated email APIs (currently profile update action updates name only).
