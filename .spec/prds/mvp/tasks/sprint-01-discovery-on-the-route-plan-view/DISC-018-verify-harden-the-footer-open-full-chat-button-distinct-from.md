# DISC-018: Verify/harden the footer open-full-chat button (distinct from send) + suggestion-card visibility keyed to no-active-route

**Sprint:** [SPRINT.md](./SPRINT.md)  
**Type:** FEATURE · **Status:** ✅ Completed · **Priority:** P1 · **Effort:** S · **Estimate:** 75 min  
**Agent:** react-native-ui-implementer · **Reviewer:** react-native-ui-reviewer  
**Proposed By:** react-native-ui-planner  
**Agent rationale:** Plan-view + chat-input visibility/affordance verification — react-native-ui-implementer; reuses existing hooks, no backend change.  

## Outcome

The footer chat-view button (chat-input-chat-view-button) is visually distinct from send and opens the full chat via cycleTranscript, and the curated suggestion cards show only when isIdle && !hasActiveRoute — hiding when a route is on the map and returning when it is cleared.

## Specification

Two related plan-view contracts (UC-DISC-11 AC3/AC4 + UC-DISC-09 AC4) need verification and any hardening. (1) Footer full-chat button: ChatInput renders a standalone chat-view toggle (testID chat-input-chat-view-button, chat-input.tsx:372-403) to the RIGHT of the glass field and outside it, distinct from the send button (testID chat-input-send-button, inside the field, lines 340-369). It calls onToggleChatMode → cycleTranscript (index.tsx:411-420, 1385) to open/cycle the full transcript. Verify the two are separate tap targets, the chat-view button opens the full chat (chatMode true), and it renders as a navigation affordance distinct from send (different icon: chat-outline vs arrow-right; different position). (2) Suggestion-card visibility: the slot gate is `isIdle && !hasActiveRoute && suggestions.length > 0 && !isPlanning && !chatMode` (chat-input.tsx:268), and hasActiveRoute = !!agentActiveOption (index.tsx:257). Verify cards hide when a route is active on the map and return when the active route is cleared (e.g. via clearAll / new session which nulls the selection and resolves agentActiveOption to null). Harden any gap (e.g. ensure clearing actually flips hasActiveRoute back to false so cards reappear). Maps to T-DISC-011 (full-chat button distinct from send; clearing returns cards) and T-DISC-009 (cards hide/return on route show/clear).

## Critical Constraints

- The full-chat button MUST be a separate tap target from the send button (chat-input-chat-view-button is outside the glass field; chat-input-send-button is inside it) — do NOT merge them.
- hasActiveRoute MUST derive from !!agentActiveOption (index.tsx:257) — i.e. an active route plotted on the map — NOT from 'session has messages'. Cards hide when a route is shown, return when it is cleared.
- The button opens/cycles the full chat via the existing chatMode toggle / cycleTranscript — do NOT introduce a new navigation route.
- Touch targets >=44pt (button is currently 48pt) — do not shrink below 44pt.
- This is verify/harden — keep the existing onToggleChatMode wiring and testIDs intact.

## Acceptance Criteria

### AC-1: Full-chat button is distinct from send and opens full chat
*(PRIMARY)*
- **flow_ref:** `HF-DISC-11-CORE` · `.spec/scenarios/UC-DISC-11/core-plan-view-no-separate-screen.scenario.md` *(bound 2026-06-23 by /kb-e2e-retrofit --apply)*
- **GIVEN** the plan view in map mode
- **WHEN** the rider presses chat-input-chat-view-button
- **THEN** the full chat transcript opens (chatMode true) and the button is a separate element from chat-input-send-button with a distinct icon
- **Test tier:** `PRIMARY` · **Service:** real-device Maestro + live Convex dev
- **Verify:** `.maestro/discovery-full-gate.yaml` (step 8: footer full-chat button + suggestion visibility)
- **Supplementary verify:** `pnpm test app/(app)/(tabs)/index.footer-visibility.integration.test.tsx` → `fullChatButtonDistinctFromSendOpensChat` (vitest @testing-library/react-native mocked wiring)
- **Scenario** (start `plan_view_map_mode`):
  - must observe: getByTestId('chat-input-chat-view-button') !== getByTestId('chat-input-send-button') (two distinct node references); both testIDs 'chat-input-chat-view-button' and 'chat-input-send-button' resolve (queryByTestId each !== null); after press: queryByTestId('chat-dismiss-keyboard-pressable') !== null (transcript node mounted, chatMode === true)
  - must NOT observe: getByTestId('chat-input-chat-view-button') === getByTestId('chat-input-send-button') (a single combined button); after press: queryByTestId('chat-dismiss-keyboard-pressable') === null (transcript still hidden); neither footer button rendered (empty footer / 0 buttons)
  - negative control (would fail if): would fail if chat-input-chat-view-button and chat-input-send-button resolve to the same node (buttons merged); would fail if onToggleChatMode is a no-op / disconnected so the press does not open the transcript; would fail if the chat-view button is a hardcoded send button (no distinct chat-outline affordance)

