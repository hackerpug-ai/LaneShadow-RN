<!-- Task Template v5.1 | FEATURE -->

================================================================================
TASK: UC-ATM-02-android — Button atom (`LSButton`) — all variants × states — Android Compose
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     L
SPRINT:     [sprint-02-atoms-foundation-primitives](./SPRINT.md)
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer
ESTIMATE:   240 min

RUNTIME_COMMANDS:
  test:         cd android && ./gradlew :app:testDebugUnitTest
  instrumented: cd android && ./gradlew :app:connectedDebugAndroidTest
  typecheck:    cd android && ./gradlew :app:compileDebugKotlin
  lint:         cd android && ./gradlew detekt
  release:      cd android && ./gradlew :app:assembleRelease && unzip -l app/build/outputs/apk/release/app-release.apk | grep -c com.nativesandbox

PRD_REFS:   UC-ATM-02, .spec/prds/v2/05-uc-atm.md, .spec/prds/v2/concepts/uc-atm-02-button.html
DEPENDS_ON: UC-TOK-01, UC-TOK-02 (color.action.*), UC-TOK-03 (radius/spacing/sizing), UC-TOK-05, UC-SBX-00-android, UC-ATM-01-android (LSText), UC-ATM-10-android (LSIcon — optional slot)
BLOCKS:     UC-MOL-* (every molecule using a button), UC-SCR-*

PROGRESS: AC-1 none · 0/9 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

`LSButton(label: String, variant: ButtonVariant, state: ButtonState = ButtonState.Default, leadingIcon: LSIconAsset? = null, trailingIcon: LSIconAsset? = null, onClick: () -> Unit)` renders a token-driven button across **six variants** (`Primary`, `Secondary`, `Tertiary`, `Outline`, `Ghost`, `Destructive`) × **five states** (`Default`, `Hover`, `Pressed`, `Disabled`, `Loading`), resolving all colors via `color.action.*`, height via `sizing.component.buttonHeight`, touch-target via `sizing.touchTarget`, corner radius via `radius.md`, and padding via `spacing.4`.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)
--------------------------------------------------------------------------------

- NEVER use `Color(0xFF…)` literals — all color must resolve through `LaneShadowTheme.color.action.*` and `color.content.*`.
- NEVER use `androidx.compose.material.icons.*` or `Icons.Filled/Outlined.*`. Icon slots accept `LSIconAsset` from UC-ATM-10-android only.
- NEVER use `FontFamily.{Serif|SansSerif|Monospace|Default}` — label uses `LSText` (UC-ATM-01-android) internally.
- NEVER write Story previews under `android/app/src/main/**`. Stories live ONLY under `android/app/src/debug/java/com/laneshadow/sandbox/stories/**`.
- NEVER use `Modifier.height(48.dp)` literal — height resolves through `sizing.component.buttonHeight` token.
- NEVER use `Modifier.padding(16.dp)` literal — padding resolves through `spacing.4` token.
- MUST modify only files listed in SCOPE.writeAllowed.
- STRICTLY no edits to `~/Projects/native-theme/**`, `~/Projects/native-sandbox/**`, or `ios/**`.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] `LSButton` composable exists at `android/app/src/main/java/com/laneshadow/ui/atoms/LSButton.kt` — maps to AC-1 (PRIMARY)
- [ ] All six `ButtonVariant` values resolve correct `color.action.*` matrix — maps to AC-1, AC-2
- [ ] Pressed state visually distinct via token-resolved overlay — maps to AC-3
- [ ] Disabled state non-interactive + reduced opacity per token — maps to AC-4
- [ ] Outline variant + leadingIcon (NEW chip case) renders correctly — maps to AC-5
- [ ] Six stories registered (`atoms.button.{variant}`) under `src/debug/` — maps to AC-6
- [ ] Min touch target ≥ `sizing.touchTarget` (48.dp default) — maps to AC-7
- [ ] `onClick` fires exactly once per press, suppressed when disabled/loading — maps to AC-8
- [ ] No `Color(0x` literals or Material Icons in LSButton.kt — maps to AC-9
- [ ] Release APK contains zero `com.nativesandbox` entries — maps to AC-10
- [ ] Android compile/build green; JUnit + Compose UI tests green; detekt clean
- [ ] Only SCOPE.writeAllowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads — ordered happy-path first)
--------------------------------------------------------------------------------

