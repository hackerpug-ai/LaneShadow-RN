<!-- Task Template v5.1 | FEATURE -->

================================================================================
TASK: UC-ATM-03-ios — Input atoms (`LSTextField` + `LSTextArea`) — iOS SwiftUI
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
SPRINT:     [sprint-02-atoms-foundation-primitives](./SPRINT.md)
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer
ESTIMATE:   180 min

RUNTIME_COMMANDS:
  test:      cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSTextFieldTests
  typecheck: cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES COMPILER_INDEX_STORE_ENABLE=NO SWIFT_COMPILATION_MODE=incremental build
  lint:      swiftformat --lint ios/LaneShadow/

PRD_REFS:   UC-ATM-03, .spec/prds/v2/05-uc-atm.md, .spec/prds/v2/concepts/uc-atm-03-input.html
DEPENDS_ON: UC-TOK-01, UC-TOK-02, UC-TOK-03, UC-TOK-05, UC-ATM-10-ios (icon slot — may proceed with stub), UC-ATM-01-ios (LSText for helper text)
BLOCKS:     UC-MOL-* (every form), UC-SCR-* (auth, profile, ride creation)

PROGRESS: AC-1 none · 0/8 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

`LSTextField(value:placeholder:state:leadingIcon:trailingIcon:helperText:)` (single-line) and `LSTextArea(value:placeholder:state:autoGrow:helperText:)` (multi-line, auto-growing) render iOS SwiftUI input atoms covering 4 visual states (default/focused/error/disabled). Padding `spacing.3`, corner `radius.sm`, border colors from `color.border.*`, helper text via `LSText` resolving `color.content.error` in error state. Optional leading/trailing icon slots resolve through LSIcon (UC-ATM-10).

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)
--------------------------------------------------------------------------------

- NEVER reference `Color(...)`, hex strings, or any literal color in `ios/LaneShadow/Views/Atoms/LSTextField.swift` or `LSTextArea.swift`. All colors MUST resolve through `LaneShadowTheme.color.*`.
- NEVER use `Image(systemName:)` directly — icons resolve through `LSIcon`.
- NEVER hardcode padding, radius, or font — all visuals MUST resolve through theme tokens.
- NEVER write `#Preview { ... }` — sandbox stories ONLY.
- MUST modify only files listed in SCOPE.writeAllowed.
- STRICTLY no edits to `~/Projects/native-theme/**` or `~/Projects/native-sandbox/**`.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] `LSTextField` exists at `ios/LaneShadow/Views/Atoms/LSTextField.swift` — maps to AC-1 (PRIMARY)
- [ ] `LSTextArea` exists at `ios/LaneShadow/Views/Atoms/LSTextArea.swift` — maps to AC-2
- [ ] Focus border resolves `color.border.focus` (Copper signal) — maps to AC-3
- [ ] Error state + helper text resolves `color.content.error` — maps to AC-4
- [ ] Disabled state suppresses input + resolves disabled tokens — maps to AC-5
- [ ] Leading icon slot resolves through LSIcon — maps to AC-6
- [ ] `value` binding reflects typed text in real time — maps to AC-7
- [ ] Sandbox story families registered (id `atoms.textfield.*` + `atoms.textarea.*`) — maps to AC-8
- [ ] iOS typecheck/build green; XCTest green; swiftformat clean
- [ ] Only SCOPE.writeAllowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads — ordered happy-path first)
--------------------------------------------------------------------------------

AC-1: LSTextField default state resolves token-based padding/radius/border [PRIMARY]
  GIVEN: An iOS SwiftUI view importing LaneShadowTheme
  WHEN:  Developer renders `LSTextField(value: $text, placeholder: "Email")`
  THEN:  Padding == `theme.spacing.3`, corner radius == `theme.radius.sm`, 1pt border == `theme.color.border.default`, background == `theme.color.surface.input`, placeholder typography == `theme.typography.ui.body.md`, placeholder color == `theme.color.content.placeholder`
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Atoms/LSTextFieldTests.swift
  TEST_FUNCTION: test_default_state_resolves_default_tokens
  VERIFY:        cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSTextFieldTests/test_default_state_resolves_default_tokens