### AC-2: Cards hidden while a route is active
- **GIVEN** the plan view with an active route plotted (hasActiveRoute true via agentActiveOption)
- **WHEN** the discovery slot renders
- **THEN** no curated suggestion cards are shown
- **Test tier:** `PRIMARY` · **Service:** real-device Maestro + live Convex dev
- **Verify:** `.maestro/discovery-full-gate.yaml` (step 3: suggestion cards hidden when route active)
- **Supplementary verify:** `pnpm test app/(app)/(tabs)/index.footer-visibility.integration.test.tsx` → `cardsHiddenWhenRouteActive` (vitest @testing-library/react-native mocked wiring)
- **Scenario** (start `plan_view_route_active`):
  - must observe: queryAllByTestId(/^discovery-suggestion-pill-/).length === 0 (zero curated pills while a route is on the map); queryByTestId('home-route-polyline') !== null (route IS shown)
  - must NOT observe: queryAllByTestId(/^discovery-suggestion-pill-/).length >= 1 (any pill visible while hasActiveRoute); queryByTestId('home-route-polyline') === null (route unexpectedly absent); an empty map with 0 route polylines while a route should be shown
  - negative control (would fail if): would fail if visibility is keyed to 'session has messages' instead of hasActiveRoute (cards persist while a route is shown); would fail if the gate is a hardcoded true so cards never hide; would fail if agentActiveOption is stubbed null so the route never registers as active

### AC-3: Cards return after the active route is cleared
- **GIVEN** the plan view with an active route then cleared (clearAll / new session)
- **WHEN** the rider clears the route
- **THEN** hasActiveRoute flips to false and the curated suggestion cards reappear
- **Test tier:** `PRIMARY` · **Service:** real-device Maestro + live Convex dev
- **Verify:** `.maestro/discovery-full-gate.yaml` (step 8: suggestion cards return after clearing)
- **Supplementary verify:** `pnpm test app/(app)/(tabs)/index.footer-visibility.integration.test.tsx` → `cardsReturnAfterRouteCleared` (vitest @testing-library/react-native mocked wiring)
- **Scenario** (start `plan_view_route_active`):
  - must observe: queryAllByTestId(/^discovery-suggestion-pill-/).length >= 1 (curated pills returned after clear); queryByTestId('home-route-polyline') === null (route gone after clear)
  - must NOT observe: queryAllByTestId(/^discovery-suggestion-pill-/).length === 0 (zero pills after clearing — cards stuck hidden); queryByTestId('home-route-polyline') !== null (a stale polyline persisting after clear)
  - negative control (would fail if): would fail if clearing does not null agentActiveOption (hasActiveRoute stuck true, cards stay hidden); would fail if the clear handler is a no-op / disconnected from selection state; would fail if the polyline is hardcoded/static so it persists after clear

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | chat-input-chat-view-button and chat-input-send-button are distinct nodes; pressing the former opens the transcript. | AC-1 | `maestro test .maestro/discovery-full-gate.yaml` (step 8) + `pnpm test app/(app)/(tabs)/index.footer-visibility.integration.test.tsx -t fullChatButtonDistinctFromSendOpensChat` |
| TC-2 | With agentActiveOption non-null, zero discovery-suggestion-pill rows render. | AC-2 | `maestro test .maestro/discovery-full-gate.yaml` (step 3) + `pnpm test app/(app)/(tabs)/index.footer-visibility.integration.test.tsx -t cardsHiddenWhenRouteActive` |
| TC-3 | After clear, hasActiveRoute false and >=1 curated pill returns. | AC-3 | `maestro test .maestro/discovery-full-gate.yaml` (step 8) + `pnpm test app/(app)/(tabs)/index.footer-visibility.integration.test.tsx -t cardsReturnAfterRouteCleared` |

## Reading List

- `components/chat/chat-input.tsx` (264-404) — PRIMARY — suggestion-slot visibility gate (268), send button (340-369), standalone chat-view button (372-403) distinct from send
- `app/(app)/(tabs)/index.tsx` (255-264, 411-420, 989-999, 1375-1391) — hasActiveRoute = !!agentActiveOption, cycleTranscript, clearAll, and the ChatInput onToggleChatMode/hasActiveRoute wiring
- `hooks/use-active-session-route.ts` (73-95) — how activeOption resolves null when there is no plan / after clear — the signal cards key off
- `.spec/prds/mvp/05-uc-disc.md` (99-113) — UC-DISC-11 AC3/AC4 (full-chat button distinct from send) + UC-DISC-09 AC4 (cards hide/return)
- `.spec/prds/mvp/10-e2e-testing-criteria.md` (91-95) — T-DISC-011 — full-chat button distinct from send; clearing returns cards

