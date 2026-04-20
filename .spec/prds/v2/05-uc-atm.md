---
stability: FEATURE_SPEC
last_validated: 2026-04-20
prd_version: 2.0.0
functional_group: ATM
---

# Use Cases: Atoms (ATM)

Atoms are the smallest typed UI primitives. Every atom consumes only TOK-generated constants — never a raw color literal, never a raw spacing number. Every atom ships as paired iOS + Android implementations with identical public APIs (modulo idiom — `@Binding` on iOS ↔ `MutableState` on Android) and identical sandbox stories. Thirteen UCs in V2:

| ID         | Title                                                          | Description |
|------------|----------------------------------------------------------------|-------------|
| UC-ATM-01  | Typography atoms (`LSText` across opinion / ui / instrument)   | Typed text atom consuming the three typography families defined in UC-TOK-01. |
| UC-ATM-02  | Button atom (all variants + states)                            | Single `LSButton` atom: primary / secondary / ghost / accept / destructive / outline × default / hover / pressed / disabled / focus. |
| UC-ATM-03  | Input atoms (`LSTextField`, `LSTextArea`)                      | Single-line and multi-line input atoms with default / focused / error / disabled states. |
| UC-ATM-04  | Base display atoms (Avatar, Divider, Spinner)                  | Three small display atoms. Icon, Badge, and Chip are split out. |
| UC-ATM-05  | Surface trio (`LSCard`, `LSPanel`, `LSGlassPanel`)             | Container atoms: elevated card, flat panel, translucent glass-panel (backdrop-blur + `elevation.overlay`). |
| UC-ATM-06  | Pill atom (`LSPill`)                                           | Pill-shaped container primitive — the shape atom behind every chip / badge / tag / suggestion. |
| UC-ATM-07  | Badge atom (`LSBadge` + `LSBestBadge`)                         | Status and weather variants; `LSBestBadge` as a typed sub-variant. |
| UC-ATM-08  | PhaseDot atom (`LSPhaseDot`)                                   | Three-state dot (pending / active / done) with ring-pulse animation. |
| UC-ATM-09  | Scrim atom (`LSScrim`)                                         | Map-dimmer overlay atom; backs drawer + modal organisms. |
| UC-ATM-10  | Icon atom (`LSIcon`) — design-owned SVG catalog                | 25-name SVG icon catalog, 1.5px rounded stroke, token-driven color. Replaces SF Symbols + Material Icons. |
| UC-ATM-11  | `LSMap` shared contract (multi-polyline, route variants)       | Cross-platform API, tokens, fixtures, stubs. No SDK integration. |
| UC-ATM-12  | `LSMap` iOS implementation (Mapbox Maps SDK for iOS)           | Production iOS impl behind the UC-ATM-11 contract. |
| UC-ATM-13  | `LSMap` Android implementation (Mapbox Maps SDK for Android)   | Production Android impl behind the UC-ATM-11 contract. |

---

## UC-ATM-01 — Typography atoms (`LSText` across opinion / ui / instrument)

Deliver a single `LSText` atom that takes a string and a variant mapping to one of the three typography families (UC-TOK-01). Variants are exhaustively typed so downstream code cannot pass arbitrary strings.

iOS API: `LSText("Hello", variant: .ui.body.md)`, `.opinion.xl`, `.instrument.lg`.
Android API: `LSText("Hello", variant = TypographyVariant.UI.Body.Md)`.

Accessibility: Dynamic Type on iOS, font-scale on Android. Color override is a `ContentColor` enum resolving from `color.content.*` — raw color literals are rejected at the type level.

### Acceptance Criteria
- ☐ iOS developer can render `LSText("Where are we riding today?", variant: .opinion.xl)` and see text rendered in Newsreader serif at the token-specified size and line height.
- ☐ Android developer can render `LSText("Where are we riding today?", variant = TypographyVariant.Opinion.Xl)` and see the same resolved values.
- ☐ Developer can render `LSText("64 mi", variant: .instrument.lg)` on both platforms and see JetBrains Mono at the token-specified size.
- ☐ Developer can open the "Atoms / Typography Swatch" story on iOS and see the full cross-family matrix rendered — three families × their size variants.
- ☐ Developer can open the same story on Android and see identical resolution.
- ☐ Developer can increase the system font size on iOS (Dynamic Type) and Android (font-scale) and see all `LSText` instances scale proportionally.
- ☐ Developer can pass a `color: ContentColor = .secondary` override and see the rendered color resolve from `color.content.*` (not a raw literal).
- ☐ iOS XCTest and Android JUnit tests both assert the rendered atom consumes only token-derived values (no literal colors, no literal font sizes).

