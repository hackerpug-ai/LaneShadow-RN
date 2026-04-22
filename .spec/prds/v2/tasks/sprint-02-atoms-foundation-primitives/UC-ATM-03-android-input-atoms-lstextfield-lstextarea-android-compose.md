<!-- Task Template v5.1 | FEATURE -->

================================================================================
TASK: UC-ATM-03-android — Input atoms (`LSTextField`, `LSTextArea`) — Android Compose
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
SPRINT:     [sprint-02-atoms-foundation-primitives](./SPRINT.md)
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer
ESTIMATE:   180 min

RUNTIME_COMMANDS:
  test:         cd android && ./gradlew :app:testDebugUnitTest
  instrumented: cd android && ./gradlew :app:connectedDebugAndroidTest
  typecheck:    cd android && ./gradlew :app:compileDebugKotlin
  lint:         cd android && ./gradlew detekt
  release:      cd android && ./gradlew :app:assembleRelease && unzip -l app/build/outputs/apk/release/app-release.apk | grep -c com.nativesandbox

PRD_REFS:   UC-ATM-03, .spec/prds/v2/05-uc-atm.md, .spec/prds/v2/concepts/uc-atm-03-input.html
DEPENDS_ON: UC-TOK-01, UC-TOK-02 (color.border.*), UC-TOK-03 (radius/spacing), UC-TOK-05, UC-SBX-00-android, UC-ATM-01-android (LSText), UC-ATM-10-android (LSIcon — optional slot)
BLOCKS:     UC-MOL-* (any form-bearing molecule), UC-SCR-*

PROGRESS: AC-1 none · 0/8 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

`LSTextField(value: String, onValueChange: (String) -> Unit, state: InputState = InputState.Default, placeholder: String? = null, leadingIcon: LSIconAsset? = null, trailingIcon: LSIconAsset? = null)` is a single-line input. `LSTextArea(value: String, onValueChange: (String) -> Unit, state: InputState = InputState.Default, maxRows: Int = 6)` is a multi-line auto-grow input that grows up to `maxRows` lines then becomes scrollable. Both resolve padding via `spacing.3`, corner radius via `radius.sm`, border color via `color.border.{role}`. Four states: `Default`, `Focused`, `Error`, `Disabled`.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)
--------------------------------------------------------------------------------

- NEVER use `Color(0xFF…)` literals — all color must resolve through `LaneShadowTheme.color.border.*` and `color.content.*`.
- NEVER use `androidx.compose.material.icons.*` or `Icons.Filled/Outlined.*`. Icon slots accept `LSIconAsset` from UC-ATM-10-android only.
- NEVER use `FontFamily.{Serif|SansSerif|Monospace|Default}` — text uses `LSText` / theme typography internally.
- NEVER write Story previews under `android/app/src/main/**`. Stories live ONLY under `android/app/src/debug/java/com/laneshadow/sandbox/stories/**`.
- NEVER use `Modifier.padding(12.dp)` literal — padding resolves through `spacing.3` token.
- MUST modify only files listed in SCOPE.writeAllowed.
- STRICTLY no edits to `~/Projects/native-theme/**`, `~/Projects/native-sandbox/**`, or `ios/**`.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] `LSTextField` composable exists at `android/app/src/main/java/com/laneshadow/ui/atoms/LSTextField.kt` — maps to AC-1 (PRIMARY)
- [ ] `LSTextArea` composable exists at `android/app/src/main/java/com/laneshadow/ui/atoms/LSTextArea.kt` — maps to AC-2
- [ ] All four `InputState` values resolve correct border tokens — maps to AC-3
- [ ] Focused state border distinct from default — maps to AC-4
- [ ] Error state border + helper color resolve `color.border.danger` — maps to AC-5
- [ ] LSTextArea auto-grows up to `maxRows` then scrolls — maps to AC-6
- [ ] Stories registered (`atoms.textfield.{state}`, `atoms.textarea.{state}`) under `src/debug/` — maps to AC-7
- [ ] No `Color(0x` literals or Material Icons in LSTextField/LSTextArea — maps to AC-8
- [ ] Release APK contains zero `com.nativesandbox` entries — maps to AC-9
- [ ] Android compile/build green; tests green; detekt clean
- [ ] Only SCOPE.writeAllowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads — ordered happy-path first)
--------------------------------------------------------------------------------

