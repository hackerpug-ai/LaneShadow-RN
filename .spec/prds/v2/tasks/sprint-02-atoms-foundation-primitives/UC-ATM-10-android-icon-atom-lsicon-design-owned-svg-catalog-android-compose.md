<!-- Task Template v5.1 | FEATURE -->

================================================================================
TASK: UC-ATM-10-android — Icon atom (`LSIcon`) — design-owned SVG catalog — Android Compose
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
  icons_check:  pnpm icons:check
  release_no_sandbox: cd android && ./gradlew :app:assembleRelease && unzip -l app/build/outputs/apk/release/app-release.apk | grep -c com.nativesandbox

PRD_REFS:   UC-ATM-10, .spec/prds/v2/05-uc-atm.md, .spec/prds/v2/concepts/uc-atm-10-icon.html
DEPENDS_ON: UC-TOK-02, UC-TOK-03, UC-TOK-05 (catalog generation), UC-SBX-00-android
BLOCKS:     UC-ATM-02-android (Button icon), UC-ATM-03-android (Input icon), UC-ATM-07-android (Badge weather + star)

PROGRESS: AC-1 none · 0/9 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

`LSIcon(name: IconName, size: IconSize = IconSize.Md, color: IconColor = IconColor.Content(ContentColor.Primary))` renders a design-owned SVG glyph on Android Compose. Names come from the generated `IconName` enum at `tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/IconName.kt` (UC-TOK-05) — 25 names total: `send, expand, collapse, menu, plus, close, sliders, bookmark, bookmarkFill, star, starFill, pin, clock, sun, rain, wind, storm, therm, route, map, layers, share, heart, heartFill, sparkle, compass, edit, trash, bike, chevR, chevL`. SVGs render as Compose `ImageVector` (or Android vector drawable resources) with a 1.5dp rounded stroke baseline sourced from `LaneShadowTheme.icon.stroke.width`. Sizes resolve from `LaneShadowTheme.sizing.icon.{xs, sm, md, lg, xl}`. Colors resolve through `IconColor` typed sealed union — never raw `Color`.

Material Icons are forbidden everywhere in `android/app/src/main/`.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)
--------------------------------------------------------------------------------

- NEVER reference `androidx.compose.material.icons` or `Icons.(Filled|Outlined).*` anywhere in `android/app/src/main/` — zero matches required across the whole module.
- NEVER expose a raw `Color` parameter on `LSIcon` — only the typed `IconColor` sealed union (resolves through `color.content.*`, `color.signal.*`, `color.status.*`, `color.weather.*`).
- NEVER hardcode `Color(0xFF…)` literals.
- NEVER hardcode stroke width — MUST consume `LaneShadowTheme.icon.stroke.width`.
- NEVER hardcode icon sizes — MUST consume `LaneShadowTheme.sizing.icon.{xs|sm|md|lg|xl}`.
- NEVER place sandbox stories under `android/app/src/main/**`.
- MUST modify only files listed in SCOPE.writeAllowed.
- STRICTLY no edits to `~/Projects/native-theme/**`, `~/Projects/native-sandbox/**`, or `tokens/**` (the generated `IconName` enum lives in `tokens/`; this task only consumes it).

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] `LSIcon` composable exists at `android/app/src/main/java/com/laneshadow/ui/atoms/LSIcon.kt` accepting `name: IconName`, `size: IconSize = IconSize.Md`, `color: IconColor = IconColor.Content(ContentColor.Primary)` — maps to AC-1 (PRIMARY)
- [ ] `IconSize` sealed/enum union with `Xs, Sm, Md, Lg, Xl` cases mapping to `sizing.icon.*` — maps to AC-1, AC-2
- [ ] `IconColor` sealed union: `Content(ContentColor)`, `Signal`, `Status(StatusColor)`, `Weather(WeatherColor)` — maps to AC-3
- [ ] All 25 `IconName` cases render without crash — maps to AC-4
- [ ] Stroke width resolves through `icon.stroke.width` token — maps to AC-2
- [ ] Raw `Color` parameter rejected at compile-time — maps to AC-5
- [ ] Catalog story `atoms.icon.catalog` and color-overrides story `atoms.icon.colorOverrides` registered — maps to AC-6
- [ ] Zero matches for Material Icons across `android/app/src/main/` — maps to AC-7
- [ ] `pnpm icons:check` passes — maps to AC-8
- [ ] Release APK contains zero `com.nativesandbox` references — maps to AC-9
- [ ] Detekt clean; `compileDebugKotlin` green; instrumented + unit tests pass

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads — ordered happy-path first)
--------------------------------------------------------------------------------

