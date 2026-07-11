---
service: convex
feature: UC-GEN-02
priority: P1
type: error_handling
tier: holdout
scope: task-local
---

# UC-GEN-02 edge: a model refusal or empty completion becomes a recorded state, never a silent skip

For an extremely sparse route the model may return an empty string, a refusal ("I don't
have enough information about this road…"), or skip the forced tool call entirely. Whatever
comes back, the route must land in a retrievable recorded state — `abstained` (engine
judged the facts insufficient) or `failed` (unusable completion) with a reason — and no row
may ever exist whose `whyText` is empty or refusal-flavored. The batch keeps processing the
routes after it; the tally accounts for every route in the page.

**Verify (pipeline acceptance, real dev deployment + real GLM-5.2):**
- After a batch containing such a route: `enrichmentStatus` is `abstained` or `failed`
  with a retrievable reason; the coverage report reflects it.
- `curated_route_enrichments` holds no row with empty `whyText` and none beginning with a
  refusal phrase ("I don't have", "I cannot", "As an AI").
- The batch result's `perRoute[]` names the route explicitly — no route in the input page
  is simply missing from the summary.
