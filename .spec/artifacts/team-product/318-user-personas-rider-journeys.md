# Task #318: User Personas & Rider Journeys — On-Device AI

**Author**: ui-designer
**Date**: 2026-04-06
**Sprint**: On-Device AI PRD

---

## Overview

On-device AI changes the LaneShadow value proposition fundamentally for four rider segments. The critical insight that shapes all persona design: **during a ride, the phone screen is inaccessible**. Every persona has different needs pre-ride and post-ride, but mid-ride they share exactly one interface — audio from a helmet speaker triggered by a single button.

---

## Personas

### Persona 1 — Marcus, the ADV Tourer

| Attribute | Detail |
|-----------|--------|
| Age | 41 |
| Bike | BMW R 1250 GS Adventure |
| Riding style | Multi-day adventure touring, off-pavement capable, solo or small group |
| Tech comfort | High — uses navigation apps, GPX tracks, weather apps; comfortable with device setup |
| Riding environment | Remote mountain passes, forest service roads, desert backcountry |
| Signal availability | Frequently none — 2–4 hours without signal per day is normal |
| Privacy sensitivity | Moderate — wants data stored locally; skeptical of cloud dependency |
| Planning style | Meticulous planner: researches routes the night before, downloads maps, checks road conditions |

**Key Needs**
- Full offline functionality — cannot rely on cell signal in the mountains
- Road condition awareness (gravel, washboard, seasonal closures)
- Fuel range management — remote areas between gas stops are long
- Hazard logging while moving so he can warn others in his riding community
- Weather window awareness — mountain weather changes fast

**Pain Points**
- Cloud-dependent apps become "bricks" in canyons and national forests
- Can't safely interact with the phone while navigating technical terrain
- Route replanning mid-ride is dangerous when done manually
- Pulling over every time he needs information breaks ride flow

**Primary On-Device AI Use Cases**
- Download full region map pack + AI model before leaving Wi-Fi
- Mid-ride: "Any gas within 30 miles?" with audio-only answer
- Mid-ride: hazard logging for road conditions ("Gravel on road")
- Pre-ride: refine route with voice instead of typing ("Skip the pavement section near mile 40")

**Signal / Connectivity Situation**
- Pre-ride: always on Wi-Fi the night before (downloads everything)
- During ride: assumes zero signal; cloud fallback not viable
- Post-ride: back on signal at camp or lodging

---

### Persona 2 — Diane, the Weekend Scenic Rider

| Attribute | Detail |
|-----------|--------|
| Age | 34 |
| Bike | Honda Africa Twin (street-oriented setup) |
| Riding style | 2–4 hour weekend rides on paved backroads; scenic priority |
| Tech comfort | Moderate — uses iPhone navigation daily, comfortable with apps but not enthusiast-level |
| Riding environment | Rural state highways, mountain switchbacks, coastal roads |
| Signal availability | Mostly connected but drops for 20–40 minute stretches in canyons |
| Privacy sensitivity | Low — not a concern for her |
| Planning style | Spontaneous — decides Saturday morning, searches for "good roads near me" |

**Key Needs**
- Fast route planning with minimal effort (voice preferred over typing)
- Reliable offline behavior during the canyon gaps
- Scenic discovery — finding roads she hasn't ridden before
- Audio-only updates during ride (has Bluetooth helmet system)
- Simple, friendly voice interaction — not jargon-heavy

**Pain Points**
- Typing a ride description while standing next to the bike is awkward
- App goes silent in canyons and she has no idea what's coming up
- Has missed scenic overlooks because she didn't know they were there
- Post-ride journaling is tedious — never does it

**Primary On-Device AI Use Cases**
- Pre-ride: describe ride with voice ("Two hour loop from here, something scenic, avoid the freeway")
- Mid-ride: "Any viewpoints coming up?" answered in audio
- Mid-ride: spontaneous rerouting ("How far to Ojai?")
- Post-ride: quick voice note about the ride experience

**Signal / Connectivity Situation**
- Pre-ride: connected (home or coffee shop)
- During ride: intermittent — offline capability needed for 20–40 min windows
- Post-ride: connected

