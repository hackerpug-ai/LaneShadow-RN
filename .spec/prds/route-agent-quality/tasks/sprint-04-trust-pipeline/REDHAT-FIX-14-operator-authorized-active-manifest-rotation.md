# REDHAT-FIX-14 — Require operator authorization for active couch-manifest rotation and make active-manifest selection an explicit transition (UC-VER-05)
> Status: ⬜ Pending

| Field | Value |
|-------|-------|
| TASK_ID | REDHAT-FIX-14 |
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
| BLOCKS | REDHAT-FIX-15 |

RUNTIME_COMMANDS:
- test: `npx vitest run convex/__tests__/REDHATFIX14-*.integration.test.ts`
- typecheck: `npx tsc --noEmit -p convex/tsconfig.json`
- lint: `pnpm exec biome check`

> **Command note:** `pnpm test` maps to bare `vitest` (watch mode) and HANGS in an agent shell — always use `npx vitest run`. vitest has no `--grep`; the single-test filter is `-t '<name>'`.

## OUTCOME

Freezing/storing a couch manifest (`storeCouchSample`) requires an operator/founder, and the active manifest is no longer derived as "the latest frozen couch_sample." Instead a server-owned `couch_active_manifest` pointer (with actor, reason, timestamp) is set only by an operator-authorized `promoteActiveManifest` transition, and `couchGateStatus` resolves the active manifest from that pointer. A normal (non-operator) authenticated user can therefore no longer freeze a new sample to silently supersede the operator-approved active manifest and invalidate a valid unlock (denial-of-service / unauthorized control-plane change is closed), while `recordCouchVerdict`'s existing operator gating still prevents forging a PASS.

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- MUST read convex/_generated/ai/guidelines.md before implementation
- MUST require operator/founder authorization on storeCouchSample (the freeze/store step that mutates active-manifest-eligible state)
- MUST replace the 'latest frozen couch_sample = active' derivation in couchGateStatus with an explicit couch_active_manifest pointer row that records sampleId + manifestHash + catalogVersion + promotedBy + reason + promotedAt
- MUST set the active-manifest pointer only via an operator-authorized promoteActiveManifest transition — freezing a new sample must NOT silently make it active

**NEVER**
- NEVER let a non-operator authenticated user freeze a couch sample or change which manifest is active — this is the load-bearing property and mandatory negative control
- NEVER derive the active manifest from a `.filter(status==='frozen').sort(...)[0]` latest-wins rule (couchVerdict.ts:188-191) — the pointer is the sole source of truth
- NEVER allow a newly frozen (but un-promoted) sample to invalidate the currently active manifest's operator-approved PASS
- NEVER weaken recordCouchVerdict's existing exact-membership/operator gating (REDHAT-FIX-04/06 scope)

**STRICTLY**
- STRICTLY schema changes are additive only (new couch_active_manifest table + index); no field removals or type narrowing
- STRICTLY the freeze/store step is operator-gated while assemble/preview/list steps (assembleCouchSample, listRecoveredCandidates, getCouchSample) may remain requireIdentity-gated

## DONE WHEN

- AC-1 [Non-operator cannot freeze/rotate a couch manifest] [PRIMARY]: a non-operator storeCouchSample call throws FORBIDDEN and freezes no new sample
- AC-2 [Freezing a new sample does not silently become active]: an operator-frozen but un-promoted sample m2 leaves couchGateStatus resolving active = m1 (the pointer)
- AC-3 [Only an operator can promote the active manifest via an explicit transition]: promoteActiveManifest is FORBIDDEN for a non-operator and updates the pointer (actor/reason/timestamp) for an operator
- AC-4 [A valid operator-approved unlock is not invalidated by a non-operator freeze attempt]: couchGateStatus.allowed stays true for m1 after a non-operator's storeCouchSample(m2) is rejected
- Every behavioral AC scenario passes `validate_scenario` (exit 0); RED-against-start recorded before GREEN; seeded-value EVIDENCE artifact captured
- `npx tsc --noEmit -p convex/tsconfig.json` → 0 errors + `pnpm exec biome check` clean + `pnpm convex:dev --once` clean
- NO-REGRESSION: `pnpm type-check` reports zero new errors vs. a baseline captured at task start
- Only SCOPE.writeAllowed files modified (`git diff --name-only`)