AC-1: LSTextField default state resolves border + radius + padding tokens [PRIMARY]
  GIVEN: An Android Compose view importing LaneShadowTheme
  WHEN:  `LSTextField(value = "", onValueChange = {})` is rendered
  THEN:  Border == `color.border.subtle`, corner radius == `radius.sm`, content padding == `spacing.3`
  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/atoms/LSTextFieldTest.kt
  TEST_FUNCTION: default_state_resolves_border_radius_padding_tokens
  VERIFY:        cd android && ./gradlew :app:testDebugUnitTest --tests "com.laneshadow.ui.atoms.LSTextFieldTest.default_state_resolves_border_radius_padding_tokens"

AC-2: LSTextArea renders multi-line with starting row count
  GIVEN: An Android Compose view
  WHEN:  `LSTextArea(value = "", onValueChange = {}, maxRows = 6)` is rendered
  THEN:  Composable supports multi-line input (Compose `TextField(singleLine = false, maxLines = 6, ...)` semantics)
  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/atoms/LSTextAreaTest.kt
  TEST_FUNCTION: textarea_renders_multiline_with_max_rows
  VERIFY:        cd android && ./gradlew :app:testDebugUnitTest --tests "com.laneshadow.ui.atoms.LSTextAreaTest.textarea_renders_multiline_with_max_rows"

AC-3: All four InputState values resolve correct border tokens
  GIVEN: All `InputState` values (Default, Focused, Error, Disabled)
  WHEN:  Each is rendered
  THEN:  Each state resolves border to `color.border.{subtle|focused|danger|disabled}` respectively
  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/atoms/LSTextFieldTest.kt
  TEST_FUNCTION: all_four_input_states_resolve_border_tokens
  VERIFY:        cd android && ./gradlew :app:testDebugUnitTest --tests "com.laneshadow.ui.atoms.LSTextFieldTest.all_four_input_states_resolve_border_tokens"

AC-4: Focused state border distinct from default (interactive)
  GIVEN: `LSTextField(state = InputState.Default, ...)` rendered
  WHEN:  The field receives focus via Compose UI test
  THEN:  Visible border resolves to `color.border.focused`
  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSTextFieldInstrumentationTest.kt
  TEST_FUNCTION: focused_state_applies_focused_border_token
  VERIFY:        cd android && ./gradlew :app:connectedDebugAndroidTest --tests "com.laneshadow.ui.atoms.LSTextFieldInstrumentationTest.focused_state_applies_focused_border_token"

AC-5: Error state applies color.border.danger
  GIVEN: `LSTextField(state = InputState.Error, ...)`
  WHEN:  Rendered
  THEN:  Border resolves to `color.border.danger`
  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/atoms/LSTextFieldTest.kt
  TEST_FUNCTION: error_state_applies_border_danger_token
  VERIFY:        cd android && ./gradlew :app:testDebugUnitTest --tests "com.laneshadow.ui.atoms.LSTextFieldTest.error_state_applies_border_danger_token"

AC-6: LSTextArea auto-grows up to maxRows, then scrolls
  GIVEN: `LSTextArea(value = "<8 lines of text>", onValueChange = {}, maxRows = 6)`
  WHEN:  Rendered
  THEN:  Visible height == 6 lines AND inner content is vertically scrollable
  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSTextAreaInstrumentationTest.kt
  TEST_FUNCTION: textarea_auto_grows_then_scrolls_at_maxRows
  VERIFY:        cd android && ./gradlew :app:connectedDebugAndroidTest --tests "com.laneshadow.ui.atoms.LSTextAreaInstrumentationTest.textarea_auto_grows_then_scrolls_at_maxRows"

