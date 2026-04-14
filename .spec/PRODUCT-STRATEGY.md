# LaneShadow — Product Strategy v3.0

**"Ride the Moment"**

**Date**: 2026-04-12
**Status**: ACTIVE
**Supersedes**: v2.1 (archived at `.spec/archive/2026-04-12-v2/`)
**Informed by**: v2.x strategy research, revenue validation, founder goals conversation

---

## What This Is

LaneShadow is a **passion project built by a rider, for riders**. It's AI-agent coded, run as a side project, and designed to be sustainable without becoming a full-time job.

This strategy is honest about that. It's not a venture pitch. It's a plan for building something genuinely useful that covers its own costs and creates a community worth being part of.

### Founder Goals (in priority order)

1. **Find exciting motorcycle experiences for myself** — I ride, I want great roads, this app should help me find them
2. **Build something genuinely useful to other riders** — if it helps me, it should help them
3. **Community building — make friends who ride** — the social value matters as much as the product
4. **Sustainable side project** — willing to self-fund $500-1000/mo, but it should cover its costs within 9-12 months
5. **Never full-time** — this is a passion, not a job. ~5-10 hours/week of attention
6. **Passive revenue is nice** — but community and personal use come first

### What This Is NOT

- A venture startup optimizing for ARR and Series A metrics
- A full-time commitment or a path to "going full-time"
- A routing app competing with Calimoto, Scenic, or Ridrs on navigation features

---

## Vision

**Help motorcycle riders ride the moment** — find the best experiences, know when conditions are right, stay present on the ride, and build a library of roads worth returning to.

"Ride the moment" means: when weather, time, and desire align, you know exactly where to go. The planning stress is gone. You open the app, see what's rideable today, pick something great, and go. And once you're riding, your hands stay on the bars and your eyes stay on the road — the app works for you through voice, not touch.

---

## Who We Serve

Recreational motorcycle riders who ride for enjoyment, scenery, and the experience of the road. See [User Profiles](./USER-PROFILES.md) for detailed personas.

Our four riders — Mike (weekend cruiser), Terry (touring planner), Rachel (returning rider), Sam (group organizer) — all describe the same core scenario in their success stories: *"I found a great road, saw the weather was good, and went riding."* That's riding the moment.

---

## Strategic Pillars

### Pillar 1: Ride Discovery

**Find roads and experiences you didn't know existed.**

The curation pipeline — scraping community sites, extracting route data with LLM, scoring curvature and scenicness from OSM, classifying by archetype — IS the product. It turns hours of forum-browsing into 30 seconds of "show me the best roads near Asheville."

- Searchable, map-based route discovery by state/region
- Archetype filtering (scenic cruiser, mountain twisties, coastal, historic, etc.)
- Composite scoring (scenic quality, curvature, surface, popularity)
- "What's great near me?" as the primary entry point
- **Natural-language search** powered by an on-device LLM that converts rider intent ("gentle scenic ride nearby, under an hour") into structured queries against the local route database — no server round-trip, no cell signal required.

**This is the free, open, hero experience.** No gates, no limits.

> **On-device LLM as an interface, not a generator:** The LLM turns utterances into query parameters. A deterministic SQL layer does the actual ranking and filtering. This architectural choice is what makes offline-first viable — a 500 MB model can slot-fill a schema; it doesn't have to know every road in America. See [`.spec/research/local-models/ON_DEVICE_LLM_STRATEGY_2026-04-12.md`](./research/local-models/ON_DEVICE_LLM_STRATEGY_2026-04-12.md).

#### Discovery spans routes AND waypoints

Ride Discovery is not only routes. A route is the ribbon of asphalt; a **waypoint** is a moment of delight along the way — the scenic overlook worth pulling over for, the diner that makes the ride memorable, the roadside landmark worth the detour toward. LaneShadow treats waypoints as a **second content type**, parallel to routes, with their own rider-intent ontology and their own discovery surfaces.

**Rider-intent, not business classification.** Google Places groups POIs by what a business sells — that's an SIC-code ontology, the phonebook model. LaneShadow waypoints are grouped by *why a rider would stop there*, a verb ontology. The difference is what prevents a rider-beloved independent diner from landing in the same bucket as a Taco Bell.

**The four categories** (a waypoint belongs to exactly one):

| Category | Rider's question | Examples |
|---|---|---|
| **Pause** | "Should I pull over and look?" | Scenic overlooks, vistas, photo spots, waterfall pullouts, sunset viewpoints |
| **Wander** | "Is this worth parking the bike and walking around?" | Historic sites, ghost towns, lighthouses, fire lookouts, covered bridges, weird Americana, small museums, historic town districts, interpretive-sign clusters, walkable scenic features (short-hike waterfalls, cliff dwellings, rock formations). *Unifying trait: effort ≈ park, 10–30 min stop, some payoff beyond "look and go."* |
| **Taste** | "Where's a stop that'll make this ride memorable?" | Independent diners, BBQ joints, small-town cafes, ice cream stands, biker-welcoming spots |
| **Gather** | "Will I see other riders here?" | Bike-meet locations, moto museums, rally venues, iconic rider hangouts |

