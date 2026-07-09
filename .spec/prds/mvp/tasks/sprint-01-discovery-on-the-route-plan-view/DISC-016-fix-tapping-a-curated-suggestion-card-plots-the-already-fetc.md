# DISC-016: FIX: tapping a curated suggestion card plots the already-fetched route on the map directly (no chat round-trip)

**Sprint:** [SPRINT.md](./SPRINT.md)  
**Type:** FEATURE · **Status:** ✅ Completed · **Priority:** P0 · **Effort:** M · **Estimate:** 150 min  
**Agent:** react-native-ui-implementer · **Reviewer:** react-native-ui-reviewer  
**Proposed By:** react-native-ui-planner  
**Agent rationale:** Core plan-view UI wiring fix touching index.tsx state, SelectedRouteContext, and the Mapbox fit seam — squarely react-native-ui-implementer territory; no Convex schema/query change required.  

## Outcome

Tapping a curated suggestion card plots that exact curated route (its polyline, or centroid for geometry-less routes) on the map and fits the camera, with NO chat message appended to the transcript.

## Specification

Today index.tsx wires the suggestion card to handleSelectCuratedRoute (lines 386-395), which calls handleSendMessage('Show me curated route {name}') — sending a chat message to the NL agent instead of plotting the route the hook already fetched. Per UC-DISC-09 AC3 and T-DISC-009 the tap must plot the curated route DIRECTLY. Rewire so the tapped curated route is rendered through the SAME machinery the chat-driven curated results already ride: a routing_card-backed plan resolved by useActiveSessionRoute, selected via SelectedRouteContext (setSelectedRouteId + setDisplayedRoutePlanId), drawn by buildRoutePolylines → RoutePolyline, and framed by doFit (decodePolylineGeometry → fitToCoordinates for multi-point, or setCameraPosition zoom 12 for the single-point/centroid case at index.tsx:523-529). The curated suggestion row from useCuratedDiscovery carries {id,name,lat,lng,score,distanceMi}; geometry comes from the curated detail/plan path. Implementation approach (the implementer chooses the minimal seam consistent with the existing card→map loop): construct a curated route_plan for the tapped routeId via the existing curated-discovery tool/mutation seam (the same DATA-008 path that builds a routing_card with a centroid-or-polyline option), then set displayedRoutePlanId + selectedRouteId so useActiveSessionRoute resolves it and the auto-fit effect (index.tsx:621-629) frames it — WITHOUT appending a rider/agent text message to session_messages. The acceptance bar is observable: the tapped route's geometry renders on the map (home-route-polyline) and the transcript message count does NOT increase. NL parsing/prose is out of scope; the surfaced route is asserted, not agent text. Maps to T-DISC-009 (card-tap → plot).

## Critical Constraints

- NEVER send a chat message on suggestion-card tap. The current handleSelectCuratedRoute → handleSendMessage('Show me curated route {name}') (index.tsx:386-395) is the core bug and MUST be removed — a round-trip to the NL agent is forbidden for this affordance.
- Plot DIRECTLY through the EXISTING route machinery (routing_card → useActiveSessionRoute → RoutePolyline → doFit). Do NOT introduce a second map render path or a new polyline component.
- Centroid-only routes (most of the catalog lacks geometry) MUST still plot: drive the existing single-point/centroid fallback in doFit (index.tsx:523-529, decodePolylineGeometry coords.length===1 → setCameraPosition zoom 12).
- PRESERVE the testID `discovery-suggestion-pill-{routeId}` on the card (chat-input.tsx:105) — the e2e harness keys off it.
- Do NOT regress the existing chat-driven flow (DISC-020) or the NL send path for typed messages — only the card-tap path changes.

## Acceptance Criteria

### AC-1: Card tap plots the exact route with no chat message
*(PRIMARY)*
- **flow_ref:** `HF-DISC-09-CORE` · `.spec/scenarios/UC-DISC-09/core-suggestion-card-direct-plot.scenario.md` *(bound 2026-06-23 by /kb-e2e-retrofit --apply)*
- **GIVEN** the plan view with no route on the map and curated suggestion cards from useCuratedDiscovery (live Convex), and a current transcript message count N
- **WHEN** the rider taps discovery-suggestion-pill-{routeId} for a known curated route
- **THEN** that route's geometry (polyline or centroid marker) renders on the map AND the transcript message count is still N (no message appended)
- **Test tier:** `PRIMARY` · **Service:** real-device Maestro + live Convex dev
- **Verify:** `.maestro/discovery-full-gate.yaml` (steps 3-4: tap suggestion → route plots, no chat message)
- **Supplementary verify:** `pnpm test app/(app)/(tabs)/index.discovery.integration.test.tsx` → `tapPlotsRouteWithoutChatMessage` (vitest @testing-library/react-native mocked wiring)
- **Scenario** (start `plan_view_no_route_with_cards`):
  - must observe: home-route-polyline renders the tapped route's coordinates (a coordinate near the known route's centroidLat/Lng, e.g. lat=~35.59); queryByTestId('home-route-polyline') !== null; transcript message count === N (unchanged)
  - must NOT observe: a new transcript bubble containing 'Show me curated route'; transcript count === N+1; queryByTestId('home-route-polyline') === null (empty map / no polyline after tap); 0 polyline coordinates rendered
  - negative control (would fail if): would fail if the tap still calls handleSendMessage (the stub/old path) — transcript count goes to N+1; would fail if the card path is disconnected from the route machinery so no polyline/centroid renders (empty map); would fail if a session_messages row is appended on tap

