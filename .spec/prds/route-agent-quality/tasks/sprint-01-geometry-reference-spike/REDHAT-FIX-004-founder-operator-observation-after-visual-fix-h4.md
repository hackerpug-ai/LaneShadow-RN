# REDHAT-FIX-004 — Perform the actual Founder-Operator observation after the visual gate is fixed; fixes H4

| Field | Value |
|-------|-------|
| TASK_ID | REDHAT-FIX-004 |
| SPRINT | [Sprint 01 — Geometry reference-flow spike](./SPRINT.md) |
| TASK_TYPE | HUMAN_GATE |
| AGENT | implementer=`Founder-Operator` · reviewer=`n/a` |
| ESTIMATE | 30 min |
| EFFORT | S |
| PRIORITY | P0 |
| STATUS | Done (founder re-run 20260712T100751Z; copper line YES) |
| PROPOSED_BY | `product-manager` |
| TDD_MODE | `skipped` |
| RED_GREEN_REQUIRED | no |
| CAPABILITIES | CAP-GEO-01, CAP-GEO-03 |
| PRD_REFS | T-REC-016, UC-REC-02, UC-VER-01, UC-SURF-01 |
| DEPENDS_ON | REDHAT-FIX-001, REDHAT-FIX-002, REDHAT-FIX-003, S1-T1, S1-T2, S1-T3 |
| BLOCKS | Sprint 04, Sprint 01 final Done claim |
| AUTHORITY | [.spec/reviews/red-hat-sprint-01-2026-07-12T07-30-55Z.md](../../../../reviews/red-hat-sprint-01-2026-07-12T07-30-55Z.md) |

RUNTIME_COMMANDS:
- test: `Manual STATUS check: REDHAT-FIX-001, REDHAT-FIX-002, REDHAT-FIX-003 Done`
- typecheck: `pnpm type-check`
- lint: `pnpm exec biome check`

## OUTCOME

Founder re-executes the full 7-step Human Testing Gate honestly and watches the copper road line plot on cold-boot detail for Twist of Tepusquet Loop.

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- MUST re-run full steps 1–7 after REDHAT-FIX-001/002/003 Done
- MUST execute step 1 as live reconstructForRoute (not getVerification re-read)
- MUST produce distinct evidence for steps 1–3
- MUST perform steps 6–7 with Founder-Operator human eyes and human tap
- MUST archive founder screenshots that show non-blank map with copper polyline before PASS
- MUST update STATUS only after real observation PASS

**NEVER**
- NEVER accept Maestro as substitute for founder eyes on steps 6–7
- NEVER re-stamp Done while step7 shows blank grey map
- NEVER satisfy steps 1–3 solely with getVerificationForRoute thrice
- NEVER record steps 6–7 as type terminal with only maestro CLI log
- NEVER unblock Sprint 04 while this task Backlog/FAIL
- NEVER edit product code under this task

**STRICTLY**
- STRICTLY gate-plan steps 6–7 type remains ui (human)
- STRICTLY PASS requires live reconstruct + ratio band + ai_reconstructed + riderReady + best+nearest + founder-watched copper line
- STRICTLY any of blank map / Maestro-only 6–7 / re-read-only 1–3 fails the gate

## DONE WHEN

- [x] AC-1: Live reconstruct chain for steps 1–3
- [x] AC-2: Best + nearest browse membership
- [x] AC-3: Cold-boot human open of recovered route
- [x] AC-4: Founder-watched copper road line
- [x] AC-5: Honest STATUS and Sprint 04 gate control
- [ ] Only SCOPE.writeAllowed files modified (`git diff --name-only`)
- [ ] Do **not** mark Sprint 01 Done from this task alone

## SPECIFICATION

**Objective:** Honestly re-execute Sprint 01 Human Testing Gate end-to-end so Founder-Operator personally verifies reconstruct→gate→persist→query→cold-boot render seam.

**Success state:** Founder records PASS with distinct live reconstruct evidence for 1–3, best+nearest membership, founder-watched copper road line screenshots, STATUS updated only after observation.