## SPECIFICATION

**Objective:** Close the active-manifest rotation authorization gap: gate the freeze/store step behind an operator and make active-manifest selection an explicit operator-owned pointer transition rather than an implicit latest-frozen-wins derivation.

**Success state:** storeCouchSample rejects non-operators; couch_active_manifest is a server-owned pointer set only by an operator-authorized promoteActiveManifest; couchGateStatus reads the pointer; a non-operator can no longer supersede or invalidate the operator-approved active manifest by freezing a new sample.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `active-manifest-m1-with-pass` (seed_method: `public_api`): A frozen sample m1 promoted to active with an operator-recorded exact PASS so couchGateStatus.allowed == true.
    - operator storeCouchSample(m1) frozen; operator promoteActiveManifest(m1) sets couch_active_manifest -> m1; operator recordCouchVerdict(m1, pass) exact membership
- `operator-identity` (seed_method: `public_api`): An authenticated operator/founder used to freeze and promote manifests.
    - users row upserted for clerkUserId `'s4t14-operator'` with role `'operator'`
- `non-operator-user` (seed_method: `public_api`): A valid authenticated user with no operator/founder role.
    - users row upserted for clerkUserId `'plain-user-14'` with no role
- `candidate-sample-m2` (seed_method: `public_api`): A second stratified, catalog-valid route set eligible to be frozen as m2.
    - route set covering scraped_promoted + ai_reconstructed + name_routed with gate-passing geometry, sampleId `'redhatfix14-m2'`

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — Non-operator cannot freeze/rotate a couch manifest

**Requirement:** GIVEN an active operator-approved manifest m1 and a non-operator caller with a candidate sample m2 WHEN 'plain-user-14' calls storeCouchSample to freeze m2 THEN requireOperator throws FORBIDDEN, no new frozen couch_samples row is written for m2, and the active pointer remains m1

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real requireOperator + storeCouchSample + couch_active_manifest)
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX14-active-manifest-rotation-authz.integration.test.ts -t 'AC-1'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: storeCouchSample still calls only requireIdentity so any authenticated user freezes a new manifest; the active pointer flips to m2 on freeze without an explicit promotion
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `active-manifest-m1-with-pass`
  - ACTION: Seed active-manifest-m1-with-pass and candidate-sample-m2; authenticate as 'plain-user-14'; call storeCouchSample({ sampleId:'redhatfix14-m2', routes:m2 }); query couch_samples for 'redhatfix14-m2' and couch_active_manifest
  - MUST_OBSERVE: the call throws error.code == 'FORBIDDEN'; couch_active_manifest.sampleId still == m1's sampleId
  - MUST_NOT_OBSERVE: a frozen couch_samples row for 'redhatfix14-m2' exists; couch_active_manifest pointing at 'redhatfix14-m2'

### AC-2 — Freezing a new sample does not silently become active

**Requirement:** GIVEN an active pointer at m1 and an operator who freezes a new sample m2 without promoting it WHEN couchGateStatus is queried after the operator freezes m2 (but does not call promoteActiveManifest) THEN the active manifest resolved by couchGateStatus is still m1 (the pointer), and m2 is frozen-but-not-active

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real storeCouchSample + couchGateStatus + couch_active_manifest)
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX14-active-manifest-rotation-authz.integration.test.ts -t 'AC-2'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: couchGateStatus still resolves active via `.filter(status==='frozen').sort(...)[0]` so freezing m2 makes it active; no couch_active_manifest pointer exists and latest-frozen wins
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `active-manifest-m1-with-pass`
  - ACTION: Seed active-manifest-m1-with-pass (pointer m1) and candidate-sample-m2; as 's4t14-operator', call storeCouchSample to freeze m2 (do NOT promote); query couchGateStatus and couch_active_manifest
  - MUST_OBSERVE: couchGateStatus resolves sampleId == m1 (active pointer unchanged); m2 exists as frozen but couch_active_manifest still points at m1
  - MUST_NOT_OBSERVE: couchGateStatus resolving active = m2 after a mere freeze; the freeze silently updating couch_active_manifest

### AC-3 — Only an operator can promote the active manifest via an explicit transition

