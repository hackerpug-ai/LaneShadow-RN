# REDHAT-FIX-10 — Bind stored couch samples to real route records, unique exact membership, gate-passing geometry, and immutable export metadata (UC-VER-05)
> Status: ⬜ Pending

| Field | Value |
|-------|-------|
| TASK_ID | REDHAT-FIX-10 |
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
| CAPABILITIES | CAP-GEO-05 |
| DEPENDS_ON | — |
| BLOCKS | REDHAT-FIX-03, REDHAT-FIX-04, REDHAT-FIX-01 |

RUNTIME_COMMANDS:
- test: `npx vitest run convex/__tests__/REDHATFIX10-*.integration.test.ts`
- typecheck: `npx tsc --noEmit -p convex/tsconfig.json`
- lint: `pnpm exec biome check`

> **Command note:** `pnpm test` maps to bare `vitest` (watch mode) and HANGS in an agent shell — always use `npx vitest run`. vitest has no `--grep`; the single-test filter is `-t '<name>'`.

## OUTCOME

`storeCouchSample` assembles a couch_samples row solely from canonical curated_routes/curated_route_geometry records, rejects duplicate/nonexistent/non-gate-passing members, and freezes an immutable manifest under a deterministic server-derived hash.

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- MUST read convex/_generated/ai/guidelines.md before implementation (project CLAUDE.md mandate)
- MUST derive EVERY stored member field (provenance, anchorCount, claimedMiles, routedMiles, difficulty, descriptionLength) from the canonical curated_routes / curated_route_geometry records looked up by routeId server-side — the caller supplies routeIds only, never metadata that is trusted verbatim
- MUST compute a server-derived manifestHash deterministically over the canonical membership set and persist it plus a frozen flag as ADDITIVE optional schema fields
- MUST reject a stored sample whose member's curated_route_geometry.verification.verdict is not 'pass'

