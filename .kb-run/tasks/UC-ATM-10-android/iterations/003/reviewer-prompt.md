# kb-run Reviewer Prompt

You are kotlin-reviewer for kb-run task UC-ATM-10-android. This is a separate read-only review pass. Do not edit files, do not commit, do not modify .kb-run state.

Return ONLY valid JSON matching this schema:
{
  "verdict": "APPROVED | NEEDS_FIXES",
  "confidence": "HIGH | MEDIUM | LOW",
  "findings": [
    {
      "severity": "CRITICAL | HIGH | MEDIUM | LOW",
      "location": "file:line or symbol",
      "evidence": "specific code or behavior",
      "fix": "actionable remediation"
    }
  ],
  "requirements": [
    {
      "id": "AC-1",
      "satisfied": true,
      "evidence": "file/test output",
      "remediation": null
    }
  ],
  "summary": "short verdict summary"
}

APPROVED is valid only when every requirement is satisfied and there are no CRITICAL or HIGH findings.

## Task Requirements
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

## Implementer Commit
870d346c2030f7e694d8fc839901f4cffc58beec

## Diff Stat
 .../ui/atoms/LSIconCatalogInstrumentationTest.kt   |  41 ++++
 .../ui/atoms/LSIconInstrumentationTest.kt          |  68 ++++++
 .../com/laneshadow/sandbox/stories/AtomsStories.kt |   4 +-
 .../laneshadow/sandbox/stories/LSIconStories.kt    | 103 +++++++++
 .../main/java/com/laneshadow/ui/atoms/IconColor.kt |  70 ++++++
 .../main/java/com/laneshadow/ui/atoms/IconSize.kt  |  92 ++++++++
 .../main/java/com/laneshadow/ui/atoms/LSIcon.kt    | 246 +++++++++++++++++++++
 android/app/src/main/res/drawable/ic_bike.xml      |  36 +++
 android/app/src/main/res/drawable/ic_bookmark.xml  |  12 +
 .../app/src/main/res/drawable/ic_bookmark_fill.xml |  12 +
 android/app/src/main/res/drawable/ic_chev_l.xml    |  12 +
 android/app/src/main/res/drawable/ic_chev_r.xml    |  12 +
 android/app/src/main/res/drawable/ic_clock.xml     |  18 ++
 android/app/src/main/res/drawable/ic_close.xml     |  18 ++
 android/app/src/main/res/drawable/ic_collapse.xml  |  30 +++
 android/app/src/main/res/drawable/ic_compass.xml   |  18 ++
 android/app/src/main/res/drawable/ic_edit.xml      |  18 ++
 android/app/src/main/res/drawable/ic_expand.xml    |  30 +++
 android/app/src/main/res/drawable/ic_heart.xml     |  12 +
 .../app/src/main/res/drawable/ic_heart_fill.xml    |  12 +
 android/app/src/main/res/drawable/ic_layers.xml    |  24 ++
 android/app/src/main/res/drawable/ic_map.xml       |  24 ++
 android/app/src/main/res/drawable/ic_menu.xml      |  24 ++
 android/app/src/main/res/drawable/ic_pin.xml       |  18 ++
 android/app/src/main/res/drawable/ic_plus.xml      |  18 ++
 android/app/src/main/res/drawable/ic_rain.xml      |  30 +++
 android/app/src/main/res/drawable/ic_route.xml     |  12 +
 android/app/src/main/res/drawable/ic_send.xml      |  18 ++
 android/app/src/main/res/drawable/ic_share.xml     |  36 +++
 android/app/src/main/res/drawable/ic_sliders.xml   |  42 ++++
 android/app/src/main/res/drawable/ic_sparkle.xml   |  12 +
 android/app/src/main/res/drawable/ic_star.xml      |  12 +
 android/app/src/main/res/drawable/ic_star_fill.xml |  12 +
 android/app/src/main/res/drawable/ic_storm.xml     |  18 ++
 android/app/src/main/res/drawable/ic_sun.xml       |  60 +++++
 android/app/src/main/res/drawable/ic_therm.xml     |  12 +
 android/app/src/main/res/drawable/ic_trash.xml     |  18 ++
 android/app/src/main/res/drawable/ic_wind.xml      |  12 +
 .../java/com/laneshadow/ui/atoms/IconSizeTest.kt   |  34 +++
 .../laneshadow/ui/atoms/LSIconTypeSafetyTest.kt    |  31 +++
 40 files changed, 1328 insertions(+), 3 deletions(-)

## Validation Output
COMMAND: cd android && ./gradlew :app:testDebugUnitTest --tests "com.laneshadow.ui.atoms.IconSizeTest" --tests "com.laneshadow.ui.atoms.LSIconTypeSafetyTest"
> Task :android:library:preBuild UP-TO-DATE
> Task :app:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :kotlin:primitives:preBuild UP-TO-DATE
> Task :android:library:preDebugBuild UP-TO-DATE
> Task :kotlin:primitives:preDebugBuild UP-TO-DATE
> Task :app:preBuild UP-TO-DATE
> Task :android:library:writeDebugAarMetadata UP-TO-DATE
> Task :kotlin:primitives:writeDebugAarMetadata UP-TO-DATE
> Task :android:library:generateDebugResValues UP-TO-DATE
> Task :app:preDebugBuild UP-TO-DATE
> Task :app:generateDebugBuildConfig UP-TO-DATE
> Task :android:library:generateDebugResources UP-TO-DATE
> Task :kotlin:primitives:generateDebugResValues UP-TO-DATE
> Task :theme:preBuild UP-TO-DATE
> Task :kotlin:primitives:generateDebugResources UP-TO-DATE
> Task :theme:preDebugBuild UP-TO-DATE
> Task :android:library:packageDebugResources UP-TO-DATE
> Task :theme:writeDebugAarMetadata UP-TO-DATE
> Task :android:library:extractDeepLinksDebug UP-TO-DATE
> Task :kotlin:primitives:packageDebugResources UP-TO-DATE
> Task :android:library:processDebugManifest UP-TO-DATE
> Task :kotlin:primitives:extractDeepLinksDebug UP-TO-DATE
> Task :kotlin:primitives:processDebugManifest UP-TO-DATE
> Task :android:library:parseDebugLocalResources UP-TO-DATE
> Task :kotlin:primitives:parseDebugLocalResources UP-TO-DATE
> Task :android:library:generateDebugRFile UP-TO-DATE
> Task :kotlin:primitives:generateDebugRFile UP-TO-DATE
> Task :android:library:compileDebugLibraryResources UP-TO-DATE
> Task :kotlin:primitives:compileDebugLibraryResources UP-TO-DATE
> Task :android:library:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :kotlin:primitives:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :android:library:javaPreCompileDebug UP-TO-DATE
> Task :app:checkDebugAarMetadata UP-TO-DATE
> Task :app:generateDebugResValues UP-TO-DATE
> Task :theme:generateDebugResValues UP-TO-DATE
> Task :theme:generateDebugResources UP-TO-DATE
> Task :theme:packageDebugResources UP-TO-DATE
> Task :kotlin:primitives:compileDebugKotlin UP-TO-DATE
> Task :kotlin:primitives:javaPreCompileDebug UP-TO-DATE
> Task :kotlin:primitives:compileDebugJavaWithJavac NO-SOURCE
> Task :app:mapDebugSourceSetPaths UP-TO-DATE
> Task :kotlin:primitives:bundleLibCompileToJarDebug UP-TO-DATE
> Task :app:generateDebugResources UP-TO-DATE
> Task :kotlin:primitives:processDebugJavaRes UP-TO-DATE
> Task :kotlin:primitives:bundleLibRuntimeToJarDebug UP-TO-DATE
> Task :app:mergeDebugResources UP-TO-DATE
> Task :app:packageDebugResources UP-TO-DATE
> Task :app:parseDebugLocalResources UP-TO-DATE
> Task :app:createDebugCompatibleScreenManifests UP-TO-DATE
> Task :app:extractDeepLinksDebug UP-TO-DATE
> Task :theme:extractDeepLinksDebug UP-TO-DATE
> Task :theme:processDebugManifest UP-TO-DATE
> Task :app:processDebugMainManifest UP-TO-DATE
> Task :app:processDebugManifest UP-TO-DATE
> Task :app:processDebugManifestForPackage UP-TO-DATE
> Task :android:library:compileDebugKotlin UP-TO-DATE
> Task :theme:compileDebugLibraryResources UP-TO-DATE
> Task :android:library:compileDebugJavaWithJavac NO-SOURCE
> Task :theme:parseDebugLocalResources UP-TO-DATE
> Task :android:library:bundleLibCompileToJarDebug UP-TO-DATE
> Task :theme:generateDebugRFile UP-TO-DATE
> Task :android:library:processDebugJavaRes UP-TO-DATE
> Task :android:library:bundleLibRuntimeToJarDebug UP-TO-DATE
> Task :app:processDebugResources UP-TO-DATE
> Task :theme:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :theme:compileDebugKotlin UP-TO-DATE
> Task :theme:javaPreCompileDebug UP-TO-DATE
> Task :theme:compileDebugJavaWithJavac NO-SOURCE
> Task :theme:bundleLibCompileToJarDebug UP-TO-DATE
> Task :app:compileDebugKotlin UP-TO-DATE
> Task :app:javaPreCompileDebug UP-TO-DATE
> Task :app:compileDebugJavaWithJavac UP-TO-DATE
> Task :app:bundleDebugClassesToRuntimeJar UP-TO-DATE
> Task :app:bundleDebugClassesToCompileJar UP-TO-DATE
> Task :app:compileDebugUnitTestKotlin UP-TO-DATE
> Task :app:preDebugUnitTestBuild UP-TO-DATE
> Task :app:javaPreCompileDebugUnitTest UP-TO-DATE
> Task :app:compileDebugUnitTestJavaWithJavac NO-SOURCE
> Task :app:processDebugJavaRes UP-TO-DATE
> Task :app:processDebugUnitTestJavaRes UP-TO-DATE
> Task :theme:bundleLibRuntimeToJarDebug UP-TO-DATE
> Task :theme:processDebugJavaRes UP-TO-DATE
> Task :app:testDebugUnitTest UP-TO-DATE

