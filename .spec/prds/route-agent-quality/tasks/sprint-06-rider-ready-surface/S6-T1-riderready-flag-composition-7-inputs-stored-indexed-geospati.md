# S6-T1 — riderReady flag composition (7 inputs) stored + indexed + geospatial re-index migration gate + recompute triggers (SURF-01)

> Status: ⬜ Pending
> Proposed By: `convex-planner`

| Field | Value |
|---|---|
| TASK_ID | S6-T1 |
| SPRINT | [Sprint 06 — Rider-ready surface](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | `convex-implementer` |
| ESTIMATE | 150 min |
| EFFORT | M |
| PRIORITY | P0 |
| PROPOSED_BY | `convex-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | touches CAP-GEO-03 |
| BLOCKS | S6-T2 |

RUNTIME_COMMANDS:
- typecheck: `pnpm type-check`
- lint: `pnpm lint`
- test: `pnpm test`
- build: `pnpm convex:dev -- --once`

## BACKGROUND
Harden riderReady into a deterministic 7-input composition that is STORED on curated_routes and served via by_riderReady_and_composite_score, with recompute triggers on every upstream change and a migration gate that blocks SURF deploy until point-count == rider-ready count.

## 🚫 CRITICAL CONSTRAINTS (Never tier)
- **MUST** MUST compose riderReady from exactly 7 inputs: gate-passing geometry verdict, real ride name, sane 0-1 compositeScore, sane lengthMiles, non-negative ride-worthiness classifier, retiredAt==null, duplicateOf==null
- **MUST** MUST store riderReady on curated_routes so gated queries read the index, not recompute
- **MUST** MUST recompute via recomputeRiderReady on geometry/score/length/classifier/retirement/shadow change
- **MUST** MUST verify point-count == rider-ready count before SURF gate deploy (migration gate risk #22)
- **NEVER** NEVER recompute riderReady at read time in browse paths
- **NEVER** NEVER let a missing input leave riderReady=true (false-on-missing is strict)
- **NEVER** NEVER gate SURF deploy before the geospatial re-index count matches
- **STRICTLY** STRICTLY false if ANY of the 7 inputs is missing/invalid
- **STRICTLY** STRICTLY founder query reads batch_runs.riderReadyCount or counts the index

## SPECIFICATION
**Objective:** Harden riderReady into a deterministic 7-input composition that is STORED on curated_routes and served via by_riderReady_and_composite_score, with recompute triggers on every upstream change and a migration gate that blocks SURF deploy until point-count == rider-ready count.

**Success state:** All browse paths can trust the stored flag without recompute; the founder query returns the realized count; SURF deploys only after the geospatial re-index parity check passes.

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR)
### AC-1 [PRIMARY] — 7-input composition

**Requirement:** GIVEN A curated_routes doc with gate verdict='pass', name='Real Ride', compositeScore=0.85, lengthMiles=41, classifier verdict='worth_it', retiredAt=null, duplicateOf=null WHEN computeRiderReadyFromDoc runs against the doc and its geometry verification row THEN returns riderReady=true (all 7 inputs satisfied)

TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: convex-test-deployment  ·  FLOW_REF: UC-SURF-01  ·  VERIFY: `pnpm test -- convex/__tests__/S6T1-rider-ready-composition.integration.test.ts --grep AC-1`

SCENARIO:
- CASE 1 (`all-7-inputs-satisfied`): MUST_OBSERVE ['riderReady == true', "name == 'Twist of Tepusquet Loop'", 'compositeScore == 0.85']; MUST_NOT_OBSERVE ['riderReady == false', 'riderReady == null or absent']
- NEGATIVE_CONTROL (would_fail_if): ['computeRiderReadyFromDoc hardcodes true regardless of inputs', 'any one of the 7 inputs is skipped', 'geometry verification row is mocked null']
- EVIDENCE: `db_query` (required_capture=True)

### AC-2 — stored + indexed

**Requirement:** GIVEN A rider-ready route persisted in curated_routes WHEN A gated query reads via withIndex('by_riderReady_and_composite_score', q=>q.eq('riderReady',true)) THEN the route is returned from the index WITHOUT recompute at read time (no computeRiderReadyFromDoc call in the query path)

TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: convex-test-deployment  ·  FLOW_REF: UC-SURF-01  ·  VERIFY: `pnpm test -- convex/__tests__/S6T1-rider-ready-indexed.integration.test.ts --grep AC-2`

SCENARIO:
- CASE 1 (`all-7-inputs-satisfied`): MUST_OBSERVE ['returned.length >= 1', 'returned[0].riderReady === true', "returned[0].routeId === 'motorcycleroads:twist-of-tepusquet-loop'"]; MUST_NOT_OBSERVE ['returned.length === 0', 'returned[0].riderReady === false']
- NEGATIVE_CONTROL (would_fail_if): ['query calls computeRiderReadyFromDoc inline (recompute at read)', 'index is not used (full table scan + filter)', 'riderReady field missing from doc']
- EVIDENCE: `db_query` (required_capture=True)

### AC-3 — false-on-missing-any-input

**Requirement:** GIVEN A route missing exactly ONE of the 7 inputs (e.g. classifier verdict absent OR name empty OR retiredAt set) WHEN recomputeRiderReadyForRoute runs THEN stored riderReady=false (one-discriminator cases prove false-on-missing is strict, not short-circuit)

TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: convex-test-deployment  ·  FLOW_REF: UC-SURF-01  ·  VERIFY: `pnpm test -- convex/__tests__/S6T1-rider-ready-false-on-missing.integration.test.ts --grep AC-3`

SCENARIO:
- CASE 1 (`retired-route`): MUST_OBSERVE ['riderReady == false']; MUST_NOT_OBSERVE ['riderReady == true', 'riderReady == null']
- CASE 2 (`duplicate-shadow`): MUST_OBSERVE ['riderReady == false']; MUST_NOT_OBSERVE ['riderReady == true']
- NEGATIVE_CONTROL (would_fail_if): ['composer short-circuits on the first input and skips the rest', 'composer returns true when retiredAt != null', 'composer returns true when duplicateOf != null']
- EVIDENCE: `db_query` (required_capture=True)

### AC-4 — recompute triggers on every upstream change

**Requirement:** GIVEN A route currently riderReady=true WHEN Any one of geometry/score/lengthMiles/classifier/retiredAt/duplicateOf changes (illustratively: classifier flips to 'not_a_ride') THEN the corresponding mutation path calls recomputeRiderReady(ctx, id) and the stored flag reflects the new input within the same transaction

TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: convex-test-deployment  ·  FLOW_REF: UC-SURF-01  ·  VERIFY: `pnpm test -- convex/__tests__/S6T1-rider-ready-recompute-triggers.integration.test.ts --grep AC-4`

SCENARIO:
- CASE 1 (`all-7-inputs-satisfied`): MUST_OBSERVE ['riderReady == false', "classifier verdict == 'not_a_ride'"]; MUST_NOT_OBSERVE ['riderReady == true (trigger missed)', 'riderReady == null']
- NEGATIVE_CONTROL (would_fail_if): ['the classifier-update mutation omits recomputeRiderReady', 'recompute is deferred/batched and not in the same transaction', 'trigger list misses one of the 6 change sources']
- EVIDENCE: `db_query` (required_capture=True)

### AC-5 — geospatial re-index migration gate (risk #22)

**Requirement:** GIVEN A geospatial re-index run that writes curated_route_geometry rows WHEN the migration completes and counts (a) point-rows written and (b) curated_routes where riderReady==true THEN the gate asserts pointCount == riderReadyCount and refuses to mark the SURF gate deployed when they diverge

TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: convex-test-deployment  ·  FLOW_REF: UC-SURF-01  ·  VERIFY: `pnpm test -- convex/__tests__/S6T1-geospatial-reindex-gate.integration.test.ts --grep AC-5`

SCENARIO:
- CASE 1 (`all-7-inputs-satisfied`): MUST_OBSERVE ['pointCount === riderReadyCount', 'gateDeployable === true']; MUST_NOT_OBSERVE ['gateDeployable === true when counts diverge', 'pointCount === 0', 'riderReadyCount === 0']
- NEGATIVE_CONTROL (would_fail_if): ['gate is a stub that always returns parity', 'gate reads only one side of the count', 'gate runs before re-index completes (race)']
- EVIDENCE: `db_query` (required_capture=True)

## TEST CRITERIA
- **TC-1** (→ AC-1): computeRiderReadyFromDoc returns true iff all 7 inputs are present and valid
  - VERIFY: `pnpm test -- convex/__tests__/S6T1-rider-ready-composition.integration.test.ts -t 'TC-1'`
- **TC-2** (→ AC-2): Gated queries return the route from by_riderReady_and_composite_score without recompute
  - VERIFY: `pnpm test -- convex/__tests__/S6T1-rider-ready-indexed.integration.test.ts -t 'TC-2'`
- **TC-3** (→ AC-3): Any one missing input forces riderReady=false (retiredAt/duplicateOf/classifier/name/score/length/geometry)
  - VERIFY: `pnpm test -- convex/__tests__/S6T1-rider-ready-false-on-missing.integration.test.ts -t 'TC-3'`
- **TC-4** (→ AC-4): Each of the 6 change sources triggers recomputeRiderReady in the same transaction
  - VERIFY: `pnpm test -- convex/__tests__/S6T1-rider-ready-recompute-triggers.integration.test.ts -t 'TC-4'`
- **TC-5** (→ AC-5): Geospatial re-index gate returns gateDeployable=true iff pointCount === riderReadyCount
  - VERIFY: `pnpm test -- convex/__tests__/S6T1-geospatial-reindex-gate.integration.test.ts -t 'TC-5'`

## SCOPE (file-level write permissions)
**writeAllowed:**
- `convex/curatedGeometry.ts (MODIFY: harden computeRiderReadyFromDoc + 6 triggers + geospatial gate)`
- `convex/schema.ts (MODIFY: additive only — founder query field if missing)`
- `convex/__tests__/S6T1-*.integration.test.ts (NEW)`
- `convex/curatedGeometryTestSupport.ts (MODIFY: add retired/shadow twin seeders)`
**writeProhibited:**
- `convex/curatedRoutes.ts (S6-T2 territory — browse paths)`
- `convex/actions/agent/tools/discoverCuratedRoutes.ts (S6-T2 territory — centroid removal)`
- `Re-implementing composer per call site — must reuse computeRiderReadyFromDoc`
- `Mocking ctx in integration tests`

## READING LIST
- `convex/schema.ts` (186-194) — by_riderReady_and_composite_score index definition (the gate index)
- `convex/curatedGeometry.ts` (498-580) — recomputeRiderReady + recomputeRiderReadyForRoute internalMutation — the S6-T1 harden target
- `convex/curatedGeometry.ts` (601-650) — existing recompute trigger on classifier patch — template for the other 5 triggers
- `convex/curatedGeometry.ts` (1180-1400) — riderReadyCount aggregation on batch_runs (founder query)

## DESIGN
- Reference: .spec/prds/route-agent-quality/07-uc-surf.md
- Compute is centralized in computeRiderReadyFromDoc; reads stay index-only
- Migration gate is a separate idempotent mutation so it can re-run after backfill

**Pattern:** pure-function composer + stored flag + index-only reads
- pattern_source: `convex/curatedGeometry.ts:498-580`

**Anti-pattern:** per-call-site recompute; read-time filter on riderReady instead of index eq

## EVIDENCE / VERIFICATION GATES
- **integration tests** — `pnpm test -- convex/__tests__/S6T1-` → Exit 0
- **typecheck** — `pnpm type-check` → Exit 0
- **lint** — `pnpm lint` → Exit 0
- **convex build** — `pnpm convex:dev -- --once` → Exit 0

## DEPENDENCIES
- Blocks: S6-T2

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "S6-T1",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "all-7-inputs-satisfied": {
      "description": "Route with all 7 riderReady inputs valid (gate verdict pass, real name, sane score, sane length, non-negative classifier, not retired, not shadow)",
      "seed_method": "public_api",
      "records": [
        "routeId: 'motorcycleroads:twist-of-tepusquet-loop', name: 'Twist of Tepusquet Loop', lengthMiles: 41, pointCount: 50, compositeScore: 0.85, retiredAt: null, duplicateOf: null, classifier.verdict: 'worth_it'",
        "seeder: existing seedPoCRoute in convex/curatedGeometryTestSupport.ts"
      ]
    },
    "retired-route": {
      "description": "Identical to all-7-inputs-satisfied but with retiredAt set (single-discriminator: proves false-on-retiredAt)",
      "seed_method": "public_api",
      "records": [
        "routeId: 'test:retired-twin', retiredAt: <Date.now()>, all other 6 inputs valid",
        "new seeder seedRetiredTwinRow in convex/curatedGeometryTestSupport.ts"
      ]
    },
    "duplicate-shadow": {
      "description": "Identical to all-7-inputs-satisfied but with duplicateOf set (proves false-on-shadow)",
      "seed_method": "public_api",
      "records": [
        "routeId: 'test:shadow-twin', duplicateOf: 'motorcycleroads:twist-of-tepusquet-loop', all other 6 inputs valid",
        "new seeder seedShadowTwinRow in convex/curatedGeometryTestSupport.ts"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN A curated_routes doc with gate verdict='pass', name='Real Ride', compositeScore=0.85, lengthMiles=41, classifier verdict='worth_it', retiredAt=null, duplicateOf=null WHEN computeRiderReadyFromDoc runs against the doc and its geometry verification row THEN returns riderReady=true (all 7 inputs satisfied)",
      "verify": "pnpm test -- convex/__tests__/S6T1-rider-ready-composition.integration.test.ts --grep AC-1",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "integration",
        "verification_service": "convex-test-deployment",
        "negative_control": {
          "would_fail_if": [
            "computeRiderReadyFromDoc hardcodes true regardless of inputs",
            "any one of the 7 inputs is skipped",
            "geometry verification row is mocked null",
            "empty/stub/mock path still passes"
          ]
        },
        "evidence": {
          "artifact_type": "db_query"
        },
        "cases": [
          {
            "start_ref": "all-7-inputs-satisfied",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed route with all 7 inputs valid via seedPoCRoute",
                "Call recomputeRiderReadyForRoute internal mutation",
                "Read curated_routes doc"
              ]
            },
            "end_state": {
              "must_observe": [
                "riderReady == true",
                "name == 'Twist of Tepusquet Loop'",
                "compositeScore == 0.85"
              ],
              "must_not_observe": [
                "riderReady == false",
                "riderReady == null or absent",
                "empty result (0)"
              ]
            },
            "seed_method": "public_api"
          }
        ]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN A rider-ready route persisted in curated_routes WHEN A gated query reads via withIndex('by_riderReady_and_composite_score', q=>q.eq('riderReady',true)) THEN the route is returned from the index WITHOUT recompute at read time (no computeRiderReadyFromDoc call in the query path)",
      "verify": "pnpm test -- convex/__tests__/S6T1-rider-ready-indexed.integration.test.ts --grep AC-2",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "integration",
        "verification_service": "convex-test-deployment",
        "negative_control": {
          "would_fail_if": [
            "query calls computeRiderReadyFromDoc inline (recompute at read)",
            "index is not used (full table scan + filter)",
            "riderReady field missing from doc",
            "mocked/stubbed or empty-start path still passes (test is fakeable)",
            "empty/stub/mock path still passes"
          ]
        },
        "evidence": {
          "artifact_type": "db_query"
        },
        "cases": [
          {
            "start_ref": "all-7-inputs-satisfied",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed route with riderReady=true via recomputeRiderReadyForRoute",
                "Query withIndex('by_riderReady_and_composite_score', riderReady=true)"
              ]
            },
            "end_state": {
              "must_observe": [
                "returned.length >= 1",
                "returned[0].riderReady === true",
                "returned[0].routeId === 'motorcycleroads:twist-of-tepusquet-loop'"
              ],
              "must_not_observe": [
                "returned.length === 0",
                "returned[0].riderReady === false"
              ]
            },
            "seed_method": "public_api"
          }
        ]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN A route missing exactly ONE of the 7 inputs (e.g. classifier verdict absent OR name empty OR retiredAt set) WHEN recomputeRiderReadyForRoute runs THEN stored riderReady=false (one-discriminator cases prove false-on-missing is strict, not short-circuit)",
      "verify": "pnpm test -- convex/__tests__/S6T1-rider-ready-false-on-missing.integration.test.ts --grep AC-3",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "integration",
        "verification_service": "convex-test-deployment",
        "negative_control": {
          "would_fail_if": [
            "composer short-circuits on the first input and skips the rest",
            "composer returns true when retiredAt != null",
            "composer returns true when duplicateOf != null",
            "mocked/stubbed empty response still passes (test is fakeable)"
          ]
        },
        "evidence": {
          "artifact_type": "db_query"
        },
        "cases": [
          {
            "start_ref": "retired-route",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed route with retiredAt != null but all other 6 inputs valid",
                "Call recomputeRiderReadyForRoute",
                "Read doc"
              ]
            },
            "end_state": {
              "must_observe": [
                "riderReady == false"
              ],
              "must_not_observe": [
                "riderReady == true",
                "riderReady == null",
                "empty/start signature: result count == 0 or field absent"
              ]
            },
            "seed_method": "public_api"
          },
          {
            "start_ref": "duplicate-shadow",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed route with duplicateOf != null but all other 6 inputs valid",
                "Call recomputeRiderReadyForRoute",
                "Read doc"
              ]
            },
            "end_state": {
              "must_observe": [
                "riderReady == false"
              ],
              "must_not_observe": [
                "riderReady == true",
                "empty/start signature: result count == 0 or field absent"
              ]
            },
            "seed_method": "public_api"
          }
        ]
      }
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN A route currently riderReady=true WHEN Any one of geometry/score/lengthMiles/classifier/retiredAt/duplicateOf changes (illustratively: classifier flips to 'not_a_ride') THEN the corresponding mutation path calls recomputeRiderReady(ctx, id) and the stored flag reflects the new input within the same transaction",
      "verify": "pnpm test -- convex/__tests__/S6T1-rider-ready-recompute-triggers.integration.test.ts --grep AC-4",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "integration",
        "verification_service": "convex-test-deployment",
        "negative_control": {
          "would_fail_if": [
            "the classifier-update mutation omits recomputeRiderReady",
            "recompute is deferred/batched and not in the same transaction",
            "trigger list misses one of the 6 change sources",
            "mocked/stubbed or empty-start path still passes (test is fakeable)",
            "empty/stub/mock path still passes"
          ]
        },
        "evidence": {
          "artifact_type": "db_query"
        },
        "cases": [
          {
            "start_ref": "all-7-inputs-satisfied",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed riderReady=true route",
                "Patch classifier verdict to 'not_a_ride' via the production mutation",
                "Read curated_routes doc in the same transaction"
              ]
            },
            "end_state": {
              "must_observe": [
                "riderReady == false",
                "classifier verdict == 'not_a_ride'"
              ],
              "must_not_observe": [
                "riderReady == true (trigger missed)",
                "riderReady == null",
                "empty/start signature: result count == 0 or field absent"
              ]
            },
            "seed_method": "public_api"
          }
        ]
      }
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN A geospatial re-index run that writes curated_route_geometry rows WHEN the migration completes and counts (a) point-rows written and (b) curated_routes where riderReady==true THEN the gate asserts pointCount == riderReadyCount and refuses to mark the SURF gate deployed when they diverge",
      "verify": "pnpm test -- convex/__tests__/S6T1-geospatial-reindex-gate.integration.test.ts --grep AC-5",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "integration",
        "verification_service": "convex-test-deployment",
        "negative_control": {
          "would_fail_if": [
            "gate is a stub that always returns parity",
            "gate reads only one side of the count",
            "gate runs before re-index completes (race)",
            "empty/stub/mock path still passes"
          ]
        },
        "evidence": {
          "artifact_type": "db_query"
        },
        "cases": [
          {
            "start_ref": "all-7-inputs-satisfied",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed N rider-ready routes + matching geometry rows",
                "Run the geospatial re-index gate mutation",
                "Read gate result"
              ]
            },
            "end_state": {
              "must_observe": [
                "pointCount === riderReadyCount",
                "gateDeployable === true"
              ],
              "must_not_observe": [
                "gateDeployable === true when counts diverge",
                "pointCount === 0",
                "riderReadyCount === 0"
              ]
            },
            "seed_method": "public_api"
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "computeRiderReadyFromDoc returns true iff all 7 inputs are present and valid",
      "verify": "pnpm test -- convex/__tests__/S6T1-rider-ready-composition.integration.test.ts -t 'TC-1'",
      "maps_to_ac": "AC-1",
      "scenario": {
        "test_tier": "integration",
        "evidence": {
          "artifact_type": "test_output"
        },
        "negative_control": {
          "would_fail_if": [
            "mocked/stubbed empty response still passes (test is fakeable)"
          ]
        },
        "cases": [
          {
            "start_state": {
              "description": "baseline before action",
              "records": [
                "empty baseline"
              ],
              "seed_method": "public_api"
            },
            "action": {
              "steps": [
                "exercise TC-1"
              ]
            },
            "end_state": {
              "must_observe": [
                "TC-1 result count >= 1"
              ],
              "must_not_observe": [
                "empty result (0)"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Gated queries return the route from by_riderReady_and_composite_score without recompute",
      "verify": "pnpm test -- convex/__tests__/S6T1-rider-ready-indexed.integration.test.ts -t 'TC-2'",
      "maps_to_ac": "AC-2",
      "scenario": {
        "test_tier": "integration",
        "evidence": {
          "artifact_type": "test_output"
        },
        "negative_control": {
          "would_fail_if": [
            "mocked/stubbed empty response still passes (test is fakeable)"
          ]
        },
        "cases": [
          {
            "start_state": {
              "description": "baseline before action",
              "records": [
                "empty baseline"
              ],
              "seed_method": "public_api"
            },
            "action": {
              "steps": [
                "exercise TC-2"
              ]
            },
            "end_state": {
              "must_observe": [
                "TC-2 result count >= 1"
              ],
              "must_not_observe": [
                "empty result (0)"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "Any one missing input forces riderReady=false (retiredAt/duplicateOf/classifier/name/score/length/geometry)",
      "verify": "pnpm test -- convex/__tests__/S6T1-rider-ready-false-on-missing.integration.test.ts -t 'TC-3'",
      "maps_to_ac": "AC-3",
      "scenario": {
        "test_tier": "integration",
        "evidence": {
          "artifact_type": "test_output"
        },
        "negative_control": {
          "would_fail_if": [
            "mocked/stubbed empty response still passes (test is fakeable)"
          ]
        },
        "cases": [
          {
            "start_state": {
              "description": "baseline before action",
              "records": [
                "empty baseline"
              ],
              "seed_method": "public_api"
            },
            "action": {
              "steps": [
                "exercise TC-3"
              ]
            },
            "end_state": {
              "must_observe": [
                "TC-3 result count >= 1"
              ],
              "must_not_observe": [
                "empty result (0)"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "Each of the 6 change sources triggers recomputeRiderReady in the same transaction",
      "verify": "pnpm test -- convex/__tests__/S6T1-rider-ready-recompute-triggers.integration.test.ts -t 'TC-4'",
      "maps_to_ac": "AC-4",
      "scenario": {
        "test_tier": "integration",
        "evidence": {
          "artifact_type": "test_output"
        },
        "negative_control": {
          "would_fail_if": [
            "mocked/stubbed empty response still passes (test is fakeable)"
          ]
        },
        "cases": [
          {
            "start_state": {
              "description": "baseline before action",
              "records": [
                "empty baseline"
              ],
              "seed_method": "public_api"
            },
            "action": {
              "steps": [
                "exercise TC-4"
              ]
            },
            "end_state": {
              "must_observe": [
                "TC-4 result count >= 1"
              ],
              "must_not_observe": [
                "empty result (0)"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "Geospatial re-index gate returns gateDeployable=true iff pointCount === riderReadyCount",
      "verify": "pnpm test -- convex/__tests__/S6T1-geospatial-reindex-gate.integration.test.ts -t 'TC-5'",
      "maps_to_ac": "AC-5",
      "scenario": {
        "test_tier": "integration",
        "evidence": {
          "artifact_type": "test_output"
        },
        "negative_control": {
          "would_fail_if": [
            "mocked/stubbed empty response still passes (test is fakeable)"
          ]
        },
        "cases": [
          {
            "start_state": {
              "description": "baseline before action",
              "records": [
                "empty baseline"
              ],
              "seed_method": "public_api"
            },
            "action": {
              "steps": [
                "exercise TC-5"
              ]
            },
            "end_state": {
              "must_observe": [
                "TC-5 result count >= 1"
              ],
              "must_not_observe": [
                "empty result (0)"
              ]
            }
          }
        ]
      }
    }
  ]
}
-->