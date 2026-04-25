<!-- Template Version: 5.1.0 | Sprint: sprint-05-organisms | Type: FEATURE/TDD -->

================================================================================
TASK: UC-ORG-03-android — LSNavigatorMessage + LSInlineErrorCallout — Android Compose
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P1
EFFORT:     M
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer
ESTIMATE:   240 min
SPRINT:     [SPRINT.md](./SPRINT.md)
PRD_REFS:   07-uc-org.md (UC-ORG-03)

RUNTIME_COMMANDS:
  test:      cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSNavigatorMessageTest' --tests 'com.laneshadow.ui.organisms.LSInlineErrorCalloutTest'
  typecheck: cd android && ./gradlew :app:compileDebugKotlin
  lint:      cd android && ./gradlew detekt

PROGRESS: 0/7 ACs complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

LSNavigatorMessage (signal-stripe LSGlassPanel callout with compass chip + THE NAVIGATOR label + opinion-serif body + LSRouteAttachmentCard list with first selected + pin/close actions + 5000ms auto-dismiss via motion.recipe.chatOverlayDismiss when unpinned) and LSInlineErrorCallout (warning-stripe LSGlassPanel callout with compass chip + title + body + optional detail + LSSuggestionChip footer) render in the Android sandbox; pin/dismiss/suggestion-tap callbacks fire exactly once each; 11 stories registered (6 NavigatorMessage + 5 InlineErrorCallout).

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST use LSGlassPanel(GlassVariant.Callout(accent=CalloutAccent.Signal)) for NavigatorMessage and CalloutAccent.Warning for InlineErrorCallout.
- MUST use LSRouteAttachmentCard (UC-MOL-08) for attachment list with first card selected=true; spacing.2 between rows.
- MUST drive auto-dismiss via LaneShadowTheme.motion.recipe.chatOverlayDismiss with 5000ms visible (LaunchedEffect+delay using token-defined timing).
- MUST drive enter via LaneShadowTheme.motion.recipe.chatOverlayEnter (no inline tween).
- MUST register stories: NavigatorMessage (Message Only, With One Attachment, With Three Attachments, Pinned, Long Body, Dark Mode); InlineErrorCallout (Error Only, With Detail, With Suggestions, Long Body+Long Suggestions, Dark Mode).
- NEVER inline Color(0x...), TextStyle(, FontFamily(, or tween( literals.
- NEVER auto-dismiss when pinned == true — pin must cancel the dismiss timer.
- NEVER reach to network/Convex; all data is prop-driven.
- STRICTLY detekt 0; compileDebugKotlin BUILD SUCCESSFUL; grep gate Color(0x/TextStyle(/FontFamily(/tween( == 0 across both files.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AC-1: LSNavigatorMessage signal-stripe with compass chip, label, opinion body, attachment list (first selected) (PRIMARY)
- [ ] AC-2: Unpinned NavigatorMessage auto-dismisses at 5000ms via chatOverlayDismiss
- [ ] AC-3: Pin tap fires onPin once; close tap fires onDismiss once; pinned state cancels auto-dismiss
- [ ] AC-4: LSInlineErrorCallout warning-stripe with compass chip, title, body, optional detail, suggestion chips
- [ ] AC-5: Suggestion chip tap invokes onSuggestionTap with tapped chip exactly once
- [ ] AC-6: 6 NavigatorMessage stories + 5 InlineErrorCallout stories registered
- [ ] AC-7: Both organisms compose only from atoms+molecules (grep gate clean)

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: NavigatorMessage signal callout composition [PRIMARY]
  GIVEN: Developer composes LSNavigatorMessage(body="Take 280 south to 92...", attachments=listOf(best, alt1, alt2), pinned=true)
  WHEN:  Composable enters composition
  THEN:  LSGlassPanel(Callout(Signal)) container; header row LSPill(size=Sm, bg=signal@22%) holding LSIcon(Compass, color=signal) + LSText("THE NAVIGATOR", typography.ui.label.sm, color=signal); body LSText(typography.opinion.md); 3 LSRouteAttachmentCards stacked with spacing.2, first card selected=true; trailing LSIcon(BookmarkFill) (pinned) and LSIcon(Close)
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSNavigatorMessageTest.renders_signal_callout_with_compass_label_body_and_attachments' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/organisms/LSNavigatorMessageTest.kt
  TEST_FUNCTION: renders_signal_callout_with_compass_label_body_and_attachments

AC-2: Unpinned auto-dismiss at 5000ms via chatOverlayDismiss
  GIVEN: LSNavigatorMessage(body="...", pinned=false, onDismiss=mockOnDismiss)
  WHEN:  Test advances virtual time by 5000ms
  THEN:  onDismiss invocation count == 1; exit animation references chatOverlayDismiss motion spec; AnimatedVisibility visible toggles to false
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSNavigatorMessageTest.unpinned_auto_dismisses_at_5000ms_via_chat_overlay_dismiss' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/organisms/LSNavigatorMessageTest.kt
  TEST_FUNCTION: unpinned_auto_dismisses_at_5000ms_via_chat_overlay_dismiss

AC-3: Pin cancels auto-dismiss; close fires once
  GIVEN: LSNavigatorMessage with onPin and onDismiss mocks; pinned=false initially
  WHEN:  Test taps pin (sets pinned=true), advances time 5000ms, then taps close
  THEN:  onPin invocation count == 1 after pin tap; onDismiss invocation count == 0 after time advances (pinned cancels timer); onDismiss invocation count == 1 after explicit close tap
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSNavigatorMessageTest.pin_cancels_auto_dismiss_close_fires_once' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/organisms/LSNavigatorMessageTest.kt
  TEST_FUNCTION: pin_cancels_auto_dismiss_close_fires_once

AC-4: InlineErrorCallout warning composition
  GIVEN: LSInlineErrorCallout(body="Couldn't stitch that one together — the segment through Lucia looked broken.", detail="Try a different end point...", suggestions=listOf(SuggestionChip("Try inland"), SuggestionChip("End at Big Sur")), onSuggestionTap={})
  WHEN:  Composable enters composition
  THEN:  LSGlassPanel(Callout(Warning)) container; compass chip + LSText("THE NAVIGATOR", typography.ui.label.sm); body typography.opinion.md; detail typography.ui.body.sm + content.textMuted; horizontal Row of 2 LSSuggestionChip molecules
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSInlineErrorCalloutTest.renders_warn_callout_with_body_detail_and_suggestions' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/organisms/LSInlineErrorCalloutTest.kt
  TEST_FUNCTION: renders_warn_callout_with_body_detail_and_suggestions

AC-5: Suggestion tap fires once with chip
  GIVEN: LSInlineErrorCallout with onSuggestionTap=mock and 2 suggestions
  WHEN:  Test taps the second suggestion chip
  THEN:  onSuggestionTap invocation count == 1; the SuggestionChip argument equals the second chip; first chip not invoked
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSInlineErrorCalloutTest.suggestion_tap_fires_callback_exactly_once_with_tapped_chip' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/organisms/LSInlineErrorCalloutTest.kt
  TEST_FUNCTION: suggestion_tap_fires_callback_exactly_once_with_tapped_chip

AC-6: 11 stories registered across both organisms
  GIVEN: Developer opens debug sandbox app
  WHEN:  Navigating to Organisms / NavigatorMessage and Organisms / InlineErrorCallout
  THEN:  NavigatorMessage stories Message Only, With One Attachment, With Three Attachments, Pinned (no auto-dismiss), Long Body, Dark Mode; InlineErrorCallout stories Error Only, With Detail, With Suggestions, Long Body + Long Suggestions, Dark Mode — 11 total with dotted ids organisms.navigatormessage.* / organisms.inlineerror.*
  VERIFY: grep -c 'organisms.navigatormessage\|organisms.inlineerror' android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/LSNavigatorMessageStory.kt android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/LSInlineErrorCalloutStory.kt | awk -F: '{s+=$2} END {exit !(s>=11)}'
  TDD_STATE: none
  TEST_FILE: android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/LSNavigatorMessageStory.kt
  TEST_FUNCTION: (grep gate)

AC-7: No banned primitives in either source
  GIVEN: Both source files
  WHEN:  grep gate runs
  THEN:  No Color(0x, TextStyle(, FontFamily(, tween( in either; LSNavigatorMessage.kt + LSInlineErrorCallout.kt compose only via LSGlassPanel/LSPill/LSIcon/LSText/LSRouteAttachmentCard/LSSuggestionChip
  VERIFY: grep -rn 'Color(0x\|TextStyle(\|FontFamily(\|tween(' android/app/src/main/java/com/laneshadow/ui/organisms/LSNavigatorMessage.kt android/app/src/main/java/com/laneshadow/ui/organisms/LSInlineErrorCallout.kt | wc -l | xargs test 0 -eq
  TDD_STATE: none
  TEST_FILE: (grep gate)
  TEST_FUNCTION: (grep gate)

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID | Statement | Maps to AC |
|----|-----------|------------|
| TC-1 | Signal-accent glass panel + compass chip + THE NAVIGATOR label + 3 attachments (first selected) all present | AC-1 |
| TC-2 | After 5000ms virtual time AnimatedVisibility visible=false and onDismiss called once | AC-2 |
| TC-3 | Pin tap toggles pinned and cancels timer; close tap fires onDismiss once | AC-3 |
| TC-4 | Warning-accent glass panel + body + detail + 2 LSSuggestionChip rendered | AC-4 |
| TC-5 | Tapping second chip fires callback with that chip | AC-5 |
| TC-6 | 11 stories total registered across both story files | AC-6 |
| TC-7 | Both source files contain zero hardcoded styling tokens | AC-7 |
| TC-8 | Motion spec key 'chatOverlayDismiss' is referenced (not inline tween) in LSNavigatorMessage.kt | AC-2 |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/ui/organisms/LSNavigatorMessage.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/organisms/LSInlineErrorCallout.kt (NEW)
- android/app/src/test/java/com/laneshadow/ui/organisms/LSNavigatorMessageTest.kt (NEW)
- android/app/src/test/java/com/laneshadow/ui/organisms/LSInlineErrorCalloutTest.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/LSNavigatorMessageStory.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/LSInlineErrorCalloutStory.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/OrganismStories.kt (MODIFY)

writeProhibited:
- android/app/src/main/java/com/laneshadow/ui/atoms/**
- android/app/src/main/java/com/laneshadow/ui/molecules/**
- tokens/**
- ios/**

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/prds/v2/concepts/uc-org-03-navigator-message-error-callout.html [REQUIRED READING]
2. .spec/prds/v2/07-uc-org.md (UC-ORG-03, lines 93-145)
3. android/app/src/main/java/com/laneshadow/ui/atoms/LSGlassPanel.kt
4. android/app/src/main/java/com/laneshadow/ui/atoms/LSPill.kt
5. android/app/src/main/java/com/laneshadow/ui/atoms/LSIcon.kt
6. android/app/src/main/java/com/laneshadow/ui/molecules/LSRouteAttachmentCard.kt
7. android/app/src/main/java/com/laneshadow/ui/molecules/LSSuggestionChip.kt
8. android/app/src/main/java/com/laneshadow/theme/LaneShadowTheme.kt

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References: .spec/prds/v2/concepts/uc-org-03-navigator-message-error-callout.html, .spec/prds/v2/07-uc-org.md (UC-ORG-03)

Interaction notes:
- REQUIRED READING: .spec/prds/v2/concepts/uc-org-03-navigator-message-error-callout.html — extract callout layout, attached card stacking, motion-spec references
- Auto-dismiss uses LaunchedEffect(pinned) { delay(5000); onDismiss() } cancelled by pinned change; never use Handler.postDelayed
- First attachment receives selected=true via LSRouteAttachmentCard prop, no inline highlight

Pattern: Branded glass-callout composition with motion-recipe-driven enter/exit and prop-only state
Pattern source: .spec/prds/v2/concepts/uc-org-03-navigator-message-error-callout.html
Anti-pattern: Inline Column with hardcoded background color and literal tween(300) animation.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

RED → GREEN → REFACTOR per AC.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

1. detekt 0
2. compileDebugKotlin BUILD SUCCESSFUL
3. testDebugUnitTest both test classes green
4. grep gate Color(0x/TextStyle(/FontFamily(/tween( == 0 across both source files
5. story grep ≥ 11 organisms.navigatormessage + organisms.inlineerror

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: UC-MOL-08-android (LSRouteAttachmentCard, shipped), UC-MOL-04 LSSuggestionChip, UC-ATM-* (LSGlassPanel, LSPill, LSIcon)
Blocks:     Sprint 6 RouteResults / ErrorScreen
Parallel:   UC-ORG-03-ios, UC-ORG-02-android, UC-ORG-04-android, UC-ORG-05-android

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "Signal callout with compass+label+serif body+attachments first selected", "verify": "gradle test --tests LSNavigatorMessageTest.renders_signal_callout_with_compass_label_body_and_attachments" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "Unpinned auto-dismiss at 5000ms via chatOverlayDismiss", "verify": "gradle test --tests LSNavigatorMessageTest.unpinned_auto_dismisses_at_5000ms_via_chat_overlay_dismiss" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "Pin cancels timer; close fires once", "verify": "gradle test --tests LSNavigatorMessageTest.pin_cancels_auto_dismiss_close_fires_once" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "Warning callout with body/detail/suggestions", "verify": "gradle test --tests LSInlineErrorCalloutTest.renders_warn_callout_with_body_detail_and_suggestions" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "Suggestion tap fires once with chip", "verify": "gradle test --tests LSInlineErrorCalloutTest.suggestion_tap_fires_callback_exactly_once_with_tapped_chip" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "11 stories registered across both organisms", "verify": "grep -c 'organisms.navigatormessage\\|organisms.inlineerror' LSNavigatorMessageStory.kt LSInlineErrorCalloutStory.kt | awk -F: '{s+=$2} END {exit !(s>=11)}'" },
    { "id": "AC-7", "type": "acceptance_criterion", "description": "No banned primitives in either source file", "verify": "grep -rn 'Color(0x\\|TextStyle(\\|FontFamily(\\|tween(' android/app/src/main/java/com/laneshadow/ui/organisms/LSNavigatorMessage.kt android/app/src/main/java/com/laneshadow/ui/organisms/LSInlineErrorCallout.kt | wc -l | xargs test 0 -eq" },
    { "id": "TC-1", "type": "test_criterion", "maps_to_ac": "AC-1", "description": "Signal-accent glass panel + compass + label + 3 attachments first selected", "verify": "compose test" },
    { "id": "TC-2", "type": "test_criterion", "maps_to_ac": "AC-2", "description": "After 5000ms virtual time onDismiss called once", "verify": "compose test mainClock.advanceTimeBy" },
    { "id": "TC-3", "type": "test_criterion", "maps_to_ac": "AC-3", "description": "Pin cancels timer + close fires once", "verify": "compose test" },
    { "id": "TC-4", "type": "test_criterion", "maps_to_ac": "AC-4", "description": "Warning glass panel + body + detail + 2 chips", "verify": "compose test" },
    { "id": "TC-5", "type": "test_criterion", "maps_to_ac": "AC-5", "description": "Tap second chip fires callback with that chip", "verify": "compose test" },
    { "id": "TC-6", "type": "test_criterion", "maps_to_ac": "AC-6", "description": "11 stories total across both story files", "verify": "grep gate" },
    { "id": "TC-7", "type": "test_criterion", "maps_to_ac": "AC-7", "description": "Zero hardcoded styling tokens in both source files", "verify": "grep gate" },
    { "id": "TC-8", "type": "test_criterion", "maps_to_ac": "AC-2", "description": "motion.recipe.chatOverlayDismiss referenced by name in LSNavigatorMessage.kt", "verify": "grep -n 'motion.recipe.chatOverlayDismiss' android/app/src/main/java/com/laneshadow/ui/organisms/LSNavigatorMessage.kt | wc -l | awk '$1 >= 1'" }
  ]
}
-->
