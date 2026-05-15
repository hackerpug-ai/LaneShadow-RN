================================================================================
TASK: FID-S02-T04 - Android Idle V01–V03 + Planning V01–V03 Variants
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer

RUNTIME_COMMANDS:
  typecheck: cd android && ./gradlew :app:compileDebugKotlin
  test: cd android && ./gradlew test
  lint: cd android && ./gradlew detekt
  native-compliance: scripts/tokens/enforce-native-compliance.sh

PROGRESS: AC-1..AC-6 not started

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Android sandbox renders six new edge-state variants (Idle V01 no-location, V02 first-ride, V03 weather-advisory; Planning V01 slow, V02 cancel-confirm, V03 single-candidate) at parity with iOS counterparts in FID-S02-T03 — including LSPhaseIndicator header string in italic Newsreader opinion-sm.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST register the variants under canonical story IDs identical to iOS in T03 — `templates.idle-screen.v-no-location|v-first-ride|v-weather-advisory`, `templates.planning-screen.v-slow|v-cancel-confirm|v-single-candidate`. Mismatched IDs silently fall into `_only` arrays and break parity.
- MUST pass an italic-Newsreader `header` string parameter to `LSPhaseIndicator` for each active phase (currently no header parameter is passed on Android — Gap G-02)
- NEVER hardcode color / spacing / typography literals — read from `theme.colors`, `theme.space`, `theme.type`
- NEVER mutate the public IdleScreen / PlanningScreen composable signatures to inject variant-specific render branches — drive variants entirely from the MockProvider state/data class
- MUST use `theme.opacity.disabled` for V01 chat-input dim and `theme.colors.surface.scrim` for V02 cancel-confirm scrim

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] Idle V01 — copper-bordered "Tap to set start" pill + chat input alpha = `theme.opacity.disabled` (AC-1 PRIMARY)
- [ ] Idle V02 — no favorite pin overlays + onboarding suggestion chips (AC-2)
- [ ] Idle V03 — meta row in `status.warning` + advisory card (`wx.rainTint` bg, `wx.rain` left stripe, italic Newsreader body) (AC-3)
- [ ] Planning V01 — italic apology in `content.tertiary` + dashed `strokeWidth.thin` top border (AC-4)
- [ ] Planning V02 — phase card alpha = `theme.opacity.disabled` + `surface.scrim` overlay + centered "Cancel this plan?" sheet with Keep/Cancel actions (AC-5)
- [ ] Planning V03 — `LSPhaseIndicator` top border `status.warning` + compass chip background `status.warning.tint`, AND header string passed in italic Newsreader opinion-sm (AC-6)
- [ ] All six variants registered in `IdleScreenStory.kt` / `PlanningScreenStory.kt` with canonical story IDs identical to iOS
- [ ] `./gradlew :app:compileDebugKotlin` + `./gradlew test` pass + native-compliance clean
- [ ] Only SCOPE.writeAllowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: Idle V01 no-location [PRIMARY]
  GIVEN: Android sandbox story `templates.idle-screen.v-no-location` is rendered
  WHEN:  The screen draws
  THEN:  A copper-bordered "Tap to set start" pill is present with `theme.colors.signal.tint` border + `theme.colors.signal.whisper` background, and LSChatInput alpha equals `theme.opacity.disabled`

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/sandbox/IdlePlanningVariantTests.kt
  TEST_FUNCTION: testIdleV01NoLocation

AC-2: Idle V02 first-ride
  GIVEN: Android sandbox story `templates.idle-screen.v-first-ride` is rendered
  WHEN:  The screen draws
  THEN:  Map slot has zero favorite pin composables and the onboarding chip set ("Short & scenic", "Learn the roads") replaces the default chip set

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/sandbox/IdlePlanningVariantTests.kt
  TEST_FUNCTION: testIdleV02FirstRide

AC-3: Idle V03 weather-advisory
  GIVEN: Android sandbox story `templates.idle-screen.v-weather-advisory` is rendered
  WHEN:  The screen draws
  THEN:  Meta row text color is `theme.colors.status.warning`, and an advisory card is rendered below the headline with `theme.colors.wx.rainTint` background + `theme.colors.wx.rain` left-edge stripe at `theme.strokeWidth.lg` + italic `theme.type.opinion.md` body

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/sandbox/IdlePlanningVariantTests.kt
  TEST_FUNCTION: testIdleV03WeatherAdvisory

AC-4: Planning V01 slow
  GIVEN: Android sandbox story `templates.planning-screen.v-slow` is rendered
  WHEN:  The screen draws
  THEN:  Below LSPhaseIndicator, an italic apology line is rendered in `theme.colors.content.tertiary` separated by a dashed `theme.strokeWidth.thin` top border

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/sandbox/IdlePlanningVariantTests.kt
  TEST_FUNCTION: testPlanningV01Slow

