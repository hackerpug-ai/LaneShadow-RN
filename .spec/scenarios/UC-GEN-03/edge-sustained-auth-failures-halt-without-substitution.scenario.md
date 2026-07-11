---
service: convex
feature: UC-GEN-03
priority: P1
type: error_handling
tier: holdout
scope: task-local
---

# UC-GEN-03 edge: sustained provider auth failures halt the batch — no silent model swap

The batch is run with the z.ai credential deliberately invalidated on the dev deployment —
the same failure surface as FIX-001's 429-insufficient-balance, but reached via auth
instead of balance, so a pass here can't be a memorized 429 handler. After the configured
number of consecutive provider errors the run halts and says so. It does not fall back to
another provider or model; routes beyond the halt point are left exactly as they were
(absent stays absent); and no row anywhere records a `model` other than the `enrichment`
tier's configured GLM-5.2.

**Verify (pipeline acceptance, real dev deployment, real provider auth path):**
- Run with the broken key → the action result names a consecutive-error halt; processed
  count is smaller than the page size.
- Sweep `curated_route_enrichments`: zero rows whose `model` differs from the enrichment
  tier's configured value.
- Restore the key → re-running the same command resumes and completes the routes past the
  halt point.