Deliberately excluded: **Refuel** (gas is utility, not delight — Google Maps owns it), **Lodging** (out of scope for day-trip riders), **Hazards** (belongs in route metadata), **chain businesses** (filtered at the pipeline layer regardless of source — no Taco Bell, ever).

Every waypoint also carries two orthogonal attributes that drive which UX surface it appears on: **`effort`** (`pullover` / `park` / `side_trip`) and **`trigger_score`** (0–1, how much a single waypoint could justify a ride by itself — high scores power "Surprise Me" / "Ride toward this today," low scores appear only as along-route callouts).

**Why this matters for "Ride the Moment"**: three of four primary personas have scenarios where the waypoint is the *reason* for the ride, not a stop along the way. Rachel's "this cool lighthouse 40 minutes away, weather is fine, we can be home by lunch." Mike's Friday-evening "what's worth riding toward tomorrow morning." Sam's "great BBQ spot at the halfway point." Only Terry (touring planner) rides for the road's own sake. Ship waypoints as a parallel content type or lose three of four personas for waypoint-first discovery.

**Implementation**: PRD lives at `.spec/prds/waypoints/` (Phase 0.5, scoped to 2–3 weeks). The taxonomy is validated against real rider language via [`.spec/research/waypoint-demand/`](./research/waypoint-demand/) before the PRD is written.

### Pillar 2: Ride Companion

**Hands on the bars. Eyes on the road. LaneShadow handles the rest.**

During a ride, riders should never touch their phone. The Ride Companion is an always-listening, ambient voice assistant that runs entirely on-device. It hears nothing it doesn't need to hear, recognizes when the rider is talking to it (vs. talking to friends on intercom or singing along to music), and responds with short, accurate audio confirmations. It works on back roads with zero cell coverage, never requires a button press, and knows your route, your weather, and your saved roads.

> **Technical architecture, addressing detection approach, false-trigger mitigation, and validation spike plan**: see [`.spec/research/RIDE-COMPANION-VOICE.md`](./research/RIDE-COMPANION-VOICE.md)

**What riders do through voice:**
- **Capture**: "Save this road" / "Rate this 5 stars" / "Note: gravel section at mile 40"
- **Awareness**: "What's the weather in an hour?" / "How far to the next gas station?"
- **Adaptation**: "Weather's turning — what's a good way home?" / "Extend my ride an hour"
- **Coordination**: "Tell the group I'm pulling over" / "Where's the nearest rider?"
- **Comfort**: "Find food near me" / "How long until I'm home?"

**Why on-device, always-listening:**
- Great motorcycle roads have no cell coverage — cloud assistants die when riders need them most
- Latency matters — a 3-second pause at 60mph is 264 feet of road
- Privacy matters — voice audio never leaves the device, ever
- The system is a layered stack (VAD → STT → addressing detection → intent classification → action), not a single LLM. Most of the time only cheap voice activity detection is running. Heavier layers fire briefly when there's actual speech, then sleep.
- Bias toward silence — false negatives (missed command, rider repeats) are recoverable; false positives (wrong action at 60mph) erode trust irreversibly
- See voice research doc for the full architecture and validation plan

#### Quality Gates

The Ride Companion has three non-negotiable quality requirements. If any gate fails, the feature does not ship. These are not aspirational — they are hard constraints.

**1. Safe** — Must not distract or increase risk of accident.
- Audio-only responses. Never requires the rider to look at the screen.
- Responses are short and concise — a sentence, not a paragraph.
- Non-urgent information waits. Critical information (weather warning, fuel range) is brief.
- Silence is the default. The companion speaks when spoken to, or when safety demands it.
- If the system is uncertain, it says nothing rather than saying something wrong at 60mph.

**2. Accurate** — Information provided must be correct.
- Weather data must be current and route-specific — not a stale cache, not the nearest city.
- Distance and time estimates must be calibrated to motorcycle speeds on the actual road type.
- POI data (gas stations, restaurants) must be verified current. A closed gas station on a remote road is dangerous, not just annoying.
- If the system doesn't know, it says "I'm not sure" — never fabricates an answer.

**3. Reliable** — Must consistently work with high intent accuracy.
- Local processing means it works everywhere — no coverage dependency.
- Intent recognition accuracy target: >95% for core commands in helmet-mic conditions (wind noise, engine noise, Bluetooth audio compression).
- Graceful degradation: if it can't understand, it says "I didn't catch that" — never guesses wrong and acts on it.
- Wake word detection must be robust — no false activations from wind or engine noise, no missed activations when the rider needs it.
- Consistent behavior ride after ride. A companion riders can't trust is worse than no companion.

