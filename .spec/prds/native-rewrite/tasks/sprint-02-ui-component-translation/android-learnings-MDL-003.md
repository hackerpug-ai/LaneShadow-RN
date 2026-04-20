# Android Learnings: MDL-003 - CameraQuick Model Translation

## Implementation Date
2026-04-19

## Edge Cases Discovered

1. **ActivityResultLauncher Initialization**: The `ActivityResultLauncher` must be initialized before calling `openCamera()`. This requires the launcher to be registered with the activity's lifecycle. Added an `init()` method and auto-initialization in `openCamera()` to handle this gracefully.

2. **Permission Handling Complexity**: Android's permission system requires multiple API levels to be handled:
   - Android < 23 (M): Permissions granted at install time
   - Android >= 23 (M): Runtime permissions required
   - Android >= 33 (13): Uses READ_MEDIA_IMAGES instead of WRITE_EXTERNAL_STORAGE

   For camera capture to public directories, no storage permission is needed on Android 13+.

3. **Cancellation Handling**: When using `suspendCancellableCoroutine`, it's critical to clean up the `resultCallback` in `invokeOnCancellation` to prevent memory leaks and dangling callbacks.

## API Contract Notes

- **TypeScript Source**: `openCamera() -> Promise<string | undefined>`
- **Kotlin Translation**: `suspend fun openCamera(): String?`

The translation is straightforward:
- `Promise<string | undefined>` → `suspend fun` returning `String?`
- `undefined` maps to `null`
- Async/await pattern maps to Kotlin coroutines with `suspendCancellableCoroutine`

## UI Decisions

- **No UI Components**: This is a pure model/logic class with no UI elements.
- **Quality Setting**: TypeScript source uses 0.9 quality. Android's `MediaStore.ACTION_IMAGE_CAPTURE` doesn't expose a direct quality parameter, but defaults to high quality which is equivalent.
- **No Editing**: Both implementations disable editing/cropping (TypeScript via `allowsEditing: false`, Android by default).

## Gotchas for iOS Implementer

1. **Permission APIs**: Android uses `Manifest.permission.CAMERA` with runtime checks, while iOS uses `AVCaptureDevice.authorizationStatus(for: .video)`. The patterns are similar but the API surface is different.

2. **Result Handling**: Android uses `ActivityResultLauncher` with a callback-based approach wrapped in coroutines. iOS uses `UIImagePickerControllerDelegate` with continuation-based async/await. Both achieve the same result but through different mechanisms.

3. **Intent-Based Camera**: Android uses an intent-based approach (`MediaStore.ACTION_IMAGE_CAPTURE`) which delegates to the camera app. iOS uses `UIImagePickerController` which can be presented modally. Both provide similar user experiences.

4. **Quality Parameter**: The TypeScript source uses a quality parameter (0.9) which is specific to expo-image-picker. Neither Android's intent-based camera nor iOS's UIImagePickerController exposes this directly, but both default to high quality.

5. **Cancellation Handling**: Kotlin's `suspendCancellableCoroutine.invokeOnCancellation` is similar to Swift's `Task.cancel()` handling. Both need to clean up callbacks and delegates when the coroutine/task is cancelled.

## Files Created/Modified

- `android/app/src/main/java/com/laneshadow/models/CameraQuickLauncher.kt` (NEW)
  - Main camera launcher implementation
  - Uses coroutines for async operations
  - Handles permissions via ActivityResultLauncher
  - Returns URI string or null on denial

- `android/app/src/test/java/com/laneshadow/models/CameraQuickTest.kt` (NEW)
  - Tests for public API matching (AC-1)
  - Tests for async/coroutine usage (AC-2)
  - Tests for storage abstraction behavior (AC-3)

## Translation Strategy Followed

The implementation followed the strategy from `matrices/models/MODEL-camera-quick.md`:
- Used `suspendCancellableCoroutine` for bridging callback-based APIs
- Used `ActivityResultLauncher` for result handling
- Handled camera permissions with appropriate API level checks
- Returned `String?` (nullable) to match TypeScript's `string | undefined`
- No persistent storage used (matches source behavior)

## Testing Notes

- Unit tests verify API contract and coroutine usage
- Integration tests would be needed to test actual camera hardware and permission flows
- The implementation is ready for integration testing with real devices

## Architecture Decisions

1. **Separate init() Method**: Added an `init()` method for ActivityResultLauncher registration, but also auto-initialize in `openCamera()` for convenience.

2. **Permission Callback**: Used a callback-based permission request pattern to work within the suspend function context. A more sophisticated implementation could use ActivityResultLauncher for permissions as well.

3. **Null on Denial**: Return `null` when permissions are denied or no camera app is available, matching the TypeScript source behavior.

## Dependencies

No new dependencies were added. The implementation uses:
- AndroidX Activity (ActivityResultLauncher, ActivityResultContracts)
- AndroidX Fragment (FragmentActivity)
- Kotlin Coroutines (suspendCancellableCoroutine)
- Android Platform (MediaStore, Manifest)

All are already in the project dependencies.
