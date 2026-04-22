<!-- Task Template v5.1 | FEATURE -->

================================================================================
TASK: UC-ATM-08-ios — PhaseDot atom (`LSPhaseDot`) — iOS SwiftUI
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     S
SPRINT:     [sprint-02-atoms-foundation-primitives](./SPRINT.md)
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer
ESTIMATE:   90 min

RUNTIME_COMMANDS:
  test:      cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSPhaseDotTests
  typecheck: cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES COMPILER_INDEX_STORE_ENABLE=NO SWIFT_COMPILATION_MODE=incremental build
  lint:      swiftformat --lint ios/LaneShadow/

PRD_REFS:   UC-ATM-08, .spec/prds/v2/05-uc-atm.md, .spec/prds/v2/concepts/uc-atm-08-phasedot.html
DEPENDS_ON: UC-TOK-02, UC-TOK-04 (motion recipes), UC-TOK-05, UC-SBX-00-ios
BLOCKS:     UC-MOL-* (phase indicators), UC-ORG-*, UC-SCR-*

PROGRESS: AC-1 none · 0/6 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

`LSPhaseDot(state: .pending | .active | .done)` renders a 10pt phase indicator dot on iOS SwiftUI.

- `.pending` — hollow, `color.border.strong` 1pt border, no fill.
- `.active` — filled `color.signal.default`, with an animating concentric ring pulse referencing `motion.recipe.phaseDotPulse` (900ms ease-in-out loop, scale 0→1.5×, opacity 0.4→0).
- `.done` — filled `color.status.success.default`, no animation.

The animation MUST reference the motion recipe by name — never hardcode `.duration(0.9)` or `.easeInOut`.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)
--------------------------------------------------------------------------------

- NEVER hardcode the 900ms duration or easing curve — always go through `motion.recipe.phaseDotPulse` from UC-TOK-04.
- NEVER hardcode the 10pt dot size — resolve `sizing.phaseDot` (or equivalent token from UC-TOK-02).
- NEVER use literal `Color.green`, `Color.gray` — only token paths (`color.signal.default`, `color.status.success.default`, `color.border.strong`).
- NEVER use SF Symbols.
- MUST modify only files listed in SCOPE.writeAllowed.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] `LSPhaseDot` exists at `ios/LaneShadow/Views/Atoms/LSPhaseDot.swift` accepting `state: PhaseState` — maps to AC-1
- [ ] `.pending` renders hollow with `color.border.strong` 1pt border — maps to AC-1
- [ ] `.active` renders filled `color.signal.default` + ring pulse animation — maps to AC-2
- [ ] `.done` renders filled `color.status.success.default`, no animation — maps to AC-3
- [ ] All 3 stories registered (`atoms.phaseDot.{pending,active,done}`) — maps to AC-4
- [ ] Animation references `motion.recipe.phaseDotPulse` — no literal duration/easing — maps to AC-5
- [ ] No literal Color/duration/size in source — maps to AC-6
- [ ] iOS typecheck/build green; XCTest green; swiftformat clean
- [ ] Only SCOPE.writeAllowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads — ordered happy-path first)
--------------------------------------------------------------------------------

AC-1: LSPhaseDot .pending renders hollow with token border [PRIMARY]
  GIVEN: An iOS SwiftUI view importing LaneShadowTheme
  WHEN:  Developer renders `LSPhaseDot(state: .pending)`
  THEN:  Fill is clear, stroke == `color.border.strong` at 1pt, frame == `sizing.phaseDot` (10pt)
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Atoms/LSPhaseDotTests.swift
  TEST_FUNCTION: test_pending_renders_hollow_token_border
  VERIFY:        cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSPhaseDotTests/test_pending_renders_hollow_token_border

AC-2: LSPhaseDot .active renders filled signal color + ring pulse animation
  GIVEN: An iOS SwiftUI view
  WHEN:  Developer renders `LSPhaseDot(state: .active)`
  THEN:  Fill == `color.signal.default`, concentric ring layer is present and animating via `motion.recipe.phaseDotPulse`
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Atoms/LSPhaseDotTests.swift
  TEST_FUNCTION: test_active_renders_filled_signal_with_pulse
  VERIFY:        cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSPhaseDotTests/test_active_renders_filled_signal_with_pulse

