---
service: convex
feature: UC-HYG-02
priority: P1
type: edge_case
tier: holdout
scope: task-local
---

# UC-HYG-02 holdout: a rider who saved a route that later became a shadow loses nothing

Framed from the rider's side rather than the operator's: before the merge, a rider bookmarked
"Cherohala Skyway" — and the specific row they bookmarked happens to be one the dedup pass
later marks as a shadow. After the merge commits, opening that bookmark from Saved Routes
still resolves: the detail query follows `duplicateOf` to the canonical row and renders the
canonical's detail (name, scores, geometry when present). The rider is never shown a broken
screen, a 404, or a duplicate pair. Meanwhile a fresh discovery query for that region returns
the canonical exactly once — the bookmark redirect and the suggestion dedup are the same
merge, observed from two sides.
