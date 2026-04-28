================================================================================
TASK: FID-S02-T07 - iOS Sessions + Error Variants (S05 confirm, date grouping, Error S04 + V01, chip wrap)
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

iOS sandbox renders Sessions S05 (new-confirm dialog), date-grouped sections (TONIGHT / TODAY / THIS WEEK / LAST WEEK / EARLIER), Error S04 (recovered: callout fades to 0.55 + send button revealed), Error V01 (offline: wifi-off watermark + chat-input dim + disabled buttons), and FlowLayout chip wrap on the Error suggestion-chip row.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST register variants under canonical IDs: `templates.sessions-screen.s05-new-confirm`, `templates.sessions-screen.s04-grouped`, `templates.error-screen.s04-recovered`, `templates.error-screen.v01-offline`
- MUST replace `LSSessionsDrawer.groupLabel: String` with `sections: [SessionSection]` parameter; existing `groupLabel` callers should pass a single `[SessionSection(label: groupLabel, sessions: sessions)]` to preserve behavior
- MUST use SwiftUI `Layout` protocol (FlowLayout) for the Error suggestion-chip wrap — NOT a manual `LazyVGrid` or `HStack` with truncation
- NEVER hardcode color/spacing/typography literals — use theme tokens
- MUST use `theme.colors.surface.scrim` for the new-confirm dialog backdrop and `theme.colors.surface.card` for the dialog surface

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] Sessions S05 — centered confirm dialog "Start a new ride?" with `surface.scrim` backdrop + Cancel/Start-new actions (AC-1 PRIMARY)
- [ ] Sessions date grouping — 5 designed labels supported via `sections: [SessionSection]` (AC-2)
- [ ] Error S04 — callout fades to 0.55 opacity + chat field populated + filter button hidden + signal send button revealed on chip tap (AC-3)
- [ ] Error V01 — wifi-off SVG watermark on map (alpha 0.25 in `status.warning`) + chat input alpha 0.7 + leading/trailing buttons disabled (AC-4)
- [ ] Error chip wrap — FlowLayout wraps chips to multiple lines when content overflows (AC-5)
- [ ] LSSessionsDrawer accepts `sections: [SessionSection]` parameter; existing callers compile (AC-6)
- [ ] `xcodebuild build` + `xcodebuild test` pass + native-compliance clean
- [ ] Only SCOPE.writeAllowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: Sessions S05 new-confirm dialog [PRIMARY]
  GIVEN: Sandbox story `templates.sessions-screen.s05-new-confirm` is rendered with an active session present
  WHEN:  The user taps "+ New session" in the SessionsDrawer
  THEN:  A centered confirm dialog renders ("Start a new ride?" headline in opinion-serif) with `surface.scrim` backdrop, `surface.card` dialog background, and two `LSButton`s (Cancel as `surface.button.tertiary`, "Start new" as `surface.button.signal`)

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/SessionsErrorVariantTests.swift
  TEST_FUNCTION: testSessionsS05NewConfirm

AC-2: Sessions date grouping
  GIVEN: Sandbox story `templates.sessions-screen.s04-grouped` is rendered with sessions distributed across multiple date buckets
  WHEN:  The drawer composes
  THEN:  Multiple `LSSectionHeader` rows render between groups labelled (TONIGHT / TODAY / THIS WEEK / LAST WEEK / EARLIER) — at least 3 of the 5 buckets visible — and the drawer accepts `sections: [SessionSection]` containing a `label: String` + `sessions: [Session]` per bucket

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/SessionsErrorVariantTests.swift
  TEST_FUNCTION: testSessionsDateGrouping

AC-3: Error S04 recovered state
  GIVEN: Sandbox story `templates.error-screen.s04-recovered` is rendered
  WHEN:  The user taps a suggestion chip
  THEN:  The LSInlineErrorCallout fades to opacity 0.55 (`theme.opacity.recovered`), the chat field is populated with the suggestion text, the filter button is hidden, and the trailing slot reveals a `theme.colors.signal.default` send button

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/SessionsErrorVariantTests.swift
  TEST_FUNCTION: testErrorS04Recovered

AC-4: Error V01 offline
  GIVEN: Sandbox story `templates.error-screen.v01-offline` is rendered
  WHEN:  The screen draws
  THEN:  A wifi-off SVG glyph watermark renders on the map at opacity 0.25 in `theme.colors.status.warning`, LSChatInput renders at opacity 0.7, and the leading + trailing buttons are disabled (gray + non-interactive)

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/SessionsErrorVariantTests.swift
  TEST_FUNCTION: testErrorV01Offline

AC-5: Error chip FlowLayout wrap
  GIVEN: LSInlineErrorCallout suggestion-chip story with 6+ chips rendered
  WHEN:  The chip row composes
  THEN:  A SwiftUI `Layout` (FlowLayout) wraps chips to multiple lines when their combined width exceeds the callout — no chip is clipped or truncated

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/SessionsErrorVariantTests.swift
  TEST_FUNCTION: testErrorSuggestionFlowWrap

