# Task #320: Voice Interaction UX for Motorcycle Riding

**Author**: ui-designer
**Date**: 2026-04-06
**Sprint**: On-Device AI PRD

---

## Overview

Motorcycle riding imposes a hard constraint: the phone screen is inaccessible while the bike is moving. Voice is not one interface option among many — it is the only interface during a ride. This document designs the full voice interaction system across three distinct contexts with different constraints, affordances, and user goals.

---

## Context 1: Pre-Ride (Screen + Touch Available)

The rider is stationary — in the driveway, at a coffee shop, in a parking lot. The screen is visible and touchable. Voice is an acceleration tool here, not a necessity.

### Use Cases in This Context
- Describe a ride in natural language instead of typing
- Download map packs for the day's region
- Download or update on-device AI model (LLM + Whisper)
- Set up or review bike profile (fuel range, preferences)

### Interaction Flow: Voice-to-Route

```
┌─────────────────────────────────────────────────────────┐
│                    [Map View]                           │
│                                                         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ [+ Session]  📍 Near Ojai, CA               [Manual]   │
├─────────────────────────────────────────────────────────┤
│ 🌟 2-hour loop  🌊 scenic coastal  🛣️ avoid highways   │
├─────────────────────────────────────────────────────────┤
│ [                              ] [🎤] [Send >]          │
│  Describe your ride...                                  │
└─────────────────────────────────────────────────────────┘

  Step 1: Rider taps 🎤 button

┌─────────────────────────────────────────────────────────┐
│                    [Map View]                           │
├─────────────────────────────────────────────────────────┤
│ [+ Session]  📍 Near Ojai, CA               [Manual]   │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │  🎙️  Listening...                                   │ │
│ │                                                     │ │
│ │  ●  ● ● ● ●  ●    [waveform animation]              │ │
│ │                                                     │ │
│ │  [Cancel]                           [Done / tap]    │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

  Step 2: Rider speaks ("Two hour loop, scenic, no freeway")
  Whisper transcribes on-device

  Step 3: Transcription appears in input field

┌─────────────────────────────────────────────────────────┐
│                    [Map View]                           │
├─────────────────────────────────────────────────────────┤
│ [+ Session]  📍 Near Ojai, CA               [Manual]   │
├─────────────────────────────────────────────────────────┤
│ [Two hour loop, scenic, no freeway    ] [🎤] [Send >]   │
│  ✓ Transcribed                                         │
└─────────────────────────────────────────────────────────┘

  Step 4: Rider reviews, edits if needed, taps Send
  (or speaks again to amend)

  Step 5: Route generation proceeds as per V1 chat flow
```

**Key Behaviors**
- Microphone button lives inline in the chat input bar (right of text field, left of Send)
- Tap to start, tap again to stop. No hold-to-talk — gloves make long-press unreliable
- Transcription appears in the text field, editable before sending
- Rider can speak a correction ("Actually, make it three hours") — field updates
- On-device badge visible during transcription to confirm local processing

### Interaction Flow: Model Download (First-Time Setup)

```
  On first app launch with on-device AI available:

┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Voice Commands — Set Up Once                   │   │
│  │                                                 │   │
│  │  Talk to LaneShadow while you ride. Requires    │   │
│  │  a one-time download (320 MB) on Wi-Fi.         │   │
│  │                                                 │   │
│  │  Works fully offline — no signal required.      │   │
│  │                                                 │   │
│  │  Storage used: 320 MB of 64 GB available        │   │
│  │                                                 │   │
│  │  [Not Now]          [Download on Wi-Fi]         │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘

  Download progress (Wi-Fi required, enforced):

┌─────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────┐   │
│  │  Downloading Voice Model                        │   │
│  │                                                 │   │
│  │  ████████████░░░░░░░░░░  58%  (186 MB of 320)   │   │
│  │                                                 │   │
│  │  Continue using the app — this runs in the      │   │
│  │  background and finishes before your next ride. │   │
│  │                                                 │   │
│  │  [Cancel Download]                              │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘

  Download complete:

┌─────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────┐   │
│  │  ✓ Voice Ready                                  │   │
│  │                                                 │   │
│  │  Tap the 🎤 button or press your helmet button  │   │
│  │  while riding to talk to LaneShadow.            │   │
│  │                                                 │   │
│  │                              [Got It]           │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**Model Download Rules**
- Wi-Fi only — never download over cellular (enforced, not a preference)
- Download runs in background; app remains fully usable
- If Wi-Fi drops mid-download, download pauses and resumes automatically on next Wi-Fi connection
- Storage requirement and available storage shown before download begins
- User can schedule download for next Wi-Fi connection if not currently on Wi-Fi

### Model Management Screen (Settings)

```
┌─────────────────────────────────────────────────────────┐
│  < Settings          Voice & AI Model                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Voice Recognition Model                               │
│  Whisper Tiny EN — v2.1.0                  ✓ Active    │
│  Storage: 42 MB          Last updated: Apr 3, 2026     │
│  [Check for Update]                  [Remove Model]    │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  Language Model                                         │
│  LaneShadow Phi-3 Mini — v1.4.0            ✓ Active    │
│  Storage: 278 MB         Last updated: Apr 3, 2026     │
│  [Check for Update]                  [Remove Model]    │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  Privacy                                                │
│  Voice processed on this device only        ✓ Enabled  │
│  No audio sent to servers                              │
│  [Learn more]                                           │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  Auto-update models on Wi-Fi                           │
│                                             [Toggle]   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Context 2: Mid-Ride (Audio Only — No Screen Interaction)

