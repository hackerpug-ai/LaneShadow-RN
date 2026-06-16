# DISC-010: Re-key the chat-input suggestion-pill slot from "empty session" to "no active route on the map"

| Field | Value |
|---|---|
| Sprint | [sprint-01-live-discovery-home](./SPRINT.md) |
| Type | FEATURE |
| Agent | implementer = `react-native-ui-implementer` · reviewer = `react-native-ui-reviewer` |
| Estimate | M |
| Priority | P1 |
| Status | Backlog |
| Proposed By | react-native-ui-planner |
| Depends on | — (independent) |
| Blocks | DISC-011, DISC-014, DISC-015 |
| PRD refs | DELTA-001 §2/§5(UC-DISC-01)/§7 · ROADMAP Sprint 01 (DISC-010) · 05-uc-disc UC-DISC-01 |

## Background

DELTA-001 folds discovery onto the map+chat home. Today `chat-input.tsx:226` gates the suggestion pills on `isIdle && !hasMessages` — the pills vanish after the first chat message and never key on whether a route is actually displayed on the map. That is the wrong signal: the pill slot belongs to map view whenever no route is plotted, including mid-conversation after a route is dismissed. This task re-keys the pill gate from "empty session" to "no active route on the map" by deriving a `hasActiveRoute` boolean from `useActiveSessionRoute` (the same truthiness that gates the displayed-route polyline) and threading it into `ChatInput`. It is the foundation DISC-011/014 compose on.

## Critical constraints

- Do NOT introduce a new <Screen> or NavigationStack push — discovery is a STATE of `app/(app)/(tabs)/index.tsx`, never a new screen.
- Remove the `!hasMessages` coupling on the pill gate (chat-input.tsx:226) — pills must reappear mid-conversation once a route is dismissed; gating on message-count is the bug this task fixes.
- Derive `hasActiveRoute` from `useActiveSessionRoute` (already destructured at index.tsx:249), NOT from `flowState.phase` — the map's displayed route is the single source of truth for pill visibility.
- Pills must remain hidden while `chatMode` is true (full transcript visible) — the pill slot belongs to map view only.
- Use `useSemanticTheme()` tokens for any touched styling; no hardcoded hex.

## Specification

**Objective:** Suggestion pills above the chat input show whenever no route is displayed on the map (including mid-conversation after a route is dismissed) and hide whenever a route is on screen.

**Success state:** Suggestion pills above the chat input show whenever no route is displayed on the map (including mid-conversation after a route is dismissed) and hide whenever a route is on screen. Verified end-to-end on a real iOS Simulator against a live Convex deployment (the negative controls below bite an empty/static/disconnected build).

## Acceptance criteria

- **AC-1** (PRIMARY) — hasActiveRoute hides pills when a route is on the map. **GIVEN** A planning session whose newest routing_card resolves a route plan that is rendered on the map (agentActiveOption present) **WHEN** The home screen renders in map mode **THEN** The suggestion pills are NOT shown (hasActiveRoute === true gates them off). _test_tier: e2e · service: iOS Simulator + live Convex._ **Oracle:** observe route polyline visible (testID `home-route-polyline`); no testID `chat-input-suggestion-chips`; must NOT observe a visible suggestion pill row while a route is on screen (start/empty signature: 0 / none present). **Negative control:** pill gate still keys on `!hasMessages` (static); hasActiveRoute wired to flowState.phase not the displayed route (disconnect).
- **AC-2** — Pills show mid-conversation when no route is on the map. **GIVEN** A session that HAS messages (hasMessages === true) but currently has NO route displayed on the map **WHEN** The home screen renders in map mode and is not planning **THEN** The suggestion pills ARE shown — proving the `!hasMessages` coupling was removed. _test_tier: e2e · service: iOS Simulator + live Convex._ **Oracle:** observe visible suggestion pill row (testID `chat-input-suggestion-chips`); ≥1 suggestion pill; must NOT observe 0 pills above the chat input despite no route on screen. **Negative control:** gate still requires !hasMessages (static); hasActiveRoute defaults true with no route (disconnect).
- **AC-3** — Dismissing a displayed route re-shows the pills. **GIVEN** A session with a route displayed on the map (pills hidden) **WHEN** The displayed route is cleared (Clear control → setSelectedRouteId(null) + setDisplayedRoutePlanId(null) and no newer routing_card) **THEN** hasActiveRoute flips to false and the pills reappear. _test_tier: e2e · service: iOS Simulator + live Convex._ **Oracle:** observe visible suggestion pill row (testID `chat-input-suggestion-chips`); 0 route polyline on the map after clear (testID `home-route-polyline` absent); must NOT observe pills still hidden after the route is cleared (start/empty signature: 0 / none present). **Negative control:** hasActiveRoute computed once at mount (static); clear does not propagate to the pill gate (disconnect).