**NEVER**
- NEVER store any client-asserted route metadata verbatim (the current storeCouchSample copies the caller's routes array unchecked)
- NEVER accept a routes set containing a duplicate routeId or a routeId absent from curated_routes
- NEVER mutate/replace a couch_samples row once frozen==true (append-only / immutable export)
- NEVER remove or narrow an existing couch_samples field — schema changes are additive-optional only

**STRICTLY**
- STRICTLY enforce sample size within COUCH_SAMPLE_MIN..COUCH_SAMPLE_MAX and at least one route of each of the three provenance types, preserving the existing size/stratification guarantees
- STRICTLY keep couch_verdict binding (sampleId→verdict) OUT of scope — that is REDHAT-FIX-03/04

## DONE WHEN

- AC-1 [Stored sample uses ONLY canonical member metadata, never client-asserted values] [PRIMARY]: A member's stored anchorCount/provenance/routedMiles are the DB values even when the caller asserts wrong ones
- AC-2 [Non-gate-passing member is rejected]: A member whose geometry verdict is 'review' throws MEMBER_NOT_GATE_PASSING
- AC-3 [Duplicate or nonexistent member routeId is rejected]: Duplicate → DUPLICATE_MEMBER; nonexistent → MEMBER_NOT_FOUND
- AC-4 [Frozen manifest is immutable — re-store of a frozen sampleId is rejected]: Re-storing a frozen sampleId throws SAMPLE_FROZEN and leaves the manifest unchanged
- AC-5 [manifestHash is deterministic over canonical membership and non-empty]: Identical membership stored in different order yields identical, non-empty manifestHash
- Every behavioral AC scenario passes `validate_scenario` (exit 0); RED-against-start recorded before GREEN; seeded-value EVIDENCE artifact captured
- `npx tsc --noEmit -p convex/tsconfig.json` → 0 errors + `pnpm exec biome check` clean + `pnpm convex:dev --once` clean
- NO-REGRESSION: `pnpm type-check` reports zero new errors vs. a baseline captured at task start
- Only SCOPE.writeAllowed files modified (`git diff --name-only`)

## SPECIFICATION

**Objective:** Rewrite storeCouchSample so a couch_samples row is a server-assembled, membership-validated, gate-passing, immutable manifest — accepting only a list of routeIds (or re-deriving all member metadata from canonical records regardless of what the caller sends), rejecting duplicates/nonexistent/non-gate-passing members, and freezing the manifest under a server-derived hash.

**Success state:** Every stored couch_samples row carries only canonical metadata sourced from curated_routes/curated_route_geometry, contains a unique membership set of gate-passing routes, and bears a deterministic manifestHash and frozen flag that make later re-writes impossible — so a downstream verdict/manifest binding (REDHAT-FIX-03/04) is anchored to an honest sample.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `canonical-couch-catalog` (seed_method: `public_api`): ~30 canonical curated_routes across all 3 provenance types, each with a passing curated_route_geometry.verification.verdict — seeded through the existing public seedCouchFixtures mutation
    - `seedCouchFixtures()` → test:scraped-1 (anchorCount 5, claimed 41, routed 41), test:ai-recon-1 (anchorCount 7, claimed 41, routed 41.1), test:name-routed-1 (anchorCount 2, claimed 25, routed 25), plus padding
- `member-gate-failing` (seed_method: `public_api`): A canonical curated_routes row whose curated_route_geometry.verification.verdict='review' (gate-failing) — new seeder seedCouchFailingMember
    - routeId 'test:couch-failing-001', verification.verdict='review', failedCondition='ratio'
- `frozen-sample-preexisting` (seed_method: `public_api`): A couch_samples row already stored AND frozen — via storeCouchSample then freezeCouchSample
    - `storeCouchSample({ sampleId:'couch-frozen-fixture', routeIds:[...25 canonical] })` then `freezeCouchSample({ sampleId:'couch-frozen-fixture' })`

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — Stored sample uses ONLY canonical member metadata, never client-asserted values

**Requirement:** GIVEN a caller submits sampleId plus routeIds that all exist in curated_routes with known canonical anchorCount/provenance/routedMiles, while also asserting deliberately WRONG per-route metadata in the request WHEN storeCouchSample assembles the sample THEN the persisted couch_samples.routes carry the canonical DB values (looked up server-side by routeId) and NONE of the caller's asserted-wrong values

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real storeCouchSample mutation + curated_routes/curated_route_geometry)
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX10-canonical-membership.integration.test.ts -t 'AC-1'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: storeCouchSample copies the caller's routes array verbatim (unchanged current behavior); member metadata is echoed from request args (a stub) instead of read from curated_route_geometry.verification
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `canonical-couch-catalog`
  - ACTION: Seed canonical catalog via seedCouchFixtures(); call storeCouchSample with routeIds incl test:ai-recon-1, asserting wrong metadata for it; query couch_samples member entry for test:ai-recon-1
  - MUST_OBSERVE: member test:ai-recon-1 anchorCount == 7; member test:ai-recon-1 provenance == 'ai_reconstructed'
  - MUST_NOT_OBSERVE: member test:ai-recon-1 anchorCount == 999; member test:ai-recon-1 metadata is empty/missing

### AC-2 — Non-gate-passing member is rejected

**Requirement:** GIVEN a routeIds set that includes a canonical route whose curated_route_geometry.verification.verdict is 'review' WHEN storeCouchSample validates membership THEN the mutation throws ConvexError code 'MEMBER_NOT_GATE_PASSING' naming the offending routeId and no couch_samples row is written

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real storeCouchSample + curated_route_geometry.verification)
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX10-canonical-membership.integration.test.ts -t 'AC-2'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: membership validation only checks routes.length (unchanged, no gate-pass check); verification.verdict is never read from curated_route_geometry (absent check)
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `member-gate-failing`
  - ACTION: Seed canonical catalog and the failing member; call storeCouchSample including 'test:couch-failing-001'; capture the thrown error and query couch_samples
  - MUST_OBSERVE: thrown error.code == 'MEMBER_NOT_GATE_PASSING'
  - MUST_NOT_OBSERVE: couch_samples row for sampleId 'couch-fail-2' is present

### AC-3 — Duplicate or nonexistent member routeId is rejected (exact unique membership)

