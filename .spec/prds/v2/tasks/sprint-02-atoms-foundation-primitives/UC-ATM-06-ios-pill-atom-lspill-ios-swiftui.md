<!-- Task Template v5.1 | FEATURE -->

================================================================================
TASK: UC-ATM-06-ios — Pill atom (`LSPill`) — iOS SwiftUI
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     S
SPRINT:     [sprint-02-atoms-foundation-primitives](./SPRINT.md)
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer
ESTIMATE:   60 min

RUNTIME_COMMANDS:
  test:      cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSPillTests
  typecheck: cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES COMPILER_INDEX_STORE_ENABLE=NO SWIFT_COMPILATION_MODE=incremental build
  lint:      swiftformat --lint ios/LaneShadow/

PRD_REFS:   UC-ATM-06, .spec/prds/v2/05-uc-atm.md, .spec/prds/v2/concepts/uc-atm-06-pill.html
DEPENDS_ON: UC-TOK-02, UC-TOK-05, UC-SBX-00-ios
BLOCKS:     UC-ATM-07-ios (Badge — composes Pill), UC-MOL-*, UC-ORG-*

PROGRESS: AC-1 none · 0/6 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

`LSPill(size: .sm | .md | .lg, padding?, content)` renders a pill-shaped, non-interactive container primitive on iOS SwiftUI. Corner radius resolves through `radius.pill`, height per size resolves through `sizing.pill.{sm=24,md=32,lg=40}`, padding per size resolves through token. No default background or border — Pill is a pure shape primitive that downstream atoms (Badge) compose with surface fills.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)
--------------------------------------------------------------------------------

- NEVER use literal corner-radius values (e.g. `cornerRadius(999)` or `cornerRadius(20)`) — always resolve `radius.pill`.
- NEVER hardcode height numbers — sizing must come from `sizing.pill.{sm|md|lg}`.
- NEVER apply a default background `.fill(...)` or border in `LSPill` — composing atoms own surface decisions.
- NEVER use SF Symbols (`Image(systemName:)`) inside Pill stories — use `LSIcon` from UC-ATM-10-ios.
- MUST modify only files listed in SCOPE.writeAllowed.
- STRICTLY no edits to `~/Projects/native-theme/**` or `~/Projects/native-sandbox/**`.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] `LSPill` struct exists at `ios/LaneShadow/Views/Atoms/LSPill.swift` accepting `size: PillSize`, optional `padding`, and `@ViewBuilder content` — maps to AC-1
- [ ] All three sizes render at exact token heights — maps to AC-2
- [ ] Custom padding override resolves through token — maps to AC-3
- [ ] Five stories registered in `LSPillStories.all` — maps to AC-4
- [ ] No literal radius/height numbers in source — maps to AC-5
- [ ] Rendered height matches `sizing.pill.{size}` exactly across all sizes — maps to AC-6
- [ ] iOS typecheck/build green; XCTest green; swiftformat clean
- [ ] Only SCOPE.writeAllowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads — ordered happy-path first)
--------------------------------------------------------------------------------

AC-1: LSPill renders at sizing.pill.md by default with token radius [PRIMARY]
  GIVEN: An iOS SwiftUI view importing LaneShadowTheme
  WHEN:  Developer renders `LSPill(size: .md) { LSText("Label", variant: .ui.label.sm) }`
  THEN:  Rendered frame height == `sizing.pill.md` (32pt) and corner radius == `radius.pill`
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Atoms/LSPillTests.swift
  TEST_FUNCTION: test_md_size_resolves_height_and_radius_tokens
  VERIFY:        cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSPillTests/test_md_size_resolves_height_and_radius_tokens

AC-2: LSPill renders sm and lg sizes at exact token heights
  GIVEN: An iOS SwiftUI view
  WHEN:  Developer renders `LSPill(size: .sm)` and `LSPill(size: .lg)`
  THEN:  Heights resolve to `sizing.pill.sm` (24pt) and `sizing.pill.lg` (40pt) respectively
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Atoms/LSPillTests.swift
  TEST_FUNCTION: test_sm_and_lg_sizes_resolve_token_heights
  VERIFY:        cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSPillTests/test_sm_and_lg_sizes_resolve_token_heights

