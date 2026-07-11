---
service: convex
feature: UC-LIFE-03
priority: P2
type: boundary
tier: holdout
scope: task-local
---

# UC-LIFE-03 edge: day-zero corpus and the eligibility denominator

Two boundary probes. Day zero: with `curated_route_enrichments` empty — today's literal
state, 0 documents — the report must return 0 ship-ready, 0%, R1 not met, with absent
equal to the full eligible count: no division-by-zero, no crash, no vacuous green. The
denominator: eligibility means plottable (`geometryStatus === 'generated'`), so routes
without trustworthy geometry must not appear in it — the percentage measures the shippable
catalog, neither flattered nor punished by unplottable rows that can never be enriched.

**Verify (integration, real dev deployment):**
- Against an enrichment-empty deployment: the report returns zeros and a red R1 verdict
  cleanly.
- The reported denominator equals the count of `geometryStatus === 'generated'` routes,
  not the raw catalog size.
- Seeding one `qa_passed` row moves the percentage off zero by exactly one route's worth.
