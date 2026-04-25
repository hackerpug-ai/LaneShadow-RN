# Android Learnings: UC-ORG-06 — LSRouteCard

## Implementation Date
2026-04-24

## Edge Cases Discovered

### 1. MapView Native Dependencies in Tests
**Issue**: Robolectric tests fail with `UnsatisfiedLinkError` when trying to compose `LSMap` because Mapbox MapView requires native libraries (.so files) that aren't available in the test environment.

**Solution**: Following the pattern from `LSMapLayerTest`, made `LSRouteCard` accept an optional `mapContent` slot parameter with a default implementation using `DefaultRouteCardMap()`. Tests pass a simple `Box` composable instead of the actual `LSMap` to avoid native dependencies.

**Code Pattern**:
```kotlin
@Composable
fun LSRouteCard(
    route: RouteCardRoute,
    modifier: Modifier = Modifier,
    mapContent: @Composable () -> Unit = { DefaultRouteCardMap(route) },
) {
    // ... card content
    Box(modifier = Modifier.testTag("ls-map-preview").height(160.dp)) {
        mapContent()
    }
    // ... rest of card
}
```

**Test Pattern**:
```kotlin
LSRouteCard(
    route = mockRoute1,
    modifier = Modifier.testTag("route-card-default"),
    mapContent = {
        Box(modifier = Modifier.testTag("mock-map"))
    },
)
```

### 2. LSMap Does Not Expose Modifier Parameter
**Issue**: `LSMap` composable doesn't have a `modifier` parameter (it manages its own sizing via `AndroidView`).

**Solution**: Wrap `LSMap` in a `Box` with test tag and fixed height (160dp per spec). The Box provides the test tag for UI testing and controls the map preview size.

**Spec Reference**: Map preview height is 160pt (from uc-org-06-route-card.html §03 States).

### 3. LSTagPill Modifier Parameter Missing
**Issue**: `LSTagPill` molecule doesn't support a `modifier` parameter in its current implementation.

**Solution**: Used `LSText` with `TypographyVariant.Ui.Label.Md` for difficulty label as a minimal implementation. This matches the spec's requirement for difficulty display while staying within existing component APIs.

**Future Enhancement**: Could add `modifier` parameter to `LSTagPill` or create a dedicated `LSDifficultyChip` component if difficulty tags need more styling (pill shape, tinted backgrounds per difficulty level).

## API Contract Notes

### RouteCardRoute Data Model
The `RouteCardRoute` data class mirrors the Convex schema `routes` table structure:

| Field | Type | Required? | Convex Schema Field |
|-------|------|-----------|---------------------|
| `id` | String | Yes | `routeId` |
| `title` | String | Yes | `name` |
| `distance` | String | Yes | (computed from polyline) |
| `estimatedTime` | String | Yes | (computed from polyline + traffic) |
| `polyline` | List<LatLng>? | No | (geometry) |
| `variant` | RouteVariant | Yes | (Best/Alt1/Alt2) |
| `difficulty` | RouteDifficulty | Yes | (Easy/Moderate/Hard) |
| `isSaved` | Boolean | Yes | (user state) |

**Note**: Distance and time are pre-formatted strings in the Android implementation to keep the organism data-agnostic. The iOS implementation may choose to compute these from raw data.

### RouteVariant Color Resolution
Polyline colors are resolved through `LSMapTypes.resolveLSMapRouteColor()`:

