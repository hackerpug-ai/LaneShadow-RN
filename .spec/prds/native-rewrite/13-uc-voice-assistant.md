---
stability: FEATURE_SPEC
last_validated: 2026-04-16
prd_version: 1.0.0
functional_group: VOICE
---

# Use Cases: Voice Assistant

## Overview

The voice assistant enables hands-free operation for motorcycle riders, allowing them to plan rides, control navigation, and manage route preferences through spoken commands. This system must handle motorcycle-specific challenges including wind noise, helmet audio integration, and intermittent connectivity.

## Platform-Specific APIs

| Platform | Speech Recognition | Text-to-Speech | Audio Management |
|----------|-------------------|----------------|------------------|
| **Android** | `SpeechRecognizer` + `RecognitionService` | `TextToSpeech` + `UtteranceProgressListener` | `AudioManager` (AudioFocus, STREAM_MUSIC), `MediaSession` |
| **iOS** | `SFSpeechRecognizer` + `SFSpeechRecognitionTask` | `AVSpeechSynthesizer` + `AVSpeechUtterance` | `AVAudioSession` (category: playAndRecord), `MPNowPlayingInfoCenter` |

---

## UC-VOICE-01: Activate Voice Assistant

**Description**: User activates the voice assistant via wake word ("Hey LaneShadow") or manual tap, triggering microphone permission check and audio session setup.

**UI Components (from Sprint 2):**
- `VoiceAssistantOverlay` (organism) — primary listening/idle surface shown when the assistant activates
- `FAB` (atom) — microphone trigger button for manual activation
- `IconSymbol` (atom) — microphone glyph inside the FAB and overlay
- `PermissionNotification` (molecule) — pre-permission rationale and request prompt
- `Banner` (molecule) — inline status feedback ("Listening…") when overlay is not appropriate
- `InfoToast` (molecule) — transient activation confirmation cue

**New Compositions Needed:** None

### Preconditions
- App is in foreground or backgrounded
- Device has microphone hardware
- Bluetooth audio (helmet headset) may be connected

### Main Flow
1. User speaks wake word OR taps microphone button
2. System checks microphone permission status
3. If permission denied → Show permission request dialog
4. If permission granted → Configure audio session for voice input/output
5. Start speech recognition engine
6. Play activation sound/visual indicator
7. Begin listening for command

### Acceptance Criteria

#### Android
```gherkin
Given user has not granted microphone permission
When user taps microphone button
Then system displays RECORD_AUDIO permission dialog
And when user grants permission
Then AudioSession is configured with mode MODE_IN_COMMUNICATION
And SpeechRecognizer is initialized
And activation sound plays through STREAM_MUSIC

Given user has granted microphone permission
When user speaks wake word "Hey LaneShadow"
Then system activates SpeechRecognizer via KeywordRecognizer
And audio focus is requested with AUDIOFOCUS_GAIN_TRANSIENT
And visual indicator shows "Listening..." state
```

#### iOS
```gherkin
Given user has not authorized Speech framework
When user taps microphone button
Then system requests SFSpeechRecognizerAuthorizationStatus authorization
And when user authorizes
Then AVAudioSession is configured with category: .playAndRecord
And categoryOptions: [.allowBluetooth, .allowBluetoothA2DP]
And mode: .voiceChat
And SFSpeechRecognizer is initialized

Given user has authorized Speech framework
When user speaks wake word "Hey LaneShadow"
Then system activates SFSpeechRecognitionTask
And AVAudioSession.setActive(true) is called
And visual indicator shows "Listening..." state
```

