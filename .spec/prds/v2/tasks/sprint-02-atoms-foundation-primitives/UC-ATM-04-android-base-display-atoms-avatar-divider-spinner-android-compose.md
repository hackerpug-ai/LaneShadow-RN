<!-- Task Template v5.1 | FEATURE -->

================================================================================
TASK: UC-ATM-04-android — Base display atoms (`LSAvatar`, `LSDivider`, `LSSpinner`) — Android Compose
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
SPRINT:     [sprint-02-atoms-foundation-primitives](./SPRINT.md)
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer
ESTIMATE:   120 min

RUNTIME_COMMANDS:
  test:         cd android && ./gradlew :app:testDebugUnitTest
  instrumented: cd android && ./gradlew :app:connectedDebugAndroidTest
  typecheck:    cd android && ./gradlew :app:compileDebugKotlin
  lint:         cd android && ./gradlew detekt
  release:      cd android && ./gradlew :app:assembleRelease && unzip -l app/build/outputs/apk/release/app-release.apk | grep -c com.nativesandbox

PRD_REFS:   UC-ATM-04, .spec/prds/v2/05-uc-atm.md, .spec/prds/v2/concepts/uc-atm-04-display.html
DEPENDS_ON: UC-TOK-01, UC-TOK-02, UC-TOK-03 (sizing.avatar.*), UC-TOK-05, UC-SBX-00-android, UC-ATM-01-android (LSText for initials)
BLOCKS:     UC-MOL-* (any molecule consuming an avatar/divider/spinner), UC-SCR-*

PROGRESS: AC-1 none · 0/6 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Three primitive display atoms:
- `LSAvatar(image: Painter? = null, initials: String? = null, size: AvatarSize = AvatarSize.Md)` — circular avatar; renders image when provided, falls back to initials, supports five sizes (`Xs`, `Sm`, `Md`, `Lg`, `Xl`) resolving from `sizing.avatar.{size}`.
- `LSDivider(orientation: DividerOrientation = DividerOrientation.Horizontal)` — 1.dp hairline using `color.border.subtle`.
- `LSSpinner(size: SpinnerSize = SpinnerSize.Md)` — circular indeterminate progress tinted via `color.signal.default`.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)
--------------------------------------------------------------------------------

- NEVER use `Color(0xFF…)` literals — colors resolve through `LaneShadowTheme.color.*`.
- NEVER use `androidx.compose.material.icons.*` or `Icons.Filled/Outlined.*` for the avatar fallback or anywhere else.
- NEVER use `FontFamily.{Serif|SansSerif|Monospace|Default}` — initials use `LSText` from UC-ATM-01-android.
- NEVER write Story previews under `android/app/src/main/**`. Stories live ONLY under `android/app/src/debug/java/com/laneshadow/sandbox/stories/**`.
- NEVER use `Modifier.size(40.dp)` literal for avatar sizing — sizes resolve through `sizing.avatar.{size}` token.
- MUST modify only files listed in SCOPE.writeAllowed.
- STRICTLY no edits to `~/Projects/native-theme/**`, `~/Projects/native-sandbox/**`, or `ios/**`.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] `LSAvatar` composable exists and renders both image and initials variants — maps to AC-1, AC-2 (PRIMARY)
- [ ] All five `AvatarSize` values resolve `sizing.avatar.{size}` token — maps to AC-3
- [ ] `LSDivider` renders 1.dp hairline using `color.border.subtle` — maps to AC-4
- [ ] `LSSpinner` renders circular indeterminate indicator tinted `color.signal.default` — maps to AC-5
- [ ] Stories registered (`atoms.avatar.{size|initials}`, `atoms.divider.horizontal`, `atoms.spinner.md`) under `src/debug/` — maps to AC-6
- [ ] No literal colors/fonts/Material Icons in any of the three atom files — maps to AC-7
- [ ] Release APK contains zero `com.nativesandbox` entries — maps to AC-8
- [ ] Android compile/build green; tests green; detekt clean
- [ ] Only SCOPE.writeAllowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads — ordered happy-path first)
--------------------------------------------------------------------------------

