# IDLE-S06-CVX-T02 — Convex weather proxy action `getCurrentWeather(lat,lng)`

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

A signed-in client can call `api.weather.getCurrentWeather({lat,lng})` and receive `{tempF: number, condition: WeatherCondition, severity: 'normal'|'advisory'|'warning'}` sourced server-side from Open-Meteo with deterministic WMO→condition mapping and threshold-based severity classification.

---

## 🚫 CRITICAL CONSTRAINTS

- **MUST** use Open-Meteo (`https://api.open-meteo.com/v1/forecast`) — keyless, free, already proven by `weatherProvider.ts`.
- **MUST** add `'use node'` directive at the top of `server/convex/actions/weather.ts` (this action calls `fetch` and reads `process.env`).
- **MUST** implement severity thresholds deterministically: `advisory` when `precipitation_probability ≥ 40` OR `windspeed_10m ≥ 40 km/h`; `warning` when `precipitation_probability ≥ 70` OR `windspeed_10m ≥ 70 km/h`; otherwise `normal`. These thresholds drive the IdleScreen V03 Weather Advisory variant.
- **MUST** map Open-Meteo WMO codes deterministically to `{CLEAR, CLOUDY, RAIN, SNOW, FOG, WIND, STORM}` via a pure lookup table.
- **NEVER** expose raw Open-Meteo JSON to the client — always project to `{tempF, condition, severity}`.
- **NEVER** call `ctx.db` inside the action; **NEVER** use `filter()` in any helper queries.
- **STRICTLY** use `retryOnce` from `server/convex/actions/agent/lib/reliability.ts` for HTTP retry — no custom loops.

---

## DONE WHEN

- [ ] AC-1: Happy path returns `{tempF:68, condition:'CLEAR', severity:'normal'}` for clear-sky fixture (PRIMARY)
- [ ] AC-2: `precipitation_probability ≥ 40` produces `severity:'advisory'`
- [ ] AC-3: `precipitation_probability ≥ 70` produces `severity:'warning'`
- [ ] AC-4: `windspeed_10m ≥ 40 km/h` alone produces `severity:'advisory'` even with low rain probability
- [ ] AC-5: HTTP 5xx from Open-Meteo throws `ConvexError(WEATHER_UNAVAILABLE)` after `retryOnce` exhausted
- [ ] AC-6: Unauthenticated caller throws `ConvexError(UNAUTHENTICATED)` before any HTTP call
- [ ] AC-7: `pnpm --dir server run convex:dev -- --once` exits 0
- [ ] All tests pass + typecheck clean + lint clean
- [ ] `git diff --name-only` ⊆ writeAllowed

---

## ACCEPTANCE CRITERIA

### AC-1: Happy path returns correct shape for clear-sky [PRIMARY]
- **GIVEN** Open-Meteo returns `tempC=20, precipitation_probability=5, windspeed_10m=10, weathercode=0` (clear)
- **WHEN** `api.weather.getCurrentWeather({lat:36.97, lng:-122.03})` is called by an authenticated rider
- **THEN** action returns `{tempF: 68, condition: 'CLEAR', severity: 'normal'}` where `tempF = Math.round(20*9/5+32)`
- **TDD_STATE:** none → red → green → refactor
- **TEST_FILE:** `server/convex/__tests__/weather.test.ts`
- **VERIFY:** `pnpm test --reporter=verbose 2>&1 | grep 'getCurrentWeather happy path clear sky'`

### AC-2: Severity advisory threshold — precipitation ≥ 40
- **GIVEN** Open-Meteo returns `precipitation_probability=45, windspeed=15, tempC=15, weathercode=61` (rain)
- **WHEN** `getCurrentWeather` is called
- **THEN** action returns `severity:'advisory'`, `condition:'RAIN'`
- **VERIFY:** `pnpm test --reporter=verbose 2>&1 | grep 'getCurrentWeather severity advisory rain probability'`

### AC-3: Severity warning threshold — precipitation ≥ 70
- **GIVEN** Open-Meteo returns `precipitation_probability=75, windspeed=20, tempC=10, weathercode=95` (storm)
- **WHEN** `getCurrentWeather` is called
- **THEN** action returns `severity:'warning'`, `condition:'STORM'`
- **VERIFY:** `pnpm test --reporter=verbose 2>&1 | grep 'getCurrentWeather severity warning storm'`

### AC-4: Severity advisory — wind alone ≥ 40 km/h
- **GIVEN** Open-Meteo returns `windspeed_10m=55, precipitation_probability=10, tempC=18, weathercode=0` (clear sky but windy)
- **WHEN** `getCurrentWeather` is called
- **THEN** action returns `severity:'advisory'`, `condition:'WIND'`
- **VERIFY:** `pnpm test --reporter=verbose 2>&1 | grep 'getCurrentWeather severity advisory wind speed'`

