---
service: convex
feature: UC-LIFE-01
priority: P1
type: edge_case
tier: holdout
scope: task-local
---

# UC-LIFE-01 edge: cosmetic edits stay outside the hash — only admin-included inputs count

Two edits land on two enriched routes on the live deployment: route A gets a change to a
field the admin has excluded from the staleness hash (display-only metadata that never
enters groundingFacts); route B gets a one-point edit to an included dimension score. After
the sweep, A must remain untouched — a cosmetic change that triggered full regeneration
would bleed model spend for nothing — while B flags `stale`. The include/exclude boundary
is the admin-defined participation list, a governed definition, not an accident of which
fields happen to be serialized.

**Verify (integration, real dev deployment):**
- Route A: hash recomputation is identical; status untouched; absent from the stale list.
- Route B: flagged `stale`; present in the stale list; its text still serving.
- The participation definition (included vs excluded inputs) is readable by the admin as
  a governed artifact.
