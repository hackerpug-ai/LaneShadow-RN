# DISC-011: Swap suggestion-pill content from IDLE_SUGGESTIONS to whole curated routes from the live catalog (tap → plot on the map)

| Field | Value |
|---|---|
| Sprint | [sprint-01-live-discovery-home](./SPRINT.md) |
| Type | FEATURE |
| Agent | implementer = `react-native-ui-implementer` · reviewer = `react-native-ui-reviewer` |
| Estimate | M |
| Priority | P1 |
| Status | Backlog |
| Proposed By | react-native-ui-planner |
| Depends on | DISC-010, DATA-008 |
| Blocks | DISC-014, DISC-015 |
| PRD refs | DELTA-001 §2/§5(UC-DISC-02)/§6/§7 · ROADMAP Sprint 01 (DISC-011) · 05-uc-disc UC-DISC-02 |

## Background

With the pill slot re-keyed by DISC-010, this task swaps the pill CONTENT from the generic `IDLE_SUGGESTIONS` planning prompts to whole curated routes drawn from the live catalog via `useCuratedDiscovery` (which wraps `listCuratedRoutes`, DATA-005). Each pill is a whole curated route labeled `name · mileage` (e.g. "Tail of the Dragon · 11mi") — never a generic prompt and never a 0–100 score. Tapping a pill plots that exact curated route on the map through the EXISTING curated routing_card → `useActiveSessionRoute` → map-fit machinery (the DATA-008 surface), so the plotted route flips `hasActiveRoute` true and the pills auto-hide — no parallel render path.

## Critical constraints

- Each pill is a WHOLE curated route labeled with name + mileage (e.g. "Tail of the Dragon · 11mi") — NEVER a generic planning prompt and NEVER a 0–100 score badge.
- Pill data comes from the LIVE catalog via `useCuratedDiscovery` (which wraps `listCuratedRoutes`) — no hardcoded IDLE_SUGGESTIONS, no MOCK_ROUTES.
- Tapping a pill must route through the EXISTING curated routing_card → useActiveSessionRoute → map-fit machinery so the plotted route causes `hasActiveRoute` (DISC-010) to flip true and the pills auto-hide — do NOT invent a parallel render path.
- Discovery is a STATE of index.tsx — no new screen, no NavigationStack push.
- Limit to ~5 pills, sorted best (or nearest when location available); use `useSemanticTheme()` tokens, no hardcoded hex.

## Specification

**Objective:** Suggestion pills present whole curated routes from the live catalog (name + mileage, never a 0–100 score), and tapping one plots that curated route on the map so the pills auto-hide.

**Success state:** Suggestion pills present whole curated routes from the live catalog (name + mileage, never a 0–100 score), and tapping one plots that curated route on the map so the pills auto-hide. Verified end-to-end on a real iOS Simulator against a live Convex deployment (the negative controls below bite an empty/static/disconnected build).

## Acceptance criteria

- **AC-1** (PRIMARY) — Pills show live curated routes by name + mileage. **GIVEN** A seeded curated catalog containing named routes with mileage (e.g. "Tail of the Dragon" 11mi, "Cherohala Skyway" 41mi) **WHEN** The home screen renders in map mode with no route displayed **THEN** The pills display those curated route names with mileage (not IDLE_SUGGESTIONS, not a 0–100 score). _test_tier: e2e · service: iOS Simulator + live Convex._ **Oracle:** observe pill labeled "Tail of the Dragon"; a mileage token "11mi" or "41mi"; ≤5 pills; must NOT observe "Plan a scenic ride" / "Find coffee nearby" (IDLE_SUGGESTIONS); a "92" 0–100 score badge. **Negative control:** pills still render IDLE_SUGGESTIONS (static); useCuratedDiscovery empty/not wired (empty); query mocked (mock); pill shows a 0–100 score not mileage.
- **AC-2** — Tapping a curated pill plots that route on the map. **GIVEN** Curated-route pills are shown and a known route ("Cherohala Skyway") is among them **WHEN** The rider taps the "Cherohala Skyway" pill **THEN** That curated route plots on the map via the existing routing_card/useActiveSessionRoute path (its geometry/centroid renders). _test_tier: e2e · service: iOS Simulator + live Convex._ **Oracle:** observe 1 plotted route (testID `home-route-polyline`) OR 1 centroid marker for the selected route; on-map context resolves to "Cherohala Skyway"; must NOT observe empty home map after the tap; a push to a separate Discover screen. **Negative control:** tap sends a generic chat string not the specific route (disconnect); tap pushes a new screen (wrong path); no route renders (no-op).
- **AC-3** — Pills auto-hide after a pill plots a route. **GIVEN** Curated-route pills are shown **WHEN** The rider taps a pill and the route plots on the map **THEN** The pills hide because hasActiveRoute (DISC-010) is now true. _test_tier: e2e · service: iOS Simulator + live Convex._ **Oracle:** observe exactly 1 plotted route on the map; no testID `chat-input-suggestion-chips`; must NOT observe pills still visible while the tapped route is on screen (start/empty signature: 0 / none present). **Negative control:** pills stay visible over the plotted route (gate disconnect); tap does not plot so hasActiveRoute never flips (no-op).

