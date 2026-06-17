# UI-014: iOS atoms 5/5 — map polyline atoms (Mapbox iOS / MapKit overlay): `RoutePolyline`, `RoutePolylineComponent`, `DeviationPolyline`

**Task ID:** UI-014
**Sprint:** Sprint 2 - UI Component Translation and Fidelity Sandbox
**Assigned To:** swift-implementer
**Reviewer:** swift-reviewer
**Estimate:** 240 min
**Type:** [FEATURE]
**Status:** Planned
**Phase:** Atoms
**Quality Score:** 115/115

---

## BACKGROUND

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `atoms` slice for `iOS atoms 5/5 — map polyline atoms (Mapbox iOS / MapKit overlay): RoutePolyline, RoutePolylineComponent, DeviationPolyline`.

**Objective:** Implement iOS atoms 5/5 — map polyline atoms (Mapbox iOS / MapKit overlay): `RoutePolyline`, `RoutePolylineComponent`, `DeviationPolyline` as SwiftUI work with parity to the RN baseline, token-only styling, and sandbox coverage.

**Success State:** A reviewer can open the iOS sandbox, browse this task's scenarios, and confirm naming, interface, theme, state, accessibility, and layout parity against RN.

## CRITICAL CONSTRAINTS

### MUST
- Implement the listed components or compositions with parity-aligned naming and interfaces: `RoutePolyline`, `RoutePolylineComponent`, `DeviationPolyline`.
- Use only the LaneShadow core theme contract locked by `UI-001`: `tokens/semantic/semantic.tokens.json` as the source of truth, generated `native-theme` outputs as the shared packaging layer, and the platform theme entry points (`LaneShadowTheme` on Android, `.laneShadowTheme()` on iOS) for colors, spacing, typography, radii, elevation, and state styling.
- Register sandbox scenarios for default, interactive, and edge-case states with RN reference labels.
- Cover all interactive states required by the parity spec for atomic controls and visuals.

### NEVER
- Add unrelated feature wiring or backend dependencies to satisfy sandbox rendering.
- Introduce hardcoded UI primitives or platform-only naming drift.

### STRICTLY
- Preserve light and dark parity, accessibility labels, and deterministic fixtures for every scenario.

## DELIVERABLES