**Requirement:** GIVEN a frozen m2 and both a non-operator and an operator caller WHEN each calls promoteActiveManifest(m2) THEN the non-operator is rejected FORBIDDEN while the operator updates couch_active_manifest to m2 with promotedBy/reason/promotedAt and couchGateStatus then resolves active = m2

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real promoteActiveManifest operator gate + couch_active_manifest transition)
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX14-active-manifest-rotation-authz.integration.test.ts -t 'AC-3'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: promoteActiveManifest is unguarded so any authenticated user rotates the active manifest; the pointer transition does not record actor/reason/timestamp
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `active-manifest-m1-with-pass`
  - ACTION: Seed active-manifest-m1-with-pass; as 's4t14-operator' freeze m2; as 'plain-user-14' call promoteActiveManifest({ sampleId:'redhatfix14-m2', reason:'x' }) and capture the error; as 's4t14-operator' call promoteActiveManifest({ sampleId:'redhatfix14-m2', reason:'rotate to m2' }); query couch_active_manifest and couchGateStatus
  - MUST_OBSERVE: non-operator promote throws error.code == 'FORBIDDEN'; operator promote sets couch_active_manifest.sampleId == m2 with promotedBy == 's4t14-operator', a reason, and a promotedAt timestamp; couchGateStatus resolves active = m2 after the operator promotion
  - MUST_NOT_OBSERVE: the non-operator successfully rotating the pointer; a pointer transition missing actor/reason/timestamp

### AC-4 — A valid operator-approved unlock is not invalidated by a non-operator freeze attempt

**Requirement:** GIVEN m1 active with an operator PASS (couchGateStatus.allowed == true) and a non-operator attempting to freeze m2 WHEN 'plain-user-14' calls storeCouchSample(m2) and it is rejected THEN couchGateStatus.allowed remains true for m1 (the operator-approved unlock is not DoS'd)

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real storeCouchSample rejection + couchGateStatus stability)
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX14-active-manifest-rotation-authz.integration.test.ts -t 'AC-4'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: a non-operator freeze of m2 flips the active manifest and couchGateStatus.allowed drops to false (the DoS the fix must close); the gate reads latest-frozen instead of the operator pointer
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `active-manifest-m1-with-pass`
  - ACTION: Seed active-manifest-m1-with-pass; confirm couchGateStatus.allowed == true; as 'plain-user-14' attempt storeCouchSample(m2) (rejected); re-query couchGateStatus
  - MUST_OBSERVE: couchGateStatus.allowed == true before and after the rejected non-operator freeze; the non-operator freeze throws FORBIDDEN
  - MUST_NOT_OBSERVE: couchGateStatus.allowed == false after the rejected freeze; the active pointer moving away from m1

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | non-operator storeCouchSample throws FORBIDDEN and freezes no row | AC-1 | `npx vitest run convex/__tests__/REDHATFIX14-active-manifest-rotation-authz.integration.test.ts -t 'AC-1'` |
| TC-2 | operator freeze of m2 without promotion leaves couchGateStatus active = m1 | AC-2 | `npx vitest run convex/__tests__/REDHATFIX14-active-manifest-rotation-authz.integration.test.ts -t 'AC-2'` |
| TC-3 | promoteActiveManifest is FORBIDDEN for a non-operator | AC-3 | `npx vitest run convex/__tests__/REDHATFIX14-active-manifest-rotation-authz.integration.test.ts -t 'AC-3'` |
| TC-4 | operator promoteActiveManifest records actor/reason/timestamp and moves the pointer to m2 | AC-3 | `npx vitest run convex/__tests__/REDHATFIX14-active-manifest-rotation-authz.integration.test.ts -t 'AC-3'` |
| TC-5 | couchGateStatus.allowed stays true for m1 after a rejected non-operator freeze | AC-4 | `npx vitest run convex/__tests__/REDHATFIX14-active-manifest-rotation-authz.integration.test.ts -t 'AC-4'` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- convex/couchSampleAssembler.ts (MODIFY) - swap requireIdentity -> requireOperator on storeCouchSample (the freeze/store step); leave assembleCouchSample/listRecoveredCandidates/getCouchSample identity-gated
- convex/couchVerdict.ts (MODIFY) - replace the latest-frozen active derivation in couchGateStatus (188-191) with a read of the couch_active_manifest pointer; add operator-gated promoteActiveManifest mutation writing the pointer
- convex/schema.ts (MODIFY, ADDITIVE ONLY) - add couch_active_manifest table (singleton/pointer: sampleId, manifestHash, catalogVersion, promotedBy, reason, promotedAt) + index
- convex/__tests__/REDHATFIX14-active-manifest-rotation-authz.integration.test.ts (NEW)