AC-2: LSTextArea auto-grows with content (multi-line behavior)
  GIVEN: `LSTextArea(value: $note, placeholder: "Notes", autoGrow: true)`
  WHEN:  Three lines of text are entered
  THEN:  Rendered height grows to accommodate all three lines (intrinsic height >= 3 × lineHeight + 2 × spacing.3 padding)
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Atoms/LSTextAreaTests.swift
  TEST_FUNCTION: test_autogrow_height_expands_with_lines
  VERIFY:        cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSTextAreaTests/test_autogrow_height_expands_with_lines

AC-3: Focused state resolves color.border.focus (Copper signal)
  GIVEN: An LSTextField rendered
  WHEN:  Field receives focus (state == .focused)
  THEN:  Border color == `theme.color.border.focus` (Copper signal token)
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Atoms/LSTextFieldTests.swift
  TEST_FUNCTION: test_focused_state_resolves_border_focus_copper
  VERIFY:        cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSTextFieldTests/test_focused_state_resolves_border_focus_copper

AC-4: Error state + helper text resolves color.content.error
  GIVEN: `LSTextField(value:..., state: .error, helperText: "Required")`
  WHEN:  Rendered
  THEN:  Border color == `theme.color.border.error`, helper text uses LSText with `ContentColor.error` (resolves `theme.color.content.error`)
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Atoms/LSTextFieldTests.swift
  TEST_FUNCTION: test_error_state_resolves_error_border_and_helper_text
  VERIFY:        cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSTextFieldTests/test_error_state_resolves_error_border_and_helper_text

AC-5: Disabled state suppresses input and resolves disabled tokens
  GIVEN: `LSTextField(value:..., state: .disabled)`
  WHEN:  User attempts to type
  THEN:  `value` does not change, background == `theme.color.surface.disabled`, foreground == `theme.color.content.disabled`, isEditable == false
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Atoms/LSTextFieldTests.swift
  TEST_FUNCTION: test_disabled_state_suppresses_input_and_resolves_disabled_tokens
  VERIFY:        cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSTextFieldTests/test_disabled_state_suppresses_input_and_resolves_disabled_tokens

AC-6: Leading icon slot resolves through LSIcon (composition — edge)
  GIVEN: `LSTextField(value:..., placeholder:"Search", leadingIcon: .search)`
  WHEN:  Rendered
  THEN:  Leading slot contains an LSIcon (or stub) sized at `theme.sizing.icon.sm`, color resolves `theme.color.content.secondary`, spacing between icon and text == `theme.spacing.2`
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Atoms/LSTextFieldTests.swift
  TEST_FUNCTION: test_leading_icon_slot_resolves_lsicon
  VERIFY:        cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSTextFieldTests/test_leading_icon_slot_resolves_lsicon

AC-7: Value binding reflects typed text in real time (behavior — edge)
  GIVEN: `LSTextField(value: $text)` with @State text = ""
  WHEN:  User types "abc"
  THEN:  `text` == "abc" after each keystroke (binding propagates synchronously)
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Atoms/LSTextFieldTests.swift
  TEST_FUNCTION: test_value_binding_reflects_typed_text_realtime
  VERIFY:        cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSTextFieldTests/test_value_binding_reflects_typed_text_realtime

AC-8: Story families registered (atoms.textfield.* and atoms.textarea.*)
  GIVEN: `ios/LaneShadow/Sandbox/Stories/LSInputStories.swift`
  WHEN:  AtomStories.all is composed
  THEN:  Stories `atoms.textfield.default`, `atoms.textfield.focused`, `atoms.textfield.error`, `atoms.textfield.disabled`, `atoms.textfield.with-icon`, `atoms.textarea.default`, `atoms.textarea.autogrow` all registered with tier == `.atom`
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadow/Sandbox/Stories/LSInputStories.swift
  TEST_FUNCTION: n/a (grep gate)
  VERIFY:        for s in atoms.textfield.default atoms.textfield.focused atoms.textfield.error atoms.textfield.disabled atoms.textfield.with-icon atoms.textarea.default atoms.textarea.autogrow; do grep -q "$s" ios/LaneShadow/Sandbox/Stories/LSInputStories.swift || exit 1; done && grep -q 'LSInputStories' ios/LaneShadow/Sandbox/LaneShadowStories.swift

--------------------------------------------------------------------------------
TEST CRITERIA (boolean — each maps to one AC)
--------------------------------------------------------------------------------

