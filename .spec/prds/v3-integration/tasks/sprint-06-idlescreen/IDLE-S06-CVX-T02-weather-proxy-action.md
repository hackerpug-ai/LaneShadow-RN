# IDLE-S06-CVX-T02 — Convex weather proxy action `getCurrentWeather` (Open-Meteo)

```
TASK_TYPE:  FEATURE
STATUS:     Done
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=convex-implementer | reviewer=convex-reviewer
SPRINT:     sprint-06-idlescreen → ./SPRINT.md
PRD_REFS:   UC-MAP-01, UC-CHAT-01, UC-FID-01

RUNTIME_COMMANDS:
  test:      pnpm --dir server test -- weather
  typecheck: pnpm type-check:native
  lint:      pnpm exec biome check server/convex/actions/weather.ts
  deploy:    pnpm --dir server run convex:dev -- --once
```

---

## OUTCOME

Convex exposes `actions/weather.getCurrentWeather({ lat, lng })` returning a strongly-typed `WeatherSummary` (temperature in F, condition label uppercase, day-of-week, severity tier `normal | advisory | warning`). The action proxies Open-Meteo, classifies WMO weather codes to LaneShadow's condition vocabulary (CLEAR/CLOUDY/RAIN/SNOW/FOG/WIND/STORM), normalises severity from precipitation probability + wind speed, and is exhaustively covered by `__tests__/weather.test.ts`.

---

## 🚫 CRITICAL CONSTRAINTS

- **MUST** convert Open-Meteo Celsius → Fahrenheit and round to integer (matches design copy "68°F")
- **MUST** map WMO weather codes to LaneShadow's 7-condition vocabulary via `wmoCodeToCondition` (CLEAR / CLOUDY / FOG / RAIN / SNOW / WIND / STORM)
- **MUST** override condition to `WIND` when `windSpeed >= 40` AND `precipitationProbability < 40` (per `getConditionWithWindOverride`)
- **MUST** classify severity tiers: `precipitationProbability >= 70 || windSpeed >= 70` → `warning`; `>= 40` → `advisory`; else `normal`
- **MUST** wrap Open-Meteo HTTP in `withTimeout(8_000)` + `retryOnce()` from `actions/agent/lib/reliability.ts`
- **MUST** declare `v.object({ lat: v.number(), lng: v.number() })` args validator and a `v.object({...})` returns validator that exactly matches the WeatherSummary shape consumed by iOS + Android clients
- **NEVER** hardcode the Open-Meteo endpoint; expose `OPEN_METEO_ENDPOINT` constant
- **NEVER** use `Math.floor` on temperature — design copy mandates rounded integer (68.4 → 68; 68.5 → 69)
- **STRICTLY** follow the integration test pattern from `places.test.ts` — real Convex test runtime, deterministic Open-Meteo response fixture for the success path

---

## DONE WHEN

- [x] AC-1: `getCurrentWeather({lat,lng})` returns `WeatherSummary` shape with rounded integer Fahrenheit (PRIMARY)
- [x] AC-2: WMO code 0 → `CLEAR`; 95–99 → `STORM`; 71–77 → `SNOW` (mapping coverage)
- [x] AC-3: `windSpeed=45, precipitationProbability=10` → condition override to `WIND`
- [x] AC-4: `precipitationProbability=75` → severity `warning`; `=50` → `advisory`; `=10` → `normal`
- [x] AC-5: Transient HTTP 503 → retried once; second 200 → returns success
- [x] AC-6: Args + returns validators declared and match consumer shape
- [x] `pnpm --dir server test -- weather` passes
- [x] `pnpm type-check:native` clean

---

## ACCEPTANCE CRITERIA

