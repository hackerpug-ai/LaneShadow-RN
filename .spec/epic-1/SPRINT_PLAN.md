# Epic 1 Sprint Plan (Scenic Route Planning & Saving)

## Current Status (as of 2026-01-13)

- **Epic status**: **In Progress**
  - ✅ Sprint 1 complete (infra: theming + auth + data modeling)
  - ✅ Sprint 2 complete (Backend APIs: saved routes + plan init)
  - ✅ Sprint 3 complete (Backend data flows: PlanRide action + providers + overlays)
  - Next: Sprint 4 (UI implementation: planning flows + map rendering + saved routes)

**Implementation reality check (repo)**
- ✅ The public DB API surface for Epic 1 exists (`convex/db/routesPlan.ts`, `convex/db/savedRoutes.ts`).
- ✅ The **public planning action is now implemented**:
  - `convex/actions/agent/planRide.ts` exporting `planRide` (TRD §4.2 / §4.3.6)
  - Uses LangGraph `StateGraph` with structured LLM output (`graphs/planningGraph.ts`)
  - Full pipeline: LLM sketches → compile → normalize → index → conditions (soft-fail)
  - LangSmith observability integrated (project: `LaneShadowDev`)

## Scope summary (what must be complete by final sprint)

- **Backend (Convex)**:
  - `saved_routes` table + indexes (TRD §3.1)
  - Public view-model queries/mutations (TRD §4.3.5):
    - `db.routesPlan.getPlanInit`
    - `db.savedRoutes.getSavedRoutesList`
    - `db.savedRoutes.getSavedRouteDetail`
    - `db.savedRoutes.saveRoute`
    - `db.savedRoutes.renameRoute`
    - `db.savedRoutes.deleteRoute`
  - Public action for route planning orchestration (TRD §4.3.5):
    - `actions.agent.planRide`
  - Internal helpers for viewer/authz and saved routes access (TRD §4.3.5)
  - Deterministic, provider-backed route snapshots persisted for identical replay (TRD §1.2, §7)
  - Error codes and soft-failure behavior for conditions (TRD §11, §6.2.10)

- **Frontend (Expo/React Native)**:
  - Screens/sheets listed in TRD §6.1, at minimum the “most essential” subset (TRD §6.3):
    - **HomeMap (V001)** + planning sheets (S001–S004) + loading overlay (V004)
    - **SavedRoutesList (V002)** + **SavedRouteDetail (V003)**
    - **SessionRestoring (V010)** + **AuthSignIn (V008)** (existing auth wrapper)
  - Map rendering contract: overview → legs → overlays → annotations (TRD §7)
  - Save + reopen flows render snapshots without recomputation (TRD §7 rules)

- **Cross-cutting**:
  - Ensure bounded fan-out (TRD §9): list returns summaries; details return full snapshots; planning returns max 2–3 options
  - Provider-agnostic geometry representation (TRD §1.2, §3.3)
  - Forward-compatible ownership/visibility model (TRD §3.1, §8) while POC enforces user-private only (TRD §4.3.2)

## Convex endpoint placement (repo convention; required)

Per TRD §1.2 and `.cursor/rules/convex_rules.mdc`:

- **All queries/mutations (public + internal)** live under **`convex/db/`** (V8 runtime, `ctx.db` access).
- **Actions** (external APIs / Node runtime) live under **`convex/actions/`**.
- **Agentic planning orchestration** lives under **`convex/actions/agent/`**.

Planned implementation locations:
- `convex/db/routesPlan.ts` (public) and `convex/db/routesPlan/internal/*` (internal helpers as needed)
- `convex/db/savedRoutes.ts` (public) and `convex/db/savedRoutes/internal/*` (internal helpers as needed)
- `convex/actions/agent/planRide.ts` (public action)
- `convex/actions/places.ts` (optional; only if we implement autocomplete/detail for place search in Epic 1)

## Frontend placeholder hooks + backend swap protocol (required)

