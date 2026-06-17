# IDLE-S06-CVX-T01 — Convex Mapbox reverse-geocode action + listFavoriteLocations query

```
TASK_TYPE:  FEATURE
STATUS:     Done
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=convex-implementer | reviewer=convex-reviewer
SPRINT:     sprint-06-idlescreen → ./SPRINT.md
PRD_REFS:   UC-MAP-01, UC-CHAT-01

RUNTIME_COMMANDS:
  test:      pnpm --dir server test -- places favorites
  typecheck: pnpm type-check:native
  lint:      pnpm exec biome check convex/actions/places.ts convex/db/favorites.ts
  deploy:    pnpm --dir server run convex:dev -- --once
```

---

## OUTCOME

Convex exposes two authenticated, validator-rich endpoints used by the idle state of the map view: `actions/places.reverseGeocode` (Mapbox Geocoding API → `{ city, state, label }`) and `db/favorites.listFavoriteLocations` (rider-scoped favorite_roads list with `withIndex('by_clerkUserId')`). Both are covered by `__tests__/places.test.ts` and `__tests__/favorites.test.ts` against the real Convex test runtime — no HTTP mocks for the integration layer.

---

## 🚫 CRITICAL CONSTRAINTS

- **MUST** validate WGS84 coordinate bounds (lat ∈ [-90,90], lng ∈ [-180,180]); throw `ConvexError({ code: GEOCODE_INVALID_COORDS })` on out-of-range
- **MUST** wrap Mapbox HTTP calls in `withTimeout(5_000)` + `retryOnce()` from `actions/agent/lib/reliability.ts`
- **MUST** scope `listFavoriteLocations` to the calling identity via `requireIdentity(ctx)` and query `favorite_roads.withIndex('by_clerkUserId', q => q.eq('clerkUserId', clerkUserId))`
- **MUST** return validators must be declared (`v.object({ city, state, label })`, `v.array(favoriteLocationOutputValidator)`) — no untyped returns
- **MUST** read Mapbox token via `lib/env.ts:MAPBOX_ACCESS_TOKEN` — never inline secrets
- **NEVER** use `ctx.db.query(...).filter(...)` for indexed lookups — `withIndex` is required (lint enforced by `convex-rules`)
- **NEVER** mock the Mapbox HTTP layer in `__tests__/places.test.ts` integration cases — use the real test harness with HTTP recorded fixtures only when offline-deterministic tests are needed
- **STRICTLY** mark transient HTTP errors retryable via `markRetryable(err, true)`; non-retryable (401/403/422) get `markRetryable(err, false)`

---

## DONE WHEN

- [x] AC-1: `reverseGeocode({lat,lng})` returns `{city,state,label}` for valid coordinates [PRIMARY]
- [x] AC-2: `reverseGeocode` throws `GEOCODE_INVALID_COORDS` for out-of-range coordinates
- [x] AC-3: `reverseGeocode` retries once on transient Mapbox failure, throws after second
- [x] AC-4: `listFavoriteLocations` returns rider-scoped favorites via `withIndex('by_clerkUserId')`
- [x] AC-5: `listFavoriteLocations` throws `UNAUTHENTICATED` when no identity
- [x] AC-6: All Convex validators (args + returns) are declared on both functions
- [x] `pnpm --dir server test -- places favorites` passes
- [x] `pnpm type-check:native` clean
- [x] `git diff --name-only` ⊆ writeAllowed

---

## ACCEPTANCE CRITERIA

### AC-1: reverseGeocode returns geocoded address [PRIMARY]
- **GIVEN** Mapbox token configured and valid coordinates `(lat: 36.97, lng: -122.03)`
- **WHEN** `actions/places.reverseGeocode` is invoked
- **THEN** returns `{ city: 'Santa Cruz', state: 'CA', label: 'Santa Cruz, CA' }` matching the returns validator
- **VERIFY:** `pnpm --dir server test -- -t 'reverseGeocode returns city/state/label for valid coordinates'`