### Pillar 3: Conditions Awareness

**Know when the moment is right.**

Weather doesn't complement discovery — it makes discovery *actionable*. A beautiful road in a thunderstorm isn't a ride. Weather answers the question that comes right after "where should I go?": *"Should I go today?"*

Pre-ride (touch):
- Route-level weather overlays (wind, rain, temperature)
- "Best day to ride this route this week" (Pro)
- Weather-informed discovery: "What's rideable this Saturday?"
- Free: see conditions on any route. Pro: intelligent recommendations.

In-ride (voice via Ride Companion):
- "What's the weather ahead?" / "Am I going to hit rain?"
- Proactive weather alerts when conditions change on your route

### Pillar 4: Personal Road Library

**Remember what matters.**

The more you ride with LaneShadow, the more valuable it becomes. Your personal collection of rated roads, notes, and ride memories creates a reason to stay and a reason to come back next season.

Pre-ride (touch):
- Browse saved roads, filter by rating, search by area
- "Re-ride this road" from your library
- Favorites auto-surface in future discovery
- Seasonal memory: "What was that great road I found last October?"

In-ride (voice via Ride Companion):
- "Save this road" / "Rate this 5 stars" / "Add a note: amazing overlook at this bend"
- Capture in the moment instead of trying to remember post-ride

### Pillar 5: Community

**Share knowledge. Find riding partners. Make friends.**

This is not a V2 afterthought — it's core to the founder's goals and to the product's growth. Riders discover roads through other riders. Community contribution creates content no solo developer can match.

- Submit routes and experiences
- Rate and review community-submitted roads
- Local riding group partnerships
- Simple, welcoming — not another bro-y forum

In-ride (voice via Ride Companion):
- "Note for other riders: gravel at mile 40" — community contributions from the saddle
- Group coordination: "Tell the group I'm stopping at the next overlook"

---

## Competitive Position

### What We're NOT Competing With

Calimoto, Scenic, Ridrs, Kurviger, and Motobit are **routing apps**. They answer "navigate me from A to B." We don't need to beat them at routing. Riders who want turn-by-turn can export to Google Maps.

### What We ARE Competing With

- **Browsing ADVRider forums** for "best roads near [place]"
- **Asking friends** what's worth riding
- **Google searching** "best motorcycle roads in [state]"
- **The 3-app juggle**: route app + weather app + notes app

### Adjacent Products

| Product | Overlap | Our Difference |
|---------|---------|----------------|
| 68 degrees | Community-curated routes, free | We add AI curation + weather intelligence + personal library |
| REVER | Community routes + Butler Maps | We add weather-informed discovery, not just community sharing |
| ADVRider forums | Where riders actually discover rides today | We surface that knowledge in a map, with weather, on your phone |

### Our Line

> "LaneShadow finds the rides. Weather tells you when. Your voice companion rides with you. Your library remembers them."

### What Nobody Else Has

No motorcycle app has a local, voice-first, rider-aware companion. Calimoto has cloud-dependent voice nav (turn-by-turn only). Scenic has CarPlay (generic, no rider context). Siri and Google Assistant are general-purpose and require connectivity. Nobody has a purpose-built voice assistant that runs on-device, understands motorcycle-specific intent, and knows your route, weather, and saved roads — without cell coverage.

---

## Technical Strategy: Offline-First, On-Device LLM

**LaneShadow's core discovery and companion loops must work with zero cell coverage.** This is not an optimization or a feature — it is the architectural foundation of "ride the moment." Great motorcycle roads have no cell signal, and a product that breaks in the places riders actually go is not a product for riders.

### Design constraints (hard requirements)

1. **≤2 second on-device latency per LLM query, end-to-end.** A rider stopped on the side of a remote road will not wait 8 seconds for a natural-language query. Anything slower fails the product promise. This constraint drives every model, runtime, and optimization choice below.
2. **Zero critical-path cloud calls for discovery, search, or in-ride companion commands.** Cloud is a fallback tier, not a default. The offline loop must be complete end-to-end.
3. **LLMs are interfaces, not generators.** The on-device model's job is to turn utterances and voice commands into structured parameters for deterministic code (SQL, route engine, saved-road lookups). This constraint keeps the model small enough to hit the latency ceiling and small enough to ship in the app binary.
4. **No user data leaves the device for core operations.** Query audio, query text, and search history are on-device-only. Privacy is an architectural property, not a marketing bullet.

### Stack — per device tier