To keep UI unblocked while the Node-runtime planning action/provider integrations are in progress, Epic 1 UI surfaces should be implemented against **placeholder hooks first**, then swapped to real Convex queries/mutations when backend is ready.

### Rules

- **Frontend work**:
  - Build screens/components using a **placeholder hook** that returns **typed mock data** matching the TRD contracts:
    - Shared types catalog (§4.3.4)
    - View models (§4.3.5)
  - Placeholder hooks live in `hooks/` and follow this naming:
    - `hooks/use-plan-init-placeholder.ts`
    - `hooks/use-plan-ride-placeholder.ts`
    - `hooks/use-saved-routes-list-placeholder.ts`
    - `hooks/use-saved-route-detail-placeholder.ts`
  - Placeholder hooks must return the **same shape** as the eventual `api.db.*` / `api.actions.*` responses so swap-over is mechanical.
  - Screens should have a single “data source seam” (one hook call) so replacing placeholder → real is a single edit.

- **Backend work**:
  - When endpoints are ready, integration replaces placeholder usage with:
    - `useQuery(api.db.routesPlan.getPlanInit, args)`
    - `useAction(api.actions.agent.planRide)` (or equivalent Convex action hook in the project)
    - `useQuery(api.db.savedRoutes.getSavedRoutesList, args)`
    - `useQuery(api.db.savedRoutes.getSavedRouteDetail, args)`
    - `useMutation(api.db.savedRoutes.saveRoute)` / `renameRoute` / `deleteRoute`
  - Remove placeholder-only transforms once backend returns canonical computed fields.

### Why

- Keeps UI progress independent of provider selection and external API keys.
- Enforces strict contract fidelity to TRD view-models.
- Makes integration a deterministic “swap the hook” step rather than a refactor.

## Dev workflow: seed a repeatable “saved route” scenario (required)

To validate Epic 1 end-to-end (planning → route overview → save → reopen), maintain a **repeatable seed path** that can be run in dev without manual setup.

### Requirements

- Provide a seed entrypoint that can be run repeatedly (idempotent where possible).
- Seed should include:
  - An authenticated test user (Clerk/dev auth story TBD; see decision checkpoint below)
  - At least 2 saved routes with:
    - distinct names
    - realistic planInput (TRD §4.3.4 `PlanInput`)
    - routeSnapshot with:
      - origin + destination + waypoints (TRD §3.3, §4.3.4 `RouteStop`)
      - overviewGeometry + legs[] (TRD §3.3, POC geometry policy: overview + leg polylines only)
    - routeIndex with sampled points
    - overlays.wind present as either real data or `"unavailable"` status (TRD §6.2.10 guidance)
- Seed should support exercising:
  - Saved routes list empty/non-empty
  - Detail view replay without recomputation
  - Rename + delete flows

### Expected output

- A known “seeded library” of saved routes you can immediately open and render.

## Pre-sprint decision checkpoint (required before Sprint 1 starts)

- **Mapping SDK choice (required)**:
  - Options: Google Maps vs Mapbox vs other.
  - Sprint plan default: keep geometry provider-agnostic (TRD §1.2) and represent lines as polyline strings per TRD §3.3.

- **Routing provider choice (required)**:
  - Needs to support: via points, **leg geometry**, and predictable encoding/precision (TRD §3.3, §4.3.4 `PolylineGeometry`).
  - POC geometry policy: **store overview + leg polylines only** (no step-level instructions/polylines).
  - Sprint plan default: stub routing provider in Sprint 1 with deterministic mock snapshots; lock provider in Sprint 2 before implementing real compilation.

- **Places UX scope (optional for POC)**:
  - If we implement PlaceSearchSheet (S006), decide provider (Google Places / Mapbox Search / etc).
  - Sprint plan default: defer full autocomplete UX; allow plan input via minimal “label + lat/lng” (or coarse geocode) until Sprint 4.

- **Auth story for dev seeding (required)**:
  - How do we authenticate locally to call Convex functions and seed dev data?
  - Sprint plan default: use existing Clerk integration + a documented dev user flow; seed runs in the context of an authed user.