AC-1: LSAvatar renders image variant when image is provided [PRIMARY]
  GIVEN: An Android Compose view importing LaneShadowTheme
  WHEN:  `LSAvatar(image = somePainter, size = AvatarSize.Md)` is rendered
  THEN:  Image is displayed, clipped to a circle, and bounded by `sizing.avatar.md`
  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/atoms/LSAvatarTest.kt
  TEST_FUNCTION: renders_image_variant_clipped_to_circle
  VERIFY:        cd android && ./gradlew :app:testDebugUnitTest --tests "com.laneshadow.ui.atoms.LSAvatarTest.renders_image_variant_clipped_to_circle"

AC-2: LSAvatar falls back to initials when image is null
  GIVEN: An Android Compose view
  WHEN:  `LSAvatar(image = null, initials = "JR", size = AvatarSize.Md)` is rendered
  THEN:  "JR" is displayed centered using LSText (typography.ui.label.md or token-defined initials variant)
  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/atoms/LSAvatarTest.kt
  TEST_FUNCTION: falls_back_to_initials_when_image_null
  VERIFY:        cd android && ./gradlew :app:testDebugUnitTest --tests "com.laneshadow.ui.atoms.LSAvatarTest.falls_back_to_initials_when_image_null"

AC-3: All five AvatarSize values resolve sizing.avatar.{size} token
  GIVEN: All AvatarSize values (Xs, Sm, Md, Lg, Xl)
  WHEN:  Each is rendered
  THEN:  Composable size matches `sizing.avatar.{xs|sm|md|lg|xl}` token exactly
  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/atoms/LSAvatarTest.kt
  TEST_FUNCTION: all_five_sizes_resolve_sizing_avatar_tokens
  VERIFY:        cd android && ./gradlew :app:testDebugUnitTest --tests "com.laneshadow.ui.atoms.LSAvatarTest.all_five_sizes_resolve_sizing_avatar_tokens"

AC-4: LSDivider renders 1.dp hairline using color.border.subtle
  GIVEN: An Android Compose view
  WHEN:  `LSDivider()` is rendered
  THEN:  Thickness == 1.dp, color == `color.border.subtle`, orientation defaults to horizontal
  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/atoms/LSDividerTest.kt
  TEST_FUNCTION: renders_1dp_hairline_using_border_subtle_token
  VERIFY:        cd android && ./gradlew :app:testDebugUnitTest --tests "com.laneshadow.ui.atoms.LSDividerTest.renders_1dp_hairline_using_border_subtle_token"

AC-5: LSSpinner renders indeterminate indicator tinted color.signal.default
  GIVEN: An Android Compose view
  WHEN:  `LSSpinner()` is rendered
  THEN:  CircularProgressIndicator is shown with `color = color.signal.default` and animation is active
  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/atoms/LSSpinnerTest.kt
  TEST_FUNCTION: renders_indeterminate_indicator_with_signal_default_tint
  VERIFY:        cd android && ./gradlew :app:testDebugUnitTest --tests "com.laneshadow.ui.atoms.LSSpinnerTest.renders_indeterminate_indicator_with_signal_default_tint"

AC-6: Stories registered under src/debug for all three atoms
  GIVEN: `android/app/src/debug/java/com/laneshadow/sandbox/stories/LSDisplayStories.kt`
  WHEN:  AtomStories.all is composed
  THEN:  Stories `atoms.avatar.image`, `atoms.avatar.initials`, `atoms.avatar.sizes`, `atoms.divider.horizontal`, `atoms.spinner.md` exist with tier = `ComponentTier.Atom`
  TDD_STATE:     none
  TEST_FILE:     android/app/src/debug/java/com/laneshadow/sandbox/stories/LSDisplayStories.kt
  TEST_FUNCTION: n/a (grep gate)
  VERIFY:        for id in atoms.avatar.image atoms.avatar.initials atoms.avatar.sizes atoms.divider.horizontal atoms.spinner.md; do grep -q "$id" android/app/src/debug/java/com/laneshadow/sandbox/stories/LSDisplayStories.kt || exit 1; done

