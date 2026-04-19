# MODEL-camera-quick.md - Camera Launch Translation Plan

**Source File**: `react-native/lib/camera-quick.ts`
**Classification**: PORT
**Priority**: P2 (photo capture)

---

## SOURCE ANALYSIS

### Purpose
Opens camera immediately for photo capture with permission handling.

### Exports
- `openCamera()` → `Promise<string | undefined>` (returns image URI or undefined if denied)

### Dependencies
- `expo-image-picker` (ImagePicker) - Camera launch and permissions

### Key Behaviors
- Request camera permissions
- Launch camera with 0.9 quality
- No editing allowed
- Returns first asset URI or undefined on denial

---

## TRANSLATION STRATEGY

### Android (Kotlin)

```kotlin
// camera/CameraQuickLauncher.kt
import android.app.Activity
import android.content.Intent
import android.provider.MediaStore
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.fragment.app.FragmentActivity
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

class CameraQuickLauncher(private val activity: FragmentActivity) {

    private var cameraLauncher: ActivityResultLauncher<Intent>? = null
    private var resultCallback: ((String?) -> Unit)? = null

    fun init() {
        cameraLauncher = activity.registerForActivityResult(
            ActivityResultContracts.StartActivityForResult()
        ) { result ->
            val uri = result.data?.data
            resultCallback?.invoke(uri?.toString())
            resultCallback = null
        }
    }

    suspend fun openCamera(): String? = suspendCancellableCoroutine { continuation ->
        // Check permissions first
        val permissions = arrayOf(
            android.Manifest.permission.CAMERA
        )

        // For Android 13+, also need WRITE_EXTERNAL_STORAGE for photos
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            // Android 13+ uses READ_MEDIA_IMAGES instead of WRITE_EXTERNAL_STORAGE
            // Camera doesn't need this permission for saving to public directory
        }

        // Request permissions
        activity.requestPermissions(permissions) { granted ->
            if (!granted) {
                continuation.resume(null)
                return@requestPermissions
            }

            resultCallback = { uri ->
                continuation.resume(uri)
            }

            val intent = Intent(MediaStore.ACTION_IMAGE_CAPTURE).apply {
                // Ensure there's a camera app to handle the intent
                resolveActivity(activity.packageManager)?.let {
                    putExtra("return-data", false)
                }
            }

            cameraLauncher?.launch(intent) ?: run {
                continuation.resume(null)
            }
        }

        continuation.invokeOnCancellation {
            resultCallback = null
        }
    }

    private fun FragmentActivity.requestPermissions(
        permissions: Array<String>,
        callback: (Boolean) -> Unit
    ) {
        // Check if permissions are already granted
        val allGranted = permissions.all { permission ->
            android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.M ||
            checkSelfPermission(permission) == android.content.pm.PackageManager.PERMISSION_GRANTED
        }

        if (allGranted) {
            callback(true)
            return
        }

        // Request permissions
        activity.requestPermissions(permissions, CAMERA_PERMISSION_CODE) { requestCode, grantResults ->
            if (requestCode == CAMERA_PERMISSION_CODE) {
                val granted = grantResults.all { it == android.content.pm.PackageManager.PERMISSION_GRANTED }
                callback(granted)
            }
        }
    }

    companion object {
        private const val CAMERA_PERMISSION_CODE = 1001
    }
}
```

### iOS (Swift)

```swift
// camera/CameraQuickLauncher.swift
import UIKit
import AVFoundation
import Photos

class CameraQuickLauncher: NSObject {

    private var continuation: CheckedContinuation<String?, Never>?
    private var imagePickerController: UIImagePickerController?

    func openCamera() async -> String? {
        // Check camera permission
        let cameraAuthStatus = AVCaptureDevice.authorizationStatus(for: .video)

        switch cameraAuthStatus {
        case .authorized:
            return await presentCamera()

        case .notDetermined:
            let granted = await AVCaptureDevice.requestAccess(for: .video)
            if granted {
                return await presentCamera()
            } else {
                return nil
            }

        case .denied, .restricted:
            return nil

        @unknown default:
            return nil
        }
    }

    private func presentCamera() async -> String? {
        await withCheckedContinuation { continuation in
            self.continuation = continuation

            let picker = UIImagePickerController()
            picker.sourceType = .camera
            picker.cameraDevice = .rear
            picker.allowsEditing = false

            // For quality, set the videoQuality (affects image quality)
            // UIImagePickerController doesn't expose quality setting directly
            // but defaults to high quality

            picker.delegate = self

            // Present from top view controller
            guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
                  let rootViewController = windowScene.windows.first?.rootViewController else {
                continuation.resume(returning: nil)
                return
            }

            rootViewController.present(picker, animated: true)

            self.imagePickerController = picker
        }
    }
}

extension CameraQuickLauncher: UIImagePickerControllerDelegate, UINavigationControllerDelegate {

    func imagePickerController(
        _ picker: UIImagePickerController,
        didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]
    ) {
        picker.dismiss(animated: true)

        guard let imageURL = info[.imageURL] as? URL else {
            continuation?.resume(returning: nil)
            continuation = nil
            return
        }

        continuation?.resume(returning: imageURL.absoluteString)
        continuation = nil
    }

    func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
        picker.dismiss(animated: true)

        continuation?.resume(returning: nil)
        continuation = nil
    }
}
```

---

## PARITY CONTRACT

### Behavioral Invariants
1. **Permission Check**: MUST request camera permissions before launch
2. **Quality**: MUST use high quality (0.9 equivalent)
3. **No Editing**: MUST disable editing/cropping
4. **Return Value**: Returns image URI string on success, null/undefined on denial
5. **Error Handling**: Returns null if camera not available or denied

### Edge Cases
- Permission denied → return null
- Camera not available → return null
- User cancels → return null
- Photo taken successfully → return URI string

### Android Specifics
- Permission: `android.Manifest.permission.CAMERA`
- Intent: `MediaStore.ACTION_IMAGE_CAPTURE`
- ActivityResultLauncher for result handling

### iOS Specifics
- Permission: `AVCaptureDevice.authorizationStatus(for: .video)`
- Class: `UIImagePickerController`
- Delegate: `UIImagePickerControllerDelegate`

---

## DEPENDENCIES

### Translation Order
- No dependencies on other business logic files
- Can be translated independently

### Integration Points
- Used by profile photo upload components
- Used by route photo capture features
- UI components for camera button

### Test Porting
- Port tests from `lib/__tests__/camera-quick.test.ts` (if exists) to platform tests
- Test permission flow
- Test camera launch
- Test result handling
