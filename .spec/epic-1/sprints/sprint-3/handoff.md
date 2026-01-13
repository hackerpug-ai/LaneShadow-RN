# Sprint 3 Handoff & Coordination

**Sprint**: Sprint 3 — Backend data flows: PlanRide action + providers + overlays

## Active Blockers

- None currently.

## Integration Points

- **Auth**: Use `requireIdentity(ctx)` from `convex/guards.ts` (Sprint 2 handoff).
- **LangChain**: LLM sketching must use LangChain JS agent framework (`createAgent` + `tool` patterns) and structured output per [LangChain JS overview](http://docs.langchain.com/oss/javascript/langchain/overview).
- **Schema strategy**: Co-locate Zod schemas with Convex `v` validators in the same `models/*.ts` files for any shapes passed to the agent/tool layer.

## Decisions Needed

- None currently.

## Cross-Agent Notes

- Sprint 3 introduces `convex/actions/agent/*` module tree; keep it functional/compositional (no class inheritance).
- Avoid action→query/mutation fan-out; keep most orchestration within the action runtime unless cross-runtime boundaries require otherwise.

## Archived Items

- (none)
