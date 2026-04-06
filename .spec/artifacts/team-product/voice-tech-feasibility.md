---
type: feasibility-assessment
status: DRAFT
author: engineering-manager
date: 2026-04-06
topic: Voice-First AI Ride Companion
version: 1.0
---

# Voice-First AI Ride Companion — Technical Feasibility Assessment

## Executive Summary

A voice-first ride companion for LaneShadow is **technically feasible** but requires deliberate phasing to manage the severe constraints of the motorcycle operating environment. The hardest problems are not software — they are physics: engine noise (80–100 dB), wind noise (60–90 dB at highway speed), and Bluetooth audio latency between phone and helmet. These constraints make a "talk to your phone" model largely unviable for active riding. The winning architecture for V1.1 is a **PTT (push-to-talk) model with cloud STT**, deferring always-on wake word to V2 after noise-robustness can be validated against real-world ride data.

**Recommended phasing:**

| Phase | Target | Primary Capability |
|-------|--------|-------------------|
| V1.1 | 3–4 weeks dev | PTT voice input on helmet button → cloud STT → existing pi core agent → TTS reply via Bluetooth |
| V2 | 8–12 weeks dev | Custom wake word (on-device), streaming STT, streaming TTS, motorcycle-tuned noise model |

---

## 1. Motorcycle Operating Environment — Constraints

### 1.1 Noise Profile

| Source | dB SPL | Frequency Range | Impact on STT |
|--------|--------|----------------|--------------|
| Engine (idle) | 80–85 dB | 50–500 Hz | Moderate — low-frequency rumble, partially filterable |
| Engine (highway) | 90–100 dB | 50–2000 Hz | High — harmonic distortion bleeds into speech band |
| Wind (60 mph) | 85–90 dB | 100–4000 Hz | Severe — fills speech band 300–3000 Hz directly |
| Wind (80 mph) | 95–100 dB | broad | Severe — turbulent noise, helmet-dependent |
| Tire/road noise | 70–80 dB | 200–2000 Hz | Moderate |

**Net result**: At highway speed, ambient noise in the speech-frequency band exceeds a typical voice command by 10–30 dB. Standard cloud STT (Google, Apple, Whisper) trained on clean speech degrades significantly above 80 dB noise.

### 1.2 Microphone Placement

Helmet microphones (boom mic or cheek pad) are **0–5 cm** from the rider's mouth, achieving 20–30 dB SNR advantage over handheld devices. This is the most impactful factor for accuracy. Systems like Cardo PACKTALK Bold and Sena 50S include DSP-based noise cancellation tuned specifically for helmet acoustics.

**Key finding**: Helmet mic quality is the single biggest variable. Apps that rely on the phone's built-in mic while the phone is in a tank bag or jacket pocket will not function reliably above 40 mph. All V1.1 voice design must assume a helmet Bluetooth system with a boom or cheek mic.

### 1.3 Bluetooth Helmet Systems — Relevant Products

| System | Wake Word Support | Audio Latency | Phone App Integration | Notes |
|--------|-----------------|---------------|-----------------------|-------|
| Cardo PACKTALK Bold | "Hey Cardo" (built-in, proprietary) | ~200ms A2DP | Via Cardo Connect app | No third-party STT API |
| Cardo PACKTALK Neo/Slim | Button-only activation | ~200ms A2DP | Limited | Budget tier |
| Sena 50S | "Hey Sena" (Mesh 2.0 built-in) | ~200ms A2DP | Via Sena companion app | Siri/Google Assistant forwarding |
| Sena 30K | Button activation | ~150–200ms A2DP | Yes | Older, no wake word |
| Generic A2DP Bluetooth helmet | Button activation | 200–400ms | Any app | Wide variability |

**Critical constraint**: Neither Cardo nor Sena exposes their on-device wake word engine via a third-party API. LaneShadow cannot invoke "Hey Cardo" programmatically. The practical integration path is:

1. **Rider presses a Bluetooth headset button** → headset sends media control event (AVRCP `PLAY` or `PAUSE`) to the paired phone → app receives the event and begins recording
2. **App plays TTS audio** → routed through A2DP → plays in helmet speakers

