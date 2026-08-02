# REDHAT-FIX-11 — Record and enforce the freeway/rescue-first geometry attempt required before classifier completion, with persisted coverage evidence (UC-VER-03)
> Status: ⬜ Pending

| Field | Value |
|-------|-------|
| TASK_ID | REDHAT-FIX-11 |
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
| CAPABILITIES | CAP-GEO-06 |
| DEPENDS_ON | — |
| BLOCKS | REDHAT-FIX-01 |

RUNTIME_COMMANDS:
- test: `npx vitest run convex/__tests__/REDHATFIX11-*.integration.test.ts`
- typecheck: `npx tsc --noEmit -p convex/tsconfig.json`
- lint: `pnpm exec biome check`

> **Command note:** `pnpm test` maps to bare `vitest` (watch mode) and HANGS in an agent shell — always use `npx vitest run`. vitest has no `--grep`; the single-test filter is `-t '<name>'`.

## OUTCOME

Every classified route has a queryable curation_artifacts row (artifactType 'geometry_attempt') tying its ride-worthiness verdict to a real geometry attempt; freeway rows are classified `not_a_ride` yet still carry the attempt artifact and remain non-rider-ready; a founder can query, per route and per run, that rescue-first was honored rather than merely asserted.

## ⚠️ RE-VERIFICATION: STILL UNRESOLVED (fresh red-hat review, 2026-07-20T18:51:10Z; re-checked against HEAD `b2499228`)

This task's OUTCOME above (rescue-first honored, not merely asserted, with per-run coverage) has **not** been delivered. The classifier writes `freeway_rescue_first_pending`/`completed` artifacts inside `try/catch` blocks that explicitly swallow recording errors (`convex/actions/rideWorthinessClassifier.ts:186-199,204-217`), then unconditionally calls the LLM and persists the classification regardless of whether the artifact write succeeded (`:220-232`). There is no `evidenceComplete` field on the persisted `rideWorthiness` and no durable per-run coverage record, so a freeway route can be classified complete without any verified geometry attempt, and a failed attempt-record write is silently ignored rather than blocking evidence-complete status.

**Additional required AC (regression proof against current source):**

### AC-R1 [Regression] — A freeway with no durable geometry attempt is classified `evidenceComplete=false`; per-run coverage is persisted

**Requirement:** GIVEN a freeway/FHWA route with `geometryStatus:'unresolved'` (no durable geometry attempt) WHEN the classifier processes it THEN the persisted `rideWorthiness.evidenceComplete` is `false` and the route is not `riderReady` — the geometry attempt is an enforced prerequisite, not a best-effort note whose failure is swallowed; per-run coverage totals (freeway routes attempted vs. evidence-complete) are persisted and reconciled.

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real classifier + `rideWorthiness` persistence)
- FLOW_REF: UC-VER-03
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX11-evidence-prerequisite.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the classifier records the geometry-attempt artifact best-effort in a swallowed `try/catch` and still persists a classification with no `evidenceComplete` field (unchanged `rideWorthinessClassifier.ts:186-232`); `evidenceComplete` is hardcoded `true` regardless of the attempt; no coverage record is persisted for the run
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — seed a freeway route with `geometryStatus:'unresolved'` and one with a completed geometry attempt (`geometryStatus:'generated'`); classify both in one run; query `curated_routes.rideWorthiness` and the per-run coverage record
  - MUST_OBSERVE: the unresolved freeway's `rideWorthiness.evidenceComplete == false` and `riderReady == false`; the attempted freeway's `evidenceComplete == true`; the coverage record reports `freewayAttempted:2, freewayEvidenceComplete:1`
  - MUST_NOT_OBSERVE: `evidenceComplete` absent/undefined on either route; the coverage record absent/unqueryable after the run

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- MUST read convex/_generated/ai/guidelines.md before implementation
- MUST verify-or-enqueue a geometry-recovery attempt for a route BEFORE its ride-worthiness classification is marked evidence-complete, and persist a queryable per-route geometry_attempt artifact (keyed by routeId, with attemptedAt) as the proof
- MUST honor rescue-first for freeway/FHWA rows specifically — a route whose name/highwayNumber is interstate-style (e.g. 'I-40') or whose source is 'fhwa' still gets a geometry attempt recorded
- MUST keep rider-ready withheld for a not_a_ride verdict even though the geometry attempt happened

