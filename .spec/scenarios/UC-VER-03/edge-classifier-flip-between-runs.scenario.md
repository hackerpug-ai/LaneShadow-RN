---
service: convex
feature: UC-VER-03
priority: P1
type: edge_case
tier: holdout
scope: task-local
---

# UC-VER-03 edge: a verdict that flips on re-classification must move the flag with it

The classifier is probabilistic: the same borderline route (say a scenic-but-divided parkway)
can come back `ride` today and `marginal` or `not_a_ride` next week. Re-run classification
over a route that already holds a verdict and let the verdict change. The stored object must
be replaced wholesale — new verdict, new reason, new timestamp — never merged into a
contradictory hybrid, and the rider-ready flag must recompute in the same operation: a flip
to `not_a_ride` pulls a previously-suggested route out of every surface on the next query,
and a flip back restores it without any founder intervention. The prior verdict does not
linger anywhere the read path consults. Also cover the do-nothing case: re-classifying with
an identical verdict must not churn `classifiedAt` into a fake freshness signal if the
implementation chooses to skip identical writes — whichever behavior ships, the coverage
report's classified-count stays truthful.