## Sprint 1 — Infra foundations: theming + auth + data modeling

**Status**: ✅ **Complete**

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

## Sprint 2 — Backend APIs: saved routes + plan init (view-model queries/mutations)

**Status**: ✅ **Complete**

**Goal**: Implement the full public DB API surface for saved routes + plan init, returning UI-shaped view models per TRD §4.3.5 (using shared types from §4.3.4).

**Backend deliverables**

Implement the TRD §4.3.5 public queries/mutations under `convex/db/*`:

- `db.routesPlan.getPlanInit` (query → PlanInitView)
- `db.savedRoutes.getSavedRoutesList` (query → SavedRoutesListView)
- `db.savedRoutes.getSavedRouteDetail` (query → SavedRouteDetailView)
- `db.savedRoutes.saveRoute` (mutation → `{ savedRouteId }`)
- `db.savedRoutes.renameRoute` (mutation → `null`)
- `db.savedRoutes.deleteRoute` (mutation → `null`)

Also:
- Capabilities model (SavedRouteCapabilities) returned on list + detail (TRD §4.3.3–4.3.4)
- Error semantics (TRD §11), including NOT_FOUND behavior for unauthorized access (TRD §4.3.2)

**Acceptance criteria**

- All endpoints in TRD §4.3.5 (db surface) exist and return the view-model shapes in TRD §4.3.5 (using shared types from §4.3.4).
- Saved routes are immutable snapshots (only metadata like `name` can change).
- Saved routes list is summary-only and bounded (TRD §9).

## Sprint 3 — Backend data flows: PlanRide action + providers + overlays

**Status**: ✅ **Complete**

**Goal**: Implement `actions.agent.planRide` end-to-end so planning produces provider-backed, normalized route options with wind overlay support and clear error behavior.

**Backend deliverables**

- ✅ Implement `actions.agent.planRide` (action → PlannedRouteOptionsView, TRD §4.3.5) including:
  - LLM route sketching + validation (TRD §5.2 constraints) — via LangGraph `StateGraph`
  - Compile sketch into provider route (TRD §5.3)
  - Normalize provider output into `routeSnapshot` (TRD §3.3)
  - Compute `routeIndex` (TRD §3.4)
  - Conditions probing / wind overlay mapping with soft-fail support (TRD §6.2.10)
  - Error codes per TRD §11 (INVALID_INPUT, LLM_SKETCH_INVALID/AMBIGUOUS, ROUTING_COMPILE_FAILED, CONDITIONS_LOOKUP_FAILED)
- ✅ Implement **reliability standards** for the agentic pipeline (TRD §4.2.1):
  - timeouts for external calls (LLM / routing / weather)
  - bounded concurrency + bounded fan-out
  - retry-once policy with explicit fallback behavior
  - deterministic error-code semantics (no free-form throw strings in leaf tools)
- ✅ Ensure planning is bounded (max 2–3 options) and avoids excessive action→query/mutation fan-out (Convex best practices).

**Key implementation decisions (Sprint 3)**

- **LangGraph over raw LangChain**: Refactored from `createAgent` to LangGraph `StateGraph` for clearer separation of probabilistic (LLM) vs deterministic (tools) logic, conditional edges, and LangSmith observability.
- **Structured output strategy**: Use `model.withStructuredOutput(zod_schema)` directly on GPT-4O; no agent/tools overhead for sketch generation (no dynamic tool calling needed).
- **Weather provider**: Open-Meteo chosen for POC (no API key required, bounded probing, soft-fail contract).
- **Wind summary levels**: Centralized in `models/saved-routes.ts` as `WIND_SUMMARY = { LOW, MODERATE, HIGH, UNAVAILABLE }`.

**Files delivered**

