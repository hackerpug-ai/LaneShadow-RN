# RR-S09-E2E-IOS-T01 — iOS XCUITest live route-results E2E

> Status: 🔵 Backlog
> Cycle: 1
> Updated: 2026-05-14T20:25:00.000Z

> **Task ID:** RR-S09-E2E-IOS-T01
> **Sprint:** [Sprint 09 — Map View · Route Results State](./SPRINT.md)
> **Agent:** swift-implementer
> **Estimate:** 180 min
> **Type:** FEATURE
> **Status:** Backlog
> **Priority:** P0
> **Effort:** M
> **Sprint ID:** sprint-09-route-results-screen
> **PRD Refs:** UC-CHAT-03, UC-CHAT-04, Sprint 09 — Real Device E2E

## Background

Per RULES.md §"Real Device E2E Testing", every non-sandbox human-testing gate must include real-device evidence. Sprint 09's gate exercises live app flows — Convex subscriptions, Mapbox rendering, agent.sendMessage refine — and therefore requires real-iPhone XCUITest evidence. This task extends `ios/LaneShadowUITests/E2E/` with an end-to-end scenario that:

1. Authenticates via `CLERK_TEST_EMAIL`/`CLERK_TEST_PASSWORD` from `.env.local`
2. Triggers a plan from IdleScreen via suggestion chip → PlanningScreen → RouteResultsScreen
3. Asserts the 3 polylines appear
4. Taps an alt card and asserts polyline promotion + card stripe re-tint
5. Submits a refine prompt and asserts the same `sessionId` is reused (validated via Convex query)
6. Dismisses the navigator message and asserts the Recall chip appears
7. Taps Recall and asserts the message re-pins
8. Records `.xcresult` artifacts + screenshots under `ios/build/E2E/`

## Critical Constraints

