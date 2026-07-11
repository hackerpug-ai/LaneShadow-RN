---
service: convex
feature: UC-REC-05
priority: P1
type: security
tier: holdout
scope: task-local
---

# UC-REC-05 holdout: nothing in the pipeline can retire routes wholesale or silently

Framed as an abuse/blast-radius test. First: no batch action anywhere in the pipeline
(hygiene, levers, classifier, recompute sweeps) may set `retired` as a side effect — run the
full waterfall plus classifier over a sample containing obvious junk (a freeway row, a
zero-length row, an all-levers-failed row) and assert zero rows acquired `retiredAt` without
a `rejectReviewItem`/`retireRoute` call carrying an explicit reason. Second: the retirement
mutations are internal, operator-only functions — the Clerk-authenticated client surface
exposes no path to them, so a rider session cannot retire (or un-retire) anything. Third:
every retirement that does happen is individually attributable: for each `retired` row there
exists a recorded reason and timestamp, and the count of retired rows exactly equals the
count of recorded founder dispositions — no orphan retirements, no bulk sweep.
