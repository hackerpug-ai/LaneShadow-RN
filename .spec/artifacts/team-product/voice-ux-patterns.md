---
artifact_type: ux_spec
author: ui-designer
date: 2026-04-06
status: draft
version: 1.0.0
scope: V1.1 (voice input deferred from V1 per 01-scope.md)
---

# LaneShadow Voice-First UX Patterns

## Document Purpose

This document defines the voice interaction model, visual feedback states, riding mode interface, and multimodal coexistence patterns for LaneShadow's AI companion. Voice input is scoped to V1.1 per the V1 scope decision, but all patterns here are designed to layer cleanly onto the V1 chat-session architecture without architectural rework.

The map is always the primary view. Voice UI must never obscure it.

---

## Constraints That Drive Every Decision

1. **Gloves.** Riders wear gauntlet or cruiser gloves. Precision taps are unreliable. Touch targets must be enormous (minimum 56x56 pt for voice-critical actions, not 44x44).
2. **Helmet audio.** Voice output routes to Cardo/Sena Bluetooth. The visual UI is secondary when riding — audio IS the interface.
3. **Eyes on road.** During active riding, the rider cannot look at the phone. Visual feedback must be peripheral: large, high-contrast, readable at a glance in under 300ms.
4. **Mounting.** Phone is ram-mounted to handlebars. The screen orientation is fixed. UI layout is portrait, with all critical controls in the bottom 40% of the screen (reachable without lifting a hand fully off the bar).
5. **Noise.** Wind and exhaust noise at 60+ mph regularly exceeds 85 dB. Voice recognition must handle this; visual confirmation of what was heard is essential.

---

## 1. Voice Interaction Model

### 1.1 Activation Methods

Voice activation must never require two hands. Three activation paths:

| Method | Context | How It Works |
|--------|---------|--------------|
| **Press-and-hold voice button** | Stationary or riding | Tap-and-hold the mic button in the chat input bar. Release to send. |
| **Bluetooth helmet button** | Riding | Single-press the helmet intercom action button (Cardo/Sena). App registers as the active audio app via AVAudioSession (iOS) / AudioFocus (Android). |
| **Wakeword** (V1.2, not V1.1) | Riding | "Hey Shadow" wakeword — deferred until accuracy is validated in wind noise. |

The press-and-hold model is the V1.1 primary activation path. It is explicit (no false triggers), works with gloves, and is directly analogous to push-to-talk which all helmet intercom users already know.

### 1.2 Input States

```
IDLE → [press/hold mic] → LISTENING → [release] → PROCESSING → SPEAKING
                                        ↓
                                   [no speech or
                                    timeout 8s] → IDLE (with toast: "Didn't catch that")
```

| State | Duration | What Happens |
|-------|----------|--------------|
| **IDLE** | Indefinite | Mic button visible in chat input bar, dormant |
| **LISTENING** | While held (max 8s) | Waveform animation, real-time transcript shown, Bluetooth mic active |
| **PROCESSING** | 1–5s | Spinner replaces waveform, transcript locked (no more audio) |
| **SPEAKING** | Duration of TTS | Speaker icon animated, AI response text shown, audio plays to helmet |
| **ERROR** | Auto-dismiss 4s | Brief visual + audio: "Didn't catch that" or "Try again" |

### 1.3 Listening Behavior

- Audio captured from primary mic or Bluetooth helmet mic (whichever is active audio route)
- Real-time speech-to-text shown as editable transcript in the input field while listening
- Rider can see what was transcribed before it is sent — this is the noise confirmation step
- If transcript looks wrong, rider can re-press to re-record (clears previous transcript)
- Silence of 2s after speech detected = auto-release (does not require holding until silence)
- Hard 8s timeout if no speech detected = returns to IDLE

---

## 2. Visual Feedback Design

### 2.1 Mic Button States

The mic button lives in the existing `ChatInput` bar at the right side, replacing/coexisting with the send button based on context.

**State: IDLE (no text in input)**
```
┌─────────────────────────────────────────┐
│ [▲]  Plan a ride from near Asheville...  [mic] │
└─────────────────────────────────────────┘
       mic icon: outline, onSurface.muted color
```