AC-1: Primary variant resolves color.action.primary tokens [PRIMARY]
  GIVEN: An Android Compose view importing LaneShadowTheme
  WHEN:  Developer renders `LSButton(label = "Save Ride", variant = ButtonVariant.Primary, onClick = {})`
  THEN:  Background == `color.action.primary.background`, foreground == `color.action.primary.foreground`, height == `sizing.component.buttonHeight`, corner radius == `radius.md`, padding == `spacing.4`
  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/atoms/LSButtonTest.kt
  TEST_FUNCTION: primary_variant_resolves_action_primary_tokens
  VERIFY:        cd android && ./gradlew :app:testDebugUnitTest --tests "com.laneshadow.ui.atoms.LSButtonTest.primary_variant_resolves_action_primary_tokens"

AC-2: All six variants resolve their respective color.action.* token sets
  GIVEN: All `ButtonVariant` values
  WHEN:  Each is rendered
  THEN:  Each variant resolves background + foreground + border from `color.action.{primary|secondary|tertiary|outline|ghost|destructive}.*`
  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/atoms/LSButtonTest.kt
  TEST_FUNCTION: all_six_variants_resolve_correct_action_tokens
  VERIFY:        cd android && ./gradlew :app:testDebugUnitTest --tests "com.laneshadow.ui.atoms.LSButtonTest.all_six_variants_resolve_correct_action_tokens"

AC-3: Pressed state applies pressed overlay token
  GIVEN: `LSButton(variant = ButtonVariant.Primary, ...)` rendered
  WHEN:  User press is simulated (Compose UI test)
  THEN:  Background resolves to `color.action.primary.pressed` (or token-defined pressed overlay)
  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSButtonInstrumentationTest.kt
  TEST_FUNCTION: pressed_state_applies_action_pressed_token
  VERIFY:        cd android && ./gradlew :app:connectedDebugAndroidTest --tests "com.laneshadow.ui.atoms.LSButtonInstrumentationTest.pressed_state_applies_action_pressed_token"

AC-4: Disabled state suppresses onClick + applies disabled token
  GIVEN: `LSButton(state = ButtonState.Disabled, onClick = handler)`
  WHEN:  User taps the button
  THEN:  `handler` is NOT invoked AND background == `color.action.{variant}.disabled`
  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSButtonInstrumentationTest.kt
  TEST_FUNCTION: disabled_state_suppresses_click_and_applies_token
  VERIFY:        cd android && ./gradlew :app:connectedDebugAndroidTest --tests "com.laneshadow.ui.atoms.LSButtonInstrumentationTest.disabled_state_suppresses_click_and_applies_token"

AC-5: Outline variant + leading icon renders chip-like NEW case
  GIVEN: `LSButton(label = "NEW", variant = ButtonVariant.Outline, leadingIcon = LSIconAsset.Sparkle)`
  WHEN:  Rendered
  THEN:  Border resolves to `color.action.outline.border`, leading icon slot occupies the start with `spacing.2` gap before the label
  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSButtonInstrumentationTest.kt
  TEST_FUNCTION: outline_with_leading_icon_renders_chip
  VERIFY:        cd android && ./gradlew :app:connectedDebugAndroidTest --tests "com.laneshadow.ui.atoms.LSButtonInstrumentationTest.outline_with_leading_icon_renders_chip"

