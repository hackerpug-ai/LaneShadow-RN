---
service: mobile-app
feature: UC-WHY-03
priority: P1
type: edge_case
tier: holdout
scope: task-local
---

# UC-WHY-03 edge: marking a row stale while it is being read changes nothing on screen

With an enriched detail screen open and its paragraph rendered on a real device, the
operator flags that row stale on the live deployment (`patchEnrichmentStatus('stale')` —
inputs drifted, the prior QA pass retained). The reactive update must be a rider non-event:
the paragraph does not vanish, flicker to the absence line, or grow any badge; the
provenance caption stays put; the text keeps serving exactly as before while regeneration
queues backstage. Staleness is bookkeeping, and bookkeeping must be invisible from the
couch.

**Verify (e2e, real device Maestro + live Convex, operator mutation mid-flow):**
- Before and after the mutation: `curated-detail-enrichment-paragraph` shows the identical
  text; no new UI element appears anywhere in the section.
- A fresh cold navigation to the same route still serves the same paragraph and caption.
- Cleanup restores the row's original status.
