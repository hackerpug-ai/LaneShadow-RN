# RR-S09-E2E-IOS-T01 — iOS XCUITest live route-results E2E on MapApp

> Status: 🔵 Backlog
> Cycle: 1
> Updated: 2026-05-14T20:25:00.000Z (retrofitted for MAPAPP-DOCTRINE 2026-05-14)

> **Task ID:** RR-S09-E2E-IOS-T01
> **Sprint:** [Sprint 09 — MapApp · Route Results State](./SPRINT.md)
> **Agent:** swift-implementer
> **Estimate:** 180 min
> **Type:** FEATURE
> **Status:** Backlog
> **Priority:** P0
> **Effort:** M
> **Sprint ID:** sprint-09-route-results-screen
> **PRD Refs:** UC-CHAT-03, UC-CHAT-04, Sprint 09 — Real Device E2E

## Background

**Doctrine:** Per `RULES.md` § Design Rules › One View, Many States, this E2E asserts the route-results experience as a state on `MapApp` — including the **persistent-host invariant** that `MapApp` and its `LSMap` instance preserve identity across the `.planning → .routeResults` transition (no remount). The E2E targets MapApp-namespaced accessibility identifiers (`mapapp-routeresults-card-*`, `mapapp-routeresults-recall-chip`, `mapapp-routeresults-chat-input`, `mapapp-routeresults-navigator-message`) established in RR-S09-IOS-T02 / T04.

Per `RULES.md` §"Real Device E2E Testing", every non-sandbox human-testing gate must include real-device evidence. Sprint 09's gate exercises live app flows — Convex subscriptions, Mapbox rendering on MapApp's persistent `LSMap`, agent.sendMessage refine triggering `MapAppState` mutation — and therefore requires real-iPhone XCUITest evidence. This task extends `ios/LaneShadowUITests/E2E/` with an end-to-end scenario that:

1. Authenticates via `CLERK_TEST_EMAIL`/`CLERK_TEST_PASSWORD` from `.env.local`
2. Triggers a plan from MapApp's `.idle` state via suggestion chip → `.planning` → `.routeResults` (all on the same `MapApp` instance)
3. Asserts the 3 polylines appear on the persistent `LSMap`
4. Taps an alt card (`mapapp-routeresults-card-1`) and asserts polyline promotion + card stripe re-tint
5. Submits a refine prompt into `mapapp-routeresults-chat-input` and asserts the same `sessionId` is reused (validated via Convex query) AND `MapAppState` mutates back to `.planning`
6. Dismisses the navigator message and asserts the `mapapp-routeresults-recall-chip` appears
7. Taps Recall and asserts the message re-pins
8. Asserts MapApp's `LSMap` instance identity is preserved across `.planning → .routeResults` (via debug-bridge identity capture or screenshot-cross-correlation)
9. Records `.xcresult` artifacts + screenshots under `ios/build/E2E/`

## Critical Constraints

