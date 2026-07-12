# S1-T3 — Maestro cold-boot plot-verification flow for the single recovered route

| Field | Value |
|-------|-------|
| TASK_ID | S1-T3 |
| SPRINT | [Sprint 01 — Geometry reference-flow spike](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`react-native-ui-implementer` · reviewer=`react-native-ui-reviewer` |
| ESTIMATE | 75 min |
| EFFORT | S |
| PRIORITY | P0 |
| STATUS | Backlog |
| PROPOSED_BY | `react-native-ui-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | CAP-GEO-03 |
| DEPENDS_ON | S1-T2 |
| BLOCKS | — |

RUNTIME_COMMANDS:
- test: `maestro test .maestro/rec-016-cold-boot-recovered-route-plots.yaml -e RECOVERED_ROUTE_ID=<slug>`
- typecheck: `pnpm type-check`
- lint: `pnpm exec biome check`

## OUTCOME

A Maestro flow cold-boots the app, deep-links to the single recovered `ai_reconstructed` route, and proves its correct road line plots (a `curated-route-detail-real-line` testID gated on decoded polyline ≥2 points) — genuinely failing on a centroid dot.

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- Cold-boot: stopApp then launchApp {clearState:true, clearKeychain:true} — a warm-nav shortcut does NOT satisfy the gate.
- Dismiss the Expo dev-client launcher (DEVELOPMENT SERVERS → `.*localhost:8081.*`) AND the developer-menu popup (Continue/Close/Reload) before any navigation (reuse `_common-auth.yaml`).
- Prove a real ≥2-point road line via a NEW `curated-route-detail-real-line` testID that renders only when the decoded polyline has `coordinates.length >= 2`; assert `curated-detail-approximate-badge` + `curated-route-detail-fallback` NOT visible on the primary path.
- Run against the live Convex dev deployment where S1-T2 persisted the geometry; routeId slug supplied via Maestro env `RECOVERED_ROUTE_ID`.
- Keep the RN change minimal + JS-only (Metro serves JS-only changes without rebuild) — one discriminator testID node inside the existing map section.

**NEVER**
- NEVER treat the existing string-presence probe `curated-route-detail-polyline` (gated on `Boolean(detail.routePolyline)`) as the pass condition — it renders for a <2-point dot.
- NEVER let a centroid dot, a 0-point line, or a 1-point degenerate line pass the flow.
- NEVER assert LLM prose / chat text / a suggestion card as the plot proof — the proof is the rendered map-line testID.
- NEVER edit convex/** or the query/gate layer (render half only); never double-suffix testIDs (MapHeaderOverlay landmine).

**STRICTLY**
- STRICTLY test_tier=e2e (Maestro on the iOS sim vs the live dev deployment); the supplementary vitest branch check is UNIT_TEST_JUSTIFIED (pure props→render branch) and never substitutes for the Maestro plot proof.
- STRICTLY run once — no retry (flake policy): a flaky flow is a broken flow.

## DONE WHEN

- Cold-boot + deep-link → `curated-route-detail-real-line` visible, approximate-badge/fallback absent; screenshot captured (AC-1).
- A centroid/degenerate <2-point route renders NO real-line testID (AC-2).
- The cold-boot launcher-dismiss reaches `chat-input` before navigation (AC-3).
- An absent RECOVERED_ROUTE_ID renders the honest `curated-route-detail-fallback` with no crash / no fabricated line (AC-4).
- `maestro test .maestro/rec-016-cold-boot-recovered-route-plots.yaml -e RECOVERED_ROUTE_ID=<slug>` passes + `pnpm type-check` clean + `pnpm exec biome check` clean
- Only SCOPE.writeAllowed files modified (`git diff --name-only`)
- Every behavioral AC scenario passes `validate_scenario` (exit 0); RED-against-start recorded before GREEN; seeded-value EVIDENCE artifact captured

## SPECIFICATION

**Objective:** Prove the render half of the T-REC-016 spike seam: the recovered route (persisted by S1-T2 on the live dev deployment) plots its road line on the iOS sim from a cold boot.

**Success state:** `.maestro/rec-016-cold-boot-recovered-route-plots.yaml` cold-boots (stopApp + clearState), dismisses the dev-client launcher, deep-links `laneshadow:///curated-route/${RECOVERED_ROUTE_ID}`, and asserts `curated-route-detail-real-line` visible + approximate-badge/fallback absent; a dot fails the flow.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `recovered_poc_route` (seed_method: `migration_fixture`): The single recovered ai_reconstructed PoC route persisted by S1-T2 on the live dev deployment (Twist of Tepusquet Loop; routePolyline decodes to >=2 coords; riderReady true).
- `centroid_only_route` (seed_method: `migration_fixture`): A route with null routePolyline + a valid centroid (dot), plus a degenerate variant whose routePolyline decodes to a single point.
- `cold_app` (seed_method: `recorded_external`): Killed-then-fresh app process: stopApp then launchApp {clearState:true, clearKeychain:true}; Clerk session cleared, location grant reset.
- `absent_route` (seed_method: `recorded_external`): A RECOVERED_ROUTE_ID with no matching curated_routes row on the dev deployment.

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY]

