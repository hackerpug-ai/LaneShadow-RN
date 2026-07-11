---
service: mobile-app
feature: UC-WHY-03
priority: P2
type: boundary
tier: holdout
scope: task-local
---

# UC-WHY-03 edge: the caption survives maximum OS font scaling on a small screen

Accessibility text scaling is where small always-on captions quietly die. With the device
set to its maximum OS font scale on a small-screen profile, an enriched route's detail
screen must still show the provenance caption completely — unclipped, not overlapped by
the paragraph above or the Scores section below, and not ellipsized into meaninglessness.
The caption remains the single source-agnostic sentence for both sourced and
attribute-only rows at every scale; the transparency promise cannot be conditional on
eyesight.

**Verify (e2e, real device Maestro + live Convex, seeded rows):**
- At max font scale: `curated-detail-enrichment-provenance` visible; the full caption text
  is asserted, not a prefix.
- Layout probe: the caption does not overlap adjacent sections; the screen scrolls to
  reveal it fully.
- Font scale is reset after the flow.
