================================================================================
TASK: CHAT-S04-T07 - iOS RouteDetails real-data wiring + enrichment + saved fingerprint
================================================================================

TASK_TYPE:  FEATURE
STATUS:     APPROVED (round-2)
PRIORITY:   P1
EFFORT:     S
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer

RUNTIME_COMMANDS:
  test:      xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test
  typecheck: xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES build
  lint:      swiftformat --lint ios/

PROGRESS: 6/6 AC · APPROVED (round-2 clean)

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

RouteDetailsScreen binds to the selected route option with real instrument readouts, 6-hour weather timeline, and an Already-Saved indicator; Save tap opens the SaveFavoriteSheet entry.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST source the selected option from ChatStore.flowState (RouteDetailsState.selectedRouteId) rather than fetching anew
- MUST subscribe to db.routeEnrichments.list({routePlanId}) and feed LSWeatherTimeline with up to 6 hourly buckets
- MUST query db.savedRoutes.getRouteIndexFingerprint({routeIndex}) and reflect the Already-Saved state on the Save button
- MUST wire Save button tap to open SaveFavoriteSheet (sheet body itself ships in Sprint 05 — only the entry point + presentation here)
- MUST keep RouteDetailsScreen sandbox story working with RouteDetailsMockProvider
- NEVER call savedRoutes.saveRoute in this task (Sprint 05 owns that)
- NEVER mutate ChatStore.selectedRouteId from RouteDetails — back navigation only
- NEVER ship the SaveFavoriteSheet body — only the entry point and presentation hook
- NEVER touch ios/LaneShadow.xcodeproj/** directly
- STRICTLY use existing LSInstrumentReadout + LSWeatherTimeline + LSRouteSheet primitives — no new components
- STRICTLY treat Ride-this button as a no-op for V3 (per UC-CHAT-04)

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [x] Instrument readout matches selected option (AC-1 PRIMARY)
- [x] 6-hour weather timeline from routeEnrichments (AC-2)
- [x] Already-saved fingerprint flips Save button state (AC-3) ← PASS (round-2): LSRouteSheet.isSaved param added; actionRow branches on isSaved rendering LSButton("Saved", variant:.primary, isDisabled:true) when saved (LSRouteSheet.swift:134-143)
- [x] Save tap presents SaveFavoriteSheet entry (AC-4)
- [x] Enrichment status pending shows loading skeleton (AC-5)
- [x] Ride-this button is no-op without crashing (AC-6)
- [x] Tests pass + build clean

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: Instrument readout matches selected option [PRIMARY]
  GIVEN: ChatStore in .routeDetails(sessionId=X, selectedRouteId=opt-1) and a stub plan whose option opt-1 has distanceMeters=42000, durationSeconds=4500, elevationGainMeters=850, scenicScore=0.86
  WHEN:  RouteDetailsScreenContainer mounts
  THEN:  LSInstrumentReadout displays "42 km", "1h 15m", "850 m", and "86" (or platform-formatted equivalents from existing helpers)

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Features/RouteDetails/RouteDetailsWiringTests.swift
  TEST_FUNCTION: test_routeDetails_instrumentReadout_bindsSelectedOption

AC-2: 6-hour weather timeline from routeEnrichments
  GIVEN: Stub yields a routeEnrichments document with 6 hourly weather entries
  WHEN:  RouteDetailsScreenContainer subscribes to db.routeEnrichments.list({routePlanId})
  THEN:  LSWeatherTimeline renders 6 columns in chronological order with the corresponding LSWeatherBadgeType values

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Features/RouteDetails/RouteDetailsWiringTests.swift
  TEST_FUNCTION: test_routeDetails_weatherTimeline_renders6Hours

AC-3: Already-saved fingerprint flips Save button state
  GIVEN: Stub getRouteIndexFingerprint returns a non-nil savedRouteId for the current option's routeIndex
  WHEN:  RouteDetailsScreenContainer mounts
  THEN:  The Save button renders in the "Already saved" variant (label "Saved" + saved-state token) and is disabled until a future unsave flow ships

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Features/RouteDetails/RouteDetailsWiringTests.swift
  TEST_FUNCTION: test_routeDetails_alreadySaved_flipsSaveButton

AC-4: Save tap presents SaveFavoriteSheet entry
  GIVEN: Save button in default (not-saved) state
  WHEN:  User taps Save
  THEN:  RouteDetailsScreenContainer flips a presentation flag and shows a SaveFavoriteSheet placeholder view (sheet body deferred to Sprint 05)

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Features/RouteDetails/RouteDetailsWiringTests.swift
  TEST_FUNCTION: test_routeDetails_saveTap_presentsSaveFavoriteSheet

AC-5: Enrichment status pending shows loading skeleton, not stale data
  GIVEN: Stub yields a route_enrichments doc with status="pending"
  WHEN:  RouteDetailsScreenContainer mounts
  THEN:  LSWeatherTimeline renders a loading-skeleton state (no fabricated weather), and the Save button still enables based on fingerprint

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Features/RouteDetails/RouteDetailsWiringTests.swift
  TEST_FUNCTION: test_routeDetails_pendingEnrichment_showsLoadingSkeleton

AC-6: Ride-this button is no-op (V3) without crashing
  GIVEN: RouteDetailsScreen rendered
  WHEN:  User taps the Ride-this button
  THEN:  No navigation occurs and no mutation/action fires; the tap is logged to performance for observability

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Features/RouteDetails/RouteDetailsWiringTests.swift
  TEST_FUNCTION: test_routeDetails_rideThisButton_isNoOp

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Features/RouteDetails/RouteDetailsContainer.swift (NEW)
- ios/LaneShadow/Features/RouteDetails/RouteDetailsViewModel.swift (NEW)
- ios/LaneShadow/Features/RouteDetails/SaveFavoriteSheetPlaceholder.swift (NEW)
- ios/LaneShadow/Views/Templates/RouteDetailsScreen.swift (MODIFY — add ViewState-driven init alongside legacy MockProvider init)
- ios/LaneShadow/Services/ConvexClient+LaneShadow.swift (MODIFY — add typed routeEnrichments.list and savedRoutes.getRouteIndexFingerprint helpers if missing)
- ios/LaneShadowTests/Features/RouteDetails/RouteDetailsWiringTests.swift (NEW)
- ios/LaneShadowTests/Helpers/StubLaneShadowConvexClient.swift (MODIFY)

writeProhibited:
- ios/LaneShadow.xcodeproj/** — generated; edit ios/project.yml + run scripts/ios/generate-project.sh
- ios/LaneShadow/Generated/** — generated by server/scripts/generate-mobile-types.ts
- ios/LaneShadow/Sandbox/MockProviders/RouteDetailsMockProvider.swift — sandbox keeps mocks intact
- ios/LaneShadow/Services/RideFlow.swift / ChatStore.swift / SessionStore.swift — owned by CHAT-S04-T01 (read-only)
- Any saved-routes mutation logic — Sprint 05 owns saveRoute / unsave

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Use existing LSRouteSheet, LSInstrumentReadout, LSWeatherTimeline composition — no new components
- Subscribe via .task; cancel on disappear
- Treat fingerprint query as one-shot per appearance unless invalidated

⚠️ Ask First:
- If routeEnrichments shape diverges from the RN payload (escalate to type-gen)
- If a real SaveFavoriteSheet body is needed in this sprint (defer to Sprint 05 unless overridden)

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- ios/LaneShadow/Features/RouteDetails/RouteDetailsContainer.swift (NEW): authenticated wrapper
- ios/LaneShadow/Features/RouteDetails/RouteDetailsViewModel.swift (NEW): subscribes to enrichments + fingerprint, exposes ViewState
- ios/LaneShadow/Features/RouteDetails/SaveFavoriteSheetPlaceholder.swift (NEW): minimal sheet body for V3 entry; full implementation Sprint 05
- ios/LaneShadow/Views/Templates/RouteDetailsScreen.swift (MODIFY): ViewState-driven initializer; Save button onTap wired into VM presentation flag
- ios/LaneShadow/Services/ConvexClient+LaneShadow.swift (MODIFY): typed listRouteEnrichments + getRouteIndexFingerprint helpers

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

[Standard RED -> GREEN -> REFACTOR per AC.]

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. ios/LaneShadow/Views/Templates/RouteDetailsScreen.swift [PRIMARY PATTERN]
   - Lines: 1-200
   - Focus: Existing MockProvider seam

2. ios/LaneShadow/Sandbox/MockProviders/RouteDetailsMockProvider.swift
   - Lines: 1-200
   - Focus: ViewState shape for binding

3. .spec/prds/v3-integration/05-uc-chat.md
   - Lines: 77-93
   - Focus: UC-CHAT-04 ACs

4. .spec/prds/v3-integration/11-technical-requirements.md
   - Lines: 180-220
   - Focus: API endpoint table for routeEnrichments + savedRoutes.getRouteIndexFingerprint

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

Depends on: CHAT-S04-T01 (RideFlow + ChatStore), CHAT-S04-T05 (RouteResults wiring sets selectedRouteId)
Blocks: Sprint 05 SaveFavoriteSheet body

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "taskId": "CHAT-S04-T07",
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "InstrumentReadout binds selected option payload", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/RouteDetailsWiringTests/test_routeDetails_instrumentReadout_bindsSelectedOption", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "WeatherTimeline renders 6 hours from routeEnrichments", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/RouteDetailsWiringTests/test_routeDetails_weatherTimeline_renders6Hours", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-3", "type": "acceptance_criterion", "description": "Already-saved fingerprint flips Save button state", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/RouteDetailsWiringTests/test_routeDetails_alreadySaved_flipsSaveButton", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-4", "type": "acceptance_criterion", "description": "Save tap presents SaveFavoriteSheet entry", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/RouteDetailsWiringTests/test_routeDetails_saveTap_presentsSaveFavoriteSheet", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-5", "type": "acceptance_criterion", "description": "Pending enrichment shows skeleton (no fabricated data)", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/RouteDetailsWiringTests/test_routeDetails_pendingEnrichment_showsLoadingSkeleton", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-6", "type": "acceptance_criterion", "description": "Ride-this button is a logged no-op for V3", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/RouteDetailsWiringTests/test_routeDetails_rideThisButton_isNoOp", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-1", "type": "test_criterion", "description": "Selected-option payload formats correctly into instrument readout.", "maps_to_ac": "AC-1", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/RouteDetailsWiringTests/test_routeDetails_instrumentReadout_bindsSelectedOption", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-2", "type": "test_criterion", "description": "6 enrichment buckets render chronologically.", "maps_to_ac": "AC-2", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/RouteDetailsWiringTests/test_routeDetails_weatherTimeline_renders6Hours", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-3", "type": "test_criterion", "description": "Non-nil fingerprint sets Save variant=saved disabled=true.", "maps_to_ac": "AC-3", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/RouteDetailsWiringTests/test_routeDetails_alreadySaved_flipsSaveButton", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-4", "type": "test_criterion", "description": "Save tap presents the placeholder sheet.", "maps_to_ac": "AC-4", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/RouteDetailsWiringTests/test_routeDetails_saveTap_presentsSaveFavoriteSheet", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-5", "type": "test_criterion", "description": "Pending enrichment yields skeleton and zero weather columns.", "maps_to_ac": "AC-5", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/RouteDetailsWiringTests/test_routeDetails_pendingEnrichment_showsLoadingSkeleton", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-6", "type": "test_criterion", "description": "Ride-this tap records zero side effects.", "maps_to_ac": "AC-6", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/RouteDetailsWiringTests/test_routeDetails_rideThisButton_isNoOp", "satisfied": false, "evidence": null, "remediation": null}
  ]
}
-->
================================================================================
