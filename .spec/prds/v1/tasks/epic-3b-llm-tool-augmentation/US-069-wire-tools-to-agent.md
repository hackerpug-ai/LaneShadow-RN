# US-069: Wire Tools to Agent + Update System Prompt

> Task ID: US-069
> Type: FEATURE
> Priority: P0
> Estimate: 90 minutes
> Assignee: backend-engineer

## CRITICAL CONSTRAINTS

### MUST
- Register all new tools (lookupRoad, getCurvature, checkSurface, getElevation, searchAlongRoute, getRouteWeather, getUserFavorites) in the agent's tool registry
- Update the system prompt in `ridePlanningAgent.ts` to instruct the LLM on WHEN and HOW to use each tool
- Add a "pre-sketch grounding" phase to the prompt: lookup roads → check surface → get curvature → THEN author sketch

### NEVER
- Make ALL tools mandatory for every route — the LLM should use tools based on context (e.g., skip curvature for "fastest route to airport")
- Change the existing tool schemas (geocode, createRouteSketch, compileSketch) — only ADD new ones
- Remove the deterministic orchestrator fallback — it remains for cases where the LLM is uncertain

### STRICTLY
- Tools are registered in `runAgent.ts` alongside existing tools
- System prompt updates go in `buildSystemPrompt()` in `ridePlanningAgent.ts`
- Tool usage order in prompt: grounding (lookupRoad, checkSurface) → scoring (getCurvature) → sketch (createRouteSketch) → validation (compileSegments) → enrichment (getElevation, searchAlongRoute, getRouteWeather)

## SPECIFICATION

**Objective:** Connect all new tools to the LLM agent and update the system prompt so the LLM knows when to use each tool, creating a tool-augmented navigator that grounds its recommendations in real data.

**Success looks like:** The LLM receives a request like "scenic 2-hour ride from San Jose," then: (1) looks up candidate roads via `lookupRoad`, (2) checks surface is paved via `checkSurface`, (3) scores curvature via `getCurvature`, (4) authors a sketch with verified roads and curvature rationale, (5) compiles per-segment, (6) enriches with elevation and weather.

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | All 7 new tools implemented and registered | Agent is initialized via `runAgent()` | All tools appear in the agent's available tool list | `npx vitest run convex/actions/agent/__tests__/ridePlanningAgent.test.ts -t "tool registration"` |
| 2 | System prompt includes tool usage instructions | Agent receives a scenic route request | LLM calls `lookupRoad` before authoring a route sketch (observable in agent trace) | `npx vitest run convex/actions/agent/__tests__/ridePlanningAgent.test.ts -t "grounding before sketch"` |
| 3 | LLM is instructed to include curvature data in route rationale | Agent generates a route for "twisty mountain roads" | Route rationale includes curvature scores from `getCurvature` results | `npx vitest run convex/actions/agent/__tests__/ridePlanningAgent.test.ts -t "curvature in rationale"` |
| 4 | LLM is instructed to skip grounding tools when not relevant | Agent receives "fastest route to SFO airport" | LLM skips curvature/surface checks and goes straight to sketch | `npx vitest run convex/actions/agent/__tests__/ridePlanningAgent.test.ts -t "skip grounding"` |
| 5 | Post-compilation enrichment tools are available | Agent compiles a route successfully | LLM calls `getElevation` and/or `getRouteWeather` after compilation | `npx vitest run convex/actions/agent/__tests__/ridePlanningAgent.test.ts -t "post-compile enrichment"` |

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | All 7 new tools are present in agent tool registry after initialization | AC-1 | `npx vitest run convex/actions/agent/__tests__/ridePlanningAgent.test.ts -t "tool registration"` | [ ] TRUE [ ] FALSE |
| 2 | LLM calls lookupRoad before createRouteSketch for scenic route requests | AC-2 | `npx vitest run convex/actions/agent/__tests__/ridePlanningAgent.test.ts -t "grounding before sketch"` | [ ] TRUE [ ] FALSE |
| 3 | Route rationale text includes curvature score data when getCurvature was called | AC-3 | `npx vitest run convex/actions/agent/__tests__/ridePlanningAgent.test.ts -t "curvature in rationale"` | [ ] TRUE [ ] FALSE |
| 4 | LLM does not call getCurvature or checkSurface for non-scenic route requests | AC-4 | `npx vitest run convex/actions/agent/__tests__/ridePlanningAgent.test.ts -t "skip grounding"` | [ ] TRUE [ ] FALSE |
| 5 | LLM calls getElevation or getRouteWeather after successful route compilation | AC-5 | `npx vitest run convex/actions/agent/__tests__/ridePlanningAgent.test.ts -t "post-compile enrichment"` | [ ] TRUE [ ] FALSE |