AC-5: Planning V02 cancel-confirm
  GIVEN: Android sandbox story `templates.planning-screen.v-cancel-confirm` is rendered with the modal active
  WHEN:  The screen draws
  THEN:  Phase card alpha equals `theme.opacity.disabled`, a `theme.colors.surface.scrim` overlay covers the rest, and a centered Compose `Surface` renders "Cancel this plan?" with two `LSButton`s (Keep tertiary, Cancel signal)

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/sandbox/IdlePlanningVariantTests.kt
  TEST_FUNCTION: testPlanningV02CancelConfirm

AC-6: Planning V03 single-candidate + header string
  GIVEN: Android sandbox story `templates.planning-screen.v-single-candidate` is rendered
  WHEN:  The screen draws
  THEN:  `LSPhaseIndicator` top border color is `theme.colors.status.warning`, the compass chip background is `theme.colors.status.warning.tint`, AND `LSPhaseIndicator(header = ...)` receives a non-null italic `theme.type.opinion.sm` string for the active phase

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/sandbox/IdlePlanningVariantTests.kt
  TEST_FUNCTION: testPlanningV03SingleCandidateAndHeader

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/debug/java/com/laneshadow/sandbox/mockproviders/IdleMockProvider.kt (MODIFY)
- android/app/src/debug/java/com/laneshadow/sandbox/mockproviders/PlanningMockProvider.kt (MODIFY)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/templates/IdleScreenStory.kt (MODIFY — register 3 new stories)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/templates/PlanningScreenStory.kt (MODIFY — register 3 new stories)
- android/app/src/main/java/com/laneshadow/ui/screens/IdleScreen.kt (MODIFY — render advisory card + no-location pill from provider)
- android/app/src/main/java/com/laneshadow/ui/screens/PlanningScreen.kt (MODIFY — render slow apology + cancel-confirm overlay + warning chrome from provider)
- android/app/src/main/java/com/laneshadow/ui/organisms/LSPhaseIndicator.kt (MODIFY — accept `header` String? param + warning border)
- android/app/src/main/java/com/laneshadow/ui/molecules/LSAdvisoryCard.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/molecules/LSCancelConfirmSheet.kt (NEW)
- android/app/src/test/java/com/laneshadow/sandbox/IdlePlanningVariantTests.kt (NEW)