This button-triggered model is the only reliable integration path without custom firmware or manufacturer partnership.

---

## 2. STT (Speech-to-Text) Evaluation

### 2.1 Library Landscape for Expo/React Native

| Library | Platform | Approach | Noise Robustness | Expo Compatible | Maturity |
|---------|----------|----------|-----------------|-----------------|---------|
| `expo-speech-recognition` (jamsch) | iOS + Android + Web | Native OS STT (SFSpeechRecognizer / Android SpeechRecognizer) | Platform-dependent | Yes (custom dev build required) | High — actively maintained, Expo SDK 51+ |
| `@react-native-voice/voice` | iOS + Android | Native OS STT | Platform-dependent | Requires bare workflow or dev client | Medium — maintenance slowing in 2025 |
| `whisper.rn` | iOS + Android | On-device Whisper (GGML) | High if fine-tuned | Yes (custom dev build) | Medium — growing, ships as native module |
| OpenAI Whisper API (cloud) | Any | REST API / streaming | High (large-v3 model) | Yes (HTTP only) | High |
| Google Cloud STT | Any | REST / streaming gRPC | High (noise-robust models available) | Yes (HTTP) | High |
| ElevenLabs Scribe v2 | Any | REST API | Very high | Yes (HTTP) | Medium-High |

**Recommendation for V1.1**: `expo-speech-recognition` as the capture layer (for PTT microphone management and permission handling), streaming audio to **OpenAI Whisper API** (`whisper-1` model) or **ElevenLabs Scribe v2** for transcription. This combination:
- Does not require a bare workflow rebuild (just a custom dev client)
- Whisper is trained on noisy audio including vehicle environments
- Cloud fallback handles model updates without an app release
- Scribe v2 Realtime adds ~130ms TTFT (time-to-first-token) for streaming

**V2 consideration**: `whisper.rn` with a motorcycle-fine-tuned model loaded on-device. The `base.en` model (~142 MB) achieves ~15 WER on clean speech. On-device eliminates the network RTT penalty for STT but adds ~300–800ms processing on mid-range devices. A motorcycle-specific fine-tune would need a dataset of helmet-mic recordings — this is a meaningful research investment.

### 2.2 Accuracy Expectations by Environment

| Condition | Platform OS STT | Whisper API (large-v3) | On-device Whisper (base.en) |
|-----------|----------------|----------------------|---------------------------|
| Parked, quiet | 95%+ WER | 97%+ | 90%+ |
| Low speed (< 30 mph), engine on | 80–90% | 90–95% | 75–85% |
| Highway (60+ mph), generic Bluetooth | 40–60% | 60–75% | 35–55% |
| Highway, helmet boom mic + DSP | 70–85% | 85–92% | 65–80% |

**Implication**: Voice input designed for active highway riding is high-risk without a dedicated noise-canceling helmet system. V1.1 should be designed around parked or low-speed use cases first, with a clear rider disclosure that voice accuracy varies by environment.

---

## 3. TTS (Text-to-Speech) Evaluation

### 3.1 Library and API Options

| Option | Latency (TTFA) | Voice Quality | Bluetooth Routing | Expo Compatible |
|--------|---------------|---------------|-------------------|-----------------|
| `expo-speech` (on-device OS TTS) | <100ms | Robotic (iOS Siri voices better than Android) | Routes through active audio session | Yes — built-in |
| `react-native-tts` | <100ms | Platform voices | Routes through active audio session | Dev client required |
| `react-native-speech` (mhpdev) | <100ms | Platform voices | Yes | Dev client required |
| OpenAI TTS API (`tts-1`) | 300–600ms TTFA | High quality | Via audio player | Yes (HTTP) |
| ElevenLabs TTS (streaming) | 130–300ms TTFA | Very high quality, motorcycle-safe volume profiles | Via audio player | Yes (HTTP) |
| Picovoice Orca (on-device) | <50ms | Acceptable | Routes through active audio session | Dev client required |

