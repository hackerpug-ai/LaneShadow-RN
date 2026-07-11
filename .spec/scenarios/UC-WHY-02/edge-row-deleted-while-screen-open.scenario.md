---
service: mobile-app
feature: UC-WHY-02
priority: P1
type: error_handling
tier: holdout
scope: task-local
---

# UC-WHY-02 edge: enrichment disappearing (or arriving) under an open screen degrades live to honest states

A rider is reading an enriched detail screen when the operator clears that route's
enrichment for regeneration (`clearEnrichment` on the live deployment). The reactive query
updates: the paragraph gives way to the absence line without a crash, a spinner, or a
frozen half-state — and the rest of the screen keeps working. The reverse transition holds
too: with the absence line showing on an open screen, seeding a `qa_passed` row makes the
paragraph appear in place. The absence machinery must be honest under live mutation, not
only at first render.

**Verify (e2e, real device Maestro + live Convex, operator mutation mid-flow):**
- With the detail open: run `clearEnrichment` → the section transitions to
  `curated-detail-enrichment-empty`; no red screen; map and scores untouched.
- Seed the row back while the screen is still open →
  `curated-detail-enrichment-paragraph` renders the new text in place.
- Save remains tappable through both transitions.