AC-7: Stories registered (`atoms.textfield.{state}`, `atoms.textarea.{state}`) under src/debug
  GIVEN: `android/app/src/debug/java/com/laneshadow/sandbox/stories/LSInputStories.kt`
  WHEN:  AtomStories.all is composed
  THEN:  Stories `atoms.textfield.default`, `.focused`, `.error`, `.disabled`, `atoms.textarea.default`, `.focused`, `.error`, `.disabled` exist with tier = `ComponentTier.Atom`
  TDD_STATE:     none
  TEST_FILE:     android/app/src/debug/java/com/laneshadow/sandbox/stories/LSInputStories.kt
  TEST_FUNCTION: n/a (grep gate)
  VERIFY:        for s in default focused error disabled; do grep -q "atoms.textfield.$s" android/app/src/debug/java/com/laneshadow/sandbox/stories/LSInputStories.kt || exit 1; grep -q "atoms.textarea.$s" android/app/src/debug/java/com/laneshadow/sandbox/stories/LSInputStories.kt || exit 1; done

AC-8: No literal color/font/icon refs in LSTextField/LSTextArea (boundary)
  GIVEN: LSTextField.kt, LSTextArea.kt
  WHEN:  Reviewer greps
  THEN:  Zero matches for forbidden patterns
  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/ui/atoms/LSTextField.kt, LSTextArea.kt
  TEST_FUNCTION: n/a (grep gate)
  VERIFY:        ! grep -REn 'Color\(0x|androidx\.compose\.material\.icons|Icons\.(Filled|Outlined)|FontFamily\.(Serif|SansSerif|Monospace|Default)' android/app/src/main/java/com/laneshadow/ui/atoms/LSTextField.kt android/app/src/main/java/com/laneshadow/ui/atoms/LSTextArea.kt

AC-9: Release APK contains zero sandbox symbols (boundary gate)
  GIVEN: A release build of the app
  WHEN:  APK contents are inspected
  THEN:  Count of `com.nativesandbox` entries is exactly 0
  TDD_STATE:     none
  TEST_FILE:     n/a
  TEST_FUNCTION: n/a (shell gate)
  VERIFY:        cd android && ./gradlew :app:assembleRelease && [ "$(unzip -l app/build/outputs/apk/release/app-release.apk | grep -c com.nativesandbox)" = "0" ]

--------------------------------------------------------------------------------
TEST CRITERIA (boolean — each maps to one AC)
--------------------------------------------------------------------------------

| ID  | Statement | Maps to | Verify |
|-----|-----------|---------|--------|
| TC-1 | LSTextField default resolves border/radius/padding tokens | AC-1 | ./gradlew :app:testDebugUnitTest --tests "*.LSTextFieldTest.default_state_resolves_border_radius_padding_tokens" |
| TC-2 | LSTextArea renders multi-line | AC-2 | ./gradlew :app:testDebugUnitTest --tests "*.LSTextAreaTest.textarea_renders_multiline_with_max_rows" |
| TC-3 | All four InputState values resolve correct border tokens | AC-3 | ./gradlew :app:testDebugUnitTest --tests "*.LSTextFieldTest.all_four_input_states_resolve_border_tokens" |
| TC-4 | Focused state applies border.focused | AC-4 | ./gradlew :app:connectedDebugAndroidTest --tests "*.LSTextFieldInstrumentationTest.focused_state_applies_focused_border_token" |
| TC-5 | Error state applies border.danger | AC-5 | ./gradlew :app:testDebugUnitTest --tests "*.LSTextFieldTest.error_state_applies_border_danger_token" |
| TC-6 | LSTextArea auto-grows then scrolls at maxRows | AC-6 | ./gradlew :app:connectedDebugAndroidTest --tests "*.LSTextAreaInstrumentationTest.textarea_auto_grows_then_scrolls_at_maxRows" |
| TC-7 | All input/textarea stories registered | AC-7 | grep gate above |
| TC-8 | LSTextField/LSTextArea contain zero literal color/font/icon refs | AC-8 | grep gate above |
| TC-9 | Release APK contains zero com.nativesandbox entries | AC-9 | assembleRelease + unzip gate |