### AC-5: HTTP 5xx throws WEATHER_UNAVAILABLE after retryOnce
- **GIVEN** Open-Meteo returns HTTP 503 for the requested coordinates
- **WHEN** `getCurrentWeather` is called
- **THEN** action throws `ConvexError(ERROR_CODES.WEATHER_UNAVAILABLE)` after `retryOnce` exhausted
- **VERIFY:** `pnpm test --reporter=verbose 2>&1 | grep 'getCurrentWeather throws WEATHER_UNAVAILABLE on 503'`

### AC-6: Unauthenticated caller rejected before HTTP
- **GIVEN** no JWT in request context
- **WHEN** `getCurrentWeather` is called
- **THEN** action throws `ConvexError(UNAUTHENTICATED)` BEFORE any `fetch` is attempted
- **VERIFY:** `pnpm test --reporter=verbose 2>&1 | grep 'getCurrentWeather throws UNAUTHENTICATED'`

### AC-7: Convex build passes with new file
- **GIVEN** `server/convex/actions/weather.ts` is committed
- **WHEN** Convex build validates the bundle
- **THEN** `pnpm --dir server run convex:dev -- --once` exits 0
- **VERIFY:** `pnpm --dir server run convex:dev -- --once`

---

## TEST CRITERIA

| ID    | Statement                                                                                  | Maps To | Type        |
|-------|--------------------------------------------------------------------------------------------|---------|-------------|
| TC-1  | getCurrentWeather returns `{tempF:68, condition:'CLEAR', severity:'normal'}` for clear-sky fixture | AC-1    | happy_path  |
| TC-2  | getCurrentWeather returns `severity:'advisory'`, `condition:'RAIN'` when precip=45, wind=15 | AC-2    | edge_case   |
| TC-3  | getCurrentWeather returns `severity:'warning'`, `condition:'STORM'` when precip=75, code=95 | AC-3    | edge_case   |
| TC-4  | getCurrentWeather returns `severity:'advisory'`, `condition:'WIND'` when wind=55, precip=10 | AC-4    | edge_case   |
| TC-5  | getCurrentWeather throws WEATHER_UNAVAILABLE after retryOnce when fetch returns 503        | AC-5    | error_path  |
| TC-6  | getCurrentWeather throws UNAUTHENTICATED before any HTTP call when no identity             | AC-6    | error_path  |
| TC-7  | wmoCodeToCondition pure unit: 71→SNOW, 51→RAIN, 45→FOG, 61→RAIN                            | AC-1    | happy_path  |
| TC-8  | celsiusToFahrenheit pure unit: 0°C→32, 100°C→212, 20°C→68                                  | AC-1    | happy_path  |

---

## SCOPE

**writeAllowed:**
- `server/convex/actions/weather.ts` (NEW) — public action `getCurrentWeather`
- `server/convex/__tests__/weather.test.ts` (NEW) — tests for action + WMO lookup + Fahrenheit conversion

**writeProhibited:**
- `server/convex/_generated/**` — generated
- `server/convex/schema.ts` — no schema changes (weather not persisted)
- `server/convex/actions/agent/providers/weatherProvider.ts` — existing route-planning provider, do not modify
- `server/convex/lib/env.ts` — Open-Meteo is keyless; no new env var
- `react-native/**`, `ios/**`, `android/**` — out of scope

---

## BOUNDARIES

✅ **Always:**
- Use `requireIdentity(ctx)` first
- Use `withTimeout` + `retryOnce` for external HTTP
- Use `ERROR_CODES.WEATHER_UNAVAILABLE` (already exists in registry — do not add duplicate)

⚠️ **Ask First:**
- Switching weather provider away from Open-Meteo
- Adjusting severity thresholds beyond the stated values

---

## DELIVERABLE

- `server/convex/actions/weather.ts` (NEW): `'use node'` action `getCurrentWeather(lat, lng)` returning `{tempF, condition, severity}` plus internal pure helpers `wmoCodeToCondition(code)` and `celsiusToFahrenheit(c)`
- `server/convex/__tests__/weather.test.ts` (NEW): 8 tests covering AC-1..AC-6 + TC-7 + TC-8

---

## AGENT INSTRUCTIONS (TDD per AC)

For each AC: RED → GREEN → REFACTOR.

**RED:** Write one failing test in `server/convex/__tests__/weather.test.ts`. Run `pnpm test`. VERIFY FAILS.

