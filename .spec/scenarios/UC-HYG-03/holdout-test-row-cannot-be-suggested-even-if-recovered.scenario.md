---
service: convex
feature: UC-HYG-03
priority: P1
type: security
tier: holdout
scope: task-local
---

# UC-HYG-03 holdout: a test row with perfectly good geometry still never reaches a rider

Framed as an end-to-end leak test rather than a flagging test: give "Test Route CO-04" the
best possible case — run a lever on it so it acquires a real, gate-passing polyline with
provenance, a sane measured length, and a positive-looking score. Despite all of that, the
`test_row` quarantine keeps `riderReady` false, so the row appears in no discovery result, no
browse mode, and no carousel under any query shape (national best, nearest, state-filtered).
The only ways to see it are operator queries and a direct detail deep-link. This proves the
quarantine is enforced at flag-composition time, not merely at flagging time — recovery
success must not launder a test row into the catalog.