**NEVER**
- NEVER stamp rescue-first-honored / evidence-complete without a persisted geometry_attempt artifact actually written for that routeId
- NEVER block or abort geometry generation from the classifier — the geometry pipeline stays independent; the classifier only verifies/records the attempt
- NEVER remove or narrow an existing curation_artifacts field — the artifactType union may only be EXTENDED with a new literal (additive)

**STRICTLY**
- STRICTLY make the geometry_attempt artifact idempotent per routeId — when an attempt already exists, verify it rather than duplicating it
- STRICTLY keep the cross-provider decorrelation stamp (RIDE_WORTHINESS_PROVIDER z.ai-glm-5.2) unchanged

## DONE WHEN

- AC-1 [Freeway classification persists a geometry_attempt artifact before it is evidence-complete] [PRIMARY]: A freeway route ends with a geometry_attempt artifact and evidenceComplete=true
- AC-2 [Rescue-first attempts geometry yet a freeway is never rider-ready]: The classified freeway keeps riderReady=false despite the attempt
- AC-3 [Existing geometry attempt is verified, not duplicated]: A route with a pre-existing attempt gets exactly 1 attempt artifact after classification
- AC-4 [A classification that cannot verify or record an attempt is NOT marked evidence-complete]: A simulated attempt-recording failure leaves evidenceComplete=false
- AC-5 [Per-run coverage evidence]: Every classified route in a batch has an attempt artifact and a persisted coverage total
- Every behavioral AC scenario passes `validate_scenario` (exit 0); RED-against-start recorded before GREEN; seeded-value EVIDENCE artifact captured
- `npx tsc --noEmit -p convex/tsconfig.json` → 0 errors + `pnpm exec biome check` clean + `pnpm convex:dev --once` clean
- NO-REGRESSION: `pnpm type-check` reports zero new errors vs. a baseline captured at task start
- Only SCOPE.writeAllowed files modified (`git diff --name-only`)

## SPECIFICATION

**Objective:** Harden classifyAndPersistOne so that, per route, it verifies an existing geometry-recovery attempt or enqueues one, then persists an auditable curation_artifact and marks the route's classification evidence-complete only when that artifact exists — with a per-run coverage total of rescue-first-honored routes.

**Success state:** Every classified route has a queryable curation_artifacts row (artifactType 'geometry_attempt') tying its ride-worthiness verdict to a real geometry attempt; freeway rows are classified not_a_ride yet still carry the attempt artifact and remain non-rider-ready; a founder can query, per route and per run, that rescue-first was honored rather than merely asserted.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `freeway-route-no-attempt` (seed_method: `public_api`): An FHWA interstate-style curated_routes row with NO pre-existing geometry attempt artifact — new seeder seedFreewayRouteNoAttempt
    - routeId 'test:fhwa-i40-seg', source 'fhwa', name 'I-40 Freeway Segment', highwayNumber 'I-40', geometryStatus 'unresolved', riderReady false
- `scenic-route-with-existing-attempt` (seed_method: `public_api`): A twisty scenic curated_routes row that ALREADY has a geometry attempt recorded — new seeder seedScenicRouteWithAttempt
    - routeId 'test:scenic-tepusquet', plus ONE pre-existing curation_artifacts row artifactType 'waterfall_result'
- `batch-mixed-catalog` (seed_method: `public_api`): A small mixed set (freeway + scenic + recovered) for per-run coverage evidence
    - routeIds ['test:fhwa-i40-seg','test:scenic-tepusquet','test:recovered-pass-1']

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — Freeway classification persists a geometry_attempt artifact before it is evidence-complete

