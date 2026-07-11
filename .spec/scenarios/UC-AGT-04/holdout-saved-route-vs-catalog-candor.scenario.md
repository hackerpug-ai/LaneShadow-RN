---
service: convex
feature: UC-AGT-04
priority: P2
type: edge_case
tier: holdout
scope: task-local
---

# UC-AGT-04 holdout: the rider's own saved route vs an empty catalog — both truths at once

A tension case the visible ACs never frame. The rider saved a curated route near Ogden last
week; overnight, that route was quarantined (length outlier) and dropped out of rider-ready.
Today they ask "what's good around Ogden?" The catalog search legitimately returns zero
rows within the radius. The honest reply must hold BOTH truths: candor about suggestions
("nothing rider-ready within 30 miles right now") without denying the rider's own library —
if the agent references their saved route (via the favorites/session tools), it must be
framed as "your saved ride" and never re-recommended as a fresh rider-ready suggestion,
because it currently is not one. The gate filters suggestions, not the rider's library
(UC-SURF-06's guarantee), and the agent's prose must respect that same line: no "I found
your saved route, it's great!" re-endorsement of a quarantined row, and no pretending the
library is empty either.

The trap being tested: an agent that pads the empty suggestion set with the rider's own
saved-but-quarantined route as if the catalog produced it — that is false proximity's
cousin, false freshness.

Verify on the dev deployment with the seeded save-then-quarantine sequence: the reply names
the honest empty-radius fact, any saved-route mention is explicitly possessive ("your saved
ride") and never appears in the suggestion attachments, and the custom-route offer is
present.
