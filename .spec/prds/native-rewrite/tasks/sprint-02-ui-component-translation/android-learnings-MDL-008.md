# Android Learnings: MDL-008 - ModelManifest Model Translation

## Implementation Date
2026-04-19

## Edge Cases Discovered

1. **JSON Serialization Configuration**: Had to add `kotlinx-serialization` plugin to both root and app-level `build.gradle.kts`. The plugin needs to be applied in both locations for proper serialization support.

2. **SharedPreferences Pattern**: Unlike AsyncStorage in React Native (which is async), SharedPreferences has synchronous `getString()` and `putString()` methods. However, to maintain consistency with the source async pattern and avoid blocking the main thread, wrapped all operations in `withContext(Dispatchers.IO)`.

3. **Cache Invalidation**: The 24-hour cache duration required storing both the manifest and a timestamp. Created a private `CacheEntry` data class to hold both values together, similar to the TypeScript source's approach.

4. **Semver Comparison**: TypeScript's semver comparison needed manual implementation in Kotlin. Used string splitting and integer parsing with proper comparison logic (major > minor > patch).

5. **Null Handling in SharedPreferences**: `prefs.getLong(key, default)` returns the default for missing keys, but there's no way to distinguish "missing" from "stored default value". For timestamps, used `-1L` as sentinel value and converted to nullable `Long?`.

6. **Mock Verification Issues**: Initial test failures due to `verify(mockEditor).apply()` being called multiple times (once per SharedPreferences operation). Fixed by using `verify(mockEditor, atLeastOnce()).apply()` instead.

## API Contract Notes

- **Data Classes**: All TypeScript interfaces translated to Kotlin `@Serializable` data classes
- **Nullable Fields**: TypeScript's optional fields (`changelog?: string[]`) became `val changelog: List<String>? = null` with default null
- **Async Methods**: All async functions became `suspend` functions using coroutines
- **Error Handling**: TypeScript's `throw new Error()` translated to `throw IllegalStateException()` or returning error values (e.g., `false` for checksum validation)

## UI Decisions

None - this is a model layer translation with no UI components.

## Gotchas for iOS Implementer

1. **Singleton Pattern**: The TypeScript source has a singleton function `getModelManifestService()`. On Android, this would typically be handled by Hilt DI. Consider how you'll manage singleton lifecycle in iOS (perhaps a shared instance or DI container).

2. **Cache Serialization**: The manifest cache stores both the manifest and timestamp. In Swift with `Codable`, you can use a similar `CacheEntry` struct or use `UserDefaults` with separate keys.

3. **Semver Comparison**: The manual semver comparison logic will need to be ported to Swift. Consider using a semver library if available.

4. **Coroutine Equivalents**: Kotlin's `suspend` functions map to Swift's `async` functions. Use `await` for coroutines and `DispatchQueue.main` or `Task` for context switching.

5. **SharedPreferences → UserDefaults**: Android's SharedPreferences maps to UserDefaults in iOS. Both use key-value storage, but UserDefaults is type-safe with generics.

## Files Created/Modified

- **Modified**: `android/app/build.gradle.kts`
  - Added `id("org.jetbrains.kotlin.plugin.serialization")` plugin
  - Added `kotlinx-serialization-json` dependency

- **Created**: `android/app/src/main/java/com/laneshadow/models/ModelManifestService.kt` (370 lines)
  - Complete translation of `react-native/lib/ai/model-manifest.ts`
  - All public methods from source implemented
  - Proper coroutine usage with `Dispatchers.IO`
  - SharedPreferences persistence
  - JSON serialization with kotlinx-serialization

- **Created**: `android/app/src/test/java/com/laneshadow/models/ModelManifestTest.kt` (249 lines)
  - 5 test methods covering all acceptance criteria
  - Tests verify public API structure, coroutine usage, and storage patterns
  - Additional tests for semver comparison and rollback flow

## Translation Accuracy

Successfully translated all features from `react-native/lib/ai/model-manifest.ts`:
- ✅ All data classes (ModelManifestEntry, ModelManifest, LocalModelMetadata, ModelUpdateCheck)
- ✅ fetchManifest() with 24-hour caching
- ✅ getLocalModelMetadata() and saveLocalModelMetadata()
- ✅ checkForUpdates() with version comparison
- ✅ getModelEntry() for single model lookup
- ✅ validateModelChecksum() with timestamp updates
- ✅ clearCache() for cache invalidation
- ✅ getAvailableModels() for listing all models
- ✅ checkMinAppVersion() with semver comparison
- ✅ prepareUpdate(), commitUpdate(), rollbackUpdate() for update management
- ✅ All methods are suspend functions (coroutine-based)
- ✅ SharedPreferences storage abstraction

## Dependencies

- **kotlinx-serialization-json**: Required for JSON parsing (equivalent to JSON.parse/stringify in TypeScript)
- **ChecksumValidator**: Reused existing model for checksum validation
- **SharedPreferences**: Platform storage abstraction (equivalent to AsyncStorage)

## Testing Notes

- Used Mockito for SharedPreferences mocking
- Tests verify method signatures and coroutine usage
- Storage abstraction tests verify correct key patterns
- All tests pass successfully
