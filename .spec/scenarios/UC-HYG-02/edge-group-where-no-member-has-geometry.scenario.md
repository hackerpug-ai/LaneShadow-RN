---
service: convex
feature: UC-HYG-02
priority: P1
type: edge_case
tier: holdout
scope: task-local
---

# UC-HYG-02 edge: a duplicate group where every member is a centroid dot still merges sanely

Some duplicate groups have no gate-passing member at all — every copy is centroid-only (the
famous-roads editorial set is exactly this before the levers run). The dedup pass cannot use
"has geometry" as the tiebreak, so it must fall back to the highest composite score alone and
still pick exactly one canonical, never zero and never two. The shadows are marked as usual.
Later, when the rescue waterfall recovers geometry for that group's canonical, the recovered
line lands on the canonical row — not on a shadow — and the group surfaces as one rider-ready
route. A second dedup run after the recovery does not re-shuffle the canonical choice (the
merge is stable across reruns even though the geometry facts changed underneath it).
