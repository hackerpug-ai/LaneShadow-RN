================================================================================
TASK: FID-S02-T03 - iOS Idle V01–V03 + Planning V01–V03 Variants
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer

RUNTIME_COMMANDS:
  typecheck: cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES COMPILER_INDEX_STORE_ENABLE=NO SWIFT_COMPILATION_MODE=incremental build
  lint: swiftformat --lint {files}
  test: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  native-compliance: scripts/tokens/enforce-native-compliance.sh

PROGRESS: AC-1..AC-6 not started

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

iOS sandbox renders six new edge-state variants (Idle V01 no-location, V02 first-ride, V03 weather-advisory; Planning V01 slow, V02 cancel-confirm, V03 single-candidate) matching `.spec/design/system/views/{idle,planning}-screen/` HTML reference.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST add the variants as named MockProvider variants AND named sandbox stories under `templates.idle-screen.{v-no-location|v-first-ride|v-weather-advisory}` and `templates.planning-screen.{v-slow|v-cancel-confirm|v-single-candidate}`
- MUST follow the canonical story-id spec from RULES.md "Cross-Platform Component Parity" — lowercase dot-separated, kebab-case variants, NO `infrastructure.` prefix
- NEVER mutate IdleScreen / PlanningScreen public component APIs to add variant-specific render branches; instead drive variants entirely from MockProvider state (chat input mode, weather card presence, scrim+sheet, etc.)
- NEVER hardcode any color / spacing / typography literal — read from `theme.colors`, `theme.space`, `theme.type`
- MUST use `theme.opacity.disabled` for V01 chat-input dim and `surface.scrim` for V02 cancel-confirm scrim

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] Idle V01 — copper-bordered "Tap to set start" pill + chat input at `theme.opacity.disabled` (AC-1 PRIMARY)
- [ ] Idle V02 — no favorite pins on map + onboarding-style suggestion chips (AC-2)
- [ ] Idle V03 — meta row in `status.warning` color + advisory card with `wx.rainTint` background, `wx.rain` left stripe, italic Newsreader body (AC-3)
- [ ] Planning V01 — italic apology line in `content.tertiary` below phase indicator + dashed top border (AC-4)
- [ ] Planning V02 — phase card at `theme.opacity.disabled`, `surface.scrim` overlay, centered confirm sheet "Cancel this plan?" with Keep/Cancel actions (AC-5)
- [ ] Planning V03 — `LSPhaseIndicator` border-top in `status.warning` + compass chip background at warning tint (AC-6)
- [ ] All six variants registered in `IdleScreenStory.swift` / `PlanningScreenStory.swift` with canonical story IDs
- [ ] `xcodebuild build` + `xcodebuild test` pass + native-compliance clean
- [ ] Only SCOPE.writeAllowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: Idle V01 no-location [PRIMARY]
  GIVEN: IdleScreen sandbox story `templates.idle-screen.v-no-location` is rendered
  WHEN:  The screen draws
  THEN:  A copper-bordered pill ("Tap to set start") is present at the location-row position with `signal.tint` border + `signal.whisper` background, and the LSChatInput renders at `theme.opacity.disabled`

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/IdlePlanningVariantTests.swift
  TEST_FUNCTION: testIdleV01NoLocation

AC-2: Idle V02 first-ride
  GIVEN: IdleScreen sandbox story `templates.idle-screen.v-first-ride` is rendered
  WHEN:  The screen draws
  THEN:  No favorite pin overlays are rendered on the map slot, and onboarding suggestion chips ("Short & scenic", "Learn the roads") replace the default chip set

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/IdlePlanningVariantTests.swift
  TEST_FUNCTION: testIdleV02FirstRide

AC-3: Idle V03 weather-advisory
  GIVEN: IdleScreen sandbox story `templates.idle-screen.v-weather-advisory` is rendered
  WHEN:  The screen draws
  THEN:  Greeting meta row text color is `status.warning`, and an advisory card is rendered below the headline with `wx.rainTint` background + `wx.rain` left-edge stripe at `theme.strokeWidth.lg` + italic Newsreader body copy

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/IdlePlanningVariantTests.swift
  TEST_FUNCTION: testIdleV03WeatherAdvisory

AC-4: Planning V01 slow-planning
  GIVEN: PlanningScreen sandbox story `templates.planning-screen.v-slow` is rendered
  WHEN:  The screen draws
  THEN:  Below the LSPhaseIndicator, an italic apology note ("Still scouting…") renders in `content.tertiary` color separated by a `theme.strokeWidth.thin` dashed top border

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/IdlePlanningVariantTests.swift
  TEST_FUNCTION: testPlanningV01Slow

