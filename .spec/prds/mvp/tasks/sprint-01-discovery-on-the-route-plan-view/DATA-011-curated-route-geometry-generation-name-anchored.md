# DATA-011: Generate per-route line geometry for curated discovery routes (name-anchored) and persist it to the data model

**Sprint:** [SPRINT.md](./SPRINT.md)
**Type:** FEATURE · **Status:** ⬜ Backlog · **Priority:** P0 · **Effort:** L · **Estimate:** 300 min · **task_chunks:** 2
**Agent:** convex-implementer · **Reviewer:** convex-reviewer
**Proposed By:** convex-planner
**Agent rationale:** The curated catalog has NO route line — `curated_routes` stores only `centroidLat/Lng` + a real bounding box + a GeoJSON Point (`shared/models/curated-routes.ts:58-107`); `discoverCuratedRoutes` therefore ships a single-point polyline (`discoverCuratedRoutes.ts:166`, `encodeCentroidToPolyline` at 192-195) that cannot be drawn as a line. This task generates a real line per route — geocode the route name+state to endpoints (reusing the curation pipeline's Nominatim integration), route between them via the existing Google Routes provider (`routingProvider.ts`), persist the encoded polyline to a NEW optional `curated_routes` geometry field, and have `discoverCuratedRoutes` read it. A per-route internal Convex action does the generate+patch; a thin driver script runs it 1-by-1 with a sample-validate gate before the full backfill.

> **Founder directive (2026-06-20):** "can we create a script that generates the routes for discovery routes 1 by 1 and updates the underlying data model." Strategy chosen (founder, AskUserQuestion): **name-anchored + sample-validate** — geocode "{name}, {state}" → endpoints → Google Routes polyline → write to `curated_routes`; prototype ~25 routes and review fidelity BEFORE the full ~5,654 backfill; routes whose names don't resolve are FLAGGED (not silently given a misleading point).

> **Bonded to RUX-008:** RUX-008 (frontend) auto-plots + camera-fits a finished route; once this task lands real geometry, `doFit`'s multi-point branch draws the whole curated route line. Verify the curated whole-line end-to-end after BOTH land.

## Outcome

Each curated route that resolves by name carries a real multi-point line polyline in `curated_routes`; `discoverCuratedRoutes` returns that line (decodes to >1 coordinate) instead of a single-point centroid; routes whose name can't be resolved are explicitly flagged (`geometryStatus: 'unresolved'`) and fall back to the centroid/bounds framing path — never a misleading fake line. A driver script generates geometry route-by-route with a 25-route sample gate for human fidelity review before the full ~5,654 backfill.

## Specification

**Schema (`shared/models/curated-routes.ts`):** add two OPTIONAL fields to `curatedRouteValidator` (optional = gradual backfill; never breaks existing rows): `routeGeometry: v.optional(polylineGeometryValidator)` (the canonical shape at `shared/models/saved-routes.ts:120`) and `geometryStatus: v.optional(v.union(v.literal('generated'), v.literal('unresolved'), v.literal('failed')))`.

**Per-route generator (internal Convex action, e.g. `convex/actions/curatedGeometry.ts`):** `generateForRoute({ routeId })` → (1) read the route's `name` + `state`; (2) geocode "{name}, {state}" to a start/end via Nominatim (reuse the integration the curation pipeline uses at `scripts/curation/pipeline/reconciliation/geocode_new.py` — a named road's geocode returns a geometry/extent we anchor endpoints from; if only a centroid resolves, anchor endpoints from the catalog `boundsNe/Sw`); (3) call the existing Google Routes provider (`routingProvider.ts`) start→end → encoded overview polyline; (4) `patch` the route's `routeGeometry` + `geometryStatus: 'generated'`. On geocode-miss or routing failure → patch `geometryStatus: 'unresolved'|'failed'` and write NO geometry (deterministic fallback, flagged). Deterministic wrapper around the probabilistic external calls.

**Driver script (`scripts/backfill-curated-geometry.ts`, tsx):** paginate `curated_routes`, call `generateForRoute` 1-by-1 with rate-limiting (respect Nominatim ≤1 req/s + Google quota). Two modes: `--sample=25` (writes a fidelity report `.tmp/DATA-011/sample-report.json` with per-route decoded-coord-count + resolved/unresolved tallies for HUMAN review) and `--all` (full backfill, only after sample approval). Resumable (skip rows already `generated`).

