# DISC-014: No-route empty home state: pills present + a discovery-invite placeholder in the chat input

| Field | Value |
|---|---|
| Sprint | [sprint-01-live-discovery-home](./SPRINT.md) |
| Type | FEATURE |
| Agent | implementer = `react-native-ui-implementer` · reviewer = `react-native-ui-reviewer` |
| Estimate | S |
| Priority | P2 |
| Status | Backlog |
| Proposed By | react-native-ui-planner |
| Depends on | DISC-010, DISC-011 |
| Blocks | — |
| PRD refs | DELTA-001 §2/§5(UC-DISC-01)/§7 · ROADMAP Sprint 01 (DISC-014) · 05-uc-disc UC-DISC-01 |

## Background

Once the pill slot is re-keyed (DISC-010) and filled with curated routes (DISC-011), the no-route home needs a complete empty state. This task adds a discovery-invite placeholder to the chat input via a new optional `placeholder` prop keyed on `hasActiveRoute === false` (e.g. "Find a route — try 'twisties near Asheville'" instead of the generic "Plan a ride…"), keeps the curated pills present, and verifies no residual route/planning UI (route cards, weather pills) leaks into the empty state.

## Critical constraints

- The empty state is keyed on `hasActiveRoute === false` (from DISC-010) — NOT on message count or session presence.
- Add a new OPTIONAL `placeholder` prop to ChatInput; when no route is active, the placeholder reads as a discovery invite (e.g. "Find a route — try 'twisties near Asheville'") instead of the generic "Plan a ride…".
- No residual route/planning UI (route cards, weather pills, save control) may show in the no-route empty state.
- Discovery is a STATE of index.tsx — no new screen; use useSemanticTheme() tokens, no hardcoded hex.
- Do NOT regress the curated pills delivered by DISC-011 — they must be present in this state.

## Specification

**Objective:** When no route is on the map (hasActiveRoute false), the home shows curated suggestion pills plus a discovery-invite placeholder in the chat input, with no residual route/planning UI.

**Success state:** When no route is on the map (hasActiveRoute false), the home shows curated suggestion pills plus a discovery-invite placeholder in the chat input, with no residual route/planning UI. Verified end-to-end on a real iOS Simulator against a live Convex deployment (the negative controls below bite an empty/static/disconnected build).

## Acceptance criteria

- **AC-1** (PRIMARY) — Discovery-invite placeholder when no route is active. **GIVEN** A cold-open home (no session route, hasActiveRoute false) **WHEN** The home renders in map mode **THEN** The chat input placeholder reads as a discovery invite (not the default "Plan a ride…"). _test_tier: e2e · service: iOS Simulator + live Convex._ **Oracle:** observe placeholder containing "Find a route" (discovery invite); must NOT observe "Plan a ride…" while no route is on the map. **Negative control:** placeholder still hardcoded "Plan a ride…" (static); new placeholder prop ignored (no-op); placeholder not keyed on hasActiveRoute (disconnect).
- **AC-2** — Curated pills present in the empty state. **GIVEN** A cold-open home with no route and a seeded curated catalog **WHEN** The home renders in map mode **THEN** The curated suggestion pills are shown. _test_tier: e2e · service: iOS Simulator + live Convex._ **Oracle:** observe visible pill row (testID `chat-input-suggestion-chips`); pill labeled "Tail of the Dragon"; must NOT observe 0 pills in the no-route empty state. **Negative control:** pills hidden in empty state (DISC-011 regression) (empty); catalog not seeded (empty).
- **AC-3** — No residual route/planning UI in the empty state. **GIVEN** A cold-open home with no route **WHEN** The home renders **THEN** No route cards or weather pills are shown. _test_tier: e2e · service: iOS Simulator._ **Oracle:** observe the discovery empty home: map + chat input + ≥1 pill, with 0 route/planning panels; must NOT observe any route card (testID `route-card-` / routing-card-route-) (start/empty signature: 0 / none present); weather-pills-container. **Negative control:** a stale route card renders with no route (disconnect); weather pills show with no selected route (bug).

## Test criteria

| ID | Statement | Maps to | Verify |
|---|---|---|---|
| TC-1 | ChatInput exposes an optional placeholder prop applied to the TextInput | AC-1 | `grep -nE 'placeholder\??: ?string' components/chat/chat-input.tsx` |
| TC-2 | Type-check + lint clean | AC-1 | `pnpm type-check && pnpm lint` |

## Reading list

- `components/chat/chat-input.tsx:249-274` — [PRIMARY PATTERN] The TextInput with hardcoded placeholder="Plan a ride…" (line 257) — the exact prop to parameterize.
- `app/(app)/(tabs)/index.tsx:1346-1358` — ChatInput call site — add `placeholder` keyed on hasActiveRoute.
- `app/(app)/(tabs)/index.tsx:1237-1253, 1283-1321` — Weather pills + route cards gating — confirm they are off in the no-route state.

## Guardrails

**Write-allowed:** `components/chat/chat-input.tsx` (MODIFY: Add optional `placeholder?: string` prop; default to "Plan a ride…"; apply it to the TextInput placeholder (line 257).) · `app/(app)/(tabs)/index.tsx` (MODIFY: Pass a discovery-invite placeholder to ChatInput when `hasActiveRoute` is false (reuse the DISC-010 boolean); verify the no-route state shows no residual route cards/weather pills.) · `e2e/disc-014-empty-home.e2e.ts` (NEW: e2e covering AC-1..AC-3 against a seeded live Convex cold open.)

