# US-078: Create Search Sub-Agent

> Epic: 3c — Agent Orchestrator Refactor
> Sequence: 3 (depends on US-070, US-076, US-077)
> Agent: convex-implementer
> Reviewer: convex-reviewer

## Context

The search agent answers general questions that don't require a compiled route — nearby places, real-time info via web search, or general motorcycle knowledge from the LLM's training data. It's always available to the orchestrator regardless of session state (unlike the enrichment agent which requires a route).

## Tool Schema (Orchestrator → Search Agent)

### Input

```typescript
search_agent: Type.Object({
  query: Type.String({
    description: 'The rider\'s question in natural language. Include location context if relevant.',
  }),
})
```

### Output

```typescript
type SearchAgentResult =
  | { status: 'answered'; data: unknown; summary: string }
  | { status: 'not_applicable'; reason: string }
```

## Acceptance Criteria

- [ ] `convex/actions/agent/agents/searchAgent.ts` exists with:
  - `executeSearchAgent(config: SubAgentConfig): Promise<SearchAgentResult>`
  - `buildSearchPrompt(ctx: AgentContext): string` — search-focused guidance (~15 lines)
  - 3 tool definitions: `searchNearby`, `webSearch`, `geocode`
  - `executeSearchTool(ctx, call)` dispatcher for the 3 tools
- [ ] Search agent uses Haiku model: `getModel('anthropic', 'claude-haiku-4-5-20251001')`
- [ ] `executeSearchAgent` calls `runAgent()` with:
  - `maxSteps: 4` (reason + 1-2 tool calls + respond)
  - `timeoutMs: 20_000`
  - Shared `budgetTracker` from `SubAgentConfig` (label: `'search'`)
  - `parallelSafeTools: new Set(['searchNearby', 'webSearch', 'geocode'])` (all parallel-safe)
- [ ] Search prompt tells the agent:
  - Use `searchNearby` for place/POI questions ("gas station?", "viewpoints?", "restaurant?")
  - Use `webSearch` for current info the LLM can't know ("road closures", "speed limits", "construction")
  - Use `geocode` if the rider references a place name that needs coordinates
  - For general knowledge questions ("how many gallons does my bike take?"), respond directly — no tool call needed
- [ ] Rider's current location injected into prompt (from `AgentContext.currentLocation` or session fallback) so `searchNearby` has a default center
- [ ] Does NOT forward card-related callbacks — search results don't emit cards
- [ ] Forwards `onAgentTurn` and `onToolResultPiMessage` for message persistence
- [ ] Returns `SearchAgentResult`:
  - `answered` when tool results exist OR the agent responded with general knowledge
  - `not_applicable` only if the question is truly unanswerable (rare)
- [ ] Sub-agent gets NO conversation history — only `userMessage` from `SubAgentConfig`
- [ ] Add `SearchAgentResult` to `agents/types.ts`

## Reusable Modules

| Module | What search agent uses | Source |
|--------|----------------------|--------|
| `runAgent.ts` | Generic ReAct loop | Unchanged |
| `lib/piTools.ts` | `AgentToolSchemas.searchNearby`, `.webSearch`, `.geocode` | Enhanced in US-076, US-077 |
| `tools/searchNearby.ts` | `searchNearby` tool (thin wrapper around placesProvider) | Created in US-076 |
| `tools/webSearch.ts` | `webSearch` tool (thin wrapper around webSearchProvider) | Created in US-077 |
| `providers/placesProvider.ts` | `createPlacesProvider().searchNearby()` | Created in US-070 |
| `providers/webSearchProvider.ts` | `createWebSearchProvider().search()` | Created in US-070 (adapted from holocron Jina pattern) |
| `providers/geocodingProvider.ts` | `createGeocodingProvider().geocode()` | Existing, unchanged |
| `agents/routingAgent.ts` | `runGeocode` handler (shared, not duplicated) | Created in US-071, exported for reuse |
| `agents/types.ts` | `SubAgentConfig`, `SearchAgentResult` | Created in US-070, extended here |

## Files to Create/Modify

| File | Change |
|------|--------|
| `convex/actions/agent/agents/searchAgent.ts` | **CREATE** — search sub-agent |
| `convex/actions/agent/agents/types.ts` | Add `SearchAgentResult` type |

## Implementation Notes

- The search agent is the simplest sub-agent — most questions map to exactly one tool or no tool at all
- **`runGeocode` is shared** with the routing agent — import from `routingAgent.ts` (exported in US-071), don't duplicate. Both agents need geocoding for different reasons (routing: resolve destination coordinates, search: resolve place names for nearby searches)
- Tool handlers for `searchNearby` and `webSearch` are thin wrappers — the real logic lives in `providers/placesProvider.ts` and `providers/webSearchProvider.ts`
- The search agent should present results conversationally, not as raw JSON. The Haiku LLM synthesizes tool results into a rider-friendly answer.
- For "how many gallons does my bike take?" — the LLM should note it doesn't know the rider's specific bike and ask what they ride, or give a general range. This is a direct response, no tool call.