**Agent rationale:** S1-T4 / T-REC-016 human-gate requires Founder-Operator own-eyes watch. No implementer may stamp this Done.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `poc_tepusquet_route` (seed_method: `public_api`): motorcycleroads:twist-of-tepusquet-loop ~41mi centroid 34.95,-120.42
- `cold_app_with_recovered_poc` (seed_method: `recorded_external`): iOS cold app after live reconstruct left ai_reconstructed geometry
- `revoked_prior_gate_package` (seed_method: `recorded_external`): Revoked run_id 20260712T072127Z Maestro-only 6–7 blank step7

## ACCEPTANCE CRITERIA

### AC-1 [PRIMARY]

**Requirement:** GIVEN REDHAT-FIX-001/002/003 Done and PoC on Convex dev WHEN Founder runs step 1 reconstructForRoute on real APIs then steps 2–3 verification reads THEN geometryStatus generated, provenance ai_reconstructed, verdict pass, ratio in [0.6,1.6], riderReady true, step1 is reconstruct not re-read theatre

- TEST_TIER: `e2e`  ·  VERIFICATION_SERVICE: Convex dev + real providers + Founder evidence review
- VERIFY: `Inspect evidence/step1-reconstruct.log for reconstructForRoute + exit 0 + generated/ai_reconstructed/pass/ratio/riderReady`
- FLOW_REF: `T-REC-016`

SCENARIO:
- NEGATIVE_CONTROL — would fail if: steps 1–3 only re-read residual verification; reconstruct stubbed; ratio outside band stamped pass
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `poc_tepusquet_route`
    - ACTION: Founder runs step 1 reconstructForRoute on real APIs then steps 2–3 verification reads
    - MUST_OBSERVE: CMD contains reconstructForRoute in step1 log; geometryStatus generated; provenance ai_reconstructed; verdict pass; ratio in [0.6,1.6]; riderReady true
    - MUST_NOT_OBSERVE: step1 CMD only getVerificationForRoute; three identical verification re-reads as sole reconstruct proof

### AC-2

**Requirement:** GIVEN PoC passed reconstruct and is riderReady true WHEN Founder queries listCuratedRoutesInternal national-best and nearest at (34.95,-120.42) THEN motorcycleroads:twist-of-tepusquet-loop appears in both result sets

- TEST_TIER: `e2e`  ·  VERIFICATION_SERVICE: Convex dev list queries
- VERIFY: `Inspect evidence/step4-list-best.log and evidence/step5-list-nearest.log for routeId`

SCENARIO:
- NEGATIVE_CONTROL — would fail if: query mocked; only best checked
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `poc_tepusquet_route`
    - ACTION: Founder queries listCuratedRoutesInternal national-best and nearest at (34.95,-120.42)
    - MUST_OBSERVE: routeId in best results; routeId in nearest results
    - MUST_NOT_OBSERVE: PoC absent from best; PoC absent from nearest

### AC-3

**Requirement:** GIVEN PoC browse-visible and iOS simulator cold app process WHEN Founder kills+relaunches app and human-taps into Twist of Tepusquet Loop Route Detail THEN Route Detail open with map host after cold boot; founder notes document human interaction (not Maestro-only)

- TEST_TIER: `e2e`  ·  VERIFICATION_SERVICE: iOS simulator + Founder-Operator observation
- VERIFY: `Founder checklist + evidence/step6-detail-open.png shows detail (not Home) + step6 notes deny Maestro-only pass`

SCENARIO:
- NEGATIVE_CONTROL — would fail if: warm reload only; Maestro openLink alone stamps step 6
- EVIDENCE: `screenshot` (required_capture: true)
- CASE 1 — start_ref `cold_app_with_recovered_poc`
    - ACTION: Founder kills+relaunches app and human-taps into Twist of Tepusquet Loop Route Detail
    - MUST_OBSERVE: Route Detail title Twist of Tepusquet Loop; map host visible; founder step6 notes with human tap path
    - MUST_NOT_OBSERVE: evidence only maestro CLI cold-boot flow log; step6.png Home-only

### AC-4

**Requirement:** GIVEN Route Detail open after cold boot and REDHAT-FIX-001/002 paint+oracle fixes in WHEN Founder watches map settle and inspects plotted geometry THEN visible copper/road polyline present; founder screenshot shows the line; STATUS updated only after this observation