| Device tier | On-device model | Runtime |
|---|---|---|
| iOS 26+ on iPhone 15 Pro or newer | Apple Foundation Models (3 B / 2-bit, ANE-accelerated) | `react-native-apple-llm` |
| iOS 18–26 on iPhone 12+ | Qwen2 0.5 B Q4 with LaneShadow LoRA adapter | `llama.rn` |
| Android flagship (SD 8 Gen 3+, Pixel 9+, S24+) | Qwen2 0.5 B Q4 with LaneShadow LoRA adapter | `llama.rn` + QNN/Vulkan delegate |
| Android mid-range (SD 7 Gen 3+, Dimensity 7200+) | Qwen2 0.5 B Q4 with LaneShadow LoRA adapter | `llama.rn` CPU-only |
| Android budget (<4 GB RAM), iOS ≤17 | — | cloud Haiku fallback (not in critical path) |

The runtime auto-detects the device tier at launch and picks a backend. One feature-flag system, two code paths. Cloud Haiku is the universal safety net but is not the default for any supported device.

### How we hit 2 seconds

Four compounding optimizations, all v1 requirements:

1. **LoRA fine-tune compresses the prompt.** The schema and few-shot examples for intent→query live in model weights, not in the prompt. The prompt shrinks from ~1,500 tokens to ~20 tokens. Prefill cost effectively disappears. Single highest-leverage optimization.
2. **GBNF grammar-constrained output.** llama.cpp's grammar sampling forces the model to emit only the required JSON tokens, skipping braces, whitespace, and null fields. Cuts decode time roughly in half.
3. **KV cache persistence across queries.** The fixed prefix is prefilled once per session and reused on every subsequent query via llama.cpp prompt caching (or `LanguageModelSession` on Apple Foundation Models).
4. **Launch-time cache warming.** A background thread pre-warms the model and KV cache while the user is still looking at the splash screen, so the first user-felt query is "warm," not "cold."

### Complete offline loop

- **Discovery search:** utterance → on-device LLM (≤2s) → structured query → `op-sqlite` with SpatiaLite spatial extension → top-K routes from ~50 MB bundled curated-route DB.
- **Map rendering:** MapLibre GL Native with pre-downloaded offline tiles per region (free, no per-user fees).
- **Turn-by-turn:** Mapbox Navigation SDK offline routing (v1) or Valhalla on-device (v2+).
- **Ride Companion voice:** layered VAD → on-device STT → on-device LLM intent classification → action, all bundled. Same 2-second ceiling applies.
- **Fresh data overlays** (weather, traffic, road closures): background sync when cell is available; stale-with-indicator when not.

### What this unlocks

1. **LaneShadow is the app you use where there's no cell signal.** Remote canyons, the Sierra, the Rockies, Baja — exactly where motorcyclists actually ride. This is the competitive position no cloud-first app can match.
2. **Zero variable cost per query.** Inference is free at the edge. The business model shifts from "how much is each user costing me in cloud LLM bills" to "does acquisition cost pay back over the lifetime" — a much simpler sustainability math for a lifestyle project.
3. **Privacy as a default.** Voice audio, search queries, and saved roads never leave the device. This is architecturally guaranteed, not a promise.
4. **Predictable latency.** No network jitter, no cold-start cloud functions, no regional outage risk. The core loop has one performance envelope and it's the same everywhere.

### Research references

- [`.spec/research/local-models/ON_DEVICE_LLM_STRATEGY_2026-04-12.md`](./research/local-models/ON_DEVICE_LLM_STRATEGY_2026-04-12.md) — full technical strategy with measured benchmarks, device matrix, and latency math
- [`.spec/research/local-models/INTENT_TO_QUERY_RESULTS_2026-04-10.md`](./research/local-models/INTENT_TO_QUERY_RESULTS_2026-04-10.md) — Qwen3.5 0.8 B validated at 93% pass rate on the intent→query fixture
- [`.spec/research/local-models/MODEL_PRUNING_MOBILE_STRATEGY_2026-04-12.md`](./research/local-models/MODEL_PRUNING_MOBILE_STRATEGY_2026-04-12.md) — prior research on LLM-Sieve pruning (partially superseded)
- [`.spec/research/RIDE-COMPANION-VOICE.md`](./research/RIDE-COMPANION-VOICE.md) — voice stack architecture for Pillar 2

---

## Revenue Model

Designed for a lifestyle product: diversified, low-maintenance, no customer support desk.

### Free Tier (the product)

Everything in Pillars 1 and 5, plus basic weather overlays:
- Full route discovery — no plan limits, no gates
- Community access — submit, rate, browse
- Basic weather on any route (wind, rain, temp overlays)
- Personal road library (save up to 10 roads)
- Basic Ride Companion voice commands (save road, rate, check weather)

### Revenue Streams (priority order)

**1. Affiliate Partnerships — $100-300/mo at scale**
RevZilla / Cycle Gear contextual gear recommendations on weather and route pages. "Rain in the forecast? Here's the rain gear riders on this route recommend." Natural, useful, not spammy.