**Requirement:** GIVEN a freeway route (source 'fhwa', name 'I-40 Freeway Segment', highwayNumber 'I-40') with no pre-existing geometry attempt artifact WHEN classifyRoute runs against it THEN a curation_artifacts row with artifactType 'geometry_attempt' keyed to that routeId (attemptedAt > 0) is persisted, and the route's stored rideWorthiness is marked rescue-first-honored / evidence-complete

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real classifyRoute action) + z.ai GLM-5.2
- FLOW_REF: UC-VER-03
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX11-rescue-first-attempt.integration.test.ts -t 'AC-1'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: classifier stamps rescue-first-honored without writing any curation_artifacts row (unchanged, absent artifact); freeway routes are skipped (a no-op) so no attempt is recorded
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `freeway-route-no-attempt`
  - ACTION: Seed the freeway route; assert no curation_artifacts row exists yet for it (absent); call classifyRoute; query curation_artifacts by_routeId and the route's rideWorthiness
  - MUST_OBSERVE: curation_artifacts count with artifactType == 'geometry_attempt' for the routeId == 1; route rideWorthiness.evidenceComplete == true
  - MUST_NOT_OBSERVE: curation_artifacts count for the routeId == 0 (no attempt recorded)

### AC-2 — Rescue-first attempts geometry yet a freeway is never rider-ready

**Requirement:** GIVEN the freeway route from AC-1 after classification (verdict not_a_ride) with its geometry_attempt artifact recorded WHEN the stored route state is read THEN riderReady remains false — the geometry attempt happened but the freeway is not promoted to a suggestion

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real classifyRoute + curated_routes riderReady)
- FLOW_REF: UC-VER-03
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX11-rescue-first-attempt.integration.test.ts -t 'AC-2'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the geometry attempt promotes the freeway to riderReady true (a hardcoded promotion)
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `freeway-route-no-attempt`
  - ACTION: Seed and classify the freeway route; query curated_routes riderReady and the geometry_attempt artifact
  - MUST_OBSERVE: curated_routes.riderReady == false; geometry_attempt artifact count for the routeId == 1
  - MUST_NOT_OBSERVE: curated_routes.riderReady == true

### AC-3 — Existing geometry attempt is verified, not duplicated (idempotent)

**Requirement:** GIVEN a scenic route that already has exactly one geometry attempt artifact WHEN classifyRoute runs against it THEN the classifier verifies the existing attempt and does NOT write a second/duplicate geometry-attempt artifact for that routeId, while still marking the classification evidence-complete

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real classifyRoute + curation_artifacts by_routeId)
- FLOW_REF: UC-VER-03
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX11-attempt-evidence.integration.test.ts -t 'AC-3'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: classifier always enqueues a fresh attempt and writes a duplicate artifact regardless of an existing one (unchanged non-idempotent write)
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `scenic-route-with-existing-attempt`
  - ACTION: Seed the scenic route with its 1 pre-existing attempt; count attempt-proving artifacts before (== 1); call classifyRoute; re-count attempt-proving artifacts
  - MUST_OBSERVE: attempt-proving artifact count after == 1; route rideWorthiness.evidenceComplete == true
  - MUST_NOT_OBSERVE: attempt-proving artifact count after == 2

### AC-4 — A classification that cannot verify or record an attempt is NOT marked evidence-complete

**Requirement:** GIVEN a route for which the geometry-attempt could neither be verified nor recorded WHEN classifyRoute runs THEN the route's classification is left explicitly not-evidence-complete (a queryable flag), rather than silently asserting rescue-first

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real classifyRoute) + z.ai GLM-5.2
- FLOW_REF: UC-VER-03
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX11-attempt-evidence.integration.test.ts -t 'AC-4'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: evidence-complete is stamped unconditionally even when no attempt artifact exists (a hardcoded true)
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `freeway-route-no-attempt`
  - ACTION: Seed the freeway route; call classifyRoute with simulateAttemptRecordingFailure:true; query curation_artifacts and the route's evidence-complete marker
  - MUST_OBSERVE: route rideWorthiness.evidenceComplete == false
  - MUST_NOT_OBSERVE: a geometry_attempt artifact for the routeId is present

### AC-5 — Per-run coverage evidence: every classified route ends with an attempt artifact and a coverage total is persisted

