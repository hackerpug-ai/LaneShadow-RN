# DISC-020: Render chat-driven curated routes as transcript cards (curated variant; score as %/bars) + verify card→map→return-to-map loop with centroid fallback

**Sprint:** [SPRINT.md](./SPRINT.md)  
**Type:** FEATURE · **Status:** ✅ Completed · **Priority:** P1 · **Effort:** M · **Estimate:** 120 min  
**Agent:** react-native-ui-implementer · **Reviewer:** react-native-ui-reviewer  
**Proposed By:** react-native-ui-planner  
**Agent rationale:** Chat transcript curated-card rendering + reuse of the existing card→map selection loop — react-native-ui-implementer; the score-data fix is delegated to DATA-008b (convex).  

## Outcome

Chat-driven curated routes render in the transcript as a curated-variant card (name + mileage + composite score as %/bars on the 0–1 scale, visually distinct from a planned-trip card), and selecting a card plots it on the map (polyline or centroid) and returns the rider to map view.

## Specification

Chat-driven curated discovery (DATA-008/008b) produces a routing_card whose options carry curated scores; RoutingCard's CompletedCard already branches to CuratedRouteCard when option.scores?.composite != null (routing-card.tsx:247-268). DATA-008b fixes the upstream tool so options.scores.composite (and per-dimension) carry the route's real 0–1 values (the tool currently reads route.score/route.scores.* but listCuratedRoutes returns flat compositeScore/*Score → all-zero). This task ensures the curated transcript card renders correctly and the card→map→return loop works: (1) CuratedRouteCard (components/chat/cards/curated-route-card.tsx) already renders name + composite as `${Math.round(compositeScore*100)}/100` with a road icon — extend/verify it shows mileage and renders the composite as a percentage or score bars on the 0–1 scale (per DESIGN-S01-002), distinct from RouteAttachmentCard. If bars are required, reuse the ScoreDimensionBar primitive pattern (do not re-implement inline). (2) Wire CuratedRouteCard's selection through the same CompletedCard onSelect (setSelectedRouteId + setDisplayedRoutePlanId + requestFitToRouteWithReset) and ensure onViewOnMap → setChatMode(false) so tapping an earlier card re-renders it on the map and returns to map view (the RouteAttachmentCard branch already passes onViewOnMap; the CuratedRouteCard branch at routing-card.tsx:250-267 currently lacks onViewOnMap — add it for parity). (3) Verify centroid-only curated options plot via doFit's single-point fallback. Verification asserts engine outcomes (which route plots, the rendered score value) against live Convex with the curated discovery surfaced through the real routing_card path. Maps to T-DISC-010 (cards in chat, latest plots, earlier-card loop, score 0–1 as %/bars never 0–100).

## Critical Constraints

- DEPENDS ON DATA-008b: surfaced composite scores must be the route's real 0–1 values. The curated card MUST render score as a percentage (Math.round(score*100)) or bars — NEVER a raw 0–1 decimal, NEVER a raw 0–100 number, NEVER 0% for a non-zero route.
- The curated card MUST be visually distinct from a planned-trip RouteAttachmentCard (curated = name + mileage + composite score badge/bars; planned = start→end + duration + weather).
- Selecting a card MUST drive the EXISTING loop: onSelect → setSelectedRouteId + setDisplayedRoutePlanId + requestFitToRouteWithReset (routing-card.tsx CompletedCard); onViewOnMap → setChatMode(false) (index.tsx). Do NOT add a parallel selection path.
- Centroid-only curated routes MUST still plot and fit via the single-point/centroid fallback (index.tsx doFit 523-529).
- Do NOT change the NL agent prose path — assert which curated route surfaces/plots, not agent text.

## Acceptance Criteria

### AC-1: Curated transcript card shows name + mileage + composite as %/bars (0–1), distinct from planned card
*(PRIMARY)*
- **flow_ref:** `HF-DISC-10-CORE` · `.spec/scenarios/UC-DISC-10/core-chat-nl-discovery-card-map-loop.scenario.md` *(bound 2026-06-23 by /kb-e2e-retrofit --apply)*
- **GIVEN** a routing_card completed with a curated option carrying a real 0–1 compositeScore (post-DATA-008b) and a mileage
- **WHEN** CompletedCard renders the curated option
- **THEN** a CuratedRouteCard shows the road name, its mileage, and the composite as a percentage (Math.round(score*100)) or bars — never a raw 0–1 decimal, never 0–100, never 0% for a non-zero route — and it is visually distinct from a RouteAttachmentCard
- **Test tier:** `integration` · **Service:** live Convex dev (curated routing_card via discoverCuratedRoutes/listCuratedRoutes) via @testing-library/react-native
- **Verify:** `pnpm test components/chat/cards/curated-route-card.integration.test.tsx` → `curatedCardShowsScoreAsPercentOnZeroToOneScale`
- **Scenario** (start `curated_routing_card_real_scores`):
  - must observe: getByText('82%') !== null (composite rendered as Math.round(0.82*100)=82, e.g. '82%' or '82/100'), OR a score bar with fillWidth === '82%'; getByText(option.name) !== null where option.name is the real catalog road name literal (e.g. 'Tail of the Dragon'), length > 0; a mileage value matching /. \d+mi/ (e.g. '. 14mi'); the curated card uses the road-variant icon / composite badge testID (e.g. getByTestId('curated-route-card-score-badge') !== null), distinct from a start->end planned layout
  - must NOT observe: getByText('0%') !== null for a non-zero route; all score bars at fillWidth '0%'; queryByText('0.82') !== null (raw decimal shown); a start->end planned-trip card layout for the curated option
  - negative control (would fail if): would fail if DATA-008b is not applied so the tool reads the wrong field and composite renders a static 0 / 0%; would fail if the score is rendered as the raw 0.82 decimal (no *100 percentage); would fail if the card falls back to the planned RouteAttachmentCard layout (curated branch disconnected)

### AC-2: Selecting an earlier card re-renders on the map and returns to map view
- **GIVEN** a transcript containing an earlier curated routing_card in chat mode
- **WHEN** the rider presses that curated card
- **THEN** setSelectedRouteId + setDisplayedRoutePlanId fire and chatMode flips to false (map view) with that route plotted
- **Test tier:** `integration` · **Service:** live Convex dev via @testing-library/react-native
- **Verify:** `pnpm test components/chat/cards/curated-route-card.integration.test.tsx` → `earlierCuratedCardReRendersAndReturnsToMap`
- **Scenario** (start `curated_routing_card_real_scores`):
  - must observe: setDisplayedRoutePlanId called once with the card's routePlanId (=== the surfaced routing_card.routePlanId, a non-empty id string); setSelectedRouteId called once with the curated option id (=== the curated option.id); chatMode === false after press (returned to map view)
  - must NOT observe: chatMode === true after press (still in chat mode); setDisplayedRoutePlanId call count === 0 (no selection propagated); setSelectedRouteId call count === 0
  - negative control (would fail if): would fail if onViewOnMap is missing on the curated branch (a no-op) so chatMode stays true after press; would fail if the selection is not propagated to setDisplayedRoutePlanId (disconnected from the plan store); would fail if the curated card press handler is stubbed so neither setter fires

### AC-3: Centroid-only curated route plots via centroid fallback
- **GIVEN** a curated option whose geometry is a single centroid point (no overview polyline)
- **WHEN** it is selected and doFit runs
- **THEN** the map centers on the centroid via setCameraPosition zoom 12 (single-point fallback) — no crash, route represented on the map
- **Test tier:** `integration` · **Service:** live Convex dev + MapboxMapViewHandle via @testing-library/react-native
- **Verify:** `pnpm test components/chat/cards/curated-route-card.integration.test.tsx` → `centroidOnlyCuratedPlotsViaFallback`
- **Scenario** (start `curated_routing_card_centroid_only`):
  - must observe: setCameraPosition called with the centroid coordinates (latitude/longitude) and zoom === 12; setCameraPosition.mock.calls.length === 1
  - must NOT observe: fitToCoordinates called with empty coords ([]); setCameraPosition call count === 0 (no camera move); an exception thrown for the single-point geometry
  - negative control (would fail if): would fail if a centroid-only option crashes doFit (single-point branch missing); would fail if doFit is a no-op so no camera move occurs for a single-point route; would fail if the geometry decode is stubbed/empty so fitToCoordinates is called with []

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Curated card renders composite as Math.round(score*100) %/bars (0–1), with name + mileage, distinct from planned card; never 0% for a non-zero route. | AC-1 | `pnpm test components/chat/cards/curated-route-card.integration.test.tsx -t curatedCardShowsScoreAsPercentOnZeroToOneScale` |
| TC-2 | Pressing an earlier curated card calls setSelectedRouteId + setDisplayedRoutePlanId and flips chatMode false. | AC-2 | `pnpm test components/chat/cards/curated-route-card.integration.test.tsx -t earlierCuratedCardReRendersAndReturnsToMap` |
| TC-3 | Centroid-only curated option → doFit single-point branch (setCameraPosition zoom 12), no crash. | AC-3 | `pnpm test components/chat/cards/curated-route-card.integration.test.tsx -t centroidOnlyCuratedPlotsViaFallback` |

## Reading List

- `components/chat/routing-card.tsx` (229-289) — PRIMARY — CompletedCard curated branch (isCurated → CuratedRouteCard at 247-268) and the planned branch's onViewOnMap (279-281) to mirror for curated parity
- `components/chat/cards/curated-route-card.tsx` (1-110) — the curated card to extend: composite rendered as `${Math.round(compositeScore*100)}/100` (line 26) + road icon; add mileage + %/bars
- `app/(app)/(tabs)/index.tsx` (503-542, 1234-1242) — doFit centroid fallback (523-529) + ChatTranscript onViewOnMap={() => setChatMode(false)} — the return-to-map handler
- `convex/actions/agent/tools/discoverCuratedRoutes.ts` (132-186) — the option.scores shape the card consumes (DATA-008b fixes route.score→compositeScore etc.); centroid polyline fallback at encodeCentroidToPolyline
- `.spec/prds/mvp/10-e2e-testing-criteria.md` (85-89) — T-DISC-010 pass/fail — cards in chat, latest plots, earlier-card loop, score 0–1 as bars/percent never 0–100

## Guardrails

- ONE curated card variant, props-driven — no per-score-style files; reuse ScoreDimensionBar for bars.
- All colors/spacing via useSemanticTheme; score fill uses semantic.color.primary.default (copper).
- Card touch target >=44pt (minHeight 60 already).

## Design

- ref: DESIGN-S01-002 (curated-route chat-card variant: composite score as %/bars on 0–1; distinct from a planned-trip routing card)
- ref: 10-design-system.md §2 (ScoreDimensionBar primitive — fill width Math.round(score*100)%, copper fill, 8dp height)
- ref: 10-design-system.md §1 (token rules: composite via semantic.type.title.lg / instrument font for numeric)

## Verification Gates

| Gate | Command |
|------|---------|
| test | `pnpm test components/chat/cards/curated-route-card.integration.test.tsx` |
| typecheck | `pnpm type-check` |
| lint | `pnpm exec biome check components/chat/cards/curated-route-card.tsx components/chat/routing-card.tsx 'app/(app)/(tabs)/index.tsx' components/chat/cards/curated-route-card.integration.test.tsx` |
| scope | `git diff --name-only ⊆ scope.write_allowed` |
| scenario | `RED-against-empty: AC-1 must FAIL before DATA-008b (composite renders 0% / all-zero bars) — confirms the card surfaces real scores, not a static 0` |
| human_gate | `Folds into T-DISC-010 (real device): NL request → curated cards in chat with real non-zero score %/bars, latest plots, earlier-card loop returns to map` |

## Coding Standards

- No `any` on the curated option/score shape; type the composite + per-dimension scores as number (0–1).
- Reuse the existing selection callbacks; no parallel selection path.
- Integration test surfaces the curated routing_card via the real discovery path against live Convex; Mapbox handle stubbed only at the native boundary, Convex data NOT mocked.

## Dependencies

- Depends on: DATA-008b (real 0–1 scores in curated options), DATA-008 (curated routing_card seam)
- Blocks: None
- Parallel: DISC-018, DISC-019

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "fixtures": {
    "curated_routing_card_real_scores": {
      "description": "a completed routing_card from the real discovery tool (post-DATA-008b) with curated options carrying real 0\u20131 compositeScore (~0.82) + per-dimension scores + mileage, surfaced against live Convex",
      "seed_method": "migration_fixture",
      "records": [
        "routing_card option with scores.composite ~0.82",
        "option label = real road name",
        "distanceMi/mileage populated"
      ]
    },
    "curated_routing_card_centroid_only": {
      "description": "a curated option whose overviewGeometry encodes a single centroid point (no multi-point polyline)",
      "seed_method": "migration_fixture",
      "records": [
        "geometry decodes to exactly 1 coordinate (centroidLat/Lng)"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN a routing_card completed with a curated option carrying a real 0\u20131 compositeScore (post-DATA-008b) and a mileage WHEN CompletedCard renders the curated option THEN a CuratedRouteCard shows the road name, its mileage, and the composite as a percentage (Math.round(score*100)) or bars \u2014 never a raw 0\u20131 decimal, never 0\u2013100, never 0% for a non-zero route \u2014 and it is visually distinct from a RouteAttachmentCard",
      "verify": "pnpm test components/chat/cards/curated-route-card.integration.test.tsx` \u2192 `curatedCardShowsScoreAsPercentOnZeroToOneScale",
      "scenario": {
        "start_ref": "curated_routing_card_real_scores",
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "live Convex dev (curated routing_card via discoverCuratedRoutes/listCuratedRoutes) via @testing-library/react-native",
        "negative_control": {
          "would_fail_if": [
            "would fail if DATA-008b is not applied so the tool reads the wrong field and composite renders a static 0 / 0%",
            "would fail if the score is rendered as the raw 0.82 decimal (no *100 percentage)",
            "would fail if the card falls back to the planned RouteAttachmentCard layout (curated branch disconnected)"
          ]
        },
        "evidence": {
          "artifact_type": "screenshot",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "curated_routing_card_real_scores",
            "action": {
              "actor": "api_client",
              "steps": [
                "surface a curated routing_card via the real discovery tool against live Convex for a route with compositeScore ~0.82",
                "render CompletedCard",
                "read the curated card's score text/bars and name/mileage"
              ]
            },
            "end_state": {
              "must_observe": [
                "getByText('82%') !== null (composite rendered as Math.round(0.82*100)=82, e.g. '82%' or '82/100'), OR a score bar with fillWidth === '82%'",
                "getByText(option.name) !== null where option.name is the real catalog road name literal (e.g. 'Tail of the Dragon'), length > 0",
                "a mileage value matching /. \\d+mi/ (e.g. '. 14mi')",
                "the curated card uses the road-variant icon / composite badge testID (e.g. getByTestId('curated-route-card-score-badge') !== null), distinct from a start->end planned layout"
              ],
              "must_not_observe": [
                "getByText('0%') !== null for a non-zero route",
                "all score bars at fillWidth '0%'",
                "queryByText('0.82') !== null (raw decimal shown)",
                "a start->end planned-trip card layout for the curated option"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN a transcript containing an earlier curated routing_card in chat mode WHEN the rider presses that curated card THEN setSelectedRouteId + setDisplayedRoutePlanId fire and chatMode flips to false (map view) with that route plotted",
      "verify": "pnpm test components/chat/cards/curated-route-card.integration.test.tsx` \u2192 `earlierCuratedCardReRendersAndReturnsToMap",
      "scenario": {
        "start_ref": "curated_routing_card_real_scores",
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "live Convex dev via @testing-library/react-native",
        "negative_control": {
          "would_fail_if": [
            "would fail if onViewOnMap is missing on the curated branch (a no-op) so chatMode stays true after press",
            "would fail if the selection is not propagated to setDisplayedRoutePlanId (disconnected from the plan store)",
            "would fail if the curated card press handler is stubbed so neither setter fires"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "curated_routing_card_real_scores",
            "action": {
              "actor": "user",
              "steps": [
                "render the plan view in chat mode (chatMode === true) with an earlier curated routing_card",
                "fireEvent.press the curated card",
                "assert setSelectedRouteId + setDisplayedRoutePlanId received the option/plan ids and onViewOnMap fired (chatMode false)"
              ]
            },
            "end_state": {
              "must_observe": [
                "setDisplayedRoutePlanId called once with the card's routePlanId (=== the surfaced routing_card.routePlanId, a non-empty id string)",
                "setSelectedRouteId called once with the curated option id (=== the curated option.id)",
                "chatMode === false after press (returned to map view)"
              ],
              "must_not_observe": [
                "chatMode === true after press (still in chat mode)",
                "setDisplayedRoutePlanId call count === 0 (no selection propagated)",
                "setSelectedRouteId call count === 0"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN a curated option whose geometry is a single centroid point (no overview polyline) WHEN it is selected and doFit runs THEN the map centers on the centroid via setCameraPosition zoom 12 (single-point fallback) \u2014 no crash, route represented on the map",
      "verify": "pnpm test components/chat/cards/curated-route-card.integration.test.tsx` \u2192 `centroidOnlyCuratedPlotsViaFallback",
      "scenario": {
        "start_ref": "curated_routing_card_centroid_only",
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "live Convex dev + MapboxMapViewHandle via @testing-library/react-native",
        "negative_control": {
          "would_fail_if": [
            "would fail if a centroid-only option crashes doFit (single-point branch missing)",
            "would fail if doFit is a no-op so no camera move occurs for a single-point route",
            "would fail if the geometry decode is stubbed/empty so fitToCoordinates is called with []"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "curated_routing_card_centroid_only",
            "action": {
              "actor": "user",
              "steps": [
                "select a centroid-only curated option (geometry decodes to 1 coordinate)",
                "assert doFit takes the single-point branch"
              ]
            },
            "end_state": {
              "must_observe": [
                "setCameraPosition called with the centroid coordinates (latitude/longitude) and zoom === 12",
                "setCameraPosition.mock.calls.length === 1"
              ],
              "must_not_observe": [
                "fitToCoordinates called with empty coords ([])",
                "setCameraPosition call count === 0 (no camera move)",
                "an exception thrown for the single-point geometry"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "Curated card renders composite as Math.round(score*100) %/bars (0\u20131), with name + mileage, distinct from planned card; never 0% for a non-zero route.",
      "maps_to_ac": "AC-1",
      "verify": "pnpm test components/chat/cards/curated-route-card.integration.test.tsx -t curatedCardShowsScoreAsPercentOnZeroToOneScale"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Pressing an earlier curated card calls setSelectedRouteId + setDisplayedRoutePlanId and flips chatMode false.",
      "maps_to_ac": "AC-2",
      "verify": "pnpm test components/chat/cards/curated-route-card.integration.test.tsx -t earlierCuratedCardReRendersAndReturnsToMap"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "Centroid-only curated option \u2192 doFit single-point branch (setCameraPosition zoom 12), no crash.",
      "maps_to_ac": "AC-3",
      "verify": "pnpm test components/chat/cards/curated-route-card.integration.test.tsx -t centroidOnlyCuratedPlotsViaFallback"
    }
  ]
}
-->