**Recommendation for V1.1**: **`expo-speech` (on-device OS TTS)** for immediate short responses (route confirmation, error messages), with **OpenAI TTS `tts-1` streaming** for richer responses. On-device TTS has near-zero latency and routes correctly through Bluetooth without additional audio session management. The rider hears the response in their helmet speakers within 100ms of the app starting playback — the network call to OpenAI TTS adds 300–600ms before audio starts.

**Critical audio routing note**: On iOS, the app must set the `AVAudioSession` category to `playback` with `allowBluetooth` option to ensure audio routes to the helmet via A2DP, not through the phone speaker. `expo-speech-recognition` exposes `setCategoryIOS` for this. On Android, the audio stream must be set to `STREAM_VOICE_CALL` or `STREAM_MUSIC` to respect the Bluetooth SCO/A2DP routing. This requires testing on physical devices — simulators do not replicate Bluetooth audio routing behavior.

### 3.2 TTS Content Design for Motorcycle Context

Standard TTS responses designed for phone or desktop are inappropriate for active riding:

- **Length**: Maximum 2 sentences at speed. Riders cannot safely process multi-step instructions.
- **Format**: "Coastal Cruiser, 42 miles, clear skies. Two alternatives also saved." Not: "I found three route options for your coastal ride..."
- **Timing**: Never interrupt. TTS must not play when the rider is actively speaking or when the app detects high ambient noise (future V2 concern).
- **Volume**: Helmet speaker volume is fixed by hardware; the app should not assume volume level. Alert tone before speaking to cue the rider.

---

## 4. Wake Word / Always-Listening Architecture

### 4.1 Options

| Approach | Latency | Battery Impact | Privacy | Noise Robustness | Dev Effort |
|----------|---------|---------------|---------|-----------------|------------|
| Button-triggered PTT (Bluetooth AVRCP) | Near-zero | None | High | N/A | Low |
| Always-on on-device wake word (Porcupine) | <200ms | 2–5% CPU continuously | High — no audio leaves device | Low without custom model | Medium |
| Always-on cloud wake word | <500ms | High (constant upload) | Low — all audio sent | High | High |
| Siri/Google Assistant hand-off | 500–1500ms | Minimal | Platform-managed | High | Low (shortcut only) |

**Porcupine (Picovoice) Analysis**:
- `@picovoice/porcupine-react-native` ships as a custom dev client module — not compatible with Expo Go, requires a custom dev build.
- On-device, runs a tiny neural net (~1 MB) continuously sampling audio at 512-frame windows (~32ms).
- CPU overhead: 2–5% on modern iPhones/Androids, measured in controlled environments.
- **Motorcycle problem**: Porcupine's built-in wake words ("Hey Siri"-style) are trained on clean or mildly noisy audio. At 90 dB wind noise, false-positive rates increase dramatically — the wake word may trigger on engine harmonics or wind bursts. A custom motorcycle-tuned wake word model requires Picovoice's Porcupine Maker tooling and a paid account, plus a labeled noise dataset for training.
- Battery: 2–5% continuous CPU on top of GPS, LTE, and screen is acceptable but non-trivial. On a 3-hour ride, this translates to ~6–10% additional battery drain.

**Recommendation**: **Defer always-on wake word to V2.** V1.1 uses PTT via Bluetooth media button. This is safer (no accidental activation at speed), simpler to implement, and avoids the noise-robustness investment before real-world data exists.

### 4.2 PTT via Bluetooth AVRCP

When a Bluetooth headset button is pressed, iOS and Android deliver `AVRCP` media control events. The app can intercept these events:

- **iOS**: `MPRemoteCommandCenter` (`pauseCommand`, `playCommand`, `togglePlayPauseCommand`)
- **Android**: `ACTION_MEDIA_BUTTON` broadcast intent

This approach works with any Bluetooth headset — Cardo, Sena, generic — without firmware dependencies. The app registers as a media session, intercepts the button press, begins recording, and releases the media session when done.

**Risk**: Other media apps (Spotify, Apple Music) compete for AVRCP button events. The app must become the active media session. This is achievable but requires careful audio session management and testing across Android versions.

---

## 5. Latency Analysis — Real-Time Riding Context