writeProhibited:
- ios/** — paired iOS task (FID-S02-T03)
- server/**, react-native/**
- tokens/** — must NOT add new tokens
- Any file not explicitly listed above

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- IdleMockProvider.kt / PlanningMockProvider.kt (MODIFY): six new mock variants
- IdleScreenStory.kt / PlanningScreenStory.kt (MODIFY): six new sandbox stories registered with canonical IDs
- IdleScreen.kt / PlanningScreen.kt (MODIFY): variant rendering driven by provider state
- LSPhaseIndicator.kt (MODIFY): add `header: String?` parameter + warning border state
- LSAdvisoryCard.kt (NEW): tiny composable used by Idle V03
- LSCancelConfirmSheet.kt (NEW): centered confirm dialog used by Planning V02
- IdlePlanningVariantTests.kt (NEW): per-AC verification

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/design/system/views/mapapp/idle/idle-screen.html [PRIMARY REFERENCE]
   - Sections: V01, V02, V03
2. .spec/design/system/views/mapapp/planning/planning-screen.html [PRIMARY REFERENCE]
   - Sections: V01, V02, V03
3. .spec/prds/v3-integration/remediations/01-views-idle-planning.md
   - Sections: Gap B-04..B-06 (Idle V01-V03), Gap A-03 (Planning V01-V03), Gap G-02 (LSPhaseIndicator header)
4. android/app/src/debug/java/com/laneshadow/sandbox/mockproviders/IdleMockProvider.kt
   - Focus: Existing variant pattern — extend the same data-class shape
5. android/app/src/debug/java/com/laneshadow/sandbox/stories/templates/PlanningScreenStory.kt
   - Focus: Existing 4-story registration; use same `Story(id = "templates.planning-screen.…", content = { … })` shape

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase evidence per AC
Gate 2: One test per AC
Gate 3: Story IDs identical to iOS T03 (cross-platform parity key)
Gate 4: All tests pass — `./gradlew test`
Gate 5: Compile passes — `./gradlew :app:compileDebugKotlin`
Gate 6: Native compliance — `scripts/tokens/enforce-native-compliance.sh` exits 0
Gate 7: Scope compliance — `git diff --name-only ⊆ writeAllowed`

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- iOS variants (FID-S02-T03)
- Idle S01–S04 stories (already exist or are land in FID-S02-T10)
- PlanningScreen weather-condition badges and concurrent candidate polylines (FID-S02-T05/T06)
- Real chat-send wiring for Idle V01 (sandbox-only)

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** Android exposes 4 IdleScreen and 4 PlanningScreen sandbox stories — covers default + a few stress tests but none of the six "V" edge-state variants. `LSPhaseIndicator` does not accept a `header` parameter, so the italic Newsreader phase narration is missing.

**Gap:** Cross-platform parity requires identical story coverage with identical IDs; UC-FID-01 ACs requires variant rendering + phase header narration.

--------------------------------------------------------------------------------
REVIEW (for kotlin-reviewer)
--------------------------------------------------------------------------------

Must pass (≤5):
- One test per AC
- Story IDs identical to iOS T03 (verify via `pnpm snapshots:check`)
- LSPhaseIndicator gains `header: String?` parameter (default null) with backwards compatibility
- Variants driven from MockProvider state — no story-id branching in screen composables
- SCOPE respected (`git diff --name-only ⊆ writeAllowed`)

Should verify (≤5):
- LSAdvisoryCard / LSCancelConfirmSheet are reusable for Sprint 03+ wiring
- V02 cancel-confirm overlay uses `Dialog` or proper z-order, not `Box` overlay that traps gestures
- Compose previews exist for the new stories (helps iOS/Android visual sync)
- Reduced-motion / large-font Compose previews don't clip
- LSPhaseIndicator header text accessibility (`semantics`) describes the phase

Verdict: [APPROVED | NEEDS_FIXES]
Feedback (required if NEEDS_FIXES):
```
[Specific, actionable issues — reference file:line where possible]
```

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: FID-S01-T07 (Android build blockers — Session class) and FID-S01-T06 (Sessions drawer container fix)
Blocks:     FID-S02-T10 (snapshot baselines)
Parallel:   FID-S02-T01..T03, T05..T08

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN templates.idle-screen.v-no-location story WHEN screen draws THEN copper-bordered Tap to set start pill present (signal.tint border + signal.whisper bg) and LSChatInput alpha = theme.opacity.disabled", "verify": "./gradlew test" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN templates.idle-screen.v-first-ride story WHEN screen draws THEN zero favorite pin composables on map and onboarding chip set replaces default", "verify": "./gradlew test" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN templates.idle-screen.v-weather-advisory story WHEN screen draws THEN meta row text color status.warning and advisory card with wx.rainTint bg + wx.rain left stripe (strokeWidth.lg) + italic opinion.md body", "verify": "./gradlew test" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN templates.planning-screen.v-slow story WHEN screen draws THEN italic apology in content.tertiary below LSPhaseIndicator with dashed strokeWidth.thin top border", "verify": "./gradlew test" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN templates.planning-screen.v-cancel-confirm story WHEN modal active THEN phase card alpha=theme.opacity.disabled + surface.scrim overlay + centered Surface 'Cancel this plan?' with Keep (LSButton tertiary) + Cancel (LSButton signal) actions", "verify": "./gradlew test" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN templates.planning-screen.v-single-candidate story WHEN screen draws THEN LSPhaseIndicator top border status.warning + compass chip bg status.warning.tint + LSPhaseIndicator(header=...) receives non-null italic opinion.sm string", "verify": "./gradlew test" },
    { "id": "TC-1", "type": "test_criterion", "description": "Idle V01 story renders pill with signal.tint border and signal.whisper bg, and LSChatInput alpha equals theme.opacity.disabled", "maps_to_ac": "AC-1", "verify": "./gradlew test --tests '*.IdlePlanningVariantTests.testIdleV01NoLocation'" },
    { "id": "TC-2", "type": "test_criterion", "description": "Idle V02 story has favorite pin count = 0 and onboarding chip set is present", "maps_to_ac": "AC-2", "verify": "./gradlew test --tests '*.IdlePlanningVariantTests.testIdleV02FirstRide'" },
    { "id": "TC-3", "type": "test_criterion", "description": "Idle V03 story renders LSAdvisoryCard composable with wx.rainTint background, wx.rain left stripe, italic body, and meta row uses status.warning color", "maps_to_ac": "AC-3", "verify": "./gradlew test --tests '*.IdlePlanningVariantTests.testIdleV03WeatherAdvisory'" },
    { "id": "TC-4", "type": "test_criterion", "description": "Planning V01 story renders italic apology in content.tertiary below LSPhaseIndicator with dashed strokeWidth.thin top border", "maps_to_ac": "AC-4", "verify": "./gradlew test --tests '*.IdlePlanningVariantTests.testPlanningV01Slow'" },
    { "id": "TC-5", "type": "test_criterion", "description": "Planning V02 story renders LSCancelConfirmSheet with title, Keep + Cancel actions, surface.scrim overlay, and phase card alpha = theme.opacity.disabled", "maps_to_ac": "AC-5", "verify": "./gradlew test --tests '*.IdlePlanningVariantTests.testPlanningV02CancelConfirm'" },
    { "id": "TC-6", "type": "test_criterion", "description": "Planning V03 story has LSPhaseIndicator top border status.warning, compass chip bg status.warning.tint, and header parameter is non-null italic opinion.sm", "maps_to_ac": "AC-6", "verify": "./gradlew test --tests '*.IdlePlanningVariantTests.testPlanningV03SingleCandidateAndHeader'" }
  ]
}
-->
