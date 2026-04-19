# RouteDiscoveryScreen — STYLE PROPERTIES MATRIX

**Component:** RouteDiscoveryScreen
**Level:** Screen
**Source:** `react-native/components/discovery/route-discovery-screen.tsx`
**Platform Mapping:** Android `Box` + `Map` + overlays, iOS `VStack` + `Map` + overlays

---

## TRANSLATION SOURCES

| Property | RN wrapper source | Framework primitives | Native target file | Variants |
|---|---|---|---|---|
| Layout | `react-native/components/discovery/route-discovery-screen.tsx` | `react-native/Libraries/Components/View/View.js`, `react-native-maps` | Android: `app/src/main/java/com/laneshadow/ui/screens/RouteDiscoveryScreen.kt`<br>iOS: `app/ui/screens/RouteDiscoveryScreen.swift` | 1 fixed screen with map + overlays |

---

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources.

### Layout — Screen Container

**Source files read:**
- LaneShadow: `react-native/components/discovery/route-discovery-screen.tsx`
- Framework: `react-native/Libraries/Components/View/View.js`, `react-native-maps`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flex | RN-wrapper | `flex: 1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| Visual | backgroundColor | RN-wrapper | `semantic.color.background.default` | `LaneShadowTheme.colors.background` | `theme.colors.background` | `color.background.default` |

### Layout — Map View

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flex | RN-wrapper | `flex: 1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| Visual | mapType | RN-wrapper | `standard` | `GoogleMap(mapType = MapType.NORMAL)` | `Map(style: .standard)` | n/a |
| Visual | showsUserLocation | RN-wrapper | `true` | `MyLocationLayer()` | `.userTrackingMode(.follow)` | n/a |

### Layout — Map Header Overlay

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | position | RN-wrapper | `absolute` | `Modifier.align(Alignment.TopCenter)` | `.frame(maxWidth: .infinity).position(.top)` | n/a |
| Layout | paddingHorizontal | RN-wrapper | `space.lg` = 16 | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| Layout | paddingTop | RN-wrapper | `insets.top + space.lg` | `SafeAreaPadding.top + 16.dp` | `.safeAreaPadding(.top).padding(.top, 16)` | `space.lg` |
| Visual | backgroundColor | RN-wrapper | `rgba(255,255,255,0.9)` (glass) | `Color.White.copy(alpha = 0.9f)` | `.white.opacity(0.9)` | ESCALATE — `opacity.glass = 0.9` |
| Visual | borderRadius | RN-wrapper | `radius.lg` = 16 | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.lg` |
| Visual | shadow | RN-wrapper | `elevation[2]` | `Modifier.shadow(elevation = 2.dp)` | `.shadow(color:.black.opacity(0.05), radius:4, y:2)` | `elevation.light.2` |

### Layout — Map Controls

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | position | RN-wrapper | `absolute right` | `Modifier.align(Alignment.CenterEnd)` | `.frame(maxWidth: .infinity).position(.trailing)` | n/a |
| Layout | gap | RN-wrapper | `space.sm` = 8 | `Spacer(Modifier.height(8.dp))` | `Spacer(minLength: 8)` | `space.sm` |
| Layout | buttonSize | RN-wrapper | `40` | `Modifier.size(40.dp)` | `.frame(width: 40, height: 40)` | ESCALATE — `size.mapControlButton = 40` |
| Visual | backgroundColor | RN-wrapper | `rgba(255,255,255,0.9)` (glass) | `Color.White.copy(alpha = 0.9f)` | `.white.opacity(0.9)` | ESCALATE — `opacity.glass = 0.9` |
| Visual | borderRadius | RN-wrapper | `radius.md` = 8 | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |

### Layout — Filter Bar

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | position | RN-wrapper | `absolute bottom` | `Modifier.align(Alignment.BottomCenter)` | `.frame(maxWidth: .infinity).position(.bottom)` | n/a |
| Layout | paddingHorizontal | RN-wrapper | `space.lg` = 16 | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| Layout | paddingBottom | RN-wrapper | `insets.bottom + space.lg` | `SafeAreaPadding.bottom + 16.dp` | `.safeAreaPadding(.bottom).padding(.bottom, 16)` | `space.lg` |
| Layout | gap | RN-wrapper | `space.sm` = 8 | `Spacer(Modifier.width(8.dp))` | `Spacer(minLength: 8)` | `space.sm` |
| Visual | backgroundColor | RN-wrapper | `rgba(255,255,255,0.9)` (glass) | `Color.White.copy(alpha = 0.9f)` | `.white.opacity(0.9)` | ESCALATE — `opacity.glass = 0.9` |
| Visual | borderRadius | RN-wrapper | `radius.full` = 9999 | `RoundedCornerShape(percent = 50)` | `Capsule()` | `radius.full` |

---

## DESIGN NOTES

- Full-screen map with floating overlays
- Header shows search bar
- Right side has map controls (zoom, recenter)
- Bottom has filter chips (archetype selectors)
- Glass morphism effect on all overlays
- Safe area handling for header and filter bar

---

## VERIFICATION GATES

- Map fills screen
- Overlays positioned correctly
- Glass effect visible
- Controls accessible (44pt min)
- Safe areas respected
- User location visible
- Map gestures work (zoom, pan)

---

## DEPENDENCIES

- UI-001 (core theme contract)
- MenuLayout template
- MapViewWrapper organism
- DiscoveryFilterBar molecule
- DiscoverySortToggle molecule
- IconSymbol component
- Map system (Android `GoogleMap`, iOS `MapKit`)

---

## COMPOSITION

- RouteDiscoveryScreen = MenuLayout + MapViewWrapper + MapHeaderOverlay + MapControls + DiscoveryFilterBar + DiscoverySortToggle
- Uses RoutePin for map markers
- Uses IntentSearchSheet for search
- Uses StateFilterSheet for state filtering
