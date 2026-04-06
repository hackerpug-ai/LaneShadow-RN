---
stability: FEATURE_SPEC
last_validated: 2026-04-06
prd_version: 1.0.0
functional_group: VC
---

# UC-VC: Voice Commands & STT

---

## UC-VC-01: Trigger voice input with helmet Bluetooth button

**Description**: The Rider presses their helmet Bluetooth button to activate voice input. The System plays a short activation chime via Bluetooth audio to confirm it is listening, opens the microphone for up to 5 seconds, and plays an end chime when recording stops. This works fully offline.

**Acceptance Criteria**:
- ☐ Rider can press a paired Bluetooth HID button to activate voice input
- ☐ System plays a low-tone activation chime (100ms) immediately on button press to confirm listening
- ☐ System records audio for up to 5 seconds or until silence is detected
- ☐ System plays a higher-tone end chime (100ms) when recording stops
- ☐ System transcribes audio on-device via Whisper Tiny EN (no network request)
- ☐ System completes full pipeline (button press to first audio response) within 2.5 seconds
- ☐ Rider can cancel mid-recording by pressing the button again (plays cancel chime, no transcription)

---

## UC-VC-02: Activate voice input from chat input bar (pre-ride)

**Description**: When the Rider is stationary (pre-ride or post-ride), they can tap the microphone button in the chat input bar to speak instead of typing. The transcription populates the text field for review and editing before sending.

**Acceptance Criteria**:
- ☐ Rider can see a microphone button in the chat input bar between the text field and Send button
- ☐ Rider can tap the microphone button to activate listening mode with waveform animation
- ☐ System transcribes speech on-device and populates the text field with the transcription
- ☐ Rider can review and edit the transcription before tapping Send
- ☐ Rider can tap the microphone again to append more speech to the text field
- ☐ System shows an on-device processing badge during transcription to confirm local processing
- ☐ Rider can tap Cancel to discard the recording and return to the empty text field

---

## UC-VC-03: Speed-aware mode switching

**Description**: The System automatically switches voice behavior based on the Rider's motion state. When stationary, voice transcription populates the text field for review. When moving, voice triggers direct audio response mode — no text field interaction, answer spoken immediately.

**Acceptance Criteria**:
- ☐ System detects motion state using device motion APIs (accelerometer/GPS speed)
- ☐ System switches to mid-ride audio-only mode when speed exceeds 5 mph
- ☐ System switches to pre/post-ride text-field mode when speed is 0 mph
- ☐ System does not require Rider action to switch modes — transition is automatic and silent
- ☐ System never presents text-field UI during mid-ride mode (audio response only)

---

## UC-VC-04: Receive audio response via TTS during ride

**Description**: After processing a voice command during a ride, the System speaks the response via TTS through the Rider's Bluetooth helmet audio. Responses are concise and optimized for comprehension at speed.

**Acceptance Criteria**:
- ☐ System speaks responses using system TTS (iOS AVSpeechSynthesizer / Android TextToSpeech)
- ☐ System limits navigation responses to 8 words maximum (e.g., "Shell, 8 miles ahead on your right")
- ☐ System limits information responses to 15 words maximum
- ☐ System uses no filler words, no apologetic tone, no assistant personality
- ☐ System speaks at 15% slower than default TTS rate for wind-noise comprehension
- ☐ System uses mid-frequency voice range (200-3000 Hz) for optimal helmet speaker reproduction

---

## UC-VC-05: Log hazard with voice (chime-only confirmation)

**Description**: The Rider reports a road hazard by voice during a ride. The System confirms with a chime only — no spoken response — because the Rider needs to focus on the road.

**Acceptance Criteria**:
- ☐ Rider can say "gravel on road", "pothole", "debris in lane", "accident ahead", or similar hazard phrases
- ☐ System plays a double-beep confirm chime (200ms) to acknowledge the hazard was logged
- ☐ System does NOT speak a verbal response for hazard logging — chime only
- ☐ System stores the hazard with type, GPS coordinates, and timestamp in the local hazard database
- ☐ System shows a brief visual overlay ("Gravel logged at this location") that auto-dismisses after 3 seconds

---

## UC-VC-06: Handle voice errors during ride

**Description**: When voice input fails — noise too high, command not recognized, data unavailable offline — the System communicates the error via audio with minimal distraction.

**Acceptance Criteria**:
- ☐ System plays a descending two-tone error chime and says "Didn't catch that" when speech cannot be parsed
- ☐ System plays an error chime and says "Not available without signal" when the query requires online data
- ☐ System plays only a soft end chime (no speech) when the microphone times out with no speech detected
- ☐ System plays a low tone and says "Battery" when battery is below 10% and voice is activated
- ☐ System never speaks error messages longer than 5 words during mid-ride mode

---

## UC-VC-07: Display voice interaction on screen (glanceable)

**Description**: Even when the Rider cannot interact with the screen during a ride, the screen displays the voice command and response for passengers and glanceable moments at traffic lights.

**Acceptance Criteria**:
- ☐ System displays a compact overlay showing the transcribed command and the response on the map
- ☐ System auto-dismisses the overlay after 5 seconds (consistent with V1 overlay behavior)
- ☐ System displays hazard logs as a brief warning overlay that auto-dismisses after 3 seconds
- ☐ System shows a listening indicator overlay when the microphone is active
- ☐ Rider can view the full history of voice commands in the expanded chat view (same as V1 chat history)