---

### Persona 3 — Rafi, the Privacy-First Commuter Touring Crossover

| Attribute | Detail |
|-----------|--------|
| Age | 29 |
| Bike | Kawasaki Z900RS |
| Riding style | Daily commuter who does distance touring on weekends |
| Tech comfort | Power user — developer, understands on-device vs cloud distinction |
| Riding environment | Urban for commuting, mountain highways on weekends |
| Signal availability | Always connected commuting; variable on tours |
| Privacy sensitivity | Very high — does not want ride data sent to cloud servers; prefers local AI |
| Planning style | Mixed — precise for tours, spontaneous for lunch rides |

**Key Needs**
- Explicit on-device processing guarantee — no API calls for voice commands
- Local route history without cloud sync
- Efficient model management (storage-aware, update control)
- Fast response to voice commands — sub-2 second latency
- No subscription dependency for core AI features

**Pain Points**
- Existing AI features require cloud connectivity and account data
- Can't verify where voice data is being processed
- Update mechanisms are opaque — doesn't know when models refresh
- Commute mode and touring mode feel like separate products in other apps

**Primary On-Device AI Use Cases**
- Model management: explicit download, storage display, update control
- Mid-ride: voice commands with confirmed on-device processing badge in UI
- Pre-ride: local route search ("Find my saved coastal routes from last fall")
- All contexts: offline-first with no silent cloud fallback

**Signal / Connectivity Situation**
- Commuting: always connected but prefers on-device regardless
- Touring: variable; treats on-device as the primary mode

---

### Persona 4 — Carol, the Sport Rider Who Hates Admin

| Attribute | Detail |
|-----------|--------|
| Age | 52 |
| Bike | Ducati Multistrada V4 S |
| Riding style | Sport-touring, fast paced, organized group rides, track days |
| Tech comfort | Low — uses iPhone but not a power user; resists setup friction |
| Riding environment | Mountain sport roads, known favorite routes, occasional group tours |
| Signal availability | Usually connected |
| Privacy sensitivity | Low — no concern |
| Planning style | Minimal planner — rides the same proven roads, group decides spontaneously |

**Key Needs**
- Zero configuration to get started — on-device AI should "just work"
- Minimal setup (no model management menus she has to visit)
- Quick re-access to favorite roads without typing
- Group-useful information: road conditions, weather, nearest gas
- Glanceable feedback that voice worked (rides fast; eyes rarely on phone)

**Pain Points**
- App setup and model download flows are intimidating
- Long audio responses while riding are dangerous — she's going fast
- Typing anything on the phone is out of the question
- Too many options in route planning; she wants one good answer, fast

**Primary On-Device AI Use Cases**
- Mid-ride: single-question, single-answer pattern ("Gas in 20 miles?")
- Pre-ride: "Show my favorite mountain loop" (voice recall)
- Automatic model download on first launch — no decision required
- Confirmation chime is enough feedback; she doesn't need audio response for hazard logging

**Signal / Connectivity Situation**
- Usually connected; on-device matters for reliability not privacy

---

## Persona Comparison Table

| Dimension | Marcus (ADV) | Diane (Weekend) | Rafi (Privacy) | Carol (Sport) |
|-----------|--------------|-----------------|----------------|---------------|
| Signal reliability | Low (frequent dead zones) | Moderate (canyon gaps) | High (but prefers local) | High |
| Voice interaction need | High | High | High | High |
| Setup tolerance | High (will configure) | Moderate | High (wants control) | Very low |
| Audio response length | Medium (detailed ok) | Medium | Short | Very short |
| Privacy concern | Moderate | Low | Very high | Low |
| Offline criticality | Mission-critical | Important | Philosophical | Nice-to-have |
| Post-ride journaling | Moderate interest | Low | Low | None |
| Planning style | Night-before | Same-morning | Mixed | Last-minute |

---

## Journey Maps

### Marcus — ADV Tourer Journey