BUILD SUCCESSFUL in 895ms
66 actionable tasks: 66 up-to-date
COMMAND: cd android && ./gradlew :app:compileDebugKotlin
> Task :kotlin:primitives:preBuild UP-TO-DATE
> Task :android:library:preBuild UP-TO-DATE
> Task :app:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :app:preBuild UP-TO-DATE
> Task :kotlin:primitives:preDebugBuild UP-TO-DATE
> Task :app:preDebugBuild UP-TO-DATE
> Task :android:library:preDebugBuild UP-TO-DATE
> Task :kotlin:primitives:writeDebugAarMetadata UP-TO-DATE
> Task :android:library:writeDebugAarMetadata UP-TO-DATE
> Task :app:generateDebugBuildConfig UP-TO-DATE
> Task :theme:preBuild UP-TO-DATE
> Task :kotlin:primitives:generateDebugResValues UP-TO-DATE
> Task :android:library:generateDebugResValues UP-TO-DATE
> Task :theme:preDebugBuild UP-TO-DATE
> Task :android:library:generateDebugResources UP-TO-DATE
> Task :kotlin:primitives:generateDebugResources UP-TO-DATE
> Task :theme:writeDebugAarMetadata UP-TO-DATE
> Task :android:library:packageDebugResources UP-TO-DATE
> Task :kotlin:primitives:packageDebugResources UP-TO-DATE
> Task :kotlin:primitives:extractDeepLinksDebug UP-TO-DATE
> Task :android:library:extractDeepLinksDebug UP-TO-DATE
> Task :android:library:processDebugManifest UP-TO-DATE
> Task :kotlin:primitives:processDebugManifest UP-TO-DATE
> Task :android:library:parseDebugLocalResources UP-TO-DATE
> Task :kotlin:primitives:parseDebugLocalResources UP-TO-DATE
> Task :kotlin:primitives:generateDebugRFile UP-TO-DATE
> Task :kotlin:primitives:compileDebugLibraryResources UP-TO-DATE
> Task :android:library:generateDebugRFile UP-TO-DATE
> Task :kotlin:primitives:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :android:library:compileDebugLibraryResources UP-TO-DATE
> Task :android:library:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :android:library:javaPreCompileDebug UP-TO-DATE
> Task :app:checkDebugAarMetadata UP-TO-DATE
> Task :app:generateDebugResValues UP-TO-DATE
> Task :theme:generateDebugResValues UP-TO-DATE
> Task :theme:generateDebugResources UP-TO-DATE
> Task :theme:packageDebugResources UP-TO-DATE
> Task :app:mapDebugSourceSetPaths UP-TO-DATE
> Task :app:generateDebugResources UP-TO-DATE
> Task :kotlin:primitives:compileDebugKotlin UP-TO-DATE
> Task :kotlin:primitives:javaPreCompileDebug UP-TO-DATE
> Task :kotlin:primitives:compileDebugJavaWithJavac NO-SOURCE
> Task :kotlin:primitives:bundleLibCompileToJarDebug UP-TO-DATE
> Task :app:mergeDebugResources UP-TO-DATE
> Task :app:packageDebugResources UP-TO-DATE
> Task :app:parseDebugLocalResources UP-TO-DATE
> Task :app:createDebugCompatibleScreenManifests UP-TO-DATE
> Task :app:extractDeepLinksDebug UP-TO-DATE
> Task :theme:extractDeepLinksDebug UP-TO-DATE
> Task :theme:processDebugManifest UP-TO-DATE
> Task :app:processDebugMainManifest UP-TO-DATE
> Task :android:library:compileDebugKotlin UP-TO-DATE
> Task :app:processDebugManifest UP-TO-DATE
> Task :app:processDebugManifestForPackage UP-TO-DATE
> Task :android:library:compileDebugJavaWithJavac NO-SOURCE
> Task :theme:compileDebugLibraryResources UP-TO-DATE
> Task :android:library:bundleLibCompileToJarDebug UP-TO-DATE
> Task :theme:parseDebugLocalResources UP-TO-DATE
> Task :theme:generateDebugRFile UP-TO-DATE
> Task :app:processDebugResources UP-TO-DATE
> Task :theme:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :theme:compileDebugKotlin UP-TO-DATE
> Task :theme:javaPreCompileDebug UP-TO-DATE
> Task :theme:compileDebugJavaWithJavac NO-SOURCE
> Task :theme:bundleLibCompileToJarDebug UP-TO-DATE
> Task :app:compileDebugKotlin UP-TO-DATE

BUILD SUCCESSFUL in 817ms
51 actionable tasks: 51 up-to-date
COMMAND: cd android && ./gradlew :app:compileDebugAndroidTestKotlin
> Task :android:library:preBuild UP-TO-DATE
> Task :kotlin:primitives:preBuild UP-TO-DATE
> Task :app:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :android:library:preDebugBuild UP-TO-DATE
> Task :kotlin:primitives:preDebugBuild UP-TO-DATE
> Task :app:preBuild UP-TO-DATE
> Task :kotlin:primitives:writeDebugAarMetadata UP-TO-DATE
> Task :app:preDebugBuild UP-TO-DATE
> Task :android:library:writeDebugAarMetadata UP-TO-DATE
> Task :android:library:generateDebugResValues UP-TO-DATE
> Task :kotlin:primitives:generateDebugResValues UP-TO-DATE
> Task :android:library:generateDebugResources UP-TO-DATE
> Task :app:generateDebugBuildConfig UP-TO-DATE
> Task :theme:preBuild UP-TO-DATE
> Task :theme:preDebugBuild UP-TO-DATE
> Task :kotlin:primitives:generateDebugResources UP-TO-DATE
> Task :android:library:packageDebugResources UP-TO-DATE
> Task :theme:writeDebugAarMetadata UP-TO-DATE
> Task :android:library:extractDeepLinksDebug UP-TO-DATE
> Task :kotlin:primitives:packageDebugResources UP-TO-DATE
> Task :android:library:processDebugManifest UP-TO-DATE
> Task :kotlin:primitives:extractDeepLinksDebug UP-TO-DATE
> Task :android:library:parseDebugLocalResources UP-TO-DATE
> Task :kotlin:primitives:processDebugManifest UP-TO-DATE
> Task :android:library:generateDebugRFile UP-TO-DATE
> Task :android:library:compileDebugLibraryResources UP-TO-DATE
> Task :kotlin:primitives:parseDebugLocalResources UP-TO-DATE
> Task :android:library:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :kotlin:primitives:generateDebugRFile UP-TO-DATE
> Task :android:library:javaPreCompileDebug UP-TO-DATE
> Task :kotlin:primitives:compileDebugLibraryResources UP-TO-DATE
> Task :kotlin:primitives:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :app:checkDebugAarMetadata UP-TO-DATE
> Task :app:generateDebugResValues UP-TO-DATE
> Task :theme:generateDebugResValues UP-TO-DATE
> Task :theme:generateDebugResources UP-TO-DATE
> Task :theme:packageDebugResources UP-TO-DATE
> Task :app:mapDebugSourceSetPaths UP-TO-DATE
> Task :kotlin:primitives:compileDebugKotlin UP-TO-DATE
> Task :app:generateDebugResources UP-TO-DATE
> Task :kotlin:primitives:javaPreCompileDebug UP-TO-DATE
> Task :kotlin:primitives:compileDebugJavaWithJavac NO-SOURCE
> Task :kotlin:primitives:bundleLibCompileToJarDebug UP-TO-DATE
> Task :app:mergeDebugResources UP-TO-DATE
> Task :app:packageDebugResources UP-TO-DATE
> Task :app:parseDebugLocalResources UP-TO-DATE
> Task :app:createDebugCompatibleScreenManifests UP-TO-DATE
> Task :app:extractDeepLinksDebug UP-TO-DATE
> Task :theme:extractDeepLinksDebug UP-TO-DATE
> Task :theme:processDebugManifest UP-TO-DATE
> Task :android:library:compileDebugKotlin UP-TO-DATE
> Task :app:processDebugMainManifest UP-TO-DATE
> Task :app:processDebugManifest UP-TO-DATE
> Task :android:library:compileDebugJavaWithJavac NO-SOURCE
> Task :app:processDebugManifestForPackage UP-TO-DATE
> Task :android:library:bundleLibCompileToJarDebug UP-TO-DATE
> Task :theme:compileDebugLibraryResources UP-TO-DATE
> Task :theme:parseDebugLocalResources UP-TO-DATE
> Task :theme:generateDebugRFile UP-TO-DATE
> Task :app:processDebugResources UP-TO-DATE
> Task :theme:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :theme:compileDebugKotlin UP-TO-DATE
> Task :theme:javaPreCompileDebug UP-TO-DATE
> Task :theme:compileDebugJavaWithJavac NO-SOURCE
> Task :theme:bundleLibCompileToJarDebug UP-TO-DATE
> Task :app:compileDebugKotlin UP-TO-DATE
> Task :app:javaPreCompileDebug UP-TO-DATE
> Task :app:compileDebugJavaWithJavac UP-TO-DATE
> Task :app:bundleDebugClassesToCompileJar UP-TO-DATE
> Task :app:preDebugAndroidTestBuild SKIPPED
> Task :app:processDebugAndroidTestManifest UP-TO-DATE
> Task :app:generateDebugAndroidTestBuildConfig UP-TO-DATE
> Task :app:checkDebugAndroidTestAarMetadata UP-TO-DATE
> Task :app:generateDebugAndroidTestResValues UP-TO-DATE
> Task :app:mapDebugAndroidTestSourceSetPaths UP-TO-DATE
> Task :app:generateDebugAndroidTestResources UP-TO-DATE
> Task :app:mergeDebugAndroidTestResources UP-TO-DATE
> Task :app:processDebugAndroidTestResources UP-TO-DATE
> Task :app:compileDebugAndroidTestKotlin UP-TO-DATE

BUILD SUCCESSFUL in 804ms
63 actionable tasks: 63 up-to-date
COMMAND: pnpm icons:check

> laneshadow@1.0.0 icons:check /Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-ATM-10-android
> pnpm tsx tokens/scripts/icons-check.ts

🔍 Checking icon catalog...
  Checking 31 icons...
✅ All 31 icons present and accounted for

