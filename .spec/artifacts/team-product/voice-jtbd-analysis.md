---
artifact_type: jtbd-analysis
created: 2026-04-06
author: product-manager
team: product-voice-companion
status: DRAFT
---

# Voice-First Ride Companion — JTBD Analysis

## Purpose

This document frames the Jobs-to-Be-Done that voice uniquely solves for motorcycle riders, identifies opportunity gaps that v1's text-chat approach cannot address, and articulates how voice transforms the "Ride the Moment" vision into a genuine riding companion.

---

## Physical Reality: Why Voice Is Different for Motorcycle Riders

Before any JTBD framing, the physical constraints of motorcycle riding must be understood. They are not edge cases — they define the entire interaction model.

| Physical Constraint | Impact on Interaction |
|---------------------|-----------------------|
| Both hands on handlebars | No free hand to hold or type |
| Full-face helmet | Voice muffled; wind and road noise at 40–80 dB |
| Gloves (often thick leather or textile) | Touchscreen interaction is unreliable or impossible |
| Eyes on road at speed | Cannot look down at phone; glances only |
| Cognitive load at speed | Decision-making bandwidth is limited; must be brief |
| Helmet Bluetooth (Sena, Cardo) | High-quality audio in/out already present for most riders |

Voice is not a "convenient alternative" for motorcycle riders. During an active ride, voice is the **only viable input modality**. Text is physically unavailable.

---

## Core Jobs-to-Be-Done

### JTBD-01: Route Adjustment While Riding

**Job Statement**: "When I'm on a ride and my plan isn't working anymore, I want to adjust my route without stopping, so I can keep riding."

**The Real Situation**: A rider is 45 minutes into a planned route. Weather changed. The road ahead looks sketchy. A friend called and said the mountain pass is closed. The rider needs a new plan — but they cannot pull over safely, cannot remove gloves, and cannot look at their phone.

**What text-chat (v1) provides**: Nothing. The text chat interface requires two hands, eyes off the road, and glove removal. It is not usable mid-ride.

**What voice uniquely solves**: A single voice command — "Find me an alternate route back, avoid the 17" — can trigger full route regeneration while the rider keeps both hands on the bars and eyes on the road.

**Four Forces**:
| Force | Finding |
|-------|---------|
| Push (away from current) | Stopping mid-ride to use phone destroys flow state and takes 3–5 minutes; dangerous on roadside |
| Pull (toward voice) | Helmet Bluetooth is already in place; voice is zero friction in context |
| Anxiety (about voice) | Wind noise accuracy; false triggers at speed; privacy in group rides |
| Habit (of current) | Riders pull over, check Google Maps, and mentally re-plan — flow is completely broken |

---

### JTBD-02: Live Conditions Check Without Stopping

**Job Statement**: "When I'm riding and something feels off about the weather ahead, I want to know if it's going to get worse, so I can decide whether to push through or turn around."

**The Real Situation**: It's overcast, the temperature is dropping, and the rider sees dark clouds ahead over the ridge. They need a weather status update — not a full re-plan, just a quick check. Is that a passing shower or an all-day system?

**What text-chat (v1) provides**: Nothing while riding. The weather overlay is a planning tool used before departure.

**What voice uniquely solves**: "What's the weather like in the next 20 miles?" returns a spoken summary: "Light rain expected in about 8 miles, clears after 15 miles. Shouldn't need to stop." The rider makes an informed decision in 5 seconds without stopping.

**Four Forces**:
| Force | Finding |
|-------|---------|
| Push | Uncertainty about weather ahead is anxiety-inducing; riders either push through recklessly or stop unnecessarily |
| Pull | Real-time weather spoken into the helmet = confidence; mirrors what an experienced riding partner would say |
| Anxiety | Accuracy of spoken weather vs. visual overlay; wants data, not just vibes |
| Habit | Riders check weather app before leaving, then fly blind; any in-ride check requires a full stop |

---

### JTBD-03: Capturing Ride Moments Without Breaking Flow

**Job Statement**: "When I find a road or spot I want to remember, I want to capture it immediately, so I can come back without having to reconstruct where I was."

**The Real Situation**: A rider crests a hill and the view is perfect. They just turned onto a road they've never been on that feels ideal — the right curve radius, the right surface, no traffic. This is the segment they want to mark as a favorite. In v1, saving a segment requires long-pressing a map polyline — impossible while moving.

**What text-chat (v1) provides**: Post-ride saving only. The moment passes; the rider tries to reconstruct it from memory and usually fails to capture the exact segment.