**Requirement:** GIVEN the recovered ai_reconstructed route on dev WHEN the flow cold-boots + deep-links to it THEN the real road line plots (curated-route-detail-real-line visible, >=2-pt polyline) with no dot/fallback

- TEST_TIER: `e2e`  ·  VERIFICATION_SERVICE: Maestro (iOS simulator) against the live Convex dev deployment
- VERIFY: `maestro test .maestro/rec-016-cold-boot-recovered-route-plots.yaml -e RECOVERED_ROUTE_ID=<slug>`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the route has no gate-passing geometry and plots only a centroid dot; the map plots a centroid fallback (approximate badge) instead of a road line; the flow asserts warm-nav (skips stopApp/clearState) instead of a cold boot; the flow relies on the string-presence curated-route-detail-polyline probe, which passes for a <2-point dot (stub-equivalent)
- EVIDENCE: `screenshot` (required_capture: true)
- CASE 1 — start_ref `recovered_poc_route`
    - ACTION (cli_user): stopApp + launchApp {clearState,clearKeychain}; runFlow _common-auth.yaml; openLink laneshadow:///curated-route/${RECOVERED_ROUTE_ID}; wait for curated-route-detail-name + curated-detail-map
    - MUST_OBSERVE: testID 'curated-detail-map' visible; testID 'curated-route-detail-real-line' visible (decoded polyline >= 2 points); 'curated-route-detail-name' shows the recovered route name
    - MUST_NOT_OBSERVE: testID 'curated-detail-approximate-badge' visible (centroid dot only); testID 'curated-route-detail-fallback' visible (no route); empty map with 0 route-line testIDs

### AC-2

