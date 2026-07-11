---
service: convex
feature: UC-HYG-04
priority: P1
type: edge_case
tier: holdout
scope: task-local
---

# UC-HYG-04 edge: the 150-mile region check and the state filter stop disagreeing

Framed through the downstream consumer instead of the pass itself: before normalization, a
route stored as `North-Carolina` is invisible to a rider's "North Carolina" state query while
its centroid sits squarely in that state — the two systems (string filter, geographic check)
disagree. After the hygiene pass, seed a lever-2 reconstruction for a route whose original
state string was dirty: the geocode region-bias derives from the same canonical state the
browse filter uses, so an anchor 40 miles inside the state passes the 150-mile region check
AND the recovered route shows up under the state's browse filter. There is no route in the
catalog that a state query can find but the region check considers foreign, or vice versa,
purely because of string formatting.