**Write-prohibited:** The pill gate logic (owned by DISC-010) — reuse hasActiveRoute, do not re-implement. · The pill content wiring (owned by DISC-011) — reuse, do not duplicate. · Any file not explicitly listed above

## Verification gates

1. `pnpm test` — all AC scenarios green; PRIMARY AC-1 watched RED against the start state (negative control: placeholder still hardcoded "Plan a ride…" (static)) before GREEN.
2. **On-device e2e** — run each `e2e/*.e2e.ts` AC on a real iOS Simulator against a live Convex deployment (seed via the fixtures below); capture the required screenshot evidence per AC.
3. `pnpm type-check` (exit 0) · `pnpm lint` (exit 0).
4. `git diff --name-only` ⊆ write-allowed.
5. **Un-fakeable:** AC-1 evidence (screenshot) shows the asserted on-screen oracle AND the negative-control build (empty/static/disconnected) produces the must-NOT-observe state.

## Design / approach

**Design enrichment (frontend-designer):** Empty home state = map-mode, no route, no messages. Conditional render above ChatInput (pointerEvents='none', bottom anchored above pills+insets): Text 'Discover roads near you' (semantic.type.body.md, onSurface.muted) with textShadow rgba(0,0,0,0.4) 0/1/3 for legibility over light+dark Mapbox (no background pill). Gate: !hasActiveRoute && !chatMode && transcriptMessages.length===0. testID home-empty-state. Anti-pattern: don't show when transcriptMessages.length>0 (returning riders see pills, not onboarding copy); no icon/CTA button (pills are the action).

**Interaction / implementation notes:**
- Default the new `placeholder` prop to the existing "Plan a ride…" so non-empty/route states are unchanged.
- Key the invite placeholder on hasActiveRoute (false → invite copy).
- Confirm route cards and weather pills are already gated off when no route is present (index.tsx already gates weather pills on selectedOption).

**Ask first:**
- Final discovery-invite copy wording.
- Whether to also surface a small invite line above the pills vs. placeholder-only (placeholder-only is the spec default).

## Dependencies

- **Depends on:** DISC-010, DISC-011.
- **Blocks:** —.
- **Parallel:** DISC-013.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "fixtures": {
    "cold_open_no_route": {
      "description": "A fresh home launch with no prior session route and a seeded curated catalog",
      "seed_method": "ui_flow",
      "records": [
        "no displayed route plan",
        "\u22653 seeded curated routes incl. \"Tail of the Dragon\""
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN no route on the map WHEN home renders THEN the chat input shows a discovery-invite placeholder",
      "verify": "pnpm test -- e2e/disc-014-empty-home.e2e.ts -t discoveryInvitePlaceholderWhenNoRoute",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "tier": "visible",
        "verification_service": "iOS Simulator + live Convex",
        "negative_control": {
          "would_fail_if": [
            "placeholder still hardcoded \"Plan a ride\u2026\" (static)",
            "new placeholder prop ignored (no-op)",
            "placeholder not keyed on hasActiveRoute (disconnect)"
          ]
        },
        "evidence": {
          "artifact_type": "screenshot",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "cold_open_no_route",
            "action": {
              "actor": "user",
              "steps": [
                "Cold-open with no route",
                "Read the chat input placeholder"
              ]
            },
            "end_state": {
              "must_observe": [
                "placeholder containing \"Find a route\" (discovery invite)"
              ],
              "must_not_observe": [
                "\"Plan a ride\u2026\" while no route is on the map"
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
      "description": "GIVEN no route + seeded catalog WHEN home renders THEN curated pills are present",
      "verify": "pnpm test -- e2e/disc-014-empty-home.e2e.ts -t curatedPillsPresentInEmptyState",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "tier": "visible",
        "verification_service": "iOS Simulator + live Convex",
        "negative_control": {
          "would_fail_if": [
            "pills hidden in empty state (DISC-011 regression) (empty)",
            "catalog not seeded (empty)"
          ]
        },
        "evidence": {
          "artifact_type": "screenshot",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "cold_open_no_route",
            "action": {
              "actor": "user",
              "steps": [
                "Seed \u22653 curated routes",
                "Cold-open in map mode",
                "Observe pills"
              ]
            },
            "end_state": {
              "must_observe": [
                "visible pill row (testID `chat-input-suggestion-chips`)",
                "pill labeled \"Tail of the Dragon\""
              ],
              "must_not_observe": [
                "0 pills in the no-route empty state"
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
      "description": "GIVEN no route WHEN home renders THEN no residual route/planning UI shows",
      "verify": "pnpm test -- e2e/disc-014-empty-home.e2e.ts -t noResidualRouteUiInEmptyState",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "tier": "visible",
        "verification_service": "iOS Simulator",
        "negative_control": {
          "would_fail_if": [
            "a stale route card renders with no route (disconnect)",
            "weather pills show with no selected route (bug)"
          ]
        },
        "evidence": {
          "artifact_type": "screenshot",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "cold_open_no_route",
            "action": {
              "actor": "user",
              "steps": [
                "Cold-open with no route",
                "Inspect for route/planning UI"
              ]
            },
            "end_state": {
              "must_observe": [
                "the discovery empty home: map + chat input + \u22651 pill, with 0 route/planning panels"
              ],
              "must_not_observe": [
                "any route card (testID `route-card-` / routing-card-route-) (start/empty signature: 0 / none present)",
                "weather-pills-container"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "ChatInput exposes an optional placeholder prop applied to the TextInput",
      "verify": "grep -nE 'placeholder\\??: ?string' components/chat/chat-input.tsx",
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
