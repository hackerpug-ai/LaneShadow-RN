---
artifact_type: journey_map
author: business-process
date: 2026-04-06
status: draft
---

# Voice-First Rider Journey Map
## LaneShadow — End-to-End Companion Experience

---

## Framing

### The Physical Reality of Motorcycle Riding

Voice is not a convenience feature for motorcycle riders. It is the only interface that works in the conditions where riders actually need help:

- **Helmet on**: touchscreen interaction requires stopping, removing gloves, or operating a helmet-mounted controller with limited precision
- **Gloves on**: thick leather or gauntlet gloves make typing on glass nearly impossible
- **Wind noise**: 60+ mph creates 85–95 dB ambient noise; voice must be helmet-mic quality, not phone speaker
- **Eyes on road**: legal and safety obligation means zero screen attention while moving
- **Vibration**: engine vibration and road texture make precise tapping unreliable at speed
- **Cognitive load**: active riding requires constant attention to traffic, road surface, animals, and hazards
- **Weather changes fast**: what was clear at departure becomes a rain wall 40 minutes in

Voice input resolves all six constraints simultaneously. Text input resolves none of them while riding.

### The V1 Gap

V1 ships text-chat planning (deferred voice to V1.1). This map shows:
1. Where V1 text-chat works well (pre-ride, stationary)
2. Where voice transforms the experience (active ride, real-time adaptation)
3. The "magic moments" that are impossible with text

---

## Journey Overview

```
PHASE 1          PHASE 2          PHASE 3          PHASE 4          PHASE 5
Discovery   →    Planning    →    Departure   →   Active Ride  →   Post-Ride
(Days/Hours      (Minutes         (Gear-up         (Moving,         (Parked,
 before)          before)          moment)          helmet on)        reflective)

Text-chat OK    Text-chat OK    VOICE CRITICAL   VOICE ONLY       Text-chat OK
                                (hands busy)     (safety)         (voice nice)
```

---

## Phase 1: Discovery

**Timeframe**: Days to hours before the ride  
**Location**: Home, office, couch  
**Physical state**: Relaxed, screens available, no gear

### Emotional State

The itch to ride. Something triggered it — a weather forecast, a memory of a road, a day off. The rider has a feeling, not a plan. They want someone to help them turn the feeling into a route without the work of stitching together multiple apps.

> "I want to do something epic this weekend. Maybe the coast? Maybe mountains? I don't know yet."

### V1 Text-Chat Experience

- Opens LaneShadow, sees the map with chat input
- Types: "Scenic 2-hour loop, maybe coastal, leaving from Asheville Saturday morning"
- Agent returns 3 options with weather for Saturday
- Rider browses, taps routes on the map, checks weather badges
- Saves the best one

**Works well.** The rider is stationary, has time, can type freely.

### Voice-First Experience

Same job, but now the interaction is ambient. Rider is making coffee, looking at weather on their phone, thinking out loud:

> "Hey LaneShadow — what's a good 2-hour coastal loop from Asheville for Saturday morning? Avoid slab."

Agent responds through earbuds. Rider can listen while doing something else, ask follow-ups conversationally:

> "How's the weather on the mountain loop option?"
> "Is any of them good for evening instead?"

**Incremental improvement here** — voice adds ambient, hands-free browsing. Not transformative, but noticeably better for discovery while multitasking.

### Key Voice Interactions

| Trigger | Voice Utterance | Agent Response |
|---------|-----------------|----------------|
| Feeling to explore | "Find me something twisty for Saturday" | 3 options with weather spoken + shown on map |
| Comparison | "Tell me more about the mountain one" | Full spoken description: distance, elevation, weather window |
| Refinement | "What about if I leave at 11 instead of 9?" | Re-ranks routes for new departure, speaks winner |
| Discovery | "Which of my saved routes are good this weekend?" | Checks weather against saved library, recommends best match |

### Magic Moment (Discovery)

