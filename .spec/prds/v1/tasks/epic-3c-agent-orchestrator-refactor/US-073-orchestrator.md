# US-073: Create Orchestrator with ReAct Dispatch and 3 Sub-Agents

> Epic: 3c — Agent Orchestrator Refactor
> Sequence: 4 (depends on US-071, US-072, US-078)
> Agent: convex-implementer
> Reviewer: convex-reviewer

## Context

The orchestrator is a **hybrid** between the rigid orchestrator pattern (deterministic state checks gate which steps are available) and the ReAct pattern (the LLM reasons about observations to pick the appropriate step). This avoids both failure modes:

- **Pure orchestrator**: rigid phase sequencing can't handle ambiguous user intent ("ride to SC, oh and is Skyline twisty?")
- **Pure ReAct with 14 tools**: too much attention load, model wanders into wrong phases

The hybrid approach: **deterministic state removes impossible tools, then the LLM reasons freely within what remains.**

### How It Works

The orchestrator is a ReAct loop — there is no rigid phase sequence. The rider might:
- Ask for a route → orchestrator calls `routing_agent`
- Ask "what's the gravel like right here?" with no route → orchestrator calls `enrichment_agent` directly (no routing step needed)
- Ask "ride to SC and check weather" → orchestrator calls `routing_agent`, observes result, then calls `enrichment_agent`
- Say "hello" → orchestrator responds directly, no sub-agent

The only deterministic constraint: if no route exists, `enrichment_agent` is removed from the toolbox (can't enrich what doesn't exist). But the LLM decides the sequence — not the code.

```
1. DETERMINISTIC PRE-CHECK (code removes impossible tools):
   - hasRoutes = routeBlock is non-empty
   - hasPendingSketch = PendingSketchState exists with failures
   - Tool list = f(hasRoutes, hasPendingSketch)

2. REACT LOOP (LLM reasons, picks tools in any order):
   Example A — route request:
   - Thought: "The rider wants a scenic ride" → routing_agent
   - Observation: { status: 'route_ready' }
   - Thought: "Done. Present results."

   Example B — nearby search (no route needed):
   - Thought: "The rider wants a gas station nearby" → search_agent
   - Observation: { status: 'answered', summary: '3 gas stations within 2mi' }
   - Thought: "Done. Present results."

   Example C — general knowledge (no tool needed):
   - Thought: "The rider asks about gas tank capacity — I can answer directly"
   - Final response (no sub-agent call)

   Example D — web search for current info:
   - Thought: "Road closure is real-time info" → search_agent
   - Observation: { status: 'answered', summary: 'Skyline Blvd open, no closures' }

   Example E — multi-intent:
   - Thought: "Route first, then weather" → routing_agent → enrichment_agent
```

The LLM decides *which* sub-agent to call, *in what order*, and *how to synthesize* results. The code only removes tools that are structurally impossible given session state.

## Acceptance Criteria

- [ ] `convex/actions/agent/agents/orchestrator.ts` exists with:
  - `executeOrchestrator(ctx: AgentContext, userMessage: string, executeCtx?: ExecuteContext): Promise<OrchestratorResult>`
  - `buildOrchestratorPrompt(ctx: AgentContext, availableTools: string[]): string`
  - `determineAvailableTools(hasRoutes: boolean, hasPendingSketch: boolean): Tool[]`
- [ ] Deterministic state check runs BEFORE the ReAct loop:
  - Queries `buildInSessionRouteBlock()` to determine `hasRoutes`
  - Checks routing agent's `getPendingSketchState()` for `hasPendingSketch` (exported from routingAgent.ts)
  - Builds tool list based on state (see table below)
- [ ] Tool availability based on state:

  | State | Available Tools | Rationale |
  |-------|----------------|-----------|
  | No routes, no pending sketch | `routing_agent`, `search_agent` | Can't enrich what doesn't exist, but search is always available |
  | Has routes, no pending sketch | `routing_agent`, `search_agent`, `enrichment_agent` | All three available — LLM picks based on intent |
  | Has pending sketch with failures | `routing_agent` only | Must resolve sketch before anything else |

- [ ] Orchestrator prompt is ~15 lines:
  - Role: understand rider intent, pick the right specialist
  - Location block injected (current location + in-session routes)
  - Available tools listed dynamically (only what state allows)
  - No rigid sequencing — LLM reasons about what the rider needs and picks accordingly
  - Three specialists: `routing_agent` for routes, `search_agent` for nearby places / web search / general questions, `enrichment_agent` for analysis of existing routes
  - Multi-intent: "If the rider asks for multiple things, handle them one at a time — observe results before deciding the next step"
  - Presentation rules: 1-2 sentences, 2nd person, no tool names exposed
- [ ] Orchestrator uses the frontier model: `getModel(AI_PROVIDER, AI_MODEL)` (currently `claude-sonnet-4-6`). The orchestrator needs strong reasoning for intent classification, multi-intent sequencing, and result synthesis. Sub-agents use Haiku independently.
- [ ] Orchestrator calls `runAgent()` with:
  - `maxSteps: 5` (classify + 1-2 sub-agent calls + synthesize + respond)
  - `timeoutMs: 120_000` (overall timeout unchanged)
  - Shared `BudgetTracker` (log mode, label: `'orchestrator'`)
  - `parallelSafeTools: new Set()` (sub-agents are NOT parallel-safe)
- [ ] Executor closure:
  - `routing_agent` call → `executeRoutingAgent(subConfig)` with `budgetTracker` label `'routing'`
  - `search_agent` call → `executeSearchAgent(subConfig)` with `budgetTracker` label `'search'`
  - `enrichment_agent` call → `executeEnrichmentAgent(subConfig)` with `budgetTracker` label `'enrichment'`
- [ ] ExecuteContext callback forwarding:
  - Orchestrator's final text streams to UI (`onTextDelta`, `onThinkingDelta`, `onFinalAssistant`)
  - Sub-agent card callbacks forwarded through executor (routing agent needs `onToolStart`/`onToolFinish`)
- [ ] `OrchestratorResult` type: `{ response: string, attachments?: { type: string, routePlanId?: Id }[] }`
- [ ] Attachment extraction reads `RoutingAgentResult.routePlanId` from tool results (not raw planRoute/compileSketch results)
- [ ] Direct chat (greeting, thanks, off-topic) handled by orchestrator LLM directly — no sub-agent call, just text response
- [ ] Stub tools (`fetchWeather`, `saveRoute`, `searchFavorites`) are NOT included — they are deleted from the system

## Files to Create

| File | Change |
|------|--------|
| `convex/actions/agent/agents/orchestrator.ts` | **CREATE** — hybrid orchestrator |

## Implementation Notes

- The orchestrator is itself a `runAgent()` invocation — it's a ReAct loop, just with a very small tool set (2 tools max)
- The `determineAvailableTools()` function is pure and testable — it takes booleans, returns tool definitions
- The `hasPendingSketch` check requires the routing agent to export a read accessor. Add `hasPendingSketch(sessionId: string): boolean` export to `routingAgent.ts`
- `summarizeForContext` is used by sub-agents internally, not by the orchestrator. The orchestrator sees structured `RoutingAgentResult` / `EnrichmentAgentResult` objects which are already compact
- The pi-ai session messages (`ctx.piMessages`) are passed to the orchestrator's ReAct loop so it has conversation history for multi-turn context. Sub-agents do NOT get this history.
- Import `getModel` and model config from `../../lib/env`