**writeProhibited:**
- convex/couchVerdict.ts recordCouchVerdict membership/verdict logic - REDHAT-FIX-04 scope (read/reuse only)
- convex/couchVerdict.ts couchGateStatus geometry/catalog DRIFT comparison - REDHAT-FIX-15 owns drift detection; this task owns only the active-manifest POINTER + authorization
- convex/couchSampleAssembler.ts manifest content/hash/immutability logic - REDHAT-FIX-10 scope (read/reuse only)
- convex/guards.ts - requireOperator already exists; import and call only
- Removing or narrowing existing couch_samples/couch_verdicts fields; any RN/Expo/app client code

## READING LIST

- `convex/_generated/ai/guidelines.md` (all) — Convex API rules (mandatory per CLAUDE.md); index/table conventions
- `convex/couchVerdict.ts` (180-240) — couchGateStatus latest-frozen active derivation (188-191) + boundPass filter (208-219) to replace with a couch_active_manifest pointer read
- `convex/couchSampleAssembler.ts` (599-728) — storeCouchSample requireIdentity-only guard (619) to swap to requireOperator; freeze/replace path (708-726) that currently makes latest-frozen implicitly active
- `convex/guards.ts` (125-155) — requireOperator/requireFounder to apply to storeCouchSample and promoteActiveManifest
- `convex/schema.ts` (355-407) — couch_samples/couch_verdicts table + index conventions to mirror for the additive couch_active_manifest pointer table
- `.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/REDHAT-FIX-04-exact-membership-manifest-bound-couch-gate.md` (32-51) — the AC-R1 regression note calling for an explicit current-active-manifest pointer — this task delivers that pointer/authorization

## CODE PATTERN

- Pattern: Operator-owned active-manifest pointer: storeCouchSample -> requireOperator before freezing; a couch_active_manifest singleton row (keyed e.g. by a constant 'active') is written ONLY by promoteActiveManifest -> requireOperator, recording `{ sampleId, manifestHash, catalogVersion, promotedBy, reason, promotedAt }`. couchGateStatus loads the pointer (not latest-frozen), then applies the existing bound-pass check against the pointed-at sample.
- Pattern source: `convex/couchVerdict.ts:180-240` (couchGateStatus shape) + `convex/couchSampleAssembler.ts:599-726` (storeCouchSample freeze path) + `convex/guards.ts:143-155` (requireOperator)
- Anti-pattern: deriving the active manifest as `.filter(status==='frozen').sort((a,b)=>(b.frozenAt??b.createdAt)-(a.frozenAt??a.createdAt))[0]` (couchVerdict.ts:188-191) so any authenticated user's freeze silently rotates the control plane; an unguarded storeCouchSample/promote path

## VERIFICATION GATES

- test: `npx vitest run convex/__tests__/REDHATFIX14-active-manifest-rotation-authz.integration.test.ts` → Exit 0
- typecheck (in-scope): `npx tsc --noEmit -p convex/tsconfig.json` → Exit 0
- typecheck (no-regression): `pnpm type-check 2>&1 | grep -c 'error TS'` → no greater than baseline
- lint: `pnpm exec biome check` → Exit 0
- convex build: `pnpm convex:dev --once` → Exit 0
- scenario validator → Exit 0, zero CRITICAL/HIGH:

```bash
python3 -c "import re,sys;print(re.search(r'<!-- REQUIREMENT-CONTRACT v1 -->\n<!--\n(.*?)\n-->',open(sys.argv[1]).read(),re.S).group(1))" \
  .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/REDHAT-FIX-14-*.md \
  | python3 ~/Projects/brain/tools/validate-scenario/validate_scenario.py; echo "EXIT:$?"
```

## AGENT ASSIGNMENT

- Agent: `convex-implementer` — Convex backend implementation; operator-owned active-manifest pointer
- Reviewer: `convex-reviewer`

