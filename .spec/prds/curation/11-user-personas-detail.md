---
stability: PRODUCT_CONTEXT
last_validated: 2026-04-10
prd_version: 1.0.0
---

# User Personas for Curation — Route Discovery

**Contributors:** ui-designer, product-manager

This document provides detailed user personas, needs, pain points, and journey maps that inform the curation feature design and implementation.

---

## 1. Detailed User Personas

### Persona 1: "Trailblazer Tom" — Adventure Rider

**Demographics:** Male, 35-50, owns an adventure bike (GS Africa Twin, Tenere). Rides weekends + 1-2 weeklong trips per year. Intermediate-to-advanced skill level.

**Psychographics:** Values solitude and self-reliance. Plans trips around scenery and remoteness. Watches Long Way Round on repeat. Has a YouTube subscription to Itchy Boots.

**Goals:**
- Find unpaved, remote routes that feel like expeditions
- Discover BDR-style routes in states he hasn't ridden yet
- Avoid routes that are "just highways with a view"

**Discovery Behavior:**
- Currently browses ADVRider forums, BDR maps, YouTube vlogs
- Spends 2-4 hours researching before a trip across multiple tabs
- Saves routes to Google My Maps or Gaia GPS manually

**Archetype Affinity:** Adventure, Desert, Mountain Epic

**Key Quote:** "I drove 6 hours to ride a 'scenic byway' that turned out to be a divided highway with a view. Never again."

---

### Persona 2: "Canyon Cara" — Sport Rider

**Demographics:** Female, 28-40, rides a sport bike or naked bike (MT-07, Ninja 650). Rides every weekend weather permits. Advanced rider, track day experience.

**Psychographics:** Thrill-seeking. Chases the perfect curve. Values road quality above all else. Posts GoPro footage to Instagram. Knows her local twisties by heart but craves new challenges.

**Goals:**
- Find roads ranked by curvature and technical challenge
- Discover roads with good pavement quality and minimal traffic
- Quickly assess whether a route is "worth the trailer ride"

**Discovery Behavior:**
- Follows motorcycleroads.com, watches twisty road compilations on YouTube
- Asks riding buddies for recommendations in group chats
- Has ridden all local favorites and is stale for new options

**Archetype Affinity:** Twisties, Mountain Epic

**Key Quote:** "Every app shows me 'scenic routes' that are straight as an arrow. I don't want scenery, I want corners."

---

### Persona 3: "Highway Hank" — Touring Rider

**Demographics:** Male, 45-60, rides a touring bike (Gold Wing, Road Glide). Multi-day trips are the norm. 10,000+ miles per year. Rides with a partner or small group.

**Psychographics:** Values comfort, scenery, and points of interest. Plans routes around fuel stops, food, and lodging. Appreciates history and culture along the route. Not in a hurry.

**Goals:**
- Find scenic multi-day routes with good road conditions
- Discover National Scenic Byways and historic routes
- Avoid interstates and boring stretches between good segments

**Discovery Behavior:**
- Reads Rider Magazine, watches motorcycle travel documentaries
- Plans trips around FHWA scenic designations
- Uses a mix of Google Maps and dedicated moto apps

**Archetype Affinity:** Scenic Byway, Coastal, Mountain Epic

**Key Quote:** "I want to cross the country on roads worth remembering, not just roads that get me there."

---

### Persona 4: "Shortcut Sam" — Local Explorer

**Demographics:** Any gender, 25-55, rides whatever they own. Rides 1-3 times per week within 100 miles of home. All skill levels.

**Psychographics:** Time-constrained. Wants maximum riding enjoyment in minimum planning time. Spontaneous. Checks weather and decides to ride same day. Already knows the "greatest hits" locally.

**Goals:**
- Find great rides near home without extensive research
- Discover hidden gems they haven't already ridden
- Get ride suggestions that match available time (1hr, 2hr, half-day)

**Discovery Behavior:**
- Currently rides the same 3-5 loops repeatedly
- Occasionally searches "best motorcycle roads near [city]"
- Relies on word of mouth from riding friends

**Archetype Affinity:** All archetypes, filtered by proximity

**Key Quote:** "I've got 2 hours before dinner. Show me something good I haven't ridden yet."

---

## 2. User Needs (by priority)

