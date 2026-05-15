# IDLE-S06-AND-T02 — Android Mapbox warm-paper map + copper favorite pins

```
TASK_TYPE:  FEATURE
STATUS:     Done
PRIORITY:   P0
EFFORT:     L
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer
SPRINT:     sprint-06-idlescreen → ./SPRINT.md
PRD_REFS:   UC-MAP-01, UC-FID-01

RUNTIME_COMMANDS:
  test:      ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.LSMapTest' --tests 'com.laneshadow.ui.organisms.LSMapLayerTest'
  typecheck: ./gradlew :app:compileDebugKotlin
  lint:      ./gradlew detekt
  tokens:    scripts/tokens/enforce-native-compliance.sh
```

---

## OUTCOME

The Android idle map view renders a real Mapbox warm-paper substrate via `ui/atoms/LSMap.kt` with copper favorite pin overlays plotted from `IdleViewModel.favoriteLocations`. The map host (`ui/organisms/LSMapLayer.kt` + `LSMapLayerSlots.kt`) is architected as a long-lived Composable owning the substrate, camera state, theme wiring, and an overlay slot, so Sprints 07–10 reuse it without remount.

---

## 🚫 CRITICAL CONSTRAINTS

- **MUST** render a real Mapbox `MapView` (or `MapboxMap` Compose binding) inside `LSMap` — no placeholder `Box(Modifier.background(...))` fallback in production code paths
- **MUST** drive substrate color via `LocalLaneShadowTheme.current.colors.mapWarmPaper` (light) and the warm-dark mapping (dark) — never hardcode `Color(0xFFxxxxxx)`
- **MUST** plot copper favorite pins via a dedicated `LSFavoritePinDot` Composable using `LocalLaneShadowTheme.current.colors.signalDefault`
- **MUST** structure `LSMapLayer` as a Composable owning Mapbox lifecycle + an `overlay: @Composable () -> Unit` slot consumed by `IdleScreen.kt` and re-used by Sprint 07+
- **MUST** support theme switching (light ↔ dark) without recreating the underlying `MapView` (tile substrate + pin tint re-resolve via `LaunchedEffect(LocalLaneShadowTheme.current)` keyed re-styling, not `key()` remount)
- **NEVER** instantiate Mapbox SDK inside `IdleScreen.kt`; the only consumer of the SDK is `LSMap` / `LSMapLayer`
- **NEVER** keep `_state.update {}` for map state outside the dedicated map host (UDF discipline)
- **STRICTLY** preserve canonical sandbox story IDs (`templates.idle.default`, `.no-location`, etc.) per `RULES.md` §Cross-Platform Component Parity

---

## DONE WHEN

- [x] AC-1: IdleScreen renders real Mapbox MapView (no placeholder Box) on first composition (PRIMARY)
- [x] AC-2: One favorite emission → one `LSFavoritePinDot` rendered at correct lat/lng
- [x] AC-3: Theme toggle re-resolves substrate + pins without remount of `MapView`
- [x] AC-4: Empty favorites list → zero pins, no crash, no debug placeholder
- [x] AC-5: `LSMapLayer` exposes overlay slot consumed by Sprint 07+ planning state
- [x] `./gradlew :app:testDebugUnitTest --tests '*LSMap*'` exit 0
- [x] `./gradlew detekt` + token compliance clean
- [x] `git diff --name-only` ⊆ writeAllowed

---

## ACCEPTANCE CRITERIA

### AC-1: Real Mapbox warm-paper substrate replaces placeholder [PRIMARY]
- **GIVEN** `IdleScreen` Composable with default `IdleUiState`
- **WHEN** the screen first composes
- **THEN** the Compose tree contains a Mapbox `MapView` (via `AndroidView` or `MapboxMap` Compose binding) and contains zero "placeholder Box" composables in the map slot
- **VERIFY:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.LSMapTest.idleScreen_rendersRealMapNotPlaceholder'`

