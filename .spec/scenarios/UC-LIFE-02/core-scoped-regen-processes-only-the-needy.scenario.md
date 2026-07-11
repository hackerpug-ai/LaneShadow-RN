---
service: convex
feature: UC-LIFE-02
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-LIFE-02 core: scoped regeneration touches stale/failed/new only — current rows cost nothing

Four routes are staged on the real dev deployment: A `stale` (input drift), B `failed`
(prior provider error), C newly added (no enrichment yet), D `qa_passed` with a current
hash. The operator triggers scoped regeneration. A, B, and C run through real GLM-5.2
generation and back through the full grounding + tone QA gates before any becomes
ship-ready; D is skipped by hash match with zero model spend. A's stale flag and B's
failed flag clear only when their regenerated whys pass QA. A single named route can also
be regenerated on demand through the same path as a spot fix.

**Verify (pipeline acceptance, real dev deployment + real GLM-5.2 + real OpenAI
verifier):**
- The run's perRoute output: D skipped (no spend), A/B/C generated and then QA'd.
- A and B's flags clear only after `qa_passed`; C follows the normal generated → QA flow.
- `generateForRoute({routeId})` on one named current route regenerates just that route.