**2. Featured Route Sponsorships — $50-200/mo**
Motorcycle-friendly businesses near popular discovered routes: restaurants, hotels, gear shops, rental outfits. "Rider-recommended stop along this route." Local, relevant, valuable to riders.

**3. Optional Pro Tier — $24.99/yr**
For riders who want more:
- Full Ride Companion: adaptive routing ("weather's turning — reroute me"), group coordination, proactive alerts
- Weather intelligence: "Best day to ride this route this week"
- Weather push notifications: "Your saved route has clear skies Saturday"
- Unlimited personal road library
- Route export (GPX, Google Maps link)
- AI route descriptions as ride journal entries

**4. Regional Route Collections — $4.99 one-time**
Premium curated collections: "50 Best Roads in the Blue Ridge," "California Coastal Classics." One-time purchase, no subscription. Optional, not required to use the app.

### Sustainability Math

| Item | Monthly |
|------|---------|
| Infrastructure (Convex, APIs, weather) | ~$80 |
| Cloud LLM (Haiku fallback only, not default) | ~$10–30 |
| Claude Code credits | ~$200 |
| **Total burn** | **~$290–310/mo** |
| Budget ceiling (self-funded) | $500-1000/mo |

> **Note on LLM costs:** The on-device LLM strategy (see Technical Strategy section) structurally eliminates the biggest variable cost of the app. Discovery search, intent extraction, and in-ride voice commands run at the edge for free. Cloud Haiku remains as a fallback for unsupported devices (~25% of install base) and as a quality backstop, but is not in the critical path. This is what makes the lifestyle-project budget actually feasible at scale — infrastructure cost is bounded, not user-proportional.

**Target**: Cover $313/mo through affiliate + sponsorship within 9-12 months.

At modest scale (500 monthly active users):
- Affiliate: ~$100-150/mo
- 2 local sponsorships: ~$100-200/mo
- Pro subs (30 users): ~$62/mo
- **Total: $262-412/mo**

This isn't a venture-scale business. It's a sustainable hobby that funds itself. That's the goal.

---

## Feature Sequencing

### Phase 0: Ship Discovery (Now → 60 days)

Complete what's already being built. Make it usable for yourself.

| Task | Status |
|------|--------|
| Curation pipeline (scrape → extract → score → push) | ~80% built |
| Discovery UI (map pins, search, filters, state selector) | ~60% built |
| Local SQLite for fast mobile queries | Built |
| **On-device LLM validation spike (iPhone 15 Pro, llama.rn + Qwen baseline)** | **Not started — P0** |
| **LaneShadow calibration dataset (intent → JSON params, 500 samples)** | **Not started — P0** |
| Seed data for 10+ states | Not started |
| Polish enough to share | Not started |

**Gate test**: Open the app, pick a state, find 5 rides you've never done, go ride one this weekend. **Natural-language search works on-device in under 2 seconds.**

**Stack validation gate for Phase 0** (before committing to on-device LLM at product scale):
- Real iPhone 15 Pro cold/warm latency measurement with unoptimized Qwen baseline
- Confirm `llama.rn` KV cache persistence works across React Native calls
- Confirm `react-native-apple-llm` session persistence works on iOS 26
- Fallback tier defined if 2-second ceiling can't be hit with v1 optimizations

### Phase 0.5: Waypoints v1 (overlaps with Phase 0 completion / Phase 1 start)

Ship the **second content type**. Waypoints are moments of delight — scenic stops, historic sites, iconic independent diners — discovered via dedicated surfaces (Moments Feed, Surprise Me, along-route bloom) in addition to being linked from routes. Grounded in the rider-intent ontology from Pillar 1 (Pause / Wander / Taste / Gather).