**What voice uniquely solves**: "Mark this road as a favorite" — spoken mid-ride — captures the current GPS position and the road segment in context. "Save this spot" with a simple confirmation creates a waypoint. The moment is captured in real time.

**Four Forces**:
| Force | Finding |
|-------|---------|
| Push | Forgetting a great road/spot is genuinely disappointing — riders mention this repeatedly as a pain point |
| Pull | Zero-friction capture that preserves the mental state and location exactly as experienced |
| Anxiety | Accuracy of "current road" detection; ambiguity about exactly what segment is being saved |
| Habit | Photos as location markers; mental note-making ("it was about 20 miles past Gilroy on 152"); often results in nothing saved |

---

### JTBD-04: Checking In With a Riding Partner or Group

**Job Statement**: "When I'm on a long ride with others or someone is tracking me, I want to share my status without stopping the bike, so the group stays coordinated and my people don't worry."

**The Real Situation**: A rider is on a 6-hour solo tour. Their partner at home wants a check-in. The ride group split at a fork and need to regroup. A friend is waiting at a diner 10 miles ahead.

**What text-chat (v1) provides**: Nothing. No communication features exist in v1. And even if they did, texting while riding is illegal and dangerous.

**What voice uniquely solves**: "Send my location to Sarah" or "Tell the group I'm 15 minutes out" — spoken commands that dispatch messages without hands. This is table-stakes for any ride companion product used on longer rides.

**Four Forces**:
| Force | Finding |
|-------|---------|
| Push | Stopping to text is the only safe option today; breaks the ride completely |
| Pull | Voice messaging is already normalized via Siri/Google Assistant for car drivers |
| Anxiety | Privacy (always-listening); accidental sends; group/contact management complexity |
| Habit | Riders pull over, text quickly, feel slightly guilty about it, then resume |

---

### JTBD-05: Post-Ride Debrief Without Memory Loss

**Job Statement**: "When I finish a ride, I want to capture what happened while it's fresh, so I can improve my planning and remember what made the ride great."

**The Real Situation**: A rider pulls into the garage after a 4-hour ride. They want to note that the road past Boulder Creek was excellent but the descent on the 236 had construction. They want to rate the route. They have opinions while sitting on the bike — but by the time they unlock the phone, open the app, and navigate to the route, the moment has passed and they'll add a 4-star rating with no notes.

**What text-chat (v1) provides**: Manual rating and text notes on saved routes — but only after navigating to the saved route in the library. By then, most riders have moved on.

**What voice uniquely solves**: "Rate today's ride 4 stars, note that the 236 descent has construction" — captured the moment the engine turns off, before the helmet comes off. Voice removes the friction that causes most post-ride logging to not happen.

**Four Forces**:
| Force | Finding |
|-------|---------|
| Push | Text note entry on mobile is slow; the moment the phone comes out the mood is broken |
| Pull | Voice journaling is natural and fast — humans debrief verbally, not by typing |
| Anxiety | Privacy of voice recordings; ambiguity in note interpretation; data quality |
| Habit | Riders either skip post-ride logging entirely, or add star ratings only with no notes |

---

## Opportunity Gaps: What Text-Chat Fundamentally Cannot Do

| Gap | Text-Chat Limitation | Voice Capability |
|-----|----------------------|-----------------|
| **In-ride re-routing** | Requires two hands, eyes off road, glove removal | Hands-free, eyes-free, instant |
| **Live conditions query** | Not usable at speed | Single spoken question, spoken answer |
| **Real-time capture** | Long-press on polyline requires stopping | "Mark this" while in motion |
| **Group coordination** | No communication features; texting requires full stop | Voice-dispatched messages |
| **Post-ride logging** | Requires app navigation after the fact | Immediate voice capture at ride end |
| **Ambient awareness** | App is passive until opened | Proactive voice alerts for conditions changes |
| **Emotional/contextual notes** | Text fields strip emotion; never used while in the zone | Voice captures mood, context, spontaneous reactions |

The pattern is consistent: text-chat serves **planning** (before the ride, phone in hand). Voice serves **riding** (during and immediately after, body committed to the bike).

---

## Feature Set by Ride Phase

### Pre-Ride (Voice as Speed Layer)

Voice does not replace text-chat here — text is fine when the rider is stationary. Voice accelerates it.

| Feature | Voice Job | Example Command |
|---------|-----------|-----------------|
| Quick plan trigger | Start planning without opening keyboard | "Plan a 2-hour scenic ride from here" |
| Refinement by voice | Faster iteration than typing | "Make it longer, avoid the highway" |
| Route confirmation | Confirm selected route before departing | "Start the Coastal Cruiser route" |
| Conditions brief | Get a spoken weather summary | "What are conditions like for the Mountain Loop?" |