**Requirement:** GIVEN a mixed batch of routes (freeway + scenic + recovered) classified in one run WHEN the run completes THEN each classified routeId has a queryable geometry-attempt artifact, and a per-run coverage total (routes-classified vs rescue-first-honored) is persisted for founder review

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real classifyCatalog run) + z.ai GLM-5.2
- FLOW_REF: UC-VER-03
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX11-attempt-evidence.integration.test.ts -t 'AC-5'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: coverage total is hardcoded to always equal input length regardless of artifacts; some routes are classified with no attempt artifact yet counted as honored (unchanged gap)
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `batch-mixed-catalog`
  - ACTION: Seed the mixed batch (3 routeIds); call classifyCatalog over the 3 routeIds; for each routeId query attempt-proving artifacts; read the persisted coverage total
  - MUST_OBSERVE: attempt-proving artifact count across the 3 routeIds == 3; coverage.rescueFirstHonored == 3
  - MUST_NOT_OBSERVE: coverage.rescueFirstHonored < 3

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | classifyRoute writes exactly one geometry_attempt curation_artifact keyed to the freeway routeId with attemptedAt greater than 0 | AC-1 | `npx vitest run convex/__tests__/REDHATFIX11-rescue-first-attempt.integration.test.ts -t 'AC-1'` |
| TC-2 | classifyRoute leaves the freeway route riderReady false after recording the geometry attempt | AC-2 | `npx vitest run convex/__tests__/REDHATFIX11-rescue-first-attempt.integration.test.ts -t 'AC-2'` |
| TC-3 | classifyRoute against a route with one existing attempt artifact leaves the attempt-proving artifact count at 1 | AC-3 | `npx vitest run convex/__tests__/REDHATFIX11-attempt-evidence.integration.test.ts -t 'AC-3'` |
| TC-4 | classifyRoute with attempt recording failure leaves evidence-complete marker false and writes no geometry_attempt artifact | AC-4 | `npx vitest run convex/__tests__/REDHATFIX11-attempt-evidence.integration.test.ts -t 'AC-4'` |
| TC-5 | classifyCatalog over 3 mixed routes yields 3 attempt-proving artifacts and a persisted coverage total rescueFirstHonored equal to 3 | AC-5 | `npx vitest run convex/__tests__/REDHATFIX11-attempt-evidence.integration.test.ts -t 'AC-5'` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- convex/actions/rideWorthinessClassifier.ts (MODIFY) — classifyAndPersistOne verify-or-enqueue geometry attempt + evidence-complete marker; classifyCatalog per-run coverage total; add optional simulateAttemptRecordingFailure test arg
- convex/curatedGeometry.ts (MODIFY) — add internal query getGeometryAttempt(routeId) and internal mutation recordGeometryAttempt (writes curation_artifacts 'geometry_attempt'); extend persistRideWorthiness with additive evidence-complete/rescue-first marker
- convex/schema.ts (MODIFY, additive only) — curation_artifacts.artifactType: add v.literal('geometry_attempt'); optional rescue-first/evidence-complete marker fields
- convex/curatedGeometryTestSupport.ts (MODIFY) — add seedFreewayRouteNoAttempt and seedScenicRouteWithAttempt public seeders
- convex/__tests__/REDHATFIX11-rescue-first-attempt.integration.test.ts (NEW)
- convex/__tests__/REDHATFIX11-attempt-evidence.integration.test.ts (NEW)

**writeProhibited:**
- convex/actions/rideWorthinessClassifier.ts catalog enumeration/pagination — that is REDHAT-FIX-02 (do not add whole-catalog dispatch/checkpointing here)
- convex/couchSampleAssembler.ts / convex/couchVerdict.ts — couch pipeline is a separate task
- convex/guards.ts — founder/operator role enforcement is a separate task
- Any destructive change to existing curation_artifacts fields — union may only be EXTENDED
- Changing RIDE_WORTHINESS_PROVIDER / the z.ai provider wiring

## READING LIST