### AC-2: Camera fits to the plotted route (polyline or centroid)
- **GIVEN** a tapped curated route that either has multi-point geometry or only a centroid
- **WHEN** the route is plotted
- **THEN** doFit frames it — fitToCoordinates for a multi-point polyline, or setCameraPosition zoom 12 centered on the centroid for a single-point route
- **Test tier:** `PRIMARY` · **Service:** real-device Maestro + live Convex dev
- **Verify:** `.maestro/discovery-full-gate.yaml` (step 3: route plots and camera fits)
- **Supplementary verify:** `pnpm test app/(app)/(tabs)/index.discovery.integration.test.tsx` → `cameraFitsTappedRouteIncludingCentroid` (vitest @testing-library/react-native mocked wiring)
- **Scenario** (start `plan_view_no_route_with_cards`):
  - must observe: setCameraPosition called with coordinates matching the route centroid (latitude/longitude) and zoom === 12; setCameraPosition.mock.calls.length === 1
  - must NOT observe: setCameraPosition call count === 0 (no camera call after tap); fitToCoordinates called with an empty coords array ([])
  - negative control (would fail if): would fail if doFit is never invoked for the tapped route (no-op fit handler); would fail if a centroid-only route leaves the camera static/unmoved or crashes; would fail if the card path is stubbed/disconnected so the map handle receives no setCameraPosition/fitToCoordinates call

### AC-3: No regression to typed-message chat flow
- **GIVEN** the plan view
- **WHEN** the rider types and sends a real NL message via the input (not a card)
- **THEN** handleSendMessage still fires and a transcript message is appended (card-tap rewire did not break the send path)
- **Test tier:** `PRIMARY` · **Service:** real-device Maestro + live Convex dev
- **Verify:** `.maestro/discovery-full-gate.yaml` (steps 5-8: typed messages send, chat works)
- **Supplementary verify:** `pnpm test app/(app)/(tabs)/index.discovery.integration.test.tsx` → `typedMessageStillSends` (vitest @testing-library/react-native mocked wiring)
- **Scenario** (start `plan_view_no_route_with_cards`):
  - must observe: transcript count === N+1 after send; a transcript bubble whose text === 'twisties near Asheville'
  - must NOT observe: transcript count === N (unchanged — send is a no-op); queryByText('twisties near Asheville') === null after send; transcript count === 0 after the send (empty — nothing persisted)
  - negative control (would fail if): would fail if removing the card-send path also removed the input send path (handleSendMessage becomes a no-op for typed messages)

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Tapping the pill renders home-route-polyline for the tapped route and appends zero session_messages. | AC-1 | `maestro test .maestro/discovery-full-gate.yaml` (steps 3-4) + `pnpm test app/(app)/(tabs)/index.discovery.integration.test.tsx -t tapPlotsRouteWithoutChatMessage` |
| TC-2 | Centroid-only tap → setCameraPosition zoom 12; multi-point tap → fitToCoordinates with >1 coord. | AC-2 | `maestro test .maestro/discovery-full-gate.yaml` (step 3) + `pnpm test app/(app)/(tabs)/index.discovery.integration.test.tsx -t cameraFitsTappedRouteIncludingCentroid` |
| TC-3 | Typed-and-sent NL message still appends a transcript row (send path intact). | AC-3 | `maestro test .maestro/discovery-full-gate.yaml` (steps 5-8) + `pnpm test app/(app)/(tabs)/index.discovery.integration.test.tsx -t typedMessageStillSends` |

## Reading List

- `app/(app)/(tabs)/index.tsx` (385-395, 503-542, 620-681, 1375-1391) — PRIMARY — the buggy handleSelectCuratedRoute, doFit (centroid fallback at 523-529), auto-fit effect, and the ChatInput onSelectRoute wiring to rewire
- `components/chat/routing-card.tsx` (229-289) — CompletedCard onSelect = setSelectedRouteId + setDisplayedRoutePlanId + requestFitToRouteWithReset — the exact card→map plot seam to reuse
- `hooks/use-active-session-route.ts` (28-96) — how displayedRoutePlanId/selectedRouteId resolve to activeOption that index.tsx plots — drive this without a chat message
- `convex/actions/agent/tools/discoverCuratedRoutes.ts` (104-186) — how a curated route_plan/options (centroid polyline fallback) is constructed — the plan shape to resolve for a tapped route
- `.spec/prds/mvp/10-e2e-testing-criteria.md` (79-83) — T-DISC-009 pass/fail — tap plots correct route, NO IDLE prompts, cards hide/return