---

## UC-ATM-02 — Button atom (all variants + states)

Deliver a single `LSButton` atom on both platforms covering six variants (`primary`, `secondary`, `ghost`, `accept`, `destructive`, `outline`) and five interactive states (`default`, `hover`, `pressed`, `disabled`, `focus`). Minimum height `sizing.component.buttonHeight`. Minimum touch target `sizing.touchTarget`. Background/foreground/border resolve from `color.action.*` per variant×state matrix. Corner radius `radius.md`. Internal horizontal padding `spacing.4`. Accepts an optional `icon: IconName?` (leading or trailing slot) resolving through `LSIcon` (UC-ATM-10).

### Acceptance Criteria
- ☐ iOS developer can render `LSButton("Continue", variant: .primary) { }` and see resolved values: background `color.action.primary.default`, foreground `color.action.primaryOn`, corner radius `radius.md`, height `sizing.component.buttonHeight`.
- ☐ Android developer can render `LSButton(text = "Continue", variant = ButtonVariant.Primary, onClick = { })` and see identical values.
- ☐ Developer can press a button in the sandbox and see `color.action.primary.pressed`.
- ☐ Developer can disable the button and see `color.action.primary.disabled` + `opacity.disabled` + pointer-events disabled.
- ☐ Developer can render `LSButton("NEW", variant: .outline, icon: .plus)` on both platforms and see the icon rendered at `sizing.icon.sm` with `spacing.2` between icon and label (the TopBar "NEW" chip).
- ☐ Developer can open the "Atoms / Button" family in the sandbox and find one story per variant (6 total), each with `argTypes` controls for title, disabled, and optional icon slot.
- ☐ Developer can confirm every button variant meets minimum touch-target size via automated accessibility-size tests on both platforms.
- ☐ iOS XCTest and Android JUnit tests both verify that tapping a button invokes the `onAction` / `onClick` callback exactly once per press.

---

## UC-ATM-03 — Input atoms (`LSTextField`, `LSTextArea`)

Deliver `LSTextField` (single-line) and `LSTextArea` (multi-line, auto-growing up to `maxRows`). Both expose four visual states: `default`, `focused`, `error`, `disabled`. Padding `spacing.3`, border radius `radius.sm`, border colors resolve from `color.border.*`. Both support leading/trailing icon slots from UC-ATM-10.

### Acceptance Criteria
- ☐ iOS developer can render `LSTextField(value: $text, placeholder: "Plan a ride…", state: .default)` and see a single-line field with `color.surface.input` background, `color.border.default` stroke, `radius.sm` corner, `spacing.3` padding.
- ☐ Android developer can render `LSTextField(value = text, onValueChange = { text = it }, placeholder = "Plan a ride…", state = InputState.Default)` with identical values.
- ☐ Developer can focus on either platform and see the border resolve to `color.border.focus` (Copper signal).
- ☐ Developer can set `state = .error` and see `color.border.error` + helper-text row in `color.content.error`.
- ☐ Developer can pass a leading icon (e.g., `.search`) and see `LSIcon` render at `sizing.icon.sm` with `spacing.2` between icon and text.
- ☐ Developer can open the "Atoms / TextField" and "Atoms / TextArea" story families on both platforms and find stories per state.
- ☐ Developer can type into a text-field story and see the `args.value` control reflect the typed text in real time.

---

## UC-ATM-04 — Base display atoms (Avatar, Divider, Spinner)

Deliver three small display atoms bundled together because they share token patterns and zero interaction semantics.

- `LSAvatar` — image or fallback initials inside a circle at size variants `xs/sm/md/lg/xl` (resolves from `sizing.icon.*` + one extra xl token).
- `LSDivider` — 1px horizontal rule using `color.border.subtle`.
- `LSSpinner` — platform-native activity indicator tinted by `color.signal.default`.

(Icon → UC-ATM-10. Badge → UC-ATM-07. Chip/Pill → UC-ATM-06.)

