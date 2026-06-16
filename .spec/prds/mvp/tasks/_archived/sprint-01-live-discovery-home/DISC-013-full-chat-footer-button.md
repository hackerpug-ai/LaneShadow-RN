# DISC-013: Footer "open full chat" button to the right of the chat input, distinct from the send action

| Field | Value |
|---|---|
| Sprint | [sprint-01-live-discovery-home](./SPRINT.md) |
| Type | FEATURE |
| Agent | implementer = `react-native-ui-implementer` · reviewer = `react-native-ui-reviewer` |
| Estimate | S |
| Priority | P2 |
| Status | Backlog |
| Proposed By | react-native-ui-planner |
| Depends on | — (independent) |
| Blocks | — |
| PRD refs | DELTA-001 §2/§5/§7 · ROADMAP Sprint 01 (DISC-013) · 05-uc-disc |

## Background

DELTA-001 demotes full chat to a deliberate affordance behind the map+chat home. A standalone chat-view toggle already exists to the right of the glass field (`chat-input.tsx:329-363`, testID `chat-input-chat-view-button`) wired to `cycleTranscript`, but it reads as a generic toggle and is not visibly distinct from the in-field send action. This task makes it the clear "open full chat" affordance — distinct icon/label, outside-right of the field, ≥44pt — and proves with e2e that open/close returns to the map and that the chat-view tap never sends the typed message.

## Critical constraints

- Reuse the EXISTING chatMode toggle / cycleTranscript (index.tsx:388) and the existing onToggleChatMode prop — do NOT add a new navigation mechanism or a new screen.
- The full-chat button is OUTSIDE-RIGHT of the glass field; the send action stays INSIDE the glass field — they must be distinct tap targets, not merged.
- Touch target ≥ 44x44pt; the existing chatViewBtnSize is 48 — keep ≥44.
- Closing the full transcript returns to map (cycleTranscript already does setChatMode(false)) — do not break that path.
- Use useSemanticTheme() tokens; no hardcoded hex; accessibilityLabel must distinguish it from send.

## Specification

**Objective:** A footer button to the right of the chat input (outside the glass field) opens the full transcript via the existing chatMode toggle, and closing it returns to the map — visually and semantically distinct from the in-field send action.

**Success state:** A footer button to the right of the chat input (outside the glass field) opens the full transcript via the existing chatMode toggle, and closing it returns to the map — visually and semantically distinct from the in-field send action. Verified end-to-end on a real iOS Simulator against a live Convex deployment (the negative controls below bite an empty/static/disconnected build).

## Acceptance criteria

- **AC-1** (PRIMARY) — Footer button opens the full transcript. **GIVEN** The home screen in map mode with the chat input docked **WHEN** The rider taps the footer chat-view button to the right of the input **THEN** The full transcript opens (chatMode true). _test_tier: e2e · service: iOS Simulator + live Convex._ **Oracle:** observe transcript visible (header "Chat"); ≥1 agent message bubble rendered in the transcript; must NOT observe map still in map mode with no transcript; a pushed separate screen. **Negative control:** button not rendered (empty); tap no-op; tap pushes a new screen (wrong path).
- **AC-2** — Closing the transcript returns to map. **GIVEN** The full transcript is open (chatMode true) **WHEN** The rider taps the footer button again (now in chat mode) **THEN** The transcript closes and the view returns to the map (chatMode false). _test_tier: e2e · service: iOS Simulator._ **Oracle:** observe map visible (header "Lane Shadow"); 1 chat input docked over the map; must NOT observe transcript still covering the map (start/empty signature: 0 / none present). **Negative control:** tap in chat mode does not setChatMode(false) (disconnect); transcript stays open (no-op).
- **AC-3** — Full-chat button is distinct from the send action. **GIVEN** The chat input has text entered (send is active) **WHEN** The footer chat-view button and the in-field send button are both present **THEN** They are separate tap targets with distinct testIDs and accessibility labels (tapping full-chat does not send; tapping send does not open the transcript). _test_tier: e2e · service: iOS Simulator._ **Oracle:** observe distinct testID `chat-input-send-button` (in field) and chat-input-chat-view-button (outside-right); the transcript opens (1 transition to chatMode) on the chat-view tap; must NOT observe "hello" sent by the chat-view tap (start/empty signature: 0 / none present); a single merged send/chat control. **Negative control:** the two actions are merged into one button (static); chat-view tap sends the message (wrong wiring); send tap opens the transcript (wrong wiring).

## Test criteria

| ID | Statement | Maps to | Verify |
|---|---|---|---|
| TC-1 | Send and chat-view buttons carry distinct testIDs | AC-3 | `grep -n 'chat-input-send-button' components/chat/chat-input.tsx && grep -n 'chat-input-chat-view-button' components/chat/chat-input.tsx` |
| TC-2 | Type-check + lint clean | AC-1 | `pnpm type-check && pnpm lint` |

## Reading list

- `components/chat/chat-input.tsx:328-363` — [PRIMARY PATTERN] The existing standalone chatViewButton (outside-right toggle, testID `chat-input-chat-view-button`) — refine this into the explicit 'open full chat' affordance.
- `app/(app)/(tabs)/index.tsx:384-397, 1346-1358` — cycleTranscript (chat↔map toggle) and the ChatInput call site passing onToggleChatMode={cycleTranscript}.
- `components/chat/chat-input.tsx:276-325` — The in-field send/cancel button (testID `chat-input-send-button`) — must stay distinct from the chat-view button.
- `app/(app)/(tabs)/index.tsx:1216-1235` — Header title flips to 'Chat' in chatMode — the observable signal the transcript opened.

## Guardrails

