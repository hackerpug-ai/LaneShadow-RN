# LangChain to Pi Migration Design

**Date:** 2026-03-28
**Status:** Approved
**Epic:** Agent Infrastructure Migration

---

## Context

LaneShadow currently uses LangChain (@langchain/langgraph, @langchain/openai, langsmith) for route planning agent functionality. The migration to pi coding-agent SDK is driven by:

1. **Separation of concerns** - LangChain is too bulky for the agent-focused needs
2. **Desire for minimal, focused agent toolkit** - Pi's opinionated simplicity aligns better
3. **Replace LangSmith observability** - Move to pi's event system for tracing

**Scope:** Migrate all agent functionality from LangChain to pi SDK while running within Convex actions (serverless deployment).

---

## Architecture

### Current State (LangChain)

```
Convex Action → LangGraph StateGraph
  → generateSketches node (LLM with structured output)
  → processRoutes node (tool executions)
  → LangSmith tracing
  → return PlannedRouteOptionsView
```

### Target State (Pi)

```
Convex Action → AgentSession.prompt()
  → Route planning extension (tools + prompts)
  → Event observer (observability)
  → return PlannedRouteOptionsView
```

### Key Changes

1. **Remove LangChain dependencies** - Replace with pi SDK packages
2. **Tools become pi ToolDefinitions** - TypeBox + AJV validation
3. **LangGraph → AgentSession** - Simpler agent loop API
4. **LangSmith → pi events** - 20+ lifecycle hooks for observability
5. **Extension encapsulation** - Domain logic in cohesive extension

---

## Components

### 1. Route Planning Extension

**File:** `convex/actions/agent/extensions/routePlanningExtension.ts`

**Responsibilities:**
- Define all route planning tools as pi ToolDefinitions
- Provide system prompt for route sketching
- Handle tool execution context (weather/routing providers)
- Implement event handlers for lifecycle hooks

**Tools to Migrate:**
- `compileSketch` - Convert sketch to provider route
- `normalizeRoute` - Standardize route format
- `computeRouteIndex` - Build spatial index
- `probeConditions` - Fetch weather data
- `mapConditions` - Apply overlays to route

### 2. Agent Session Factory

**File:** `convex/actions/agent/lib/piSession.ts`

**Responsibilities:**
- Create AgentSession instances configured for Convex
- Handle model selection (OpenAI GPT-4o)
- Set up event subscriptions for observability
- Manage session initialization and cleanup

**API:**
```typescript
createAgentSession(ctx: ActionCtx): Promise<AgentSession>
```

### 3. Event Observer

**File:** `convex/actions/agent/lib/piObserver.ts`

**Responsibilities:**
- Replace LangSmith tracing functionality
- Log agent lifecycle events (start, end, turn start/end)
- Track tool execution (start, update, end)
- Publish metrics to Convex logging system

**Events Tracked:**
- `agent_session_start` / `agent_session_end`
- `tool_execution_start` / `tool_execution_end`
- `message_start` / `message_end`

### 4. Convex Action Wrapper

**File:** `convex/actions/agent/planRide.ts` (modified)

**Changes:**
- Replace `runPlanningGraph()` with `createAgentSession()` + `session.prompt()`
- Maintain existing API contract (`PlanInput` → `PlannedRouteOptionsView`)
- Stream progress through pi event system

---

## Data Flow

### Request Flow

1. User calls `planRide` Convex action with `PlanInput`
2. Action creates AgentSession with routePlanningExtension
3. Session prompts: "Plan a scenic motorcycle route from A to B departing at [time]"
4. Agent loop executes:
   - LLM generates route sketches (structured output)
   - Tools compile/normalize routes
   - Weather conditions probed and mapped
   - Route options built and validated
5. Event observer logs all steps
6. Session returns `PlannedRouteOptionsView`

### Error Handling

| Scenario | Current (LangChain) | Migrated (Pi) |
|----------|---------------------|---------------|
| Invalid LLM sketches | `LLM_SKETCH_INVALID` error | Tool returns error → LLM self-corrects |
| Timeout | `withTimeout()` wrapper | AgentSession signal abort |
| Retry exhausted | `retryOnce()` wrapper | Tool returns error → Agent retries |
| Weather unavailable | Soft-fail (conditions unavailable) | Same pattern in tool |

