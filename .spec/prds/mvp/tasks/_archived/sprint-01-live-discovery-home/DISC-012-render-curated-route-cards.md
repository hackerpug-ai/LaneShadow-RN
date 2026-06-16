# DISC-012: Render curated routes as cards in the transcript and wire the existing card→map→pin-back loop (centroid fallback; 0–1 scores as bars/%)

| Field | Value |
|---|---|
| Sprint | [sprint-01-live-discovery-home](./SPRINT.md) |
| Type | FEATURE |
| Agent | implementer = `react-native-ui-implementer` · reviewer = `react-native-ui-reviewer` |
| Estimate | L |
| Priority | P1 |
| Status | Backlog |
| Proposed By | react-native-ui-planner |
| Depends on | DATA-008 |
| Blocks | DISC-015 |
| PRD refs | DELTA-001 §2/§5(UC-DISC-10)/§6/§7/§8 · ROADMAP Sprint 01 (DISC-012) · 05-uc-disc UC-DISC-10 |

## Background

DATA-008 gives the chat agent a tool that surfaces curated routes through the existing `routing_card → route_options` contract. This task renders those curated route_options as cards in the transcript and wires them into the EXISTING card→map→pin-back loop (`route-attachment-card.tsx:119` handlePress → onSelect+onViewOnMap; `routing-card.tsx:251` setSelectedRouteId/setDisplayedRoutePlanId; `index.tsx:1209` onViewOnMap→setChatMode(false)). `RouteAttachmentCard` is type-coupled to `PlannedRouteOptionsView` (stats.durationSeconds, map.legs, overlaysPreview) and is INCOMPATIBLE with the curated shape, so this builds a curated card VARIANT (not a fork of the planned-route loop) that calls onSelect(routeId)+onViewOnMap() identically. ~45% of the catalog has no polyline, so the map-fit path must center on a single-point centroid; composite scores render on the raw 0–1 scale as a bar/%, never 0–100.

## Critical constraints

- Curated routes ride the EXISTING routing_card → RouteAttachmentCard → map → pin-back loop (route-attachment-card.tsx:119 handlePress → onSelect+onViewOnMap; routing-card.tsx:251 setSelectedRouteId/setDisplayedRoutePlanId; index.tsx:1209 onViewOnMap→setChatMode(false)). Do NOT build a parallel transcript renderer.
- RouteAttachmentCard is coupled to the PlannedRouteOptionsView shape — if the DATA-008 curated route_options do not fit that shape, build a curated card VARIANT (not a fork of the planned-route loop); the card must still call onSelect(routeId)+onViewOnMap() identically.
- Centroid-only curated routes (~45% of catalog have no routePolyline) MUST still fit on the map — the map-fit (doFit / fitToCoordinates) path must handle a single-point centroid (fall back to setCameraPosition on the centroid when there is no polyline).
- Composite scores render as bars/% on the raw 0–1 scale — NEVER 0–100, never a "92".
- Discovery is a STATE of index.tsx — no new screen, no NavigationStack push; use useSemanticTheme() tokens only.

## Specification

**Objective:** Curated routes returned by the agent (DATA-008 routing_card route_options) render as cards in the transcript; the latest plots on the map, tapping an earlier card re-renders it and returns to map view, and centroid-only routes still fit on the map.

**Success state:** Curated routes returned by the agent (DATA-008 routing_card route_options) render as cards in the transcript; the latest plots on the map, tapping an earlier card re-renders it and returns to map view, and centroid-only routes still fit on the map. Verified end-to-end on a real iOS Simulator against a live Convex deployment (the negative controls below bite an empty/static/disconnected build).

## Acceptance criteria