--------------------------------------------------------------------------------
SCOPE (file-level write permissions)
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/ui/atoms/LSTextField.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/atoms/LSTextArea.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/atoms/InputState.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/LSInputStories.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/AtomStories.kt (MODIFY — register LSInputStories.all)
- android/app/src/test/java/com/laneshadow/ui/atoms/LSTextFieldTest.kt (NEW)
- android/app/src/test/java/com/laneshadow/ui/atoms/LSTextAreaTest.kt (NEW)
- android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSTextFieldInstrumentationTest.kt (NEW)
- android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSTextAreaInstrumentationTest.kt (NEW)

writeProhibited:
- ios/** — swift-implementer scope
- ~/Projects/native-theme/** — schema upstream
- ~/Projects/native-sandbox/** — runtime upstream
- android/app/src/main/** for any sandbox/story file (DEBUG-ONLY rule)
- tokens/platforms/kotlin/** — generator output
- Anything not explicitly listed above

--------------------------------------------------------------------------------
BOUNDARIES (✅ Always / ⚠️ Ask First)
--------------------------------------------------------------------------------

✅ Always:
- Resolve border via `LaneShadowTheme.color.border.{role}`.
- Resolve typography via `LaneShadowTheme.typography.ui.body.md` for input text.
- Use `LSIcon` from UC-ATM-10-android for leading/trailing slots.

⚠️ Ask First:
- Adding `helperText` parameter (currently out of scope — UC-MOL-FormField will handle).
- Adding `secureTextEntry` / password masking — out of scope.

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- android/app/src/main/java/com/laneshadow/ui/atoms/LSTextField.kt (NEW): single-line input
- android/app/src/main/java/com/laneshadow/ui/atoms/LSTextArea.kt (NEW): multi-line auto-grow input
- android/app/src/main/java/com/laneshadow/ui/atoms/InputState.kt (NEW): four-state enum
- android/app/src/debug/java/com/laneshadow/sandbox/stories/LSInputStories.kt (NEW): 8 stories
- android/app/src/debug/java/com/laneshadow/sandbox/stories/AtomStories.kt (MODIFY): include `LSInputStories.all`
- android/app/src/test/java/com/laneshadow/ui/atoms/LSTextFieldTest.kt (NEW)
- android/app/src/test/java/com/laneshadow/ui/atoms/LSTextAreaTest.kt (NEW)
- android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSTextFieldInstrumentationTest.kt (NEW)
- android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSTextAreaInstrumentationTest.kt (NEW)

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

For each AC: RED → GREEN → REFACTOR. Show actual test failure output in RED phase.

After all 9 ACs: dispatch kotlin-reviewer.

--------------------------------------------------------------------------------
READING LIST (max 5 files — canonical pattern first)
--------------------------------------------------------------------------------

1. .spec/prds/v2/concepts/uc-atm-03-input.html [PRIMARY PATTERN]
   - Lines: all
   - Focus: REQUIRED READING — visual design for both atoms × four states

2. .spec/prds/v2/05-uc-atm.md
   - Lines: 91-130
   - Focus: UC-ATM-03 canonical AC bullets

3. .spec/prds/v2/tasks/sprint-02-atoms-foundation-primitives/UC-ATM-01-ios-typography-atoms-lstext-ios-swiftui.md
   - Lines: all
   - Focus: Sibling task — structural pattern only

4. android/app/src/main/java/com/laneshadow/ui/theme/LaneShadowTheme.kt
   - Lines: all
   - Focus: border tokens, spacing accessors

5. ~/Projects/native-sandbox/RULES.md
   - Sections: §6, §10
   - Focus: Story id format

--------------------------------------------------------------------------------
EVIDENCE GATES (fast/cheap first)
--------------------------------------------------------------------------------

Gate 1: RED phase evidence per AC.
Gate 2: One test per behavioral AC.
Gate 3: All JUnit pass.
Gate 4: All Compose UI tests pass.
Gate 5: Kotlin compile green.
Gate 6: detekt clean.
Gate 7: No literal color/font/icons grep.
Gate 8: Eight stories registered.
Gate 9: Release APK clean.
Gate 10: Scope compliance.

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- iOS implementation (UC-ATM-03-ios — runs in parallel).
- Helper text / label composition (UC-MOL-FormField).
- Password / secure text entry.
- Numeric / decimal keyboards (call sites configure `KeyboardOptions`).

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** UC-TOK-02 generates `color.border.{subtle|focused|danger|disabled}`. Android has no input atoms.

**Gap:** Without `LSTextField`/`LSTextArea`, every form would inline `OutlinedTextField` with hardcoded colors and Material defaults.

--------------------------------------------------------------------------------
REVIEW (for kotlin-reviewer)
--------------------------------------------------------------------------------

Must pass (≤5):
- One test per behavioral AC.
- RED evidence present.
- No literal colors, fonts, or Material Icons (grep gate).
- Eight stories with stable ids registered under `src/debug/`.
- SCOPE respected AND release APK contains zero `com.nativesandbox`.

Should verify (≤5):
- Auto-grow boundary correct (maxRows == hard cap).
- Disabled state non-interactive (`enabled = false`).
- Light + dark mode both pass.
- Focused border transition responds to focus state changes.
- IME / keyboard interactions delegated to call site.

Verdict: APPROVED | NEEDS_FIXES

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: UC-TOK-01, UC-TOK-02 (color.border.*), UC-TOK-03 (radius/spacing), UC-TOK-05, UC-SBX-00-android, UC-ATM-01-android (LSText), UC-ATM-10-android (LSIcon)
Blocks:     UC-MOL-* (form-bearing molecules), UC-SCR-*
Parallel:   UC-ATM-03-ios

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN Compose view WHEN LSTextField default rendered THEN border=color.border.subtle, radius=radius.sm, padding=spacing.3", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests \"com.laneshadow.ui.atoms.LSTextFieldTest.default_state_resolves_border_radius_padding_tokens\"" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN view WHEN LSTextArea(maxRows=6) rendered THEN multi-line semantics with maxLines=6", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests \"com.laneshadow.ui.atoms.LSTextAreaTest.textarea_renders_multiline_with_max_rows\"" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN all four InputState values WHEN rendered THEN each resolves color.border.{subtle|focused|danger|disabled}", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests \"com.laneshadow.ui.atoms.LSTextFieldTest.all_four_input_states_resolve_border_tokens\"" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN field WHEN focused THEN border=color.border.focused", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests \"com.laneshadow.ui.atoms.LSTextFieldInstrumentationTest.focused_state_applies_focused_border_token\"" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN state=Error WHEN rendered THEN border=color.border.danger", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests \"com.laneshadow.ui.atoms.LSTextFieldTest.error_state_applies_border_danger_token\"" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN textarea with >maxRows content THEN visible height = maxRows AND inner scrollable", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests \"com.laneshadow.ui.atoms.LSTextAreaInstrumentationTest.textarea_auto_grows_then_scrolls_at_maxRows\"" },
    { "id": "AC-7", "type": "acceptance_criterion", "description": "GIVEN LSInputStories.kt WHEN composed THEN 8 stories atoms.textfield/textarea.{state} registered under src/debug", "verify": "for s in default focused error disabled; do grep -q \"atoms.textfield.$s\" android/app/src/debug/java/com/laneshadow/sandbox/stories/LSInputStories.kt || exit 1; grep -q \"atoms.textarea.$s\" android/app/src/debug/java/com/laneshadow/sandbox/stories/LSInputStories.kt || exit 1; done" },
    { "id": "AC-8", "type": "acceptance_criterion", "description": "GIVEN LSTextField/LSTextArea.kt WHEN grep'd THEN zero Color(0x, Material Icons, FontFamily literals", "verify": "! grep -REn 'Color\\(0x|androidx\\.compose\\.material\\.icons|Icons\\.(Filled|Outlined)|FontFamily\\.(Serif|SansSerif|Monospace|Default)' android/app/src/main/java/com/laneshadow/ui/atoms/LSTextField.kt android/app/src/main/java/com/laneshadow/ui/atoms/LSTextArea.kt" },
    { "id": "AC-9", "type": "acceptance_criterion", "description": "GIVEN release build WHEN APK inspected THEN com.nativesandbox count = 0", "verify": "cd android && ./gradlew :app:assembleRelease && [ \"$(unzip -l app/build/outputs/apk/release/app-release.apk | grep -c com.nativesandbox)\" = \"0\" ]" },
    { "id": "TC-1", "type": "test_criterion", "description": "Default border/radius/padding tokens", "maps_to_ac": "AC-1", "verify": "./gradlew :app:testDebugUnitTest --tests \"*.LSTextFieldTest.default_state_resolves_border_radius_padding_tokens\"" },
    { "id": "TC-2", "type": "test_criterion", "description": "Multi-line semantics", "maps_to_ac": "AC-2", "verify": "./gradlew :app:testDebugUnitTest --tests \"*.LSTextAreaTest.textarea_renders_multiline_with_max_rows\"" },
    { "id": "TC-3", "type": "test_criterion", "description": "Four states border tokens", "maps_to_ac": "AC-3", "verify": "./gradlew :app:testDebugUnitTest --tests \"*.LSTextFieldTest.all_four_input_states_resolve_border_tokens\"" },
    { "id": "TC-4", "type": "test_criterion", "description": "Focused border token", "maps_to_ac": "AC-4", "verify": "./gradlew :app:connectedDebugAndroidTest --tests \"*.LSTextFieldInstrumentationTest.focused_state_applies_focused_border_token\"" },
    { "id": "TC-5", "type": "test_criterion", "description": "Error border.danger token", "maps_to_ac": "AC-5", "verify": "./gradlew :app:testDebugUnitTest --tests \"*.LSTextFieldTest.error_state_applies_border_danger_token\"" },
    { "id": "TC-6", "type": "test_criterion", "description": "TextArea auto-grow + scroll", "maps_to_ac": "AC-6", "verify": "./gradlew :app:connectedDebugAndroidTest --tests \"*.LSTextAreaInstrumentationTest.textarea_auto_grows_then_scrolls_at_maxRows\"" },
    { "id": "TC-7", "type": "test_criterion", "description": "Eight stories registered", "maps_to_ac": "AC-7", "verify": "grep loop above" },
    { "id": "TC-8", "type": "test_criterion", "description": "No literal color/font/icon refs", "maps_to_ac": "AC-8", "verify": "! grep -REn 'Color\\(0x|androidx\\.compose\\.material\\.icons|Icons\\.(Filled|Outlined)|FontFamily\\.(Serif|SansSerif|Monospace|Default)' android/app/src/main/java/com/laneshadow/ui/atoms/LSTextField.kt android/app/src/main/java/com/laneshadow/ui/atoms/LSTextArea.kt" },
    { "id": "TC-9", "type": "test_criterion", "description": "Release APK clean", "maps_to_ac": "AC-9", "verify": "[ \"$(unzip -l android/app/build/outputs/apk/release/app-release.apk | grep -c com.nativesandbox)\" = \"0\" ]" }
  ]
}
-->
