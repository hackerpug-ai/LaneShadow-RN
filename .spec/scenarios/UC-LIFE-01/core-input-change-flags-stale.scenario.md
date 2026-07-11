---
service: convex
feature: UC-LIFE-01
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-LIFE-01 core: editing a grounding input flags the enrichment stale without unpublishing it

A route holds a QA-passed enrichment with its `inputsContentHash` recorded at generation
time. The operator then patches a hash-participating input on the live deployment —
curvatureScore 55 → 82, a Trust-wave-style score edit. The staleness sweep recomputes the
deterministic hash of the current inputs (+ promptVersion + model), sees the mismatch, and
marks the row `stale`. The prior text keeps serving (`qa.verdict: 'pass'` retained), the
route appears in the operator's stale list, and nothing is deleted or hidden. Bumping
`promptVersion` alone also mismatches — prompt and model changes participate in the hash.

**Verify (integration, real dev deployment):**
- Patch the score → run the sweep → the row is `status: 'stale'` and
  `getCuratedRouteDetail` still returns the same `why`.
- The operator's stale list contains the routeId.
- An untouched sibling route is unchanged by the same sweep (hash match).
- A promptVersion bump flags an otherwise-unchanged route stale.
