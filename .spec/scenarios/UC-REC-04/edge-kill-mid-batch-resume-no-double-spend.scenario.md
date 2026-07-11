---
service: convex
feature: UC-REC-04
priority: P1
type: error_handling
tier: holdout
scope: task-local
---

# UC-REC-04 edge: Ctrl-C halfway through the paid lever, resume without paying twice

The operator starts a lever-2 batch (`--sample=20`) and kills the driver process after
roughly half the routes have persisted results. Money is on the line here: each processed
route cost real LLM and Google calls (~$0.07). Re-running the same command must pick up from
the cursor (or re-scan and skip): every route that already reached a terminal state keeps its
original `verification.verifiedAt` timestamp — the proof it was skipped rather than
re-reconstructed and re-billed — and no route ends up with two side-table geometry rows or a
mixed provenance. The combined runs' totals converge to what one uninterrupted run would have
produced. The same discipline holds if the kill lands mid-route (between the LLM call and the
persist): that route simply reprocesses on resume — one incomplete attempt's API spend is the
acceptable cost; a corrupted half-written row is not, and none may exist.