AC-1: LSIcon renders compass at sizing.icon.md with token stroke + default content color [PRIMARY]
  GIVEN: A Compose host providing `LaneShadowTheme`
  WHEN:  Developer renders `LSIcon(name = IconName.compass)`
  THEN:  Measured size equals `LaneShadowTheme.sizing.icon.md`; stroke width equals `LaneShadowTheme.icon.stroke.width` (1.5dp baseline); foreground color equals `LaneShadowTheme.color.content.primary`
  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSIconInstrumentationTest.kt
  TEST_FUNCTION: icon_compass_md_resolves_size_stroke_and_default_color
  VERIFY:        cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.atoms.LSIconInstrumentationTest.icon_compass_md_resolves_size_stroke_and_default_color

AC-2: IconSize enum maps each case to sizing.icon.* token (xs/sm/md/lg/xl)
  GIVEN: `IconSize.kt`
  WHEN:  Each case is mapped to its dp value via the theme
  THEN:  Resolved dp values equal `LaneShadowTheme.sizing.icon.{xs,sm,md,lg,xl}` from the generated theme; no `.dp` literal in `IconSize.kt` outside of theme lookup
  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/atoms/IconSizeTest.kt
  TEST_FUNCTION: iconSize_each_case_maps_to_sizing_token
  VERIFY:        cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.atoms.IconSizeTest.iconSize_each_case_maps_to_sizing_token

AC-3: IconColor.Signal resolves color.signal.default
  GIVEN: A Compose host
  WHEN:  `LSIcon(name = IconName.starFill, color = IconColor.Signal)` composed
  THEN:  Foreground color equals `LaneShadowTheme.color.signal.default`
  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSIconInstrumentationTest.kt
  TEST_FUNCTION: icon_color_signal_resolves_color_signal_default
  VERIFY:        cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.atoms.LSIconInstrumentationTest.icon_color_signal_resolves_color_signal_default

AC-4: All 25 IconName cases render without crash
  GIVEN: A Compose host
  WHEN:  Test iterates `IconName.values()` and composes `LSIcon(name = it)` for each
  THEN:  All 25 compose without throwing; node count == 25
  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSIconCatalogInstrumentationTest.kt
  TEST_FUNCTION: icon_catalog_renders_all_25_names_without_crash
  VERIFY:        cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.atoms.LSIconCatalogInstrumentationTest.icon_catalog_renders_all_25_names_without_crash

AC-5: Raw Color parameter rejected at compile-time (error gate — type-safety)
  GIVEN: `LSIcon` API surface
  WHEN:  Developer attempts `LSIcon(name = IconName.compass, color = Color.Red)`
  THEN:  Kotlin compiler rejects — `color` parameter only accepts `IconColor` sealed union
  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/atoms/LSIconTypeSafetyTest.kt
  TEST_FUNCTION: icon_color_param_rejects_raw_Color
  VERIFY:        cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.atoms.LSIconTypeSafetyTest.icon_color_param_rejects_raw_Color

AC-6: Catalog + color-overrides stories registered with id atoms.icon.*
  GIVEN: `LSIconStories.kt`
  WHEN:  Sandbox aggregator composes atom stories
  THEN:  Stories present with ids `atoms.icon.catalog` (renders all 25 at sizing.icon.md) and `atoms.icon.colorOverrides` (renders sample icons across IconColor variants), all `tier = ComponentTier.Atom`
  TDD_STATE:     none
  TEST_FILE:     android/app/src/debug/java/com/laneshadow/sandbox/stories/LSIconStories.kt
  TEST_FUNCTION: n/a (grep gate)
  VERIFY:        for id in atoms.icon.catalog atoms.icon.colorOverrides; do grep -q "$id" android/app/src/debug/java/com/laneshadow/sandbox/stories/LSIconStories.kt || exit 1; done

AC-7: ZERO Material Icons references anywhere in android/app/src/main/ (error gate — boundary)
  GIVEN: `android/app/src/main/`
  WHEN:  Reviewer greps recursively
  THEN:  Zero matches for `androidx\.compose\.material\.icons|Icons\.(Filled|Outlined)`
  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/
  TEST_FUNCTION: n/a (grep gate)
  VERIFY:        ! grep -REn 'androidx\.compose\.material\.icons|Icons\.(Filled|Outlined)' android/app/src/main/

