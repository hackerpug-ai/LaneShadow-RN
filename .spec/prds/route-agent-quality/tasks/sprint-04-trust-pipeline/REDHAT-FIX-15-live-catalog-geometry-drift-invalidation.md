# REDHAT-FIX-15 — Invalidate an active couch PASS on live catalog/geometry drift since freeze (UC-VER-05)
> Status: ⬜ Pending

| Field | Value |
|-------|-------|
| TASK_ID | REDHAT-FIX-15 |
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
| DEPENDS_ON | REDHAT-FIX-14 |
| BLOCKS | — |

RUNTIME_COMMANDS:
- test: `npx vitest run convex/__tests__/REDHATFIX15-*.integration.test.ts`
- typecheck: `npx tsc --noEmit -p convex/tsconfig.json`
- lint: `pnpm exec biome check`

> **Command note:** `pnpm test` maps to bare `vitest` (watch mode) and HANGS in an agent shell — always use `npx vitest run`. vitest has no `--grep`; the single-test filter is `-t '<name>'`.

## OUTCOME

A couch PASS stops being a snapshot-only assertion: the per-route geometry hashes captured at freeze are persisted on the couch_samples row, catalogVersion is derived from live geometry state rather than the hardcoded constant `'s4-trust-pipeline-v1'`, and couchGateStatus recomputes each active-manifest route's live geometry hash and compares it against the frozen hash. If any sampled route's live geometry has drifted since freeze, couchGateStatus returns allowed:false (catalog/geometry drift) and runAllWaterfall throws COUCH_GATE_BLOCKED — the previously operator-approved PASS is revoked until re-approval against the current geometry.

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- MUST read convex/_generated/ai/guidelines.md before implementation
- MUST persist the per-route geometry hashes computed at freeze onto the couch_samples row (they are currently computed in storeCouchSample but discarded) so drift can be detected
- MUST derive catalogVersion from live route/geometry state, not the hardcoded constant 's4-trust-pipeline-v1' (couchSampleAssembler.ts:663)
- MUST make couchGateStatus recompute each active-manifest route's LIVE geometry hash (via computeRouteGeometryHash over curated_route_geometry) and return allowed:false when any sampled route's live hash differs from its captured-at-freeze hash
- MUST include a behavioral integration test that seeds a frozen manifest + operator PASS, mutates one sampled route's geometry via the real geometry-write path, and asserts couchGateStatus now blocks --all

**NEVER**
- NEVER treat a couch PASS as permanently valid regardless of live catalog/geometry drift — this is the load-bearing property and mandatory negative control
- NEVER compare only the verdict's stored manifestHash/catalogVersion against the manifest's OWN stored values (the current couchVerdict.ts:203-219 self-referential check) without comparing against LIVE geometry
- NEVER keep catalogVersion as a hardcoded literal that a geometry change cannot move
- NEVER revert REDHAT-FIX-14's couch_active_manifest pointer to a latest-frozen derivation

**STRICTLY**
- STRICTLY schema changes are additive only (couch_samples.routeGeometryHashes optional field); no field removals or type narrowing
- STRICTLY drift detection layers on top of FIX-14's active-manifest pointer read — resolve the active manifest via the pointer, then apply the live-hash comparison

## DONE WHEN

- AC-1 [Live geometry drift on a sampled route invalidates the active PASS] [PRIMARY]: after one sampled route's geometry changes, couchGateStatus.allowed == false and runAllWaterfall throws COUCH_GATE_BLOCKED
- AC-2 [catalogVersion is derived from live geometry state, not a hardcoded literal]: the stored catalogVersion/routeGeometryHashes reflect actual geometry and move when geometry changes
- AC-3 [No drift keeps the PASS valid]: with no geometry change since freeze, couchGateStatus.allowed == true (no drift false-positive)
- AC-4 [Per-route geometry hashes are persisted at freeze]: couch_samples stores a geometry hash per route that couchGateStatus reads to compare live
- Every behavioral AC scenario passes `validate_scenario` (exit 0); RED-against-start recorded before GREEN; seeded-value EVIDENCE artifact captured
- `npx tsc --noEmit -p convex/tsconfig.json` → 0 errors + `pnpm exec biome check` clean + `pnpm convex:dev --once` clean
- NO-REGRESSION: `pnpm type-check` reports zero new errors vs. a baseline captured at task start
- Only SCOPE.writeAllowed files modified (`git diff --name-only`)

