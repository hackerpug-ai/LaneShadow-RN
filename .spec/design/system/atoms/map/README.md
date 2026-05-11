# LSMap Atom

**Use Cases**: UC-ATM-11 (contract), UC-ATM-12 (iOS), UC-ATM-13 (Android)
**Sprint**: Sprint 02 — Atoms / Foundation Primitives
**Version**: 2.0.0
**Authority**:
- `.spec/prds/v2/concepts/uc-atm-11-map-contract.html`
- `.spec/prds/v2/concepts/uc-atm-12-map-ios.html`
- `.spec/prds/v2/concepts/uc-atm-13-map-android.html`

---

## Purpose

LSMap is the cross-platform map primitive for LaneShadow V2. It renders a Mapbox-tiled map surface with multi-polyline route overlays, typed point annotations, optional topographic ornament (contour lines), and paper tint in both light and dark themes.

No Mapbox SDK symbols appear in the public contract. All SDK references are hidden behind platform wrapper implementations (`_LSMapViewRepresentable` on iOS, `AndroidView`-backed Composable on Android).

---

## Atoms Used

| Dependency | Why |
|------------|-----|
| LSGlassPanel | Fallback overlay when `MapError.missingToken` or `MapError.networkUnavailable` — renders a translucent glass callout over the dormant paper background without crashing |
| Tokens only | All polyline colors, stroke widths, annotation sizes, spacing resolve from semantic tokens — no raw hex or numeric literals |

---

## Cross-Platform Contract

### Types (platform-agnostic)

All field names are identical across platforms. Syntax varies (Swift struct vs Kotlin data class, Swift enum vs Kotlin sealed class).

**CameraPosition**
```
center:   LatLng         { lat: Double, lon: Double }
zoom:     Double         // Mapbox zoom level 0–22; typical ride view: 10–14
pitch?:   Double         // 0–60 degrees; nil/null = 0 (flat)
bearing?: Double         // 0–360 degrees; nil/null = 0 (north-up)
```

**AnnotationKind**
```
start     // color.status.success   · 14px circle · 2.5px card border
end       // color.status.recording · 18px ring circle · inner dot 6px
waypoint  // color.status.info      · 12px circle
```

**Annotation**
```
kind:       AnnotationKind
coordinate: LatLng
label?:     String
```

**RouteVariant**
```
best              // color.route.best  · stroke sizing.stroke.md (2px)
alt1              // color.route.alt1  · stroke sizing.stroke.md (2px)
alt2              // color.route.alt2  · stroke sizing.stroke.md (2px)
custom(ColorToken) // escape hatch — token-gated, no raw color
```

**PolylineData**
```
coordinates:  [LatLng]
variant:      RouteVariant
strokeWidth?: StrokeSize    // .sm(1) / .md(2) / .lg(3); default .md
```

**MapMode**
```
preview      // gestures disabled; static viewport
interactive  // pan / zoom / rotate enabled; onTap fires
```

**CameraFit**
```
static                              // use CameraPosition as-is
polyline(padding: SpacingToken)     // fit bounds of first polyline
polylines(padding: SpacingToken)    // fit union bounds of all polylines
                                    // spacing.4 (16dp/pt) is the default padding
```

**MapError**
```
missingToken        // MAPBOX_ACCESS_TOKEN not set at build time
networkUnavailable  // device offline or DNS failure
styleLoadFailed     // Studio URL unreachable or malformed
```

### Public API Signature

**iOS (Swift/SwiftUI)**
```swift
func LSMap(
  mode:          MapMode,
  camera:        CameraPosition,
  cameraFit:     CameraFit        = .static,
  polylines:     [PolylineData]   = [],
  annotations:   [Annotation]     = [],
  showFavorites: Bool             = false,
  onTap:         ((LatLng) -> Void)? = nil
) -> some View
```

