# VoiceAssistantOverlay - Organism Matrix

**Component Source:** `react-native/components/assistant/voice-assistant-overlay.tsx`

**Atomic Level:** Organism

**Domain:** Voice Assistant / AI

---

## COMPOSITION ANALYSIS

### Child Components
- **External Dependencies:**
  - `react-native-paper` (Text, View)
- **Composition Pattern:**
  - Minimal placeholder overlay
  - Status display (idle/recording)
  - Transcript display (if available)
  - Dismiss button

### Layout Structure
```
VoiceAssistantOverlay (placeholder)
└── View (conditional - isOpen)
    ├── Status Text ("Assistant (idle/recording)")
    ├── Transcript Text (conditional)
    └── Dismiss Button (conditional)
```

---

## STATE & BEHAVIOR

### Props Interface
```typescript
type VoiceAssistantOverlayProps = {
  isOpen?: boolean
  state: {
    status: 'idle' | 'recording'
    transcript?: string
  }
  isCameraOpen?: boolean
  onOpenCamera?: () => void
  onCloseCamera?: () => void
  onCapturePhoto?: () => void
  onSubmit?: () => void
  onSaveDraft?: () => void
  onDiscard?: () => void
  onDismiss?: () => void
}
```

### State Management
- **Props-Driven:**
  - All state passed via props
  - No internal state
- **Display Logic:**
  - Returns `null` if `isOpen === false`
  - Shows status based on `state.status`
  - Shows transcript if available

### User Interactions
- **Dismiss:**
  - Fires `onDismiss()` callback
  - Closes overlay

### Planned Features (Not Implemented)
- Camera integration (`isCameraOpen`, `onOpenCamera`, `onCloseCamera`)
- Photo capture (`onCapturePhoto`)
- Submit/draft/discard actions (`onSubmit`, `onSaveDraft`, `onDiscard`)

---

## TRANSLATION SOURCES

### React Native → Kotlin/Compose

**Overlay:**
- RN: Conditional rendering (`if (!isOpen) return null`)
- Kotlin: `if (isOpen) { ... }` block

**Status Display:**
- RN: `Text` variant styling
- Kotlin: `Text` with `MaterialTheme.typography`

**Transcript Display:**
- RN: Conditional rendering in JSX
- Kotlin: Conditional Composable (`if (transcript != null)`)

### React Native → Swift/SwiftUI

**Overlay:**
- RN: Conditional rendering (`if (!isOpen) return null`)
- Swift: `.sheet(isPresented:)` or conditional view

**Status Display:**
- RN: `Text` variant styling
- Swift: `Text` with `.font()` modifier

**Transcript Display:**
- RN: Conditional rendering in JSX
- Swift: `if let transcript = transcript { ... }`

---

## STYLE PROPERTIES MATRIX

| Property | RN Value | Kotlin Token | Swift Token | Platform Fallback |
|----------|----------|--------------|-------------|-------------------|
| **Container Padding** | `semantic.space.md` | `12.dp` | `12` | 12pt |
| **Background Color** | `semantic.color.surfaceVariant.default` | `MaterialTheme.colorScheme.surfaceVariant` | `.thickMaterial` | #2B2E33 |
| **Border Radius** | `semantic.radius.md` | `8.dp` | `8` | 8pt |
| **Title Color** | `semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurface` | `.primary` | #F3F4F6 |
| **Body Color** | `semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurface` | `.primary` | #F3F4F6 |
| **Muted Text Color** | `semantic.color.onSurface.muted` | `MaterialTheme.colorScheme.onSurfaceVariant` | `.secondary` | #9CA3AF |
| **Dismiss Button Color** | `semantic.color.primary.default` | `MaterialTheme.colorScheme.primary` | `.primary` | #B87333 |

### Platform-Specific Adjustments

**Android:**
- Use `Card` or `Surface` for overlay container
- Use `MaterialTheme.colorScheme.surfaceVariant` for background
- Use `AlertDialog` or `BottomSheet` for full implementation

**iOS:**
- Use `.background(.regularMaterial)` for glassmorphism
- Use `.cornerRadius()` for rounded corners
- Use `.sheet()` or `.fullScreenCover()` for full implementation

---

## NOTES

### Zero ESCALATE Tokens
- ✅ No platform-specific APIs requiring escalation
- ⚠️ **Placeholder Only:** This is a minimal placeholder, not the full implementation
- ⚠️ **Future Work:** Full voice assistant requires:
  - Speech recognition (iOS Speech Framework, Android SpeechRecognizer)
  - Camera integration (AVFoundation, CameraX)
  - AI model integration (on-device LLM)
  - Recording state management

### Implementation Considerations

**Current Placeholder (Kotlin):**
```kotlin
@Composable
fun VoiceAssistantOverlay(
  isOpen: Boolean = false,
  state: AssistantState,
  onDismiss: () -> Unit = {}
) {
  if (!isOpen) return

  Card(
    modifier = Modifier.padding(12.dp),
    colors = CardDefaults.cardColors(
      containerColor = MaterialTheme.colorScheme.surfaceVariant
    ),
    shape = RoundedCornerShape(8.dp)
  ) {
    Column(modifier = Modifier.padding(12.dp)) {
      Text(
        text = "Assistant (${state.status})",
        style = MaterialTheme.typography.titleMedium,
        color = MaterialTheme.colorScheme.onSurface
      )

      if (state.transcript != null) {
        Text(
          text = state.transcript,
          style = MaterialTheme.typography.bodyMedium,
          color = MaterialTheme.colorScheme.onSurface
        )
      } else {
        Text(
          text = "Listening...",
          style = MaterialTheme.typography.bodyMedium,
          color = MaterialTheme.colorScheme.onSurfaceVariant
        )
      }

      if (onDismiss != null) {
        Text(
          text = "Dismiss",
          style = MaterialTheme.typography.labelSmall,
          color = MaterialTheme.colorScheme.primary,
          modifier = Modifier
            .clickable { onDismiss() }
            .padding(vertical = 4.dp)
        )
      }
    }
  }
}

data class AssistantState(
  val status: Status,
  val transcript: String? = null
) {
  enum class Status { IDLE, RECORDING }
}
```

