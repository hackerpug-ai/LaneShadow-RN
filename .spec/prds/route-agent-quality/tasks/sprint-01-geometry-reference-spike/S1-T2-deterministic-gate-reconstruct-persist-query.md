# S1-T2 — Deterministic gate module (VER-01 core) + reconstruct-one + persist + riderReady seam + gated query

| Field | Value |
|-------|-------|
| TASK_ID | S1-T2 |
| SPRINT | [Sprint 01 — Geometry reference-flow spike](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`convex-implementer` · reviewer=`convex-reviewer` |
| ESTIMATE | 180 min |
| EFFORT | L |
| PRIORITY | P0 |
| STATUS | Done (commit 1b1280b6 / land 2cbb372c; convex-reviewer APPROVED; real Convex AC-1..AC-7) |
| PROPOSED_BY | `convex-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | CAP-GEO-01, CAP-GEO-03 |
| DEPENDS_ON | S1-T1 |
| BLOCKS | S1-T3, Sprint 04 |

RUNTIME_COMMANDS:
- test: `pnpm test convex/__tests__/reconstructReferenceFlow.integration.test.ts convex/__tests__/geometryGatePersist.integration.test.ts`
- typecheck: `pnpm type-check`
- lint: `pnpm exec biome check`

## OUTCOME

One real PoC route reconstructs end-to-end on real services, is gated by a pure deterministic module, persisted as `ai_reconstructed`, flagged rider-ready, and returned by `listCuratedRoutes` in both national-best and nearest modes — the seam Sprint 04/06 harden.

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- Read convex/_generated/ai/guidelines.md first (run `npx convex ai-files install` / fall back to brain/docs/CONVEX-RULES.md).
- Keep the gate a SINGLE PURE module (convex/curatedGeometryGate.ts) — VER-01 is the single source of truth every future lever imports; no per-lever copies.
- Store the recovered polyline in the curated_route_geometry SIDE TABLE keyed by routeId (a prior migration moved 16MB out of the row); only status/riderReady/provenance on the row.
- Region-bias every geocode; reject anchors >150mi from centroid; require ≥2 surviving anchors before ANY routing call. On PASS persist provenance 'ai_reconstructed' + geometryStatus='generated'; on FAIL never store as servable.
- riderReady is a STORED, INDEXED boolean recomputed by the 7-input predicate — never a read-time decision. Add `by_riderReady_and_composite_score` before the best-mode query walks it.
- Assert PERSISTED engine outcomes (provenance, verdict, ratio, riderReady, gated-query membership), NEVER LLM prose. Fixture the anchor/geocode/routing seams for engine ACs; keep the real-API smoke lane on Tepusquet (SKIP-with-reason on outage).

**NEVER**
- Never `.filter()` a table scan where a `.withIndex()` exists (best-mode walks the riderReady index).
- Never fabricate a geometry line, distance, or riderReady=true when the gate did not PASS.
- Never re-implement the gate inside the reconstruct action or persist mutation — import the pure module.
- Never edit convex/actions/agent/** provider/tool internals, the RN app, or unrelated Convex modules; never author S1-T1's anchor extraction here.
- Never report complete while any seam is a stub reporting fake PASS, the smoke lane was skipped without a documented outage reason, or riderReady is computed at read time.

**STRICTLY**
- Ratio band inclusive: ratio ∈ [0.6,1.6] admits; 0.61 & 1.59 admit, 0.59 & 1.61 → review.
- Degenerate iff points ≤ 4 OR points < routedMiles (fewer than 1 pt/mi).
- Quarantined (null/outlier) claimed length → SKIP ratio; decide by degenerate+region; routed length stored as truth.
- The rejected-route path exposes WHICH condition failed (ratio | anchors | degenerate) in the verification/review record.

## DONE WHEN

- PoC route reconstructs end-to-end on real APIs → generated/ai_reconstructed/ratio∈[0.6,1.6]/riderReady=true; returns in best AND nearest (AC-1).
- Ratio boundaries 1.00/0.61/1.59 admit, 0.59/1.61 review through the real persist path (AC-2).
- 1-anchor → review (no routing call); off-region anchor excluded (AC-3); degenerate lines rejected (AC-4); quarantined length ratio-skip (AC-5).
- Each review names its failedCondition (AC-6); riderReady 7-input single-flip flips the flag; best-mode reads the index (AC-7).
- `pnpm test convex/__tests__/reconstructReferenceFlow.integration.test.ts convex/__tests__/geometryGatePersist.integration.test.ts` passes + `pnpm type-check` clean + `pnpm exec biome check` clean
- Only SCOPE.writeAllowed files modified (`git diff --name-only`)
- Every behavioral AC scenario passes `validate_scenario` (exit 0); RED-against-start recorded before GREEN; seeded-value EVIDENCE artifact captured

## SPECIFICATION

**Objective:** Build the spine of the Sprint-01 geometry reference spike: the single-source-of-truth gate module + reconstruct-one path + persist + recomputeRiderReady seam + gated query, scoped to reconstruct-ONE.

**Success state:** reconstructForRoute(PoC) → gate PASS (ratio ∈ [0.6,1.6]) → side-table `ai_reconstructed` geometry + verification block + anchors[] → riderReady=true (stored, indexed) → route returns from listCuratedRoutes best AND nearest; boundary/anchors/degenerate/quarantine/failedCondition all enforced through the real persist path.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `poc_route` (seed_method: `public_api`): Real Twist of Tepusquet Loop catalog row (CA, claimed ~41mi, centroid 34.95,-120.42) seeded via a real mutation + geospatial.insert; engine tests fixture its anchor completion with the PoC 7 anchors.
- `boundary_ratio_rows` (seed_method: `public_api`): Four seeded rows claimedMiles=100 so a canned routed line of 61/159/59/161 mi yields ratio 0.61/1.59/0.59/1.61 exactly, driven through the real gate + persist path.
- `degenerate_rows` (seed_method: `public_api`): Two seeded rows: one canned routed line decoding to 2 points, one to 10 points over ~50 miles (<1 pt/mi).
- `quarantined_length_row` (seed_method: `public_api`): A seeded row whose claimedMiles is null (quarantined) with a canned non-degenerate 22.0-mi in-region routed line.

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY]

**Requirement:** GIVEN the real PoC route WHEN reconstructForRoute runs end-to-end on real Anthropic+Google THEN gate PASS -> persist ai_reconstructed -> riderReady true -> returns from listCuratedRoutes best AND nearest

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment + real Anthropic (S1-T1) + real Google Geocoding + real Google Routes
- VERIFY: `pnpm test convex/__tests__/reconstructReferenceFlow.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the gate always returns PASS (stub) so a wrong-length line still persists; reconstruct returns a hardcoded polyline instead of routing through geocoded anchors; geometry is not persisted to the curated_route_geometry side table (empty); recomputeRiderReady is a no-op / riderReady left unset; listCuratedRoutes reads a mocked table instead of the by_riderReady index / geospatial nearest
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `poc_route`
    - ACTION (cli_user): npx convex run curatedGeometryReconstruct:reconstructForRoute for the PoC route · read getVerificationForRoute · list best mode · list nearest mode center 34.95,-120.42
    - MUST_OBSERVE: geometryStatus == "generated" in <= 2 attempts; side-table provenance == "ai_reconstructed"; verification.verdict == "pass"; verification.ratio in [0.6, 1.6] (PoC baseline 1.00, routed ~= 41.1 mi); verification.anchorCount >= 2 with anchors[] each <= 150 mi from centroid; decoded line has > 4 points and >= 1 point per mile; riderReady == true; route "motorcycleroads:twist-of-tepusquet-loop" appears in listCuratedRoutes national-best results; route "motorcycleroads:twist-of-tepusquet-loop" appears in listCuratedRoutes nearest results
    - MUST_NOT_OBSERVE: geometryStatus unresolved (no gate-passing geometry); provenance is none/absent; riderReady == false; route absent from national-best results; route absent from nearest results

### AC-2

**Requirement:** GIVEN seeded rows WHEN reconstruct runs with canned routed lines at ratio boundaries THEN 1.00/0.61/1.59 admit (generated) and 0.59/1.61 -> review; exact ratio recorded

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real persistGeometryVerified/setReviewVerdict; anchor+geocode+routing seams fixtured with a canned polyline of known length)
- VERIFY: `pnpm test convex/__tests__/geometryGatePersist.integration.test.ts -t ratio`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the gate always returns PASS (stub) so 0.59/1.61 still admit; the ratio is not stored in the verification block (read-time recompute, empty); the boundary is coded with the wrong edge so 0.61/1.59 wrongly review
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `poc_route`
    - ACTION (api_client): reconstructForRoute with a canned 41.07-mi line vs 41-mi claimed (ratio 1.002)
    - MUST_OBSERVE: verification.verdict == "pass"; verification.ratio == 1.00 (+/-0.01); geometryStatus == "generated"; riderReady == true
    - MUST_NOT_OBSERVE: geometryStatus review (0 generated); riderReady == false
