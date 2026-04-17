# Sprint 8: Voice Assistant

**Sequence:** 8
**Status:** Planned

## Overview

Wire hands-free control into the existing Sprint-2 voice surfaces by connecting platform STT/TTS pipelines, audio-focus/session management, and command dispatch into the ride-planning, navigation, and ride-recording flows. This sprint is pure wiring — no UI primitives are built here; all visual surfaces come from Sprint 2 (existing or pending delta).

## Human Testing Gate

**Gate:** A rider can activate the voice assistant hands-free, have their spoken commands reliably recognized over helmet audio under noise, hear intelligible spoken responses, and have those commands correctly routed into the actual planning/navigation/ride-control flows — verified end-to-end as recognition + routing + execution, not as UI rendering.

## Human Test Deliverable

Hands-free voice control is demonstrably wired into real ride flows: activation triggers a live STT session, recognized intents dispatch to the correct planning/navigation/ride-control handlers, TTS responses play through helmet audio with correct focus/ducking, and degraded-audio recovery paths route through existing Sprint-2 surfaces.

## Human Test Steps

1. On Android, activate via wake word and tap paths; verify `SpeechRecognizer` reaches a live listening state, mic permission flow surfaces through `PermissionNotification`, and audio focus is acquired over helmet Bluetooth.
2. On iOS, activate via wake word and tap paths; verify `SFSpeechRecognizer` reaches a live listening state, mic permission flow surfaces through `PermissionNotification`, and `AVAudioSession` is correctly configured for helmet output.
3. Speak "find me a curvy route near [city]" and verify `voice:parseIntent` dispatches into the same Sprint-4 planning pipeline as typed chat — not a separate voice-only surface.
4. During an active ride, speak "pause ride" / "resume" / "end ride" and verify the Sprint-6 recording state machine transitions correctly and the Sprint-5 HUD reflects the new state.
5. Under simulated wind/road noise, verify recognition confidence, partial-result handling, retry prompting, and cancel paths are routed correctly and that the overlay + `Banner` communicate degraded-audio state as specified in UC-VOICE-08.

## Source Coverage

- `13-uc-voice-assistant.md` (UC-VOICE-01 through UC-VOICE-08)
- `15-uc-ride-flow.md`

## Dependencies

- **Sprint 2: UI Component Translation** — all voice surfaces (visual primitives) must exist before wiring:
  - `UI-051` / `UI-052` — `VoiceAssistantOverlay` (Android / iOS organism)
  - `UI-031` / `UI-032` — `PermissionNotification`, `ConnectionBanner` (molecules)
  - Sprint 2 `Banner` molecule — inline voice status feedback
  - **Pending Sprint 2 delta** — `VoiceListeningVisualizer` (atom) and `AudioQualityMeter` (molecule) must be added to Sprint 2's catalog before VOI-004 can wire them.
- **Sprint 4: Chat Planning and Comparison** — planning dispatch target for UC-VOICE-04.
- **Sprint 5: Turn-by-Turn Navigation** — navigation dispatch + HUD state target for UC-VOICE-05.
- **Sprint 6: Ride Recording** — ride-state dispatch target for UC-VOICE-06.

## Blocks

- Sprint 10: Native Parity and React Native Retirement

## Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| VOI-001 | Define shared voice-command ontology and ride-flow intent mapping | worker | 0.5 day |
| VOI-002 | Wire Android `SpeechRecognizer` + `TextToSpeech` + `AudioManager` focus into the intent dispatcher | kotlin-implementer | 1 day |
| VOI-003 | Wire iOS `SFSpeechRecognizer` + `AVSpeechSynthesizer` + `AVAudioSession` into the intent dispatcher | swift-implementer | 1 day |
| VOI-004 | Wire Sprint-2 voice surfaces (overlay + permission + banner + pending-delta visualizer/meter) into the STT/TTS pipeline and command dispatch | frontend-designer | 0.5 day |
| VOI-005 | Wire recognized intents into Sprint-4 planning and Sprint-5 navigation flows | convex-implementer | 0.5 day |
| VOI-006 | Wire permission-denied, offline, and noisy-environment recovery paths into existing overlay + banner surfaces | worker | 0.5 day |

---

### VOI-001 — Voice-command ontology and intent mapping

Define the shared intent schema (command types, entities, confidence thresholds) and the ride-flow intent map that `voice:parseIntent` and platform dispatchers consume. Pure contract/data-layer task; no UI.

**Components Consumed:** None (contract-layer only).

---

### VOI-002 — Android STT/TTS/audio SDK wiring

Wire Android `SpeechRecognizer` + `RecognitionService`, `TextToSpeech` + `UtteranceProgressListener`, and `AudioManager` (AudioFocus, `STREAM_MUSIC`) + `MediaSession` into the shared intent dispatcher from VOI-001. Responsibilities:
- Session lifecycle: start/stop STT, request/abandon audio focus, duck/restore background audio per UC-VOICE-01 / UC-VOICE-03.
- Stream partial + final recognition results into the dispatcher; emit state (idle / listening / processing / speaking) as observable state the overlay subscribes to.
- Handle audio-focus conflicts with nav audio and music per UC-VOICE-03.