Icon catalog is valid.
COMMAND: project-wide Material Icons grep gate
android/app/src/main/java/com/laneshadow/ui/components/molecules/ConnectionBanner.kt:7:import androidx.compose.material.icons.Icons
android/app/src/main/java/com/laneshadow/ui/components/molecules/ConnectionBanner.kt:8:import androidx.compose.material.icons.filled.Warning
android/app/src/main/java/com/laneshadow/ui/components/molecules/FavoriteExclusionAlert.kt:10:import androidx.compose.material.icons.Icons
android/app/src/main/java/com/laneshadow/ui/components/molecules/FavoriteExclusionAlert.kt:11:import androidx.compose.material.icons.filled.Close
android/app/src/main/java/com/laneshadow/ui/components/molecules/FavoriteExclusionAlert.kt:12:import androidx.compose.material.icons.filled.Info
android/app/src/main/java/com/laneshadow/ui/components/molecules/Banner.kt:8:import androidx.compose.material.icons.Icons
android/app/src/main/java/com/laneshadow/ui/components/molecules/Banner.kt:9:import androidx.compose.material.icons.filled.Close
android/app/src/main/java/com/laneshadow/ui/components/molecules/CaptionInput.kt:16:import androidx.compose.material.icons.Icons
android/app/src/main/java/com/laneshadow/ui/components/molecules/CaptionInput.kt:17:import androidx.compose.material.icons.automirrored.filled.Send
android/app/src/main/java/com/laneshadow/ui/components/molecules/CaptionInput.kt:18:import androidx.compose.material.icons.filled.Email
android/app/src/main/java/com/laneshadow/ui/components/molecules/CaptionInput.kt:19:import androidx.compose.material.icons.filled.Star
android/app/src/main/java/com/laneshadow/ui/components/molecules/MapControls.kt:17:import androidx.compose.material.icons.Icons
android/app/src/main/java/com/laneshadow/ui/components/molecules/MapControls.kt:18:import androidx.compose.material.icons.filled.Add
android/app/src/main/java/com/laneshadow/ui/components/molecules/MapControls.kt:19:import androidx.compose.material.icons.filled.Star
android/app/src/main/java/com/laneshadow/ui/components/molecules/MapControls.kt:20:import androidx.compose.material.icons.filled.Clear
android/app/src/main/java/com/laneshadow/ui/components/molecules/MapControls.kt:21:import androidx.compose.material.icons.filled.Favorite
android/app/src/main/java/com/laneshadow/ui/components/molecules/MapControls.kt:22:import androidx.compose.material.icons.filled.Email
android/app/src/main/java/com/laneshadow/ui/components/molecules/MapControls.kt:23:import androidx.compose.material.icons.filled.Check
android/app/src/main/java/com/laneshadow/ui/components/molecules/MapControls.kt:77:                        icon = Icons.Filled.Star,
android/app/src/main/java/com/laneshadow/ui/components/molecules/MapControls.kt:88:                        icon = Icons.Filled.Clear,
android/app/src/main/java/com/laneshadow/ui/components/molecules/MapControls.kt:99:                        icon = Icons.Filled.Favorite,
android/app/src/main/java/com/laneshadow/ui/components/molecules/MapControls.kt:117:                        toggleIcon = Icons.Filled.Email
android/app/src/main/java/com/laneshadow/ui/components/molecules/MapControls.kt:122:                        toggleIcon = Icons.Filled.Check
android/app/src/main/java/com/laneshadow/ui/components/molecules/MapControls.kt:165:                icon = Icons.Filled.Add,
android/app/src/main/java/com/laneshadow/ui/components/molecules/MapControls.kt:184:                icon = Icons.Filled.Clear,
android/app/src/main/java/com/laneshadow/ui/components/molecules/ErrorToast.kt:8:import androidx.compose.material.icons.Icons
android/app/src/main/java/com/laneshadow/ui/components/molecules/ErrorToast.kt:9:import androidx.compose.material.icons.filled.Close
android/app/src/main/java/com/laneshadow/ui/components/molecules/ErrorToast.kt:10:import androidx.compose.material.icons.filled.Warning
android/app/src/main/java/com/laneshadow/ui/components/molecules/EmptyState.kt:9:import androidx.compose.material.icons.Icons
android/app/src/main/java/com/laneshadow/ui/components/molecules/FloatingSearchInput.kt:14:import androidx.compose.material.icons.Icons
android/app/src/main/java/com/laneshadow/ui/components/molecules/FloatingSearchInput.kt:15:import androidx.compose.material.icons.filled.Close
android/app/src/main/java/com/laneshadow/ui/components/molecules/FloatingSearchInput.kt:16:import androidx.compose.material.icons.filled.Search
android/app/src/main/java/com/laneshadow/ui/components/molecules/DownloadProgressBanner.kt:14:import androidx.compose.material.icons.Icons
android/app/src/main/java/com/laneshadow/ui/components/molecules/DownloadProgressBanner.kt:15:import androidx.compose.material.icons.filled.Close
android/app/src/main/java/com/laneshadow/ui/components/molecules/Header.kt:13:import androidx.compose.material.icons.Icons
android/app/src/main/java/com/laneshadow/ui/components/molecules/Header.kt:14:import androidx.compose.material.icons.filled.Menu
android/app/src/main/java/com/laneshadow/ui/components/molecules/DiscoveryEmptyOverlay.kt:6:import androidx.compose.material.icons.Icons
android/app/src/main/java/com/laneshadow/ui/components/molecules/DiscoveryEmptyOverlay.kt:7:import androidx.compose.material.icons.filled.Search
android/app/src/main/java/com/laneshadow/ui/components/molecules/InfoToast.kt:8:import androidx.compose.material.icons.Icons
android/app/src/main/java/com/laneshadow/ui/components/molecules/InfoToast.kt:9:import androidx.compose.material.icons.filled.Close
android/app/src/main/java/com/laneshadow/ui/components/molecules/InfoToast.kt:10:import androidx.compose.material.icons.filled.Info
android/app/src/main/java/com/laneshadow/ui/components/molecules/NewSessionButton.kt:28:import androidx.compose.material.icons.Icons
android/app/src/main/java/com/laneshadow/ui/components/molecules/NewSessionButton.kt:29:import androidx.compose.material.icons.filled.Add
android/app/src/main/java/com/laneshadow/ui/components/molecules/NewSessionButton.kt:30:import androidx.compose.material.icons.filled.Create
android/app/src/main/java/com/laneshadow/ui/components/molecules/DepartureTimeSelector.kt:11:import androidx.compose.material.icons.Icons
android/app/src/main/java/com/laneshadow/ui/components/molecules/DepartureTimeSelector.kt:12:import androidx.compose.material.icons.filled.ArrowDropDown
android/app/src/main/java/com/laneshadow/ui/components/molecules/FavoriteRoadCard.kt:12:import androidx.compose.material.icons.Icons
android/app/src/main/java/com/laneshadow/ui/components/molecules/FavoriteRoadCard.kt:13:import androidx.compose.material.icons.filled.Delete
android/app/src/main/java/com/laneshadow/ui/components/atoms/MotorcyclePlusIcon.kt:7:import androidx.compose.material.icons.Icons
android/app/src/main/java/com/laneshadow/ui/components/atoms/MotorcyclePlusIcon.kt:8:import androidx.compose.material.icons.filled.AddCircle
android/app/src/main/java/com/laneshadow/ui/components/atoms/MotorcyclePlusIcon.kt:81:            imageVector = Icons.Filled.AddCircle,
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbol.kt:3:import androidx.compose.material.icons.Icons
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbol.kt:4:import androidx.compose.material.icons.filled.ArrowBack
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbol.kt:5:import androidx.compose.material.icons.filled.Close
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbol.kt:6:import androidx.compose.material.icons.filled.Favorite
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbol.kt:7:import androidx.compose.material.icons.filled.Home
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbol.kt:8:import androidx.compose.material.icons.filled.Info
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbol.kt:9:import androidx.compose.material.icons.filled.Menu
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbol.kt:10:import androidx.compose.material.icons.filled.Person
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbol.kt:11:import androidx.compose.material.icons.filled.Search
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbol.kt:12:import androidx.compose.material.icons.filled.Settings
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbol.kt:13:import androidx.compose.material.icons.filled.Star
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:3:import androidx.compose.material.icons.Icons
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:4:import androidx.compose.material.icons.automirrored.filled.ArrowBack
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:5:import androidx.compose.material.icons.automirrored.filled.KeyboardArrowLeft
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:6:import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:7:import androidx.compose.material.icons.automirrored.filled.List
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:8:import androidx.compose.material.icons.filled.AccountCircle
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:9:import androidx.compose.material.icons.filled.Add
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:10:import androidx.compose.material.icons.filled.Call
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:11:import androidx.compose.material.icons.filled.Check
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:12:import androidx.compose.material.icons.filled.CheckCircle
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:13:import androidx.compose.material.icons.filled.Close
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:14:import androidx.compose.material.icons.filled.DateRange
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:15:import androidx.compose.material.icons.filled.Delete
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:16:import androidx.compose.material.icons.filled.Edit
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:17:import androidx.compose.material.icons.filled.Email
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:18:import androidx.compose.material.icons.filled.Favorite
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:19:import androidx.compose.material.icons.filled.Home
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:20:import androidx.compose.material.icons.filled.Info
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:21:import androidx.compose.material.icons.filled.LocationOn
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:22:import androidx.compose.material.icons.filled.Lock
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:23:import androidx.compose.material.icons.filled.Menu
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:24:import androidx.compose.material.icons.filled.MoreVert
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:25:import androidx.compose.material.icons.filled.Person
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:26:import androidx.compose.material.icons.filled.Place
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:27:import androidx.compose.material.icons.filled.PlayArrow
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:28:import androidx.compose.material.icons.filled.Refresh
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:29:import androidx.compose.material.icons.filled.Search
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:30:import androidx.compose.material.icons.filled.Send
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:31:import androidx.compose.material.icons.filled.Settings
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:32:import androidx.compose.material.icons.filled.Share
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:33:import androidx.compose.material.icons.filled.Star
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:34:import androidx.compose.material.icons.filled.ThumbUp
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:108:        "check", "checkmark", "done" -> Icons.Filled.Check
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:109:        "close", "x", "cancel" -> Icons.Filled.Close
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:110:        "add", "plus" -> Icons.Filled.Add
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:111:        "delete", "trash" -> Icons.Filled.Delete
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:112:        "edit", "pencil" -> Icons.Filled.Edit
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:113:        "refresh", "reload" -> Icons.Filled.Refresh
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:114:        "search", "find" -> Icons.Filled.Search
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:115:        "settings", "gear" -> Icons.Filled.Settings
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:116:        "home", "house" -> Icons.Filled.Home
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:117:        "menu", "hamburger" -> Icons.Filled.Menu
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:118:        "more", "ellipsis" -> Icons.Filled.MoreVert
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:119:        "info", "information" -> Icons.Filled.Info
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:120:        "send" -> Icons.Filled.Send
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:132:        "star", "favorite", "heart", "like" -> Icons.Filled.Star
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:133:        "thumb-up", "thumbs-up" -> Icons.Filled.ThumbUp
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:136:        "mail", "email", "message" -> Icons.Filled.Email
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:137:        "phone", "call" -> Icons.Filled.Call
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:138:        "share" -> Icons.Filled.Share
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:141:        "play" -> Icons.Filled.PlayArrow
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:144:        "person", "user", "profile" -> Icons.Filled.Person
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:145:        "account", "avatar" -> Icons.Filled.AccountCircle
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:148:        "lock", "locked" -> Icons.Filled.Lock
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:151:        "location", "map", "pin", "place" -> Icons.Filled.Place
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:152:        "navigation", "directions" -> Icons.Filled.LocationOn
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:155:        "calendar", "date", "date-range" -> Icons.Filled.DateRange
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:158:        "check-circle", "success" -> Icons.Filled.CheckCircle
android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt:161:        else -> Icons.Filled.Star
android/app/src/main/java/com/laneshadow/ui/components/atoms/Collapsible.kt:10:import androidx.compose.material.icons.Icons
android/app/src/main/java/com/laneshadow/ui/components/atoms/Collapsible.kt:11:import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight

## Full Diff
diff --git a/android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSIconCatalogInstrumentationTest.kt b/android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSIconCatalogInstrumentationTest.kt
new file mode 100644
index 00000000..f74d27e2
--- /dev/null
+++ b/android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSIconCatalogInstrumentationTest.kt
@@ -0,0 +1,41 @@
+package com.laneshadow.ui.atoms
+
+import androidx.compose.foundation.layout.FlowRow
+import androidx.compose.foundation.layout.ExperimentalLayoutApi
+import androidx.compose.ui.Modifier
+import androidx.compose.ui.platform.testTag
+import androidx.compose.ui.test.assertCountEquals
+import androidx.compose.ui.test.junit4.createComposeRule
+import androidx.compose.ui.test.onAllNodesWithTag
+import androidx.test.ext.junit.runners.AndroidJUnit4
+import com.laneshadow.theme.LaneShadowTheme
+import com.laneshadow.theme.generated.LaneShadowTheme.IconName
+import org.junit.Rule
+import org.junit.Test
+import org.junit.runner.RunWith
+
+@RunWith(AndroidJUnit4::class)
+class LSIconCatalogInstrumentationTest {
+    @get:Rule
+    val composeTestRule = createComposeRule()
+
+    @Test
+    @OptIn(ExperimentalLayoutApi::class)
+    fun icon_catalog_renders_all_25_names_without_crash() {
+        composeTestRule.setContent {
+            LaneShadowTheme {
+                FlowRow {
+                    IconName.entries.forEach { iconName ->
+                        LSIcon(
+                            name = iconName,
+                            modifier = Modifier.testTag("catalog-icon"),
+                        )
+                    }
+                }
+            }
+        }
+
+        composeTestRule.onAllNodesWithTag("catalog-icon")
+            .assertCountEquals(IconName.entries.size)
+    }
+}
diff --git a/android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSIconInstrumentationTest.kt b/android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSIconInstrumentationTest.kt
new file mode 100644
index 00000000..b91067c5
--- /dev/null
+++ b/android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSIconInstrumentationTest.kt
@@ -0,0 +1,68 @@
+package com.laneshadow.ui.atoms
+
+import androidx.compose.ui.Modifier
+import androidx.compose.ui.test.SemanticsMatcher
+import androidx.compose.ui.test.assert
+import androidx.compose.ui.test.assertHeightIsEqualTo
+import androidx.compose.ui.test.assertWidthIsEqualTo
+import androidx.compose.ui.test.junit4.createComposeRule
+import androidx.compose.ui.test.onNodeWithTag
+import androidx.compose.ui.platform.testTag
+import androidx.test.ext.junit.runners.AndroidJUnit4
+import androidx.test.platform.app.InstrumentationRegistry
+import com.laneshadow.theme.LaneShadowTheme
+import com.laneshadow.theme.generated.LaneShadowTheme.IconName
+import org.junit.Rule
+import org.junit.Test
+import org.junit.runner.RunWith
+
+@RunWith(AndroidJUnit4::class)
+class LSIconInstrumentationTest {
+    @get:Rule
+    val composeTestRule = createComposeRule()
+
+    @Test
+    fun icon_compass_md_resolves_size_stroke_and_default_color() {
+        val metrics = metricsFromAssets()
+
+        composeTestRule.setContent {
+            LaneShadowTheme {
+                LSIcon(
+                    name = IconName.Compass,
+                    modifier = Modifier.testTag("compass-icon"),
+                )
+            }
+        }
+
+        composeTestRule.onNodeWithTag("compass-icon")
+            .assertWidthIsEqualTo(metrics.iconMd)
+            .assertHeightIsEqualTo(metrics.iconMd)
+            .assert(SemanticsMatcher.expectValue(LSIconStrokeWidthKey, metrics.strokeWidth))
+            .assert(SemanticsMatcher.expectValue(LSIconColorKey, metrics.contentPrimary))
+    }
+
+    @Test
+    fun icon_color_signal_resolves_color_signal_default() {
+        val metrics = metricsFromAssets()
+
+        composeTestRule.setContent {
+            LaneShadowTheme {
+                LSIcon(
+                    name = IconName.StarFill,
+                    color = IconColor.Signal,
+                    modifier = Modifier.testTag("signal-icon"),
+                )
+            }
+        }
+
+        composeTestRule.onNodeWithTag("signal-icon")
+            .assert(SemanticsMatcher.expectValue(LSIconColorKey, metrics.signalDefault))
+    }
+
+    private fun metricsFromAssets(): IconTokenMetrics {
+        val context = InstrumentationRegistry.getInstrumentation().targetContext
+        return context.assets.open("semantic.tokens.json").use { stream ->
+            IconTokenMetrics.fromJson(stream.bufferedReader().readText())
+        }
+    }
+}
diff --git a/android/app/src/debug/java/com/laneshadow/sandbox/stories/AtomsStories.kt b/android/app/src/debug/java/com/laneshadow/sandbox/stories/AtomsStories.kt
index ac34121a..62555bea 100644
--- a/android/app/src/debug/java/com/laneshadow/sandbox/stories/AtomsStories.kt
+++ b/android/app/src/debug/java/com/laneshadow/sandbox/stories/AtomsStories.kt
@@ -1,7 +1,5 @@
 package com.laneshadow.sandbox.stories
 
-import com.laneshadow.ui.sandbox.model.SandboxStory
-import com.laneshadow.ui.sandbox.model.SandboxTier
 import com.nativesandbox.model.Story
 
 /**
@@ -64,6 +62,6 @@ import com.nativesandbox.model.Story
  * Reference each component's STYLE PROPERTIES MATRIX file for required variants.
  */
 object AtomsStories {
-    val all: List<Story> = emptyList()
+    val all: List<Story> = LSIconStories.all
     // Sprint 2: Add atom stories here following the pattern above
 }