**MUST:**
- MUST extend `ios/LaneShadowUITests/E2E/SignInToRouteResultsE2ETests.swift` (or create) with a `test_planResults_altSelect_refine_dismissRecall_happyPath` method
- MUST authenticate via the canonical `CLERK_TEST_EMAIL`/`CLERK_TEST_PASSWORD` pattern from `.env.local` per `docs/REAL_DEVICE_E2E.md`
- MUST assert all 6 behavioral phases (auth → plan → results polylines → alt select → refine → dismiss/recall) inside a single XCUITest method, with appropriate `XCTAssertTrue` / `waitForExistence` invocations using the canonical accessibility identifiers from RR-S09-IOS-T02 / T04
- MUST validate sessionId reuse during refine by querying the Convex DB (via a helper that calls `db.routePlans.getPlanById` then asserts the message's `sessionId` matches the pre-refine value)
- MUST attach screenshots at each phase boundary via `XCTAttachment(screenshot:)`
- MUST run successfully on both iOS Simulator (CI gate) AND real iPhone (gate evidence)
- MUST record `.xcresult` bundle under `ios/build/E2E/route-results/`

**NEVER:**
- NEVER use mock auth or stub Convex — this is a REAL device E2E
- NEVER skip the Convex DB validation step for sessionId reuse; it's the only objective proof
- NEVER use sleep/wait-fixed-time; use `waitForExistence(timeout:)` with sensible timeouts
- NEVER commit `CLERK_TEST_EMAIL` / `CLERK_TEST_PASSWORD` literal values; read from `.env.local`

**STRICTLY:**
- STRICTLY follow `docs/REAL_DEVICE_E2E.md` for the canonical auth pattern + evidence directory structure
- STRICTLY follow `RULES.md` §"Real Device E2E Testing" — Android-only steps in this E2E are MANUAL/BLOCKED (no Android XCUITest equivalent yet); record explicitly
- STRICTLY use accessibility identifiers established in RR-S09-IOS-T02 / T04 (`routeresultsscreen-card-{0,1,2}`, `routeresultsscreen-recall-chip`, etc.)

## Specification

**Objective:** End-to-end XCUITest covering plan → results → alt-select → refine → dismiss/recall flow on a real iPhone, validating sessionId reuse via Convex query, producing `.xcresult` + screenshots as gate evidence.

**Success State:** `xcodebuild test -scheme LaneShadowUITests -destination 'platform=iOS,name=iPhone {real-device}'` exits 0 with the new test passing; `.xcresult` artifacts under `ios/build/E2E/route-results/` contain at minimum 6 screenshots (one per phase); the test also passes on iOS Simulator as a CI gate.

## Acceptance Criteria

### AC-1 — Happy-path test method authored and authentication succeeds

**GIVEN** `.env.local` contains valid `CLERK_TEST_EMAIL` and `CLERK_TEST_PASSWORD`
**WHEN** the test method `test_planResults_altSelect_refine_dismissRecall_happyPath` runs on a real iPhone
**THEN** the app launches, the test enters credentials and signs in, IdleScreen appears with the user's real name visible in the LSContextCapsule
**Verify:** `xcodebuild test -scheme LaneShadowUITests -destination 'platform=iOS,name=iPhone {real-device}' -only-testing:LaneShadowUITests/E2E/SignInToRouteResultsE2ETests/test_planResults_altSelect_refine_dismissRecall_happyPath` exits 0 through the auth phase

### AC-2 — Plan flow reaches RouteResultsScreen with 3 polylines

**GIVEN** authentication succeeded
**WHEN** the test taps a suggestion chip and waits for the agent to complete the plan
**THEN** RouteResultsScreen appears within the documented timeout; 3 polylines are visible on the map (asserted via XCUIElement query on map sub-elements OR LSNavigatorMessage card count == 3)
**Verify:** Test method passes the `routeResults` phase + `XCTAttachment` screenshot is attached

### AC-3 — Alt-selection promotion validated via accessibility query

**GIVEN** RouteResultsScreen is displayed with `selectedRouteId == best-id`
**WHEN** the test taps the `routeresultsscreen-card-1` element (alt1)
**THEN** the test asserts via XCUIElement state query that the alt1 card has the "selected" trait (sage stripe present); the polyline-state assertion is captured via screenshot for vision review
**Verify:** Test passes the `altSelect` phase + screenshot attached

### AC-4 — Refine reuses sessionId, validated via Convex query

**GIVEN** results state with `sessionId == "sess-xyz"` (captured pre-refine via accessibility query or test-only debug bridge)
**WHEN** the test types "make it shorter" into the chat input and submits
**THEN** the planning state re-enters; when the agent completes, results state re-enters with replacement polylines; a helper Convex query asserts that the `sessionMessages` row created has `sessionId == "sess-xyz"` (same session); NO new `planningSessions` row is created
**Verify:** Test passes the `refine` phase + Convex query result is logged

### AC-5 — Dismiss + Recall flow validated

**GIVEN** results state with LSNavigatorMessage visible
**WHEN** the test taps the dismiss chevron, waits, then taps `routeresultsscreen-recall-chip`
**THEN** the test asserts via accessibility query that after dismiss, `routeresultsscreen-recall-chip` exists AND `routeresultsscreen-navigator-message` does NOT exist; after Recall tap, the inverse holds
**Verify:** Test passes the `dismissRecall` phase + 2 screenshots attached

### AC-6 — `.xcresult` evidence recorded under canonical path

**GIVEN** the test runs to completion
**WHEN** `xcodebuild test` finishes
**THEN** an `.xcresult` bundle exists under `ios/build/E2E/route-results/` containing at minimum 6 `.png` attachments (auth, plan, results, altSelect, refine, dismissRecall)
**Verify:** `ls ios/build/E2E/route-results/*.xcresult/ | wc -l` ≥ 1 AND xcresulttool extracts ≥ 6 attachment PNGs

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|---|---|---|---|---|
| TC-1 | Test method exists and auth passes | AC-1 | `xcodebuild test -only-testing:.../test_planResults_altSelect_refine_dismissRecall_happyPath` | happy_path |
| TC-2 | RouteResultsScreen reached with 3 polylines | AC-2 | Same | happy_path |
| TC-3 | Alt-selection promotion asserted via accessibility | AC-3 | Same | happy_path |
| TC-4 | Refine reuses sessionId (Convex query confirms) | AC-4 | Same | happy_path |
| TC-5 | Dismiss + Recall flow asserted via accessibility | AC-5 | Same | happy_path |
| TC-6 | `.xcresult` evidence with ≥ 6 attachment PNGs | AC-6 | `xcrun xcresulttool ...` lists attachments | edge |
| TC-7 | Test passes on iOS Simulator (CI gate) | AC-1-6 | `xcodebuild test ... -destination 'platform=iOS Simulator,name=iPhone 16'` | edge |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `docs/REAL_DEVICE_E2E.md` | all | [PRIMARY PATTERN] Canonical auth + evidence pattern; XCUITest device-target setup |
| `ios/LaneShadowUITests/E2E/` | all | Existing E2E patterns from prior sprints |
| `.env.local.example` | all | `CLERK_TEST_EMAIL` / `CLERK_TEST_PASSWORD` keys |
| `.spec/prds/v3-integration/tasks/sprint-08-planning-state/PLAN-S08-E2E-IOS-T01-planning-state-live-e2e.md` | all | Sprint 08 sibling E2E — same architecture, different content |
| RR-S09-IOS-T01 / T02 / T03 / T04 task files | all | Accessibility identifiers established for each phase |

## Guardrails

**Write-Allowed:**
- `ios/LaneShadowUITests/E2E/SignInToRouteResultsE2ETests.swift` (NEW or MODIFY)
- `ios/LaneShadowUITests/Helpers/ConvexDBQueryHelper.swift` (NEW — for sessionId validation; optional)
- `ios/project.yml` (MODIFY only if file additions require regeneration)

**Write-Prohibited:**
- `.env.local` — never commit; values come from environment
- `ios/LaneShadow/**` — non-test code paths
- `android/**`, `server/**`, `react-native/**`, `tokens/**` — out of scope
- `ios/LaneShadow.xcodeproj/**` — generated

## Design

**References:**
- `docs/REAL_DEVICE_E2E.md`
- `RULES.md` §"Real Device E2E Testing"
- Sprint 08 PLAN-S08-E2E-IOS-T01

**Interaction Notes:** This is the canonical real-device gate evidence for Sprint 09. Android-only behaviors (e.g., Android-specific dismiss/recall on emulator) are recorded MANUAL/BLOCKED in `gate-evidence/`, not asserted in this test.

**Pattern:** Sprint 08 PLAN-S08-E2E-IOS-T01 — multi-phase XCUITest with attachment evidence + Convex DB validation helper.

**Pattern Source:** `.spec/prds/v3-integration/tasks/sprint-08-planning-state/PLAN-S08-E2E-IOS-T01-planning-state-live-e2e.md`

**Anti-Pattern:** Mock auth; stubbed Convex; sleep-based waits; committing `.env.local`; relying on screenshot diff alone for sessionId reuse (must use the Convex query helper).

## Verification Gates

| AC | Command |
|---|---|
| AC-1-5 | `xcodebuild test -scheme LaneShadowUITests -destination 'platform=iOS,name=iPhone {real-device}' -only-testing:LaneShadowUITests/E2E/SignInToRouteResultsE2ETests/test_planResults_altSelect_refine_dismissRecall_happyPath` (exit 0) |
| AC-6 | `ls ios/build/E2E/route-results/*.xcresult/` exists; `xcrun xcresulttool get --path ... --format json \| jq '.actions._values[].actionResult.testFailureSummaries._values \| length'` returns 0 |
| simulator | `xcodebuild test -scheme LaneShadowUITests -destination 'platform=iOS Simulator,name=iPhone 16'` (exit 0) |

## Agent Assignment

**Agent:** swift-implementer
**Rationale:** XCUITest authoring in `ios/LaneShadowUITests/E2E/` with Convex DB helper. Matches swift-implementer mandate. Reviewer: `swift-reviewer`.

## Coding Standards

- `docs/REAL_DEVICE_E2E.md`
- `RULES.md` §"Real Device E2E Testing"
- `brain/docs/mobile-architecture/testing-strategy.md`

## Dependencies

**Depends on:**
- RR-S09-IOS-T01, T02, T03, T04 (all iOS implementation complete; accessibility identifiers established)
- RR-S09-CVX-T01 (sessionId reuse contract test confirms the backend invariant)

**Blocks:**
- RR-S09-T11 (Sprint 09 gate requires real-iPhone evidence)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"Happy-path test method authored; auth phase passes; IdleScreen shown with user name","verify":"xcodebuild test on real-device -only-testing:.../test_planResults_altSelect_refine_dismissRecall_happyPath exits 0 through auth","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-2","type":"acceptance_criterion","description":"Plan flow reaches RouteResultsScreen with 3 polylines visible","verify":"Test method passes results phase + attachment screenshot","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-3","type":"acceptance_criterion","description":"Alt-selection promotion asserted via accessibility query","verify":"Test passes altSelect phase + attachment","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-4","type":"acceptance_criterion","description":"Refine reuses sessionId (Convex DB query confirms same sessionId)","verify":"Test passes refine phase + Convex query logged","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-5","type":"acceptance_criterion","description":"Dismiss + Recall flow asserted via accessibility query","verify":"Test passes dismissRecall phase + 2 attachments","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-6","type":"acceptance_criterion","description":".xcresult bundle exists under ios/build/E2E/route-results/ with >= 6 attachment PNGs","verify":"xcresulttool extracts >= 6 attachments","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"TC-1","type":"test_criterion","description":"Test method auth phase passes","verify":"xcodebuild test on real device exits 0","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"},
    {"id":"TC-2","type":"test_criterion","description":"3 polylines visible test","verify":"xcodebuild test passes results phase","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-2"},
    {"id":"TC-3","type":"test_criterion","description":"Alt-selection promotion test","verify":"xcodebuild test passes altSelect phase","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-3"},
    {"id":"TC-4","type":"test_criterion","description":"sessionId reuse via Convex query","verify":"xcodebuild test passes refine + Convex query logged","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-4"},
    {"id":"TC-5","type":"test_criterion","description":"Dismiss + Recall accessibility assertions","verify":"xcodebuild test passes dismissRecall phase","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-5"},
    {"id":"TC-6","type":"test_criterion","description":".xcresult with >= 6 PNG attachments","verify":"xcresulttool count","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-6"},
    {"id":"TC-7","type":"test_criterion","description":"Simulator pass for CI gate","verify":"xcodebuild test on Simulator exits 0","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"}
  ]
}
-->