No UI construction — all voice surfaces come from Sprint 2.

**Components Consumed:**
- `VoiceAssistantOverlay` (Sprint 2 — `UI-051`) — subscribes to emitted listening/speaking state; not built here.
- `PermissionNotification` (Sprint 2 — `UI-031`) — surfaced when `RECORD_AUDIO` permission is denied.

---

### VOI-003 — iOS STT/TTS/audio framework wiring

Wire iOS `SFSpeechRecognizer` + `SFSpeechRecognitionTask`, `AVSpeechSynthesizer` + `AVSpeechUtterance`, and `AVAudioSession` (category `.playAndRecord`, mode `.voiceChat`) + `MPNowPlayingInfoCenter` into the shared intent dispatcher from VOI-001. Parity with VOI-002 on state emission and audio-focus semantics. Use offline `AVSpeechSynthesisVoice` bundles for reliability.

No UI construction — all voice surfaces come from Sprint 2.

**Components Consumed:**
- `VoiceAssistantOverlay` (Sprint 2 — `UI-052`, iOS naming) — subscribes to emitted state.
- `PermissionNotification` (Sprint 2 — `UI-032`) — surfaced when mic permission is denied.

---

### VOI-004 — Voice-surface wiring into STT/TTS pipeline and command dispatch

Wire Sprint-2 `VoiceAssistantOverlay` + `PermissionNotification` + `Banner` + (pending Sprint 2 delta) `VoiceListeningVisualizer` + `AudioQualityMeter` into the STT/TTS pipeline and command dispatcher per UC-VOICE-01 through UC-VOICE-08. Responsibilities:
- Bind overlay state (idle / listening / processing / speaking / degraded) to the state stream emitted by VOI-002 / VOI-003.
- Feed live mic amplitude from the platform STT streams into `VoiceListeningVisualizer`.
- Feed SNR/gain samples from the platform audio sessions into `AudioQualityMeter` so it communicates audio quality per UC-VOICE-08.
- Route the overlay's live transcript from partial STT results; route its cancel/retry affordances back into the dispatcher.
- Route permission rationale into `PermissionNotification` and inline status ("Listening…", ducking notice) into `Banner`.

No visual-primitive construction — all atoms/molecules/organisms come from Sprint 2 (existing or delta). This task fails if `VoiceListeningVisualizer` or `AudioQualityMeter` is not first added to Sprint 2.

**Components Consumed:**
- `VoiceAssistantOverlay` (Sprint 2 — `UI-051` / `UI-052`)
- `PermissionNotification` (Sprint 2)
- `Banner` (Sprint 2)
- `IconSymbol` (Sprint 2) — mic/waveform glyph inside overlay + FAB
- `VoiceListeningVisualizer` (atom, **pending Sprint 2 delta**) — real-time mic-amplitude waveform/orb
- `AudioQualityMeter` (molecule, **pending Sprint 2 delta**) — continuous SNR/gain visualization for motorcycle noise

---

### VOI-005 — Intent dispatch into planning + navigation flows

Wire recognized intents from the dispatcher into the Sprint-4 chat-planning pipeline (UC-VOICE-04) and the Sprint-5 navigation + turn-by-turn flows (UC-VOICE-05). Entity extraction via Convex `voice:parseIntent` action. Ride-control intents (UC-VOICE-06) dispatch into the Sprint-6 recording state machine. Disambiguation prompts route back through the TTS pipeline and overlay.

No UI construction — relies on existing Sprint-4/5/6 surfaces and Sprint-2 overlay.

**Components Consumed:**
- `VoiceAssistantOverlay` (Sprint 2) — host for disambiguation prompts.
- `MapHeaderOverlay` (Sprint 2) — reflects ride-state transitions driven by voice.
- `OverlayPill` (Sprint 2) — "Ride paused" / "Ride resumed" indicator.

---

### VOI-006 — Recovery-path wiring (permission / offline / noisy env)

Wire permission-denied, offline, and degraded-audio recovery paths into the existing overlay + banner surfaces per UC-VOICE-08. Responsibilities:
- On mic-permission denial, route through `PermissionNotification` rationale → request flow; on persistent denial, degrade gracefully with TTS explanation.
- On offline state (no Convex reachability for `voice:parseIntent`), surface through `ConnectionBanner` and fall back to on-device intent templates where available.
- On low SNR / sustained recognition failure, bind `AudioQualityMeter` state to overlay degraded-audio messaging and offer retry / cancel via the overlay's existing affordances.

No UI construction.

**Components Consumed:**
- `PermissionNotification` (Sprint 2)
- `ConnectionBanner` (Sprint 2 — `UI-031` / `UI-032`)
- `Banner` (Sprint 2)
- `VoiceAssistantOverlay` (Sprint 2)
- `AudioQualityMeter` (molecule, **pending Sprint 2 delta**)