## GUARDRAILS

### WRITE-ALLOWED
- `convex/actions/agent/ridePlanningAgent.ts` (MODIFY) — system prompt updates
- `convex/actions/agent/runAgent.ts` (MODIFY) — tool registration
- `convex/actions/agent/__tests__/ridePlanningAgent.test.ts` (MODIFY) — new tests

### WRITE-PROHIBITED
- Individual tool files (US-062 through US-068) — only import them, don't modify
- `convex/actions/agent/lib/piTools.ts` — schemas already added in prior tasks
- `models/route-sketch.ts` — no schema changes

## DESIGN

### References
- Research: holocron §Architecture Pattern section — tool-augmented LLM agent workflow
- PRD: "The Californians Pattern" — `.spec/prds/v1/tasks/epic-3-conversation-refinement/llm-first-routing-architecture.md`
- Existing: `convex/actions/agent/ridePlanningAgent.ts` — `buildSystemPrompt()` location

### Interaction Notes
- System prompt should define a clear WORKFLOW the LLM follows:
  1. **Understand intent** — what does the rider want?
  2. **Ground in data** — lookupRoad, checkSurface, getCurvature for candidate roads
  3. **Author sketch** — createRouteSketch with verified roads and curvature rationale
  4. **Validate** — compileSegments per-segment
  5. **Enrich** — getElevation, getRouteWeather, searchAlongRoute
  6. **Present** — describe with personality, reference data ("Skyline Blvd — curvature 2400, very twisty")
- Tools are OPTIONAL per step — the LLM decides based on request type

### Code Pattern
Source: `convex/actions/agent/ridePlanningAgent.ts` — buildSystemPrompt()

```typescript
// Add to system prompt:
`
## Available Tools — When to Use

### Pre-Sketch Grounding (use for scenic/twisty/exploratory requests)
- **lookupRoad**: Verify a road exists in the region before including it in your sketch
- **checkSurface**: Confirm a road is paved before recommending to street bikes
- **getCurvature**: Score a road's twistiness — use to pick "the fun road"
- **getUserFavorites**: Check if the rider has favorite roads in this region

### Post-Compilation Enrichment (use after successful compileSegments)
- **getElevation**: Get elevation profile — describe climbs and passes
- **searchAlongRoute**: Find gas stations, restaurants, scenic stops along the route
- **getRouteWeather**: Check weather along the route for the planned departure time

### When to Skip Grounding
Skip lookupRoad/getCurvature/checkSurface for:
- Direct A-to-B requests ("fastest route to SFO")
- Requests naming specific roads ("take Highway 101 to...")  
- Re-compilations during retry loops (roads already verified)
`
```

### Anti-pattern (DO NOT)
Do NOT make the system prompt force the LLM to call every tool every time. The prompt should describe when each tool is USEFUL, letting the LLM decide based on context. Forcing all tools adds 5-10s latency for simple requests.

## CODING STANDARDS

- **`convex/_generated/ai/guidelines.md`**: Convex patterns
- **`brain/docs/TDD-METHODOLOGY.md`**: RED-GREEN-REFACTOR

## DEPENDENCIES

- Depends on: US-062 (lookupRoad), US-063 (getCurvature), US-064 (checkSurface) — P0 tools must exist first
- Soft depends on: US-065, US-066, US-067, US-068 — P1/P2 tools can be wired incrementally

## REQUIRED READING

1. `convex/actions/agent/ridePlanningAgent.ts`
   - Lines: ALL
   - Focus: `buildSystemPrompt()`, tool registration, agent initialization

2. `convex/actions/agent/runAgent.ts`
   - Lines: ALL
   - Focus: How existing tools are registered and made available to the agent

3. `.spec/prds/v1/tasks/epic-3-conversation-refinement/llm-first-routing-architecture.md`
   - Focus: The Californians Pattern architecture, tool workflow

## NOTES

- This is the integration task that ties everything together. It's the last task in the critical path.
- The system prompt changes are the most impactful part — they determine whether the LLM actually USES the tools effectively.
- Consider A/B testing: run a small set of route requests with tools enabled vs disabled to measure quality improvement.
- The prompt should encourage the LLM to cite tool data in its responses: "I picked Skyline Blvd (curvature: 2400, paved) over Page Mill (curvature: 800)" — this builds rider trust.
