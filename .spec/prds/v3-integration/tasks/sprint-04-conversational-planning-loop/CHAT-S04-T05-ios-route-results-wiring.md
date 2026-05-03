================================================================================
TASK: CHAT-S04-T05 - iOS RouteResults real-data wiring + alt-selection
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Completed
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer

RUNTIME_COMMANDS:
  test:      xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test
  typecheck: xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES build
  lint:      swiftformat --lint ios/

PROGRESS: 6/6 AC · approved

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

RouteResultsScreen renders three live polylines + three RouteAttachmentCards from db.routePlans.getPlanById; tapping a card promotes its route to selected with correct color tinting.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST subscribe to db.routePlans.getPlanById({routePlanId}) and decode into the existing PlannedRouteOptions shape
- MUST render three polylines with V2 variant colors: best=color.signal.default, alt1=color.signal.whisper, alt2=color.signal.touring
- MUST attach exactly three LSRouteAttachmentCards inside the LSNavigatorMessage organism
- MUST wire onRouteCardTap to update ChatStore-held selectedRouteId (Gap H1-07 fix) and re-tint alt polyline solid when promoted
- MUST support a Recall chip that re-presents the dismissed callout with attachments restored
- MUST keep RouteResultsScreen sandbox story working with RouteResultsMockProvider
- NEVER store selectedRouteId in @State on the screen — drive it through ChatStore via a binding
- NEVER hardcode polyline hex colors — pull from theme.colors.signal tokens
- NEVER call routePlans.getPlanById with a nil routePlanId; subscription must short-circuit when flowState is not in .routeResults
- NEVER touch ios/LaneShadow.xcodeproj/** directly
- STRICTLY use the V2 routeDrawOn motion recipe already wired in RouteResultsScreen — do not reimplement animation
- STRICTLY treat RouteResultsScreen.swift as a presentational view; subscription lives in a new container/VM

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [x] Three polylines render from getPlanById (AC-1 PRIMARY)
- [x] Three RouteAttachmentCards attached to LSNavigatorMessage (AC-2)
- [x] onRouteCardTap promotes alt to selected and re-tints (AC-3)
- [x] Empty options array surfaces empty-state, no crash (AC-4)
- [x] Recall chip restores dismissed callout (AC-5)
- [x] Subscription error surfaces via LaneShadowError (AC-6)
- [x] Focused RouteResults tests pass + xcodebuild build clean
- [x] Focused RouteResults snapshots pass with no unrelated StorySnapshotTests/sandbox churn

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: Three polylines render from getPlanById [PRIMARY]
  GIVEN: ChatStore in .routeResults(sessionId=X, routeOptions has 3 options) and a stub yielding the matching plan via getPlanById
  WHEN:  RouteResultsScreenContainer subscribes
  THEN:  The LSMap renders exactly three RoutePolyline overlays — best/alt1/alt2 — with theme.colors.signal.default, .whisper, .touring respectively

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Features/RouteResults/RouteResultsWiringTests.swift
  TEST_FUNCTION: test_routeResults_subscribesGetPlanById_renders3Polylines

AC-2: Three RouteAttachmentCards attached to LSNavigatorMessage
  GIVEN: Plan with three options and weather data populated
  WHEN:  RouteResultsScreen renders
  THEN:  LSNavigatorMessage receives exactly three LSRouteAttachmentCards in the same order as plan.options[]

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Features/RouteResults/RouteResultsWiringTests.swift
  TEST_FUNCTION: test_routeResults_attachesThreeCards_inOrder

AC-3: onRouteCardTap promotes alt to selected and re-tints
  GIVEN: RouteResultsScreen with best route currently selected
  WHEN:  User taps the alt1 LSRouteAttachmentCard
  THEN:  ChatStore.selectedRouteId becomes alt1's routeOptionId, alt1 polyline transitions from dashed to solid, and best polyline transitions from solid to dashed (Gap H1-07 fix)

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Features/RouteResults/RouteResultsWiringTests.swift
  TEST_FUNCTION: test_routeResults_onRouteCardTap_promotesAltSelection

AC-4: Empty options array surfaces empty-state, no crash
  GIVEN: Stub yields a plan with status=completed but options array empty
  WHEN:  RouteResultsScreenContainer mounts
  THEN:  An empty-state callout is shown (no polylines, no attachments) and no fatal error is thrown

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Features/RouteResults/RouteResultsWiringTests.swift
  TEST_FUNCTION: test_routeResults_emptyOptions_showsEmptyState

AC-5: Recall chip restores dismissed callout
  GIVEN: User dismissed the LSNavigatorMessage callout (isCalloutVisible=false)
  WHEN:  User taps the Recall chip
  THEN:  The callout reappears with the same three RouteAttachmentCards and currently selected route preserved

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Features/RouteResults/RouteResultsWiringTests.swift
  TEST_FUNCTION: test_routeResults_recallChip_restoresCallout

AC-6: Subscription error surfaces via LaneShadowError
  GIVEN: Stub getPlanById throws ClientError.ServerError("PLAN_NOT_FOUND")
  WHEN:  RouteResultsScreenContainer subscribes
  THEN:  The container surfaces the typed error via the shared error toast surface and does not retry the subscription in a tight loop

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Features/RouteResults/RouteResultsWiringTests.swift
  TEST_FUNCTION: test_routeResults_subscriptionError_surfacesTypedError

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Features/RouteResults/RouteResultsContainer.swift (NEW)
- ios/LaneShadow/Features/RouteResults/RouteResultsViewModel.swift (NEW)
- ios/LaneShadow/Views/Templates/RouteResultsScreen.swift (MODIFY — add ViewState-driven init alongside legacy MockProvider init; expose onRouteCardTap binding to drive ChatStore)
- ios/LaneShadow/Services/ConvexClient+LaneShadow.swift (MODIFY — add typed getPlanById helper if missing)
- ios/LaneShadowTests/Features/RouteResults/RouteResultsWiringTests.swift (NEW)
- ios/LaneShadowTests/Helpers/StubLaneShadowConvexClient.swift (MODIFY)

writeProhibited:
- ios/LaneShadow.xcodeproj/** — generated; edit ios/project.yml + run scripts/ios/generate-project.sh
- ios/LaneShadow/Generated/** — generated by server/scripts/generate-mobile-types.ts
- ios/LaneShadow/Sandbox/MockProviders/RouteResultsMockProvider.swift — sandbox keeps mocks intact
- ios/LaneShadow/Services/RideFlow.swift / ChatStore.swift / SessionStore.swift — owned by CHAT-S04-T01 (read + dispatch only)
- ios/LaneShadow/Views/Templates/IdleScreen.swift / PlanningScreen.swift / RouteDetailsScreen.swift / ErrorScreen.swift — owned by other tasks

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Use theme.colors.signal.* tokens for variant tinting
- Drive selectedRouteId through ChatStore (binding), never local @State on RouteResultsScreen
- Subscribe via .task; cancel on view disappear

⚠️ Ask First:
- If a new public route variant token is needed beyond default/whisper/touring
- If RoutePolyline atom needs new dashed/solid props (escalate to design)

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- ios/LaneShadow/Features/RouteResults/RouteResultsContainer.swift (NEW): authenticated wrapper, owns the VM
- ios/LaneShadow/Features/RouteResults/RouteResultsViewModel.swift (NEW): subscribes to getPlanById, exposes ViewState struct, mediates onRouteCardTap into ChatStore
- ios/LaneShadow/Views/Templates/RouteResultsScreen.swift (MODIFY): ViewState-driven initializer + selectedRouteId binding (Gap H1-07)
- ios/LaneShadow/Services/ConvexClient+LaneShadow.swift (MODIFY): typed getPlanById helper
- Tests + stubs

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

[Standard RED -> GREEN -> REFACTOR per AC.]

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. ios/LaneShadow/Views/Templates/RouteResultsScreen.swift [PRIMARY PATTERN]
   - Lines: 1-260
   - Focus: Existing screen + onRouteCardTap callback site (Gap H1-07)

2. ios/LaneShadow/Sandbox/MockProviders/RouteResultsMockProvider.swift
   - Lines: 1-200
   - Focus: Existing ViewState shape to mirror

3. .spec/prds/v3-integration/05-uc-chat.md
   - Lines: 59-76
   - Focus: UC-CHAT-03 ACs

4. .spec/prds/v3-integration/architecture/ios-architecture.md
   - Lines: 350-450
   - Focus: Per-row subscription tier + selection flow

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase evidence — TDD_STATE history per AC
Gate 2: All tests pass — xcodebuild ... test (Exit 0)
Gate 3: Build — xcodebuild ... build (Exit 0)
Gate 4: Lint — swiftformat --lint ios/ (Exit 0)
Gate 5: Token compliance — scripts/tokens/enforce-native-compliance.sh (Exit 0)
Gate 6: Sandbox snapshots still pass — pnpm snapshots:check (Exit 0)
Gate 7: Scope compliance — git diff --name-only ⊆ writeAllowed

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: CHAT-S04-T01 (RideFlow + ChatStore), CHAT-S04-T03 (Idle/Planning wiring — establishes container/VM seam), AUTH-S03-T03 (Convex client)
Blocks: CHAT-S04-T07

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "taskId": "CHAT-S04-T05",
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "RouteResultsScreen subscribes to getPlanById and renders 3 polylines with correct variant tokens", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/RouteResultsWiringTests/test_routeResults_subscribesGetPlanById_renders3Polylines", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "Three RouteAttachmentCards attached to LSNavigatorMessage in option order", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/RouteResultsWiringTests/test_routeResults_attachesThreeCards_inOrder", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-3", "type": "acceptance_criterion", "description": "Card tap promotes alt selection and updates polyline solid/dashed", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/RouteResultsWiringTests/test_routeResults_onRouteCardTap_promotesAltSelection", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-4", "type": "acceptance_criterion", "description": "Empty options renders empty-state without crashing", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/RouteResultsWiringTests/test_routeResults_emptyOptions_showsEmptyState", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-5", "type": "acceptance_criterion", "description": "Recall chip restores dismissed callout", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/RouteResultsWiringTests/test_routeResults_recallChip_restoresCallout", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-6", "type": "acceptance_criterion", "description": "Subscription error surfaces typed LaneShadowError", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/RouteResultsWiringTests/test_routeResults_subscriptionError_surfacesTypedError", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-1", "type": "test_criterion", "description": "3-option plan -> 3 polylines with signal/whisper/touring tokens.", "maps_to_ac": "AC-1", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/RouteResultsWiringTests/test_routeResults_subscribesGetPlanById_renders3Polylines", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-2", "type": "test_criterion", "description": "3 cards in options order.", "maps_to_ac": "AC-2", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/RouteResultsWiringTests/test_routeResults_attachesThreeCards_inOrder", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-3", "type": "test_criterion", "description": "Card tap mutates ChatStore.selectedRouteId and toggles polyline solid/dashed.", "maps_to_ac": "AC-3", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/RouteResultsWiringTests/test_routeResults_onRouteCardTap_promotesAltSelection", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-4", "type": "test_criterion", "description": "Empty plan yields 0 polylines + 0 cards + empty-state visible.", "maps_to_ac": "AC-4", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/RouteResultsWiringTests/test_routeResults_emptyOptions_showsEmptyState", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-5", "type": "test_criterion", "description": "Recall flips isCalloutVisible true preserving selection.", "maps_to_ac": "AC-5", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/RouteResultsWiringTests/test_routeResults_recallChip_restoresCallout", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-6", "type": "test_criterion", "description": "ServerError surfaces typed errorMessage and bounds retries.", "maps_to_ac": "AC-6", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/RouteResultsWiringTests/test_routeResults_subscriptionError_surfacesTypedError", "satisfied": false, "evidence": null, "remediation": null}
  ]
}
-->
================================================================================