**Requirement:** GIVEN a routeIds set containing either a duplicated routeId or a routeId that does not exist in curated_routes WHEN storeCouchSample validates membership THEN the mutation throws 'DUPLICATE_MEMBER' for the duplicate case and 'MEMBER_NOT_FOUND' for the nonexistent case, and writes no couch_samples row

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real storeCouchSample + curated_routes existence check)
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX10-canonical-membership.integration.test.ts -t 'AC-3'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: no existence check against curated_routes (unchanged, accepts any routeId string); no de-duplication of routeIds (a no-op check)
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `canonical-couch-catalog`
  - ACTION: Call storeCouchSample with 'test:scraped-1' appearing twice; capture thrown error
  - MUST_OBSERVE: thrown error.code == 'DUPLICATE_MEMBER'
  - MUST_NOT_OBSERVE: couch_samples row for sampleId 'couch-dupe-3' is present
- CASE 2 — start_ref `canonical-couch-catalog`
  - ACTION: Call storeCouchSample with routeId 'test:does-not-exist-xyz' included; capture thrown error
  - MUST_OBSERVE: thrown error.code == 'MEMBER_NOT_FOUND'
  - MUST_NOT_OBSERVE: couch_samples row for sampleId 'couch-ghost-3' is present

### AC-4 — Frozen manifest is immutable — re-store of a frozen sampleId is rejected

**Requirement:** GIVEN a couch_samples row already stored and frozen WHEN storeCouchSample is called again with the same sampleId THEN the mutation throws 'SAMPLE_FROZEN' and the previously stored manifestHash and routes are unchanged

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real storeCouchSample + freezeCouchSample)
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX10-immutable-manifest.integration.test.ts -t 'AC-4'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: storeCouchSample calls ctx.db.replace on an existing row unconditionally (unchanged current behavior); frozen flag is never checked before write (a no-op check)
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `frozen-sample-preexisting`
  - ACTION: Read couch_samples 'couch-frozen-fixture' manifestHash H0; call storeCouchSample again with a different route set; capture thrown error and re-read
  - MUST_OBSERVE: thrown error.code == 'SAMPLE_FROZEN'; manifestHash after == manifestHash before (H0, unchanged)
  - MUST_NOT_OBSERVE: couch_samples routes replaced with the new set

### AC-5 — manifestHash is deterministic over canonical membership and non-empty

**Requirement:** GIVEN two stores of the SAME canonical membership set (same routeIds, order-independent) under different sampleIds WHEN storeCouchSample computes the server-derived manifestHash for each THEN both rows carry an identical non-empty manifestHash

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real storeCouchSample manifest derivation)
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX10-immutable-manifest.integration.test.ts -t 'AC-5'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: manifestHash is left empty/undefined; manifestHash depends on request array order (unchanged unstable derivation)
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `canonical-couch-catalog`
  - ACTION: Call storeCouchSample('couch-hash-a', R sorted); call storeCouchSample('couch-hash-b', R reversed); read manifestHash of both rows
  - MUST_OBSERVE: couch-hash-a.manifestHash == couch-hash-b.manifestHash
  - MUST_NOT_OBSERVE: manifestHash is empty/null

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | storeCouchSample stores canonical member anchorCount for test:ai-recon-1 equal to 7 when the caller asserts 999 | AC-1 | `npx vitest run convex/__tests__/REDHATFIX10-canonical-membership.integration.test.ts -t 'AC-1'` |
| TC-2 | storeCouchSample stores canonical member provenance ai_reconstructed for test:ai-recon-1 when the caller asserts name_routed | AC-1 | `npx vitest run convex/__tests__/REDHATFIX10-canonical-membership.integration.test.ts -t 'AC-1'` |
| TC-3 | storeCouchSample throws MEMBER_NOT_GATE_PASSING when a member geometry verdict is review | AC-2 | `npx vitest run convex/__tests__/REDHATFIX10-canonical-membership.integration.test.ts -t 'AC-2'` |
| TC-4 | storeCouchSample throws DUPLICATE_MEMBER when a routeId appears twice | AC-3 | `npx vitest run convex/__tests__/REDHATFIX10-canonical-membership.integration.test.ts -t 'AC-3'` |
| TC-5 | storeCouchSample throws MEMBER_NOT_FOUND when a routeId is absent from curated_routes | AC-3 | `npx vitest run convex/__tests__/REDHATFIX10-canonical-membership.integration.test.ts -t 'AC-3'` |
| TC-6 | storeCouchSample throws SAMPLE_FROZEN when called again on a frozen sampleId | AC-4 | `npx vitest run convex/__tests__/REDHATFIX10-immutable-manifest.integration.test.ts -t 'AC-4'` |
| TC-7 | storeCouchSample writes an identical non-empty manifestHash for the same canonical membership in reversed order | AC-5 | `npx vitest run convex/__tests__/REDHATFIX10-immutable-manifest.integration.test.ts -t 'AC-5'` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- convex/couchSampleAssembler.ts (MODIFY) — rewrite storeCouchSample for canonical assembly, unique+existence membership, gate-pass check, manifestHash + frozen; add freezeCouchSample mutation and seedCouchFailingMember seeder
- convex/schema.ts (MODIFY, additive only) — couch_samples: add v.optional(v.string()) manifestHash, v.optional(v.boolean()) frozen, v.optional(v.number()) exportedAt
- convex/__tests__/REDHATFIX10-canonical-membership.integration.test.ts (NEW)
- convex/__tests__/REDHATFIX10-immutable-manifest.integration.test.ts (NEW)