AC-8: pnpm icons:check passes (error gate — catalog parity)
  GIVEN: The 25-name design-owned catalog
  WHEN:  `pnpm icons:check` is run
  THEN:  Command exits 0 — catalog SVGs match the generated `IconName` enum exactly
  TDD_STATE:     none
  TEST_FILE:     package.json (icons:check script)
  TEST_FUNCTION: n/a (build gate)
  VERIFY:        pnpm icons:check

AC-9: Release APK contains zero sandbox references (error gate — release hygiene)
  GIVEN: A release build
  WHEN:  `./gradlew :app:assembleRelease` is run and APK is inspected
  THEN:  `unzip -l app-release.apk | grep -c com.nativesandbox` returns 0
  TDD_STATE:     none
  TEST_FILE:     android/app/build.gradle.kts
  TEST_FUNCTION: n/a (build gate)
  VERIFY:        cd android && ./gradlew :app:assembleRelease && [ "$(unzip -l app/build/outputs/apk/release/app-release.apk | grep -c com.nativesandbox)" = "0" ]

--------------------------------------------------------------------------------
TEST CRITERIA (boolean — each maps to one AC)
--------------------------------------------------------------------------------

| ID  | Statement | Maps to | Verify |
|-----|-----------|---------|--------|
| TC-1 | LSIcon compass at Md resolves sizing.icon.md + icon.stroke.width + color.content.primary | AC-1 | gradlew connectedDebugAndroidTest …icon_compass_md_resolves_size_stroke_and_default_color |
| TC-2 | IconSize maps each case to sizing.icon.* token | AC-2 | gradlew testDebugUnitTest …iconSize_each_case_maps_to_sizing_token |
| TC-3 | IconColor.Signal resolves color.signal.default | AC-3 | gradlew connectedDebugAndroidTest …icon_color_signal_resolves_color_signal_default |
| TC-4 | All 25 IconName cases render without crash | AC-4 | gradlew connectedDebugAndroidTest …icon_catalog_renders_all_25_names_without_crash |
| TC-5 | Raw Color parameter rejected at compile-time | AC-5 | gradlew testDebugUnitTest …icon_color_param_rejects_raw_Color |
| TC-6 | atoms.icon.catalog + atoms.icon.colorOverrides stories registered | AC-6 | grep gate above |
| TC-7 | Zero Material Icons across android/app/src/main/ | AC-7 | grep gate above |
| TC-8 | pnpm icons:check exits 0 | AC-8 | pnpm icons:check |
| TC-9 | Release APK clean of sandbox refs | AC-9 | unzip+grep gate above |

--------------------------------------------------------------------------------
SCOPE (file-level write permissions)
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/ui/atoms/LSIcon.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/atoms/IconSize.kt (NEW — sealed/enum + theme mapping)
- android/app/src/main/java/com/laneshadow/ui/atoms/IconColor.kt (NEW — sealed union)
- android/app/src/main/res/drawable/ic_*.xml (NEW — vector drawables for the 25 names IF needed; alternatively ImageVector definitions in source)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/LSIconStories.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/LaneShadowStories.kt (MODIFY — register LSIconStories)
- android/app/src/test/java/com/laneshadow/ui/atoms/IconSizeTest.kt (NEW)
- android/app/src/test/java/com/laneshadow/ui/atoms/LSIconTypeSafetyTest.kt (NEW)
- android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSIconInstrumentationTest.kt (NEW)
- android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSIconCatalogInstrumentationTest.kt (NEW)