### AC-2: reverseGeocode rejects out-of-range coordinates
- **GIVEN** coordinates `(lat: 999, lng: 0)`
- **WHEN** `reverseGeocode` is invoked
- **THEN** throws `ConvexError({ code: 'GEOCODE_INVALID_COORDS' })` before any HTTP call
- **VERIFY:** `pnpm --dir server test -- -t 'reverseGeocode throws GEOCODE_INVALID_COORDS for out-of-range'`

### AC-3: reverseGeocode retries once on transient failure
- **GIVEN** Mapbox returns 503 on first call, 200 on retry
- **WHEN** `reverseGeocode` is invoked
- **THEN** result is the second response and total HTTP attempts == 2
- **VERIFY:** `pnpm --dir server test -- -t 'reverseGeocode retries once on transient'`

### AC-4: listFavoriteLocations returns rider-scoped favorites via withIndex
- **GIVEN** authenticated identity has 3 rows in `favorite_roads` with matching `clerkUserId`
- **WHEN** `listFavoriteLocations` is invoked
- **THEN** returns 3 entries shaped `{ name, geometry, bounds? }`; verify the underlying query used `withIndex('by_clerkUserId')` (not `filter`)
- **VERIFY:** `pnpm --dir server test -- -t 'listFavoriteLocations scopes by clerkUserId via withIndex'`

### AC-5: listFavoriteLocations requires authentication
- **GIVEN** no identity on `ctx`
- **WHEN** `listFavoriteLocations` is invoked
- **THEN** throws `ConvexError({ code: 'UNAUTHENTICATED' })`
- **VERIFY:** `pnpm --dir server test -- -t 'listFavoriteLocations throws UNAUTHENTICATED'`

### AC-6: validators declared on both functions
- **GIVEN** `actions/places.ts` and `db/favorites.ts` source
- **WHEN** static inspection runs
- **THEN** both functions declare `args` and `returns` validators (no untyped surfaces)
- **VERIFY:** `grep -E '^(export const|args:|returns:)' convex/actions/places.ts convex/db/favorites.ts | wc -l` ≥ 6

---

## TEST CRITERIA

| ID    | Statement                                                                       | Maps To | Type        |
|-------|---------------------------------------------------------------------------------|---------|-------------|
| TC-1  | reverseGeocode returns `{city,state,label}` for `(36.97,-122.03)`                | AC-1    | happy_path  |
| TC-2  | reverseGeocode throws `GEOCODE_INVALID_COORDS` for `(999,0)`                     | AC-2    | edge_case   |
| TC-3  | reverseGeocode performs exactly 2 HTTP attempts when first returns 503           | AC-3    | edge_case   |
| TC-4  | listFavoriteLocations executes `withIndex('by_clerkUserId',...)`, not `filter`   | AC-4    | happy_path  |
| TC-5  | listFavoriteLocations throws `UNAUTHENTICATED` with no identity                  | AC-5    | error_case  |
| TC-6  | Both functions declare `args` and `returns` validators                           | AC-6    | happy_path  |

---

## SCOPE

**writeAllowed:**
- `convex/actions/places.ts` (NEW)
- `convex/db/favorites.ts` (NEW — re-export of existing favorites query)
- `convex/__tests__/places.test.ts` (NEW)
- `convex/__tests__/favorites.test.ts` (NEW)
- `convex/errors.ts` (MODIFY — add `GEOCODE_INVALID_COORDS`, `GEOCODE_NOT_FOUND` codes)
- `convex/lib/env.ts` (MODIFY — declare `MAPBOX_ACCESS_TOKEN`)

**writeProhibited:**
- `ios/**`, `android/**`, `react-native/**`, `tokens/**`
- `convex/schema.ts` — `favorite_roads` table already exists; do not redefine
- `convex/auth.config.ts` — auth config is sprint-03 ownership

---

## BOUNDARIES

✅ **Always:**
- Wrap external HTTP in `retryOnce(withTimeout(...))`
- Use `requireIdentity(ctx)` for all rider-scoped queries
- Declare `args` and `returns` validators on every public function

⚠️ **Ask First:**
- Adding new fields to `favorite_roads` table
- Switching from Mapbox Geocoding to a different provider
- Increasing the timeout above 5s

---

## DELIVERABLE