### Acceptance Criteria
- ☐ Developer can render `LSAvatar(source: .image(url), size: .md)` on both platforms and see a circular image at `sizing.icon.md`; on `.initials("JD")` fallback, initials render in `typography.ui.label.md` on `color.surface.card`.
- ☐ Developer can render `LSDivider()` and see a 1px horizontal line in `color.border.subtle`.
- ☐ Developer can render `LSSpinner()` and see a platform-native indicator tinted `color.signal.default`.
- ☐ Developer can open "Atoms / Display" in the sandbox and find at least one story per atom on both platforms.

---

## UC-ATM-05 — Surface trio (`LSCard`, `LSPanel`, `LSGlassPanel`)

Deliver three container atoms.

- **`LSCard`** — elevated surface with `color.surface.card`, `radius.lg`, `elevation.2`, default padding `spacing.4`.
- **`LSPanel`** — flat surface with `color.surface.primary`, `radius.md`, no shadow, default padding `spacing.3`.
- **`LSGlassPanel`** — translucent chrome/callout surface with `color.surface.glass`, `radius.xl`, `elevation.overlay`, backdrop blur (`12-14px` on both platforms via platform-idiomatic API — SwiftUI `.ultraThinMaterial` or `Material` overlay; Compose `Modifier.blur` or `RenderEffect.createBlurEffect`). Exposes a `variant` slot: `.chrome` (default; plain translucent panel used by TopBar / ChatInput / LocationContextBar) or `.callout(accent: AccentColor)` which adds a 3px leading stripe in the accent color (used by `LSNavigatorMessage` with `.signal`, `LSInlineErrorCallout` with `.warning`).

All three atoms expose a content slot (SwiftUI `ViewBuilder` / Compose `content: @Composable () -> Unit`) and optional `padding` / `backgroundColor` overrides resolved to TOK tokens only. Raw color inputs are rejected at type-check.

### Acceptance Criteria
- ☐ iOS developer can wrap content in `LSCard { content }` and see `color.surface.card` + `radius.lg` + `elevation.2` + `spacing.4`.
- ☐ Android developer can wrap content in `LSCard { content }` and see identical values.
- ☐ Developer can render `LSPanel { content }` on both platforms and see a flat surface.
- ☐ Developer can render `LSGlassPanel(variant: .chrome) { content }` on both platforms and see a translucent backdrop-blurred surface with `elevation.overlay` shadow, matching the TopBar chrome in the design.
- ☐ Developer can render `LSGlassPanel(variant: .callout(accent: .signal)) { content }` and see the 3px leading stripe resolve from `color.signal.default`; passing `.warning` resolves from `color.status.warning.default`.
- ☐ Developer can override `padding = .spacing5` and see `spacing.5` (not a raw dp/pt).
- ☐ Developer can override `backgroundColor = .surfaceCard` and see `color.surface.card`; raw color inputs are rejected at type-check.
- ☐ Developer can open "Atoms / Surface" and find stories for `Card Default`, `Card With Content`, `Panel Default`, `Panel Nested`, `GlassPanel Chrome`, `GlassPanel Callout (signal)`, `GlassPanel Callout (warning)` on both platforms.
- ☐ iOS and Android tests verify backdrop blur renders correctly in both light and dark modes.

---

## UC-ATM-06 — Pill atom (`LSPill`)

Deliver `LSPill(size: .sm | .md | .lg, padding?, content)` — a pill-shaped container primitive. Not interactive on its own; semantic interaction (filter toggling, suggestion primer tap, weather readout) is layered by the molecules in UC-MOL-05.

Resolves: corner radius `radius.pill`, height per size (`24 / 32 / 40` — expressed as `sizing.pill.{sm,md,lg}` tokens), padding per size, no default background/border (inherits from content).

### Acceptance Criteria
- ☐ Developer can render `LSPill(size: .md) { LSText("Label", variant: .ui.body.sm) }` on both platforms and see a pill-shaped container at the token-specified height.
- ☐ Developer can pass custom `padding = .spacing3` and see it resolve from tokens.
- ☐ Developer can open "Atoms / Pill" and find stories for `Small`, `Medium`, `Large`, `With Icon+Label`, `With Icon Only` on both platforms.
- ☐ iOS and Android tests verify the pill's rendered height matches `sizing.pill.{size}` exactly for each size.

