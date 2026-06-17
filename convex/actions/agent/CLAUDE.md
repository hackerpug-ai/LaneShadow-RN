# Agent Development Rules

## One Agent, One Task

Every agent gets one job. If it needs two creative decisions, those are two agent calls.

### Task Boundary Definition

The upper bound for "one task" remains poorly defined. Current practice suggests prompts of 1,000-2,000 lines work reliably, with potential extension to 5,000+ lines depending on task structure and context availability.

Task boundaries depend more on **coherence** than size. A well-scoped refactoring across 10 files may succeed where a vague "improve the codebase" request fails, regardless of token count.

### Handling Mid-Execution Scope Growth

When a task proves larger than initially scoped:

1. **Kill and rescope** — Stop the current agent, clear its work, break the original task into smaller focused parts
2. **Evaluate salvage cost** — Restarting is almost always cheaper than using additional agents to rescue degraded work
3. **Learn from the failure** — Adjust scoping heuristics for future similar tasks

The bias toward restarting reflects context economics: fresh agents start with clean context budgets, while salvage operations compound existing context bloat.

### Task Type Variations

This principle varies by task type. The focus here remains coding-specific workflows. Other domains (creative writing, research synthesis, conversational support) may exhibit different task boundary patterns.

## Pi Agent Architecture

All pi agents in this directory follow the three-property model defined in `docs/AGENT-ARCHITECTURE.md`:

| Property | Description |
|----------|-------------|
| **Role** | The single job this agent exists to do |
| **Terminal Condition** | The specific thing it's solving for — when this is met, the loop exits |
| **Tools** | A discrete, minimal set of resources it can use |

- `runAgent.ts` is the generic ReAct loop — domain-free, reusable by any agent
- `ridePlanningAgent.ts` is the current monolithic agent (refactor target — see `docs/AGENT-ARCHITECTURE.md` for the hierarchical decomposition plan)
- Tool handlers (`tools/`) are pure domain logic, wired to agents via the executor closure
- Deterministic logic (retry state machines, segment caching, context trimming) wraps the probabilistic core — never the other way around