- `actions/places.ts` (NEW): `reverseGeocode` action — Mapbox Geocoding v5 wrapper
- `actions/weather.ts` (DELIVERED IN T02): see IDLE-S06-CVX-T02
- `db/favorites.ts` (NEW): `listFavoriteLocations` query exposing `favorite_roads` rows
- `__tests__/places.test.ts` (NEW): coordinate validation, retry, success-path, error-classification tests
- `__tests__/favorites.test.ts` (NEW): identity scoping, withIndex assertion, ordering test
- `errors.ts` (MODIFY): `GEOCODE_INVALID_COORDS`, `GEOCODE_NOT_FOUND` error codes
- `lib/env.ts` (MODIFY): `MAPBOX_ACCESS_TOKEN` env declaration

---

## AGENT INSTRUCTIONS (TDD per AC)

For each AC: RED → GREEN → REFACTOR. Use the Convex test harness (`convex-test`); for HTTP-dependent ACs (AC-1, AC-3) use deterministic recorded fixtures via `withTimeout`-friendly mock fetcher injection — never stub `globalThis.fetch` for the success-path integration test.

---

## READING LIST

1. `convex/actions/places.ts:1-200` **[PRIMARY PATTERN]** — final implementation; references for validator + retry + error classification shape
2. `convex/actions/agent/lib/reliability.ts:1-80` — `retryOnce`, `withTimeout`, `markRetryable` pattern
3. `convex/guards.ts` — `requireIdentity()` shape; throws `UNAUTHENTICATED` when no identity
4. `convex/db/favorites.ts:1-60` — `listFavoriteLocationsHandler` extracted for testing without Convex runtime
5. `.spec/design/system/views/mapapp/idle/idle-screen.html` — visual ground truth for "Near {city}, {state}" pill copy

---

## EVIDENCE GATES

| Gate | Command | Expected |
|------|---------|----------|
| Convex tests | `pnpm --dir server test -- places favorites` | Exit 0; ≥10 assertions pass |
| Typecheck | `pnpm type-check:native` | Exit 0 |
| Biome lint | `pnpm exec biome check convex/actions/places.ts convex/db/favorites.ts` | Exit 0 |
| Convex deploy dry-run | `pnpm --dir server run convex:dev -- --once` | Exit 0; new functions visible in `_generated/api.d.ts` |

---

## OUT OF SCOPE

- Forward geocoding (text → coordinates) — use the existing `actions/places.ts` if added later
- Weather (`getCurrentWeather`) — IDLE-S06-CVX-T02
- iOS/Android client wiring — IDLE-S06-IOS-T01 / IDLE-S06-AND-T01

---

## CONTEXT

**Current state:** No `places` action existed; `favorite_roads` schema existed but no public client query exposed it.

**Gap:** The map view's idle state pills require a `Near {city}, {state}` resolution from coordinates and a copper-pin overlay needs a list of saved favorites — both must be authenticated, indexed, and validator-strict.

---

## REVIEW (for convex-reviewer)

**Must pass:**
- Both functions declare `args` and `returns` validators
- `withIndex('by_clerkUserId')` is used in `listFavoriteLocations` (not `.filter()`)
- HTTP wrappers use `retryOnce(withTimeout(...))` from `agent/lib/reliability.ts`
- Tests run against real Convex test harness (no `vi.mock` of the Convex runtime layer)
- SCOPE respected — no `schema.ts` mutations

**Should verify:**
- Mapbox response parsing handles `features: []` (empty result → `GEOCODE_NOT_FOUND`)
- `markRetryable` correctly classifies 4xx vs 5xx Mapbox errors
- `requireIdentity` is the first line of any rider-scoped function

**Verdict:** APPROVED

---

## DESIGN

**References:**
- `.spec/design/system/views/mapapp/idle/idle-screen.html` — pill: "Near {city}, {state}" copy + tag chip
- `.spec/design/system/views/mapapp/idle/README.md` — favorite pin recipe (copper dot, glass halo)

**Pattern:** Validator-first Convex actions wrapping external HTTP with `retryOnce(withTimeout(...))`; per-function `args`/`returns` validators; `requireIdentity` gate at function head.

**Pattern source:** `convex/actions/agent/lib/reliability.ts:1-80` and `convex/guards.ts`

