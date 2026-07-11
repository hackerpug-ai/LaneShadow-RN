---
service: convex
feature: UC-QUAL-03
priority: P1
type: error_handling
tier: holdout
scope: task-local
---

# UC-QUAL-03 edge: a failed sample routes to remediation and the re-run starts honest

After a red gate, one failing enrichment is routed to regeneration (clear → regenerate via
real GLM-5.2 → back through the real grounding and tone QA) and another to a rule change
(its hype pattern added to the versioned banned list, so regeneration must come back
compliant). The gate then re-runs on a fresh sample. Verdicts from the failed round must
not leak into the new computation, the remediated routes re-enter the pool only as newly
QA-passed rows, and the gate can only turn green from the new round's own verdicts.

**Verify (integration + pipeline acceptance, real dev deployment + real GLM-5.2 + real
OpenAI verifier):**
- Post-remediation: the regenerated route holds a new `qa_passed` row (fresh
  `generatedAt`); the rule-change route stays unshippable until its regenerated text
  passes the tightened lint.
- Re-running sampleForReview yields a sample whose computation contains zero verdicts
  carried over from the failed round.
- Recording a full fresh verdict set that meets the condition flips the gate green.
