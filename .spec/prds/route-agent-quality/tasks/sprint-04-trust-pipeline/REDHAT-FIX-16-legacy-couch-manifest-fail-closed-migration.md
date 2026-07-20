# REDHAT-FIX-16 — Fail-closed handling and migration/re-freeze for legacy couch manifests missing complete routeHashes
> Status: ⬜ Pending

| Field | Value |
|-------|-------|
| TASK_ID | REDHAT-FIX-16 |
| SPRINT | [Sprint 04 — Trust pipeline](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`convex-implementer` · reviewer=`convex-reviewer` |
| ESTIMATE | 135 min |
| EFFORT | M |
| PRIORITY | P0 |
| STATUS | Backlog |
| PROPOSED_BY | `convex-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | CAP-GEO-05 |
| DEPENDS_ON | — |
| BLOCKS | — |

RUNTIME_COMMANDS:
- test: `npx vitest run convex/__tests__/REDHAT-FIX-16-legacy-manifest-fail-closed.integration.test.ts`
- typecheck: `npx tsc --noEmit -p convex/tsconfig.json`
- lint: `pnpm exec biome check`

> **Command note:** `pnpm test` maps to bare `vitest` (watch mode) and HANGS in an agent shell — always use `npx vitest run`. vitest has no `--grep`; the single-test filter is `-t '<name>'`.

## OUTCOME

A pre-FIX-15 frozen manifest with an existing bound PASS but no complete routeHashes baseline returns couchGateStatus.allowed == false (missing/incomplete-baseline reason) and runAllWaterfall throws COUCH_GATE_BLOCKED; an operator can re-freeze/re-activate the manifest with freshly computed routeHashes, but the old PASS is not inherited — allowed stays false until a fresh operator activation + recordCouchVerdict(pass) against the new manifestHash; a non-legacy complete-baseline no-drift manifest is unaffected and still returns allowed:true.

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- MUST read convex/_generated/ai/guidelines.md before implementation
- MUST make couchGateStatus fail CLOSED when the active manifest's routeHashes baseline is missing, empty, OR incomplete relative to activeManifest.routes (including duplicate routeId entries) — return allowed:false with a reason naming the missing/incomplete geometry-hash baseline (re-freeze required), never silently treating 'no hashes to check' as 'no drift'
- MUST provide an operator-authorized migration/re-freeze codepath (a new operator mutation or an explicit branch in the existing freeze/assemble mutation family) that recomputes and persists a COMPLETE routeHashes baseline for a legacy manifest against current geometry with a fresh manifestHash/catalogVersion
- MUST require a fresh operator activation (activateCouchManifest) + a fresh bound pass verdict (recordCouchVerdict) against the new manifestHash before couchGateStatus returns allowed:true again — mirror the FIX-14 explicit-activation pattern (rotation is an explicit operator transition, not automatic)
- MUST prove the primary block end-to-end via a behavioral integration test that seeds a legacy frozen manifest (routeHashes absent/empty) with an existing bound pass through real operator entrypoints and observes allowed:false (not the old bypass-to-pass)
- MUST keep a non-legacy complete-baseline no-drift manifest returning allowed:true (no FIX-15 happy-path regression)

**NEVER**
- NEVER fail open: an empty/missing/incomplete routeHashes baseline must NEVER fall through the skipped drift loop (couchVerdict.ts:227-247) to a bound-pass allowed:true
- NEVER let re-freeze silently inherit the old PASS verdict — a fresh freeze/activation requires a fresh bound pass verdict against the new manifestHash
- NEVER auto-activate a re-frozen manifest; activation stays an explicit operator transition (FIX-14 pattern)
- NEVER touch, re-interpret, simulate, or substitute the human Founder-Operator visual review (S4-T7) — this is a backend drift/fail-closed fix only; the live-provider/founder gate is an external, unresolved, human-owned blocker and is NOT satisfied by this task
- NEVER weaken FIX-14's active-manifest pointer/authorization or FIX-15's live-hash drift comparison for already-complete hashed manifests

**STRICTLY**
- STRICTLY schema changes are additive only and are AVOIDED where possible — the existing optional couch_samples.routeHashes plus fail-closed logic should suffice; add a field/index ONLY if genuinely required
- STRICTLY the fail-closed baseline check layers on top of FIX-14's active-manifest pointer read and BEFORE/around FIX-15's live-hash loop; it does not revert or duplicate either
- STRICTLY every scenario case seeds through a real operator entrypoint (storeCouchSample / activateCouchManifest / recordCouchVerdict) and proves the block against the real couchGateStatus — a raw db insert is never used as evidence of the behavior under test (Fakeability Floor)

## DONE WHEN

- AC-1 [Legacy frozen manifest missing a complete routeHashes baseline fails closed] [PRIMARY]: couchGateStatus.allowed == false with a reason naming the missing/incomplete geometry-hash baseline (re-freeze required), and runAllWaterfall throws ConvexError{code:'COUCH_GATE_BLOCKED'} — not the old bypass-to-pass
- AC-2 [Migration/re-freeze requires a fresh activation + fresh pass; old PASS not inherited]: couchGateStatus.allowed stays false (old PASS not inherited) until a NEW operator activation + recordCouchVerdict(pass) against the new manifestHash exists, after which allowed == true
- AC-3 [Non-legacy complete-baseline no-drift manifest is unaffected]: allowed == true — the fail-closed baseline change does not regress FIX-15's happy path
- Every behavioral AC scenario passes `validate_scenario` (exit 0); RED-against-start recorded before GREEN; seeded-value EVIDENCE artifact captured
- `npx tsc --noEmit -p convex/tsconfig.json` → 0 errors + `pnpm exec biome check` clean + `pnpm convex:dev --once` clean
- NO-REGRESSION: `pnpm type-check` reports zero new errors vs. a baseline captured at task start
- Only SCOPE.writeAllowed files modified (`git diff --name-only`)

## SPECIFICATION

**Objective:** Close the legacy-manifest bypass: couchGateStatus must fail closed when the active frozen manifest has no complete routeHashes baseline (missing/empty/incomplete/duplicate), and provide an operator-authorized migration/re-freeze path that recomputes a complete baseline and requires a fresh activation + fresh pass verdict before --all unlocks.

**Success state:** A pre-FIX-15 frozen manifest with an existing bound PASS but no complete routeHashes baseline returns couchGateStatus.allowed == false (missing/incomplete-baseline reason) and runAllWaterfall throws COUCH_GATE_BLOCKED; an operator can re-freeze/re-activate the manifest with freshly computed routeHashes, but the old PASS is not inherited — allowed stays false until a fresh operator activation + recordCouchVerdict(pass) against the new manifestHash; a non-legacy complete-baseline no-drift manifest is unaffected and still returns allowed:true.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `operator-identity` (seed_method: `public_api`): An authenticated operator/founder used to freeze, activate, record verdicts, and re-freeze.
    - users row upserted for clerkUserId 's4t16-operator' with role 'operator'
- `legacy-frozen-pass-no-hashes` (seed_method: `public_api`): A pre-FIX-15-style frozen, active couch manifest with an existing operator-recorded bound PASS but NO routeHashes baseline (absent/empty), reproducing the bypass.
    - operator storeCouchSample('redhatfix16-legacy') freezes R1..Rn (real entrypoint)
    - operator activateCouchManifest -> active pointer
    - operator recordCouchVerdict(pass) exact membership
    - the frozen couch_samples row is reduced to its pre-FIX-15 shape by clearing routeHashes (absent/empty) to emulate a manifest frozen before FIX-15 — the only reachable way to a hash-less frozen manifest since the current freeze always writes hashes
- `legacy-frozen-pass-incomplete-hashes` (seed_method: `public_api`): A frozen active manifest whose routeHashes baseline is INCOMPLETE relative to its sampled routes (a sampled route missing a hash, or a duplicate routeId entry) with a bound PASS.
    - frozen manifest (as above) whose routeHashes omit one sampled route OR contain a duplicate routeId entry so the baseline is not exactly the set of activeManifest.routes routeIds
- `operator-refreeze` (seed_method: `public_api`): An operator migration/re-freeze of the legacy manifest that recomputes+persists a complete routeHashes baseline against current geometry (fresh manifestHash), then a fresh activation + fresh pass verdict.
    - operator invokes the migration/re-freeze entrypoint that recomputes computeRouteGeometryHash over current curated_route_geometry for each sampled route and persists a complete routeHashes + fresh manifestHash/catalogVersion
    - operator activateCouchManifest against the re-frozen manifest (explicit)
    - operator recordCouchVerdict(pass) bound to the new manifestHash
- `healthy-hashed-manifest` (seed_method: `public_api`): A non-legacy frozen active manifest WITH a complete routeHashes baseline, an operator PASS, and no geometry drift (the FIX-15 happy path / negative control).
    - operator storeCouchSample('redhatfix16-healthy') with a complete routeHashes baseline (real freeze)
    - operator activateCouchManifest + recordCouchVerdict(pass)
    - no geometry drift applied

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — Legacy frozen manifest missing a complete routeHashes baseline fails closed

**Requirement:** GIVEN a legacy frozen active manifest with an existing operator-recorded bound PASS and no complete routeHashes baseline (absent/empty, or incomplete/duplicate) WHEN couchGateStatus is queried and runAllWaterfall is called THEN couchGateStatus.allowed == false with a reason naming the missing/incomplete geometry-hash baseline (re-freeze required), and runAllWaterfall throws ConvexError{code:'COUCH_GATE_BLOCKED'} — not the old bypass-to-pass

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real couchGateStatus baseline check + runAllWaterfall gate)
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-16-legacy-manifest-fail-closed.integration.test.ts -t 'AC-1'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: routeHashes ?? [] skips the drift loop so a missing/empty baseline falls through to the bound-pass check and returns allowed:true (the current bypass at couchVerdict.ts:227-247); an incomplete baseline (duplicate/missing routeId entries) is treated as fully checked and returns allowed:true
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `legacy-frozen-pass-no-hashes`
  - ACTION: Seed legacy-frozen-pass-no-hashes (frozen active manifest + bound pass, routeHashes absent/empty) via real operator entrypoints; Query couchGateStatus; Call runAllWaterfall and capture the thrown error
  - MUST_OBSERVE: couchGateStatus.allowed == false with a reason naming the missing/incomplete geometry-hash baseline (re-freeze required); runAllWaterfall throws error.code == 'COUCH_GATE_BLOCKED'
  - MUST_NOT_OBSERVE: couchGateStatus.allowed == true for a manifest with no routeHashes baseline (the old bypass-to-pass); runAllWaterfall proceeding past the gate on a hash-less legacy manifest
- CASE 2 — start_ref `legacy-frozen-pass-incomplete-hashes`
  - ACTION: Seed a frozen active manifest whose routeHashes baseline is incomplete (a duplicate routeId entry, or a sampled route missing a hash) with a bound pass; Query couchGateStatus
  - MUST_OBSERVE: couchGateStatus.allowed == false because the routeHashes baseline is not exactly the set of sampled route ids (incomplete/duplicate baseline)
  - MUST_NOT_OBSERVE: couchGateStatus.allowed == true despite an incomplete/duplicate routeHashes baseline; `allowed` is not `true` despite the incomplete baseline — no empty-baseline bypass (allowed stays `false`)

### AC-2 — Migration/re-freeze requires a fresh activation + fresh pass; old PASS not inherited

**Requirement:** GIVEN the legacy manifest is blocked (AC-1) WHEN an operator re-freezes/re-activates the manifest with freshly computed routeHashes and a fresh manifestHash THEN couchGateStatus.allowed stays false (old PASS not inherited) until a NEW operator activation + recordCouchVerdict(pass) against the new manifestHash exists, after which allowed == true

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (operator re-freeze/re-activation + couchGateStatus)
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-16-legacy-manifest-fail-closed.integration.test.ts -t 'AC-2'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: re-freeze silently reuses/hardcodes the old bound pass verdict so couchGateStatus returns allowed:true without a fresh verdict; the re-frozen manifest is auto-activated / auto-passed without an explicit operator activation and a fresh recordCouchVerdict against the new manifestHash
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `operator-refreeze`
  - ACTION: Start from the blocked legacy manifest (AC-1); Operator re-freezes/re-activates the manifest, recomputing and persisting a complete routeHashes baseline against current geometry (fresh manifestHash); Query couchGateStatus BEFORE recording a new verdict; Operator activateCouchManifest (explicit) + recordCouchVerdict(pass) bound to the new manifestHash; Query couchGateStatus AFTER the fresh pass
  - MUST_OBSERVE: after re-freeze but before a fresh pass verdict: couchGateStatus.allowed == false (old PASS not inherited); the re-frozen manifest's `routeHashes.length` equals its sampled route count (complete baseline, no gaps); only after a fresh operator activation + recordCouchVerdict(pass) against the new manifestHash: couchGateStatus.allowed == true
  - MUST_NOT_OBSERVE: couchGateStatus.allowed == true immediately after re-freeze with no fresh verdict (inherited old PASS); the re-freeze auto-activating without an explicit operator activation

### AC-3 — Non-legacy complete-baseline no-drift manifest is unaffected

**Requirement:** GIVEN a non-legacy frozen active manifest WITH a complete routeHashes baseline, an operator PASS, and no geometry drift WHEN couchGateStatus is queried THEN allowed == true — the fail-closed baseline change does not regress FIX-15's happy path

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (couchGateStatus complete-baseline no-drift happy path)
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-16-legacy-manifest-fail-closed.integration.test.ts -t 'AC-3'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the new fail-closed baseline check treats a complete baseline as if it were empty/stubbed and blocks anyway (FIX-15 happy-path regression)
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `healthy-hashed-manifest`
  - ACTION: Seed a non-legacy frozen active manifest WITH a complete routeHashes baseline, an operator PASS, and no geometry drift; Query couchGateStatus
  - MUST_OBSERVE: couchGateStatus.allowed == true — a complete-baseline no-drift manifest is unaffected by the fail-closed change
  - MUST_NOT_OBSERVE: couchGateStatus.allowed == false for a complete-baseline no-drift manifest (FIX-15 regression); `allowed` is not `false` — no spurious block on a complete, non-drifted baseline (allowed stays `true`, unchanged)

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | a legacy frozen manifest with missing/empty routeHashes makes couchGateStatus.allowed == false with a missing-baseline reason | AC-1 | `npx vitest run convex/__tests__/REDHAT-FIX-16-legacy-manifest-fail-closed.integration.test.ts -t 'AC-1'` |
| TC-2 | an incomplete/duplicate-routeId routeHashes baseline makes couchGateStatus.allowed == false | AC-1 | `npx vitest run convex/__tests__/REDHAT-FIX-16-legacy-manifest-fail-closed.integration.test.ts -t 'AC-1'` |
| TC-3 | runAllWaterfall throws COUCH_GATE_BLOCKED for a hash-less legacy manifest | AC-1 | `npx vitest run convex/__tests__/REDHAT-FIX-16-legacy-manifest-fail-closed.integration.test.ts -t 'AC-1'` |
| TC-4 | after operator re-freeze, couchGateStatus.allowed == false until a fresh pass verdict is recorded against the new manifestHash | AC-2 | `npx vitest run convex/__tests__/REDHAT-FIX-16-legacy-manifest-fail-closed.integration.test.ts -t 'AC-2'` |
| TC-5 | the re-frozen manifest does not inherit the old PASS; only a fresh operator activation + recordCouchVerdict(pass) unlocks --all | AC-2 | `npx vitest run convex/__tests__/REDHAT-FIX-16-legacy-manifest-fail-closed.integration.test.ts -t 'AC-2'` |
| TC-6 | a complete-baseline no-drift manifest still returns couchGateStatus.allowed == true (no FIX-15 regression) | AC-3 | `npx vitest run convex/__tests__/REDHAT-FIX-16-legacy-manifest-fail-closed.integration.test.ts -t 'AC-3'` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- convex/couchVerdict.ts (MODIFY) - add the fail-closed branch in couchGateStatus for a missing/empty/incomplete/duplicate routeHashes baseline (before/around the FIX-15 drift loop), returning allowed:false with a missing-baseline reason
- convex/couchSampleAssembler.ts (MODIFY) - add an operator-authorized migration/re-freeze codepath that recomputes+persists a complete routeHashes baseline (fresh manifestHash/catalogVersion) for a legacy manifest and requires a fresh activation + verdict
- convex/schema.ts (MODIFY only if a new field/index is genuinely required — prefer NOT changing; the existing optional routeHashes + fail-closed logic should suffice)
- convex/__tests__/REDHAT-FIX-16-legacy-manifest-fail-closed.integration.test.ts (NEW)

**writeProhibited:**
- tools/gate/deriveGoalState.ts, .gate-evidence/**/scripts/*, .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/sprint-goal-state.json - REDHAT-FIX-12 gate-evidence harness scope
- convex/couchVerdict.ts couch_active_manifest pointer selection/authorization (activateCouchManifest gating, latest-activation read) - REDHAT-FIX-14 scope: consume/read the pointer only, do not revert to latest-frozen
- convex/couchVerdict.ts / couchSampleAssembler.ts FIX-15 live-hash comparison for already-complete hashed manifests - reuse/layer on top, do not weaken or duplicate
- convex/guards.ts - import/call requireOperator/requireOperatorAction only
- The real geometry-write path (curatedGeometry.ts / curatedGeometryTestSupport.ts) - read/invoke-only to seed fixtures, not modified
- GATE-RESULTS.md - read-only source of truth
- The human Founder-Operator visual review (S4-T7) - external human-owned blocker; must NOT be synthesized, simulated, or substituted
- Any RN/Expo/app client code

## READING LIST

- `convex/_generated/ai/guidelines.md` (all) — Convex API rules that override training data (mandatory per CLAUDE.md)
- `convex/couchVerdict.ts` (181-283) — couchGateStatus: the frozenRouteHashes ?? [] skip-loop bug at 227-247 (the legacy bypass), the bound-pass fall-through at 249-281, plus activateCouchManifest explicit-activation pattern at 292-326 that the re-freeze path must reuse
- `convex/couchSampleAssembler.ts` (616-736) — storeCouchSample freeze: routeGeometryHashes compute (701-703), routeHashes persist (710-713), and the MANIFEST_ALREADY_FROZEN re-freeze rejection (648-659) that the operator migration/re-freeze path must navigate
- `convex/couchSampleAssembler.ts` (155-183) — computeRouteGeometryHash + computeManifestHash used to recompute a complete baseline + fresh manifestHash on re-freeze
- `convex/schema.ts` (357-383) — couch_samples table incl. optional routeHashes (373-375) — the missing-baseline field; change additively ONLY if genuinely required (prefer no schema change)
- `convex/schema.ts` (419-428) — couch_manifest_activations audit log the re-freeze path appends to via activateCouchManifest (explicit operator transition)
- `convex/curatedGeometryTestSupport.ts` (401-461) — geometry read/support path used to seed healthy vs legacy fixtures and drive computeRouteGeometryHash (read/invoke only)

## CODE PATTERN

- Pattern: Fail-closed baseline check: in couchGateStatus, after resolving the active frozen manifest via FIX-14's pointer, validate the persisted routeHashes baseline before running the drift loop — if routeHashes is undefined/empty, or its set of routeIds is not exactly the set of activeManifest.routes routeIds (missing entries or duplicate entries), return { allowed:false, reason:'... missing/incomplete geometry-hash baseline — re-freeze required' } instead of skipping the loop. Migration: an operator-only re-freeze codepath recomputes computeRouteGeometryHash over current curated_route_geometry for each sampled route, persists a complete routeHashes + a fresh manifestHash/catalogVersion, and leaves the manifest requiring a fresh activateCouchManifest + recordCouchVerdict(pass) against the new manifestHash before couchGateStatus returns allowed:true.
- Pattern source: `convex/couchVerdict.ts:227-247 (the frozenRouteHashes ?? [] skip-loop bypass) + convex/couchSampleAssembler.ts:701-735 (freeze hash computation/persist) + convex/couchVerdict.ts:292-326 (activateCouchManifest explicit operator transition)`
- Anti-pattern: treating `routeHashes ?? []` as 'no drift'; a re-freeze that inherits the old bound PASS (including via a legacy verdict with no manifestHash matching the new manifest); auto-activating a re-frozen manifest without an explicit operator activation; blocking a complete-baseline no-drift manifest (FIX-15 regression)

## VERIFICATION GATES

- test: `npx vitest run convex/__tests__/REDHAT-FIX-16-legacy-manifest-fail-closed.integration.test.ts` → Exit 0
- typecheck (in-scope): `npx tsc --noEmit -p convex/tsconfig.json` → Exit 0
- typecheck (no-regression): `pnpm type-check 2>&1 | grep -c 'error TS'` → no greater than baseline
- lint: `pnpm exec biome check` → Exit 0
- convex build: `pnpm convex:dev --once` → Exit 0
- scenario validator: `python3 -c "import re,sys;print(re.search(r'<!-- REQUIREMENT-CONTRACT v1 -->\n<!--\n(.*?)\n-->',open(sys.argv[1]).read(),re.S).group(1))" .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/REDHAT-FIX-16-*.md | python3 ~/Projects/brain/tools/validate-scenario/validate_scenario.py; echo "EXIT:$?"` → Exit 0, zero CRITICAL/HIGH

## AGENT ASSIGNMENT

- Agent: `convex-implementer` — Convex backend fail-closed logic: add a missing/incomplete-baseline branch to couchGateStatus and an operator-authorized migration/re-freeze codepath in the freeze/assemble mutation family, verified with a behavioral integration test against a Convex dev deployment. convex-implementer owns this domain; convex-reviewer verifies the fail-closed + no-inherited-PASS contract.
- Reviewer: `convex-reviewer`

## EVIDENCE GATES

- RED phase: each behavioral AC's test went red before green
- Integration coverage: PRIMARY AC is integration against couchGateStatus + real Convex dev deployment
- Scenario un-fakeable: validate_scenario exit 0 on every behavioral AC; captured EVIDENCE shows the fail-closed outcome

## DEPENDENCIES

- Depends on: —
- Blocks: —
- Coordinate with REDHAT-FIX-15 (same couchGateStatus / same drift-check mechanism): add the missing/incomplete-baseline check BEFORE the existing live-hash loop so a hash-less manifest fails closed instead of skipping the loop — do not duplicate or weaken FIX-15's live comparison for complete-baseline manifests.
- Coordinate with REDHAT-FIX-10 (manifest schema + freeze immutability) and REDHAT-FIX-14 (explicit operator activation): the migration/re-freeze path must navigate the MANIFEST_ALREADY_FROZEN rejection and require an explicit activateCouchManifest + fresh recordCouchVerdict(pass), reusing FIX-14's transition pattern rather than auto-activating.
- This task is purely a backend drift/fail-closed fix and is unrelated to and not a substitute for the S4-T7 human Founder-Operator/live-provider gate (external, unresolved, human-owned).

## CODING STANDARDS

- convex/_generated/ai/guidelines.md
- brain/docs/TESTING-HIERARCHY.md
- brain/docs/CODING-STANDARDS.md
- brain/docs/CONVEX-RULES.md

<details>
<summary>▸ Full agent specification (TASK-TEMPLATE v5.2 — machine-readable requirement contract)</summary>

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "REDHAT-FIX-16",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "operator-identity": {
      "description": "An authenticated operator/founder used to freeze, activate, record verdicts, and re-freeze.",
      "seed_method": "public_api",
      "records": [
        "users row upserted for clerkUserId 's4t16-operator' with role 'operator'"
      ]
    },
    "legacy-frozen-pass-no-hashes": {
      "description": "A pre-FIX-15-style frozen, active couch manifest with an existing operator-recorded bound PASS but NO routeHashes baseline (absent/empty), reproducing the bypass.",
      "seed_method": "public_api",
      "records": [
        "operator storeCouchSample('redhatfix16-legacy') freezes R1..Rn (real entrypoint)",
        "operator activateCouchManifest -> active pointer",
        "operator recordCouchVerdict(pass) exact membership",
        "the frozen couch_samples row is reduced to its pre-FIX-15 shape by clearing routeHashes (absent/empty) to emulate a manifest frozen before FIX-15 \u2014 the only reachable way to a hash-less frozen manifest since the current freeze always writes hashes"
      ]
    },
    "legacy-frozen-pass-incomplete-hashes": {
      "description": "A frozen active manifest whose routeHashes baseline is INCOMPLETE relative to its sampled routes (a sampled route missing a hash, or a duplicate routeId entry) with a bound PASS.",
      "seed_method": "public_api",
      "records": [
        "frozen manifest (as above) whose routeHashes omit one sampled route OR contain a duplicate routeId entry so the baseline is not exactly the set of activeManifest.routes routeIds"
      ]
    },
    "operator-refreeze": {
      "description": "An operator migration/re-freeze of the legacy manifest that recomputes+persists a complete routeHashes baseline against current geometry (fresh manifestHash), then a fresh activation + fresh pass verdict.",
      "seed_method": "public_api",
      "records": [
        "operator invokes the migration/re-freeze entrypoint that recomputes computeRouteGeometryHash over current curated_route_geometry for each sampled route and persists a complete routeHashes + fresh manifestHash/catalogVersion",
        "operator activateCouchManifest against the re-frozen manifest (explicit)",
        "operator recordCouchVerdict(pass) bound to the new manifestHash"
      ]
    },
    "healthy-hashed-manifest": {
      "description": "A non-legacy frozen active manifest WITH a complete routeHashes baseline, an operator PASS, and no geometry drift (the FIX-15 happy path / negative control).",
      "seed_method": "public_api",
      "records": [
        "operator storeCouchSample('redhatfix16-healthy') with a complete routeHashes baseline (real freeze)",
        "operator activateCouchManifest + recordCouchVerdict(pass)",
        "no geometry drift applied"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "Legacy frozen manifest missing a complete routeHashes baseline (absent/empty/incomplete/duplicate) makes couchGateStatus fail closed (allowed:false) and runAllWaterfall throw COUCH_GATE_BLOCKED",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-16-legacy-manifest-fail-closed.integration.test.ts -t 'AC-1'",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real couchGateStatus baseline check + runAllWaterfall gate)",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "routeHashes ?? [] skips the drift loop so a missing/empty baseline falls through to the bound-pass check and returns allowed:true (the current bypass at couchVerdict.ts:227-247)",
            "an incomplete baseline (duplicate/missing routeId entries) is treated as fully checked and returns allowed:true"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "legacy-frozen-pass-no-hashes",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed legacy-frozen-pass-no-hashes (frozen active manifest + bound pass, routeHashes absent/empty) via real operator entrypoints",
                "Query couchGateStatus",
                "Call runAllWaterfall and capture the thrown error"
              ]
            },
            "end_state": {
              "must_observe": [
                "couchGateStatus.allowed == false with a reason naming the missing/incomplete geometry-hash baseline (re-freeze required)",
                "runAllWaterfall throws error.code == 'COUCH_GATE_BLOCKED'"
              ],
              "must_not_observe": [
                "couchGateStatus.allowed == true for a manifest with no routeHashes baseline (the old bypass-to-pass)",
                "runAllWaterfall proceeding past the gate on a hash-less legacy manifest"
              ]
            }
          },
          {
            "start_ref": "legacy-frozen-pass-incomplete-hashes",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed a frozen active manifest whose routeHashes baseline is incomplete (a duplicate routeId entry, or a sampled route missing a hash) with a bound pass",
                "Query couchGateStatus"
              ]
            },
            "end_state": {
              "must_observe": [
                "couchGateStatus.allowed == false because the routeHashes baseline is not exactly the set of sampled route ids (incomplete/duplicate baseline)"
              ],
              "must_not_observe": [
                "couchGateStatus.allowed == true despite an incomplete/duplicate routeHashes baseline",
                "`allowed` is not `true` despite the incomplete baseline \u2014 no empty-baseline bypass (allowed stays `false`)"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "Operator migration/re-freeze recomputes a complete baseline but does not inherit the old PASS \u2014 allowed stays false until a fresh activation + recordCouchVerdict(pass) against the new manifestHash",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-16-legacy-manifest-fail-closed.integration.test.ts -t 'AC-2'",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (operator re-freeze/re-activation + couchGateStatus)",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "re-freeze silently reuses/hardcodes the old bound pass verdict so couchGateStatus returns allowed:true without a fresh verdict",
            "the re-frozen manifest is auto-activated / auto-passed without an explicit operator activation and a fresh recordCouchVerdict against the new manifestHash"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "operator-refreeze",
            "action": {
              "actor": "api_client",
              "steps": [
                "Start from the blocked legacy manifest (AC-1)",
                "Operator re-freezes/re-activates the manifest, recomputing and persisting a complete routeHashes baseline against current geometry (fresh manifestHash)",
                "Query couchGateStatus BEFORE recording a new verdict",
                "Operator activateCouchManifest (explicit) + recordCouchVerdict(pass) bound to the new manifestHash",
                "Query couchGateStatus AFTER the fresh pass"
              ]
            },
            "end_state": {
              "must_observe": [
                "after re-freeze but before a fresh pass verdict: couchGateStatus.allowed == false (old PASS not inherited)",
                "the re-frozen manifest's `routeHashes.length` equals its sampled route count (complete baseline, no gaps)",
                "only after a fresh operator activation + recordCouchVerdict(pass) against the new manifestHash: couchGateStatus.allowed == true"
              ],
              "must_not_observe": [
                "couchGateStatus.allowed == true immediately after re-freeze with no fresh verdict (inherited old PASS)",
                "the re-freeze auto-activating without an explicit operator activation"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "A non-legacy complete-baseline no-drift manifest is unaffected (allowed:true) \u2014 no FIX-15 happy-path regression",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-16-legacy-manifest-fail-closed.integration.test.ts -t 'AC-3'",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (couchGateStatus complete-baseline no-drift happy path)",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "the new fail-closed baseline check treats a complete baseline as if it were empty/stubbed and blocks anyway (FIX-15 happy-path regression)"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "healthy-hashed-manifest",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed a non-legacy frozen active manifest WITH a complete routeHashes baseline, an operator PASS, and no geometry drift",
                "Query couchGateStatus"
              ]
            },
            "end_state": {
              "must_observe": [
                "couchGateStatus.allowed == true \u2014 a complete-baseline no-drift manifest is unaffected by the fail-closed change"
              ],
              "must_not_observe": [
                "couchGateStatus.allowed == false for a complete-baseline no-drift manifest (FIX-15 regression)",
                "`allowed` is not `false` \u2014 no spurious block on a complete, non-drifted baseline (allowed stays `true`, unchanged)"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "a legacy frozen manifest with missing/empty routeHashes makes couchGateStatus.allowed == false with a missing-baseline reason",
      "maps_to_ac": "AC-1",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-16-legacy-manifest-fail-closed.integration.test.ts -t 'AC-1'"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "an incomplete/duplicate-routeId routeHashes baseline makes couchGateStatus.allowed == false",
      "maps_to_ac": "AC-1",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-16-legacy-manifest-fail-closed.integration.test.ts -t 'AC-1'"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "runAllWaterfall throws COUCH_GATE_BLOCKED for a hash-less legacy manifest",
      "maps_to_ac": "AC-1",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-16-legacy-manifest-fail-closed.integration.test.ts -t 'AC-1'"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "after operator re-freeze, couchGateStatus.allowed == false until a fresh pass verdict is recorded against the new manifestHash",
      "maps_to_ac": "AC-2",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-16-legacy-manifest-fail-closed.integration.test.ts -t 'AC-2'"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "the re-frozen manifest does not inherit the old PASS; only a fresh operator activation + recordCouchVerdict(pass) unlocks --all",
      "maps_to_ac": "AC-2",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-16-legacy-manifest-fail-closed.integration.test.ts -t 'AC-2'"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "a complete-baseline no-drift manifest still returns couchGateStatus.allowed == true (no FIX-15 regression)",
      "maps_to_ac": "AC-3",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-16-legacy-manifest-fail-closed.integration.test.ts -t 'AC-3'"
    }
  ]
}
-->

</details>