- CASE 2 — start_ref `boundary_ratio_rows`
    - ACTION (api_client): reconstruct claimed=100mi row with canned 61.0-mi line (ratio 0.61)
    - MUST_OBSERVE: verification.ratio == 0.61; verification.verdict == "pass"; geometryStatus == "generated"
    - MUST_NOT_OBSERVE: geometryStatus review (no admission); riderReady == false
- CASE 3 — start_ref `boundary_ratio_rows`
    - ACTION (api_client): reconstruct claimed=100mi row with canned 159.0-mi line (ratio 1.59)
    - MUST_OBSERVE: verification.ratio == 1.59; verification.verdict == "pass"; geometryStatus == "generated"
    - MUST_NOT_OBSERVE: geometryStatus review (no admission); riderReady == false
- CASE 4 — start_ref `boundary_ratio_rows`
    - ACTION (api_client): reconstruct claimed=100mi row with canned 59.0-mi line (ratio 0.59)
    - MUST_OBSERVE: verification.ratio == 0.59; verification.verdict == "review"; geometryStatus == "review"
    - MUST_NOT_OBSERVE: geometryStatus generated (0 admitted); riderReady == true
- CASE 5 — start_ref `boundary_ratio_rows`
    - ACTION (api_client): reconstruct claimed=100mi row with canned 161.0-mi line (ratio 1.61)
    - MUST_OBSERVE: verification.ratio == 1.61; verification.verdict == "review"; geometryStatus == "review"
    - MUST_NOT_OBSERVE: geometryStatus generated (0 admitted); riderReady == true