**State: IDLE (text present in input)**
- Mic icon replaced by send arrow (existing behavior preserved)
- Voice and text are mutually exclusive per-message

**State: LISTENING (held)**
```
┌─────────────────────────────────────────┐
│ [▲]  "scenic 2 hour ride toward—"        [●●●] │
└─────────────────────────────────────────┘
       - Background of bar pulses: primary.subtle → primary.default (1s cycle)
       - Mic icon becomes animated waveform (3 bars, bounce animation)
       - Transcript appears in real-time, replacing placeholder
       - Bar border: primary.default, 2px
```

**State: PROCESSING**
```
┌─────────────────────────────────────────┐
│ [▲]  "scenic 2 hour ride toward asheville" [↻] │
└─────────────────────────────────────────┘
       - Spinner replaces waveform icon
       - Transcript frozen (read-only display)
       - Bar border returns to default
```

**State: SPEAKING (AI responding via TTS)**
```
┌─────────────────────────────────────────┐
│ [▲]  [                              ]   [▶▶] │
└─────────────────────────────────────────┘
       - Speaker icon animated (sound waves ripple outward)
       - Input field cleared, shows AI response text scrolling (subtitle style)
       - Rider can tap anywhere to skip/stop TTS playback
```

### 2.2 Listening State — Full ASCII Wireframe

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                   [Map View]                            │
│              (Route Polylines Visible)                  │
│                                                         │
│                                                         │
│                                                         │
│                                                         │
│                                                         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────┐  │
│  │  LISTENING...                                     │  │
│  │  "scenic 2 hour loop avoid highways—"             │  │
│  │                              [  ▌▌█▌▌  ] (waves) │  │
│  └───────────────────────────────────────────────────┘  │
│  ← border pulses primary.default                        │
│                                                         │
│  [ RELEASE TO SEND • HOLD FOR MORE • TAP X TO CANCEL ]  │
│           (hint strip, bodySmall, muted)                │
└─────────────────────────────────────────────────────────┘
```

### 2.3 Processing State — Full ASCII Wireframe

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                   [Map View]                            │
│              (Route Polylines Visible)                  │
│                                                         │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Reading your ride...                            │   │
│  │ ░░░░░░░░░░░░░░░░░░ (progress bar, indeterminate)│   │
│  └─────────────────────────────────────────────────┘   │
│      ← ChatMessageOverlay reuses existing planning      │
│        phase labels: "Finding scenic roads...", etc.    │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────┐  │
│  │  "scenic 2 hour loop avoid highways"      [↻]    │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 2.4 AI Speaking State — Full ASCII Wireframe

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Found 3 routes. Best option: Coastal Cruiser,     │  │
│  │ 42 miles, clear skies. Say "tell me more" or      │  │
│  │ "start navigation."                               │  │
│  │                                          [▶ ▶ ▶]  │  │
│  │ ┌─────────────────────────────────────────────┐  │  │
│  │ │ ⭐ Best for today  Clear                   │  │  │
│  │ │ Coastal Cruiser • 42 mi • 2h 15m           │  │  │
│  │ └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│                   [Map View]                            │
│             (Route polylines rendered)                  │
│                                                         │
│              [Tap anywhere to stop audio]               │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────┐  │
│  │  [▲]  Ask a follow-up...               [mic] [→]  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Riding Mode

Riding Mode is a simplified, voice-primary interface for active riding. It activates when the rider is in motion (speed > 10 mph detected via GPS or motion sensor), or manually via a toggle.

### 3.1 Philosophy

When moving:
- The rider cannot and should not tap small targets
- The map is the only thing that matters visually
- Audio through the helmet IS the UI
- Any visual element is ambient confirmation, not required reading

### 3.2 Riding Mode Activation

| Trigger | Behavior |
|---------|---------|
| GPS speed > 10 mph for 5s | Auto-suggest riding mode with single large-tap prompt |
| Manual toggle in chat bar | Immediately enters riding mode |
| Bluetooth helmet button long-press (2s) | Direct riding mode toggle (regardless of speed) |

Auto-suggest prompt (non-blocking):
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                   [Map View]                            │
│                                                         │
│    ┌─────────────────────────────────────────────┐     │
│    │  [Riding Mode]  Tap to switch for safer     │     │
│    │  glove-friendly controls. Auto-dismisses.   │     │
│    └─────────────────────────────────────────────┘     │
│                   (top-center, 6s auto-dismiss)         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 3.3 Riding Mode Interface

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                                                         │
│                   [Full-Screen Map]                     │
│                                                         │
│                (Route polyline visible)                 │
│                                                         │
│                                                         │
│                                                         │
│                                                         │
│                                                         │
│                                                         │
│ ┌──────────────────────┐    ┌──────────────────────┐   │
│ │                      │    │                      │   │
│ │     ●  VOICE         │    │   EXIT RIDING MODE   │   │
│ │    HOLD TO TALK      │    │                      │   │
│ │                      │    └──────────────────────┘   │
│ │   (56x56 min touch)  │         (secondary, smaller)  │
│ └──────────────────────┘                               │
└─────────────────────────────────────────────────────────┘
```