AC-3: LSPill custom padding override resolves through token (edge)
  GIVEN: `LSPill(size: .md, padding: .spacing.sm)`
  WHEN:  Rendered
  THEN:  Horizontal padding == `theme.spacing.sm`
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Atoms/LSPillTests.swift
  TEST_FUNCTION: test_custom_padding_resolves_token
  VERIFY:        cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSPillTests/test_custom_padding_resolves_token

AC-4: Five stories registered (Small / Medium / Large / Icon+Label / Icon Only)
  GIVEN: `ios/LaneShadow/Sandbox/Stories/LSPillStories.swift`
  WHEN:  AtomStories.all is composed
  THEN:  Stories with ids `atoms.pill.sm`, `atoms.pill.md`, `atoms.pill.lg`, `atoms.pill.iconLabel`, `atoms.pill.iconOnly` exist, tier = `.atom`
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadow/Sandbox/Stories/LSPillStories.swift
  TEST_FUNCTION: n/a (grep gate)
  VERIFY:        for id in atoms.pill.sm atoms.pill.md atoms.pill.lg atoms.pill.iconLabel atoms.pill.iconOnly; do grep -q "$id" ios/LaneShadow/Sandbox/Stories/LSPillStories.swift || exit 1; done && grep -q 'LSPillStories' ios/LaneShadow/Sandbox/LaneShadowStories.swift

AC-5: No literal radius or height numbers in LSPill.swift (error gate — boundary)
  GIVEN: ios/LaneShadow/Views/Atoms/LSPill.swift
  WHEN:  Reviewer greps
  THEN:  Zero matches for `cornerRadius\([0-9]`, `frame(height: [0-9]`, or `Color\\.` literals
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadow/Views/Atoms/LSPill.swift
  TEST_FUNCTION: n/a (grep gate)
  VERIFY:        ! grep -REn 'cornerRadius\([0-9]|frame\(height: [0-9]|Color\.(red|blue|green|black|white|gray|orange|yellow|purple|pink)' ios/LaneShadow/Views/Atoms/LSPill.swift

AC-6: Rendered height matches sizing.pill.{size} exactly per size (snapshot/measure)
  GIVEN: LSPill rendered at sm, md, lg
  WHEN:  Frame is measured under XCTest host view
  THEN:  Measured heights are exactly 24, 32, 40 pt — no off-by-one drift from padding
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Atoms/LSPillTests.swift
  TEST_FUNCTION: test_rendered_height_matches_token_per_size
  VERIFY:        cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSPillTests/test_rendered_height_matches_token_per_size

--------------------------------------------------------------------------------
TEST CRITERIA (boolean — each maps to one AC)
--------------------------------------------------------------------------------

| ID  | Statement | Maps to | Verify |
|-----|-----------|---------|--------|
| TC-1 | LSPill md resolves sizing.pill.md height + radius.pill | AC-1 | xcodebuild test …test_md_size_resolves_height_and_radius_tokens |
| TC-2 | LSPill sm and lg resolve sizing.pill.{sm,lg} heights | AC-2 | xcodebuild test …test_sm_and_lg_sizes_resolve_token_heights |
| TC-3 | Custom padding resolves theme.spacing.sm | AC-3 | xcodebuild test …test_custom_padding_resolves_token |
| TC-4 | Five story ids registered + aggregator wired | AC-4 | grep gate above |
| TC-5 | LSPill.swift contains zero literal radius/height/Color | AC-5 | grep gate above |
| TC-6 | Measured heights exactly match token per size | AC-6 | xcodebuild test …test_rendered_height_matches_token_per_size |