### AC-3

**Requirement:** GIVEN fixtured anchors WHEN reconstruct runs THEN 1 anchor -> review (failedCondition anchors) with 0 routing calls; a >150mi anchor is excluded before routing

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real gate + persist; anchor+geocode seams fixtured; routing seam spy asserts non-invocation)
- VERIFY: `pnpm test convex/__tests__/geometryGatePersist.integration.test.ts -t anchors`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the <2-anchor guard is missing so a routing call fires on 1 anchor; regionCheck is disconnected so the 300-mi anchor routes into the line; anchorCount is fabricated rather than counted from surviving geocodes
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `poc_route`
    - ACTION (api_client): reconstruct with fixtured emit_anchors yielding exactly 1 valid geocodable anchor
    - MUST_OBSERVE: geometryStatus == "review"; verification.failedCondition == "anchors"; routing seam invocation count == 0
    - MUST_NOT_OBSERVE: geometryStatus generated (0 admitted); riderReady == true; any routing call made
- CASE 2 — start_ref `poc_route`
    - ACTION (api_client): reconstruct with fixtured emit_anchors including one anchor ~300 mi off-region plus >=2 in-region
    - MUST_OBSERVE: off-region anchor (~300 mi) excluded: 0 anchors > 150 mi persisted; verification.anchorCount counts only anchors <= 150 mi; verification.verdict == "pass"
    - MUST_NOT_OBSERVE: an anchor > 150 mi in the persisted anchors[]; geometryStatus unresolved (none)

### AC-4

**Requirement:** GIVEN canned degenerate routed lines WHEN reconstruct runs THEN a 2-point line and a 10-pt/50-mi line both fail (degenerate=true, review) and never generate

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real gate + persist; routing seam returns the canned degenerate polylines)
- VERIFY: `pnpm test convex/__tests__/geometryGatePersist.integration.test.ts -t degenerate`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: degenerateCheck is a no-op so a 2-point line persists as generated; the points-per-mile rule is omitted so the 10-pt/50-mi line passes; the degenerate flag is not stored on the verification block (empty)
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `degenerate_rows`
    - ACTION (api_client): reconstruct the row whose canned routed line decodes to 2 points
    - MUST_OBSERVE: verification.degenerate == true; geometryStatus == "review"; verification.failedCondition == "degenerate"
    - MUST_NOT_OBSERVE: geometryStatus generated (0 admitted); riderReady == true
- CASE 2 — start_ref `degenerate_rows`
    - ACTION (api_client): reconstruct the row whose canned routed line decodes to 10 points over ~50 miles (<1 pt/mi)
    - MUST_OBSERVE: verification.degenerate == true; geometryStatus == "review"
    - MUST_NOT_OBSERVE: geometryStatus generated (0 admitted); riderReady == true

### AC-5

**Requirement:** GIVEN a quarantined (null) claimed length WHEN reconstruct runs THEN ratio-skip: admission decided by degenerate+region, routed length stored as truth

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real gate + persist; a canned non-degenerate in-region 22.0-mi routed line)
- VERIFY: `pnpm test convex/__tests__/geometryGatePersist.integration.test.ts -t quarantine`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the ratio check still runs on null claimed length and reviews the row; routedMiles is not stored so there is no measured truth (empty); quarantine is ignored and a divide-by-null throws
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `quarantined_length_row`
    - ACTION (api_client): reconstruct the null-claimed-length row with a canned non-degenerate 22.0-mi line and >=2 in-region anchors
    - MUST_OBSERVE: verification.ratio == null (ratio-skip); verification.claimedMiles == null; verification.verdict == "pass" (decided by degenerate + region); verification.routedMiles == 22.0 (stored as truth); geometryStatus == "generated"
    - MUST_NOT_OBSERVE: verification.verdict review from a ratio check; geometryStatus unresolved (none)

### AC-6

**Requirement:** GIVEN review rows from AC-2/3/4 WHEN read by routeId THEN each names WHICH gate condition failed (ratio|anchors|degenerate)

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (read review records via getVerificationForRoute)
- VERIFY: `pnpm test convex/__tests__/geometryGatePersist.integration.test.ts -t failedCondition`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the review record stores no failedCondition (an operator cannot tell why it failed); failedCondition is a constant string regardless of the real failing check (hardcoded)
- EVIDENCE: `api_response` (required_capture: true)
- CASE 1 — start_ref `boundary_ratio_rows`
    - ACTION (api_client): read verification for the 1.61-ratio review row
    - MUST_OBSERVE: failedCondition == "ratio"
    - MUST_NOT_OBSERVE: failedCondition is none/absent; failedCondition == null
- CASE 2 — start_ref `poc_route`
    - ACTION (api_client): read verification for the 1-anchor review row
    - MUST_OBSERVE: failedCondition == "anchors"
    - MUST_NOT_OBSERVE: failedCondition is none/absent
- CASE 3 — start_ref `degenerate_rows`
    - ACTION (api_client): read verification for the 2-point review row
    - MUST_OBSERVE: failedCondition == "degenerate"
    - MUST_NOT_OBSERVE: failedCondition is none/absent

### AC-7

