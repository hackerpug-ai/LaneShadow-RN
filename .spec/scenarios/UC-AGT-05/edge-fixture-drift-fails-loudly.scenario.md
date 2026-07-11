---
service: convex
feature: UC-AGT-05
priority: P1
type: error_handling
tier: holdout
scope: task-local
---

# UC-AGT-05 edge: a stale fixture is a loud failure, not a quiet pass

Eval suites rot from the seams. Change the `searchCuratedRoutes` contract — rename
`radiusMi`, add a required field, alter the result shape — WITHOUT touching the transcript
fixtures. The next `pnpm agent:eval` run must fail loudly and specifically: a
contract-drift error naming the tool and the mismatched field, not a cascade of confusing
grader failures and definitely not a silent pass (the deadliest outcome — a suite that
stopped exercising the real seam but kept reporting green). Fixtures are versioned against
the tool contract, and the harness refuses to replay a fixture whose recorded contract
version no longer matches the live schema.

The sibling failure: delete one fixture file from the canonical set (the SLC/Ogden
transcript). The run must hard-error on the missing canonical fixture — the founder's
failure session is load-bearing and its absence means the suite can no longer make its core
regression promise. And when a replay turn produces MORE tool calls than the fixture
recorded (the agent grew a new habit), the harness surfaces the extra calls as a diff for
review rather than swallowing them.

Verify by making each mutation on a branch and running the harness: three distinct, named
failure modes (contract drift, missing canonical fixture, unexplained extra tool calls) —
each identifying its cause in one line, none passing green.