### Technical Notes
- **Wake word detection**: Android uses `KeywordRecognizer` (always-on keyword spotting). iOS requires manual trigger or third-party library (iOS SFSpeechRecognizer doesn't support always-on keyword detection).
- **Permission handling**: Both platforms must show permission rationale before requesting (Android `shouldShowRequestPermissionRationale`, iOS custom pre-alert).
- **Audio session conflicts**: Must handle phone calls, navigation audio, music playback gracefully via AudioFocus (Android) or AVAudioSession (iOS).

---

## UC-VOICE-02: Voice Command Recognition

**Description**: System converts speech to text, parses command structure, and classifies intent (plan ride, navigate, control ride, settings).

**UI Components (from Sprint 2):**
- `VoiceAssistantOverlay` (organism) — hosts the live transcript surface
- `IconSymbol` (atom) — waveform/mic indicator inside the overlay
- `TypingIndicator` (atom) — animated pulse while awaiting finalization
- `ChatTranscript` (organism) — render partial and final transcription turns
- `MarkdownText` (molecule) — display transcribed text with inline formatting
- `ErrorMessage` (molecule) — surfaces recognizer errors (no match, busy)
- `Progress` (atom) — intent classification inflight indicator

**New Compositions Needed:**
- `VoiceListeningVisualizer` (proposed atom) — real-time audio-level waveform/orb visualization; existing atoms (Progress, TypingIndicator) cannot express continuous mic amplitude, and `VoiceAssistantOverlay` treats it as an opaque child

### Preconditions
- Voice assistant is active and listening
- Microphone permission is granted
- Audio session is configured

### Main Flow
1. Capture speech audio from microphone
2. Stream audio to speech recognition engine
3. Receive real-time transcription results
4. Apply motorcycle-specific noise filtering
5. Parse command using intent classifier
6. Extract entities (location name, route name, action)
7. Return structured command to ride flow state machine

### Acceptance Criteria

#### Android
```gherkin
Given SpeechRecognizer is listening
When user speaks "find me a curvy route near Malibu"
Then SpeechRecognizer.onResults() receives transcription
And transcription is passed to intent classifier
And intent classifier returns PLAN_RIDE with entities:
  - location: "Malibu"
  - routePreference: "curvy"
And command is dispatched to ride flow via useRideFlow()

Given SpeechRecognizer encounters partial results
When user is still speaking
Then partial transcription is displayed in UI
And final transcription replaces partial when speech ends
```

#### iOS
```gherkin
Given SFSpeechRecognitionTask is running
When user speaks "find me a curvy route near Malibu"
Then SFSpeechRecognitionTask receives transcription in resultHandler
And transcription.isFinal == true
And transcription is passed to intent classifier
And intent classifier returns PLAN_RIDE with entities:
  - location: "Malibu"
  - routePreference: "curvy"
And command is dispatched to ride flow via useRideFlow()

Given SFSpeechRecognitionTask encounters partial results
When user is still speaking
Then partial transcription is displayed in UI
And final transcription replaces partial when speech ends
```

### Technical Notes
- **Real-time transcription**: Both platforms support partial results for visual feedback.
- **Intent classification**: Use Convex function `voice:parseIntent` with LLM for natural language understanding.
- **Error handling**: Handle `SpeechRecognizer.ERROR_NO_MATCH`, `ERROR_RECOGNIZER_BUSY` (Android) and `SFSpeechRecognitionError` (iOS).

---

## UC-VOICE-03: TTS Response Playback

**Description**: System converts assistant response text to speech and plays audio through helmet headset, managing audio focus and music ducking.

**UI Components (from Sprint 2):**
- `VoiceAssistantOverlay` (organism) — shows "speaking" state while TTS plays
- `IconSymbol` (atom) — speaker/waveform glyph for playback state
- `MarkdownText` (molecule) — displays assistant response text alongside TTS
- `Progress` (atom) — indeterminate progress while utterance streams
- `Banner` (molecule) — audio-focus ducking notice when background audio is affected
- `InfoToast` (molecule) — completion/return-to-idle cue

**New Compositions Needed:** None

### Preconditions
- Voice command was recognized and processed
- Response text is ready for playback
- Audio output device is available (phone speaker, Bluetooth, wired headset)

### Main Flow
1. Receive response text from backend
2. Initialize TextToSpeech engine
3. Configure voice settings (language, rate, pitch)
4. Request audio focus for TTS playback
5. Duck or pause background music/nav audio
6. Speak utterance
7. Monitor playback progress
8. On completion, restore audio focus and background audio

### Acceptance Criteria

#### Android
```gherkin
Given TextToSpeech engine is initialized
When assistant response "Found 3 curvy routes near Malibu" is ready
Then TextToSpeech.speak() is called with utterance
And AudioManager.requestAudioFocus() with AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK
And background music volume is reduced by 50%
And utterance plays through STREAM_MUSIC

Given TextToSpeech utterance completes
When onDone() callback fires
Then AudioManager.abandonAudioFocus() is called
And background music volume is restored to previous level
And voice assistant returns to idle state
```

#### iOS
```gherkin
Given AVSpeechSynthesizer is initialized
When assistant response "Found 3 curvy routes near Malibu" is ready
Then AVSpeechUtterance is created with response text
And utterance.voice = AVSpeechSynthesisVoice(language: "en-US")
And utterance.rate = 0.5 (slower for helmet audio clarity)
And AVSpeechSynthesizer.speak(utterance) is called
And AVAudioSession.setActive(true) with category: .playAndRecord

Given AVSpeechUtterance playback completes
When AVSpeechSynthesizerDelegate speechSynthesizer(didFinish:) fires
Then AVAudioSession.setActive(false) is called
And background audio (Music/Maps) resumes playback
And voice assistant returns to idle state
```

### Technical Notes
- **Music ducking**: Android supports transient audio focus with ducking. iOS requires manual volume adjustment via MPVolumeView or MPMusicPlayerController.
- **TTS voice selection**: Use offline voice bundles for reliability (no network required). Android: `setVoice()`, iOS: `AVSpeechSynthesisVoice`.
- **Playback priority**: TTS should interrupt but not permanently pause navigation instructions.

---

## UC-VOICE-04: Voice Command: Plan a Ride

**Description**: User plans a ride by voice command, specifying location and route preferences ("find me a curvy route near [city]").

**UI Components (from Sprint 2):**
- `VoiceAssistantOverlay` (organism) — active listening/speaking surface during planning
- `PlanningCard` (molecule) — in-chat planning status with progress
- `PlanningBottomSheet` (organism) — expanded planning detail while routes compute
- `PlanningLoading` (molecule) — "Planning routes near Malibu…" loading state
- `PlanningProgressIndicator` (molecule) — step progress for the plan pipeline
- `RouteOptionsSheet` (organism) — presents the returned route options
- `RouteOptionCard` (molecule) — per-route result card inside the options sheet
- `PlanningErrorSheet` (molecule) — surfaces failures (ambiguous location, network)
- `IconSymbol` (atom) — shared iconography

**New Compositions Needed:** None

### Preconditions
- Voice assistant is active
- User has authenticated
- Network connectivity is available (for AI planning)

### Main Flow
1. User speaks: "find me a curvy route near Malibu"
2. Speech recognition transcribes command
3. Intent classifier extracts:
   - Intent: `PLAN_RIDE`
   - Location entity: "Malibu"
   - Route preference: "curvy"
4. System dispatches `PLAN_RIDE` action to ride flow
5. Ride flow calls Convex `routes:planAI` mutation
6. Loading indicator shows during planning
7. On success, TTS announces: "Found 3 routes. Route 1 is 45 miles with high curvature."
8. Route results screen displays

### Acceptance Criteria

#### Android
```gherkin
Given voice assistant is listening
When user speaks "find me a curvy route near Malibu"
Then intent classifier returns:
  - intent: "PLAN_RIDE"
  - location: "Malibu"
  - preference: "curvy"
And dispatch({ type: 'PLAN_RIDE', location: 'Malibu', preference: 'curvy' })
And loading UI shows "Planning routes near Malibu..."
And when routes:planAI completes
Then TTS speaks "Found 3 routes near Malibu"
And route results screen displays 3 route cards
```

#### iOS
```gherkin
Given voice assistant is listening
When user speaks "find me a curvy route near Malibu"
Then intent classifier returns:
  - intent: "PLAN_RIDE"
  - location: "Malibu"
  - preference: "curvy"
And dispatch({ type: 'PLAN_RIDE', location: 'Malibu', preference: 'curvy' })
And loading UI shows "Planning routes near Malibu..."
And when routes:planAI completes
Then TTS speaks "Found 3 routes near Malibu"
And route results screen displays 3 route cards
```

### Technical Notes
- **Entity extraction**: Use Convex `voice:parseIntent` action with LLM for robust entity extraction.
- **Ambiguous locations**: If multiple "Malibu" locations exist, TTS asks: "Did you mean Malibu, California or Malibu, Florida?"
- **Offline fallback**: If no network, prompt user to type location manually.

---

## UC-VOICE-05: Voice Command: Navigate

**Description**: User starts navigation to a saved route by voice ("navigate to saved route [name]").

**UI Components (from Sprint 2):**
- `VoiceAssistantOverlay` (organism) — active voice context during navigation invocation
- `SavedRouteCard` (molecule) — render disambiguation candidates when multiple matches
- `BottomActionSheet` (template) — disambiguation picker listing matches
- `RouteDetailsSheet` (organism) — summary of the selected saved route before launch
- `MapViewWrapper` (organism) — map surface that animates to route start
- `RoutePolyline` (atom) — draw the saved route geometry on the map
- `EmptyState` (molecule) — "Route not found" fallback UI
- `IconSymbol` (atom) — shared iconography

**New Compositions Needed:** None

### Preconditions
- User has saved routes in their library
- Voice assistant is active

### Main Flow
1. User speaks: "navigate to saved route Pacific Coast Highway"
2. Speech recognition transcribes command
3. Intent classifier extracts:
   - Intent: `NAVIGATE`
   - Route name entity: "Pacific Coast Highway"
4. System queries Convex `routes:getSavedByName` query
5. If route found → Start navigation
6. If multiple matches → TTS lists options: "Found 2 routes. Pacific Coast Highway North or Pacific Coast Highway South?"
7. If not found → TTS: "Route not found. Please try again."

### Acceptance Criteria

#### Android
```gherkin
Given user has 3 saved routes
When user speaks "navigate to saved route Pacific Coast Highway"
Then intent classifier returns:
  - intent: "NAVIGATE"
  - routeName: "Pacific Coast Highway"
And routes:getSavedByName is queried with name: "Pacific Coast Highway"
And when single route is found
Then TTS speaks "Starting navigation to Pacific Coast Highway"
And navigation mode activates
And map camera animates to route start

Given user has 2 routes with similar names
When user speaks "navigate to saved route PCH"
Then routes:getSavedByName returns 2 results
And TTS speaks "Found 2 routes. PCH North or PCH South?"
And system waits for user clarification
```

#### iOS
```gherkin
Given user has 3 saved routes
When user speaks "navigate to saved route Pacific Coast Highway"
Then intent classifier returns:
  - intent: "NAVIGATE"
  - routeName: "Pacific Coast Highway"
And routes:getSavedByName is queried with name: "Pacific Coast Highway"
And when single route is found
Then TTS speaks "Starting navigation to Pacific Coast Highway"
And navigation mode activates
And map camera animates to route start

Given user has 2 routes with similar names
When user speaks "navigate to saved route PCH"
Then routes:getSavedByName returns 2 results
And TTS speaks "Found 2 routes. PCH North or PCH South?"
And system waits for user clarification
```

### Technical Notes
- **Fuzzy matching**: Route name search should be case-insensitive and support abbreviations (PCH → Pacific Coast Highway).
- **Disambiguation**: Use voice follow-up or show list in UI if multiple matches exist.

---

## UC-VOICE-06: Voice Command: Control Ride

**Description**: User controls active ride state via voice ("pause ride", "end ride", "resume").

**UI Components (from Sprint 2):**
- `VoiceAssistantOverlay` (organism) — listening context during ride control
- `MapViewWrapper` (organism) — underlying active-ride map surface
- `MapHeaderOverlay` (molecule) — shows updated ride state (paused/active)
- `OverlayPill` (molecule) — compact "Ride paused" / "Ride resumed" indicator
- `SuccessToast` (molecule) — confirmation feedback for control actions
- `InfoToast` (molecule) — state-transition messaging
- `IconSymbol` (atom) — shared iconography for pause/play/stop glyphs

**New Compositions Needed:** None

### Preconditions
- Ride is currently active (navigation or tracking mode)
- Voice assistant is available

### Main Flow
1. User speaks: "pause ride"
2. Speech recognition transcribes command
3. Intent classifier extracts:
   - Intent: `CONTROL_RIDE`
   - Action entity: "pause" / "end" / "resume"
4. System dispatches corresponding action to ride flow
5. Ride flow transitions to new state
6. TTS confirms action

### Acceptance Criteria

#### Android
```gherkin
Given ride is in ACTIVE_TRACKING state
When user speaks "pause ride"
Then intent classifier returns:
  - intent: "CONTROL_RIDE"
  - action: "pause"
And dispatch({ type: 'PAUSE_RIDE' })
And ride flow transitions to PAUSED state
And TTS speaks "Ride paused"
And location tracking stops

Given ride is in PAUSED state
When user speaks "resume ride"
Then intent classifier returns:
  - intent: "CONTROL_RIDE"
  - action: "resume"
And dispatch({ type: 'RESUME_RIDE' })
And ride flow transitions to ACTIVE_TRACKING state
And TTS speaks "Ride resumed"
And location tracking resumes

Given ride is in ACTIVE_TRACKING state
When user speaks "end ride"
Then intent classifier returns:
  - intent: "CONTROL_RIDE"
  - action: "end"
And dispatch({ type: 'END_RIDE' })
And ride flow transitions to SUMMARY state
And TTS speaks "Ride ended. Great ride!"
And ride summary screen displays
```

#### iOS
```gherkin
Given ride is in ACTIVE_TRACKING state
When user speaks "pause ride"
Then intent classifier returns:
  - intent: "CONTROL_RIDE"
  - action: "pause"
And dispatch({ type: 'PAUSE_RIDE' })
And ride flow transitions to PAUSED state
And TTS speaks "Ride paused"
And location tracking stops

Given ride is in PAUSED state
When user speaks "resume ride"
Then intent classifier returns:
  - intent: "CONTROL_RIDE"
  - action: "resume"
And dispatch({ type: 'RESUME_RIDE' })
And ride flow transitions to ACTIVE_TRACKING state
And TTS speaks "Ride resumed"
And location tracking resumes

Given ride is in ACTIVE_TRACKING state
When user speaks "end ride"
Then intent classifier returns:
  - intent: "CONTROL_RIDE"
  - action: "end"
And dispatch({ type: 'END_RIDE' })
And ride flow transitions to SUMMARY state
And TTS speaks "Ride ended. Great ride!"
And ride summary screen displays
```

### Technical Notes
- **State validation**: Commands should validate current ride state before executing (can't resume if not paused).
- **Confirmation TTS**: All control commands should speak confirmation for helmet audio feedback.

---

## UC-VOICE-07: Handle Motorcycle Noise

**Description**: System applies noise cancellation and audio gain adjustment to handle motorcycle wind noise and engine sounds at highway speeds.

**UI Components (from Sprint 2):**
- `VoiceAssistantOverlay` (organism) — communicates degraded-audio state to the rider
- `WarningToast` (molecule) — "Too much wind noise. Please repeat." prompt
- `Banner` (molecule) — persistent audio-quality advisory when SNR is low
- `Progress` (atom) — visualize signal level / noise floor
- `IconSymbol` (atom) — wind/mic iconography
- `ErrorMessage` (molecule) — inline failure when recognition aborts

**New Compositions Needed:**
- `AudioQualityMeter` (proposed molecule) — continuous SNR/gain visualization tuned for motorcycle noise; no existing atom exposes dual signal-vs-noise levels needed for rider glanceability

### Preconditions
- Voice assistant is active
- User is wearing helmet with integrated or paired Bluetooth headset
- Motorcycle may be moving at highway speeds (60-80 mph)

### Main Flow
1. Detect audio input quality via SNR (signal-to-noise ratio) analysis
2. Apply noise suppression filter tuned for motorcycle frequencies
3. Adjust microphone gain automatically based on noise floor
4. If audio quality is too poor → Prompt user to repeat command or pull over
5. Log noise metrics for adaptive filter tuning

### Acceptance Criteria

#### Android
```gherkin
Given motorcycle is traveling at 70 mph
When wind noise is detected in microphone input
Then AudioRecord applies noise suppression filter:
  - High-pass filter below 300 Hz (engine rumble)
  - Wind noise detection algorithm
And automatic gain control boosts voice frequencies
And if SNR < 10 dB
Then TTS speaks "Too much wind noise. Please repeat."
And speech recognition stops

Given motorcycle is stopped at traffic light
When user speaks command
Then noise floor is lower
And speech recognition accuracy improves
And command succeeds on first attempt
```

#### iOS
```gherkin
Given motorcycle is traveling at 70 mph
When wind noise is detected in microphone input
Then AVAudioRecorder applies noise suppression:
  - Configure AVAudioSession with mode: .voiceChat
  - Enable automatic gain control
And if SNR < 10 dB
Then TTS speaks "Too much wind noise. Please repeat."
And speech recognition stops

Given motorcycle is stopped at traffic light
When user speaks command
Then noise floor is lower
And speech recognition accuracy improves
And command succeeds on first attempt
```

### Technical Notes
- **Noise suppression APIs**: Android `AcousticEchoCanceler`, `NoiseSuppressor`. iOS `AVAudioSession` mode: `.voiceChat` includes some noise suppression.
- **Microphone placement**: Users with helmet-integrated microphones (chin bar) have better results than Bluetooth headset microphones.
- **Speed detection**: Use GPS speed to anticipate noise levels and adjust gain proactively.

---

## UC-VOICE-08: Permission Handling

**Description**: System requests microphone permission at first use and handles denial gracefully with clear user guidance.

**UI Components (from Sprint 2):**
- `PermissionNotification` (molecule) — pre-permission rationale card
- `BottomActionSheet` (template) — host for the pre-prompt dialog with Continue/Cancel
- `Button` (atom) — Continue / Open Settings / Cancel actions
- `IconSymbol` (atom) — microphone/lock glyph
- `EmptyState` (molecule) — post-denial guidance explaining feature gating
- `Banner` (molecule) — persistent "Microphone disabled" reminder when permanently denied
- `WarningToast` (molecule) — transient denial feedback

**New Compositions Needed:** None

### Preconditions
- User taps microphone button or speaks wake word for the first time
- Microphone permission has not been granted yet

### Main Flow
1. Detect that microphone permission is not granted
2. Display permission rationale explaining why it's needed
3. Request system permission dialog
4. If granted → Proceed with voice assistant activation
5. If denied → Show in-app settings with explanation
6. If permanently denied → Guide user to device settings

### Acceptance Criteria

#### Android
```gherkin
Given user has never granted microphone permission
When user taps microphone button
Then system displays pre-permission dialog:
  - Title: "Microphone Access Required"
  - Message: "LaneShadow needs microphone access for voice commands. You can control routes hands-free while riding."
  - Buttons: "Continue", "Cancel"
And when user taps "Continue"
Then system requests RECORD_AUDIO permission via ActivityCompat.requestPermissions()

Given user denies microphone permission
When permission request callback returns PERMISSION_DENIED
Then system displays post-denial dialog:
  - Title: "Microphone Access Denied"
  - Message: "Voice assistant features require microphone access. You can enable in Settings."
  - Buttons: "Open Settings", "Cancel"
And when user taps "Open Settings"
Then system opens app settings screen via Intent.ACTION_APPLICATION_DETAILS_SETTINGS

Given user previously denied with "Don't ask again"
When user taps microphone button
Then system skips permission request
And displays settings guidance directly
```

#### iOS
```gherkin
Given user has never authorized Speech framework
When user taps microphone button
Then system displays pre-permission alert:
  - Title: "Microphone Access Required"
  - Message: "LaneShadow needs microphone access for voice commands. You can control routes hands-free while riding."
  - Buttons: "Continue", "Cancel"
And when user taps "Continue"
Then system requests SFSpeechRecognizer.requestAuthorization()

Given user denies microphone permission
When authorization callback returns .denied
Then system displays post-denial alert:
  - Title: "Microphone Access Denied"
  - Message: "Voice assistant features require microphone access. You can enable in Settings."
  - Buttons: "Open Settings", "Cancel"
And when user taps "Open Settings"
Then system opens app settings via UIApplication.openSettingsURLString

Given user previously denied with "Don't Ask"
When user taps microphone button
Then system skips permission request
And displays settings guidance directly
```

### Technical Notes
- **Permission caching**: Store permission state in AsyncStorage/DataStore to avoid repeated prompts.
- **Feature gating**: Disable microphone button and voice commands if permission is permanently denied.
- **Compliance**: Include microphone usage in Privacy Policy and App Store description.

---

## Technical Architecture

### Android Components

```kotlin
// Voice assistant manager
class VoiceAssistantManager(
    private val context: Context,
    private val speechRecognizer: SpeechRecognizer,
    private val textToSpeech: TextToSpeech,
    private val audioManager: AudioManager
) {
    suspend fun activate(): Result<VoiceSession>
    suspend fun processCommand(transcript: String): IntentClassification
    suspend fun speakResponse(text: String): Result<Unit>
}

// Intent classifier (calls Convex)
class IntentClassifier(
    private val convex: ConvexClient
) {
    suspend fun classify(transcript: String): IntentClassification
}

// Audio session manager
class AudioSessionManager(
    private val audioManager: AudioManager
) {
    fun requestVoiceAssistantFocus(): AudioFocusRequest
    fun abandonVoiceAssistantFocus(request: AudioFocusRequest)
}
```

### iOS Components

```swift
// Voice assistant manager
class VoiceAssistantManager: ObservableObject {
    private let speechRecognizer: SFSpeechRecognizer
    private let speechSynthesizer: AVSpeechSynthesizer
    private let audioSession: AVAudioSession

    func activate() async throws -> VoiceSession
    func processCommand(transcript: String) async throws -> IntentClassification
    func speakResponse(_ text: String) async throws
}

// Intent classifier (calls Convex)
class IntentClassifier {
    private let convex: ConvexClient

    func classify(_ transcript: String) async throws -> IntentClassification
}

// Audio session manager
class AudioSessionManager {
    func configureVoiceAssistantSession() throws
    func requestPlaybackFocus() throws
    func abandonPlaybackFocus() throws
}
```

### Convex Integration

```typescript
// Convex functions for voice processing
// convex/voice.ts

export const parseIntent = action({
  args: { transcript: v.string() },
  handler: async (ctx, { transcript }) => {
    // LLM-based intent classification
    const result = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Classify voice commands for motorcycle ride app.
          Intents: PLAN_RIDE, NAVIGATE, CONTROL_RIDE, SETTINGS.
          Extract entities: location, routeName, action, preference.`
        },
        { role: "user", content: transcript }
      ]
    })

    return JSON.parse(result.choices[0].message.content)
  }
})
```

---

## Success Metrics

- ☐ Wake word activation succeeds within 500ms of spoken phrase
- ☐ Speech-to-text accuracy > 90% at 60 mph with helmet microphone
- ☐ Intent classification accuracy > 95% for supported commands
- ☐ TTS response latency < 1s from intent classification
- ☐ Permission grant rate > 80% after first-use prompt
- ☐ False activation rate < 5% per hour of riding

---

## Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| Android SpeechRecognizer | Built-in | Speech-to-text |
| Android TextToSpeech | Built-in | Text-to-speech |
| Android AudioManager | Built-in | Audio focus management |
| iOS SFSpeechRecognizer | iOS 13+ | Speech-to-text |
| iOS AVSpeechSynthesizer | iOS 13+ | Text-to-speech |
| iOS AVAudioSession | iOS 13+ | Audio session management |
| Convex | 0.8.0 | Intent classification via LLM |
| OpenAI API | Latest | Intent classification LLM |

---

## Future Enhancements

- **Offline mode**: Cache intent classification model on device for operation without cellular coverage
- **Custom wake words**: Allow users to set custom wake phrases
- **Voice profiles**: Train on user's voice for improved accuracy with helmet microphone
- **Multilingual support**: Support Spanish, French, German for international riders
- **Noise-adaptive filters**: Learn user's motorcycle noise profile for better suppression
