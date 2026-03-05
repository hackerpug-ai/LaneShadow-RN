## Sprint 1 — Infra foundations: theming + auth + data modeling

**Status**: ⏳ **Planned**

**Goal**: Land cross-cutting infra (theming + auth plumbing) and the core data model so backend work can proceed safely and UI can start later without churn.

**Infra deliverables (Frontend)**

- Theming foundations:
  - Standardize on semantic theme usage via `useSemanticTheme()` for new Epic 1 UI.
  - Confirm baseline component primitives (Paper `Text`, shared UI components under `components/ui/`) are ready for map/sheet UI.
- Auth foundations:
  - Confirm Epic 1-required auth surfaces exist and are reachable:
    - SessionRestoring (V010)
    - AuthSignIn (V008) / AuthSignUp (V009)
  - Document the expected “dev auth” path to get an authenticated user session for testing.

**Backend deliverables**

- Add `saved_routes` table + indexes per TRD §3.1 to `convex/schema.ts`.
- Add v-first validators for the TRD shared type catalog (§4.3.4), including:
  - `PlanInput`, `PlanPreferences`, `RouteStop`
  - `Bounds`, `PolylineGeometry`, `RouteLeg`, `RouteSnapshot`
  - `RouteIndex`, `SnapshotMeta`, `RoutePreview`
  - wind overlay types (`WindOverlay*`, `RouteOverlays`)
  - `SavedRouteCapabilities`
- Enforce POC geometry policy in stored snapshots: **overviewGeometry + leg polylines only** (no step-level instructions/polylines).
- Implement internal “viewer” helper (TRD §4.3.5) and enforce POC authz (TRD §4.3.2):
  - all saved routes are user-private; reads/mutations return NOT_FOUND when unauthorized
- Establish shared types/contracts in the repo (so later sprints can “import, don’t redefine”):
  - TS types that mirror the TRD shared type catalog (§4.3.4) and view models (§4.3.5) for client-side typing.

**Acceptance criteria**

- Schema compiles and Convex codegen succeeds.
- Auth-required behavior is in place for all Epic 1 endpoints; unauthorized access does not leak existence (NOT_FOUND semantics).
- Convex functions and validators are `v`-first (no Zod-first `zQuery`/`zMutation` patterns).
- Theming and auth expectations are documented well enough that Sprint 4 UI work does not need to revisit fundamentals.
