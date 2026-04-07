# Epic 3c: Agent Orchestrator Refactor

> Epic Sequence: 3c (after 3b)
> PRD: .spec/prds/v1/
> Tasks: 8
> Status: DRAFT
> Depends on: Epic 3b (all tools wired to monolithic agent)
> Architecture: docs/AGENT-ARCHITECTURE.md

## Overview

Decompose the monolithic `ridePlanningAgent.ts` (1205 lines, 14 tools, one ReAct loop) into a hierarchical orchestrator pattern. The current agent holds all Phase 1 (routing) and Phase 2 (enrichment) guidance in attention simultaneously, degrading performance. The refactor splits it into an **orchestrator** that classifies intent and dispatches to focused sub-agents, each with a narrow toolbox and targeted prompt.

### Why Now

This refactor sits between Epic 3b (all tools wired) and Epic 4+ (session management, weather, saved routes). Adding more tools to the monolith will compound the attention problem. Restructuring now means future features plug into the right sub-agent instead of bloating a single prompt.

### Working Theory

Agent performance is about **attention, not obedience**. Intelligence/reasoning only comes into play as the number of things being juggled increases. Each agent should have:

| Property | Description |
|----------|-------------|
| **Role** | The single job this agent exists to do |
| **Terminal Condition** | The specific thing it's solving for — when this is met, the loop exits |
| **Tools** | A discrete, minimal set of resources it can use |

See `docs/AGENT-ARCHITECTURE.md` for the full theory and `convex/actions/agent/CLAUDE.md` for the One Agent, One Task principle.

## Target Architecture

```
sendMessage.ts (unchanged entry point)
  └─ executeOrchestrator()                    ← ReAct loop with 3 tools
       ├─ Deterministic pre-check: remove tools that CAN'T help given state
       ├─ LLM reasons about rider intent, picks the right sub-agent (or responds directly)
       │
       ├─ routing_agent tool → executeRoutingAgent()
       │    ├─ tools: [geocode, createRouteSketch, compileSketch, planRoute]
       │    ├─ prompt: route creation only (~30 lines)
       │    ├─ model: Haiku 4.5
       │    ├─ owns: PendingSketchState, segment retry logic
       │    └─ returns: route_ready | needs_clarification | failed
       │
       ├─ search_agent tool → executeSearchAgent()
       │    ├─ tools: [searchNearby, webSearch, geocode]
       │    ├─ prompt: answer questions using location search, web search, or general knowledge (~15 lines)
       │    ├─ model: Haiku 4.5
       │    └─ returns: answered | not_applicable
       │
       └─ enrichment_agent tool → executeEnrichmentAgent()
            ├─ tools: [getElevation, getCurvature, searchAlongRoute, getRouteWeather,
            │          checkSurface, lookupRoad, getUserFavorites]
            ├─ prompt: route-specific analysis only (~15 lines)
            ├─ model: Haiku 4.5
            └─ returns: answered | not_applicable
```

### Orchestrator as ReAct Loop

The orchestrator IS a ReAct loop — it reasons about what the rider needs and picks the right sub-agent. There is no rigid phase sequence. A rider might ask "is there a gas station nearby?" without ever requesting a route. The orchestrator handles this directly via `search_agent` — no routing step needed.

**Three sub-agents for three user intents:**

| Intent | Sub-Agent | Example |
|--------|-----------|---------|
| Create/modify a route | `routing_agent` | "scenic ride to Santa Cruz" |
| General question (location or knowledge) | `search_agent` | "gas station near me?", "scenic viewpoints around here?", "how many gallons does my bike take?" |
| Question about an existing route | `enrichment_agent` | "is this route twisty?", "where can I get lunch 2 hours in?", "what's the weather?" |