**Pre-Ride (evening before)**
1. Opens app on home Wi-Fi
2. Describes next day's ride in chat: "Loop through Los Padres National Forest, 4 hours, gravel OK"
3. Agent generates 2–3 route alternatives with offline map download prompts
4. Downloads full region map pack and AI model update (Wi-Fi enforced)
5. Reviews route details, hazard markers from community, weather window
6. Sets bike profile: fuel range 220 miles, prefers unpaved when available

**Mid-Ride (in the backcountry, zero signal)**
1. Helmet button tap: "Gas within 40 miles?"
2. Audio: "Two stations — Frazier Park at 28 miles, Gorman at 41 miles"
3. Continues riding
4. Helmet button tap: "Gravel starting" — no audio needed, chime confirms hazard logged
5. Helmet button tap: "Any closures on this road?"
6. Audio: "No closures in cached data. Last updated yesterday."
7. Reaches fuel stop — no interaction needed

**Post-Ride (back at camp with signal)**
1. Opens app — signal restored, hazard logs sync
2. Reviews ride on map
3. Rates route: 4 stars, voice note: "Washboard on mile 22, avoid in spring"
4. Route saved with notes and community hazard published

---

### Diane — Weekend Scenic Rider Journey

**Pre-Ride (Saturday morning, coffee in hand)**
1. Opens app, sees map centered on her location
2. Taps microphone: "Two hour loop from here, something scenic, no freeway"
3. Agent generates options, reads top option aloud via Bluetooth speaker
4. Confirms: "That one"
5. Map shows route, she puts phone away

**Mid-Ride (rural canyon, signal drops)**
1. Riding, enjoying the road
2. Helmet button tap: "Anything to see coming up?"
3. Audio: "Scenic overlook in 3 miles on the right — Painted Rock Vista"
4. Finds the overlook, takes a break
5. Helmet button tap: "How far to the next town?"
6. Audio: "Ojai is 9 miles ahead"
7. Signal returns as she descends

**Post-Ride (back home)**
1. App shows ride summary
2. Prompted for quick rating — taps 5 stars
3. AI auto-generates journal entry based on route, POIs, and duration
4. She approves and saves it

---

### Rafi — Privacy-First Journey

**Pre-Ride (any day)**
1. Opens app — sees on-device processing badge indicating local model active
2. Voice or types route request
3. Reviews model status: which version, storage used, last update date
4. Sets preference: "Never send voice to cloud"
5. Confirms route, maps downloaded locally

**Mid-Ride**
1. Helmet button tap: voice command processed locally
2. Response time < 2 seconds
3. UI shows on-device indicator even when screen is not visible (for peace of mind at stops)

**Post-Ride**
1. Reviews route history — all stored locally
2. Checks what data was logged during the ride
3. Explicitly approves or deletes any data before sync (opt-in sync only)

---

### Carol — Sport Rider Journey

**Pre-Ride (quick, 3 minutes)**
1. Opens app on first launch — model downloads automatically in background
2. No setup required — location detected, ready to go
3. Taps mic: "My mountain loop" — agent finds saved favorite route
4. Starts ride

**Mid-Ride (fast pace, minimal interaction)**
1. Helmet button tap: "Gas?"
2. Audio: "Shell, 6 miles — right on your route"
3. One chime = command received. Back to riding.

**Post-Ride**
1. App closes. Done.

---

## Key Design Implications from Personas

1. **Audio responses must have a length tier system** — Marcus can handle 10 seconds, Carol needs 4 seconds maximum. Response verbosity should adapt to the command type and rider speed context.

2. **Setup friction is the #1 barrier for Carol-type riders** — the first-launch experience must hide all model management behind an automatic download. Advanced controls exist but are not surfaced by default.

3. **On-device processing badge is a product feature for Rafi** — it is not just a status indicator; it is a trust signal that affects adoption for the privacy-conscious segment.

4. **Offline reliability is mission-critical for Marcus** — not a nice-to-have. Full offline voice + routing must work without degradation. Cloud dependency for voice is a dealbreaker.

5. **Post-ride journaling is low motivation across all personas** — the feature must be nearly automatic (AI-generated draft, one-tap approve) or it will not be used.

6. **The single-command pattern is universal** — all four personas want command → response, not a conversation. Multi-turn dialogue is appropriate only pre-ride.