| Component | File |
|-----------|------|
| Main action | `convex/actions/agent/planRide.ts` |
| LangGraph pipeline | `convex/actions/agent/graphs/planningGraph.ts` |
| Error codes | `lib/errors.ts` |
| RouteSketch model | `models/route-sketch.ts` |
| Routing provider | `convex/actions/agent/providers/routing-provider.ts` |
| Weather provider | `convex/actions/agent/providers/weather-provider.ts` |
| Compile sketch | `convex/actions/agent/tools/compile-sketch.ts` |
| Normalize route | `convex/actions/agent/tools/normalize-route.ts` |
| Compute index | `convex/actions/agent/tools/compute-route-index.ts` |
| Probe conditions | `convex/actions/agent/tools/probe-conditions.ts` |
| Map conditions | `convex/actions/agent/tools/map-conditions.ts` |

**Acceptance criteria**

- ✅ Given valid start/end input, `planRide` returns 2–3 options with:
  - label, rationale
  - stats (distance/duration/legsCount)
  - map bounds + overviewGeometry + legs[]
  - overlaysPreview.windSummary + conditionsStatus
- ✅ Hard failures produce deterministic error codes.
- ✅ Soft conditions failures still return routes with `conditionsStatus: "unavailable"`.

## Sprint 4 — UI implementation: planning flows + map rendering + saved routes

**Status**: ⏳ **Planned**

**Goal**: Build the user-facing Epic 1 experience using the now-stable backend contracts: plan → compare → inspect → save → reopen → manage.

**Frontend deliverables**

- Add placeholder hooks (only for UI scaffolding if needed) and then wire to real Convex endpoints as they’re ready:
  - `useQuery(api.db.routesPlan.getPlanInit, ...)`
  - `useAction(api.actions.agent.planRide, ...)`
  - `useQuery(api.db.savedRoutes.getSavedRoutesList, ...)`
  - `useQuery(api.db.savedRoutes.getSavedRouteDetail, ...)`
  - `useMutation(api.db.savedRoutes.saveRoute)` / `renameRoute` / `deleteRoute`

- Implement the “essential subset” screens/sheets (TRD §6.3):
  - HomeMap (V001)
  - PlanRideSheet (S001)
  - RouteOptionsSheet (S002)
  - RouteOverviewSheet (S003)
  - RoutePlannerLoading (V004 overlay)
  - PlanningErrorSheet (S004)
  - SavedRoutesList (V002)
  - SavedRouteDetail (V003)
  - SessionRestoring (V010) + AuthSignIn (V008) (auth infra from Sprint 1)

- Implement map rendering contract (TRD §7):
  - overview polyline → legs → overlay segments → annotations

- Implement saved-route management UI:
  - RenameRouteSheet (S008)
  - ConfirmDeleteRouteSheet (S009)

- Optional: implement PlaceSearchSheet (S006) + supporting action(s) if we choose a Places provider.

**Acceptance criteria**

- Planning flow works end-to-end: PlanRide → Options → Overview (with loading + error handling).
- Save from RouteOverview creates a saved route; list shows it immediately.
- Opening a saved route renders the same snapshot geometry and overlays without recomputation.
- Rename updates only `name`/metadata; snapshot remains unchanged.
- Delete removes the route and returns to list with correct empty state handling.

## Sprint 5 — Hardening, performance, and completion

**Status**: ⏳ **Planned**

**Goal**: Stabilize edge cases, enforce TRD constraints, and add dev tooling/tests/docs so the POC is shippable.

**Deliverables**

- **Testing & QA**:
  - Seed scenario(s) for saved routes and (if feasible) a deterministic planning “mock provider” mode.
  - E2E smoke path: auth → plan → compare → overview → save → reopen → rename → delete.
- **Performance pass** (TRD §9):
  - Ensure list queries are summary-only and bounded.
  - Validate action runtime and external call budgeting; cap probes/segments.
- **Docs**:
  - Update `convex/README.md` with Epic 1 API surface and local dev steps (keys, providers, seeding).

**Acceptance criteria (Epic 1 complete)**

- All screens in TRD “essential subset” (§6.3) are functional end-to-end.
- All Convex endpoints listed in TRD §4.3.5 exist and are wired.
- Saved routes reopen identically with the same map presentation (TRD §1.2, §7).
- Planning returns max 2–3 options and remains stable under repeated use.