**What is visible in Riding Mode:**
- Full-screen map (no overlays except route polylines)
- One large VOICE button (bottom-left, 56x56 minimum, high-contrast filled circle)
- Small EXIT RIDING MODE text button (bottom-right, 44x44 minimum touch area)
- Active route: single highlighted polyline on map (the selected/best route)
- Speed and heading indicator (top-right corner, minimal, existing map control)

**What is NOT visible in Riding Mode:**
- Chat input bar
- Session controls
- Suggestion chips
- AI message overlay (audio only)
- Route attachment cards (audio summary only)

**What is NOT removed in Riding Mode:**
- Route polyline on map
- Navigation arrow / heading indicator

### 3.4 Voice Commands Available in Riding Mode

Riding mode supports a focused set of voice commands:

| Utterance Pattern | Action |
|------------------|--------|
| "Where am I?" | AI reads GPS location aloud |
| "How far to go?" / "How much longer?" | AI reads remaining distance and ETA |
| "What's the weather?" | AI reads weather for next 30 miles of route |
| "Next turn?" / "Directions" | AI reads next waypoint instruction |
| "Save this route" | Saves the active route |
| "Plan a new ride" | Exits riding mode, returns to planning with voice active |
| "Go home" | Plans route back to home location |
| Free-form ride planning | Passes directly to the planning agent |

Unrecognized commands: AI says "I didn't understand. Try 'how far to go' or 'plan a new ride'."

### 3.5 Audio Feedback in Riding Mode

All AI responses in riding mode follow the **3-second rule**: the complete, useful answer must be spoken in 3 seconds or less.

| Event | Audio Response |
|-------|---------------|
| Riding Mode activated | Short chime + "Riding mode on." |
| Voice activated (hold) | Soft ping (confirms mic is live) |
| Voice released | Soft pop (confirms capture ended) |
| Route plan complete | "Got it. [Route name], [distance], [weather condition]." |
| Weather alert | "Heads up: [condition] in [distance]." |
| Route deviation | "Off route. Recalculating." |
| Riding Mode deactivated | Short chime + "Riding mode off." |

### 3.6 Riding Mode — Listening State Wireframe

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                   [Full-Screen Map]                     │
│                                                         │
│         ┌─────────────────────────────────────┐        │
│         │   ▌▌▌█▌▌▌  (large waveform, center) │        │
│         │   LISTENING...                      │        │
│         └─────────────────────────────────────┘        │
│         (semi-transparent, top-center, 3 lines max)    │
│                                                         │
│                                                         │
│                                                         │
│ ┌──────────────────────┐                               │
│ │   ●●●  (pulsing)     │                               │
│ │   RELEASE TO SEND    │                               │
│ └──────────────────────┘                               │
└─────────────────────────────────────────────────────────┘
```

The waveform visualization is the only feedback element occupying map space. It is centered, translucent, and auto-hides 500ms after release.

---

## 4. Multimodal Coexistence (Voice + Text)

### 4.1 Principle

Voice and text are interchangeable. The rider should be able to switch mid-session without friction or state loss. The system does not distinguish between voice-originated and text-originated messages — they both land as messages in the same chat session.

### 4.2 Switching Rules

| Scenario | Behavior |
|---------|---------|
| Rider sends text message, then holds mic | Mic activates normally, prior text session preserved |
| Rider sends voice message, then types | Text input activates, prior voice transcript preserved in history |
| Rider is in riding mode, parks the bike (speed < 5 mph for 30s) | Riding mode persists (no auto-exit); rider taps EXIT RIDING MODE to return to full UI |
| Rider is in text mode, gets a call on helmet audio | Voice session interrupted naturally; AI waits |

### 4.3 Multimodal Chat Bar States

**Normal (text primary):**
```
┌─────────────────────────────────────────────────────────┐
│  [▲]  Plan a ride from near Asheville...       [mic] [→] │
└─────────────────────────────────────────────────────────┘
          mic icon: visible but secondary (onSurface.muted)
          send: hidden when input empty (mic takes priority)
          send: appears when text is typed
