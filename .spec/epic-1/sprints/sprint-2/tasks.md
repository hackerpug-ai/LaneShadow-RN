## Sprint 2 Tasks — Epic 1 (Backend APIs: saved routes + plan init)

**Sprint**: `.spec/epic-1/sprints/sprint-2/spec.md`
**Source of truth**: `.spec/epic-1/TRD.md` + `.spec/epic-1/SPRINT_PLAN.md`
**Sprint 1 handoff (what already exists)**: `.spec/epic-1/sprints/sprint-1/handoff.md`

> **Scope note:** Sprint 2 is “public API + view models”. Reuse Sprint 1’s validator-first models and internal helpers. Do **not** redefine TRD shapes in the public endpoints; import them from `models/saved-routes.ts` / `types/routes.ts`.

---

### Task 01 — Backend: Implement `db.routesPlan.getPlanInit` (query → PlanInitView) (TRD §4.3.5, §6.2)

**Assignee**: @.cursor/agents/backend-engineer.md
**Status**: Pending
**Dependencies**: Sprint 1 auth wiring (done), shared types (done)

#### Context
- Sprint 2 requires the public DB API surface so Sprint 4 UI can call `api.db.routesPlan.getPlanInit`.
- `PlanInitView` type is already defined in `types/routes.ts`.

#### Requirements
- Create `convex/db/routesPlan.ts` exporting:
  - `getPlanInit` as a **public** `query` using Convex `v` validators.
- Auth required:
  - Use `requireIdentity(ctx)` from `convex/guards.ts` to ensure `ctx.auth.getUserIdentity()` is non-null (TRD §4.3.2).
- Return `PlanInitView` with:
  - `defaults.preferences` aligned to `PlanPreferences` (TRD §4.3.4).
  - `constraints.maxOptions` set to `3` (TRD §9).
- Keep this endpoint “pure” (no DB calls required for POC).

#### Acceptance Criteria
- [ ] `api.db.routesPlan.getPlanInit` exists after Convex codegen.
- [ ] Return shape matches `PlanInitView` from `types/routes.ts`.
- [ ] Unauthenticated callers fail deterministically (no silent nulls).

#### Files to Create / Modify
- **Create**: `convex/db/routesPlan.ts`

#### Testing Requirements
- [ ] Minimal: `pnpm tsc -p convex/tsconfig.json --noEmit` passes.
- [ ] Optional: one-off `npx convex run db/routesPlan:getPlanInit` with/without auth (documented in standup once verified).

---

### Task 02 — Backend: Implement `db.savedRoutes.getSavedRoutesList` (query → SavedRoutesListView) (TRD §4.3.5, §9)

**Assignee**: @.cursor/agents/backend-engineer.md
**Status**: Pending
**Dependencies**: Sprint 1 internal saved-routes helpers (done)

#### Context
- Sprint 1 delivered internal helpers in `convex/db/savedRoutes.ts`:
  - `internal.db.savedRoutes.listByOwner` already enforces POC authz and uses indexes.
- Sprint 2 needs the **public** list query returning the **UI-shaped** view model.

#### Requirements
- In `convex/db/savedRoutes.ts`, add a **public** `query`:
  - `getSavedRoutesList` (returns `SavedRoutesListView`).
- The query must:
  - Require auth via `requireIdentity(ctx)` (TRD §4.3.2).
  - Use `ctx.runQuery(internal.db.savedRoutes.listByOwner, { limit })` (no `.filter()` scans).
  - Return **summary-only** list items (TRD §9):
    - `savedRouteId` (string id)
    - `name`, `createdAt`, `updatedAt`
    - `preview` computed from stored snapshot:
      - `bounds = routeSnapshot.bounds`
      - `distanceMeters = sum(legs[].distanceMeters)`
      - `durationSeconds = sum(legs[].durationSeconds)`
    - `capabilities` (TRD §4.3.3): in POC all `true` because list is owner-scoped.
- Keep the return order consistent and deterministic (most recent first).

#### Acceptance Criteria
- [ ] `api.db.savedRoutes.getSavedRoutesList` exists after Convex codegen.
- [ ] Uses the `by_ownerType_and_ownerId` index via the existing internal helper (no table scan filters).
- [ ] List is bounded (choose a hard cap, e.g. 50) and summary-only.
- [ ] Returns `SavedRoutesListView` shape (matches `types/routes.ts`).

#### Files to Create / Modify
- **Modify**: `convex/db/savedRoutes.ts`

#### Testing Requirements
- [ ] Minimal: `pnpm tsc -p convex/tsconfig.json --noEmit` passes.

---

### Task 03 — Backend: Implement `db.savedRoutes.getSavedRouteDetail` (query → SavedRouteDetailView) with NOT_FOUND semantics (TRD §4.3.2, §4.3.5)

**Assignee**: @.cursor/agents/backend-engineer.md
**Status**: Pending
**Dependencies**: Sprint 1 internal saved-routes helpers (done)

#### Context
- TRD requires NOT_FOUND semantics: unauthorized vs missing must be indistinguishable for detail reads.
- Internal helper `internal.db.savedRoutes.getById` already returns `null` when missing/not-owned.

#### Requirements
- In `convex/db/savedRoutes.ts`, add a **public** `query`:
  - `getSavedRouteDetail`.