**"Match the feeling to a route"** — Rider says "I want twisty roads with minimal traffic and good weather this Sunday." Voice agent asks two clarifying questions (duration? starting point?), then returns the best 3 options with spoken reasoning. The rider never typed anything.

---

## Phase 2: Planning

**Timeframe**: 30 minutes to 2 hours before departure  
**Location**: Home, near gear, increasingly focused  
**Physical state**: Checking weather, reviewing the route, mentally preparing

### Emotional State

Anticipation mixed with logistics. Is the weather actually going to cooperate? Should I adjust the departure time? Did I save the route properly? The rider wants to finalize the plan and lock in confidence before gearing up.

> "I'm almost ready. I just want to make sure this route is still the right call with today's forecast."

### V1 Text-Chat Experience

- Opens saved route from library
- Checks weather badge (last updated, may be stale)
- Taps "Re-plan" to refine if needed
- Exports to Google Maps for navigation
- **Pain point**: Weather badge staleness isn't obvious. Rider might not realize conditions shifted since yesterday.

### Voice-First Experience

> "Hey LaneShadow, I'm riding the Coastal Cruiser today at 10 AM. How's the weather looking now?"

Agent fetches live weather against the saved route polyline:
> "Coastal Cruiser at 10 AM looks good. Partly cloudy, light tailwinds from the southwest, 65–70°F through noon. One thing to note — there's a 30% rain chance after 2 PM near Wrightsville Beach, which is about the midpoint. You'll likely beat it if you leave before 10:30."

> "What if I push departure to 11?"

> "At 11 AM, you'd hit the rain window around the halfway point. I'd stick with 10 or consider the Mountain Loop instead, which stays dry all day."

**This is transformative for planning.** The rider gets a conversational briefing that synthesizes route + weather + timing without reading a single screen.

### Key Voice Interactions

| Trigger | Voice Utterance | Agent Response |
|---------|-----------------|----------------|
| Weather check | "How's the Coastal Cruiser looking for 10 AM today?" | Spoken weather brief with timing recommendation |
| Departure optimization | "What's the best time to leave to avoid the rain?" | Agent runs re-ranking across departure windows, speaks best option |
| Route validation | "Is there anything I should know before this ride?" | Highlights worst condition window, any major advisories |
| Backup plan | "What's my best alternative if I want to avoid rain entirely?" | Returns top dry-weather route from current session or saved library |

### Magic Moment (Planning)

**"The 2-minute pre-ride brief"** — Rider gears up, says "LaneShadow, brief me on today's ride." Agent speaks a 30-second summary: route name, distance, departure conditions, one weather heads-up, estimated return time. Rider hears it through helmet speakers while putting on jacket. Nothing to read. Hands are free.

---

## Phase 3: Departure

**Timeframe**: 5–15 minutes before wheels roll  
**Location**: Driveway, parking lot, gas station  
**Physical state**: Helmet on or going on, gloves on or coming on, bike running

### Emotional State

Transition state. The rider is mentally shifting from planning mode to ride mode. Attention is divided between final gear checks, starting the bike, and the plan. This is the highest-friction moment in the V1 text-chat flow.

> "Helmet buckled, gloves on, engine running. Now what?"

### V1 Text-Chat Experience (Critical Failure Point)

- Rider needs to export route to Google Maps before leaving
- **With gloves on**: essentially impossible to navigate the app and deep-link to Maps
- **Without gloves**: removes them, fumbles with phone, re-gloves
- **Helmet visor down**: screen reflection makes reading difficult
- Any last-minute plan change (weather shifted, late start) requires removing gloves, opening app, typing
- **This is where V1 loses riders.** The planning experience was great; the departure handoff is terrible.

### Voice-First Experience

Bike running. Helmet on. Gloves on.

> "LaneShadow, navigate the Coastal Cruiser."

App deep-links to Google Maps with route waypoints loaded. Rider doesn't touch the phone.

