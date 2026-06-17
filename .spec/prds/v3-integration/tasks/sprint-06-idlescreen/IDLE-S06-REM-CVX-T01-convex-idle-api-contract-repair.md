# IDLE-S06-REM-CVX-T01 — Convex idle API contract repair
> Status: ✅ Completed
> Cycle: 4
> Commit: 1e9daf41a5375d047cd346868bb41375ad0c23c6
> Reviewer: convex-reviewer
> Updated: 2026-05-05T07:29:41.581Z

```
TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=convex-implementer | reviewer=convex-reviewer
SPRINT:     sprint-06-idlescreen -> ./SPRINT.md
PRD_REFS:   UC-MAP-01, UC-CHAT-01

RUNTIME_COMMANDS:
  test:      pnpm test -- convex/__tests__/places.test.ts convex/__tests__/favorites.test.ts convex/__tests__/weather.test.ts
  typecheck: pnpm type-check:native
  lint:      pnpm exec biome check --no-errors-on-unmatched convex/actions/places.ts convex/actions/weather.ts convex/db/favorites.ts convex/__tests__/places.test.ts convex/__tests__/favorites.test.ts convex/__tests__/weather.test.ts
```

---

## OUTCOME

iOS and Android can call the Sprint 06 Convex idle endpoints by their documented public names and receive mobile-compatible reverse-geocode, weather, and favorite-location payloads.

---

## CRITICAL CONSTRAINTS

- **MUST** expose `actions/places:reverseGeocode`; mobile clients already call that public action name.
- **MUST** return a weather payload that includes `tempF`, `condition`, `severity`, and uppercase `dayOfWeek`.
- **MUST** return favorite locations in a direct mobile pin shape: `id`, `lat`, `lng`, `label`, with optional `bounds`.
- **NEVER** satisfy tests only by asserting mocked hardcoded returns; tests must prove endpoint names and DTO shape.
- **STRICTLY** preserve authenticated scoping on favorites and weather identity guards.

---

## DONE WHEN

- [x] AC-1: `actions/places:reverseGeocode` exists and returns `{city,state,label}` for valid coordinates (PRIMARY)
- [x] AC-2: `actions/weather:getCurrentWeather` returns `{tempF,condition,severity,dayOfWeek}` with validators
- [x] AC-3: `db/favorites:listFavoriteLocations` returns mobile pin DTOs scoped to the authenticated rider
- [x] AC-4: Transient Mapbox/Open-Meteo 5xx failures retry once, while 4xx failures do not retry
- [x] AC-5: Contract tests fail if public endpoint names or DTO keys drift from mobile clients
- [ ] Runtime commands above exit 0

---

## ACCEPTANCE CRITERIA

### AC-1: Public reverse-geocode action name [PRIMARY]
- **GIVEN** the generated Convex function tree and mobile clients
- **WHEN** `actions/places:reverseGeocode` is invoked with valid `lat/lng`
- **THEN** it returns `city`, `state`, and `label` without requiring callers to know `getReverseGeocode`
- **VERIFY:** `pnpm test -- convex/__tests__/places.test.ts`

### AC-2: Weather DTO matches idle consumers
- **GIVEN** Open-Meteo returns current weather for a coordinate
- **WHEN** `actions/weather:getCurrentWeather` resolves
- **THEN** the validated return object contains `tempF`, `condition`, `severity`, and uppercase `dayOfWeek`
- **VERIFY:** `pnpm test -- convex/__tests__/weather.test.ts`

### AC-3: Favorites return direct pin coordinates
- **GIVEN** two authenticated riders with favorite roads
- **WHEN** `db/favorites:listFavoriteLocations` runs for one rider
- **THEN** only that rider's favorites return as `id`, `lat`, `lng`, `label`, and optional `bounds`
- **VERIFY:** `pnpm test -- convex/__tests__/favorites.test.ts`

### AC-4: Retry policy is transient-only
- **GIVEN** Mapbox/Open-Meteo returns `503` then `200`
- **WHEN** the action runs
- **THEN** it retries once and succeeds; a `400` response fails without retry
- **VERIFY:** `pnpm test -- convex/__tests__/places.test.ts convex/__tests__/weather.test.ts`

