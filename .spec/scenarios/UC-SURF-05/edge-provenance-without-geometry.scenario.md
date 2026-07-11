---
service: mobile
feature: UC-SURF-05
priority: P1
type: edge_case
tier: holdout
scope: task-local
---

# UC-SURF-05 edge: provenance says reconstructed, but the line itself is missing

Data drift the ACs never name: a route doc carries `geometryProvenance='ai_reconstructed'`
while its side-table geometry row is absent (a partial teardown, or a review rejection that
cleared the line but not the provenance stamp). Opening that route's detail must not render
the reconstruction caption over an empty map — a caption explaining a line that is not there
is worse than no caption. The screen falls back to the honest "Approximate location" state
and suppresses the provenance caption entirely; the caption's presence is conditioned on a
renderable line, not on the provenance field alone. The mirror case: geometry exists but the
detail query arrives before the provenance patch lands (mid-batch read). The line renders,
the caption is simply absent this session, and no placeholder like "unknown provenance" is
invented. In both drift cases nothing crashes, and the next consistent read heals the
display without an app restart.