## SPECIFICATION

**Objective:** Make a couch PASS revocable on live catalog/geometry drift: persist per-route geometry hashes at freeze, derive catalogVersion from live state, and have couchGateStatus recompute live hashes and block --all when any sampled route's geometry has drifted since freeze.

**Success state:** couchGateStatus recomputes each active-manifest route's live geometry hash and returns allowed:false (with runAllWaterfall throwing COUCH_GATE_BLOCKED) whenever any sampled route drifted since freeze; with no drift the operator PASS still unlocks --all; catalogVersion is no longer a hardcoded constant.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `frozen-manifest-with-pass` (seed_method: `public_api`): A frozen, active couch manifest R1..Rn with per-route geometry hashes captured at freeze and an operator-recorded exact PASS so couchGateStatus.allowed == true.
    - operator storeCouchSample(sampleId 'redhatfix15-sample') freezes R1..Rn and persists routeGeometryHashes; operator promoteActiveManifest -> pointer; operator recordCouchVerdict(pass) exact membership
- `geometry-drift-mutation` (seed_method: `public_api`): A real geometry-write that changes one sampled route's curated_route_geometry (value/verification) after freeze, so its live hash no longer matches the frozen hash.
    - patch curated_route_geometry for R1 via the real geometry-write path (curatedGeometry.ts / curatedGeometryTestSupport.ts) so computeRouteGeometryHash(R1) changes
- `operator-identity` (seed_method: `public_api`): An authenticated operator/founder used to freeze, promote, and record the PASS.
    - users row upserted for clerkUserId `'s4t15-operator'` with role `'operator'`

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — Live geometry drift on a sampled route invalidates the active PASS

**Requirement:** GIVEN a frozen active manifest with an operator PASS (couchGateStatus.allowed == true) and captured per-route geometry hashes WHEN one sampled route's curated_route_geometry is changed via the real geometry-write path after freeze THEN couchGateStatus.allowed == false with a catalog/geometry-drift reason and runAllWaterfall throws ConvexError{code:'COUCH_GATE_BLOCKED'}

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real couchGateStatus live-hash recomputation + runAllWaterfall gate)
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX15-catalog-drift-invalidation.integration.test.ts -t 'AC-1'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: couchGateStatus only compares the verdict's stored manifestHash against the manifest's own stored hash (self-referential, couchVerdict.ts:203-219) so live drift is invisible; the gate never recomputes live geometry hashes and keeps allowed:true after the route changes
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `frozen-manifest-with-pass`
  - ACTION: Seed frozen-manifest-with-pass; confirm couchGateStatus.allowed == true; apply geometry-drift-mutation to route R1 via the real geometry-write path; query couchGateStatus; call runAllWaterfall and capture the thrown error
  - MUST_OBSERVE: couchGateStatus.allowed == false with a catalog/geometry-drift reason; runAllWaterfall throws error.code == 'COUCH_GATE_BLOCKED'
  - MUST_NOT_OBSERVE: couchGateStatus.allowed == true after R1's geometry drifted; runAllWaterfall proceeding past the gate

### AC-2 — catalogVersion is derived from live geometry state, not a hardcoded literal

**Requirement:** GIVEN storeCouchSample freezes a manifest over live geometry WHEN the manifest is frozen and later a sampled route's geometry changes THEN the stored catalogVersion/routeGeometryHashes are derived from actual geometry (not the constant 's4-trust-pipeline-v1') and the live-derived version/hash moves when geometry changes

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real storeCouchSample live-derived catalogVersion + geometry hashes)
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX15-catalog-drift-invalidation.integration.test.ts -t 'AC-2'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: catalogVersion is still the hardcoded 's4-trust-pipeline-v1' constant unaffected by geometry; no per-route geometry hash is derived from live curated_route_geometry
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `frozen-manifest-with-pass`
  - ACTION: Freeze frozen-manifest-with-pass and capture stored catalogVersion + routeGeometryHashes; recompute the live geometry hash for a sampled route before and after geometry-drift-mutation; compare the live-derived hash/version across the change
  - MUST_OBSERVE: stored routeGeometryHashes are derived from actual curated_route_geometry (not a constant); the live-derived geometry hash for the mutated route differs after the change
  - MUST_NOT_OBSERVE: catalogVersion == 's4-trust-pipeline-v1' hardcoded literal unmoved by geometry; no per-route geometry hash persisted at freeze