**Reader (`discoverCuratedRoutes.ts:159-169`):** when `route.routeGeometry` is present, set `map.overviewGeometry = route.routeGeometry` and derive `map.bounds` from it (or use the catalog `boundsNe/Sw`); otherwise fall back to the centroid encode (current behavior) — never emit a fake line for an unresolved route. (Mirror the same read in `createCuratedRoutePlan`, `routePlans.ts:394`, if it builds curated geometry.)

## Critical Constraints

- **MUST** generate geometry name-anchored (geocode name+state → endpoints → Google Routes polyline) and persist a real multi-point `routeGeometry` (decodes to >1 coordinate) for resolvable routes.
- **MUST** flag unresolvable routes `geometryStatus: 'unresolved'|'failed'` and write NO geometry — the reader falls back to centroid/bounds. **NEVER** write a single-point or fabricated polyline as if it were a real route line (Supreme Rule: no fake success).
- **MUST** gate the full ~5,654 backfill behind a 25-route sample fidelity report reviewed by the human; the script must support `--sample` and `--all` and be resumable.
- **MUST** make the new schema fields OPTIONAL so existing rows and `listCuratedRoutes`/DATA-005/008b consumers are unaffected; `discoverCuratedRoutes` reads geometry only when present.
- **NEVER** mock Nominatim or Google Routes in the PRIMARY integration assertion — run the generator against REAL services for the sample; assert the persisted geometry on live Convex dev.

## Acceptance Criteria

### AC-1: The generator produces and persists a real multi-point line for a resolvable route (real services)
*(PRIMARY)*
- **GIVEN** a known curated route with a resolvable name (e.g. "Blue Ridge Parkway", North Carolina) on live Convex dev
- **WHEN** `generateForRoute({ routeId })` runs against REAL Nominatim + REAL Google Routes
- **THEN** the route's `routeGeometry` is persisted as an encoded polyline that DECODES to > 1 coordinate and `geometryStatus === 'generated'`
- **Test tier:** `integration` · **Service:** live Convex dev + real Nominatim + real Google Routes API
- **Verify:** `pnpm test convex/actions/__tests__/curatedGeometry.integration.test.ts -t generatesMultiPointLineForResolvableRoute`

### AC-2: Unresolvable routes are flagged, never given a fake line
- **GIVEN** a curated route whose name does not resolve (or routing fails)
- **WHEN** `generateForRoute` runs
- **THEN** `geometryStatus === 'unresolved'` (or `'failed'`) and `routeGeometry` is left unset — no single-point/fabricated polyline is written
- **Test tier:** `integration` · **Service:** live Convex dev (forced unresolved fixture: a route with a deliberately unresolvable name)
- **Verify:** `pnpm test convex/actions/__tests__/curatedGeometry.integration.test.ts -t flagsUnresolvableRouteWithoutFakeLine`

### AC-3: discoverCuratedRoutes returns the real line when present, falls back when absent
- **GIVEN** one curated route with `routeGeometry` set (generated) and one without (unresolved)
- **WHEN** `discoverCuratedRoutes` builds its options on live Convex dev
- **THEN** the generated route's `map.overviewGeometry` decodes to > 1 coordinate; the unresolved route's option falls back to the centroid encode (current behavior) — and neither path crashes
- **Test tier:** `integration` · **Service:** live Convex dev discovery pipeline
- **Verify:** `pnpm test convex/actions/agent/__tests__/discoverCuratedRoutesGeometry.integration.test.ts -t returnsRealLineWhenPresentElseCentroidFallback`

### AC-4: The driver script's 25-route sample produces a fidelity report for human review (sample-validate gate)
- **GIVEN** the catalog on live Convex dev
- **WHEN** `pnpm tsx scripts/backfill-curated-geometry.ts --sample=25` runs
- **THEN** it generates geometry for 25 routes 1-by-1 (rate-limited) and writes `.tmp/DATA-011/sample-report.json` listing per-route `{ routeId, name, state, geometryStatus, decodedCoordCount }` plus resolved/unresolved tallies — the artifact the human reviews before authorizing `--all`
- **Test tier:** `integration` · **Service:** live Convex dev + real Nominatim + real Google Routes (sample run)
- **Verify:** `pnpm tsx scripts/backfill-curated-geometry.ts --sample=25 && node -e "const r=require('./.tmp/DATA-011/sample-report.json'); if(r.routes.length!==25) process.exit(1); if(r.resolved<1) process.exit(1)"`

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | A resolvable route gets a >1-coordinate `routeGeometry` and `geometryStatus='generated'`. | AC-1 | `pnpm test convex/actions/__tests__/curatedGeometry.integration.test.ts -t generatesMultiPointLineForResolvableRoute` |
| TC-2 | An unresolvable route is flagged and gets NO geometry (no fake line). | AC-2 | `pnpm test convex/actions/__tests__/curatedGeometry.integration.test.ts -t flagsUnresolvableRouteWithoutFakeLine` |
| TC-3 | discoverCuratedRoutes returns the real line when present, centroid fallback when absent. | AC-3 | `pnpm test convex/actions/agent/__tests__/discoverCuratedRoutesGeometry.integration.test.ts -t returnsRealLineWhenPresentElseCentroidFallback` |
| TC-4 | `--sample=25` writes a 25-route fidelity report with ≥1 resolved. | AC-4 | `pnpm tsx scripts/backfill-curated-geometry.ts --sample=25` (then assert report) |

