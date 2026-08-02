# REDHAT-FIX-01 — Re-run closeout without `lever2FixedGeometry`, using live-provider provenance and recovered catalog routes (UC-REC-04, UC-VER-05)
> Status: ⬜ Pending

| Field | Value |
|-------|-------|
| TASK_ID | REDHAT-FIX-01 |
| SPRINT | [Sprint 04 — Trust pipeline](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`convex-implementer` · reviewer=`convex-reviewer` |
| ESTIMATE | 120 min |
| EFFORT | M |
| PRIORITY | P0 |
| STATUS | Backlog |
| PROPOSED_BY | `convex-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | CAP-GEO-01, CAP-GEO-05, CAP-GEO-06 |
| DEPENDS_ON | REDHAT-FIX-02, REDHAT-FIX-03, REDHAT-FIX-04, REDHAT-FIX-05, REDHAT-FIX-06, REDHAT-FIX-07, REDHAT-FIX-08, REDHAT-FIX-09, REDHAT-FIX-10, REDHAT-FIX-11 |
| BLOCKS | — (this is the closeout; nothing else in-sprint depends on it) |

RUNTIME_COMMANDS:
- test: `npx vitest run convex/__tests__/REDHATFIX01-*.integration.test.ts`
- typecheck: `npx tsc --noEmit -p convex/tsconfig.json` (in-scope surface; see DONE WHEN for the repo-wide no-regression clause)
- lint: `pnpm exec biome check`

> **Command note:** `pnpm test` maps to bare `vitest` (watch mode) and HANGS in an agent shell — always use `npx vitest run`. vitest has no `--grep`; the single-test filter is `-t '<name>'`.

## OUTCOME

A closeout re-run stores Lever 2 geometry with `ai_reconstructed` provenance and provider-recorded routed miles/polyline (never an injected literal); the public waterfall surface rejects `lever2FixedGeometry`; the `--all` unlock derives only from REDHAT-FIX-03's manifest-bound operator couch PASS; the legacy synthetic fake-gate path yields no passing evidence.

## ⚠️ RE-VERIFICATION: STILL UNRESOLVED (fresh red-hat review, 2026-07-20T18:51:10Z; re-checked against HEAD `b2499228`)

This task's OUTCOME above (public surface rejects `lever2FixedGeometry`) has **not** been delivered. `b2499228` ("gate deterministic test seams away from production closeout") added `assertTestSubjectOrThrow` (`convex/guards.ts:184-193`) but that only checks the caller's subject prefix — it does not remove the argument. `convex/waterfallOrchestrator.ts:451-465` still declares `lever2FixedGeometry` as an accepted public arg on `runSampleWaterfall`, routed to `reconstructForRouteWithFixedGeometry` at `:611-621`; `convex/reviewQueue.ts:550-557,583-593` accept and route it identically on `retryDisposition`. Any authenticated `test:`/`dev-`-prefixed identity can still inject fabricated Lever-2 geometry through the public surface, and the FIX-01 negative integration test proving rejection was never added (no `REDHATFIX01-*.integration.test.ts` files exist).

**Additional required AC (regression proof against current source):**

### AC-R1 [Regression] — Public surfaces reject `lever2FixedGeometry`; the deterministic seam survives internal-only

**Requirement:** GIVEN the current public `runSampleWaterfall`/`retryDisposition` surfaces WHEN a caller invokes either with a `lever2FixedGeometry` argument THEN the call is rejected with `ArgumentValidationError` (the arg is removed from the public validator, not merely subject-gated) and no injected geometry is stored; the deterministic reconstruct path remains reachable only via an `internal.*` reference for the test harness.

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real public argument surface)
- FLOW_REF: UC-REC-04
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX01-public-seam-removed.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: `lever2FixedGeometry` is still an accepted public arg gated only by `assertTestSubjectOrThrow` (unchanged `waterfallOrchestrator.ts:451-465,480-482`, `reviewQueue.ts:550-557,565-566`) so a `test:`-prefixed caller still stores injected geometry; the arg is silently dropped but the call still succeeds
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — seed a Lever-2-eligible route (`seedWaterfallFixtures`); authenticate as a `test:`-prefixed subject; call `runSampleWaterfall({routeIds:[...], lever2FixedGeometry:{routedMiles:41}})`; call `retryDisposition({routeId:..., lever2FixedGeometry:{routedMiles:41}})` on a seeded REVIEW route
  - MUST_OBSERVE: both calls rejected with `error.code == 'ArgumentValidationError'`; `curated_route_geometry` rows with `routedMiles == 41` count == 0
  - MUST_NOT_OBSERVE: either call succeeds; a stored geometry row with `routedMiles == 41`

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- MUST read convex/_generated/ai/guidelines.md before implementation
- MUST remove the public `lever2FixedGeometry` override from the caller-reachable `runSampleWaterfall`/`runAllWaterfall` surface
- MUST drive closeout Lever 2 through the real reconstruct path, with provider exchanges recorded once (`recorded_external`) and replayed byte-exact
- MUST keep the closeout fail-closed: a run that attempts the legacy synthetic-identity + `lever2FixedGeometry` path produces no couch PASS and no `--all` unlock

**NEVER**
- NEVER leave `lever2FixedGeometry` reachable from an authenticated non-operator public caller
- NEVER let the closeout store Lever 2 geometry whose `routedMiles` equals an injected literal (e.g. 41) rather than the provider recording
- NEVER re-open the `--all` unlock except through REDHAT-FIX-03's manifest-bound couch gate
- NEVER hand-author or edit the Lever 2 provider cassette — re-record by deleting the file

**STRICTLY**
- STRICTLY this task is the closeout and must not begin until all of REDHAT-FIX-02..11 have landed (it re-validates the whole batch)
- STRICTLY any residual deterministic Lever 2 seam is internalAction-only and operator + test-env gated, never on the public action

## DONE WHEN

- AC-1 [Public waterfall surface rejects the lever2FixedGeometry override] [PRIMARY]: An authenticated non-operator's `runSampleWaterfall` call with `lever2FixedGeometry` is rejected with `ArgumentValidationError` and no injected geometry is stored
- AC-2 [Closeout Lever 2 geometry is live-provider-derived]: Replaying a recorded Google Routes cassette through the real `reconstructForRoute` path stores `ai_reconstructed` provenance with the cassette's routed miles/polyline, never a literal
- AC-3 [Closeout --all unlock derives only from the manifest-bound operator couch PASS]: `runAllWaterfall` throws `COUCH_GATE_BLOCKED` until a manifest-bound operator pass exists, then proceeds
- AC-4 [Legacy synthetic fake-gate path is fail-closed]: Replaying the legacy step1/step4 synthetic pattern is rejected and leaves `couchGateStatus.allowed == false`
- Every behavioral AC scenario passes `validate_scenario` (exit 0 — run the extract-and-pipe command in VERIFICATION GATES); RED-against-start recorded before GREEN; seeded-value EVIDENCE artifact captured
- `npx tsc --noEmit -p convex/tsconfig.json` → 0 errors (in-scope) + `pnpm exec biome check` clean + `pnpm convex:dev --once` clean
- NO-REGRESSION: `pnpm type-check` reports zero new errors vs. a baseline captured at task start (`pnpm type-check 2>&1 | grep -c 'error TS'` before the first edit; compare at the end)
- Only SCOPE.writeAllowed files modified (`git diff --name-only`)

## SPECIFICATION

**Objective:** Make the Sprint 04 couch-gate closeout run Lever 2 for real (no `lever2FixedGeometry`) over recovered catalog routes with recorded live-provider exchanges, remove the public fixed-geometry seam the prior fake gate exploited, and produce a closeout evidence trail that is structurally impossible to satisfy via the injected-geometry path.

**Success state:** A closeout run stores Lever 2 geometry with `ai_reconstructed` provenance and provider-recorded routed miles/polyline; the public waterfall surface rejects `lever2FixedGeometry`; the `--all` unlock derives only from REDHAT-FIX-03's manifest-bound operator couch PASS; the legacy synthetic fake path yields no passing evidence.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `recovered-catalog-route-needing-lever2` (seed_method: `public_api`): A real recovered catalog route (`curated_routes`) with no stored geometry that genuinely requires Lever 2 reconstruction — the honest closeout subject, not a `test:lever2-pass` fixture with injected geometry
    - `curated_routes` row, geometryStatus unresolved, no `curated_route_geometry`, seeded via the existing recovery/seed path
- `lever2-live-provider-cassette` (seed_method: `recorded_external`): Google Routes API v2 (`directions/v2:computeRoutes`) + Geocoding request/response pairs recorded ONCE from the live provider for the recovered route's Lever 2 reconstruction, replayed byte-exact (mirrors S4-T1 AC-5). Routed miles/polyline are the provider's own values, never authored
    - cassette: `convex/__tests__/fixtures/REDHATFIX01-lever2-live-provider.cassette.json` — recorded via `reconstructForRoute`'s `routeWithInvocationCount` → `defaultRoute` → Google Routes v2, in call order
    - recording procedure: with a live `GOOGLE_MAPS_API_KEY`, run the recovered route's Lever 2 reconstruction once with cassette recording enabled; commit the cassette; re-record by deleting the file
- `manifest-bound-couch-pass` (seed_method: `public_api`): A REDHAT-FIX-03 operator-recorded couch PASS bound to the current active sample manifest — the only legitimate `--all` unlock the closeout may rely on
    - operator couch verdict (pass) bound to current manifest hash via REDHAT-FIX-03's `recordCouchVerdict`

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — Public waterfall surface rejects the lever2FixedGeometry override

**Requirement:** GIVEN an authenticated non-operator caller and the remediated public surface WHEN the caller invokes `runSampleWaterfall` with a `lever2FixedGeometry` argument (the prior fake-gate seam) THEN the call is rejected (argument no longer accepted on the public surface) and no Lever 2 geometry is stored from an injected value

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real public `runSampleWaterfall`/`runAllWaterfall` argument surface)
- FLOW_REF: UC-REC-04
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX01-public-seam-removed.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: `lever2FixedGeometry` is still an accepted public arg and injected geometry is stored; the arg is silently ignored yet the call still succeeds storing injected geometry (a mock/stub of the validator); the seam is merely renamed but still public
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `recovered-catalog-route-needing-lever2`
  - ACTION: Seed a recovered catalog route needing Lever 2; as an authenticated non-operator, call `runSampleWaterfall` with `lever2FixedGeometry:{routedMiles:41,...}`; capture the rejection and query the route's stored geometry
  - MUST_OBSERVE: the call is rejected with `error.code == 'ArgumentValidationError'`; `curated_route_geometry.routedMiles` for the route `!= 41` (no injected value stored)
  - MUST_NOT_OBSERVE: `curated_route_geometry` row is empty/absent because the call silently no-op'd; a stored geometry row whose `routedMiles == 41`

### AC-2 — Closeout Lever 2 geometry is live-provider-derived

**Requirement:** GIVEN a recovered catalog route with no geometry and a recorded Google Routes cassette WHEN the closeout runs Lever 2 through the real reconstruct path replaying the cassette (no `lever2FixedGeometry`) THEN stored geometry has `ai_reconstructed` provenance and `routedMiles`/`encodedPolyline` equal to the cassette-recorded values

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Google Routes API v2 (recorded_external cassette) + production `reconstructForRoute` on Convex dev deployment
- FLOW_REF: UC-REC-04
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX01-lever2-live-provider.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: stored `routedMiles` equals a hardcoded literal (41) rather than the cassette value; provenance is not `ai_reconstructed` (empty/undefined); the stored `encodedPolyline` is `buildCannedPolyline` stub output rather than the recorded provider polyline; Lever 2 ran via a mocked/injected fixed-geometry path
- EVIDENCE: `api_response` (required_capture: true)
- CASE 1 — start_ref `lever2-live-provider-cassette`
  - ACTION: Seed the recovered route; run the closeout Lever 2 reconstruction through `reconstructForRoute` replaying the cassette, with NO `lever2FixedGeometry`; query the stored `curated_route_geometry` and compare against the cassette's recorded values
  - MUST_OBSERVE: stored geometry `provenance == 'ai_reconstructed'`; stored `routedMiles == cassette.recordedRoutedMiles`
  - MUST_NOT_OBSERVE: stored `routedMiles == 41` (a hardcoded literal); provenance is empty/undefined; stored polyline equals the static `buildCannedPolyline` default

### AC-3 — Closeout --all unlock derives only from the manifest-bound operator couch PASS

**Requirement:** GIVEN a REDHAT-FIX-03 operator couch PASS bound to the current active sample manifest WHEN the closeout drives `runAllWaterfall` THEN the batch unlocks only because `couchGateStatus.allowed` is true for the current manifest — and stays blocked if that manifest-bound pass is absent

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real manifest-bound `couchGateStatus` gating `runAllWaterfall`)
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX01-couch-gate-bound-closeout.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: `runAllWaterfall` unlocks from a stubbed/mocked gate check; the gate check is bypassed (removed) in the closeout path; `runAllWaterfall` proceeds while `couchGateStatus.allowed` is empty/undefined
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `manifest-bound-couch-pass`
  - ACTION: With NO manifest-bound pass, call `runAllWaterfall` and capture the block; record a REDHAT-FIX-03 operator pass bound to the current manifest; call `runAllWaterfall` again and capture the unlock
  - MUST_OBSERVE: the first `runAllWaterfall` throws `error.code == 'COUCH_GATE_BLOCKED'`; after the manifest-bound operator pass, `gate.allowed == true`
  - MUST_NOT_OBSERVE: `gate.allowed == false` after the manifest-bound pass is recorded; `runAllWaterfall` proceeding while `gate.allowed` is empty/undefined

### AC-4 — Legacy synthetic fake-gate path is fail-closed

**Requirement:** GIVEN the remediated backend and the legacy step1/step4 pattern (synthetic identity + `lever2FixedGeometry` + mechanical all-true verdicts) WHEN that pattern is executed THEN it errors (seam removed and/or operator required) and produces no couch PASS and no `--all` unlock

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real remediated waterfall + couch verdict surfaces)
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX01-fake-path-fail-closed.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the legacy synthetic path still produces a couch PASS via a mocked/stubbed guard; `lever2FixedGeometry` injection still succeeds; mechanical all-true verdicts from a non-operator still unlock `--all`
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `recovered-catalog-route-needing-lever2`
  - ACTION: Replay the legacy step1 waterfall call with `lever2FixedGeometry` as a synthetic non-operator identity; replay the legacy step4 mechanical all-true `recordCouchVerdict` as the same identity; query `couch_verdicts` and `couchGateStatus`
  - MUST_OBSERVE: the legacy waterfall call is rejected with `error.code == 'ArgumentValidationError'`; `couchGateStatus.allowed == false` after the attempts
  - MUST_NOT_OBSERVE: `couch_verdicts` count for the synthetic sample `> 0` (a couch PASS recorded from the synthetic path); `couchGateStatus.allowed == true` after the fake attempts

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | runSampleWaterfall rejects a lever2FixedGeometry argument with an ArgumentValidationError | AC-1 | `npx vitest run convex/__tests__/REDHATFIX01-public-seam-removed.integration.test.ts -t 'TC-1'` |
| TC-2 | No geometry with routedMiles==41 from an injected value is stored after the rejected call | AC-1 | `npx vitest run convex/__tests__/REDHATFIX01-public-seam-removed.integration.test.ts -t 'TC-2'` |
| TC-3 | Closeout Lever 2 stored routedMiles equals the cassette-recorded provider value | AC-2 | `npx vitest run convex/__tests__/REDHATFIX01-lever2-live-provider.integration.test.ts -t 'TC-3'` |
| TC-4 | Closeout Lever 2 stored encodedPolyline equals the cassette-recorded provider polyline | AC-2 | `npx vitest run convex/__tests__/REDHATFIX01-lever2-live-provider.integration.test.ts -t 'TC-4'` |
| TC-5 | runAllWaterfall throws COUCH_GATE_BLOCKED with no manifest-bound pass and proceeds after one | AC-3 | `npx vitest run convex/__tests__/REDHATFIX01-couch-gate-bound-closeout.integration.test.ts -t 'TC-5'` |
| TC-6 | The legacy synthetic fake-gate pattern records no couch PASS and leaves couchGateStatus.allowed false | AC-4 | `npx vitest run convex/__tests__/REDHATFIX01-fake-path-fail-closed.integration.test.ts -t 'TC-6'` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- convex/waterfallOrchestrator.ts (MODIFY) — remove/gate the public `lever2FixedGeometry` seam; any residual deterministic seam is internalAction + operator + test-env only
- convex/couchVerdict.ts (MODIFY, MINIMAL) — `runAllWaterfall` unlock wired to REDHAT-FIX-03's manifest-bound `couchGateStatus` (coordinate with REDHAT-FIX-03's owner)
- convex/__tests__/REDHATFIX01-*.integration.test.ts (NEW)
- convex/__tests__/fixtures/REDHATFIX01-lever2-live-provider.cassette.json (NEW) — recorded ONCE from Google Routes v2 + Geocoding
- .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/.gate-evidence/\<new-timestamp\>/scripts/*.sh (NEW) — replacement closeout scripts with live-provider provenance and no `lever2FixedGeometry`

**writeProhibited:**
- Re-implementing the couch manifest binding or operator primitive — owned by REDHAT-FIX-03/06
- Editing the `.gate-evidence/2026-07-19T22:59:46Z` fake scripts in place — author a new closeout run instead
- Hand-authoring/editing the Lever 2 provider cassette
- Re-adding `lever2FixedGeometry` to any public/authenticated action surface
- Modifying rideWorthinessClassifier.ts — owned by REDHAT-FIX-02

## READING LIST

- `convex/waterfallOrchestrator.ts` (435-469) — `lever2FixedGeometryValidator` + `runSampleWaterfall` args — the public fixed-geometry seam to remove/gate
- `convex/couchVerdict.ts` (323-353) — `runAllWaterfall` gate delegation — must unlock only via REDHAT-FIX-03's manifest-bound `couchGateStatus`
- `convex/actions/curatedGeometryReconstruct.ts` (78-83) — `routeWithInvocationCount` — the only real Google Routes boundary; closeout Lever 2 must go through it (cassette record/replay per S4-T1 AC-5)
- `.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/.gate-evidence/2026-07-19T22:59:46Z/scripts/step1.sh` (4-11) — the fake closeout: synthetic identity + `lever2FixedGeometry` injection to make impossible
- `.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/.gate-evidence/2026-07-19T22:59:46Z/scripts/step4.sh` (5-18) — mechanical all-true `recordCouchVerdict` — must fail-closed under REDHAT-FIX-03
- `.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/S4-T1-deterministic-geometry-gate-ver-01-full-ratio-band-anchor.md` (227-247) — recorded_external cassette pattern to reuse for the live-provider Lever 2 proof

## CODE PATTERN

- Pattern: Remove the injected-geometry test seam from the public action; drive closeout Lever 2 through the real reconstruct/provider boundary with a `recorded_external` cassette (record-once, replay byte-exact); gate `--all` solely on REDHAT-FIX-03's manifest-bound operator couch PASS
- Pattern source: `convex/curatedGeometryGate.ts:73-102` + S4-T1 AC-5 `recorded_external` cassette (`curatedGeometryReconstruct.ts:78-83`)
- Anti-pattern: `runSampleWaterfall` accepting a public `lever2FixedGeometry` override that injects deterministic Lever 2 geometry (`waterfallOrchestrator.ts:442-449`), enabling `step1.sh`'s synthetic "live" run

## VERIFICATION GATES

- test: `npx vitest run convex/__tests__/REDHATFIX01-*.integration.test.ts` → Exit 0
- typecheck (in-scope): `npx tsc --noEmit -p convex/tsconfig.json` → Exit 0
- typecheck (no-regression): `pnpm type-check 2>&1 | grep -c 'error TS'` → no greater than the baseline captured at task start
- lint: `pnpm exec biome check` → Exit 0
- convex build: `pnpm convex:dev --once` → Exit 0
- scenario validator → Exit 0, zero CRITICAL/HIGH:

```bash
python3 -c "import re,sys;print(re.search(r'<!-- REQUIREMENT-CONTRACT v1 -->\n<!--\n(.*?)\n-->',open(sys.argv[1]).read(),re.S).group(1))" \
  .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/REDHAT-FIX-01-*.md \
  | python3 ~/Projects/brain/tools/validate-scenario/validate_scenario.py; echo "EXIT:$?"
```

## AGENT ASSIGNMENT

- Agent: `convex-implementer` — Convex backend implementation; removes the public fixed-geometry seam and re-validates the couch-gate closeout against live providers
- Reviewer: `convex-reviewer`

## EVIDENCE GATES

- RED phase: each behavioral AC's test went red before green (TDD_STATE history)
- Integration coverage: PRIMARY AC is `integration` against the real Convex dev deployment + a recorded live-provider cassette
- Scenario un-fakeable: `validate_scenario` exit 0 on every behavioral AC; captured EVIDENCE shows the seeded MUST_OBSERVE value (not merely "tests passed")

## DEPENDENCIES

- Depends on: REDHAT-FIX-02, REDHAT-FIX-03, REDHAT-FIX-04, REDHAT-FIX-05, REDHAT-FIX-06, REDHAT-FIX-07, REDHAT-FIX-08, REDHAT-FIX-09, REDHAT-FIX-10, REDHAT-FIX-11
- Blocks: —

## CODING STANDARDS

- convex/_generated/ai/guidelines.md
- brain/docs/TESTING-HIERARCHY.md
- brain/docs/CODING-STANDARDS.md
- brain/docs/CONVEX-RULES.md

<details>
<summary>▸ Full agent specification (TASK-TEMPLATE v5.2 — machine-readable requirement contract)</summary>

<!-- REQUIREMENT-CONTRACT v1
-->
<!--
{
  "version": "1",
  "task_id": "REDHAT-FIX-01",
  "tdd_mode": "red_first",
  "verification_policy": { "requires_tests": true, "requires_red_evidence": true, "requires_seeded_evidence": true },
  "fixtures": {
    "recovered-catalog-route-needing-lever2": { "description": "A real recovered catalog route (curated_routes) with no stored geometry that genuinely requires Lever 2 reconstruction — the honest closeout subject, not a test:lever2-pass fixture with injected geometry.", "seed_method": "public_api", "records": ["curated_routes row for a recovered route, geometryStatus unresolved, no curated_route_geometry, seeded via the existing recovery/seed path (real mutation)"] },
    "lever2-live-provider-cassette": { "description": "Google Routes API v2 (directions/v2:computeRoutes) + Geocoding request/response pairs recorded ONCE from the live provider for the recovered route's Lever 2 reconstruction, replayed byte-exact (mirrors S4-T1 AC-5 recorded_external). Routed miles/polyline are the provider's own values.", "seed_method": "recorded_external", "records": ["cassette: convex/__tests__/fixtures/REDHATFIX01-lever2-live-provider.cassette.json", "recording procedure: with a live GOOGLE_MAPS_API_KEY, run the recovered route's Lever 2 reconstruction once with cassette recording enabled; commit; re-record by deleting the file"] },
    "manifest-bound-couch-pass": { "description": "A REDHAT-FIX-03 operator-recorded couch PASS bound to the current active sample manifest — the only legitimate --all unlock the closeout may rely on.", "seed_method": "public_api", "records": ["operator couch verdict (pass) bound to current manifest hash via REDHAT-FIX-03 recordCouchVerdict"] }
  },
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "primary": true, "description": "Public waterfall surface rejects the lever2FixedGeometry override", "verify": "npx vitest run convex/__tests__/REDHATFIX01-public-seam-removed.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real public runSampleWaterfall/runAllWaterfall argument surface)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["lever2FixedGeometry is still an accepted public arg and injected geometry is stored", "the arg is silently ignored yet the call still succeeds storing injected geometry (a mock/stub of the validator)", "the seam is merely renamed but still public"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "recovered-catalog-route-needing-lever2", "action": { "actor": "api_client", "steps": ["Seed a recovered catalog route needing Lever 2", "As an authenticated non-operator, call runSampleWaterfall with lever2FixedGeometry:{routedMiles:41,...}", "Capture the rejection and query the route's stored geometry"] },
          "end_state": { "must_observe": ["the call is rejected with error.code == 'ArgumentValidationError'", "curated_route_geometry.routedMiles for the route != 41 (no injected value stored)"], "must_not_observe": ["curated_route_geometry row is empty/absent because the call silently no-op'd", "a stored geometry row whose routedMiles == 41"] } } ] } },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "Closeout Lever 2 geometry is live-provider-derived", "verify": "npx vitest run convex/__tests__/REDHATFIX01-lever2-live-provider.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Google Routes API v2 (recorded_external cassette) + production reconstructForRoute on Convex dev deployment", "topology": "single-node",
        "negative_control": { "would_fail_if": ["stored routedMiles equals a hardcoded literal (41) rather than the cassette value", "provenance is not ai_reconstructed (empty/undefined)", "the stored encodedPolyline is buildCannedPolyline stub output rather than the recorded provider polyline", "Lever 2 ran via a mocked/injected fixed-geometry path"] },
        "evidence": { "artifact_type": "api_response", "required_capture": true },
        "cases": [ { "start_ref": "lever2-live-provider-cassette", "action": { "actor": "api_client", "steps": ["Seed the recovered route", "Run the closeout Lever 2 reconstruction through reconstructForRoute replaying the cassette, with NO lever2FixedGeometry", "Query the stored curated_route_geometry and compare against the cassette's recorded values"] },
          "end_state": { "must_observe": ["stored geometry provenance == 'ai_reconstructed'", "stored routedMiles == cassette.recordedRoutedMiles"], "must_not_observe": ["stored routedMiles == 41 (a hardcoded literal)", "provenance is empty/undefined", "stored polyline equals the static buildCannedPolyline default"] } } ] } },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "Closeout --all unlock derives only from the manifest-bound operator couch PASS", "verify": "npx vitest run convex/__tests__/REDHATFIX01-couch-gate-bound-closeout.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real manifest-bound couchGateStatus gating runAllWaterfall)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["runAllWaterfall unlocks from a stubbed/mocked gate check", "the gate check is bypassed (removed) in the closeout path", "runAllWaterfall proceeds while couchGateStatus.allowed is empty/undefined"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "manifest-bound-couch-pass", "action": { "actor": "api_client", "steps": ["With NO manifest-bound pass, call runAllWaterfall and capture the block", "Record a REDHAT-FIX-03 operator pass bound to the current manifest", "Call runAllWaterfall again and capture the unlock"] },
          "end_state": { "must_observe": ["the first runAllWaterfall throws error.code == 'COUCH_GATE_BLOCKED'", "after the manifest-bound operator pass, gate.allowed == true"], "must_not_observe": ["gate.allowed == false after the manifest-bound pass is recorded", "runAllWaterfall proceeding while gate.allowed is empty/undefined"] } } ] } },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "Legacy synthetic fake-gate path is fail-closed", "verify": "npx vitest run convex/__tests__/REDHATFIX01-fake-path-fail-closed.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real remediated waterfall + couch verdict surfaces)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["the legacy synthetic path still produces a couch PASS via a mocked/stubbed guard", "lever2FixedGeometry injection still succeeds", "mechanical all-true verdicts from a non-operator still unlock --all"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "recovered-catalog-route-needing-lever2", "action": { "actor": "api_client", "steps": ["Replay the legacy step1 waterfall call with lever2FixedGeometry as a synthetic non-operator identity", "Replay the legacy step4 mechanical all-true recordCouchVerdict as the same identity", "Query couch_verdicts and couchGateStatus"] },
          "end_state": { "must_observe": ["the legacy waterfall call is rejected with error.code == 'ArgumentValidationError'", "couchGateStatus.allowed == false after the attempts"], "must_not_observe": ["couch_verdicts count for the synthetic sample > 0 (a couch PASS recorded from the synthetic path)", "couchGateStatus.allowed == true after the fake attempts"] } } ] } },
    { "id": "TC-1", "type": "test_criterion", "description": "runSampleWaterfall rejects lever2FixedGeometry with ArgumentValidationError", "maps_to_ac": "AC-1", "verify": "npx vitest run convex/__tests__/REDHATFIX01-public-seam-removed.integration.test.ts -t 'TC-1'" },
    { "id": "TC-2", "type": "test_criterion", "description": "No injected routedMiles==41 geometry stored after rejection", "maps_to_ac": "AC-1", "verify": "npx vitest run convex/__tests__/REDHATFIX01-public-seam-removed.integration.test.ts -t 'TC-2'" },
    { "id": "TC-3", "type": "test_criterion", "description": "Closeout Lever 2 routedMiles equals cassette value", "maps_to_ac": "AC-2", "verify": "npx vitest run convex/__tests__/REDHATFIX01-lever2-live-provider.integration.test.ts -t 'TC-3'" },
    { "id": "TC-4", "type": "test_criterion", "description": "Closeout Lever 2 encodedPolyline equals cassette polyline", "maps_to_ac": "AC-2", "verify": "npx vitest run convex/__tests__/REDHATFIX01-lever2-live-provider.integration.test.ts -t 'TC-4'" },
    { "id": "TC-5", "type": "test_criterion", "description": "runAllWaterfall blocks without and proceeds with a manifest-bound pass", "maps_to_ac": "AC-3", "verify": "npx vitest run convex/__tests__/REDHATFIX01-couch-gate-bound-closeout.integration.test.ts -t 'TC-5'" },
    { "id": "TC-6", "type": "test_criterion", "description": "Legacy fake pattern records no pass and leaves allowed false", "maps_to_ac": "AC-4", "verify": "npx vitest run convex/__tests__/REDHATFIX01-fake-path-fail-closed.integration.test.ts -t 'TC-6'" },
    { "id": "AC-R1", "type": "acceptance_criterion", "primary": false, "description": "Public runSampleWaterfall/retryDisposition reject lever2FixedGeometry with ArgumentValidationError; deterministic seam survives internal-only (regression proof added 2026-07-20 fresh review)", "verify": "npx vitest run convex/__tests__/REDHATFIX01-public-seam-removed.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real public argument surface)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["lever2FixedGeometry is still an accepted public arg gated only by assertTestSubjectOrThrow (unchanged waterfallOrchestrator.ts:451-465,480-482, reviewQueue.ts:550-557,565-566)", "the arg is silently dropped but the call still succeeds"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "waterfall-lever2-subject-route", "action": { "actor": "api_client", "steps": ["Seed a Lever-2-eligible route", "Authenticate as a test:-prefixed subject", "Call runSampleWaterfall with lever2FixedGeometry:{routedMiles:41}", "Call retryDisposition with lever2FixedGeometry:{routedMiles:41} on a seeded REVIEW route"] },
          "end_state": { "must_observe": ["both calls rejected with error.code == 'ArgumentValidationError'", "curated_route_geometry rows with routedMiles == 41 count == 0"], "must_not_observe": ["either call succeeds", "a stored geometry row with routedMiles == 41"] } } ] } },
    { "id": "TC-R1", "type": "test_criterion", "description": "Public surfaces reject lever2FixedGeometry with ArgumentValidationError and store no injected geometry", "maps_to_ac": "AC-R1", "verify": "npx vitest run convex/__tests__/REDHATFIX01-public-seam-removed.integration.test.ts -t 'TC-R1'" }
  ]
}
-->

</details>
