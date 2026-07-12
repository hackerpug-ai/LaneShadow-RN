# REDHAT-FIX-001 — Make the recovered road line visibly render in the cold-boot detail map and add an honest visual oracle; fixes H1

| Field | Value |
|-------|-------|
| TASK_ID | REDHAT-FIX-001 |
| SPRINT | [Sprint 01 — Geometry reference-flow spike](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`react-native-ui-implementer` · reviewer=`react-native-ui-reviewer` |
| ESTIMATE | 120 min |
| EFFORT | M |
| PRIORITY | P0 |
| STATUS | Backlog |
| PROPOSED_BY | `react-native-ui-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | CAP-GEO-03 |
| PRD_REFS | T-REC-016, UC-REC-02, CAP-GEO-03 |
| DEPENDS_ON | S1-T2, S1-T3 |
| BLOCKS | REDHAT-FIX-002, REDHAT-FIX-004 |
| AUTHORITY | [.spec/reviews/red-hat-sprint-01-2026-07-12T07-30-55Z.md](../../../../reviews/red-hat-sprint-01-2026-07-12T07-30-55Z.md) |

RUNTIME_COMMANDS:
- test: `maestro test .maestro/rec-016-cold-boot-recovered-route-plots.yaml -e RECOVERED_ROUTE_ID='motorcycleroads:twist-of-tepusquet-loop'`
- typecheck: `pnpm type-check`
- lint: `pnpm exec biome check`

## OUTCOME

After cold boot into Twist of Tepusquet Loop detail, Mapbox paints a copper road polyline — not a blank grey map with only a blue location puck — and Human Testing Gate step 7 is honestly re-runnable.

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- MUST paint copper road line (≥2 coords via ShapeSource+LineLayer, strokeColor=semantic.color.primary.default, strokeWidth≥4) for motorcycleroads:twist-of-tepusquet-loop after cold boot
- MUST fit camera to polyline bounds only AFTER Mapbox style/map-ready so fit is not a no-op on unloaded map
- MUST capture screenshot where copper/road polyline is human-visible
- MUST keep change JS-first; map-ready callback on MapboxMapView is in scope if needed

**NEVER**
- NEVER treat Maestro exit 0 + transparent curated-route-detail-real-line alone as road-line proof
- NEVER substitute getVerificationForRoute re-read for painted map line
- NEVER edit convex/**

**STRICTLY**
- STRICTLY PRIMARY AC is e2e on iOS sim + live Convex dev; RED fails against blank step7 signature first
- STRICTLY preserve ~40% map layout and ≥44×44pt targets

## DONE WHEN

- [ ] AC-1: Cold-boot recovered route paints copper road line
- [ ] AC-2: Camera fit after map style load
- [ ] AC-3: Blank-map H1 signature fails visual claim
- [ ] AC-4: Typecheck and lint clean
- [ ] Only SCOPE.writeAllowed files modified (`git diff --name-only`)
- [ ] Do **not** mark Sprint 01 Done from this task alone

## SPECIFICATION

**Objective:** Close red-hat finding H1: cold-boot recovered detail map paints the correct copper road line.

**Success state:** Maestro cold-boot happy path exits 0 AND screenshot shows non-blank copper road polyline for motorcycleroads:twist-of-tepusquet-loop.

**Agent rationale:** Owns curated-route detail map + Mapbox paint + Maestro. H1 blank map while Maestro greenwashed transparent probe.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `recovered_poc_route` (seed_method: `public_api`): Live Convex dev motorcycleroads:twist-of-tepusquet-loop ai_reconstructed ≥2-pt polyline riderReady true
- `cold_app` (seed_method: `recorded_external`): stopApp + launchApp clearState/clearKeychain
- `blank_map_h1_signature` (seed_method: `recorded_external`): H1 blank grey map + blue puck only

## ACCEPTANCE CRITERIA

### AC-1 [PRIMARY]

**Requirement:** GIVEN recovered PoC on live Convex dev + iOS sim WHEN Maestro cold-boots, auths, deep-links laneshadow:///curated-route/motorcycleroads:twist-of-tepusquet-loop THEN detail map paints copper road polyline (not blank grey + puck only)

- TEST_TIER: `e2e`  ·  VERIFICATION_SERVICE: Maestro (iOS simulator) + Mapbox against live Convex dev
- VERIFY: `maestro test .maestro/rec-016-cold-boot-recovered-route-plots.yaml -e RECOVERED_ROUTE_ID='motorcycleroads:twist-of-tepusquet-loop'`
- FLOW_REF: `T-REC-016 / Human Testing Gate step 7`

SCENARIO:
- NEGATIVE_CONTROL — would fail if: style never loads; polylines <2 coords; fit before map-ready; transparent probe sole pass
- EVIDENCE: `screenshot` (required_capture: true)
- CASE 1 — start_ref `recovered_poc_route`
    - ACTION: Maestro cold-boots, auths, deep-links laneshadow:///curated-route/motorcycleroads:twist-of-tepusquet-loop
    - MUST_OBSERVE: curated-detail-map visible; name Twist of Tepusquet Loop; copper LineLayer ≥2 coords in viewport; screenshot non-blank copper polyline
    - MUST_NOT_OBSERVE: blank grey map + blue puck only; approximate-badge; fallback

### AC-2

**Requirement:** GIVEN detail has ≥2-point routePolyline WHEN MapboxMapView finishes style load and receives polylines THEN fitToCoordinates runs after map-ready so full road line is in frame

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: vitest map contract
- VERIFY: `pnpm exec vitest run 'components/map/mapbox-map-view.test.tsx' 'app/(app)/curated-route/[id].geometry-degradation.integration.test.tsx'`

SCENARIO:
- NEGATIVE_CONTROL — would fail if: fit only before style load; camera default while line off-screen
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `recovered_poc_route`
    - ACTION: MapboxMapView finishes style load and receives polylines
    - MUST_OBSERVE: fit after map-ready with ≥2 coords; strokeWidth ≥ 4
    - MUST_NOT_OBSERVE: fit only before style load; empty coords to fit

### AC-3

**Requirement:** GIVEN surface matches H1 blank grey + puck WHEN road-line plot claim is evaluated THEN claim FAILS (no transparent-probe greenwash)

- TEST_TIER: `e2e`  ·  VERIFICATION_SERVICE: Maestro visual oracle
- VERIFY: `maestro test .maestro/rec-016-cold-boot-recovered-route-plots.yaml -e RECOVERED_ROUTE_ID='motorcycleroads:twist-of-tepusquet-loop'`

SCENARIO:
- NEGATIVE_CONTROL — would fail if: exit 0 while blank; transparent probe sole pass
- EVIDENCE: `screenshot` (required_capture: true)
- CASE 1 — start_ref `blank_map_h1_signature`
    - ACTION: road-line plot claim is evaluated
    - MUST_OBSERVE: oracle requires painted-line evidence beyond transparent probe
    - MUST_NOT_OBSERVE: exit 0 with only transparent real-line View

### AC-4

**Requirement:** GIVEN paint/settle changes in write_allowed files WHEN pnpm type-check and biome run THEN both exit 0

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: TypeScript + Biome
- VERIFY: `pnpm type-check && pnpm exec biome check 'app/(app)/curated-route/[id].tsx' components/map/mapbox-map-view.tsx`

SCENARIO:
- NEGATIVE_CONTROL — would fail if: bad map-ready typing
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `recovered_poc_route`
    - ACTION: pnpm type-check and biome run
    - MUST_OBSERVE: type-check exit 0; biome exit 0
    - MUST_NOT_OBSERVE: TS errors in map/detail

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Maestro cold-boot exits 0 with screenshot showing copper road polyline. | AC-1 | `maestro test .maestro/rec-016-cold-boot-recovered-route-plots.yaml -e RECOVERED_ROUTE_ID='motorcycleroads:twist-of-tepusquet-loop'` |
| TC-2 | fitToCoordinates runs after map style load for ≥2-point polylines. | AC-2 | `pnpm exec vitest run 'components/map/mapbox-map-view.test.tsx' 'app/(app)/curated-route/[id].geometry-degradation.integration.test.tsx'` |
| TC-3 | Blank grey map + puck only fails road-line plot claim. | AC-3 | `maestro test .maestro/rec-016-cold-boot-recovered-route-plots.yaml -e RECOVERED_ROUTE_ID='motorcycleroads:twist-of-tepusquet-loop'` |
| TC-4 | type-check and biome exit 0 for paint/settle changes. | AC-4 | `pnpm type-check && pnpm exec biome check 'app/(app)/curated-route/[id].tsx' components/map/mapbox-map-view.tsx` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- app/(app)/curated-route/[id].tsx (MODIFY)
- components/map/mapbox-map-view.tsx (MODIFY)
- components/map/mapbox-map-view.test.tsx (MODIFY|NEW)
- app/(app)/curated-route/[id].geometry-degradation.integration.test.tsx (MODIFY)
- .maestro/rec-016-cold-boot-recovered-route-plots.yaml (MODIFY)

**writeProhibited:**
- convex/**
- shared/lib/polyline.ts
- Any file not explicitly listed above

## READING LIST

- `.spec/reviews/red-hat-sprint-01-2026-07-12T07-30-55Z.md` (29-36,177-189) — AUTHORITY H1
- `app/(app)/curated-route/[id].tsx` (174-333,718-722) — polylines + probe
- `components/map/mapbox-map-view.tsx` (609-725) — LineLayer + fit
- `.maestro/rec-016-cold-boot-recovered-route-plots.yaml` (1-183) — cold-boot flow

## DESIGN

- pattern: decodePolylineGeometry → MapboxMapView → ShapeSource+LineLayer copper stroke; fit after map-ready.
- pattern_source: `app/(app)/curated-route/[id].tsx:174-227`
- anti_pattern: Transparent 1px real-line probe as sole proof; fit before style load.
- references: `.spec/reviews/red-hat-sprint-01-2026-07-12T07-30-55Z.md`, `./SPRINT.md`

## VERIFICATION GATES

| Gate | Command | Expected |
|------|---------|----------|
| PRIMARY e2e paint | `maestro test .maestro/rec-016-cold-boot-recovered-route-plots.yaml -e RECOVERED_ROUTE_ID='motorcycleroads:twist-of-tepusquet-loop'` | Exit 0 + copper line screenshot |
| Map/branch tests | `pnpm exec vitest run 'components/map/mapbox-map-view.test.tsx' 'app/(app)/curated-route/[id].geometry-degradation.integration.test.tsx'` | Exit 0 |
| Typecheck | `pnpm type-check` | Exit 0 |
| Lint | `pnpm exec biome check 'app/(app)/curated-route/[id].tsx' components/map/mapbox-map-view.tsx` | Exit 0 |
| Scope | `git diff --name-only` | ⊆ write_allowed |

## CODING STANDARDS

- `Agents.md`
- `brain/docs/TESTING-HIERARCHY.md`
- `brain/docs/kanban/SCENARIO-CONTRACT-V1.md`

## DEPENDENCIES

- Depends on: S1-T2, S1-T3
- Blocks: REDHAT-FIX-002, REDHAT-FIX-004

## NOTES

- Source authority: red-hat review `.spec/reviews/red-hat-sprint-01-2026-07-12T07-30-55Z.md` (2026-07-12T07:30:55Z).
- Fixes H1. Blocks REDHAT-FIX-002 and REDHAT-FIX-004. proposed_by=react-native-ui-planner.
- Do not implement product code beyond write_allowed. Do not call the sprint done.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "REDHAT-FIX-001",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "recovered_poc_route": {
      "description": "Live Convex dev motorcycleroads:twist-of-tepusquet-loop ai_reconstructed \u22652-pt polyline riderReady true",
      "seed_method": "public_api",
      "records": [
        "routeId=motorcycleroads:twist-of-tepusquet-loop"
      ]
    },
    "cold_app": {
      "description": "stopApp + launchApp clearState/clearKeychain",
      "seed_method": "recorded_external",
      "records": [
        "EXPO_PUBLIC_E2E=1"
      ]
    },
    "blank_map_h1_signature": {
      "description": "H1 blank grey map + blue puck only",
      "seed_method": "recorded_external",
      "records": [
        "0 copper pixels"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN recovered PoC on live Convex dev + iOS sim WHEN Maestro cold-boots, auths, deep-links laneshadow:///curated-route/motorcycleroads:twist-of-tepusquet-loop THEN detail map paints copper road polyline (not blank grey + puck only)",
      "verify": "maestro test .maestro/rec-016-cold-boot-recovered-route-plots.yaml -e RECOVERED_ROUTE_ID='motorcycleroads:twist-of-tepusquet-loop'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "e2e",
        "verification_service": "Maestro (iOS simulator) + Mapbox against live Convex dev",
        "negative_control": {
          "would_fail_if": [
            "style never loads",
            "polylines <2 coords",
            "fit before map-ready",
            "transparent probe sole pass"
          ]
        },
        "evidence": {
          "artifact_type": "screenshot",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "recovered_poc_route",
            "action": {
              "actor": "cli_user",
              "steps": [
                "Maestro cold-boots, auths, deep-links laneshadow:///curated-route/motorcycleroads:twist-of-tepusquet-loop"
              ]
            },
            "end_state": {
              "must_observe": [
                "curated-detail-map visible",
                "name Twist of Tepusquet Loop",
                "copper LineLayer \u22652 coords in viewport",
                "screenshot non-blank copper polyline"
              ],
              "must_not_observe": [
                "blank grey map + blue puck only",
                "approximate-badge",
                "fallback"
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
      "description": "GIVEN detail has \u22652-point routePolyline WHEN MapboxMapView finishes style load and receives polylines THEN fitToCoordinates runs after map-ready so full road line is in frame",
      "verify": "pnpm exec vitest run 'components/map/mapbox-map-view.test.tsx' 'app/(app)/curated-route/[id].geometry-degradation.integration.test.tsx'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "vitest map contract",
        "negative_control": {
          "would_fail_if": [
            "fit only before style load",
            "camera default while line off-screen"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "recovered_poc_route",
            "action": {
              "actor": "api_client",
              "steps": [
                "MapboxMapView finishes style load and receives polylines"
              ]
            },
            "end_state": {
              "must_observe": [
                "fit after map-ready with \u22652 coords",
                "strokeWidth \u2265 4"
              ],
              "must_not_observe": [
                "fit only before style load",
                "empty coords to fit"
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
      "description": "GIVEN surface matches H1 blank grey + puck WHEN road-line plot claim is evaluated THEN claim FAILS (no transparent-probe greenwash)",
      "verify": "maestro test .maestro/rec-016-cold-boot-recovered-route-plots.yaml -e RECOVERED_ROUTE_ID='motorcycleroads:twist-of-tepusquet-loop'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "e2e",
        "verification_service": "Maestro visual oracle",
        "negative_control": {
          "would_fail_if": [
            "exit 0 while blank",
            "transparent probe sole pass"
          ]
        },
        "evidence": {
          "artifact_type": "screenshot",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "blank_map_h1_signature",
            "action": {
              "actor": "cli_user",
              "steps": [
                "road-line plot claim is evaluated"
              ]
            },
            "end_state": {
              "must_observe": [
                "oracle requires painted-line evidence beyond transparent probe"
              ],
              "must_not_observe": [
                "exit 0 with only transparent real-line View"
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
      "description": "GIVEN paint/settle changes in write_allowed files WHEN pnpm type-check and biome run THEN both exit 0",
      "verify": "pnpm type-check && pnpm exec biome check 'app/(app)/curated-route/[id].tsx' components/map/mapbox-map-view.tsx",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "TypeScript + Biome",
        "negative_control": {
          "would_fail_if": [
            "bad map-ready typing"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "recovered_poc_route",
            "action": {
              "actor": "api_client",
              "steps": [
                "pnpm type-check and biome run"
              ]
            },
            "end_state": {
              "must_observe": [
                "type-check exit 0",
                "biome exit 0"
              ],
              "must_not_observe": [
                "TS errors in map/detail"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "Maestro cold-boot exits 0 with screenshot showing copper road polyline.",
      "verify": "maestro test .maestro/rec-016-cold-boot-recovered-route-plots.yaml -e RECOVERED_ROUTE_ID='motorcycleroads:twist-of-tepusquet-loop'",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "fitToCoordinates runs after map style load for \u22652-point polylines.",
      "verify": "pnpm exec vitest run 'components/map/mapbox-map-view.test.tsx' 'app/(app)/curated-route/[id].geometry-degradation.integration.test.tsx'",
      "maps_to_ac": "AC-2"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "Blank grey map + puck only fails road-line plot claim.",
      "verify": "maestro test .maestro/rec-016-cold-boot-recovered-route-plots.yaml -e RECOVERED_ROUTE_ID='motorcycleroads:twist-of-tepusquet-loop'",
      "maps_to_ac": "AC-3"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "type-check and biome exit 0 for paint/settle changes.",
      "verify": "pnpm type-check && pnpm exec biome check 'app/(app)/curated-route/[id].tsx' components/map/mapbox-map-view.tsx",
      "maps_to_ac": "AC-4"
    }
  ]
}
-->