- **AC-1** (PRIMARY) — Curated routes render as cards and latest plots on the map. **GIVEN** The agent (DATA-008) returns curated routes as a routing_card with ≥2 curated route_options for an NL request **WHEN** The transcript renders the routing_card **THEN** Each curated route appears as a card and the latest curated route plots on the map. _test_tier: e2e · service: iOS Simulator + live Convex._ **Oracle:** observe card titled "Tail of the Dragon"; card titled "Cherohala Skyway"; exactly 1 latest curated route plotted on the map; must NOT observe any of the 8 MOCK_ROUTES; 0 cards; empty map after routing_card completes. **Negative control:** 0 cards (empty); the 8 MOCK_ROUTES appear (static); DATA-008 disconnected, no curated options (disconnect); static card shell with no map plot (stub).
- **AC-2** — Tapping an earlier curated card re-renders it and returns to map view. **GIVEN** Two curated route cards in the transcript with the latest plotted on the map **WHEN** The rider taps the EARLIER curated card **THEN** That route re-renders on the map and the view returns to map mode (chatMode false). _test_tier: e2e · service: iOS Simulator + live Convex._ **Oracle:** observe the map back in map mode with 0 transcript overlays (transcript hidden); "Cherohala Skyway" plotted/selected; must NOT observe transcript still over the map (start/empty signature: 0 / none present); "Tail of the Dragon" still plotted. **Negative control:** tap is a no-op; tap selects but never calls onViewOnMap (stays in chat) (disconnect); map still shows the latest not the tapped route.
- **AC-3** — Centroid-only curated route still fits on the map. **GIVEN** A curated route with NO routePolyline (centroid only) **WHEN** It is plotted (latest or tapped) **THEN** The map centers/fits to its centroid rather than failing to fit. _test_tier: e2e · service: iOS Simulator + live Convex._ **Oracle:** observe exactly 1 centroid marker on the map; camera centered near 35.3,-83.9; must NOT observe camera unchanged (no fit); blank map with no centroid marker. **Negative control:** doFit early-returns on empty coords (no-op); centroid route renders nothing (empty); camera stays on previous bounds (disconnect).
- **AC-4** — Composite scores render as 0–1 bars/%. **GIVEN** A curated route card carrying a composite score on the 0–1 scale (e.g. 0.86) **WHEN** The card renders **THEN** The score shows as a bar or percentage (e.g. "86%"), never a 0–100 number like "86" without units and never "92/100". _test_tier: e2e · service: iOS Simulator + live Convex._ **Oracle:** observe a "%" suffix or filled bar reflecting ~0.86; a value within 0–100% e.g. "86%"; must NOT observe a bare "86" with no % and no bar; any value >100 or "/100". **Negative control:** raw 0–100 integer rendered (wrong scale); value >100 (bug); no score element (empty).

## Test criteria

| ID | Statement | Maps to | Verify |
|---|---|---|---|
| TC-1 | Curated cards reuse the routing_card onSelect+onViewOnMap wiring (no parallel selection path) | AC-2 | `grep -n 'onViewOnMap' components/chat/cards/curated-route-card.tsx` |
| TC-2 | Type-check + lint clean | AC-1 | `pnpm type-check && pnpm lint` |

## Reading list

- `components/chat/routing-card.tsx:221-265` — [PRIMARY PATTERN] CompletedCard — the exact onSelect(setSelectedRouteId+setDisplayedRoutePlanId+requestFitToRouteWithReset)+onViewOnMap wiring curated cards must reuse.
- `components/chat/route-attachment-card.tsx:72-167` — RouteAttachmentCard contract (coupled to PlannedRouteOptionsView) — decide reuse vs. curated variant; read-only.
- `app/(app)/(tabs)/index.tsx:480-512, 590-599` — doFit + the auto-fit effect — where the centroid fallback must be added (coords.length===0 → setCameraPosition on centroid).
- `components/ui/chat-transcript.tsx:307-369` — CardRow / CARD_REGISTRY / renderAssistantMessage — how routing_card kinds render and onViewOnMap is threaded.
- `app/(app)/(tabs)/index.tsx:1204-1212` — onViewOnMap → setChatMode(false) — the return-to-map behavior the curated card must trigger.

## Guardrails

**Write-allowed:** `app/(app)/(tabs)/index.tsx` (MODIFY: Extend the map-fit path (doFit / fitToCoordinates) to handle centroid-only curated routes (setCameraPosition on the centroid when no polyline). No other render changes — curated cards ride the transcript via routing_card.) · `components/chat/routing-card.tsx` (MODIFY: Branch the CompletedCard rendering to a curated card variant when the route_options are curated-shaped (carry 0–1 score + centroid). Keep onSelect(setSelectedRouteId+setDisplayedRoutePlanId+requestFitToRouteWithReset)+onViewOnMap identical to the planned-route path.) · `components/chat/cards/curated-route-card.tsx` (NEW: Curated card variant (used when PlannedRouteOptionsView shape does not fit): renders name + mileage + 0–1 score as bar/%, calls onSelect(routeId)+onViewOnMap(). Reuses RouteAttachmentCard visuals where possible; testID `curated-route-card-{routeId}`.) · `e2e/disc-012-curated-cards.e2e.ts` (NEW: e2e covering AC-1..AC-4 against seeded live Convex + DATA-008 routing_card.)

