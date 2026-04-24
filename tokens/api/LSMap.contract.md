# LSMap Shared Contract

LSMap is the shared cross-platform contract for the LaneShadow map atom. The public surface stays SDK-agnostic: no `MapView`, `MapboxMap`, `LineLayer`, `CircleAnnotation`, or other Mapbox symbols appear in this contract.

## Supporting Types

### `LatLng`

| Field | Type | Notes |
|---|---|---|
| `lat` | `Double` | Latitude in decimal degrees. |
| `lon` | `Double` | Longitude in decimal degrees. |

### `ColorToken`

| Field | Type | Notes |
|---|---|---|
| `path` | `String` | Token-gated escape hatch for `RouteVariant.custom`; never a raw hex color. |

### `StrokeSize`

| Case | Token | Notes |
|---|---|---|
| `sm` | `sizing.stroke.sm` | Thin custom polyline. |
| `md` | `sizing.stroke.md` | Default route polyline width. |
| `lg` | `sizing.stroke.lg` | Emphasized or selected route width. |

### `SpacingToken`

| Case | Token | Notes |
|---|---|---|
| `spacing3` | `spacing.3` | Compact camera-fit padding. |
| `spacing4` | `spacing.4` | Default camera-fit padding. |
| `spacing5` | `spacing.5` | Expanded camera-fit padding. |

## Contract Types

### `CameraPosition`

| Field | Type | Notes |
|---|---|---|
| `center` | `LatLng` | Map center coordinate. |
| `zoom` | `Double` | Mapbox zoom level `0...22`; ride views typically sit around `10...14`. |
| `pitch` | `Double?` | Optional pitch in degrees; `nil` or `null` means `0`. |
| `bearing` | `Double?` | Optional bearing in degrees; `nil` or `null` means north-up `0`. |

### `AnnotationKind`

| Case | Token Mapping | Notes |
|---|---|---|
| `start` | `color.status.success` | Start marker. |
| `end` | `color.status.recording` | End marker. |
| `waypoint` | `color.status.info` | Intermediate waypoint marker. |

### `Annotation`

| Field | Type | Notes |
|---|---|---|
| `kind` | `AnnotationKind` | Marker style and semantic meaning. |
| `coordinate` | `LatLng` | Annotation placement. |
| `label` | `String?` | Optional display label. |

### `RouteVariant`

| Case | Token Mapping | Notes |
|---|---|---|
| `best` | `color.route.best` | Primary recommended route. |
| `alt1` | `color.route.alt1` | First alternate route. |
| `alt2` | `color.route.alt2` | Second alternate route. |
| `custom(ColorToken)` | token-gated | Escape hatch for future token-backed route coloring. |

### `PolylineData`

| Field | Type | Notes |
|---|---|---|
| `coordinates` | `[LatLng]` | Ordered polyline coordinates. |
| `variant` | `RouteVariant` | Determines route styling. |
| `strokeWidth` | `StrokeSize?` | Optional stroke size; defaults to `md`. |

### `MapMode`

| Case | Notes |
|---|---|
| `preview` | Gestures disabled; static viewport. |
| `interactive` | Pan, zoom, and rotate enabled; `onTap` may fire. |

### `CameraFit`

| Case | Notes |
|---|---|
| `static` | Use `CameraPosition` as-is. |
| `polyline(padding: SpacingToken)` | Fit bounds of the first polyline. |
| `polylines(padding: SpacingToken)` | Fit the union bounds of all polylines. Default padding is `spacing4`. |

### `MapError`

| Case | Notes |
|---|---|
| `missingToken` | `MAPBOX_ACCESS_TOKEN` was not provided at build time. |
| `networkUnavailable` | Device is offline or DNS/network access failed. |
| `styleLoadFailed` | Mapbox Studio style URL was malformed or unreachable. |

## Public API Signatures

### iOS (Swift / SwiftUI)

```swift
func LSMap(
  mode: MapMode,
  camera: CameraPosition,
  cameraFit: CameraFit = .static,
  polylines: [PolylineData] = [],
  annotations: [Annotation] = [],
  showFavorites: Bool = false,
  onTap: ((LatLng) -> Void)? = nil
) -> some View
```

### Android (Kotlin / Compose)

```kotlin
@Composable fun LSMap(
  mode: MapMode,
  camera: CameraPosition,
  cameraFit: CameraFit = CameraFit.Static,
  polylines: List<PolylineData> = emptyList(),
  annotations: List<Annotation> = emptyList(),
  showFavorites: Boolean = false,
  onTap: ((LatLng) -> Unit)? = null
)
```

## Token References

- `map.style.light`: `mapbox://styles/laneshadow/clxwarm01`
- `map.style.dark`: `mapbox://styles/laneshadow/clxnight02`
- Route colors: `color.route.best`, `color.route.alt1`, `color.route.alt2`
- Annotation colors: `color.status.success`, `color.status.recording`, `color.status.info`
- Stroke widths: `sizing.stroke.sm`, `sizing.stroke.md`, `sizing.stroke.lg`

## Access Token Convention

### iOS

- `Info.plist` key: `MBXAccessToken`
- Value source: `$(MAPBOX_ACCESS_TOKEN)`
- Local configuration lives in a gitignored `.xcconfig`
- Never commit a literal token

### Android

- `android/app/src/main/res/values/secrets.xml` is generated pre-build
- Generation source: `MAPBOX_ACCESS_TOKEN` environment variable via Gradle task
- `secrets.xml` stays gitignored
- Never commit a literal token

## Fixture Scenarios

The shared sandbox fixture file is `tokens/sandbox/fixtures/routes.fixtures.json` and includes:

- `route_preview_single`
- `route_results_three_alts`
- `route_preview_long_coastal`
