---
service: convex
feature: UC-SURF-02
priority: P1
type: edge_case
tier: holdout
scope: task-local
---

# UC-SURF-02 edge: three good routes against a request for ten

A rider asks for ten twisty routes near a region that holds exactly three rider-ready
matches and forty non-ready ones. The tool must return the three and stop — an honest partial
— rather than quietly widening the radius, relaxing the gate, or topping up from the
non-ready forty to hit the requested count. Whatever accompanying text the agent produces,
the persisted `route_plans.result.options` array length is 3 and every entry is rider-ready.
Now shrink to the boundary: exactly one rider-ready match. A single-suggestion response still
renders as a suggestion (one pill, one plottable line), not as a degraded error. And the
pathological request shapes — limit of 0, a limit above the 200-candidate window, an intent
with an unknown archetype string — each resolve to defined, gate-respecting behavior: no
crash, no fallback resurrection, options.length always ≤ the rider-ready count in range.
