## Sprint 1 Tasks — Epic 1 (Infra foundations: theming + auth + data modeling)

**Sprint**: `.spec/epics/epic-1/sprints/sprint-1/spec.md`
**Source of truth**: `.spec/epics/epic-1/trd/phase-1-core.md` + `.spec/epics/epic-1/EPIC-ROADMAP.md`

> **Scope note:** Sprint 1 is intentionally “infrastructure only”. The goal is to make Sprint 2+ backend endpoints and Sprint 4 UI work low-churn by landing (a) the saved routes schema + validators, (b) auth/viewer primitives + NOT_FOUND semantics, and (c) a documented, repeatable dev auth path.

---

### Task 01 — Backend: Add v-first validators for saved routes + route shapes (TRD §3.1–§3.4, §4.3.3)

**Assignee**: @.cursor/agents/backend-engineer.md
**Status**: Completed
**Dependencies**: None

#### Context
- Sprint 1 requires “v-first validators for the TRD shapes” so later Convex schema/functions and UI can “import, don’t redefine”.
- This repo’s established pattern is model validators in `models/*` and schema wiring in `convex/schema.ts`.

#### Requirements
- Create `models/saved-routes.ts` implementing **Convex `v` validators** (and inferred TS types via `Infer<typeof …>`), covering at minimum:
  - `PlanInput` (TRD §3.2)
  - `RouteSnapshot` (TRD §3.3)
  - `RouteIndex` (TRD §3.4)
  - `SavedRouteCapabilities` (TRD §4.3.3)
  - `SavedRoute` document shape used by `saved_routes` table (TRD §3.1)
- **Forward-compatible enums** (TRD §3.1) must be represented as `v.union(v.literal(...))`:
  - `ownerType`: `'user' | 'group' | 'org'`
  - `visibility`: `'private' | 'shared' | 'public'`
- **POC constraint** (TRD §4.3.2) will be enforced in internal helpers (Task 03/04), but the schema should remain forward compatible.
- Prefer reusable validators for nested shapes (legs, geometry, overlays, annotations) instead of one giant inline validator (avoids “deep instantiation” issues later).

#### Acceptance Criteria
- [ ] `models/saved-routes.ts` exports validators + inferred types for all required TRD shapes.
- [ ] Validators reflect TRD structure closely enough that later view-models can be derived from them without redefining fields.

#### Files to Create
- `models/saved-routes.ts`

#### Testing Requirements
- [ ] Not required in Sprint 1 beyond `pnpm type-check` + Convex codegen sanity (covered by Task 02).

---

### Task 02 — Backend: Add `saved_routes` table + indexes to `convex/schema.ts` (TRD §3.1)

**Assignee**: @.cursor/agents/backend-engineer.md
**Status**: Completed
**Dependencies**: Task 01

#### Context
- Sprint 1 requires the `saved_routes` table to exist so Sprint 2 can implement `db.savedRoutes.*` without schema churn.
- Convex indexes must be chosen intentionally to support bounded list + owner filtering.

#### Requirements
- Update `convex/schema.ts` to add a `saved_routes` table using the validator from `models/saved-routes.ts`.
- Add indexes required by TRD §3.1:
  - `by_ownerType_and_ownerId` on `['ownerType', 'ownerId']` (note: repo convention is index name includes all fields)
  - `by_createdByUserId` on `['createdByUserId']`
- Ensure schema stays forward compatible (do not hardcode POC-only literals in schema).

#### Acceptance Criteria
- [ ] `npx convex dev` succeeds and Convex codegen (`convex/_generated/*`) is updated without errors.
- [ ] `saved_routes` table exists with the 2 indexes above.

#### Files to Modify
- `convex/schema.ts`

#### Testing Requirements
- [ ] Run `pnpm type-check` and confirm no TS errors introduced.

---

### Task 03 — Backend: Implement internal viewer helper (`internal.db.viewer.requireViewer`) (TRD §4.3.2, §4.3.5)

**Assignee**: @.cursor/agents/backend-engineer.md
**Status**: Completed
**Dependencies**: None

#### Context
- TRD requires a centralized “viewer” helper so all future endpoints enforce auth consistently.
- Sprint 1 acceptance criteria includes: “Auth-required behavior is in place for all Epic 1 endpoints” — in Sprint 1 that means: the primitive exists, and subsequent APIs can depend on it.