- TEST_TIER: `e2e`  ·  VERIFICATION_SERVICE: Founder-Operator eyes on iOS simulator Mapbox detail map
- VERIFY: `Founder visual checklist + evidence/step7-road-line.png must show copper/road line; blank map = FAIL`

SCENARIO:
- NEGATIVE_CONTROL — would fail if: blank grey map + blue puck only; invisible transparent probe passes automation while human sees no line; Maestro COMPLETED without founder watch
- EVIDENCE: `screenshot` (required_capture: true)
- CASE 1 — start_ref `cold_app_with_recovered_poc`
    - ACTION: Founder watches map settle and inspects plotted geometry
    - MUST_OBSERVE: human-visible copper/road polyline on map; screenshot non-blank with line pixels; founder step7 notes PASS
    - MUST_NOT_OBSERVE: blank grey map; centroid-only presentation; Done stamped with Maestro-only step7 evidence

### AC-5

**Requirement:** GIVEN revoked 20260712T072127Z package claimed pass without founder visual proof WHEN Founder completes re-run verdict recording for this task THEN PASS updates STATUS/evidence only with new honest artifacts and unblocks Sprint 04; FAIL leaves Sprint 04 blocked

- TEST_TIER: `e2e`  ·  VERIFICATION_SERVICE: Artifact review by Founder-Operator
- VERIFY: `STATUS fields + gate-results human notes reference new evidence path; revoked run_id not cited as proof`

