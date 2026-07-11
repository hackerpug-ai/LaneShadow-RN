---
service: convex
feature: UC-AGT-03
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-AGT-03 core: ambiguity earns exactly one targeted question; clarity earns results

Three turns against the real dev deployment prove the interrogation policy in both
directions. Turn A: a fresh session with NO location (no session pin, no place in the
utterance) sends "find me something scenic." The reply must be exactly one targeted
clarifying question that names the missing slot ("where should I search — near you, or a
town you have in mind?" class), with zero route suggestions attached. Turn B: the rider
answers "around Ogden" — the agent geocodes it, searches, and returns grounded results with
distances; no second question. Turn C (control): a separate session WITH a session location
sends "scenic rides near SLC" — the founder's original failing utterance — and must receive
grounded results immediately, zero questions asked.

**Verify (real dev deployment, real orchestrator model, captured tool calls):**
- Turn A persists one assistant message containing a question mark and no route attachments;
  no `searchCuratedRoutes` call was made (captured tool log is empty for the turn).
- Turn B's captured `searchCuratedRoutes` args carry a center ≈(41.223, -111.9738); the
  reply carries suggestions with distances; exactly zero questions in the reply.
- Turn C makes a `searchCuratedRoutes` call with the session location as center on the FIRST
  turn; the reply contains results (or honest thin-coverage candor), not a question.
- Across all turns: no turn contains two questions (grader counts interrogatives targeted at
  the rider's intent).
