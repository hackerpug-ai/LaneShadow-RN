================================================================================
TASK: FID-S02-T08 - Android Sessions + Error Variants (S05 confirm, date grouping, Error S04 + V01 + storm-gate, FlowRow wrap, primary/tertiary chip distinction)
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     L
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer

RUNTIME_COMMANDS:
  typecheck: cd android && ./gradlew :app:compileDebugKotlin
  test: cd android && ./gradlew test
  lint: cd android && ./gradlew detekt
  native-compliance: scripts/tokens/enforce-native-compliance.sh

PROGRESS: AC-1..AC-7 not started

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Android sandbox renders Sessions S05 (new-confirm), date-grouped sections, Error S04 (recovered fade-to-0.55), V01 (offline watermark + dim chat), storm-gate variant (`wx.storm` purple), Error suggestion-chip wrap via Compose `FlowRow`, and primary-vs-tertiary chip color distinction (warning-amber primary, glass tertiary). Story IDs identical to iOS T07.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST register variants under canonical IDs identical to iOS T07: `templates.sessions-screen.s05-new-confirm`, `templates.sessions-screen.s04-grouped`, `templates.error-screen.s04-recovered`, `templates.error-screen.v01-offline`, plus Android-only `templates.error-screen.s02-storm-gate`
- MUST replace `LSSessionsDrawer.groupLabel: String` with `sections: List<SessionSection>` parameter (back-compat shim for legacy callers)
- MUST use Compose `FlowRow` from `androidx.compose.foundation.layout.FlowRow` (Material 3-compatible) for chip wrap
- NEVER hardcode color/spacing/typography literals — all from `theme.*`
- MUST distinguish primary vs tertiary chips: primary chips use `theme.colors.status.warning.tint` background + `theme.colors.status.warning` border + `theme.colors.status.warning` text; tertiary chips use `theme.colors.surface.glass` background + `theme.colors.content.primary` text. The `LSInlineErrorCallout` accepts `chips: List<SuggestionChip>` where each chip carries `isPrimary: Boolean`
- MUST use `theme.colors.surface.scrim` for new-confirm dialog backdrop and `theme.colors.surface.card` for the dialog body

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] Sessions S05 — confirm dialog "Start a new ride?" + Cancel/Start-new actions (AC-1 PRIMARY)
- [ ] Sessions date grouping — multiple `LSSectionHeader` rows with 5-bucket support (AC-2)
- [ ] Error S04 — callout fades to 0.55 + chat populated + send button revealed on chip tap (AC-3)
- [ ] Error V01 — wifi-off SVG watermark + chat dim + buttons disabled (AC-4)
- [ ] Error storm-gate — `wx.storm` purple top stripe + compass chip + label + suggestion-chip dashed divider (AC-5)
- [ ] Error suggestion-chip wrap via `FlowRow` (AC-6)
- [ ] Primary/tertiary chip color distinction — `isPrimary: Boolean` flag on each chip; primary = warning-amber, tertiary = glass (AC-7)
- [ ] `./gradlew :app:compileDebugKotlin` + `./gradlew test` pass + native-compliance clean
- [ ] Only SCOPE.writeAllowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: Sessions S05 new-confirm dialog [PRIMARY]
  GIVEN: Sandbox story `templates.sessions-screen.s05-new-confirm` is rendered with an active session present
  WHEN:  The user taps "+ New session"
  THEN:  A centered Compose `Dialog` (or `Surface` overlay) renders "Start a new ride?" headline (`theme.type.opinion.lg`) with `surface.scrim` backdrop, `surface.card` body, and two `LSButton`s (Cancel tertiary + Start-new signal)

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/sandbox/SessionsErrorVariantTests.kt
  TEST_FUNCTION: testSessionsS05NewConfirm

AC-2: Sessions date grouping
  GIVEN: Sandbox story `templates.sessions-screen.s04-grouped` is rendered with sessions distributed across multiple date buckets
  WHEN:  The drawer composes
  THEN:  Multiple `LSSectionHeader` rows render between groups labelled (TONIGHT / TODAY / THIS WEEK / LAST WEEK / EARLIER) — at least 3 of the 5 buckets visible — and the drawer accepts `sections: List<SessionSection>` containing `label: String + sessions: List<Session>` per bucket

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/sandbox/SessionsErrorVariantTests.kt
  TEST_FUNCTION: testSessionsDateGrouping