**MUST:**
- MUST extend `ios/LaneShadowUITests/E2E/MapAppRouteResultsE2ETests.swift` (or create) with a `test_mapApp_planResults_altSelect_refine_dismissRecall_happyPath` method
- MUST authenticate via the canonical `CLERK_TEST_EMAIL`/`CLERK_TEST_PASSWORD` pattern from `.env.local` per `docs/REAL_DEVICE_E2E.md`
- MUST assert all 7 behavioral phases (auth → MapApp `.idle` → `.planning` → `.routeResults` polylines → alt select → refine → dismiss/recall) inside a single XCUITest method, with appropriate `XCTAssertTrue` / `waitForExistence` invocations using the canonical accessibility identifiers from RR-S09-IOS-T02 / T04
- MUST validate sessionId reuse during refine by querying the Convex DB (via a helper that calls `db.routePlans.getPlanById` then asserts the message's `sessionId` matches the pre-refine value)
- MUST assert MapApp's persistent-host invariant: capture the `LSMap` view instance identity (or accessibility-tree snapshot) before and after the `.planning → .routeResults` transition and assert no remount occurred
- MUST attach screenshots at each phase boundary via `XCTAttachment(screenshot:)`
- MUST run successfully on both iOS Simulator (CI gate) AND real iPhone (gate evidence)
- MUST record `.xcresult` bundle under `ios/build/E2E/route-results/`

**NEVER:**
- NEVER use mock auth or stub Convex — this is a REAL device E2E
- NEVER skip the Convex DB validation step for sessionId reuse; it's the only objective proof
- NEVER skip the persistent-host invariant assertion — the doctrine's core claim is that MapApp + LSMap don't remount on state transitions
- NEVER use sleep/wait-fixed-time; use `waitForExistence(timeout:)` with sensible timeouts
- NEVER commit `CLERK_TEST_EMAIL` / `CLERK_TEST_PASSWORD` literal values; read from `.env.local`
- NEVER assert on legacy `RouteResultsScreen` identifiers — they're pre-doctrine and the live path is MapApp's `.routeResults` state

**STRICTLY:**
- STRICTLY follow `docs/REAL_DEVICE_E2E.md` for the canonical auth pattern + evidence directory structure
- STRICTLY follow `RULES.md` §"Real Device E2E Testing" — Android-only steps in this E2E are MANUAL/BLOCKED (no Android XCUITest equivalent yet); record explicitly
- STRICTLY use accessibility identifiers established in RR-S09-IOS-T02 / T04 (`mapapp-routeresults-card-{0,1,2}`, `mapapp-routeresults-recall-chip`, `mapapp-routeresults-chat-input`, `mapapp-routeresults-navigator-message`, etc.)

## Specification

**Objective:** End-to-end XCUITest covering MapApp's plan → routeResults → altSelect → refine → dismissRecall flow on a real iPhone, validating sessionId reuse via Convex query AND MapApp persistent-host identity preservation, producing `.xcresult` + screenshots as gate evidence.

**Success State:** `xcodebuild test -scheme LaneShadowUITests -destination 'platform=iOS,name=iPhone {real-device}'` exits 0 with the new test passing; `.xcresult` artifacts under `ios/build/E2E/route-results/` contain at minimum 7 screenshots (one per phase boundary including identity-check); the test also passes on iOS Simulator as a CI gate.

## Acceptance Criteria

### AC-1 — Happy-path test method authored and authentication succeeds

**GIVEN** `.env.local` contains valid `CLERK_TEST_EMAIL` and `CLERK_TEST_PASSWORD`
**WHEN** the test method `test_mapApp_planResults_altSelect_refine_dismissRecall_happyPath` runs on a real iPhone
**THEN** the app launches, the test enters credentials and signs in, `MapApp` appears in `.idle` state with the user's real name visible in the LSContextCapsule
**Verify:** `xcodebuild test -scheme LaneShadowUITests -destination 'platform=iOS,name=iPhone {real-device}' -only-testing:LaneShadowUITests/E2E/MapAppRouteResultsE2ETests/test_mapApp_planResults_altSelect_refine_dismissRecall_happyPath` exits 0 through the auth phase

### AC-2 — Plan flow reaches MapApp.routeResults with 3 polylines on persistent LSMap

**GIVEN** authentication succeeded; `MapApp` is in `.idle`
**WHEN** the test taps a suggestion chip and waits for the agent to complete the plan (`.idle → .planning → .routeResults`)
**THEN** MapApp transitions to `.routeResults` within the documented timeout; 3 polylines are visible on the same `LSMap` (asserted via XCUIElement query on `mapapp` map sub-elements OR `mapapp-routeresults-navigator-message` card count == 3)
**Verify:** Test method passes the `routeResults` phase + `XCTAttachment` screenshot is attached

### AC-3 — Persistent-host invariant: LSMap identity preserved across .planning → .routeResults

**GIVEN** the test captures the `LSMap` view instance identity (or accessibility-tree snapshot) before the `.planning → .routeResults` transition
**WHEN** the transition completes
**THEN** the captured identity (or snapshot's key invariants) matches the post-transition identity — no remount of the Mapbox view, no remount of `MapApp` itself
**Verify:** Test passes the `persistentHost` phase + identity-comparison assertion passes + screenshot attached

### AC-4 — Alt-selection promotion validated via accessibility query

**GIVEN** MapApp `.routeResults` is displayed with `selectedRouteId == best-id`
**WHEN** the test taps the `mapapp-routeresults-card-1` element (alt1)
**THEN** the test asserts via XCUIElement state query that the alt1 card has the "selected" trait (sage stripe present); the polyline-state assertion is captured via screenshot for vision review
**Verify:** Test passes the `altSelect` phase + screenshot attached

### AC-5 — Refine reuses sessionId, validated via Convex query AND state mutates to .planning

**GIVEN** MapApp `.routeResults` state with `sessionId == "sess-xyz"` (captured pre-refine via accessibility query or test-only debug bridge on `MapAppViewModel`)
**WHEN** the test types "make it shorter" into `mapapp-routeresults-chat-input` and submits
**THEN** MapApp mutates back to `.planning` state (`mapapp` UI shows planning overlays); when the agent completes, MapApp returns to `.routeResults` with replacement polylines; a helper Convex query asserts that the `sessionMessages` row created has `sessionId == "sess-xyz"` (same session); NO new `planningSessions` row is created
**Verify:** Test passes the `refine` phase + Convex query result is logged

### AC-6 — Dismiss + Recall flow validated on MapApp

**GIVEN** MapApp `.routeResults` state with `LSNavigatorMessage` visible (identified by `mapapp-routeresults-navigator-message`)
**WHEN** the test taps the dismiss chevron, waits, then taps `mapapp-routeresults-recall-chip`
**THEN** the test asserts via accessibility query that after dismiss, `mapapp-routeresults-recall-chip` exists AND `mapapp-routeresults-navigator-message` does NOT exist; after Recall tap, the inverse holds
**Verify:** Test passes the `dismissRecall` phase + 2 screenshots attached

### AC-7 — `.xcresult` evidence recorded under canonical path

**GIVEN** the test runs to completion
**WHEN** `xcodebuild test` finishes
**THEN** an `.xcresult` bundle exists under `ios/build/E2E/route-results/` containing at minimum 7 `.png` attachments (auth, idle, plan, results, persistentHost, altSelect, refine, dismissRecall)
**Verify:** `ls ios/build/E2E/route-results/*.xcresult/ | wc -l` ≥ 1 AND xcresulttool extracts ≥ 7 attachment PNGs

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|---|---|---|---|---|
| TC-1 | Test method exists and auth passes | AC-1 | `xcodebuild test -only-testing:.../test_mapApp_planResults_altSelect_refine_dismissRecall_happyPath` | happy_path |
| TC-2 | MapApp.routeResults reached with 3 polylines | AC-2 | Same | happy_path |
| TC-3 | Persistent-host LSMap identity preserved across .planning → .routeResults | AC-3 | Same | happy_path |
| TC-4 | Alt-selection promotion asserted via accessibility | AC-4 | Same | happy_path |
| TC-5 | Refine reuses sessionId (Convex query confirms) AND state mutates to .planning | AC-5 | Same | happy_path |
| TC-6 | Dismiss + Recall flow asserted via accessibility | AC-6 | Same | happy_path |
| TC-7 | `.xcresult` evidence with ≥ 7 attachment PNGs | AC-7 | `xcrun xcresulttool ...` lists attachments | edge |
| TC-8 | Test passes on iOS Simulator (CI gate) | AC-1-7 | `xcodebuild test ... -destination 'platform=iOS Simulator,name=iPhone 16'` | edge |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `docs/REAL_DEVICE_E2E.md` | all | [PRIMARY PATTERN] Canonical auth + evidence pattern; XCUITest device-target setup |
| `ios/LaneShadowUITests/E2E/` | all | Existing E2E patterns from prior sprints |
| `.env.local.example` | all | `CLERK_TEST_EMAIL` / `CLERK_TEST_PASSWORD` keys |
| `.spec/prds/v3-integration/tasks/sprint-08-planning-state/PLAN-S08-E2E-IOS-T01-planning-state-live-e2e.md` | all | Sprint 08 sibling E2E — same architecture, different content; Sprint 08 also asserts MapApp persistent-host invariant |
| `ios/LaneShadow/Views/Templates/MapApp.swift` + `ios/LaneShadow/Features/MapApp/MapAppState.swift` | all | Architecture being asserted |
| RR-S09-IOS-T01 / T02 / T03 / T04 task files | all | Accessibility identifiers established for each phase |

## Guardrails

**Write-Allowed:**
- `ios/LaneShadowUITests/E2E/MapAppRouteResultsE2ETests.swift` (NEW or MODIFY — rename of legacy `SignInToRouteResultsE2ETests.swift` is acceptable)
- `ios/LaneShadowUITests/Helpers/ConvexDBQueryHelper.swift` (NEW — for sessionId validation; optional)
- `ios/LaneShadowUITests/Helpers/MapAppIdentityHelper.swift` (NEW — for persistent-host identity capture/comparison; optional)
- `ios/project.yml` (MODIFY only if file additions require regeneration)

**Write-Prohibited:**
- `.env.local` — never commit; values come from environment
- `ios/LaneShadow/**` — non-test code paths
- `android/**`, `server/**`, `react-native/**`, `tokens/**` — out of scope
- `ios/LaneShadow.xcodeproj/**` — generated

## Design

**References:**
- `docs/REAL_DEVICE_E2E.md`
- `RULES.md` § Design Rules › One View, Many States, §"Real Device E2E Testing"
- Sprint 08 PLAN-S08-E2E-IOS-T01

**Interaction Notes:** This is the canonical real-device gate evidence for Sprint 09. The persistent-host invariant assertion (AC-3) is the doctrine's load-bearing check — if it fails, the entire One View, Many States architecture is broken for this sprint. Android-only behaviors (e.g., Android-specific dismiss/recall on emulator) are recorded MANUAL/BLOCKED in `gate-evidence/`, not asserted in this test.

**Pattern:** Sprint 08 PLAN-S08-E2E-IOS-T01 — multi-phase XCUITest with attachment evidence + Convex DB validation helper + persistent-host identity helper.

**Pattern Source:** `.spec/prds/v3-integration/tasks/sprint-08-planning-state/PLAN-S08-E2E-IOS-T01-planning-state-live-e2e.md`

**Anti-Pattern:** Mock auth; stubbed Convex; sleep-based waits; committing `.env.local`; relying on screenshot diff alone for sessionId reuse (must use the Convex query helper); skipping the persistent-host invariant assertion; asserting on legacy `RouteResultsScreen` identifiers.

## Verification Gates

| AC | Command |
|---|---|
| AC-1-6 | `xcodebuild test -scheme LaneShadowUITests -destination 'platform=iOS,name=iPhone {real-device}' -only-testing:LaneShadowUITests/E2E/MapAppRouteResultsE2ETests/test_mapApp_planResults_altSelect_refine_dismissRecall_happyPath` (exit 0) |
| AC-7 | `ls ios/build/E2E/route-results/*.xcresult/` exists; `xcrun xcresulttool get --path ... --format json \| jq '.actions._values[].actionResult.testFailureSummaries._values \| length'` returns 0 |
| simulator | `xcodebuild test -scheme LaneShadowUITests -destination 'platform=iOS Simulator,name=iPhone 16'` (exit 0) |

## Agent Assignment

**Agent:** swift-implementer
**Rationale:** XCUITest authoring in `ios/LaneShadowUITests/E2E/` with Convex DB helper + persistent-host identity helper. Matches swift-implementer mandate. Reviewer: `swift-reviewer`.

## Coding Standards

- `docs/REAL_DEVICE_E2E.md`
- `RULES.md` § Design Rules › One View, Many States, §"Real Device E2E Testing"
- `brain/docs/mobile-architecture/testing-strategy.md`

## Dependencies

**Depends on:**
- RR-S09-IOS-T01, T02, T03, T04 (all iOS implementation complete; accessibility identifiers established under `mapapp-routeresults-*`)
- RR-S09-CVX-T01 (sessionId reuse contract test confirms the backend invariant)

**Blocks:**
- RR-S09-T11 (Sprint 09 gate requires real-iPhone evidence including persistent-host invariant)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"Happy-path test method authored; auth phase passes; MapApp.idle shown with user name","verify":"xcodebuild test on real-device -only-testing:.../test_mapApp_planResults_altSelect_refine_dismissRecall_happyPath exits 0 through auth","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-2","type":"acceptance_criterion","description":"Plan flow reaches MapApp.routeResults with 3 polylines on persistent LSMap","verify":"Test method passes results phase + attachment screenshot","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-3","type":"acceptance_criterion","description":"Persistent-host invariant: LSMap identity preserved across .planning → .routeResults transition","verify":"Test passes persistentHost phase + identity assertion","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-4","type":"acceptance_criterion","description":"Alt-selection promotion asserted via accessibility query on mapapp-routeresults-card-1","verify":"Test passes altSelect phase + attachment","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-5","type":"acceptance_criterion","description":"Refine reuses sessionId (Convex DB query confirms) AND MapAppState mutates to .planning","verify":"Test passes refine phase + Convex query logged","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-6","type":"acceptance_criterion","description":"Dismiss + Recall flow asserted via accessibility query on mapapp-routeresults-* ids","verify":"Test passes dismissRecall phase + 2 attachments","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-7","type":"acceptance_criterion","description":".xcresult bundle exists under ios/build/E2E/route-results/ with >= 7 attachment PNGs","verify":"xcresulttool extracts >= 7 attachments","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"TC-1","type":"test_criterion","description":"Test method auth phase passes","verify":"xcodebuild test on real device exits 0","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"},
    {"id":"TC-2","type":"test_criterion","description":"3 polylines visible test","verify":"xcodebuild test passes results phase","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-2"},
    {"id":"TC-3","type":"test_criterion","description":"Persistent-host identity test","verify":"xcodebuild test passes persistentHost phase","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-3"},
    {"id":"TC-4","type":"test_criterion","description":"Alt-selection promotion test","verify":"xcodebuild test passes altSelect phase","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-4"},
    {"id":"TC-5","type":"test_criterion","description":"sessionId reuse via Convex query + state mutation","verify":"xcodebuild test passes refine + Convex query logged","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-5"},
    {"id":"TC-6","type":"test_criterion","description":"Dismiss + Recall accessibility assertions","verify":"xcodebuild test passes dismissRecall phase","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-6"},
    {"id":"TC-7","type":"test_criterion","description":".xcresult with >= 7 PNG attachments","verify":"xcresulttool count","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-7"},
    {"id":"TC-8","type":"test_criterion","description":"Simulator pass for CI gate","verify":"xcodebuild test on Simulator exits 0","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"}
  ]
}
-->