AC-6: Six stories registered (`atoms.button.{variant}`) under src/debug/
  GIVEN: `android/app/src/debug/java/com/laneshadow/sandbox/stories/LSButtonStories.kt`
  WHEN:  AtomStories.all is composed
  THEN:  Six stories `atoms.button.primary`, `.secondary`, `.tertiary`, `.outline`, `.ghost`, `.destructive` exist with tier = `ComponentTier.Atom`
  TDD_STATE:     none
  TEST_FILE:     android/app/src/debug/java/com/laneshadow/sandbox/stories/LSButtonStories.kt
  TEST_FUNCTION: n/a (grep gate)
  VERIFY:        for v in primary secondary tertiary outline ghost destructive; do grep -q "atoms.button.$v" android/app/src/debug/java/com/laneshadow/sandbox/stories/LSButtonStories.kt || exit 1; done

AC-7: Min touch target meets sizing.touchTarget (accessibility)
  GIVEN: `LSButton(label = "Go", ...)` rendered with default sizing
  WHEN:  Bounds are measured via Compose UI test
  THEN:  Both width and height ≥ `sizing.touchTarget` (≥ 48.dp)
  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSButtonInstrumentationTest.kt
  TEST_FUNCTION: touch_target_meets_minimum_size
  VERIFY:        cd android && ./gradlew :app:connectedDebugAndroidTest --tests "com.laneshadow.ui.atoms.LSButtonInstrumentationTest.touch_target_meets_minimum_size"

AC-8: onClick fires exactly once per tap (debounce / no double-fire)
  GIVEN: `LSButton(state = ButtonState.Default, onClick = counter)`
  WHEN:  Single tap performed
  THEN:  Counter incremented exactly once
  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSButtonInstrumentationTest.kt
  TEST_FUNCTION: onClick_fires_exactly_once_per_tap
  VERIFY:        cd android && ./gradlew :app:connectedDebugAndroidTest --tests "com.laneshadow.ui.atoms.LSButtonInstrumentationTest.onClick_fires_exactly_once_per_tap"

AC-9: No Color literal, no Material Icons, no FontFamily literal in LSButton.kt (boundary)
  GIVEN: `android/app/src/main/java/com/laneshadow/ui/atoms/LSButton.kt`
  WHEN:  Reviewer greps
  THEN:  Zero matches for forbidden patterns
  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/ui/atoms/LSButton.kt
  TEST_FUNCTION: n/a (grep gate)
  VERIFY:        ! grep -REn 'Color\(0x|androidx\.compose\.material\.icons|Icons\.(Filled|Outlined)|FontFamily\.(Serif|SansSerif|Monospace|Default)' android/app/src/main/java/com/laneshadow/ui/atoms/LSButton.kt

AC-10: Release APK contains zero sandbox symbols (boundary gate)
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
| TC-1 | Primary variant resolves color.action.primary.* + sizing/radius/padding tokens | AC-1 | ./gradlew :app:testDebugUnitTest --tests "*.LSButtonTest.primary_variant_resolves_action_primary_tokens" |
| TC-2 | All six variants resolve their action.* tokens | AC-2 | ./gradlew :app:testDebugUnitTest --tests "*.LSButtonTest.all_six_variants_resolve_correct_action_tokens" |
| TC-3 | Pressed state applies pressed token | AC-3 | ./gradlew :app:connectedDebugAndroidTest --tests "*.LSButtonInstrumentationTest.pressed_state_applies_action_pressed_token" |
| TC-4 | Disabled state suppresses onClick + applies disabled token | AC-4 | ./gradlew :app:connectedDebugAndroidTest --tests "*.LSButtonInstrumentationTest.disabled_state_suppresses_click_and_applies_token" |
| TC-5 | Outline + leading icon NEW chip renders | AC-5 | ./gradlew :app:connectedDebugAndroidTest --tests "*.LSButtonInstrumentationTest.outline_with_leading_icon_renders_chip" |
| TC-6 | Six stories atoms.button.{variant} registered | AC-6 | grep gate above |
| TC-7 | Touch target ≥ sizing.touchTarget | AC-7 | ./gradlew :app:connectedDebugAndroidTest --tests "*.LSButtonInstrumentationTest.touch_target_meets_minimum_size" |
| TC-8 | onClick fires exactly once per tap | AC-8 | ./gradlew :app:connectedDebugAndroidTest --tests "*.LSButtonInstrumentationTest.onClick_fires_exactly_once_per_tap" |
| TC-9 | LSButton.kt contains zero literal color/font/icon refs | AC-9 | grep gate above |
| TC-10 | Release APK contains zero com.nativesandbox entries | AC-10 | assembleRelease + unzip gate |

