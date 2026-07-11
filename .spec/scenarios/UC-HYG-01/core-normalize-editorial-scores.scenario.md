---
service: convex
feature: UC-HYG-01
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-HYG-01 core: the ÷100 pass puts every editorial score on the 0–1 scale at rest

The prod catalog carries ~103 editorial rows whose compositeScore is stored on a 0–100 scale
(72–90 — Cherohala Skyway at 90 permanently pins the "best" ranking above every honest 0–1
row). The operator runs the score-normalization pass against the real dev deployment. Every
row where `compositeScore > 1` and `scoreScaleNormalizedAt` is absent has its composite and
dimension scores divided by 100 **in the stored document**, and the row is stamped with
`scoreScaleNormalizedAt`. Already-in-scale rows are untouched. The pass reports exactly how
many rows it changed, and that count equals the number of out-of-scale rows it found.

**Verify (real dev deployment, no mocks):**
- `npx convex run curatedGeometryHygiene:normalizeEditorialScores '{}'` → returns
  `{scanned, normalized}` with `normalized` ≈ 103 (the audited out-of-scale count).
- Direct table read of a previously-90-scored row (e.g. the canonical Cherohala Skyway)
  shows `compositeScore = 0.9` (±float) and `scoreScaleNormalizedAt` set — on the document
  itself, not via a read-path transform.
- Full-table assertion: zero `curated_routes` rows with `compositeScore > 1.0`.
- A spot-checked in-scale row (e.g. a 0.6929 BBR row) is byte-identical on its score fields.