### AC-2: Favorite pin renders for each emission
- **GIVEN** `IdleUiState.favoriteLocations == listOf(FavoriteLocation(id="fav-1", lat=37.81, lon=-122.47, label="Highway 1"))`
- **WHEN** map composes with that state
- **THEN** exactly one `LSFavoritePinDot` is plotted at the corresponding map coordinate
- **VERIFY:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.LSMapTest.favoritePin_rendersForEmission'`

### AC-3: Theme toggle re-styles without remount
- **GIVEN** map composed in light theme; pins rendered
- **WHEN** `LocalLaneShadowTheme.current` switches to dark
- **THEN** substrate token + pin tint re-resolve; the underlying `MapView` instance identity is stable across recomposition (no `key()` reset)
- **VERIFY:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.LSMapTest.themeToggle_doesNotRemount'`

### AC-4: Empty favorites list renders zero pins
- **GIVEN** `favoriteLocations == emptyList()`
- **WHEN** map composes
- **THEN** zero `LSFavoritePinDot` Composables emitted; no crash; no debug placeholder
- **VERIFY:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.LSMapTest.emptyFavorites_rendersZeroPins'`

### AC-5: Map host exposes overlay slot for state-specific UI
- **GIVEN** `LSMapLayer` declared with `overlay: @Composable () -> Unit` parameter
- **WHEN** Sprint 06 idle-state passes greeting + chat input via that slot
- **THEN** the same `LSMapLayer` instance can host any other Composable overlay
- **VERIFY:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapLayerTest.overlaySlot_acceptsArbitraryComposable'`

---

## TEST CRITERIA

| ID    | Statement                                                             | Maps To | Type        |
|-------|-----------------------------------------------------------------------|---------|-------------|
| TC-1  | Compose tree contains Mapbox MapView and 0 placeholder Box at map slot | AC-1    | happy_path  |
| TC-2  | One favorite emission → exactly one LSFavoritePinDot                  | AC-2    | happy_path  |
| TC-3  | Theme switch leaves MapView identity stable across recomposition      | AC-3    | edge_case   |
| TC-4  | Empty favorites → zero LSFavoritePinDot, no crash                     | AC-4    | edge_case   |
| TC-5  | overlay slot accepts arbitrary @Composable                            | AC-5    | happy_path  |

---

## SCOPE

**writeAllowed:**
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt` (NEW or MODIFY)
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSMapTypes.kt` (NEW or MODIFY)
- `android/app/src/main/java/com/laneshadow/ui/organisms/LSMapLayer.kt` (NEW)
- `android/app/src/main/java/com/laneshadow/ui/organisms/LSMapLayerSlots.kt` (NEW)
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSFavoritePinDot.kt` (NEW)
- `android/app/src/main/java/com/laneshadow/ui/templates/IdleScreen.kt` (MODIFY — replace placeholder with `LSMapLayer`)
- `android/app/src/test/java/com/laneshadow/ui/atoms/LSMapTest.kt` (NEW)
- `android/app/src/test/java/com/laneshadow/ui/organisms/LSMapLayerTest.kt` (NEW)
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/LSMapStories.kt` (MODIFY — keep canonical IDs)
- `android/app/build.gradle.kts` (MODIFY — Mapbox dependency if missing)

**writeProhibited:**
- `ios/**`, `server/**`, `react-native/**`, `tokens/**`
- `android/app/src/main/java/com/laneshadow/ui/idle/IdleViewModel.kt` — owned by T01
- `android/app/src/main/java/com/laneshadow/data/location/**` — owned by T03
- `android/app/src/androidTest/**` — owned by T04

---

## BOUNDARIES

✅ **Always:**
- Use `LocalLaneShadowTheme.current` for color resolution
- Render pins via `LSFavoritePinDot` molecule (not inline `Canvas { drawCircle(...) }`)
- Keep `LSMapLayer.overlay` slot generic (`@Composable () -> Unit`)