AC-7: No literal color/font/Material Icons in display atom files (boundary)
  GIVEN: LSAvatar.kt, LSDivider.kt, LSSpinner.kt
  WHEN:  Reviewer greps
  THEN:  Zero matches for forbidden patterns
  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/ui/atoms/{LSAvatar,LSDivider,LSSpinner}.kt
  TEST_FUNCTION: n/a (grep gate)
  VERIFY:        ! grep -REn 'Color\(0x|androidx\.compose\.material\.icons|Icons\.(Filled|Outlined)|FontFamily\.(Serif|SansSerif|Monospace|Default)' android/app/src/main/java/com/laneshadow/ui/atoms/LSAvatar.kt android/app/src/main/java/com/laneshadow/ui/atoms/LSDivider.kt android/app/src/main/java/com/laneshadow/ui/atoms/LSSpinner.kt

AC-8: Release APK contains zero sandbox symbols (boundary gate)
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
| TC-1 | LSAvatar renders image clipped to circle | AC-1 | ./gradlew :app:testDebugUnitTest --tests "*.LSAvatarTest.renders_image_variant_clipped_to_circle" |
| TC-2 | LSAvatar falls back to initials when image null | AC-2 | ./gradlew :app:testDebugUnitTest --tests "*.LSAvatarTest.falls_back_to_initials_when_image_null" |
| TC-3 | All five sizes resolve sizing.avatar tokens | AC-3 | ./gradlew :app:testDebugUnitTest --tests "*.LSAvatarTest.all_five_sizes_resolve_sizing_avatar_tokens" |
| TC-4 | LSDivider 1.dp hairline border.subtle | AC-4 | ./gradlew :app:testDebugUnitTest --tests "*.LSDividerTest.renders_1dp_hairline_using_border_subtle_token" |
| TC-5 | LSSpinner indeterminate signal.default tint | AC-5 | ./gradlew :app:testDebugUnitTest --tests "*.LSSpinnerTest.renders_indeterminate_indicator_with_signal_default_tint" |
| TC-6 | All five display stories registered | AC-6 | grep loop above |
| TC-7 | No literal color/font/icon refs | AC-7 | grep gate above |
| TC-8 | Release APK contains zero com.nativesandbox entries | AC-8 | assembleRelease + unzip gate |

--------------------------------------------------------------------------------
SCOPE (file-level write permissions)
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/ui/atoms/LSAvatar.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/atoms/LSDivider.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/atoms/LSSpinner.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/atoms/AvatarSize.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/atoms/DividerOrientation.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/atoms/SpinnerSize.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/LSDisplayStories.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/AtomStories.kt (MODIFY — register LSDisplayStories.all)
- android/app/src/test/java/com/laneshadow/ui/atoms/LSAvatarTest.kt (NEW)
- android/app/src/test/java/com/laneshadow/ui/atoms/LSDividerTest.kt (NEW)
- android/app/src/test/java/com/laneshadow/ui/atoms/LSSpinnerTest.kt (NEW)

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
- Resolve all sizes via `LaneShadowTheme.sizing.avatar.{size}` (or platform equivalent).
- Use `LSText` for initials — never raw `Text`.
- Use `Modifier.clip(CircleShape)` (the only built-in shape allowed; no token needed for circle).

⚠️ Ask First:
- Adding badge / online-indicator overlays (out of scope; UC-MOL-AvatarBadge owns).
- Adding image loading coordinator (call sites pass a Painter; no Coil/Glide integration here).

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- android/app/src/main/java/com/laneshadow/ui/atoms/LSAvatar.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/atoms/LSDivider.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/atoms/LSSpinner.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/atoms/AvatarSize.kt, DividerOrientation.kt, SpinnerSize.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/LSDisplayStories.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/AtomStories.kt (MODIFY)
- android/app/src/test/java/com/laneshadow/ui/atoms/LSAvatarTest.kt (NEW)
- android/app/src/test/java/com/laneshadow/ui/atoms/LSDividerTest.kt (NEW)
- android/app/src/test/java/com/laneshadow/ui/atoms/LSSpinnerTest.kt (NEW)

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

For each AC: RED → GREEN → REFACTOR.

After all 8 ACs: dispatch kotlin-reviewer.

--------------------------------------------------------------------------------
READING LIST (max 5 files — canonical pattern first)
--------------------------------------------------------------------------------

