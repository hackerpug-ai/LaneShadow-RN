---
service: convex
feature: UC-QUAL-03
priority: P2
type: boundary
tier: holdout
scope: task-local
---

# UC-QUAL-03 edge: gate arithmetic at its exact edges

Three verdict sets probe the pass condition's borders on a ten-row sample: (a) 9 true +
1 off, zero fabrications → green — the minimum pass; (b) 8 true + 2 off → red — one short
of the count; (c) 9 true + 1 'wrong' (a fabricated specific) → red — the automatic-fail
clause beats any count. And a correction path: re-reviewing a road (recording a second
verdict for the same routeId) must leave exactly one authoritative verdict per route in the
computation — the sample size stays 10, and the corrected verdict is the one that counts.

**Verify (integration, live Convex dev):**
- Apply verdict sets (a) / (b) / (c) in sequence, recomputing after each → green / red /
  red.
- Double-record one route (off → true) → the recomputed gate uses the corrected verdict
  and still divides by 10, not 11.