**writeProhibited:**
- convex/couchVerdict.ts — sampleId→verdict binding is REDHAT-FIX-03/04
- convex/reviewQueue.ts — REVIEW approval gate is a separate task
- convex/guards.ts — founder/operator role enforcement is a separate task
- convex/curatedGeometryGate.ts — gate logic is a separate task; only READ verification.verdict here
- Any destructive change to existing couch_samples fields (sampleId, size, routes, createdAt) — additive-optional only
- curated_routes / curated_route_geometry DELETE operations

## READING LIST

- `convex/couchSampleAssembler.ts` (523-577) — storeCouchSample — the mutation to rewrite: currently takes routes verbatim, validates only length + provenance presence, and ctx.db.replaces freely
- `convex/couchSampleAssembler.ts` (425-451) — toCandidate / listRecoveredCandidates — the existing pattern for deriving canonical member metadata from curated_route_geometry.verification; reuse this derivation
- `convex/couchSampleAssembler.ts` (231-368) — upsertCouchRoute / seedCouchFixtures — how canonical fixtures are seeded; add seedCouchFailingMember alongside
- `convex/schema.ts` (326-345) — couch_samples table — add ONLY additive optional fields manifestHash, frozen, exportedAt
- `convex/schema.ts` (299-320) — curation_artifacts additive-union precedent
- `brain/docs/TESTING-HIERARCHY.md` (11-23) — integration tier is PRIMARY for Convex backend
- `brain/docs/CONVEX-RULES.md` — validator-first, index-only queries, additive schema evolution

## CODE PATTERN

- Pattern: Server-side canonical re-derivation — accept routeIds, look each up by the by_routeId index in curated_routes and curated_route_geometry, build member metadata from verification (mirroring toCandidate), reject on missing/duplicate/non-pass, then hash the sorted canonical membership and persist with frozen=false; a separate freezeCouchSample flips frozen=true and any subsequent write on a frozen sampleId throws
- Pattern source: `convex/couchSampleAssembler.ts:425-451` (toCandidate) + `:523-577` (storeCouchSample)
- Anti-pattern: Trusting the caller's routes array (current storeCouchSample), unconditional ctx.db.replace, or a manifestHash that folds in createdAt/order so identical membership hashes differ

## VERIFICATION GATES

- test: `npx vitest run convex/__tests__/REDHATFIX10-canonical-membership.integration.test.ts convex/__tests__/REDHATFIX10-immutable-manifest.integration.test.ts` → Exit 0
- typecheck (in-scope): `npx tsc --noEmit -p convex/tsconfig.json` → Exit 0
- typecheck (no-regression): `pnpm type-check 2>&1 | grep -c 'error TS'` → no greater than baseline
- lint: `pnpm exec biome check` → Exit 0
- convex build: `pnpm convex:dev --once` → Exit 0
- scenario validator → Exit 0, zero CRITICAL/HIGH:

```bash
python3 -c "import re,sys;print(re.search(r'<!-- REQUIREMENT-CONTRACT v1 -->\n<!--\n(.*?)\n-->',open(sys.argv[1]).read(),re.S).group(1))" \
  .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/REDHAT-FIX-10-*.md \
  | python3 ~/Projects/brain/tools/validate-scenario/validate_scenario.py; echo "EXIT:$?"
```

## AGENT ASSIGNMENT