### AC-1: getCurrentWeather returns WeatherSummary [PRIMARY]
- **GIVEN** Open-Meteo returns `temperature_2m: 20.2 (°C), weathercode: 0, precipitation_probability: 5, windspeed_10m: 8`
- **WHEN** `getCurrentWeather({lat: 36.97, lng: -122.03})` invoked
- **THEN** returns `{ temperatureFahrenheit: 68, condition: 'CLEAR', dayOfWeek: '<local>', severity: 'normal' }`
- **VERIFY:** `pnpm --dir server test -- -t 'getCurrentWeather returns WeatherSummary with rounded Fahrenheit'`

### AC-2: WMO code → condition mapping
- **GIVEN** WMO codes `0`, `45`, `61`, `71`, `95` are emitted in turn
- **WHEN** classified via `wmoCodeToCondition`
- **THEN** results are `CLEAR`, `FOG`, `RAIN`, `SNOW`, `STORM` respectively
- **VERIFY:** `pnpm --dir server test -- -t 'wmoCodeToCondition maps WMO codes to LaneShadow vocabulary'`

### AC-3: High wind + low precip overrides condition to WIND
- **GIVEN** `windSpeed=45`, `precipitationProbability=10`, baseline WMO condition `CLOUDY`
- **WHEN** `getConditionWithWindOverride` runs
- **THEN** condition becomes `WIND`
- **VERIFY:** `pnpm --dir server test -- -t 'high wind low precip overrides to WIND'`

### AC-4: Severity tiers from precip + wind
- **GIVEN** `(precipitationProbability=75, windSpeed=20)` then `(40, 20)` then `(10, 5)`
- **WHEN** `getSeverity` runs
- **THEN** severities are `warning`, `advisory`, `normal`
- **VERIFY:** `pnpm --dir server test -- -t 'getSeverity classifies precipitation and wind tiers'`

### AC-5: Retry once on transient HTTP failure
- **GIVEN** Open-Meteo returns 503 then 200
- **WHEN** `getCurrentWeather` invoked
- **THEN** exactly 2 attempts; result is the second response
- **VERIFY:** `pnpm --dir server test -- -t 'getCurrentWeather retries once on transient'`

### AC-6: Validators exact-match consumer shape
- **GIVEN** `actions/weather.ts` source
- **WHEN** `args` and `returns` validators are inspected
- **THEN** args declares `{ lat: v.number(), lng: v.number() }`; returns declares `{ temperatureFahrenheit, condition, dayOfWeek, severity }`
- **VERIFY:** `grep -E "args:|returns:" server/convex/actions/weather.ts`

---

## TEST CRITERIA

| ID    | Statement                                                                          | Maps To | Type        |
|-------|------------------------------------------------------------------------------------|---------|-------------|
| TC-1  | getCurrentWeather returns rounded Fahrenheit `68` from Celsius `20.2`               | AC-1    | happy_path  |
| TC-2  | WMO code 0 → CLEAR; 95 → STORM; 71 → SNOW; 45 → FOG; 61 → RAIN                       | AC-2    | happy_path  |
| TC-3  | `windSpeed=45, precip=10` overrides condition to WIND                               | AC-3    | edge_case   |
| TC-4  | `precip=75` → warning; `=50` → advisory; `=10` → normal                             | AC-4    | edge_case   |
| TC-5  | Open-Meteo 503 then 200 → exactly 2 HTTP attempts                                   | AC-5    | edge_case   |
| TC-6  | Args declares `{lat,lng}`; returns declares full WeatherSummary shape               | AC-6    | happy_path  |

---

## SCOPE

**writeAllowed:**
- `server/convex/actions/weather.ts` (NEW)
- `server/convex/__tests__/weather.test.ts` (NEW)
- `server/convex/errors.ts` (MODIFY — add `WEATHER_PROVIDER_DOWN` if not present)

**writeProhibited:**
- `ios/**`, `android/**`, `react-native/**`, `tokens/**`
- `server/convex/schema.ts`
- `server/convex/auth.config.ts`

---

## BOUNDARIES