**Requirement:** GIVEN a centroid-only/degenerate route WHEN the detail screen renders THEN curated-route-detail-real-line is ABSENT and the approximate badge shows — a dot can never satisfy the plot gate

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: vitest (jsdom render-branch) against the real detail screen component
- VERIFY: `pnpm exec vitest run 'app/(app)/curated-route/[id].geometry-degradation.integration.test.tsx'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the real-line probe rendered for a dot (string-presence gating instead of coord-count); the >=2-point threshold is removed so a 1-point line renders the real-line testID; the Maestro flow passed against a centroid-only route (stub-equivalent)
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `centroid_only_route`
    - ACTION (api_client): render the detail screen for a route with null routePolyline (centroid)
    - MUST_OBSERVE: testID 'curated-detail-approximate-badge' rendered for the null-polyline centroid route; 0 'curated-route-detail-real-line' nodes for the centroid route
    - MUST_NOT_OBSERVE: 'curated-route-detail-real-line' present for a centroid dot; 'curated-route-detail-real-line' present with 0 real points
- CASE 2 — start_ref `centroid_only_route`
    - ACTION (api_client): render the detail screen for a route whose routePolyline decodes to 1 point (degenerate)
    - MUST_OBSERVE: 1 decoded point counted (< 2 threshold); 0 'curated-route-detail-real-line' nodes for the 1-point line
    - MUST_NOT_OBSERVE: 'curated-route-detail-real-line' present for a 1-point degenerate line; a >=2-point line claimed where none exists (empty)

### AC-3

**Requirement:** GIVEN a killed+relaunched app WHEN the flow starts THEN the dev-client launcher + developer-menu are dismissed and authenticated home (chat-input) is reached BEFORE navigation — a true cold boot

- TEST_TIER: `e2e`  ·  VERIFICATION_SERVICE: Maestro (iOS simulator) against the live Convex dev deployment
- VERIFY: `maestro test .maestro/rec-016-cold-boot-recovered-route-plots.yaml -e RECOVERED_ROUTE_ID=<slug>`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the flow omits stopApp/clearState (warm start, stub-equivalent); the launcher menu blocks navigation to the detail screen (empty surface)
- EVIDENCE: `screenshot` (required_capture: true)
- CASE 1 — start_ref `cold_app`
    - ACTION (cli_user): stopApp; launchApp {clearState,clearKeychain}; dismiss DEVELOPMENT SERVERS picker (.*localhost:8081.*) then developer-menu popup; auth via e2e-test-login-button
    - MUST_OBSERVE: DEVELOPMENT SERVERS picker dismissed by tapping '.*localhost:8081.*'; developer-menu popup dismissed ('Continue'/'Close'/'Reload'); testID 'chat-input' visible (authenticated home reached from cold boot)
    - MUST_NOT_OBSERVE: developer-menu overlay remaining over the app surface; warm JS state reused (no launchApp clearState)

### AC-4

**Requirement:** GIVEN a RECOVERED_ROUTE_ID resolving to no row WHEN the flow deep-links to it THEN the honest curated-route-detail-fallback renders with no crash and NO fabricated line

- TEST_TIER: `e2e`  ·  VERIFICATION_SERVICE: Maestro (iOS simulator) against the live Convex dev deployment
- VERIFY: `maestro test .maestro/rec-016-cold-boot-recovered-route-plots.yaml -e RECOVERED_ROUTE_ID=nonexistent-route-slug`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the screen crashes on an absent routeId; a fake line or centroid dot renders as a 'route' for a missing row (fabricated success)
- EVIDENCE: `screenshot` (required_capture: true)
- CASE 1 — start_ref `absent_route`
    - ACTION (cli_user): cold-boot + deep-link openLink laneshadow:///curated-route/nonexistent-route-slug
    - MUST_OBSERVE: testID 'curated-route-detail-fallback' visible ('Route not found'); 0 red-box crash surfaces
    - MUST_NOT_OBSERVE: 'curated-route-detail-real-line' visible for an absent route; a fabricated road line rendered for a missing route (none exists)

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Maestro flow on a booted iOS sim vs the live dev deployment: curated-detail-map + curated-route-detail-real-line visible; approximate-badge + fallback NOT visible; screenshot 02 captured; flow exits 0 | AC-1 | `maestro test .maestro/rec-016-cold-boot-recovered-route-plots.yaml -e RECOVERED_ROUTE_ID=<slug-persisted-by-S1-T2>` |
| TC-2 | vitest render-branch: curated-route-detail-real-line renders for the >=2-point fixture; ABSENT for the null-polyline centroid fixture; ABSENT for a degenerate <2-point fixture | AC-2 | `pnpm exec vitest run 'app/(app)/curated-route/[id].geometry-degradation.integration.test.tsx'` |
| TC-3 | Within the flow, the cold-boot path reaches chat-input from stopApp + launchApp {clearState,clearKeychain} after launcher-dismiss; screenshot 01 captured before navigation | AC-3 | `maestro test .maestro/rec-016-cold-boot-recovered-route-plots.yaml -e RECOVERED_ROUTE_ID=<slug>` |
| TC-4 | Flow with a bogus RECOVERED_ROUTE_ID: curated-route-detail-fallback visible, no crash, real-line absent | AC-4 | `maestro test .maestro/rec-016-cold-boot-recovered-route-plots.yaml -e RECOVERED_ROUTE_ID=nonexistent-route-slug` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- `.maestro/rec-016-cold-boot-recovered-route-plots.yaml` (NEW — the cold-boot plot flow)
- `app/(app)/curated-route/[id].tsx` (MODIFY — add ONE minimal JS-only `curated-route-detail-real-line` testID node gated on `polylines[0].coordinates.length >= 2`)
- `app/(app)/curated-route/[id].geometry-degradation.integration.test.tsx` (MODIFY — RED-first branch assertions for the new testID across ≥2-point / centroid / degenerate fixtures)

**writeProhibited:**
- `convex/**` (backend / query+gate layer — render half only; S1-T2 owns persist+query)
- Other `.maestro/*.yaml` reference flows (reuse patterns + `_common-*` helpers; don't edit them)
- `components/map/**` and unrelated screens; `shared/lib/polyline.ts` (consume `decodePolylineGeometry` as-is)

## READING LIST

- `.maestro/uc-dtl-03-with-polyline.yaml:20-54` [PRIMARY PATTERN] — launchApp clearState/clearKeychain → _common-auth → openLink deep-link → assert polyline + approximate-badge ABSENT
- `.maestro/discovery-full-gate.yaml:50-105` — cold-boot + dev-client launcher-dismiss idioms; `.maestro/_common-auth.yaml:1-51` [REUSE] launcher-dismiss + e2e-test-login
- `app/(app)/curated-route/[id].tsx:160-198,305-343` — THE render seam + the crux gap (hasPolyline=Boolean(routePolyline) string-presence); add real-line testID here
- `app/(app)/curated-route/[id].geometry-degradation.integration.test.tsx:164-278` — the branch test to extend (RED first); `shared/lib/polyline.ts:7-12` — decodePolylineGeometry → coords
- `app.json:1-50` — scheme `laneshadow` (openLink deep-link); `.spec/prds/route-agent-quality/11-e2e-testing-criteria.md:63-67,157-159` — T-REC-016 + T-SURF-006

## CODE PATTERN

- Pattern source: `.maestro/uc-dtl-03-with-polyline.yaml:20-54` (cold launch → deep-link → assert) + the hasPolyline/showApproximateBadge branch in `app/(app)/curated-route/[id].tsx:160-198`
- Anti-pattern: Using the string-presence `curated-route-detail-polyline` probe as the pass condition; warm-nav instead of cold boot; asserting LLM prose.

## VERIFICATION GATES

- PRIMARY e2e: `maestro test .maestro/rec-016-cold-boot-recovered-route-plots.yaml -e RECOVERED_ROUTE_ID=<S1-T2 slug>` → real-line visible, badge/fallback absent, screenshot captured
- Branch check: `pnpm exec vitest run 'app/(app)/curated-route/[id].geometry-degradation.integration.test.tsx'` → Exit 0
- Typecheck `pnpm type-check` → Exit 0 · Lint `pnpm exec biome check` → Exit 0
- Prereqs: booted iOS sim + dev build on Metro (localhost:8081) vs the live dev deployment; EXPO_PUBLIC_E2E=1; location pre-granted

## AGENT ASSIGNMENT

- Implementer: `react-native-ui-implementer` — A Maestro E2E flow + a minimal JS-only testID inside the RN detail screen — pure React Native UI surface work (render seam + polyline-vs-dot discrimination), no backend logic.
- Reviewer: `react-native-ui-reviewer`

## EVIDENCE GATES

- RED phase: each AC's test went red before green (TDD_STATE history).
- Integration/E2E coverage: PRIMARY AC is `e2e`.
- Scenario un-fakeable: `validate_scenario` exit 0 on the PRIMARY AC; captured EVIDENCE shows the seeded MUST_OBSERVE value (not merely "tests passed").

## DEPENDENCIES

- Depends on: S1-T2
- Blocks: —

## CONTEXT

- **Current state:** The detail screen's `curated-route-detail-polyline` probe is a string-presence check a 1-point dot passes; no cold-boot plot-verification flow exists for a recovered route.
- **Gap:** Nothing yet proves — from a cold boot, at the human surface — that a recovered route plots a real road line and not a dot.

<details>
<summary>▸ Full agent specification (TASK-TEMPLATE v5.2 — machine-readable requirement contract)</summary>

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "S1-T3",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "recovered_poc_route": {
      "description": "The single recovered ai_reconstructed PoC route persisted by S1-T2 on the live dev deployment (Twist of Tepusquet Loop; routePolyline decodes to >=2 coords; riderReady true).",
      "seed_method": "migration_fixture",
      "records": [
        "routeId slug reachable via laneshadow:///curated-route/${RECOVERED_ROUTE_ID}",
        "provenance=ai_reconstructed, geometryStatus=generated, riderReady=true"
      ]
    },
    "centroid_only_route": {
      "description": "A route with null routePolyline + a valid centroid (dot), plus a degenerate variant whose routePolyline decodes to a single point.",
      "seed_method": "migration_fixture",
      "records": [
        "routePolyline null (centroid dot)",
        "routePolyline decoding to 1 point (degenerate)"
      ]
    },
    "cold_app": {
      "description": "Killed-then-fresh app process: stopApp then launchApp {clearState:true, clearKeychain:true}; Clerk session cleared, location grant reset.",
      "seed_method": "recorded_external",
      "records": [
        "no warm JS state",
        "re-auth via e2e-test-login-button"
      ]
    },
    "absent_route": {
      "description": "A RECOVERED_ROUTE_ID with no matching curated_routes row on the dev deployment.",
      "seed_method": "recorded_external",
      "records": [
        "RECOVERED_ROUTE_ID=nonexistent-route-slug"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "maps_to_ac": null,
      "description": "GIVEN the recovered ai_reconstructed route on dev WHEN the flow cold-boots + deep-links to it THEN the real road line plots (curated-route-detail-real-line visible, >=2-pt polyline) with no dot/fallback",
      "verify": "maestro test .maestro/rec-016-cold-boot-recovered-route-plots.yaml -e RECOVERED_ROUTE_ID=<slug>",
      "scenario": {
        "id": "AC-1",
        "primary": true,
        "tier": "visible",
        "test_tier": "e2e",
        "verification_service": "Maestro (iOS simulator) against the live Convex dev deployment",
        "negative_control": {
          "would_fail_if": [
            "the route has no gate-passing geometry and plots only a centroid dot",
            "the map plots a centroid fallback (approximate badge) instead of a road line",
            "the flow asserts warm-nav (skips stopApp/clearState) instead of a cold boot",
            "the flow relies on the string-presence curated-route-detail-polyline probe, which passes for a <2-point dot (stub-equivalent)"
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
                "stopApp + launchApp {clearState,clearKeychain}; runFlow _common-auth.yaml; openLink laneshadow:///curated-route/${RECOVERED_ROUTE_ID}; wait for curated-route-detail-name + curated-detail-map"
              ]
            },
            "end_state": {
              "must_observe": [
                "testID 'curated-detail-map' visible",
                "testID 'curated-route-detail-real-line' visible (decoded polyline >= 2 points)",
                "'curated-route-detail-name' shows the recovered route name"
              ],
              "must_not_observe": [
                "testID 'curated-detail-approximate-badge' visible (centroid dot only)",
                "testID 'curated-route-detail-fallback' visible (no route)",
                "empty map with 0 route-line testIDs"
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
      "maps_to_ac": null,
      "description": "GIVEN a centroid-only/degenerate route WHEN the detail screen renders THEN curated-route-detail-real-line is ABSENT and the approximate badge shows \u2014 a dot can never satisfy the plot gate",
      "verify": "pnpm exec vitest run 'app/(app)/curated-route/[id].geometry-degradation.integration.test.tsx'",
      "scenario": {
        "id": "AC-2",
        "primary": false,
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "vitest (jsdom render-branch) against the real detail screen component",
        "negative_control": {
          "would_fail_if": [
            "the real-line probe rendered for a dot (string-presence gating instead of coord-count)",
            "the >=2-point threshold is removed so a 1-point line renders the real-line testID",
            "the Maestro flow passed against a centroid-only route (stub-equivalent)"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "centroid_only_route",
            "action": {
              "actor": "api_client",
              "steps": [
                "render the detail screen for a route with null routePolyline (centroid)"
              ]
            },
            "end_state": {
              "must_observe": [
                "testID 'curated-detail-approximate-badge' rendered for the null-polyline centroid route",
                "0 'curated-route-detail-real-line' nodes for the centroid route"
              ],
              "must_not_observe": [
                "'curated-route-detail-real-line' present for a centroid dot",
                "'curated-route-detail-real-line' present with 0 real points"
              ]
            }
          },
          {
            "start_ref": "centroid_only_route",
            "action": {
              "actor": "api_client",
              "steps": [
                "render the detail screen for a route whose routePolyline decodes to 1 point (degenerate)"
              ]
            },
            "end_state": {
              "must_observe": [
                "1 decoded point counted (< 2 threshold)",
                "0 'curated-route-detail-real-line' nodes for the 1-point line"
              ],
              "must_not_observe": [
                "'curated-route-detail-real-line' present for a 1-point degenerate line",
                "a >=2-point line claimed where none exists (empty)"
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
      "description": "GIVEN a killed+relaunched app WHEN the flow starts THEN the dev-client launcher + developer-menu are dismissed and authenticated home (chat-input) is reached BEFORE navigation \u2014 a true cold boot",
      "verify": "maestro test .maestro/rec-016-cold-boot-recovered-route-plots.yaml -e RECOVERED_ROUTE_ID=<slug>",
      "scenario": {
        "id": "AC-3",
        "primary": false,
        "tier": "visible",
        "test_tier": "e2e",
        "verification_service": "Maestro (iOS simulator) against the live Convex dev deployment",
        "negative_control": {
          "would_fail_if": [
            "the flow omits stopApp/clearState (warm start, stub-equivalent)",
            "the launcher menu blocks navigation to the detail screen (empty surface)"
          ]
        },
        "evidence": {
          "artifact_type": "screenshot",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "cold_app",
            "action": {
              "actor": "cli_user",
              "steps": [
                "stopApp; launchApp {clearState,clearKeychain}; dismiss DEVELOPMENT SERVERS picker (.*localhost:8081.*) then developer-menu popup; auth via e2e-test-login-button"
              ]
            },
            "end_state": {
              "must_observe": [
                "DEVELOPMENT SERVERS picker dismissed by tapping '.*localhost:8081.*'",
                "developer-menu popup dismissed ('Continue'/'Close'/'Reload')",
                "testID 'chat-input' visible (authenticated home reached from cold boot)"
              ],
              "must_not_observe": [
                "developer-menu overlay remaining over the app surface",
                "warm JS state reused (no launchApp clearState)"
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
      "maps_to_ac": null,
      "description": "GIVEN a RECOVERED_ROUTE_ID resolving to no row WHEN the flow deep-links to it THEN the honest curated-route-detail-fallback renders with no crash and NO fabricated line",
      "verify": "maestro test .maestro/rec-016-cold-boot-recovered-route-plots.yaml -e RECOVERED_ROUTE_ID=nonexistent-route-slug",
      "scenario": {
        "id": "AC-4",
        "primary": false,
        "tier": "visible",
        "test_tier": "e2e",
        "verification_service": "Maestro (iOS simulator) against the live Convex dev deployment",
        "negative_control": {
          "would_fail_if": [
            "the screen crashes on an absent routeId",
            "a fake line or centroid dot renders as a 'route' for a missing row (fabricated success)"
          ]
        },
        "evidence": {
          "artifact_type": "screenshot",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "absent_route",
            "action": {
              "actor": "cli_user",
              "steps": [
                "cold-boot + deep-link openLink laneshadow:///curated-route/nonexistent-route-slug"
              ]
            },
            "end_state": {
              "must_observe": [
                "testID 'curated-route-detail-fallback' visible ('Route not found')",
                "0 red-box crash surfaces"
              ],
              "must_not_observe": [
                "'curated-route-detail-real-line' visible for an absent route",
                "a fabricated road line rendered for a missing route (none exists)"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-1",
      "description": "Maestro flow on a booted iOS sim vs the live dev deployment: curated-detail-map + curated-route-detail-real-line visible; approximate-badge + fallback NOT visible; screenshot 02 captured; flow exits 0",
      "verify": "maestro test .maestro/rec-016-cold-boot-recovered-route-plots.yaml -e RECOVERED_ROUTE_ID=<slug-persisted-by-S1-T2>"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-2",
      "description": "vitest render-branch: curated-route-detail-real-line renders for the >=2-point fixture; ABSENT for the null-polyline centroid fixture; ABSENT for a degenerate <2-point fixture",
      "verify": "pnpm exec vitest run 'app/(app)/curated-route/[id].geometry-degradation.integration.test.tsx'"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-3",
      "description": "Within the flow, the cold-boot path reaches chat-input from stopApp + launchApp {clearState,clearKeychain} after launcher-dismiss; screenshot 01 captured before navigation",
      "verify": "maestro test .maestro/rec-016-cold-boot-recovered-route-plots.yaml -e RECOVERED_ROUTE_ID=<slug>"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-4",
      "description": "Flow with a bogus RECOVERED_ROUTE_ID: curated-route-detail-fallback visible, no crash, real-line absent",
      "verify": "maestro test .maestro/rec-016-cold-boot-recovered-route-plots.yaml -e RECOVERED_ROUTE_ID=nonexistent-route-slug"
    }
  ]
}
-->
</details>