```

**Voice active (listening):**
```
┌─────────────────────────────────────────────────────────┐
│  [▲]  "take me somewhere twisty, about 2 hours—" [█▌█]  │
└─────────────────────────────────────────────────────────┘
          waveform replaces mic icon
          border: primary.default
          background: primary.subtle at 30% opacity
```

**After voice, before send (transcript review):**
```
┌─────────────────────────────────────────────────────────┐
│  [▲]  "take me somewhere twisty about 2 hours"   [mic] [→] │
└─────────────────────────────────────────────────────────┘
          transcript shown as editable text
          rider can edit before sending with →
          re-press mic to re-record
```

The transcript-review step is critical for noisy riding environments. The rider sees what was captured and can correct it before committing.

### 4.4 Multimodal Transition Wireframe

```
STATE A: Text mode
┌─────────────────────────────────────────────────────────┐
│  [▲]  Describe your ride...                    [mic]    │
└─────────────────────────────────────────────────────────┘

                    ↓ Rider holds [mic]

STATE B: Listening
┌─────────────────────────────────────────────────────────┐
│  [▲]  "coastal loop avoid—"             [▌▌█▌▌ HOLD]   │
└─────────────────────────────────────────────────────────┘

                    ↓ Rider releases

STATE C: Transcript review
┌─────────────────────────────────────────────────────────┐
│  [▲]  "coastal loop avoid highways"          [mic] [→]  │
└─────────────────────────────────────────────────────────┘
          Rider taps → to send, or [mic] to re-record,
          or edits inline with keyboard

                    ↓ Rider taps →

STATE D: Processing (same as text-triggered planning)
          Planning phases run, routes appear on map
          AI reads summary aloud via TTS
