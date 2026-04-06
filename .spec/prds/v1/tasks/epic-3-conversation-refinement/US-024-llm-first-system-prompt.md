# US-024: LLM-First System Prompt Rewrite

> Task ID: US-024
> Type: FEATURE
> Priority: P0
> Estimate: 60 minutes
> Assignee: backend-engineer

## CRITICAL CONSTRAINTS

### MUST
- Rewrite `buildSystemPrompt()` so the LLM defaults to authoring a route sketch for ALL requests, including generic ones ("scenic ride to Santa Cruz")
- Include explicit guidance for the LLM to pick specific roads based on its knowledge of road networks
- Preserve `planRoute` as an explicit fallback the LLM can choose when it's unsure about roads in an area

### NEVER
- Remove planRoute tool from the agent's tool set — it must remain available as a fallback
- Hard-code specific road suggestions in the prompt — the LLM should draw on its own knowledge
- Change the tool schemas or function signatures — this task is prompt-only

### STRICTLY
- The system prompt must instruct: "For ANY route request, author a sketch with named roads first. Only use planRoute if you're genuinely uncertain about the road network in that area."
- Include "avoid X" guidance: "When the rider says 'avoid Market Street,' route around it in your sketch — no need for avoidRoads API"
- Include self-assessment guidance: "If you're unsure about roads in this area, say so and fall back to planRoute"

## SPECIFICATION

**Objective:** Make the LLM the primary route navigator that proactively picks roads for every request, rather than only transcribing rider-specified roads.

**Success looks like:** When a rider says "scenic 2-hour ride to Santa Cruz," the LLM produces a route sketch with specific named roads (e.g., "Take 280 south to 92, Skyline Blvd to Alice's, drop down 84 to 1") rather than delegating to the deterministic orchestrator.

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | Generic request "scenic ride from SF to Santa Cruz" | LLM processes the request | LLM calls `createRouteSketch` with named roads in segments (not `planRoute`) | `npx vitest run convex/actions/agent/ridePlanningAgent.test.ts` |
| 2 | Request with avoidance "ride to Santa Cruz, avoid Highway 1" | LLM processes the request | LLM authors sketch that routes around Highway 1 using alternative roads, without needing avoidRoads API parameter | `npx vitest run convex/actions/agent/ridePlanningAgent.test.ts` |
| 3 | Request for unknown area "scenic ride through rural Montana backroads" | LLM processes the request | LLM acknowledges uncertainty and falls back to `planRoute` with appropriate message to rider | `npx vitest run convex/actions/agent/ridePlanningAgent.test.ts` |
| 4 | System prompt output from `buildSystemPrompt()` | Prompt is inspected | Contains "The Californians" pattern guidance: always-sketch-first, pick specific roads, self-assess confidence, planRoute as fallback | `npx vitest run convex/actions/agent/ridePlanningAgent.test.ts` |

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | buildSystemPrompt output contains instruction to author route sketch for all requests | AC-1, AC-4 | `npx vitest run convex/actions/agent/ridePlanningAgent.test.ts -t "llm-first prompt"` | [ ] TRUE [ ] FALSE |
| 2 | buildSystemPrompt output contains avoidance-via-sketch guidance (no avoidRoads API) | AC-2, AC-4 | `npx vitest run convex/actions/agent/ridePlanningAgent.test.ts -t "avoid guidance"` | [ ] TRUE [ ] FALSE |
| 3 | buildSystemPrompt output contains fallback-to-planRoute guidance for uncertain areas | AC-3, AC-4 | `npx vitest run convex/actions/agent/ridePlanningAgent.test.ts -t "fallback guidance"` | [ ] TRUE [ ] FALSE |
| 4 | buildSystemPrompt output preserves planRoute as available tool | AC-3 | `npx vitest run convex/actions/agent/ridePlanningAgent.test.ts -t "planRoute available"` | [ ] TRUE [ ] FALSE |

## GUARDRAILS

