## Revision 1 - 2026-04-06

### Reviewer: convex-reviewer

### Issues Found

1. **[CRITICAL] convex/actions/agent/tools/getRouteWeather.ts:40-116 — NEVER constraint violated: Duplicated weather API integration**
   - `toUtcDateString` (line 40) is a verbatim copy from `convex/actions/agent/providers/weatherProvider.ts`
   - `pickNearestHourIndex` (line 48) is a verbatim copy from `convex/actions/agent/providers/weatherProvider.ts`
   - `fetchWeatherForPoint` (line 81) duplicates the entire Open-Meteo HTTP call pattern instead of using `WeatherProvider.getWindAtPoints`
   - The existing `WeatherProvider` includes: 8-second timeout via `withTimeout`, retry-once via `retryOnce`, concurrency limiting via `createConcurrencyLimiter` — all omitted in new implementation
   - Task spec states NEVER: "Duplicate weather API integration — reuse existing weather fetching from probeConditions.ts / mapConditions.ts"

2. **[IMPROVEMENT] convex/actions/agent/tools/__tests__/getRouteWeather.test.ts:64 — Tautological assertion**
   - `expect(result.segments).toHaveLength(result.segments.length)` always passes (asserts array is its own length)
   - Should be `expect(result.segments).toHaveLength(5)` for a 5-point polyline, or a concrete value based on sampling
   - This is test theatre — the assertion adds zero verification value

### What Implementation Tried
New file `getRouteWeather.ts` created from scratch with its own Open-Meteo fetch implementation.
Tests pass, all 4 ACs verified at behavior level. TypeScript clean. Lint clean.

### Why It Failed
The design ignores the existing `WeatherProvider` abstraction. The task spec has an explicit NEVER
constraint against duplicating weather API integration. The new implementation is also inferior to
the existing provider (no timeout, no retry, no concurrency limiter), meaning production
reliability regresses compared to what was available for free via `createWeatherProvider()`.

### Suggested Different Approach
1. In `getRouteWeather.ts`, accept a `weatherProvider: WeatherProvider` parameter (injectable, same as `probeConditions.ts`).
2. Convert the `LatLng[]` polyline to the `RouteIndexPoint[]` format the provider expects (add `distanceFromStartMeters: 0` or compute real distances).
3. Call `weatherProvider.getWindAtPoints({ points: sampledPoints, departureTimeMs })` to get wind data.
4. For temperature, rain probability, and visibility (fog), you will need to EXTEND the `WeatherProvider` interface (new fields: `temperature_2m`, `precipitation_probability`, `visibility`) and update `weatherProvider.ts:fetchWindForPoint` to also fetch and return those fields — rename it `fetchWeatherForPoint` in the provider, update `WindSample` to `WeatherSample`.
5. Alternatively, if extending the provider interface is out of scope for this task, discuss with the tech lead whether a `fetchWeatherForPoint` helper can be extracted into a shared internal lib that both `weatherProvider.ts` and `getRouteWeather.ts` import.
6. Fix the tautological test assertion at line 64.

### Files to Focus On
- `convex/actions/agent/tools/getRouteWeather.ts` — remove duplicated fetch logic, delegate to provider
- `convex/actions/agent/providers/weatherProvider.ts` — extend `WindSample` → `WeatherSample` with temp/rain/visibility fields (if chosen path)
- `convex/actions/agent/tools/__tests__/getRouteWeather.test.ts:64` — fix tautological assertion

---