**Deterministic state only removes impossible tools**, it doesn't dictate the sequence:
- `search_agent` is **always available** — it only needs rider location (or nothing for general knowledge questions)
- `enrichment_agent` is removed if no routes exist (can't enrich what doesn't exist)
- If a pending sketch has failures, only `routing_agent` is available (must resolve before anything else)
- Otherwise, all tools are available and the LLM decides based on rider intent

This is the hybrid of [orchestrator pattern](https://www.jayminwest.com/agentic-engineering-book/6-patterns/3-orchestrator-pattern) (state-based tool gating, context isolation, capability minimization) and [ReAct pattern](https://www.jayminwest.com/agentic-engineering-book/6-patterns/5-react-pattern) (LLM reasons about observations to pick actions, adaptive behavior, no predetermined sequence).

**Key properties preserved from both patterns:**
1. **Context isolation** (orchestrator) — each sub-agent gets a fresh context with only its relevant tools and prompt. The orchestrator never sees raw tool results (geometry, polylines); it sees structured status objects.
2. **Capability minimization** (orchestrator) — sub-agents can't wander into each other's domains. The routing agent literally cannot call enrichment tools.
3. **Adaptive behavior** (ReAct) — the orchestrator adjusts based on what sub-agents return. No fixed phase order.
4. **Bounded interfaces** (orchestrator) — sub-agents return one of 2-3 structured cases. The orchestrator handles all cases without understanding internals.

### Model Selection

[Default to frontier, downgrade only with evidence.](https://www.jayminwest.com/agentic-engineering-book/3-model/1-model-selection)

| Agent | Model | Rationale |
|-------|-------|-----------|
| **Orchestrator** | Frontier (Sonnet 4.6) | Intent classification, multi-intent sequencing, result synthesis — needs strong reasoning |
| **Routing Agent** | Haiku 4.5 | One creative job (pick roads + sketch) with a 4-tool toolbox. Narrow prompt compensates for weaker reasoning. Escalate to Sonnet if sketch quality degrades. |
| **Search Agent** | Haiku 4.5 | Simple retrieval: nearby places, web search, or general knowledge. 3-tool toolbox. |
| **Enrichment Agent** | Haiku 4.5 | Nearly bounded: classify question → pick tool → present data. Minimal reasoning. |
| **Compilation** | None | Deterministic code |

Models are configured per-agent, not globally. Each agent calls `getModel()` with its own provider/model. The `env.ts` `AI_MODEL` constant (`claude-sonnet-4-6`) serves as the orchestrator's default. Sub-agents override to Haiku independently.

The BudgetTracker logs (see below) will show per-agent cost breakdowns — this is how we validate whether Haiku is sufficient or needs escalation.

### BudgetTracker: Gate → Logger (Reversible)

The current `BudgetTracker` throws `ConvexError(AGENT_BUDGET_EXCEEDED)` when the $0.25 limit is hit. We don't yet know what each optimal step costs in the new multi-agent architecture, so:

- **Transform to logging mode**: Track and log cumulative spend per sub-agent invocation, but do NOT throw
- **Preserve the gate interface**: Keep `limitUSD`, `add()`, `getCumulative()`, `getRemainingBudget()` API identical
- **Add mode toggle**: `BudgetTracker(0.25, { mode: 'log' | 'gate' })` — defaults to `'log'` during this epic, revertable to `'gate'` via constructor arg when we have cost data
- **Add per-agent breakdown**: Log which agent (orchestrator / routing / enrichment) incurred each cost so we can tune limits per agent later

## Human Test Steps

1. "scenic ride to Santa Cruz" → route appears on map (routing agent)
2. "is it twisty?" → curvature answer (enrichment agent)
3. "is there a gas station nearby?" (no route) → nearby results (search agent)
4. "is Skyline Blvd closed today?" → web search result (search agent)
5. "how many gallons does my bike take?" → general knowledge answer (search agent, no tool call)
6. "ride to SC and check weather" → route first, then weather (orchestrator sequences routing → enrichment)
7. "hello" → direct response (no sub-agent invoked)
8. Check Convex logs: each agent only calls its own tools, budget logged per-agent

## Reusable Modules

### Existing modules (unchanged, reused across agents)

| Module | Used by | Purpose |
|--------|---------|---------|
| `runAgent.ts` | All 4 agents | Generic ReAct loop — domain-free, injectable |
| `lib/reliability.ts` | Tool internals | `withTimeout`, `retryOnce`, `createConcurrencyLimiter` |
| `lib/tracing.ts` | All tools | `traceableToolAsync` decorator for observability |
| `lib/summarizeForContext.ts` | Routing + enrichment agents | Trims geometry before LLM context |
| `providers/geocodingProvider.ts` | Routing + search agents | `createGeocodingProvider()` |
| `providers/routingProvider.ts` | Routing agent (via compileSketch) | `createRoutingProvider()` |
| `providers/weatherProvider.ts` | Enrichment agent (via getRouteWeather) | `createWeatherProvider()` |

### Existing modules (enhanced in this epic)

| Module | Enhancement | Task |
|--------|------------|------|
| `lib/geo.ts` | Add `haversineKm`, `decodePolyline`, `samplePolyline` — eliminate 4 duplicates across tool files | US-070 |
| `lib/piTools.ts` | Add `searchNearby`, `webSearch` schemas | US-076, US-077 |
| `budgetTracker.ts` | Add `mode: 'log' \| 'gate'`, per-agent `agentLabel` | US-070 |

### New modules (created in this epic)

| Module | Purpose | Task | Adapted from |
|--------|---------|------|-------------|
| `agents/types.ts` | Shared types: result unions, `SubAgentConfig` | US-070 | — |
| `providers/placesProvider.ts` | Google Places factory: `searchAlongRoute()` + `searchNearby()` | US-070 | Extracted from `tools/searchAlongRoute.ts` |
| `providers/webSearchProvider.ts` | Jina Search factory: `search()` | US-070 | Adapted from `holocron/convex/research/search.ts` |
| `tools/searchNearby.ts` | Nearby place search (thin wrapper around placesProvider) | US-076 | — |
| `tools/webSearch.ts` | Web search (thin wrapper around webSearchProvider) | US-077 | — |

### Deduplication map

| Duplicated code | Currently in | Moves to |
|----------------|-------------|----------|
| `haversineKm` (10 lines) | `tools/searchAlongRoute.ts` | `lib/geo.ts` |
| `haversineMeters` (10 lines, identical to `haversineDistance`) | `tools/getElevation.ts` | Delete, import from `lib/geo.ts` |
| `decodePolyline` (35 lines) | `tools/searchAlongRoute.ts` | `lib/geo.ts` |
| `samplePolyline` (16 lines) | `tools/getElevation.ts`, `tools/getRouteWeather.ts` | `lib/geo.ts` |
| Google Places API call (60 lines) | `tools/searchAlongRoute.ts` | `providers/placesProvider.ts` |
| `process.env.GOOGLE_MAPS_API_KEY` direct access | `tools/searchAlongRoute.ts` | Via provider factory (consistent with all other providers) |
| `runGeocode` handler (15 lines) | Routing agent | Exported from routing agent, imported by search agent |

## File Structure

### New Files
| File | Purpose |
|------|---------|
| `convex/actions/agent/agents/types.ts` | Shared types: result unions, `SubAgentConfig` |
| `convex/actions/agent/agents/orchestrator.ts` | Orchestrator: ReAct loop with 3 sub-agent tools |
| `convex/actions/agent/agents/routingAgent.ts` | Routing sub-agent: 4 tools, route creation prompt, sketch state |
| `convex/actions/agent/agents/searchAgent.ts` | Search sub-agent: 3 tools, general questions prompt |
| `convex/actions/agent/agents/enrichmentAgent.ts` | Enrichment sub-agent: 7 tools, route analysis prompt |
| `convex/actions/agent/providers/placesProvider.ts` | Google Places factory (searchAlongRoute + searchNearby) |
| `convex/actions/agent/providers/webSearchProvider.ts` | Jina Search factory (adapted from holocron) |
| `convex/actions/agent/tools/searchNearby.ts` | Nearby place search tool |
| `convex/actions/agent/tools/webSearch.ts` | Web search tool |

### Modified Files
| File | Change |
|------|--------|
| `convex/actions/agent/ridePlanningAgent.ts` | Gut to thin wrapper → delegates to orchestrator. ~1200 → ~30 lines |
| `convex/actions/agent/budgetTracker.ts` | Add `mode: 'log' \| 'gate'`, per-agent `agentLabel` on `add()` |
| `convex/actions/agent/lib/geo.ts` | Add `haversineKm`, `decodePolyline`, `samplePolyline` |
| `convex/actions/agent/lib/piTools.ts` | Add `searchNearby`, `webSearch` schemas |
| `convex/actions/agent/lib/summarizeForContext.ts` | Add `compileSketch` to planRoute summarization branch |
| `convex/actions/agent/sendMessage.ts` | Add `compileSketch: 'routing_card'` to `TOOL_TO_CARD_KIND` |
| `convex/actions/agent/tools/searchAlongRoute.ts` | Refactor to use `placesProvider` + import geo utils from `lib/geo.ts` |
| `convex/actions/agent/tools/getElevation.ts` | Remove duplicates, import from `lib/geo.ts` |
| `convex/actions/agent/tools/getRouteWeather.ts` | Remove duplicate `samplePolyline`, import from `lib/geo.ts` |

### Unchanged Files
| File | Why |
|------|-----|
| `runAgent.ts` | Generic ReAct loop — all agents reuse as-is |
| `planRide.ts` | Direct deterministic path, no agent |
| `loopDetector.ts` | Each agent creates its own instance |
| `sessionContext.ts` | Used by orchestrator prompt builder |
| `lib/reliability.ts` | Already shared, no changes needed |
| `lib/tracing.ts` | Already shared, no changes needed |
| `providers/geocodingProvider.ts` | Already a proper factory |
| `providers/routingProvider.ts` | Already a proper factory |
| `providers/weatherProvider.ts` | Already a proper factory |

## Tasks

- [US-070](US-070-shared-types-and-budget-logger.md): Create shared agent types and BudgetTracker log mode
- [US-071](US-071-routing-agent.md): Extract routing sub-agent from ridePlanningAgent
- [US-072](US-072-enrichment-agent.md): Extract enrichment sub-agent from ridePlanningAgent
- [US-076](US-076-search-nearby-tool.md): Create searchNearby tool (Google Places by location)
- [US-077](US-077-web-search-tool.md): Create webSearch tool (Jina/Exa wrapper for open-ended queries)
- [US-078](US-078-search-agent.md): Create search sub-agent with searchNearby, webSearch, and geocode
- [US-073](US-073-orchestrator.md): Create orchestrator with ReAct dispatch and 3 sub-agents
- [US-074](US-074-wire-orchestrator.md): Wire orchestrator into ridePlanningAgent wrapper and update sendMessage
- [US-075](US-075-verify-attention-isolation.md): Verify attention isolation and cost logging

## Dependency Graph

```
US-070 (types + budget) ──→ US-071 (routing agent) ──────────┐
                        ──→ US-072 (enrichment agent) ───────┤
                        ──→ US-076 (searchNearby tool) ──┐   │
                        ──→ US-077 (webSearch tool) ─────┼→ US-078 (search agent) ──┤
                                                         ┘   │
                                                              ├→ US-073 (orchestrator) → US-074 (wire) → US-075 (verify)
                                                              ┘
```

US-071, US-072, US-076, US-077 can all run in parallel after US-070.
US-078 depends on US-076 + US-077 (needs the tools to exist).
US-073 depends on US-071, US-072, US-078 (all three sub-agents must exist).