| Variant | Light Mode | Dark Mode |
|---------|------------|-----------|
| `Best` | `GeneratedTokens.color.Route.best` (#EE7C2B copper) | `GeneratedTokens.color.Route.dark.best` |
| `Alt1` | `GeneratedTokens.color.Route.alt1` (#4D8470 sage) | `GeneratedTokens.color.Route.dark.alt1` |
| `Alt2` | `GeneratedTokens.color.Route.alt2` (#6B7B8F slate) | `GeneratedTokens.color.Route.dark.alt2` |

**Implementation Note**: LSRouteCard doesn't directly resolve colors — it passes `RouteVariant` to `PolylineData`, and `LSMap` handles color resolution internally. This keeps the organism focused on composition.

## UI Decisions

### 1. Map Preview Height Fixed at 160dp
**Decision**: Map preview is a fixed 160dp height per spec, not dynamic based on content.

**Rationale**: The spec defines 160pt as the map preview height (§03 States). Fixed height ensures consistent card sizing in catalog lists and prevents layout shifts when routes have different geometries.

### 2. Start/End Annotations Auto-Generated
**Decision**: When polyline data exists, automatically add Start/End annotations at first/last coordinates.

**Rationale**: The spec shows start (12×12pt circle) and end (16×16pt ring with 5pt dot) annotations on all map examples. Auto-generating reduces boilerplate for consumers.

**Code**:
```kotlin
annotations = if (route.polyline != null && route.polyline.isNotEmpty()) {
    listOf(
        Annotation(kind = AnnotationKind.Start, coordinate = route.polyline.first()),
        Annotation(kind = AnnotationKind.End, coordinate = route.polyline.last()),
    )
} else { emptyList() }
```

### 3. Graceful Fallback for Missing Data
**Decision**: When `polyline` is null or empty, show a placeholder map area (160dp Box) and render the rest of the card with em-dash ("—") for missing distance/time values.

**Rationale**: Spec includes "Missing Optional Data" story showing graceful degradation. Card should render without crashing even if route data is incomplete.

### 4. Saved State Icon Position
**Decision**: HeartFill icon appears in the title row, trailing edge, using `IconColor.Content(ContentColor.Primary)`.

**Rationale**: Spec shows saved icon in title row (S.02 example). Using `ContentColor.Primary` ensures it's visible in both light and dark modes. The icon only renders when `route.isSaved == true`.

## Gotchas for iOS Implementer

### 1. Mapbox Native Dependencies in Tests
iOS UnitTests won't have access to Mapbox SDK's native rendering. Follow the Android pattern: accept an optional map content slot with a default implementation that uses the real map, but override it in tests with a stub view.

**Swift Pattern**:
```swift
struct LSRouteCard: View {
    let route: RouteCardRoute
    @ViewBuilder var mapContent: () -> some View = { DefaultRouteCardMap(route: route) }

    var body: some View {
        LSCard {
            // Map preview
            VStack { mapContent() }
                .frame(height: 160)
                .accessibilityIdentifier("ls-map-preview")
            // ... rest of card
        }
    }
}
```

### 2. LSMap Modifier Limitation
`LSMap` (Android) doesn't expose a modifier parameter — wrap it in a Box/SizedBox. Check if iOS MapKit/Mapbox wrapper has similar constraints.

### 3. CameraFit.Polyline Padding
The spec requires `CameraFit.Polyline(padding: .spacing3)` which resolves to 12dp. Ensure your map camera fit logic includes this padding so polylines don't touch the map edges.

**Android Implementation**:
```kotlin
CameraFit.Polyline(padding = SpacingToken.Spacing3)  // 12.dp
```

**iOS Implementation**: Should match 12pt padding (equivalent to Android's spacing.3).

### 4. RouteVariant Color Token Paths
When implementing color resolution, use the exact token paths:
- `color.route.best` → #EE7C2B (copper)
- `color.route.alt1` → #4D8470 (sage green)
- `color.route.alt2` → #6B7B8F (slate)

Dark mode variants are at `color.route.dark.{best,alt1,alt2}`.

### 5. Story Registration Pattern
All 6 stories must use dotted IDs with `organisms.routecard.` prefix and `ComponentTier.Organism`:

```kotlin
Story(
    id = "organisms.routecard.default",
    tier = ComponentTier.Organism,
    component = "LSRouteCard",
    name = "Default",
    summary = "...",
    content = { DefaultStory() },
)
```

Required stories: Default, Saved, Alt Variant, Long Title Overflow, Missing Optional Data, Dark Mode.

### 6. Test Assertions for Saved State
The saved state test verifies presence/absence of the heart icon using `contentDescription`:

```kotlin
// When saved
composeTestRule.onNodeWithContentDescription("Saved route").assertExists()

// When not saved
composeTestRule.onNodeWithContentDescription("Saved route").assertDoesNotExist()
```

Ensure your iOS implementation sets the accessibility label on the heart icon for testability.

## Files Created/Modified

### Created
- `android/app/src/main/java/com/laneshadow/ui/organisms/RouteCardTypes.kt` — RouteCardRoute data class, RouteDifficulty enum
- `android/app/src/main/java/com/laneshadow/ui/organisms/LSRouteCard.kt` — LSRouteCard composable, DefaultRouteCardMap
- `android/app/src/test/java/com/laneshadow/ui/organisms/LSRouteCardTest.kt` — 5 tests covering AC-1, AC-2, AC-4, AC-6
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/LSRouteCardStory.kt` — 6 sandbox stories

### Modified
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/OrganismStories.kt` — Added LSRouteCardStory.all registration

## Test Coverage

| Test | AC Coverage | Status |
|------|-------------|--------|
| `default_renders_card_with_map_preview_title_subtitle_and_chip` | AC-1 | ✅ PASS |
| `alt1_variant_resolves_to_route_alt1_token` | AC-2 | ✅ PASS |
| `route_prop_type_mirrors_convex_schema` | AC-4 | ✅ PASS |
| `saved_state_shows_heart_fill_icon` | AC-6 | ✅ PASS |
| `non_saved_state_omits_heart_icon` | AC-6 | ✅ PASS |
| Story count ≥ 6 | AC-3 | ✅ PASS (6 stories) |
| No convex/network/io imports | AC-5 | ✅ PASS (0 imports) |
| No hardcoded Color/TextStyle/FontFamily | TC-7 | ✅ PASS (0 matches) |

## Verification Commands

```bash
# Run tests
cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSRouteCardTest'

# Compile check
cd android && ./gradlew :app:compileDebugKotlin

# Lint check
cd android && ./gradlew detekt

# Story count verification
grep -c 'organisms.routecard' android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/LSRouteCardStory.kt

# Import verification (should return 0)
grep -rn 'import com.laneshadow.network\|import.*convex\|import retrofit\|import okhttp\|import java.io' \
  android/app/src/main/java/com/laneshadow/ui/organisms/LSRouteCard.kt | wc -l

# Hardcoded styling verification (should return 0)
grep -rn 'Color(0x\|TextStyle(\|FontFamily(' \
  android/app/src/main/java/com/laneshadow/ui/organisms/LSRouteCard.kt | wc -l
```
