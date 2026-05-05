# IDLE-S06-AND-T02 — Android Mapbox warm-paper style + copper favorite pin overlays on IdleScreen

```
TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer
SPRINT:     sprint-06-idlescreen → ../SPRINT.md
PRD_REFS:   UC-MAP-01, UC-SCR-01, UC-FID-01

RUNTIME_COMMANDS:
  test:      ./gradlew :app:testDebugUnitTest
  test_inst: ./gradlew :app:connectedDebugAndroidTest
  typecheck: ./gradlew :app:compileDebugKotlin
  lint:      ./gradlew detekt
  tokens:    scripts/tokens/enforce-native-compliance.sh
```

---

## OUTCOME

`LSMap` accepts a `favoriteLocations: List<FavoriteLocation>` parameter and renders each as a Mapbox `PointAnnotation` with copper fill (`GeneratedTokens.color.Signal.default`) + white ring (`GeneratedTokens.color.Surface.card`); IdleScreen passes the list through and tags the call site `idlescreen-map`. Warm-paper style URL is already wired (`GeneratedTokens.map.style.light = mapbox://styles/laneshadow/clxwarm01`).

---

## 🚫 CRITICAL CONSTRAINTS

- **MUST** verify `GeneratedTokens.map.style.light` resolves to `mapbox://styles/laneshadow/clxwarm01` (warm-paper) — no new style URL needed.
- **MUST** add `favoriteLocations: List<FavoriteLocation>` parameter to `LSMap` composable signature; default `emptyList()` for backward compatibility.
- **MUST** render each FavoriteLocation as a Mapbox `PointAnnotation` via `AnnotationManager` API: copper fill `GeneratedTokens.color.Signal.default`, white ring `GeneratedTokens.color.Surface.card`, outer diameter 10dp, ring width 2dp.
- **MUST** resolve colors via `GeneratedTokens.color.Signal.default` and `GeneratedTokens.color.Surface.card` — never `Color(0xFF...)` or hex literals.
- **MUST** update `IdleScreen.kt` to pass `favoriteLocations = uiState.favoriteLocations` to LSMap and add `Modifier.testTag("idlescreen-map")`.
- **NEVER** hardcode Mapbox style URLs as string literals — always reference `GeneratedTokens.map.style.{light,dark}`.
- **NEVER** add favorite pin rendering directly inside the AndroidView factory lambda — encapsulate in internal `applyFavoritePinAnnotations(mapView, favorites)` for testability.
- **STRICTLY** keep LSMap public API backward-compatible (default `emptyList()` so PlanningScreen, RouteDetailsScreen unaffected).
- **STRICTLY** use Mapbox `AnnotationManager` API (not Canvas overlay) for pin rendering — Canvas overlay reserved for animated polylines.

---

## DONE WHEN

- [ ] AC-1: Warm-paper style URI applied for light theme (PRIMARY)
- [ ] AC-2: Favorite pin annotation count matches input list; correct token colors
- [ ] AC-3: LSMap public API backward-compatible with default empty favorites
- [ ] AC-4: Token compliance — no hardcoded color literals in LSMap.kt
- [ ] AC-5: testTag `idlescreen-map` applied at IdleScreen LSMap call site
- [ ] All `./gradlew` exit 0; native compliance script passes
- [ ] `git diff --name-only` ⊆ writeAllowed

---

## ACCEPTANCE CRITERIA

### AC-1: Warm-paper style URI applied [PRIMARY]
- **GIVEN** `LSMap` with `MapMode.Interactive` and `isDarkTheme == false`
- **WHEN** `resolveLSMapStyleUri(isDarkTheme = false)` is called
- **THEN** returned URI equals `GeneratedTokens.map.style.light` (`mapbox://styles/laneshadow/clxwarm01`)
- **VERIFY:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.LSMapTest.style_tokens_switch_and_request_reload_when_theme_changes_in_place'`

### AC-2: Favorite pin annotation count + token colors
- **GIVEN** `favoriteLocations = [FavoriteLocation(id='f1', lat=37.81, lon=-122.47, label='Home'), FavoriteLocation(id='f2', lat=37.79, lon=-122.41, label='Work')]`
- **WHEN** `resolveLSMapFavoritePinSpecs(favoriteLocations)` is called
- **THEN** returned list has 2 entries; each `color == GeneratedTokens.color.Signal.default` and `ringColor == GeneratedTokens.color.Surface.card`
- **VERIFY:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.LSMapTest.favorite_pin_specs_match_input_count_and_use_token_colors'`

### AC-3: LSMap public API backward-compatible
- **GIVEN** Existing call site `LSMap(mode, camera)` without `favoriteLocations`
- **WHEN** Composable compiles
- **THEN** No compile error; no pins rendered (empty annotations)
- **VERIFY:** `./gradlew :app:compileDebugKotlin`

### AC-4: Token compliance — no hardcoded color literals
- **GIVEN** `LSMap.kt` and `IdleScreen.kt` after modifications
- **WHEN** `enforce-native-compliance.sh` runs
- **THEN** Exit 0 with no violations
- **VERIFY:** `scripts/tokens/enforce-native-compliance.sh`