### Universal Needs (all personas)
1. **Instant route suggestions** — Zero-config discovery; open the app and see great rides nearby
2. **Archetype filtering** — Filter by ride type (twisties, mountain, coastal, etc.) to match mood
3. **Route quality scoring** — Trust that suggested routes are genuinely good, not just nearby
4. **Offline access** — Routes available without cell signal (critical for adventure/touring)
5. **Map integration** — See routes on the map they already use for navigation
6. **Quick assessment** — Understand a route's character in under 5 seconds (score, distance, archetype badge)

### Persona-Specific Needs

| Need | Persona | Priority |
|------|---------|----------|
| Surface type indicator (paved/gravel/dirt) | Adventure Rider | Critical |
| Curvature score prominently displayed | Sport Rider | Critical |
| Multi-day route linking | Touring Rider | High |
| Time-based filtering (1hr/2hr/half-day) | Local Explorer | Critical |
| Proximity-based sorting | Local Explorer | Critical |
| Distance and estimated ride time | All | High |
| Elevation profile preview | Sport, Adventure | High |
| Scenic designation badges | Touring | Medium |
| Traffic level indicator | Sport, Touring | Medium |
| Remoteness indicator | Adventure | Medium |
| Points of interest along route | Touring | Medium |

---

## 3. Pain Points with Current Solutions

### Pain Point 1: Scattered Sources
**Who:** All personas
**Current behavior:** Riders search motorcycleroads.com, bestbikingroads.com, ADVRider forums, YouTube, Reddit, Google Maps, and moto magazines separately.
**Pain:** 2-4 hours of research across 5+ sources for a single day ride. Information is fragmented, inconsistent, and often outdated.

### Pain Point 2: No Quality Standardization
**Who:** All personas (especially Sport Rider)
**Current behavior:** Each source uses different rating criteria. A "5-star" road on one site might be a "2-star" on another.
**Pain:** No way to compare route quality across sources. Riders waste time on overhyped routes.

### Pain Point 3: "Scenic" Does Not Mean "Fun"
**Who:** Sport Rider, Adventure Rider
**Current behavior:** Most apps and websites optimize for scenery, not riding quality.
**Pain:** Curvy road databases don't exist. A scenic byway can be 100 miles of straight road with a pretty view. Riders feel misled.

### Pain Point 4: Cold Start / No Local Knowledge
**Who:** All personas in unfamiliar areas
**Current behavior:** Riders traveling to new regions have zero local intel.
**Pain:** hotel in a new state, looking at Google Maps, no idea which roads are worth riding. No local riders to ask.

### Pain Point 5: Planning Paralysis
**Who:** Local Explorer, Touring Rider
**Current behavior:** Too many options, no way to filter by what matters (time, distance, archetype).
**Pain:** Rider has 2 free hours but can't find a route that fits. Ends up riding the same loop again.

### Pain Point 6: No Offline Access
**Who:** Adventure Rider, Touring Rider
**Current behavior:** Most route websites require internet. Routes in remote areas can't be loaded.
**Pain:** Discovered a route online, driving to the start, no cell service, route won't load.

---

## 4. User Journeys for Route Discovery

### Journey 1: "Something New Nearby" (Local Explorer — most frequent journey)

**Trigger:** Sam has a free Saturday afternoon, wants to ride.

```
Step 1: OPEN APP
  -> Sees map with nearby route pins (within 100mi)
  -> Top 3 "Recommended for you" cards shown as overlay

Step 2: BROWSE BY ARCHETYPE
  -> Taps archetype filter chips: "Twisties" selected
  -> Map re-pins with only twisty routes nearby
  -> Cards update to show matching routes sorted by score

Step 3: ASSESS A ROUTE
  -> Taps a route card
  -> Sees: Name, composite score (8.4/10), distance (47mi),
     estimated time (1.5hr), curvature rating, elevation chart
  -> Archetype badge: "Twisties" in copper accent

Step 4: PREVIEW ON MAP
  -> Taps "Show on Map"
  -> Route polyline drawn on map with start/end markers
  -> Can pinch/zoom to see route path detail

Step 5: DECIDE
  -> Two paths:
     a) "Ride This" -> transitions to route planning mode (existing flow)
     b) "Save for Later" -> adds to saved routes
     c) Swipe/back -> continue browsing
```

