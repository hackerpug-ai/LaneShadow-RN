<!-- Task Template v5.1 | FEATURE -->

================================================================================
TASK: UC-ATM-05-android — Surface trio (`LSCard`, `LSPanel`, `LSGlassPanel`) — Android Compose
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     L
SPRINT:     [sprint-02-atoms-foundation-primitives](./SPRINT.md)
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer
ESTIMATE:   180 min

RUNTIME_COMMANDS:
  test:         cd android && ./gradlew :app:testDebugUnitTest
  instrumented: cd android && ./gradlew :app:connectedDebugAndroidTest
  typecheck:    cd android && ./gradlew :app:compileDebugKotlin
  lint:         cd android && ./gradlew detekt
  release:      cd android && ./gradlew :app:assembleRelease && unzip -l app/build/outputs/apk/release/app-release.apk | grep -c com.nativesandbox

PRD_REFS:   UC-ATM-05, .spec/prds/v2/05-uc-atm.md, .spec/prds/v2/concepts/uc-atm-05-surface.html
DEPENDS_ON: UC-TOK-01, UC-TOK-02 (color.surface.*, color.accent.*), UC-TOK-03 (radius/spacing/elevation), UC-TOK-05, UC-SBX-00-android
BLOCKS:     UC-MOL-* (every molecule with a container surface), UC-ORG-*, UC-SCR-*

PROGRESS: AC-1 none · 0/9 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Three surface atoms — every other UI piece composes onto one of them:

- `LSCard(content: @Composable () -> Unit)` — `color.surface.card` background, `radius.lg` corners, `elevation.2` shadow, padding `spacing.4`.
- `LSPanel(content: @Composable () -> Unit)` — `color.surface.primary` background, `radius.md` corners, NO shadow, padding `spacing.3`.
- `LSGlassPanel(variant: GlassVariant = GlassVariant.Chrome, content: @Composable () -> Unit)` — `color.surface.glass` background with `Modifier.blur` (or `RenderEffect.createBlurEffect` on API 31+) at 12-14.dp backdrop blur, `radius.xl` corners, `elevation.overlay` shadow. `GlassVariant.Callout(accent: AccentColor)` adds a 3.dp leading stripe in `color.accent.{accent}`.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)
--------------------------------------------------------------------------------

- NEVER use `Color(0xFF…)` literals — colors resolve through `LaneShadowTheme.color.surface.*` / `color.accent.*`.
- NEVER use `androidx.compose.material.icons.*` or `Icons.Filled/Outlined.*`.
- NEVER use `FontFamily.{Serif|SansSerif|Monospace|Default}` — surfaces are containers; text inside is the caller's responsibility.
- NEVER write Story previews under `android/app/src/main/**`. Stories live ONLY under `android/app/src/debug/java/com/laneshadow/sandbox/stories/**`.
- NEVER use `Modifier.padding(16.dp)` / `RoundedCornerShape(12.dp)` literals — must resolve through `spacing.*` and `radius.*` tokens.
- NEVER use `Modifier.shadow(elevation = 4.dp)` literal — must resolve through `elevation.*` token.
- MUST modify only files listed in SCOPE.writeAllowed.
- STRICTLY no edits to `~/Projects/native-theme/**`, `~/Projects/native-sandbox/**`, or `ios/**`.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] `LSCard` composable resolves `color.surface.card`, `radius.lg`, `elevation.2`, `spacing.4` — maps to AC-1 (PRIMARY)
- [ ] `LSPanel` composable resolves `color.surface.primary`, `radius.md`, no elevation, `spacing.3` — maps to AC-2
- [ ] `LSGlassPanel` (Chrome) resolves `color.surface.glass`, `radius.xl`, `elevation.overlay`, applies blur 12-14.dp — maps to AC-3
- [ ] `LSGlassPanel(GlassVariant.Callout(AccentColor.X))` adds 3.dp leading stripe in `color.accent.{accent}` — maps to AC-4
- [ ] All `AccentColor` values resolve through `color.accent.{name}` — maps to AC-5
- [ ] Stories registered (`atoms.card.default`, `atoms.panel.default`, `atoms.glasspanel.chrome`, `atoms.glasspanel.callout.{accent}`) under `src/debug/` — maps to AC-6
- [ ] Backdrop blur falls back gracefully on API < 31 (uses `Modifier.blur` or scrim fallback) — maps to AC-7
- [ ] No literal color/elevation/radius/spacing/font/icon in any of the three surface files — maps to AC-8
- [ ] Release APK contains zero `com.nativesandbox` entries — maps to AC-9
- [ ] Android compile/build green; tests green; detekt clean
- [ ] Only SCOPE.writeAllowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads — ordered happy-path first)
--------------------------------------------------------------------------------

