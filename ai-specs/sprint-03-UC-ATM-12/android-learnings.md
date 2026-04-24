# Android Learnings: UC-ATM-12 (LSMap Android Implementation)

## Implementation Date
2026-04-24

## Edge Cases Discovered

1. **Mapbox Maven Repository Authentication**
   - Mapbox's Maven repository requires both authentication and a valid MAPBOX_DOWNLOADS_TOKEN
   - This is separate from MAPBOX_ACCESS_TOKEN used at runtime
   - Without the download token, the dependency cannot be resolved
   - **Solution**: Commented out Mapbox dependency in build.gradle.kts and implemented preview-only version for now
   - **Future**: Need to obtain MAPBOX_DOWNLOADS_TOKEN from Mapbox account

2. **Robolectric Testing with Compose**
   - Using `createComposeRule()` in tests causes Robolectric fingerprint errors
   - `LocalInspectionMode.current` works correctly in unit tests without ComposeTestRule
   - **Solution**: Wrote pure Kotlin tests for data classes and type verification, avoiding UI composition tests
   - **Pattern**: Follow LSButtonTest pattern — test pure functions and data classes, verify source code structure statically

3. **Test File Path Resolution**
   - Tests run from `android/` directory, so relative file paths must be adjusted
   - File("app/src/main/...") fails, File("src/main/...") works
   - **Solution**: Use relative paths from test working directory

## API Contract Notes

### Spacing Token Mapping
- Contract specifies `spacing3`, `spacing4`, `spacing5`
- LaneShadowSpace uses `xs`, `sm`, `md`, `lg`, `xl`, `xxl`, `xxxl`, `xxxxl`
- **Mapping used**:
  - `spacing3` → `lg` (16.dp)
  - `spacing4` → `xl` (24.dp)
  - `spacing5` → `xxl` (32.dp)
- This mapping is based on typical design system patterns where spacing numbers increment by 4-8dp

### GeneratedTokens Structure
- Style URLs: `GeneratedTokens.map.style.light` / `dark` ✓
- Route colors: `GeneratedTokens.color.Route.best` / `alt1` / `alt2` ✓
- Annotation colors: `GeneratedTokens.color.Status.Success.default` / `recording` / `Info.default` ✓
- Stroke widths: `GeneratedTokens.sizing.stroke.sm` / `md` / `lg` ✓
- **Note**: Colors are accessed as `.default` (e.g., `GeneratedTokens.color.Route.best` not `GeneratedTokens.color.Route.best.default`)

## UI Decisions

1. **Preview-Only Implementation**
   - Since Mapbox SDK is unavailable, implemented `LSMap` to render placeholder Box in preview mode
   - Used `LocalInspectionMode.current` to detect preview/test environment
   - Full Mapbox integration is commented out but ready for when download token is available

2. **Type Definitions in Separate File**
   - Created `LSMapTypes.kt` to hold all contract types (LatLng, ColorToken, StrokeSize, etc.)
   - Keeps public API clean and SDK-agnostic
   - Matches the contract specification exactly

3. **Error Handling**
   - Contract defines `MapError` enum (MissingToken, NetworkUnavailable, StyleLoadFailed)
   - Future implementation should check for Mapbox token availability and render fallback UI
   - Currently renders placeholder in all cases (preview-only)

## Gotchas for iOS Implementer

1. **Mapbox Download Token vs Access Token**
   - iOS: `Info.plist` key `MBXAccessToken` with value from `$(MAPBOX_ACCESS_TOKEN)` env var
   - Android: `secrets.xml` generated from `MAPBOX_ACCESS_TOKEN` via Gradle task
   - Both need MAPBOX_DOWNLOADS_TOKEN for dependency resolution
   - **iOS may have similar issues** with CocoaPods/SPM authentication

2. **Spacing Token Naming**
   - Contract uses `spacing3`, `spacing4`, `spacing5`
   - Actual theme may use different names (xs, sm, md, etc.)
   - Verify actual token names in your theme implementation

3. **Test Pattern**
   - Don't use ComposeTestRule for simple type verification
   - Test data classes and enums directly with assertions
   - Verify source code structure statically with File.readText()

4. **Preview Mode Detection**
   - Android: `LocalInspectionMode.current` returns true in previews and unit tests
   - iOS: Likely have a similar environment check
   - Use this to render placeholder UI when SDK is unavailable

## Files Created/Modified

### Created
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSMapTypes.kt` — All contract type definitions
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt` — LSMap composable (preview-only)
- `android/app/src/test/java/com/laneshadow/ui/atoms/LSMapTest.kt` — Unit tests for types and source verification
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/LSMapStories.kt` — 9 sandbox stories
- `android/app/src/main/res/values/secrets.xml` — Generated Mapbox token (gitignored)

### Modified
- `android/settings.gradle.kts` — Added Mapbox Maven repository (commented out)
- `android/app/build.gradle.kts` — Added Mapbox dependency (commented out) and secrets generation task
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/AtomsStories.kt` — Registered LSMapStories.all
- `.gitignore` — Added secrets.xml to gitignore

## Future Work

1. **Obtain MAPBOX_DOWNLOADS_TOKEN** from Mapbox account to enable full SDK integration
2. **Uncomment Mapbox dependency** in build.gradle.kts
3. **Implement AndroidView factory/update lambdas** to:
   - Load Mapbox style from GeneratedTokens.map.style
   - Apply camera position
   - Render polylines with RouteVariant colors
   - Render annotations with AnnotationKind colors
   - Handle camera fit (Polyline/Polylines bounds)
   - Enable/disable gestures based on MapMode
   - Handle onTap callback
4. **Add error fallback UI** using LSGlassPanel for MapError states
5. **Add semantic modifiers** for testing (mapMode, cameraPosition, polylineCount, etc.)
6. **Verify on emulator** with real Mapbox token

## Verification Commands

```bash
# Run tests
cd android && ./gradlew :app:testDebugUnitTest --tests "com.laneshadow.ui.atoms.LSMapTest"

# Compile
cd android && ./gradlew :app:compileDebugKotlin

# Check for literal tokens
grep -rn 'pk\.' android/ | grep -v '.git' | grep -v 'build/' | wc -l  # Should be 1 (secrets.xml)

# Check for Mapbox in public API
grep 'import com.mapbox' android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt | wc -l  # Should be 0

# Check for raw colors
grep -n 'Color(0x' android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt | grep -v '//' | wc -l  # Should be 0
```

## Status

✅ Types defined and tested
✅ LSMap composable created (preview-only)
✅ Tests passing (15/15)
✅ Build compiles
✅ Stories created (9/9)
✅ Stories registered in AtomsStories
✅ No literal tokens in source
✅ No Mapbox SDK in public API
✅ No raw colors hardcoded
✅ Secrets generation configured
✅ .gitignore updated

⚠️ Full Mapbox integration pending MAPBOX_DOWNLOADS_TOKEN