AC-6: LSSessionsDrawer accepts `sections` parameter
  GIVEN: An existing caller of `LSSessionsDrawer(groupLabel: ...)` (e.g. existing default story)
  WHEN:  The drawer signature is updated to accept `sections: [SessionSection]` (with a back-compat shim mapping the old single-group call)
  THEN:  All existing callers compile, the default story still renders correctly, and the new story uses the `sections` parameter directly

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/SessionsErrorVariantTests.swift
  TEST_FUNCTION: testSessionsDrawerSectionsParameter

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Views/Organisms/LSSessionsDrawer.swift (MODIFY — sections parameter, S05 confirm dialog wiring)
- ios/LaneShadow/Views/Organisms/LSInlineErrorCallout.swift (MODIFY — fade-to-0.55 recovered + chip wrap layout)
- ios/LaneShadow/Views/Screens/SessionsScreen.swift (MODIFY — render confirm dialog from provider state)
- ios/LaneShadow/Views/Screens/ErrorScreen.swift (MODIFY — render offline watermark + recovered fade from provider state)
- ios/LaneShadow/Views/Layout/FlowLayout.swift (NEW — SwiftUI Layout protocol implementation)
- ios/LaneShadow/Views/Molecules/LSConfirmDialog.swift (NEW — centered dialog molecule)
- ios/LaneShadow/Views/Atoms/LSWifiOffWatermark.swift (NEW — SVG glyph watermark)
- ios/LaneShadow/Sandbox/MockProviders/SessionsMockProvider.swift (MODIFY — S05 + grouped variants)
- ios/LaneShadow/Sandbox/MockProviders/ErrorMockProvider.swift (MODIFY — S04 + V01 variants)
- ios/LaneShadow/Sandbox/Stories/Templates/SessionsScreenStory.swift (MODIFY — register S05 + grouped)
- ios/LaneShadow/Sandbox/Stories/Templates/ErrorScreenStory.swift (MODIFY — register S04 + V01)
- ios/LaneShadowTests/Sandbox/SessionsErrorVariantTests.swift (NEW)