AC-1: LSCard resolves surface.card + radius.lg + elevation.2 + spacing.4 [PRIMARY]
  GIVEN: An Android Compose view importing LaneShadowTheme
  WHEN:  `LSCard { Text("hello") }` is rendered
  THEN:  Background == `color.surface.card`, corner radius == `radius.lg`, elevation == `elevation.2`, content padding == `spacing.4`
  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/atoms/LSCardTest.kt
  TEST_FUNCTION: card_resolves_surface_card_radius_lg_elevation_2_spacing_4
  VERIFY:        cd android && ./gradlew :app:testDebugUnitTest --tests "com.laneshadow.ui.atoms.LSCardTest.card_resolves_surface_card_radius_lg_elevation_2_spacing_4"

AC-2: LSPanel resolves surface.primary + radius.md + no elevation + spacing.3
  GIVEN: An Android Compose view
  WHEN:  `LSPanel { Text("hello") }` is rendered
  THEN:  Background == `color.surface.primary`, corner radius == `radius.md`, elevation == 0.dp, content padding == `spacing.3`
  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/atoms/LSPanelTest.kt
  TEST_FUNCTION: panel_resolves_surface_primary_radius_md_no_elevation_spacing_3
  VERIFY:        cd android && ./gradlew :app:testDebugUnitTest --tests "com.laneshadow.ui.atoms.LSPanelTest.panel_resolves_surface_primary_radius_md_no_elevation_spacing_3"

AC-3: LSGlassPanel(Chrome) resolves surface.glass + radius.xl + elevation.overlay + applies backdrop blur
  GIVEN: An Android Compose view
  WHEN:  `LSGlassPanel(variant = GlassVariant.Chrome) { ... }` is rendered
  THEN:  Background == `color.surface.glass`, corner radius == `radius.xl`, elevation == `elevation.overlay`, AND a `Modifier.blur` (or `RenderEffect.createBlurEffect` on API 31+) at 12-14.dp is applied as backdrop
  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSGlassPanelInstrumentationTest.kt
  TEST_FUNCTION: glasspanel_chrome_resolves_glass_tokens_and_applies_blur
  VERIFY:        cd android && ./gradlew :app:connectedDebugAndroidTest --tests "com.laneshadow.ui.atoms.LSGlassPanelInstrumentationTest.glasspanel_chrome_resolves_glass_tokens_and_applies_blur"

AC-4: LSGlassPanel(Callout(accent)) adds 3.dp leading stripe in color.accent.{accent}
  GIVEN: An Android Compose view
  WHEN:  `LSGlassPanel(variant = GlassVariant.Callout(AccentColor.Velocity)) { ... }` is rendered
  THEN:  A 3.dp wide stripe occupying the leading edge resolves to `color.accent.velocity`
  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/atoms/LSGlassPanelTest.kt
  TEST_FUNCTION: glasspanel_callout_renders_3dp_leading_stripe_with_accent_color
  VERIFY:        cd android && ./gradlew :app:testDebugUnitTest --tests "com.laneshadow.ui.atoms.LSGlassPanelTest.glasspanel_callout_renders_3dp_leading_stripe_with_accent_color"

AC-5: All AccentColor values resolve through color.accent.{name}
  GIVEN: All `AccentColor` values declared in the enum
  WHEN:  Each is passed to `GlassVariant.Callout(accent)`
  THEN:  Stripe color resolves to `color.accent.{name}` for each — no literal, no missing token
  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/atoms/LSGlassPanelTest.kt
  TEST_FUNCTION: all_accent_colors_resolve_through_color_accent_tokens
  VERIFY:        cd android && ./gradlew :app:testDebugUnitTest --tests "com.laneshadow.ui.atoms.LSGlassPanelTest.all_accent_colors_resolve_through_color_accent_tokens"

