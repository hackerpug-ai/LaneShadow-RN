# IDLE-S06-IOS-T02 — iOS real Mapbox warm-paper map + copper favorite pins

```
TASK_TYPE:  FEATURE
STATUS:     Done
PRIORITY:   P0
EFFORT:     L
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer
SPRINT:     sprint-06-idlescreen → ./SPRINT.md
PRD_REFS:   UC-MAP-01, UC-FID-01

RUNTIME_COMMANDS:
  test:      xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/MapViewTests
  typecheck: xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  lint:      swiftlint lint ios/LaneShadow/AppFlow/MapView ios/LaneShadow/Views/Atoms/LSMap.swift ios/LaneShadow/Views/Molecules/LSFavoritePinDot.swift
```

---

## OUTCOME

The iOS map view's idle state renders a real, persistent Mapbox warm-paper canvas (replacing the prior `LinearGradient` placeholder) with copper favorite pin dots driven by `IdleViewModel.favoriteLocations`. The map host (`AppFlow/MapView/...` + `Views/Atoms/LSMap.swift`) is architected as a long-lived component — substrate, camera store, theme wiring, and overlay slot — so Sprints 07–10 can reuse it without remounting.

---

## 🚫 CRITICAL CONSTRAINTS

- **MUST** replace any `LinearGradient` map placeholder in `IdleScreen.swift` with the real `LSMap` component backed by `MapboxMaps`
- **MUST** drive the warm-paper substrate via the design-system token recipe (light: `--map-warm-paper`, dark: warm-dark ink) — never hardcode hex colors
- **MUST** render copper favorite pins via `LSFavoritePinDot` SwiftUI molecule using `signal.default` token (light) and `signal.default` warm-dark mapping (dark)
- **MUST** architect the map as a persistent host owned at the `AppFlow/MapView` level; idle-state overlays compose into an overlay slot rather than the map being re-instantiated per state
- **MUST** support theme switching (light ↔ dark) without map remount; tile substrate, pin tint, halo glow re-resolve via `@Environment(\.colorScheme)`
- **NEVER** instantiate Mapbox SDK directly inside `IdleScreen.swift`; routing through `LSMap` keeps Sprint 07–10 reuse intact
- **NEVER** hardcode favorite pin coordinates — they come from `IdleViewModel.favoriteLocations`
- **STRICTLY** preserve the canonical sandbox story IDs (`templates.idle.default`, `.no-location`, `.first-ride`, `.weather-advisory`, etc.) per `RULES.md` §Cross-Platform Component Parity

---

## DONE WHEN

- [x] AC-1: `IdleScreen` shows real Mapbox warm-paper tile (no `LinearGradient`) on first render (PRIMARY)
- [x] AC-2: One favorite emission → one `LSFavoritePinDot` rendered at correct lat/lng
- [x] AC-3: Theme toggle re-tints substrate + pins without remount
- [x] AC-4: Empty favorites list → zero pins rendered (no crash, no debug placeholder)
- [x] AC-5: `LSMap` exposes overlay slot consumed by Sprint 07+ planning state (interface-level test)
- [x] `xcodebuild test -only-testing:LaneShadowTests/MapViewTests` exit 0
- [x] `enforce-native-compliance.sh` clean (no hardcoded color literals)

---

## ACCEPTANCE CRITERIA

### AC-1: Real Mapbox warm-paper substrate replaces placeholder [PRIMARY]
- **GIVEN** `IdleScreen` mounted with default `IdleViewModel` state
- **WHEN** the screen first appears
- **THEN** the underlying view tree contains a `MapboxMaps.MapView` (or a wrapping `LSMap`) and contains zero `LinearGradient` elements at the map slot
- **VERIFY:** `xcodebuild test -only-testing:LaneShadowTests/MapViewTests/test_idleScreen_rendersRealMapNotGradient`