**Android (Kotlin/Compose)**
```kotlin
@Composable fun LSMap(
  mode:          MapMode,
  camera:        CameraPosition,
  cameraFit:     CameraFit        = CameraFit.Static,
  polylines:     List<PolylineData> = emptyList(),
  annotations:   List<Annotation>   = emptyList(),
  showFavorites: Boolean          = false,
  onTap:         ((LatLng) -> Unit)? = null
)
```

---

## Token Table

| Token | Raw Value | Use in LSMap |
|-------|-----------|-------------|
| `--map-paper` (light) | `var(--paper-50)` = `#FDFBF8` | Map surface background tint (light theme) |
| `--map-paper` (dark) | `#1B140E` | Map surface background tint (dark theme) |
| `--map-contour` (light) | `rgba(73, 69, 79, 0.22)` | Topographic contour line stroke |
| `--map-contour` (dark) | `rgba(242, 238, 232, 0.22)` | Topographic contour line stroke on dark |
| `--map-contour-faint` (light) | `rgba(73, 69, 79, 0.10)` | Faint grid / subtle contour lines |
| `--map-contour-faint` (dark) | `rgba(242, 238, 232, 0.10)` | Faint grid on dark |
| `--route-best` | `var(--route-best-raw)` = `#EE7C2B` | `RouteVariant.best` polyline stroke — copper |
| `--route-alt1` | `var(--route-alt1-raw)` = `#4D8470` | `RouteVariant.alt1` polyline stroke — sage |
| `--route-alt2` | `var(--route-alt2-raw)` = `#6B7B8F` | `RouteVariant.alt2` polyline stroke — slate |
| `--wx-clear` | `#E6A52A` | Weather polyline segment: clear/sunny |
| `--wx-rain` | `#4A86BE` | Weather polyline segment: rain |
| `--wx-wind` | `#6B7B8F` | Weather polyline segment: wind |
| `--wx-storm` | `#5E3FAE` | Weather polyline segment: storm |
| `--wx-hot` | `#C9423C` | Weather polyline segment: heat |
| `--wx-cold` | `#3A8BE3` | Weather polyline segment: cold |
| `--signal-default` | `var(--copper-500)` = `#EE7C2B` | Camera-fit bounds annotation, brand accents |
| `--status-success` | `#4D8470` | `AnnotationKind.start` fill |
| `--status-recording` | `#C9423C` | `AnnotationKind.end` ring + inner dot |
| `--status-info` | `#3A8BE3` | `AnnotationKind.waypoint` fill |
| `--surface-card` | `var(--paper-50)` / `var(--ink-700)` | Annotation dot border (flips to ink-700 in dark) |
| `--surface-glass` | `rgba(253,251,248,0.72)` / dark variant | LSGlassPanel fallback backdrop |
| `--border-default` | `var(--paper-400)` / dark variant | Map card border, glass chrome border |
| `--stroke-sm` | `1px` | Thin custom polyline |
| `--stroke-md` | `1.5px` | Default polyline (contract calls this 2px/2dp; `--stroke-md` is 1.5px in tokens.css — implementation uses 2dp/pt literal via SDK) |
| `--stroke-lg` | `2px` | Emphasized / selected polyline |

> **Note on stroke sizes**: The contract specifies sizing.stroke.md = 2px/2dp and sizing.stroke.lg = 3px/3dp for map polylines. These exact dp/pt values are set directly in the Mapbox SDK layer properties via Tokens constants — the CSS `--stroke-*` tokens are the closest approximation for the design-system mock.

### Mapbox Studio Style URLs

| Token | Value | When used |
|-------|-------|-----------|
| `map.style.light` | `mapbox://styles/laneshadow/copper-light` | System theme = light |
| `map.style.dark` | `mapbox://styles/laneshadow/copper-dark` | System theme = dark |

---

## Platform Implementations

### iOS — UIViewRepresentable (UC-ATM-12)

**Host mechanism**: SwiftUI view wrapping `_LSMapViewRepresentable: UIViewRepresentable`

**SDK**: Mapbox Maps SDK for iOS