diff --git a/android/app/src/debug/java/com/laneshadow/sandbox/stories/LSIconStories.kt b/android/app/src/debug/java/com/laneshadow/sandbox/stories/LSIconStories.kt
new file mode 100644
index 00000000..64392617
--- /dev/null
+++ b/android/app/src/debug/java/com/laneshadow/sandbox/stories/LSIconStories.kt
@@ -0,0 +1,103 @@
+package com.laneshadow.sandbox.stories
+
+import androidx.compose.foundation.layout.Arrangement
+import androidx.compose.foundation.layout.Column
+import androidx.compose.foundation.layout.ExperimentalLayoutApi
+import androidx.compose.foundation.layout.FlowRow
+import androidx.compose.foundation.layout.Row
+import androidx.compose.foundation.layout.padding
+import androidx.compose.material3.Text
+import androidx.compose.runtime.Composable
+import androidx.compose.ui.Alignment
+import androidx.compose.ui.Modifier
+import com.laneshadow.theme.LocalLaneShadowTheme
+import com.laneshadow.theme.generated.LaneShadowTheme.IconName
+import com.laneshadow.ui.atoms.ContentColor
+import com.laneshadow.ui.atoms.IconColor
+import com.laneshadow.ui.atoms.IconSize
+import com.laneshadow.ui.atoms.LSIcon
+import com.laneshadow.ui.atoms.StatusColor
+import com.laneshadow.ui.atoms.WeatherColor
+import com.nativesandbox.model.ComponentTier
+import com.nativesandbox.model.Story
+
+object LSIconStories {
+    val all: List<Story> = listOf(
+        Story(
+            id = "atoms.icon.catalog",
+            tier = ComponentTier.Atom,
+            component = "LSIcon",
+            name = "Catalog",
+            summary = "Design-owned icon catalog rendered at the default icon size.",
+            content = { LSIconCatalogStory() },
+        ),
+        Story(
+            id = "atoms.icon.colorOverrides",
+            tier = ComponentTier.Atom,
+            component = "LSIcon",
+            name = "Color Overrides",
+            summary = "Icon color variants resolved through typed token-backed icon colors.",
+            content = { LSIconColorOverridesStory() },
+        ),
+    )
+}
+
+@Composable
+@OptIn(ExperimentalLayoutApi::class)
+private fun LSIconCatalogStory() {
+    val theme = LocalLaneShadowTheme.current
+
+    FlowRow(
+        modifier = Modifier.padding(theme.space.lg),
+        horizontalArrangement = Arrangement.spacedBy(theme.space.lg),
+        verticalArrangement = Arrangement.spacedBy(theme.space.lg),
+    ) {
+        IconName.entries.forEach { iconName ->
+            Column(
+                horizontalAlignment = Alignment.CenterHorizontally,
+                verticalArrangement = Arrangement.spacedBy(theme.space.xs),
+            ) {
+                LSIcon(name = iconName, size = IconSize.Md)
+                Text(
+                    text = iconName.value,
+                    style = theme.type.label.sm,
+                    color = theme.colors.onSurface.default,
+                )
+            }
+        }
+    }
+}
+
+@Composable
+private fun LSIconColorOverridesStory() {
+    val theme = LocalLaneShadowTheme.current
+    val samples = listOf(
+        Triple(IconName.Compass, IconColor.Content(ContentColor.Primary), "content.primary"),
+        Triple(IconName.Route, IconColor.Content(ContentColor.Secondary), "content.secondary"),
+        Triple(IconName.StarFill, IconColor.Signal, "signal.default"),
+        Triple(IconName.Clock, IconColor.Status(StatusColor.Info), "status.info"),
+        Triple(IconName.Trash, IconColor.Status(StatusColor.Error), "status.error"),
+        Triple(IconName.Sun, IconColor.Weather(WeatherColor.Clear), "weather.clear"),
+        Triple(IconName.Rain, IconColor.Weather(WeatherColor.Rain), "weather.rain"),
+        Triple(IconName.Wind, IconColor.Weather(WeatherColor.Wind), "weather.wind"),
+    )
+
+    Column(
+        modifier = Modifier.padding(theme.space.lg),
+        verticalArrangement = Arrangement.spacedBy(theme.space.md),
+    ) {
+        samples.forEach { (name, color, label) ->
+            Row(
+                horizontalArrangement = Arrangement.spacedBy(theme.space.md),
+                verticalAlignment = Alignment.CenterVertically,
+            ) {
+                LSIcon(name = name, color = color, size = IconSize.Md)
+                Text(
+                    text = label,
+                    style = theme.type.body.md,
+                    color = theme.colors.onSurface.default,
+                )
+            }
+        }
+    }
+}
diff --git a/android/app/src/main/java/com/laneshadow/ui/atoms/IconColor.kt b/android/app/src/main/java/com/laneshadow/ui/atoms/IconColor.kt
new file mode 100644
index 00000000..b89f2afb
--- /dev/null
+++ b/android/app/src/main/java/com/laneshadow/ui/atoms/IconColor.kt
@@ -0,0 +1,70 @@
+package com.laneshadow.ui.atoms
+
+import androidx.compose.ui.graphics.Color
+import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
+
+sealed interface IconColor {
+    data class Content(val value: ContentColor) : IconColor
+    data object Signal : IconColor
+    data class Status(val value: StatusColor) : IconColor
+    data class Weather(val value: WeatherColor) : IconColor
+}
+
+enum class ContentColor {
+    Primary,
+    Secondary,
+    Tertiary,
+    Subtle,
+    OnSignal,
+}
+
+enum class StatusColor {
+    Info,
+    Success,
+    Warning,
+    Error,
+}
+
+enum class WeatherColor {
+    Clear,
+    Rain,
+    Wind,
+    Storm,
+    Hot,
+    Cold,
+}
+
+fun IconColor.resolve(): Color =
+    when (this) {
+        is IconColor.Content -> value.resolve()
+        IconColor.Signal -> GeneratedTokens.color.Signal.default
+        is IconColor.Status -> value.resolve()
+        is IconColor.Weather -> value.resolve()
+    }
+
+private fun ContentColor.resolve(): Color =
+    when (this) {
+        ContentColor.Primary -> GeneratedTokens.color.Content.primary
+        ContentColor.Secondary -> GeneratedTokens.color.Content.secondary
+        ContentColor.Tertiary -> GeneratedTokens.color.Content.tertiary
+        ContentColor.Subtle -> GeneratedTokens.color.Content.subtle
+        ContentColor.OnSignal -> GeneratedTokens.color.Content.onSignal
+    }
+
+private fun StatusColor.resolve(): Color =
+    when (this) {
+        StatusColor.Info -> GeneratedTokens.color.Status.Info.default
+        StatusColor.Success -> GeneratedTokens.color.Status.Success.default
+        StatusColor.Warning -> GeneratedTokens.color.Status.Warning.default
+        StatusColor.Error -> GeneratedTokens.color.Status.Error.default
+    }
+
+private fun WeatherColor.resolve(): Color =
+    when (this) {
+        WeatherColor.Clear -> GeneratedTokens.color.Weather.Clear.default
+        WeatherColor.Rain -> GeneratedTokens.color.Weather.Rain.default
+        WeatherColor.Wind -> GeneratedTokens.color.Weather.Wind.default
+        WeatherColor.Storm -> GeneratedTokens.color.Weather.Storm.default
+        WeatherColor.Hot -> GeneratedTokens.color.Weather.Hot.default
+        WeatherColor.Cold -> GeneratedTokens.color.Weather.Cold.default
+    }
diff --git a/android/app/src/main/java/com/laneshadow/ui/atoms/IconSize.kt b/android/app/src/main/java/com/laneshadow/ui/atoms/IconSize.kt
new file mode 100644
index 00000000..cd05a0f6
--- /dev/null
+++ b/android/app/src/main/java/com/laneshadow/ui/atoms/IconSize.kt
@@ -0,0 +1,92 @@
+package com.laneshadow.ui.atoms
+
+import androidx.compose.runtime.Composable
+import androidx.compose.runtime.remember
+import androidx.compose.ui.graphics.Color
+import androidx.compose.ui.platform.LocalContext
+import androidx.compose.ui.unit.Dp
+import androidx.compose.ui.unit.dp
+import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
+import kotlinx.serialization.json.Json
+import kotlinx.serialization.json.JsonObject
+import kotlinx.serialization.json.double
+import kotlinx.serialization.json.jsonObject
+import kotlinx.serialization.json.jsonPrimitive
+
+enum class IconSize {
+    Xs,
+    Sm,
+    Md,
+    Lg,
+    Xl;
+
+    fun resolve(metrics: IconTokenMetrics): Dp =
+        when (this) {
+            Xs -> metrics.iconXs
+            Sm -> metrics.iconSm
+            Md -> metrics.iconMd
+            Lg -> metrics.iconLg
+            Xl -> metrics.iconXl
+        }
+}
+
+data class IconTokenMetrics(
+    val iconXs: Dp,
+    val iconSm: Dp,
+    val iconMd: Dp,
+    val iconLg: Dp,
+    val iconXl: Dp,
+    val strokeWidth: Dp,
+    val contentPrimary: Color,
+    val signalDefault: Color,
+) {
+    companion object {
+        private val json = Json { ignoreUnknownKeys = true }
+
+        fun fromJson(source: String): IconTokenMetrics {
+            val root = json.parseToJsonElement(source).jsonObject
+            val semantic = root.objectAt("semantic") ?: root
+            val dimensions = semantic.objectAt("dimensions")
+            val sizing = dimensions?.objectAt("sizing")
+            val icon = sizing?.objectAt("icon")
+            val iconSize = dimensions?.objectAt("iconSize") ?: semantic.objectAt("iconSize")
+            val iconStroke = sizing?.objectAt("iconStroke")
+            val strokeWidth = dimensions?.objectAt("strokeWidth") ?: semantic.objectAt("strokeWidth")
+
+            return IconTokenMetrics(
+                iconXs = icon?.dimension("xs") ?: iconSize.requiredDimension("xsmall"),
+                iconSm = icon?.dimension("sm") ?: iconSize.requiredDimension("small"),
+                iconMd = icon?.dimension("md") ?: iconSize.requiredDimension("medium"),
+                iconLg = icon?.dimension("lg") ?: iconSize.requiredDimension("large"),
+                iconXl = icon?.dimension("xl") ?: iconSize.requiredDimension("xlarge"),
+                strokeWidth = iconStroke?.dimension("width") ?: strokeWidth.requiredDimension("normal"),
+                contentPrimary = GeneratedTokens.color.Content.primary,
+                signalDefault = GeneratedTokens.color.Signal.default,
+            )
+        }
+    }
+}
+
+@Composable
+internal fun rememberIconTokenMetrics(): IconTokenMetrics {
+    val context = LocalContext.current.applicationContext
+    return remember(context) {
+        context.assets.open("semantic.tokens.json").use { stream ->
+            IconTokenMetrics.fromJson(stream.bufferedReader().readText())
+        }
+    }
+}
+
+private fun JsonObject.objectAt(key: String): JsonObject? =
+    this[key]?.jsonObject
+
+private fun JsonObject.dimension(key: String): Dp? =
+    this[key]
+        ?.jsonObject
+        ?.get("\$value")
+        ?.jsonPrimitive
+        ?.double
+        ?.dp
+
+private fun JsonObject?.requiredDimension(key: String): Dp =
+    requireNotNull(this?.dimension(key)) { "Missing icon token dimension '$key'." }
diff --git a/android/app/src/main/java/com/laneshadow/ui/atoms/LSIcon.kt b/android/app/src/main/java/com/laneshadow/ui/atoms/LSIcon.kt
new file mode 100644
index 00000000..f76617e0
--- /dev/null
+++ b/android/app/src/main/java/com/laneshadow/ui/atoms/LSIcon.kt
@@ -0,0 +1,246 @@
+package com.laneshadow.ui.atoms
+
+import androidx.compose.foundation.Canvas
+import androidx.compose.foundation.layout.size
+import androidx.compose.runtime.Composable
+import androidx.compose.runtime.remember
+import androidx.compose.ui.Modifier
+import androidx.compose.ui.graphics.Color
+import androidx.compose.ui.graphics.Path
+import androidx.compose.ui.graphics.StrokeCap
+import androidx.compose.ui.graphics.StrokeJoin
+import androidx.compose.ui.graphics.drawscope.Fill
+import androidx.compose.ui.graphics.drawscope.Stroke
+import androidx.compose.ui.graphics.drawscope.withTransform
+import androidx.compose.ui.graphics.vector.PathParser
+import androidx.compose.ui.semantics.SemanticsPropertyKey
+import androidx.compose.ui.semantics.SemanticsPropertyReceiver
+import androidx.compose.ui.semantics.contentDescription
+import androidx.compose.ui.semantics.semantics
+import androidx.compose.ui.unit.Dp
+import com.laneshadow.theme.generated.LaneShadowTheme.IconName
+
+val LSIconStrokeWidthKey = SemanticsPropertyKey<Dp>("LSIconStrokeWidth")
+val LSIconColorKey = SemanticsPropertyKey<Color>("LSIconColor")
+val LSIconNameKey = SemanticsPropertyKey<String>("LSIconName")
+
+private var SemanticsPropertyReceiver.lsIconStrokeWidth by LSIconStrokeWidthKey
+private var SemanticsPropertyReceiver.lsIconColor by LSIconColorKey
+private var SemanticsPropertyReceiver.lsIconName by LSIconNameKey
+
+@Composable
+fun LSIcon(
+    name: IconName,
+    size: IconSize = IconSize.Md,
+    color: IconColor = IconColor.Content(ContentColor.Primary),
+    modifier: Modifier = Modifier,
+    contentDescription: String? = null,
+) {
+    val metrics = rememberIconTokenMetrics()
+    val resolvedSize = size.resolve(metrics)
+    val resolvedColor = color.resolve()
+    val paths = remember(name) { name.pathSpecs.map(IconPathSpec::parse) }
+
+    Canvas(
+        modifier = modifier
+            .size(resolvedSize)
+            .semantics {
+                lsIconName = name.value
+                lsIconStrokeWidth = metrics.strokeWidth
+                lsIconColor = resolvedColor
+                contentDescription?.let { this.contentDescription = it }
+            },
+    ) {
+        val scale = minOf(this.size.width, this.size.height) / IconViewportSize
+        val strokeWidth = metrics.strokeWidth.toPx()
+
+        withTransform({
+            scale(scaleX = scale, scaleY = scale)
+        }) {
+            paths.forEach { path ->
+                if (path.fill) {
+                    drawPath(
+                        path = path.path,
+                        color = resolvedColor,
+                        style = Fill,
+                    )
+                }
+                if (path.stroke) {
+                    drawPath(
+                        path = path.path,
+                        color = resolvedColor,
+                        style = Stroke(
+                            width = strokeWidth,
+                            cap = StrokeCap.Round,
+                            join = StrokeJoin.Round,
+                        ),
+                    )
+                }
+            }
+        }
+    }
+}
+
+private const val IconViewportSize = 24f
+
+private data class IconPathSpec(
+    val pathData: String,
+    val fill: Boolean,
+    val stroke: Boolean,
+) {
+    fun parse(): ParsedIconPath =
+        ParsedIconPath(
+            path = PathParser().parsePathString(pathData).toPath(),
+            fill = fill,
+            stroke = stroke,
+        )
+}
+
+private data class ParsedIconPath(
+    val path: Path,
+    val fill: Boolean,
+    val stroke: Boolean,
+)
+
+private val IconName.pathSpecs: List<IconPathSpec>
+    get() =
+        when (this) {
+            IconName.Bike -> listOf(
+                IconPathSpec("M3 17.5 A2.5 2.5 0 1 0 8 17.5 A2.5 2.5 0 1 0 3 17.5", fill = false, stroke = true),
+                IconPathSpec("M16 17.5 A2.5 2.5 0 1 0 21 17.5 A2.5 2.5 0 1 0 16 17.5", fill = false, stroke = true),
+                IconPathSpec("M15 6H9L6 14h12l-2-7z", fill = false, stroke = true),
+                IconPathSpec("M6 14H3l-.5 1.5", fill = false, stroke = true),
+                IconPathSpec("M18 14h2l.5 1.5", fill = false, stroke = true),
+            )
+            IconName.Bookmark -> listOf(
+                IconPathSpec("M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z", fill = false, stroke = true),
+            )
+            IconName.BookmarkFill -> listOf(
+                IconPathSpec("M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z", fill = true, stroke = true),
+            )
+            IconName.ChevL -> listOf(
+                IconPathSpec("M15 18 L9 12 L15 6", fill = false, stroke = true),
+            )
+            IconName.ChevR -> listOf(
+                IconPathSpec("M9 18 L15 12 L9 6", fill = false, stroke = true),
+            )
+            IconName.Clock -> listOf(
+                IconPathSpec("M2 12 A10 10 0 1 0 22 12 A10 10 0 1 0 2 12", fill = false, stroke = true),
+                IconPathSpec("M12 6 L12 12 L16 14", fill = false, stroke = true),
+            )
+            IconName.Close -> listOf(
+                IconPathSpec("M18 6 L6 18", fill = false, stroke = true),
+                IconPathSpec("M6 6 L18 18", fill = false, stroke = true),
+            )
+            IconName.Collapse -> listOf(
+                IconPathSpec("M4 14 L10 14 L10 20", fill = false, stroke = true),
+                IconPathSpec("M20 10 L14 10 L14 4", fill = false, stroke = true),
+                IconPathSpec("M10 14 L3 21", fill = false, stroke = true),
+                IconPathSpec("M21 3 L14 10", fill = false, stroke = true),
+            )
+            IconName.Compass -> listOf(
+                IconPathSpec("M2 12 A10 10 0 1 0 22 12 A10 10 0 1 0 2 12", fill = false, stroke = true),
+                IconPathSpec("M16.24 7.76 L14.12 14.12 L7.76 16.24 L9.88 9.88 L16.24 7.76 Z", fill = false, stroke = true),
+            )
+            IconName.Edit -> listOf(
+                IconPathSpec("M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7", fill = false, stroke = true),
+                IconPathSpec("M18.5 2.5a2.121 2.121 2 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z", fill = false, stroke = true),
+            )
+            IconName.Expand -> listOf(
+                IconPathSpec("M15 3 L21 3 L21 9", fill = false, stroke = true),
+                IconPathSpec("M9 21 L3 21 L3 15", fill = false, stroke = true),
+                IconPathSpec("M21 3 L14 10", fill = false, stroke = true),
+                IconPathSpec("M3 21 L10 14", fill = false, stroke = true),
+            )
+            IconName.Heart -> listOf(
+                IconPathSpec("M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z", fill = false, stroke = true),
+            )
+            IconName.HeartFill -> listOf(
+                IconPathSpec("M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z", fill = true, stroke = true),
+            )
+            IconName.Layers -> listOf(
+                IconPathSpec("M12 2 L2 7 L12 12 L22 7 L12 2 Z", fill = false, stroke = true),
+                IconPathSpec("M2 17 L12 22 L22 17", fill = false, stroke = true),
+                IconPathSpec("M2 12 L12 17 L22 12", fill = false, stroke = true),
+            )
+            IconName.Map -> listOf(
+                IconPathSpec("M1 6 L1 22 L8 18 L16 22 L23 18 L23 2 L16 6 L8 2 L1 6 Z", fill = false, stroke = true),
+                IconPathSpec("M8 2 L8 18", fill = false, stroke = true),
+                IconPathSpec("M16 6 L16 22", fill = false, stroke = true),
+            )
+            IconName.Menu -> listOf(
+                IconPathSpec("M3 6 L21 6", fill = false, stroke = true),
+                IconPathSpec("M3 12 L21 12", fill = false, stroke = true),
+                IconPathSpec("M3 18 L21 18", fill = false, stroke = true),
+            )
+            IconName.Pin -> listOf(
+                IconPathSpec("M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z", fill = false, stroke = true),
+                IconPathSpec("M9 10 A3 3 0 1 0 15 10 A3 3 0 1 0 9 10", fill = false, stroke = true),
+            )
+            IconName.Plus -> listOf(
+                IconPathSpec("M12 5 L12 19", fill = false, stroke = true),
+                IconPathSpec("M5 12 L19 12", fill = false, stroke = true),
+            )
+            IconName.Rain -> listOf(
+                IconPathSpec("M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25", fill = false, stroke = true),
+                IconPathSpec("M8 19 L8 21", fill = false, stroke = true),
+                IconPathSpec("M12 21 L12 23", fill = false, stroke = true),
+                IconPathSpec("M16 19 L16 21", fill = false, stroke = true),
+            )
+            IconName.Route -> listOf(
+                IconPathSpec("M3 17l4-8 4 4 4-6 4 10", fill = false, stroke = true),
+            )
+            IconName.Send -> listOf(
+                IconPathSpec("M22 2 L11 13", fill = false, stroke = true),
+                IconPathSpec("M22 2 L15 22 L11 13 L2 9 L22 2 Z", fill = false, stroke = true),
+            )
+            IconName.Share -> listOf(
+                IconPathSpec("M15 5 A3 3 0 1 0 21 5 A3 3 0 1 0 15 5", fill = false, stroke = true),
+                IconPathSpec("M3 12 A3 3 0 1 0 9 12 A3 3 0 1 0 3 12", fill = false, stroke = true),
+                IconPathSpec("M15 19 A3 3 0 1 0 21 19 A3 3 0 1 0 15 19", fill = false, stroke = true),
+                IconPathSpec("M8.59 13.51 L15.42 17.49", fill = false, stroke = true),
+                IconPathSpec("M15.41 6.51 L8.59 10.49", fill = false, stroke = true),
+            )
+            IconName.Sliders -> listOf(
+                IconPathSpec("M4 6 L20 6", fill = false, stroke = true),
+                IconPathSpec("M4 12 L20 12", fill = false, stroke = true),
+                IconPathSpec("M4 18 L20 18", fill = false, stroke = true),
+                IconPathSpec("M6 6 A2 2 0 1 0 10 6 A2 2 0 1 0 6 6", fill = true, stroke = false),
+                IconPathSpec("M14 12 A2 2 0 1 0 18 12 A2 2 0 1 0 14 12", fill = true, stroke = false),
+                IconPathSpec("M8 18 A2 2 0 1 0 12 18 A2 2 0 1 0 8 18", fill = true, stroke = false),
+            )
+            IconName.Sparkle -> listOf(
+                IconPathSpec("M12 3L13.5 8.5L19 8.5L14.75 11.5L16.5 17L12 14L7.5 17L9.25 11.5L5 8.5L10.5 8.5Z", fill = false, stroke = true),
+            )
+            IconName.Star -> listOf(
+                IconPathSpec("M12 2 L15.09 8.26 L22 9.27 L17 14.14 L18.18 21.02 L12 17.77 L5.82 21.02 L7 14.14 L2 9.27 L8.91 8.26 L12 2 Z", fill = false, stroke = true),
+            )
+            IconName.StarFill -> listOf(
+                IconPathSpec("M12 2 L15.09 8.26 L22 9.27 L17 14.14 L18.18 21.02 L12 17.77 L5.82 21.02 L7 14.14 L2 9.27 L8.91 8.26 L12 2 Z", fill = true, stroke = true),
+            )
+            IconName.Storm -> listOf(
+                IconPathSpec("M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9", fill = false, stroke = true),
+                IconPathSpec("M13 11 L9 17 L15 17 L11 23", fill = false, stroke = true),
+            )
+            IconName.Sun -> listOf(
+                IconPathSpec("M7 12 A5 5 0 1 0 17 12 A5 5 0 1 0 7 12", fill = false, stroke = true),
+                IconPathSpec("M12 1 L12 3", fill = false, stroke = true),
+                IconPathSpec("M12 21 L12 23", fill = false, stroke = true),
+                IconPathSpec("M4.22 4.22 L5.64 5.64", fill = false, stroke = true),
+                IconPathSpec("M18.36 18.36 L19.78 19.78", fill = false, stroke = true),
+                IconPathSpec("M1 12 L3 12", fill = false, stroke = true),
+                IconPathSpec("M21 12 L23 12", fill = false, stroke = true),
+                IconPathSpec("M4.22 19.78 L5.64 18.36", fill = false, stroke = true),
+                IconPathSpec("M18.36 5.64 L19.78 4.22", fill = false, stroke = true),
+            )
+            IconName.Therm -> listOf(
+                IconPathSpec("M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z", fill = false, stroke = true),
+            )
+            IconName.Trash -> listOf(
+                IconPathSpec("M3 6 L5 6 L21 6", fill = false, stroke = true),
+                IconPathSpec("M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2", fill = false, stroke = true),
+            )
+            IconName.Wind -> listOf(
+                IconPathSpec("M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2", fill = false, stroke = true),
+            )
+        }
diff --git a/android/app/src/main/res/drawable/ic_bike.xml b/android/app/src/main/res/drawable/ic_bike.xml
new file mode 100644
index 00000000..c77984a7
--- /dev/null
+++ b/android/app/src/main/res/drawable/ic_bike.xml
@@ -0,0 +1,36 @@
+<vector xmlns:android="http://schemas.android.com/apk/res/android"
+    android:width="24dp"
+    android:height="24dp"
+    android:viewportWidth="24"
+    android:viewportHeight="24">
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M3 17.5 A2.5 2.5 0 1 0 8 17.5 A2.5 2.5 0 1 0 3 17.5"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M16 17.5 A2.5 2.5 0 1 0 21 17.5 A2.5 2.5 0 1 0 16 17.5"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M15 6H9L6 14h12l-2-7z"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M6 14H3l-.5 1.5"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M18 14h2l.5 1.5"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+</vector>
diff --git a/android/app/src/main/res/drawable/ic_bookmark.xml b/android/app/src/main/res/drawable/ic_bookmark.xml
new file mode 100644
index 00000000..30ba7e71
--- /dev/null
+++ b/android/app/src/main/res/drawable/ic_bookmark.xml
@@ -0,0 +1,12 @@
+<vector xmlns:android="http://schemas.android.com/apk/res/android"
+    android:width="24dp"
+    android:height="24dp"
+    android:viewportWidth="24"
+    android:viewportHeight="24">
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+</vector>
diff --git a/android/app/src/main/res/drawable/ic_bookmark_fill.xml b/android/app/src/main/res/drawable/ic_bookmark_fill.xml
new file mode 100644
index 00000000..01396c30
--- /dev/null
+++ b/android/app/src/main/res/drawable/ic_bookmark_fill.xml
@@ -0,0 +1,12 @@
+<vector xmlns:android="http://schemas.android.com/apk/res/android"
+    android:width="24dp"
+    android:height="24dp"
+    android:viewportWidth="24"
+    android:viewportHeight="24">
+    <path
+        android:fillColor="#FF000000"
+        android:pathData="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+</vector>
diff --git a/android/app/src/main/res/drawable/ic_chev_l.xml b/android/app/src/main/res/drawable/ic_chev_l.xml
new file mode 100644
index 00000000..32cfc789
--- /dev/null
+++ b/android/app/src/main/res/drawable/ic_chev_l.xml
@@ -0,0 +1,12 @@
+<vector xmlns:android="http://schemas.android.com/apk/res/android"
+    android:width="24dp"
+    android:height="24dp"
+    android:viewportWidth="24"
+    android:viewportHeight="24">
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M15 18 L9 12 L15 6"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+</vector>
diff --git a/android/app/src/main/res/drawable/ic_chev_r.xml b/android/app/src/main/res/drawable/ic_chev_r.xml
new file mode 100644
index 00000000..004f3e4b
--- /dev/null
+++ b/android/app/src/main/res/drawable/ic_chev_r.xml
@@ -0,0 +1,12 @@
+<vector xmlns:android="http://schemas.android.com/apk/res/android"
+    android:width="24dp"
+    android:height="24dp"
+    android:viewportWidth="24"
+    android:viewportHeight="24">
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M9 18 L15 12 L9 6"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+</vector>
diff --git a/android/app/src/main/res/drawable/ic_clock.xml b/android/app/src/main/res/drawable/ic_clock.xml
new file mode 100644
index 00000000..3d1aaf93
--- /dev/null
+++ b/android/app/src/main/res/drawable/ic_clock.xml
@@ -0,0 +1,18 @@
+<vector xmlns:android="http://schemas.android.com/apk/res/android"
+    android:width="24dp"
+    android:height="24dp"
+    android:viewportWidth="24"
+    android:viewportHeight="24">
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M2 12 A10 10 0 1 0 22 12 A10 10 0 1 0 2 12"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M12 6 L12 12 L16 14"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+</vector>
diff --git a/android/app/src/main/res/drawable/ic_close.xml b/android/app/src/main/res/drawable/ic_close.xml
new file mode 100644
index 00000000..7b0303de
--- /dev/null
+++ b/android/app/src/main/res/drawable/ic_close.xml
@@ -0,0 +1,18 @@
+<vector xmlns:android="http://schemas.android.com/apk/res/android"
+    android:width="24dp"
+    android:height="24dp"
+    android:viewportWidth="24"
+    android:viewportHeight="24">
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M18 6 L6 18"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M6 6 L18 18"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+</vector>
diff --git a/android/app/src/main/res/drawable/ic_collapse.xml b/android/app/src/main/res/drawable/ic_collapse.xml
new file mode 100644
index 00000000..882f91cf
--- /dev/null
+++ b/android/app/src/main/res/drawable/ic_collapse.xml
@@ -0,0 +1,30 @@
+<vector xmlns:android="http://schemas.android.com/apk/res/android"
+    android:width="24dp"
+    android:height="24dp"
+    android:viewportWidth="24"
+    android:viewportHeight="24">
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M4 14 L10 14 L10 20"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M20 10 L14 10 L14 4"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M10 14 L3 21"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M21 3 L14 10"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+</vector>
diff --git a/android/app/src/main/res/drawable/ic_compass.xml b/android/app/src/main/res/drawable/ic_compass.xml
new file mode 100644
index 00000000..7e189683
--- /dev/null
+++ b/android/app/src/main/res/drawable/ic_compass.xml
@@ -0,0 +1,18 @@
+<vector xmlns:android="http://schemas.android.com/apk/res/android"
+    android:width="24dp"
+    android:height="24dp"
+    android:viewportWidth="24"
+    android:viewportHeight="24">
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M2 12 A10 10 0 1 0 22 12 A10 10 0 1 0 2 12"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M16.24 7.76 L14.12 14.12 L7.76 16.24 L9.88 9.88 L16.24 7.76 Z"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+</vector>
diff --git a/android/app/src/main/res/drawable/ic_edit.xml b/android/app/src/main/res/drawable/ic_edit.xml
new file mode 100644
index 00000000..42f581d2
--- /dev/null
+++ b/android/app/src/main/res/drawable/ic_edit.xml
@@ -0,0 +1,18 @@
+<vector xmlns:android="http://schemas.android.com/apk/res/android"
+    android:width="24dp"
+    android:height="24dp"
+    android:viewportWidth="24"
+    android:viewportHeight="24">
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M18.5 2.5a2.121 2.121 2 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+</vector>
diff --git a/android/app/src/main/res/drawable/ic_expand.xml b/android/app/src/main/res/drawable/ic_expand.xml
new file mode 100644
index 00000000..47ec193c
--- /dev/null
+++ b/android/app/src/main/res/drawable/ic_expand.xml
@@ -0,0 +1,30 @@
+<vector xmlns:android="http://schemas.android.com/apk/res/android"
+    android:width="24dp"
+    android:height="24dp"
+    android:viewportWidth="24"
+    android:viewportHeight="24">
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M15 3 L21 3 L21 9"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M9 21 L3 21 L3 15"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M21 3 L14 10"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M3 21 L10 14"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+</vector>
diff --git a/android/app/src/main/res/drawable/ic_heart.xml b/android/app/src/main/res/drawable/ic_heart.xml
new file mode 100644
index 00000000..c53e8dfc
--- /dev/null
+++ b/android/app/src/main/res/drawable/ic_heart.xml
@@ -0,0 +1,12 @@
+<vector xmlns:android="http://schemas.android.com/apk/res/android"
+    android:width="24dp"
+    android:height="24dp"
+    android:viewportWidth="24"
+    android:viewportHeight="24">
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+</vector>
diff --git a/android/app/src/main/res/drawable/ic_heart_fill.xml b/android/app/src/main/res/drawable/ic_heart_fill.xml
new file mode 100644
index 00000000..59da0b60
--- /dev/null
+++ b/android/app/src/main/res/drawable/ic_heart_fill.xml
@@ -0,0 +1,12 @@
+<vector xmlns:android="http://schemas.android.com/apk/res/android"
+    android:width="24dp"
+    android:height="24dp"
+    android:viewportWidth="24"
+    android:viewportHeight="24">
+    <path
+        android:fillColor="#FF000000"
+        android:pathData="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+</vector>
diff --git a/android/app/src/main/res/drawable/ic_layers.xml b/android/app/src/main/res/drawable/ic_layers.xml
new file mode 100644
index 00000000..f9cf5a98
--- /dev/null
+++ b/android/app/src/main/res/drawable/ic_layers.xml
@@ -0,0 +1,24 @@
+<vector xmlns:android="http://schemas.android.com/apk/res/android"
+    android:width="24dp"
+    android:height="24dp"
+    android:viewportWidth="24"
+    android:viewportHeight="24">
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M12 2 L2 7 L12 12 L22 7 L12 2 Z"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M2 17 L12 22 L22 17"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M2 12 L12 17 L22 12"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+</vector>
diff --git a/android/app/src/main/res/drawable/ic_map.xml b/android/app/src/main/res/drawable/ic_map.xml
new file mode 100644
index 00000000..7129c2e9
--- /dev/null
+++ b/android/app/src/main/res/drawable/ic_map.xml
@@ -0,0 +1,24 @@
+<vector xmlns:android="http://schemas.android.com/apk/res/android"
+    android:width="24dp"
+    android:height="24dp"
+    android:viewportWidth="24"
+    android:viewportHeight="24">
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M1 6 L1 22 L8 18 L16 22 L23 18 L23 2 L16 6 L8 2 L1 6 Z"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M8 2 L8 18"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M16 6 L16 22"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+</vector>
diff --git a/android/app/src/main/res/drawable/ic_menu.xml b/android/app/src/main/res/drawable/ic_menu.xml
new file mode 100644
index 00000000..b95ba200
--- /dev/null
+++ b/android/app/src/main/res/drawable/ic_menu.xml
@@ -0,0 +1,24 @@
+<vector xmlns:android="http://schemas.android.com/apk/res/android"
+    android:width="24dp"
+    android:height="24dp"
+    android:viewportWidth="24"
+    android:viewportHeight="24">
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M3 6 L21 6"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M3 12 L21 12"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M3 18 L21 18"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+</vector>
diff --git a/android/app/src/main/res/drawable/ic_pin.xml b/android/app/src/main/res/drawable/ic_pin.xml
new file mode 100644
index 00000000..d0e5c7d5
--- /dev/null
+++ b/android/app/src/main/res/drawable/ic_pin.xml
@@ -0,0 +1,18 @@
+<vector xmlns:android="http://schemas.android.com/apk/res/android"
+    android:width="24dp"
+    android:height="24dp"
+    android:viewportWidth="24"
+    android:viewportHeight="24">
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M9 10 A3 3 0 1 0 15 10 A3 3 0 1 0 9 10"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+</vector>
diff --git a/android/app/src/main/res/drawable/ic_plus.xml b/android/app/src/main/res/drawable/ic_plus.xml
new file mode 100644
index 00000000..c078cbad
--- /dev/null
+++ b/android/app/src/main/res/drawable/ic_plus.xml
@@ -0,0 +1,18 @@
+<vector xmlns:android="http://schemas.android.com/apk/res/android"
+    android:width="24dp"
+    android:height="24dp"
+    android:viewportWidth="24"
+    android:viewportHeight="24">
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M12 5 L12 19"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M5 12 L19 12"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+</vector>
diff --git a/android/app/src/main/res/drawable/ic_rain.xml b/android/app/src/main/res/drawable/ic_rain.xml
new file mode 100644
index 00000000..80ab7a3e
--- /dev/null
+++ b/android/app/src/main/res/drawable/ic_rain.xml
@@ -0,0 +1,30 @@
+<vector xmlns:android="http://schemas.android.com/apk/res/android"
+    android:width="24dp"
+    android:height="24dp"
+    android:viewportWidth="24"
+    android:viewportHeight="24">
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M8 19 L8 21"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M12 21 L12 23"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M16 19 L16 21"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+</vector>
diff --git a/android/app/src/main/res/drawable/ic_route.xml b/android/app/src/main/res/drawable/ic_route.xml
new file mode 100644
index 00000000..30de4863
--- /dev/null
+++ b/android/app/src/main/res/drawable/ic_route.xml
@@ -0,0 +1,12 @@
+<vector xmlns:android="http://schemas.android.com/apk/res/android"
+    android:width="24dp"
+    android:height="24dp"
+    android:viewportWidth="24"
+    android:viewportHeight="24">
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M3 17l4-8 4 4 4-6 4 10"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+</vector>
diff --git a/android/app/src/main/res/drawable/ic_send.xml b/android/app/src/main/res/drawable/ic_send.xml
new file mode 100644
index 00000000..058c75f6
--- /dev/null
+++ b/android/app/src/main/res/drawable/ic_send.xml
@@ -0,0 +1,18 @@
+<vector xmlns:android="http://schemas.android.com/apk/res/android"
+    android:width="24dp"
+    android:height="24dp"
+    android:viewportWidth="24"
+    android:viewportHeight="24">
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M22 2 L11 13"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M22 2 L15 22 L11 13 L2 9 L22 2 Z"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+</vector>
diff --git a/android/app/src/main/res/drawable/ic_share.xml b/android/app/src/main/res/drawable/ic_share.xml
new file mode 100644
index 00000000..a57e14c6
--- /dev/null
+++ b/android/app/src/main/res/drawable/ic_share.xml
@@ -0,0 +1,36 @@
+<vector xmlns:android="http://schemas.android.com/apk/res/android"
+    android:width="24dp"
+    android:height="24dp"
+    android:viewportWidth="24"
+    android:viewportHeight="24">
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M15 5 A3 3 0 1 0 21 5 A3 3 0 1 0 15 5"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M3 12 A3 3 0 1 0 9 12 A3 3 0 1 0 3 12"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M15 19 A3 3 0 1 0 21 19 A3 3 0 1 0 15 19"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M8.59 13.51 L15.42 17.49"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M15.41 6.51 L8.59 10.49"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+</vector>
diff --git a/android/app/src/main/res/drawable/ic_sliders.xml b/android/app/src/main/res/drawable/ic_sliders.xml
new file mode 100644
index 00000000..d67edee0
--- /dev/null
+++ b/android/app/src/main/res/drawable/ic_sliders.xml
@@ -0,0 +1,42 @@
+<vector xmlns:android="http://schemas.android.com/apk/res/android"
+    android:width="24dp"
+    android:height="24dp"
+    android:viewportWidth="24"
+    android:viewportHeight="24">
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M4 6 L20 6"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M4 12 L20 12"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M4 18 L20 18"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+    <path
+        android:fillColor="#FF000000"
+        android:pathData="M6 6 A2 2 0 1 0 10 6 A2 2 0 1 0 6 6"
+        android:strokeColor="#00000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+    <path
+        android:fillColor="#FF000000"
+        android:pathData="M14 12 A2 2 0 1 0 18 12 A2 2 0 1 0 14 12"
+        android:strokeColor="#00000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+    <path
+        android:fillColor="#FF000000"
+        android:pathData="M8 18 A2 2 0 1 0 12 18 A2 2 0 1 0 8 18"
+        android:strokeColor="#00000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+</vector>
diff --git a/android/app/src/main/res/drawable/ic_sparkle.xml b/android/app/src/main/res/drawable/ic_sparkle.xml
new file mode 100644
index 00000000..7b9c39be
--- /dev/null
+++ b/android/app/src/main/res/drawable/ic_sparkle.xml
@@ -0,0 +1,12 @@
+<vector xmlns:android="http://schemas.android.com/apk/res/android"
+    android:width="24dp"
+    android:height="24dp"
+    android:viewportWidth="24"
+    android:viewportHeight="24">
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M12 3L13.5 8.5L19 8.5L14.75 11.5L16.5 17L12 14L7.5 17L9.25 11.5L5 8.5L10.5 8.5Z"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+</vector>
diff --git a/android/app/src/main/res/drawable/ic_star.xml b/android/app/src/main/res/drawable/ic_star.xml
new file mode 100644
index 00000000..d863e5ba
--- /dev/null
+++ b/android/app/src/main/res/drawable/ic_star.xml
@@ -0,0 +1,12 @@
+<vector xmlns:android="http://schemas.android.com/apk/res/android"
+    android:width="24dp"
+    android:height="24dp"
+    android:viewportWidth="24"
+    android:viewportHeight="24">
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M12 2 L15.09 8.26 L22 9.27 L17 14.14 L18.18 21.02 L12 17.77 L5.82 21.02 L7 14.14 L2 9.27 L8.91 8.26 L12 2 Z"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+</vector>
diff --git a/android/app/src/main/res/drawable/ic_star_fill.xml b/android/app/src/main/res/drawable/ic_star_fill.xml
new file mode 100644
index 00000000..440e7c90
--- /dev/null
+++ b/android/app/src/main/res/drawable/ic_star_fill.xml
@@ -0,0 +1,12 @@
+<vector xmlns:android="http://schemas.android.com/apk/res/android"
+    android:width="24dp"
+    android:height="24dp"
+    android:viewportWidth="24"
+    android:viewportHeight="24">
+    <path
+        android:fillColor="#FF000000"
+        android:pathData="M12 2 L15.09 8.26 L22 9.27 L17 14.14 L18.18 21.02 L12 17.77 L5.82 21.02 L7 14.14 L2 9.27 L8.91 8.26 L12 2 Z"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+</vector>
diff --git a/android/app/src/main/res/drawable/ic_storm.xml b/android/app/src/main/res/drawable/ic_storm.xml
new file mode 100644
index 00000000..788b33ad
--- /dev/null
+++ b/android/app/src/main/res/drawable/ic_storm.xml
@@ -0,0 +1,18 @@
+<vector xmlns:android="http://schemas.android.com/apk/res/android"
+    android:width="24dp"
+    android:height="24dp"
+    android:viewportWidth="24"
+    android:viewportHeight="24">
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M13 11 L9 17 L15 17 L11 23"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+</vector>
diff --git a/android/app/src/main/res/drawable/ic_sun.xml b/android/app/src/main/res/drawable/ic_sun.xml
new file mode 100644
index 00000000..763e43f2
--- /dev/null
+++ b/android/app/src/main/res/drawable/ic_sun.xml
@@ -0,0 +1,60 @@
+<vector xmlns:android="http://schemas.android.com/apk/res/android"
+    android:width="24dp"
+    android:height="24dp"
+    android:viewportWidth="24"
+    android:viewportHeight="24">
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M7 12 A5 5 0 1 0 17 12 A5 5 0 1 0 7 12"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M12 1 L12 3"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M12 21 L12 23"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M4.22 4.22 L5.64 5.64"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M18.36 18.36 L19.78 19.78"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M1 12 L3 12"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M21 12 L23 12"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M4.22 19.78 L5.64 18.36"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M18.36 5.64 L19.78 4.22"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+</vector>
diff --git a/android/app/src/main/res/drawable/ic_therm.xml b/android/app/src/main/res/drawable/ic_therm.xml
new file mode 100644
index 00000000..a10df026
--- /dev/null
+++ b/android/app/src/main/res/drawable/ic_therm.xml
@@ -0,0 +1,12 @@
+<vector xmlns:android="http://schemas.android.com/apk/res/android"
+    android:width="24dp"
+    android:height="24dp"
+    android:viewportWidth="24"
+    android:viewportHeight="24">
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+</vector>
diff --git a/android/app/src/main/res/drawable/ic_trash.xml b/android/app/src/main/res/drawable/ic_trash.xml
new file mode 100644
index 00000000..789789d0
--- /dev/null
+++ b/android/app/src/main/res/drawable/ic_trash.xml
@@ -0,0 +1,18 @@
+<vector xmlns:android="http://schemas.android.com/apk/res/android"
+    android:width="24dp"
+    android:height="24dp"
+    android:viewportWidth="24"
+    android:viewportHeight="24">
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M3 6 L5 6 L21 6"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+</vector>
diff --git a/android/app/src/main/res/drawable/ic_wind.xml b/android/app/src/main/res/drawable/ic_wind.xml
new file mode 100644
index 00000000..e6d62439
--- /dev/null
+++ b/android/app/src/main/res/drawable/ic_wind.xml
@@ -0,0 +1,12 @@
+<vector xmlns:android="http://schemas.android.com/apk/res/android"
+    android:width="24dp"
+    android:height="24dp"
+    android:viewportWidth="24"
+    android:viewportHeight="24">
+    <path
+        android:fillColor="#00000000"
+        android:pathData="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"
+        android:strokeColor="#FF000000"
+        android:strokeLineCap="round"
+        android:strokeLineJoin="round" />
+</vector>
diff --git a/android/app/src/test/java/com/laneshadow/ui/atoms/IconSizeTest.kt b/android/app/src/test/java/com/laneshadow/ui/atoms/IconSizeTest.kt
new file mode 100644
index 00000000..0a829c81
--- /dev/null
+++ b/android/app/src/test/java/com/laneshadow/ui/atoms/IconSizeTest.kt
@@ -0,0 +1,34 @@
+package com.laneshadow.ui.atoms
+
+import androidx.compose.ui.unit.dp
+import java.io.File
+import org.junit.Assert.assertEquals
+import org.junit.Assert.assertFalse
+import org.junit.Test
+
+class IconSizeTest {
+    @Test
+    fun iconSize_each_case_maps_to_sizing_token() {
+        val metrics = IconTokenMetrics.fromJson(tokenJson())
+
+        assertEquals(metrics.iconXs, IconSize.Xs.resolve(metrics))
+        assertEquals(metrics.iconSm, IconSize.Sm.resolve(metrics))
+        assertEquals(metrics.iconMd, IconSize.Md.resolve(metrics))
+        assertEquals(metrics.iconLg, IconSize.Lg.resolve(metrics))
+        assertEquals(metrics.iconXl, IconSize.Xl.resolve(metrics))
+        assertEquals(1.5.dp, metrics.strokeWidth)
+    }
+
+    @Test
+    fun iconSize_source_does_not_define_dp_literals() {
+        val source = File("../app/src/main/java/com/laneshadow/ui/atoms/IconSize.kt").readText()
+
+        assertFalse(Regex("""\d+(?:\.\d+)?\.dp""").containsMatchIn(source))
+    }
+
+    private fun tokenJson(): String =
+        listOf(
+            File("../tokens/platforms/kotlin/src/main/assets/semantic.tokens.json"),
+            File("../../tokens/platforms/kotlin/src/main/assets/semantic.tokens.json"),
+        ).first(File::exists).readText()
+}
diff --git a/android/app/src/test/java/com/laneshadow/ui/atoms/LSIconTypeSafetyTest.kt b/android/app/src/test/java/com/laneshadow/ui/atoms/LSIconTypeSafetyTest.kt
new file mode 100644
index 00000000..78160da4
--- /dev/null
+++ b/android/app/src/test/java/com/laneshadow/ui/atoms/LSIconTypeSafetyTest.kt
@@ -0,0 +1,31 @@
+package com.laneshadow.ui.atoms
+
+import androidx.compose.ui.graphics.Color
+import java.io.File
+import org.junit.Assert.assertFalse
+import org.junit.Assert.assertTrue
+import org.junit.Test
+
+class LSIconTypeSafetyTest {
+    @Test
+    fun icon_color_param_rejects_raw_Color() {
+        val methods = Class
+            .forName("com.laneshadow.ui.atoms.LSIconKt")
+            .declaredMethods
+            .filter { it.name == "LSIcon" }
+
+        assertTrue(methods.isNotEmpty())
+        assertTrue(methods.any { method -> method.parameterTypes.any { it == IconColor::class.java } })
+        assertFalse(methods.any { method -> method.parameterTypes.any { it == Color::class.java } })
+    }
+
+    @Test
+    fun icon_rendering_uses_token_stroke_not_drawable_width() {
+        val source = File("../app/src/main/java/com/laneshadow/ui/atoms/LSIcon.kt").readText()
+
+        assertTrue(source.contains("metrics.strokeWidth.toPx()"))
+        assertTrue(source.contains("width = strokeWidth"))
+        assertFalse(source.contains("painter" + "Resource"))
+        assertFalse(source.contains("R.drawable." + "ic_"))
+    }
+}
