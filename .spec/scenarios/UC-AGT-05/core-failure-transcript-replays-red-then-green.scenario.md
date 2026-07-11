---
service: convex
feature: UC-AGT-05
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-AGT-05 core: the founder's failed session is the permanent regression eval

The captured 2026-07-10 session — "What do you think the best ride is in slc" → "OK what's
scenic" → "I want something that twists along side the mountain up in ogden" — lives as a
transcript fixture in the eval harness. `pnpm agent:eval` replays it through the rebuilt
agent with the model signal fixtured at the tool-call seam; tools, gated queries, and
persistence run REAL against the dev deployment. Graders assert engine outcomes per turn:
which tool was selected, that every `searchCuratedRoutes` call carried a center (SLC's
coordinates for the first two turns, Ogden's for the third), and that no reply violates the
behavior policies (asked-when-ambiguous, distance-stated, no-false-proximity). Run against a
recording of the OLD v1 behavior (national/state-best, no center, Capitol Reef as "near
Ogden"), the same graders must go RED — proving the suite detects the original failure, not
just blessing the new code. The operator smoke lane (`pnpm agent:eval --smoke`) runs a
small subset on the real orchestrator model with a spend cap.

**Verify (eval harness vs real dev deployment):**
- `pnpm agent:eval` exits 0 on the rebuilt agent; `agent-evals/report.json` written with
  per-turn grader verdicts.
- Replaying the archived v1 reply set through the graders exits non-zero, naming
  `no-false-proximity` on the Ogden turn (Capitol Reef ≈170 mi presented as near).
- Captured tool args across the three turns show centers ≈(40.76,-111.89), ≈(40.76,-111.89),
  ≈(41.22,-111.97) respectively.
- `pnpm agent:eval --smoke` completes on the real model within the configured spend cap and
  appends its verdicts to the report artifact (SKIP-with-reason acceptable on provider
  outage — never fake success).