| ID  | Statement | Maps to | Verify |
|-----|-----------|---------|--------|
| TC-1 | Default LSTextField resolves spacing.3 padding, radius.sm, border.default, surface.input | AC-1 | xcodebuild test …test_default_state_resolves_default_tokens |
| TC-2 | LSTextArea autoGrow expands height to fit 3 lines | AC-2 | xcodebuild test …test_autogrow_height_expands_with_lines |
| TC-3 | Focused border resolves color.border.focus (Copper) | AC-3 | xcodebuild test …test_focused_state_resolves_border_focus_copper |
| TC-4 | Error state border + helper text resolve error tokens | AC-4 | xcodebuild test …test_error_state_resolves_error_border_and_helper_text |
| TC-5 | Disabled state blocks input and resolves disabled tokens | AC-5 | xcodebuild test …test_disabled_state_suppresses_input_and_resolves_disabled_tokens |
| TC-6 | Leading icon slot resolves LSIcon at sizing.icon.sm with spacing.2 | AC-6 | xcodebuild test …test_leading_icon_slot_resolves_lsicon |
| TC-7 | Value binding propagates typed text synchronously | AC-7 | xcodebuild test …test_value_binding_reflects_typed_text_realtime |
| TC-8 | All 7 story ids registered + LSInputStories aggregated | AC-8 | grep gate above |

--------------------------------------------------------------------------------
SCOPE (file-level write permissions)
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Views/Atoms/LSTextField.swift (NEW)
- ios/LaneShadow/Views/Atoms/LSTextArea.swift (NEW)
- ios/LaneShadow/Views/Atoms/InputState.swift (NEW — shared enum default/focused/error/disabled)
- ios/LaneShadow/Sandbox/Stories/LSInputStories.swift (NEW)
- ios/LaneShadow/Sandbox/LaneShadowStories.swift (MODIFY — register LSInputStories.all)
- ios/LaneShadowTests/Atoms/LSTextFieldTests.swift (NEW)
- ios/LaneShadowTests/Atoms/LSTextAreaTests.swift (NEW)

