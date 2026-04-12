---
date: 2026-04-12
type: technical-research
status: RESEARCH (pre-spike)
related_strategy: ../PRODUCT-STRATEGY.md (Pillar 2 — Ride Companion)
---

# Ride Companion — Voice Architecture & Technical Research

## Purpose

This document is the technical companion to **Pillar 2 (Ride Companion)** in the v3.0 product strategy. It documents the voice processing architecture, addressing detection approach, false-trigger mitigation, technology candidates, and validation requirements for the in-ride voice experience.

The strategy doc says **what** we're building. This doc says **how** it could actually work — and what we need to prove before committing to build it.

## Status

**RESEARCH — pre-spike.** The technical approach is hypothesized but not yet validated against real helmet-mic riding conditions. Nothing in this document should be treated as engineering commitment until the validation spike (see end of doc) confirms feasibility.

---

## Design Principles (from strategy)

Carried forward from `PRODUCT-STRATEGY.md` Pillar 2:

1. **Hands on the bars. Eyes on the road. Zero physical interaction.**
2. **Always-on, ambient, unintrusive.** Background presence, not foreground app.
3. **Bias toward silence.** False negatives (missed command, rider repeats) are recoverable. False positives (wrong action, distraction) erode trust irreversibly.
4. **Quality gates are non-negotiable**: Safe, Accurate, Reliable. If any gate fails validation, the feature does not ship.

---

## The Vision in One Paragraph

A motorcycle rider mounts their iPhone on the bars, puts on their helmet (with Bluetooth intercom + mic), and rides. LaneShadow runs in the background. It hears nothing it doesn't need to hear. When the rider says "save this road," the road is saved silently with a short audio confirmation. When the rider asks "what's the weather ahead?" the assistant answers in one sentence. The rider talks freely with friends on intercom, sings along to music, swears at traffic — and the assistant correctly stays out of the way until it's actually needed. No buttons. No wake word required (but optional). No screen interaction. No cell coverage required.

---

## Architecture: The 5-Layer Stack

Always-listening doesn't mean "stream every sound to a model." It's a pipeline of progressively expensive layers, each gating the next. Most of the time, only Layer 1 is active. The expensive layers fire briefly when there's actual speech, then sleep.

| Layer | What It Does | Active When | Cost |
|-------|------------|-------------|------|
| 1. VAD | Detects human speech vs. silence/noise | Continuously | Very low (DSP) |
| 2. STT | Transcribes detected speech to text | Layer 1 fires | Low |
| 3. Addressing | Decides "is this for me?" | Layer 2 produces transcript | Low |
| 4. Intent | Classifies command type | Layer 3 says "yes" | Low |
| 5. Action | Executes + brief audio response | Layer 4 confidence is high | Negligible |

### Layer 1: Voice Activity Detection (VAD)

**What it does**: Continuously monitors the audio stream and decides "is there human speech in the last 200ms?" Outputs a binary signal.

**Why it matters**: VAD is the gate that keeps the rest of the stack asleep. Without it, we'd be running speech recognition on wind and engine noise constantly. With it, the expensive layers only fire when there's something worth listening to.

**Technology candidates**:
- **Apple's built-in VAD** (part of `AVAudioEngine` / `SFSpeechRecognizer`) — zero dependencies
- **WebRTC VAD** (Google, open source) — battle-tested, runs on tiny CPU
- **Silero VAD** (open source, MIT) — modern neural VAD, very accurate, ~1MB model

**Power cost**: Negligible. Runs on the audio DSP, not the main CPU.

**Helmet conditions**: Helmet mics have decent noise rejection. Wind buffers + close-to-mouth positioning give a usable speech signal even at highway speeds. VAD is the easy layer.

### Layer 2: On-Device Speech-to-Text (STT)

**What it does**: When VAD detects speech, transcribes it to text. Output is a string of words, on-device, never transmitted.

**Why on-device**: Cell coverage is unreliable on the kinds of roads riders care about. Cloud STT is a non-starter. Latency matters too — a 2-second pause at 60mph is 176 feet of road. On-device = immediate.

**Technology candidates**:
- **Apple Speech framework** (`SFSpeechRecognizer` with `requiresOnDeviceRecognition = true`) — native iOS, free, maintained, supports streaming. Strongly recommended for V0.
- **whisper.cpp** (small or tiny variant) — Whisper port that runs on iPhone. Tiny model is ~39M params. Higher quality than Apple on hard audio but slower.
- **Vosk** — Open source, on-device, smaller models available.

