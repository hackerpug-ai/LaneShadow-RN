---
service: convex
feature: UC-VER-01
priority: P1
type: edge_case
tier: holdout
scope: task-local
---

# UC-VER-01 edge: lines exactly ON the band edges, and a legacy Overpass row swept up

Nobody wrote down what happens at exactly 0.60 and exactly 1.60. Seed two candidate lines
whose decoded length divided by claimed length computes to precisely 0.6 and precisely 1.6
(claimed 100 mi, decoded 60.0 and 160.0). Whatever the implementation chooses, both edges
must behave identically as a pair — inclusive on both ends or exclusive on both ends — and
the stored `verification.ratio` must equal the computed value, not a rounded one. Separately,
take one of the 1,058 legacy wrong-length rows that the old Overpass backfill stored as
"generated" (a whole-road fetch whose decoded length is roughly triple its claimed miles) and
run the gate re-evaluation sweep over it: the row must flip out of the servable state and
show up for the operator with its measured ratio, even though no lever ever touched it this
run. A route that is currently rider-ready and gets swept into review must simultaneously
lose its rider-ready flag in the same operation, not on a later recompute.
