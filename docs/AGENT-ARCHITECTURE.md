# Agent Architecture

## Working Theory

An agent is an endless composition of while-loops with tools, ideally with a terminal end. Performance is more about **attention** than obedience — agents do best when the task is targeted. Intelligence/reasoning only comes into play as the number of things being juggled increases.

Each agent is defined by three things:

| Property | Description |
|----------|-------------|
| **Role** | The single job this agent exists to do |
| **Terminal Condition** | The specific thing it's solving for — when this is met, the loop exits |
| **Tools** | A discrete, minimal set of resources it can use |

### Design Principles

- **One creative job per loop.** If an agent needs to make two creative decisions, sequence them as two agent calls — let the first complete and narrow the context before the second starts.
- **Narrow the toolbox per agent.** If a routing agent can't access enrichment tools, it literally can't wander into enrichment. It terminates because it runs out of relevant tools, not because it decides to stop.
- **Deterministic wrapping, probabilistic core.** State machines, retry logic, caching, and diffing are code. The LLM makes creative decisions inside those mechanical frames.
- **Bounded interfaces between agents.** Each agent returns a structured result with a small number of cases (route_ready | needs_clarification | failed). The calling agent handles all cases without understanding internals.

### Terminal Conditions

Every agent has three classes of exit:

1. **Correct termination** — the agent's specific condition is met (intent satisfied, route compiled, question answered)
2. **Escalation** — the agent can't resolve alone and returns control with a structured reason (needs_clarification, ambiguous_input)
3. **Safety ceiling** — step budget or timeout (deterministic guardrails, not the intended exit path)

---

## Agent Definitions

### Orchestrator (ReAct Loop)

- **Role**: Understand rider intent and dispatch to the right specialist
- **Terminal Condition**: All rider intents in the current message are satisfied
- **Tools**: `routing_agent`, `enrichment_agent` (available set narrowed by session state)