---

## UC-ATM-07 — Badge atom (`LSBadge` + `LSBestBadge`)

Deliver `LSBadge(count: Int? = nil, label: String? = nil, variant: BadgeVariant)` where `BadgeVariant` is the union of `status.*` (`info / success / warning / error / recording`) **and** `weather.*` (`clear / rain / wind / storm / hot / cold`). Status variants resolve backgrounds + foregrounds from `color.status.*`; weather variants resolve from `color.weather.*.tint` (background), `color.weather.*.default` (foreground + border). Rendered as an `LSPill(size: .sm)` composition.

Also deliver `LSBestBadge` — a typed sub-variant (not a variant of `LSBadge`) rendering the "BEST FOR TODAY" label with a filled star-icon prefix, resolved from `color.signal.{default,on}`.

### Acceptance Criteria
- ☐ Developer can render `LSBadge(count: 3, variant: .status.recording)` on both platforms and see `color.status.recording.default` background, `color.status.recording.on` foreground, `radius.pill`.
- ☐ Developer can render `LSBadge(label: "Rain 3pm", variant: .weather.rain)` and see `color.weather.rain.tint` background, `color.weather.rain.default` foreground + border (≈0.5px at 55% alpha), leading `LSIcon(.rain)` at `sizing.icon.xs`.
- ☐ Developer can render `LSBadge(label: "18mph NW", variant: .weather.wind)` and see the wind color applied with a `.wind` icon.
- ☐ Developer can render `LSBestBadge()` on both platforms and see `color.signal.default` background, `color.signal.on` text, leading filled-star icon.
- ☐ Developer can open "Atoms / Badge" and find at least one story per status + weather variant + `LSBestBadge` on both platforms.

---

## UC-ATM-08 — PhaseDot atom (`LSPhaseDot`)

Deliver `LSPhaseDot(state: .pending | .active | .done)` — a 10px dot atom with typed state. `.pending` renders a hollow dot bordered with `color.border.strong`. `.active` renders filled with `color.signal.default` AND animates a concentric ring pulse per `motion.recipe.phaseDotPulse`. `.done` renders filled with `color.status.success.default`.

### Acceptance Criteria
- ☐ Developer can render `LSPhaseDot(state: .pending)` on both platforms and see a hollow dot with `color.border.strong` 1px border, 10px diameter.
- ☐ Developer can render `LSPhaseDot(state: .active)` and see a filled signal dot + an animating concentric ring pulsing per `motion.recipe.phaseDotPulse` (900ms ease-in-out loop, scale 0→1.5×, opacity 0.4→0).
- ☐ Developer can render `LSPhaseDot(state: .done)` and see a filled success dot, no animation.
- ☐ Developer can open "Atoms / PhaseDot" on both platforms and find stories for `Pending`, `Active (animated)`, `Done`.
- ☐ iOS and Android tests verify the active-state animation references `motion.recipe.phaseDotPulse` and does not hardcode duration/easing.

---

## UC-ATM-09 — Scrim atom (`LSScrim`)

Deliver `LSScrim(opacity: Double = 0.35)` — a full-screen (or full-parent) color overlay using `color.surface.scrim`. Taps pass through unless a consumer opts into blocking. Consumed by `LSSessionsDrawer` (0.35 per design) and modal-tier organisms.

### Acceptance Criteria
- ☐ Developer can render `LSScrim()` on both platforms and see a full-parent overlay with `color.surface.scrim` at 0.35 opacity.
- ☐ Developer can override `opacity: 0.5` and see it resolve from `opacity.*` tokens (not a raw literal).
- ☐ Developer can place an `LSScrim` behind content and see touches pass through by default; enabling `blocking: true` captures taps and fires an `onTap` callback.
- ☐ Developer can open "Atoms / Scrim" and find stories for `Default`, `Opacity 0.6`, `Blocking (tap to dismiss)` on both platforms.

---

## UC-ATM-10 — Icon atom (`LSIcon`) — design-owned SVG catalog

Deliver a design-owned SVG icon catalog at `tokens/icons/*.svg` rendered via `LSIcon(name: IconName, size: IconSize, color: ContentColor = .primary)`. The 25-name catalog is:

`send`, `expand`, `collapse`, `menu`, `plus`, `close`, `sliders`, `bookmark`, `bookmarkFill`, `star`, `starFill`, `pin`, `clock`, `sun`, `rain`, `wind`, `storm`, `therm`, `route`, `map`, `layers`, `share`, `heart`, `heartFill`, `sparkle`, `compass`, `edit`, `trash`, `bike`, `chevR`, `chevL`.

All icons share a 1.5px rounded stroke baseline (consuming `icon.stroke.width`). Color resolves through `ContentColor` (the `color.content.*` palette) or a typed accent like `.signal`; raw color is rejected at type-check.

Generation: `pnpm tokens:generate` emits a typed `IconName` enum on both platforms and bundles the SVGs as platform-native assets (iOS: `Asset.xcassets` or direct `Shape` conversions; Android: Compose `ImageVector` or Android resource). SF Symbols and Material Icons are explicitly **not** used.

### Acceptance Criteria
- ☐ Developer can open `tokens/icons/` and find exactly 25 SVG files whose basenames match the `IconName` enumeration (enforced by `pnpm icons:check`).
- ☐ Developer can render `LSIcon(name: .compass, size: .md)` on iOS and see the design's compass icon at `sizing.icon.md` with 1.5px rounded stroke; changing `color: .signal` resolves to `color.signal.default`.
- ☐ Developer can render the same on Android and see an identical rendering (visually — per the parity manifest).
- ☐ Developer can grep the codebase post-Sprint-2 and find zero references to `UIImage(systemName:)` / `Image(systemName:)` / `Icons.Filled.*` / `Icons.Outlined.*` — SF Symbols and Material Icons are not consumed anywhere.
- ☐ Developer can open "Atoms / Icon" and find a swatch story rendering every name × size combination.
- ☐ iOS and Android tests verify `LSIcon` rejects raw color inputs at type-check and that icon stroke width resolves from `icon.stroke.width`.

---

## UC-ATM-11 — `LSMap` shared contract (multi-polyline, route variants)

Establish the cross-platform contract for both map implementations. This UC lands **before** UC-ATM-12 and UC-ATM-13 and contains no SDK integration — it defines the shape of `LSMap` so the two platform implementations can proceed in parallel without drifting.

**Deliverables**:
1. Map-related tokens in `semantic.tokens.json` (via UC-TOK-05): `map.style.{light,dark}` Studio URLs, `sizing.stroke.{sm,md,lg}` polyline widths, annotation-kind → token mapping (`.start → color.status.success`, `.end → color.status.recording`, `.waypoint → color.status.info`).
2. Typed cross-platform API definitions in `tokens/api/LSMap.contract.md`:
   - `CameraPosition { center: LatLng, zoom: Double, pitch?: Double, bearing?: Double }`
   - `Annotation { kind: .start | .end | .waypoint, coordinate: LatLng, label?: String }`
   - `RouteVariant: .best | .alt1 | .alt2 | .custom(ColorToken)`
   - `PolylineData { coordinates: [LatLng], variant: RouteVariant, strokeWidth?: StrokeSize = .md }`
   - `MapMode: .preview | .interactive`
   - `CameraFit: .static | .polyline(padding: SpacingToken) | .polylines(padding: SpacingToken)` (the `.polylines` fit computes the union bounds of all polylines)
   - `MapError: .missingToken | .networkUnavailable | .styleLoadFailed`
3. **Public API signature**: `LSMap(mode: MapMode, camera: CameraPosition, cameraFit: CameraFit = .static, polylines: [PolylineData] = [], annotations: [Annotation] = [], showFavorites: Bool = false, onTap: ((LatLng) -> Void)? = nil)`. Note: `polylines` is plural (array), replacing the v1.x single-polyline contract.
4. Polyline fixture data at `tokens/sandbox/fixtures/routes.fixtures.json` — at least three routes, each with `polyline` coordinates + `start`/`end` coordinates; `alt1` and `alt2` variants included in fixture payload so RouteResults can render three concurrent polylines in stories.
5. Documented access-token loading convention per platform (iOS `Info.plist` key `MBXAccessToken` + build-time substitution from `MAPBOX_ACCESS_TOKEN`; Android `res/values/secrets.xml` generated pre-build by a Gradle task).
6. Stub `LSMap` on both platforms that type-checks, compiles, and renders the error-fallback `LSGlassPanel` for every story until UC-ATM-12 / UC-ATM-13 replace it.

