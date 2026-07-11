---
service: convex
feature: UC-AGT-01
priority: P1
type: error_handling
tier: holdout
scope: task-local
---

# UC-AGT-01 edge: the orchestrator model goes down mid-conversation

The rider is mid-session — a route already compiled, a discovery reply already served — and
the orchestrator provider starts returning 429/5xx (the exact failure class that originally
pushed the old stack onto its gpt-4.1 emergency fallback). The agent must fail the TURN, not
the session: the rider sees the existing error message path (a plain "something went wrong,
try again" class reply), no half-written assistant message is persisted, no tool side
effects from the aborted turn leak into the session, and no reply is fabricated without the
model. The next turn, with the provider healthy again, works normally and still has the
session's memory (the earlier compiled route is still referenced correctly). At no point
does the system silently swap to a different, unconfigured model outside the tier map — the
tier map is the only place a fallback could be declared, and if none is declared there, the
honest failure is the correct behavior.

Verify by pointing the `orchestrator` tier at an invalid model id for one turn on the dev
deployment: the turn errors cleanly with a recorded failure, the session transcript shows no
partial assistant text, and reverting the tier restores normal operation with prior context
intact.