--------------------------------------------------------------------------------
SCOPE (file-level write permissions)
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Views/Atoms/LSPill.swift (NEW)
- ios/LaneShadow/Views/Atoms/PillSize.swift (NEW — typed size enum)
- ios/LaneShadow/Sandbox/Stories/LSPillStories.swift (NEW)
- ios/LaneShadow/Sandbox/LaneShadowStories.swift (MODIFY — register LSPillStories.all)
- ios/LaneShadowTests/Atoms/LSPillTests.swift (NEW)

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
- Resolve radius via `theme.radius.pill` and height via `theme.sizing.pill.{size}`.
- Wrap previews in native-sandbox `Story` values; tier = `.atom`.
- Keep Pill a pure shape primitive — no fill, no stroke by default.

⚠️ Ask First:
- Adding a new size beyond sm/md/lg.
- Introducing default background or border (would belong on Badge, not Pill).

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- ios/LaneShadow/Views/Atoms/LSPill.swift (NEW): the pill shape primitive
- ios/LaneShadow/Views/Atoms/PillSize.swift (NEW): size enum
- ios/LaneShadow/Sandbox/Stories/LSPillStories.swift (NEW): 5 stories
- ios/LaneShadow/Sandbox/LaneShadowStories.swift (MODIFY): include `LSPillStories.all`
- ios/LaneShadowTests/Atoms/LSPillTests.swift (NEW): 4 behavior tests

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

For each AC: RED (write failing test) → GREEN (minimal impl) → REFACTOR. Show actual test failure output in RED phase. Never write implementation in RED. Never expand beyond current AC in GREEN.

After all 6 ACs: dispatch swift-reviewer.

--------------------------------------------------------------------------------
READING LIST (max 5 files — canonical pattern first)
--------------------------------------------------------------------------------

1. .spec/prds/v2/concepts/uc-atm-06-pill.html [PRIMARY PATTERN]
   - Lines: all
   - Focus: REQUIRED READING — visual design source for size matrix
2. .spec/prds/v2/05-uc-atm.md
   - Lines: 100-130
   - Focus: UC-ATM-06 canonical AC bullets
3. .spec/prds/v2/tasks/sprint-02-atoms-foundation-primitives/UC-ATM-01-ios-typography-atoms-lstext-ios-swiftui.md
   - Lines: all
   - Focus: Sibling iOS atom pattern (token resolution + story aggregator)
4. tokens/platforms/swift/Sources/LaneShadowTheme/Theme.swift
   - Lines: all
   - Focus: sizing.pill.* and radius.pill accessors
5. ~/Projects/native-sandbox/RULES.md
   - Sections: §6 (Story contract), §10 (ArgTypes discipline)
   - Focus: Story id format `atoms.{component}.{variant}`, ComponentTier.atom

--------------------------------------------------------------------------------
EVIDENCE GATES (fast/cheap first)
--------------------------------------------------------------------------------

Gate 1: RED phase evidence per behavioral AC.
Gate 2: Tests assert token-resolved values, not literals.
Gate 3: All XCTest pass.
Gate 4: Swift build green.
Gate 5: swiftformat clean.
Gate 6: No literal radius/height/Color in LSPill.swift (grep).
Gate 7: All 5 stories registered (grep).
Gate 8: Scope compliance — `git diff --name-only` ⊆ writeAllowed.

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- Default fill/stroke (UC-ATM-07-ios Badge owns surface decisions).
- Tap/press handling (Pill is non-interactive primitive).
- Android Compose pair (UC-ATM-06-android — parallel kotlin-implementer).

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** UC-TOK-02 generates `sizing.pill.{sm,md,lg}` and `radius.pill` into the Swift theme. iOS has no pill primitive — Badge variants would each duplicate shape geometry.

**Gap:** No `LSPill` atom exists. Without it, downstream atoms (Badge, BestBadge) inline pill geometry, defeating the Rule of 2 and forcing token drift.

--------------------------------------------------------------------------------
REVIEW (for swift-reviewer)
--------------------------------------------------------------------------------