### AC-5: testTag idlescreen-map applied
- **GIVEN** `IdleScreen.kt` modified to add `Modifier.testTag("idlescreen-map")` to LSMap composable
- **WHEN** `composeRule.onNodeWithTag("idlescreen-map")` queried in instrumented test
- **THEN** Node found without assertion error
- **VERIFY:** `./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.templates.IdleScreenInstrumentedTest.tc1_default_story_renders_all_nodes'`

---

## TEST CRITERIA

| ID    | Statement                                                                          | Maps To | Type        |
|-------|------------------------------------------------------------------------------------|---------|-------------|
| TC-1  | resolveLSMapStyleUri(isDarkTheme=false) returns GeneratedTokens.map.style.light    | AC-1    | happy_path  |
| TC-2  | 2 FavoriteLocations → 2 specs with Signal.default fill + Surface.card ring          | AC-2    | happy_path  |
| TC-3  | LSMap call without favoriteLocations parameter compiles without error              | AC-3    | regression  |
| TC-4  | enforce-native-compliance.sh exits 0 after LSMap.kt + IdleScreen.kt modifications  | AC-4    | regression  |
| TC-5  | composeRule.onNodeWithTag('idlescreen-map') is displayed in instrumented test       | AC-5    | happy_path  |

---

## SCOPE

**writeAllowed:**
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt` (MODIFY — add `favoriteLocations` param + internal `applyFavoritePinAnnotations`)
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSMapTypes.kt` (MODIFY — add `LSMapFavoritePinSpec` data class + `resolveLSMapFavoritePinSpecs` internal fun)
- `android/app/src/main/java/com/laneshadow/ui/templates/IdleScreen.kt` (MODIFY — pass `favoriteLocations` + `testTag("idlescreen-map")`)
- `android/app/src/test/java/com/laneshadow/ui/atoms/LSMapTest.kt` (MODIFY — add `favorite_pin_specs_match_input_count_and_use_token_colors` test)

**writeProhibited:**
- `ios/**`, `tokens/**`, `server/**`, `react-native/**`
- `android/app/src/main/java/com/laneshadow/ui/idle/IdleViewModel.kt` — out of scope (T01)
- `android/app/src/main/java/com/laneshadow/ui/idle/IdleUiState.kt` — out of scope (T01)

---

## BOUNDARIES

✅ **Always:**
- Use Mapbox `AnnotationManager` API for point overlays
- Encapsulate color resolution in internal resolver fns (testable without Compose runtime)

⚠️ **Ask First:**
- Adding new `LSMap` parameters beyond `favoriteLocations`
- Modifying existing `resolveLSMapAnnotationSpec` callers

---

## DELIVERABLE

- `LSMap.kt` (MODIFY): adds `favoriteLocations: List<FavoriteLocation> = emptyList()` param + internal pin annotation application
- `LSMapTypes.kt` (MODIFY): `LSMapFavoritePinSpec` data class + `resolveLSMapFavoritePinSpecs` internal fun
- `IdleScreen.kt` (MODIFY): passes `favoriteLocations = uiState.favoriteLocations` + `Modifier.testTag("idlescreen-map")`
- `LSMapTest.kt` (MODIFY): adds new test method

---

## AGENT INSTRUCTIONS

For each AC: RED → GREEN → REFACTOR. Token-color tests run as pure JVM unit tests against `resolveLSMapFavoritePinSpecs`; the AnnotationManager wiring runs only inside `AndroidView.factory` (verified by AC-5 instrumented test).

---

## READING LIST

1. `android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt:44-184` **[PRIMARY PATTERN]** — composable signature + AndroidView factory; add `favoriteLocations` param + `applyFavoritePinAnnotations`
2. `android/app/src/main/java/com/laneshadow/ui/atoms/LSMapTypes.kt:161-280` — `LSMapRenderModel`, `resolveLSMapStyleUri`; mirror pattern for `LSMapFavoritePinSpec`
3. `android/app/src/main/java/com/laneshadow/ui/templates/IdleScreen.kt:99-108` — LSMap call site
4. `android/app/src/test/java/com/laneshadow/ui/atoms/LSMapTest.kt:1-189` — token-color test pattern (`three_polylines_use_token_colors`)
5. `.spec/design/system/views/idle-screen/idle-screen.html` — visual ground truth for copper dot + white ring sizing

---

## EVIDENCE GATES

| Gate | Command | Expected |
|------|---------|----------|
| Kotlin typecheck | `./gradlew :app:compileDebugKotlin` | Exit 0 |
| Unit tests (LSMapTest) | `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.LSMapTest'` | Exit 0, all pass |
| Token compliance | `scripts/tokens/enforce-native-compliance.sh` | Exit 0 |
| Instrumented test — testTag | `./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.templates.IdleScreenInstrumentedTest.tc1_default_story_renders_all_nodes'` | Exit 0 |

---

## OUT OF SCOPE

