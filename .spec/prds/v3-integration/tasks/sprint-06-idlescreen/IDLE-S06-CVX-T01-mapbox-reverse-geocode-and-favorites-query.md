# IDLE-S06-CVX-T01 — Convex Mapbox reverse-geocode action proxy + listFavoriteLocations query

```
TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=convex-implementer | reviewer=convex-reviewer
SPRINT:     sprint-06-idlescreen → ../SPRINT.md
PRD_REFS:   UC-MAP-01, UC-CHAT-01

RUNTIME_COMMANDS:
  test:      pnpm test
  typecheck: pnpm type-check:native
  lint:      pnpm exec biome check --no-errors-on-unmatched
  build:     pnpm --dir server run convex:dev -- --once
```

---

## OUTCOME

A signed-in client can resolve `{lat,lng}` → `{city, state, label}` via a server-side Mapbox proxy action and list their own favorite locations from the `favorite_roads` table — both endpoints authenticated, both fully covered by tests against a real Convex test environment.

---

## 🚫 CRITICAL CONSTRAINTS

- **MUST** keep `MAPBOX_ACCESS_TOKEN` server-side only — read exclusively from `process.env` inside the action handler; never returned in any response field, error message, or log line.
- **MUST** gate `listFavoriteLocations` to the calling rider via `requireIdentity(ctx)` from `server/convex/guards.ts`; unauthenticated callers throw `ConvexError(UNAUTHENTICATED)`.
- **MUST** add `'use node'` directive at the top of `server/convex/actions/places.ts` (matches the pattern in `weatherProvider.ts` and `geocodingProvider.ts`).
- **NEVER** call `ctx.db` inside the `getReverseGeocode` action — actions do not have database access per `brain/docs/CONVEX-RULES.md`.
- **NEVER** use `filter()` in `listFavoriteLocations` — use `.withIndex('by_clerkUserId', ...)` exclusively, mirroring `server/convex/db/favoriteRoads.ts:listHandler`.
- **STRICTLY** follow the new Convex function syntax with explicit `args:` and `returns:` validators on every exported function.

---

## DONE WHEN

- [ ] AC-1: Reverse-geocode happy path returns `{city, state, label}` (PRIMARY)
- [ ] AC-2: Reverse-geocode propagates typed `ConvexError(GEOCODE_UPSTREAM_ERROR)` on upstream HTTP 5xx without leaking token
- [ ] AC-3: Reverse-geocode rejects out-of-range coordinates with `ConvexError(GEOCODE_INVALID_COORDS)` before any HTTP call
- [ ] AC-4: `listFavoriteLocations` returns rows scoped to the calling `clerkUserId`
- [ ] AC-5: `listFavoriteLocations` throws `ConvexError(UNAUTHENTICATED)` for callers without identity
- [ ] AC-6: `pnpm --dir server run convex:dev -- --once` exits 0 with new files committed
- [ ] `pnpm test` passes + `pnpm type-check:native` clean + `pnpm exec biome check` clean
- [ ] `git diff --name-only` shows only files in SCOPE.write_allowed

---

## ACCEPTANCE CRITERIA

### AC-1: Reverse-geocode happy path returns city/state/label [PRIMARY]
- **GIVEN** a valid `MAPBOX_ACCESS_TOKEN` is set and `lat=36.97, lng=-122.03` is supplied
- **WHEN** `api.places.getReverseGeocode({lat:36.97, lng:-122.03})` is called
- **THEN** the action returns `{city: string, state: string (2-letter), label: string}` where label contains city + state as substrings
- **TDD_STATE:** none → red → green → refactor
- **TEST_FILE:** `server/convex/__tests__/places.test.ts`
- **VERIFY:** `pnpm test --reporter=verbose 2>&1 | grep 'getReverseGeocode happy path'`

### AC-2: Reverse-geocode propagates typed ConvexError on upstream HTTP failure
- **GIVEN** the Mapbox API returns HTTP 500 for the requested coordinates
- **WHEN** `api.places.getReverseGeocode` is called
- **THEN** action throws `ConvexError(GEOCODE_UPSTREAM_ERROR)` whose message does NOT contain the `MAPBOX_ACCESS_TOKEN` value
- **TDD_STATE:** none → red → green → refactor
- **TEST_FILE:** `server/convex/__tests__/places.test.ts`
- **VERIFY:** `pnpm test --reporter=verbose 2>&1 | grep 'getReverseGeocode upstream HTTP error'`

### AC-3: Reverse-geocode rejects coordinates outside valid range
- **GIVEN** `lat=999, lng=999` is supplied (outside WGS84)
- **WHEN** `api.places.getReverseGeocode` is called
- **THEN** action throws `ConvexError(GEOCODE_INVALID_COORDS)` BEFORE any HTTP call is attempted
- **TDD_STATE:** none → red → green → refactor
- **VERIFY:** `pnpm test --reporter=verbose 2>&1 | grep 'getReverseGeocode invalid coords'`