### WRITE-ALLOWED
- `convex/actions/agent/ridePlanningAgent.ts` (MODIFY) — rewrite `buildSystemPrompt()` function body
- `convex/actions/agent/ridePlanningAgent.test.ts` (MODIFY or NEW) — add prompt content assertions

### WRITE-PROHIBITED
- `convex/actions/agent/lib/piTools.ts` — tool schemas unchanged in this task
- `convex/actions/agent/tools/compileSketch.ts` — compilation logic unchanged
- `convex/actions/agent/lib/planRideOrchestrator.ts` — deterministic path unchanged

## DESIGN

### References
- PRD: `.spec/prds/v1/tasks/epic-3-conversation-refinement/llm-first-routing-architecture.md` §1 (LLM-First System Prompt)
- Existing: `convex/actions/agent/ridePlanningAgent.ts:122-195` — current `buildSystemPrompt()`

### Interaction Notes
- Current prompt (lines 149-194) documents two modes with examples — this rewrite inverts the priority
- The prompt should include 2-3 concrete examples of the LLM picking roads for generic requests
- The "Californians" metaphor can be used directly: "You have encyclopedic knowledge of road networks and strong opinions about the best routes"
- Include guidance on `viaNames` usage: "Include intermediate landmarks along roads to pin the route — e.g., 'Skeggs Point on Skyline Blvd'"

### Code Pattern
Source: `convex/actions/agent/ridePlanningAgent.ts:122-195`

```typescript
// Current structure (simplified):
function buildSystemPrompt(ctx: AgentContext): string {
  // ... location context ...
  return `You are a motorcycle route planning assistant...
    
    Mode 1: createRouteSketch — when rider specifies roads
    Mode 2: planRoute — for generic requests
  `
}

// Target structure:
function buildSystemPrompt(ctx: AgentContext): string {
  // ... location context ...
  return `You are an expert motorcycle navigator who knows road networks intimately.
    
    FOR EVERY ROUTE REQUEST:
    1. Author a route sketch with specific named roads (createRouteSketch)
    2. Include viaNames with intermediate landmarks to pin the route
    3. Only fall back to planRoute if genuinely uncertain about the area
    
    EXAMPLES:
    - "scenic ride to Santa Cruz" → sketch: "280 south to 92, Skyline Blvd via Skeggs Point..."
    - "avoid Highway 1" → route around it in your sketch, no API flag needed
    - "ride through rural Montana" → acknowledge uncertainty, use planRoute
  `
}
```

### Anti-pattern (DO NOT)
Do NOT remove the planRoute tool description from the prompt. The LLM needs to know planRoute exists as a fallback. The change is in the priority/default, not removal.

## CODING STANDARDS

- **`convex/_generated/ai/guidelines.md`**: Convex patterns
- **`brain/docs/TDD-METHODOLOGY.md`**: RED-GREEN-REFACTOR cycle

## DEPENDENCIES

No task dependencies. Can start in parallel with US-021/US-022.

Blocks:
- US-025 (retry loop depends on LLM producing sketches to retry)

## REQUIRED READING

1. `convex/actions/agent/ridePlanningAgent.ts`
   - Lines: 122-195 (buildSystemPrompt)
   - Focus: Current prompt structure, mode descriptions, examples

2. `convex/actions/agent/lib/piTools.ts`
   - Lines: 21-54 (createRouteSketch schema)
   - Focus: What fields the LLM needs to populate in a sketch

3. `models/route-sketch.ts`
   - Lines: 6-11 (RouteSketchSegment), 14-20 (RouteSketchAnchorPoint)
   - Focus: The segment/anchorPoint fields the LLM must author

## NOTES

- This is a prompt engineering task. The tests verify prompt content, not LLM behavior — integration testing of actual LLM responses is out of scope.
- The "Californians" metaphor is a useful framing for the prompt itself — the LLM should act like someone who has strong opinions about which roads to take.
- Consider including a brief note about segment retry: "If some roads don't work out, I'll tell you which ones failed and you can revise just those."
