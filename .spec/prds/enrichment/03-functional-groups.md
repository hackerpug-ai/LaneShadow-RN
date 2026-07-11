---
stability: FEATURE_SPEC
last_validated: 2026-07-10
prd_version: 1.0.0
---

# Functional Groups

| Group | Prefix | Description |
|-------|--------|-------------|
| Enrichment Generation | GEN | The batch, text-first pipeline composing one grounded "why" paragraph per route from that route's structured inputs (geometry-derived curvature, length, scores, archetype, region, source snippets), on the z.ai GLM-5.2 enrichment tier. Owns honest thin-grounding handling, abstention, failure isolation, and the vision-ready grounding snapshot. |
| Quality Gate & Couch Test | QUAL | The trust layer: deterministic lint (length/format, banned claims, score-consistency), the cross-provider LLM grounding verifier (every claim ↔ input fact), and the R2 human couch-test ship gate. Nothing reaches riders without clearing all three. |
| Rider-Facing "Why" Rendering | WHY | Everything the rider sees: the "Why ride it" section inside the existing `curated-route/[id]` detail screen, honest absence, provenance caption, rider-invisible staleness, error-collapse. No new screens. |
| Enrichment Lifecycle & Ops | LIFE | Keeping the corpus honest over time: content-hash staleness detection, scoped + idempotent regeneration, and the operator coverage/health report that makes R1 a measured fact. |

## Use Case Summary

| Group | Prefix | Use Cases |
|-------|--------|-----------|
| Enrichment Generation | GEN | 3 (UC-GEN-01 … UC-GEN-03) |
| Quality Gate & Couch Test | QUAL | 3 (UC-QUAL-01 … UC-QUAL-03) |
| Rider-Facing "Why" Rendering | WHY | 3 (UC-WHY-01 … UC-WHY-03) |
| Enrichment Lifecycle & Ops | LIFE | 3 (UC-LIFE-01 … UC-LIFE-03) |
| **Total** | | **12** |

**Prefix collision check:** existing MVP prefixes are DATA, DISC, DTL, SAVE — GEN, QUAL,
WHY, LIFE are all clear.