✅ **Always:**
- Use `withTimeout(8_000)` + `retryOnce` for Open-Meteo
- Round temperature with `Math.round` (not `floor`/`ceil`)
- Return uppercase condition strings to match `IdleViewModel` consumer expectation

⚠️ **Ask First:**
- Switching weather provider away from Open-Meteo
- Adding hourly/forecast endpoints (out of scope; future ticket)

---

## DELIVERABLE

- `actions/weather.ts` (NEW): `getCurrentWeather` action + `wmoCodeToCondition`, `celsiusToFahrenheit`, `getSeverity`, `getConditionWithWindOverride` helpers
- `__tests__/weather.test.ts` (NEW): coordinate happy-path, WMO mapping, wind override, severity tiers, retry behaviour, validator coverage

---

## AGENT INSTRUCTIONS (TDD per AC)

For each AC: RED → GREEN → REFACTOR. Use the Convex test harness; for HTTP-dependent tests inject a deterministic Open-Meteo fixture via the existing `withTimeout` mockability pattern.

---

## READING LIST

1. `server/convex/actions/weather.ts:1-160` **[PRIMARY PATTERN]** — final implementation; helpers + main action
2. `server/convex/actions/agent/lib/reliability.ts:1-80` — `retryOnce`, `withTimeout`, `markRetryable` recipe
3. `server/convex/actions/places.ts:1-200` — sibling action; same retry/validator pattern
4. `.spec/design/system/views/mapapp/idle/idle-screen.html` — meta row "FRIDAY · 68°F · CLEAR"; advisory card behaviour
5. `.spec/design/system/views/mapapp/idle/README.md` — `wx-rain-tint`, `wx-rain`, advisory pill recipe

---

## EVIDENCE GATES

| Gate | Command | Expected |
|------|---------|----------|
| Convex tests | `pnpm --dir server test -- weather` | Exit 0; weather suite passes |
| Typecheck | `pnpm type-check:native` | Exit 0 |
| Biome lint | `pnpm exec biome check server/convex/actions/weather.ts` | Exit 0 |
| Deploy dry-run | `pnpm --dir server run convex:dev -- --once` | `weather:getCurrentWeather` present in `_generated/api.d.ts` |

---

## OUT OF SCOPE

- Hourly / forecast endpoints
- Persisting weather to a Convex table (idle state recomputes per session)
- Severity → UI mapping (consumed by `IdleViewModel.observeWeather()` in IDLE-S06-IOS-T01 / IDLE-S06-AND-T01)

---

## CONTEXT

**Current state:** Idle state design references show "FRIDAY · 68°F · CLEAR" meta row + advisory card recipe; no Convex action existed to source this data.

**Gap:** Without a typed weather endpoint the iOS + Android `IdleViewModel`s cannot wire real `WeatherSummary` flows — meta row would remain hardcoded.

---

## REVIEW (for convex-reviewer)

**Must pass:**
- WMO mapping table is exhaustive (no fallthrough silently returns CLEAR for unknown codes — actually CLEAR is the explicit fallback; verify intent)
- HTTP wrapped via `retryOnce(withTimeout(...))`
- Returns validator EXACTLY matches the iOS `WeatherSummary` decoder + Android `WeatherSummary` data class
- No mocks of Convex runtime

**Should verify:**
- Temperature rounding boundary (68.4 → 68, 68.5 → 69) explicitly tested
- Severity tier boundaries inclusive at 40 and 70 (per code: `>= 40`, `>= 70`)
- Day-of-week derived from server-side `Date` aware of caller locale (or documented as UTC)

**Verdict:** APPROVED

---

## DESIGN

**References:**
- `.spec/design/system/views/mapapp/idle/idle-screen.html` — meta row spec, advisory pill recipe
- `.spec/design/system/views/mapapp/idle/README.md` — `wx-rain-tint`, `wx-storm`, copper signal token usage

