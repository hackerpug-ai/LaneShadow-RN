# US-071: Extract Routing Sub-Agent

> Epic: 3c — Agent Orchestrator Refactor
> Sequence: 2 (depends on US-070)
> Agent: convex-implementer
> Reviewer: convex-reviewer

## Context

The routing agent owns route creation — geocoding, sketch authoring, compilation, and the planRoute fallback. It gets a focused Phase 1 prompt and a narrow 4-tool toolbox. All sketch retry state (`PendingSketchState`) moves here.

## Tool Schema (Orchestrator → Routing Agent)

### Input

```typescript
routing_agent: Type.Object({
  query: Type.String({
    description: 'The rider\'s route request in natural language (e.g., "scenic ride to Santa Cruz", "avoid Highway 1")',
  }),
})
```

### Output

```typescript
type RoutingAgentResult =
  | { status: 'route_ready'; routePlanId: Id<'route_plans'>; summary: string }
  | { status: 'needs_clarification'; question: string }
  | { status: 'failed'; reason: string }
```

## Acceptance Criteria

- [x] `convex/actions/agent/agents/routingAgent.ts` exists with:
  - `executeRoutingAgent(config: SubAgentConfig): Promise<RoutingAgentResult>`
  - `buildRoutingPrompt(ctx: AgentContext): string` — Phase 1 guidance only (~30 lines), no enrichment instructions
  - 4 tool definitions: `geocode`, `createRouteSketch`, `compileSketch`, `planRoute`
  - `executeRoutingTool(ctx, call, executeCtx?)` dispatcher for the 4 tools
- [x] `PendingSketchState` type, module-level Map, and all helpers moved from `ridePlanningAgent.ts`:
  - `storePendingSketch`, `getPendingSketchState`, `updatePendingSketchState`, `clearPendingSketch`, `getPendingSketch`
  - `segmentKey`, `findUnchangedSegments`, `mergeSegmentResults`
  - `MAX_COMPILE_ATTEMPTS` constant
- [x] Tool handler functions moved from `ridePlanningAgent.ts`:
  - `runGeocode`, `runCreateRouteSketch`, `runCompileSketch`, `runPlanRoute`
- [x] Routing agent uses Haiku model: `getModel('anthropic', 'claude-haiku-4-5-20251001')` — NOT the global `AI_MODEL` constant. The narrow 4-tool toolbox and focused prompt compensate for the smaller model. Escalate to Sonnet only if sketch quality degrades (monitored via BudgetTracker logs).
- [x] `executeRoutingAgent` calls `runAgent()` with:
  - `maxSteps: 6` (geocode + sketch + compile + maybe retry)
  - `timeoutMs: 90_000`
  - Shared `budgetTracker` from `SubAgentConfig` (label: `'routing'`)
  - `parallelSafeTools: new Set(['geocode', 'createRouteSketch'])`
- [x] ExecuteContext callback forwarding: forwards `onToolStart`, `onToolFinish`, `onAgentTurn`, `onToolResultPiMessage` (card emission). Does NOT forward `onTextDelta` or `onThinkingDelta` (sub-agent text doesn't stream to UI)
- [x] Returns `RoutingAgentResult`:
  - `route_ready` when `extractRouteAttachments` finds a routePlanId in tool results
  - `needs_clarification` when agent responded with text but no tool calls
  - `failed` otherwise
- [x] Sub-agent gets NO conversation history — only `userMessage` from `SubAgentConfig` as a single user turn
- [x] Routing prompt includes location block (from `AgentContext.currentLocation` or session fallback)

## Files to Create/Modify

| File | Change |
|------|--------|
| `convex/actions/agent/agents/routingAgent.ts` | **CREATE** — routing sub-agent |

## Code to Move (from ridePlanningAgent.ts)

| Code Block | Lines | Destination |
|------------|-------|-------------|
| `PendingSketchState` + Map + helpers | 48-151 | `routingAgent.ts` (private) |
| `runGeocode` | 312-327 | `routingAgent.ts` |
| `runPlanRoute` | 329-426 | `routingAgent.ts` |
| `runCreateRouteSketch` | 442-482 | `routingAgent.ts` |
| `runCompileSketch` | 484-803 | `routingAgent.ts` |
| Tool defs: geocode, createRouteSketch, compileSketch, planRoute | 912-940 | `routingAgent.ts` |

## Reusable Modules

| Module | What routing agent uses | Notes |
|--------|----------------------|-------|
| `runAgent.ts` | Generic ReAct loop — called with routing-specific config | Unchanged |
| `lib/piTools.ts` | `AgentToolSchemas.geocode`, `.createRouteSketch`, `.compileSketch`, `.planRoute` | Unchanged |
| `lib/summarizeForContext.ts` | Trims `compileSketch`/`planRoute` results before LLM context | Extended in US-074 to handle `compileSketch` |
| `lib/reliability.ts` | `withTimeout`, `retryOnce` used by `compileSketch` internals | Unchanged |
| `providers/geocodingProvider.ts` | `createGeocodingProvider()` used by `runGeocode` handler | Unchanged |
| `providers/routingProvider.ts` | `createRoutingProvider()` used by `compileSketch` and `planRoute` | Unchanged |
| `lib/geo.ts` | `decodePolyline`, `samplePolyline` (used internally by compilation) | Enhanced in US-070 |
| `agents/types.ts` | `SubAgentConfig`, `RoutingAgentResult` | Created in US-070 |

The `runGeocode` handler is shared between routing agent and search agent (US-078). Extract to a standalone function that both agents import rather than duplicating.

## Implementation Notes

- Import tool schemas from `../lib/piTools.ts` (unchanged)
- Import `runAgent` from `../runAgent`
- Import `extractRouteAttachments` from `../ridePlanningAgent` (stays as a shared utility until US-074)
- The routing prompt should include the sketch authoring examples, avoidance handling, and segment retry guidance — but NOT Phase 2 enrichment guidance
- `compileSketch` is NOT parallel-safe (mutation side effects)
- `planRoute` is NOT parallel-safe (calls orchestrator)
- **Shared handler**: `runGeocode` should be exported so `searchAgent.ts` (US-078) can import it rather than duplicating the geocoding handler