--------------------------------------------------------------------------------
SCOPE (file-level write permissions)
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/ui/atoms/LSButton.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/atoms/ButtonVariant.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/atoms/ButtonState.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/LSButtonStories.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/AtomStories.kt (MODIFY — register LSButtonStories.all)
- android/app/src/test/java/com/laneshadow/ui/atoms/LSButtonTest.kt (NEW)
- android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSButtonInstrumentationTest.kt (NEW)

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
- Resolve all colors via `LaneShadowTheme.color.action.{variant}.{role}`.
- Use `LSText` (UC-ATM-01-android) for the label — never raw `Text`.
- Use `LSIcon` (UC-ATM-10-android) for the icon slots — never `Icons.*`.
- Use `Modifier.semantics { role = Role.Button }` for accessibility.

⚠️ Ask First:
- Adding a 7th variant.
- Changing the default `state = ButtonState.Default` API.
- Adding a `size` axis (small/medium/large) — currently single height.

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- android/app/src/main/java/com/laneshadow/ui/atoms/LSButton.kt (NEW): the button atom composable
- android/app/src/main/java/com/laneshadow/ui/atoms/ButtonVariant.kt (NEW): six-variant enum
- android/app/src/main/java/com/laneshadow/ui/atoms/ButtonState.kt (NEW): five-state enum
- android/app/src/debug/java/com/laneshadow/sandbox/stories/LSButtonStories.kt (NEW): six stories
- android/app/src/debug/java/com/laneshadow/sandbox/stories/AtomStories.kt (MODIFY): include `LSButtonStories.all`
- android/app/src/test/java/com/laneshadow/ui/atoms/LSButtonTest.kt (NEW): unit tests
- android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSButtonInstrumentationTest.kt (NEW): Compose UI tests

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

For each AC: RED (write failing test) → GREEN (minimal impl) → REFACTOR. Show actual test failure output in RED phase. Never write implementation in RED. Never expand beyond current AC in GREEN.

After all 10 ACs: dispatch kotlin-reviewer.

--------------------------------------------------------------------------------
READING LIST (max 5 files — canonical pattern first)
--------------------------------------------------------------------------------

1. .spec/prds/v2/concepts/uc-atm-02-button.html [PRIMARY PATTERN]
   - Lines: all
   - Focus: REQUIRED READING — variant × state matrix, NEW chip composition

2. .spec/prds/v2/05-uc-atm.md
   - Lines: 50-90
   - Focus: UC-ATM-02 canonical AC bullets

3. .spec/prds/v2/tasks/sprint-02-atoms-foundation-primitives/UC-ATM-01-ios-typography-atoms-lstext-ios-swiftui.md
   - Lines: all
   - Focus: Sibling task — structural pattern only

4. android/app/src/main/java/com/laneshadow/ui/theme/LaneShadowTheme.kt
   - Lines: all
   - Focus: action color tokens, sizing/radius/spacing accessors

5. android/app/src/main/java/com/laneshadow/ui/atoms/LSText.kt (after UC-ATM-01-android lands)
   - Lines: all
   - Focus: Label rendering pattern

--------------------------------------------------------------------------------
EVIDENCE GATES (fast/cheap first)
--------------------------------------------------------------------------------