AC-3: LSPhaseDot .done renders filled success color, no animation (edge)
  GIVEN: An iOS SwiftUI view
  WHEN:  Developer renders `LSPhaseDot(state: .done)`
  THEN:  Fill == `color.status.success.default`, no ring layer / no animation modifier present
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Atoms/LSPhaseDotTests.swift
  TEST_FUNCTION: test_done_renders_filled_success_no_animation
  VERIFY:        cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSPhaseDotTests/test_done_renders_filled_success_no_animation

AC-4: Three stories registered (pending / active / done)
  GIVEN: `ios/LaneShadow/Sandbox/Stories/LSPhaseDotStories.swift`
  WHEN:  AtomStories.all is composed
  THEN:  Story ids `atoms.phaseDot.pending`, `atoms.phaseDot.active`, `atoms.phaseDot.done` exist, tier = `.atom`
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadow/Sandbox/Stories/LSPhaseDotStories.swift
  TEST_FUNCTION: n/a (grep gate)
  VERIFY:        for id in atoms.phaseDot.pending atoms.phaseDot.active atoms.phaseDot.done; do grep -q "$id" ios/LaneShadow/Sandbox/Stories/LSPhaseDotStories.swift || exit 1; done && grep -q 'LSPhaseDotStories' ios/LaneShadow/Sandbox/LaneShadowStories.swift

AC-5: Animation references motion.recipe.phaseDotPulse — no literal duration (error gate)
  GIVEN: ios/LaneShadow/Views/Atoms/LSPhaseDot.swift
  WHEN:  Reviewer greps
  THEN:  Source contains `motion.recipe.phaseDotPulse` AND zero matches for literal `0.9` or `duration: 0.9` or `.easeInOut(duration:`
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadow/Views/Atoms/LSPhaseDot.swift
  TEST_FUNCTION: n/a (grep gate)
  VERIFY:        grep -q 'motion\.recipe\.phaseDotPulse' ios/LaneShadow/Views/Atoms/LSPhaseDot.swift && ! grep -REn '0\.9[^0-9]|duration: 0\.|\.easeInOut\(duration:' ios/LaneShadow/Views/Atoms/LSPhaseDot.swift

AC-6: No literal Color/size in LSPhaseDot.swift (error gate — boundary)
  GIVEN: ios/LaneShadow/Views/Atoms/LSPhaseDot.swift
  WHEN:  Reviewer greps
  THEN:  Zero matches for `Color\\.(red|green|blue|black|white|gray|orange|yellow|purple|pink)` or `frame(width: 10` or `frame(width: [0-9]`
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadow/Views/Atoms/LSPhaseDot.swift
  TEST_FUNCTION: n/a (grep gate)
  VERIFY:        ! grep -REn 'Color\.(red|green|blue|black|white|gray|orange|yellow|purple|pink)|frame\(width: [0-9]' ios/LaneShadow/Views/Atoms/LSPhaseDot.swift

--------------------------------------------------------------------------------
TEST CRITERIA (boolean — each maps to one AC)
--------------------------------------------------------------------------------

| ID  | Statement | Maps to | Verify |
|-----|-----------|---------|--------|
| TC-1 | .pending hollow + color.border.strong 1pt + sizing.phaseDot frame | AC-1 | xcodebuild test …test_pending_renders_hollow_token_border |
| TC-2 | .active fill=color.signal.default + ring pulse animating | AC-2 | xcodebuild test …test_active_renders_filled_signal_with_pulse |
| TC-3 | .done fill=color.status.success.default + no animation | AC-3 | xcodebuild test …test_done_renders_filled_success_no_animation |
| TC-4 | 3 story ids registered + aggregator wired | AC-4 | grep gate above |
| TC-5 | Source references motion.recipe.phaseDotPulse + zero literal duration | AC-5 | grep gate above |
| TC-6 | Zero literal Color or frame size in LSPhaseDot.swift | AC-6 | grep gate above |

--------------------------------------------------------------------------------
SCOPE (file-level write permissions)
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Views/Atoms/LSPhaseDot.swift (NEW)
- ios/LaneShadow/Views/Atoms/PhaseState.swift (NEW — typed state enum)
- ios/LaneShadow/Sandbox/Stories/LSPhaseDotStories.swift (NEW)
- ios/LaneShadow/Sandbox/LaneShadowStories.swift (MODIFY — register LSPhaseDotStories.all)
- ios/LaneShadowTests/Atoms/LSPhaseDotTests.swift (NEW)