**GREEN:** Write minimal code in `server/convex/actions/weather.ts` to pass. Re-run; VERIFY PASSES.

**REFACTOR:** Stay green; clean up.

After all 6 ACs are GREEN, run `pnpm --dir server run convex:dev -- --once` to satisfy AC-7.

---

## READING LIST

1. `server/convex/actions/agent/providers/weatherProvider.ts:1-253` **[PRIMARY PATTERN]** — full Open-Meteo integration: `OPEN_METEO_ENDPOINT`, `fetchFullWeatherForPoint` with `withTimeout/retryOnce`, hourly field selection, `markRetryable`/`isRetryableWeatherError` discriminators
2. `server/convex/actions/agent/lib/reliability.ts:1-54` — `withTimeout` and `retryOnce` exact signatures
3. `server/convex/errors.ts:1-31` — `ERROR_CODES.WEATHER_UNAVAILABLE` and `UNAUTHENTICATED` already exist; do not duplicate
4. `server/convex/guards.ts:1-30` — `requireIdentity` first-line auth gate
5. `.spec/design/system/views/idle-screen/README.md:1-20` — V03 Weather Advisory variant: `WeatherSummary.severity ≥ advisory` triggers warning-accented meta row + advisory card

---

## EVIDENCE GATES

| Gate | Command | Expected |
|------|---------|----------|
| All tests pass | `pnpm test` | Exit 0 |
| Type check | `pnpm type-check:native` | Exit 0 |
| Lint | `pnpm exec biome check --no-errors-on-unmatched` | Exit 0 |
| Convex build | `pnpm --dir server run convex:dev -- --once` | Exit 0 |
| Scope compliance | `git diff --name-only` ⊆ writeAllowed | Pass |

---

## OUT OF SCOPE

- Forecast (multi-hour or multi-day) — only current-time single-point
- Caching weather results
- Pollen / UV / sunset times — only `tempF`, `condition`, `severity`

---

## CONTEXT

**Current state:** No `weather.getCurrentWeather` exists. Route-planning code uses `weatherProvider.ts` for multi-point + departure-time-aware forecasts; that file is route-scoped and would over-complicate IdleScreen.

**Gap:** IdleScreen needs a simple single-point current-time weather fetch to power "FRIDAY · 68°F · CLEAR" meta row + V03 advisory variant.

---

## REVIEW (for convex-reviewer)

**Must pass:**
- One test per AC; tests verify behavior not implementation
- RED evidence in TDD_STATE history
- `requireIdentity(ctx)` is the first line of the handler
- Severity thresholds match spec exactly (40/70 for precip, 40/70 km/h for wind)
- `WeatherCondition` and `WeatherSeverity` enums are explicit `v.union(...)` returns validators
- SCOPE respected

**Should verify:**
- WMO lookup table covers WMO codes 0–99 deterministically (no fall-through to UNKNOWN without explicit handling)
- `celsiusToFahrenheit` returns `Math.round(c*9/5+32)` (integer) — matches design "68°F"

**Verdict:** APPROVED | NEEDS_FIXES

---

## DESIGN

**References:**
- `.spec/design/system/views/idle-screen/README.md` — V03 Weather Advisory variant: `severity:'advisory'` triggers warning-accented meta row (`var(--wx-rain-tint)` background + `var(--wx-rain)` left border) and advisory card; greeting meta row "FRIDAY · 68°F · CLEAR" uses `condition` and `tempF` from this action
- `.spec/design/system/views/idle-screen/idle-screen.html` — pixel reference

**Pattern:** Single-point Open-Meteo fetch — simplified `fetchFullWeatherForPoint` from `weatherProvider.ts` with `withTimeout/retryOnce` + new WMO→condition lookup + threshold-based severity + `requireIdentity` gate.

**Pattern source:** `server/convex/actions/agent/providers/weatherProvider.ts:81-146`

**Anti-pattern:** Reusing `createWeatherProvider()` from `weatherProvider.ts` — that provider is route-planning scoped (multi-point, departure-time-aware) and drags unnecessary complexity.

---

## DEPENDENCIES

- **Depends on:** None
- **Blocks:** IDLE-S06-IOS-T01, IDLE-S06-AND-T01
- **Parallel:** IDLE-S06-CVX-T01 (independent server-side action)

---

## CODING STANDARDS