## Test criteria

| ID | Statement | Maps to | Verify |
|---|---|---|---|
| TC-1 | ChatInput gate no longer references `hasMessages` for pill visibility | AC-2 | `grep -n 'hasActiveRoute' components/chat/chat-input.tsx && ! grep -nE '!hasMessages.*suggestions' components/chat/chat-input.tsx` |
| TC-2 | Type-check + lint clean after the prop change | AC-1 | `pnpm type-check && pnpm lint` |

## Reading list

- `components/chat/chat-input.tsx:204-228` — [PRIMARY PATTERN] The existing pill gate `{isIdle && !hasMessages && suggestions.length > 0 && !isPlanning && (...)}` — this is the exact conditional to re-key.
- `app/(app)/(tabs)/index.tsx:243-249, 1346-1358` — useActiveSessionRoute destructure (agentActiveOption) and the ChatInput call site where `hasMessages` is passed today.
- `app/(app)/(tabs)/index.tsx:741-769` — How agentActiveOption gates the displayed route polyline — mirror this truthiness for hasActiveRoute.
- `hooks/use-active-session-route.ts:60-95` — What `activeOption`/`routePlan` resolve to (read-only) — the source for hasActiveRoute.

## Guardrails

**Write-allowed:** `app/(app)/(tabs)/index.tsx` (MODIFY: Derive `hasActiveRoute` from useActiveSessionRoute (agentActiveOption/displayed route) and pass into <ChatInput>.) · `components/chat/chat-input.tsx` (MODIFY: Add `hasActiveRoute?: boolean` prop; replace the `!hasMessages` pill gate (line 226) with `!hasActiveRoute && !chatMode`; add testID `chat-input-suggestion-chips` to the SuggestionChips wrapper.) · `e2e/disc-010-pill-visibility.e2e.ts` (NEW: Detox/Maestro e2e covering AC-1..AC-3 on real simulator + live Convex.)