**Key behaviors**:
- `@Environment(\.colorScheme)` observer drives style URL selection; `mapView.mapboxMap.loadStyleURI(_:)` is called in-place on theme change — the `MapView` instance is **never unmounted**
- Token guard: if `MBXAccessToken` is absent from `Bundle.main.infoDictionary` → `MapError.missingToken` → `LSGlassPanel` fallback, no `MapView` created
- Polylines: one `LineAnnotation` per `PolylineData` entry; color = `Tokens.color.route.*`; `lineWidth` = `Tokens.sizing.stroke.md` (2pt)
- Camera fit: `camera.ease(to: unionBounds, padding: UIEdgeInsets(all: Tokens.spacing.s4))` over 400ms `motion.easing.standard`
- Scroll isolation: `UIScrollView.gestureRecognizers` delegation via `shouldRecognizeSimultaneouslyWith` prevents the map from hijacking outer `ScrollView` vertical scroll

**Sandbox stories** (9 canonical, must match Android story names exactly):
1. Preview (static) — `mode: .preview`, Copper Light style
2. Interactive — `mode: .interactive`, gesture ring indicator
3. With One Polyline (best) — single copper route
4. With Three Alt Polylines (best+alt1+alt2) — copper solid, sage dashed, slate dotted
5. With Start+End Markers — `Annotation.start` (14pt green circle) + `Annotation.end` (18pt red ring)
6. Auto-fit to Multi-polyline — `cameraFit: .polylines(padding: .spacing4)`, dashed bounds rect
7. Dark Style — `map.style.dark`, no MapView unmount
8. Error (no token) — `MapError.missingToken` → LSGlassPanel
9. Error (no network) — `MapError.networkUnavailable` → LSGlassPanel

**Access token convention**:
```
// ios/LaneShadow/Info.plist — Key: MBXAccessToken
// Value: $(MAPBOX_ACCESS_TOKEN)
// Local: .xcconfig (gitignored)
// Never commit a literal token.
```

### Android — AndroidView Composable (UC-ATM-13)

**Host mechanism**: Kotlin Composable wrapping `MapView` via `AndroidView`

**SDK**: Mapbox Maps SDK for Android

**Key behaviors**:
- `isSystemInDarkTheme()` drives style URL selection; `mapView.getMapboxMap().loadStyleUri()` in the `update` lambda handles in-place style reload — the `MapView` is **never recreated**
- Token guard: if `R.string.mapbox_access_token` is blank → `MapError.MissingToken` → `LSGlassPanelFallback`, no `MapView` created
- Polylines: one `LineLayer` per `PolylineData`; color = `Tokens.color.route.*`; `lineWidth` = `Tokens.sizing.stroke.md` (2dp)
- Camera fit: `easeCamera(CameraUpdateFactory.newLatLngBounds(unionBounds, 16))` over 400ms `motion.duration.cameraEase`
- Scroll isolation: `Modifier.nestedScroll(rememberNestedScrollInteropConnection())` on the `AndroidView` composable prevents outer `LazyColumn` / `verticalScroll` hijack
- Story names and visual rendering are **identical** to iOS — the only permitted visual difference is Android punch-hole camera vs iOS Dynamic Island (per UC-SBX-01 parity manifest)

**Access token convention**:
```
// android/app/src/main/res/values/secrets.xml
// Generated pre-build by Gradle task from MAPBOX_ACCESS_TOKEN env var.
// File is gitignored. Never commit a literal token.
```

---

## Dimensions

| Token | Value | iOS pt | Android dp | Use |
|-------|-------|--------|------------|-----|
| `sizing.stroke.sm` | 1px | 1pt | 1dp | Thin custom polyline |
| `sizing.stroke.md` | 2px | 2pt | 2dp | Default route polylines (best/alt1/alt2) |
| `sizing.stroke.lg` | 3px | 3pt | 3dp | Selected/active polyline emphasis |
| `annotation.start` diameter | 14px | 14pt | 14dp | Start marker circle |
| `annotation.start` border | 2.5px | 2.5pt | 2.5dp | Start marker card-color ring |
| `annotation.end` diameter | 18px | 18pt | 18dp | End marker outer ring |
| `annotation.end` inner dot | 6px | 6pt | 6dp | End marker center dot |
| `spacing.4` (cameraFit) | 16px | 16pt | 16dp | CameraFit.polylines default padding |
| Camera ease duration | 400ms | — | — | CameraFit animation |