### 5.1 Pipeline Breakdown (V1.1 PTT Model)

```
Button press (AVRCP event)
    → App receives event: ~50ms (iOS/Android event delivery)
    → Audio recording starts: ~100ms (microphone initialization)
    → Rider speaks command: variable (2–5 seconds)
    → Button release / VAD (voice activity detection) end: ~200ms silence detection
    → STT API call (Whisper API): 400–800ms
    → pi core agent inference (GPT-4o-mini): 1,500–3,000ms
    → TTS generation (on-device expo-speech): <100ms
    → Bluetooth A2DP audio playback begins: +200ms latency

TOTAL from button release to first audio: ~2,500–4,500ms
```

**Assessment**: This is acceptable for pre-ride or stopped planning. For active riding (route refinement while moving), 3–4 seconds of cognitive load is borderline — the rider's attention must return to the road before the response arrives.

### 5.2 Latency Targets by Use Case

| Use Case | Acceptable Latency | Current Estimate | Gap |
|----------|--------------------|-----------------|-----|
| Pre-ride: "Plan a coastal loop" | 5–8 seconds (full route gen) | 8–12s (existing) + 3–4s voice overhead | Marginal — parallelize |
| Active: "Avoid the highway" | < 4 seconds | 3–4s voice + 8–12s route | Severe — need streaming feedback |
| Quick command: "Save this route" | < 2 seconds | ~2.5s | Close — optimize STT path |
| Status query: "How much further?" | < 3 seconds | ~2.5s | Acceptable |

**Critical finding**: Route generation (8–12 seconds) is the bottleneck for active riding commands, not the voice pipeline itself. The voice layer adds 3–4 seconds to whatever the underlying agent takes. For "avoid the highway" mid-ride, the rider will wait 11–16 seconds total — this is too long for active riding and must be addressed before the voice feature is marketed as a riding-mode feature.

**Mitigation strategies**:
- Immediate TTS acknowledgment ("Got it — finding new routes") within 2 seconds of command receipt
- Streaming phase updates ("Recalculating...", "Found 2 options") via TTS as the backend progresses
- For quick commands (save, dismiss, confirm), bypass route generation entirely — handle purely at agent conversation layer in <2 seconds

---

## 6. Integration with Existing pi Core Agent and Convex Backend

### 6.1 Integration Surface

The existing V1 architecture already provides the key integration points voice needs:

| Existing Component | Voice Integration Point | Change Required |
|-------------------|------------------------|-----------------|
| `parseNaturalLanguageInput` action | Receives STT transcript instead of typed text | None — already accepts `text: string` |
| `session_messages` table | Voice messages stored with `role: 'rider'` | Add `inputMethod: 'voice' | 'text'` optional field |
| `pi core` agent session | Manages conversation context | None — voice is just another input modality |
| `PlanningPhase` enum (`reading | finding | weather | building`) | Drive TTS phase announcements | Map phases to TTS strings |
| Route generation pipeline | Returns routes same as text path | None |

**Assessment**: The backend requires zero architectural changes for V1.1. Voice is a new input/output modality layered on top of the existing text-based pipeline. The Convex schema changes needed are minimal (optional `inputMethod` field).

### 6.2 New Client-Side Components Required

```
hooks/
  use-voice-input.ts          # Microphone management, PTT start/stop, VAD
  use-voice-session.ts        # Bluetooth button event capture (AVRCP)
  use-voice-tts.ts            # TTS playback queue, Bluetooth audio routing

components/
  VoiceInputIndicator         # Visual feedback during recording (waveform or pulsing mic)
  VoiceCommandOverlay         # Minimal HUD: "Listening..." → "Sending..." → phase updates
```

**`use-voice-input.ts`** wraps `expo-speech-recognition` for microphone management and streams audio to the STT API. It handles:
- PTT start/stop (triggered by `use-voice-session`)
- VAD (voice activity detection) to auto-stop after silence
- Error states (no permission, no microphone, network error)
- Audio session setup for Bluetooth routing

**`use-voice-session.ts`** handles Bluetooth button event registration via `MPRemoteCommandCenter` (iOS) or `ACTION_MEDIA_BUTTON` (Android). This requires a native module — either a custom Expo module or a thin RN library.