### Active Ride (Voice as Only Input)

This is the core unlock. Everything here is impossible or unsafe with text.

| Feature | Voice Job | Example Command |
|---------|-----------|-----------------|
| In-ride re-routing | Adjust route without stopping | "Find an alternate route, I need to avoid the 17" |
| Live weather check | Conditions query en route | "What's the weather ahead for the next 30 miles?" |
| Segment capture | Save current road as favorite | "Mark this road as a favorite" |
| Waypoint logging | Pin a location while moving | "Save this spot, I want to come back" |
| Group status | Coordinate without stopping | "Message the group: I'm 10 minutes behind" |
| Proactive alerts | System-initiated voice warnings | "Rain expected in 12 miles. Consider turning back at Skyline." |

### Post-Ride (Voice as Debrief Layer)

Captures the moment before it fades.

| Feature | Voice Job | Example Command |
|---------|-----------|-----------------|
| Ride rating | Rate immediately at ride end | "Rate this ride 5 stars" |
| Voice note | Annotate what happened | "Add a note: the 35 past Felton is perfect, no traffic on Sunday mornings" |
| Route save | Save from voice | "Save this route as Sunday Morning Loop" |
| Segment feedback | Flag road issues | "Flag the descent on the 236, there's construction" |
| Next ride seed | Immediately start the next plan | "Next weekend I want something more challenging — save that idea" |

---

## How Voice Transforms "Ride the Moment"

### V1's Vision: Planning Tool That Lives on the Map

V1's gate test is pre-ride: "A rider opens the app, types 'scenic 2-hour ride to Santa Cruz, avoid highways', and sees 3 route options." The app is a **planning artifact**. It lives on the screen. The rider interacts with it before departing.

This is genuine value. But it ends at departure.

### V1.1 Voice Companion: The Copilot That Rides With You

Voice transforms LaneShadow from a planning artifact into a **riding companion** — something that has a relationship with the rider across the full arc of a ride.

The metaphor shifts from "ChatGPT with a map" to "experienced riding partner in your helmet." An experienced riding partner:
- Notices when conditions change and tells you proactively
- Takes note of roads you respond to (elevation, curves, vistas)
- Answers "is this going to get worse?" without making you pull over
- Captures "remember this road" without you having to stop
- Debrief with you at the end: "that descent was sketchy, right?"

None of these interactions happen through text. All of them happen through voice.

### The Emotional Shift

The "Ride the Moment" tagline implies presence and spontaneity. V1's text-chat planning is excellent — but planning is fundamentally anticipatory. You're thinking about the ride you want to have.

Voice during the ride is entirely present-tense. You're experiencing the ride and the companion is experiencing it with you. That is a categorically different product.

### Architectural Continuity

Voice in V1.1 is not a separate system. It is the same pi core agent session with a new input/output channel:
- Same conversation state machine
- Same route generation pipeline
- Same session persistence
- New: speech-to-text input processing, text-to-speech output, wake word or push-to-talk trigger

The v1 investment in agentic conversational infrastructure is the exact foundation that makes voice a bolt-on addition rather than a ground-up rebuild. The agent already understands "find an alternate route avoiding the 17" — voice just delivers that intent in a new form.

---

## Summary: The Core Voice Proposition

Voice for LaneShadow motorcycle riders is not a convenience feature. It is access.

A rider in motion with gloves on in a helmet has zero access to the text-chat interface. Voice does not improve the planning experience — it opens an entirely new arc of the product that today has no coverage: the active ride and immediate post-ride window.

The jobs that voice solves are real, critical, and currently unserved by any competitor. They represent the second product layer that converts LaneShadow from "the app I use to plan rides" to "the app that rides with me."

---

## Suggested V1.1 Sequencing

| Priority | Feature | Rationale |
|----------|---------|-----------|
| P0 | In-ride re-routing via voice | Highest-value, highest-safety-impact job |
| P0 | Live weather check via voice | Directly extends existing weather infrastructure |
| P1 | Segment/waypoint capture via voice | Extends existing favorites infrastructure |
| P1 | Post-ride voice notes + rating | Low complexity, high retention impact |
| P2 | Proactive ride alerts | Requires ambient mode architecture |
| P3 | Group coordination (location sharing) | New infrastructure; high value for retention |

P0 items are achievable with the pi core session infrastructure already being built for V1. The agent already understands re-routing intent and weather queries — voice adds STT/TTS I/O and a helmet-optimized confirmation pattern.