## Guardrails

- ONE plan-view screen, state-driven — no new per-variant screen or second map path.
- Reuse buildRoutePolylines + RoutePolyline + doFit; do not reimplement plotting.
- All new colors/spacing via useSemanticTheme(); no hardcoded hex.
- Touch target on the card stays >=44pt (chat-input.tsx already enforces minHeight 44).

## Design

- ref: DESIGN-S01-001 (suggestion-card visual: copper accent + road icon, hidden when a route is shown)
- ref: 07-ui-infrastructure.md §1 (suggestion slot re-keyed to 'no active route on map'; tap → plot via existing machinery)
- ref: 10-design-system.md §1 (surface.glass for overlays)

## Verification Gates

| Gate | Command |
|------|---------|
| test | `maestro test .maestro/discovery-full-gate.yaml` |
| typecheck | `pnpm type-check` |
| lint | `pnpm exec biome check 'app/(app)/(tabs)/index.tsx' 'app/(app)/(tabs)/index.discovery.integration.test.tsx'` |
| scope | `git diff --name-only ⊆ scope.write_allowed` |
| scenario | `RED-against-bug: the PRIMARY test must FAIL on the current handleSendMessage implementation (transcript count increments / no polyline) before the rewire makes it pass` |
| human_gate | `On-device confirmation folds into T-DISC-009 / T-DISC-001 (real iOS+Android, live Convex): tap a card → exact route plots, no chat message` |

## Coding Standards

