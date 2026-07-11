---
service: mobile-app
feature: UC-WHY-01
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-WHY-01 core: a seeded ship-ready "why" renders between Summary and Scores in the existing detail screen

A test-only internal mutation seeds a `qa_passed` enrichment row (a known 240-char
paragraph) for a known routeId on the real dev deployment — the determinism seam: no LLM
runs in this test. Opening `app/(app)/curated-route/[id].tsx` on a real device shows the
labeled "Why ride it" section between the Summary and Scores sections, containing exactly
the seeded paragraph. The enrichment arrives in the same `getCuratedRouteDetail` response
as everything else, so the screen's single loading gate covers it — no separate enrichment
spinner ever appears, and no new screen or navigation is involved.

**Verify (e2e, real device Maestro + live Convex, seeded rows):**
- `.maestro/enrichment-detail.yaml`: dismiss the dev-client launcher, open the seeded
  route → `curated-detail-enrichment-label` and `curated-detail-enrichment-paragraph`
  visible; the paragraph text equals the seeded text exactly.
- The section sits below Summary and above Scores in the scroll order.
- No enrichment-specific spinner or skeleton is ever shown at any point of the load.