#### Requirements
- Create `convex/db/viewer.ts` exporting `requireViewer` as an `internalQuery`.
- `requireViewer` must:
  - Use `ctx.auth.getUserIdentity()` to load identity.
  - Throw on missing identity (auth required).
  - Return a stable object including at least:
    - `viewerUserId: string` (recommend using `identity.subject` or `identity.tokenIdentifier`, but **choose one and standardize**)
    - `tokenIdentifier: string` (if available) for debugging.
- Document in code comments which field is used as `SavedRoute.ownerId` / `createdByUserId`.

#### Acceptance Criteria
- [ ] `internal.db.viewer.requireViewer` exists and returns a stable `viewerUserId` when authenticated.
- [ ] When unauthenticated, it fails deterministically (no silent nulls).

#### Files to Create
- `convex/db/viewer.ts`

#### Testing Requirements
- [ ] Minimal: manual verification via a one-off `npx convex run` (or a lightweight test if project already has a backend test harness).

---

### Task 04 — Backend: Implement internal saved routes access layer with NOT_FOUND semantics (TRD §4.3.2, §4.3.5)

**Assignee**: @.cursor/agents/backend-engineer.md
**Status**: Completed
**Dependencies**: Task 02, Task 03

#### Context
- Sprint 1 explicitly calls out POC authz:
  - All saved routes are user-private.
  - Reads/mutations must behave as **NOT_FOUND** when unauthorized (no existence leaks).
- TRD §4.3.5 specifies an internal module surface to centralize this.

#### Requirements
- Implement internal saved-routes helpers in `convex/db/savedRoutes.ts` (as `internalQuery` / `internalMutation`) matching TRD §4.3.6:
  - `getById` (internalQuery)
  - `listByOwner` (internalQuery)
  - `insert` (internalMutation)
  - `patchName` (internalMutation)
  - `deleteById` (internalMutation)
- All helpers must enforce the POC constraints (TRD §4.3.2):
  - `ownerType = 'user'`
  - `visibility = 'private'`
  - `ownerId = viewerUserId` (from `internal.db.viewer.requireViewer`)
- **NOT_FOUND semantics**:
  - For `getById`, `patchName`, `deleteById`: if the route doesn’t exist OR is not owned by viewer, behave as “not found”.
  - Do **not** throw a distinct “unauthorized” error for these operations.
- Keep helpers schema-aligned and “dumb”: they should not return UI view-models; they should return docs / ids / nulls for callers.

#### Acceptance Criteria
- [ ] All internal functions exist with validators for args/returns.
- [ ] Unauthorized access cannot be distinguished from missing route (NOT_FOUND semantics).
- [ ] Inserts always write POC fields (`ownerType`, `visibility`, `ownerId`, `createdByUserId`) consistently.

#### Files to Create
- (none if implemented inline) or optionally `convex/db/savedRoutes/internal.ts` if the file grows too large

#### Testing Requirements
- [ ] Add minimal tests if a test harness exists; otherwise verify via `npx convex run` with two different auth contexts (or a documented manual verification workflow).

---

### Task 05 — Backend: Add shared TS contracts for Epic 1 view-models (TRD §4.3.4)

**Assignee**: @.cursor/agents/backend-engineer.md
**Status**: Completed
**Dependencies**: Task 01

#### Context
- Sprint 1 requires: “shared types/contracts in the repo so later sprints can import, don’t redefine”.
- UI will be built against placeholder hooks first; having canonical TS types early prevents drift.

#### Requirements
- Add a shared type module (recommend: `types/epic-1/routes.ts`) exporting TS types that mirror TRD §4.3.4:
  - `PlanInitView`
  - `SavedRoutesListView`, `SavedRouteListItemView`
  - `SavedRouteDetailView`
  - `SavedRouteCapabilities`
  - Plus any shared subtypes needed (`PlanInput`, `RouteSnapshot`, `RouteIndex`, geometry types, overlays types).
- Prefer deriving these types from validators where feasible:
  - e.g. export `type PlanInput = Infer<typeof planInputValidator>` from `models/saved-routes.ts` and re-export from `types/epic-1/routes.ts`.
- Add exports to `types/index.ts` (barrel) so UI can import from `../types`.

#### Acceptance Criteria
- [ ] TS types exist for all TRD §4.3.4 view models.
- [ ] UI can implement placeholder hooks returning these types without redefining shapes.

