# Product Team Report: Voice-First AI Ride Companion

**Date**: 2026-04-06
**Team**: product-manager, business-process, engineering-manager, ui-designer

---

## Objective

Explore what a voice-first AI-driven ride companion would look like for LaneShadow, building on v1's conversational planning architecture and "Ride the Moment" vision.

## Deliverables

### 1. JTBD Analysis — Voice-First Ride Companion
**Author**: product-manager
**File**: .spec/artifacts/team-product/voice-jtbd-analysis.md

Identified 5 core jobs voice uniquely solves for motorcycle riders: in-ride re-routing, live conditions checks, capturing ride moments at speed, group coordination, and post-ride debrief. Key insight: voice is not a convenience feature for motorcyclists — during active riding, it is the **only viable input modality**. Text is physically unavailable (gloves, helmet, eyes on road). Voice transforms LaneShadow from a planning tool into a riding companion that persists across the full ride arc.

### 2. Rider Journey Map — Voice Companion Touchpoints
**Author**: business-process
**File**: .spec/artifacts/team-product/voice-rider-journey.md

Mapped the complete rider journey across 5 phases (Discovery, Planning, Departure, Active Ride, Post-Ride). Text-chat works well pre-ride but is "severely broken" at departure (gloves on) and completely absent during active riding. Voice reduces total journey friction from 11/20 to 5/20. Identified 4 irreplaceable voice moments: gloves-on navigation handoff, eyes-on-road weather check, marking favorites in the moment, and the invisible copilot pattern.

### 3. Technical Feasibility Assessment
**Author**: engineering-manager
**File**: .spec/artifacts/team-product/voice-tech-feasibility.md

Voice-first is **technically feasible** with a phased approach. V1.1 (3-4 weeks): PTT via Bluetooth helmet button, cloud STT (Whisper API), on-device TTS (expo-speech), no wake word. V2 (8-12 weeks): custom wake word (Porcupine), on-device STT with motorcycle-fine-tuned model, streaming TTS. Hardest problems are physics, not software: engine noise 80-100 dB, wind noise 85-95 dB at highway speed. PTT with helmet boom mic achieves 85-92% accuracy via Whisper API. Backend requires zero architectural changes — voice is a new I/O layer on existing pi core agent.

### 4. Voice-First UX Patterns and Wireframes
**Author**: ui-designer
**File**: .spec/artifacts/team-product/voice-ux-patterns.md

Designed comprehensive voice interaction model: press-and-hold activation (glove-safe), 4-state flow (IDLE/LISTENING/PROCESSING/SPEAKING), riding mode (full-screen map + single large VOICE button), multimodal text/voice coexistence. Defined AI personality "Shadow" — terse, confident, rider-aware. All responses follow the 3-second rule in riding mode. State machine extension adds 4 new PlanningStatus values that layer onto V1 architecture without breaking changes. Includes full ASCII wireframes for all states.

---

## Cross-Team Insights

- **All 4 agents converged on PTT as the V1.1 approach.** Wake word is unanimously deferred due to motorcycle noise (85-95 dB at highway speed makes false-trigger rates unacceptable without a custom noise model).

- **"Active Ride" is the transformative phase.** Product-manager, business-process, and ui-designer all independently identified that voice's primary unlock is during riding — not pre-ride planning where text-chat works fine. The engineering-manager's latency analysis validates this but flags route generation time (8-12s) as the bottleneck for mid-ride commands.

- **The architecture is ready.** Engineering-manager confirmed the existing pi core agent session, Convex backend, and parseNaturalLanguageInput action require zero changes. Voice is literally a new input/output channel on the existing pipeline — the v1 investment in conversational infrastructure pays off directly.

- **The "Shadow" persona creates product differentiation.** The ui-designer's personality spec (terse, confident, rider-aware) directly embodies the JTBD insights from product-manager — an experienced riding partner, not a customer service bot. This is a moat no competitor currently offers.

- **Voice captures data that text never will.** Business-process and product-manager both identified that voice enables a personalization loop (marking favorites, voice notes, ratings) that text-based post-ride logging almost never achieves due to friction. This data flywheel is the long-term retention driver.

---

## Recommended Next Steps

1. **Resolve the V1.1 operating context question** — Owner: product-manager + engineering-manager. Is voice scoped to parked/stopped use (low-risk, 3-4 weeks) or must it work at highway speed (high-risk, requires noise-robustness investment)? The team recommends parked/low-speed for V1.1 with progressive expansion.

2. **Create a V1.1 Voice PRD** — Owner: product-manager. Formalize the V1.1 voice scope based on these deliverables, focused on the P0 features: departure navigation handoff and pre-ride voice planning. Store in `.spec/prds/v1.1/`.

3. **Prototype PTT + Whisper on a real helmet system** — Owner: engineering-manager. Build a minimal proof-of-concept with expo-speech-recognition + Whisper API + a Cardo/Sena helmet to validate accuracy numbers before committing to full V1.1 implementation.

4. **Design the voice_command_log schema** — Owner: engineering-manager. The logging table is the most important V1.1 investment for building the motorcycle noise dataset needed for V2 on-device STT.

5. **Run `/kb-project-plan`** — Owner: user. Once the V1.1 Voice PRD is written, generate task files for execution.