Gate 1: RED phase evidence per AC.
Gate 2: One test per behavioral AC.
Gate 3: All JUnit pass — `cd android && ./gradlew :app:testDebugUnitTest`.
Gate 4: All Compose UI tests pass — `cd android && ./gradlew :app:connectedDebugAndroidTest`.
Gate 5: Kotlin compile green — `cd android && ./gradlew :app:compileDebugKotlin`.
Gate 6: detekt clean — `cd android && ./gradlew detekt`.
Gate 7: No literal color/font/icons — grep gate above returns zero.
Gate 8: Six stories registered — grep loop returns success.
Gate 9: Release APK clean — zero `com.nativesandbox` entries.
Gate 10: Scope compliance — `git diff --name-only` ⊆ writeAllowed.

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- iOS implementation (UC-ATM-02-ios — runs in parallel under swift-implementer).
- Loading-state spinner integration (uses LSSpinner from UC-ATM-04-android — out of scope: minimal placeholder OK).
- Adding new variants beyond the six in UC-ATM-02.

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** UC-TOK-02 generates `color.action.{primary|secondary|tertiary|outline|ghost|destructive}.{background|foreground|border|pressed|disabled}`. Android has no button atom.

**Gap:** Without `LSButton`, every screen would inline `Button { Text(...) }` with hardcoded colors and Material Icons, defeating the token system.

--------------------------------------------------------------------------------
REVIEW (for kotlin-reviewer)
--------------------------------------------------------------------------------

Must pass (≤5):
- One test per behavioral AC.
- RED evidence present.
- No literal colors, fonts, or Material Icons in LSButton.kt (grep gate).
- Six stories with stable ids `atoms.button.{variant}` registered under `src/debug/`.
- SCOPE respected AND release APK contains zero `com.nativesandbox`.

Should verify (≤5):
- Variant × state matrix exhaustively covered in stories.
- Touch target ≥ 48.dp regardless of label length.
- Disabled state visually distinct AND non-interactive.
- onClick debounced (single fire per tap).
- Light + dark mode both pass color resolution.