1. .spec/prds/v2/concepts/uc-atm-04-display.html [PRIMARY PATTERN]
   - Lines: all
   - Focus: REQUIRED READING — visual design for avatar/divider/spinner

2. .spec/prds/v2/05-uc-atm.md
   - Lines: 131-170
   - Focus: UC-ATM-04 canonical AC bullets

3. .spec/prds/v2/tasks/sprint-02-atoms-foundation-primitives/UC-ATM-01-ios-typography-atoms-lstext-ios-swiftui.md
   - Lines: all
   - Focus: Sibling task — structural pattern only

4. android/app/src/main/java/com/laneshadow/ui/theme/LaneShadowTheme.kt
   - Lines: all
   - Focus: sizing.avatar tokens, color.border.subtle, color.signal.default

5. ~/Projects/native-sandbox/RULES.md
   - Sections: §6, §10
   - Focus: Story id format

--------------------------------------------------------------------------------
EVIDENCE GATES (fast/cheap first)
--------------------------------------------------------------------------------

Gate 1: RED phase evidence per AC.
Gate 2: One test per behavioral AC (AC-6/AC-7 = grep, AC-8 = build).
Gate 3: All JUnit pass.
Gate 4: Kotlin compile green.
Gate 5: detekt clean.
Gate 6: No literal color/font/icons grep.
Gate 7: Five stories registered.
Gate 8: Release APK clean.
Gate 9: Scope compliance.

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- iOS implementation (UC-ATM-04-ios — runs in parallel).
- Avatar badge / status overlays (UC-MOL-AvatarBadge).
- Image loading library integration.
- Vertical divider (call sites can pass `DividerOrientation.Vertical` later — not required for v1).

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** UC-TOK-03 generates `sizing.avatar.{xs|sm|md|lg|xl}`. UC-TOK-02 generates `color.border.subtle` and `color.signal.default`. Android has no display primitive atoms.

**Gap:** Without these, every list/profile/loading molecule would inline `Box(Modifier.size(40.dp).clip(CircleShape).background(Color(0xFF...)))` — defeating tokens.

--------------------------------------------------------------------------------
REVIEW (for kotlin-reviewer)
--------------------------------------------------------------------------------

Must pass (≤5):
- One test per behavioral AC.
- RED evidence present.
- No literal colors, fonts, or Material Icons (grep gate).
- Five stories with stable ids registered under `src/debug/`.
- SCOPE respected AND release APK contains zero `com.nativesandbox`.

Should verify (≤5):
- Avatar circle clip applies regardless of source aspect ratio.
- Initials center horizontally and vertically.
- Spinner animates (Compose recomposition / infinite transition).
- Divider thickness exactly 1.dp at all densities.
- Light + dark mode both pass.