- Remove dead code: the 'Show me curated route {name}' string and its send path.
- No `any` leakage on the plan/option shape passed to setDisplayedRoutePlanId.
- Integration test renders the real screen against live Convex — Mapbox native handle stubbed only at the native boundary (assert the handle's fitToCoordinates/setCameraPosition calls), Convex data NOT mocked.

## Dependencies

- Depends on: DISC-002 (verified useCuratedDiscovery), DATA-008 (curated route_plan/routing_card seam)
- Blocks: DISC-018 (visibility keyed to hasActiveRoute relies on tap→plot working)
- Parallel: DISC-017 (same file — coordinate edits; sequence DISC-016 then DISC-017 if conflict)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "fixtures": {
    "plan_view_no_route_with_cards": {
      "description": "plan view rendered against live Convex dev, signed-in, no active route plan, useCuratedDiscovery returning >=1 curated suggestion card with a known routeId (one centroid-only, one with geometry)",
      "seed_method": "migration_fixture",
      "records": [
        "live curated catalog seeded",
        "a known centroid-only route id",
        "a known route id with overview geometry",
        "transcript empty (message count 0)"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN the plan view with no route on the map and curated suggestion cards from useCuratedDiscovery (live Convex), and a current transcript message count N WHEN the rider taps discovery-suggestion-pill-{routeId} for a known curated route THEN that route's geometry (polyline or centroid marker) renders on the map AND the transcript message count is still N (no message appended)",
      "verify": ".maestro/discovery-full-gate.yaml",
      "supplementary_verify": "pnpm test app/(app)/(tabs)/index.discovery.integration.test.tsx` → `tapPlotsRouteWithoutChatMessage",
      "scenario": {
        "start_ref": "plan_view_no_route_with_cards",
        "tier": "visible",
        "test_tier": "PRIMARY",
        "verification_service": "real-device Maestro + live Convex dev",
        "negative_control": {
          "would_fail_if": [
            "would fail if the tap still calls handleSendMessage (the stub/old path) — transcript count goes to N+1",
            "would fail if the card path is disconnected from the route machinery so no polyline/centroid renders (empty map)",
            "would fail if a session_messages row is appended on tap"
          ]
        },
        "evidence": {
          "artifact_type": "screenshot",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "plan_view_no_route_with_cards",
            "action": {
              "actor": "user",
              "steps": [
                "render the plan view against live Convex with no active route",
                "capture transcript message count N",
                "fireEvent.press(getByTestId('discovery-suggestion-pill-' + knownRouteId))",
                "await the map to resolve the tapped plan"
              ]
            },
            "end_state": {
              "must_observe": [
                "home-route-polyline renders the tapped route's coordinates (a coordinate near the known route's centroidLat/Lng, e.g. lat=~35.59)",
                "queryByTestId('home-route-polyline') !== null",
                "transcript message count === N (unchanged)"
              ],
              "must_not_observe": [
                "a new transcript bubble containing 'Show me curated route'",
                "transcript count === N+1",
                "queryByTestId('home-route-polyline') === null (empty map / no polyline after tap)",
                "0 polyline coordinates rendered"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN a tapped curated route that either has multi-point geometry or only a centroid WHEN the route is plotted THEN doFit frames it — fitToCoordinates for a multi-point polyline, or setCameraPosition zoom 12 centered on the centroid for a single-point route",
      "verify": ".maestro/discovery-full-gate.yaml",
      "supplementary_verify": "pnpm test app/(app)/(tabs)/index.discovery.integration.test.tsx` → `cameraFitsTappedRouteIncludingCentroid",
      "scenario": {
        "start_ref": "plan_view_no_route_with_cards",
        "tier": "visible",
        "test_tier": "PRIMARY",
        "verification_service": "real-device Maestro + live Convex dev",
        "negative_control": {
          "would_fail_if": [
            "would fail if doFit is never invoked for the tapped route (no-op fit handler)",
            "would fail if a centroid-only route leaves the camera static/unmoved or crashes",
            "would fail if the card path is stubbed/disconnected so the map handle receives no setCameraPosition/fitToCoordinates call"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "plan_view_no_route_with_cards",
            "action": {
              "actor": "user",
              "steps": [
                "tap a centroid-only curated route (no overview geometry)",
                "assert the map handle received setCameraPosition with the centroid coords and zoom 12"
              ]
            },
            "end_state": {
              "must_observe": [
                "setCameraPosition called with coordinates matching the route centroid (latitude/longitude) and zoom === 12",
                "setCameraPosition.mock.calls.length === 1"
              ],
              "must_not_observe": [
                "setCameraPosition call count === 0 (no camera call after tap)",
                "fitToCoordinates called with an empty coords array ([])"
              ]
            }
          },
          {
            "start_ref": "plan_view_no_route_with_cards",
            "action": {
              "actor": "user",
              "steps": [
                "tap a curated route WITH multi-point geometry",
                "assert fitToCoordinates received >1 coordinate"
              ]
            },
            "end_state": {
              "must_observe": [
                "fitToCoordinates called with coords.length > 1 (e.g. coords.length === 24)"
              ],
              "must_not_observe": [
                "setCameraPosition zoom 12 used for a multi-point route (wrong branch taken)",
                "fitToCoordinates called with coords.length === 0 (empty / no fit)"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN the plan view WHEN the rider types and sends a real NL message via the input (not a card) THEN handleSendMessage still fires and a transcript message is appended (card-tap rewire did not break the send path)",
      "verify": ".maestro/discovery-full-gate.yaml",
      "supplementary_verify": "pnpm test app/(app)/(tabs)/index.discovery.integration.test.tsx` → `typedMessageStillSends",
      "scenario": {
        "start_ref": "plan_view_no_route_with_cards",
        "tier": "visible",
        "test_tier": "PRIMARY",
        "verification_service": "real-device Maestro + live Convex dev",
        "negative_control": {
          "would_fail_if": [
            "would fail if removing the card-send path also removed the input send path (handleSendMessage becomes a no-op for typed messages)"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "plan_view_no_route_with_cards",
            "action": {
              "actor": "user",
              "steps": [
                "capture transcript message count N (== 0 from the empty fixture)",
                "type 'twisties near Asheville' into chat-input-text-field",
                "press chat-input-send-button",
                "await transcript"
              ]
            },
            "end_state": {
              "must_observe": [
                "transcript count === N+1 after send",
                "a transcript bubble whose text === 'twisties near Asheville'"
              ],
              "must_not_observe": [
                "transcript count === N (unchanged — send is a no-op)",
                "queryByText('twisties near Asheville') === null after send",
                "transcript count === 0 after the send (empty — nothing persisted)"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "Tapping the pill renders home-route-polyline for the tapped route and appends zero session_messages.",
      "maps_to_ac": "AC-1",
      "verify": "maestro test .maestro/discovery-full-gate.yaml + pnpm test app/(app)/(tabs)/index.discovery.integration.test.tsx -t tapPlotsRouteWithoutChatMessage"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Centroid-only tap → setCameraPosition zoom 12; multi-point tap → fitToCoordinates with >1 coord.",
      "maps_to_ac": "AC-2",
      "verify": "maestro test .maestro/discovery-full-gate.yaml + pnpm test app/(app)/(tabs)/index.discovery.integration.test.tsx -t cameraFitsTappedRouteIncludingCentroid"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "Typed-and-sent NL message still appends a transcript row (send path intact).",
      "maps_to_ac": "AC-3",
      "verify": "maestro test .maestro/discovery-full-gate.yaml + pnpm test app/(app)/(tabs)/index.discovery.integration.test.tsx -t typedMessageStillSends"
    }
  ]
}
-->