**Recommendation**: Apple Speech framework for V0. It's the lowest-friction starting point and Apple has invested heavily in Bluetooth audio handling. Re-evaluate against whisper.cpp if accuracy in helmet conditions is insufficient.

**Helmet conditions caveat**: Bluetooth motorcycle intercoms typically use the **HFP profile** (Hands-Free Profile), which is mono 8kHz audio — significantly lower quality than A2DP music streaming. This is the actual audio quality the STT model will see. Apple Speech framework is trained on this kind of audio (it's the same profile car kits use), so it should handle it. Verify in spike.

### Layer 3: Addressing Detection — The Hard Problem

**What it does**: Decides whether the transcribed speech is **addressed to the assistant** or is **incidental speech** (talking to a friend on intercom, singing, swearing at traffic, narrating to oneself).

**Why this is the hardest layer**: Most utterances are not commands. A rider on a 2-hour ride with a friend on intercom might say 2,000 words and only 10 of them are intended for the assistant. The rest must be ignored. False positives are dangerous because they break the rider's expectation that the system is silent unless needed.

**The four addressing signals**:

#### Signal 1: Wake Word (Strong)

A configurable vocal label that the rider can prefix to any command: *"LaneShadow, save this road."* When the wake word fires, anything that follows in the next ~5 seconds is unambiguously addressed to the assistant.

- **Pros**: Highest precision. Works for any command, even ambiguous ones. Riders who want guaranteed reliability can always use it.
- **Cons**: Slightly formal. Requires custom wake word training. Detectability in helmet audio must be validated.
- **Status**: Optional, not required. Rider can configure: wake-word-required, wake-word-optional (default), or wake-word-disabled.

#### Signal 2: Command Pattern Matching (Medium)

Imperative-form utterances with motorcycle-specific verbs are recognizable as commands without a wake word. Example patterns:

- "Save this road" / "Save this" / "Bookmark this road"
- "Rate this [N] stars" / "Five stars"
- "How far to the next gas station?"
- "What's the weather ahead?"
- "How long until I'm home?"

The intent classifier (Layer 4) is trained to recognize these high-confidence patterns. When confidence is >90%, the system acts without requiring a wake word. When confidence is lower, the system stays silent and waits for clearer speech (or wake word).

- **Pros**: Natural speech, no incantation required.
- **Cons**: Ambiguous edge cases ("I'm going to save this road for later" is not a command but contains "save this road").
- **Status**: Required. The default interaction model.

#### Signal 3: Conversation Continuity (Contextual)

When the assistant has just spoken (within the last 10-15 seconds), the rider's next utterance is statistically likely to be a response or follow-up. During this window, the system listens more aggressively — the addressing threshold is lowered because conversation is in progress.

Example flow:
- Rider: *"What's the weather ahead?"*
- System: *"Clear for the next hour."*
- Rider: *"OK, save this road."* ← spoken in conversation context, treated as a command without needing wake word

- **Pros**: Natural conversation flow.
- **Cons**: Defining the window precisely is fiddly.
- **Status**: Recommended addition after V0 ships.

#### Signal 4: Default — Silence (Always)

When no signal fires with high confidence, the system does nothing. The rider tries again, or uses the wake word. **Missing a command is recoverable. Wrongly executing one is not.**

This is the most important principle in the entire architecture. It must be enforced at every confidence threshold throughout the stack.

#### Recommended V0 Behavior

```
IF wake_word_detected:
    listen for next 5 seconds → high-confidence intent classification
ELSE IF imperative_command_pattern AND classifier_confidence > 0.92:
    execute action
ELSE:
    stay silent
```

### Layer 4: Intent Classification

**What it does**: Maps a transcribed command to one of ~50 motorcycle-specific intents. Outputs an intent label + confidence score + extracted entities (like rating value, distance unit, etc.).

**What it is NOT**: A generative LLM. We are not using an LLM in the "ChatGPT" sense for command interpretation. We are using a small specialized classifier optimized for a closed set of intents in a motorcycle context. This is critical for the Reliability gate — classifiers are deterministic, predictable, and easy to validate. Generative models are not.

**Technology candidates**:
- **Lightweight on-device transformer** (DistilBERT family, ~66M params) fine-tuned on motorcycle command intents. Runs on Apple Neural Engine via Core ML conversion.
- **Traditional NLP classifier** (rule-based + fuzzy matching + small ML model). Lower ceiling but more predictable.
- **Apple's NLEmbedding + custom classifier** — uses Apple's built-in language embeddings + a thin classifier head.

**Recommendation**: Start with rule-based + fuzzy matching for V0. Add a small ML classifier in V0.1 once we have real command logs to train on. This avoids over-engineering before we know what real rider commands look like.

**Initial intent set (~50 commands grouped by category)**:

| Category | Example Intents |
|----------|----------------|
| Capture | save road, unsave, rate (1-5 stars), add note |
| Awareness | weather ahead, weather at destination, fuel range, distance to X, ETA home |
| Discovery (in-ride) | what's nearby, find good road near me, scenic detour |
| Adaptation | reroute around weather, extend ride, take me home, find alternate |
| Coordination | tell group [msg], where is group, regroup at next stop |
| Comfort | find food, find rest stop, find gas, find lodging |
| Meta | repeat that, never mind, mute for [duration] |

V0 ships with **one** of these intents, not all 50. See "Validation Spike" below.

### Layer 5: Action Execution + Audio Response

**What it does**: Runs the intent's action (write to database, query weather API, etc.) and produces a brief audio confirmation if needed.

**Action execution**: Most actions are local (save a road, rate a road, query a cached weather forecast). Some require network (re-routing, fresh weather lookup) and must handle network failures gracefully — *"I can't reach weather service right now"* is the right answer when there's no signal.

**Audio response design**:
- **One sentence maximum** for confirmations. *"Saved."* not *"I have saved this road segment to your library and you can review it later in your saved roads tab."*
- **Use AVSpeechSynthesizer** (built-in iOS TTS). Free, on-device, voice configurable.
- **Audio routing**: Output through the same Bluetooth HFP channel the rider is on, ducking music and yielding to phone calls and intercom conversations (see Bluetooth section).
- **Haptic alternative**: For the simplest commands ("save this road"), a haptic buzz on the iPhone is sufficient confirmation. Pair with TTS for screenless verification without requiring audio output at all.

**Confirmation for destructive commands**: High-consequence intents (reroute, send group message, end ride) require verbal confirmation:
- Rider: *"Reroute me away from the rain."*
- System: *"Rerouting around rain. Say 'go' to confirm or 'cancel' to keep current route."*
- Rider: *"Go."* ← system acts only on explicit confirmation

This is the safety net for cases where the addressing detection or intent classifier produces a false positive. Low-consequence commands (save, rate, query) execute immediately.

---

## False Trigger Mitigation Strategy

The biggest risk to always-on is false positives. The mitigation stack:

1. **High confidence thresholds** — intent classifier must be >0.92 confident before acting (without wake word) or >0.85 (with wake word). When uncertain, stay silent.
2. **Conservative intent classifier** — explicitly include a "not a command" class. Train on negative examples (intercom chatter, casual speech, music lyrics) so the classifier learns what to ignore.
3. **Confirmation for destructive actions** — verbal "go" required before any action with consequences (reroute, message group, end ride).
4. **User mute control** — riders can verbally mute the assistant for any duration ("mute for the next hour"). Mute means VAD continues but Layers 3-5 are disabled. The rider regains full silence on demand.
5. **Quiet by default for proactive speech** — the system speaks proactively only for opted-in categories (weather change, fuel warning, group event).
6. **Conservative wake word sensitivity** — better to miss a wake word and require repetition than to false-fire on similar-sounding speech.

---

## Quality Gates → Technical Requirements

The strategy's three quality gates translated into engineering requirements.

### Safe Gate

**Strategy says**: Must not distract or increase risk of accident.

**Engineering requirements**:
- Zero required screen interactions during a ride
- All responses are audio (or haptic) only
- All responses are <1 sentence; no multi-turn explanations
- System is always mutable on demand by voice
- Proactive speech requires explicit per-category opt-in
- Audio output ducks (does not interrupt) music; yields completely to phone calls and intercom conversations
- Destructive commands require verbal confirmation

**Validation test**: Rider completes a 1-hour ride using only voice. Never looks at screen. Self-reports no distraction or near-miss.

### Accurate Gate

**Strategy says**: Information provided must be correct.

**Engineering requirements**:
- Weather data is current (<15 min stale) and route-specific (segment-level, not destination-only)
- Distance/time estimates are calibrated to motorcycle speeds on the actual road type (not driving estimates)
- POI data (gas, food, rest) is verified current via API
- When the system doesn't know, it says *"I'm not sure"* — never fabricates
- Accuracy is **bounded by data source**: we will never be more wrong than our underlying data, and we cite uncertainty when it exists (e.g., *"The forecast is 2 hours old"*)

**Validation test**: 10 weather queries return verifiably correct data. 10 distance queries are within 5% of actual.

### Reliable Gate

**Strategy says**: Must consistently work with high intent accuracy.

**Engineering requirements**:
- **Addressing precision**: when system acts, it was correctly addressed >98% of the time (false positives are dangerous)
- **Addressing recall**: system correctly recognizes intentional commands >90% of the time (false negatives are recoverable)
- **Intent classification accuracy**: when the system attempts to act, it executes the correct intent >95% of the time
- **No-coverage operation**: the entire stack works with cellular data disabled (verified)
- **Helmet-mic operation**: STT word error rate is acceptable on real Bluetooth HFP audio at highway speeds

**Validation test**: Defined in the Validation Spike below.

---

## Bluetooth Intercom Integration

### Reality of Helmet Audio

Most motorcycle helmet intercoms (Cardo, Sena, Schuberth, Interphone, etc.) are Bluetooth headsets that connect to the rider's phone. Two profiles matter:

- **A2DP** — Stereo, high quality, used for music playback. Output only (no mic).
- **HFP** — Mono 8kHz, lower quality, used for phone calls and bidirectional audio. Mic + output.

For a voice assistant, we need **HFP**. This is the same channel a phone call uses. When LaneShadow's mic is active, the iPhone is in HFP mode and music (if any) is paused or running on a separate channel.

**Implication**: Audio quality is not great. 8kHz mono is comparable to old phone calls. STT must work with this quality. Apple Speech framework is trained on it. Verify in spike.

### Audio Routing Behavior

| Rider state | LaneShadow behavior |
|-------------|---------------------|
| Listening to music (A2DP) | Duck music when speaking; resume after |
| On phone call | Yield completely; do not speak; do not capture mic |
| On intercom with other riders | Listen for commands (intercom audio is shared on HFP); only speak on direct address; never broadcast TTS output to other riders unless explicitly requested ("tell the group...") |
| Silent ride | Continuous VAD; no audio output unless command issued |

### Tested Intercom Models (TBD in spike)

We need to verify behavior with at least:
- Cardo Packtalk Edge (most popular cruiser model)
- Sena 50S (most popular touring model)
- Whatever the founder owns (real-world test bed)

Different intercoms handle Bluetooth profile switching differently. Some quirks are unavoidable.

---

## Privacy

**On-device processing is a privacy feature, not just a technical choice.** This is worth being explicit about because it differentiates LaneShadow from cloud-based assistants and matters to the demographic skeptical of always-listening tech.

Commitments:
- **Voice audio never leaves the device.** STT runs locally. Transcripts are not transmitted.
- **No voice recordings are stored.** Audio is processed and discarded.
- **Wake word detection is on-device.** No "hot mic" streaming to a server.
- **The system can be disabled entirely.** Riders who don't want voice can use LaneShadow without it; the touch UI remains fully functional.

These are easy commitments to make because they fall out of the on-device architecture naturally. They should be stated in the privacy policy and surfaced in onboarding.

---

## Validation Spike Plan

**The single most important question**: Can always-listening with addressing detection actually work in real helmet audio at real riding speeds?

Until this is answered, the entire Pillar 2 strategy is unproven. The spike must come **before** Phase 3 commits to building features.

### Spike Scope (1 week)

**Goal**: Ship a minimal test app that proves (or disproves) the core feasibility.

**Build**:
1. iOS test app using `AVAudioEngine` + `SFSpeechRecognizer` (on-device mode)
2. Continuous VAD via WebRTC VAD or Apple's built-in detection
3. Hardcoded pattern matcher for ONE command: *"save this road"* (and minor variations: "save this", "bookmark this road", "save the road")
4. On detection: write timestamp + GPS location to a local file, play short TTS confirmation ("Saved")
5. Bluetooth HFP audio routing through paired helmet intercom

**Test conditions**:
- Founder's actual helmet + Cardo/Sena setup
- Real ride for ≥1 hour, ideally on roads with mixed conditions (city, highway, back road)
- Intentional commands: say "save this road" 10 times during the ride when something is worth saving
- Realistic non-command speech:
  - Talk to a friend on intercom for 10+ minutes total
  - Sing along to a song
  - Comment on traffic / surroundings out loud
  - Curse at a driver
- Conditions: include both calm and windy segments, both highway and back road speeds

### Pass Criteria

| Metric | Target | If Below |
|--------|--------|----------|
| Intentional commands recognized | 9 of 10 (90%) | Investigate STT or pattern matcher; consider whisper.cpp |
| False positives during non-command speech | 0 | Tighten threshold or add wake-word fallback for V0 |
| Battery drain during 1hr ride | <15% on a charged phone | Optimize VAD, reduce STT polling rate |
| Latency from "save this road" to confirmation | <2 seconds | Profile pipeline; investigate streaming STT |

### What This Spike Does NOT Test

- Wake word detection accuracy (Phase 3.1+)
- Multi-command intent classification (Phase 3.1+)
- Network-dependent commands like reroute (Phase 4)
- Group coordination (Phase 4+)

### What We Learn From This Spike

- **Yes** → Phase 3 builds on a proven foundation. The rest of the intent set follows the same pattern.
- **Mostly yes, with caveats** → We adjust the design (e.g., require wake word, narrow scope further) and re-spike.
- **No** → We re-evaluate the entire pillar. Maybe LaneShadow ships pre-ride only, or maybe we revisit the design at a fundamental level.

The spike is cheap insurance on a structural strategic bet.

---

## Open Questions

These are unknowns that the spike or subsequent investigation will address:

1. **STT accuracy in HFP audio at highway speeds** — verified in spike
2. **VAD false-firing rate from wind/engine noise** — verified in spike
3. **Bluetooth profile quirks across intercom brands** — tested in spike with founder's gear, expanded later
4. **Battery cost of continuous VAD + occasional STT** — measured in spike
5. **Acceptable wake word for the brand** — TBD; deferred until V0.1
6. **Cross-platform path (Android)** — how does this stack work on Android? Apple Speech and Core ML are iOS-only; Android equivalents exist but are different. Decide whether iOS-first is the right V0 (probably yes — start with one platform, prove it, then port).
7. **What the V0 confirmation pattern is** — TTS only, haptic only, or both? Test with riders.

---

## Risks Specific to Voice

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| STT accuracy insufficient in HFP helmet audio | Medium | Spike validates early; whisper.cpp as fallback if Apple Speech is insufficient |
| False trigger rate >0 in real conditions | Medium | High confidence threshold; wake word fallback; bias toward silence |
| Battery drain unacceptable | Low | VAD is cheap; STT only fires on speech; USB charging is standard on touring/cruiser bikes |
| Bluetooth profile switching unreliable | Medium | Test multiple intercom brands; document supported configurations |
| Riders find always-on creepy | Low | Privacy-first messaging; on-device processing; mute control; opt-in onboarding |
| Liability for in-ride feature failures | Low | Quality gates as hard constraints; standard disclaimers; conservative confirmation patterns |

---

## Future Investigations (Post-V0)

Things we'll learn about after the V0 spike and ship:

- **Multi-language support** — V0 is English. Spanish and German are likely the next priorities.
- **Cross-platform port** — Android equivalent stack (Google Speech vs. Vosk vs. whisper.cpp on Android NNAPI).
- **Offline weather** — caching strategies for in-ride weather queries when network is unavailable.
- **Group voice** — when one rider says something to "the group," what happens? Cross-rider message routing is its own product.
- **Voice training** — should the wake word and intent classifier learn from individual rider speech patterns over time? Privacy implications need careful design.
- **Conversational mode** — should the assistant maintain context across multiple commands ("what's the weather ahead?" → "and how far to that town?" with implicit reference)?

---

## References

### Frameworks & Libraries

- **Apple Speech Framework** — `SFSpeechRecognizer`, on-device mode via `requiresOnDeviceRecognition = true` (iOS 13+)
- **AVSpeechSynthesizer** — built-in iOS TTS
- **AVAudioEngine** — audio capture and routing
- **Core ML** — on-device ML model inference, optimized for Apple Neural Engine
- **WebRTC VAD** — Google open source VAD ([github.com/wiseman/py-webrtcvad](https://github.com/wiseman/py-webrtcvad))
- **Silero VAD** — modern neural VAD ([github.com/snakers4/silero-vad](https://github.com/snakers4/silero-vad))
- **whisper.cpp** — Whisper port for on-device inference ([github.com/ggerganov/whisper.cpp](https://github.com/ggerganov/whisper.cpp))
- **Picovoice Porcupine** — custom wake word detection on-device

### Bluetooth Audio Profiles

- **HFP** (Hands-Free Profile) — bidirectional 8kHz mono, used by phone calls and voice assistants
- **A2DP** (Advanced Audio Distribution Profile) — stereo high-quality, output only, used for music

### Strategy Reference

- `.spec/PRODUCT-STRATEGY.md` — Pillar 2 (Ride Companion) defines the high-level vision and quality gates that this document supports

---

## Change Log

| Date | Change |
|------|--------|
| 2026-04-12 | Initial document. Pre-spike technical research for Pillar 2 (Ride Companion). |
