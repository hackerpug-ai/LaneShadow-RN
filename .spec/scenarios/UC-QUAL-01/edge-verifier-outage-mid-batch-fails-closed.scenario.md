---
service: convex
feature: UC-QUAL-01
priority: P1
type: error_handling
tier: holdout
scope: task-local
---

# UC-QUAL-01 edge: a verifier outage mid-batch fails closed for the unverified remainder

A QA batch starts over several `generated` rows; partway through, the OpenAI credential is
invalidated (a mid-run provider outage, staged on the real auth path). Rows verified before
the break keep their earned verdicts. Every row the verifier could not judge lands
`qa_failed` with a retryable, verifier-error-flavored reason — fail-closed — rather than
staying `generated` in limbo or being waved through unverified. None of the fail-closed
rows is ever served. With the key restored, re-running QA clears them on their merits.

**Verify (pipeline acceptance, real dev deployment + real OpenAI verifier):**
- Post-outage sweep of the processed page: zero rows remain `generated`; fail-closed rows
  are `qa_failed` with a verifier-error reason distinct from a grounding rejection.
- `getCuratedRouteDetail` serves none of the fail-closed rows.
- Restored-key re-run flips the genuinely grounded rows to `qa_passed`.
