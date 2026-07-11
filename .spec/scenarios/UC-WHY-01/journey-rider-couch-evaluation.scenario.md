---
service: mobile-app
feature: UC-WHY-01
priority: P0
type: happy_path
tier: visible
scope: journey
---

# UC-WHY-01 (JOURNEY J-ENR-RIDER): couch evaluation — discover, read the why, save

The couch-evaluation arc that enrichment exists to serve: a rider browsing the plan view
finds a curated road, taps into the detail screen, reads the grounded "why this road is
worth riding" between the summary and the score bars, believes it, and saves the route for
a future ride. Runs against seeded `qa_passed` rows on the real dev deployment — the
determinism seam; no live generation — on a real device.

This is a **journey flow** because it spans the MVP discovery arc (plan view → detail
open) plus UC-WHY-01 (render) and UC-WHY-02's absence sibling on a second, unenriched
route in the same session.

**Verify (e2e, real device Maestro + live Convex, seeded rows):**
- Plan view → tap the seeded curated road → detail opens;
  `curated-detail-enrichment-paragraph` shows the seeded why between Summary and Scores.
- Tap Save → the route lands in the rider's saved state via the existing save affordance.
- Open a second route with no enrichment row → the "No write-up yet" absence renders and
  Save still works there too.