### AC-5: Mobile contract guard
- **GIVEN** the Swift and Kotlin clients call `actions/places:reverseGeocode`, `actions/weather:getCurrentWeather`, and `db/favorites:listFavoriteLocations`
- **WHEN** contract tests inspect the endpoint strings and DTO keys
- **THEN** any server/client contract mismatch fails before the sprint gate
- **VERIFY:** `pnpm type-check:native`

---

## TEST CRITERIA

| ID | Statement | Maps To | Type |
|----|-----------|---------|------|
| TC-1 | `actions/places:reverseGeocode` is exported when valid coordinates are supplied | AC-1 | happy_path |
| TC-2 | Weather response contains `dayOfWeek` when provider data is valid | AC-2 | happy_path |
| TC-3 | Favorite results exclude rows for other `clerkUserId` values | AC-3 | security |
| TC-4 | HTTP 503 then 200 results in one retry and success | AC-4 | edge_case |
| TC-5 | HTTP 400 results in no retry | AC-4 | error_case |
| TC-6 | Typecheck fails on DTO key drift | AC-5 | contract |

---

## Remediation Trail

| Cycle | FIX | Failed Reqs | Reviewer | At |
|---|---|---|---|---|
| 4 | FIX-IDLE-S06-REM-CVX-T01-C3 | AC-5, TC-6 | convex-reviewer | 2026-05-05T07:05:49.196Z |
| 3 | FIX-IDLE-S06-REM-CVX-T01-C2 |  | convex-reviewer | 2026-05-05T06:58:24.687Z |
| 2 | FIX-IDLE-S06-REM-CVX-T01-C1 | AC-3, AC-5 | convex-reviewer | 2026-05-05T06:43:29.312Z |

## SCOPE

**writeAllowed:**
- `convex/actions/places.ts` (MODIFY)
- `convex/actions/weather.ts` (MODIFY)
- `convex/db/favorites.ts` (MODIFY)
- `convex/errors.ts` (MODIFY if a typed geocode error is required)
- `convex/__tests__/places.test.ts` (MODIFY)
- `convex/__tests__/weather.test.ts` (MODIFY)
- `convex/__tests__/favorites.test.ts` (MODIFY)
- `ios/LaneShadow/Services/ConvexClient+LaneShadow.swift` (READ-ONLY contract reference)
- `android/app/src/main/java/com/laneshadow/services/ConvexClientProvider.kt` (READ-ONLY contract reference)

**writeProhibited:**
- `ios/**` and `android/**` implementation changes - owned by platform remediation tasks
- `.design-review/**` and `ios/build/**` generated gate artifacts
- Any route-planning agent code outside shared reliability helpers already imported by these actions

---

## AGENT INSTRUCTIONS

For each AC, write or adjust the failing contract test first, prove it fails against the current mismatch, then make the smallest Convex change that turns it green. Keep endpoint naming boring: aliases are acceptable only when old names remain harmless, but documented mobile names must be first-class exports.

---

## READING LIST

1. `convex/actions/places.ts` - current reverse-geocode implementation and export name
2. `convex/actions/weather.ts` - current weather return validator and retry policy
3. `convex/db/favorites.ts` - favorite query scope and return validator
4. `ios/LaneShadow/Services/ConvexClient+LaneShadow.swift` - Swift endpoint strings and DTO expectations
5. `android/app/src/main/java/com/laneshadow/services/ConvexClientProvider.kt` - Kotlin endpoint strings and DTO expectations

---

## EVIDENCE GATES

| Gate | Command | Expected |
|------|---------|----------|
| Contract tests | `pnpm test -- convex/__tests__/places.test.ts convex/__tests__/favorites.test.ts convex/__tests__/weather.test.ts` | Exit 0 |
| Typecheck | `pnpm type-check:native` | Exit 0 |
| Biome | `pnpm exec biome check --no-errors-on-unmatched convex/actions/places.ts convex/actions/weather.ts convex/db/favorites.ts convex/__tests__/places.test.ts convex/__tests__/favorites.test.ts convex/__tests__/weather.test.ts` | Exit 0 |
| Convex build | `pnpm --dir server run convex:dev -- --once` | Exit 0 |

---

## OUT OF SCOPE

- iOS or Android UI fixes
- Design-review screenshot capture
- Adding new third-party providers