- Pin tap interactions (deferred to post-Sprint-10)
- Animated pin entry — use Mapbox default fade-in
- Custom marker icons (use simple dot+ring)

---

## CONTEXT

**Current state:** `LSMap.kt:99-108` is already a real Mapbox composable using `MapMode.Interactive` and `CameraPosition`. Warm-paper style URL is wired in tokens. Pin annotation rendering not yet implemented.

**Gap:** Sprint 6 gate requires copper pin dots over warm-paper map; design review pipeline will fail without them.

---

## REVIEW (for kotlin-reviewer)

**Must pass:**
- One test per AC; pure JVM unit tests for color resolution
- All colors via `GeneratedTokens.*` paths (grep proof — no `Color(0x...)`)
- LSMap public API backward-compatible (`favoriteLocations: List<FavoriteLocation> = emptyList()`)
- testTag `idlescreen-map` is on the Box wrapper (not inside AndroidView)
- SCOPE respected

**Should verify:**
- AnnotationManager properly cleared between recompositions
- Pin contentDescription set to `FavoriteLocation.label` (a11y)

**Verdict:** APPROVED | NEEDS_FIXES

---

## DESIGN

**References:**
- `.spec/design/system/views/idle-screen/idle-screen.html`
- `.spec/design/system/views/idle-screen/README.md:69-88` — Token Recipe: Favorite pin fill = `var(--signal-default)`, border = `var(--surface-card)`

**Pattern:** Resolve-then-render — compute `LSMapFavoritePinSpec` list from `FavoriteLocation` list using internal resolver fn (mirrors `resolveLSMapAnnotationSpec` at `LSMapTypes.kt:230-240`); pass specs into `configureMapView`; apply via `PointAnnotationManager`.

**Pattern source:** `android/app/src/main/java/com/laneshadow/ui/atoms/LSMapTypes.kt:230-240`

**Anti-pattern:** Inline color resolution inside `AndroidView` factory lambda — makes token compliance testing impossible.

---

## DEPENDENCIES

- **Depends on:** IDLE-S06-AND-T01 (provides `FavoriteLocation` type + `uiState.favoriteLocations`)
- **Blocks:** IDLE-S06-AND-T04
- **Parallel:** IDLE-S06-IOS-T02 (iOS twin)

---

## CODING STANDARDS

- `RULES.md` §Accessibility Standards (Android) — `contentDescription` on annotations
- `RULES.md` §Cross-Platform Component Parity — sandbox story IDs unchanged
- `RULES.md` §Pre-Commit Checks — `enforce-native-compliance.sh` MUST pass

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"GIVEN isDarkTheme=false WHEN resolveLSMapStyleUri called THEN returns GeneratedTokens.map.style.light warm-paper URL","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.LSMapTest.style_tokens_switch_and_request_reload_when_theme_changes_in_place'"},
    {"id":"AC-2","type":"acceptance_criterion","description":"GIVEN 2 FavoriteLocations WHEN resolveLSMapFavoritePinSpecs called THEN 2 specs with Signal.default fill + Surface.card ring","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.LSMapTest.favorite_pin_specs_match_input_count_and_use_token_colors'"},
    {"id":"AC-3","type":"acceptance_criterion","description":"GIVEN LSMap call without favoriteLocations WHEN compiled THEN no error","verify":"./gradlew :app:compileDebugKotlin"},
    {"id":"AC-4","type":"acceptance_criterion","description":"GIVEN modified LSMap.kt WHEN enforce-native-compliance.sh runs THEN exit 0","verify":"scripts/tokens/enforce-native-compliance.sh"},
    {"id":"AC-5","type":"acceptance_criterion","description":"GIVEN IdleScreen with testTag('idlescreen-map') WHEN composeRule queries it THEN node found","verify":"./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.templates.IdleScreenInstrumentedTest.tc1_default_story_renders_all_nodes'"},
    {"id":"TC-1","type":"test_criterion","description":"warm-paper style URI matches GeneratedTokens.map.style.light","maps_to_ac":"AC-1","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.LSMapTest.style_tokens_switch_and_request_reload_when_theme_changes_in_place'"},
    {"id":"TC-2","type":"test_criterion","description":"2 FavoriteLocations → 2 specs with correct token colors","maps_to_ac":"AC-2","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.LSMapTest.favorite_pin_specs_match_input_count_and_use_token_colors'"},
    {"id":"TC-3","type":"test_criterion","description":"Default empty favoriteLocations compiles","maps_to_ac":"AC-3","verify":"./gradlew :app:compileDebugKotlin"},
    {"id":"TC-4","type":"test_criterion","description":"No hardcoded color literals after changes","maps_to_ac":"AC-4","verify":"scripts/tokens/enforce-native-compliance.sh"},
    {"id":"TC-5","type":"test_criterion","description":"testTag idlescreen-map findable","maps_to_ac":"AC-5","verify":"./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.templates.IdleScreenInstrumentedTest.tc1_default_story_renders_all_nodes'"}
  ]
}
-->