### AC-3 — No drift keeps the PASS valid

**Requirement:** GIVEN a frozen active manifest with an operator PASS and no geometry change since freeze WHEN couchGateStatus is queried THEN allowed == true — the live-hash comparison matches the frozen hashes and does not false-positive drift

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real couchGateStatus live-hash comparison, no-drift path)
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX15-catalog-drift-invalidation.integration.test.ts -t 'AC-3'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the drift check blocks even when nothing changed (nondeterministic hash / unstable ordering); the comparison always reports drift regardless of live state
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `frozen-manifest-with-pass`
  - ACTION: Seed frozen-manifest-with-pass with an operator PASS; do NOT change any route geometry; query couchGateStatus twice and compare
  - MUST_OBSERVE: couchGateStatus.allowed == true with no geometry change; repeated queries are stable (no spurious drift)
  - MUST_NOT_OBSERVE: couchGateStatus.allowed == false despite no geometry change; the live-hash comparison producing a different hash for identical geometry

### AC-4 — Per-route geometry hashes are persisted at freeze

**Requirement:** GIVEN storeCouchSample freezes routes R1..Rn WHEN the manifest is frozen THEN couch_samples stores a geometry hash per sampled route and couchGateStatus reads those stored hashes to compare against live geometry

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real storeCouchSample persistence + couchGateStatus read)
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX15-catalog-drift-invalidation.integration.test.ts -t 'AC-4'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: storeCouchSample computes routeGeometryHashes but discards them (current behavior) so couchGateStatus has nothing to compare against; couchGateStatus recomputes the frozen baseline live (circular) instead of reading persisted hashes
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `frozen-manifest-with-pass`
  - ACTION: Freeze frozen-manifest-with-pass; query the couch_samples row for its persisted per-route geometry hashes; confirm couchGateStatus reads those stored hashes for the live comparison
  - MUST_OBSERVE: couch_samples row contains a geometry hash for every sampled route; couchGateStatus compares live-recomputed hashes against the persisted frozen hashes
  - MUST_NOT_OBSERVE: couch_samples row missing per-route geometry hashes; the frozen baseline being recomputed live (no persisted reference)

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | one sampled route's geometry drift makes couchGateStatus.allowed == false | AC-1 | `npx vitest run convex/__tests__/REDHATFIX15-catalog-drift-invalidation.integration.test.ts -t 'AC-1'` |
| TC-2 | runAllWaterfall throws COUCH_GATE_BLOCKED after geometry drift | AC-1 | `npx vitest run convex/__tests__/REDHATFIX15-catalog-drift-invalidation.integration.test.ts -t 'AC-1'` |
| TC-3 | catalogVersion/routeGeometryHashes derive from live geometry, not the hardcoded constant | AC-2 | `npx vitest run convex/__tests__/REDHATFIX15-catalog-drift-invalidation.integration.test.ts -t 'AC-2'` |
| TC-4 | no geometry change keeps couchGateStatus.allowed == true (no false-positive) | AC-3 | `npx vitest run convex/__tests__/REDHATFIX15-catalog-drift-invalidation.integration.test.ts -t 'AC-3'` |
| TC-5 | couch_samples persists a per-route geometry hash for every sampled route | AC-4 | `npx vitest run convex/__tests__/REDHATFIX15-catalog-drift-invalidation.integration.test.ts -t 'AC-4'` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- convex/couchSampleAssembler.ts (MODIFY) - persist routeGeometryHashes onto the frozen couch_samples doc (currently discarded, computed at 702-706); derive catalogVersion from live geometry state instead of the hardcoded constant (663)
- convex/couchVerdict.ts (MODIFY) - in couchGateStatus, recompute each active-manifest route's live geometry hash and return allowed:false on drift vs the persisted frozen hashes (layer on top of FIX-14's active-manifest pointer read)
- convex/schema.ts (MODIFY, ADDITIVE ONLY) - add couch_samples.routeGeometryHashes optional field
- convex/__tests__/REDHATFIX15-catalog-drift-invalidation.integration.test.ts (NEW)

