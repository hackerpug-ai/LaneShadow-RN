---
service: convex
feature: UC-AGT-01
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-AGT-01 core: one Mastra loop serves discovery, routing, search, and enrichment

The rebuilt conversation layer — a single `@mastra/core` Agent constructed inside the
existing `'use node'` `sendMessage` action, resolved through the new `orchestrator` tier
(Sonnet-class) — handles all four request classes end to end against the real dev
deployment. The deterministic route pipeline (geocode → sketch → compile) runs as agent
tools, unchanged: "Slc to park city" is the preserved-pipeline control and must behave
exactly as it did before the rebuild. In-session memory carries context: after an SLC-area
turn, "OK what's scenic" searches near SLC without re-asking. The orchestrator dispatch,
its sub-agent meta-tools, and `runAgent.ts` are gone from the call path.

**Verify (real dev deployment, real orchestrator model):**
- Send four messages in one session: "Slc to park city" (routing), "OK what's scenic"
  (discovery), "any gas near the route" (search), "how twisty is it" (enrichment) — each
  completes with a persisted assistant reply via the existing session-message path.
- The routing turn persists a compiled route plan with a real polyline (parity with the
  pre-rebuild control).
- The discovery turn's captured `searchCuratedRoutes` args carry a center within ~25 mi of
  SLC (40.7608, -111.891) — memory carried the location; no clarifying question was asked.
- Captured traces show tool calls from ONE agent loop; no `routing_agent`/`discovery_agent`
  meta-tool names appear anywhere in the turn.
- `getAgentModel`-equivalent tier resolution: the conversation ran on the `orchestrator`
  tier; `grep` confirms no provider/model literals outside the tier map.