## Reading List

- `shared/models/curated-routes.ts` (58-107) — `curatedRouteValidator`; add optional `routeGeometry` + `geometryStatus`
- `shared/models/saved-routes.ts` (120-126) — `polylineGeometryValidator` (the canonical geometry shape to reuse)
- `convex/actions/agent/tools/discoverCuratedRoutes.ts` (159-195) — the centroid-only builder + `encodeCentroidToPolyline`; read `routeGeometry` when present
- `convex/db/routePlans.ts` (~394) — `createCuratedRoutePlan` (mirror the geometry read if it builds curated geometry)
- `convex/actions/agent/providers/routingProvider.ts` (52-56) — the Google Routes provider seam to reuse for generation
- `scripts/curation/pipeline/reconciliation/geocode_new.py` (117-183, 310-328) — the Nominatim integration + Convex-patch pattern to reuse for endpoint geocoding
- `scripts/import-osm-data.ts` (1-25) — existing tsx driver-script pattern (rate-limiting, pagination) to mirror for the backfill driver

## Guardrails

**WRITE-ALLOWED:** `shared/models/curated-routes.ts` (additive optional fields), `convex/schema.ts` (if the validator import needs re-export), `convex/actions/curatedGeometry.ts` (NEW internal action), `scripts/backfill-curated-geometry.ts` (NEW driver), `convex/actions/agent/tools/discoverCuratedRoutes.ts` (reader only), `convex/actions/__tests__/curatedGeometry.integration.test.ts` (NEW), `convex/actions/agent/__tests__/discoverCuratedRoutesGeometry.integration.test.ts` (NEW)
**WRITE-PROHIBITED:** `convex/actions/agent/planRide.ts` (agent routes already carry geometry), `listCuratedRoutes`/DATA-005 query shape (the new fields are optional + not added to the lean return unless needed), the curation Python pipeline beyond reusing its Nominatim approach

## Design

- No DESIGN spec — this is data generation + persistence; visible output (the drawn line) is delivered by RUX-008 reusing `doFit`.
- **Pattern:** deterministic driver (paginate, rate-limit, sample-gate) wraps a per-route action that wraps the probabilistic external calls (Nominatim, Google Routes); flagged fallback on miss.
- **Anti-pattern:** the current single-point `encodeCentroidToPolyline` masquerading as a route line; or a full backfill with no fidelity gate; or a fabricated polyline for unresolved routes.

## Verification Gates

| Gate | Command |
|------|---------|
| test | `pnpm test convex/actions/__tests__/curatedGeometry.integration.test.ts convex/actions/agent/__tests__/discoverCuratedRoutesGeometry.integration.test.ts` |
| typecheck | `pnpm type-check` |
| lint | `pnpm exec biome check 'convex/actions/curatedGeometry.ts' 'scripts/backfill-curated-geometry.ts' 'convex/actions/agent/tools/discoverCuratedRoutes.ts'` |
| scope | `git diff --name-only ⊆ scope.write_allowed` |
| scenario | `RED-against-bug: AC-3's generated-route case must FAIL on current code (discoverCuratedRoutes always single-point) before the reader + a generated routeGeometry make map.overviewGeometry decode to >1 coordinate` |
| sample_gate | `pnpm tsx scripts/backfill-curated-geometry.ts --sample=25` → human reviews `.tmp/DATA-011/sample-report.json` fidelity (do the generated lines trace the real roads?) BEFORE `--all` |
| human_gate | `After sample approval + --all backfill + RUX-008: on-device, a curated discovery route plots its REAL line on the map framed to the whole route` |

## Coding Standards