## Guardrails

- ONE chat-input component, state-driven — no per-state button files.
- Buttons >=44pt; preserve chat-input-send-button and chat-input-chat-view-button testIDs.
- Active/selected state via useSemanticTheme tokens (primary vs surface) — no hardcoded hex.

## Design

- ref: DESIGN-S01-004 (footer full-chat button distinction: icon/shape vs send; >=44pt; active-state)
- ref: DESIGN-S01-001 (cards hidden when a route is shown)
- ref: 07-ui-infrastructure.md §1 (full-chat footer button reuses chatMode toggle, distinct from send)

## Verification Gates

| Gate | Command |
|------|---------|
| test | `maestro test .maestro/discovery-full-gate.yaml` |
| typecheck | `pnpm type-check` |
| lint | `pnpm exec biome check 'app/(app)/(tabs)/index.tsx' components/chat/chat-input.tsx 'app/(app)/(tabs)/index.footer-visibility.integration.test.tsx'` |
| scope | `git diff --name-only ⊆ scope.write_allowed` |
| scenario | `RED-against-empty: AC-2/AC-3 must fail if visibility is wrongly keyed to 'has messages' (cards visible during an active route) before hardening` |
| human_gate | `Folds into T-DISC-011 / T-DISC-009 (real device): tap footer button opens full chat (distinct from send); cards hide on route show and return on clear` |

## Coding Standards

- No `any`; hasActiveRoute typed boolean.
- Integration test renders the real screen against live Convex; no mocked active-route hook.
- Keep cycleTranscript as the single chat-open path; no new route.

## Dependencies