writeProhibited:
- android/** — paired Android task (FID-S02-T08)
- server/**, react-native/**
- tokens/** — must NOT add new tokens; if `theme.opacity.recovered` is missing, flag and stop
- Any file not explicitly listed above

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- LSSessionsDrawer.swift (MODIFY): `sections: [SessionSection]` parameter + back-compat shim
- LSInlineErrorCallout.swift (MODIFY): fade-to-0.55 recovered state + FlowLayout chip wrap
- SessionsScreen.swift / ErrorScreen.swift (MODIFY): provider-driven rendering of new variants
- FlowLayout.swift (NEW): SwiftUI Layout protocol implementation reusable for chip rows
- LSConfirmDialog.swift (NEW): centered dialog molecule
- LSWifiOffWatermark.swift (NEW): SVG glyph atom for offline state
- SessionsMockProvider.swift / ErrorMockProvider.swift (MODIFY): four new variants
- SessionsScreenStory.swift / ErrorScreenStory.swift (MODIFY): four new sandbox stories with canonical IDs
- SessionsErrorVariantTests.swift (NEW): per-AC verification

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/design/system/views/sessions-screen/sessions-screen.html [PRIMARY REFERENCE]
   - Sections: S04 grouped, S05 new-confirm
2. .spec/design/system/views/error-screen/error-screen.html [PRIMARY REFERENCE]
   - Sections: S04 recovered, V01 offline
3. .spec/prds/v3-integration/remediations/03-views-sessions-error.md
   - Sections: Gap A1-10 (date grouping), G1-07 (S05 confirm), G2-04 (S04 recovered), B2-05 (V01 offline), H2-06 (chip wrap)
4. ios/LaneShadow/Views/Organisms/LSSessionsDrawer.swift
   - Focus: Current `groupLabel: String` API surface and call sites — design back-compat shim
5. ios/LaneShadow/Views/Organisms/LSInlineErrorCallout.swift
   - Focus: Current chip-row layout and recovered-state hook (none today)

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase evidence per AC
Gate 2: One test per AC
Gate 3: Story IDs canonical + identical to Android paired task T08
Gate 4: All tests pass — `xcodebuild test`
Gate 5: Build passes — `xcodebuild build`
Gate 6: Native compliance — `scripts/tokens/enforce-native-compliance.sh` exits 0
Gate 7: Scope compliance — `git diff --name-only ⊆ writeAllowed`

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- Android variants (FID-S02-T08)
- Storm-gate variant (Android-only — covered in T08; iOS already lacks the storm mock variant entirely and adding it is deferred to v3.1)
- Suggestion chip primary/tertiary color distinction (Android-only — Gap D2-02)
- Real session-switching wiring (Sprint 05 — SESS-S05-T07)
- Adding a `theme.opacity.recovered` token if missing (must come from token-additions task)

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** iOS exposes 1 SessionsScreen story (default) and 1 ErrorScreen story (default). No S05 confirm dialog exists. `LSSessionsDrawer` accepts a single `groupLabel: String` — no concept of multiple sections. ErrorScreen has no offline / recovered state. LSInlineErrorCallout chip row clips when content overflows because it uses `HStack`.

**Gap:** Sandbox lacks ground truth for confirm-dialog flow, multi-day session grouping, recovered-state interaction, offline state, and chip wrap layout.

--------------------------------------------------------------------------------
REVIEW (for swift-reviewer)
--------------------------------------------------------------------------------

Must pass (≤5):
- One test per AC
- LSSessionsDrawer signature change is back-compat with existing call sites
- All four new stories carry canonical IDs identical to Android T08
- FlowLayout doesn't break LSInlineErrorCallout layout for the small-chip-count case
- SCOPE respected (`git diff --name-only ⊆ writeAllowed`)

Should verify (≤5):
- Confirm dialog uses `Sheet` / `Alert` / custom overlay correctly so it doesn't trap focus
- Wifi-off watermark uses an SF Symbol or local SVG (no remote asset)
- Recovered fade-to-0.55 is keyed on chip-tap action, not arbitrary state
- Reduced-motion / large-font paths still render confirm dialog without clipping
- Accessibility: confirm dialog announces "Start new ride?" via `accessibilityLabel`

Verdict: [APPROVED | NEEDS_FIXES]
Feedback (required if NEEDS_FIXES):
```
[Specific, actionable issues — reference file:line where possible]
```

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: FID-S01-T01 (typography), FID-S01-T05 (Sessions drawer container fix)
Blocks:     FID-S02-T10 (snapshot baselines)
Parallel:   FID-S02-T01..T06, T08

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN templates.sessions-screen.s05-new-confirm story with active session present WHEN user taps +New session THEN centered confirm dialog 'Start a new ride?' opinion-serif with surface.scrim backdrop + surface.card dialog bg + Cancel(button.tertiary) + Start new(button.signal)", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN templates.sessions-screen.s04-grouped story with sessions across date buckets WHEN drawer composes THEN multiple LSSectionHeader rows render labelled TONIGHT/TODAY/THIS WEEK/LAST WEEK/EARLIER (≥3 visible) and drawer accepts sections:[SessionSection]", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN templates.error-screen.s04-recovered story WHEN user taps suggestion chip THEN callout fades to opacity 0.55, chat field populated, filter button hidden, signal.default send button revealed in trailing slot", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN templates.error-screen.v01-offline story WHEN screen draws THEN wifi-off SVG watermark on map at opacity 0.25 in status.warning, LSChatInput opacity 0.7, leading + trailing buttons disabled", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN LSInlineErrorCallout suggestion-chip story with 6+ chips WHEN row composes THEN FlowLayout wraps chips to multiple lines when combined width exceeds callout, no chip clipped or truncated", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN existing LSSessionsDrawer(groupLabel:) callers WHEN signature updated to sections:[SessionSection] with back-compat shim THEN existing callers compile, default story still renders, new story uses sections directly", "verify": "xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "TC-1", "type": "test_criterion", "description": "S05 confirm dialog renders LSConfirmDialog with title 'Start a new ride?', surface.scrim backdrop, Cancel + Start-new buttons with correct token mapping", "maps_to_ac": "AC-1", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/SessionsErrorVariantTests/testSessionsS05NewConfirm" },
    { "id": "TC-2", "type": "test_criterion", "description": "Grouped story renders ≥3 LSSectionHeader rows with labels from {TONIGHT,TODAY,THIS WEEK,LAST WEEK,EARLIER} via sections parameter", "maps_to_ac": "AC-2", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/SessionsErrorVariantTests/testSessionsDateGrouping" },
    { "id": "TC-3", "type": "test_criterion", "description": "S04 chip tap fades callout to 0.55 opacity, populates chat field, hides filter button, shows signal.default send button", "maps_to_ac": "AC-3", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/SessionsErrorVariantTests/testErrorS04Recovered" },
    { "id": "TC-4", "type": "test_criterion", "description": "V01 offline story renders LSWifiOffWatermark at opacity 0.25 + status.warning color, LSChatInput at opacity 0.7, leading/trailing buttons isEnabled=false", "maps_to_ac": "AC-4", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/SessionsErrorVariantTests/testErrorV01Offline" },
    { "id": "TC-5", "type": "test_criterion", "description": "FlowLayout chip wrap with 6+ chips produces multi-line layout (chip Y positions span >1 row) and no chip width is clipped", "maps_to_ac": "AC-5", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/SessionsErrorVariantTests/testErrorSuggestionFlowWrap" },
    { "id": "TC-6", "type": "test_criterion", "description": "LSSessionsDrawer compiles with both legacy groupLabel:String and new sections:[SessionSection] callers; back-compat shim maps groupLabel to single-section list", "maps_to_ac": "AC-6", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/SessionsErrorVariantTests/testSessionsDrawerSectionsParameter" }
  ]
}
-->