- `convex/actions/rideWorthinessClassifier.ts` (146-232) — classifyAndPersistOne — where the verify-or-enqueue geometry attempt + geometry_attempt artifact + evidence-complete marker must be added
- `convex/actions/rideWorthinessClassifier.ts` (255-302) — classifyCatalog / classifyCatalogInternal — per-run coverage total aggregation point (AC-5); NOTE REDHAT-FIX-02 also edits this file for pagination — independent concern
- `convex/waterfallOrchestrator.ts` (759-820) — recordTerminalArtifact / insertCurationArtifact — the existing curation_artifacts write pattern to mirror for a 'geometry_attempt' artifact
- `convex/schema.ts` (299-320) — curation_artifacts.artifactType union — EXTEND additively with v.literal('geometry_attempt'); by_routeId index already exists
- `convex/curatedGeometry.ts` — getRouteForClassification / persistRideWorthiness — add a companion internal query/mutation so the node action can verify/record without db access
- `brain/docs/TESTING-HIERARCHY.md` (11-23) — integration tier is PRIMARY for Convex backend
- `brain/docs/CONVEX-RULES.md` — actions cannot touch db directly (use runQuery/runMutation), index-only queries, additive schema evolution

## CODE PATTERN

- Pattern: Verify-or-record — inside classifyAndPersistOne, runQuery getGeometryAttempt(routeId); if an attempt artifact (or waterfall_result) already exists, treat it as verified; else runMutation recordGeometryAttempt to persist a 'geometry_attempt' curation_artifact; only then persist rideWorthiness with an evidence-complete marker. Aggregate a per-run coverage total in classifyCatalog
- Pattern source: `convex/waterfallOrchestrator.ts:759-820` (insertCurationArtifact) + `convex/actions/rideWorthinessClassifier.ts:146-232` (classifyAndPersistOne)
- Anti-pattern: Stamping rescue-first-honored in code without an auditable curation_artifacts row; skipping freeway rows; duplicating the attempt artifact on every classify; or blocking geometry generation from the classifier

## VERIFICATION GATES

- test: `npx vitest run convex/__tests__/REDHATFIX11-rescue-first-attempt.integration.test.ts convex/__tests__/REDHATFIX11-attempt-evidence.integration.test.ts` → Exit 0
- typecheck (in-scope): `npx tsc --noEmit -p convex/tsconfig.json` → Exit 0
- typecheck (no-regression): `pnpm type-check 2>&1 | grep -c 'error TS'` → no greater than baseline
- lint: `pnpm exec biome check` → Exit 0
- convex build: `pnpm convex:dev --once` → Exit 0
- scenario validator → Exit 0, zero CRITICAL/HIGH:

```bash
python3 -c "import re,sys;print(re.search(r'<!-- REQUIREMENT-CONTRACT v1 -->\n<!--\n(.*?)\n-->',open(sys.argv[1]).read(),re.S).group(1))" \
  .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/REDHAT-FIX-11-*.md \
  | python3 ~/Projects/brain/tools/validate-scenario/validate_scenario.py; echo "EXIT:$?"
```

## AGENT ASSIGNMENT

- Agent: `convex-implementer` — Convex backend implementation; rescue-first evidence enforcement
- Reviewer: `convex-reviewer`

## EVIDENCE GATES

- RED phase: each behavioral AC's test went red before green
- Integration coverage: PRIMARY AC is `integration` against the real Convex dev deployment + z.ai GLM-5.2
- Scenario un-fakeable: `validate_scenario` exit 0 on every behavioral AC; captured EVIDENCE shows the seeded MUST_OBSERVE value

## DEPENDENCIES

