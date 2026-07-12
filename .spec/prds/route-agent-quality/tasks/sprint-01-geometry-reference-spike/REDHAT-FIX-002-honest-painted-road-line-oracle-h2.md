# REDHAT-FIX-002 — Replace the transparent real-line probe with evidence that distinguishes a painted road line from a blank map; fixes H2

| Field | Value |
|-------|-------|
| TASK_ID | REDHAT-FIX-002 |
| SPRINT | [Sprint 01 — Geometry reference-flow spike](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`react-native-ui-implementer` · reviewer=`react-native-ui-reviewer` |
| ESTIMATE | 90 min |
| EFFORT | S |
| PRIORITY | P0 |
| STATUS | Backlog |
| PROPOSED_BY | `react-native-ui-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | CAP-GEO-03 |
| PRD_REFS | T-REC-016, UC-REC-02, CAP-GEO-03 |
| DEPENDS_ON | REDHAT-FIX-001, S1-T3 |
| BLOCKS | REDHAT-FIX-004 |
| AUTHORITY | [.spec/reviews/red-hat-sprint-01-2026-07-12T07-30-55Z.md](../../../../reviews/red-hat-sprint-01-2026-07-12T07-30-55Z.md) |

RUNTIME_COMMANDS:
- test: `maestro test .maestro/rec-016-cold-boot-recovered-route-plots.yaml -e RECOVERED_ROUTE_ID='motorcycleroads:twist-of-tepusquet-loop'`
- typecheck: `pnpm type-check`
- lint: `pnpm exec biome check`

## OUTCOME

Automation cannot pass plot AC when map is blank despite valid ≥2-point coordinates; oracle requires paint/settle.

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- MUST remove/retire transparent-only real-line probe as sole Maestro pass condition
- MUST introduce honest oracle: map-settled + line-paint-ready (≥2 coords necessary but not sufficient alone)
- MUST update Maestro + geometry-degradation tests so blank map with valid coords fails
- MUST keep coordinates.length >= 2 as necessary condition

**NEVER**
- NEVER leave assertVisible curated-route-detail-real-line on transparent 1px View as PRIMARY plot proof
- NEVER treat string-presence curated-route-detail-polyline as real-line oracle
- NEVER re-do REDHAT-FIX-001 paint pipeline — consume it
- NEVER edit convex/**

**STRICTLY**
- STRICTLY PRIMARY AC e2e; branch negatives may use integration vitest
- STRICTLY RED-first: oracle fails on transparent-probe theatre before implementing
- STRICTLY if paint still blank, fail closed and bond to 001

## DONE WHEN

- [ ] AC-1: Honest oracle passes only with painted settled road line
- [ ] AC-2: Valid coords + blank map fail the oracle
- [ ] AC-3: Null polyline and 1-pt degenerate fail oracle
- [ ] AC-4: Transparent probe no longer primary Maestro assert
- [ ] Only SCOPE.writeAllowed files modified (`git diff --name-only`)
- [ ] Do **not** mark Sprint 01 Done from this task alone

## SPECIFICATION

**Objective:** Close H2: replace transparent real-line probe as sole Maestro plot proof with paint/settle-coupled oracle.

**Success state:** Maestro fails on blank map or null/1-pt; passes only with paint-ready ≥2-pt settled road line.

**Agent rationale:** H2 probe theatre: hasRealRoadLine gates on ≥2 coords but transparent 1px View is Maestro pass condition.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `recovered_poc_route_painted` (seed_method: `public_api`): PoC after REDHAT-FIX-001 copper line paints
- `valid_coords_blank_map` (seed_method: `recorded_external`): ≥2 coords + transparent probe but unpainted map
- `centroid_or_degenerate` (seed_method: `migration_fixture`): null polyline + 1-pt degenerate

## ACCEPTANCE CRITERIA

### AC-1 [PRIMARY]

**Requirement:** GIVEN REDHAT-FIX-001 painted copper line on Mapbox after cold boot WHEN Maestro runs cold-boot plot flow for the PoC THEN flow passes using painted-line oracle (not transparent probe alone)

- TEST_TIER: `e2e`  ·  VERIFICATION_SERVICE: Maestro + Mapbox paint settle
- VERIFY: `maestro test .maestro/rec-016-cold-boot-recovered-route-plots.yaml -e RECOVERED_ROUTE_ID='motorcycleroads:twist-of-tepusquet-loop'`
- FLOW_REF: `T-REC-016 / Human Testing Gate step 7`

SCENARIO:
- NEGATIVE_CONTROL — would fail if: assertVisible only transparent real-line; valid coords + blank map exit 0
- EVIDENCE: `screenshot` (required_capture: true)
- CASE 1 — start_ref `recovered_poc_route_painted`
    - ACTION: Maestro runs cold-boot plot flow for the PoC
    - MUST_OBSERVE: honest painted-line oracle visible; screenshot copper road line; approximate-badge absent
    - MUST_NOT_OBSERVE: PRIMARY pass solely from transparent 1px View; blank grey as pass evidence

### AC-2

**Requirement:** GIVEN coordinates.length >= 2 but Mapbox not painted / settle false WHEN honest oracle is evaluated THEN oracle ABSENT / fails

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: vitest render-branch oracle
- VERIFY: `pnpm exec vitest run 'app/(app)/curated-route/[id].geometry-degradation.integration.test.tsx'`

SCENARIO:
- NEGATIVE_CONTROL — would fail if: oracle mounts solely from coord count
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `valid_coords_blank_map`
    - ACTION: honest oracle is evaluated
    - MUST_OBSERVE: honest oracle NOT rendered when paint/settle false
    - MUST_NOT_OBSERVE: oracle true with blank map

### AC-3

**Requirement:** GIVEN centroid-only or 1-point degenerate fixtures WHEN detail screen renders THEN honest oracle ABSENT; never fabricated road line

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: vitest real detail component
- VERIFY: `pnpm exec vitest run 'app/(app)/curated-route/[id].geometry-degradation.integration.test.tsx'`
- UNIT_TEST_JUSTIFIED: UNIT_TEST_JUSTIFIED: pure props→render branch discrimination of oracle visibility with zero I/O; Maestro remains e2e paint proof.

SCENARIO:
- NEGATIVE_CONTROL — would fail if: oracle mounts for null or 1-pt
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `centroid_or_degenerate`
    - ACTION: detail screen renders
    - MUST_OBSERVE: 0 honest oracle nodes for null and 1-pt; approximate badge for centroid
    - MUST_NOT_OBSERVE: oracle for centroid; oracle for 1-pt

### AC-4

**Requirement:** GIVEN rec-016 YAML + detail styles WHEN oracle swap completes THEN PRIMARY plot assert not transparent-probe-only

- TEST_TIER: `e2e`  ·  VERIFICATION_SERVICE: rg + Maestro
- VERIFY: `rg -n 'assertVisible|real-line|line-painted|map-settled|polylineProbe' .maestro/rec-016-cold-boot-recovered-route-plots.yaml 'app/(app)/curated-route/[id].tsx'`

SCENARIO:
- NEGATIVE_CONTROL — would fail if: Maestro still only transparent real-line
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `recovered_poc_route_painted`
    - ACTION: oracle swap completes
    - MUST_OBSERVE: Maestro asserts paint/settle oracle; transparent-only not sole PRIMARY
    - MUST_NOT_OBSERVE: PRIMARY path unchanged from H2 theatre

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Maestro passes only when honest painted-line oracle present for recovered PoC. | AC-1 | `maestro test .maestro/rec-016-cold-boot-recovered-route-plots.yaml -e RECOVERED_ROUTE_ID='motorcycleroads:twist-of-tepusquet-loop'` |
| TC-2 | Honest oracle false when ≥2 coords but paint/settle false. | AC-2 | `pnpm exec vitest run 'app/(app)/curated-route/[id].geometry-degradation.integration.test.tsx'` |
| TC-3 | Honest oracle absent for null polyline and 1-pt degenerate. | AC-3 | `pnpm exec vitest run 'app/(app)/curated-route/[id].geometry-degradation.integration.test.tsx'` |
| TC-4 | PRIMARY Maestro plot assert is not solely transparent real-line probe. | AC-4 | `rg -n 'assertVisible|real-line|line-painted|map-settled|polylineProbe' .maestro/rec-016-cold-boot-recovered-route-plots.yaml 'app/(app)/curated-route/[id].tsx'` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- app/(app)/curated-route/[id].tsx (MODIFY)
- app/(app)/curated-route/[id].geometry-degradation.integration.test.tsx (MODIFY)
- .maestro/rec-016-cold-boot-recovered-route-plots.yaml (MODIFY)
- components/map/mapbox-map-view.tsx (MODIFY only if settle signal must surface)

**writeProhibited:**
- convex/**
- REDHAT-FIX-001 reimplementation
- Any file not explicitly listed above

## READING LIST

- `.spec/reviews/red-hat-sprint-01-2026-07-12T07-30-55Z.md` (33-36,177-189) — AUTHORITY H2
- `app/(app)/curated-route/[id].tsx` (189-192,325-333,718-722) — hasRealRoadLine + probes
- `.maestro/rec-016-cold-boot-recovered-route-plots.yaml` (166-183) — AC-1 assert

## DESIGN

- pattern: Necessary: coordinates.length >= 2. Sufficient: map settled + LineLayer paint-ready. Maestro asserts sufficient signal.
- pattern_source: `app/(app)/curated-route/[id].tsx:189-192,325-333`
- anti_pattern: styles.polylineProbe transparent + assertVisible curated-route-detail-real-line as sole AC-1 proof.
- references: `.spec/reviews/red-hat-sprint-01-2026-07-12T07-30-55Z.md`, `./SPRINT.md`

## VERIFICATION GATES

| Gate | Command | Expected |
|------|---------|----------|
| PRIMARY e2e honest oracle | `maestro test .maestro/rec-016-cold-boot-recovered-route-plots.yaml -e RECOVERED_ROUTE_ID='motorcycleroads:twist-of-tepusquet-loop'` | Exit 0 with paint/settle oracle |
| Branch discrimination | `pnpm exec vitest run 'app/(app)/curated-route/[id].geometry-degradation.integration.test.tsx'` | Exit 0 |
| Typecheck | `pnpm type-check` | Exit 0 |
| Lint | `pnpm exec biome check 'app/(app)/curated-route/[id].tsx'` | Exit 0 |
| Scope | `git diff --name-only` | ⊆ write_allowed |

## CODING STANDARDS

- `Agents.md`
- `brain/docs/TESTING-HIERARCHY.md`
- `brain/docs/kanban/SCENARIO-CONTRACT-V1.md`

## DEPENDENCIES

- Depends on: REDHAT-FIX-001, S1-T3
- Blocks: REDHAT-FIX-004

## NOTES

- Source authority: red-hat review `.spec/reviews/red-hat-sprint-01-2026-07-12T07-30-55Z.md` (2026-07-12T07:30:55Z).
- Fixes H2. Depends on REDHAT-FIX-001. proposed_by=react-native-ui-planner.
- Do not implement product code beyond write_allowed. Do not call the sprint done.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "REDHAT-FIX-002",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "recovered_poc_route_painted": {
      "description": "PoC after REDHAT-FIX-001 copper line paints",
      "seed_method": "public_api",
      "records": [
        "\u22652 pts + LineLayer paint"
      ]
    },
    "valid_coords_blank_map": {
      "description": "\u22652 coords + transparent probe but unpainted map",
      "seed_method": "recorded_external",
      "records": [
        "H2 false-green"
      ]
    },
    "centroid_or_degenerate": {
      "description": "null polyline + 1-pt degenerate",
      "seed_method": "migration_fixture",
      "records": [
        "null",
        "1-pt"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN REDHAT-FIX-001 painted copper line on Mapbox after cold boot WHEN Maestro runs cold-boot plot flow for the PoC THEN flow passes using painted-line oracle (not transparent probe alone)",
      "verify": "maestro test .maestro/rec-016-cold-boot-recovered-route-plots.yaml -e RECOVERED_ROUTE_ID='motorcycleroads:twist-of-tepusquet-loop'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "e2e",
        "verification_service": "Maestro + Mapbox paint settle",
        "negative_control": {
          "would_fail_if": [
            "assertVisible only transparent real-line",
            "valid coords + blank map exit 0"
          ]
        },
        "evidence": {
          "artifact_type": "screenshot",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "recovered_poc_route_painted",
            "action": {
              "actor": "cli_user",
              "steps": [
                "Maestro runs cold-boot plot flow for the PoC"
              ]
            },
            "end_state": {
              "must_observe": [
                "honest painted-line oracle visible",
                "screenshot copper road line",
                "approximate-badge absent"
              ],
              "must_not_observe": [
                "PRIMARY pass solely from transparent 1px View",
                "blank grey as pass evidence"
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
      "description": "GIVEN coordinates.length >= 2 but Mapbox not painted / settle false WHEN honest oracle is evaluated THEN oracle ABSENT / fails",
      "verify": "pnpm exec vitest run 'app/(app)/curated-route/[id].geometry-degradation.integration.test.tsx'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "vitest render-branch oracle",
        "negative_control": {
          "would_fail_if": [
            "oracle mounts solely from coord count"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "valid_coords_blank_map",
            "action": {
              "actor": "api_client",
              "steps": [
                "honest oracle is evaluated"
              ]
            },
            "end_state": {
              "must_observe": [
                "honest oracle NOT rendered when paint/settle false"
              ],
              "must_not_observe": [
                "oracle true with blank map"
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
      "description": "GIVEN centroid-only or 1-point degenerate fixtures WHEN detail screen renders THEN honest oracle ABSENT; never fabricated road line",
      "verify": "pnpm exec vitest run 'app/(app)/curated-route/[id].geometry-degradation.integration.test.tsx'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "vitest real detail component",
        "negative_control": {
          "would_fail_if": [
            "oracle mounts for null or 1-pt"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "centroid_or_degenerate",
            "action": {
              "actor": "api_client",
              "steps": [
                "detail screen renders"
              ]
            },
            "end_state": {
              "must_observe": [
                "0 honest oracle nodes for null and 1-pt",
                "approximate badge for centroid"
              ],
              "must_not_observe": [
                "oracle for centroid",
                "oracle for 1-pt"
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
      "description": "GIVEN rec-016 YAML + detail styles WHEN oracle swap completes THEN PRIMARY plot assert not transparent-probe-only",
      "verify": "rg -n 'assertVisible|real-line|line-painted|map-settled|polylineProbe' .maestro/rec-016-cold-boot-recovered-route-plots.yaml 'app/(app)/curated-route/[id].tsx'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "e2e",
        "verification_service": "rg + Maestro",
        "negative_control": {
          "would_fail_if": [
            "Maestro still only transparent real-line"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "recovered_poc_route_painted",
            "action": {
              "actor": "cli_user",
              "steps": [
                "oracle swap completes"
              ]
            },
            "end_state": {
              "must_observe": [
                "Maestro asserts paint/settle oracle",
                "transparent-only not sole PRIMARY"
              ],
              "must_not_observe": [
                "PRIMARY path unchanged from H2 theatre"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "Maestro passes only when honest painted-line oracle present for recovered PoC.",
      "verify": "maestro test .maestro/rec-016-cold-boot-recovered-route-plots.yaml -e RECOVERED_ROUTE_ID='motorcycleroads:twist-of-tepusquet-loop'",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Honest oracle false when \u22652 coords but paint/settle false.",
      "verify": "pnpm exec vitest run 'app/(app)/curated-route/[id].geometry-degradation.integration.test.tsx'",
      "maps_to_ac": "AC-2"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "Honest oracle absent for null polyline and 1-pt degenerate.",
      "verify": "pnpm exec vitest run 'app/(app)/curated-route/[id].geometry-degradation.integration.test.tsx'",
      "maps_to_ac": "AC-3"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "PRIMARY Maestro plot assert is not solely transparent real-line probe.",
      "verify": "rg -n 'assertVisible|real-line|line-painted|map-settled|polylineProbe' .maestro/rec-016-cold-boot-recovered-route-plots.yaml 'app/(app)/curated-route/[id].tsx'",
      "maps_to_ac": "AC-4"
    }
  ]
}
-->