### AC-4: listFavoriteLocations returns scoped locations for authenticated rider
- **GIVEN** rider `user_abc` has 3 `favorite_roads` rows and rider `user_xyz` has 2 rows
- **WHEN** `api.favorites.listFavoriteLocations` is called with `user_abc` identity
- **THEN** returns exactly 3 items shaped `{name, lat, lng}`; no `user_xyz` rows present
- **TDD_STATE:** none → red → green → refactor
- **TEST_FILE:** `server/convex/__tests__/favorites.test.ts`
- **VERIFY:** `pnpm test --reporter=verbose 2>&1 | grep 'listFavoriteLocations scoped to rider'`

### AC-5: listFavoriteLocations throws UNAUTHENTICATED for unauthenticated caller
- **GIVEN** no JWT in request context
- **WHEN** `api.favorites.listFavoriteLocations` is called
- **THEN** throws `ConvexError(UNAUTHENTICATED)`
- **TDD_STATE:** none → red → green → refactor
- **VERIFY:** `pnpm test --reporter=verbose 2>&1 | grep 'listFavoriteLocations unauthenticated'`

### AC-6: Convex build passes with new files
- **GIVEN** new `places.ts` action and `favorites.ts` query files committed
- **WHEN** Convex build validates the deployment bundle
- **THEN** `pnpm --dir server run convex:dev -- --once` exits 0, no type errors
- **TDD_STATE:** none → green
- **VERIFY:** `pnpm --dir server run convex:dev -- --once`

---

## TEST CRITERIA

| ID    | Statement                                                                                             | Maps To | Type        |
|-------|-------------------------------------------------------------------------------------------------------|---------|-------------|
| TC-1  | getReverseGeocode returns `{city,state,label}` for fixture (36.97,-122.03) → "Santa Cruz, CA" via convex-test | AC-1    | happy_path  |
| TC-2  | getReverseGeocode throws `ConvexError(GEOCODE_UPSTREAM_ERROR)` and does not leak token when fetch returns 500 | AC-2    | error_path  |
| TC-3  | getReverseGeocode throws `ConvexError(GEOCODE_INVALID_COORDS)` for lat=999,lng=999 with no HTTP fetch | AC-3    | edge_case   |
| TC-4  | listFavoriteLocations returns 3 user_abc rows and excludes user_xyz rows in convex-test               | AC-4    | happy_path  |
| TC-5  | listFavoriteLocations throws `ConvexError(UNAUTHENTICATED)` when no identity in convex-test context   | AC-5    | error_path  |
| TC-6  | listFavoriteLocations returns empty array (not error) for authenticated rider with zero favorites     | AC-4    | edge_case   |

---

## SCOPE — file-level write permissions

**writeAllowed:**
- `server/convex/actions/places.ts` (NEW) — public action `getReverseGeocode`
- `server/convex/db/favorites.ts` (NEW) — public query `listFavoriteLocations`
- `server/convex/lib/env.ts` (MODIFY) — add `MAPBOX_ACCESS_TOKEN` export only
- `server/convex/errors.ts` (MODIFY) — add `GEOCODE_UPSTREAM_ERROR`, `GEOCODE_INVALID_COORDS` to `ERROR_CODES`
- `server/convex/__tests__/places.test.ts` (NEW)
- `server/convex/__tests__/favorites.test.ts` (NEW)

**writeProhibited:**
- `server/convex/_generated/**` — generated code, never hand-edited
- `server/convex/schema.ts` — no schema changes; `favorite_roads` already exists
- `server/convex/db/favoriteRoads.ts` — existing file; new query goes in `db/favorites.ts`
- `react-native/**`, `ios/**`, `android/**` — out of scope

---

## BOUNDARIES

✅ **Always:**
- Use `requireIdentity(ctx)` as the first line in every authenticated query/action
- Use `ERROR_CODES` registry (no inline error code strings)
- Use `withTimeout` + `retryOnce` from `server/convex/actions/agent/lib/reliability.ts` for external HTTP

⚠️ **Ask First:**
- Adding any new `MAPBOX_*` env var beyond `MAPBOX_ACCESS_TOKEN`
- Changing the `favorite_roads` table schema or its `by_clerkUserId` index

---

## DELIVERABLE

- `server/convex/actions/places.ts` (NEW): public `'use node'` action `getReverseGeocode(lat, lng)` returning `{city, state, label}`
- `server/convex/db/favorites.ts` (NEW): public query `listFavoriteLocations` returning `[{name, lat, lng}]` scoped to caller
- `server/convex/lib/env.ts` (MODIFY): adds `MAPBOX_ACCESS_TOKEN` (required in prod, optional in test)
- `server/convex/errors.ts` (MODIFY): adds `GEOCODE_UPSTREAM_ERROR`, `GEOCODE_INVALID_COORDS`
- `server/convex/__tests__/places.test.ts` (NEW): 3 tests covering AC-1, AC-2, AC-3
- `server/convex/__tests__/favorites.test.ts` (NEW): 3 tests covering AC-4, AC-5, TC-6

