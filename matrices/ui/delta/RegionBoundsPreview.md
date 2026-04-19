# RegionBoundsPreview - STYLE PROPERTIES MATRIX

**Component:** RegionBoundsPreview (DELTA)
**Level:** Molecule
**RN Source:** **NEW COMPONENT — NO RN BASELINE**
**Framework Primitives:** Mapbox Snapshot API

**Note:** This matrix is duplicated from the example in UI-073. Including here for completeness as one of the 11 delta compositions.

---

## DELTA CONTEXT

**Source UC:** UC-OFFL-01 — Browse Available Offline Regions

**Rationale:** Net-new component for static region thumbnail (map-bounds snapshot). Different from `RouteThumbnail` which shows route polylines.

**Migration path:** Native-only implementation using Mapbox Snapshotter:
- Android: Mapbox `Snapshotter` API
- iOS: Mapbox `MGMSnapshotter` API

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| UC Spec | `.spec/prds/native-rewrite/11-uc-offline.md` | UC-OFFL-01 requirements |
| Framework (Android) | Mapbox Snapshotter | Static map snapshot |
| Framework (iOS) | MGMSnapshotter | Static map snapshot |

---

## STYLE PROPERTIES MATRIX

### Layout — Container (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| width | Task spec | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| height | Task spec | `120` (thumbnail size) | `Modifier.height(120.dp)` | `.frame(height: 120)` | ESCALATE — propose `size.regionPreviewHeight = 120` |
| borderRadius | Task spec | `radius.md` = 8 | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |
| overflow | Task spec | `'hidden'` (clip snapshot) | `Modifier.clip(shape)` | `.clipped()` | n/a |

### Layout — Snapshot (Mapbox Snapshotter)

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| snapshotSize | Task spec | `matches container` | `Size(width, height)` | `CGSize(width: width, height: height)` | n/a |
| cameraCenter | Task spec | `bounds.center` | `cameraPosition = CameraPosition.Builder().target(bounds.center).build()` | `centerCoordinate = bounds.center` | n/a |
| cameraZoom | Task spec | `fit bounds` | `cameraPosition = ...zoom(levelToFit)` | `zoomLevel = levelToFit` | n/a |
| cameraPitch | Task spec | `0` (top-down) | `tilt = 0.0` | `pitch = 0` | n/a |
| cameraBearing | Task spec | `0` (north-up) | `bearing = 0.0` | `heading = 0` | n/a |
| styleUrl | Task spec | `Mapbox Streets` | `styleUri = Style.MAPBOX_STREETS` | `styleURL = MGLStyle.streetsStyleURL` | n/a |

### Layout — Overlay (region info)

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| position | Task spec | `bottom-left` | `Modifier.align(Alignment.BottomStart)` | `.frame(maxWidth: .infinity, alignment: .bottomLeading)` | n/a |
| padding | Task spec | `space.sm` = 8 | `Modifier.padding(8.dp)` | `.padding(8)` | `space.sm` |
| flexDirection | Task spec | `'column'` (name, size) | `Column(...)` | `VStack` | n/a |

### Visual — Background

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| backgroundColor | Task spec | `color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| overlay | Task spec | `gradient from transparent to black` | `Brush.verticalGradient(...)` | `.overlay(LinearGradient(...))` | n/a |
| overlayOpacity | Task spec | `0.6` (60% black) | `alpha = 0.6f` | `.opacity(0.6)` | ESCALATE — propose `opacity.previewOverlay = 0.6` |

### Typography — Region Name (Paper Text variant=labelLarge)

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | Paper labelLarge | `14` | `14.sp` | `.font(.system(size: 14, weight: .medium))` | ESCALATE — verify token |
| fontWeight | Paper labelLarge | `'500'` | `FontWeight.Medium` | `.medium` | ESCALATE — verify token |
| color | Task spec | `color.onSurface.default` (white on overlay) | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| maxLines | Task spec | `1` | `maxLines = 1` | `.lineLimit(1)` | n/a |
| overflow | Task spec | `'ellipsis'` | `overflow = TextOverflow.Ellipsis` | `.truncationMode(.tail)` | n/a |

### Typography — Region Size (Paper Text variant=labelSmall)

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | Paper labelSmall | `11` | `11.sp` | `.font(.system(size: 11, weight: .medium))` | ESCALATE — propose `type.label.sm.fontSize = 11` |
| fontWeight | Paper labelSmall | `'500'` | `FontWeight.Medium` | `.medium` | `type.label.sm.fontWeight` |
| color | Task spec | `color.onSurface.muted` (80% white) | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| text | Task spec | `'~245 MB'` | `Text("~${size} MB")` | `Text("~\(size) MB")` | n/a |

### Visual — Loading State

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| backgroundColor | Task spec | `color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| indicator | Task spec | `circular progress` | `CircularProgressIndicator()` | `ProgressView()` | n/a |
| indicatorColor | Task spec | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

### Visual — Error State

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| backgroundColor | Task spec | `color.error.default` | `LaneShadowTheme.colors.error` | `theme.colors.error` | `color.error.default` |
| icon | Task spec | `error icon` | `Icon(Icons.Default.Error)` | `Image(systemName: "exclamationmark.triangle")` | n/a |
| iconColor | Task spec | `color.onError.default` | `LaneShadowTheme.colors.onError` | `theme.colors.onError` | `color.onError.default` |
| iconSize | Task spec | `24` | `Modifier.size(24.dp)` | `.frame(width: 24, height: 24)` | ESCALATE — propose `icon.md = 24` |

### Interaction

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| accessibilityRole | Task spec | `'image'` | `Modifier.semantics { role = Role.Img }` | `.accessibilityAddTraits(.isImage)` | n/a |
| accessibilityLabel | Task spec | `'Preview of {regionName}'` | `contentDescription = "Preview of $regionName"` | `.accessibilityLabel("Preview of \(regionName)")` | n/a |
| testID | Task spec | passed via prop | `Modifier.testTag(testID)` | `.accessibilityIdentifier(testID)` | n/a |

### State — Props

| State | Source | Type | Android | iOS | Token |
|---|---|---|---|---|---|
| bounds | Task spec | `GMSCoordinateBounds` or `MGLCoordinateBounds` | `val bounds: LatLngBounds` | `var bounds: GMSCoordinateBounds` | n/a (map SDK) |
| regionName | Task spec | `String` | `val regionName: String` | `var regionName: String` | n/a |
| sizeInMB | Task spec | `Int` | `val sizeInMB: Int` | `var sizeInMB: Int` | n/a |
| isLoading | Task spec | `Boolean` | `val isLoading: Boolean` | `var isLoading: Bool` | n/a |
| isError | Task spec | `Boolean` | `val isError: Boolean` | `var isError: Bool` | n/a |

---

## NOTES

- **NEW component:** No RN baseline exists
- **Static snapshot:** Mapbox Snapshotter creates static map image
- **Thumbnail size:** 120px height, full width
- **Camera:** Top-down (pitch=0), north-up (bearing=0), zoom to fit bounds
- **Style:** Mapbox Streets style
- **Overlay:** Gradient (0% to 60% black) for text readability
- **Region info:** Bottom-left overlay with name and size
- **Loading:** surfaceVariant background with circular progress
- **Error:** error background with error icon
- **Accessibility:** Role="image", label describes region
- **Map SDK:** Mapbox Snapshotter (both platforms)
