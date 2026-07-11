---
service: convex
feature: UC-LIFE-01
priority: P2
type: boundary
tier: holdout
scope: task-local
---

# UC-LIFE-01 edge: hash canonicalization — spurious staleness impossible, real drift always counted

The content hash must be stable across representational noise and sensitive to real change.
Probes on `inputsContentHash`: identical inputs hashed in two separate process runs →
identical digests; object key order shuffled → identical; `55` vs `55.0` and
optional-field-absent vs explicitly-undefined → identical per the canonicalization rule; an
included score changed by 0.0001 → different; promptVersion +1 → different. Then the
catalog-scale invariant: a sweep over an unchanged corpus flags exactly zero new stale
rows — representational noise must never masquerade as drift and trigger paid
regeneration.

**Verify (vitest unit + integration; UNIT_TEST_JUSTIFIED — canonicalization is a pure
transform, zero I/O):**
- All unit probes above pass deterministically.
- Integration (real dev deployment): run the sweep twice back-to-back with no edits in
  between → the second run flags nothing and the stale list is unchanged.
