---
service: convex
feature: UC-QUAL-03
priority: P0
type: happy_path
tier: visible
scope: journey
---

# UC-QUAL-03 (JOURNEY J-ENR-OPS): sample batch → QA → couch test → gate green → detail serves the why

The operator ships the first enrichment wave end-to-end on the real dev deployment:
`backfill --sample` generates paragraphs via real GLM-5.2 on the `enrichment` tier
(UC-GEN-01); deterministic lint plus the real cross-provider OpenAI verifier pass them
(UC-QUAL-01); sampleForReview builds the couch sample; the operator records
≥9-of-10-true, zero-fabrication verdicts and the R2 gate computes green (UC-QUAL-03); the
coverage report reflects the new ship-ready rows (UC-LIFE-03); and `getCuratedRouteDetail`
for a sampled routeId now returns the grounded why.

This is a **journey flow** because it spans the whole operator arc: GEN batch → QUAL gates
→ R2 verdict → LIFE coverage → the served detail payload.

**Verify (pipeline acceptance, real dev deployment + real GLM-5.2 + real OpenAI verifier +
operator CLI):**
- Each stage's command exits clean and its state transition is visible in the table
  (`generated` → `qa_passed` → couch verdicts recorded → gate green).
- The coverage report's ship-ready count includes the sampled rows.
- The detail query returns `enrichment.why` (≤320 chars) for a sampled route and exposes
  no `groundingFacts`, `qa`, or `status`.