**Requirement:** GIVEN the all-good PoC route WHEN each of 7 riderReady inputs is flipped one at a time THEN the stored+indexed riderReady flips false each time; best-mode reads the riderReady index

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real recomputeRiderReady + mutations to flip each input + indexed listCuratedRoutes read)
- VERIFY: `pnpm test convex/__tests__/geometryGatePersist.integration.test.ts -t riderReady`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the predicate is a constant true (stub) so a flip does not flip the flag; one of the seven inputs is not read by the predicate; the gated query filters in memory over a full scan instead of walking the riderReady index; riderReady is recomputed at read time rather than stored + indexed
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `poc_route`
    - ACTION (api_client): persist PoC to all-good state; recompute · flip each of the 7 inputs one at a time (geometry verdict, name, score, length, ride-worthiness, retired, shadow); recompute after each · restore all-good; read listCuratedRoutes best-mode
    - MUST_OBSERVE: riderReady == true only in the all-good state; riderReady == false after EACH single flip (7 flips); route "motorcycleroads:twist-of-tepusquet-loop" present in listCuratedRoutes national-best via the by_riderReady_and_composite_score index; route doc has a stored riderReady == true boolean field (not read-time)
    - MUST_NOT_OBSERVE: riderReady == true while any one required input is bad; riderReady computed at read time (no stored field)

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Smoke lane: reconstructForRoute on Twist of Tepusquet -> generated/ai_reconstructed/ratio in [0.6,1.6]/riderReady true/returns in best AND nearest (SKIP-with-reason on outage) | AC-1 | `pnpm test convex/__tests__/reconstructReferenceFlow.integration.test.ts` |
| TC-2 | Boundary ratios 1.00/0.61/1.59 admit (generated) and 0.59/1.61 review through the real persist mutation; verification.ratio recorded exactly | AC-2 | `pnpm test convex/__tests__/geometryGatePersist.integration.test.ts -t ratio` |
| TC-3 | 1 anchor -> review (failedCondition 'anchors') with zero routing calls; a 300-mi anchor excluded before routing | AC-3 | `pnpm test convex/__tests__/geometryGatePersist.integration.test.ts -t anchors` |
| TC-4 | A 2-point line and a 10-pt/50-mi line are both rejected degenerate and never generated | AC-4 | `pnpm test convex/__tests__/geometryGatePersist.integration.test.ts -t degenerate` |
| TC-5 | Null claimed length -> ratio-skip; degenerate+region decide; routedMiles stored as truth | AC-5 | `pnpm test convex/__tests__/geometryGatePersist.integration.test.ts -t quarantine` |
| TC-6 | Each review record names its failedCondition (ratio/anchors/degenerate) readable by routeId | AC-6 | `pnpm test convex/__tests__/geometryGatePersist.integration.test.ts -t failedCondition` |
| TC-7 | Seven-input riderReady composition; single-input flip flips the flag; best-mode reads the by_riderReady index | AC-7 | `pnpm test convex/__tests__/geometryGatePersist.integration.test.ts -t riderReady` |
| TC-8 | SUPPLEMENTARY pure gate math (unit): 0.6/0.61/1.59/1.6 inclusive-admit and 0.59/1.61 review; points<=4 and points<routedMi degenerate; 150.0 vs 150.1 region; null-claimed ratio-skip | AC-1 | `pnpm test convex/__tests__/curatedGeometryGate.test.ts` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- `convex/curatedGeometryGate.ts` (NEW — pure gate module)
- `convex/actions/curatedGeometryReconstruct.ts` (NEW — 'use node' reconstruct-one + injectable seams + direct multi-anchor computeRoutes)
- `convex/curatedGeometryTestSupport.ts` (NEW — real seed/teardown mutations)
- `convex/curatedGeometry.ts` (MODIFY — persistGeometryVerified, setReviewVerdict, recomputeRiderReady, read internalQueries; do NOT alter legacy patchRouteGeometry union)
- `convex/curatedRoutes.ts` (MODIFY — best via by_riderReady_and_composite_score; nearest in-memory riderReady post-filter; extend returnValidator geometryStatus union with 'review'; keep requireIdentity first)
- `convex/schema.ts` (MODIFY — add by_riderReady_and_composite_score on curated_routes only)
- `shared/models/curated-routes.ts` (MODIFY — additive-optional geometryProvenance/riderReady/rideWorthiness/retiredAt/duplicateOf + verification+anchors on geometry validator; geometryStatus union += 'review')
- `convex/__tests__/curatedGeometryGate.test.ts` (NEW — supplementary pure-gate unit), `convex/__tests__/reconstructReferenceFlow.integration.test.ts` (NEW — PRIMARY + smoke), `convex/__tests__/geometryGatePersist.integration.test.ts` (NEW — boundary/anchors/degenerate/quarantine/failedCondition/riderReady)