**Anti-pattern:** Calling `globalThis.fetch` directly without `withTimeout`; using `.filter()` on indexed queries; throwing raw `Error` instead of typed `ConvexError`.

---

## DEPENDENCIES

- **Depends on:** Sprint 03 (`auth.config.ts`, `requireIdentity`, `favorite_roads` schema)
- **Blocks:** IDLE-S06-IOS-T01, IDLE-S06-AND-T01, IDLE-S06-IOS-T03, IDLE-S06-AND-T03
- **Parallel:** IDLE-S06-CVX-T02

---

## CODING STANDARDS

- `convex/_generated/ai/guidelines.md` — Convex API patterns (validators, indexes, HTTP wrappers)
- `RULES.md` §Convex Backend — `convex/_generated/ai/guidelines.md` is required reading
- `RULES.md` §Verification Standards — `pnpm type-check:native` + `pnpm --dir server test`
- `brain/docs/ANTI-STUB-REVIEW.md` — no HTTP mocks in integration tests

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"GIVEN valid coordinates WHEN reverseGeocode invoked THEN returns {city,state,label}","verify":"pnpm --dir server test -- -t 'reverseGeocode returns city/state/label for valid coordinates'"},
    {"id":"AC-2","type":"acceptance_criterion","description":"GIVEN out-of-range coordinates WHEN reverseGeocode invoked THEN throws GEOCODE_INVALID_COORDS","verify":"pnpm --dir server test -- -t 'reverseGeocode throws GEOCODE_INVALID_COORDS for out-of-range'"},
    {"id":"AC-3","type":"acceptance_criterion","description":"GIVEN Mapbox 503 then 200 WHEN reverseGeocode invoked THEN exactly 2 attempts, returns second","verify":"pnpm --dir server test -- -t 'reverseGeocode retries once on transient'"},
    {"id":"AC-4","type":"acceptance_criterion","description":"GIVEN authenticated identity with 3 favorite_roads rows WHEN listFavoriteLocations invoked THEN returns 3 entries via withIndex(by_clerkUserId)","verify":"pnpm --dir server test -- -t 'listFavoriteLocations scopes by clerkUserId via withIndex'"},
    {"id":"AC-5","type":"acceptance_criterion","description":"GIVEN no identity WHEN listFavoriteLocations invoked THEN throws UNAUTHENTICATED","verify":"pnpm --dir server test -- -t 'listFavoriteLocations throws UNAUTHENTICATED'"},
    {"id":"AC-6","type":"acceptance_criterion","description":"Both functions declare args and returns validators","verify":"grep -cE 'args:|returns:' convex/actions/places.ts convex/db/favorites.ts"},
    {"id":"TC-1","type":"test_criterion","description":"reverseGeocode returns {city,state,label} for (36.97,-122.03)","maps_to_ac":"AC-1","verify":"pnpm --dir server test -- -t 'reverseGeocode returns city/state/label'"},
    {"id":"TC-2","type":"test_criterion","description":"reverseGeocode throws GEOCODE_INVALID_COORDS for (999,0)","maps_to_ac":"AC-2","verify":"pnpm --dir server test -- -t 'reverseGeocode throws GEOCODE_INVALID_COORDS'"},
    {"id":"TC-3","type":"test_criterion","description":"reverseGeocode performs exactly 2 HTTP attempts when first returns 503","maps_to_ac":"AC-3","verify":"pnpm --dir server test -- -t 'reverseGeocode retries once'"},
    {"id":"TC-4","type":"test_criterion","description":"listFavoriteLocations executes withIndex(by_clerkUserId), not filter","maps_to_ac":"AC-4","verify":"pnpm --dir server test -- -t 'listFavoriteLocations scopes by clerkUserId via withIndex'"},
    {"id":"TC-5","type":"test_criterion","description":"listFavoriteLocations throws UNAUTHENTICATED with no identity","maps_to_ac":"AC-5","verify":"pnpm --dir server test -- -t 'listFavoriteLocations throws UNAUTHENTICATED'"},
    {"id":"TC-6","type":"test_criterion","description":"Both functions declare args and returns validators","maps_to_ac":"AC-6","verify":"grep -cE 'args:|returns:' convex/actions/places.ts convex/db/favorites.ts"}
  ]
}
-->
