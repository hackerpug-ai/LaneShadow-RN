---
stability: FEATURE_SPEC
last_validated: 2026-04-03
prd_version: 1.1.0
appetite_weeks: 6
---

# Scope

## Appetite

**6 weeks** — Full V1 MVP covering conversational planning, weather overlays, and saved routes with favorites.

**V1.1 deferral note:** If schedule pressure emerges, session history sidebar and session resume can be deferred to V1.1. Single active session with in-memory chat history is the minimum shippable scope.

## In Scope

### Conversational Planning
- Chat input always visible on the map screen — the map is always the primary view
- Describe ride intent in plain English via chat; AI interprets and generates 2–3 alternative scenic routes
- Routes appear as chat attachments rendered on the map with polylines
- Iterative refinement via follow-up messages in the same session ("make it shorter", "avoid Highway 1", "add a stop at Big Sur")
- Chat sessions: persistent conversation threads (like ChatGPT threads) with route attachment groupings
- Session management: start new session (top-right button), browse session history (slide-out sidebar)
- Temporary AI message overlay on map — non-centered, positioned to avoid blocking route directions, auto-dismiss after 5 seconds
- Expanded chat view: full message history with route attachments accessible by expanding the chat
- Scenic scoring per route (based on road type, elevation, and POIs)
- Conditions-aware route ranking ("Best for today" badge combining weather + scenicness)
- AI-generated route names and descriptions as part of conversational responses
- Fallback to manual planning mode accessible via chat input action or chat command
- Error recovery via conversational responses (not modal dialogs)

### Weather Overlays
- Wind overlay on route polyline (already built — integration complete)
- Rain forecast overlay on route polyline
- Temperature overlay on route polyline
- Weather badges (icon + label) on route attachment cards
- Expandable weather timeline detail per route (hourly breakdown)
- Departure time adjustment via chat message or time picker, with weather re-ranking
- Weather error recovery communicated in chat (degraded gracefully)

### Saved Routes & Favorites
- Save a planned route from a route attachment in chat or the route detail view
- Browse saved routes in a scrollable list (newest first)
- Search saved routes by name; filter by date range
- Rename and delete saved routes
- Save a road segment as a favorite (long-press on map polyline)
- Browse favorite roads library
- Auto-include favorite roads when planning new routes (mention in chat or toggle in session settings)
- Rate a saved route (1–5 stars) and add text notes
- Mark a saved route as ridden (manual toggle)
- Re-plan from a saved route (starts new session with saved route as context)
- Export route to Google Maps or Waze for navigation

### Rate Limiting
- Free tier: 5 route generation plans per month (1 plan = 1 route_plans execution; refinements count as separate plans)
- Pro tier: unlimited plans
- Usage tracking and enforcement at the backend level

## Plan Definition

A **"plan"** is one `route_plans` execution — one call to the route generation pipeline. A single chat session may contain multiple plans (initial generation + refinements). Free tier riders get 5 plans per month. Sending a chat message that triggers route generation consumes one plan. Messages that don't trigger generation (clarification questions, preference changes) are free.

## Out of Scope

| Feature | Disposition |
|---------|-------------|
| Turn-by-turn navigation | V2. Export to Google Maps / Waze is the V1 workaround. |
| Voice input | V1.1. Microphone input deferred pending quality testing. |
| First-time onboarding tutorial | V1.1. Conversational UX is self-discoverable for V1. |
| Analytics / telemetry dashboard | V1.1. Ship first, measure second. |
| Avoid areas draw tool | Reframed as chat input ("avoid Highway 1", "avoid toll roads"). Drawing UI cut. |
| Group rides and social features | Requires user base. V2. |
| Offline mode | Infrastructure complexity. V2. |
| CarPlay / Android Auto | Platform certification overhead. V2. |
| Personal analytics dashboard | Requires usage data accumulation. V2. |
| Multiple vehicle profiles | Single profile sufficient for V1. |
| Interactive elevation chart (tap-to-sync) | Static chart with gain/loss numbers is sufficient. Interactive sync cut. |
| Multi-overlay simultaneous comparison | Single active overlay (toggle) matches competitor standard and reduces implementation scope. |
| Ride history stats dashboard | "Mark as Ridden" badge is the V1 scope. Stats dashboard requires usage data. |
| Multi-user shared sessions | V2. |
| Route recording (GPS tracking) | V2. Calimoto-style ride recording requires significant infrastructure. |
| Road reputation & taste engine | V1.1. See details below. |
| Live web search tool for agent | V1.1. See details below. |
| Curated road discovery by region | V1.1. See details below. |