### Acceptance Criteria
- ☐ Developer can open `tokens/api/LSMap.contract.md` and find all typed definitions above, each with field-level documentation. The `LSMap` signature takes `polylines: [PolylineData]` (plural) and `PolylineData` carries a `variant: RouteVariant`.
- ☐ Developer can read the contract and confirm only cross-platform types appear — no Mapbox SDK symbols (`MapView`, `MapboxMap`, `CircleAnnotation`, `LineLayer`) leak into the contract.
- ☐ Developer can find `map.style.light`, `map.style.dark`, `sizing.stroke.md`, `color.route.{best,alt1,alt2}` token references in the contract, with the annotation-kind mapping documented.
- ☐ Developer can open `tokens/sandbox/fixtures/routes.fixtures.json` and find ≥3 routes; at least one fixture scenario (e.g., `"route_results_three_alts"`) contains three `PolylineData` entries with variants `.best`, `.alt1`, `.alt2`.
- ☐ iOS developer can import a stub `LSMap` returning the error-fallback `LSGlassPanel` + caption — type-checks, compiles, renders the fallback until UC-ATM-12 replaces it.
- ☐ Android developer can import the analogous Kotlin stub — type-checks, compiles, renders the fallback until UC-ATM-13 replaces it.
- ☐ Developer can open "Atoms / Map (stub)" on either platform during the stub window and see the fallback render — proving the contract + tokens + fixture pipeline is wired end-to-end before SDK code lands.

---

## UC-ATM-12 — `LSMap` iOS implementation (Mapbox Maps SDK for iOS)

