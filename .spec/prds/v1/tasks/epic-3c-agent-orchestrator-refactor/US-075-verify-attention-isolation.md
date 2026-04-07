# US-075: Verify Attention Isolation and Cost Logging

> Epic: 3c — Agent Orchestrator Refactor
> Sequence: 5 (depends on US-074)
> Agent: convex-reviewer
> Reviewer: (human)

## Context

The refactor is wired up. This task verifies the core thesis: sub-agents stay in their lanes (attention isolation), costs are logged per-agent (data for future gate tuning), and the E2E user experience is preserved.

## Acceptance Criteria

### Attention Isolation
- [ ] "scenic ride to Santa Cruz" → Convex logs show: orchestrator calls `routing_agent`, routing agent calls `geocode` + `createRouteSketch` + `compileSketch`. No enrichment tools called anywhere.
- [ ] "is it twisty?" (after route exists) → Convex logs show: orchestrator calls `enrichment_agent`, enrichment agent calls `lookupRoad` + `getCurvature`. No routing tools called anywhere.
- [ ] "is there a gas station nearby?" (NO route exists) → Convex logs show: orchestrator calls `search_agent`, search agent calls `searchNearby`. No routing or enrichment tools called.
- [ ] "is Skyline Blvd closed today?" → Convex logs show: orchestrator calls `search_agent`, search agent calls `webSearch`. Returns current info.
- [ ] "how many gallons does my bike take?" → Convex logs show: orchestrator calls `search_agent`, search agent responds directly (no tool call — general knowledge).
- [ ] "ride to SC and check weather" → Convex logs show: orchestrator calls `routing_agent` first, observes result, then calls `enrichment_agent`. Adaptive sequencing, not rigid.
- [ ] "hello" → Convex logs show: orchestrator responds directly, no sub-agent tool call.

### State-Based Tool Gating
- [ ] When no routes exist in session: orchestrator's tool list contains only `routing_agent` (enrichment_agent not available)
- [ ] When routes exist: orchestrator's tool list contains both `routing_agent` and `enrichment_agent`
- [ ] When pending sketch has failures: orchestrator's tool list contains only `routing_agent`

### Model Assignment
- [ ] Convex logs show orchestrator using frontier model: `provider=anthropic, model=claude-sonnet-4-6`
- [ ] Convex logs show routing agent using Haiku: `provider=anthropic, model=claude-haiku-4-5-20251001`
- [ ] Convex logs show enrichment agent using Haiku: `provider=anthropic, model=claude-haiku-4-5-20251001`
- [ ] Verify sketch quality with Haiku routing agent — if route suggestions are poor (wrong roads, bad segments), flag for Sonnet escalation

### Cost Logging
- [ ] Convex logs show per-agent budget entries: `[BudgetTracker] agent=orchestrator cost=X cumulative=Y`
- [ ] Convex logs show per-agent budget entries: `[BudgetTracker] agent=routing cost=X cumulative=Y`
- [ ] Convex logs show per-agent budget entries: `[BudgetTracker] agent=search cost=X cumulative=Y`
- [ ] Convex logs show per-agent budget entries: `[BudgetTracker] agent=enrichment cost=X cumulative=Y`
- [ ] Budget exceed does NOT throw (log mode) — agent continues running past $0.25
- [ ] Compare total cost vs. pre-refactor (single Sonnet agent): document whether the Haiku sub-agents + Sonnet orchestrator is cheaper overall

### Card Emission
- [ ] Route cards appear in chat transcript after `compileSketch` completes (same as before refactor)
- [ ] Route cards from `planRoute` fallback also appear correctly
- [ ] Card finalization (complete/failed status) works through the sub-agent callback forwarding

### Streaming
- [ ] Orchestrator's final text response streams to the UI (text deltas visible in real-time)
- [ ] Sub-agent text does NOT stream to UI (no duplicate/interleaved text)

### Existing Test Suite
- [ ] `pnpm test convex/actions/agent` — all existing tests pass
- [ ] No regressions in `ridePlanningAgent.test.ts`, `sendMessage.test.ts`, `summarizeForContext.test.ts`, `budgetTracker.test.ts`

## Verification Method

1. Run `pnpm typecheck` — clean
2. Run `pnpm test convex/actions/agent` — all pass
3. Start app with `pnpm dev:client`, open Convex dashboard logs
4. Execute each scenario above, verify logs match expectations
5. Screenshot or paste relevant log lines as evidence per AC

## Files to Read (No Modifications)

This is a verification-only task. Read logs, run tests, report findings.

## Notes

- If attention isolation is violated (routing agent calls enrichment tool or vice versa), that's a blocking bug — the tool shouldn't even be in the sub-agent's toolbox
- If cost logging is missing, check that `BudgetTracker.add()` is being called with `agentLabel` parameter
- If cards don't appear, check that `sendMessage.ts` `TOOL_TO_CARD_KIND` includes `compileSketch`
- Collect cost data from the logs — this informs future decisions about when to flip BudgetTracker back to gate mode and what per-agent limits should be
