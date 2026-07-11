---
service: convex
feature: UC-LIFE-02
priority: P1
type: edge_case
tier: holdout
scope: task-local
---

# UC-LIFE-02 edge: a regeneration that cannot pass QA does not count as remediation

A stale route is regenerated, but its QA leg is forced to fail closed (the verifier
credential invalidated for this run — the same fail-closed posture as a real outage). The
regenerated candidate must not ship: the route's last QA-passed text keeps serving on the
detail query, the stale flag does NOT clear, and the route stays in the operator's
needs-work lists. Remediation is defined by QA green, not by the model having produced new
words. Restoring the verifier and re-running QA completes the cycle and only then swaps
the served text.

**Verify (pipeline acceptance, real dev deployment + real GLM-5.2):**
- After the failed-QA regeneration: the detail query still serves the prior passed text;
  the stale flag survives.
- The candidate verdict is fail-closed (`qa_failed` with a verifier-error reason) and is
  never served.
- Restored-key QA re-run → the flag clears and the new text takes over on the detail
  query.