Full iOS implementation behind the UC-ATM-11 contract using the [Mapbox Maps SDK for iOS](https://docs.mapbox.com/ios/maps/guides/). Replaces the iOS stub with a production `UIViewRepresentable`-backed SwiftUI wrapper that loads the Copper Studio style, renders **multiple** polylines with per-variant colors, renders annotations, honors preview vs interactive mode, handles errors gracefully, and is covered by XCTest. **Depends on UC-ATM-11.** Parallel to UC-ATM-13. **Out of scope**: offline packs, turn-by-turn nav, geocoding, 3D terrain, traffic.

### Acceptance Criteria
- ☐ Developer can open `ios/LaneShadow.xcodeproj` and find the Mapbox Maps SDK added as an SPM dependency pinned to a specific minor version.
- ☐ Developer can find `MBXAccessToken` in `ios/LaneShadow/Info.plist` populated by build-time substitution from `MAPBOX_ACCESS_TOKEN`. No literal token is committed.
- ☐ Developer can render `LSMap(mode: .preview, camera: CameraPosition(center: .init(lat: 37.7749, lon: -122.4194), zoom: 11))` in SwiftUI and see the Mapbox MapView rendered via `UIViewRepresentable`, loading the `LaneShadow Copper Light` Studio style from `map.style.light`; gestures disabled.
- ☐ Developer can toggle the sandbox theme to dark on iOS and see the map re-resolve to `map.style.dark` and reload the Dark Studio style without unmounting the underlying `MapView`.
- ☐ Developer can pass `polylines: [.init(coordinates: [...], variant: .best), .init(coordinates: [...], variant: .alt1), .init(coordinates: [...], variant: .alt2)]` and see three polylines rendered via separate line layers with strokes from `color.route.best`, `color.route.alt1`, `color.route.alt2` respectively; width `sizing.stroke.md`.
- ☐ Developer can pass typed `annotations: [.init(kind: .start, …), .init(kind: .end, …)]` and see each rendered via Mapbox circle annotations with fills from `color.status.success` / `color.status.recording`.
- ☐ Developer can pass `cameraFit: .polylines(padding: .spacing4)` with a multi-polyline camera and see the map auto-frame the union bounds with `spacing.4` padding.
- ☐ Developer can render `LSMap(mode: .interactive, …)` and pan / zoom / rotate with native gestures; tap invokes `onTap` with the tapped `LatLng`; scale bar renders with text color `color.content.secondary`.
- ☐ Developer can place an interactive `LSMap` inside a SwiftUI `ScrollView` and scroll past it — the map's gesture recognizer does NOT hijack the outer vertical scroll when the user's drag originates outside the map bounds.
- ☐ Developer can omit `MAPBOX_ACCESS_TOKEN` at build time and see `LSMap` render the error-fallback `LSGlassPanel` + caption saying "Map unavailable — missing access token." No crash.
- ☐ Developer can disable network on the iOS simulator and see the fallback render with "Map unavailable — no network."
- ☐ Developer can open the "Atoms / Map" story family on iOS and find stories for `Preview (static)`, `Interactive`, `With One Polyline (best)`, `With Three Alt Polylines (best+alt1+alt2)`, `With Start+End Markers`, `Auto-fit to Multi-polyline`, `Dark Style`, `Error (no token)`, `Error (no network)`.
- ☐ iOS XCTest covers: multi-polyline rendering + per-variant color resolution, style URL resolution per theme, token-gated fallback, annotation rendering, camera-fit-to-union-bounds correctness, onTap callback invocation, scroll-isolation, and no-symbol-leak.

---

## UC-ATM-13 — `LSMap` Android implementation (Mapbox Maps SDK for Android)

Full Android implementation behind the UC-ATM-11 contract using the [Mapbox Maps SDK for Android](https://docs.mapbox.com/android/maps/guides/). Replaces the Android stub with a production `AndroidView`-backed Compose wrapper that loads the Copper Studio style, renders **multiple** polylines with per-variant colors, renders annotations, honors preview vs interactive mode, handles errors gracefully, and is covered by JUnit + Compose UI tests. **Depends on UC-ATM-11.** Parallel to UC-ATM-12. **Out of scope**: offline packs, turn-by-turn nav, geocoding, 3D terrain, traffic.

### Acceptance Criteria
- ☐ Developer can open `android/app/build.gradle.kts` and find Mapbox Maps SDK added as a Maven dependency (`com.mapbox.maps:android:<version>`) with the Mapbox Maven repository + auth configured per Mapbox's install docs.
- ☐ Developer can find `android/app/src/main/res/values/secrets.xml` (gitignored) generated pre-build by a Gradle task from `MAPBOX_ACCESS_TOKEN`; no literal token committed.
- ☐ Developer can render `LSMap(mode = MapMode.Preview, camera = CameraPosition(center = LatLng(37.7749, -122.4194), zoom = 11.0))` in a `@Composable` and see the Mapbox MapView rendered via `AndroidView` loading the `LaneShadow Copper Light` Studio style from `map.style.light`; gestures disabled.
- ☐ Developer can toggle the sandbox theme to dark and see the map re-resolve to `map.style.dark` and reload the Dark Studio style without unmounting.
- ☐ Developer can pass `polylines = listOf(PolylineData(..., variant = Best), PolylineData(..., variant = Alt1), PolylineData(..., variant = Alt2))` and see three polylines rendered with per-variant stroke colors + width `sizing.stroke.md`.
- ☐ Developer can pass annotations and see Mapbox circle annotations with fills from `color.status.*` per kind.
- ☐ Developer can pass `cameraFit = CameraFit.Polylines(padding = Spacing.S4)` and see auto-frame to union bounds.
- ☐ Developer can render `LSMap(mode = MapMode.Interactive, …)` and pan / zoom / rotate; tap invokes `onTap`; scale bar text color `color.content.secondary`.
- ☐ Developer can place an interactive `LSMap` inside a vertically-scrolling parent (`LazyColumn` or `Column(Modifier.verticalScroll(...))`) and scroll past — the map does NOT hijack the outer vertical scroll when the drag originates outside map bounds.
- ☐ Developer can omit `MAPBOX_ACCESS_TOKEN` at build and see `LSMap` render the error-fallback `LSGlassPanel` + caption. No crash.
- ☐ Developer can disable network on the emulator and see the fallback render with "Map unavailable — no network."
- ☐ Developer can open the "Atoms / Map" story family on Android and find the same nine stories as iOS (per UC-SBX-01 parity manifest), each rendering the real Mapbox map (or the documented fallback).
- ☐ Android JUnit + Compose UI tests cover: multi-polyline rendering, style URL resolution per theme, token-gated fallback, annotation rendering, camera-fit-to-union-bounds, onTap callback, scroll-isolation, no-symbol-leak.