Verdict: APPROVED | NEEDS_FIXES

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: UC-TOK-01, UC-TOK-02, UC-TOK-03 (sizing.avatar.*), UC-TOK-05, UC-SBX-00-android, UC-ATM-01-android (LSText for initials)
Blocks:     UC-MOL-* (any molecule consuming an avatar/divider/spinner), UC-SCR-*
Parallel:   UC-ATM-04-ios

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN view WHEN LSAvatar(image=painter,size=Md) rendered THEN image clipped to circle, bounded by sizing.avatar.md", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests \"com.laneshadow.ui.atoms.LSAvatarTest.renders_image_variant_clipped_to_circle\"" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN view WHEN LSAvatar(image=null,initials='JR') rendered THEN initials displayed centered via LSText", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests \"com.laneshadow.ui.atoms.LSAvatarTest.falls_back_to_initials_when_image_null\"" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN all five AvatarSize values WHEN rendered THEN size matches sizing.avatar.{xs|sm|md|lg|xl}", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests \"com.laneshadow.ui.atoms.LSAvatarTest.all_five_sizes_resolve_sizing_avatar_tokens\"" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN view WHEN LSDivider() rendered THEN thickness=1.dp, color=color.border.subtle, horizontal orientation", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests \"com.laneshadow.ui.atoms.LSDividerTest.renders_1dp_hairline_using_border_subtle_token\"" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN view WHEN LSSpinner() rendered THEN CircularProgressIndicator with color=color.signal.default and active animation", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests \"com.laneshadow.ui.atoms.LSSpinnerTest.renders_indeterminate_indicator_with_signal_default_tint\"" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN LSDisplayStories.kt WHEN composed THEN five stories atoms.avatar.{image,initials,sizes}, atoms.divider.horizontal, atoms.spinner.md registered", "verify": "for id in atoms.avatar.image atoms.avatar.initials atoms.avatar.sizes atoms.divider.horizontal atoms.spinner.md; do grep -q \"$id\" android/app/src/debug/java/com/laneshadow/sandbox/stories/LSDisplayStories.kt || exit 1; done" },
    { "id": "AC-7", "type": "acceptance_criterion", "description": "GIVEN three atom files WHEN grep'd THEN zero Color(0x, Material Icons, FontFamily literal references", "verify": "! grep -REn 'Color\\(0x|androidx\\.compose\\.material\\.icons|Icons\\.(Filled|Outlined)|FontFamily\\.(Serif|SansSerif|Monospace|Default)' android/app/src/main/java/com/laneshadow/ui/atoms/LSAvatar.kt android/app/src/main/java/com/laneshadow/ui/atoms/LSDivider.kt android/app/src/main/java/com/laneshadow/ui/atoms/LSSpinner.kt" },
    { "id": "AC-8", "type": "acceptance_criterion", "description": "GIVEN release build WHEN APK inspected THEN com.nativesandbox count = 0", "verify": "cd android && ./gradlew :app:assembleRelease && [ \"$(unzip -l app/build/outputs/apk/release/app-release.apk | grep -c com.nativesandbox)\" = \"0\" ]" },
    { "id": "TC-1", "type": "test_criterion", "description": "Avatar image variant", "maps_to_ac": "AC-1", "verify": "./gradlew :app:testDebugUnitTest --tests \"*.LSAvatarTest.renders_image_variant_clipped_to_circle\"" },
    { "id": "TC-2", "type": "test_criterion", "description": "Avatar initials fallback", "maps_to_ac": "AC-2", "verify": "./gradlew :app:testDebugUnitTest --tests \"*.LSAvatarTest.falls_back_to_initials_when_image_null\"" },
    { "id": "TC-3", "type": "test_criterion", "description": "Avatar five sizes", "maps_to_ac": "AC-3", "verify": "./gradlew :app:testDebugUnitTest --tests \"*.LSAvatarTest.all_five_sizes_resolve_sizing_avatar_tokens\"" },
    { "id": "TC-4", "type": "test_criterion", "description": "Divider 1.dp border.subtle", "maps_to_ac": "AC-4", "verify": "./gradlew :app:testDebugUnitTest --tests \"*.LSDividerTest.renders_1dp_hairline_using_border_subtle_token\"" },
    { "id": "TC-5", "type": "test_criterion", "description": "Spinner signal.default tint", "maps_to_ac": "AC-5", "verify": "./gradlew :app:testDebugUnitTest --tests \"*.LSSpinnerTest.renders_indeterminate_indicator_with_signal_default_tint\"" },
    { "id": "TC-6", "type": "test_criterion", "description": "Five display stories registered", "maps_to_ac": "AC-6", "verify": "grep loop above" },
    { "id": "TC-7", "type": "test_criterion", "description": "No literal color/font/icon refs", "maps_to_ac": "AC-7", "verify": "! grep -REn 'Color\\(0x|androidx\\.compose\\.material\\.icons|Icons\\.(Filled|Outlined)|FontFamily\\.(Serif|SansSerif|Monospace|Default)' android/app/src/main/java/com/laneshadow/ui/atoms/LSAvatar.kt android/app/src/main/java/com/laneshadow/ui/atoms/LSDivider.kt android/app/src/main/java/com/laneshadow/ui/atoms/LSSpinner.kt" },
    { "id": "TC-8", "type": "test_criterion", "description": "Release APK clean", "maps_to_ac": "AC-8", "verify": "[ \"$(unzip -l android/app/build/outputs/apk/release/app-release.apk | grep -c com.nativesandbox)\" = \"0\" ]" }
  ]
}
-->