| Task | Status |
|------|--------|
| Waypoint ontology (Pause / Wander / Taste / Gather) | Spec'd in Pillar 1 |
| Market research validating categories against rider-forum language | **Complete** — see [`.spec/research/waypoint-demand/03-findings.md`](./research/waypoint-demand/03-findings.md) (~90% clean fit across sources, ontology validated) |
| Sourcing alternatives research (Overture Maps + USGS GNIS + Geoapify as free replacements for Google Places / TripAdvisor) | **Complete** — see [`.spec/research/waypoint-demand/06-sourcing-alternatives-deep-research.md`](./research/waypoint-demand/06-sourcing-alternatives-deep-research.md) |
| Waypoint PRD (`.spec/prds/waypoints/`) | Not started — gated on UC-RIDER-03 completion in `curation-hardening` |
| **Sourcing stack — PAUSE**: Overture Maps (category=viewpoint/scenic) + OSM `tourism=viewpoint` + USGS GNIS (Summit/Falls/Gap/Arch/Overlook/Cliff feature classes) + NPS/USDA overlook data | Not started |
| **Sourcing stack — WANDER**: HMDB (191K historical markers) + Overture (category=historic/museum/monument) + NRHP (95K) + OSM `historic=*` + USGS GNIS ghost towns | Not started |
| **Sourcing stack — TASTE**: Rider-forum NLP extraction (UC-RIDER-03 pipeline, `curation-hardening`) + Overture (category=restaurant/diner/cafe) + deterministic chain blocklist from AllThePlaces inventory + founder-curated regional seed | Not started — Taste quality gated on UC-RIDER-03 |
| Single `curated_waypoints` Convex table + op-sqlite sync (reuses existing projection pattern) | Not started |
| 7-layer quality-gate architecture (category filter → chain blocklist → density-aware confidence → Haiku motorcycle-relevance for Taste → multi-source corroboration boost → user downvote loop → freshness SLA) + 6 rural-aware refinements. Full spec: [`07-quality-gates-architecture.md`](./research/waypoint-demand/07-quality-gates-architecture.md) | Not started |
| Census-tract density classifier (R1) — urban/suburban/rural/remote tagging as enabler for density-aware thresholds, local-uniqueness scoring, and rural-primary source priority | Not started |
| Founder regional seeding (R6) — 30–50 Taste waypoints per region in 3 regions the founder rides (default proposal: Utah/SW Colorado + Blue Ridge/Smokies + Sierra/Eastern Sierra; final regions per founder selection) | Not started |
| Claude Vision Street View check for Pause candidates (L6), scoped to ambiguous candidates only — ~$28 one-time + $2–5/month steady state. See [`07-quality-gates-architecture.md`](./research/waypoint-demand/07-quality-gates-architecture.md) §L6 for scoping rule | Not started |
| AI leverage stack (Thread 4 Option C): Haiku for O1 motorcycle-relevance gate + O2 attribute extraction + O3 rider-voice one-liner + O4 seasonal closure extraction; Voyage embeddings for O5 deduplication; Sonnet Vision for O6 (per L6 above). Prompt caching enabled on all Haiku calls. Total LLM cost Phase 0.5: ~$30–50 one-time batch + modest recurring | Not started |
| Geoapify free tier (3K credits/day) for in-app real-time POI queries between Overture monthly releases | Not started |
| Discovery UI — **Moments Near Me only** (map + list + category/effort filter chips + detail sheet + "not a delight" downvote). Surprise Me button, Moments Feed card stack, and along-route bloom all deferred to Phase 1 or Phase 3. Rationale: prove waypoints engage riders *at all* before adding serendipity mechanics on top. Data collection is the Phase 0.5 goal, not UX breadth. | Not started |

**Gate test**: Open the app on a Saturday morning, tap "Moments Near Me," see 8 waypoints you've never heard of within 30 minutes, pick one, and ride there — without touching the route catalog first.

**Sourcing cost profile**: **~$0 one-time + ~$0/month recurring.** All primary sources (Overture Maps, USGS GNIS, HMDB, NRHP, NPS, OSM, Geoapify free tier) are free and commercially-licensed. No Google Places API, no TripAdvisor contract, no Atlas Obscura partner tier at launch. Deep research verified license compatibility across CDLA-Permissive-2.0, Apache-2.0, CC0-1.0, ODbL with attribution, and US Government public domain — all usable in a commercial product with no contract overhead. See [`06-sourcing-alternatives-deep-research.md`](./research/waypoint-demand/06-sourcing-alternatives-deep-research.md) for full license, volume, and fit analysis.

**Scope guardrail**: **6+ weeks, gated on UC-RIDER-03 completion** in `curation-hardening` (community NLP pipeline that sources the Taste category). Pause and Wander can launch on day one using the free structured sources (Overture + HMDB + GNIS + NRHP); Taste launches thin via Overture-with-chain-filter + founder-curated seed and enriches as UC-RIDER-03 comes online. This is additive thin-layer work — reuses existing curation pipeline patterns (sync, op-sqlite, intent→SQL). One new Convex table + one new intent schema extension + one new discovery surface. If scope creeps beyond that, we stop and reconsider.

### Phase 1: Community + Share (Month 2-3)

Make it useful to other riders. Invite real communities.

| Task | Priority |
|------|----------|
| Route submission flow (simple — name, description, map trace) | P0 |
| 5-star rating + text notes on any route | P0 |
| Share route via link (works without app installed) | P0 |
| Post on ADVRider + 2 FB riding groups with invite | P0 |
| Partner with 2-3 local riding groups | P1 |

**Gate test**: A rider you don't know submits a route, another rider rates it, and a third rider rides it.

### Phase 2: Weather + Revenue (Month 3-5)

Make discovery actionable. Start covering costs.

| Task | Priority |
|------|----------|
| Complete weather overlays (rain, wind, temp on routes) | P0 |
| "Rideable this weekend?" weather-informed discovery | P0 |
| RevZilla/Cycle Gear affiliate integration | P0 |
| Approach 3 local businesses for sponsorships | P1 |
| "Best day to ride" scoring (Pro) | P1 |