- `brain/docs/CONVEX-RULES.md` — `'use node'` directive, `ctx.db` prohibition in actions, mandatory validators
- `brain/docs/CODING-STANDARDS.md` — TypeScript strict mode
- `RULES.md` — Pre-commit checks, commit discipline

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"GIVEN Open-Meteo returns tempC=20,precip=5,wind=10,wmoCode=0 WHEN getCurrentWeather called by authenticated rider THEN returns {tempF:68,condition:'CLEAR',severity:'normal'}","verify":"pnpm test --reporter=verbose 2>&1 | grep 'getCurrentWeather happy path clear sky'"},
    {"id":"AC-2","type":"acceptance_criterion","description":"GIVEN precip=45,wind=15,wmoCode=61 WHEN getCurrentWeather called THEN severity='advisory',condition='RAIN'","verify":"pnpm test --reporter=verbose 2>&1 | grep 'getCurrentWeather severity advisory rain probability'"},
    {"id":"AC-3","type":"acceptance_criterion","description":"GIVEN precip=75,wind=20,wmoCode=95 WHEN getCurrentWeather called THEN severity='warning',condition='STORM'","verify":"pnpm test --reporter=verbose 2>&1 | grep 'getCurrentWeather severity warning storm'"},
    {"id":"AC-4","type":"acceptance_criterion","description":"GIVEN wind=55,precip=10,wmoCode=0 WHEN getCurrentWeather called THEN severity='advisory',condition='WIND'","verify":"pnpm test --reporter=verbose 2>&1 | grep 'getCurrentWeather severity advisory wind speed'"},
    {"id":"AC-5","type":"acceptance_criterion","description":"GIVEN Open-Meteo returns 503 WHEN getCurrentWeather called THEN throws ConvexError(WEATHER_UNAVAILABLE) after retryOnce","verify":"pnpm test --reporter=verbose 2>&1 | grep 'getCurrentWeather throws WEATHER_UNAVAILABLE on 503'"},
    {"id":"AC-6","type":"acceptance_criterion","description":"GIVEN no JWT WHEN getCurrentWeather called THEN throws ConvexError(UNAUTHENTICATED) before any fetch","verify":"pnpm test --reporter=verbose 2>&1 | grep 'getCurrentWeather throws UNAUTHENTICATED'"},
    {"id":"AC-7","type":"acceptance_criterion","description":"GIVEN weather.ts committed WHEN convex build runs THEN pnpm --dir server run convex:dev -- --once exits 0","verify":"pnpm --dir server run convex:dev -- --once"},
    {"id":"TC-1","type":"test_criterion","description":"clear-sky fixture produces {tempF:68,condition:'CLEAR',severity:'normal'}","maps_to_ac":"AC-1","verify":"pnpm test --reporter=verbose 2>&1 | grep 'getCurrentWeather happy path clear sky'"},
    {"id":"TC-2","type":"test_criterion","description":"precip=45,wind=15 produces severity='advisory',condition='RAIN'","maps_to_ac":"AC-2","verify":"pnpm test --reporter=verbose 2>&1 | grep 'getCurrentWeather severity advisory rain probability'"},
    {"id":"TC-3","type":"test_criterion","description":"precip=75,code=95 produces severity='warning',condition='STORM'","maps_to_ac":"AC-3","verify":"pnpm test --reporter=verbose 2>&1 | grep 'getCurrentWeather severity warning storm'"},
    {"id":"TC-4","type":"test_criterion","description":"wind=55,precip=10,code=0 produces severity='advisory',condition='WIND'","maps_to_ac":"AC-4","verify":"pnpm test --reporter=verbose 2>&1 | grep 'getCurrentWeather severity advisory wind speed'"},
    {"id":"TC-5","type":"test_criterion","description":"503 fetch throws WEATHER_UNAVAILABLE after retryOnce","maps_to_ac":"AC-5","verify":"pnpm test --reporter=verbose 2>&1 | grep 'getCurrentWeather throws WEATHER_UNAVAILABLE on 503'"},
    {"id":"TC-6","type":"test_criterion","description":"No identity throws UNAUTHENTICATED before HTTP","maps_to_ac":"AC-6","verify":"pnpm test --reporter=verbose 2>&1 | grep 'getCurrentWeather throws UNAUTHENTICATED'"},
    {"id":"TC-7","type":"test_criterion","description":"wmoCodeToCondition lookup: 71→SNOW, 51→RAIN, 45→FOG, 61→RAIN","maps_to_ac":"AC-1","verify":"pnpm test --reporter=verbose 2>&1 | grep 'wmoCodeToCondition lookup table'"},
    {"id":"TC-8","type":"test_criterion","description":"celsiusToFahrenheit: 0→32, 100→212, 20→68","maps_to_ac":"AC-1","verify":"pnpm test --reporter=verbose 2>&1 | grep 'celsiusToFahrenheit conversion'"}
  ]
}
-->
