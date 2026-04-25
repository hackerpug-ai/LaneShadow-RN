<!-- Template Version: 5.1.0 | Sprint: sprint-05-organisms | Type: FEATURE/TDD -->

================================================================================
TASK: UC-ORG-03-ios — LSNavigatorMessage + LSInlineErrorCallout — iOS SwiftUI
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P1
EFFORT:     L
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer
ESTIMATE:   240 min
SPRINT:     [SPRINT.md](./SPRINT.md)
PRD_REFS:   07-uc-org.md (UC-ORG-03)

RUNTIME_COMMANDS:
  test:      cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  typecheck: cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  lint:      swiftformat --lint ios/LaneShadow/

PROGRESS: 0/8 ACs complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

LSNavigatorMessage renders a signal-stripe LSGlassPanel(.callout(accent: .signal)) with compass chip + 'THE NAVIGATOR' label (typography.ui.label.sm, color.signal.default) + body in typography.opinion.md (Newsreader serif) + optional attached LSRouteAttachmentCard stack (first selected) + pin/close actions. Unpinned variant auto-dismisses at 5000ms via motion.recipe.chatOverlayDismiss. LSInlineErrorCallout renders a warn-stripe LSGlassPanel(.callout(accent: .warning)) with compass chip + title + body + optional detail + horizontal LSSuggestionChip row; suggestion tap fires onSuggestionTap(chip) once. All variant stories registered; swiftformat clean; build + tests green.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST wrap both organisms in LSGlassPanel(.callout(accent:)) — .signal for NavigatorMessage, .warning for InlineErrorCallout.
- MUST route body through LSText(typography.opinion.md) — Newsreader serif token.
- MUST route 'THE NAVIGATOR' label through LSText(typography.ui.label.sm) + color.signal.default token.
- MUST use LSRouteAttachmentCard molecule (UC-MOL-08) for attachments with spacing.2 between cards and first card selected: true.
- MUST resolve auto-dismiss timing + easing from motion.recipe.chatOverlayDismiss (5000ms visible).
- MUST use LSSuggestionChip molecule for suggestion footer — no raw Button.
- MUST register stories: Message Only, With One Attachment, With Three Attachments, Pinned, Long Body, Dark Mode (NavigatorMessage); Error Only, With Detail, With Suggestions, Long Body + Long Suggestions, Dark Mode (InlineErrorCallout).
- NEVER hand-edit ios/LaneShadow.xcodeproj/project.pbxproj.
- NEVER use Font.system, Color(hex:), Color(red:), or .monospaced() in either organism source.
- NEVER reach into Convex, networking, or ViewModels — organisms take props only.
- NEVER inline auto-dismiss timer with literal milliseconds — reference motion.recipe.chatOverlayDismiss.
- NEVER fire auto-dismiss when pinned == true.
- STRICTLY: swiftformat --lint exits 0; xcodebuild test TEST SUCCEEDED for LSNavigatorMessageTests and LSInlineErrorCalloutTests; light + dark render correctly.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AC-1: LSNavigatorMessage renders callout with compass + label + serif body + pin/close (PRIMARY)
- [ ] AC-2: Attachments render as LSRouteAttachmentCard stack with first selected
- [ ] AC-3: Unpinned variant auto-dismisses at 5000ms; pinned variant persists
- [ ] AC-4: onPin and onDismiss handlers fire exactly once on tap
- [ ] AC-5: LSInlineErrorCallout renders warn-stripe callout with title/body/detail/suggestions
- [ ] AC-6: Suggestion chip tap fires onSuggestionTap(chip) once with tapped chip
- [ ] AC-7: All variant stories registered for both organisms
- [ ] AC-8: Atom-composition gate (no banned primitives)

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: NavigatorMessage signal callout composition [PRIMARY]
  GIVEN: developer renders LSNavigatorMessage(body: "Take 280 south to 92…", attachments: [], pinned: true)
  WHEN:  view body resolves
  THEN:  LSGlassPanel(.callout(accent: .signal)) container wraps: header row with LSIcon(.compass) inside tinted LSPill(size: .sm) backed by color.signal.default at 22% + LSText(ui.label.sm, 'THE NAVIGATOR', color.signal.default) + trailing LSIcon(.bookmarkFill)/LSIcon(.close); body in LSText(opinion.md)
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSNavigatorMessageTests/test_renders_signal_callout_with_compass_label_body 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Organisms/LSNavigatorMessageTests.swift
  TEST_FUNCTION: test_renders_signal_callout_with_compass_label_body

