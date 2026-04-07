# US-072: Extract Enrichment Sub-Agent

> Epic: 3c — Agent Orchestrator Refactor
> Sequence: 2 (depends on US-070, parallel with US-071)
> Agent: convex-implementer
> Reviewer: convex-reviewer

## Context

The enrichment agent answers questions about existing routes — elevation, curvature, weather, gas stations, surface quality. It gets a focused Phase 2 prompt and 7 tools, all parallel-safe.

## Tool Schema (Orchestrator → Enrichment Agent)

### Input

```typescript
enrichment_agent: Type.Object({
  query: Type.String({
    description: 'The rider\'s question about an existing route (e.g., "is it twisty?", "where can I get gas 2 hours in?", "what\'s the weather?")',
  }),
})
```

### Output

```typescript
type EnrichmentAgentResult =
  | { status: 'answered'; data: unknown; summary: string }
  | { status: 'not_applicable'; reason: string }
```

## Acceptance Criteria

- [x] `convex/actions/agent/agents/enrichmentAgent.ts` exists with:
  - `executeEnrichmentAgent(config: SubAgentConfig): Promise<EnrichmentAgentResult>`
  - `buildEnrichmentPrompt(ctx: AgentContext, routeBlock: string): string` — Phase 2 guidance only (~15 lines)
  - 7 tool definitions: `getElevation`, `getCurvature`, `searchAlongRoute`, `getRouteWeather`, `checkSurface`, `lookupRoad`, `getUserFavorites`
  - `executeEnrichmentTool(ctx, call)` dispatcher for the 7 tools
- [x] Tool handler functions moved from `ridePlanningAgent.ts`:
  - `runGetElevation`, `runGetCurvature`, `runCheckSurface`, `runSearchAlongRoute`, `runGetRouteWeather`, `runLookupRoad`, `runGetUserFavorites`
- [x] `executeEnrichmentAgent` short-circuits with `{ status: 'not_applicable', reason }` if `buildInSessionRouteBlock()` returns empty (no route exists to enrich)
- [x] Enrichment agent uses Haiku model: `getModel('anthropic', 'claude-haiku-4-5-20251001')` — nearly bounded task (classify question → pick tool → present data). Minimal reasoning required.
- [x] `executeEnrichmentAgent` calls `runAgent()` with:
  - `maxSteps: 4` (classify + 1-2 tool calls + respond)
  - `timeoutMs: 30_000`
  - Shared `budgetTracker` from `SubAgentConfig` (label: `'enrichment'`)
  - `parallelSafeTools`: all 7 tools (all are parallel-safe)
- [x] Does NOT forward card-related callbacks (`onToolStart`, `onToolFinish`) — enrichment tools don't emit cards
- [x] Forwards `onAgentTurn` and `onToolResultPiMessage` for message persistence
- [x] Returns `EnrichmentAgentResult`:
  - `answered` when tool results exist (includes `data` and agent's `summary` text)
  - `not_applicable` when no route exists or agent couldn't answer
- [x] Sub-agent gets NO conversation history — only `userMessage` from `SubAgentConfig`
- [x] Enrichment prompt tells the agent which tool answers which question type (e.g., "twisty?" → getCurvature + lookupRoad)

## Files to Create/Modify

| File | Change |
|------|--------|
| `convex/actions/agent/agents/enrichmentAgent.ts` | **CREATE** — enrichment sub-agent |

## Code to Move (from ridePlanningAgent.ts)

| Code Block | Lines | Destination |
|------------|-------|-------------|
| `runLookupRoad` | 805-813 | `enrichmentAgent.ts` |
| `runGetCurvature` | 815-824 | `enrichmentAgent.ts` |
| `runCheckSurface` | 826-834 | `enrichmentAgent.ts` |
| `runGetElevation` | 836-840 | `enrichmentAgent.ts` |
| `runSearchAlongRoute` | 843-856 | `enrichmentAgent.ts` |
| `runGetRouteWeather` | 858-866 | `enrichmentAgent.ts` |
| `runGetUserFavorites` | 868-878 | `enrichmentAgent.ts` |
| Tool defs: all 7 enrichment tools | 941-1007 | `enrichmentAgent.ts` |

## Reusable Modules

| Module | What enrichment agent uses | Notes |
|--------|--------------------------|-------|
| `runAgent.ts` | Generic ReAct loop — called with enrichment-specific config | Unchanged |
| `lib/piTools.ts` | All 7 enrichment tool schemas | Unchanged |
| `lib/geo.ts` | `haversineDistance`, `samplePolyline`, `decodePolyline` (used by tool internals) | Enhanced in US-070 |
| `lib/reliability.ts` | `withTimeout`, `retryOnce` used by weather/elevation/lookupRoad tools | Unchanged |
| `lib/tracing.ts` | `traceableToolAsync` wrapping all 7 tools | Unchanged |
| `providers/weatherProvider.ts` | `createWeatherProvider()` used by `getRouteWeather` | Unchanged |
| `sessionContext.ts` | `buildInSessionRouteBlock()` — checks if routes exist (pre-check) | Unchanged |
| `agents/types.ts` | `SubAgentConfig`, `EnrichmentAgentResult` | Created in US-070 |

All 7 tool handlers are self-contained — they import from `../tools/` and don't share state. No handler deduplication needed.

## Implementation Notes

- Import tool schemas from `../lib/piTools.ts`
- Import tool implementations from `../tools/` (unchanged)
- Import `buildInSessionRouteBlock` from `../sessionContext`
- The enrichment prompt should map question types to tools but NOT include route authoring guidance
- All 7 tools are `parallelSafe: true` — the enrichment agent can fire multiple lookups concurrently if the rider asks about "elevation and weather"