**Gate test**: Open the app Saturday morning, see which discovered routes have good weather, pick one, and go.

### Phase 3: Ride Companion v0 (Month 5-8)

Voice-first in-ride experience. This is the differentiator no competitor has. **Architecture and spike plan: [`.spec/research/RIDE-COMPANION-VOICE.md`](./research/RIDE-COMPANION-VOICE.md)**

#### Phase 3.0: Validation Spike (1 week, ideally near-term — not month 5)

Before committing to Phase 3 build, prove the always-listening fundamentals work in real helmet-mic riding conditions.

| Task | Priority |
|------|----------|
| Build minimal test app: VAD + on-device STT + hardcoded "save this road" pattern matcher | P0 |
| Real ride test (≥1 hour) with founder's actual Bluetooth intercom | P0 |
| Measure: intentional command recognition rate, false positives during normal speech, battery drain, latency | P0 |

**Pass criteria** (from voice research doc): 9/10 intentional commands recognized, 0 false positives, <15% battery drain in 1hr, <2s latency.

**If spike fails**: re-evaluate the pillar before building dependent product.

#### Phase 3.1: Ship Hero Command (Month 5-6)

| Task | Priority |
|------|----------|
| Layer 1 (VAD) + Layer 2 (Apple Speech on-device STT) | P0 |
| Layer 3 (addressing detection): pattern matching for "save this road" with high confidence threshold | P0 |
| Layer 5: action execution + haptic + brief TTS confirmation | P0 |
| Bluetooth HFP audio routing through Cardo / Sena | P0 |
| Quality gate validation (Safe / Accurate / Reliable) — all three must pass | P0 |

**Gate test for Phase 3.1**:
- **Safe**: Founder completes a 1-hour ride using only voice. Never looks at screen. No distraction events.
- **Accurate**: 10 "save this road" commands save the correct road segment at the correct timestamp.
- **Reliable**: 50 commands in real helmet-mic conditions. >95% correctly interpreted. **Zero false positives during non-command speech.**

#### Phase 3.2+: Expand Command Set (Month 6-8)

After hero command ships and gates pass, expand one intent at a time, each with independent gate validation:
- Rate this road (1-5 stars)
- What's the weather ahead?
- How far to the next gas station?
- (then more, based on real usage patterns)

#### What the Ride Companion is NOT

To stay focused and avoid reinventing Siri, the Companion deliberately does NOT handle:
- Music control, phone calls, text messages, calendar, timers, general queries
- These remain the OS assistant's job. LaneShadow's value is **motorcycle-aware context** — your route, your weather, your saved roads, your community. Anything else falls through to Siri / Google Assistant.

### Phase 4: Library + Pro + Revenue (Month 8-10)

Build retention. Launch optional Pro tier. Start covering costs.

| Task | Priority |
|------|----------|
| Personal road library (save, rate, annotate, browse) — touch UI | P0 |
| RevenueCat + Pro paywall | P0 |
| Pro Ride Companion features (adaptive rerouting, group coordination, proactive alerts) | P1 |
| Weather push notifications (Pro) | P1 |
| Route export — GPX, Google Maps link (Pro) | P1 |
| Regional route collections ($4.99 one-time) | P2 |

**Gate test**: A rider with 15+ saved roads opens the app, sees weather is good, picks a favorite, and gets a "best day to ride" recommendation. On the ride, they voice-save two new roads and rate them without touching the phone.

### Phase 5: Evaluate + Grow (Month 10-12)

Assess sustainability. Decide what's next.

- Is revenue covering costs? If yes, maintain. If no, adjust.
- Is the community growing organically? If yes, invest in community features. If no, investigate why.
- Is the Ride Companion being used? What commands are most common? What's missing?
- Does group ride coordination make sense now?
- Expand Ride Companion capabilities based on real usage patterns.

---

## KPIs

Metrics for a community product, not a SaaS conversion funnel.

| KPI | Target | Why It Matters |
|-----|--------|----------------|
| Monthly Active Discoverers | 500 within 6 months | People using the core product |
| Routes Discovered Per Session | >3 routes viewed | Engagement depth — are people finding value? |
| Community Contributions/month | 20 submitted routes | Flywheel health — is content growing? |
| Cost Coverage Ratio | >1.0 within 12 months | Revenue / burn — are we sustainable? |
| Riding Group Partnerships | 5 within 6 months | Community distribution — are we plugged in? |
| Routes Founder Personally Rode | >2/month | Dogfooding — does this help ME find great rides? |
| Companion Intent Accuracy | >95% in helmet-mic conditions | Reliable gate — companion must work consistently |
| Companion Safety Incidents | 0 | Safe gate — zero distraction-caused incidents. Non-negotiable. |
| Voice Commands Per Ride | Track, no target yet | Usage signal — are riders actually using the companion? |
| Voice-Saved Roads / Total Saved | Track ratio | Adoption signal — is voice capture replacing post-ride manual entry? |