AC-2: Three attachments first selected
  GIVEN: LSNavigatorMessage with attachments: [best, alt1, alt2]
  WHEN:  view body resolves
  THEN:  three LSRouteAttachmentCard instances render vertically stacked with spacing.2; first card has selected: true, others false
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSNavigatorMessageTests/test_three_attachments_first_selected 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Organisms/LSNavigatorMessageTests.swift
  TEST_FUNCTION: test_three_attachments_first_selected

AC-3: Unpinned auto-dismiss; pinned persists
  GIVEN: LSNavigatorMessage(body: "...", pinned: false) and LSNavigatorMessage(pinned: true) presented at t=0
  WHEN:  5100ms elapses
  THEN:  unpinned variant has fired onDismiss via motion.recipe.chatOverlayDismiss; pinned variant remains visible
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSNavigatorMessageTests/test_unpinned_auto_dismisses_pinned_persists 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Organisms/LSNavigatorMessageTests.swift
  TEST_FUNCTION: test_unpinned_auto_dismisses_pinned_persists

AC-4: Pin/Dismiss handlers fire once
  GIVEN: LSNavigatorMessage with onPin and onDismiss callbacks
  WHEN:  user taps the bookmark icon and then the close icon
  THEN:  onPin invocation count == 1; onDismiss invocation count == 1
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSNavigatorMessageTests/test_pin_and_dismiss_handlers_fire_once 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Organisms/LSNavigatorMessageTests.swift
  TEST_FUNCTION: test_pin_and_dismiss_handlers_fire_once

AC-5: InlineErrorCallout warning composition
  GIVEN: developer renders LSInlineErrorCallout(body: "Couldn't stitch…", detail: "Try a different…", suggestions: [SuggestionChip("Try inland"), SuggestionChip("End at Big Sur")])
  WHEN:  view body resolves
  THEN:  LSGlassPanel(.callout(accent: .warning)) wraps: compass chip + title LSText(ui.label.sm, color.signal.default) + body LSText(opinion.md) + detail LSText(ui.body.sm, color.content.textMuted) + horizontal LSSuggestionChip row
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSInlineErrorCalloutTests/test_renders_warning_callout_with_body_detail_suggestions 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Organisms/LSInlineErrorCalloutTests.swift
  TEST_FUNCTION: test_renders_warning_callout_with_body_detail_suggestions

AC-6: Suggestion tap fires once with chip
  GIVEN: LSInlineErrorCallout with two suggestions and onSuggestionTap handler
  WHEN:  user taps the 'Try inland' chip
  THEN:  onSuggestionTap is invoked exactly once with the 'Try inland' SuggestionChip
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSInlineErrorCalloutTests/test_suggestion_tap_fires_once_with_chip 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Organisms/LSInlineErrorCalloutTests.swift
  TEST_FUNCTION: test_suggestion_tap_fires_once_with_chip

AC-7: All variant stories registered
  GIVEN: developer opens the sandbox
  WHEN:  navigating to Organisms / NavigatorMessage and Organisms / InlineErrorCallout
  THEN:  NavigatorMessage stories Message Only, With One Attachment, With Three Attachments, Pinned, Long Body, Dark Mode all present; InlineErrorCallout stories Error Only, With Detail, With Suggestions, Long Body + Long Suggestions, Dark Mode all present; both render under light and dark themes
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSNavigatorMessageTests/test_navigator_and_error_stories_registered 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Organisms/LSNavigatorMessageTests.swift
  TEST_FUNCTION: test_navigator_and_error_stories_registered