---

## REVIEW

Reviewer must verify the public endpoint names, return validators, and mobile DTO references line up exactly. Any endpoint or payload mismatch is a sprint-blocking failure.

---

## DESIGN

**References:** `.spec/design/system/views/mapapp/idle/README.md`, `SPRINT.md`

**Pattern:** Backend actions expose small mobile DTOs so view models do not parse provider-specific response shapes.

**Anti-pattern:** Shipping a handler named `getReverseGeocode` while mobile calls `reverseGeocode`.

---

## DEPENDENCIES

- **Depends on:** IDLE-S06-CVX-T01, IDLE-S06-CVX-T02
- **Blocks:** IDLE-S06-REM-IOS-T01, IDLE-S06-REM-AND-T01, IDLE-S06-REM-GATE-T01

---

## CODING STANDARDS

- `RULES.md` section "Convex Backend"
- `convex/_generated/ai/guidelines.md`
- `/Users/justinrich/Projects/brain/docs/ANTI-STUB-REVIEW.md`

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN generated Convex functions and mobile clients WHEN actions/places:reverseGeocode is invoked THEN city/state/label return under the documented public name",
      "verify": "pnpm test -- convex/__tests__/places.test.ts",
      "maps_to_ac": null,
      "satisfied": true,
      "evidence": "pnpm test -- convex/__tests__/places.test.ts EXIT_CODE:0; convex/__tests__/places.test.ts:89-104 verifies native endpoint alignment, and android/app/src/main/java/com/laneshadow/services/ConvexClientProvider.kt:334-342 still calls \"actions/places:reverseGeocode\".",
      "remediation": null,
      "last_evaluated_cycle": 4,
      "last_evaluated_commit": "1e9daf41a5375d047cd346868bb41375ad0c23c6"
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN Open-Meteo current data WHEN actions/weather:getCurrentWeather resolves THEN tempF/condition/severity/dayOfWeek return with validators",
      "verify": "pnpm test -- convex/__tests__/weather.test.ts",
      "maps_to_ac": null,
      "satisfied": true,
      "evidence": "pnpm test -- convex/__tests__/weather.test.ts EXIT_CODE:0; android/app/src/main/java/com/laneshadow/data/dto/WeatherDto.kt:14-31 now requires dayOfWeek and maps it into WeatherSummary, and android/app/src/test/java/com/laneshadow/data/dto/ConvexDtoContractTest.kt:42-60 verifies the repaired weather payload shape.",
      "remediation": null,
      "last_evaluated_cycle": 4,
      "last_evaluated_commit": "1e9daf41a5375d047cd346868bb41375ad0c23c6"
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN authenticated riders WHEN db/favorites:listFavoriteLocations runs THEN only caller favorites return as id/lat/lng/label DTOs",
      "verify": "pnpm test -- convex/__tests__/favorites.test.ts",
      "maps_to_ac": null,
      "satisfied": true,
      "evidence": "pnpm test -- convex/__tests__/favorites.test.ts EXIT_CODE:0; android/app/src/main/java/com/laneshadow/data/dto/FavoriteLocationDto.kt:11-25 now matches id/lat/lng/label, and android/app/src/main/java/com/laneshadow/services/ConvexClientProvider.kt:278-283 maps db/favorites:listFavoriteLocations directly through that DTO.",
      "remediation": null,
      "last_evaluated_cycle": 4,
      "last_evaluated_commit": "1e9daf41a5375d047cd346868bb41375ad0c23c6"
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN transient provider failures WHEN idle actions run THEN 5xx retries once and 4xx does not retry",
      "verify": "pnpm test -- convex/__tests__/places.test.ts convex/__tests__/weather.test.ts",
      "maps_to_ac": null,
      "satisfied": true,
      "evidence": "pnpm test -- convex/__tests__/places.test.ts convex/__tests__/weather.test.ts EXIT_CODE:0; convex/__tests__/places.test.ts:33-87 and convex/__tests__/weather.test.ts:57-127 still prove one retry on 503 and no retry on 400/429.",
      "remediation": null,
      "last_evaluated_cycle": 4,
      "last_evaluated_commit": "1e9daf41a5375d047cd346868bb41375ad0c23c6"
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "description": "GIVEN mobile endpoint strings and DTO keys WHEN contract tests/typecheck run THEN server/client drift fails",
      "verify": "pnpm type-check:native",
      "maps_to_ac": null,
      "satisfied": true,
      "evidence": "convex/__tests__/places.test.ts:89-104, convex/__tests__/weather.test.ts:148-163, and convex/__tests__/favorites.test.ts:113-132 assert the public endpoint names against Android source; android/app/src/test/java/com/laneshadow/data/dto/ConvexDtoContractTest.kt:16-74 asserts Android DTO-key compatibility and rejects the legacy favorites shape; .tmp/IDLE-S06-REM-CVX-T01/android-test-output.txt:336-338,507-509,582-584 show successful reruns of :app:compileDebugKotlin and :app:testDebugUnitTest for the Android contract checks.",
      "remediation": null,
      "last_evaluated_cycle": 4,
      "last_evaluated_commit": "1e9daf41a5375d047cd346868bb41375ad0c23c6"
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "actions/places:reverseGeocode is exported when valid coordinates are supplied",
      "maps_to_ac": "AC-1",
      "verify": "pnpm test -- convex/__tests__/places.test.ts",
      "satisfied": true,
      "evidence": "pnpm test -- convex/__tests__/places.test.ts EXIT_CODE:0.",
      "remediation": null,
      "last_evaluated_cycle": 4,
      "last_evaluated_commit": "1e9daf41a5375d047cd346868bb41375ad0c23c6"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Weather response contains dayOfWeek when provider data is valid",
      "maps_to_ac": "AC-2",
      "verify": "pnpm test -- convex/__tests__/weather.test.ts",
      "satisfied": true,
      "evidence": "pnpm test -- convex/__tests__/weather.test.ts EXIT_CODE:0.",
      "remediation": null,
      "last_evaluated_cycle": 4,
      "last_evaluated_commit": "1e9daf41a5375d047cd346868bb41375ad0c23c6"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "Favorite results exclude rows for other clerkUserId values",
      "maps_to_ac": "AC-3",
      "verify": "pnpm test -- convex/__tests__/favorites.test.ts",
      "satisfied": true,
      "evidence": "pnpm test -- convex/__tests__/favorites.test.ts EXIT_CODE:0.",
      "remediation": null,
      "last_evaluated_cycle": 4,
      "last_evaluated_commit": "1e9daf41a5375d047cd346868bb41375ad0c23c6"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "HTTP 503 then 200 results in one retry and success",
      "maps_to_ac": "AC-4",
      "verify": "pnpm test -- convex/__tests__/places.test.ts convex/__tests__/weather.test.ts",
      "satisfied": true,
      "evidence": "pnpm test -- convex/__tests__/places.test.ts convex/__tests__/weather.test.ts EXIT_CODE:0.",
      "remediation": null,
      "last_evaluated_cycle": 4,
      "last_evaluated_commit": "1e9daf41a5375d047cd346868bb41375ad0c23c6"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "HTTP 400 results in no retry",
      "maps_to_ac": "AC-4",
      "verify": "pnpm test -- convex/__tests__/places.test.ts convex/__tests__/weather.test.ts",
      "satisfied": true,
      "evidence": "pnpm test -- convex/__tests__/places.test.ts convex/__tests__/weather.test.ts EXIT_CODE:0.",
      "remediation": null,
      "last_evaluated_cycle": 4,
      "last_evaluated_commit": "1e9daf41a5375d047cd346868bb41375ad0c23c6"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "Typecheck fails on DTO key drift",
      "maps_to_ac": "AC-5",
      "verify": "pnpm type-check:native",
      "satisfied": true,
      "evidence": "pnpm type-check:native EXIT_CODE:0; Android drift coverage is additionally enforced by android/app/src/test/java/com/laneshadow/data/dto/ConvexDtoContractTest.kt:16-74 and the successful Android reruns recorded in .tmp/IDLE-S06-REM-CVX-T01/android-test-output.txt:507-509 and 582-584.",
      "remediation": null,
      "last_evaluated_cycle": 4,
      "last_evaluated_commit": "1e9daf41a5375d047cd346868bb41375ad0c23c6"
    }
  ]
}
-->