---

## Motion

### routeDrawOn (motion.recipe.routeDrawOn)

Applied to the `best` polyline when polylines are injected into LSMap. Alt polylines fade in simultaneously.

| Property | Value | Token |
|----------|-------|-------|
| Best polyline draw duration | `max(600ms, min(1400ms, routeKm × 6ms))` | `motion.duration.routeDrawOn` |
| Best polyline easing | `cubic-bezier(0.25, 0.1, 0.25, 1.0)` | `motion.easing.standard` |
| Alt polylines fade-in | opacity 0→1, 300ms ease-out, starts at 40% of best draw | — |
| Camera fit ease | 400ms `motion.easing.standard` | `motion.duration.cameraEase` |

**iOS**: Implemented via Mapbox layer property animation on `line-dasharray` or `stroke-dashoffset`.

**Android**: Implemented via `ValueAnimator` on Mapbox `line-gradient` or `line-trim-offset` property.

---

## Dark Mode Contract

Route stroke tokens are **unchanged** in dark mode — copper, sage, and slate remain legible on the dark tile background.

| Element | Light | Dark |
|---------|-------|------|
| Map tile surface | `--map-paper` = `var(--paper-50)` | `--map-paper` = `#1B140E` |
| Contour stroke | `rgba(73,69,79,0.22)` | `rgba(242,238,232,0.16)` |
| Faint contour grid | `rgba(73,69,79,0.10)` | `rgba(242,238,232,0.07)` |
| Mapbox style URL | `copper-light` | `copper-dark` |
| Route strokes | unchanged | unchanged |
| Annotation start border | `var(--surface-card)` = `paper-50` | `var(--surface-card)` = `ink-700` |
| Annotation end bg | `var(--surface-card)` = `paper-50` | `var(--surface-card)` = `ink-700` |
| Best route drop shadow | `rgba(238,124,43,0.35)` | `rgba(238,124,43,0.55)` (stronger for dark tile) |
| Glass chrome border | `rgba(255,255,255,0.55)` | `rgba(242,238,232,0.12)` |
| Glass backdrop | `rgba(253,251,248,0.72)` | `rgba(45,34,24,0.72)` |

---

## Error Fallback

LSMap renders an `LSGlassPanel` fallback for `MapError.missingToken` and `MapError.networkUnavailable`. The fallback:
- Does not crash
- Does not create a `MapView`
- Shows the dormant live map background at reduced opacity (35%)
- Displays a translucent glass callout with an icon, title ("Map unavailable"), and platform-appropriate message

---

## Sandbox Fixture Scenarios

Defined in `tokens/sandbox/fixtures/routes.fixtures.json`:

| Scenario | Polylines | Notes |
|----------|-----------|-------|
| `route_preview_single` | 1 (best) | SF to Marin single route |
| `route_results_three_alts` | 3 (best + alt1 + alt2) | Three-route comparison with waypoint |
| `route_preview_long_coastal` | 1 (best) | Long coastal route, tests camera-fit |

---

## Quality Gates

- Zero Mapbox SDK symbols in contract surface (no `MapView`, `MapboxMap`, `CircleAnnotation`, `LineLayer` in public API)
- Zero raw hex colors — all stroke/fill colors reference `Tokens.color.*`
- Zero raw numeric literals for stroke widths — all reference `Tokens.sizing.stroke.*`
- Map style URLs loaded from `Tokens.map.style.{light,dark}` — no hardcoded strings
- `MapView` instance preserved across light/dark theme changes (no unmount)
- `LSGlassPanel` fallback renders without crash on `missingToken` and `networkUnavailable`
- Scroll isolation verified: outer `ScrollView` / `LazyColumn` not hijacked by interactive map
- Android story names identical to iOS (UC-SBX-01 parity manifest)