⚠️ **Ask First:**
- Bumping the Mapbox Maps SDK version
- Adding a non-warm-paper map style URL

---

## DELIVERABLE

- `LSMap.kt` (NEW/MODIFY): Compose atom wrapping `MapView` (or `MapboxMap`) with warm-paper styling
- `LSMapTypes.kt` (NEW/MODIFY): map state types (`MapCameraState`, `MapPin`)
- `LSMapLayer.kt` (NEW): organism owning Mapbox lifecycle + overlay slot
- `LSMapLayerSlots.kt` (NEW): slot helpers for overlay composition
- `LSFavoritePinDot.kt` (NEW): copper-tinted pin Composable with halo + content description
- `IdleScreen.kt` (MODIFY): consume `LSMapLayer` with overlay slot
- `LSMapTest.kt` + `LSMapLayerTest.kt` (NEW): unit tests for AC-1..5

---

## AGENT INSTRUCTIONS (TDD per AC)

For each AC: RED → GREEN → REFACTOR. Use Compose testing (`createComposeRule()` + `onNodeWithTag(...)`) to assert subview presence. Do NOT mock the Mapbox SDK; instantiate `MapView` in tests with offline-friendly tile config.

---

## READING LIST

1. `android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt` **[PRIMARY PATTERN]** — final implementation; warm-paper styling + AndroidView interop
2. `android/app/src/main/java/com/laneshadow/ui/organisms/LSMapLayer.kt` — host with overlay slot
3. `android/app/src/main/java/com/laneshadow/ui/molecules/LSFavoritePinDot.kt` — copper dot recipe + halo
4. `android/app/src/main/java/com/laneshadow/ui/templates/IdleScreen.kt` — overlay composition site
5. `.spec/design/system/views/mapapp/idle/idle-screen.html` — visual ground truth: warm-paper tile, copper pin, glass overlay

---

## EVIDENCE GATES

| Gate | Command | Expected |
|------|---------|----------|
| Kotlin typecheck | `./gradlew :app:compileDebugKotlin` | Exit 0 |
| Unit tests | `./gradlew :app:testDebugUnitTest --tests '*LSMap*'` | Exit 0; all pass |
| Detekt lint | `./gradlew detekt` | Exit 0 |
| Token compliance | `scripts/tokens/enforce-native-compliance.sh` | Exit 0 (no hardcoded `Color(0xFF…)`) |

---

## OUT OF SCOPE

- `LocationRepository` + geocode pill — IDLE-S06-AND-T03
- Polyline overlays (planning state) — Sprint 07
- Instrumented (`androidTest`) coverage — IDLE-S06-AND-T04

---

## CONTEXT

**Current state:** Sprint 01 left iOS with a `LinearGradient` placeholder for the map; Android already had real `LSMap.kt` rendering scaffolding (per ROADMAP §Sprint 01 / FID-S01-T07 — Android leads iOS on map integration), but the warm-paper substrate, copper pins, and overlay-slot architecture for Sprint 07+ reuse were not yet finalised.

**Gap:** Without finalised `LSMapLayer` + `LSFavoritePinDot` + theme-stable substrate, the idle state cannot match the design reference and Sprints 07–10 cannot reuse a stable map host.

---

## REVIEW (for kotlin-reviewer)

**Must pass:**
- `LSMapLayer` exposes `overlay: @Composable () -> Unit` slot
- No placeholder `Box` remains at the map slot in `IdleScreen.kt`
- Pins composed via `LSFavoritePinDot` molecule, not inline `Canvas`
- `LocalLaneShadowTheme.current` used for all colors (no hex literals)
- SCOPE respected — no `IdleViewModel` or `LocationRepository` mutations

