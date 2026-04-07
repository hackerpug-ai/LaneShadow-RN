# US-074: Wire Orchestrator into ridePlanningAgent Wrapper and Update sendMessage

> Epic: 3c — Agent Orchestrator Refactor
> Sequence: 4 (depends on US-073)
> Agent: convex-implementer
> Reviewer: convex-reviewer

## Context

With the orchestrator and sub-agents built, this task guts `ridePlanningAgent.ts` to a thin wrapper that delegates to the orchestrator, and updates `sendMessage.ts` to recognize `compileSketch` as a card-emitting tool.

## Acceptance Criteria

- [ ] `ridePlanningAgent.ts` reduced to ~30 lines:
  - Re-exports types: `AgentContext`, `ExecuteContext`, `ToolResult`
  - Re-exports `extractRouteAttachments` (or its replacement from orchestrator)
  - `executeRidePlanningAgent` delegates to `executeOrchestrator` — one-line function body
  - `buildSystemPrompt` export preserved for test backward compatibility (delegates to orchestrator prompt builder or is deleted if no tests reference it)
  - All tool handlers, tool registry, `executeTool`, `PendingSketchState`, stub handlers **deleted**
- [ ] `sendMessage.ts` `TOOL_TO_CARD_KIND` updated:
  - Added: `compileSketch: 'routing_card'` (routing agent uses compileSketch to create routes)
  - `planRoute: 'routing_card'` kept (still used by routing agent's fallback path)
- [ ] `summarizeForContext.ts` updated:
  - Line 121: condition expanded to `toolName === 'planRoute' || toolName === 'compileSketch'`
  - `compileSketch` results have the same `{ type: 'routes', data, routePlanId }` shape — same summarization logic applies
- [ ] Import path in `sendMessage.ts` unchanged (still imports from `./ridePlanningAgent` — wrapper re-exports)
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes (if configured)
- [ ] Existing tests in `__tests__/ridePlanningAgent.test.ts` pass through the wrapper
- [ ] Existing tests in `__tests__/sendMessage.test.ts` pass unchanged
- [ ] Existing tests in `__tests__/summarizeForContext.test.ts` pass, with new test case for `compileSketch`

## Files to Modify

| File | Change |
|------|--------|
| `convex/actions/agent/ridePlanningAgent.ts` | Gut to thin wrapper (~1200 → ~30 lines) |
| `convex/actions/agent/sendMessage.ts` | Add `compileSketch` to `TOOL_TO_CARD_KIND` |
| `convex/actions/agent/lib/summarizeForContext.ts` | Add `compileSketch` to condition |
| `convex/actions/agent/__tests__/summarizeForContext.test.ts` | Add `compileSketch` test case |

## Implementation Notes

- This is a high-risk task — it's the moment the old monolith is replaced. Run all tests before and after.
- If `buildSystemPrompt` is referenced by tests, keep a re-export that calls `buildOrchestratorPrompt`. If not referenced, delete it.
- The `extractRouteAttachments` function changes shape: it now reads `RoutingAgentResult` objects from tool results, not raw `planRoute`/`compileSketch` results. The new version lives in `orchestrator.ts` as `extractAttachmentsFromSubAgentResults`. The old `extractRouteAttachments` can be deleted or re-exported as an alias.
- Check `__tests__/ridePlanningAgent.test.ts` to understand what it mocks — if it mocks `runAgent` or pi-ai, the wrapper should still work. If it directly tests tool handlers that moved, those tests need to move too.
