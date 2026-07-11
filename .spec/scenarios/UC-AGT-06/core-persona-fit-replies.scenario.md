---
service: convex
feature: UC-AGT-06
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-AGT-06 core: replies are shaped to the rider — concise, honest about comfort, shareable

A rider with a known session location asks for "an easy scenic ride, nothing too technical,
no highways" in a region seeded with 10+ rider-ready routes on the real dev deployment —
including one road with a high stored technical score and one flagged as highway-heavy. The
agent replies with at most three suggestions, each with a one-line reason and its real
distance. The high-technical road is either absent or presented honestly (never labeled
easy); the highway-heavy road is absent. A follow-up "tell me more about the first one"
returns deeper detail (scores, length, surface) sourced from tool results. Two turns later
the rider asks for "another option" without restating constraints — the no-highways and
nothing-technical filters still shape the answer. Every suggestion closes with the
saveable/shareable next step through the existing card affordances.

**Verify (fixtured-seam replay + real dev deployment tools):**
- `pnpm agent:eval` on the persona-fit fixture → grader asserts: ≤3 suggestions in the first
  reply, each with a reason and `distanceMi` sourced from `searchCuratedRoutes` output.
- The seeded high-technical route is never described with easy/beginner language (grader
  cross-checks reply adjectives against stored `technicalScore`).
- Turn-3 captured tool args/selection still honor "no highways" + "nothing technical"
  without restatement.
- The reply's closing action maps to the existing save/share card contract
  (`route_plans.result.options` entry present for each suggestion).
