---
service: convex
feature: UC-VER-05
priority: P1
type: security
tier: holdout
scope: task-local
---

# UC-VER-05 holdout: no invocation path reaches the full batch around the couch gate

Try every way an impatient operator (or a future automation) might skip the human: call the
Convex action `backfillReconstruct` directly via `npx convex run` with a huge `sample` value
instead of using the driver's `--all`; run the driver with `--cursor` continuation flags to
walk the whole catalog page by page; and invoke the action from a fresh shell where
`.tmp/GEO/` was deleted so no local couch artifacts exist. The gate must hold at the
authoritative layer — the deployment — not in driver argument parsing: whichever calls
constitute "the full batch" (beyond the sanctioned sample size) consult the persisted
`couchGateStatus` server-side and refuse while it is not pass, regardless of which client
asked and what local files exist. The refusal names the couch gate as the reason. The
sanctioned small `--sample` path keeps working throughout (that is how the sample gets made),
and nothing in the refusal path mutates route state.