AC-8: Atom-composition gate
  GIVEN: LSNavigatorMessage.swift and LSInlineErrorCallout.swift sources
  WHEN:  inspected
  THEN:  no Font.system, Color(hex:), Color(red:, .monospaced() occurrences
  VERIFY: grep -n 'Font.system\|Color(red:\|Color(hex:\|\.monospaced()' ios/LaneShadow/Views/Organisms/LSNavigatorMessage.swift ios/LaneShadow/Views/Organisms/LSInlineErrorCallout.swift | wc -l | xargs test 0 -eq
  TDD_STATE: none
  TEST_FILE: (grep gate)
  TEST_FUNCTION: (build-time invariant)

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID | Statement | Maps to AC |
|----|-----------|------------|
| TC-1 | test_renders_signal_callout_with_compass_label_body passes | AC-1 |
| TC-2 | test_three_attachments_first_selected passes | AC-2 |
| TC-3 | test_unpinned_auto_dismisses_pinned_persists passes | AC-3 |
| TC-4 | test_pin_and_dismiss_handlers_fire_once passes | AC-4 |
| TC-5 | test_renders_warning_callout_with_body_detail_suggestions passes | AC-5 |
| TC-6 | test_suggestion_tap_fires_once_with_chip passes | AC-6 |
| TC-7 | test_navigator_and_error_stories_registered passes | AC-7 |
| TC-8 | No banned primitives in either organism source | AC-8 |
| TC-9 | swiftformat --lint exits 0 | AC-8 |
| TC-10 | xcodebuild build BUILD SUCCEEDED | AC-7 |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Views/Organisms/LSNavigatorMessage.swift (NEW)
- ios/LaneShadow/Views/Organisms/LSInlineErrorCallout.swift (NEW)
- ios/LaneShadowTests/Organisms/LSNavigatorMessageTests.swift (NEW)
- ios/LaneShadowTests/Organisms/LSInlineErrorCalloutTests.swift (NEW)
- ios/LaneShadow/Sandbox/Stories/Organisms/LSNavigatorMessageStory.swift (NEW)
- ios/LaneShadow/Sandbox/Stories/Organisms/LSInlineErrorCalloutStory.swift (NEW)
- ios/LaneShadow/Sandbox/Stories/Organisms/OrganismStories.swift (MODIFY)
- ios/project.yml (MODIFY if needed; then run scripts/ios/generate-project.sh)

writeProhibited:
- ios/LaneShadow.xcodeproj/** — generated only
- ios/LaneShadow/Views/Atoms/** — prior sprints
- ios/LaneShadow/Views/Molecules/** — Sprint 4
- tokens/** — Sprint 01/03
- android/** — wrong platform

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/prds/v2/concepts/uc-org-03-navigator-message-error-callout.html [REQUIRED READING — visual design source]
2. .spec/prds/v2/07-uc-org.md (lines 93-144) — UC-ORG-03 full spec
3. ios/LaneShadow/Views/Atoms/LSGlassPanel.swift [PRIMARY PATTERN] — .callout(accent: .signal|.warning)
4. ios/LaneShadow/Views/Atoms/LSIcon.swift — .compass, .bookmark, .bookmarkFill, .close
5. ios/LaneShadow/Views/Atoms/LSPill.swift — compass chip tint
6. ios/LaneShadow/Views/Molecules/LSRouteAttachmentCard.swift — attachment stack
7. ios/LaneShadow/Views/Molecules/LSSuggestionChip.swift — footer chips
8. tokens/platforms/swift/Sources/LaneShadowTheme/ — motion.recipe.chatOverlayEnter, chatOverlayDismiss

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References: .spec/prds/v2/concepts/uc-org-03-navigator-message-error-callout.html, .spec/prds/v2/07-uc-org.md

Interaction notes:
- REQUIRED READING: .spec/prds/v2/concepts/uc-org-03-navigator-message-error-callout.html before implementing
- NavigatorMessage auto-dismiss implemented as a .task { try? await Task.sleep(for: .milliseconds(motion.recipe.chatOverlayDismiss.durationMs)); onDismiss() } keyed off pinned state — cancel on pinned flip
- Compass chip tint uses color.signal.default at 22% opacity inside LSPill(size: .sm) — not a new pill variant
- Attachment stack: LazyVStack with spacing.2 between LSRouteAttachmentCard instances
- InlineErrorCallout suggestion footer uses HStack with spacing.2 between LSSuggestionChip instances; wrap to second row if overflow via FlowLayout or ViewThatFits

Pattern: Accent-variant LSGlassPanel wrapper with header row + body + footer slot
Pattern source: ios/LaneShadow/Views/Atoms/LSGlassPanel.swift
Anti-pattern: Do not re-implement pin/close buttons as raw Buttons — wire LSIcon inside Button with accessibility label. Do not hardcode 5000ms — always reference motion.recipe.chatOverlayDismiss.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

RED → GREEN → REFACTOR per AC.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1 (No raw primitives): grep banned pattern list against both sources = 0
Gate 2 (swiftformat): swiftformat --lint exit 0
Gate 3 (build): xcodebuild build BUILD SUCCEEDED
Gate 4 (tests): xcodebuild test TEST SUCCEEDED for both test classes
Gate 5 (stories registered): OrganismStories.all contains organisms.navigatormessage.* and organisms.inlineerrorcallout.* ids

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: UC-MOL-05-ios, UC-MOL-08-ios, ALIGN-03-ios
Blocks:     UC-SCR-03-ios, UC-SCR-05-ios
Parallel:   UC-ORG-03-android, UC-ORG-04-ios, UC-ORG-05-ios

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "Signal callout with compass+label+serif body", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSNavigatorMessageTests/test_renders_signal_callout_with_compass_label_body" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "Three LSRouteAttachmentCard stack first selected", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSNavigatorMessageTests/test_three_attachments_first_selected" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "Unpinned auto-dismiss via motion.recipe.chatOverlayDismiss; pinned persists", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSNavigatorMessageTests/test_unpinned_auto_dismisses_pinned_persists" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "Pin/dismiss handlers fire exactly once", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSNavigatorMessageTests/test_pin_and_dismiss_handlers_fire_once" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "Warning callout with compass/title/body/detail/suggestions", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSInlineErrorCalloutTests/test_renders_warning_callout_with_body_detail_suggestions" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "Suggestion tap fires once with tapped chip", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSInlineErrorCalloutTests/test_suggestion_tap_fires_once_with_chip" },
    { "id": "AC-7", "type": "acceptance_criterion", "description": "All variant stories registered", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSNavigatorMessageTests/test_navigator_and_error_stories_registered" },
    { "id": "AC-8", "type": "acceptance_criterion", "description": "No banned primitives", "verify": "grep -n 'Font.system\\|Color(red:\\|Color(hex:\\|\\.monospaced()' ios/LaneShadow/Views/Organisms/LSNavigatorMessage.swift ios/LaneShadow/Views/Organisms/LSInlineErrorCallout.swift | wc -l | xargs test 0 -eq" },
    { "id": "TC-1", "type": "test_criterion", "maps_to_ac": "AC-1", "description": "test_renders_signal_callout_with_compass_label_body passes", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSNavigatorMessageTests/test_renders_signal_callout_with_compass_label_body" },
    { "id": "TC-2", "type": "test_criterion", "maps_to_ac": "AC-2", "description": "test_three_attachments_first_selected passes", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSNavigatorMessageTests/test_three_attachments_first_selected" },
    { "id": "TC-3", "type": "test_criterion", "maps_to_ac": "AC-3", "description": "test_unpinned_auto_dismisses_pinned_persists passes", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSNavigatorMessageTests/test_unpinned_auto_dismisses_pinned_persists" },
    { "id": "TC-4", "type": "test_criterion", "maps_to_ac": "AC-4", "description": "test_pin_and_dismiss_handlers_fire_once passes", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSNavigatorMessageTests/test_pin_and_dismiss_handlers_fire_once" },
    { "id": "TC-5", "type": "test_criterion", "maps_to_ac": "AC-5", "description": "test_renders_warning_callout_with_body_detail_suggestions passes", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSInlineErrorCalloutTests/test_renders_warning_callout_with_body_detail_suggestions" },
    { "id": "TC-6", "type": "test_criterion", "maps_to_ac": "AC-6", "description": "test_suggestion_tap_fires_once_with_chip passes", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSInlineErrorCalloutTests/test_suggestion_tap_fires_once_with_chip" },
    { "id": "TC-7", "type": "test_criterion", "maps_to_ac": "AC-7", "description": "test_navigator_and_error_stories_registered passes", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSNavigatorMessageTests/test_navigator_and_error_stories_registered" },
    { "id": "TC-8", "type": "test_criterion", "maps_to_ac": "AC-8", "description": "No banned primitives in either file", "verify": "grep -n 'Font.system\\|Color(red:\\|Color(hex:\\|\\.monospaced()' ios/LaneShadow/Views/Organisms/LSNavigatorMessage.swift ios/LaneShadow/Views/Organisms/LSInlineErrorCallout.swift | wc -l | xargs test 0 -eq" },
    { "id": "TC-9", "type": "test_criterion", "maps_to_ac": "AC-8", "description": "swiftformat --lint exits 0", "verify": "swiftformat --lint ios/LaneShadow/Views/Organisms/LSNavigatorMessage.swift ios/LaneShadow/Views/Organisms/LSInlineErrorCallout.swift" },
    { "id": "TC-10", "type": "test_criterion", "maps_to_ac": "AC-7", "description": "BUILD SUCCEEDED", "verify": "cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' 2>&1 | grep 'BUILD SUCCEEDED'" }
  ]
}
-->