AC-6: Stories registered for all three surfaces under src/debug
  GIVEN: `android/app/src/debug/java/com/laneshadow/sandbox/stories/LSSurfaceStories.kt`
  WHEN:  AtomStories.all is composed
  THEN:  Stories `atoms.card.default`, `atoms.panel.default`, `atoms.glasspanel.chrome`, AND at least one `atoms.glasspanel.callout.{accent}` exist with tier = `ComponentTier.Atom`
  TDD_STATE:     none
  TEST_FILE:     android/app/src/debug/java/com/laneshadow/sandbox/stories/LSSurfaceStories.kt
  TEST_FUNCTION: n/a (grep gate)
  VERIFY:        for id in atoms.card.default atoms.panel.default atoms.glasspanel.chrome; do grep -q "$id" android/app/src/debug/java/com/laneshadow/sandbox/stories/LSSurfaceStories.kt || exit 1; done && grep -qE 'atoms\.glasspanel\.callout\.[a-z]+' android/app/src/debug/java/com/laneshadow/sandbox/stories/LSSurfaceStories.kt

AC-7: Backdrop blur falls back gracefully on API < 31 (edge — compatibility)
  GIVEN: An Android device / emulator running API 30 or lower
  WHEN:  `LSGlassPanel(variant = GlassVariant.Chrome) { ... }` is rendered
  THEN:  Composable still renders without crash — falls back to `Modifier.blur(...)` at radius 12-14.dp OR a scrim that approximates glass
  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSGlassPanelInstrumentationTest.kt
  TEST_FUNCTION: glasspanel_falls_back_gracefully_on_api_below_31
  VERIFY:        cd android && ./gradlew :app:connectedDebugAndroidTest --tests "com.laneshadow.ui.atoms.LSGlassPanelInstrumentationTest.glasspanel_falls_back_gracefully_on_api_below_31"

AC-8: No literal color/elevation/radius/spacing/font/icon in surface files (boundary)
  GIVEN: LSCard.kt, LSPanel.kt, LSGlassPanel.kt
  WHEN:  Reviewer greps
  THEN:  Zero matches for forbidden patterns
  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/ui/atoms/{LSCard,LSPanel,LSGlassPanel}.kt
  TEST_FUNCTION: n/a (grep gate)
  VERIFY:        ! grep -REn 'Color\(0x|androidx\.compose\.material\.icons|Icons\.(Filled|Outlined)|FontFamily\.(Serif|SansSerif|Monospace|Default)' android/app/src/main/java/com/laneshadow/ui/atoms/LSCard.kt android/app/src/main/java/com/laneshadow/ui/atoms/LSPanel.kt android/app/src/main/java/com/laneshadow/ui/atoms/LSGlassPanel.kt

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
| TC-1 | LSCard tokens (surface.card, radius.lg, elevation.2, spacing.4) | AC-1 | ./gradlew :app:testDebugUnitTest --tests "*.LSCardTest.card_resolves_surface_card_radius_lg_elevation_2_spacing_4" |
| TC-2 | LSPanel tokens (surface.primary, radius.md, no elev, spacing.3) | AC-2 | ./gradlew :app:testDebugUnitTest --tests "*.LSPanelTest.panel_resolves_surface_primary_radius_md_no_elevation_spacing_3" |
| TC-3 | LSGlassPanel(Chrome) tokens + blur applied | AC-3 | ./gradlew :app:connectedDebugAndroidTest --tests "*.LSGlassPanelInstrumentationTest.glasspanel_chrome_resolves_glass_tokens_and_applies_blur" |
| TC-4 | LSGlassPanel(Callout) 3.dp accent stripe | AC-4 | ./gradlew :app:testDebugUnitTest --tests "*.LSGlassPanelTest.glasspanel_callout_renders_3dp_leading_stripe_with_accent_color" |
| TC-5 | All AccentColor values resolve color.accent.{name} | AC-5 | ./gradlew :app:testDebugUnitTest --tests "*.LSGlassPanelTest.all_accent_colors_resolve_through_color_accent_tokens" |
| TC-6 | Surface stories registered (card/panel/glasspanel.chrome + callout.*) | AC-6 | grep loop above |
| TC-7 | Glass panel API<31 fallback | AC-7 | ./gradlew :app:connectedDebugAndroidTest --tests "*.LSGlassPanelInstrumentationTest.glasspanel_falls_back_gracefully_on_api_below_31" |
| TC-8 | No literal color/font/icon in surface files | AC-8 | grep gate above |
| TC-9 | Release APK contains zero com.nativesandbox entries | AC-9 | assembleRelease + unzip gate |

