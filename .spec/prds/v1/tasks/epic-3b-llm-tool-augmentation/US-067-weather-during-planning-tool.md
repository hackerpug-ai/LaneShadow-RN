# US-067: Weather-During-Planning Tool

> Task ID: US-067
> Type: FEATURE
> Priority: P2
> Estimate: 75 minutes
> Assignee: backend-engineer

## CRITICAL CONSTRAINTS

### MUST
- Create agent tool `getRouteWeather` that returns weather conditions along a route for a given departure time
- Sample weather at 3-5 points along the route (start, 1/3, 2/3, end, plus any elevation peaks)
- Return: temperature range, wind speed, rain probability, fog risk, and a per-segment conditions summary

### NEVER
- Duplicate weather API integration — reuse existing weather fetching from `probeConditions.ts` / `mapConditions.ts`
- Block route authoring on weather failure — weather is advisory, not blocking
- Return only current conditions — always use forecast data for the rider's planned departure time

### STRICTLY
- Reuse the existing weather provider pattern from `probeConditions.ts`
- Weather sampling points: minimum 3 (start, midpoint, end), maximum 5
- Include a `routeWeatherSummary` string the LLM can relay directly to the rider

## SPECIFICATION

**Objective:** Give the LLM access to weather data DURING route planning so it can make weather-informed route decisions ("routing you inland because Highway 1 has fog this morning").

**Success looks like:** LLM calls `getRouteWeather([{lat, lng}, ...], departureTime)` and gets back `{ summary: "Clear inland, fog on coast until 11am", segments: [{point: "start", temp: 62, rainProb: 0}, {point: "coast", temp: 55, fog: true, rainProb: 20}] }`.

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | A route with 5 sample points and a departure time 3 hours from now | `getRouteWeather` is called | Returns weather data for each sample point with temperature, wind, and rain probability | `npx vitest run convex/actions/agent/tools/__tests__/getRouteWeather.test.ts -t "basic weather"` |
| 2 | A route where one segment crosses a coastal area known for fog | `getRouteWeather` is called | Returns `fog: true` for the coastal sample point | `npx vitest run convex/actions/agent/tools/__tests__/getRouteWeather.test.ts -t "fog detection"` |
| 3 | Weather API is unreachable | `getRouteWeather` is called | Returns `{ status: 'unavailable' }` without throwing | `npx vitest run convex/actions/agent/tools/__tests__/getRouteWeather.test.ts -t "api failure"` |
| 4 | A route polyline with 50 points | `getRouteWeather` is called | Samples down to 3-5 representative points before querying weather API | `npx vitest run convex/actions/agent/tools/__tests__/getRouteWeather.test.ts -t "sampling"` |

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | getRouteWeather returns temperature, wind, and rain data for each sample point | AC-1 | `npx vitest run convex/actions/agent/tools/__tests__/getRouteWeather.test.ts -t "basic weather"` | [ ] TRUE [ ] FALSE |
| 2 | getRouteWeather detects fog conditions at coastal sample points | AC-2 | `npx vitest run convex/actions/agent/tools/__tests__/getRouteWeather.test.ts -t "fog detection"` | [ ] TRUE [ ] FALSE |
| 3 | getRouteWeather returns unavailable status without throwing on API failure | AC-3 | `npx vitest run convex/actions/agent/tools/__tests__/getRouteWeather.test.ts -t "api failure"` | [ ] TRUE [ ] FALSE |
| 4 | getRouteWeather samples polyline to 3-5 points before weather API call | AC-4 | `npx vitest run convex/actions/agent/tools/__tests__/getRouteWeather.test.ts -t "sampling"` | [ ] TRUE [ ] FALSE |

## GUARDRAILS

### WRITE-ALLOWED
- `convex/actions/agent/tools/getRouteWeather.ts` (NEW)
- `convex/actions/agent/tools/__tests__/getRouteWeather.test.ts` (NEW)
- `convex/actions/agent/lib/piTools.ts` (MODIFY) — add `getRouteWeather` schema

### WRITE-PROHIBITED
- `convex/actions/agent/tools/probeConditions.ts` — reuse patterns, don't modify
- `convex/actions/agent/tools/mapConditions.ts` — reuse patterns, don't modify

## DESIGN

### References
- Research: holocron §5 (Real-Time Conditions)
- Existing: `convex/actions/agent/tools/probeConditions.ts` — weather API pattern
- Existing: `convex/actions/agent/tools/mapConditions.ts` — conditions mapping

### Interaction Notes
- Called DURING route authoring, before or after sketch creation
- Enables the LLM to preemptively avoid weather-affected segments
- The `routeWeatherSummary` string is designed for the LLM to quote directly in chat

### Anti-pattern (DO NOT)
Do NOT call weather API for each point in the polyline — sample to 3-5 points. Weather doesn't change meaningfully over 500m intervals.

## CODING STANDARDS

- **`convex/_generated/ai/guidelines.md`**: Convex patterns
- **`brain/docs/TDD-METHODOLOGY.md`**: RED-GREEN-REFACTOR

## DEPENDENCIES

- Depends on: Epic 3 (route polylines)
- Bridges to: Epic 5 (Weather Completion — this tool is the planning-phase complement)

## REQUIRED READING

1. `convex/actions/agent/tools/probeConditions.ts` — existing weather API integration
2. `convex/actions/agent/tools/mapConditions.ts` — conditions scoring patterns

## NOTES

- This tool bridges Epic 3b (planning tools) and Epic 5 (weather completion). The WX group's weather overlays show weather AFTER planning; this tool makes weather available DURING planning.
- For V1, the "fog detection" can be approximated by visibility < 1km in the weather API response.