## EVIDENCE GATES

- RED phase: each behavioral AC's test went red before green (non-operator could freeze/rotate under the old requireIdentity-only guard + latest-frozen derivation)
- Integration coverage: PRIMARY AC is integration against the real Convex dev deployment
- Scenario un-fakeable: validate_scenario exit 0 on every behavioral AC; captured EVIDENCE shows the pointer row + FORBIDDEN + stable allowed:true

## DEPENDENCIES

- Depends on: —
- Blocks: REDHAT-FIX-15
- Coordinate with REDHAT-FIX-04 (manifest membership/verdict binding) and REDHAT-FIX-10 (manifest content immutability) — those harden WHAT the manifest contains and how a verdict binds; this task hardens WHO can make a manifest active. GUARDRAIL: REDHAT-FIX-14 owns the active-manifest POINTER + authorization; REDHAT-FIX-15 owns the geometry/catalog DRIFT comparison. Both read/write couchGateStatus and storeCouchSample — FIX-15 depends_on FIX-14 and must layer its drift check on top of FIX-14's pointer read without reverting the pointer to latest-frozen.

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
  "task_id": "REDHAT-FIX-14",
  "tdd_mode": "red_first",
  "verification_policy": { "requires_tests": true, "requires_red_evidence": true, "requires_seeded_evidence": true },
  "fixtures": {
    "active-manifest-m1-with-pass": { "description": "A frozen sample m1 promoted to active with an operator-recorded exact PASS.", "seed_method": "public_api", "records": ["operator storeCouchSample(m1) frozen", "operator promoteActiveManifest(m1) sets couch_active_manifest -> m1", "operator recordCouchVerdict(m1, pass) exact membership"] },
    "operator-identity": { "description": "An authenticated operator/founder used to freeze and promote manifests.", "seed_method": "public_api", "records": ["users row upserted for clerkUserId 's4t14-operator' with role 'operator'"] },
    "non-operator-user": { "description": "A valid authenticated user with no operator/founder role.", "seed_method": "public_api", "records": ["users row upserted for clerkUserId 'plain-user-14' with no role"] },
    "candidate-sample-m2": { "description": "A second stratified, catalog-valid route set eligible to be frozen as m2.", "seed_method": "public_api", "records": ["route set covering scraped_promoted + ai_reconstructed + name_routed with gate-passing geometry, sampleId 'redhatfix14-m2'"] }
  },
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "primary": true, "description": "Non-operator cannot freeze/rotate a couch manifest", "verify": "npx vitest run convex/__tests__/REDHATFIX14-active-manifest-rotation-authz.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real requireOperator + storeCouchSample + couch_active_manifest)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["storeCouchSample still calls only requireIdentity so any authenticated user freezes a new manifest", "the active pointer flips to m2 on freeze without an explicit promotion"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "active-manifest-m1-with-pass", "action": { "actor": "api_client", "steps": ["Seed active-manifest-m1-with-pass and candidate-sample-m2", "Authenticate as 'plain-user-14'", "Call storeCouchSample({ sampleId:'redhatfix14-m2', routes:m2 })", "Query couch_samples for 'redhatfix14-m2' and couch_active_manifest"] },
          "end_state": { "must_observe": ["the call throws error.code == 'FORBIDDEN'", "couch_active_manifest.sampleId still == m1's sampleId"], "must_not_observe": ["a frozen couch_samples row for 'redhatfix14-m2' exists", "couch_active_manifest pointing at 'redhatfix14-m2'"] } } ] } },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "Freezing a new sample does not silently become active", "verify": "npx vitest run convex/__tests__/REDHATFIX14-active-manifest-rotation-authz.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real storeCouchSample + couchGateStatus + couch_active_manifest)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["couchGateStatus still resolves active via .filter(status==='frozen').sort(...)[0] so freezing m2 makes it active", "no couch_active_manifest pointer exists and latest-frozen wins"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "active-manifest-m1-with-pass", "action": { "actor": "api_client", "steps": ["Seed active-manifest-m1-with-pass (pointer m1) and candidate-sample-m2", "As 's4t14-operator', call storeCouchSample to freeze m2 (do NOT promote)", "Query couchGateStatus and couch_active_manifest"] },
          "end_state": { "must_observe": ["couchGateStatus resolves sampleId == m1 (active pointer unchanged)", "m2 exists as frozen but couch_active_manifest still points at m1"], "must_not_observe": ["couchGateStatus resolving active = m2 after a mere freeze", "the freeze silently updating couch_active_manifest"] } } ] } },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "Only an operator can promote the active manifest via an explicit transition", "verify": "npx vitest run convex/__tests__/REDHATFIX14-active-manifest-rotation-authz.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real promoteActiveManifest operator gate + couch_active_manifest transition)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["promoteActiveManifest is unguarded so any authenticated user rotates the active manifest", "the pointer transition does not record actor/reason/timestamp"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "active-manifest-m1-with-pass", "action": { "actor": "api_client", "steps": ["Seed active-manifest-m1-with-pass; as 's4t14-operator' freeze m2", "As 'plain-user-14' call promoteActiveManifest({ sampleId:'redhatfix14-m2', reason:'x' }) and capture the error", "As 's4t14-operator' call promoteActiveManifest({ sampleId:'redhatfix14-m2', reason:'rotate to m2' })", "Query couch_active_manifest and couchGateStatus"] },
          "end_state": { "must_observe": ["non-operator promote throws error.code == 'FORBIDDEN'", "operator promote sets couch_active_manifest.sampleId == m2 with promotedBy == 's4t14-operator', a reason, and a promotedAt timestamp", "couchGateStatus resolves active = m2 after the operator promotion"], "must_not_observe": ["the non-operator successfully rotating the pointer", "a pointer transition missing actor/reason/timestamp"] } } ] } },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "A valid operator-approved unlock is not invalidated by a non-operator freeze attempt", "verify": "npx vitest run convex/__tests__/REDHATFIX14-active-manifest-rotation-authz.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real storeCouchSample rejection + couchGateStatus stability)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["a non-operator freeze of m2 flips the active manifest and couchGateStatus.allowed drops to false (the DoS the fix must close)", "the gate reads latest-frozen instead of the operator pointer"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "active-manifest-m1-with-pass", "action": { "actor": "api_client", "steps": ["Seed active-manifest-m1-with-pass; confirm couchGateStatus.allowed == true", "As 'plain-user-14' attempt storeCouchSample(m2) (rejected)", "Re-query couchGateStatus"] },
          "end_state": { "must_observe": ["couchGateStatus.allowed == true before and after the rejected non-operator freeze", "the non-operator freeze throws FORBIDDEN"], "must_not_observe": ["couchGateStatus.allowed == false after the rejected freeze", "the active pointer moving away from m1"] } } ] } },
    { "id": "TC-1", "type": "test_criterion", "description": "non-operator storeCouchSample throws FORBIDDEN and freezes no row", "maps_to_ac": "AC-1", "verify": "npx vitest run convex/__tests__/REDHATFIX14-active-manifest-rotation-authz.integration.test.ts -t 'AC-1'" },
    { "id": "TC-2", "type": "test_criterion", "description": "operator freeze of m2 without promotion leaves couchGateStatus active = m1", "maps_to_ac": "AC-2", "verify": "npx vitest run convex/__tests__/REDHATFIX14-active-manifest-rotation-authz.integration.test.ts -t 'AC-2'" },
    { "id": "TC-3", "type": "test_criterion", "description": "promoteActiveManifest is FORBIDDEN for a non-operator", "maps_to_ac": "AC-3", "verify": "npx vitest run convex/__tests__/REDHATFIX14-active-manifest-rotation-authz.integration.test.ts -t 'AC-3'" },
    { "id": "TC-4", "type": "test_criterion", "description": "operator promoteActiveManifest records actor/reason/timestamp and moves the pointer to m2", "maps_to_ac": "AC-3", "verify": "npx vitest run convex/__tests__/REDHATFIX14-active-manifest-rotation-authz.integration.test.ts -t 'AC-3'" },
    { "id": "TC-5", "type": "test_criterion", "description": "couchGateStatus.allowed stays true for m1 after a rejected non-operator freeze", "maps_to_ac": "AC-4", "verify": "npx vitest run convex/__tests__/REDHATFIX14-active-manifest-rotation-authz.integration.test.ts -t 'AC-4'" }
  ]
}
-->

</details>