--------------------------------------------------------------------------------
SCOPE (file-level write permissions)
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/ui/atoms/LSCard.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/atoms/LSPanel.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/atoms/LSGlassPanel.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/atoms/GlassVariant.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/atoms/AccentColor.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/LSSurfaceStories.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/AtomStories.kt (MODIFY — register LSSurfaceStories.all)
- android/app/src/test/java/com/laneshadow/ui/atoms/LSCardTest.kt (NEW)
- android/app/src/test/java/com/laneshadow/ui/atoms/LSPanelTest.kt (NEW)
- android/app/src/test/java/com/laneshadow/ui/atoms/LSGlassPanelTest.kt (NEW)
- android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSGlassPanelInstrumentationTest.kt (NEW)

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
- Resolve all colors/radii/elevations/padding via tokens.
- Use `Modifier.blur(...)` for API < 31; `RenderEffect.createBlurEffect(...)` for API 31+.
- Use `Modifier.semantics { isContainer = true }` to surface as container.

⚠️ Ask First:
- Adding pressable / clickable behavior to LSCard (out of scope here — UC-MOL handles).
- Adding additional GlassVariant beyond Chrome / Callout.
- Changing the 3.dp stripe width or the 12-14.dp blur radius range.

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- android/app/src/main/java/com/laneshadow/ui/atoms/LSCard.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/atoms/LSPanel.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/atoms/LSGlassPanel.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/atoms/GlassVariant.kt (NEW): sealed `Chrome | Callout(accent)`
- android/app/src/main/java/com/laneshadow/ui/atoms/AccentColor.kt (NEW): typed enum
- android/app/src/debug/java/com/laneshadow/sandbox/stories/LSSurfaceStories.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/AtomStories.kt (MODIFY)
- Tests as enumerated above

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

For each AC: RED → GREEN → REFACTOR.

After all 9 ACs: dispatch kotlin-reviewer.

--------------------------------------------------------------------------------
READING LIST (max 5 files — canonical pattern first)
--------------------------------------------------------------------------------

1. .spec/prds/v2/concepts/uc-atm-05-surface.html [PRIMARY PATTERN]
   - Lines: all
   - Focus: REQUIRED READING — visual design for card/panel/glass and Callout stripe

2. .spec/prds/v2/05-uc-atm.md
   - Lines: 171-220
   - Focus: UC-ATM-05 canonical AC bullets + GlassPanel variant matrix

3. .spec/prds/v2/tasks/sprint-02-atoms-foundation-primitives/UC-ATM-01-ios-typography-atoms-lstext-ios-swiftui.md
   - Lines: all
   - Focus: Sibling task — structural pattern only

4. android/app/src/main/java/com/laneshadow/ui/theme/LaneShadowTheme.kt
   - Lines: all
   - Focus: surface/accent color tokens, radius/elevation/spacing accessors

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
Gate 7: No literal color/radius/elevation/spacing/font/icons grep.
Gate 8: Stories registered (grep loop).
Gate 9: Release APK clean.
Gate 10: Scope compliance.

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- iOS implementation (UC-ATM-05-ios — runs in parallel).
- Pressable / interactive cards (UC-MOL-PressableCard owns).
- Additional Glass variants beyond Chrome / Callout.
- Custom drop-shadow / blur tuning beyond the 12-14.dp range.

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** UC-TOK-02 generates `color.surface.{card|primary|glass}` and `color.accent.{velocity|trail|gravel|...}`. UC-TOK-03 generates `radius.{md|lg|xl}`, `elevation.{2|overlay}`, `spacing.{3|4}`. Android has no surface atoms.

