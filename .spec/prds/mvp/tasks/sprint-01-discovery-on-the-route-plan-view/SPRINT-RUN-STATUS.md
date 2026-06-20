# Sprint-01 run status (kb-run-sprint) — checkpoint 2026-06-20

main @ `e49115c4` · clean · `pnpm type-check` exit 0.

## ✅ Merged & verified (7 tasks + 2 hotfixes)
- DATA-009 — single route per OD (no balanced/efficient dup cards)
- DATA-010 — plan from current/last-known location (no spurious "where are you starting from?")
- DESIGN-S01-005/006/007 — carousel-card / on-route-tag / details-sheet-expand specs (`.spec/design/sprint-01/`)
- RUX-006 — map opens on current location @ ~zoom 11 (3–5mi) + slot precedence — **founder feedback #1**
- RUX-007 — discovery card tap shows existing map loading indicator (reuse) — **founder feedback #2**
- hotfix: static `import { api }` in orchestrator.ts/routingAgent.ts (no lazy-load)
- DATA-011 (1/4): optional `routeGeometry` + `geometryStatus` added to `curated_routes` schema (`shared/models/curated-routes.ts`)

## Test-tier decision (user, 2026-06-20)
RUX UI tasks verify on **reviewed production code + a Maestro E2E flow** (run at the PHASE 3.5 gate on the booted sim + live Convex). Do NOT require jsdom-mocked vitest render tests for RUX (they were the repeated stub source). DATA/backend tasks still use live-Convex integration tests.

## ⬜ Remaining

### DATA-011 (2/4–4/4): curated-route geometry generation — manual, real-API
Chosen approach (avoids Google-Routes key/endpoint problem that hung the agent): **Nominatim `polygon_geojson=1`** returns the named road's LineString directly.
1. **Convex** (`convex/curatedRoutes.ts`): add `listForGeometryBackfill` query (paginated → routeId,name,state,geometryStatus) + `patchRouteGeometry` internalMutation (routeId → routeGeometry, geometryStatus).
2. **Script** (`scripts/backfill-curated-geometry.ts`, tsx): `ConvexHttpClient` (from `convex/browser`, `CONVEX_URL` env) — paginate routes, per route `GET nominatim.../search?q={name},{state}&format=jsonv2&polygon_geojson=1&limit=1` (rate-limit ≤1 req/s, identifying User-Agent), if geometry is LineString/MultiLineString → `polyline.encode` (`@mapbox/polyline`) → `patchRouteGeometry({geometryStatus:'generated'})`; else `geometryStatus:'unresolved'` (no fake line). `--sample=25` → `.tmp/DATA-011/sample-report.json` (per-route status + decoded coord count) for HUMAN review, then `--all` (~5,654; one-time).
3. **Read path**: `buildRouteCard`/`listCuratedRoutes` return `routeGeometry` (optional — keep DATA-005 lean shape backward-compatible); `discoverCuratedRoutes.ts:166` use `route.routeGeometry` when present, else the existing `encodeCentroidToPolyline` fallback.
4. **Run**: `npx convex dev` to deploy the new fns + schema; `pnpm tsx scripts/backfill-curated-geometry.ts --sample=25`; review sample; `--all`. Bonds with RUX-008 (the frontend that draws the line + fits camera).

#### DATA-011 LIVE-RUN FINDINGS (2026-06-20 — code merged @ `12d65c1b`, ran live, then REVERTED @ `589df6e9` because the functions were buggy/erroring in the deployed dev backend. **Main now: schema-only.** Redo per the fix below — make it an internal action, do NOT re-merge the external-script+internal-mutation design.)
- ✅ **Core approach PROVEN**: real Nominatim `polygon_geojson` → `@mapbox/polyline` generated **12 LineString geometries out of 50** routes attempted. Geocoding + encoding work for real. (~24% resolve rate — many curated road names don't map to a single OSM way; the `unresolved` fallback path is correct + expected. May want fuzzy/secondary lookups later to lift the rate.)
- ❌ **BUG 1 (architectural, blocks all writes):** `patchRouteGeometry` is an `internalMutation` — the external `ConvexHttpClient` script CANNOT call internal functions ("Could not find public function"). **0 geometries persisted.** Fix: EITHER (a) make `patchRouteGeometry` + `listForGeometryBackfill` PUBLIC `mutation`/`query` (dev-acceptable; revert after backfill), OR (b — cleaner) move the whole backfill into an **internal action** (`convex/curatedGeometry.ts` — Convex actions can `fetch` Nominatim + call internal mutations) invoked via `npx convex run curatedGeometry:backfill '{"sample":25}'` (admin auth → can call internal; no public write exposure, no external client). (b) is the right architecture.
- ❌ **BUG 2:** `listForGeometryBackfill` pagination throws `invalid type: map, expected a string` at `curatedRoutes.ts:342` — the cursor passed by the script is a map, not a string. Fix the paginationOpts cursor handling.
- ❌ **BUG 3:** `--sample=N` doesn't limit (processed 50 = full page); and `sample-report.json` writes `{routes:[],resolved:0}` despite Processed:50/Generated:12 — the report isn't capturing per-route results. Fix the script's sample cap + report accumulation.
- The script also defaults `CONVEX_URL` to `localhost:8000` — should default to `EXPO_PUBLIC_CONVEX_URL` (cloud). Run with `CONVEX_URL=$(grep EXPO_PUBLIC_CONVEX_URL .env|cut -d= -f2-)`.
- **Net:** schema + the proven geocode/encode core are on main; the Convex-call wiring (mutation visibility + pagination + sample/report) needs the architecture fix above, then re-run the 25-sample for the founder's quality review, then `--all` (FREE — Nominatim is keyless; ~5,654 × 1.1s ≈ 1.7h rate-limited).

### RUX wave (lighter contract: code + Maestro flow + react-native-ui-reviewer)
- RUX-003 tap route line → RouteDetailsSheet (not Save) [wave 0]
- RUX-001 carousel above input (← DESIGN-005 ✓) ; RUX-002 plot one route at a time (← RUX-001)
- RUX-004 on-route tag (← RUX-002+RUX-003+DESIGN-006 ✓) ; RUX-005 details sheet expands (← RUX-003+DESIGN-007 ✓)
- RUX-008 finished route auto-plot + camera-fit (bonds with DATA-011 for the curated line)

### Carried verifies
- DATA-005 (listCuratedRoutes 4 modes) · DATA-008 (discoverCuratedRoutes tool) · DISC-002 (useCuratedDiscovery)

### Closeout gates
PHASE 3 human-test · PHASE 3.5 Maestro E2E (runs the rux-006/007/008 flows + discovery-full-gate on the sim) · PHASE 4 build · PHASE 4.5 red-hat.

## Orchestration gotchas (learned this run — see ~/.claude memory)
- Agent `isolation:"worktree"` bases off a STALE ancestor → orchestrator must `git worktree add … main` itself + `ln -s …/node_modules` (+ `.env` for real-API tasks). Verify base: `test -f {wt}/convex/actions/agent/lib/tracing.ts`.
- vitest aliases Convex `_generated/*` + stubs rnmapbox → real tier is Maestro.
- No runtime `await import()` (Biome `no-dynamic-import.grit` plugin, lefthook-gated); static imports only.
- Worktree cleanup: use `git worktree remove --force` (NOT `rm`/`find -delete` — Critical-File Guard blocks the global-gitignored `.claude/`).
- Subagents repeatedly committed to main + stubbed/broke tests (6 incidents) — verify every completion independently (run tests in the worktree, check `git rev-parse main` unchanged, scan for `expect(true)`).