## Test criteria

| ID | Statement | Maps to | Verify |
|---|---|---|---|
| TC-1 | IDLE_SUGGESTIONS is no longer passed as the pill source from index.tsx | AC-1 | `! grep -nE 'suggestions=\{IDLE_SUGGESTIONS\}' 'app/(app)/(tabs)/index.tsx'` |
| TC-2 | Type-check + lint clean | AC-1 | `pnpm type-check && pnpm lint` |

## Reading list

- `hooks/use-curated-discovery.ts:39-81` — [PRIMARY PATTERN] The hook contract — params (sort best/nearest, limit) and the mapped DiscoveryRoute shape {id,name,...,score,distanceMi}. Note lengthMiles is NOT in the mapped output today.
- `components/chat/chat-input.tsx:64-112, 191-228` — SuggestionChips render + handleSelectSuggestion — where pill content and onSelect live.
- `components/chat/routing-card.tsx:228-265` — CompletedCard onSelect path (setSelectedRouteId + setDisplayedRoutePlanId + requestFitToRouteWithReset) — the existing plot-on-map machinery a pill tap should reuse.
- `app/(app)/(tabs)/index.tsx:1346-1358` — Current `suggestions={IDLE_SUGGESTIONS}` ChatInput call site to replace.
- `server/convex/curatedRoutes.ts:119-134` — buildRouteCard — confirms name, lengthMiles, distanceMi, compositeScore(0-1) available from the live query (read-only).

## Guardrails

**Write-allowed:** `app/(app)/(tabs)/index.tsx` (MODIFY: Call useCuratedDiscovery (best/nearest, limit ~5); map results to pill data {label: name + mileage, routeId}; pass curated pills + an onSelectCuratedRoute handler that routes the tap through the curated routing_card path (the DATA-008 surface) so useActiveSessionRoute plots it. Replace `suggestions={IDLE_SUGGESTIONS}` with the curated pill data.) · `components/chat/chat-input.tsx` (MODIFY: Extend the pill model to accept structured curated pills (id + label string with mileage) and an onSelect that emits the routeId, while keeping back-compat with string suggestions; render name + mileage label only (no score badge).) · `e2e/disc-011-curated-pills.e2e.ts` (NEW: e2e covering AC-1..AC-3 against seeded live Convex catalog.)

**Write-prohibited:** hooks/use-curated-discovery.ts — reuse as-is; if mileage (lengthMiles) is not surfaced in its mapped shape, ASK FIRST before extending it (see Boundaries). · server/convex/curatedRoutes.ts — backend is locked (DATA-005 carried forward); no query changes. · Any file not explicitly listed above

## Verification gates

1. `pnpm test` — all AC scenarios green; PRIMARY AC-1 watched RED against the start state (negative control: pills still render IDLE_SUGGESTIONS (static)) before GREEN.
2. **On-device e2e** — run each `e2e/*.e2e.ts` AC on a real iOS Simulator against a live Convex deployment (seed via the fixtures below); capture the required screenshot evidence per AC.
3. `pnpm type-check` (exit 0) · `pnpm lint` (exit 0).
4. `git diff --name-only` ⊆ write-allowed.
5. **Un-fakeable:** AC-1 evidence (screenshot) shows the asserted on-screen oracle AND the negative-control build (empty/static/disconnected) produces the must-NOT-observe state.

## Design / approach

**Design enrichment (frontend-designer):** Pills carry name + mileage: `${name} · ${distanceMi}mi`. Extend SuggestionChips to accept {label,routeId} + onSelectRoute(routeId) that PLOTS (not chat-send). Add minHeight:44 to styles.chip (current ~37pt < 44 WCAG). Limit 3–5 routes (nearest, or best when no location). NOTE: useCuratedDiscovery currently DROPS lengthMiles from its mapped shape though listCuratedRoutes returns it — surface lengthMiles. testID discovery-suggestion-pill-{routeId}. Anti-pattern: don't send the pill label as a chat message (that hits the NL path); plot the known route directly.

**Interaction / implementation notes:**
- Sort pills best by default; switch to nearest when `useCurrentLocation` resolves (useCuratedDiscovery already derives center).
- Render pill label as name + mileage; clamp/format mileage as a short token (e.g. "11mi").
- Route the tap through the existing curated routing_card surface so the same useActiveSessionRoute → map-fit path renders it (consistency with chat-driven results).

