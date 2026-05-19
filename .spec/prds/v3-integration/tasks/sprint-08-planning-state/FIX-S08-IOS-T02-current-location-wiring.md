# FIX-S08-IOS-T02 — iOS: wire `currentLocation` through `sendPlanningMessage`

> **Task ID:** FIX-S08-IOS-T02 · **Sprint:** [Sprint 08](./SPRINT.md) · **Agent:** swift-implementer · **Estimate:** 30 min · **Type:** FEATURE · **Status:** Backlog · **Priority:** P0 · **Effort:** S
> **PRD Refs:** UC-CHAT-01, red-hat review 2026-05-19 finding F7

## Background

Red-hat review found that `ios/LaneShadow/Services/ConvexClient+LaneShadow.swift:893-903` captures `currentLocation` as a parameter then explicitly discards it with `_ = currentLocation` before calling the backend action. The Convex `sendMessage` action accepts a `currentLocation: { lat, lng }` arg, and the routing agent's system prompt reads `ctx.currentLocation` to bias geocoding. When iOS drops the location, the agent's system prompt reads "Rider's current location: unknown — ask where they are starting from", forcing an unnecessary clarification turn. This is a stub-level bug: the parameter is captured to look complete, then thrown away.

## Critical Constraints

**MUST:**
- Add `currentLocation` to the `args` dictionary before invoking `action(.sendMessage, args:)` when it is non-nil
- Encode as `["lat": loc.lat, "lng": loc.lng]` (Double values) — verify against the Convex action's accepted shape in `server/convex/actions/agent/sendMessage.ts` validator
- Remove the `_ = currentLocation` swallow

**NEVER:**
- Send `currentLocation` when nil — the backend prompt handles the absent case; omitting the key is correct
- Change the public signature of `sendPlanningMessage` — the parameter already exists
- Touch backend code

**STRICTLY:**
- Type-check against the generated Convex types (`ConvexTypes.generated.swift`) to confirm the argument shape
- Add a unit test that asserts the args dictionary contains the location key when provided

## Specification

**Objective:** Stop dropping `currentLocation` on the floor. The backend already accepts the arg; iOS just needs to send it.

**Success State:** A planning request invoked with a non-nil `LaneShadowCurrentLocation` results in a Convex action call whose args contain `currentLocation: { lat, lng }`. Verified by unit test against the mock Convex client.

## Acceptance Criteria

### AC-1 — `_ = currentLocation` removed
**GIVEN** `ios/LaneShadow/Services/ConvexClient+LaneShadow.swift`
**WHEN** grep'd
**THEN** no occurrences of `_ = currentLocation` remain
**Verify:** `grep -c "_ = currentLocation" ios/LaneShadow/Services/ConvexClient+LaneShadow.swift` returns `0`

### AC-2 — Non-nil location is included in args
**GIVEN** a mock Convex client and `LaneShadowCurrentLocation(lat: 37.77, lng: -122.42)`
**WHEN** `sendPlanningMessage(sessionId:content:currentLocation:)` is called
**THEN** the mock observes the action call with `args["currentLocation"]` equal to `["lat": 37.77, "lng": -122.42]`
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Services/ConvexClientLaneShadowTests/test_sendPlanningMessage_includesCurrentLocation`

### AC-3 — Nil location omits the key
**GIVEN** a mock Convex client and `currentLocation: nil`
**WHEN** `sendPlanningMessage` is called
**THEN** the mock observes args WITHOUT a `currentLocation` key
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Services/ConvexClientLaneShadowTests/test_sendPlanningMessage_omitsNilCurrentLocation`

### AC-4 — Live build no longer triggers location clarification on prompts with location
**GIVEN** a Simulator build with the FIX in place and a session that has a known device location
**WHEN** the rider sends "Plan a scenic 2-hour ride"
**THEN** the agent does NOT respond with "Where are you starting from?" — instead it proceeds to call `geocode` or `routing_agent` directly
**Verify:** record planning trace `.tmp/FIX-S08-IOS-T02/ac-4-trace.txt` showing first agent action is a tool call, not a clarification message

## Test Criteria