**Pattern:** Validator-first proxy action with HTTP reliability wrapper (`retryOnce(withTimeout(...))`) and pure helper functions for mapping/normalisation that are independently unit-testable.

**Pattern source:** `server/convex/actions/places.ts` (sibling)

**Anti-pattern:** Threading raw Open-Meteo response shape into clients — leaks provider details and breaks portability.

---

## DEPENDENCIES

- **Depends on:** Sprint 03 (Convex foundation, `actions/agent/lib/reliability.ts`)
- **Blocks:** IDLE-S06-IOS-T01, IDLE-S06-AND-T01
- **Parallel:** IDLE-S06-CVX-T01

---

## CODING STANDARDS

- `convex/_generated/ai/guidelines.md` — validator + HTTP patterns
- `RULES.md` §Convex Backend
- `RULES.md` §Verification Standards
- `brain/docs/ANTI-STUB-REVIEW.md`

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"GIVEN Open-Meteo returns 20.2°C/code 0 WHEN getCurrentWeather invoked THEN WeatherSummary with temperatureFahrenheit=68","verify":"pnpm --dir server test -- -t 'getCurrentWeather returns WeatherSummary with rounded Fahrenheit'"},
    {"id":"AC-2","type":"acceptance_criterion","description":"WMO codes map: 0→CLEAR, 45→FOG, 61→RAIN, 71→SNOW, 95→STORM","verify":"pnpm --dir server test -- -t 'wmoCodeToCondition maps WMO codes'"},
    {"id":"AC-3","type":"acceptance_criterion","description":"GIVEN windSpeed=45,precip=10 WHEN classified THEN condition=WIND","verify":"pnpm --dir server test -- -t 'high wind low precip overrides to WIND'"},
    {"id":"AC-4","type":"acceptance_criterion","description":"GIVEN precip=75/40/10 WHEN classified THEN severity=warning/advisory/normal","verify":"pnpm --dir server test -- -t 'getSeverity classifies precipitation and wind tiers'"},
    {"id":"AC-5","type":"acceptance_criterion","description":"GIVEN Open-Meteo 503 then 200 WHEN getCurrentWeather invoked THEN exactly 2 attempts","verify":"pnpm --dir server test -- -t 'getCurrentWeather retries once on transient'"},
    {"id":"AC-6","type":"acceptance_criterion","description":"args validator declares {lat,lng}; returns validator declares full WeatherSummary","verify":"grep -E 'args:|returns:' server/convex/actions/weather.ts"},
    {"id":"TC-1","type":"test_criterion","description":"Returns rounded Fahrenheit 68 from Celsius 20.2","maps_to_ac":"AC-1","verify":"pnpm --dir server test -- -t 'getCurrentWeather returns WeatherSummary'"},
    {"id":"TC-2","type":"test_criterion","description":"All five sample WMO codes map to expected conditions","maps_to_ac":"AC-2","verify":"pnpm --dir server test -- -t 'wmoCodeToCondition maps WMO codes'"},
    {"id":"TC-3","type":"test_criterion","description":"windSpeed=45,precip=10 overrides to WIND","maps_to_ac":"AC-3","verify":"pnpm --dir server test -- -t 'high wind low precip overrides to WIND'"},
    {"id":"TC-4","type":"test_criterion","description":"precip=75/40/10 → warning/advisory/normal","maps_to_ac":"AC-4","verify":"pnpm --dir server test -- -t 'getSeverity classifies precipitation and wind tiers'"},
    {"id":"TC-5","type":"test_criterion","description":"Open-Meteo 503 then 200 produces exactly 2 attempts","maps_to_ac":"AC-5","verify":"pnpm --dir server test -- -t 'getCurrentWeather retries once on transient'"},
    {"id":"TC-6","type":"test_criterion","description":"args + returns validators declared","maps_to_ac":"AC-6","verify":"grep -E 'args:|returns:' server/convex/actions/weather.ts"}
  ]
}
-->