This is the most constrained and most important context. The rider is moving at speed with wind, engine, and road noise. The phone is in a tank bag, jacket pocket, or handlebar mount — technically visible but not safely interactable. The **only interface is helmet Bluetooth audio**.

### Hard Constraints
- No multi-turn conversation — single command, single response
- Response audio must complete within 4 seconds of trigger
- Audio must be intelligible over 60 mph wind + engine noise
- False trigger rate must be near zero — wrong activations at speed are dangerous
- Command vocabulary must work with noise-degraded speech

### Trigger: Wake Word vs Button Press

**Recommendation: Button Press, Not Wake Word**

| Criterion | Wake Word ("Hey Lane") | Helmet Button Tap |
|-----------|----------------------|-------------------|
| False positive rate | High in wind/engine noise | Near zero |
| Rider intentionality | Ambiguous | Explicit |
| Engine/wind interference | Significant degradation | Not affected |
| Battery impact | Always-on mic = ~15% more drain | Event-driven |
| Safety | Unexpected activations | Predictable |
| Setup complexity | Wake word training required | Plug-and-play |

**Button press is the primary trigger.** Wake word is an optional advanced setting for riders with low-noise setups (e.g., full-face fairings, electric bikes). The app pairs with any Bluetooth HID button.

### Interaction Flow: Button-Triggered Voice Command

```
Physical trigger:
  [Rider presses helmet Bluetooth button once]

┌─ On Device ──────────────────────────────────────────────┐
│                                                          │
│  1. Audio: LOW CHIME (100ms) — "I'm listening"          │
│  2. Mic opens — 5 second window                          │
│  3. On-device Whisper captures speech                    │
│  4. Audio: END CHIME (100ms) — "Processing"             │
│  5. On-device LLM interprets intent                      │
│  6. Route data / hazard log / cached map queried locally │
│  7. Response generated (text)                            │
│  8. TTS speaks response (max 8 words for navigation,     │
│     max 15 words for information)                        │
│                                                          │
└──────────────────────────────────────────────────────────┘

Total latency target: < 2.5 seconds from button press to first audio
```

### Command → Response Patterns

**Navigation Queries**

| Rider Says | Audio Response | Notes |
|------------|---------------|-------|
| "Gas within 20 miles" | "Shell, 8 miles ahead on your right" | Nearest on-route first |
| "How far to the next town?" | "Ojai, 12 miles ahead" | Town name spoken first |
| "Any viewpoints coming up?" | "Scenic overlook, 4 miles, Route 33" | Distance then location |
| "Where am I?" | "Maricopa, California" | Nearest named place |
| "How far to my destination?" | "31 miles, about 40 minutes" | Distance then time |

**Condition Queries**

| Rider Says | Audio Response | Notes |
|------------|---------------|-------|
| "Weather ahead?" | "Clear for the next 60 miles" | Simple, no numbers |
| "Rain coming?" | "Light rain expected in 2 hours" | Relative time |
| "Wind?" | "15 mph crosswind in the canyon ahead" | Direction + speed |
| "Temperature?" | "Currently 68 degrees" | Single number |

**Hazard Logging (No Response Needed)**

| Rider Says | Audio Response | Notes |
|------------|---------------|-------|
| "Gravel on road" | [CONFIRM CHIME only] | No speech — faster, safer |
| "Pothole" | [CONFIRM CHIME only] | Chime = logged |
| "Accident ahead" | [CONFIRM CHIME only] | Silence + chime = confirmed |
| "Debris in lane" | [CONFIRM CHIME only] | Rider needs to focus |