Must pass (≤5):
- One test per behavioral AC; tests verify token resolution.
- RED evidence present in TDD_STATE history.
- No literal radius/height/Color references in LSPill.swift.
- All 5 story ids registered + aggregator wired.
- SCOPE respected.

Should verify (≤5):
- API ergonomics — `@ViewBuilder content` slot composes cleanly.
- No default background/border in LSPill (composition-only).
- Test naming follows `test_{condition}_{expected}` convention.
- Stories tier == `.atom`.
- Anti-pattern check: zero `cornerRadius([0-9]`, `frame(height: [0-9]`, `Image(systemName:`.

Verdict: APPROVED | NEEDS_FIXES

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: UC-TOK-02 (sizing/radius tokens), UC-TOK-05 (generated Swift theme), UC-SBX-00-ios (sandbox runtime)
Blocks:     UC-ATM-07-ios (Badge composes Pill), UC-MOL-*, UC-ORG-*
Parallel:   UC-ATM-06-android

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN iOS view WHEN LSPill(.md) rendered THEN height=sizing.pill.md, radius=radius.pill", "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSPillTests/test_md_size_resolves_height_and_radius_tokens" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN view WHEN LSPill .sm and .lg rendered THEN heights=24 and 40 from sizing.pill", "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSPillTests/test_sm_and_lg_sizes_resolve_token_heights" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN custom padding override WHEN rendered THEN horizontal padding=theme.spacing.sm", "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSPillTests/test_custom_padding_resolves_token" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN LSPillStories.swift WHEN composed THEN 5 story ids registered", "verify": "for id in atoms.pill.sm atoms.pill.md atoms.pill.lg atoms.pill.iconLabel atoms.pill.iconOnly; do grep -q \"$id\" ios/LaneShadow/Sandbox/Stories/LSPillStories.swift || exit 1; done" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN LSPill.swift WHEN grep'd THEN zero literal radius/height/Color", "verify": "! grep -REn 'cornerRadius\\([0-9]|frame\\(height: [0-9]|Color\\.(red|blue|green|black|white|gray|orange|yellow|purple|pink)' ios/LaneShadow/Views/Atoms/LSPill.swift" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN LSPill rendered at sm/md/lg WHEN measured THEN heights exactly 24/32/40", "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSPillTests/test_rendered_height_matches_token_per_size" },
    { "id": "TC-1", "type": "test_criterion", "description": "MD size token resolution", "maps_to_ac": "AC-1", "verify": "cd ios && xcodebuild test -only-testing:LaneShadowTests/Atoms/LSPillTests/test_md_size_resolves_height_and_radius_tokens" },
    { "id": "TC-2", "type": "test_criterion", "description": "SM and LG size token resolution", "maps_to_ac": "AC-2", "verify": "cd ios && xcodebuild test -only-testing:LaneShadowTests/Atoms/LSPillTests/test_sm_and_lg_sizes_resolve_token_heights" },
    { "id": "TC-3", "type": "test_criterion", "description": "Custom padding token resolution", "maps_to_ac": "AC-3", "verify": "cd ios && xcodebuild test -only-testing:LaneShadowTests/Atoms/LSPillTests/test_custom_padding_resolves_token" },
    { "id": "TC-4", "type": "test_criterion", "description": "Five stories registered", "maps_to_ac": "AC-4", "verify": "grep -q 'atoms.pill.md' ios/LaneShadow/Sandbox/Stories/LSPillStories.swift" },
    { "id": "TC-5", "type": "test_criterion", "description": "No literal radius/height/Color", "maps_to_ac": "AC-5", "verify": "! grep -REn 'cornerRadius\\([0-9]' ios/LaneShadow/Views/Atoms/LSPill.swift" },
    { "id": "TC-6", "type": "test_criterion", "description": "Measured heights exactly match tokens", "maps_to_ac": "AC-6", "verify": "cd ios && xcodebuild test -only-testing:LaneShadowTests/Atoms/LSPillTests/test_rendered_height_matches_token_per_size" }
  ]
}
-->
