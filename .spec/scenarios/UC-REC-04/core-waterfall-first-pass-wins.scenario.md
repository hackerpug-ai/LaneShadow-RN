---
service: convex
feature: UC-REC-04
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-REC-04 core: the waterfall runs levers in order and every route lands in exactly one terminal state

The operator runs the full rescue waterfall over a mixed sample on the real dev deployment:
routes with in-row polylines (lever-1 material), routes with turn-by-turn prose (lever-2
material), endpoint-named routes (lever-3 material), and a few with none of the three. Levers
run in order — promote, then reconstruct, then re-route — and the first lever to produce a
gate-passing line wins and stamps its provenance; later levers skip anything already
`generated`. When the batch completes, every processed route is in exactly one terminal
state: `generated` (with exactly one provenance value), `review`, or unresolved-and-
retirement-eligible. Nothing is silently skipped; per-lever counts are visible live.

**Verify (real dev deployment; lever 2 hits real LLM + Google, ~$0.07/route):**
- `pnpm tsx scripts/reconstruct-curated-geometry.ts --lever=1 --sample=20` then
  `--lever=2 --sample=10` then `--lever=3 --sample=10` → each report shows
  processed = generated + review + failed with a `continueCursor`.
- `npx convex run curatedGeometry:coverageReport '{}'` → per-lever yields and per-status
  counts that reconcile: (sampled routes) = Σ(terminal states); no route counted twice, no
  route missing.
- Spot-check one route recovered by each lever: its `geometryProvenance` matches the lever
  that won (`scraped_promoted` / `ai_reconstructed` / `name_routed`), and exactly one
  side-table geometry row exists for it.
- A lever-1-recovered route was never sent to the LLM (no attempt count, no anchors[]).