### V1 Limitation: LLM Route Quality Is Data-Grounded but Not Taste-Grounded

V1's tool-augmented LLM (Epic 3b) can verify roads exist, score curvature, check surface type, and query elevation — but it cannot distinguish a **legendary ride** from a **technically curvy but unremarkable road**. The tools answer "is this road twisty?" but not "is this road *good*?"

Three layers of route quality exist:

| Layer | Question | V1 Coverage |
|-------|----------|-------------|
| **Physical** | Is it paved? How curvy? What elevation? | Covered (US-062–065) |
| **Experiential** | Is it scenic? Well-maintained? Fun to ride? | Relies on LLM parametric memory only |
| **Reputational** | Do riders love this road? Is it legendary? | Relies on LLM parametric memory only |

The LLM's training data *does* contain road reputation knowledge (it knows Skyline Blvd is famous, that Angeles Crest is a legendary sport bike road, that Highway 36 is Northern California's best twisty). V1 relies on this parametric knowledge for taste. This is imperfect — the LLM may not know lesser-known gems, its knowledge has a cutoff date, and it cannot distinguish "riders love this" from "this road technically exists."

**Impact:** V1 routes will be physically sound (real roads, paved, scored by curvature) but may miss hidden gems or over-recommend well-known roads. The "opinionated navigator" personality partially compensates — the LLM will favor roads it "knows" are good from training data.

### V1.1 Solutions Under Consideration

**1. Road Reputation Knowledge Base (`getRoadReputation` tool)**

Pre-index structured road quality data from community sources into a Convex `road_knowledge` table. The LLM queries by road name + region and gets back scenery scores, ride enjoyment scores, descriptions, and a "legendary" flag.

Known data sources with structured motorcycle road ratings:
- **motorcycleroads.com** — Community-rated roads with 1-5 scores for Scenery, Ride Enjoyment, and Tourism. 50+ California roads with structured ratings.
- **Bay Area Riders Forum (BARF)** — Crowdsourced thread cataloguing 200+ California motorcycle roads organized by region with Google Maps links and paved/unpaved flags: https://www.bayarearidersforum.com/forums/threads/california-moto-roads-all-of-them.558538
- **greatmotorcycleroads.com** — Curated global "best roads" with GPX files, seasonal info, surface condition updates, and Patreon-gated route files.
- **Rider Magazine** — "50 Best Motorcycle Roads in America" with editorial descriptions.
- **Twisted Road** — "California's Top 10 Must-Ride Routes" with experiential descriptions.
- **Kurviger community data** — User-contributed road ratings from their motorcycle-specific routing platform.

Example query: `getRoadReputation("Skyline Boulevard", "Bay Area")` → `{ scenery: 4.7, rideEnjoyment: 4.8, description: "Legendary Bay Area twisty through redwoods", isLegendary: true, source: "motorcycleroads.com" }`

**2. Curated Road Discovery (`searchRoadsInRegion` tool)**

V1's `lookupRoad` verifies a road the LLM already knows. It cannot discover roads the LLM *doesn't* know. A discovery tool would let the LLM browse a curated catalog:

`searchRoadsInRegion("Bay Area", { minCurvature: 500, paved: true, minRating: 4.0 })` → returns candidate roads the LLM can choose from, including hidden gems it wouldn't find from training data alone.

This is the difference between "the LLM picks roads from memory" and "the LLM browses a scored, curated catalog."

**3. Live Web Search Tool (P3 / V2 candidate)**

A live web search tool (Tavily, Serper, or Jina-style) for edge cases:
- Rider asks about a road the knowledge base doesn't cover
- Rider asks about current road conditions ("is Highway 1 open after the landslide?")
- Rider asks about seasonal closures or events

Trade-offs: adds 3-10s latency, results are noisy and non-deterministic, hard to test reliably. The pre-indexed knowledge base (option 1) gives 90% of the value at 10% of the latency. Live search is best reserved for real-time condition queries rather than taste/reputation.

**Recommendation:** V1.1 ships options 1 + 2 (knowledge base + discovery). Option 3 defers to V2 unless real-time conditions prove critical in V1 user feedback.