> "LaneShadow, quick weather check before I go."

Agent gives 10-second audio brief: "You're good. Clear skies until 1 PM, light headwinds leaving town. Enjoy the ride."

If conditions shifted overnight:
> "LaneShadow, anything changed with today's route?"

Agent: "Heads up — wind picked up to 20 mph sustained. Still rideable, but expect crosswinds on the coastal section from mile 28 to 36. The Mountain Loop is cleaner today if you want to swap."

> "Switch me to Mountain Loop and navigate."

App swaps route, exports to Maps. Rider never touched the screen.

### Key Voice Interactions

| Trigger | Voice Utterance | Agent Response |
|---------|-----------------|----------------|
| Navigate | "Navigate the Coastal Cruiser" | Deep-links to Google Maps, no screen touch required |
| Final check | "Anything I should know before I go?" | 10-second weather brief |
| Last-minute swap | "Switch to the Mountain Loop and navigate" | Route swap + Maps handoff |
| Departure confirm | "Good conditions to leave now?" | Yes/no with one key caveat |

### Magic Moments (Departure)

**"Gloves-on navigation handoff"** — Rider says "navigate" with gloves on, helmet buckled, engine running. Google Maps opens with the route. Zero screen interaction. This experience is physically impossible with text input.

**"Last-second weather pivot"** — Rider is about to leave, notices darker clouds. Voice check takes 10 seconds. Agent catches the 40% rain probability that appeared in the last hour and offers an alternative. Rider makes a better call without pulling out their phone.

---

## Phase 4: Active Ride

**Timeframe**: Duration of ride (1–6 hours)  
**Location**: Moving at speed on the road  
**Physical state**: Helmet on, gloves on, both hands on bars, eyes on road, wind noise 85–95 dB

### Emotional State

Flow state punctuated by friction moments. Most of the ride is pure enjoyment — the wind, the road, the machine. But situations arise that require information: weather changed, a road is closed, rider wants to find a gas stop, someone in the group needs a reroute. Without voice, every one of these requires stopping.

> "I'm in the middle of the best road I've ever ridden. And I need to know if that storm is going to catch me."

### V1 Text-Chat Experience (Does Not Exist During Active Ride)

V1 has no active-ride interaction model. The app's job ends when the rider exports to Google Maps. Any real-time need requires:
1. Finding a safe spot to stop
2. Removing gloves
3. Unlocking phone
4. Opening LaneShadow
5. Typing a question
6. Reading the response
7. Re-gloving and remounting

This is a 3–5 minute interruption for a question that might take 10 seconds to answer with voice. In practice, riders skip it — and sometimes make bad calls as a result.

### Voice-First Experience

Helmet mic. Trigger word or handlebar button. Agent responds through helmet speakers.

**Scenario A — Weather check mid-ride:**
> "LaneShadow, how's the weather ahead?"

Agent: "For the next 40 miles, you're clear. Light scattered clouds after mile 60 — that's about 50 minutes out. No rain expected on your route today."

Rider processes this in 8 seconds without taking hands off bars or eyes off road.

**Scenario B — Route deviation:**
> "LaneShadow, there's a road closure ahead. Find me a detour that stays scenic."

Agent recalculates, returns spoken route update: "I've updated your route. Take US-74 west in 2 miles, then rejoin your original path at the Blue Ridge Parkway entrance. Adds about 12 minutes. Weather stays clear on the detour."

**Scenario C — Gas stop:**
> "LaneShadow, I need gas in the next 20 miles."

Agent: "There's a station at mile 18 — small town called Spruce Pine. One more option at mile 23. Spruce Pine also has a coffee shop if you want a break."

**Scenario D — Group coordination:**
> "LaneShadow, tell me how far back my group is."

(Future feature — requires group tracking. V1.1/V2. But the voice interaction is the right interface for it.)

**Scenario E — Ride memory:**
> "LaneShadow, mark this road as a favorite."