---

## What We Carry Forward

From the v2.x research (archived, still valid data):

- **Market data**: $420-600M motorcycle nav software market, 8.8M US registered motorcycles, 5.4M in target segment (IIHS)
- **User profiles**: 4 primary + 2 secondary personas, all validated ([User Profiles](./USER-PROFILES.md))
- **Competitive landscape**: 10+ competitors mapped with pricing, strengths, weaknesses
- **Weather insight**: Calimoto removed weather (web-only, low engagement); standalone weather apps validate need but have tiny user bases; integration is the differentiator
- **Design constraints**: Gloved hands (44pt+ touch targets), sunlight-optimized display, median age 50 (simplicity > power)
- **Technical architecture**: React Native + Convex + pi-agent-core + Mapbox, all proven
- **Revenue validation finding**: Business structurally viable at $113/mo burn; subscription SaaS path scored NO-GO due to unvalidated unit economics

Full v2.x artifacts: `.spec/archive/2026-04-12-v2/`

### v3.0 Supporting Research

- [`.spec/research/RIDE-COMPANION-VOICE.md`](./research/RIDE-COMPANION-VOICE.md) — Technical architecture, addressing detection, false-trigger mitigation, and validation spike plan for Pillar 2 (Ride Companion)

## What We Leave Behind

| Old Direction | Why Dropped |
|--------------|-------------|
| "Replace the 3-app stack" positioning | Competes with routing apps; our value is discovery, not navigation |
| Subscription SaaS as primary business model | Wrong model for a lifestyle project with $300/mo burn |
| RevenueCat as P0 blocker | Deferred to Phase 3; affiliate + sponsorship come first |
| LTV:CAC / conversion funnel optimization | Wrong metrics; replaced with community and sustainability KPIs |
| NL planning as hero feature | Nice to have, pipeline exists, but not the core value. May complete in Phase 4 |
| "Weather hero" positioning | Weather is important but it's a pillar, not THE product. Discovery is the product. |
| Competing with Calimoto/Scenic on features | Exit the routing red ocean entirely |

---

## Risk Factors

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Community building requires consistent effort (founder said "not full-time") | Medium | Budget ~3 hrs/week: 2 community posts, 1 ride shared. Automate what's possible. |
| Affiliate/sponsorship revenue is small and irregular | Medium | Diversified streams. At $313/mo burn, even modest revenue covers costs. |
| Route data quality from scrapers is inconsistent | Medium | LLM extraction + human (founder) curation for initial seed. Community ratings surface quality. |
| Riders don't contribute routes | Medium | Seed aggressively. Make submission dead simple. Founder contributes first 50 routes. |
| A competitor adds AI curation (Ridrs, 68 degrees) | Low | Community relationships and personal road library create switching costs. Code is replicable; community isn't. |
| Ride Companion voice accuracy insufficient in helmet conditions | Medium | Spike early (Phase 3 starts with spikes, not features). If accuracy <95%, don't ship — a companion riders can't trust is worse than none. Helmet mics (Cardo/Sena) are close-to-mouth and wind-buffered, which helps. |
| On-device LLM latency exceeds 2-second ceiling after optimization | Medium | LoRA fine-tune + GBNF grammar + KV cache warming are all v1 requirements, not optimizations. Validation spike on a physical iPhone 15 Pro is the first engineering action — measure before committing. Mid-range Android has the tightest margin (~1.7s extrapolated); real-device validation required before shipping that tier. Fallback: cloud Haiku for devices that can't hit the ceiling. See [`.spec/research/local-models/ON_DEVICE_LLM_STRATEGY_2026-04-12.md`](./research/local-models/ON_DEVICE_LLM_STRATEGY_2026-04-12.md). |
| On-device LLM capability insufficient on older iPhones / budget Android | Medium | Qwen2 0.5B + LoRA targets the "fat middle" tier. Budget Android (<4 GB RAM) and iOS ≤17 route to cloud Haiku fallback — this is a tier, not a failure. Covered by ~$10–30/mo in cloud costs, not user-proportional. |
| Liability concerns with in-ride voice features | Low | Quality gates (Safe/Accurate/Reliable) are hard constraints, not aspirations. Feature does not ship unless all three pass. Include standard "keep eyes on road" disclaimers. |
| Founder loses interest | Low | The product serves the founder's own riding. If it stops being useful to him, something is wrong with the product, not the motivation. |

---

## Brand Promise

**LaneShadow helps you ride the moment — find roads worth riding, know when conditions are right, and never take your hands off the bars to remember every great mile.**