- Agent: `convex-implementer` — Convex backend implementation; canonical, immutable couch sample manifest
- Reviewer: `convex-reviewer`

## EVIDENCE GATES

- RED phase: each behavioral AC's test went red before green
- Integration coverage: PRIMARY AC is `integration` against the real Convex dev deployment
- Scenario un-fakeable: `validate_scenario` exit 0 on every behavioral AC; captured EVIDENCE shows the seeded MUST_OBSERVE value

## DEPENDENCIES

- Depends on: —
- Blocks: REDHAT-FIX-03, REDHAT-FIX-04, REDHAT-FIX-01

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
  "task_id": "REDHAT-FIX-10",
  "tdd_mode": "red_first",
  "verification_policy": { "requires_tests": true, "requires_red_evidence": true, "requires_seeded_evidence": true },
  "fixtures": {
    "canonical-couch-catalog": { "description": "~30 canonical curated_routes across all 3 provenance types with passing geometry.", "seed_method": "public_api", "records": ["seedCouchFixtures() -> test:scraped-1, test:ai-recon-1, test:name-routed-1, plus padding"] },
    "member-gate-failing": { "description": "A canonical route whose geometry verdict is 'review'.", "seed_method": "public_api", "records": ["seedCouchFailingMember() -> routeId 'test:couch-failing-001', verification.verdict 'review'"] },
    "frozen-sample-preexisting": { "description": "A couch_samples row already stored and frozen.", "seed_method": "public_api", "records": ["storeCouchSample + freezeCouchSample -> couch_samples 'couch-frozen-fixture' frozen=true"] }
  },
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "primary": true, "description": "Stored sample uses ONLY canonical member metadata, never client-asserted values", "verify": "npx vitest run convex/__tests__/REDHATFIX10-canonical-membership.integration.test.ts -t 'AC-1'",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real storeCouchSample + canonical records)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["storeCouchSample copies the caller's routes array verbatim (unchanged current behavior)", "member metadata is echoed from request args (a stub) instead of read from curated_route_geometry.verification"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "canonical-couch-catalog", "action": { "actor": "api_client", "steps": ["Seed canonical catalog via seedCouchFixtures()", "Call storeCouchSample with routeIds incl test:ai-recon-1, asserting wrong metadata for it", "Query couch_samples member entry for test:ai-recon-1"] },
          "end_state": { "must_observe": ["member test:ai-recon-1 anchorCount == 7", "member test:ai-recon-1 provenance == 'ai_reconstructed'"], "must_not_observe": ["member test:ai-recon-1 anchorCount == 999", "member test:ai-recon-1 metadata is empty/missing"] } } ] } },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "Non-gate-passing member is rejected", "verify": "npx vitest run convex/__tests__/REDHATFIX10-canonical-membership.integration.test.ts -t 'AC-2'",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real storeCouchSample + curated_route_geometry.verification)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["membership validation only checks routes.length (unchanged, no gate-pass check)", "verification.verdict is never read from curated_route_geometry (absent check)"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "member-gate-failing", "action": { "actor": "api_client", "steps": ["Seed canonical catalog and the failing member", "Call storeCouchSample including 'test:couch-failing-001'", "Capture the thrown error and query couch_samples"] },
          "end_state": { "must_observe": ["thrown error.code == 'MEMBER_NOT_GATE_PASSING'"], "must_not_observe": ["couch_samples row for sampleId 'couch-fail-2' is present", "no MEMBER_NOT_GATE_PASSING error is thrown (call succeeds)"] } } ] } },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "Duplicate or nonexistent member routeId is rejected", "verify": "npx vitest run convex/__tests__/REDHATFIX10-canonical-membership.integration.test.ts -t 'AC-3'",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real storeCouchSample + curated_routes existence check)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["no existence check against curated_routes (unchanged, accepts any routeId string)", "no de-duplication of routeIds (a no-op check)"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "canonical-couch-catalog", "action": { "actor": "api_client", "steps": ["Call storeCouchSample with 'test:scraped-1' appearing twice", "Capture thrown error"] },
          "end_state": { "must_observe": ["thrown error.code == 'DUPLICATE_MEMBER'"], "must_not_observe": ["couch_samples row for sampleId 'couch-dupe-3' is present", "no DUPLICATE_MEMBER error is thrown (call succeeds)"] } },
          { "start_ref": "canonical-couch-catalog", "action": { "actor": "api_client", "steps": ["Call storeCouchSample with routeId 'test:does-not-exist-xyz' included", "Capture thrown error"] },
          "end_state": { "must_observe": ["thrown error.code == 'MEMBER_NOT_FOUND'"], "must_not_observe": ["couch_samples row for sampleId 'couch-ghost-3' is present", "no MEMBER_NOT_FOUND error is thrown (call succeeds)"] } } ] } },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "Frozen manifest is immutable — re-store of a frozen sampleId is rejected", "verify": "npx vitest run convex/__tests__/REDHATFIX10-immutable-manifest.integration.test.ts -t 'AC-4'",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real storeCouchSample + freezeCouchSample)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["storeCouchSample calls ctx.db.replace on an existing row unconditionally (unchanged current behavior)", "frozen flag is never checked before write (a no-op check)"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "frozen-sample-preexisting", "action": { "actor": "api_client", "steps": ["Read couch_samples 'couch-frozen-fixture' manifestHash H0", "Call storeCouchSample again with a different route set", "Capture thrown error and re-read"] },
          "end_state": { "must_observe": ["thrown error.code == 'SAMPLE_FROZEN'", "manifestHash after == manifestHash before (H0, unchanged)"], "must_not_observe": ["couch_samples routes replaced with the new set", "manifestHash after is empty/null"] } } ] } },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "manifestHash is deterministic over canonical membership and non-empty", "verify": "npx vitest run convex/__tests__/REDHATFIX10-immutable-manifest.integration.test.ts -t 'AC-5'",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real storeCouchSample manifest derivation)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["manifestHash is left empty/undefined", "manifestHash depends on request array order (unchanged unstable derivation)"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "canonical-couch-catalog", "action": { "actor": "api_client", "steps": ["Call storeCouchSample('couch-hash-a', R sorted)", "Call storeCouchSample('couch-hash-b', R reversed)", "Read manifestHash of both rows"] },
          "end_state": { "must_observe": ["couch-hash-a.manifestHash == couch-hash-b.manifestHash"], "must_not_observe": ["manifestHash is empty/null"] } } ] } },
    { "id": "TC-1", "type": "test_criterion", "description": "canonical anchorCount 7 stored despite asserted 999", "maps_to_ac": "AC-1", "verify": "npx vitest run convex/__tests__/REDHATFIX10-canonical-membership.integration.test.ts -t 'AC-1'" },
    { "id": "TC-2", "type": "test_criterion", "description": "canonical provenance ai_reconstructed stored despite asserted name_routed", "maps_to_ac": "AC-1", "verify": "npx vitest run convex/__tests__/REDHATFIX10-canonical-membership.integration.test.ts -t 'AC-1'" },
    { "id": "TC-3", "type": "test_criterion", "description": "MEMBER_NOT_GATE_PASSING thrown for review-verdict member", "maps_to_ac": "AC-2", "verify": "npx vitest run convex/__tests__/REDHATFIX10-canonical-membership.integration.test.ts -t 'AC-2'" },
    { "id": "TC-4", "type": "test_criterion", "description": "DUPLICATE_MEMBER thrown for repeated routeId", "maps_to_ac": "AC-3", "verify": "npx vitest run convex/__tests__/REDHATFIX10-canonical-membership.integration.test.ts -t 'AC-3'" },
    { "id": "TC-5", "type": "test_criterion", "description": "MEMBER_NOT_FOUND thrown for absent routeId", "maps_to_ac": "AC-3", "verify": "npx vitest run convex/__tests__/REDHATFIX10-canonical-membership.integration.test.ts -t 'AC-3'" },
    { "id": "TC-6", "type": "test_criterion", "description": "SAMPLE_FROZEN thrown on re-store of frozen sampleId", "maps_to_ac": "AC-4", "verify": "npx vitest run convex/__tests__/REDHATFIX10-immutable-manifest.integration.test.ts -t 'AC-4'" },
    { "id": "TC-7", "type": "test_criterion", "description": "identical non-empty manifestHash for order-swapped identical membership", "maps_to_ac": "AC-5", "verify": "npx vitest run convex/__tests__/REDHATFIX10-immutable-manifest.integration.test.ts -t 'AC-5'" }
  ]
}
-->

</details>
