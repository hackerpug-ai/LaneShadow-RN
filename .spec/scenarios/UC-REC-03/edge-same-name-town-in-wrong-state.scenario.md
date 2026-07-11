---
service: convex
feature: UC-REC-03
priority: P1
type: edge_case
tier: holdout
scope: task-local
---

# UC-REC-03 edge: "Riverdale" is in eleven states — the wrong one must not win

Endpoint names are ambiguous in a way descriptions rarely are: "Riverdale Road" exists in
Colorado, New Jersey, Georgia, Utah... Take a real endpoint-named route whose start or end
token is a common US place name and whose centroid is known. If Google's top geocode for the
bare token lands in another state entirely, the region machinery must save the route or
refuse it — never silently accept the cross-country interpretation: either the region-biased
bounds + nearest-to-centroid selection picks the local candidate (route proceeds normally),
or every candidate sits >150 mi away and the route goes to `review` with the off-region
distances recorded. The catastrophic outcome this scenario exists to forbid: a `generated`
line whose endpoints resolve 1,000+ miles from the centroid but whose total length happens to
land inside the ratio band (long claimed lengths make this arithmetically possible — the
region check, not the ratio, is what blocks it).