#### Files to Create / Modify
- **Create**: `types/epic-1/routes.ts`
- **Modify**: `types/index.ts`

#### Testing Requirements
- [ ] `pnpm type-check` passes.

---

### Task 06 — Frontend: Wire the semantic theme into the app root (Sprint 1 frontend infra)

**Assignee**: @.cursor/agents/ui-developer.md
**Status**: Completed
**Dependencies**: None

#### Context
- `hooks/use-semantic-theme.ts` and `styles/theme.ts` exist, but `app/_layout.tsx` currently uses a placeholder theme (`useMemo(() => ({}), [])`).
- Sprint 1 requires standardizing on semantic theme usage for Epic 1 UI.

#### Requirements
- Update `app/_layout.tsx` so `PaperProvider` receives the real theme from `styles/theme.ts` (ensure it is typed as `ExtendedTheme`).
- Add a short note to `app/README.md` clarifying the expected styling rules for Epic 1 UI:
  - Use `useSemanticTheme()`
  - Use Paper `Text`
  - No hardcoded spacing/colors in Epic 1 UI components

#### Acceptance Criteria
- [x] `useSemanticTheme()` returns `semantic` tokens successfully in screens.
- [x] No runtime errors from missing theme fields.

#### Files to Modify
- `app/_layout.tsx`
- `app/README.md`

#### Testing Requirements
- [ ] Manual: launch app and verify at least one screen renders using semantic tokens without crashes.

---

### Task 07 — Frontend: Ensure Epic 1 auth surfaces exist + are reachable (TRD §6.1: V008, V009, V010)

**Assignee**: @.cursor/agents/ui-developer.md
**Status**: Done
**Dependencies**: None

#### Context
- TRD §6.1 declares required auth screens:
  - AuthSignIn (V008)
  - AuthSignUp (V009)
  - SessionRestoring (V010)
- Current repo contains only a placeholder `app/(auth)/sign-in.tsx` and does not include sign-up or a session restoring screen.

#### Requirements
- Add missing routes/screens under `app/(auth)/` to cover:
  - `sign-up.tsx` (AuthSignUp)
  - `session-restoring.tsx` (SessionRestoring)
- Ensure routes are reachable via Expo Router navigation, and that the app’s startup path shows SessionRestoring first (then routes to sign-in/sign-up or the app stack).
- Keep UI implementation minimal (Sprint 1 is infra): placeholders are acceptable, but they must be real screens/routes that won’t be revisited in Sprint 4.

#### Acceptance Criteria
- [ ] Routes exist for `/(auth)/sign-in`, `/(auth)/sign-up`, and `/(auth)/session-restoring`.
- [ ] App can navigate between them deterministically (no broken routes).

#### Files to Create / Modify
- **Create**: `app/(auth)/sign-up.tsx`
- **Modify**: `app/(auth)/_layout.tsx` and/or `app/_layout.tsx` as needed

#### Testing Requirements
- [ ] Manual: verify navigation to each route.

---

### Task 08 — Frontend + Backend: Document a dev auth path that produces an authenticated Convex viewer (Sprint 1 acceptance)

**Assignee**: @.cursor/agents/ui-developer.md (primary), @.cursor/agents/backend-engineer.md (support)
**Status**: Pending
**Dependencies**: Task 03

#### Context
- Sprint 1 acceptance criteria requires: “Theming and auth expectations are documented well enough that Sprint 4 UI work does not need to revisit fundamentals.”
- Backend viewer helper (`ctx.auth.getUserIdentity()`) only works if the client is actually authenticated with Convex.

#### Requirements
- Update documentation (recommend: root `README.md` and/or `app/README.md`) to describe:
  - Which auth provider is used for Epic 1 POC (TRD names Clerk; if the repo differs, call out the exact choice and why).
  - Required env vars and where to set them.
  - Step-by-step “dev auth” flow to get an authenticated viewer in the app.
  - A quick sanity check command for backend auth (e.g., a small Convex function that calls `internal.db.viewer.requireViewer`).

#### Acceptance Criteria
- [ ] A new engineer can follow docs to get a signed-in app session that results in non-null `ctx.auth.getUserIdentity()`.
- [ ] Docs include at least one explicit verification step for both app and Convex.

#### Files to Modify
- `README.md` and/or `app/README.md`

#### Testing Requirements
- [ ] Manual: follow the documented steps end-to-end on a fresh checkout.
