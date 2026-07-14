# S3-T2 — Duplicate-group detection + reversible duplicateOf merge with dry-run plan (UC-HYG-02)

| Field | Value |
|-------|-------|
| TASK_ID | S3-T2 |
| SPRINT | [Sprint 03 — Catalog hygiene](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`convex-implementer` · reviewer=`convex-reviewer` |
| ESTIMATE | 120 min |
| EFFORT | M |
| PRIORITY | P0 |
| STATUS | Backlog |
| PROPOSED_BY | `convex-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | — (N/A: deterministic at-rest cleanup) |
| DEPENDS_ON | S3-T1 |
| BLOCKS | S3-T4, sprint-04 |

RUNTIME_COMMANDS:
- test: `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts`
- typecheck: `pnpm type-check`
- lint: `pnpm exec biome check`

## OUTCOME

dedupeGroups {dryRun:true} yields the group plan without writing; the committed run marks shadows with duplicateOf toward the canonical; listCuratedRoutes and a 'Cherohala Skyway' name search both return only the canonical; a second run marks 0 new shadows; distinct-name and far-apart same-name rows are never merged.

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- Read convex/_generated/ai/guidelines.md first.
- Detect duplicate groups by NORMALIZED name (by_name_lower) AND centroid proximity — both signals, so far-apart same-name rows are NOT merged.
- Select the canonical per group preferring a row with gate-passing geometry (geometryStatus='generated' ∧ verification.verdict='pass') AND, among gate-passing rows, the highest compositeScore; fall back to highest score when none are gate-passing.
- Set duplicateOf on shadow rows pointing to the CANONICAL routeId (reversible flag); leave the canonical's duplicateOf null.
- Reuse the EXISTING listCuratedRoutes shadow exclusion (curatedRoutes.ts:257-260,304) — do NOT re-implement it there.
- Extend the name-search read path (semanticSearch.findRoutesByIdentifier by_name_lower, line 151, and the hybrid search line 717) to exclude duplicateOf!=null shadows so 'Cherohala Skyway' returns exactly one row after the merge.
- dedupeGroups {dryRun:true} returns the full plan (groups + per-group canonical + shadows) and writes NOTHING; the committed run's duplicateOf assignments match the plan.
- Seed same-name groups via curatedGeometryTestSupport (extend it to set name_lower and seed one gate-passing canonical through the real persistGeometryVerified seam).

**NEVER**
- Never merge by name alone (must require centroid proximity) — far-apart same-name rows stay separate.
- Never point a shadow's duplicateOf at itself or a non-canonical row; never mark the canonical as a shadow.
- Never re-flag already-shadowed rows on a re-run (idempotent).
- Never leave the name-search path returning shadows — T-HYG-006 requires exactly one row.
- Never edit convex/schema.ts (duplicateOf already present), convex/actions/agent/**, or the RN app; never rebuild the recompute predicate.
- Never report complete while dedupeGroups lacks {dryRun?} or while a mocked table stands in for the dev deployment.

**STRICTLY**
- Canonical precedence: (1) gate-passing geometry, then (2) highest compositeScore among the eligible set.
- duplicateOf is reversible — unset returns a shadow to the surface (do not delete rows).
- dryRun plan and committed assignments must be identical for the same catalog state.

## DONE WHEN

- AC-1 [PRIMARY]: it detects the group by normalized name + centroid proximity, selects the gate-passing highest-score row as canonical, sets duplicateOf on the other two shadows pointing to the canonical routeId, and a second run sets 0 new shadows
- AC-2: it returns the plan (groups + per-group canonical + shadows) and writes NO duplicateOf, and a committed run's duplicateOf assignments match the plan
- AC-3: the gate-passing row is chosen canonical (gate-passing geometry outranks a higher raw score)
- AC-4: no duplicateOf shadow appears in any listCuratedRoutes result and the name search returns exactly one row (the canonical)
- AC-5: neither is merged (no duplicateOf set) and they are not counted as a group
- Every behavioral AC scenario passes `validate_scenario` (exit 0); RED-against-start recorded before GREEN; seeded-value EVIDENCE artifact captured
- `pnpm type-check` clean + `pnpm exec biome check` clean + `pnpm convex:dev --once` clean
- Only SCOPE.writeAllowed files modified (`git diff --name-only`)

## SPECIFICATION

**Objective:** Add dedupeGroups to curatedGeometryHygiene.ts: detect ~50 duplicate name groups by by_name_lower + centroid proximity, pick a gate-passing/highest-score canonical, reversibly mark the rest as duplicateOf shadows with a dry-run plan for founder review; extend the name-search read path so shadows never surface.

**Success state:** dedupeGroups {dryRun:true} yields the group plan without writing; the committed run marks shadows with duplicateOf toward the canonical; listCuratedRoutes and a 'Cherohala Skyway' name search both return only the canonical; a second run marks 0 new shadows; distinct-name and far-apart same-name rows are never merged.

## FIXTURES (shared seed data — referenced by scenario `start_ref`; seeded via `curatedGeometryTestSupport`)

- `cherohala_dup_group` (seed_method: `public_api`): 3 rows named 'Cherohala Skyway' (name_lower 'cherohala skyway'), centroids within the proximity threshold (all near 35.34,-83.93), distinct compositeScores; the highest-score row ALSO carries gate-passing geometry (geometryStatus='generated', verification.verdict='pass') → canonical; the other two → shadows.
    - curated_routes routeId=test:cherohala-canonical name='Cherohala Skyway' name_lower='cherohala skyway' compositeScore=0.91 gate-passing geometry seeded via persistGeometryVerified
    - curated_routes routeId=test:cherohala-shadow-a name='Cherohala Skyway' name_lower='cherohala skyway' compositeScore=0.70 no gate-passing geometry
    - curated_routes routeId=test:cherohala-shadow-b name='Cherohala Skyway' name_lower='cherohala skyway' compositeScore=0.55 no gate-passing geometry
- `precedence_group` (seed_method: `public_api`): 2 rows named 'Deals Gap Loop': one HIGHER score but NO gate-passing geometry (geometryStatus='review'), one slightly LOWER score WITH gate-passing geometry (generated/pass). Canonical must be the gate-passing lower-score row.
    - curated_routes routeId=test:deals-highscore-review name='Deals Gap Loop' compositeScore=0.88 geometryStatus='review' (not gate-passing)
    - curated_routes routeId=test:deals-lowscore-passing name='Deals Gap Loop' compositeScore=0.80 gate-passing geometry seeded via persistGeometryVerified
- `no_merge_control` (seed_method: `public_api`): Rows that must NOT be merged: two distinct-name rows, plus two same-name 'Cherohala Skyway' rows whose centroids are >200 mi apart (one NC 35.3,-83.9, one CA 34.9,-120.4) so the centroid-proximity guard blocks the merge.
    - curated_routes routeId=test:distinct-blueridge name='Blue Ridge Parkway' name_lower='blue ridge parkway'
    - curated_routes routeId=test:distinct-tail name='Tail of the Dragon' name_lower='tail of the dragon'
    - curated_routes routeId=test:cherohala-far-nc name='Cherohala Skyway' name_lower='cherohala skyway' centroid=35.3,-83.9
    - curated_routes routeId=test:cherohala-far-ca name='Cherohala Skyway' name_lower='cherohala skyway' centroid=34.9,-120.4

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — Detect group + set duplicateOf on shadows toward the gate-passing canonical

**Requirement:** GIVEN a same-name proximate duplicate group (3 'Cherohala Skyway' rows, one gate-passing) WHEN dedupeGroups runs committed THEN it detects the group by normalized name + centroid proximity, selects the gate-passing highest-score row as canonical, sets duplicateOf on the other two shadows pointing to the canonical routeId, and a second run sets 0 new shadows

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real curated_routes rows + gate-passing geometry seeded via curatedGeometryTestSupport)
- FLOW_REF: UC-HYG-02
- VERIFY: `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t dedupe-detect`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: duplicateOf is never set so the shadow rows are still returned (the mutation is a stub/no-op); the group is detected by name only, ignoring centroid proximity (a static name match); a shadow's duplicateOf points at itself or a non-canonical row; re-running dedupeGroups flags already-shadowed rows again because the idempotency guard is a no-op
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `cherohala_dup_group`
    - ACTION (cli_user): npx convex run curatedGeometryHygiene:dedupeGroups '{}'; query the 3 seeded rows by_routeId; read the returned {groups,shadows}
    - MUST_OBSERVE: groups == 1 (the Cherohala group); shadows == 2; test:cherohala-canonical duplicateOf == null (canonical); test:cherohala-shadow-a duplicateOf == 'test:cherohala-canonical'; test:cherohala-shadow-b duplicateOf == 'test:cherohala-canonical'
    - MUST_NOT_OBSERVE: all 3 rows with duplicateOf == null (no merge — unchanged start state); test:cherohala-canonical carrying duplicateOf (shadowed itself)
- CASE 2 — start_ref `cherohala_dup_group`
    - ACTION (cli_user): npx convex run curatedGeometryHygiene:dedupeGroups '{}' (second committed run); read the returned {groups,shadows}
    - MUST_OBSERVE: second-run shadows == 0 (no-op / nothing new to merge)
    - MUST_NOT_OBSERVE: second-run shadows == 2 (re-flagged already-merged rows — the first-run count repeated); duplicateOf rewritten on a row that was already 'test:cherohala-canonical' (mutated from the committed start value); second-run shadows is a non-zero count instead of 0 (the no-op re-run must report 0 shadows, not repeat the first-run count)

### AC-2 — dryRun plan writes nothing; committed run matches the plan

**Requirement:** GIVEN the duplicate group WHEN dedupeGroups runs with {dryRun:true} THEN it returns the plan (groups + per-group canonical + shadows) and writes NO duplicateOf, and a committed run's duplicateOf assignments match the plan

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real curated_routes rows seeded via curatedGeometryTestSupport)
- FLOW_REF: UC-HYG-02
- VERIFY: `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t dedupe-dryrun`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the dry-run sets duplicateOf on the shadows anyway; the dry-run plan is empty (0 groups) instead of the real plan; the committed shadow assignments differ from the dry-run plan
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `cherohala_dup_group`
    - ACTION (cli_user): npx convex run curatedGeometryHygiene:dedupeGroups '{"dryRun":true}'; query the 3 rows to confirm no duplicateOf was written; npx convex run curatedGeometryHygiene:dedupeGroups '{}' (committed); compare committed assignments to the dry-run plan
    - MUST_OBSERVE: dry-run plan groups == 1 with shadows == 2; after the dry-run all 3 rows have duplicateOf == null (unwritten); the committed run marks the same 2 rows the plan named as shadows
    - MUST_NOT_OBSERVE: a shadow row has duplicateOf set after the dry-run; dry-run groups == 0 (empty plan)

### AC-3 — Canonical prefers gate-passing geometry over a higher raw score

**Requirement:** GIVEN a group where the highest-score row lacks gate-passing geometry and a lower-score row has gate-passing geometry WHEN dedupeGroups runs THEN the gate-passing row is chosen canonical (gate-passing geometry outranks a higher raw score)

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real curated_routes rows + gate-passing geometry seeded via curatedGeometryTestSupport)
- FLOW_REF: UC-HYG-02
- VERIFY: `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t canonical-precedence`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the canonical is picked by score alone (a static max-score pick) so the review-status higher-score row wins; gate-passing status is ignored in canonical selection (the geometry check is a no-op); canonical selection returns a hardcoded/first-row pick (stub) regardless of gate status
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `precedence_group`
    - ACTION (cli_user): npx convex run curatedGeometryHygiene:dedupeGroups '{}'; query the 2 seeded rows
    - MUST_OBSERVE: test:deals-lowscore-passing (gate-passing) duplicateOf == null (canonical); test:deals-highscore-review duplicateOf == 'test:deals-lowscore-passing'
    - MUST_NOT_OBSERVE: test:deals-highscore-review is canonical (duplicateOf == null); test:deals-lowscore-passing carrying duplicateOf; both rows still duplicateOf == null (no merge happened — unchanged start state)

### AC-4 — Shadows excluded from every read path; name search returns exactly one row

**Requirement:** GIVEN the committed merge WHEN listCuratedRoutes runs in every mode and a 'Cherohala Skyway' name search runs THEN no duplicateOf shadow appears in any listCuratedRoutes result and the name search returns exactly one row (the canonical)

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (listCuratedRoutes + semanticSearch.findRoutesByIdentifier over real seeded rows)
- FLOW_REF: UC-HYG-02
- VERIFY: `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t shadow-exclusion`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: a shadow row still appears in listCuratedRoutes results because duplicateOf is not set (mutation stub/no-op); the name-search read path (semanticSearch.findRoutesByIdentifier by_name_lower) does not filter duplicateOf so it statically returns all 3 rows; the exclusion filter is applied in listCuratedRoutes but the name search returns a static/unfiltered 3-row set
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `cherohala_dup_group`
    - ACTION (cli_user): npx convex run curatedGeometryHygiene:dedupeGroups '{}' (committed); call listCuratedRoutes national-best and nearest at the group centroid; call semanticSearch:findRoutesByIdentifier identifier 'Cherohala Skyway'
    - MUST_OBSERVE: 0 shadow (duplicateOf != null) rows in any listCuratedRoutes result; findRoutesByIdentifier 'Cherohala Skyway' returns exactly 1 row; the single returned row is routeId test:cherohala-canonical
    - MUST_NOT_OBSERVE: test:cherohala-shadow-a or test:cherohala-shadow-b present in any listCuratedRoutes result; findRoutesByIdentifier returns 3 rows for 'Cherohala Skyway' (the pre-merge count — nothing excluded); findRoutesByIdentifier returns 2 rows (only partial exclusion)

### AC-5 — Distinct-name and far-apart same-name rows are not merged

**Requirement:** GIVEN distinct-name rows and same-name-but-far-apart rows WHEN dedupeGroups runs THEN neither is merged (no duplicateOf set) and they are not counted as a group

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real curated_routes rows seeded via curatedGeometryTestSupport)
- FLOW_REF: UC-HYG-02
- VERIFY: `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t no-overmerge`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: distinct-name rows are merged into one group because grouping ignores the name key (static over-merge); same-name rows >200 mi apart are merged because the centroid-proximity guard is a no-op; duplicateOf is set on a control row by a stub that shadows every same-name row
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `no_merge_control`
    - ACTION (cli_user): npx convex run curatedGeometryHygiene:dedupeGroups '{}'; query the 4 control rows
    - MUST_OBSERVE: test:distinct-blueridge and test:distinct-tail both have duplicateOf == null; test:cherohala-far-nc and test:cherohala-far-ca both have duplicateOf == null (proximity guard blocked the merge)
    - MUST_NOT_OBSERVE: any control row with duplicateOf set; a control row's duplicateOf changed from null (the unchanged start value) to a canonical id; a group formed from distinct names or from centroids >200 mi apart; a control row's shadow count is non-zero (0 control rows must be shadowed — none merged)

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | dedupeGroups detects the same-name proximate group and sets duplicateOf on the shadows toward the gate-passing highest-score canonical; a second run adds 0 shadows | AC-1 | `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t dedupe-detect` |
| TC-2 | dedupeGroups {dryRun:true} returns the plan and writes no duplicateOf; the committed run matches the plan | AC-2 | `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t dedupe-dryrun` |
| TC-3 | Canonical selection prefers gate-passing geometry over a higher raw score | AC-3 | `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t canonical-precedence` |
| TC-4 | After the merge no shadow appears in listCuratedRoutes and a Cherohala Skyway name search returns exactly one row | AC-4 | `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t shadow-exclusion` |
| TC-5 | Distinct-name rows and far-apart same-name rows are not merged | AC-5 | `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t no-overmerge` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- convex/curatedGeometryHygiene.ts (MODIFY — add dedupeGroups + reuse the S3-T1 {dryRun?} helper)
- convex/semanticSearch.ts (MODIFY — SCOPE ADDITION, JUSTIFIED: extend findRoutesByIdentifier + hybrid search by_name_lower path to exclude duplicateOf shadows so T-HYG-006 'Cherohala Skyway search returns exactly one row' holds; the curatedRoutes.ts exclusion does NOT cover the name-search path)
- scripts/hygiene-curated-routes.ts (MODIFY — add --dedupe subcommand)
- convex/__tests__/curatedGeometryHygiene.integration.test.ts (MODIFY — add dedupe cases)
- convex/curatedGeometryTestSupport.ts (MODIFY — seedDedupeGroup: same-name rows with name_lower + a gate-passing canonical via persistGeometryVerified)

**writeProhibited:**
- convex/schema.ts - duplicateOf already present; by_name_lower already exists
- convex/curatedRoutes.ts exclusion internals - REUSE, do not re-implement the shadow filter
- convex/actions/agent/** - out of scope
- app/**, components/** - no UI in this sprint
- convex/curatedGeometry.ts predicate/persist internals - hook only
- .spec/** - planning docs are read-only
- unrelated Convex modules

## READING LIST

- `convex/curatedRoutes.ts` (257-260,294-307) — the listCuratedRoutes shadow/quarantine/retired exclusion to REUSE (not re-implement)
- `convex/semanticSearch.ts` (128-190,696-740) — findRoutesByIdentifier + hybrid search by_name_lower path that must be extended to exclude duplicateOf shadows (T-HYG-006)
- `convex/schema.ts` (187-200) — by_name_lower index used for grouping; centroidLat/Lng on curated_routes; no schema change needed (duplicateOf present)
- `convex/curatedGeometry.ts` (457-508) — persistGeometryVerified seam to seed a gate-passing canonical in curatedGeometryTestSupport
- `convex/curatedGeometryTestSupport.ts` (11-107,354-390) — insertTestRoute + teardown to extend for name_lower + same-name group seeding

## CODE PATTERN

- Pattern: // reuse the SAME exclusion predicate the list path uses, now on the name-search read path
const rows = await ctx.db
  .query('curated_routes')
  .withIndex('by_name_lower', (q) => q.eq('name_lower', searchTermLower))
  .take(limit)
const visible = rows.filter((r) => r.duplicateOf == null && r.retiredAt == null && r.quarantine == null)
- Pattern source: `convex/curatedRoutes.ts:257-260 (exclusion filter) + convex/semanticSearch.ts:149-152 (by_name_lower lookup to extend)`
- Anti-pattern: Grouping by name alone (merging far-apart routes); pointing duplicateOf at a shadow; re-implementing the list-path exclusion; leaving the name-search path returning shadows; deleting shadow rows instead of the reversible flag.

## VERIFICATION GATES

- Integration tests pass: `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts` → Exit 0
- Typecheck: `pnpm type-check` → Exit 0
- Lint: `pnpm exec biome check` → Exit 0
- Convex build: `pnpm convex:dev --once` → Exit 0

## AGENT ASSIGNMENT

- Agent: `convex-implementer` — Pure-Convex backend: extend curatedGeometryHygiene.ts with dedupeGroups (by_name_lower + centroid-proximity grouping, gate-passing/highest-score canonical selection, reversible duplicateOf shadow marking, {dryRun?} plan), and extend the name-search read path in semanticSearch.ts to exclude shadows so the founder-gate 'Cherohala Skyway search returns exactly one row' holds — all verified against the real dev deployment.
- Reviewer: `convex-reviewer`

## EVIDENCE GATES

- RED phase: each behavioral AC's test went red before green (TDD_STATE history).
- Integration coverage: PRIMARY AC is `integration` against the real Convex dev deployment.
- Scenario un-fakeable: `validate_scenario` exit 0 on every behavioral AC; captured EVIDENCE shows the seeded MUST_OBSERVE value (not merely "tests passed").

## DEPENDENCIES

- Depends on: S3-T1
- Blocks: S3-T4, sprint-04

## CODING STANDARDS

- convex/_generated/ai/guidelines.md
- brain/docs/TESTING-HIERARCHY.md
- brain/docs/CONVEX-RULES.md

<details>
<summary>▸ Full agent specification (TASK-TEMPLATE v5.2 — machine-readable requirement contract)</summary>

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "S3-T2",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "cherohala_dup_group": {
      "description": "3 rows named 'Cherohala Skyway' (name_lower 'cherohala skyway'), centroids within the proximity threshold (all near 35.34,-83.93), distinct compositeScores; the highest-score row ALSO carries gate-passing geometry (geometryStatus='generated', verification.verdict='pass') \u2192 canonical; the other two \u2192 shadows.",
      "seed_method": "public_api",
      "records": [
        "curated_routes routeId=test:cherohala-canonical name='Cherohala Skyway' name_lower='cherohala skyway' compositeScore=0.91 gate-passing geometry seeded via persistGeometryVerified",
        "curated_routes routeId=test:cherohala-shadow-a name='Cherohala Skyway' name_lower='cherohala skyway' compositeScore=0.70 no gate-passing geometry",
        "curated_routes routeId=test:cherohala-shadow-b name='Cherohala Skyway' name_lower='cherohala skyway' compositeScore=0.55 no gate-passing geometry"
      ]
    },
    "precedence_group": {
      "description": "2 rows named 'Deals Gap Loop': one HIGHER score but NO gate-passing geometry (geometryStatus='review'), one slightly LOWER score WITH gate-passing geometry (generated/pass). Canonical must be the gate-passing lower-score row.",
      "seed_method": "public_api",
      "records": [
        "curated_routes routeId=test:deals-highscore-review name='Deals Gap Loop' compositeScore=0.88 geometryStatus='review' (not gate-passing)",
        "curated_routes routeId=test:deals-lowscore-passing name='Deals Gap Loop' compositeScore=0.80 gate-passing geometry seeded via persistGeometryVerified"
      ]
    },
    "no_merge_control": {
      "description": "Rows that must NOT be merged: two distinct-name rows, plus two same-name 'Cherohala Skyway' rows whose centroids are >200 mi apart (one NC 35.3,-83.9, one CA 34.9,-120.4) so the centroid-proximity guard blocks the merge.",
      "seed_method": "public_api",
      "records": [
        "curated_routes routeId=test:distinct-blueridge name='Blue Ridge Parkway' name_lower='blue ridge parkway'",
        "curated_routes routeId=test:distinct-tail name='Tail of the Dragon' name_lower='tail of the dragon'",
        "curated_routes routeId=test:cherohala-far-nc name='Cherohala Skyway' name_lower='cherohala skyway' centroid=35.3,-83.9",
        "curated_routes routeId=test:cherohala-far-ca name='Cherohala Skyway' name_lower='cherohala skyway' centroid=34.9,-120.4"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "maps_to_ac": null,
      "description": "GIVEN a same-name proximate duplicate group (3 'Cherohala Skyway' rows, one gate-passing) WHEN dedupeGroups runs committed THEN it detects the group by normalized name + centroid proximity, selects the gate-passing highest-score row as canonical, sets duplicateOf on the other two shadows pointing to the canonical routeId, and a second run sets 0 new shadows",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t dedupe-detect",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real curated_routes rows + gate-passing geometry seeded via curatedGeometryTestSupport)",
        "negative_control": {
          "would_fail_if": [
            "duplicateOf is never set so the shadow rows are still returned (the mutation is a stub/no-op)",
            "the group is detected by name only, ignoring centroid proximity (a static name match)",
            "a shadow's duplicateOf points at itself or a non-canonical row",
            "re-running dedupeGroups flags already-shadowed rows again because the idempotency guard is a no-op"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "cherohala_dup_group",
            "action": {
              "actor": "cli_user",
              "steps": [
                "npx convex run curatedGeometryHygiene:dedupeGroups '{}'",
                "query the 3 seeded rows by_routeId",
                "read the returned {groups,shadows}"
              ]
            },
            "end_state": {
              "must_observe": [
                "groups == 1 (the Cherohala group)",
                "shadows == 2",
                "test:cherohala-canonical duplicateOf == null (canonical)",
                "test:cherohala-shadow-a duplicateOf == 'test:cherohala-canonical'",
                "test:cherohala-shadow-b duplicateOf == 'test:cherohala-canonical'"
              ],
              "must_not_observe": [
                "all 3 rows with duplicateOf == null (no merge \u2014 unchanged start state)",
                "test:cherohala-canonical carrying duplicateOf (shadowed itself)"
              ]
            }
          },
          {
            "start_ref": "cherohala_dup_group",
            "action": {
              "actor": "cli_user",
              "steps": [
                "npx convex run curatedGeometryHygiene:dedupeGroups '{}' (second committed run)",
                "read the returned {groups,shadows}"
              ]
            },
            "end_state": {
              "must_observe": [
                "second-run shadows == 0 (no-op / nothing new to merge)"
              ],
              "must_not_observe": [
                "second-run shadows == 2 (re-flagged already-merged rows \u2014 the first-run count repeated)",
                "duplicateOf rewritten on a row that was already 'test:cherohala-canonical' (mutated from the committed start value)",
                "second-run shadows is a non-zero count instead of 0 (the no-op re-run must report 0 shadows, not repeat the first-run count)"
              ]
            }
          }
        ],
        "id": "AC-1",
        "primary": true
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "primary": false,
      "maps_to_ac": null,
      "description": "GIVEN the duplicate group WHEN dedupeGroups runs with {dryRun:true} THEN it returns the plan (groups + per-group canonical + shadows) and writes NO duplicateOf and a committed run's duplicateOf assignments match the plan",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t dedupe-dryrun",
      "scenario": {
        "id": "AC-2",
        "primary": false,
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real curated_routes rows seeded via curatedGeometryTestSupport)",
        "negative_control": {
          "would_fail_if": [
            "the dry-run sets duplicateOf on the shadows anyway",
            "the dry-run plan is empty (0 groups) instead of the real plan",
            "the committed shadow assignments differ from the dry-run plan"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "cherohala_dup_group",
            "action": {
              "actor": "cli_user",
              "steps": [
                "npx convex run curatedGeometryHygiene:dedupeGroups '{\"dryRun\":true}'",
                "query the 3 rows to confirm no duplicateOf was written",
                "npx convex run curatedGeometryHygiene:dedupeGroups '{}' (committed)",
                "compare committed assignments to the dry-run plan"
              ]
            },
            "end_state": {
              "must_observe": [
                "dry-run plan groups == 1 with shadows == 2",
                "after the dry-run all 3 rows have duplicateOf == null (unwritten)",
                "the committed run marks the same 2 rows the plan named as shadows"
              ],
              "must_not_observe": [
                "a shadow row has duplicateOf set after the dry-run",
                "dry-run groups == 0 (empty plan)"
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
      "description": "GIVEN a group where the highest-score row lacks gate-passing geometry and a lower-score row has gate-passing geometry WHEN dedupeGroups runs THEN the gate-passing row is chosen canonical (gate-passing geometry outranks a higher raw score)",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t canonical-precedence",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real curated_routes rows + gate-passing geometry seeded via curatedGeometryTestSupport)",
        "negative_control": {
          "would_fail_if": [
            "the canonical is picked by score alone (a static max-score pick) so the review-status higher-score row wins",
            "gate-passing status is ignored in canonical selection (the geometry check is a no-op)",
            "canonical selection returns a hardcoded/first-row pick (stub) regardless of gate status"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "precedence_group",
            "action": {
              "actor": "cli_user",
              "steps": [
                "npx convex run curatedGeometryHygiene:dedupeGroups '{}'",
                "query the 2 seeded rows"
              ]
            },
            "end_state": {
              "must_observe": [
                "test:deals-lowscore-passing (gate-passing) duplicateOf == null (canonical)",
                "test:deals-highscore-review duplicateOf == 'test:deals-lowscore-passing'"
              ],
              "must_not_observe": [
                "test:deals-highscore-review is canonical (duplicateOf == null)",
                "test:deals-lowscore-passing carrying duplicateOf",
                "both rows still duplicateOf == null (no merge happened \u2014 unchanged start state)"
              ]
            }
          }
        ],
        "id": "AC-3",
        "primary": false
      }
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "primary": false,
      "maps_to_ac": null,
      "description": "GIVEN the committed merge WHEN listCuratedRoutes runs in every mode and a 'Cherohala Skyway' name search runs THEN no duplicateOf shadow appears in any listCuratedRoutes result and the name search returns exactly one row (the canonical)",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t shadow-exclusion",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (listCuratedRoutes + semanticSearch.findRoutesByIdentifier over real seeded rows)",
        "negative_control": {
          "would_fail_if": [
            "a shadow row still appears in listCuratedRoutes results because duplicateOf is not set (mutation stub/no-op)",
            "the name-search read path (semanticSearch.findRoutesByIdentifier by_name_lower) does not filter duplicateOf so it statically returns all 3 rows",
            "the exclusion filter is applied in listCuratedRoutes but the name search returns a static/unfiltered 3-row set"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "cherohala_dup_group",
            "action": {
              "actor": "cli_user",
              "steps": [
                "npx convex run curatedGeometryHygiene:dedupeGroups '{}' (committed)",
                "call listCuratedRoutes national-best and nearest at the group centroid",
                "call semanticSearch:findRoutesByIdentifier identifier 'Cherohala Skyway'"
              ]
            },
            "end_state": {
              "must_observe": [
                "0 shadow (duplicateOf != null) rows in any listCuratedRoutes result",
                "findRoutesByIdentifier 'Cherohala Skyway' returns exactly 1 row",
                "the single returned row is routeId test:cherohala-canonical"
              ],
              "must_not_observe": [
                "test:cherohala-shadow-a or test:cherohala-shadow-b present in any listCuratedRoutes result",
                "findRoutesByIdentifier returns 3 rows for 'Cherohala Skyway' (the pre-merge count \u2014 nothing excluded)",
                "findRoutesByIdentifier returns 2 rows (only partial exclusion)"
              ]
            }
          }
        ],
        "id": "AC-4",
        "primary": false
      }
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "primary": false,
      "maps_to_ac": null,
      "description": "GIVEN distinct-name rows and same-name-but-far-apart rows WHEN dedupeGroups runs THEN neither is merged (no duplicateOf set) and they are not counted as a group",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t no-overmerge",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real curated_routes rows seeded via curatedGeometryTestSupport)",
        "negative_control": {
          "would_fail_if": [
            "distinct-name rows are merged into one group because grouping ignores the name key (static over-merge)",
            "same-name rows >200 mi apart are merged because the centroid-proximity guard is a no-op",
            "duplicateOf is set on a control row by a stub that shadows every same-name row"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "no_merge_control",
            "action": {
              "actor": "cli_user",
              "steps": [
                "npx convex run curatedGeometryHygiene:dedupeGroups '{}'",
                "query the 4 control rows"
              ]
            },
            "end_state": {
              "must_observe": [
                "test:distinct-blueridge and test:distinct-tail both have duplicateOf == null",
                "test:cherohala-far-nc and test:cherohala-far-ca both have duplicateOf == null (proximity guard blocked the merge)"
              ],
              "must_not_observe": [
                "any control row with duplicateOf set",
                "a control row's duplicateOf changed from null (the unchanged start value) to a canonical id",
                "a group formed from distinct names or from centroids >200 mi apart",
                "a control row's shadow count is non-zero (0 control rows must be shadowed \u2014 none merged)"
              ]
            }
          }
        ],
        "id": "AC-5",
        "primary": false
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-1",
      "description": "dedupeGroups detects the same-name proximate group and sets duplicateOf on the shadows toward the gate-passing highest-score canonical; a second run adds 0 shadows",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t dedupe-detect"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-2",
      "description": "dedupeGroups {dryRun:true} returns the plan and writes no duplicateOf; the committed run matches the plan",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t dedupe-dryrun"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-3",
      "description": "Canonical selection prefers gate-passing geometry over a higher raw score",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t canonical-precedence"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-4",
      "description": "After the merge no shadow appears in listCuratedRoutes and a Cherohala Skyway name search returns exactly one row",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t shadow-exclusion"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-5",
      "description": "Distinct-name rows and far-apart same-name rows are not merged",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t no-overmerge"
    }
  ]
}
-->
</details>