**Ask first:**
- Extending `hooks/use-curated-discovery.ts` to surface `lengthMiles` (the underlying listCuratedRoutes returns it but the hook's mapped DiscoveryRoute shape drops it) — needed for the mileage label; confirm the minimal additive change before editing the prohibited hook.
- Whether a pill tap should create a NEW routing_card message vs. directly plot via setDisplayedRoutePlanId — depends on the DATA-008 surface shape.

## Dependencies

- **Depends on:** DISC-010, DATA-008.
- **Blocks:** DISC-014, DISC-015.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "fixtures": {
    "seeded_curated_catalog": {
      "description": "Live Convex curated_routes seeded with \u22655 named routes incl. mileage",
      "seed_method": "public_api",
      "records": [
        "\"Tail of the Dragon\" lengthMiles=11 primaryArchetype=twisties compositeScore\u22480.9",
        "\"Cherohala Skyway\" lengthMiles=41 archetype=scenic",
        "\"Blue Ridge Parkway\" lengthMiles=120",
        "+2 more curated routes"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN a seeded curated catalog WHEN home renders with no route THEN pills show curated route names + mileage (\u22645)",
      "verify": "pnpm test -- e2e/disc-011-curated-pills.e2e.ts -t pillsShowLiveCuratedRoutes",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "tier": "visible",
        "verification_service": "iOS Simulator + live Convex",
        "negative_control": {
          "would_fail_if": [
            "pills still render IDLE_SUGGESTIONS (static)",
            "useCuratedDiscovery empty/not wired (empty)",
            "query mocked (mock)",
            "pill shows a 0\u2013100 score not mileage"
          ]
        },
        "evidence": {
          "artifact_type": "screenshot",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "seeded_curated_catalog",
            "action": {
              "actor": "user",
              "steps": [
                "Seed \u22655 curated routes via real Convex seed",
                "Open home in map mode with no route",
                "Read pill labels"
              ]
            },
            "end_state": {
              "must_observe": [
                "pill labeled \"Tail of the Dragon\"",
                "a mileage token \"11mi\" or \"41mi\"",
                "\u22645 pills"
              ],
              "must_not_observe": [
                "\"Plan a scenic ride\" / \"Find coffee nearby\" (IDLE_SUGGESTIONS)",
                "a \"92\" 0\u2013100 score badge"
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
      "description": "GIVEN curated pills WHEN a pill is tapped THEN that curated route plots on the home map via the existing routing_card path",
      "verify": "pnpm test -- e2e/disc-011-curated-pills.e2e.ts -t tapCuratedPillPlotsRoute",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "tier": "visible",
        "verification_service": "iOS Simulator + live Convex",
        "negative_control": {
          "would_fail_if": [
            "tap sends a generic chat string not the specific route (disconnect)",
            "tap pushes a new screen (wrong path)",
            "no route renders (no-op)"
          ]
        },
        "evidence": {
          "artifact_type": "screenshot",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "seeded_curated_catalog",
            "action": {
              "actor": "user",
              "steps": [
                "Open home in map mode",
                "Tap the \"Cherohala Skyway\" pill",
                "Observe the map"
              ]
            },
            "end_state": {
              "must_observe": [
                "1 plotted route (testID `home-route-polyline`) OR 1 centroid marker for the selected route",
                "on-map context resolves to \"Cherohala Skyway\""
              ],
              "must_not_observe": [
                "empty home map after the tap",
                "a push to a separate Discover screen"
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
      "description": "GIVEN curated pills WHEN a pill plots a route THEN the pills auto-hide",
      "verify": "pnpm test -- e2e/disc-011-curated-pills.e2e.ts -t pillsHideAfterPillPlotsRoute",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "tier": "visible",
        "verification_service": "iOS Simulator + live Convex",
        "negative_control": {
          "would_fail_if": [
            "pills stay visible over the plotted route (gate disconnect)",
            "tap does not plot so hasActiveRoute never flips (no-op)"
          ]
        },
        "evidence": {
          "artifact_type": "screenshot",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "seeded_curated_catalog",
            "action": {
              "actor": "user",
              "steps": [
                "Open home with pills visible",
                "Tap a curated pill",
                "Wait for plot",
                "Observe above the chat input"
              ]
            },
            "end_state": {
              "must_observe": [
                "exactly 1 plotted route on the map",
                "no testID `chat-input-suggestion-chips`"
              ],
              "must_not_observe": [
                "pills still visible while the tapped route is on screen (start/empty signature: 0 / none present)"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "IDLE_SUGGESTIONS is no longer passed as the pill source from index.tsx",
      "verify": "! grep -nE 'suggestions=\\{IDLE_SUGGESTIONS\\}' 'app/(app)/(tabs)/index.tsx'",
      "maps_to_ac": "AC-1"
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