**Gap:** Without `LSCard`/`LSPanel`/`LSGlassPanel`, every screen would inline `Surface(...)` / `Box(Modifier.background(...).clip(...))` with hardcoded values, defeating tokens AND making glass-panel rendering inconsistent across density buckets.

--------------------------------------------------------------------------------
REVIEW (for kotlin-reviewer)
--------------------------------------------------------------------------------

Must pass (≤5):
- One test per behavioral AC.
- RED evidence present.
- No literal colors, radii, elevations, spacings, fonts, or Material Icons (grep gate).
- Stories with stable ids `atoms.card.default`, `atoms.panel.default`, `atoms.glasspanel.chrome`, `atoms.glasspanel.callout.{accent}` registered under `src/debug/`.
- SCOPE respected AND release APK contains zero `com.nativesandbox`.

Should verify (≤5):
- Glass blur uses `RenderEffect.createBlurEffect` on API 31+; falls back on lower API.
- Callout stripe is exactly 3.dp wide and aligned to leading edge.
- Card vs Panel vs GlassPanel visually distinct in dark + light mode stories.
- Content slot `@Composable () -> Unit` is properly indented with tokenized padding.
- AccentColor enum is exhaustive (no `else -> default` fallback in resolution).

Verdict: APPROVED | NEEDS_FIXES

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: UC-TOK-01, UC-TOK-02 (color.surface.*, color.accent.*), UC-TOK-03 (radius/spacing/elevation), UC-TOK-05, UC-SBX-00-android
Blocks:     UC-MOL-* (every molecule with a container surface), UC-ORG-*, UC-SCR-*
Parallel:   UC-ATM-05-ios

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN view WHEN LSCard {} rendered THEN bg=color.surface.card, radius=radius.lg, elevation=elevation.2, padding=spacing.4", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests \"com.laneshadow.ui.atoms.LSCardTest.card_resolves_surface_card_radius_lg_elevation_2_spacing_4\"" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN view WHEN LSPanel {} rendered THEN bg=color.surface.primary, radius=radius.md, elevation=0, padding=spacing.3", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests \"com.laneshadow.ui.atoms.LSPanelTest.panel_resolves_surface_primary_radius_md_no_elevation_spacing_3\"" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN view WHEN LSGlassPanel(Chrome) rendered THEN bg=color.surface.glass, radius=radius.xl, elevation=elevation.overlay, blur 12-14.dp applied", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests \"com.laneshadow.ui.atoms.LSGlassPanelInstrumentationTest.glasspanel_chrome_resolves_glass_tokens_and_applies_blur\"" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN GlassVariant.Callout(AccentColor.Velocity) WHEN rendered THEN 3.dp leading stripe in color.accent.velocity", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests \"com.laneshadow.ui.atoms.LSGlassPanelTest.glasspanel_callout_renders_3dp_leading_stripe_with_accent_color\"" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN all AccentColor values WHEN passed to Callout THEN each resolves color.accent.{name}", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests \"com.laneshadow.ui.atoms.LSGlassPanelTest.all_accent_colors_resolve_through_color_accent_tokens\"" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN LSSurfaceStories.kt WHEN composed THEN atoms.card.default, atoms.panel.default, atoms.glasspanel.chrome, atoms.glasspanel.callout.* registered under src/debug", "verify": "for id in atoms.card.default atoms.panel.default atoms.glasspanel.chrome; do grep -q \"$id\" android/app/src/debug/java/com/laneshadow/sandbox/stories/LSSurfaceStories.kt || exit 1; done && grep -qE 'atoms\\.glasspanel\\.callout\\.[a-z]+' android/app/src/debug/java/com/laneshadow/sandbox/stories/LSSurfaceStories.kt" },
    { "id": "AC-7", "type": "acceptance_criterion", "description": "GIVEN API < 31 WHEN LSGlassPanel rendered THEN no crash; falls back to Modifier.blur or scrim", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests \"com.laneshadow.ui.atoms.LSGlassPanelInstrumentationTest.glasspanel_falls_back_gracefully_on_api_below_31\"" },
    { "id": "AC-8", "type": "acceptance_criterion", "description": "GIVEN three surface files WHEN grep'd THEN zero Color(0x, Material Icons, FontFamily literal references", "verify": "! grep -REn 'Color\\(0x|androidx\\.compose\\.material\\.icons|Icons\\.(Filled|Outlined)|FontFamily\\.(Serif|SansSerif|Monospace|Default)' android/app/src/main/java/com/laneshadow/ui/atoms/LSCard.kt android/app/src/main/java/com/laneshadow/ui/atoms/LSPanel.kt android/app/src/main/java/com/laneshadow/ui/atoms/LSGlassPanel.kt" },
    { "id": "AC-9", "type": "acceptance_criterion", "description": "GIVEN release build WHEN APK inspected THEN com.nativesandbox count = 0", "verify": "cd android && ./gradlew :app:assembleRelease && [ \"$(unzip -l app/build/outputs/apk/release/app-release.apk | grep -c com.nativesandbox)\" = \"0\" ]" },
    { "id": "TC-1", "type": "test_criterion", "description": "Card tokens", "maps_to_ac": "AC-1", "verify": "./gradlew :app:testDebugUnitTest --tests \"*.LSCardTest.card_resolves_surface_card_radius_lg_elevation_2_spacing_4\"" },
    { "id": "TC-2", "type": "test_criterion", "description": "Panel tokens", "maps_to_ac": "AC-2", "verify": "./gradlew :app:testDebugUnitTest --tests \"*.LSPanelTest.panel_resolves_surface_primary_radius_md_no_elevation_spacing_3\"" },
    { "id": "TC-3", "type": "test_criterion", "description": "Glass Chrome tokens + blur", "maps_to_ac": "AC-3", "verify": "./gradlew :app:connectedDebugAndroidTest --tests \"*.LSGlassPanelInstrumentationTest.glasspanel_chrome_resolves_glass_tokens_and_applies_blur\"" },
    { "id": "TC-4", "type": "test_criterion", "description": "Callout 3.dp accent stripe", "maps_to_ac": "AC-4", "verify": "./gradlew :app:testDebugUnitTest --tests \"*.LSGlassPanelTest.glasspanel_callout_renders_3dp_leading_stripe_with_accent_color\"" },
    { "id": "TC-5", "type": "test_criterion", "description": "All accent colors resolve", "maps_to_ac": "AC-5", "verify": "./gradlew :app:testDebugUnitTest --tests \"*.LSGlassPanelTest.all_accent_colors_resolve_through_color_accent_tokens\"" },
    { "id": "TC-6", "type": "test_criterion", "description": "Surface stories registered", "maps_to_ac": "AC-6", "verify": "grep loop above" },
    { "id": "TC-7", "type": "test_criterion", "description": "API<31 graceful fallback", "maps_to_ac": "AC-7", "verify": "./gradlew :app:connectedDebugAndroidTest --tests \"*.LSGlassPanelInstrumentationTest.glasspanel_falls_back_gracefully_on_api_below_31\"" },
    { "id": "TC-8", "type": "test_criterion", "description": "No literal color/font/icon refs", "maps_to_ac": "AC-8", "verify": "! grep -REn 'Color\\(0x|androidx\\.compose\\.material\\.icons|Icons\\.(Filled|Outlined)|FontFamily\\.(Serif|SansSerif|Monospace|Default)' android/app/src/main/java/com/laneshadow/ui/atoms/LSCard.kt android/app/src/main/java/com/laneshadow/ui/atoms/LSPanel.kt android/app/src/main/java/com/laneshadow/ui/atoms/LSGlassPanel.kt" },
    { "id": "TC-9", "type": "test_criterion", "description": "Release APK clean", "maps_to_ac": "AC-9", "verify": "[ \"$(unzip -l android/app/build/outputs/apk/release/app-release.apk | grep -c com.nativesandbox)\" = \"0\" ]" }
  ]
}
-->