writeProhibited:
- ~/Projects/native-theme/**
- ~/Projects/native-sandbox/**
- tokens/platforms/swift/Sources/LaneShadowTheme/Generated/**
- android/**
- ios/LaneShadow.xcodeproj/**
- Anything not explicitly listed above

--------------------------------------------------------------------------------
BOUNDARIES (✅ Always / ⚠️ Ask First)
--------------------------------------------------------------------------------

✅ Always:
- Resolve all colors via theme accessors (`color.signal.default`, `color.status.success.default`, `color.border.strong`).
- Reference motion recipes by name — never inline durations or easing curves.
- Stories tier = `.atom`; ids `atoms.phaseDot.{state}`.

⚠️ Ask First:
- Adding a new state beyond pending/active/done.
- Replacing the ring-pulse motif with a different animation (must originate in UC-TOK-04).

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- ios/LaneShadow/Views/Atoms/LSPhaseDot.swift (NEW): the phase-dot atom
- ios/LaneShadow/Views/Atoms/PhaseState.swift (NEW): state enum
- ios/LaneShadow/Sandbox/Stories/LSPhaseDotStories.swift (NEW): 3 stories
- ios/LaneShadow/Sandbox/LaneShadowStories.swift (MODIFY): include `LSPhaseDotStories.all`
- ios/LaneShadowTests/Atoms/LSPhaseDotTests.swift (NEW): 3 behavior tests

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

For each AC: RED → GREEN → REFACTOR. Show actual test failure output in RED phase. Never write implementation in RED. Never expand beyond current AC in GREEN.

After all 6 ACs: dispatch swift-reviewer.

--------------------------------------------------------------------------------
READING LIST (max 5 files — canonical pattern first)
--------------------------------------------------------------------------------

1. .spec/prds/v2/concepts/uc-atm-08-phasedot.html [PRIMARY PATTERN]
   - Lines: all
   - Focus: REQUIRED READING — visual design + ring-pulse motif
2. .spec/prds/v2/05-uc-atm.md
   - Lines: 170-200
   - Focus: UC-ATM-08 canonical AC bullets
3. .spec/prds/v2/tasks/sprint-01-foundation-tokens-and-v2-reset/UC-TOK-04-motion-recipes-tokens.md
   - Lines: all
   - Focus: motion.recipe.phaseDotPulse contract this atom consumes
4. tokens/platforms/swift/Sources/LaneShadowTheme/Theme.swift
   - Lines: all
   - Focus: motion.recipe.*, color.signal/status.success/border.strong, sizing.phaseDot accessors
5. ~/Projects/native-sandbox/RULES.md
   - Sections: §6 (Story contract)
   - Focus: ComponentTier.atom, story id format

--------------------------------------------------------------------------------
EVIDENCE GATES (fast/cheap first)
--------------------------------------------------------------------------------

Gate 1: RED phase evidence per behavioral AC.
Gate 2: Tests assert token-resolved colors, not literals.
Gate 3: All XCTest pass.
Gate 4: Swift build green.
Gate 5: swiftformat clean.
Gate 6: Source references `motion.recipe.phaseDotPulse` (grep).
Gate 7: Zero literal duration / Color / frame size (grep).
Gate 8: 3 story ids registered.
Gate 9: Scope compliance — `git diff --name-only` ⊆ writeAllowed.

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- Multi-dot sequences / connectors (handled by future molecule UC-MOL-phaseTrack).
- Tap/press behavior (PhaseDot is display-only).
- Android Compose pair (UC-ATM-08-android — parallel kotlin-implementer).

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** UC-TOK-04 generates `motion.recipe.phaseDotPulse` (900ms ease-in-out loop, scale 0→1.5×, opacity 0.4→0). UC-TOK-02/03 expose `sizing.phaseDot`, `color.signal.default`, `color.status.success.default`, `color.border.strong`. iOS has no phase indicator atom.

**Gap:** Without `LSPhaseDot`, downstream phase trackers would inline circles + animation timing, breaking UC-TOK-04's motion contract.

--------------------------------------------------------------------------------
REVIEW (for swift-reviewer)
--------------------------------------------------------------------------------

Must pass (≤5):
- One test per behavioral AC; tests verify token-resolved colors and animation reference.
- RED evidence in TDD_STATE history.
- Animation references `motion.recipe.phaseDotPulse` — zero literal `0.9` or `.easeInOut(duration:`.
- Zero literal Color or frame size in source.
- 3 story ids registered + aggregator wired.

Should verify (≤5):
- `.done` does NOT attach the ring layer (asserts no animation modifier present).
- `.pending` border is exactly 1pt.
- API ergonomics — `PhaseState` enum is closed and exhaustive.
- Test naming follows `test_{condition}_{expected}`.
- SCOPE respected.

Verdict: APPROVED | NEEDS_FIXES

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: UC-TOK-02 (sizing), UC-TOK-04 (motion recipes), UC-TOK-05 (generated theme), UC-SBX-00-ios (sandbox runtime)
Blocks:     UC-MOL-* (phase indicators), UC-ORG-*, UC-SCR-*
Parallel:   UC-ATM-08-android

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN iOS view WHEN LSPhaseDot(.pending) rendered THEN hollow, stroke=color.border.strong 1pt, frame=sizing.phaseDot", "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSPhaseDotTests/test_pending_renders_hollow_token_border" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN view WHEN LSPhaseDot(.active) rendered THEN fill=color.signal.default + concentric ring animating via motion.recipe.phaseDotPulse", "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSPhaseDotTests/test_active_renders_filled_signal_with_pulse" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN view WHEN LSPhaseDot(.done) rendered THEN fill=color.status.success.default, no ring, no animation", "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSPhaseDotTests/test_done_renders_filled_success_no_animation" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN LSPhaseDotStories.swift WHEN composed THEN 3 story ids registered", "verify": "for id in atoms.phaseDot.pending atoms.phaseDot.active atoms.phaseDot.done; do grep -q \"$id\" ios/LaneShadow/Sandbox/Stories/LSPhaseDotStories.swift || exit 1; done" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN LSPhaseDot.swift WHEN grep'd THEN references motion.recipe.phaseDotPulse, zero literal duration", "verify": "grep -q 'motion\\.recipe\\.phaseDotPulse' ios/LaneShadow/Views/Atoms/LSPhaseDot.swift && ! grep -REn '0\\.9[^0-9]|duration: 0\\.|\\.easeInOut\\(duration:' ios/LaneShadow/Views/Atoms/LSPhaseDot.swift" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN LSPhaseDot.swift WHEN grep'd THEN zero literal Color or frame size", "verify": "! grep -REn 'Color\\.(red|green|blue|black|white|gray|orange|yellow|purple|pink)|frame\\(width: [0-9]' ios/LaneShadow/Views/Atoms/LSPhaseDot.swift" },
    { "id": "TC-1", "type": "test_criterion", "description": ".pending hollow + token border", "maps_to_ac": "AC-1", "verify": "cd ios && xcodebuild test -only-testing:LaneShadowTests/Atoms/LSPhaseDotTests/test_pending_renders_hollow_token_border" },
    { "id": "TC-2", "type": "test_criterion", "description": ".active filled + ring pulse", "maps_to_ac": "AC-2", "verify": "cd ios && xcodebuild test -only-testing:LaneShadowTests/Atoms/LSPhaseDotTests/test_active_renders_filled_signal_with_pulse" },
    { "id": "TC-3", "type": "test_criterion", "description": ".done filled + no animation", "maps_to_ac": "AC-3", "verify": "cd ios && xcodebuild test -only-testing:LaneShadowTests/Atoms/LSPhaseDotTests/test_done_renders_filled_success_no_animation" },
    { "id": "TC-4", "type": "test_criterion", "description": "3 stories registered", "maps_to_ac": "AC-4", "verify": "grep -q 'atoms.phaseDot.active' ios/LaneShadow/Sandbox/Stories/LSPhaseDotStories.swift" },
    { "id": "TC-5", "type": "test_criterion", "description": "Animation references token recipe", "maps_to_ac": "AC-5", "verify": "grep -q 'motion\\.recipe\\.phaseDotPulse' ios/LaneShadow/Views/Atoms/LSPhaseDot.swift" },
    { "id": "TC-6", "type": "test_criterion", "description": "No literal Color or frame size", "maps_to_ac": "AC-6", "verify": "! grep -REn 'Color\\.(red|green|blue)' ios/LaneShadow/Views/Atoms/LSPhaseDot.swift" }
  ]
}
-->