```

---

## 5. Voice + Map Integration Wireframe

Shows the complete map-first layout with voice UI elements in context.

### 5.1 Voice Active on Map (Standard Mode)

```
┌─────────────────────────────────────────────────────────┐
│  [☰]                                    [+Session] [⋮]  │
│                                                         │
│                   [Full Map View]                       │
│                                                         │
│                                                         │
│                ━━ Route A (Blue) ━━                      │
│                                                         │
│                                                         │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  LISTENING...                         [▌▌█▌█▌▌]  │  │  ← waveform indicator
│  │  "scenic coastal loop about 2 hours"              │  │  ← live transcript
│  └───────────────────────────────────────────────────┘  │
│  ← overlay at top of chat bar, slide-up animation       │
├─────────────────────────────────────────────────────────┤
│ [▲]  "scenic coastal loop about 2 hours"     [▌▌█] [→] │  ← chat bar, voice active
└─────────────────────────────────────────────────────────┘
```

### 5.2 AI Response on Map After Voice Query

```
┌─────────────────────────────────────────────────────────┐
│  ┌───────────────────────────────────────────────────┐  │
│  │ Found 3 routes. Best: Coastal Cruiser.   [▶] [X] │  │  ← overlay (existing component)
│  │                                                   │  │  ← [▶] = replay TTS  [X] = dismiss
│  │ ┌─────────────────────────────────────────────┐  │  │
│  │ │ ⭐ Best for today  Clear                   │  │  │
│  │ │ Coastal Cruiser • 42 mi • 2h 15m           │  │  │
│  │ └─────────────────────────────────────────────┘  │  │
│  │ ┌─────────────────────────────────────────────┐  │  │
│  │ │ Mountain Loop • 38 mi • 2h 05m             │  │  │
│  │ └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│                   [Map + Route Polylines]               │
│              ━━ Route A ━━  ━━ Route B ━━               │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ [▲]  Ask a follow-up...                      [mic]      │
└─────────────────────────────────────────────────────────┘
```

The [▶] button on the overlay allows the rider to replay the TTS summary if they missed it (e.g., if a car horn or wind noise covered it).

---

## 6. Voice AI Personality and Tone

### 6.1 Character

The AI companion is **Shadow** — a co-rider, not a customer service bot. Think: the experienced friend riding alongside who knows the roads, checks the weather without being asked, and gives you the answer you need in two sentences.

Shadow is:
- **Terse.** Riders don't want essays. Every spoken response is one to three sentences maximum.
- **Confident.** No hedging. No "I think maybe..." or "You might want to consider..." Just answers.
- **Rider-aware.** Shadow uses motorcycle-natural language. "Twisty run", "elevation gain", "tailwind", "light rain at the pass." Not "your route has been optimized."
- **Time-aware.** Shadow tells you what matters now. "Light rain hits around mile 28 — you'll be through the canyon by then."
- **Quiet by default.** Shadow does not fill silence. No confirmations for non-critical actions. No "Great choice!" No "Processing your request." Just results.

### 6.2 Voice Response Patterns

**Route results (primary use case):**
- "Three routes ready. Best pick today: Coastal Cruiser. 42 miles, clear skies, light tailwind. Two shorter options on screen."
- NOT: "I've found three route options for you! The top-ranked option based on weather and scenicness scores is the Coastal Cruiser..."

**Weather warning:**
- "Rain likely past mile 30. Want a drier option?"
- NOT: "Weather data indicates a 70% chance of precipitation approximately 30 miles into your current route..."

**Route refinement acknowledged:**
- "Got it. Updated. Mountain Loop is now the best pick."
- NOT: "I've processed your refinement request and updated the route recommendations accordingly..."

**Can't understand:**
- "Missed that. Try again."
- NOT: "I'm sorry, I wasn't able to process your voice input. Could you please repeat your request?"

**Error (no routes found):**
- "Nothing good in that area for your criteria. Try widening the radius or changing your start."
- NOT: "Unfortunately, I was unable to generate route options matching your specifications..."

**Navigation prompt (when route selected):**
- "Sending to Maps. Ride safe."
- NOT: "I'll now export this route to your preferred navigation application."

### 6.3 TTS Voice Characteristics

| Property | Target |
|---------|--------|
| Voice gender | Neutral, slightly low register (cuts through helmet audio) |
| Speaking rate | 10-15% faster than default TTS (riders are alert, not leisurely) |
| Prosody | Flat, declarative. No rising inflection on statements. |
| Filler words | None. Silence is better than "uh" or "so." |
| Max response length (riding mode) | 3 sentences, under 8 seconds |
| Max response length (planning mode) | 5 sentences, under 15 seconds |

---

## 7. Accessibility Notes

### 7.1 Hearing

- All voice feedback has a simultaneous visual counterpart (transcript, waveform, response text)
- Riders with helmet audio disabled see text in the ChatMessageOverlay as the primary channel
- TTS volume follows system audio routing — if no Bluetooth audio connected, TTS plays from phone speaker at elevated volume (user can mute in settings)

### 7.2 Gloves and Touch

All voice-mode touch targets:
- Mic button (chat bar): minimum 56x56 pt (exceeds standard 44x44 because gloves)
- Voice button (riding mode): minimum 80x80 pt (full palm press acceptable)
- Exit Riding Mode: minimum 56x44 pt
- Replay TTS [▶] on overlay: minimum 44x44 pt

### 7.3 Screen Reader Compatibility

Voice activation elements must carry:
```
accessibilityRole="button"
accessibilityLabel="Hold to speak"
accessibilityHint="Hold the button and speak your ride description. Release to send."
```

Waveform animation:
```
accessibilityElementsHidden={true}  // decorative
```

Transcript field during listening:
```
accessibilityRole="text"
accessibilityLabel="Listening transcript"
accessibilityLiveRegion="polite"
```

---

## 8. State Machine Extension

Voice adds two new states to the existing `PlanningStatus` enum from `08-technical-ui.md`:

```typescript
type PlanningStatus =
  | 'idle'
  | 'planning'
  | 'route_results'
  | 'route_details'
  | 'session_history'
  | 'navigation_export'
  // NEW for V1.1 voice:
  | 'voice_listening'     // Mic active, capturing
  | 'voice_processing'    // Transcript sent, same as planning but voice-originated
  // NEW for V1.1 riding mode:
  | 'riding_mode_idle'    // Riding mode active, no voice
  | 'riding_mode_listening' // Riding mode + voice active