AC-5: Planning V02 cancel-confirm
  GIVEN: PlanningScreen sandbox story `templates.planning-screen.v-cancel-confirm` is rendered
  WHEN:  The cancel-confirm modal is active
  THEN:  The phase card opacity is `theme.opacity.disabled`, a `surface.scrim` overlay covers the rest of the screen, and a centered sheet renders "Cancel this plan?" with two buttons (Keep at `surface.button.tertiary`, Cancel at `surface.button.signal`)

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/IdlePlanningVariantTests.swift
  TEST_FUNCTION: testPlanningV02CancelConfirm

AC-6: Planning V03 single-candidate
  GIVEN: PlanningScreen sandbox story `templates.planning-screen.v-single-candidate` is rendered
  WHEN:  The screen draws
  THEN:  `LSPhaseIndicator` renders a top border in `status.warning` color, and the compass chip background is `status.warning.tint`

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/IdlePlanningVariantTests.swift
  TEST_FUNCTION: testPlanningV03SingleCandidate

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Sandbox/MockProviders/IdleMockProvider.swift (MODIFY — add V01/V02/V03 variants)
- ios/LaneShadow/Sandbox/MockProviders/PlanningMockProvider.swift (MODIFY — add V01/V02/V03 variants)
- ios/LaneShadow/Sandbox/Stories/Templates/IdleScreenStory.swift (MODIFY — register 3 new stories)
- ios/LaneShadow/Sandbox/Stories/Templates/PlanningScreenStory.swift (MODIFY — register 3 new stories)
- ios/LaneShadow/Views/Screens/IdleScreen.swift (MODIFY — render advisory card + no-location pill from provider state)
- ios/LaneShadow/Views/Screens/PlanningScreen.swift (MODIFY — render slow apology + cancel-confirm overlay + warning chrome from state)
- ios/LaneShadow/Views/Molecules/LSAdvisoryCard.swift (NEW — small molecule for V03 advisory card)
- ios/LaneShadow/Views/Molecules/LSCancelConfirmSheet.swift (NEW — centered confirm sheet for V02)
- ios/LaneShadowTests/Sandbox/IdlePlanningVariantTests.swift (NEW)