writeProhibited:
- ios/** — swift-implementer scope
- ~/Projects/native-theme/** — schema upstream
- ~/Projects/native-sandbox/** — runtime upstream
- tokens/** — generator output (UC-TOK-05 owns IconName enum + SVG catalog source)
- android/app/src/main/** for sandbox story files (stories DEBUG-ONLY)
- Anything not explicitly listed above

--------------------------------------------------------------------------------
BOUNDARIES (✅ Always / ⚠️ Ask First)
--------------------------------------------------------------------------------

✅ Always:
- Consume `IconName` from the generated enum at `tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/`.
- Resolve sizes through `LaneShadowTheme.sizing.icon.*`.
- Resolve stroke width through `LaneShadowTheme.icon.stroke.width`.
- Resolve colors through the `IconColor` sealed union.
- Place all story code under `android/app/src/debug/`.

⚠️ Ask First:
- Adding a 26th icon name — must originate from UC-TOK-05 catalog regeneration.
- Adding a new IconColor case — must align with existing color token namespace.
- Loading SVGs at runtime (network/dynamic) — this atom is bundled-asset only.

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- android/app/src/main/java/com/laneshadow/ui/atoms/LSIcon.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/atoms/IconSize.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/atoms/IconColor.kt (NEW)
- android/app/src/main/res/drawable/ic_*.xml (NEW — if vector-drawable approach)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/LSIconStories.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/LaneShadowStories.kt (MODIFY)
- android/app/src/test/java/com/laneshadow/ui/atoms/IconSizeTest.kt (NEW)
- android/app/src/test/java/com/laneshadow/ui/atoms/LSIconTypeSafetyTest.kt (NEW)
- android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSIconInstrumentationTest.kt (NEW)
- android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSIconCatalogInstrumentationTest.kt (NEW)

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

For each AC: RED (write failing test) → GREEN (minimal impl) → REFACTOR. Show actual test failure output in RED phase. Never write implementation in RED. Never expand beyond current AC in GREEN.

After all 9 ACs: dispatch kotlin-reviewer.

--------------------------------------------------------------------------------
READING LIST (max 5 files — canonical pattern first)
--------------------------------------------------------------------------------

1. .spec/prds/v2/concepts/uc-atm-10-icon.html [PRIMARY PATTERN]
   - Lines: all
   - Focus: REQUIRED READING — visual catalog of all 25 icons + stroke style + size matrix

2. .spec/prds/v2/05-uc-atm.md
   - Lines: section UC-ATM-10
   - Focus: Canonical AC bullets

3. tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/IconName.kt
   - Lines: all
   - Focus: The 25-name enum this atom consumes

4. tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/Theme.kt
   - Lines: all
   - Focus: `sizing.icon.*`, `icon.stroke.width`, `color.content.*`, `color.signal.*`, `color.status.*`, `color.weather.*`

5. ~/Projects/native-sandbox/RULES.md
   - Sections: §6 (Story contract), §10 (ArgTypes discipline)
   - Focus: Story id format `atoms.{component}.{variant}`, ComponentTier.Atom

--------------------------------------------------------------------------------
EVIDENCE GATES (fast/cheap first)
--------------------------------------------------------------------------------

Gate 1: RED phase evidence (TDD_STATE shows red before green per AC).
Gate 2: One test per behavioral AC; AC-6/AC-7/AC-8/AC-9 = grep/build gates.
Gate 3: Unit tests pass — `cd android && ./gradlew :app:testDebugUnitTest` exits 0.
Gate 4: Instrumented tests pass — `cd android && ./gradlew :app:connectedDebugAndroidTest` exits 0.
Gate 5: compileDebugKotlin green.
Gate 6: detekt clean.
Gate 7: Zero Material Icons across `android/app/src/main/`.
Gate 8: `pnpm icons:check` exits 0.
Gate 9: Release APK has zero `com.nativesandbox` references.
Gate 10: Scope compliance — `git diff --name-only` ⊆ writeAllowed.

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- iOS implementation (UC-ATM-10-ios — swift-implementer parallel).
- Adding new icons beyond the 25-name catalog — escalate to UC-TOK-05 owner.
- Animated icons — defer to a separate task.
- Material Icons fallback — explicitly disallowed.

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** UC-TOK-05 generates the `IconName` enum and SVG catalog assets. UC-TOK-02/03 generate `color.*`, `sizing.icon.*`, and `icon.stroke.width`. Android currently has no icon atom and is at risk of inlining `androidx.compose.material.icons.Icons.Filled.*` in downstream atoms (Button, Input) and molecules.

**Gap:** Without LSIcon, the entire UC-ATM-* sprint can leak Material Icons into production, defeating the design-owned catalog promise.

--------------------------------------------------------------------------------
REVIEW (for kotlin-reviewer)
--------------------------------------------------------------------------------

Must pass (≤5):
- One test per behavioral AC; instrumented tests verify token-resolved size, stroke, and color per IconColor variant.
- RED evidence in TDD_STATE.
- Zero Material Icons across `android/app/src/main/` (grep gate).
- Both `atoms.icon.catalog` and `atoms.icon.colorOverrides` stories registered under DEBUG source set.
- SCOPE respected (`git diff --name-only` ⊆ writeAllowed).

Should verify (≤5):
- IconColor is a true sealed union with Content/Signal/Status/Weather variants — never raw `Color`.
- IconSize maps each case via theme lookup — no `.dp` literals in IconSize.kt outside theme call.
- All 25 IconName cases render in the catalog instrumentation test.
- Test naming follows `{condition}_{expected}` snake-case convention.
- `pnpm icons:check` exits 0; release APK gate exits 0 sandbox refs.

Verdict: APPROVED | NEEDS_FIXES

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: UC-TOK-02 (color tokens), UC-TOK-03 (sizing + icon.stroke.width), UC-TOK-05 (catalog generation — IconName enum + SVG assets), UC-SBX-00-android
Blocks:     UC-ATM-02-android (Button icon), UC-ATM-03-android (Input icon), UC-ATM-07-android (Badge weather + star)
Parallel:   UC-ATM-10-ios

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN host WHEN LSIcon(compass) composed THEN size=sizing.icon.md, stroke=icon.stroke.width, foreground=color.content.primary", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.atoms.LSIconInstrumentationTest.icon_compass_md_resolves_size_stroke_and_default_color" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN IconSize cases WHEN mapped THEN dp values equal sizing.icon.{xs,sm,md,lg,xl}", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.atoms.IconSizeTest.iconSize_each_case_maps_to_sizing_token" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN host WHEN LSIcon(starFill, Signal) composed THEN foreground=color.signal.default", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.atoms.LSIconInstrumentationTest.icon_color_signal_resolves_color_signal_default" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN IconName.values() WHEN each composed THEN all 25 render without crash", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.atoms.LSIconCatalogInstrumentationTest.icon_catalog_renders_all_25_names_without_crash" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN LSIcon API WHEN raw Color passed THEN Kotlin compiler rejects", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.atoms.LSIconTypeSafetyTest.icon_color_param_rejects_raw_Color" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN LSIconStories.kt WHEN aggregator composes THEN atoms.icon.catalog and atoms.icon.colorOverrides stories registered as ComponentTier.Atom", "verify": "for id in atoms.icon.catalog atoms.icon.colorOverrides; do grep -q \"$id\" android/app/src/debug/java/com/laneshadow/sandbox/stories/LSIconStories.kt || exit 1; done" },
    { "id": "AC-7", "type": "acceptance_criterion", "description": "GIVEN android/app/src/main/ WHEN grep'd THEN zero Material Icons references", "verify": "! grep -REn 'androidx\\.compose\\.material\\.icons|Icons\\.(Filled|Outlined)' android/app/src/main/" },
    { "id": "AC-8", "type": "acceptance_criterion", "description": "GIVEN catalog WHEN pnpm icons:check runs THEN exits 0", "verify": "pnpm icons:check" },
    { "id": "AC-9", "type": "acceptance_criterion", "description": "GIVEN release build WHEN APK inspected THEN zero com.nativesandbox refs", "verify": "cd android && ./gradlew :app:assembleRelease && [ \"$(unzip -l app/build/outputs/apk/release/app-release.apk | grep -c com.nativesandbox)\" = \"0\" ]" },
    { "id": "TC-1", "type": "test_criterion", "description": "compass Md resolves size+stroke+content.primary", "maps_to_ac": "AC-1", "verify": "gradlew connectedDebugAndroidTest …icon_compass_md_resolves_size_stroke_and_default_color" },
    { "id": "TC-2", "type": "test_criterion", "description": "IconSize maps to sizing.icon tokens", "maps_to_ac": "AC-2", "verify": "gradlew testDebugUnitTest …iconSize_each_case_maps_to_sizing_token" },
    { "id": "TC-3", "type": "test_criterion", "description": "IconColor.Signal resolves color.signal.default", "maps_to_ac": "AC-3", "verify": "gradlew connectedDebugAndroidTest …icon_color_signal_resolves_color_signal_default" },
    { "id": "TC-4", "type": "test_criterion", "description": "All 25 IconName cases render", "maps_to_ac": "AC-4", "verify": "gradlew connectedDebugAndroidTest …icon_catalog_renders_all_25_names_without_crash" },
    { "id": "TC-5", "type": "test_criterion", "description": "Raw Color rejected at compile", "maps_to_ac": "AC-5", "verify": "gradlew testDebugUnitTest …icon_color_param_rejects_raw_Color" },
    { "id": "TC-6", "type": "test_criterion", "description": "Catalog + colorOverrides stories registered", "maps_to_ac": "AC-6", "verify": "grep gate" },
    { "id": "TC-7", "type": "test_criterion", "description": "Zero Material Icons across android/app/src/main/", "maps_to_ac": "AC-7", "verify": "grep gate" },
    { "id": "TC-8", "type": "test_criterion", "description": "pnpm icons:check passes", "maps_to_ac": "AC-8", "verify": "pnpm icons:check" },
    { "id": "TC-9", "type": "test_criterion", "description": "Release APK clean of sandbox refs", "maps_to_ac": "AC-9", "verify": "unzip+grep gate" }
  ]
}
-->