```

### State Transitions (Voice Addition)

| From | Event | To |
|------|-------|-----|
| `idle` | hold mic button | `voice_listening` |
| `route_results` | hold mic button | `voice_listening` |
| `voice_listening` | release mic | `voice_processing` → `planning` |
| `voice_listening` | timeout (8s no speech) | `idle` (toast: "Didn't catch that") |
| `voice_listening` | tap X cancel | `idle` |
| `voice_processing` | transcript confirmed | `planning` (existing flow continues) |
| `*` | enter riding mode | `riding_mode_idle` |
| `riding_mode_idle` | hold mic | `riding_mode_listening` |
| `riding_mode_listening` | release mic | `voice_processing` |
| `riding_mode_idle` | exit riding mode | prior non-riding state |

### Extended PlanningState

```typescript
type VoiceState = {
  isRidingMode: boolean
  voiceTranscript: string | null        // real-time transcript during listening
  voiceError: 'timeout' | 'no_speech' | 'unrecognized' | null
  ttsPlaying: boolean                   // TTS audio currently playing
  ttsMessageId: string | null           // which message is currently being spoken
}
```

---

## 9. Bluetooth Helmet Integration Notes

### 9.1 Supported Systems

Primary targets: Cardo Packtalk (most common), Sena 50S/30K. Both use standard Bluetooth HFP (Hands-Free Profile) and A2DP.

### 9.2 Audio Routing

- When helmet is connected: TTS routes via A2DP (stereo audio), mic input via HFP
- When no helmet: TTS via phone speaker, mic via phone mic
- App must request `AVAudioSession.Category.playAndRecord` with `.allowBluetooth` and `.allowBluetoothA2DP` options

### 9.3 Button Mapping

Helmet intercom action buttons send standard HFP button events. LaneShadow registers as the active audio app and handles:
- Single press → activate voice listening (equivalent to holding in-app mic)
- Double press → stop current TTS playback

This is standard iOS/Android media session behavior, no custom BLE protocol required.

---

## 10. What This Document Does NOT Cover

- Wakeword detection ("Hey Shadow") — V1.2 scope; requires noise-model training and false-trigger testing in real riding environments.
- Turn-by-turn voice navigation — V2 scope per 01-scope.md.
- Multi-language voice support — V2 scope.
- Voice route recording narration — V2 scope.

---

## Appendix: Summary of All Wireframe States

| State | Section | Key Visual Elements |
|-------|---------|-------------------|
| Idle (voice available) | 2.1 | Mic icon in chat bar, dormant |
| Listening | 2.2 | Waveform animation, live transcript, pulsing bar border |
| Processing | 2.3 | Spinner, frozen transcript, planning phase overlay |
| AI Speaking | 2.4 | Speaker icon, response text, route cards, tap-to-skip |
| Riding Mode (idle) | 3.3 | Full-screen map, large VOICE button, EXIT button |
| Riding Mode (listening) | 3.6 | Large waveform center overlay, pulsing VOICE button |
| Voice + Map (listening) | 5.1 | Waveform above chat bar, live transcript, full map visible |
| Voice + Map (AI response) | 5.2 | ChatMessageOverlay with [▶] replay, route cards, full map |
| Multimodal transition | 4.4 | Text → listening → transcript review → processing |