### AC-2: Favorite pin renders for each emission
- **GIVEN** `IdleViewModel.favoriteLocations` contains `[FavoriteLocation(name:"Highway 1", lat: 37.81, lng: -122.47)]`
- **WHEN** the map renders
- **THEN** exactly one `LSFavoritePinDot` is rendered in the overlay layer at the correct map coordinate
- **VERIFY:** `xcodebuild test -only-testing:LaneShadowTests/MapViewTests/test_favoritePin_rendersForEmission`

### AC-3: Theme toggle re-tints without remount
- **GIVEN** map mounted in light scheme; pins rendered
- **WHEN** color scheme switches to dark
- **THEN** `LSMap` substrate token re-resolves to dark warm-paper variant; pin halo re-tints; the underlying `MapView` is not deallocated/recreated
- **VERIFY:** `xcodebuild test -only-testing:LaneShadowTests/MapViewTests/test_theme_toggle_doesNotRemount`

### AC-4: Empty favorites list renders zero pins
- **GIVEN** `IdleViewModel.favoriteLocations == []`
- **WHEN** the map renders
- **THEN** the overlay layer contains zero `LSFavoritePinDot` elements; no crash; no placeholder pin
- **VERIFY:** `xcodebuild test -only-testing:LaneShadowTests/MapViewTests/test_emptyFavorites_rendersZeroPins`

### AC-5: Map host exposes overlay slot for state-specific UI
- **GIVEN** `LSMap` is initialised with an `@ViewBuilder overlay: () -> some View` parameter
- **WHEN** Sprint 06 idle-state composes greeting + chat input via that slot
- **THEN** the same `LSMap` instance can host any other `View` overlay (interface compile-time + runtime test)
- **VERIFY:** `xcodebuild test -only-testing:LaneShadowTests/MapViewTests/test_lsMap_overlaySlot_acceptsArbitraryView`

---

## TEST CRITERIA

| ID    | Statement                                                                    | Maps To | Type        |
|-------|------------------------------------------------------------------------------|---------|-------------|
| TC-1  | IdleScreen view tree contains MapboxMaps.MapView and zero LinearGradient    | AC-1    | happy_path  |
| TC-2  | One favorite emission → exactly one LSFavoritePinDot                         | AC-2    | happy_path  |
| TC-3  | Theme switch leaves MapView identity stable across redraw                    | AC-3    | edge_case   |
| TC-4  | Empty favorites → zero LSFavoritePinDot, no crash                            | AC-4    | edge_case   |
| TC-5  | LSMap accepts arbitrary `@ViewBuilder` overlay                               | AC-5    | happy_path  |

---

## SCOPE

**writeAllowed:**
- `ios/LaneShadow/AppFlow/MapView/LSMapHost.swift` (NEW)
- `ios/LaneShadow/Views/Atoms/LSMap.swift` (NEW or MODIFY)
- `ios/LaneShadow/Views/Molecules/LSFavoritePinDot.swift` (NEW)
- `ios/LaneShadow/Views/Templates/IdleScreen.swift` (MODIFY — replace placeholder with `LSMap`)
- `ios/LaneShadow/Sandbox/Stories/Templates/IdleScreenStory.swift` (MODIFY — keep canonical story IDs intact)
- `ios/LaneShadowTests/AppFlow/MapView/MapViewTests.swift` (NEW)

**writeProhibited:**
- `android/**`, `server/**`, `react-native/**`, `tokens/**`
- `ios/LaneShadow/Features/Idle/IdleViewModel.swift` — owned by T01
- `ios/LaneShadow/Services/LocationService.swift` — owned by T03
- `ios/LaneShadow.xcodeproj/**` (generated; edit `ios/project.yml`)

---

## BOUNDARIES