**Write-prohibited:** components/chat/route-attachment-card.tsx — coupled to PlannedRouteOptionsView; do NOT fork its planned-route contract. If reused, reuse as-is. · hooks/use-active-session-route.ts — the resolution machinery is reused unchanged. · server/convex/** — DATA-008 supplies the routing_card route_options; backend is locked. · Any file not explicitly listed above

## Verification gates

1. `pnpm test` — all AC scenarios green; PRIMARY AC-1 watched RED against the start state (negative control: 0 cards (empty)) before GREEN.
2. **On-device e2e** — run each `e2e/*.e2e.ts` AC on a real iOS Simulator against a live Convex deployment (seed via the fixtures below); capture the required screenshot evidence per AC.
3. `pnpm type-check` (exit 0) · `pnpm lint` (exit 0).
4. `git diff --name-only` ⊆ write-allowed.
5. **Un-fakeable:** AC-1 evidence (screenshot) shows the asserted on-screen oracle AND the negative-control build (empty/static/disconnected) produces the must-NOT-observe state.

## Design / approach

**Design enrichment (frontend-designer):** RouteAttachmentCard is type-coupled to PlannedRouteOptionsView (stats.durationSeconds, map.legs, overlaysPreview) — INCOMPATIBLE with curated shape. Create NEW components/chat/curated-route-card.tsx reusing only RouteAttachmentCard's container style tokens (padding/border/radius/elevation/isSelected color). Sprint-01 score display = inline `{Math.round(compositeScore*100)}/100` text badge (semantic.type.instrument.sm, primary.default) — NOT ScoreDimensionBar (that's Sprint-02). Do NOT render the 5 dimension scores here. Tap = onSelect(routeId)+onViewOnMap(). Centroid is camera target when no polyline. Min card height 60pt. Do NOT use RouteMiniMap (reads route.map.bounds, absent on curated).

**Interaction / implementation notes:**
- Reuse the routing_card CompletedCard onSelect + onViewOnMap wiring so curated cards behave identically to planned-route cards (tap earlier card → re-render + return to map).
- Format composite scores from the 0–1 scale to %/bar via a pure transform.
- Make doFit tolerant of single-point (centroid) coordinates.

**Ask first:**
- Whether DATA-008 emits curated routes as PlannedRouteOptionsView-compatible options (reuse RouteAttachmentCard) or a distinct curated shape (use the new curated-route-card variant) — inspect the DATA-008 routing_card contract first.
- Adding a new CARD_REGISTRY kind for curated cards vs. reusing the existing routing_card kind.

## Dependencies

- **Depends on:** DATA-008.
- **Blocks:** DISC-015.
- **Parallel:** DISC-013.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "fixtures": {
    "agent_curated_routing_card": {
      "description": "An NL request that makes DATA-008 emit a routing_card with \u22652 curated route_options (polyline-bearing)",
      "seed_method": "ui_flow",
      "records": [
        "seed curated routes \"Tail of the Dragon\"(score 0.86, polyline) + \"Cherohala Skyway\"(score 0.81)",
        "send chat \"twisties near Asheville\" \u2192 routing_card with 2 curated options"
      ]
    },
    "agent_curated_routing_card_centroid": {
      "description": "Curated routing_card whose selected route has centroid only (no routePolyline)",
      "seed_method": "ui_flow",
      "records": [
        "seed \"Cherohala Skyway\" with centroidLat 35.31 centroidLng -83.93 and NO routePolyline",
        "agent surfaces it as a routing_card option"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN agent curated routing_card WHEN transcript renders THEN curated routes are cards and the latest plots on the map",
      "verify": "pnpm test -- e2e/disc-012-curated-cards.e2e.ts -t curatedRoutesRenderAsCardsAndPlot",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "tier": "visible",
        "verification_service": "iOS Simulator + live Convex",
        "negative_control": {
          "would_fail_if": [
            "0 cards (empty)",
            "the 8 MOCK_ROUTES appear (static)",
            "DATA-008 disconnected, no curated options (disconnect)",
            "static card shell with no map plot (stub)"
          ]
        },
        "evidence": {
          "artifact_type": "screenshot",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "agent_curated_routing_card",
            "action": {
              "actor": "user",
              "steps": [
                "Seed curated routes",
                "Send \"twisties near Asheville\"",
                "Open transcript then view map"
              ]
            },
            "end_state": {
              "must_observe": [
                "card titled \"Tail of the Dragon\"",
                "card titled \"Cherohala Skyway\"",
                "exactly 1 latest curated route plotted on the map"
              ],
              "must_not_observe": [
                "any of the 8 MOCK_ROUTES",
                "0 cards",
                "empty map after routing_card completes"
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
      "description": "GIVEN 2 curated cards WHEN the earlier card is tapped THEN it re-renders on the map and returns to map view",
      "verify": "pnpm test -- e2e/disc-012-curated-cards.e2e.ts -t tapEarlierCuratedCardReturnsToMap",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "tier": "visible",
        "verification_service": "iOS Simulator + live Convex",
        "negative_control": {
          "would_fail_if": [
            "tap is a no-op",
            "tap selects but never calls onViewOnMap (stays in chat) (disconnect)",
            "map still shows the latest not the tapped route"
          ]
        },
        "evidence": {
          "artifact_type": "screenshot",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "agent_curated_routing_card",
            "action": {
              "actor": "user",
              "steps": [
                "Latest \"Tail of the Dragon\" on map",
                "Open transcript",
                "Tap earlier \"Cherohala Skyway\" card",
                "Observe map"
              ]
            },
            "end_state": {
              "must_observe": [
                "the map back in map mode with 0 transcript overlays (transcript hidden)",
                "\"Cherohala Skyway\" plotted/selected"
              ],
              "must_not_observe": [
                "transcript still over the map (start/empty signature: 0 / none present)",
                "\"Tail of the Dragon\" still plotted"
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
      "description": "GIVEN a centroid-only curated route WHEN plotted THEN the map fits/centers to its centroid",
      "verify": "pnpm test -- e2e/disc-012-curated-cards.e2e.ts -t centroidOnlyRouteFitsOnMap",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "tier": "visible",
        "verification_service": "iOS Simulator + live Convex",
        "negative_control": {
          "would_fail_if": [
            "doFit early-returns on empty coords (no-op)",
            "centroid route renders nothing (empty)",
            "camera stays on previous bounds (disconnect)"
          ]
        },
        "evidence": {
          "artifact_type": "screenshot",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "agent_curated_routing_card_centroid",
            "action": {
              "actor": "user",
              "steps": [
                "Seed centroid-only route 35.31,-83.93",
                "Plot from its card",
                "Observe camera + marker"
              ]
            },
            "end_state": {
              "must_observe": [
                "exactly 1 centroid marker on the map",
                "camera centered near 35.3,-83.9"
              ],
              "must_not_observe": [
                "camera unchanged (no fit)",
                "blank map with no centroid marker"
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
      "description": "GIVEN a 0\u20131 composite score WHEN the curated card renders THEN it shows a bar/% not 0\u2013100",
      "verify": "pnpm test -- e2e/disc-012-curated-cards.e2e.ts -t curatedCardScoreRendersAsBarOrPercent",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "tier": "visible",
        "verification_service": "iOS Simulator + live Convex",
        "negative_control": {
          "would_fail_if": [
            "raw 0\u2013100 integer rendered (wrong scale)",
            "value >100 (bug)",
            "no score element (empty)"
          ]
        },
        "evidence": {
          "artifact_type": "screenshot",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "agent_curated_routing_card",
            "action": {
              "actor": "user",
              "steps": [
                "Seed compositeScore 0.86",
                "Open its card",
                "Read the score element"
              ]
            },
            "end_state": {
              "must_observe": [
                "a \"%\" suffix or filled bar reflecting ~0.86",
                "a value within 0\u2013100% e.g. \"86%\""
              ],
              "must_not_observe": [
                "a bare \"86\" with no % and no bar",
                "any value >100 or \"/100\""
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "Curated cards reuse the routing_card onSelect+onViewOnMap wiring (no parallel selection path)",
      "verify": "grep -n 'onViewOnMap' components/chat/cards/curated-route-card.tsx",
      "maps_to_ac": "AC-2"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Type-check + lint clean",
      "verify": "pnpm type-check && pnpm lint",
      "maps_to_ac": "AC-1"
    }
  ]
}
-->
