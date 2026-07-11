---
service: convex
feature: UC-VER-05
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-VER-05 core: the ~25-route couch sample blocks --all until the founder passes it

After a real `--sample` reconstruction run on the dev deployment, the operator runs
`scripts/geometry-couch-sample.ts`. It assembles ~25 candidate routes stratified across all
three provenance values (`scraped_promoted`, `ai_reconstructed`, `name_routed`) and a spread
of reconstruction difficulty (not only clean ratio-1.00 passes), renders each line as a local
Mapbox static PNG under `.tmp/GEO/couch-sample/`, and writes a manifest pairing each PNG with
the route's provenance, routed-vs-claimed miles, and ratio. The founder eyeballs each map and
records verdicts through the real mutation — `true` (line matches the road he knows), `off`
(right area, wrong trace), `wrong` (fabricated-but-plausible). The deterministic gate
`couchGateStatus` computes pass only when the sample is complete, contains zero `wrong`, and
meets the true-rate threshold. While the status is anything but pass, the lever-2 driver
refuses `--all`; once pass, the same command proceeds.

**Verify (real dev deployment + real founder-workflow mutations):**
- `pnpm tsx scripts/geometry-couch-sample.ts` → manifest lists ~25 routes covering all three
  provenance values; a PNG exists per route; no image bytes stored in Convex.
- `npx convex run curatedGeometryReview:recordCouchVerdict
  '{"routeId":"<r>","verdict":"true"}'` per route → verdicts persisted on the route docs.
- With one seeded `wrong`: `npx convex run curatedGeometryReview:couchGateStatus '{}'` →
  `pass:false`; `pnpm tsx scripts/reconstruct-curated-geometry.ts --lever=2 --all` exits with
  the couch-gate refusal, zero routes processed.
- Clear the `wrong` (re-verdict after regeneration), meet threshold → `pass:true`; the same
  `--all` command starts processing.
