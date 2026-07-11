---
service: mobile-app
feature: UC-WHY-01
priority: P1
type: edge_case
tier: holdout
scope: task-local
---

# UC-WHY-01 edge: the servable-state matrix — stale-with-prior-pass serves, everything unpassed hides

Rows are seeded for four known routes on the real dev deployment, each with distinct
recognizable text: `qa_passed`; `stale` with `qa.verdict: 'pass'` (inputs drifted after a
pass); `generated` (never verified); `qa_failed` (rejected text still in the table).
Opening each detail on a real device: the first two show their paragraphs — the stale row
keeps serving its last passed text, staleness being rider-invisible — while the last two
show the absence state and never a single word of the unverified or rejected text, even
though rows physically exist for them.

**Verify (e2e, real device Maestro + live Convex, seeded rows):**
- The qa_passed and stale-with-pass routes → `curated-detail-enrichment-paragraph` shows
  each row's own text.
- The generated and qa_failed routes → `curated-detail-enrichment-empty` shows; their
  seeded texts appear nowhere in the rendered screen.
- Cleanup removes the four seeded rows.