---

## AGENT INSTRUCTIONS (TDD per AC)

For each AC: RED → GREEN → REFACTOR (see `brain/docs/TDD-METHODOLOGY.md`).

**RED:** Write one test in the appropriate `__tests__/*.test.ts` file that exercises GIVEN-WHEN-THEN. Run `pnpm test --reporter=verbose -- {test_file}`. VERIFY test FAILS (not errors).

**GREEN:** Write minimal Convex function code in `server/convex/actions/places.ts` or `server/convex/db/favorites.ts` to make the test pass. Re-run; VERIFY test PASSES.

**REFACTOR:** Clean up while staying green. Tests stay PASSING throughout.

After all 5 ACs are GREEN, run `pnpm --dir server run convex:dev -- --once` to satisfy AC-6.

---

## READING LIST (max 5 — canonical pattern first)

1. `server/convex/actions/agent/providers/geocodingProvider.ts:1-123` **[PRIMARY PATTERN]** — canonical `'use node'` external HTTP provider: env injection, `withTimeout`, error markers, fallback tiers
2. `server/convex/actions/agent/providers/weatherProvider.ts:1-80` — `retryOnce` + `withTimeout` composition; `'use node'` directive
3. `server/convex/db/favoriteRoads.ts:1-140` — `listHandler` with `.withIndex('by_clerkUserId')`; `requireIdentity` usage at the query boundary
4. `server/convex/guards.ts:1-30` — `requireIdentity` implementation; throws `ConvexError(UNAUTHENTICATED)` on missing identity
5. `server/convex/lib/env.ts:1-100` — `requireEnv` / `optionalEnv` pattern; `isTestOrVitest` test override; where to add `MAPBOX_ACCESS_TOKEN`

---

## EVIDENCE GATES (fast/cheap first)

| Gate | Command | Expected |
|------|---------|----------|
| RED phase evidence | `TDD_STATE` per-AC history shows red→green | All ACs |
| Each AC has a test | grep test files for AC names | Pass |
| All tests pass | `pnpm test` | Exit 0 |
| Type check | `pnpm type-check:native` | Exit 0 |
| Lint | `pnpm exec biome check --no-errors-on-unmatched` | Exit 0 |
| Convex build | `pnpm --dir server run convex:dev -- --once` | Exit 0 |
| Scope compliance | `git diff --name-only` ⊆ writeAllowed | Pass |

---

## OUT OF SCOPE

- Caching reverse-geocode results (premature optimization; client may add LRU later)
- Multi-language label localization (ship en-US only)
- Forward geocoding (`address → coords`) — not needed by IdleScreen
- Editing `favorite_roads` schema or write paths — read-only here

---

## CONTEXT

**Current state:** No `places.*` or `favorites.listFavoriteLocations` exists in `server/convex/`. iOS + Android IdleScreen rely on `IdleMockProvider` static data.

**Gap:** Sprint 6 IdleScreen needs server-side Mapbox geocode (token must stay off-client) and a query for favorite-pin overlays.

---

## REVIEW (for convex-reviewer)

**Must pass:**
- One test per AC; tests verify behavior not implementation
- RED evidence in TDD_STATE history
- `MAPBOX_ACCESS_TOKEN` never appears in any returned value, error message, or log line (grep proof)
- `requireIdentity` is the first line of `listFavoriteLocations`
- `.withIndex('by_clerkUserId', ...)` used — no `filter()` calls
- SCOPE respected (`git diff --name-only` ⊆ writeAllowed)

**Should verify:**
- Action / query both have explicit `args` AND `returns` validators
- WMO/error code semantics consistent with existing `weatherProvider.ts`
- No leakage of upstream Mapbox response shape to clients

**Verdict:** APPROVED | NEEDS_FIXES (with file:line specifics if NEEDS_FIXES)

---

## DESIGN

**References:**
- `.spec/design/system/views/idle-screen/README.md` — `mol-chat-input__location-pill` ("Near {city}, {state}") consumes the geocode label; favorite pin dots (`signal.default` copper) consume `listFavoriteLocations` lat/lng
- `.spec/design/system/views/idle-screen/README.md` V01 No Location — when `getReverseGeocode` is unavailable the client shows "Tap to set start"; the action must throw cleanly so the client can branch

**Pattern:** External HTTP proxy action — same shape as `geocodingProvider.ts` / `weatherProvider.ts`: `'use node'`, env via `lib/env.ts`, `withTimeout` + `retryOnce` from `lib/reliability.ts`, `ConvexError(ERROR_CODES.X)` for all failure paths.