writeProhibited:
- ~/Projects/native-theme/** — schema upstream
- ~/Projects/native-sandbox/** — runtime upstream
- tokens/platforms/swift/Sources/LaneShadowTheme/Generated/** — UC-TOK-05 owns
- android/** — kotlin-implementer scope
- ios/LaneShadow.xcodeproj/** — human-only per RULES.md
- Anything not explicitly listed above

--------------------------------------------------------------------------------
BOUNDARIES (✅ Always / ⚠️ Ask First)
--------------------------------------------------------------------------------

✅ Always:
- Resolve every visual property via `@Environment(\.theme)` accessors.
- Use SwiftUI `@FocusState` for focus tracking — drives state transitions.
- Compose helper text through LSText with `ContentColor.error` (do not inline a `Text` with raw color).

⚠️ Ask First:
- Adding character-count or validation chrome inside the atom (belongs in molecule).
- Adding password/secure input variant (will spawn UC-ATM-03b if needed).

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- ios/LaneShadow/Views/Atoms/LSTextField.swift (NEW)
- ios/LaneShadow/Views/Atoms/LSTextArea.swift (NEW)
- ios/LaneShadow/Views/Atoms/InputState.swift (NEW)
- ios/LaneShadow/Sandbox/Stories/LSInputStories.swift (NEW)
- ios/LaneShadow/Sandbox/LaneShadowStories.swift (MODIFY)
- ios/LaneShadowTests/Atoms/LSTextFieldTests.swift (NEW)
- ios/LaneShadowTests/Atoms/LSTextAreaTests.swift (NEW)

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

For each AC: RED (write failing test) → GREEN (minimal impl) → REFACTOR. Show actual test failure output in RED phase. Never write implementation in RED. Never expand beyond current AC in GREEN.

After all 8 ACs: dispatch swift-reviewer.

--------------------------------------------------------------------------------
READING LIST (max 5 files — canonical pattern first)
--------------------------------------------------------------------------------

1. .spec/prds/v2/concepts/uc-atm-03-input.html [PRIMARY PATTERN]
   - Lines: all
   - Focus: REQUIRED READING — visual design source for 4 states + icon composition

2. .spec/prds/v2/05-uc-atm.md
   - Lines: 91-130 (UC-ATM-03 section)
   - Focus: Canonical AC bullets

3. .spec/prds/v2/tasks/sprint-02-atoms-foundation-primitives/UC-ATM-01-ios-typography-atoms-lstext-ios-swiftui.md
   - Lines: all
   - Focus: Sibling task pattern — token consumption, story registration, LSText for helper text

4. tokens/platforms/swift/Sources/LaneShadowTheme/Theme.swift
   - Lines: all
   - Focus: ThemeProvider + generated `color.border.*`, `color.surface.input`, `color.content.*`

5. ~/Projects/native-sandbox/RULES.md
   - Sections: §6 (Story contract), §10 (ArgTypes discipline)
   - Focus: Story id format `atoms.{component}.{variant}`, ComponentTier.atom

--------------------------------------------------------------------------------
EVIDENCE GATES (fast/cheap first)
--------------------------------------------------------------------------------

Gate 1: RED phase evidence (TDD_STATE shows red before green per AC).
Gate 2: One test per behavioral AC (AC-1..AC-7 = test functions; AC-8 = grep gate).
Gate 3: All XCTest pass — `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSTextFieldTests` and `LSTextAreaTests` exit 0.
Gate 4: Swift build green — `cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet build` exits 0.
Gate 5: swiftformat clean — `swiftformat --lint ios/LaneShadow/` exits 0.
Gate 6: No literal colors — `! grep -REn 'Color\(|Color\.(red|blue|green|black|white|gray|orange|yellow|purple|pink)|#[0-9a-fA-F]{6}' ios/LaneShadow/Views/Atoms/LSTextField.swift ios/LaneShadow/Views/Atoms/LSTextArea.swift` returns zero.
Gate 7: No SF Symbols — `! grep -REn 'Image\(systemName:' ios/LaneShadow/Views/Atoms/LSTextField.swift ios/LaneShadow/Views/Atoms/LSTextArea.swift` returns zero.
Gate 8: Stories registered — `grep -q 'LSInputStories' ios/LaneShadow/Sandbox/LaneShadowStories.swift` and 7 ids present.
Gate 9: Scope compliance — `git diff --name-only` ⊆ writeAllowed.

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- Android Compose implementation (UC-ATM-03-android — runs in parallel under kotlin-implementer).
- Secure (password) variant — separate task.
- Character-count chrome — belongs to a molecule wrapper.
- UC-ATM-10 LSIcon catalog — stub if needed.

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** No input atom exists on iOS. Forms (auth, ride creation, profile) would each hand-roll `TextField` with raw colors and inconsistent focus styling, defeating UC-TOK-02/03 and breaking parity with Android.

**Gap:** Without LSTextField/LSTextArea, every form molecule will inline `.padding()`, `.background(Color.gray)`, and `.border(Color.red)`, making accessibility (Dynamic Type, focus) and visual consistency unmaintainable.

--------------------------------------------------------------------------------
REVIEW (for swift-reviewer)
--------------------------------------------------------------------------------

Must pass (≤5):
- One test per behavioral AC; tests verify rendered token resolution + interaction semantics.
- RED evidence present in TDD_STATE history.
- No literal Color references AND no SF Symbols in LSTextField.swift / LSTextArea.swift (grep gates).
- All 7 story ids registered + aggregated in LaneShadowStories.swift.
- SCOPE respected (`git diff --name-only` ⊆ writeAllowed).

Should verify (≤5):
- Focus state driven by @FocusState — clean SwiftUI idiom.
- Helper text uses LSText (not raw `Text`).
- Disabled visually AND behaviorally suppressed.
- Auto-grow behavior calculates intrinsic content size correctly.
- API ergonomics — placeholder, helperText, leadingIcon all optional with sensible defaults.

Verdict: APPROVED | NEEDS_FIXES

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: UC-TOK-01 (typography), UC-TOK-02 (color border.* / surface.input / content.*), UC-TOK-03 (spacing/radius/sizing), UC-TOK-05 (generated Swift theme), UC-ATM-01-ios (LSText for helper text), UC-ATM-10-ios (LSIcon — may proceed with stub)
Blocks:     UC-MOL-* (every form molecule), UC-SCR-* (auth, profile, ride creation)
Parallel:   UC-ATM-03-android (Android pair), UC-ATM-02-ios (button), UC-ATM-04-ios (display), UC-ATM-05-ios (surfaces)

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN iOS view WHEN LSTextField default rendered THEN padding=spacing.3, radius=radius.sm, border=color.border.default, bg=color.surface.input, placeholder typography=typography.ui.body.md, placeholder color=color.content.placeholder", "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSTextFieldTests/test_default_state_resolves_default_tokens" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN LSTextArea autoGrow=true WHEN 3 lines entered THEN intrinsic height >= 3*lineHeight + 2*spacing.3", "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSTextAreaTests/test_autogrow_height_expands_with_lines" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN LSTextField WHEN focused THEN border=color.border.focus (Copper)", "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSTextFieldTests/test_focused_state_resolves_border_focus_copper" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN LSTextField state=.error helperText set WHEN rendered THEN border=color.border.error AND helper text uses LSText with ContentColor.error", "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSTextFieldTests/test_error_state_resolves_error_border_and_helper_text" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN LSTextField state=.disabled WHEN typed THEN value unchanged, bg=color.surface.disabled, fg=color.content.disabled, isEditable=false", "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSTextFieldTests/test_disabled_state_suppresses_input_and_resolves_disabled_tokens" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN LSTextField leadingIcon=.search WHEN rendered THEN LSIcon at sizing.icon.sm color=color.content.secondary spacing=spacing.2", "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSTextFieldTests/test_leading_icon_slot_resolves_lsicon" },
    { "id": "AC-7", "type": "acceptance_criterion", "description": "GIVEN LSTextField(value: $text) WHEN user types abc THEN text==abc synchronously", "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSTextFieldTests/test_value_binding_reflects_typed_text_realtime" },
    { "id": "AC-8", "type": "acceptance_criterion", "description": "GIVEN LSInputStories.swift WHEN composed THEN 7 stories atoms.textfield.{default,focused,error,disabled,with-icon} + atoms.textarea.{default,autogrow} registered + aggregated", "verify": "for s in atoms.textfield.default atoms.textfield.focused atoms.textfield.error atoms.textfield.disabled atoms.textfield.with-icon atoms.textarea.default atoms.textarea.autogrow; do grep -q \"$s\" ios/LaneShadow/Sandbox/Stories/LSInputStories.swift || exit 1; done && grep -q 'LSInputStories' ios/LaneShadow/Sandbox/LaneShadowStories.swift" },
    { "id": "TC-1", "type": "test_criterion", "description": "Default state token resolution", "maps_to_ac": "AC-1", "verify": "cd ios && xcodebuild test -only-testing:LaneShadowTests/Atoms/LSTextFieldTests/test_default_state_resolves_default_tokens" },
    { "id": "TC-2", "type": "test_criterion", "description": "Auto-grow height expansion", "maps_to_ac": "AC-2", "verify": "cd ios && xcodebuild test -only-testing:LaneShadowTests/Atoms/LSTextAreaTests/test_autogrow_height_expands_with_lines" },
    { "id": "TC-3", "type": "test_criterion", "description": "Focused border Copper resolution", "maps_to_ac": "AC-3", "verify": "cd ios && xcodebuild test -only-testing:LaneShadowTests/Atoms/LSTextFieldTests/test_focused_state_resolves_border_focus_copper" },
    { "id": "TC-4", "type": "test_criterion", "description": "Error border + helper text", "maps_to_ac": "AC-4", "verify": "cd ios && xcodebuild test -only-testing:LaneShadowTests/Atoms/LSTextFieldTests/test_error_state_resolves_error_border_and_helper_text" },
    { "id": "TC-5", "type": "test_criterion", "description": "Disabled suppresses input + tokens", "maps_to_ac": "AC-5", "verify": "cd ios && xcodebuild test -only-testing:LaneShadowTests/Atoms/LSTextFieldTests/test_disabled_state_suppresses_input_and_resolves_disabled_tokens" },
    { "id": "TC-6", "type": "test_criterion", "description": "Leading icon slot LSIcon resolution", "maps_to_ac": "AC-6", "verify": "cd ios && xcodebuild test -only-testing:LaneShadowTests/Atoms/LSTextFieldTests/test_leading_icon_slot_resolves_lsicon" },
    { "id": "TC-7", "type": "test_criterion", "description": "Value binding realtime propagation", "maps_to_ac": "AC-7", "verify": "cd ios && xcodebuild test -only-testing:LaneShadowTests/Atoms/LSTextFieldTests/test_value_binding_reflects_typed_text_realtime" },
    { "id": "TC-8", "type": "test_criterion", "description": "All 7 input stories registered + aggregated", "maps_to_ac": "AC-8", "verify": "for s in atoms.textfield.default atoms.textfield.focused atoms.textfield.error atoms.textfield.disabled atoms.textfield.with-icon atoms.textarea.default atoms.textarea.autogrow; do grep -q \"$s\" ios/LaneShadow/Sandbox/Stories/LSInputStories.swift || exit 1; done" }
  ]
}
-->