AC-3: Error S04 recovered state
  GIVEN: Sandbox story `templates.error-screen.s04-recovered` is rendered
  WHEN:  The user taps a suggestion chip
  THEN:  LSInlineErrorCallout fades to alpha 0.55 (`theme.opacity.recovered`), the chat field is populated with the suggestion text, the filter button is hidden, and the trailing slot reveals a `theme.colors.signal.default` send button

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/sandbox/SessionsErrorVariantTests.kt
  TEST_FUNCTION: testErrorS04Recovered

AC-4: Error V01 offline
  GIVEN: Sandbox story `templates.error-screen.v01-offline` is rendered
  WHEN:  The screen draws
  THEN:  A wifi-off vector watermark renders on the map at alpha 0.25 in `theme.colors.status.warning`, LSChatInput renders at alpha 0.7, and leading + trailing buttons are `enabled = false`

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/sandbox/SessionsErrorVariantTests.kt
  TEST_FUNCTION: testErrorV01Offline

AC-5: Error storm-gate variant
  GIVEN: Sandbox story `templates.error-screen.s02-storm-gate` is rendered
  WHEN:  The screen draws
  THEN:  ErrorScreen renders with `theme.colors.wx.storm` purple for the top stripe, compass chip background, label color, and suggestion-chip dashed divider color — replacing the warning-amber styling

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/sandbox/SessionsErrorVariantTests.kt
  TEST_FUNCTION: testErrorStormGate

AC-6: Error suggestion-chip wrap via FlowRow
  GIVEN: LSInlineErrorCallout suggestion-chip story with 6+ chips rendered
  WHEN:  The chip row composes
  THEN:  Compose `FlowRow` wraps chips to multiple lines when their combined width exceeds the callout — no chip is clipped or truncated

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/sandbox/SessionsErrorVariantTests.kt
  TEST_FUNCTION: testErrorSuggestionFlowRowWrap

AC-7: Primary/tertiary chip color distinction
  GIVEN: An LSInlineErrorCallout story passes `chips = listOf(SuggestionChip(label="Try again", isPrimary=true), SuggestionChip(label="Rewrite the ask", isPrimary=false))`
  WHEN:  The chip row composes
  THEN:  The first chip renders `status.warning.tint` background + `status.warning` border + `status.warning` text; the second chip renders `surface.glass` background + `content.primary` text — NOT the current `ContentColor.Primary` / `ContentColor.Secondary` mapping

  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/sandbox/SessionsErrorVariantTests.kt
  TEST_FUNCTION: testSuggestionChipPrimaryTertiary

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/ui/organisms/LSSessionsDrawer.kt (MODIFY — sections parameter, S05 confirm wiring)
- android/app/src/main/java/com/laneshadow/ui/organisms/LSInlineErrorCallout.kt (MODIFY — recovered fade + FlowRow wrap + isPrimary chip styling)
- android/app/src/main/java/com/laneshadow/ui/screens/SessionsScreen.kt (MODIFY — confirm dialog wiring)
- android/app/src/main/java/com/laneshadow/ui/screens/ErrorScreen.kt (MODIFY — offline + recovered + storm-gate + chip-isPrimary plumbing)
- android/app/src/main/java/com/laneshadow/ui/molecules/LSConfirmDialog.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/atoms/LSWifiOffWatermark.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/molecules/LSSuggestionChip.kt (MODIFY — isPrimary parameter + correct token mapping)
- android/app/src/debug/java/com/laneshadow/sandbox/mockproviders/SessionsMockProvider.kt (MODIFY — S05 + grouped variants)
- android/app/src/debug/java/com/laneshadow/sandbox/mockproviders/ErrorMockProvider.kt (MODIFY — S04 + V01 + storm-gate variants + per-chip isPrimary flags)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/templates/SessionsScreenStory.kt (MODIFY — register S05 + grouped)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/templates/ErrorScreenStory.kt (MODIFY — register S04, V01, storm-gate)
- android/app/src/test/java/com/laneshadow/sandbox/SessionsErrorVariantTests.kt (NEW)