Verdict: APPROVED | NEEDS_FIXES

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: UC-TOK-01, UC-TOK-02 (color.action.*), UC-TOK-03 (sizing/radius/spacing), UC-TOK-05, UC-SBX-00-android, UC-ATM-01-android (LSText), UC-ATM-10-android (LSIcon)
Blocks:     UC-MOL-* (every molecule with a button), UC-SCR-*
Parallel:   UC-ATM-02-ios

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN Compose view WHEN LSButton primary rendered THEN bg/fg=color.action.primary.*, height=sizing.component.buttonHeight, radius=radius.md, padding=spacing.4", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests \"com.laneshadow.ui.atoms.LSButtonTest.primary_variant_resolves_action_primary_tokens\"" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN all six ButtonVariant values WHEN rendered THEN each resolves correct color.action.{variant}.* tokens", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests \"com.laneshadow.ui.atoms.LSButtonTest.all_six_variants_resolve_correct_action_tokens\"" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN primary button WHEN pressed THEN bg=color.action.primary.pressed", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests \"com.laneshadow.ui.atoms.LSButtonInstrumentationTest.pressed_state_applies_action_pressed_token\"" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN disabled state WHEN tapped THEN onClick NOT invoked AND bg=color.action.{variant}.disabled", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests \"com.laneshadow.ui.atoms.LSButtonInstrumentationTest.disabled_state_suppresses_click_and_applies_token\"" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN outline + leadingIcon=Sparkle WHEN rendered THEN border=color.action.outline.border, leading icon present with spacing.2 gap", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests \"com.laneshadow.ui.atoms.LSButtonInstrumentationTest.outline_with_leading_icon_renders_chip\"" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN LSButtonStories.kt WHEN composed THEN six stories atoms.button.{variant} registered under src/debug", "verify": "for v in primary secondary tertiary outline ghost destructive; do grep -q \"atoms.button.$v\" android/app/src/debug/java/com/laneshadow/sandbox/stories/LSButtonStories.kt || exit 1; done" },
    { "id": "AC-7", "type": "acceptance_criterion", "description": "GIVEN default LSButton WHEN measured THEN width AND height ≥ sizing.touchTarget", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests \"com.laneshadow.ui.atoms.LSButtonInstrumentationTest.touch_target_meets_minimum_size\"" },
    { "id": "AC-8", "type": "acceptance_criterion", "description": "GIVEN single tap WHEN performed THEN onClick invoked exactly once", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests \"com.laneshadow.ui.atoms.LSButtonInstrumentationTest.onClick_fires_exactly_once_per_tap\"" },
    { "id": "AC-9", "type": "acceptance_criterion", "description": "GIVEN LSButton.kt WHEN grep'd THEN zero Color(0x, Material Icons, or FontFamily literal references", "verify": "! grep -REn 'Color\\(0x|androidx\\.compose\\.material\\.icons|Icons\\.(Filled|Outlined)|FontFamily\\.(Serif|SansSerif|Monospace|Default)' android/app/src/main/java/com/laneshadow/ui/atoms/LSButton.kt" },
    { "id": "AC-10", "type": "acceptance_criterion", "description": "GIVEN release build WHEN APK inspected THEN com.nativesandbox count = 0", "verify": "cd android && ./gradlew :app:assembleRelease && [ \"$(unzip -l app/build/outputs/apk/release/app-release.apk | grep -c com.nativesandbox)\" = \"0\" ]" },
    { "id": "TC-1", "type": "test_criterion", "description": "Primary variant tokens", "maps_to_ac": "AC-1", "verify": "./gradlew :app:testDebugUnitTest --tests \"*.LSButtonTest.primary_variant_resolves_action_primary_tokens\"" },
    { "id": "TC-2", "type": "test_criterion", "description": "All six variants tokens", "maps_to_ac": "AC-2", "verify": "./gradlew :app:testDebugUnitTest --tests \"*.LSButtonTest.all_six_variants_resolve_correct_action_tokens\"" },
    { "id": "TC-3", "type": "test_criterion", "description": "Pressed state token", "maps_to_ac": "AC-3", "verify": "./gradlew :app:connectedDebugAndroidTest --tests \"*.LSButtonInstrumentationTest.pressed_state_applies_action_pressed_token\"" },
    { "id": "TC-4", "type": "test_criterion", "description": "Disabled suppresses click", "maps_to_ac": "AC-4", "verify": "./gradlew :app:connectedDebugAndroidTest --tests \"*.LSButtonInstrumentationTest.disabled_state_suppresses_click_and_applies_token\"" },
    { "id": "TC-5", "type": "test_criterion", "description": "Outline NEW chip", "maps_to_ac": "AC-5", "verify": "./gradlew :app:connectedDebugAndroidTest --tests \"*.LSButtonInstrumentationTest.outline_with_leading_icon_renders_chip\"" },
    { "id": "TC-6", "type": "test_criterion", "description": "Six stories registered", "maps_to_ac": "AC-6", "verify": "grep loop above" },
    { "id": "TC-7", "type": "test_criterion", "description": "Touch target ≥ sizing.touchTarget", "maps_to_ac": "AC-7", "verify": "./gradlew :app:connectedDebugAndroidTest --tests \"*.LSButtonInstrumentationTest.touch_target_meets_minimum_size\"" },
    { "id": "TC-8", "type": "test_criterion", "description": "onClick once per tap", "maps_to_ac": "AC-8", "verify": "./gradlew :app:connectedDebugAndroidTest --tests \"*.LSButtonInstrumentationTest.onClick_fires_exactly_once_per_tap\"" },
    { "id": "TC-9", "type": "test_criterion", "description": "No literal color/font/icon in LSButton.kt", "maps_to_ac": "AC-9", "verify": "! grep -REn 'Color\\(0x|androidx\\.compose\\.material\\.icons|Icons\\.(Filled|Outlined)|FontFamily\\.(Serif|SansSerif|Monospace|Default)' android/app/src/main/java/com/laneshadow/ui/atoms/LSButton.kt" },
    { "id": "TC-10", "type": "test_criterion", "description": "Release APK ships zero sandbox symbols", "maps_to_ac": "AC-10", "verify": "[ \"$(unzip -l android/app/build/outputs/apk/release/app-release.apk | grep -c com.nativesandbox)\" = \"0\" ]" }
  ]
}
-->