**Write-prohibited:** components/discovery/** — out of scope for this task (handled in DISC-015) · hooks/use-active-session-route.ts — read-only; do not alter the route-resolution logic · Any file not explicitly listed above

## Verification gates

1. `pnpm test` — all AC scenarios green; PRIMARY AC-1 watched RED against the start state (negative control: pill gate still keys on `!hasMessages` (static)) before GREEN.
2. **On-device e2e** — run each `e2e/*.e2e.ts` AC on a real iOS Simulator against a live Convex deployment (seed via the fixtures below); capture the required screenshot evidence per AC.
3. `pnpm type-check` (exit 0) · `pnpm lint` (exit 0).
4. `git diff --name-only` ⊆ write-allowed.
5. **Un-fakeable:** AC-1 evidence (screenshot) shows the asserted on-screen oracle AND the negative-control build (empty/static/disconnected) produces the must-NOT-observe state.

## Design / approach

**Design enrichment (frontend-designer):** Derive hasActiveRoute = !!(agentActiveOption || displayedCuratedRouteId) in HomeMapScreen; pass to ChatInput; gate becomes isIdle && !hasActiveRoute && suggestions.length>0 && !isPlanning. Pattern source: index.tsx:1278 hasRouteToSave. Anti-pattern: do NOT gate on phase===IDLE alone or transcriptMessages.length===0 (hides pills mid-conversation when no route). Pills must reappear after route dismissed/cleared.

**Interaction / implementation notes:**
- Keep the existing `suggestions`/`onSelect`/`chatMode`/`onToggleChatMode` props working unchanged.
- Mark the old `hasMessages` prop @deprecated (keep optional for call-site compatibility) rather than hard-removing it.
- Compute `hasActiveRoute` truthiness from a route actually displayable on the map (agentActiveOption + resolved route plan), matching the polyline render condition.

**Ask first:**
- Removing the `hasMessages` prop entirely from the ChatInput type (other call sites may pass it).
- Any change to `useActiveSessionRoute` resolution semantics.

## Dependencies

- **Depends on:** — (independent).
- **Blocks:** DISC-011, DISC-014, DISC-015.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "fixtures": {
    "session_with_displayed_route": {
      "description": "A planning_session whose newest routing_card resolves a completed route_plan rendered on the map",
      "seed_method": "ui_flow",
      "records": [
        "1 planning_session",
        "1 routing_card message \u2192 1 completed route_plan with \u22651 option + overviewGeometry"
      ]
    },
    "session_with_messages_no_route": {
      "description": "A planning_session with \u22652 chat messages and NO routing_card / no displayed route",
      "seed_method": "ui_flow",
      "records": [
        "1 planning_session",
        "2 text messages (1 rider, 1 agent)",
        "0 routing_card messages"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN a session with a route displayed on the map WHEN home renders in map mode THEN suggestion pills are hidden",
      "verify": "pnpm test -- e2e/disc-010-pill-visibility.e2e.ts -t pillsHiddenWhenRouteOnMap",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "tier": "visible",
        "verification_service": "iOS Simulator + live Convex",
        "negative_control": {
          "would_fail_if": [
            "pill gate still keys on `!hasMessages` (static)",
            "hasActiveRoute wired to flowState.phase not the displayed route (disconnect)"
          ]
        },
        "evidence": {
          "artifact_type": "screenshot",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "session_with_displayed_route",
            "action": {
              "actor": "user",
              "steps": [
                "Open home on a session with a completed displayed route",
                "Observe chat input area"
              ]
            },
            "end_state": {
              "must_observe": [
                "route polyline visible (testID `home-route-polyline`)",
                "no testID `chat-input-suggestion-chips`"
              ],
              "must_not_observe": [
                "a visible suggestion pill row while a route is on screen (start/empty signature: 0 / none present)"
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
      "description": "GIVEN a session with messages but no displayed route WHEN home renders in map mode THEN pills are shown",
      "verify": "pnpm test -- e2e/disc-010-pill-visibility.e2e.ts -t pillsShowMidConversationWithNoRoute",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "tier": "visible",
        "verification_service": "iOS Simulator + live Convex",
        "negative_control": {
          "would_fail_if": [
            "gate still requires !hasMessages (static)",
            "hasActiveRoute defaults true with no route (disconnect)"
          ]
        },
        "evidence": {
          "artifact_type": "screenshot",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "session_with_messages_no_route",
            "action": {
              "actor": "user",
              "steps": [
                "Open a session with \u22652 messages and no route",
                "Stay in map mode",
                "Observe above the chat input"
              ]
            },
            "end_state": {
              "must_observe": [
                "visible suggestion pill row (testID `chat-input-suggestion-chips`)",
                "\u22651 suggestion pill"
              ],
              "must_not_observe": [
                "0 pills above the chat input despite no route on screen"
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
      "description": "GIVEN a route displayed on the map WHEN the route is cleared THEN pills reappear",
      "verify": "pnpm test -- e2e/disc-010-pill-visibility.e2e.ts -t pillsReappearAfterRouteDismiss",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "tier": "visible",
        "verification_service": "iOS Simulator + live Convex",
        "negative_control": {
          "would_fail_if": [
            "hasActiveRoute computed once at mount (static)",
            "clear does not propagate to the pill gate (disconnect)"
          ]
        },
        "evidence": {
          "artifact_type": "screenshot",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "session_with_displayed_route",
            "action": {
              "actor": "user",
              "steps": [
                "Start with a route on the map (pills hidden)",
                "Tap Clear control",
                "Observe above the chat input"
              ]
            },
            "end_state": {
              "must_observe": [
                "visible suggestion pill row (testID `chat-input-suggestion-chips`)",
                "0 route polyline on the map after clear (testID `home-route-polyline` absent)"
              ],
              "must_not_observe": [
                "pills still hidden after the route is cleared (start/empty signature: 0 / none present)"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "ChatInput gate no longer references `hasMessages` for pill visibility",
      "verify": "grep -n 'hasActiveRoute' components/chat/chat-input.tsx && ! grep -nE '!hasMessages.*suggestions' components/chat/chat-input.tsx",
      "maps_to_ac": "AC-2"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Type-check + lint clean after the prop change",
      "verify": "pnpm type-check && pnpm lint",
      "maps_to_ac": "AC-1"
    }
  ]
}
-->
