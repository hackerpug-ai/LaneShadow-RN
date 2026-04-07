# Attention-Driven Agent Design

> AI doesn't fail because it's malicious — it fails because it gets distracted.

## The Problem

LaneShadow's ride planning agent was a single ReAct loop with 14 tools and a 60-line system prompt covering two distinct phases (route creation and route enrichment). The model held all guidance in attention simultaneously, even when most of it was irrelevant to the current decision.

The symptoms weren't "disobedience" — the model wasn't ignoring instructions. It was juggling too many instructions at once. A rider asking "is this road twisty?" forced the model to evaluate all 14 tools (including route creation tools it didn't need) while holding Phase 1 sketch-authoring rules, Phase 2 enrichment rules, error handling, and presentation guidance in context simultaneously.

Performance degraded not because the model was dumb, but because its attention was spread thin.

## The Core Insight

**Agent performance is about attention, not obedience.**

Intelligence or reasoning only comes into play as the number of things being juggled increases. A model with 4 tools and a 15-line prompt doesn't need to be "smarter" than one with 14 tools and a 60-line prompt — it just isn't splitting focus.

This reframes every agent design decision:

| Traditional framing | Attention framing |
|---|---|
| "The model isn't following my instructions" | "The model has too many instructions to hold at once" |
| "I need a smarter model" | "I need a narrower task" |
| "Add more detail to the prompt" | "Remove irrelevant context from the prompt" |
| "The model keeps calling the wrong tools" | "The model has too many tools to evaluate per step" |

## Key Principles

### 1. One Agent, One Task

Every agent is defined by exactly three properties:

| Property | Description |
|----------|-------------|
| **Role** | The single job this agent exists to do |
| **Terminal Condition** | The specific thing it's solving for — when this is met, the loop exits |
| **Tools** | A discrete, minimal set of resources it can use |

If an agent needs two creative decisions, those are two agent calls. The first completes and narrows the context before the second starts.

### 2. Narrow the Toolbox, Not the Instructions

Prompt instructions saying "don't use these tools in this phase" still require the model to hold those tools in attention to know which ones to avoid. Removing the tools entirely means the model literally cannot wander — it terminates because it runs out of relevant tools, not because it decides to stop.

This is the difference between:
- **Obedience**: "Here are 14 tools, but only use these 4 right now" (model must track which 10 to avoid)
- **Attention**: "Here are 4 tools" (model evaluates 4 things, period)

### 3. Deterministic Wrapping, Probabilistic Core

State machines, retry logic, caching, and diffing are code. The LLM makes creative decisions inside those mechanical frames.

The model should never track:
- Which segments succeeded vs. failed in a compilation retry
- Whether a route exists in the current session
- How many retry attempts remain

Code tracks these deterministically and tells the model only what it needs to know for its next creative decision.

### 4. Bounded Interfaces Between Agents

Each agent returns a structured result with a small number of cases. The calling agent handles all cases without understanding internals.

```
route_ready | needs_clarification | failed
```

Three cases. Bounded. The orchestrator can handle all three without understanding compilation mechanics, segment caching, or retry logic.

## What We Did

### Before: Monolithic Agent

```
ridePlanningAgent (1 ReAct loop, 14 tools, 60-line prompt)
  ├─ geocode, createRouteSketch, compileSketch, planRoute
  ├─ lookupRoad, getCurvature, checkSurface
  ├─ getElevation, searchAlongRoute, getRouteWeather
  ├─ getUserFavorites, fetchWeather, saveRoute, searchFavorites
  └─ System prompt covers Phase 1 + Phase 2 + error handling + presentation
```

### After: Orchestrator + Focused Sub-Agents

```
Orchestrator (ReAct loop, 3 tools, 15-line prompt)
  ├─ routing_agent   → 4 tools, 30-line prompt, Haiku
  ├─ search_agent    → 3 tools, 15-line prompt, Haiku
  └─ enrichment_agent → 7 tools, 15-line prompt, Haiku
```

The orchestrator is a ReAct loop — no rigid phase sequence. It reasons about rider intent and picks the right sub-agent. A deterministic pre-check removes tools that are structurally impossible (can't enrich a route that doesn't exist), but the LLM decides the order.

### Model Selection as Attention Corollary

The orchestrator uses the frontier model (Sonnet) because intent classification and result synthesis require the most reasoning. Sub-agents use Haiku because their narrow toolboxes and focused prompts compensate for the smaller model — the toolbox does the work that a bigger model would otherwise need intelligence for.

| Agent | Model | Attention Load | Tools |
|-------|-------|---------------|-------|
| Orchestrator | Sonnet (frontier) | Very low — 3 tool choices | routing, search, enrichment agents |
| Routing | Haiku | Medium — one creative job | geocode, sketch, compile, planRoute |
| Search | Haiku | Low — classify + dispatch | searchNearby, webSearch, geocode |
| Enrichment | Haiku | Low — classify + dispatch | 7 route analysis tools |

## Patterns That Emerged

### The While-Loop Mental Model

An agent is an endless composition of while-loops with tools, ideally with a terminal end. A good loop has a small toolbox, a clear exit, and narrow context per iteration. A bad loop has a big toolbox, a fuzzy exit, and accumulating context.

### Terminal Conditions Have Three Classes

1. **Correct termination** — the agent's specific condition is met
2. **Escalation** — the agent can't resolve alone and returns control with a structured reason
3. **Safety ceiling** — step budget or timeout (deterministic guardrails, not the intended exit path)

Only (1) is actually correct. (2) and (3) are safety nets.

### Dynamic Prompt Narrowing > Static Phase Instructions

Instead of one prompt covering all phases, build the prompt per-phase using deterministic session state:

- No routes exist → routing-only prompt
- Routes exist + question intent → enrichment-only prompt
- Pending sketch with failures → retry-specific prompt

These signals are bounded — you could write a test for every case. The LLM never decides which mode it's in; the code does.

### Cost Gates as Loggers (Until You Have Data)

We don't know what each optimal step costs in the multi-agent architecture yet. The BudgetTracker was converted from a hard gate (throw on exceed) to a per-agent logger. The gate API is preserved — flip back to `'gate'` mode when cost data informs per-agent limits.

## Architectural References

- [Orchestrator Pattern](https://www.jayminwest.com/agentic-engineering-book/6-patterns/3-orchestrator-pattern) — state-based gating, context isolation, capability minimization
- [ReAct Pattern](https://www.jayminwest.com/agentic-engineering-book/6-patterns/5-react-pattern) — adaptive behavior, no predetermined sequence, grounded decisions
- [Model Selection](https://www.jayminwest.com/agentic-engineering-book/3-model/1-model-selection) — frontier for orchestration, downgrade sub-agents only with evidence
- `docs/AGENT-ARCHITECTURE.md` — agent definitions, model selection, attention budget model
- `convex/actions/agent/CLAUDE.md` — One Agent, One Task principle
- `convex/actions/agent/AGENT_DECISION_FRAMEWORK.md` — when to use LLM vs deterministic logic

## Open Questions

<!-- TODO: flesh out these sections -->

- How do you measure attention empirically? (Token-level attention weights aren't accessible via API — proxy metrics needed)
- At what tool count does attention degradation become measurable? (4 → 7 → 14 — where's the cliff?)
- Does extended thinking (chain-of-thought) compensate for attention load, or just add tokens?
- How does conversation length interact with attention? (Does a 30-message session degrade tool selection even with narrow toolboxes?)