The orchestrator is a [ReAct loop](https://www.jayminwest.com/agentic-engineering-book/6-patterns/5-react-pattern) — it reasons about what the rider needs and picks the right sub-agent. There is **no rigid phase sequence**. A rider might ask "what's the gravel like right here?" without ever requesting a route — the orchestrator handles this directly via `enrichment_agent`.

A deterministic pre-check removes tools that are structurally impossible (can't enrich a route that doesn't exist), but the LLM decides the order. This is a hybrid of the [orchestrator pattern](https://www.jayminwest.com/agentic-engineering-book/6-patterns/3-orchestrator-pattern) (state-based tool gating, context isolation, capability minimization) and ReAct (adaptive behavior, no predetermined sequence).

The orchestrator never thinks about road segments or weather data. It sees structured status objects from sub-agents (`route_ready | needs_clarification | failed`) and synthesizes them into a conversational response.

### Routing Agent

- **Role**: Suggest map routes based on user queries
- **Terminal Condition**: New or updated route generated (both geocoded and LLM-authored at the high level)
- **Tools**: `geocoding`, `popular_routes_by_region`

Returns one of:
- `{ status: 'route_ready', routePlanId, summary }` — route is on the map
- `{ status: 'needs_clarification', question }` — can't resolve without rider input
- `{ status: 'failed', reason }` — unrecoverable (e.g., no roads found in area)

#### popular_routes_by_region (planned)

Search wrapper (Exa/Jina) weighted on Reddit and motorcycle forums, cached by start/stop region. Gives the routing agent grounded suggestions from real rider knowledge instead of relying solely on LLM training data. Cache key: region bounding box or named area → ranked route list with source attribution.

### Search Agent

- **Role**: Answer general questions using nearby place search, web search, or LLM knowledge
- **Terminal Condition**: The rider's question has a concrete answer (from Places, web, or general knowledge)
- **Tools**: `searchNearby`, `webSearch`, `geocode`

Always available to the orchestrator — doesn't require a route to exist. Handles three categories:
- **Nearby places**: "gas station?", "scenic overlook?", "coffee shop?" → `searchNearby`
- **Current/real-time info**: "is Skyline Blvd closed?", "speed limit on Highway 9?" → `webSearch`
- **General knowledge**: "how many gallons does my bike take?" → direct LLM response, no tool call

Returns one of:
- `{ status: 'answered', data, summary }` — question resolved
- `{ status: 'not_applicable', reason }` — truly unanswerable (rare)

### Enrichment Agent

- **Role**: Answer specific questions about an existing compiled route
- **Terminal Condition**: The rider's question has a concrete data-backed answer about the route
- **Tools**: `getElevation`, `getCurvature`, `searchAlongRoute`, `getRouteWeather`, `checkSurface`, `lookupRoad`, `getUserFavorites`

Only available when a route exists in the session. Distinct from search agent: enrichment tools require route geometry (polylines, bounding boxes from compiled routes).

Returns one of:
- `{ status: 'answered', data, summary }` — question resolved with route data
- `{ status: 'not_applicable', reason }` — no route exists to enrich

### Compilation Agent (deterministic, not LLM-driven)

- **Role**: Turn an LLM-authored route sketch into a compiled, renderable route
- **Terminal Condition**: All segments compiled successfully, or retry budget exhausted
- **Tools**: `compileSketch`, segment cache, retry state machine

This is NOT an LLM agent — it's a deterministic loop that the routing agent invokes as a tool. It handles segment diffing (`findUnchangedSegments`), caching succeeded segments, and retrying only failed segments. The routing agent receives back either a compiled route or a list of failed segments to revise.

---

## Model Selection

[Default to frontier, downgrade only with evidence.](https://www.jayminwest.com/agentic-engineering-book/3-model/1-model-selection)

The orchestrator needs strong reasoning to classify intent, synthesize sub-agent results, and handle ambiguous multi-part requests. Sub-agents have narrower, more bounded tasks — the routing agent's creative job (pick roads) is well-defined, and the enrichment agent is mostly intent → tool dispatch.

| Agent | Model | Rationale |
|-------|-------|-----------|
| **Orchestrator** | Frontier (Sonnet 4.6+) | Intent classification, multi-intent sequencing, result synthesis — needs strong reasoning |
| **Routing** | Haiku 4.5 | One creative job with a tight toolbox. Sketch authoring is well-constrained by the prompt + tool schemas. Start here, escalate to Sonnet if quality degrades. |
| **Search** | Haiku 4.5 | Simple retrieval: nearby places, web search, or general knowledge. 3-tool toolbox. |
| **Enrichment** | Haiku 4.5 | Nearly bounded: classify question type → pick tool → present data. Minimal reasoning required. |
| **Compilation** | None (deterministic) | Code, not LLM |

### Model Selection Strategy

1. **Start with frontier for the orchestrator** — this is the coordination layer; cheap models mis-route work
2. **Start with Haiku for sub-agents** — they have narrow toolboxes and focused prompts that compensate for weaker reasoning
3. **Monitor BudgetTracker logs** — per-agent cost data tells you where spend concentrates
4. **Escalate sub-agent models only with evidence** — if routing agent sketch quality is poor with Haiku, try Sonnet. Don't preemptively upgrade.

The key insight: sub-agents with 4-7 tools and ~30-line prompts are much closer to "retrieval + structured output" than "open-ended reasoning." That's exactly where smaller models excel — the narrow toolbox does the work that the bigger model would otherwise need intelligence for.

### Configuration

Models are configured per-agent in their respective files, not globally. Each agent calls `getModel()` with its own provider/model pair. The env.ts `AI_PROVIDER` / `AI_MODEL` constants serve as the default (currently `anthropic` / `claude-sonnet-4-6`), but each agent can override.

```typescript
// orchestrator.ts — uses default frontier model
const model = getModel(AI_PROVIDER, AI_MODEL)

// routingAgent.ts — can downgrade independently
const model = getModel('anthropic', 'claude-haiku-4-5-20251001')

// enrichmentAgent.ts — can downgrade independently
const model = getModel('anthropic', 'claude-haiku-4-5-20251001')
```

---

## Attention Budget Model

The reason this architecture works better than a single monolithic agent:

| Agent | Model | Attention Load | Why |
|-------|-------|---------------|-----|
| Orchestrator | Frontier | Very low | 3 tool choices, all nearly bounded |
| Routing | Haiku | Medium | One creative job: pick roads and author a sketch |
| Search | Haiku | Low | Classify question → pick one of 3 tools (or answer directly) |
| Enrichment | Haiku | Low | Intent classification → single tool dispatch |
| Compilation | None | Zero (deterministic) | Code, not LLM |

A monolithic agent doing all of these simultaneously has high attention load across every step, even when most of that context is irrelevant to the current decision.

---

## Current State vs Target (Pre-Refactor)

Today, `ridePlanningAgent.ts` is a monolithic agent with all 14 tools in a single ReAct loop. The system prompt tries to enforce phase separation through instructions ("Phase 1: don't use enrichment tools", "Phase 2: only when asked"), but the model holds all guidance in attention simultaneously.

### What's already right

| Pattern | Where | Why it works |
|---------|-------|-------------|
| Generic ReAct loop | `runAgent.ts` | Domain-free, injectable — reusable by any sub-agent |
| Deterministic retry | `PendingSketchState` + `findUnchangedSegments` | Code handles segment caching/diffing, LLM just revises failures |
| Context trimming | `summarizeForContext` | Keeps working set small per step |
| Parallel-safe marking | `parallelSafeTools` Set | Enrichment tools fire concurrently without sequencing overhead |
| Structured tool results | `ToolResult` union type | Bounded return cases — `routes`, `error`, `confirmation`, `chat` |
| Loop detection | `LoopDetector` | Catches identical-signature loops (not intent loops) |
| Budget ceiling | `BudgetTracker` | Hard spend cap per session |

### What the refactor changes

| Current (monolithic) | Target (hierarchical) |
|---------------------|----------------------|
| 14 tools in one toolbox | Main agent: 2-3 tools (sub-agents). Routing: 2-3 tools. Enrichment: 5 tools. |
| System prompt has Phase 1 + Phase 2 + error handling + presentation rules (~60 lines) | Each agent gets only its phase-relevant prompt |
| LLM decides "am I discovering or enriching?" on every step | Main agent classifies intent once, dispatches to the right sub-agent |
| `compileSketch` retry state lives in module-level `Map` | Compilation stays deterministic but becomes an explicit tool the routing agent calls |
| Sequential multi-intent ("ride + weather") requires the LLM to self-sequence | Main agent naturally sequences: routing_agent → enrichment_agent |

### Attention cost comparison

| Scenario | Current (14 tools, one prompt) | Target (hierarchical) |
|----------|-------------------------------|----------------------|
| "Scenic ride to Santa Cruz" | LLM evaluates all 14 tools, reads all prompt sections | Main → Routing agent (2 tools, routing-only prompt) |
| "Is it twisty?" | LLM evaluates all 14 tools to find getCurvature | Main → Enrichment agent (5 tools, enrichment-only prompt) |
| "Ride to SC and check weather" | LLM must self-sequence across phases in one loop | Main sequences two sub-agent calls |
| Compilation retry (segment 2 failed) | LLM re-reads retry guidance in system prompt | Deterministic code retries, returns structured failure to routing agent |

### Things to preserve during refactor

1. **`runAgent.ts` stays untouched** — it's already the generic loop both sub-agents will use
2. **`ExecuteContext` callbacks stay** — card emission, streaming, tool lifecycle are UI concerns, not agent concerns
3. **`extractRouteAttachments` stays** — deterministic post-processing of tool results
4. **`summarizeForContext` stays** — each sub-agent can use it independently
5. **Tool handler functions (`runGeocode`, `runGetElevation`, etc.) stay** — they're pure domain logic, just get wired to different agents

### Dynamic prompt narrowing

The main agent can build sub-agent prompts deterministically based on session state:

```
hasRoutes = routeBlock is non-empty
hasPendingSketch = PendingSketchState exists
userIntent = main agent's classification

if !hasRoutes && !hasPendingSketch → routing agent prompt (discovery mode)
if hasPendingSketch with failures → routing agent prompt (retry mode)  
if hasRoutes && intent is question → enrichment agent prompt
```

These signals are all **bounded** — you could write a test for every case. The LLM never decides which mode it's in; the code does.