### 6.3 Convex Schema Additions (Minimal)

```typescript
// session_messages — add optional inputMethod
inputMethod: v.optional(v.union(v.literal('text'), v.literal('voice'))),

// New: voice_command_log for debugging and quality analysis
voice_command_logs: defineTable({
  clerkUserId: v.string(),
  sessionId: v.id('planning_sessions'),
  transcript: v.string(),
  rawAudioDurationMs: v.number(),
  sttProvider: v.string(),        // 'whisper-api' | 'on-device' | 'platform-os'
  sttLatencyMs: v.number(),
  confidence: v.optional(v.number()),
  noiseLevel: v.optional(v.string()), // 'low' | 'medium' | 'high' (from amplitude)
  createdAt: v.number(),
}).index('by_clerkUserId', ['clerkUserId'])
```

The `voice_command_log` table is the most important investment for building the noise-robustness dataset needed for V2 on-device STT tuning.

---

## 7. Technical Risks

### 7.1 Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| STT accuracy too low at highway speed | High | High | Scope V1.1 to parked/stopped use; disclose accuracy limits; log real-world data |
| Bluetooth AVRCP button conflict with music apps | Medium | Medium | Audio session management + test on 5+ device/app combos; document known conflicts |
| iOS background audio session restrictions | Medium | High | App must request `background audio` entitlement; test wake-from-background; review App Store policy |
| A2DP latency makes TTS feel unresponsive | Medium | Medium | Use on-device TTS (expo-speech) for short acknowledgments; reserve cloud TTS for richer responses |
| Android Bluetooth SCO/A2DP routing inconsistencies | High | Medium | Wide fragmentation; test on Samsung, Pixel, OnePlus minimum; expect device-specific bugs |
| Wind noise triggers false VAD end-of-speech | High | Medium | Use fixed-duration PTT (hold-to-talk) in V1.1, not VAD; VAD is a V2 feature after noise profiling |
| pi core agent latency too slow for riding context | Medium | High | Immediate TTS acknowledgment within 500ms; streaming phase updates; quick-command bypass |
| App Store rejection for background microphone use | Low | High | PTT model does not require background mic; always-on wake word would require it |
| Cardo/Sena proprietary API incompatibility | High | Low | Confirmed: no third-party API; design around AVRCP only; this is known and scoped out |

### 7.2 The Non-Negotiable Constraint

**Always-on listening (wake word) while riding is a safety and battery liability until motorcycle-specific noise robustness is proven.** A false wake-word activation at 80 mph that interrupts GPS audio, plays an unexpected TTS response, or triggers route generation is a distraction risk. PTT is safer, simpler, and still provides meaningful voice capability.

---

## 8. Recommended Phased Approach

### Phase 1 — V1.1 (3–4 weeks development)

**Goal**: PTT voice input that works when parked or at low speed. No always-on listening.

**Scope**:
- Bluetooth button capture (AVRCP) via thin native module or React Native community package
- `expo-speech-recognition` for microphone management (custom dev client required)
- Cloud STT via OpenAI Whisper API (transcript piped directly to existing `parseNaturalLanguageInput`)
- On-device TTS via `expo-speech` for short confirmations
- Cloud TTS via OpenAI `tts-1` for richer route summaries
- Visual `VoiceInputIndicator` and `VoiceCommandOverlay` components
- `voice_command_log` table in Convex for data collection
- No wake word; no always-on listening
- Rider disclosure: "Voice accuracy varies by noise conditions"

**Engineering effort**: 3–4 weeks for one mobile developer. No backend changes required beyond optional `inputMethod` field and `voice_command_logs` table.

**Acceptance criteria**:
- Rider can press helmet button → speak → hear route options via Bluetooth within 15 seconds (parked)
- Quick commands (save, confirm, dismiss) complete within 3 seconds
- App never accesses microphone except during active PTT session
- All voice commands fall back to text gracefully if STT fails

### Phase 2 — V2 (8–12 weeks, after riding season data collection)