SCENARIO:
- NEGATIVE_CONTROL — would fail if: re-stamping Done while step7 blank; citing revoked gate-results pass; unblocking Sprint 04 without founder PASS
- EVIDENCE: `file_artifact` (required_capture: true)
- CASE 1 — start_ref `revoked_prior_gate_package`
    - ACTION: Founder completes re-run verdict recording for this task
    - MUST_OBSERVE: new evidence directory path in STATUS; steps 6–7 recorded as human/ui observation; Sprint 04 unblocked only if PASS
    - MUST_NOT_OBSERVE: STATUS Done with only run_id 20260712T072127Z; Maestro-only 6–7 as Done claim; Sprint 04 unblocked on FAIL/Backlog

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Step1 log CMD is reconstructForRoute for motorcycleroads:twist-of-tepusquet-loop | AC-1 | `grep -F reconstructForRoute evidence/step1-reconstruct.log` |
| TC-2 | Verification after reconstruct shows verdict pass with ratio in [0.6,1.6] | AC-1 | `Founder inspects step2 log: verdict==pass and 0.6<=ratio<=1.6` |
| TC-3 | Persisted provenance is ai_reconstructed with riderReady true after reconstruct | AC-1 | `Founder inspects step3 log fields provenance and riderReady` |
| TC-4 | National-best list results include motorcycleroads:twist-of-tepusquet-loop | AC-2 | `grep -F motorcycleroads:twist-of-tepusquet-loop evidence/step4-list-best.log` |
| TC-5 | Nearest list results at 34.95,-120.42 include motorcycleroads:twist-of-tepusquet-loop | AC-2 | `grep -F motorcycleroads:twist-of-tepusquet-loop evidence/step5-list-nearest.log` |
| TC-6 | Founder step6 notes record cold-boot plus human open of Twist of Tepusquet Loop detail | AC-3 | `Founder checklist true on evidence/step6-founder-notes.md` |
| TC-7 | Step6 evidence is not Maestro-only terminal substitution | AC-3 | `Founder asserts evidence type human/ui and screenshot is Route Detail` |
| TC-8 | Founder sees a copper road line on cold-boot Route Detail for the PoC | AC-4 | `Founder visual YES + evidence/step7-road-line.png shows line` |
| TC-9 | Step7 screenshot is not a blank grey map | AC-4 | `Founder visual reject if blank/puck-only` |
| TC-10 | STATUS Done is recorded only after founder PASS with new evidence paths | AC-5 | `STATUS body cites post-remediation evidence dir` |
| TC-11 | Sprint 04 remains blocked while REDHAT-FIX-004 is Backlog or FAIL | AC-5 | `Dependency check: Sprint 04 not unblocked without this PASS` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- REDHAT-FIX-004 task STATUS + evidence notes (MODIFY when recording)
- S1-T4 STATUS field only (MODIFY)
- SPRINT.md status/human-gate claim lines only if recording honest outcome (MODIFY)
- gate-results.json human re-run records (MODIFY after real observation)
- evidence/** (NEW) founder step logs, screenshots, notes

**writeProhibited:**
- react-native/** — paint/oracle is REDHAT-FIX-001/002
- convex/** — reconstruct/list/auth is REDHAT-FIX-003/005/006
- .maestro/** — AC-4 archive is REDHAT-FIX-007; Maestro cannot stamp this HUMAN_GATE alone
- Any file not explicitly listed above

## READING LIST

- `.spec/reviews/red-hat-sprint-01-2026-07-12T07-30-55Z.md` (all) — AUTHORITY H4 + H1 + H3
- `SPRINT.md` (all) — Human Testing Gate + REDHAT-FIX table
- `S1-T4-founder-observe-recovered-line-plot.md` (all) — original HUMAN_GATE; Done to revoke
- `gate-results.json` (all) — REVOKED pass package
- `brain/docs/WHEN-PRINTING-HUMAN-TESTING-STEPS.md` (all) — Pre-steps + expected outputs

## DESIGN

- pattern: Human testing gate protocol: Pre-steps → CLI 1–5 with literal cmds + expected outputs → human UI 6–7 with eyes/tap → PASS/FAIL + evidence archive → STATUS only after real observation.
- pattern_source: `S1-T4 + brain/docs/WHEN-PRINTING-HUMAN-TESTING-STEPS.md`
- anti_pattern: Maestro deep-link + invisible real-line probe + residual getVerification re-reads stamped as founder-watched green.
- references: `.spec/reviews/red-hat-sprint-01-2026-07-12T07-30-55Z.md`, `./SPRINT.md`

## VERIFICATION GATES

| Gate | Command | Expected |
|------|---------|----------|
| Prereq fixes Done | `Manual STATUS check: REDHAT-FIX-001, REDHAT-FIX-002, REDHAT-FIX-003 Done` | All three Done else BLOCK |
| AC-1 live reconstruct | `npx convex run curatedGeometryReconstruct:reconstructForRoute '{"routeId":"motorcycleroads:twist-of-tepusquet-loop"}'` | generated + ai_reconstructed + pass + ratio band + riderReady |
| AC-2 best | `npx convex run curatedRoutes:listCuratedRoutesInternal '{"sort":"best","limit":20}'` | PoC present |
| AC-2 nearest | `npx convex run curatedRoutes:listCuratedRoutesInternal '{"sort":"nearest","center":{"lat":34.95,"lng":-120.42},"limit":20}'` | PoC present |
| AC-3/4 human 6–7 | `HUMAN: cold-boot + tap + watch line; capture step6/step7 screenshots + notes` | Founder-watched copper line; not blank; not Maestro-only |
| Optional support only | `maestro test .maestro/rec-016-cold-boot-recovered-route-plots.yaml -e RECOVERED_ROUTE_ID=motorcycleroads:twist-of-tepusquet-loop` | May be green after 001/002 but CANNOT alone set this task Done |
| Scope | `git diff --name-only` | ⊆ write_allowed |

## CODING STANDARDS

- `brain/docs/WHEN-PRINTING-HUMAN-TESTING-STEPS.md`
- `brain/docs/TESTING-HIERARCHY.md`
- `brain/docs/HUMAN-TESTING-GATE-VERIFICATION.md`

## DEPENDENCIES

- Depends on: REDHAT-FIX-001, REDHAT-FIX-002, REDHAT-FIX-003, S1-T1, S1-T2, S1-T3
- Blocks: Sprint 04, Sprint 01 final Done claim


## HUMAN TESTING GATE (full protocol)

**Gate:** The Founder-Operator watches one real recovered route plot its correct road line on the simulator from a cold boot.

> Prior S1-T4 STATUS Done (CLI 1-5 + Maestro 6-7) and gate-results verdict pass (run_id 20260712T072127Z) are **REVOKED** by red-hat 2026-07-12 (H1/H3/H4).

### Pre-steps

1. Confirm REDHAT-FIX-001, REDHAT-FIX-002, REDHAT-FIX-003 STATUS Done with honest evidence (prefer also 005/006/007 green).
2. Convex pointed at live dev deployment; Anthropic + Google credentials available for reconstruct.
3. iOS simulator booted with LaneShadow expo-dev-client; Metro connected; Mapbox token valid.
4. Create fresh evidence directory (do not reuse revoked 20260712T072127Z artifacts).
5. PoC: `motorcycleroads:twist-of-tepusquet-loop` / Twist of Tepusquet Loop.

### Step-by-step

1. **Reconstruct (live):** `npx convex run curatedGeometryReconstruct:reconstructForRoute '{"routeId":"motorcycleroads:twist-of-tepusquet-loop"}'` (+ `--identity` if REDHAT-FIX-005 requires it). Expect geometryStatus generated, provenance ai_reconstructed, verdict pass, ratio ∈ [0.6,1.6], riderReady true. Save `evidence/step1-reconstruct.log`. **MUST NOT** use getVerificationForRoute as step-1 command.
2. **Gate ratio band:** `npx convex run curatedGeometryReconstruct:getVerificationForRoute '{"routeId":"motorcycleroads:twist-of-tepusquet-loop"}' --identity='{"subject":"s1-human-gate","issuer":"https://laneshadow.test"}'`. Expect verdict pass, ratio ∈ [0.6,1.6]. Save step2 log.
3. **Persist + riderReady:** same verification/route read proving provenance ai_reconstructed + riderReady true after reconstruct. Save step3 log. Evidence package must show step1 was reconstruct (not three identical re-reads).
4. **Best list:** `npx convex run curatedRoutes:listCuratedRoutesInternal '{"sort":"best","limit":20}'` — PoC present.
5. **Nearest list:** `npx convex run curatedRoutes:listCuratedRoutesInternal '{"sort":"nearest","center":{"lat":34.95,"lng":-120.42},"limit":20}'` — PoC present.
6. **Cold-boot + human tap:** Kill app; relaunch; dismiss dev-client launcher; **human-tap** Twist of Tepusquet Loop into Route Detail. Maestro may support but **cannot alone** pass step 6. Screenshot step6-detail-open.png must be detail (not Home). Notes required.
7. **Watch road line:** Founder eyes — copper/road polyline multi-segment, NOT blank grey + blue puck, NOT centroid-only. Capture `step7-road-line.png` that shows the line. Maestro COMPLETED real-line testID on blank map is **FAIL**.

### PASS / FAIL

- **PASS:** live reconstruct + ratio band + ai_reconstructed + riderReady + best+nearest membership + founder-watched copper line with screenshots; STATUS updated only after real observation; unblocks Sprint 04.
- **FAIL:** blank map; no copper line; Maestro-only 6–7; re-read-only 1–3; missing from best/nearest; ratio outside band. Leave STATUS Backlog/FAIL; do **not** unblock Sprint 04.


## NOTES

- Source authority: red-hat review `.spec/reviews/red-hat-sprint-01-2026-07-12T07-30-55Z.md` (2026-07-12T07:30:55Z).
- Fixes H4. Soft-depends on REDHAT-FIX-005/006/007 for gate honesty. proposed_by=product-manager. Soft depends: REDHAT-FIX-007, REDHAT-FIX-005, REDHAT-FIX-006.
- Do not implement product code beyond write_allowed. Do not call the sprint done.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "REDHAT-FIX-004",
  "tdd_mode": "skipped",
  "verification_policy": {
    "requires_tests": false,
    "requires_red_evidence": false,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "poc_tepusquet_route": {
      "description": "motorcycleroads:twist-of-tepusquet-loop ~41mi centroid 34.95,-120.42",
      "seed_method": "public_api",
      "records": [
        "Twist of Tepusquet Loop"
      ]
    },
    "cold_app_with_recovered_poc": {
      "description": "iOS cold app after live reconstruct left ai_reconstructed geometry",
      "seed_method": "recorded_external",
      "records": [
        "killed then relaunched"
      ]
    },
    "revoked_prior_gate_package": {
      "description": "Revoked run_id 20260712T072127Z Maestro-only 6\u20137 blank step7",
      "seed_method": "recorded_external",
      "records": [
        "must not reuse as PASS"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN REDHAT-FIX-001/002/003 Done and PoC on Convex dev WHEN Founder runs step 1 reconstructForRoute on real APIs then steps 2\u20133 verification reads THEN geometryStatus generated, provenance ai_reconstructed, verdict pass, ratio in [0.6,1.6], riderReady true, step1 is reconstruct not re-read theatre",
      "verify": "Inspect evidence/step1-reconstruct.log for reconstructForRoute + exit 0 + generated/ai_reconstructed/pass/ratio/riderReady",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "e2e",
        "verification_service": "Convex dev + real providers + Founder evidence review",
        "negative_control": {
          "would_fail_if": [
            "steps 1\u20133 only re-read residual verification",
            "reconstruct stubbed",
            "ratio outside band stamped pass"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "poc_tepusquet_route",
            "action": {
              "actor": "founder_operator",
              "steps": [
                "Founder runs step 1 reconstructForRoute on real APIs then steps 2\u20133 verification reads"
              ]
            },
            "end_state": {
              "must_observe": [
                "CMD contains reconstructForRoute in step1 log",
                "geometryStatus generated",
                "provenance ai_reconstructed",
                "verdict pass",
                "ratio in [0.6,1.6]",
                "riderReady true"
              ],
              "must_not_observe": [
                "step1 CMD only getVerificationForRoute",
                "three identical verification re-reads as sole reconstruct proof"
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
      "description": "GIVEN PoC passed reconstruct and is riderReady true WHEN Founder queries listCuratedRoutesInternal national-best and nearest at (34.95,-120.42) THEN motorcycleroads:twist-of-tepusquet-loop appears in both result sets",
      "verify": "Inspect evidence/step4-list-best.log and evidence/step5-list-nearest.log for routeId",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "e2e",
        "verification_service": "Convex dev list queries",
        "negative_control": {
          "would_fail_if": [
            "query mocked",
            "only best checked"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "poc_tepusquet_route",
            "action": {
              "actor": "founder_operator",
              "steps": [
                "Founder queries listCuratedRoutesInternal national-best and nearest at (34.95,-120.42)"
              ]
            },
            "end_state": {
              "must_observe": [
                "routeId in best results",
                "routeId in nearest results"
              ],
              "must_not_observe": [
                "PoC absent from best",
                "PoC absent from nearest"
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
      "description": "GIVEN PoC browse-visible and iOS simulator cold app process WHEN Founder kills+relaunches app and human-taps into Twist of Tepusquet Loop Route Detail THEN Route Detail open with map host after cold boot; founder notes document human interaction (not Maestro-only)",
      "verify": "Founder checklist + evidence/step6-detail-open.png shows detail (not Home) + step6 notes deny Maestro-only pass",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "e2e",
        "verification_service": "iOS simulator + Founder-Operator observation",
        "negative_control": {
          "would_fail_if": [
            "warm reload only",
            "Maestro openLink alone stamps step 6"
          ]
        },
        "evidence": {
          "artifact_type": "screenshot",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "cold_app_with_recovered_poc",
            "action": {
              "actor": "founder_operator",
              "steps": [
                "Founder kills+relaunches app and human-taps into Twist of Tepusquet Loop Route Detail"
              ]
            },
            "end_state": {
              "must_observe": [
                "Route Detail title Twist of Tepusquet Loop",
                "map host visible",
                "founder step6 notes with human tap path"
              ],
              "must_not_observe": [
                "evidence only maestro CLI cold-boot flow log",
                "step6.png Home-only"
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
      "description": "GIVEN Route Detail open after cold boot and REDHAT-FIX-001/002 paint+oracle fixes in WHEN Founder watches map settle and inspects plotted geometry THEN visible copper/road polyline present; founder screenshot shows the line; STATUS updated only after this observation",
      "verify": "Founder visual checklist + evidence/step7-road-line.png must show copper/road line; blank map = FAIL",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "e2e",
        "verification_service": "Founder-Operator eyes on iOS simulator Mapbox detail map",
        "negative_control": {
          "would_fail_if": [
            "blank grey map + blue puck only",
            "invisible transparent probe passes automation while human sees no line",
            "Maestro COMPLETED without founder watch"
          ]
        },
        "evidence": {
          "artifact_type": "screenshot",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "cold_app_with_recovered_poc",
            "action": {
              "actor": "founder_operator",
              "steps": [
                "Founder watches map settle and inspects plotted geometry"
              ]
            },
            "end_state": {
              "must_observe": [
                "human-visible copper/road polyline on map",
                "screenshot non-blank with line pixels",
                "founder step7 notes PASS"
              ],
              "must_not_observe": [
                "blank grey map",
                "centroid-only presentation",
                "Done stamped with Maestro-only step7 evidence"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN revoked 20260712T072127Z package claimed pass without founder visual proof WHEN Founder completes re-run verdict recording for this task THEN PASS updates STATUS/evidence only with new honest artifacts and unblocks Sprint 04; FAIL leaves Sprint 04 blocked",
      "verify": "STATUS fields + gate-results human notes reference new evidence path; revoked run_id not cited as proof",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "e2e",
        "verification_service": "Artifact review by Founder-Operator",
        "negative_control": {
          "would_fail_if": [
            "re-stamping Done while step7 blank",
            "citing revoked gate-results pass",
            "unblocking Sprint 04 without founder PASS"
          ]
        },
        "evidence": {
          "artifact_type": "file_artifact",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "revoked_prior_gate_package",
            "action": {
              "actor": "founder_operator",
              "steps": [
                "Founder completes re-run verdict recording for this task"
              ]
            },
            "end_state": {
              "must_observe": [
                "new evidence directory path in STATUS",
                "steps 6\u20137 recorded as human/ui observation",
                "Sprint 04 unblocked only if PASS"
              ],
              "must_not_observe": [
                "STATUS Done with only run_id 20260712T072127Z",
                "Maestro-only 6\u20137 as Done claim",
                "Sprint 04 unblocked on FAIL/Backlog"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "Step1 log CMD is reconstructForRoute for motorcycleroads:twist-of-tepusquet-loop",
      "verify": "grep -F reconstructForRoute evidence/step1-reconstruct.log",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Verification after reconstruct shows verdict pass with ratio in [0.6,1.6]",
      "verify": "Founder inspects step2 log: verdict==pass and 0.6<=ratio<=1.6",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "Persisted provenance is ai_reconstructed with riderReady true after reconstruct",
      "verify": "Founder inspects step3 log fields provenance and riderReady",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "National-best list results include motorcycleroads:twist-of-tepusquet-loop",
      "verify": "grep -F motorcycleroads:twist-of-tepusquet-loop evidence/step4-list-best.log",
      "maps_to_ac": "AC-2"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "Nearest list results at 34.95,-120.42 include motorcycleroads:twist-of-tepusquet-loop",
      "verify": "grep -F motorcycleroads:twist-of-tepusquet-loop evidence/step5-list-nearest.log",
      "maps_to_ac": "AC-2"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "Founder step6 notes record cold-boot plus human open of Twist of Tepusquet Loop detail",
      "verify": "Founder checklist true on evidence/step6-founder-notes.md",
      "maps_to_ac": "AC-3"
    },
    {
      "id": "TC-7",
      "type": "test_criterion",
      "description": "Step6 evidence is not Maestro-only terminal substitution",
      "verify": "Founder asserts evidence type human/ui and screenshot is Route Detail",
      "maps_to_ac": "AC-3"
    },
    {
      "id": "TC-8",
      "type": "test_criterion",
      "description": "Founder sees a copper road line on cold-boot Route Detail for the PoC",
      "verify": "Founder visual YES + evidence/step7-road-line.png shows line",
      "maps_to_ac": "AC-4"
    },
    {
      "id": "TC-9",
      "type": "test_criterion",
      "description": "Step7 screenshot is not a blank grey map",
      "verify": "Founder visual reject if blank/puck-only",
      "maps_to_ac": "AC-4"
    },
    {
      "id": "TC-10",
      "type": "test_criterion",
      "description": "STATUS Done is recorded only after founder PASS with new evidence paths",
      "verify": "STATUS body cites post-remediation evidence dir",
      "maps_to_ac": "AC-5"
    },
    {
      "id": "TC-11",
      "type": "test_criterion",
      "description": "Sprint 04 remains blocked while REDHAT-FIX-004 is Backlog or FAIL",
      "verify": "Dependency check: Sprint 04 not unblocked without this PASS",
      "maps_to_ac": "AC-5"
    }
  ]
}
-->