**Routing Adjustments**

| Rider Says | Audio Response | Notes |
|------------|---------------|-------|
| "Skip this road" | "Rerouting — continue for 2 miles then turn right" | Short instructions only |
| "Find an alternate" | "Alternate route via Pine Valley, 8 miles longer" | One option only |
| "Take me home" | "Home is 47 miles — heading north on Route 33" | Confirm then direct |

### Audio Feedback Patterns

**Chime Design**
- **Listening chime** (activation): Low G note, 100ms — warm, not startling
- **Processing chime** (end of recording): Higher G note, 100ms — signals "got it"
- **Confirm chime** (hazard logged / action taken): Double soft beep — acknowledges without distracting
- **Error chime** (didn't understand / offline limit): Low descending two-tone — distinct from confirm

All chimes must be:
- Audible at 60 mph with full-face helmet (target 85 dB at speaker, 60 dB at ear after attenuation)
- Non-startling — no sudden high-frequency spikes
- Directionally neutral — no stereo panning

**TTS Voice Selection**

| Voice Attribute | Specification |
|----------------|---------------|
| Persona | Calm, direct, neutral-gender — not enthusiastic |
| Pace | 15% slower than normal TTS rate |
| Frequency | Mid-range (200–3000 Hz) — cuts through wind noise better than low/high voices |
| Character | Factual, no filler ("um", "well") |
| Error tone | Never apologetic or cheerful on failure — just factual |

Avoid: overly "assistant" personalities (Siri-style), excessive formality, branding phrases.
Target: similar to aviation ATIS voice — informational, clear, professional, no wasted syllables.

### Error Handling — Mid-Ride

```
Scenario 1: Rider speaks but Whisper can't parse (noise too high)
  Audio: "Didn't catch that" [2 tone descending chime]
  Action: Nothing — rider presses button again if needed

Scenario 2: Command understood, but data unavailable offline
  Audio: "Not available without signal"
  Action: Nothing further

Scenario 3: Mic timeout (rider didn't speak in 5 seconds)
  Audio: [End chime only — soft, no speech]
  Action: Mic closes

Scenario 4: Battery below 10% — mic operations suppressed
  Audio: [Periodic low battery chime on activation attempt]
  Action: Chime explains with single word: "Battery"

Scenario 5: Model not loaded (first-launch, no download)
  Audio: "Voice not set up — connect to Wi-Fi to enable"
  Action: Nothing further mid-ride
```

### Screen State During Mid-Ride Voice Interaction

Even though the rider cannot interact with the screen, it still matters for:
- Passengers who can see the screen
- Glanceable moments at traffic lights
- Post-ride review of what was said

```
┌─────────────────────────────────────────────────────────┐
│                    [Map View]                           │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  🎙️  Listening...                                 │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│                    [Map continues]                      │
│                                                         │
└─────────────────────────────────────────────────────────┘

  After command received:

┌─────────────────────────────────────────────────────────┐
│                    [Map View]                           │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  "Gas within 20 miles?"                           │  │
│  │  Shell — 8 miles ahead on your right              │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
  (Auto-dismisses after 5 seconds — same as V1 overlay behavior)

  Hazard logged:

┌─────────────────────────────────────────────────────────┐
│                    [Map View]                           │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  ⚠️  Gravel logged at this location               │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
  (Auto-dismisses after 3 seconds — briefer for hazard logs)
```

---

## Context 3: Post-Ride (Screen Available, Voice Optional)

The rider is stopped — at a rest stop, trailhead, or back home. The screen is accessible. Voice is one option among many.

### Use Cases
- Rate the ride and add notes
- Search saved routes with natural language
- Review AI-generated ride summary
- Add a journal entry (voice or type)

### Interaction Flow: Post-Ride Review

```
┌─────────────────────────────────────────────────────────┐
│  < Back           Ride Complete                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Coastal Loop — Today, Apr 6                    │   │
│  │  42.3 mi  •  2h 18m  •  Avg 18.3 mph            │   │
│  │                                                  │   │
│  │  [Map thumbnail of route]                        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  How was this ride?                                     │
│  ★ ★ ★ ★ ☆                                             │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Great road conditions until the canyon.        │   │
│  │  Scenic overlook at mile 28 was worth it.       │   │
│  │  [AI draft — edit or approve]                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [Edit]  [Add Note 🎤]  [Approve & Save]  [Discard]    │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  Hazards logged this ride: 1                            │
│  ⚠️  Gravel at Pine Valley Rd, mile 22       [Review]  │
└─────────────────────────────────────────────────────────┘
```

**Post-Ride Voice Note Flow**
1. Rider taps "Add Note 🎤"
2. Listening state activates (same as pre-ride: tap to start, tap to stop)
3. Speech transcribed on-device
4. Transcription appended to AI-generated draft
5. Rider reviews combined text, taps Approve or edits inline

### Saved Route Search with Natural Language

```
┌─────────────────────────────────────────────────────────┐
│  < Back           Saved Routes                [🎤]      │
├─────────────────────────────────────────────────────────┤
│  [Search or describe a route...]                        │
│                                                         │
│  Recent                                                 │
│  ─────────────────────────────────────────────────────  │
│  Coastal Cruiser     42 mi   ★★★★☆  Apr 6             │
│  Mountain Loop       38 mi   ★★★★★  Mar 29            │
│  Valley Run          35 mi   ★★★☆☆  Mar 15            │
└─────────────────────────────────────────────────────────┘

  Rider taps 🎤 and says: "My favorite coastal rides from last fall"

┌─────────────────────────────────────────────────────────┐
│  < Back           Saved Routes                [🎤]      │
├─────────────────────────────────────────────────────────┤
│  "My favorite coastal rides from last fall"             │
│                                                         │
│  3 results — coastal, Sep–Nov 2025                      │
│  ─────────────────────────────────────────────────────  │
│  Pacific Highway Loop  58 mi  ★★★★★  Oct 12           │
│  Malibu Coastal Run    31 mi  ★★★★☆  Sep 28           │
│  Ventura Loop          44 mi  ★★★★☆  Nov 3            │
└─────────────────────────────────────────────────────────┘
```

---

## Integration with V1 Chat UI

The V1 chat UI has a chat input bar at the bottom of the map screen. Voice integrates into this bar without replacing it.

### Input Bar Extension

```
V1 (current):
┌─────────────────────────────────────────────────────────┐
│ [                    ]                        [Send >]  │
│  Describe your ride...                                  │
└─────────────────────────────────────────────────────────┘

With Voice (On-Device AI):
┌─────────────────────────────────────────────────────────┐
│ [                    ]              [🎤]      [Send >]  │
│  Describe your ride...             voice                │
└─────────────────────────────────────────────────────────┘
```

- Microphone button added between text field and Send button
- Tap activates listening mode
- Transcription populates the text field
- Rider can edit before sending — voice is an input accelerator, not a bypass
- During mid-ride (detected via motion/speed), button tap triggers direct audio response mode (no text field populated)

### Speed-Aware Mode Switching

| Condition | Voice Mode |
|-----------|-----------|
| Speed = 0, screen active | Pre-ride mode: transcribe to text field |
| Speed > 5 mph | Mid-ride mode: direct audio response, no text field |
| Speed = 0, recent ride ended | Post-ride mode: transcribe with ride context |

Speed detection uses device motion APIs. Mode switch is automatic and silent.

---

## Summary: Audio Pattern Reference

| Event | Sound | Duration | Speech |
|-------|-------|----------|--------|
| Mic activated | Low G chime | 100ms | None |
| Recording stopped | Higher G chime | 100ms | None |
| Hazard logged | Double soft beep | 200ms | None |
| Response ready | None | — | TTS response |
| Error / didn't understand | Low descending two-tone | 300ms | "Didn't catch that" |
| Offline / unavailable | Low descending two-tone | 300ms | "Not available" |
| Mic timeout (no speech) | Higher G chime (soft) | 100ms | None |
| Battery too low | Single low tone | 200ms | "Battery" |

---

## Design Principles

1. **Audio over visual** — every interaction that happens at speed must have audio confirmation. Visual feedback is secondary.

2. **Chime before speech** — the activation chime tells the rider to speak. The response comes after processing. Never ask the rider to wait silently.

3. **Shortest possible response** — navigation: 8 words max. Information: 15 words max. Hazards: chime only.

4. **Single command, single response** — no "Would you like me to..." follow-ups. Answer, stop. The rider is driving.

5. **Failure is silent when safe** — if a command fails, a chime explains it. No long error explanations at 60 mph.

6. **On-device is the default, not the fallback** — voice commands never wait for network. If network would improve the answer, the on-device answer is given immediately with an optional "updated" notification when connected.

7. **Trust through consistency** — the activation chime must be the same every time. Riders build muscle memory. Changing sound behavior between updates breaks trust.
