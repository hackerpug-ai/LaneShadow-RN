---
service: convex
feature: UC-QUAL-02
priority: P1
type: edge_case
tier: holdout
scope: task-local
---

# UC-QUAL-02 edge: tightening the banned list is a versioned event, not a buried prompt edit

The admin adds "bucket-list" to the forbidden hype patterns. That change must land as a new
version of the governed rule artifact: the old version remains readable, rows already
judged keep the version stamp they were checked under, and only verdicts issued after the
change carry the new version. A paragraph containing "a true bucket-list ride" passes under
rules vN and is rejected under vN+1 — proof that verdicts follow the artifact, not
hard-coded strings buried in a prompt or a regex nobody governs.

**Verify (vitest unit + integration on live Convex dev; lint pure, zero I/O):**
- Unit: the same paragraph evaluated against vN passes and against vN+1 rejects with the
  new banned-pattern code.
- Integration: after the bump, a fresh QA sweep stamps new verdicts with vN+1 while
  previously-passed rows retain their vN stamp untouched (no retroactive rewrite).
- The version change itself is a retrievable recorded event.