- ios/LaneShadow/Views/Atoms/**
- ios/LaneShadow/Sandbox/Stories/AtomsStories.swift — @MainActor enum with `static let all: [Story]`, aggregated into LaneShadowStories.all
- ios/LaneShadowTests/**
- ios/LaneShadowSnapshotTests/**

## ACCEPTANCE CRITERIA

### AC-1
**GIVEN** The RN baseline and atomic parity contract define the expected components and interfaces.
**WHEN** This task is implemented.
**THEN** The listed components or compositions exist in the correct iOS SwiftUI directories with parity-aligned names and signatures: `RoutePolyline`, `RoutePolylineComponent`, `DeviationPolyline`.
**Verify:** `printf "%s\n" "`RoutePolyline`, `RoutePolylineComponent`, `DeviationPolyline`"`

### AC-2
**GIVEN** Sprint 2 requires token-only styling and light and dark support.
**WHEN** The task scenarios render in the sandbox.
**THEN** All visuals use the LaneShadow core theme contract from `UI-001` and render correctly in both color modes without hardcoded UI primitives.
**Verify:** `rg -n "Token consumption|light and dark" .spec/prds/native-rewrite/08d-component-parity-spec.md .spec/prds/native-rewrite/08-design-system.md`

### AC-3
**GIVEN** Every translated component must be reviewable before rider-facing wiring resumes.
**WHEN** Sandbox scenarios are registered for this task.
**THEN** Each listed component has deterministic sandbox coverage with RN reference labels and explicit state variants where applicable.
**Verify:** `rg -n "RN reference|scenario|interactive states" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md`

### AC-4
**GIVEN** Parity includes behavior as well as visuals.
**WHEN** The task is validated against the parity spec.
**THEN** Accessibility labels, touch targets, keyboard or safe-area handling, and motion or state parity behave correctly for this component family.
**Verify:** `rg -n "Accessibility|Keyboard handling|RTL support|Animation parity|State parity" .spec/prds/native-rewrite/08d-component-parity-spec.md`

### AC-5
**GIVEN** native-sandbox is installed and a DEBUG build is running.
**WHEN** `make ios_sandbox` launches the sandbox (passes `-LaneShadowSandbox` arg to the app).
**THEN** every component listed in DELIVERABLES has at least one `Story(id: "<tier>.<component>.<state>", tier: .<tier>, component: "<Name>", name: "<State>", summary: "<rn-reference-path>") { _ in <SwiftUI usage> }` registered in `LaneShadowStories.all` and renders in the story-tree drawer under its tier, wrapped by `themedPreview { $0.laneShadowTheme() }`.

**Launch:** `make ios_sandbox` (canonical). Secondary: device shake (simulator: `xcrun simctl io booted shake`) or `xcrun simctl launch <id> com.laneshadow.app -LaneShadowSandbox`.

## TEST CRITERIA

| ID | Maps To | Boolean Statement | Verify |
|---|---|---|---|
| TC-1 | AC-1 | The listed components or compositions exist in the correct iOS SwiftUI directories with parity-aligned names and signatures: `RoutePolyline`, `RoutePolylineComponent`, `DeviationPolyline`. | `printf "%s\n" "`RoutePolyline`, `RoutePolylineComponent`, `DeviationPolyline`"` |
| TC-2 | AC-2 | All visuals use the LaneShadow core theme contract from `UI-001` and render correctly in both color modes without hardcoded UI primitives. | `rg -n "Token consumption\|light and dark" .spec/prds/native-rewrite/08d-component-parity-spec.md .spec/prds/native-rewrite/08-design-system.md` |
| TC-3 | AC-3 | Each listed component has deterministic sandbox coverage with RN reference labels and explicit state variants where applicable. | `rg -n "RN reference\|scenario\|interactive states" .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md` |
| TC-4 | AC-4 | Accessibility labels, touch targets, keyboard or safe-area handling, and motion or state parity behave correctly for this component family. | `rg -n "Accessibility\|Keyboard handling\|RTL support\|Animation parity\|State parity" .spec/prds/native-rewrite/08d-component-parity-spec.md` |
| TC-5 | ALL | Repo validation gates remain green for the touched workspace when this task is complete. | `pnpm type-check:native && swiftformat --lint ios/LaneShadow --config .swiftformat && xcodebuild -workspace ios/LaneShadow.xcworkspace -scheme LaneShadow -destination "platform=iOS Simulator,name=iPhone 16" test` |

## READING LIST

1. `.spec/prds/native-rewrite/README.md`
2. `.spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md`
3. `.spec/prds/native-rewrite/08a-atomic-component-catalog.md`
4. `.spec/prds/native-rewrite/08d-component-parity-spec.md`
5. `RULES.md`
6. `.spec/prds/native-rewrite/08c-ios-component-map.md`

## GUARDRAILS

### WRITE-ALLOWED
- ios/LaneShadow/Views/Atoms/**
- ios/LaneShadow/Sandbox/**
- ios/LaneShadowTests/**
- ios/LaneShadowSnapshotTests/**
- ios/LaneShadowUITests/**

### WRITE-PROHIBITED
- android/**
- server/**
- convex/**
- Any unrelated sprint folders outside .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/**

### MUST
- Follow the parity contract in `.spec/prds/native-rewrite/08d-component-parity-spec.md`.
- Keep sandbox scenarios deterministic and labeled with RN reference paths.
- Limit changes to the component family or sandbox or reporting surface owned by this task.

### MUST NOT
- Do not add backend or auth dependencies just to render scenarios.
- Do not modify unrelated platform directories or downstream sprint artifacts.

## CODE PATTERN

**Reference:** `.spec/prds/native-rewrite/08c-ios-component-map.md`

**Pattern:** Single SwiftUI view with enum or binding-driven variants, theme environment consumption, and deterministic sandbox scenarios.

**Anti-pattern:** Default SwiftUI styling, live service dependencies, or platform-specific naming drift.

## TRANSLATION SOURCES

| Component | RN wrapper source | Framework primitives + `node_modules` paths | Native target file | Variants × sizes × states |
|---|---|---|---|---|
| RoutePolyline (utility) | `react-native/components/map/route-polyline.tsx` | `shared/lib/polyline` (decodePolylineGeometry, slicePolylineByMeters, computeCumulativeDistances); `react-native/components/lib/map/overlay-colors.ts` (getWindColor, getRainColor, getTemperatureColor) | `ios/LaneShadow/Views/Atoms/RoutePolylineBuilder.swift` | Pure utility — no UI; builds `BuiltPolyline[]` arrays with coordinates, strokeColor, strokeWidth |
| RoutePolylineComponent | `react-native/components/map/route-polyline-component.tsx` | `@rnmapbox/maps` — ShapeSource, LineLayer; `@mapbox/polyline` — PolylineEncoder.encode; `expo-haptics` — Haptics.impactAsync; `react-native-paper` — useTheme | `ios/LaneShadow/Views/Atoms/RoutePolylineView.swift` | Mapbox rendering: ShapeSource + LineLayer per segment; tap-to-select with haptic feedback; highlighted state (selectedSegmentId or activeSegment) |
| DeviationPolyline | `react-native/components/map/deviation-polyline.tsx` | `@rnmapbox/maps` — ShapeSource, LineLayer; `react-native/components/lib/mapbox/coordinate-converter.ts` (convertCoordinateArray) | `ios/LaneShadow/Views/Atoms/DeviationPolylineView.swift` | 3 segment types (original/detour/reconnect) × isActive state × strokeWidth prop |

> **iOS platform note:** iOS uses Mapbox iOS SDK (`MapboxMap` module) or native MapKit (`MKPolylineRenderer` / `MKOverlayPathRenderer`). The RN baseline uses `@rnmapbox/maps`, which wraps Mapbox GL Native. iOS translation should use Mapbox iOS SDK's `MGLPolyline` / `MGLLineStyleLayer` for parity, or MapKit's `MKPolyline` + `MKPolylineRenderer` if targeting Apple Maps. Coordinate format: RN stores Google-format `{latitude, longitude}`; Mapbox expects `[longitude, latitude]` — conversion required (see `convertCoordinateArray` in RN lib).

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources per `08f-translation-protocol.md`. Columns: Category | Property | Source | Value in source | iOS equivalent (Mapbox / MapKit) | Token mapping. `ESCALATE` = no token covers the value — add a proposed token to DECISIONS.md before implementing.
>
> **Token reference** (from `tokens/semantic/semantic.tokens.json`): space xs=4 sm=8 md=12 lg=16 xl=24 2xl=32 3xl=48 4xl=64; radius none=0 sm=4 md=8 lg=16 xl=24 2xl=32 full=9999; elevation[2] shadowColor=#000, shadowOffset={0,2}, shadowOpacity=0.05, shadowRadius=4.

### RoutePolyline (utility builder)

**Source files read:**
- LaneShadow: `react-native/components/map/route-polyline.tsx`
- Framework: `shared/lib/polyline.ts` (geometry utilities), `react-native/components/lib/map/overlay-colors.ts` (semantic color lookups)

| Category | Property | Source | Value in source | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| Data | overviewGeometry | RN-wrapper | `PolylineGeometry` (encoded string) | Decode via `Polyline` utility or Mapbox's `MGLPolylineFeature` | n/a (data format) |
| Data | leg geometry | RN-wrapper | `RouteLeg[].geometry` (encoded per leg) | Same as above | n/a |
| Data | coordinates | RN-wrapper | `decodePolylineGeometry()` returns `MapLatLng[] = {latitude, longitude}[]` | Convert to `[CLLocationCoordinate2D]` for MapKit or `[[lng, lat]]` for Mapbox | n/a |
| Visual | overview.strokeColor (selected) | RN-wrapper | `semantic.color.routeSelected.default` | `LaneShadowTheme.colors.routeSelected` → MGLStyle layer `lineColor` | `color.routeSelected.default` |
| Visual | overview.strokeColor (alternate) | RN-wrapper | `semantic.color.routeAlternate.default` | `LaneShadowTheme.colors.routeAlternate` → same | `color.routeAlternate.default` |
| Visual | overview.strokeWidth | RN-wrapper | hardcoded `6` | `MGLLineStyleLayer.lineWidth = 6` (Mapbox) or `MKPolylineRenderer.lineWidth = 6` (MapKit) | ESCALATE — propose `strokeWidth.routeOverview = 6` |
| Visual | leg.strokeColor (selected) | RN-wrapper | `semantic.color.routeSelected.default` | `LaneShadowTheme.colors.routeSelected` | `color.routeSelected.default` |
| Visual | leg.strokeColor (unselected) | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| Visual | leg.strokeWidth | RN-wrapper | hardcoded `4` | `lineWidth = 4` | ESCALATE — propose `strokeWidth.routeLeg = 4` |
| Visual | wind overlay.strokeWidth | RN-wrapper | hardcoded `6` | `lineWidth = 6` | ESCALATE — same as above |
| Visual | rain overlay.strokeWidth | RN-wrapper | hardcoded `6` | `lineWidth = 6` | ESCALATE — same |
| Visual | temperature overlay.strokeWidth | RN-wrapper | hardcoded `6` | `lineWidth = 6` | ESCALATE — same |
| Visual | wind overlay colors | overlay-colors.ts | `getWindColor(level, semantic)` — maps level to semantic colors (success/warning/danger) | Use same color lookup via `LaneShadowTheme.colors` | Depends on overlay level — see overlay-colors.ts source |
| Visual | rain overlay colors | overlay-colors.ts | `getRainColor(level, semantic)` | Same | Same |
| Visual | temperature overlay colors | overlay-colors.ts | `getTemperatureColor(level, semantic)` | Same | Same |
| Data | segment ID format | RN-wrapper | `"{routeId-}{type}-{legIndex}-{startMeters}-{endMeters}"` | Keep for parity | n/a |
| Data | slicing | RN-wrapper | `slicePolylineByMeters(coords, distances, start, end)` | Implement on iOS via `CLLocation` distance math or reuse Polyline utility | n/a (algorithm) |

---

### RoutePolylineComponent (Mapbox renderer)

**Source files read:**
- LaneShadow: `react-native/components/map/route-polyline-component.tsx`
- Framework: `@rnmapbox/maps` (ShapeSource, LineLayer), `@mapbox/polyline` (PolylineEncoder), `expo-haptics`, `react-native-paper` (useTheme)

> **iOS rendering strategy:** Use Mapbox iOS SDK's `MGLShapeSource` + `MGLLineStyleLayer` (via Swift Mapbox wrapper). For MapKit parity, use `MKPolyline` + `MKPolylineRenderer` with custom `strokeColor` / `lineWidth` per segment. Coordinate conversion required: Google `{lat, lng}` → MapKit `CLLocationCoordinate2D(latitude:, longitude:)` or Mapbox `[lng, lat]`.

| Category | Property | Source | Value in source | iOS equivalent (Mapbox / MapKit) | Token mapping |
|---|---|---|---|---|---|
| Layout | coordinate format | RN-wrapper | `{latitude, longitude}` per point | Convert to `CLLocationCoordinate2D` (MapKit) or `[lng, lat]` tuple (Mapbox) | n/a (data format) |
| Layout | GeoJSON FeatureCollection | RN-wrapper | `buildLineFeature()` returns `{type: 'FeatureCollection', features: [{type: 'Feature', geometry: {type: 'LineString', coordinates: [lng, lat]}}]}` | Mapbox: `MGLShapeSource(identifier:data:)` with `MGLPolylineFeature`; MapKit: `MKPolyline(coordinates:count:)` | n/a |
| Visual | lineCap (all segments) | RN-wrapper | `'round'` via LineLayer | `MGLLineStyleLayer.lineCap = .round` (Mapbox) or `MKPolylineRenderer.lineCapStyle = .round` (MapKit, iOS 16+) | n/a |
| Visual | lineJoin (all segments) | RN-wrapper | `'round'` via LineLayer | `MGLLineStyleLayer.lineJoin = .round` (Mapbox) or `MKPolylineRenderer.lineJoinStyle = .round` (MapKit) | n/a |
| Visual | lineOpacity (all segments) | RN-wrapper | `1.0` via LineLayer | `MGLLineStyleLayer.lineOpacity = 1.0` (Mapbox) or `MKPolylineRenderer.alpha = 1.0` (MapKit) | n/a |
| Visual | strokeColor (normal) | RN-wrapper | `polyline.strokeColor` from `BuiltPolyline` | `MGLLineStyleLayer.lineColor = .constant(color)` or `renderer.strokeColor` | From `BuiltPolyline.strokeColor` (semantic token) |
| Visual | strokeColor (highlighted) | RN-wrapper | `semantic.color.tertiary.default` | `LaneShadowTheme.colors.tertiary` | `color.tertiary.default` |
| Visual | strokeWidth (normal) | RN-wrapper | `polyline.strokeWidth ?? semantic.space.sm / 2` (default 4) | `MGLLineStyleLayer.lineWidth = 4` or `renderer.lineWidth = 4` | `space.sm / 2` = 4 ✓ |
| Visual | strokeWidth (highlighted) | RN-wrapper | `semantic.space.sm` (8) | `lineWidth = 8` | `space.sm` = 8 ✓ |
| Visual | strokeColor fallback | RN-wrapper | If no `strokeColor` on polyline, uses `polyline.strokeColor ??` normal width | Same | n/a |
| Interaction | tap gesture | RN-wrapper | `ShapeSource.onPress` — triggers `handlePress` | Mapbox: `MGLMapView.delegate` tap detection + `MGLPolyline.contains()`; MapKit: `MKMapView.delegate` `didSelectAnnotation` or gesture recognizer on overlay | n/a |
| Interaction | haptic feedback | RN-wrapper | `Haptics.impactAsync(ImpactFeedbackStyle.Medium)` | `UIImpactFeedbackGenerator(style: .medium).impactOccurred()` | n/a |
| Interaction | selectedSegmentId | RN-wrapper | prop `selectedSegmentId?: string` | Bind to `@State var selectedSegmentId: String?` | n/a |
| Interaction | activeSegment (internal) | RN-wrapper | `useState<string \| null>(null)` | `@State var activeSegmentId: String? = nil` | n/a |
| Interaction | highlight condition | RN-wrapper | `selectedSegmentId === polyline.id \|\| activeSegment === polyline.id` | Same logic in Swift | n/a |
| Data | segment ID parsing | RN-wrapper | `parseSegmentId()` extracts type and legIndex from IDs like `"leg-0"`, `"wind-1-500-1500"` | Implement same parsing | n/a |
| Data | bounds calculation | RN-wrapper | `calculateBounds()` returns `{northEast, southWest}` with max/min lat/lng | Use `MKMapPoint` for bounding box or `MGLCoordinateBounds` (Mapbox) | n/a |
| Data | geometry encoding | RN-wrapper | `PolylineEncoder.encode(points)` — Google polyline format | Use `GMSPolyline` (Google Maps SDK) or implement encoder; Mapbox uses GeoJSON | n/a |
| Data | callback payload | RN-wrapper | `SegmentSelectData = {geometry, bounds, legIndex?, segmentType, segmentId}` | Same struct in Swift | n/a |
| Accessibility | testID | RN-wrapper | `testID` prop + `--segment-{id}` suffix | `.accessibilityIdentifier(testID + "-segment-" + id)` | n/a |
| Accessibility | accessibilityLabel | RN-wrapper | NOT SET in RN source | Add `.accessibilityLabel("Route segment \(type)")` | ESCALATE — propose accessibility labels |

---

### DeviationPolyline

**Source files read:**
- LaneShadow: `react-native/components/map/deviation-polyline.tsx`
- Framework: `@rnmapbox/maps` (ShapeSource, LineLayer), `react-native/components/lib/mapbox/coordinate-converter.ts` (convertCoordinateArray)

| Category | Property | Source | Value in source | iOS equivalent (Mapbox / MapKit) | Token mapping |
|---|---|---|---|---|---|
| Layout | coordinate format | RN-wrapper | `{latitude, longitude}` per point | Convert to `CLLocationCoordinate2D` or `[lng, lat]` | n/a |
| Visual | lineCap (all segments) | RN-wrapper | `'round'` via LineLayer | `MGLLineStyleLayer.lineCap = .round` or `MKPolylineRenderer.lineCapStyle = .round` | n/a |
| Visual | lineJoin (all segments) | RN-wrapper | `'round'` via LineLayer | `MGLLineStyleLayer.lineJoin = .round` or `MKPolylineRenderer.lineJoinStyle = .round` | n/a |
| Visual | lineOpacity (all segments) | RN-wrapper | `1.0` via LineLayer | `lineOpacity = 1.0` or `alpha = 1.0` | n/a |
| Visual | original segment color | RN-wrapper | `semantic.color.deviationOriginalRoute?.default ?? semantic.color.muted.default` | `LaneShadowTheme.colors.deviationOriginalRoute` or fallback to `.muted` | `color.deviationOriginalRoute.default` (ESCALATE if missing) |
| Visual | detour segment color | RN-wrapper | `semantic.color.deviationDetourPath?.default ?? semantic.color.orange.default` | `LaneShadowTheme.colors.deviationDetourPath` or fallback to `.orange` | `color.deviationDetourPath.default` (ESCALATE if missing) |
| Visual | reconnect segment color | RN-wrapper | `semantic.color.deviationReconnectPoint?.default ?? semantic.color.success.default` | `LaneShadowTheme.colors.deviationReconnectPoint` or fallback to `.success` | `color.deviationReconnectPoint.default` (ESCALATE if missing) |
| Visual | strokeWidth (inactive) | RN-wrapper | `strokeWidth` prop (default 4) | `lineWidth = strokeWidth` | ESCALATE — propose `strokeWidth.deviationInactive = 4` |
| Visual | strokeWidth (active) | RN-wrapper | `strokeWidth + 2` (default 6) | `lineWidth = strokeWidth + 2` | ESCALATE — propose `strokeWidth.deviationActive = 6` |
| Visual | fallback color | RN-wrapper | `semantic.color.muted.default` for unknown segment types | `LaneShadowTheme.colors.muted` | `color.muted.default` |
| Interaction | isActive | RN-wrapper | `isActive?: boolean` prop | `@Binding var isActive: Bool` or `@State var isActive` | n/a |
| Data | segment type | RN-wrapper | `DeviationSegmentType = 'original' \| 'detour' \| 'reconnect'` | Swift enum `DeviationSegmentType` | n/a |
| Data | DeviationSegment | RN-wrapper | `{type: DeviationSegmentType, coordinates: [...]}` | Swift struct with same shape | n/a |
| Data | coordinates validation | RN-wrapper | Skip segments with `< 2` coordinates | Same guard in Swift | n/a |
| Accessibility | testID | RN-wrapper | `testID` prop + `-{type}-{index}` suffix | `.accessibilityIdentifier(testID + "-" + type + "-" + index)` | n/a |
| Accessibility | accessibilityLabel | RN-wrapper | NOT SET in RN source | Add `.accessibilityLabel("Deviation \(type)")` | ESCALATE — propose labels |

> **Note on overlay color tokens:** The RN source uses semantic color tokens that may not exist in `semantic.tokens.json`: `deviationOriginalRoute`, `deviationDetourPath`, `deviationReconnectPoint`. If these are missing, implementer should ESCALATE to `DECISIONS.md` with proposed token values before implementing.

---

## DESIGN NOTES

- Cover baseline states and typography or icon behavior explicitly so later molecules inherit stable primitives.
- Use fixed cameras, fixed coordinates, and deterministic map visuals for screenshot capture.
- Avoid default SwiftUI list, form, or navigation styling unless it is fully token-overridden and parity-approved.

## VERIFICATION GATES

- pnpm type-check:native
- swiftformat --lint ios/LaneShadow --config .swiftformat
- xcodebuild -workspace ios/LaneShadow.xcworkspace -scheme LaneShadow -destination "platform=iOS Simulator,name=iPhone 16" test
- Validate sandbox scenarios for this task in the native sandbox host

## DEPENDENCIES

- UI-001
- UI-002
- UI-004
- UI-012

## CODING STANDARDS

- .spec/prds/native-rewrite/08d-component-parity-spec.md — naming, interface, token, state, animation, accessibility, keyboard, and RTL parity
- .spec/prds/native-rewrite/08-design-system.md — token generation and consumption rules
- ~/Projects/brain/docs/TDD-METHODOLOGY.md — RED/GREEN/REFACTOR evidence expectations

## OUT OF SCOPE

- Feature wiring beyond sandbox-ready component translation.
- Changes to unrelated sprints or backend and server code.

---

## Native Sandbox Integration (added 2026-04-18)

`native-sandbox` is installed as a local SPM package (`NativeSandbox` product at `relativePath = ../../native-sandbox/ios`, linked into the LaneShadow target).

### Sandbox Deliverables (in addition to the component sources above)

- `ios/LaneShadow/Sandbox/Stories/<ComponentGroup>Stories.swift` — `@MainActor enum <Group>Stories { static let all: [Story] }` aggregated into `LaneShadowStories.all` at `ios/LaneShadow/Sandbox/LaneShadowStories.swift`.

### Sandbox Acceptance Criterion

**GIVEN** the NativeSandbox SPM package is linked and a DEBUG build is running.
**WHEN** the reviewer runs `make ios_sandbox` (or shakes the device / passes `-LaneShadowSandbox` arg).
**THEN** every component named in DELIVERABLES has at least one registered `Story(id: "<tier>.<component>.<state>", tier: .<tier>, component: "<Name>", name: "<State>", summary: "<rn-reference-path>") { _ in <SwiftUI usage> }` appearing in the sandbox story-tree drawer, wrapped by `previewWrapper: themedPreview { $0.laneShadowTheme() }` so the preview canvas inherits LaneShadow tokens while chrome stays neutral.

### Reviewer Launch

- **Primary:** `make ios_sandbox` (from repo root) — builds Debug, installs to simulator, launches with `-LaneShadowSandbox` arg.
- **Secondary:** device shake (simulator: `xcrun simctl io booted shake`), or `xcrun simctl launch <sim-id> com.laneshadow.app -LaneShadowSandbox`, or deep link `laneshadow-sandbox://sandbox`.

### Contract references

- `NativeSandbox.Story` — `id`, `tier` (`.atom|.molecule|.organism|.template|.screen`), `component`, `name`, `summary`, `content` view builder (`{ _ in ... }`).
- `NativeSandbox.SandboxRoot` — entry view; receives `stories`, optional `themeController`, `previewWrapper`.
- Swift 6 strict concurrency: Story containers MUST be `@MainActor` because `Story` is not Sendable.
- Chrome is theme-neutral by design; only the preview canvas is re-themed via `previewWrapper`.
