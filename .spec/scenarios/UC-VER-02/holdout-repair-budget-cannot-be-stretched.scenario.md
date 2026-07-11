---
service: convex
feature: UC-VER-02
priority: P2
type: security
tier: holdout
scope: task-local
---

# UC-VER-02 holdout: re-running the batch does not grant failed routes extra LLM attempts

An operator re-runs `scripts/reconstruct-curated-geometry.ts --lever=2` over the same cursor
range three times in a row. Routes that already exhausted their two attempts and sit in
review must not be picked up again and silently given attempts three through six — the
eligibility scan must exclude `geometryStatus='review'` rows, and the LLM call count across
all three runs for such a route stays exactly where it was after run one. The only sanctioned
path back into reconstruction is the founder explicitly re-queuing the route from the review
queue (a recorded disposition), after which the attempt counter starts a fresh budget and the
prior verification block remains readable in history (or is replaced atomically — but never
half-updated). This protects both the cost envelope (~$0.07/route assumes ≤2 attempts) and
the integrity of "fail-closed": a route cannot brute-force its way into the catalog by
retrying until the ratio dice land inside the band.