**Preserved Patterns:**
- `retryOnce()` for transient failures
- `withTimeout()` for LLM calls
- Soft-fail for non-critical tools (weather)

---

## Dependencies

### Remove

```json
{
  "@langchain/core": "^1.1.12",
  "@langchain/langgraph": "^1.0.15",
  "@langchain/openai": "^1.2.1",
  "langchain": "^1.2.7",
  "langsmith": "^0.4.5"
}
```

### Add

```json
{
  "@mariozechner/pi-agent-core": "^0.63.1",
  "@mariozechner/pi-ai": "^0.63.1",
  "@sinclair/typebox": "^0.33.0"
}
```

### Keep

- All tool implementations (compileSketch, normalizeRoute, etc.)
- Convex validators and models
- Provider integrations (routing, weather)
- Existing reliability utilities (retryOnce, withTimeout)

---

## File Structure

### New Files

```
convex/actions/agent/
├── extensions/
│   └── routePlanningExtension.ts    # Pi extension with tools
├── lib/
│   ├── piSession.ts                  # Agent session factory
│   ├── piObserver.ts                 # Event observer
│   └── piTools.ts                    # Tool definition helpers
└── planRide.ts                       # Updated to use pi
```

### Removed Files

```
convex/actions/agent/graphs/          # REMOVE entire directory
  ├── planningGraph.ts
  └── __tests__/
convex/actions/agent/lib/tracing.ts   # REMOVE (LangSmith)
```

### Modified Files

- `convex/lib/env.ts` - Remove LangSmith env vars, add pi config
- `package.json` - Update dependencies
- `convex/actions/agent/tools/*` - Wrap as pi ToolDefinitions (or create wrappers)

---

## Testing Strategy

### Unit Tests

**Keep Existing:**
- Tool implementation tests (compileSketch, normalizeRoute, etc.)
- Provider tests (routing, weather)

**Add New:**
- Pi extension tests (tool execution, validation)
- Event observer tests (mock events)
- Session factory tests (configuration)

### Integration Tests

**Replace:**
```typescript
// Before (LangGraph)
await planningGraph.invoke(initialState, config)

// After (Pi)
const session = await createAgentSession(ctx)
const result = await session.prompt("Plan a route...")
```

**Validate:**
- Identical outputs between LangChain and pi implementations
- Tool execution order preserved
- Error handling paths work correctly
- Event logs capture all observability data

### Migration Validation

1. Run existing test suite with pi implementation
2. Compare outputs against LangChain baseline
3. Load test for performance parity
4. Monitor event logs for completeness

---

## Implementation Phases

### Phase 1: Foundation (Week 1)

1. Add pi dependencies to package.json
2. Create `piSession.ts` - Agent session factory
3. Create `piObserver.ts` - Event observer
4. Create `piTools.ts` - Tool definition helpers

### Phase 2: Extension (Week 1-2)

5. Create `routePlanningExtension.ts`
6. Migrate tools to pi ToolDefinition format
7. Add system prompt to extension
8. Test extension in isolation

### Phase 3: Integration (Week 2)

9. Update `planRide.ts` to use AgentSession
10. Remove LangGraph files and dependencies
11. Update environment configuration
12. Update integration tests

### Phase 4: Validation (Week 2-3)

13. Run full test suite
14. Compare outputs with LangChain version
15. Performance testing
16. Deploy to staging for validation

---

## Verification

### End-to-End Test

1. Deploy migrated version to staging
2. Call `planRide` action with test route
3. Verify:
   - Route options returned successfully
   - Event logs captured all steps
   - Error handling works (test with bad inputs)
   - Performance is acceptable (< 30s for typical routes)

### Rollback Plan

- Keep LangChain version tagged for quick rollback
- Feature flag to switch between implementations
- Monitor error rates and latency post-deployment

---

## Open Questions

None at this time.

---

## References

- [Pi SDK Documentation](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent/docs)
- [Pi SDK Examples](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent/examples/sdk)
- Current LangChain implementation: `convex/actions/agent/graphs/planningGraph.ts`
