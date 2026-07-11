---
service: convex
feature: UC-AGT-03
priority: P1
type: edge_case
tier: holdout
scope: task-local
---

# UC-AGT-03 edge: the rider who won't answer still gets an honest best effort

The agent asks its one clarifying question ("where should I search?") and the rider brushes
it off: "idk man just show me something good." No location slot was filled, no session pin
exists. The policy's escape hatch must fire: instead of re-asking (interrogation loop) or
refusing, the agent proceeds best-effort — a national or wide-area search — and the reply
must LABEL the widening honestly ("here are top-rated rides across the country — tell me a
town and I'll narrow it down") with every suggestion carrying whatever distance context
exists (or explicitly none). The follow-up matters too: if the rider then says "Boise,"
the agent must use it immediately without re-asking anything.

A different rider answers the question with garbage ("near the moon"). The geocoder fails;
the agent gets ONE more move, and it must not be the same question again — acceptable is a
best-effort labeled wide search or a differently-framed nudge, but the same question twice
in a row is a policy violation.

Verify from persisted transcripts: after a declined question the next assistant message
contains suggestions with an explicit wide-search label and no interrogative aimed at
location; after "Boise," the captured tool center sits in Idaho; no session ever shows the
same clarifying question twice consecutively.