- Reuse `polylineGeometryValidator`, the Google Routes provider, and the curation Nominatim approach; do not invent a new geometry shape or a second routing client.
- Respect Nominatim usage policy (≤1 req/s, identifying User-Agent) and Google Routes quota; the driver must rate-limit and be resumable.
- Deterministic fallback (flag, no fake line) on any external miss; no `any` on the geometry payload.
- One-time cost note: a full `--all` run is ~5,654 Google Routes calls — gate it behind the sample review (the founder authorizes `--all`).

## Dependencies

- Depends on: DATA-009 is independent; this task is independent of the RUX UI changes for the GENERATION half
- **Bonded to:** RUX-008 (the drawn whole-route line for curated routes is delivered by RUX-008 reading this geometry) — verify the curated whole-line end-to-end after both land
- Coordinates with: DATA-005/008b (do not alter the lean `listCuratedRoutes` return; the new fields are optional and additive)

## Notes

The catalog has a REAL bounding box (`boundsNeLat/Lng`, `boundsSwLat/Lng`) even for unresolved routes — RUX-008's fit can frame to that extent as the interim "entire route area in view" for routes still `unresolved`, while resolved routes draw the actual line. This task's value is the real-line generation + persistence; the sample gate exists precisely because name-anchored routing between geocoded endpoints may not perfectly trace a long named scenic road — the human reviews 25 before committing the full paid backfill. `geometryStatus` makes coverage auditable (how many of 5,654 resolved).

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "fixtures": {
    "resolvable_named_route_live": {
      "description": "a known curated route with a resolvable name (e.g. 'Blue Ridge Parkway', North Carolina) present on live Convex dev",
      "seed_method": "public_api",
      "records": [ "one curated_routes row with name + state that Nominatim resolves and Google Routes can route" ]
    },
    "unresolvable_named_route_live": {
      "description": "a curated route with a deliberately unresolvable name (or one Nominatim/Google cannot route) on live Convex dev",
      "seed_method": "public_api",
      "records": [ "one curated_routes row whose name does not geocode to a routable endpoint pair" ]
    },
    "one_generated_one_unresolved_route": {
      "description": "two curated routes — one with routeGeometry set (generated), one without (unresolved) — for the reader fallback test",
      "seed_method": "public_api",
      "records": [ "route A with routeGeometry (multi-point) + geometryStatus generated", "route B with geometryStatus unresolved, no routeGeometry" ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN a resolvable curated route WHEN generateForRoute runs against real Nominatim + Google Routes THEN routeGeometry persists as a polyline decoding to >1 coordinate and geometryStatus === 'generated'",
      "verify": "pnpm test convex/actions/__tests__/curatedGeometry.integration.test.ts -t generatesMultiPointLineForResolvableRoute",
      "scenario": {
        "start_ref": "resolvable_named_route_live", "tier": "visible", "test_tier": "integration",
        "verification_service": "live Convex dev + real Nominatim + real Google Routes API",
        "negative_control": { "would_fail_if": [
          "routeGeometry is a single-point polyline (decodes to exactly 1 coordinate — the current encodeCentroidToPolyline behavior)",
          "Nominatim/Google are mocked so no real line is produced",
          "geometryStatus stays unset / 'generated' written with no geometry"
        ] },
        "evidence": { "artifact_type": "stdout", "required_capture": true },
        "cases": [ {
          "start_ref": "resolvable_named_route_live",
          "action": { "actor": "system", "steps": [ "run generateForRoute({routeId}) against real services", "re-read the route from live Convex", "decode routeGeometry" ] },
          "end_state": {
            "must_observe": [ "decode(routeGeometry).length > 1", "geometryStatus === 'generated'" ],
            "must_not_observe": [ "decode(routeGeometry).length === 1", "routeGeometry unset while geometryStatus === 'generated'" ]
          }
        } ]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN an unresolvable route WHEN generateForRoute runs THEN geometryStatus is 'unresolved'/'failed' and routeGeometry is left unset (no fake line)",
      "verify": "pnpm test convex/actions/__tests__/curatedGeometry.integration.test.ts -t flagsUnresolvableRouteWithoutFakeLine",
      "scenario": {
        "start_ref": "unresolvable_named_route_live", "tier": "visible", "test_tier": "integration", "primary": false,
        "verification_service": "live Convex dev (forced unresolved name)",
        "negative_control": { "would_fail_if": [
          "a single-point or fabricated polyline is written for the unresolved route (fake success — Supreme Rule violation)",
          "geometryStatus stays unset / 'generated' for an unresolved route"
        ] },
        "evidence": { "artifact_type": "stdout", "required_capture": true },
        "cases": [ {
          "start_ref": "unresolvable_named_route_live",
          "action": { "actor": "system", "steps": [ "run generateForRoute on the unresolvable route", "re-read the row" ] },
          "end_state": {
            "must_observe": [ "geometryStatus === 'unresolved' OR 'failed'", "routeGeometry is unset" ],
            "must_not_observe": [ "routeGeometry written (any value) for the unresolved route" ]
          }
        } ]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN one generated + one unresolved route WHEN discoverCuratedRoutes builds options THEN the generated route's overviewGeometry decodes to >1 coord and the unresolved falls back to centroid; neither crashes",
      "verify": "pnpm test convex/actions/agent/__tests__/discoverCuratedRoutesGeometry.integration.test.ts -t returnsRealLineWhenPresentElseCentroidFallback",
      "scenario": {
        "start_ref": "one_generated_one_unresolved_route", "tier": "visible", "test_tier": "integration", "primary": false,
        "verification_service": "live Convex dev discovery pipeline",
        "negative_control": { "would_fail_if": [
          "the generated route's overviewGeometry still decodes to 1 coordinate (reader ignores routeGeometry)",
          "the unresolved route throws instead of falling back to the centroid encode"
        ] },
        "evidence": { "artifact_type": "stdout", "required_capture": true },
        "cases": [ {
          "start_ref": "one_generated_one_unresolved_route",
          "action": { "actor": "system", "steps": [ "run discoverCuratedRoutes over both routes", "decode each option's map.overviewGeometry" ] },
          "end_state": {
            "must_observe": [ "generated route option: decode(overviewGeometry).length > 1", "unresolved route option: decode(overviewGeometry).length === 1 (centroid fallback), no crash" ],
            "must_not_observe": [ "generated route option decoding to 1 coordinate (reader ignored routeGeometry)", "an exception on the unresolved route" ]
          }
        } ]
      }
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN the catalog WHEN backfill-curated-geometry.ts --sample=25 runs THEN it generates 25 routes 1-by-1 and writes a fidelity report (per-route status + decoded coord count + resolved/unresolved tallies) for human review before --all",
      "verify": "pnpm tsx scripts/backfill-curated-geometry.ts --sample=25",
      "scenario": {
        "start_ref": "resolvable_named_route_live", "tier": "visible", "test_tier": "integration", "primary": false,
        "verification_service": "live Convex dev + real Nominatim + real Google Routes (sample run)",
        "negative_control": { "would_fail_if": [
          "the report has != 25 routes or 0 resolved (sample not actually run against real services)",
          "the script runs --all without a sample gate",
          "the report omits per-route decodedCoordCount/geometryStatus"
        ] },
        "evidence": { "artifact_type": "file", "required_capture": true, "path": ".tmp/DATA-011/sample-report.json" },
        "cases": [ {
          "start_ref": "resolvable_named_route_live",
          "action": { "actor": "system", "steps": [ "run scripts/backfill-curated-geometry.ts --sample=25", "read .tmp/DATA-011/sample-report.json" ] },
          "end_state": {
            "must_observe": [ "report.routes.length === 25", "report.resolved >= 1", "each entry has routeId, name, state, geometryStatus, decodedCoordCount" ],
            "must_not_observe": [ "report missing or routes.length !== 25", "a full --all backfill triggered without the sample gate" ]
          }
        } ]
      }
    },
    { "id": "TC-1", "type": "test_criterion", "description": "Resolvable route gets a >1-coord routeGeometry + geometryStatus generated.", "maps_to_ac": "AC-1", "verify": "pnpm test convex/actions/__tests__/curatedGeometry.integration.test.ts -t generatesMultiPointLineForResolvableRoute" },
    { "id": "TC-2", "type": "test_criterion", "description": "Unresolvable route flagged, no fake line.", "maps_to_ac": "AC-2", "verify": "pnpm test convex/actions/__tests__/curatedGeometry.integration.test.ts -t flagsUnresolvableRouteWithoutFakeLine" },
    { "id": "TC-3", "type": "test_criterion", "description": "Reader returns real line when present, centroid fallback when absent.", "maps_to_ac": "AC-3", "verify": "pnpm test convex/actions/agent/__tests__/discoverCuratedRoutesGeometry.integration.test.ts -t returnsRealLineWhenPresentElseCentroidFallback" },
    { "id": "TC-4", "type": "test_criterion", "description": "--sample=25 writes a 25-route fidelity report with >=1 resolved.", "maps_to_ac": "AC-4", "verify": "pnpm tsx scripts/backfill-curated-geometry.ts --sample=25" }
  ]
}
-->