**Pattern source:** `server/convex/actions/agent/providers/geocodingProvider.ts:1-123`

**Anti-pattern:** Returning the raw Mapbox API response — always project to `{city, state, label}` to avoid leaking token context or future API shape coupling.

---

## DEPENDENCIES

- **Depends on:** None (sprint foundation)
- **Blocks:** IDLE-S06-IOS-T01, IDLE-S06-AND-T01 (both consume these endpoints)
- **Parallel:** IDLE-S06-CVX-T02 (independent server-side action)

---

## CODING STANDARDS

- `brain/docs/CONVEX-RULES.md` — new function syntax, `'use node'` rule, `ctx.db` prohibition in actions, mandatory `args` + `returns` validators
- `brain/docs/CODING-STANDARDS.md` — TypeScript strict mode, no `any` returns
- `RULES.md` — Pre-commit checks (Biome, type-check), commit discipline

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"GIVEN valid MAPBOX_ACCESS_TOKEN + lat=36.97,lng=-122.03 WHEN getReverseGeocode called THEN returns {city:string,state:2-letter,label:string} with label containing both","verify":"pnpm test --reporter=verbose 2>&1 | grep 'getReverseGeocode happy path'"},
    {"id":"AC-2","type":"acceptance_criterion","description":"GIVEN Mapbox API returns HTTP 500 WHEN getReverseGeocode called THEN throws ConvexError(GEOCODE_UPSTREAM_ERROR), message excludes token","verify":"pnpm test --reporter=verbose 2>&1 | grep 'getReverseGeocode upstream HTTP error'"},
    {"id":"AC-3","type":"acceptance_criterion","description":"GIVEN lat=999,lng=999 WHEN getReverseGeocode called THEN throws ConvexError(GEOCODE_INVALID_COORDS) before any HTTP fetch","verify":"pnpm test --reporter=verbose 2>&1 | grep 'getReverseGeocode invalid coords'"},
    {"id":"AC-4","type":"acceptance_criterion","description":"GIVEN user_abc=3 favorites, user_xyz=2 favorites WHEN listFavoriteLocations called by user_abc THEN returns 3 {name,lat,lng} rows, no cross-rider leakage","verify":"pnpm test --reporter=verbose 2>&1 | grep 'listFavoriteLocations scoped to rider'"},
    {"id":"AC-5","type":"acceptance_criterion","description":"GIVEN no JWT WHEN listFavoriteLocations called THEN throws ConvexError(UNAUTHENTICATED)","verify":"pnpm test --reporter=verbose 2>&1 | grep 'listFavoriteLocations unauthenticated'"},
    {"id":"AC-6","type":"acceptance_criterion","description":"GIVEN new files committed WHEN convex build runs THEN pnpm --dir server run convex:dev -- --once exits 0","verify":"pnpm --dir server run convex:dev -- --once"},
    {"id":"TC-1","type":"test_criterion","description":"getReverseGeocode returns {city,state,label} for Santa Cruz fixture in convex-test","maps_to_ac":"AC-1","verify":"pnpm test --reporter=verbose 2>&1 | grep 'getReverseGeocode happy path'"},
    {"id":"TC-2","type":"test_criterion","description":"getReverseGeocode throws GEOCODE_UPSTREAM_ERROR and does not leak token when fetch returns 500","maps_to_ac":"AC-2","verify":"pnpm test --reporter=verbose 2>&1 | grep 'getReverseGeocode upstream HTTP error'"},
    {"id":"TC-3","type":"test_criterion","description":"getReverseGeocode throws GEOCODE_INVALID_COORDS for lat=999,lng=999 with zero HTTP calls","maps_to_ac":"AC-3","verify":"pnpm test --reporter=verbose 2>&1 | grep 'getReverseGeocode invalid coords'"},
    {"id":"TC-4","type":"test_criterion","description":"listFavoriteLocations returns 3 user_abc rows, excludes user_xyz rows in convex-test","maps_to_ac":"AC-4","verify":"pnpm test --reporter=verbose 2>&1 | grep 'listFavoriteLocations scoped to rider'"},
    {"id":"TC-5","type":"test_criterion","description":"listFavoriteLocations throws UNAUTHENTICATED with no identity in convex-test","maps_to_ac":"AC-5","verify":"pnpm test --reporter=verbose 2>&1 | grep 'listFavoriteLocations unauthenticated'"},
    {"id":"TC-6","type":"test_criterion","description":"listFavoriteLocations returns empty array (not error) for authenticated rider with zero favorites","maps_to_ac":"AC-4","verify":"pnpm test --reporter=verbose 2>&1 | grep 'listFavoriteLocations empty for rider with no favorites'"}
  ]
}
-->
