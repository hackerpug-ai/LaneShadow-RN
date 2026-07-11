---
service: mobile-app
feature: UC-WHY-02
priority: P2
type: boundary
tier: holdout
scope: task-local
---

# UC-WHY-02 edge: the absence path holds up across rapid catalog browsing

Early rollout means nearly every route is in the absence state, and the rider behavior that
stresses it is rapid-fire browsing: opening and backing out of many detail screens in one
session. Fifteen routes — deliberately including several from the ~32% that also lack a
summary, exercising the collapsed-absence path repeatedly — are opened back-to-back on a
real device. Every screen renders its honest absence without a crash, a leaked spinner
from a previous route, a blank section, or a mis-collapsed double line, and navigation
stays responsive throughout.

**Verify (e2e, real device Maestro + live Convex):**
- Loop 15×: open detail → assert `curated-detail-enrichment-empty` (or the single
  collapsed line where the summary is also missing) → back; zero crashes.
- No screen ever shows two stacked absence lines; none shows a spinner in the why
  section.
- The final route in the loop renders as cleanly as the first (no degradation).