- Depends on: —
- Blocks: REDHAT-FIX-01

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
  "task_id": "REDHAT-FIX-11",
  "tdd_mode": "red_first",
  "verification_policy": { "requires_tests": true, "requires_red_evidence": true, "requires_seeded_evidence": true },
  "fixtures": {
    "freeway-route-no-attempt": { "description": "An FHWA interstate route with NO pre-existing geometry attempt artifact.", "seed_method": "public_api", "records": ["seedFreewayRouteNoAttempt() -> routeId 'test:fhwa-i40-seg', source 'fhwa'"] },
    "scenic-route-with-existing-attempt": { "description": "A twisty scenic route that already has a geometry attempt recorded.", "seed_method": "public_api", "records": ["seedScenicRouteWithAttempt() -> routeId 'test:scenic-tepusquet' + 1 curation_artifacts waterfall_result"] },
    "batch-mixed-catalog": { "description": "A small mixed set (freeway + scenic + recovered) for per-run coverage evidence.", "seed_method": "public_api", "records": ["routeIds ['test:fhwa-i40-seg','test:scenic-tepusquet','test:recovered-pass-1']"] }
  },
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "primary": true, "description": "Freeway classification persists a geometry_attempt artifact before it is evidence-complete", "verify": "npx vitest run convex/__tests__/REDHATFIX11-rescue-first-attempt.integration.test.ts -t 'AC-1'",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real classifyRoute action) + z.ai GLM-5.2", "topology": "single-node",
        "negative_control": { "would_fail_if": ["classifier stamps rescue-first-honored without writing any curation_artifacts row (unchanged, absent artifact)", "freeway routes are skipped (a no-op) so no attempt is recorded"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "freeway-route-no-attempt", "action": { "actor": "api_client", "steps": ["Seed the freeway route", "Assert no curation_artifacts row exists yet for it (absent)", "Call classifyRoute", "Query curation_artifacts by_routeId and the route's rideWorthiness"] },
          "end_state": { "must_observe": ["curation_artifacts count with artifactType == 'geometry_attempt' for the routeId == 1", "route rideWorthiness.evidenceComplete == true"], "must_not_observe": ["curation_artifacts count for the routeId == 0 (no attempt recorded)"] } } ] } },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "Rescue-first attempts geometry yet a freeway is never rider-ready", "verify": "npx vitest run convex/__tests__/REDHATFIX11-rescue-first-attempt.integration.test.ts -t 'AC-2'",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real classifyRoute + curated_routes riderReady)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["the geometry attempt promotes the freeway to riderReady true (a hardcoded promotion)"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "freeway-route-no-attempt", "action": { "actor": "api_client", "steps": ["Seed and classify the freeway route", "Query curated_routes riderReady and the geometry_attempt artifact"] },
          "end_state": { "must_observe": ["curated_routes.riderReady == false", "geometry_attempt artifact count for the routeId == 1"], "must_not_observe": ["curated_routes.riderReady == true"] } } ] } },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "Existing geometry attempt is verified, not duplicated", "verify": "npx vitest run convex/__tests__/REDHATFIX11-attempt-evidence.integration.test.ts -t 'AC-3'",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real classifyRoute + curation_artifacts by_routeId)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["classifier always enqueues a fresh attempt and writes a duplicate artifact regardless of an existing one (unchanged non-idempotent write)"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "scenic-route-with-existing-attempt", "action": { "actor": "api_client", "steps": ["Seed the scenic route with its 1 pre-existing attempt", "Count attempt-proving artifacts before (== 1)", "Call classifyRoute", "Re-count attempt-proving artifacts"] },
          "end_state": { "must_observe": ["attempt-proving artifact count after == 1", "route rideWorthiness.evidenceComplete == true"], "must_not_observe": ["attempt-proving artifact count after == 2"] } } ] } },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "A classification that cannot verify or record an attempt is NOT marked evidence-complete", "verify": "npx vitest run convex/__tests__/REDHATFIX11-attempt-evidence.integration.test.ts -t 'AC-4'",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real classifyRoute) + z.ai GLM-5.2", "topology": "single-node",
        "negative_control": { "would_fail_if": ["evidence-complete is stamped unconditionally even when no attempt artifact exists (a hardcoded true)"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "freeway-route-no-attempt", "action": { "actor": "api_client", "steps": ["Seed the freeway route", "Call classifyRoute with simulateAttemptRecordingFailure:true", "Query curation_artifacts and the route's evidence-complete marker"] },
          "end_state": { "must_observe": ["route rideWorthiness.evidenceComplete == false"], "must_not_observe": ["a geometry_attempt artifact for the routeId is present"] } } ] } },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "Per-run coverage evidence: every classified route ends with an attempt artifact and a coverage total is persisted", "verify": "npx vitest run convex/__tests__/REDHATFIX11-attempt-evidence.integration.test.ts -t 'AC-5'",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real classifyCatalog run) + z.ai GLM-5.2", "topology": "single-node",
        "negative_control": { "would_fail_if": ["coverage total is hardcoded to always equal input length regardless of artifacts", "some routes are classified with no attempt artifact yet counted as honored (unchanged gap)"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "batch-mixed-catalog", "action": { "actor": "api_client", "steps": ["Seed the mixed batch (3 routeIds)", "Call classifyCatalog over the 3 routeIds", "For each routeId query attempt-proving artifacts; read the persisted coverage total"] },
          "end_state": { "must_observe": ["attempt-proving artifact count across the 3 routeIds == 3", "coverage.rescueFirstHonored == 3"], "must_not_observe": ["coverage.rescueFirstHonored < 3"] } } ] } },
    { "id": "TC-1", "type": "test_criterion", "description": "exactly one geometry_attempt artifact keyed to freeway routeId, attemptedAt>0", "maps_to_ac": "AC-1", "verify": "npx vitest run convex/__tests__/REDHATFIX11-rescue-first-attempt.integration.test.ts -t 'AC-1'" },
    { "id": "TC-2", "type": "test_criterion", "description": "freeway riderReady false after attempt recorded", "maps_to_ac": "AC-2", "verify": "npx vitest run convex/__tests__/REDHATFIX11-rescue-first-attempt.integration.test.ts -t 'AC-2'" },
    { "id": "TC-3", "type": "test_criterion", "description": "existing-attempt route keeps artifact count at 1 (idempotent)", "maps_to_ac": "AC-3", "verify": "npx vitest run convex/__tests__/REDHATFIX11-attempt-evidence.integration.test.ts -t 'AC-3'" },
    { "id": "TC-4", "type": "test_criterion", "description": "attempt-recording failure leaves evidence-complete false and no artifact", "maps_to_ac": "AC-4", "verify": "npx vitest run convex/__tests__/REDHATFIX11-attempt-evidence.integration.test.ts -t 'AC-4'" },
    { "id": "TC-5", "type": "test_criterion", "description": "batch of 3 yields 3 attempt artifacts and coverage total rescueFirstHonored==3", "maps_to_ac": "AC-5", "verify": "npx vitest run convex/__tests__/REDHATFIX11-attempt-evidence.integration.test.ts -t 'AC-5'" },
    { "id": "AC-R1", "type": "acceptance_criterion", "primary": false, "description": "A freeway with no durable geometry attempt is classified evidenceComplete=false; per-run coverage is persisted (regression proof added 2026-07-20 fresh review)", "verify": "npx vitest run convex/__tests__/REDHATFIX11-evidence-prerequisite.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real classifier + rideWorthiness persistence)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["the classifier records the geometry-attempt artifact best-effort in a swallowed try/catch and still persists a classification with no evidenceComplete field (unchanged rideWorthinessClassifier.ts:186-232)", "evidenceComplete is hardcoded true regardless of the attempt", "no coverage record is persisted for the run"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "freeway-no-geometry-attempt", "action": { "actor": "api_client", "steps": ["Seed a freeway route with geometryStatus:'unresolved' and one with a completed geometry attempt", "Classify both in one run", "Query curated_routes.rideWorthiness and the per-run coverage record"] },
          "end_state": { "must_observe": ["the unresolved freeway's rideWorthiness.evidenceComplete == false and riderReady == false", "the attempted freeway's evidenceComplete == true", "the coverage record reports freewayAttempted:2, freewayEvidenceComplete:1"], "must_not_observe": ["evidenceComplete absent/undefined on either route", "the coverage record absent/unqueryable after the run"] } } ] } },
    { "id": "TC-R1", "type": "test_criterion", "description": "An unresolved freeway persists evidenceComplete false; per-run coverage record reflects attempted vs evidence-complete", "maps_to_ac": "AC-R1", "verify": "npx vitest run convex/__tests__/REDHATFIX11-evidence-prerequisite.integration.test.ts -t 'TC-R1'" }
  ]
}
-->

</details>
