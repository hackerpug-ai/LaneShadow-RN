---
service: convex
feature: UC-QUAL-03
priority: P1
type: edge_case
tier: holdout
scope: task-local
---

# UC-QUAL-03 edge: a corpus that cannot satisfy the sample recipe fails loudly, not quietly

The couch sampler is invoked when the QA-passed corpus holds only ONE thin-grounding row —
the recipe demands at least two. This is early-rollout reality, not an exotic state, and
the danger is a sampler that quietly hands back a non-conforming sample the operator then
grades into a hollow green gate. The sampler must either fail with a composition-shortfall
message naming exactly what is missing, or return the sample explicitly annotated as
non-conforming such that R2 cannot be recorded green from it.

**Verify (integration, live Convex dev):**
- Stage a corpus with exactly one thin-grounding `qa_passed` row → sampleForReview output
  names the thin-grounding shortfall.
- No sequence of verdict recordings against that output produces a green R2 gate.
- Add a second thin-grounding `qa_passed` row → the same invocation now succeeds to
  recipe.