Agent: "Marking your current segment — NC-181 near Pineola — as a favorite. What should I call it?"

> "Call it 'the dragon's back.'"

Agent: "Saved as 'the dragon's back.' You can include it in future route planning."

**This marks a section of road at speed, without stopping, without typing.** Rider never loses flow state.

### Key Voice Interactions

| Trigger | Voice Utterance | Agent Response |
|---------|-----------------|----------------|
| Weather | "How's the weather for the next hour?" | Short spoken forecast aligned to current position |
| Reroute | "Find me a detour, road's closed ahead" | Spoken route update with new turn instruction |
| Gas | "I need gas in the next 15 miles" | Spoken options with distance and town name |
| Favorite | "Mark this road as a favorite" | Confirms segment + requests name |
| Time check | "When do I need to turn back to make it home by 5?" | Calculates turnaround point based on current position and ETA |
| Status | "How far am I from the turnaround point?" | Spoken distance and estimated time |

### Magic Moments (Active Ride)

**"Eyes on road, brain at ease"** — Rider gets a weather update without slowing down, stopping, or removing gloves. This is physically impossible with any touch-based interface. Voice is the only interface that doesn't interrupt the ride.

**"Mark the favorite in the moment"** — Rider is on an incredible stretch of road they've never been on. With text, they might remember to mark it later (they usually won't). With voice, they mark it in real time, give it a name, and it's stored. Future routes will include it. This is the most natural personalization loop possible.

**"The invisible copilot"** — The agent is present but non-intrusive. Rider invokes it when needed, gets a quick answer, returns to riding. No notifications, no push, no visual distraction. Pure request-response when the rider wants it.

### Pain Points Voice Uniquely Resolves

| Pain Point | Text Workaround | Voice Resolution |
|------------|----------------|------------------|
| Can't type with gloves | Stop, remove gloves, type, re-glove | Speak naturally, hands stay on bars |
| Eyes must stay on road | Stop to check screen | Audio response, zero visual attention |
| Wind noise obscures phone audio | N/A — can't use phone while riding | Helmet mic + speakers designed for wind |
| Stopping breaks flow state | Mandatory 3–5 min stop | Question answered in 8–10 seconds, no stop |
| Route closure mid-ride | Stop, reroute manually | Spoken detour with turn instruction |
| Marking favorites in the moment | Remember to do it later (usually forgotten) | Mark at speed with voice confirmation |
| Weather change awareness | Check at gas stop | Proactive brief available on demand |

---

## Phase 5: Post-Ride

**Timeframe**: End of ride through the next day  
**Location**: Parked, home, decompressing  
**Physical state**: Helmet off, gloves off, tired but happy

### Emotional State

Reflective and satisfied. The rider wants to capture what made the ride great before memory fades. They also have opinions about the route — what they'd change, which roads were perfect, which sections to avoid. This is the data that makes future rides better.

> "That was the best road I've ever ridden. I need to remember that."

### V1 Text-Chat Experience

- Opens saved route, adds star rating
- Writes text notes manually
- Marks as ridden
- **Pain point**: If favorites weren't marked during the ride, rider has to hunt for the roads on the map to mark them. Memory is imperfect.

### Voice-First Experience

Bike is parked. Helmet just came off. Rider pulls out phone:

> "LaneShadow, that was a great ride. Rate the Coastal Cruiser 5 stars."

Done. No navigation required.

> "Add a note: fall colors were peak at mile 30. Stop at the waterfall overlook before the tunnel — worth 10 minutes."

Note saved with timestamp and location context.

> "Which roads did I mark as favorites today?"

Agent lists them, offers to include them in the planning default.

> "When's the next good weather window for this route?"

Agent checks forecast and recommends a departure window for the same route in the next 7 days.

**This closes the personalization loop without friction.** The ride generated data. Voice makes capturing and using that data effortless.

### Key Voice Interactions