**Goal**: Always-on wake word, on-device STT fine-tuned for motorcycle noise, streaming TTS, active-riding mode.

**Scope**:
- Custom Porcupine wake word model trained on motorcycle noise dataset collected in V1.1
- `whisper.rn` on-device STT with motorcycle-fine-tuned weights
- Streaming TTS (ElevenLabs or Picovoice Orca) for near-zero audio start latency
- VAD with motorcycle noise profile (not general-purpose VAD)
- Active riding mode: shorter responses, no multi-step instructions, safety-critical phrasing
- Battery optimization: wake word suspension above 70 mph (GPS speed gate)
- CarPlay/Android Auto integration planning (separate from V2 voice, requires platform certification)

**Engineering effort**: 8–12 weeks, including the custom wake word training pipeline and noise dataset curation.

---

## 9. Library Recommendations Summary

| Layer | V1.1 Recommendation | V2 Recommendation |
|-------|--------------------|--------------------|
| Microphone management | `expo-speech-recognition` (jamsch) | Same |
| STT | OpenAI Whisper API (`whisper-1`) | `whisper.rn` + motorcycle fine-tune |
| Wake word | None (PTT only) | Picovoice Porcupine (custom model) |
| TTS (short) | `expo-speech` (on-device, zero latency) | Picovoice Orca (on-device, natural voice) |
| TTS (rich) | OpenAI `tts-1` via streaming | ElevenLabs streaming |
| Button events | Custom Expo module (AVRCP) | Same |
| Audio routing | `expo-speech-recognition` `setCategoryIOS` + Android `AudioManager` | Same + streaming session management |

---

## 10. Dependencies on Other Teams

| Team | Dependency | Needed By |
|------|-----------|-----------|
| ui-designer | Voice UX patterns: VoiceInputIndicator, VoiceCommandOverlay, riding-mode HUD | V1.1 design spec before implementation |
| product-manager | JTBD alignment: is voice primarily pre-ride planning or active-riding? Changes scope significantly | Before V1.1 kickoff |
| business-process | Rider journey map: which journey moments call for voice vs. tap? | Before V1.1 kickoff |

**Blocking question for product-manager**: If voice is scoped to **pre-ride planning only** (parked or stopped), V1.1 is low-risk and achievable in 3–4 weeks. If voice must work at **highway speed with high accuracy**, it is a V2 feature requiring the full noise-robustness investment. The PRD currently defers voice to V1.1 without specifying the operating context — this must be resolved before engineering begins.

---

## Appendix A: Key Libraries — Version and Compatibility

| Library | Latest Version (as of 2026-04) | Expo SDK | Notes |
|---------|-------------------------------|----------|-------|
| `expo-speech-recognition` | 0.x (jamsch) | SDK 51+ | Custom dev client required; not Expo Go compatible |
| `@picovoice/porcupine-react-native` | 3.x | Custom dev client | Not Expo Go compatible |
| `whisper.rn` | 0.3.x | Custom dev client | Ships as native module; model download required |
| `react-native-tts` | 4.x | Dev client | Maintenance slower in 2025 |
| `expo-speech` | Built-in Expo SDK | All | Available in Expo Go; limited to platform voices |
| `react-native-speech` (mhpdev) | 1.x | SDK 50+, new arch | High-performance, new arch compatible |

All voice-related native modules require a **custom dev client** (EAS Build or local prebuild). They are incompatible with Expo Go. This is a development workflow change but not a blocking constraint given LaneShadow already has Convex and other native dependencies.

---

## Appendix B: Competitive Landscape — Motorcycle Voice Features

| App | Voice Capability | Architecture |
|-----|-----------------|-------------|
| Calimoto | None | — |
| Scenic | Siri Shortcuts integration only | Platform hand-off |
| REVER | None | — |
| Google Maps (CarPlay/AA) | Full voice nav | Native platform |
| Waze | "Hey Waze" wake word | Native platform, on-device |

**Opportunity**: No motorcycle-specific ride planning app has conversational AI voice input. LaneShadow has a clear first-mover window if voice quality is strong enough to ship confidently. The V1.1 PTT model, even if limited to parked use, would already exceed all competitors.
