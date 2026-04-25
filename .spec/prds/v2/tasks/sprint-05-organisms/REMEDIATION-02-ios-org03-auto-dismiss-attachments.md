<!-- Template Version: 5.1.0 | Sprint: sprint-05-organisms | Type: FEATURE/TDD -->

================================================================================
TASK: REMEDIATION-02 — UC-ORG-03 iOS: Auto-dismiss + attachment composition
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     S
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer
ESTIMATE:   90 min
SPRINT:     [SPRINT.md](./SPRINT.md)
PRD_REFS:   07-uc-org.md (UC-ORG-03)

RUNTIME_COMMANDS:
  test:      cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSNavigatorMessageTests
  typecheck: cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  lint:      swiftformat --lint ios/LaneShadow/

PROGRESS: 0/3 ACs complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

LSNavigatorMessage auto-dismisses unpinned messages after 5000ms via Task.sleep + onDismiss, and composes LSRouteAttachmentCard molecules for attachment rendering with first-selected state. Tests verify timing behavior and attachment composition.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST implement auto-dismiss using `.task { try? await Task.sleep(nanoseconds: 5_000_000_000); if !pinned { onDismiss() } }` — no DispatchQueue.main.asyncAfter.
- MUST add `attachments: [RouteAttachment]` parameter with `LSRouteAttachmentCard` composition. First attachment is selected by default.
- MUST update existing tests that currently admit "deferred" — remove all "deferred" test comments.
- MUST keep the organism data-agnostic — attachment data comes from props, not Convex.
- NEVER use DispatchQueue for timing — SwiftUI `.task` modifier is the correct pattern.
- NEVER modify atoms or molecules from prior sprints.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AC-1: Unpinned LSNavigatorMessage auto-dismisses after 5000ms; pinned persists (PRIMARY)
- [ ] AC-2: Attachments render as LSRouteAttachmentCard stack with first selected
- [ ] AC-3: Existing tests updated to verify behavior (no "deferred" comments remain)

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: Auto-dismiss behavior [PRIMARY]
  GIVEN: LSNavigatorMessage rendered with pinned=false
  WHEN:  5000ms elapses (via Task.sleep in .task modifier)
  THEN:  onDismiss fires exactly once; pinned variant does NOT fire onDismiss after timeout
  VERIFY: cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSNavigatorMessageTests/test_autoDismiss_firesAfterTimeout 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Organisms/LSNavigatorMessageTests.swift
  TEST_FUNCTION: test_autoDismiss_firesAfterTimeout

AC-2: Attachment composition
  GIVEN: LSNavigatorMessage rendered with 3 attachments
  WHEN:  view body resolves
  THEN:  3 LSRouteAttachmentCard views render; first has selected state; second and third are unselected
  VERIFY: cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSNavigatorMessageTests/test_attachments_render_withFirstSelected 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Organisms/LSNavigatorMessageTests.swift
  TEST_FUNCTION: test_attachments_render_withFirstSelected

AC-3: Tests verify behavior (no deferred comments)
  GIVEN: LSNavigatorMessageTests.swift source
  WHEN:  inspected
  THEN:  no occurrences of "deferred", "not supported", "placeholder" in test assertions; all tests verify actual behavior
  VERIFY: grep -c 'deferred\|not supported\|placeholder' ios/LaneShadowTests/Organisms/LSNavigatorMessageTests.swift | xargs test 0 -eq

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Views/Organisms/LSNavigatorMessage.swift (MODIFY — add auto-dismiss + attachments)
- ios/LaneShadowTests/Organisms/LSNavigatorMessageTests.swift (MODIFY — update deferred tests)

writeProhibited:
- ios/LaneShadow/Views/Molecules/** — LSRouteAttachmentCard is a molecule from Sprint 4
- ios/LaneShadow/Views/Atoms/** — atoms owned by prior sprints
- ios/LaneShadow/Views/Organisms/LSInlineErrorCallout.swift — not this task
- android/** — wrong platform
- tokens/** — not this task

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. ios/LaneShadow/Views/Organisms/LSNavigatorMessage.swift [PRIMARY PATTERN]
   - Focus: current implementation; identify where to add .task modifier and attachments parameter

2. ios/LaneShadowTests/Organisms/LSNavigatorMessageTests.swift
   - Focus: existing test structure; identify "deferred" tests to update

3. ios/LaneShadow/Views/Molecules/LSRouteAttachmentCard.swift (if exists)
   - Focus: attachment card API for composition

4. .spec/prds/v2/07-uc-org.md (UC-ORG-03, lines for NavigatorMessage)
   - Focus: auto-dismiss spec (5000ms), attachment rendering spec

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: Build succeeds
  Command: cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' 2>&1 | grep 'BUILD SUCCEEDED'
  Expected: BUILD SUCCEEDED

Gate 2: Tests pass
  Command: cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSNavigatorMessageTests
  Expected: TEST SUCCEEDED

Gate 3: No deferred comments
  Command: grep -c 'deferred\|not supported\|placeholder' ios/LaneShadowTests/Organisms/LSNavigatorMessageTests.swift
  Expected: 0

Gate 4: swiftformat clean
  Command: swiftformat --lint ios/LaneShadow/Views/Organisms/LSNavigatorMessage.swift
  Expected: exit 0

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: UC-ORG-03-ios (source exists, features incomplete)
Blocks:     Sprint 5 human testing gate
Parallel:   REMEDIATION-01 (Android ORG-03), REMEDIATION-03 (MapLayer iOS)

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "Unpinned auto-dismisses after 5000ms; pinned persists", "verify": "xcodebuild test LSNavigatorMessageTests/test_autoDismiss_firesAfterTimeout" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "Attachments render as LSRouteAttachmentCard stack with first selected", "verify": "xcodebuild test LSNavigatorMessageTests/test_attachments_render_withFirstSelected" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "No deferred/placeholder comments in test file", "verify": "grep -c deferred|not\\ supported|placeholder = 0" }
  ]
}
-->