| ID | Statement | Maps to AC | Type |
|---|---|---|---|
| TC-1 | `_ = currentLocation` does not appear in the source | AC-1 | edge |
| TC-2 | Mock receives `args["currentLocation"]` when non-nil location passed | AC-2 | happy_path |
| TC-3 | Mock receives args without `currentLocation` key when nil | AC-3 | edge |
| TC-4 | Live planning run with location does not trigger clarification | AC-4 | happy_path |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `ios/LaneShadow/Services/ConvexClient+LaneShadow.swift` | 880-910 | `sendPlanningMessage` implementation |
| `ios/LaneShadow/Generated/ConvexTypes.generated.swift` | search `sendMessage` | Generated arg shape for Convex action |
| `server/convex/actions/agent/sendMessage.ts` | search `args.*validator` | Validator shape for `currentLocation` |
| `ios/LaneShadowTests/Services/` | discover | Existing convex-client tests to extend |

## Guardrails

**Write-Allowed:**
- `ios/LaneShadow/Services/ConvexClient+LaneShadow.swift` (MODIFY — wire args)
- `ios/LaneShadowTests/Services/ConvexClientLaneShadowTests.swift` (MODIFY/CREATE — add unit tests)

**Write-Prohibited:**
- `server/**`, `android/**`, `react-native/**`
- `ios/LaneShadow/Generated/` — regenerated, never hand-edited

## Design

**References:** red-hat review 2026-05-19 finding F7; `server/convex/actions/agent/sendMessage.ts` arg validator

**Pattern:** Other `args["..."] = ...` patterns in the same file (e.g., `ConvexClient+LaneShadow.swift` action invocations)

**Anti-Pattern:** Captured-then-discarded parameters (`_ = x`) — the parameter shape is fictional documentation

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `grep -c "_ = currentLocation" ios/LaneShadow/Services/ConvexClient+LaneShadow.swift` |
| AC-2 | `xcodebuild test -only-testing:LaneShadowTests/Services/ConvexClientLaneShadowTests/test_sendPlanningMessage_includesCurrentLocation` |
| AC-3 | `xcodebuild test -only-testing:LaneShadowTests/Services/ConvexClientLaneShadowTests/test_sendPlanningMessage_omitsNilCurrentLocation` |
| AC-4 | recorded trace `.tmp/FIX-S08-IOS-T02/ac-4-trace.txt` |

## Agent Assignment

**Agent:** swift-implementer
**Rationale:** Trivial Convex-client arg wiring + unit tests.

## Coding Standards

- `brain/docs/mobile-architecture/ios-principles.md`

## Dependencies

**Depends on:** —
**Blocks:** —

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "_ = currentLocation removed", "verify": "grep -c '_ = currentLocation' ios/LaneShadow/Services/ConvexClient+LaneShadow.swift returns 0", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": null },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "Non-nil location included in args", "verify": "xcodebuild test -only-testing:LaneShadowTests/Services/ConvexClientLaneShadowTests/test_sendPlanningMessage_includesCurrentLocation", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": null },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "Nil location omits the key", "verify": "xcodebuild test -only-testing:LaneShadowTests/Services/ConvexClientLaneShadowTests/test_sendPlanningMessage_omitsNilCurrentLocation", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": null },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "Live planning with location does not trigger clarification", "verify": "recorded trace .tmp/FIX-S08-IOS-T02/ac-4-trace.txt", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": null },
    { "id": "TC-1", "type": "test_criterion", "description": "_ = currentLocation absent from source", "verify": "grep -c '_ = currentLocation' ios/LaneShadow/Services/ConvexClient+LaneShadow.swift", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-1" },
    { "id": "TC-2", "type": "test_criterion", "description": "Mock receives args['currentLocation'] when non-nil", "verify": "xcodebuild test -only-testing:LaneShadowTests/Services/ConvexClientLaneShadowTests/test_sendPlanningMessage_includesCurrentLocation", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-2" },
    { "id": "TC-3", "type": "test_criterion", "description": "Mock receives args without currentLocation when nil", "verify": "xcodebuild test -only-testing:LaneShadowTests/Services/ConvexClientLaneShadowTests/test_sendPlanningMessage_omitsNilCurrentLocation", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-3" },
    { "id": "TC-4", "type": "test_criterion", "description": "Live planning skips clarification when location present", "verify": "recorded trace .tmp/FIX-S08-IOS-T02/ac-4-trace.txt", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-4" }
  ]
}
-->