**Success metric:** Sam finds and starts a new route within 90 seconds of opening the app.

---

### Journey 2: "Trip Planning" (Touring Rider — highest value journey)

**Trigger:** Hank is planning a 5-day ride through the Rockies.

```
Step 1: OPEN DISCOVERY
  -> Navigates to discovery from menu
  -> Sees search bar + filter options

Step 2: FILTER BY REGION
  -> Searches "Colorado" or pans map to region
  -> Filters: "Mountain Epic" + "Scenic Byway" archetypes
  -> Sorts by composite score descending

Step 3: BROWSE TOP ROUTES
  -> Sees ranked list of Colorado routes
  -> Each card shows: name, score, distance, archetype, scenic designation
  -> Routes with FHWA Scenic Byway badge shown with special indicator

Step 4: COMPARE ROUTES
  -> Selects 2-3 routes
  -> Compares side-by-side (or sequentially via cards)
  -> Checks elevation profiles, distance, estimated time

Step 5: SAVE TO PLAN
  -> Saves selected routes to "Colorado Trip" collection
  -> Can later link them into a multi-day itinerary
  -> Routes available offline after save
```

**Success metric:** Hank builds a 5-day route plan from curated discovery in under 30 minutes.

---

### Journey 3: "Quick Thrill" (Sport Rider — highest engagement journey)

**Trigger:** Cara wants maximum corners this weekend.

```
Step 1: OPEN APP
  -> Immediately sees "Best Twisties Near You" section
  -> Routes ranked by curvature score, not just proximity

Step 2: FILTER FOR QUALITY
  -> Selects "Twisties" archetype
  -> Filters: minimum score 7.0+, paved only
  -> Sorts by curvature score (not composite)

Step 3: QUICK SCAN
  -> Cards show curvature rating prominently (not buried)
  -> Surface quality badge: "Paved, Good Condition"
  -> Traffic level: "Low (weekend)"

Step 4: PREVIEW AND COMMIT
  -> Taps card -> sees detailed curvature heatmap
  -> "This route has 147 turns in 32 miles"
  -> Taps "Ride This" -> launches navigation
```

**Success metric:** Cara finds and launches a high-curvature route in under 60 seconds.

---

### Journey 4: "Expedition Planning" (Adventure Rider — longest journey)

**Trigger:** Tom is planning a weeklong off-pavement adventure.

```
Step 1: BROWSE BY ARCHETYPE
  -> Selects "Adventure" archetype
  -> Sees BDR routes, unpaved passes, desert crossings
  -> Each card shows surface type breakdown (%paved/%gravel/%dirt)

Step 2: FILTER BY STATE/REGION
  -> Selects target state or draws region on map
  -> Routes within region populate

Step 3: ASSESS SUITABILITY
  -> Checks remoteness score
  -> Reviews surface type (gravel/dirt percentage)
  -> Notes fuel stop proximity
  -> Reads any available route description

Step 4: SAVE AND SYNC
  -> Saves route for offline access
  -> Downloads map region for offline use
  -> Route appears in "My Routes" with "Adventure" badge
```

**Success metric:** Tom discovers and saves an adventure-worthy route in an unfamiliar state within 5 minutes.

---

## 5. UI Implications Summary

These personas and journeys drive the following UI requirements:

| Journey | Primary UI Pattern | Key Component |
|---------|-------------------|---------------|
| Something New Nearby | Map overlay with nearby pins + cards | Discovery overlay on home map |
| Trip Planning | Full discovery screen with search + filters | Discovery subpage (SubpageLayout) |
| Quick Thrill | Single-archetype fast path + sort | Archetype chip filters + score sort |
| Expedition Planning | Region browse + detailed route cards | Region search + detail modal |

**Shared UI needs across all journeys:**
- Archetype filter chips (horizontal scroll): Twisties, Mountain Epic, Coastal, Adventure, Scenic Byway, Desert
- Route discovery cards with: name, score, distance, time, archetype badge, 1-2 attribute highlights
- Map pin integration showing route locations
- Route detail bottom sheet or subpage with scoring breakdown
- "Ride This" primary action, "Save" secondary action
- Score-based sorting (composite, curvature, proximity)