| Trigger | Voice Utterance | Agent Response |
|---------|-----------------|----------------|
| Rating | "Rate today's ride 5 stars" | Applies rating to most recent / active route |
| Notes | "Add a note: [content]" | Appends to route notes with timestamp |
| Review | "What did I save as favorites today?" | Lists marked segments by name and road |
| Planning | "Find me a similar ride for next weekend" | Generates options based on today's route characteristics and weather |
| Social | "Send this route to Jake" | (V2 feature — but voice is the right interaction) |

### Magic Moment (Post-Ride)

**"The 60-second debrief"** — Rider says: "LaneShadow, debrief me on today's ride." Agent responds: "You rode the Coastal Cruiser — 42 miles, 2 hours 18 minutes, 2,400 feet of elevation. You marked 2 roads as favorites: 'the dragon's back' on NC-181, and 'beach approach' on NC-12. Ready to rate the route or add any notes?"

The entire post-ride capture ritual takes 60 seconds instead of 5 minutes of navigation.

---

## Summary: Where Voice Creates Transformative Value

### The Transformation Matrix

| Phase | V1 Text-Chat | Voice-First | Delta |
|-------|-------------|-------------|-------|
| Discovery | Works well | Ambient, multitask-friendly | Incremental |
| Planning | Works well | Briefing-style, synthesized | Meaningful |
| Departure | Severely broken | Gloves-on, zero-touch handoff | **Transformative** |
| Active Ride | Does not exist | Real-time companion, no stops | **Transformative** |
| Post-Ride | Requires navigation | 60-second debrief | Meaningful |

### The Four Irreplaceable Voice Moments

1. **Gloves-on navigation handoff** (Departure Phase) — Navigate to Maps without touching the screen. Physically impossible with text.

2. **Eyes-on-road weather check** (Active Ride Phase) — Real-time condition awareness without stopping or removing hands from bars. Physically impossible with text.

3. **Mark the favorite in the moment** (Active Ride Phase) — Capture the best roads while on them, not from memory an hour later. Text requires stopping; voice doesn't.

4. **The invisible copilot** (Active Ride Phase) — Request-response on demand, ambient presence otherwise. No notifications, no screen-checks, no interruption to flow state. Text-based interaction doesn't work in this context at all.

### Voice Resolves Structural Pain Points Text Cannot

The core constraint is physical: **riders cannot safely interact with a touchscreen while riding**. Every pain point in the active ride phase traces back to this single constraint. Voice does not improve the text experience — it replaces an experience that doesn't exist with one that does.

The secondary constraint is **gloves**. Gauntlet and leather gloves make touchscreen interaction unreliable even when stationary. This makes departure — already a friction-heavy transition — unnecessarily difficult.

Voice resolves both constraints without requiring the rider to compromise on safety, comfort, or ride quality.

---

## Friction Map by Phase

```
Friction Level (1=low, 5=high)

Phase        Text-Chat    Voice-First
─────────────────────────────────────
Discovery       1             1
Planning        2             1
Departure       5             1
Active Ride     N/A           1
Post-Ride       3             1

Combined        11/20         5/20
```

Text-chat has an acceptable friction profile pre-ride and is completely absent during the ride itself. Voice reduces total journey friction by more than half and enables an entirely new phase of companion interaction.

---

## Implementation Note: V1.1 Priority

Voice is correctly deferred to V1.1 pending quality testing (per 01-scope.md). When it ships, the highest-value interactions to implement first, in order:

1. **Departure navigation handoff** (gloves-on "navigate to X") — resolves the highest-friction V1 failure point
2. **Active ride weather check** (en-route "how's the weather ahead?") — creates the first real-time companion moment
3. **Favorite marking at speed** ("mark this road as a favorite") — closes the personalization loop in the moment
4. **Post-ride debrief** ("debrief me on today's ride") — makes the reflective phase effortless

Discovery and planning voice interactions are valuable but not the primary unlock — text-chat handles those phases adequately.