- Depends on: DISC-016 (tap→plot), DISC-017 (curated-only slot)
- Blocks: None
- Parallel: DISC-019, DISC-020

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "fixtures": {
    "plan_view_map_mode": {
      "description": "plan view rendered in map mode (chatMode false), signed-in against live Convex, no active route",
      "seed_method": "migration_fixture",
      "records": [
        "chatMode false",
        "no active route plan"
      ]
    },
    "plan_view_route_active": {
      "description": "plan view with a curated/agent route plan resolved so agentActiveOption is non-null (route on the map)",
      "seed_method": "migration_fixture",
      "records": [
        "one resolved route_plan with options",
        "selectedRouteId resolving to an active option"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN the plan view in map mode WHEN the rider presses chat-input-chat-view-button THEN the full chat transcript opens (chatMode true) and the button is a separate element from chat-input-send-button with a distinct icon",
      "verify": ".maestro/discovery-full-gate.yaml",
      "supplementary_verify": "pnpm test app/(app)/(tabs)/index.footer-visibility.integration.test.tsx` → `fullChatButtonDistinctFromSendOpensChat",
      "scenario": {
        "start_ref": "plan_view_map_mode",
        "tier": "visible",
        "test_tier": "PRIMARY",
        "verification_service": "real-device Maestro + live Convex dev",
        "negative_control": {
          "would_fail_if": [
            "would fail if chat-input-chat-view-button and chat-input-send-button resolve to the same node (buttons merged)",
            "would fail if onToggleChatMode is a no-op / disconnected so the press does not open the transcript",
            "would fail if the chat-view button is a hardcoded send button (no distinct chat-outline affordance)"
          ]
        },
        "evidence": {
          "artifact_type": "screenshot",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "plan_view_map_mode",
            "action": {
              "actor": "user",
              "steps": [
                "render plan view in map mode",
                "assert getByTestId('chat-input-chat-view-button') !== getByTestId('chat-input-send-button')",
                "fireEvent.press(chat-input-chat-view-button)",
                "assert the ChatTranscript is now mounted/visible (chatMode true)"
              ]
            },
            "end_state": {
              "must_observe": [
                "getByTestId('chat-input-chat-view-button') !== getByTestId('chat-input-send-button') (two distinct node references)",
                "both testIDs 'chat-input-chat-view-button' and 'chat-input-send-button' resolve (queryByTestId each !== null)",
                "after press: queryByTestId('chat-dismiss-keyboard-pressable') !== null (transcript node mounted, chatMode === true)"
              ],
              "must_not_observe": [
                "getByTestId('chat-input-chat-view-button') === getByTestId('chat-input-send-button') (a single combined button)",
                "after press: queryByTestId('chat-dismiss-keyboard-pressable') === null (transcript still hidden)",
                "neither footer button rendered (empty footer / 0 buttons)"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN the plan view with an active route plotted (hasActiveRoute true via agentActiveOption) WHEN the discovery slot renders THEN no curated suggestion cards are shown",
      "verify": ".maestro/discovery-full-gate.yaml",
      "supplementary_verify": "pnpm test app/(app)/(tabs)/index.footer-visibility.integration.test.tsx` → `cardsHiddenWhenRouteActive",
      "scenario": {
        "start_ref": "plan_view_route_active",
        "tier": "visible",
        "test_tier": "PRIMARY",
        "verification_service": "real-device Maestro + live Convex dev",
        "negative_control": {
          "would_fail_if": [
            "would fail if visibility is keyed to 'session has messages' instead of hasActiveRoute (cards persist while a route is shown)",
            "would fail if the gate is a hardcoded true so cards never hide",
            "would fail if agentActiveOption is stubbed null so the route never registers as active"
          ]
        },
        "evidence": {
          "artifact_type": "screenshot",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "plan_view_route_active",
            "action": {
              "actor": "user",
              "steps": [
                "render plan view with an active route plan resolved (agentActiveOption non-null)",
                "query for discovery-suggestion-pill rows"
              ]
            },
            "end_state": {
              "must_observe": [
                "queryAllByTestId(/^discovery-suggestion-pill-/).length === 0 (zero curated pills while a route is on the map)",
                "queryByTestId('home-route-polyline') !== null (route IS shown)"
              ],
              "must_not_observe": [
                "queryAllByTestId(/^discovery-suggestion-pill-/).length >= 1 (any pill visible while hasActiveRoute)",
                "queryByTestId('home-route-polyline') === null (route unexpectedly absent)",
                "an empty map with 0 route polylines while a route should be shown"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN the plan view with an active route then cleared (clearAll / new session) WHEN the rider clears the route THEN hasActiveRoute flips to false and the curated suggestion cards reappear",
      "verify": ".maestro/discovery-full-gate.yaml",
      "supplementary_verify": "pnpm test app/(app)/(tabs)/index.footer-visibility.integration.test.tsx` → `cardsReturnAfterRouteCleared",
      "scenario": {
        "start_ref": "plan_view_route_active",
        "tier": "visible",
        "test_tier": "PRIMARY",
        "verification_service": "real-device Maestro + live Convex dev",
        "negative_control": {
          "would_fail_if": [
            "would fail if clearing does not null agentActiveOption (hasActiveRoute stuck true, cards stay hidden)",
            "would fail if the clear handler is a no-op / disconnected from selection state",
            "would fail if the polyline is hardcoded/static so it persists after clear"
          ]
        },
        "evidence": {
          "artifact_type": "screenshot",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "plan_view_route_active",
            "action": {
              "actor": "user",
              "steps": [
                "start with an active route (cards hidden, polyline shown)",
                "trigger clear (MapControls onClear / new session)",
                "await agentActiveOption to resolve null",
                "query the slot"
              ]
            },
            "end_state": {
              "must_observe": [
                "queryAllByTestId(/^discovery-suggestion-pill-/).length >= 1 (curated pills returned after clear)",
                "queryByTestId('home-route-polyline') === null (route gone after clear)"
              ],
              "must_not_observe": [
                "queryAllByTestId(/^discovery-suggestion-pill-/).length === 0 (zero pills after clearing — cards stuck hidden)",
                "queryByTestId('home-route-polyline') !== null (a stale polyline persisting after clear)"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "chat-input-chat-view-button and chat-input-send-button are distinct nodes; pressing the former opens the transcript.",
      "maps_to_ac": "AC-1",
      "verify": "maestro test .maestro/discovery-full-gate.yaml + pnpm test app/(app)/(tabs)/index.footer-visibility.integration.test.tsx -t fullChatButtonDistinctFromSendOpensChat"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "With agentActiveOption non-null, zero discovery-suggestion-pill rows render.",
      "maps_to_ac": "AC-2",
      "verify": "maestro test .maestro/discovery-full-gate.yaml + pnpm test app/(app)/(tabs)/index.footer-visibility.integration.test.tsx -t cardsHiddenWhenRouteActive"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "After clear, hasActiveRoute false and >=1 curated pill returns.",
      "maps_to_ac": "AC-3",
      "verify": "maestro test .maestro/discovery-full-gate.yaml + pnpm test app/(app)/(tabs)/index.footer-visibility.integration.test.tsx -t cardsReturnAfterRouteCleared"
    }
  ]
}
-->