✅ **Always:**
- Use design tokens for color resolution (`signal.default`, `--map-warm-paper`)
- Render pins via `LSFavoritePinDot` molecule (don't draw circles inline)
- Keep `LSMap` overlay slot generic (`some View`) for downstream sprints

⚠️ **Ask First:**
- Bumping the Mapbox SDK version
- Adding Mapbox style URLs other than warm-paper (light/dark)

---

## DELIVERABLE

- `LSMapHost.swift` (NEW): persistent host owning camera store, location source plumbing, overlay slot
- `LSMap.swift` (NEW/MODIFY): SwiftUI atom wrapping MapboxMaps with warm-paper styling + pin overlay
- `LSFavoritePinDot.swift` (NEW): copper-tinted dot molecule with halo + accessibility label
- `IdleScreen.swift` (MODIFY): consume `LSMap` via overlay slot; remove placeholder
- `IdleScreenStory.swift` (MODIFY): pass real favorites through sandbox stories
- `MapViewTests.swift` (NEW): five unit tests covering AC-1..5

---

## AGENT INSTRUCTIONS (TDD per AC)

For each AC: RED → GREEN → REFACTOR. Use `ViewInspector` (or `XCTAssert` against `UIHostingController`'s view hierarchy) to verify subview presence. Do NOT mock the Mapbox SDK; use real `MapView` initialisation in tests with offline-friendly tile config.

---

## READING LIST

1. `ios/LaneShadow/Views/Atoms/LSMap.swift` **[PRIMARY PATTERN]** — final implementation; warm-paper styling + overlay slot signature
2. `ios/LaneShadow/Views/Molecules/LSFavoritePinDot.swift` — copper dot recipe + halo
3. `ios/LaneShadow/Views/Templates/IdleScreen.swift` — overlay composition site
4. `.spec/design/system/views/mapapp/idle/idle-screen.html` — visual ground truth: warm-paper tile, copper pin, glass overlay
5. `.spec/design/system/views/mapapp/idle/README.md` — pin recipe + token mapping (`signal.default`, `--map-warm-paper`)

---

## EVIDENCE GATES

| Gate | Command | Expected |
|------|---------|----------|
| Build | `xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` | Exit 0 |
| MapView tests | `xcodebuild test -only-testing:LaneShadowTests/MapViewTests` | Exit 0; 5 pass |
| SwiftLint | `swiftlint lint ios/LaneShadow/AppFlow/MapView ios/LaneShadow/Views/Atoms/LSMap.swift` | Exit 0 |
| Token compliance | `scripts/tokens/enforce-native-compliance.sh` | Exit 0 (no hardcoded color literals) |

---

## OUT OF SCOPE

- LocationService + geocode pill — IDLE-S06-IOS-T03
- Polyline overlays (planning state) — Sprint 07
- DesignReview capture methods — IDLE-S06-IOS-T04

---

## CONTEXT

**Current state:** Sprint 01 left iOS `IdleScreen` rendering a `LinearGradient` placeholder where the map should be (see ROADMAP §Sprint 01 / FID-S01-T02 history). The design-system reference clearly shows a real warm-paper Mapbox tile with copper favorite pins.

**Gap:** Without a real persistent map host, idle state cannot match the design reference and Sprints 07–10 cannot reuse a stable map across map-view states.

---

## REVIEW (for swift-reviewer)

**Must pass:**
- `LSMap` exposes overlay slot via `@ViewBuilder` parameter (compile-time generic)
- No `LinearGradient` remains at the map slot in `IdleScreen.swift`
- Pins render via `LSFavoritePinDot` molecule, not inline `Circle()`
- Design tokens used for all colors (no hex literals)
- SCOPE respected — no `IdleViewModel` or `LocationService` mutations

**Should verify:**
- `MapView` identity stable across theme switches (no recreation)
- Accessibility: pins have `accessibilityLabel` describing the favorite name
- Map host is reusable: a synthetic test passes a non-idle overlay and renders without warnings

**Verdict:** APPROVED

---

## DESIGN

**References:**
- `.spec/design/system/views/mapapp/idle/idle-screen.html`
- `.spec/design/system/views/mapapp/idle/README.md` — warm-paper substrate, copper pin halo, glass overlay tokens

**Pattern:** Persistent map host owns the Mapbox SDK lifetime; SwiftUI consumers receive an `@ViewBuilder overlay:` slot. State changes mutate overlay content, not the map's identity.

**Pattern source:** `ios/LaneShadow/AppFlow/MapView/LSMapHost.swift`

**Anti-pattern:** Re-instantiating `MapboxMaps.MapView` per `IdleScreen` mount; binding favorites directly inside `LSMap` initializer (defeats reuse).

---

## DEPENDENCIES

- **Depends on:** IDLE-S06-IOS-T01 (ViewModel surfaces `favoriteLocations`)
- **Blocks:** IDLE-S06-IOS-T03 (location pill renders over the same map), IDLE-S06-IOS-T04 (capture tests assume real map)
- **Parallel:** IDLE-S06-AND-T02

---

## CODING STANDARDS

- `RULES.md` §Cross-Platform Component Parity — sandbox story IDs unchanged
- `RULES.md` §Multi-Agent Dispatch — `.pbxproj` is generated; do not hand-edit
- `RULES.md` §Accessibility Standards — pin `accessibilityLabel` on every interactive element

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"GIVEN IdleScreen first render WHEN view tree inspected THEN MapboxMaps.MapView present and 0 LinearGradient at map slot","verify":"xcodebuild test -only-testing:LaneShadowTests/MapViewTests/test_idleScreen_rendersRealMapNotGradient"},
    {"id":"AC-2","type":"acceptance_criterion","description":"GIVEN one favorite emission WHEN map renders THEN exactly one LSFavoritePinDot at correct lat/lng","verify":"xcodebuild test -only-testing:LaneShadowTests/MapViewTests/test_favoritePin_rendersForEmission"},
    {"id":"AC-3","type":"acceptance_criterion","description":"GIVEN light scheme map WHEN scheme switches to dark THEN substrate + pins re-tint without MapView remount","verify":"xcodebuild test -only-testing:LaneShadowTests/MapViewTests/test_theme_toggle_doesNotRemount"},
    {"id":"AC-4","type":"acceptance_criterion","description":"GIVEN favoriteLocations==[] WHEN map renders THEN zero LSFavoritePinDot, no crash","verify":"xcodebuild test -only-testing:LaneShadowTests/MapViewTests/test_emptyFavorites_rendersZeroPins"},
    {"id":"AC-5","type":"acceptance_criterion","description":"GIVEN LSMap exposes ViewBuilder overlay WHEN arbitrary View passed THEN renders correctly","verify":"xcodebuild test -only-testing:LaneShadowTests/MapViewTests/test_lsMap_overlaySlot_acceptsArbitraryView"},
    {"id":"TC-1","type":"test_criterion","description":"View tree contains MapboxMaps.MapView and 0 LinearGradient at map slot","maps_to_ac":"AC-1","verify":"xcodebuild test -only-testing:LaneShadowTests/MapViewTests/test_idleScreen_rendersRealMapNotGradient"},
    {"id":"TC-2","type":"test_criterion","description":"One favorite emission yields exactly one LSFavoritePinDot","maps_to_ac":"AC-2","verify":"xcodebuild test -only-testing:LaneShadowTests/MapViewTests/test_favoritePin_rendersForEmission"},
    {"id":"TC-3","type":"test_criterion","description":"MapView identity stable across theme toggle","maps_to_ac":"AC-3","verify":"xcodebuild test -only-testing:LaneShadowTests/MapViewTests/test_theme_toggle_doesNotRemount"},
    {"id":"TC-4","type":"test_criterion","description":"Empty favorites yields zero pins","maps_to_ac":"AC-4","verify":"xcodebuild test -only-testing:LaneShadowTests/MapViewTests/test_emptyFavorites_rendersZeroPins"},
    {"id":"TC-5","type":"test_criterion","description":"Overlay slot accepts arbitrary View","maps_to_ac":"AC-5","verify":"xcodebuild test -only-testing:LaneShadowTests/MapViewTests/test_lsMap_overlaySlot_acceptsArbitraryView"}
  ]
}
-->