writeProhibited:
- android/** — paired Android task (FID-S02-T04)
- server/**, react-native/**
- tokens/** — must NOT add new tokens
- Any file not explicitly listed above

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- IdleMockProvider.swift / PlanningMockProvider.swift (MODIFY): six new mock variants
- IdleScreenStory.swift / PlanningScreenStory.swift (MODIFY): six new sandbox stories registered with canonical IDs
- IdleScreen.swift / PlanningScreen.swift (MODIFY): variant rendering driven by provider state
- LSAdvisoryCard.swift (NEW): tiny molecule used by Idle V03
- LSCancelConfirmSheet.swift (NEW): centered confirm dialog used by Planning V02
- IdlePlanningVariantTests.swift (NEW): per-AC verification

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/design/system/views/mapapp/idle/idle-screen.html [PRIMARY REFERENCE]
   - Sections: V01 no-location, V02 first-ride, V03 weather-advisory
   - Focus: Designed pixel + interaction reference

2. .spec/design/system/views/mapapp/planning/planning-screen.html [PRIMARY REFERENCE]
   - Sections: V01 slow, V02 cancel-confirm, V03 single-candidate
   - Focus: Designed pixel + interaction reference

3. .spec/prds/v3-integration/remediations/01-views-idle-planning.md
   - Sections: Gap B-04, B-05, B-06 (Idle V01–V03), Gap A-03 (Planning V01–V03)
   - Focus: Detailed gap descriptions

4. ios/LaneShadow/Sandbox/MockProviders/IdleMockProvider.swift
   - Lines: all
   - Focus: How existing IdleScreen variants are modeled — extend the same pattern

5. ios/LaneShadow/Sandbox/Stories/Templates/PlanningScreenStory.swift
   - Lines: all
   - Focus: Existing 6-story registration pattern (S01–S04, dark, etc.) — model new 3 after these

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase evidence per AC
Gate 2: One test per AC in IdlePlanningVariantTests.swift
Gate 3: Story IDs match canonical naming (lowercase, dot-separated, kebab-case, NO `infrastructure.` prefix)
Gate 4: All tests pass — `xcodebuild test`
Gate 5: Build passes — `xcodebuild build`
Gate 6: Native compliance — `scripts/tokens/enforce-native-compliance.sh` exits 0
Gate 7: Scope compliance — `git diff --name-only ⊆ writeAllowed`

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- Android variants (FID-S02-T04)
- IdleScreen S01–S04 stories (already exist or land in FID-S02-T10 coverage task)
- PlanningScreen weather-condition badges and concurrent candidate polylines (FID-S02-T05/T06)
- Real chat-send wiring for Idle V01 (this is sandbox-only — pill is presentational)

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** iOS exposes only the default IdleScreen story and the default PlanningScreen + 5 phase walkthrough stories. None of the six "V" edge-state variants exists in MockProviders or sandbox stories on iOS. The screens themselves don't currently render the advisory card / no-location pill / cancel-confirm modal / warning chrome — these need to be conditionally driven by provider state.

**Gap:** UC-FID-01 requires every designed variant to be exercisable in the sandbox so snapshot tests can guard regressions and the integration sprints (Sprint 03+) can wire real data into a pre-validated rendering surface.

--------------------------------------------------------------------------------
REVIEW (for swift-reviewer)
--------------------------------------------------------------------------------

Must pass (≤5):
- One test per AC verifying state-driven rendering, not snapshot text
- Story IDs follow canonical naming spec; verified by `pnpm snapshots:check`
- All variants driven from MockProvider state — no `if storyId == ...` switches in screen views
- All literal colors/spacing/typography read from theme tokens
- SCOPE respected (`git diff --name-only ⊆ writeAllowed`)

Should verify (≤5):
- LSAdvisoryCard / LSCancelConfirmSheet are reusable enough to potentially serve real flows in Sprint 03–06
- V02 cancel-confirm doesn't break PlanningScreen state when toggled in/out via provider
- Dark mode renders all six variants correctly (snapshot baselines in T10 will confirm)
- Accessibility — confirm-modal has `accessibilityLabel` on Keep/Cancel buttons; warning compass chip describes its tint role
- No layout regressions on default IdleScreen / PlanningScreen stories

Verdict: [APPROVED | NEEDS_FIXES]
Feedback (required if NEEDS_FIXES):
```
[Specific, actionable issues — reference file:line where possible]
```

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: FID-S01-T01 (typography rollout — V03 advisory body uses opinion-md serif), FID-S01-T02 (map slot — V02 first-ride needs the real map for "no pins" to look right)
Blocks:     FID-S02-T10 (snapshot baselines)
Parallel:   FID-S02-T01, T02, T04, T05, T06, T07, T08

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN templates.idle-screen.v-no-location story rendered WHEN screen draws THEN copper-bordered Tap to set start pill present (signal.tint border + signal.whisper background) and LSChatInput at theme.opacity.disabled", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN templates.idle-screen.v-first-ride story WHEN screen draws THEN no favorite pin overlays on map and onboarding suggestion chips replace default chip set", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN templates.idle-screen.v-weather-advisory story WHEN screen draws THEN meta row text color is status.warning and advisory card rendered below headline with wx.rainTint bg + wx.rain left stripe (strokeWidth.lg) + italic Newsreader body", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN templates.planning-screen.v-slow story WHEN screen draws THEN italic apology in content.tertiary renders below LSPhaseIndicator separated by strokeWidth.thin dashed top border", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN templates.planning-screen.v-cancel-confirm story with modal active WHEN screen draws THEN phase card at theme.opacity.disabled, surface.scrim overlay, centered sheet 'Cancel this plan?' with Keep (button.tertiary) + Cancel (button.signal) actions", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN templates.planning-screen.v-single-candidate story WHEN screen draws THEN LSPhaseIndicator top border in status.warning and compass chip background at status.warning.tint", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "TC-1", "type": "test_criterion", "description": "Idle V01 story renders copper-bordered pill with signal.tint border, signal.whisper background, and LSChatInput opacity equals theme.opacity.disabled", "maps_to_ac": "AC-1", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdlePlanningVariantTests/testIdleV01NoLocation" },
    { "id": "TC-2", "type": "test_criterion", "description": "Idle V02 story has zero favorite pin overlays and onboarding suggestion chip set is present", "maps_to_ac": "AC-2", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdlePlanningVariantTests/testIdleV02FirstRide" },
    { "id": "TC-3", "type": "test_criterion", "description": "Idle V03 story renders LSAdvisoryCard with wx.rainTint background, wx.rain left stripe, italic body, and meta row uses status.warning color", "maps_to_ac": "AC-3", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdlePlanningVariantTests/testIdleV03WeatherAdvisory" },
    { "id": "TC-4", "type": "test_criterion", "description": "Planning V01 story renders italic apology in content.tertiary below LSPhaseIndicator with dashed strokeWidth.thin top border", "maps_to_ac": "AC-4", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdlePlanningVariantTests/testPlanningV01Slow" },
    { "id": "TC-5", "type": "test_criterion", "description": "Planning V02 story renders LSCancelConfirmSheet with title 'Cancel this plan?', Keep + Cancel buttons, surface.scrim overlay, and phase card opacity = theme.opacity.disabled", "maps_to_ac": "AC-5", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdlePlanningVariantTests/testPlanningV02CancelConfirm" },
    { "id": "TC-6", "type": "test_criterion", "description": "Planning V03 story has LSPhaseIndicator top border color status.warning and compass chip background status.warning.tint", "maps_to_ac": "AC-6", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdlePlanningVariantTests/testPlanningV03SingleCandidate" }
  ]
}
-->