**Write-allowed:** `app/(app)/(tabs)/index.tsx` (MODIFY: Ensure `onToggleChatMode={cycleTranscript}` stays wired (already at :1354); if any visual distinction copy/icon needs adjusting at the call site, do it here.) · `components/chat/chat-input.tsx` (MODIFY: Refine the standalone chat-view toggle (lines 328-363) so it reads clearly as 'open full chat' (distinct icon/label from send), keeping it outside-right of the glass field and ≥44pt.) · `e2e/disc-013-full-chat-button.e2e.ts` (NEW: e2e covering AC-1..AC-3.)

**Write-prohibited:** Any change to the send button wiring (handleSend) beyond keeping it distinct. · components/ui/chat-transcript.tsx — transcript itself is unchanged. · Any file not explicitly listed above

## Verification gates

1. `pnpm test` — all AC scenarios green; PRIMARY AC-1 watched RED against the start state (negative control: button not rendered (empty)) before GREEN.
2. **On-device e2e** — run each `e2e/*.e2e.ts` AC on a real iOS Simulator against a live Convex deployment (seed via the fixtures below); capture the required screenshot evidence per AC.
3. `pnpm type-check` (exit 0) · `pnpm lint` (exit 0).
4. `git diff --name-only` ⊆ write-allowed.
5. **Un-fakeable:** AC-1 evidence (screenshot) shows the asserted on-screen oracle AND the negative-control build (empty/static/disconnected) produces the must-NOT-observe state.

## Design / approach

**Design enrichment (frontend-designer):** Button already exists at chat-input.tsx:328-363 (48pt round, chat-outline/chat icon, glass+copper). DISC-013 = ensure distinct from send (send=42pt arrow-right inside glass field; this=48pt outside-right) + change chatMode=true icon to map-outline ('return to map'); accessibilityLabel chatMode?'Return to map':'Open full chat'; hint accordingly. Only change line :352-360 icon source + labels. Anti-pattern: no second button, no label text, don't match send size/icon.

**Interaction / implementation notes:**
- Reuse cycleTranscript/onToggleChatMode and the existing chatViewButton (it already exists at chat-input.tsx:329-363) — this task is making it clearly the 'open full chat' affordance, not building a new control.
- Keep the send button inside the glass field and the chat-view button outside-right.
- Give the chat-view button an accessibilityLabel that says 'Open full chat' / 'Show chat' distinct from 'Send message'.

**Ask first:**
- Changing the icon set (chat/chat-outline) if a clearer 'full chat' glyph is preferred.
- Any layout change that would move the send button outside the field.

## Dependencies

- **Depends on:** — (independent).
- **Blocks:** —.
- **Parallel:** DISC-012.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "fixtures": {
    "session_with_messages_no_route": {
      "description": "A planning_session with \u22651 agent message and no displayed route",
      "seed_method": "ui_flow",
      "records": [
        "1 planning_session",
        "1 rider text + 1 agent text message",
        "0 routing_card"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN map mode WHEN the footer chat-view button is tapped THEN the full transcript opens",
      "verify": "pnpm test -- e2e/disc-013-full-chat-button.e2e.ts -t footerButtonOpensTranscript",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "tier": "visible",
        "verification_service": "iOS Simulator + live Convex",
        "negative_control": {
          "would_fail_if": [
            "button not rendered (empty)",
            "tap no-op",
            "tap pushes a new screen (wrong path)"
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
                "Open a session with \u22651 agent message in map mode",
                "Tap testID chat-input-chat-view-button",
                "Observe"
              ]
            },
            "end_state": {
              "must_observe": [
                "transcript visible (header \"Chat\")",
                "\u22651 agent message bubble rendered in the transcript"
              ],
              "must_not_observe": [
                "map still in map mode with no transcript",
                "a pushed separate screen"
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
      "description": "GIVEN the transcript open WHEN the footer button is tapped again THEN it returns to map",
      "verify": "pnpm test -- e2e/disc-013-full-chat-button.e2e.ts -t footerButtonClosesTranscriptToMap",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "tier": "visible",
        "verification_service": "iOS Simulator",
        "negative_control": {
          "would_fail_if": [
            "tap in chat mode does not setChatMode(false) (disconnect)",
            "transcript stays open (no-op)"
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
                "Open transcript via the footer button",
                "Tap it again",
                "Observe"
              ]
            },
            "end_state": {
              "must_observe": [
                "map visible (header \"Lane Shadow\")",
                "1 chat input docked over the map"
              ],
              "must_not_observe": [
                "transcript still covering the map (start/empty signature: 0 / none present)"
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
      "description": "GIVEN text entered WHEN both buttons are present THEN full-chat and send are distinct targets",
      "verify": "pnpm test -- e2e/disc-013-full-chat-button.e2e.ts -t fullChatButtonDistinctFromSend",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "tier": "visible",
        "verification_service": "iOS Simulator",
        "negative_control": {
          "would_fail_if": [
            "the two actions are merged into one button (static)",
            "chat-view tap sends the message (wrong wiring)",
            "send tap opens the transcript (wrong wiring)"
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
                "Type \"hello\" in the field",
                "Tap testID chat-input-chat-view-button",
                "Observe send vs transcript"
              ]
            },
            "end_state": {
              "must_observe": [
                "distinct testID `chat-input-send-button` (in field) and chat-input-chat-view-button (outside-right)",
                "the transcript opens (1 transition to chatMode) on the chat-view tap"
              ],
              "must_not_observe": [
                "\"hello\" sent by the chat-view tap (start/empty signature: 0 / none present)",
                "a single merged send/chat control"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "Send and chat-view buttons carry distinct testIDs",
      "verify": "grep -n 'chat-input-send-button' components/chat/chat-input.tsx && grep -n 'chat-input-chat-view-button' components/chat/chat-input.tsx",
      "maps_to_ac": "AC-3"
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