**Should verify:**
- `MapView` lifecycle attached to Compose lifecycle (onStart/onStop) without leaks (`DisposableEffect`)
- Pin Composables include `contentDescription` per `RULES.md` §Accessibility Standards
- 48dp minimum touch target if pins are tappable (or document non-interactive)

**Verdict:** APPROVED

---

## DESIGN

**References:**
- `.spec/design/system/views/mapapp/idle/idle-screen.html`
- `.spec/design/system/views/mapapp/idle/README.md` — warm-paper substrate, copper pin halo, glass overlay tokens

**Pattern:** Persistent map host owns Mapbox SDK lifecycle via `AndroidView` + `DisposableEffect`; consumers receive `overlay: @Composable () -> Unit` slot. State changes mutate overlay content, not the map's identity.

**Pattern source:** `android/app/src/main/java/com/laneshadow/ui/organisms/LSMapLayer.kt`

**Anti-pattern:** Re-instantiating `MapView` per idle screen mount via `key()`; binding favorites directly inside `LSMap` (defeats reuse).

---

## DEPENDENCIES

- **Depends on:** IDLE-S06-AND-T01 (`IdleViewModel.favoriteLocations`)
- **Blocks:** IDLE-S06-AND-T03 (location pill renders over the same map), IDLE-S06-AND-T04 (instrumented coverage assumes real map)
- **Parallel:** IDLE-S06-IOS-T02

---

## CODING STANDARDS

- `RULES.md` §Cross-Platform Component Parity — sandbox story IDs unchanged
- `RULES.md` §Accessibility Standards (Android) — `contentDescription` + 48dp targets
- `RULES.md` §Verification Standards — `./gradlew detekt`, `./gradlew :app:compileDebugKotlin`

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"GIVEN IdleScreen first composition WHEN tree inspected THEN Mapbox MapView present and 0 placeholder Box at map slot","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.LSMapTest.idleScreen_rendersRealMapNotPlaceholder'"},
    {"id":"AC-2","type":"acceptance_criterion","description":"GIVEN one FavoriteLocation in state WHEN map composes THEN exactly one LSFavoritePinDot rendered","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.LSMapTest.favoritePin_rendersForEmission'"},
    {"id":"AC-3","type":"acceptance_criterion","description":"GIVEN light theme map WHEN theme switches to dark THEN substrate + pins re-resolve without MapView remount","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.LSMapTest.themeToggle_doesNotRemount'"},
    {"id":"AC-4","type":"acceptance_criterion","description":"GIVEN favoriteLocations==emptyList() WHEN map composes THEN zero LSFavoritePinDot, no crash","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.LSMapTest.emptyFavorites_rendersZeroPins'"},
    {"id":"AC-5","type":"acceptance_criterion","description":"GIVEN LSMapLayer overlay slot WHEN arbitrary Composable passed THEN renders correctly","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapLayerTest.overlaySlot_acceptsArbitraryComposable'"},
    {"id":"TC-1","type":"test_criterion","description":"Compose tree contains MapView, 0 placeholder Box at map slot","maps_to_ac":"AC-1","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.LSMapTest.idleScreen_rendersRealMapNotPlaceholder'"},
    {"id":"TC-2","type":"test_criterion","description":"One favorite → exactly one LSFavoritePinDot","maps_to_ac":"AC-2","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.LSMapTest.favoritePin_rendersForEmission'"},
    {"id":"TC-3","type":"test_criterion","description":"Theme toggle keeps MapView identity stable","maps_to_ac":"AC-3","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.LSMapTest.themeToggle_doesNotRemount'"},
    {"id":"TC-4","type":"test_criterion","description":"Empty favorites yields zero pins","maps_to_ac":"AC-4","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.LSMapTest.emptyFavorites_rendersZeroPins'"},
    {"id":"TC-5","type":"test_criterion","description":"Overlay slot accepts arbitrary Composable","maps_to_ac":"AC-5","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapLayerTest.overlaySlot_acceptsArbitraryComposable'"}
  ]
}
-->