**Current Placeholder (Swift):**
```swift
struct VoiceAssistantOverlay: View {
  var isOpen = false
  var state: AssistantState
  var onDismiss: () -> Void = {}

  var body: some View {
    if isOpen {
      VStack(alignment: .leading, spacing: 8) {
        Text("Assistant (\(state.status.rawValue))")
          .font(.titleMedium)
          .foregroundColor(.primary)

        if let transcript = state.transcript {
          Text(transcript)
            .font(.bodyMedium)
            .foregroundColor(.primary)
        } else {
          Text("Listening...")
            .font(.bodyMedium)
            .foregroundColor(.secondary)
        }

        if onDismiss != nil {
          Text("Dismiss")
            .font(.labelSmall)
            .foregroundColor(.primary)
            .onTapGesture {
              onDismiss()
            }
        }
      }
      .padding(12)
      .background(.thickMaterial)
      .cornerRadius(8)
    }
  }
}

struct AssistantState {
  enum Status: String { case idle, recording }
  let status: Status
  let transcript: String?
}
```

### Future Implementation (Full Voice Assistant)

**Speech Recognition:**

**Kotlin (Android):**
```kotlin
// Speech Recognition using SpeechRecognizer
val speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context)
val recognizerIntent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
  putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
  putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.US)
}

speechRecognizer.setRecognitionListener(object : RecognitionListener {
  override fun onResults(results: Bundle?) {
    val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
    // Update transcript
  }
  // ... other methods
})
```

**Swift (iOS):**
```swift
// Speech Recognition using Speech Framework
import Speech

let speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
let recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
let recognitionTask = speechRecognizer?.recognitionTask(with: recognitionRequest) { result, error in
  if let result = result {
    let transcript = result.bestTranscription.formattedString
    // Update transcript
  }
}
```

**Camera Integration:**

**Kotlin (Android):**
```kotlin
// Camera using CameraX
val cameraProvider = ProcessCameraProvider.getInstance(context)
val preview = Preview.Builder().build()
val imageCapture = ImageCapture.Builder().build()

cameraProvider.get().bindToLifecycle(
  lifecycleOwner,
  CameraSelector.DEFAULT_BACK_CAMERA,
  preview,
  imageCapture
)
```

**Swift (iOS):**
```swift
// Camera using AVFoundation
import AVFoundation

let captureSession = AVCaptureSession()
let captureDevice = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back)
let photoOutput = AVCapturePhotoOutput()

// Configure capture session
captureSession.addInput(try AVCaptureDeviceInput(device: captureDevice))
captureSession.addOutput(photoOutput)
captureSession.startRunning()
```

### Testing Notes (Placeholder)
- Test conditional rendering (isOpen true/false)
- Test status display (idle/recording)
- Test transcript display (with/without)
- Test dismiss callback
- Verify color contrast meets accessibility standards

### Testing Notes (Full Implementation - Future)
- Test speech recognition accuracy
- Test recording state transitions
- Test camera permission handling
- Test photo capture and preview
- Test transcript scrolling (long transcripts)
- Test error handling (microphone permission denied)
- Test with noise cancellation
- Verify accessibility (VoiceOver/TalkBack)

### Dependencies (Current)
- **Required:** None (placeholder only)

### Dependencies (Full Implementation - Future)
- **Required:** Speech Recognition framework
  - iOS: Speech Framework
  - Android: SpeechRecognizer
- **Required:** Camera framework
  - iOS: AVFoundation
  - Android: CameraX
- **Required:** Permissions
  - Microphone permission
  - Camera permission
- **Required:** On-device AI model (LLM)
- **Optional:** Noise cancellation library
- **Optional:** Haptic feedback

### Permissions

**Android (AndroidManifest.xml):**
```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.CAMERA" />
```

**iOS (Info.plist):**
```xml
<key>NSMicrophoneUsageDescription</key>
<string>Allow access to microphone for voice assistant</string>
<key>NSCameraUsageDescription</key>
<string>Allow access to camera for visual input</string>
```

### Privacy Considerations
- **On-device processing:** All speech recognition should be on-device (no cloud)
- **No data retention:** Transcripts should not be stored permanently
- **User control:** Clear indication of recording state
- **Permission handling:** Graceful degradation if permissions denied

### Performance Considerations
- Speech recognition should be optimized for low latency
- Camera preview should not block UI thread
- Transcript updates should be debounced (avoid excessive re-renders)
- Consider downsampling camera preview for performance

### Accessibility
- **Critical:** Screen reader announcement of recording state
- Visual indicator of recording (pulsing animation, red dot)
- Haptic feedback when recording starts/stops
- Keyboard alternative for voice input (for accessibility)

### Known Issues (Placeholder)
- No actual speech recognition
- No camera integration
- No AI model integration
- Minimal UI (placeholder only)
- Missing actions (submit, draft, discard, capture)

### Migration Path
1. **Phase 1:** Keep placeholder, add proper overlay styling
2. **Phase 2:** Add speech recognition (iOS Speech, Android SpeechRecognizer)
3. **Phase 3:** Add transcript display with scrolling
4. **Phase 4:** Add camera integration (photo capture)
5. **Phase 5:** Add AI model integration (on-device LLM)
6. **Phase 6:** Add actions (submit, draft, discard)
7. **Phase 7:** Add visual polish (animations, glassmorphism)