**writeProhibited:**
- `convex/actions/agent/**` provider/tool internals (geocodingProvider, routingProvider, discoverCuratedRoutes — imported read-only; discovery hard-gating is Sprint 06)
- `convex/actions/curatedGeometry.ts` (legacy name-anchored generation — leave intact)
- The RN app (app/**, components/**) — the cold-boot plot flow is S1-T3
- Any unrelated Convex module; `.spec/**`; S1-T1's anchor-extraction module

## READING LIST

- `.spec/prds/route-agent-quality/06-uc-ver.md` (UC-VER-01 — gate single source of truth) · `05-uc-rec.md` (UC-REC-02) · `07-uc-surf.md` (UC-SURF-01 seam)
- `.spec/prds/route-agent-quality/10-technical-requirements/03-data-schema.md` + `04-api-design.md` + `11-e2e-testing.md` (§2 determinism seam)
- `.spec/proposals/geometry-completion/poc/poc-reconstruct.mjs:29-35,89-125,166-171` [PRIMARY PATTERN] — gate math + geocode bias + computeRoutes intermediates
- `convex/curatedGeometry.ts:160-208,309-354` (side-table upsert + absent-optional neq) · `convex/actions/curatedGeometry.ts:203-243,322-395` (Google Routes + decode/count)
- `convex/curatedRoutes.ts:220-296` (listCuratedRoutes modes, norm/clampLength, MAX_NEAREST, requireIdentity) · `convex/seedGeospatialTest.ts:131-230` (seed + geospatial.insert + teardown)

## CODE PATTERN

- Pattern source: `convex/curatedGeometry.ts:309-354` (upsertGeometry) + `.spec/proposals/geometry-completion/poc/poc-reconstruct.mjs:89-171` (geocode→route→gate) + `convex/curatedRoutes.ts:280-296` (index walk)
- Anti-pattern: Re-implementing the gate per-lever; inlining the polyline on the route row; `.filter()` table scans; read-time riderReady; reusing routingProvider (3-intermediate cap) for the multi-anchor route.

## VERIFICATION GATES

- PRIMARY + smoke: `pnpm test convex/__tests__/reconstructReferenceFlow.integration.test.ts` → Exit 0 (SKIP-with-reason on provider outage)
- Gate/persist engine: `pnpm test convex/__tests__/geometryGatePersist.integration.test.ts` → Exit 0
- Typecheck `pnpm type-check` → Exit 0 · Lint `pnpm exec biome check` → Exit 0 · Convex build `pnpm convex:dev --once` → Exit 0
- Deployment env: ANTHROPIC_API_KEY + GOOGLE_MAPS_API_KEY set on the deployment (`npx convex env set`).

## AGENT ASSIGNMENT

- Implementer: `convex-implementer` — Pure-Convex backend: a pure gate module, a 'use node' action wiring real Google Geocoding/Routes, side-table persistence, a rider-ready predicate, an indexed query, and vitest integration against the real dev deployment.
- Reviewer: `convex-reviewer`

## EVIDENCE GATES

- RED phase: each AC's test went red before green (TDD_STATE history).
- Integration/E2E coverage: PRIMARY AC is `integration`.
- Scenario un-fakeable: `validate_scenario` exit 0 on the PRIMARY AC; captured EVIDENCE shows the seeded MUST_OBSERVE value (not merely "tests passed").

## DEPENDENCIES

- Depends on: S1-T1
- Blocks: S1-T3, Sprint 04

## CONTEXT

- **Current state:** Geometry recovery exists only as a PoC script; no shared gate module, no reconstruct-one Convex path, no stored riderReady flag or index.
- **Gap:** No single-source-of-truth gate + persist/recompute seam + gated query that Sprint 04/06 can harden; the recovered route can't yet return from listCuratedRoutes.

<details>
<summary>▸ Full agent specification (TASK-TEMPLATE v5.2 — machine-readable requirement contract)</summary>

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "S1-T2",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "poc_route": {
      "description": "Real Twist of Tepusquet Loop catalog row (CA, claimed ~41mi, centroid 34.95,-120.42) seeded via a real mutation + geospatial.insert; engine tests fixture its anchor completion with the PoC 7 anchors.",
      "seed_method": "public_api",
      "records": [
        "curated_routes routeId=motorcycleroads:twist-of-tepusquet-loop lengthMiles=41 centroidLat=34.95 centroidLng=-120.42",
        "geospatial point at (34.95,-120.42) for nearest-mode"
      ]
    },
    "boundary_ratio_rows": {
      "description": "Four seeded rows claimedMiles=100 so a canned routed line of 61/159/59/161 mi yields ratio 0.61/1.59/0.59/1.61 exactly, driven through the real gate + persist path.",
      "seed_method": "public_api",
      "records": [
        "test:ratio-061 claimedMiles=100",
        "test:ratio-159 claimedMiles=100",
        "test:ratio-059 claimedMiles=100",
        "test:ratio-161 claimedMiles=100"
      ]
    },
    "degenerate_rows": {
      "description": "Two seeded rows: one canned routed line decoding to 2 points, one to 10 points over ~50 miles (<1 pt/mi).",
      "seed_method": "public_api",
      "records": [
        "test:degenerate-2pt claimedMiles=40",
        "test:degenerate-10pt-50mi claimedMiles=50"
      ]
    },
    "quarantined_length_row": {
      "description": "A seeded row whose claimedMiles is null (quarantined) with a canned non-degenerate 22.0-mi in-region routed line.",
      "seed_method": "public_api",
      "records": [
        "test:quarantined-null-length lengthMiles=null quarantine reason zero_length"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "maps_to_ac": null,
      "description": "GIVEN the real PoC route WHEN reconstructForRoute runs end-to-end on real Anthropic+Google THEN gate PASS -> persist ai_reconstructed -> riderReady true -> returns from listCuratedRoutes best AND nearest",
      "verify": "pnpm test convex/__tests__/reconstructReferenceFlow.integration.test.ts",
      "scenario": {
        "id": "AC-1",
        "primary": true,
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment + real Anthropic (S1-T1) + real Google Geocoding + real Google Routes",
        "negative_control": {
          "would_fail_if": [
            "the gate always returns PASS (stub) so a wrong-length line still persists",
            "reconstruct returns a hardcoded polyline instead of routing through geocoded anchors",
            "geometry is not persisted to the curated_route_geometry side table (empty)",
            "recomputeRiderReady is a no-op / riderReady left unset",
            "listCuratedRoutes reads a mocked table instead of the by_riderReady index / geospatial nearest"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "poc_route",
            "action": {
              "actor": "cli_user",
              "steps": [
                "npx convex run curatedGeometryReconstruct:reconstructForRoute for the PoC route",
                "read getVerificationForRoute",
                "list best mode",
                "list nearest mode center 34.95,-120.42"
              ]
            },
            "end_state": {
              "must_observe": [
                "geometryStatus == \"generated\" in <= 2 attempts",
                "side-table provenance == \"ai_reconstructed\"",
                "verification.verdict == \"pass\"",
                "verification.ratio in [0.6, 1.6] (PoC baseline 1.00, routed ~= 41.1 mi)",
                "verification.anchorCount >= 2 with anchors[] each <= 150 mi from centroid",
                "decoded line has > 4 points and >= 1 point per mile",
                "riderReady == true",
                "route \"motorcycleroads:twist-of-tepusquet-loop\" appears in listCuratedRoutes national-best results",
                "route \"motorcycleroads:twist-of-tepusquet-loop\" appears in listCuratedRoutes nearest results"
              ],
              "must_not_observe": [
                "geometryStatus unresolved (no gate-passing geometry)",
                "provenance is none/absent",
                "riderReady == false",
                "route absent from national-best results",
                "route absent from nearest results"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "primary": false,
      "maps_to_ac": null,
      "description": "GIVEN seeded rows WHEN reconstruct runs with canned routed lines at ratio boundaries THEN 1.00/0.61/1.59 admit (generated) and 0.59/1.61 -> review; exact ratio recorded",
      "verify": "pnpm test convex/__tests__/geometryGatePersist.integration.test.ts -t ratio",
      "scenario": {
        "id": "AC-2",
        "primary": false,
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real persistGeometryVerified/setReviewVerdict; anchor+geocode+routing seams fixtured with a canned polyline of known length)",
        "negative_control": {
          "would_fail_if": [
            "the gate always returns PASS (stub) so 0.59/1.61 still admit",
            "the ratio is not stored in the verification block (read-time recompute, empty)",
            "the boundary is coded with the wrong edge so 0.61/1.59 wrongly review"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "poc_route",
            "action": {
              "actor": "api_client",
              "steps": [
                "reconstructForRoute with a canned 41.07-mi line vs 41-mi claimed (ratio 1.002)"
              ]
            },
            "end_state": {
              "must_observe": [
                "verification.verdict == \"pass\"",
                "verification.ratio == 1.00 (+/-0.01)",
                "geometryStatus == \"generated\"",
                "riderReady == true"
              ],
              "must_not_observe": [
                "geometryStatus review (0 generated)",
                "riderReady == false"
              ]
            }
          },
          {
            "start_ref": "boundary_ratio_rows",
            "action": {
              "actor": "api_client",
              "steps": [
                "reconstruct claimed=100mi row with canned 61.0-mi line (ratio 0.61)"
              ]
            },
            "end_state": {
              "must_observe": [
                "verification.ratio == 0.61",
                "verification.verdict == \"pass\"",
                "geometryStatus == \"generated\""
              ],
              "must_not_observe": [
                "geometryStatus review (no admission)",
                "riderReady == false"
              ]
            }
          },
          {
            "start_ref": "boundary_ratio_rows",
            "action": {
              "actor": "api_client",
              "steps": [
                "reconstruct claimed=100mi row with canned 159.0-mi line (ratio 1.59)"
              ]
            },
            "end_state": {
              "must_observe": [
                "verification.ratio == 1.59",
                "verification.verdict == \"pass\"",
                "geometryStatus == \"generated\""
              ],
              "must_not_observe": [
                "geometryStatus review (no admission)",
                "riderReady == false"
              ]
            }
          },
          {
            "start_ref": "boundary_ratio_rows",
            "action": {
              "actor": "api_client",
              "steps": [
                "reconstruct claimed=100mi row with canned 59.0-mi line (ratio 0.59)"
              ]
            },
            "end_state": {
              "must_observe": [
                "verification.ratio == 0.59",
                "verification.verdict == \"review\"",
                "geometryStatus == \"review\""
              ],
              "must_not_observe": [
                "geometryStatus generated (0 admitted)",
                "riderReady == true"
              ]
            }
          },
          {
            "start_ref": "boundary_ratio_rows",
            "action": {
              "actor": "api_client",
              "steps": [
                "reconstruct claimed=100mi row with canned 161.0-mi line (ratio 1.61)"
              ]
            },
            "end_state": {
              "must_observe": [
                "verification.ratio == 1.61",
                "verification.verdict == \"review\"",
                "geometryStatus == \"review\""
              ],
              "must_not_observe": [
                "geometryStatus generated (0 admitted)",
                "riderReady == true"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "primary": false,
      "maps_to_ac": null,
      "description": "GIVEN fixtured anchors WHEN reconstruct runs THEN 1 anchor -> review (failedCondition anchors) with 0 routing calls; a >150mi anchor is excluded before routing",
      "verify": "pnpm test convex/__tests__/geometryGatePersist.integration.test.ts -t anchors",
      "scenario": {
        "id": "AC-3",
        "primary": false,
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real gate + persist; anchor+geocode seams fixtured; routing seam spy asserts non-invocation)",
        "negative_control": {
          "would_fail_if": [
            "the <2-anchor guard is missing so a routing call fires on 1 anchor",
            "regionCheck is disconnected so the 300-mi anchor routes into the line",
            "anchorCount is fabricated rather than counted from surviving geocodes"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "poc_route",
            "action": {
              "actor": "api_client",
              "steps": [
                "reconstruct with fixtured emit_anchors yielding exactly 1 valid geocodable anchor"
              ]
            },
            "end_state": {
              "must_observe": [
                "geometryStatus == \"review\"",
                "verification.failedCondition == \"anchors\"",
                "routing seam invocation count == 0"
              ],
              "must_not_observe": [
                "geometryStatus generated (0 admitted)",
                "riderReady == true",
                "any routing call made"
              ]
            }
          },
          {
            "start_ref": "poc_route",
            "action": {
              "actor": "api_client",
              "steps": [
                "reconstruct with fixtured emit_anchors including one anchor ~300 mi off-region plus >=2 in-region"
              ]
            },
            "end_state": {
              "must_observe": [
                "off-region anchor (~300 mi) excluded: 0 anchors > 150 mi persisted",
                "verification.anchorCount counts only anchors <= 150 mi",
                "verification.verdict == \"pass\""
              ],
              "must_not_observe": [
                "an anchor > 150 mi in the persisted anchors[]",
                "geometryStatus unresolved (none)"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "primary": false,
      "maps_to_ac": null,
      "description": "GIVEN canned degenerate routed lines WHEN reconstruct runs THEN a 2-point line and a 10-pt/50-mi line both fail (degenerate=true, review) and never generate",
      "verify": "pnpm test convex/__tests__/geometryGatePersist.integration.test.ts -t degenerate",
      "scenario": {
        "id": "AC-4",
        "primary": false,
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real gate + persist; routing seam returns the canned degenerate polylines)",
        "negative_control": {
          "would_fail_if": [
            "degenerateCheck is a no-op so a 2-point line persists as generated",
            "the points-per-mile rule is omitted so the 10-pt/50-mi line passes",
            "the degenerate flag is not stored on the verification block (empty)"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "degenerate_rows",
            "action": {
              "actor": "api_client",
              "steps": [
                "reconstruct the row whose canned routed line decodes to 2 points"
              ]
            },
            "end_state": {
              "must_observe": [
                "verification.degenerate == true",
                "geometryStatus == \"review\"",
                "verification.failedCondition == \"degenerate\""
              ],
              "must_not_observe": [
                "geometryStatus generated (0 admitted)",
                "riderReady == true"
              ]
            }
          },
          {
            "start_ref": "degenerate_rows",
            "action": {
              "actor": "api_client",
              "steps": [
                "reconstruct the row whose canned routed line decodes to 10 points over ~50 miles (<1 pt/mi)"
              ]
            },
            "end_state": {
              "must_observe": [
                "verification.degenerate == true",
                "geometryStatus == \"review\""
              ],
              "must_not_observe": [
                "geometryStatus generated (0 admitted)",
                "riderReady == true"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "primary": false,
      "maps_to_ac": null,
      "description": "GIVEN a quarantined (null) claimed length WHEN reconstruct runs THEN ratio-skip: admission decided by degenerate+region, routed length stored as truth",
      "verify": "pnpm test convex/__tests__/geometryGatePersist.integration.test.ts -t quarantine",
      "scenario": {
        "id": "AC-5",
        "primary": false,
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real gate + persist; a canned non-degenerate in-region 22.0-mi routed line)",
        "negative_control": {
          "would_fail_if": [
            "the ratio check still runs on null claimed length and reviews the row",
            "routedMiles is not stored so there is no measured truth (empty)",
            "quarantine is ignored and a divide-by-null throws"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "quarantined_length_row",
            "action": {
              "actor": "api_client",
              "steps": [
                "reconstruct the null-claimed-length row with a canned non-degenerate 22.0-mi line and >=2 in-region anchors"
              ]
            },
            "end_state": {
              "must_observe": [
                "verification.ratio == null (ratio-skip)",
                "verification.claimedMiles == null",
                "verification.verdict == \"pass\" (decided by degenerate + region)",
                "verification.routedMiles == 22.0 (stored as truth)",
                "geometryStatus == \"generated\""
              ],
              "must_not_observe": [
                "verification.verdict review from a ratio check",
                "geometryStatus unresolved (none)"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-6",
      "type": "acceptance_criterion",
      "primary": false,
      "maps_to_ac": null,
      "description": "GIVEN review rows from AC-2/3/4 WHEN read by routeId THEN each names WHICH gate condition failed (ratio|anchors|degenerate)",
      "verify": "pnpm test convex/__tests__/geometryGatePersist.integration.test.ts -t failedCondition",
      "scenario": {
        "id": "AC-6",
        "primary": false,
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (read review records via getVerificationForRoute)",
        "negative_control": {
          "would_fail_if": [
            "the review record stores no failedCondition (an operator cannot tell why it failed)",
            "failedCondition is a constant string regardless of the real failing check (hardcoded)"
          ]
        },
        "evidence": {
          "artifact_type": "api_response",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "boundary_ratio_rows",
            "action": {
              "actor": "api_client",
              "steps": [
                "read verification for the 1.61-ratio review row"
              ]
            },
            "end_state": {
              "must_observe": [
                "failedCondition == \"ratio\""
              ],
              "must_not_observe": [
                "failedCondition is none/absent",
                "failedCondition == null"
              ]
            }
          },
          {
            "start_ref": "poc_route",
            "action": {
              "actor": "api_client",
              "steps": [
                "read verification for the 1-anchor review row"
              ]
            },
            "end_state": {
              "must_observe": [
                "failedCondition == \"anchors\""
              ],
              "must_not_observe": [
                "failedCondition is none/absent"
              ]
            }
          },
          {
            "start_ref": "degenerate_rows",
            "action": {
              "actor": "api_client",
              "steps": [
                "read verification for the 2-point review row"
              ]
            },
            "end_state": {
              "must_observe": [
                "failedCondition == \"degenerate\""
              ],
              "must_not_observe": [
                "failedCondition is none/absent"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-7",
      "type": "acceptance_criterion",
      "primary": false,
      "maps_to_ac": null,
      "description": "GIVEN the all-good PoC route WHEN each of 7 riderReady inputs is flipped one at a time THEN the stored+indexed riderReady flips false each time; best-mode reads the riderReady index",
      "verify": "pnpm test convex/__tests__/geometryGatePersist.integration.test.ts -t riderReady",
      "scenario": {
        "id": "AC-7",
        "primary": false,
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real recomputeRiderReady + mutations to flip each input + indexed listCuratedRoutes read)",
        "negative_control": {
          "would_fail_if": [
            "the predicate is a constant true (stub) so a flip does not flip the flag",
            "one of the seven inputs is not read by the predicate",
            "the gated query filters in memory over a full scan instead of walking the riderReady index",
            "riderReady is recomputed at read time rather than stored + indexed"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "poc_route",
            "action": {
              "actor": "api_client",
              "steps": [
                "persist PoC to all-good state; recompute",
                "flip each of the 7 inputs one at a time (geometry verdict, name, score, length, ride-worthiness, retired, shadow); recompute after each",
                "restore all-good; read listCuratedRoutes best-mode"
              ]
            },
            "end_state": {
              "must_observe": [
                "riderReady == true only in the all-good state",
                "riderReady == false after EACH single flip (7 flips)",
                "route \"motorcycleroads:twist-of-tepusquet-loop\" present in listCuratedRoutes national-best via the by_riderReady_and_composite_score index",
                "route doc has a stored riderReady == true boolean field (not read-time)"
              ],
              "must_not_observe": [
                "riderReady == true while any one required input is bad",
                "riderReady computed at read time (no stored field)"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-1",
      "description": "Smoke lane: reconstructForRoute on Twist of Tepusquet -> generated/ai_reconstructed/ratio in [0.6,1.6]/riderReady true/returns in best AND nearest (SKIP-with-reason on outage)",
      "verify": "pnpm test convex/__tests__/reconstructReferenceFlow.integration.test.ts"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-2",
      "description": "Boundary ratios 1.00/0.61/1.59 admit (generated) and 0.59/1.61 review through the real persist mutation; verification.ratio recorded exactly",
      "verify": "pnpm test convex/__tests__/geometryGatePersist.integration.test.ts -t ratio"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-3",
      "description": "1 anchor -> review (failedCondition 'anchors') with zero routing calls; a 300-mi anchor excluded before routing",
      "verify": "pnpm test convex/__tests__/geometryGatePersist.integration.test.ts -t anchors"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-4",
      "description": "A 2-point line and a 10-pt/50-mi line are both rejected degenerate and never generated",
      "verify": "pnpm test convex/__tests__/geometryGatePersist.integration.test.ts -t degenerate"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-5",
      "description": "Null claimed length -> ratio-skip; degenerate+region decide; routedMiles stored as truth",
      "verify": "pnpm test convex/__tests__/geometryGatePersist.integration.test.ts -t quarantine"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-6",
      "description": "Each review record names its failedCondition (ratio/anchors/degenerate) readable by routeId",
      "verify": "pnpm test convex/__tests__/geometryGatePersist.integration.test.ts -t failedCondition"
    },
    {
      "id": "TC-7",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-7",
      "description": "Seven-input riderReady composition; single-input flip flips the flag; best-mode reads the by_riderReady index",
      "verify": "pnpm test convex/__tests__/geometryGatePersist.integration.test.ts -t riderReady"
    },
    {
      "id": "TC-8",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-1",
      "description": "SUPPLEMENTARY pure gate math (unit): 0.6/0.61/1.59/1.6 inclusive-admit and 0.59/1.61 review; points<=4 and points<routedMi degenerate; 150.0 vs 150.1 region; null-claimed ratio-skip",
      "verify": "pnpm test convex/__tests__/curatedGeometryGate.test.ts"
    }
  ]
}
-->
</details>