- The query must:
  - Require auth via `requireIdentity(ctx)` (TRD §4.3.2).
  - Call `internal.db.savedRoutes.getById` to fetch a schema-aligned `SavedRoute` (or `null`).
  - If missing/not-owned: return `null` (NOT_FOUND semantics).
  - If present: return `SavedRouteDetailView`:
    - `savedRouteId` (string id)
    - `name`, `planInput`, `routeSnapshot`, `routeIndex`, `snapshotMeta`
    - `capabilities` (POC: all true when owned).

#### Acceptance Criteria
- [ ] `api.db.savedRoutes.getSavedRouteDetail` exists after Convex codegen.
- [ ] Missing and unauthorized both return `null` (no existence leak).
- [ ] Return shape matches `SavedRouteDetailView` from `types/routes.ts`.

#### Files to Create / Modify
- **Modify**: `convex/db/savedRoutes.ts`

#### Testing Requirements
- [ ] Minimal: `pnpm tsc -p convex/tsconfig.json --noEmit` passes.

---

### Task 04 — Backend: Implement `db.savedRoutes.saveRoute` (mutation → `{ savedRouteId }`) (TRD §4.3.5)

**Assignee**: @.cursor/agents/backend-engineer.md
**Status**: Pending
**Dependencies**: Sprint 1 internal insert helper (done)

#### Context
- Saved routes are persisted immutable snapshots (only metadata changes later).
- Internal helper `internal.db.savedRoutes.insert` already enforces POC ownership/visibility fields.

#### Requirements
- In `convex/db/savedRoutes.ts`, add a **public** `mutation`:
  - `saveRoute` returning `{ savedRouteId }`.
- The mutation must:
  - Require auth via `requireIdentity(ctx)` (TRD §4.3.2).
  - Accept and validate args using existing validators from `models/saved-routes.ts`:
    - `name: string`
    - `planInput`, `routeSnapshot`, `routeIndex`, `snapshotMeta`
  - Call `internal.db.savedRoutes.insert` to perform the write.
- Document (in code comments) which fields are trusted vs server-authored (e.g. `createdAt/updatedAt` are server-authored inside the internal helper).

#### Acceptance Criteria
- [ ] `api.db.savedRoutes.saveRoute` exists after Convex codegen.
- [ ] Inserts always write POC owner fields consistently (ownerType=user, visibility=private, ownerId=viewer).

#### Files to Create / Modify
- **Modify**: `convex/db/savedRoutes.ts`

#### Testing Requirements
- [ ] Minimal: `pnpm tsc -p convex/tsconfig.json --noEmit` passes.

---

### Task 05 — Backend: Implement `db.savedRoutes.renameRoute` + `db.savedRoutes.deleteRoute` (mutations → `null`) with NOT_FOUND semantics (TRD §4.3.2, §4.3.5, §11)

**Assignee**: @.cursor/agents/backend-engineer.md
**Status**: Pending
**Dependencies**: Sprint 1 internal patch/delete helpers (done)

#### Context
- TRD requires NOT_FOUND semantics for detail mutations.
- Internal helpers already throw `Error('NOT_FOUND')` when missing/not-owned.

#### Requirements
- In `convex/db/savedRoutes.ts`, add two **public** `mutation`s:
  - `renameRoute` (args: `{ savedRouteId, name }` → returns `null`)
  - `deleteRoute` (args: `{ savedRouteId }` → returns `null`)
- Each must:
  - Require auth via `requireIdentity(ctx)`.
  - Call the corresponding internal mutation:
    - `internal.db.savedRoutes.patchName`
    - `internal.db.savedRoutes.deleteById`
  - Preserve NOT_FOUND semantics:
    - If internal throws `Error('NOT_FOUND')`, do not re-map to “unauthorized”.
    - (Optional, if an error-code convention is used for clients) map to a shared NOT_FOUND error code, but keep behavior identical for missing vs unauthorized.

#### Acceptance Criteria
- [ ] `api.db.savedRoutes.renameRoute` and `api.db.savedRoutes.deleteRoute` exist after Convex codegen.
- [ ] Missing/not-owned cannot be distinguished from missing (NOT_FOUND semantics).
- [ ] Only metadata changes on rename (no snapshot mutation).

#### Files to Create / Modify
- **Modify**: `convex/db/savedRoutes.ts`

#### Testing Requirements
- [ ] Minimal: `pnpm tsc -p convex/tsconfig.json --noEmit` passes.

---

### Task 06 — Frontend: Unblock repo-wide `pnpm type-check` (Sprint 1 carried blocker; required to ship Sprint 2 cleanly)

**Assignee**: @.cursor/agents/ui-developer.md
**Status**: Pending
**Dependencies**: None

#### Context
- Sprint 1 handoff notes a blocking issue: repo-wide `pnpm type-check` fails due to app TS errors in `app/(app)/*` and `app/(auth)/*`.
- Sprint 2 backend work should land with a green baseline to keep integration low-churn.

#### Requirements
- Identify and fix the TypeScript errors causing `pnpm type-check` to fail.
- Keep changes minimal and consistent with repo rules:
  - Avoid default exports except for Expo Router pages where required by tooling.
  - Ensure route files don’t create duplicate identifier errors.
- Do not change Epic 1 contracts or backend behavior while fixing typing issues.

#### Acceptance Criteria
- [ ] `pnpm type-check` passes.

#### Files to Modify
- TBD based on actual TS diagnostics (expected under `app/(app)/*` and `app/(auth)/*`).

#### Testing Requirements
- [ ] Run `pnpm type-check`.

