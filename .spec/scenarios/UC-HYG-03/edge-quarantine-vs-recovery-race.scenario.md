---
service: convex
feature: UC-HYG-03
priority: P1
type: edge_case
tier: holdout
scope: task-local
---

# UC-HYG-03 edge: a 710,430-mile claimed length must not poison the gate it feeds

The worst outlier in the audit claims 710,430 miles. If the levers ran before hygiene, the
deterministic ratio gate (routed ÷ claimed ∈ 0.6–1.6) would be meaningless for that row — any
real road line would "fail" against an absurd denominator and a garbage line could never be
caught by ratio at all. Run the passes in the wrong order deliberately: attempt a lever on
the outlier row *before* `fixLengthOutliers` has flagged it. The pipeline must not admit or
reject on the poisoned ratio; the row either waits for hygiene or is processed in ratio-skip
mode (degenerate + region checks only, routed length becoming the stored truth), and in
neither case does a `generated` row exist whose verification block contains a ratio computed
against 710,430. After hygiene runs, re-processing the same row produces a normal verdict and
the quarantine clears only if the measured length is sane.