writeProhibited:
- ios/** — paired iOS task (FID-S02-T07)
- server/**, react-native/**
- tokens/** — must NOT add new tokens; if `theme.opacity.recovered` is missing, flag and stop
- Any file not explicitly listed above

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- LSSessionsDrawer.kt (MODIFY): sections parameter + back-compat shim
- LSInlineErrorCallout.kt (MODIFY): recovered fade-to-0.55 + FlowRow wrap + isPrimary chip styling
- SessionsScreen.kt / ErrorScreen.kt (MODIFY): provider-driven new-variant rendering
- LSConfirmDialog.kt (NEW), LSWifiOffWatermark.kt (NEW)
- LSSuggestionChip.kt (MODIFY): isPrimary parameter mapping to warning-amber vs glass
- SessionsMockProvider.kt / ErrorMockProvider.kt (MODIFY): five new variants + per-chip isPrimary flags
- SessionsScreenStory.kt / ErrorScreenStory.kt (MODIFY): five new sandbox stories with canonical IDs
- SessionsErrorVariantTests.kt (NEW): per-AC verification

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/design/system/views/mapapp/sessions-drawer/sessions-screen.html [PRIMARY REFERENCE]
2. .spec/design/system/views/mapapp/error/error-screen.html [PRIMARY REFERENCE]
3. .spec/prds/v3-integration/remediations/03-views-sessions-error.md
   - Sections: A1-10 (date grouping), G1-07 (S05 confirm), G2-04 (S04 recovered), B2-05 (V01 offline), D2-02 (chip primary/tertiary), D2-03 (storm-gate), H2-06 (chip wrap)
4. android/app/src/main/java/com/laneshadow/ui/organisms/LSSessionsDrawer.kt
   - Focus: Current `groupLabel: String` API surface and call sites — design back-compat shim
5. android/app/src/main/java/com/laneshadow/ui/molecules/LSSuggestionChip.kt
   - Focus: Current `ContentColor.Primary`/`Secondary` mapping — replace with isPrimary flag

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase evidence per AC
Gate 2: One test per AC
Gate 3: Story IDs canonical + identical to iOS T07 (storm-gate is Android-only — no parity violation since iOS doesn't ship the storm variant in this sprint)
Gate 4: All tests pass — `./gradlew test`
Gate 5: Compile passes — `./gradlew :app:compileDebugKotlin`
Gate 6: Native compliance — `scripts/tokens/enforce-native-compliance.sh` exits 0
Gate 7: Scope compliance — `git diff --name-only ⊆ writeAllowed`

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- iOS variants (FID-S02-T07)
- Real session-switching wiring (Sprint 05)
- Adding `theme.opacity.recovered` token if missing

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** Android exposes 4 SessionsScreen stories and 6 ErrorScreen stories, but no S05 new-confirm, no grouped sections, no recovered state, no offline state, no storm-gate. Suggestion chips currently map `isPrimary` (when present) to `ContentColor.Primary`/`Secondary` — the wrong tokens for the warning-amber vs glass distinction. Chip row clips on overflow because `Row` is used.

**Gap:** Per UC-FID-01, all variants must render in sandbox to support snapshot baselines and downstream integration sprints.

--------------------------------------------------------------------------------
REVIEW (for kotlin-reviewer)
--------------------------------------------------------------------------------

Must pass (≤5):
- One test per AC
- LSSessionsDrawer signature change is back-compat with existing call sites
- All five new stories carry canonical IDs (storm-gate marked as Android-only via parity-exemptions if needed)
- Suggestion chip isPrimary flag maps to the correct token combinations (warning-amber vs glass)
- SCOPE respected (`git diff --name-only ⊆ writeAllowed`)

Should verify (≤5):
- Confirm dialog uses Compose `Dialog` so it doesn't capture parent gestures
- Wifi-off watermark uses an `ImageVector` from Material Icons or a local vector resource
- Recovered fade-to-0.55 keyed on chip-tap action, not arbitrary state
- FlowRow doesn't break LSInlineErrorCallout layout when chip count is small
- Accessibility — primary chips have `contentDescription` indicating warning role; confirm dialog title announced

Verdict: [APPROVED | NEEDS_FIXES]
Feedback (required if NEEDS_FIXES):
```
[Specific, actionable issues — reference file:line where possible]
```

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: FID-S01-T06 (Sessions drawer container fix)
Blocks:     FID-S02-T10 (snapshot baselines)
Parallel:   FID-S02-T01..T07

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN templates.sessions-screen.s05-new-confirm story with active session WHEN user taps +New session THEN centered Compose Dialog 'Start a new ride?' opinion.lg with surface.scrim backdrop + surface.card body + Cancel(tertiary) + Start-new(signal) buttons", "verify": "./gradlew test" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN templates.sessions-screen.s04-grouped story with sessions across date buckets WHEN drawer composes THEN multiple LSSectionHeader rows labelled TONIGHT/TODAY/THIS WEEK/LAST WEEK/EARLIER (≥3 visible) and drawer accepts sections:List<SessionSection>", "verify": "./gradlew test" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN templates.error-screen.s04-recovered story WHEN user taps suggestion chip THEN LSInlineErrorCallout alpha→0.55, chat field populated, filter hidden, signal.default send button revealed", "verify": "./gradlew test" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN templates.error-screen.v01-offline story WHEN screen draws THEN wifi-off vector watermark on map at alpha 0.25 + status.warning, LSChatInput alpha 0.7, leading + trailing buttons enabled=false", "verify": "./gradlew test" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN templates.error-screen.s02-storm-gate story WHEN screen draws THEN top stripe + compass chip + label + suggestion-chip dashed divider all use wx.storm purple instead of warning-amber", "verify": "./gradlew test" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN LSInlineErrorCallout suggestion-chip story with 6+ chips WHEN row composes THEN Compose FlowRow wraps to multiple lines when combined width exceeds callout, no chip clipped or truncated", "verify": "./gradlew test" },
    { "id": "AC-7", "type": "acceptance_criterion", "description": "GIVEN LSInlineErrorCallout chips=listOf(primary, tertiary) WHEN row composes THEN primary chip uses status.warning.tint bg + status.warning border + status.warning text; tertiary chip uses surface.glass bg + content.primary text", "verify": "./gradlew test" },
    { "id": "TC-1", "type": "test_criterion", "description": "S05 confirm dialog renders LSConfirmDialog Compose Dialog with title 'Start a new ride?', surface.scrim backdrop, Cancel + Start-new buttons with correct token mapping", "maps_to_ac": "AC-1", "verify": "./gradlew test --tests '*.SessionsErrorVariantTests.testSessionsS05NewConfirm'" },
    { "id": "TC-2", "type": "test_criterion", "description": "Grouped story renders ≥3 LSSectionHeader rows with labels from {TONIGHT,TODAY,THIS WEEK,LAST WEEK,EARLIER} via sections parameter", "maps_to_ac": "AC-2", "verify": "./gradlew test --tests '*.SessionsErrorVariantTests.testSessionsDateGrouping'" },
    { "id": "TC-3", "type": "test_criterion", "description": "S04 chip tap fades callout to 0.55 alpha, populates chat field, hides filter button, shows signal.default send button", "maps_to_ac": "AC-3", "verify": "./gradlew test --tests '*.SessionsErrorVariantTests.testErrorS04Recovered'" },
    { "id": "TC-4", "type": "test_criterion", "description": "V01 offline story renders LSWifiOffWatermark at alpha 0.25 + status.warning, LSChatInput at alpha 0.7, leading/trailing buttons enabled=false", "maps_to_ac": "AC-4", "verify": "./gradlew test --tests '*.SessionsErrorVariantTests.testErrorV01Offline'" },
    { "id": "TC-5", "type": "test_criterion", "description": "Storm-gate story renders ErrorScreen with wx.storm purple in top stripe + compass chip + label + dashed divider", "maps_to_ac": "AC-5", "verify": "./gradlew test --tests '*.SessionsErrorVariantTests.testErrorStormGate'" },
    { "id": "TC-6", "type": "test_criterion", "description": "FlowRow chip wrap with 6+ chips produces multi-line layout (chip Y positions span >1 row) and no chip width clipped", "maps_to_ac": "AC-6", "verify": "./gradlew test --tests '*.SessionsErrorVariantTests.testErrorSuggestionFlowRowWrap'" },
    { "id": "TC-7", "type": "test_criterion", "description": "Primary chip uses status.warning.tint/status.warning/status.warning tokens; tertiary chip uses surface.glass + content.primary tokens; ContentColor.Primary/Secondary no longer used", "maps_to_ac": "AC-7", "verify": "./gradlew test --tests '*.SessionsErrorVariantTests.testSuggestionChipPrimaryTertiary'" }
  ]
}
-->