**writeProhibited:**
- convex/couchVerdict.ts couch_active_manifest pointer selection/authorization - REDHAT-FIX-14 scope (consume/read the pointer only)
- convex/couchSampleAssembler.ts storeCouchSample operator gating / freeze immutability - REDHAT-FIX-14/REDHAT-FIX-10 scope (do not weaken)
- The real geometry-write path (curatedGeometry.ts / curatedGeometryTestSupport.ts) - used read/invoke-only to drive the drift test, not modified
- convex/guards.ts - import and call only; Any RN/Expo/app client code

## READING LIST

- `convex/_generated/ai/guidelines.md` (all) — Convex API rules (mandatory per CLAUDE.md)
- `convex/couchSampleAssembler.ts` (155-183,660-726) — computeRouteGeometryHash + computeManifestHash; the hardcoded catalogVersion 's4-trust-pipeline-v1' (663) and the routeGeometryHashes computed-but-discarded (702-706) that must be persisted
- `convex/couchVerdict.ts` (180-240) — couchGateStatus self-referential manifest check (203-219) that never compares live geometry — add live-hash recomputation + drift block (layered on FIX-14's pointer read)
- `convex/schema.ts` (355-380) — couch_samples table — add additive routeGeometryHashes field mirroring existing optional manifest fields
- `convex/curatedGeometry.ts` (380-530) — the real geometry-write path (persistGeometryVerified / curated_route_geometry inserts) to drive the AC-1 drift mutation
- `convex/curatedGeometryTestSupport.ts` (401-461) — existing geometry-mutating support mutations (recompute/flip) usable to change a sampled route's geometry in the behavioral test

## CODE PATTERN

- Pattern: Live-drift gate: storeCouchSample persists routeGeometryHashes (routeId -> hash) onto couch_samples and derives catalogVersion from the live geometry set. couchGateStatus resolves the active manifest via FIX-14's couch_active_manifest pointer, then for each sampled route recomputes computeRouteGeometryHash over the CURRENT curated_route_geometry and compares to the persisted frozen hash; any mismatch -> `{ allowed:false, reason:'catalog/geometry drift since freeze' }`. runAllWaterfall consumes couchGateStatus and throws COUCH_GATE_BLOCKED when not allowed.
- Pattern source: `convex/couchSampleAssembler.ts:160-183,700-726` (hash computation + freeze) + `convex/couchVerdict.ts:180-240` (couchGateStatus) + `convex/couchVerdict.ts:448-465` (runAllWaterfall gate)
- Anti-pattern: a snapshot-only PASS whose validity survives live geometry drift; a hardcoded catalogVersion literal a geometry change cannot move; comparing only the verdict's stored hash against the manifest's own stored hash (couchVerdict.ts:203-219) with no live recomputation

## VERIFICATION GATES

- test: `npx vitest run convex/__tests__/REDHATFIX15-catalog-drift-invalidation.integration.test.ts` → Exit 0
- typecheck (in-scope): `npx tsc --noEmit -p convex/tsconfig.json` → Exit 0
- typecheck (no-regression): `pnpm type-check 2>&1 | grep -c 'error TS'` → no greater than baseline
- lint: `pnpm exec biome check` → Exit 0
- convex build: `pnpm convex:dev --once` → Exit 0
- scenario validator → Exit 0, zero CRITICAL/HIGH:

```bash
python3 -c "import re,sys;print(re.search(r'<!-- REQUIREMENT-CONTRACT v1 -->\n<!--\n(.*?)\n-->',open(sys.argv[1]).read(),re.S).group(1))" \
  .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/REDHAT-FIX-15-*.md \
  | python3 ~/Projects/brain/tools/validate-scenario/validate_scenario.py; echo "EXIT:$?"
```

## AGENT ASSIGNMENT

- Agent: `convex-implementer` — Convex backend implementation; live-drift gate over the couch manifest
- Reviewer: `convex-reviewer`

## EVIDENCE GATES

- RED phase: each behavioral AC's test went red before green (PASS survived live geometry drift under the self-referential manifest check)
- Integration coverage: PRIMARY AC is a behavioral integration test that mutates real geometry and asserts the gate blocks
- Scenario un-fakeable: validate_scenario exit 0 on every behavioral AC; captured EVIDENCE shows allowed:true before drift and allowed:false + COUCH_GATE_BLOCKED after drift

## DEPENDENCIES

- Depends on: REDHAT-FIX-14 (sequenced after it because both touch couchGateStatus's manifest-freshness logic and storeCouchSample's catalogVersion derivation)
- Blocks: —
- GUARDRAIL to avoid writeAllowed conflicts: FIX-14 owns the active-manifest POINTER + authorization (couch_active_manifest, promoteActiveManifest, storeCouchSample operator gate); FIX-15 owns the DRIFT-DETECTION comparison (routeGeometryHashes persistence, live-hash recompute in couchGateStatus, live-derived catalogVersion). FIX-15 must consume FIX-14's pointer read and must NOT revert it to latest-frozen. Coordinate with REDHAT-FIX-04/10 which harden verdict/manifest content binding (read/reuse only).

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
  "task_id": "REDHAT-FIX-15",
  "tdd_mode": "red_first",
  "verification_policy": { "requires_tests": true, "requires_red_evidence": true, "requires_seeded_evidence": true },
  "fixtures": {
    "frozen-manifest-with-pass": { "description": "A frozen, active couch manifest with per-route geometry hashes captured at freeze and an operator-recorded exact PASS.", "seed_method": "public_api", "records": ["operator storeCouchSample(sampleId 'redhatfix15-sample') freezes R1..Rn and persists routeGeometryHashes", "operator promoteActiveManifest -> pointer", "operator recordCouchVerdict(pass) exact membership"] },
    "geometry-drift-mutation": { "description": "A real geometry-write that changes one sampled route's curated_route_geometry after freeze.", "seed_method": "public_api", "records": ["patch curated_route_geometry for R1 via the real geometry-write path so computeRouteGeometryHash(R1) changes"] },
    "operator-identity": { "description": "An authenticated operator/founder used to freeze, promote, and record the PASS.", "seed_method": "public_api", "records": ["users row upserted for clerkUserId 's4t15-operator' with role 'operator'"] }
  },
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "primary": true, "description": "Live geometry drift on a sampled route invalidates the active PASS", "verify": "npx vitest run convex/__tests__/REDHATFIX15-catalog-drift-invalidation.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real couchGateStatus live-hash recomputation + runAllWaterfall gate)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["couchGateStatus only compares the verdict's stored manifestHash against the manifest's own stored hash (self-referential) so live drift is invisible", "the gate never recomputes live geometry hashes and keeps allowed:true after the route changes"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "frozen-manifest-with-pass", "action": { "actor": "api_client", "steps": ["Seed frozen-manifest-with-pass; confirm couchGateStatus.allowed == true", "Apply geometry-drift-mutation to route R1 via the real geometry-write path", "Query couchGateStatus", "Call runAllWaterfall and capture the thrown error"] },
          "end_state": { "must_observe": ["couchGateStatus.allowed == false with a catalog/geometry-drift reason", "runAllWaterfall throws error.code == 'COUCH_GATE_BLOCKED'"], "must_not_observe": ["couchGateStatus.allowed == true after R1's geometry drifted", "runAllWaterfall proceeding past the gate"] } } ] } },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "catalogVersion is derived from live geometry state, not a hardcoded literal", "verify": "npx vitest run convex/__tests__/REDHATFIX15-catalog-drift-invalidation.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real storeCouchSample live-derived catalogVersion + geometry hashes)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["catalogVersion is still the hardcoded 's4-trust-pipeline-v1' constant unaffected by geometry", "no per-route geometry hash is derived from live curated_route_geometry"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "frozen-manifest-with-pass", "action": { "actor": "api_client", "steps": ["Freeze frozen-manifest-with-pass and capture stored catalogVersion + routeGeometryHashes", "Recompute the live geometry hash for a sampled route before and after geometry-drift-mutation", "Compare the live-derived hash/version across the change"] },
          "end_state": { "must_observe": ["stored routeGeometryHashes are derived from actual curated_route_geometry (not a constant)", "the live-derived geometry hash for the mutated route differs after the change"], "must_not_observe": ["catalogVersion == 's4-trust-pipeline-v1' hardcoded literal unmoved by geometry", "no per-route geometry hash persisted at freeze"] } } ] } },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "No drift keeps the PASS valid", "verify": "npx vitest run convex/__tests__/REDHATFIX15-catalog-drift-invalidation.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real couchGateStatus live-hash comparison, no-drift path)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["the drift check blocks even when nothing changed (nondeterministic hash / unstable ordering)", "the comparison always reports drift regardless of live state"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "frozen-manifest-with-pass", "action": { "actor": "api_client", "steps": ["Seed frozen-manifest-with-pass with an operator PASS", "Do NOT change any route geometry", "Query couchGateStatus twice and compare"] },
          "end_state": { "must_observe": ["couchGateStatus.allowed == true with no geometry change", "repeated queries are stable (no spurious drift)"], "must_not_observe": ["couchGateStatus.allowed == false despite no geometry change", "the live-hash comparison producing a different hash for identical geometry"] } } ] } },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "Per-route geometry hashes are persisted at freeze", "verify": "npx vitest run convex/__tests__/REDHATFIX15-catalog-drift-invalidation.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real storeCouchSample persistence + couchGateStatus read)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["storeCouchSample computes routeGeometryHashes but discards them (current behavior) so couchGateStatus has nothing to compare against", "couchGateStatus recomputes the frozen baseline live (circular) instead of reading persisted hashes"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "frozen-manifest-with-pass", "action": { "actor": "api_client", "steps": ["Freeze frozen-manifest-with-pass", "Query the couch_samples row for its persisted per-route geometry hashes", "Confirm couchGateStatus reads those stored hashes for the live comparison"] },
          "end_state": { "must_observe": ["couch_samples row contains a geometry hash for every sampled route", "couchGateStatus compares live-recomputed hashes against the persisted frozen hashes"], "must_not_observe": ["couch_samples row missing per-route geometry hashes", "the frozen baseline being recomputed live (no persisted reference)"] } } ] } },
    { "id": "TC-1", "type": "test_criterion", "description": "one sampled route's geometry drift makes couchGateStatus.allowed == false", "maps_to_ac": "AC-1", "verify": "npx vitest run convex/__tests__/REDHATFIX15-catalog-drift-invalidation.integration.test.ts -t 'AC-1'" },
    { "id": "TC-2", "type": "test_criterion", "description": "runAllWaterfall throws COUCH_GATE_BLOCKED after geometry drift", "maps_to_ac": "AC-1", "verify": "npx vitest run convex/__tests__/REDHATFIX15-catalog-drift-invalidation.integration.test.ts -t 'AC-1'" },
    { "id": "TC-3", "type": "test_criterion", "description": "catalogVersion/routeGeometryHashes derive from live geometry, not the hardcoded constant", "maps_to_ac": "AC-2", "verify": "npx vitest run convex/__tests__/REDHATFIX15-catalog-drift-invalidation.integration.test.ts -t 'AC-2'" },
    { "id": "TC-4", "type": "test_criterion", "description": "no geometry change keeps couchGateStatus.allowed == true (no false-positive)", "maps_to_ac": "AC-3", "verify": "npx vitest run convex/__tests__/REDHATFIX15-catalog-drift-invalidation.integration.test.ts -t 'AC-3'" },
    { "id": "TC-5", "type": "test_criterion", "description": "couch_samples persists a per-route geometry hash for every sampled route", "maps_to_ac": "AC-4", "verify": "npx vitest run convex/__tests__/REDHATFIX15-catalog-drift-invalidation.integration.test.ts -t 'AC-4'" }
  ]
}
-->

</details>
