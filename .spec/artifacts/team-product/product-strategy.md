# LaneShadow — Product Strategy Recommendation

**Date**: 2026-04-03
**Author**: product-manager
**Status**: DRAFT — For team review

---

## Executive Summary

LaneShadow enters a market where every competitor has solved routing but none have solved the full rider workflow. The opportunity is not to build another routing app — it is to build the **single app that replaces the 3-app stack** riders currently rely on (navigation, weather, community). The original PRD targets the right core, but the execution order and scope boundaries need revision to match where competitive differentiation is actually possible.

**Recommendation in one sentence**: Lead with AI-powered natural language planning and real-time conditions intelligence — two gaps no competitor has filled — while cutting complexity features (avoid areas, elevation interactivity) that cost 3x the effort for a fraction of the rider value.

---

## 1. What to KEEP from the Original PRD

### Keep as-is

| Epic | Reason to Keep |
|------|---------------|
| Epic 1: Weather Planning | Directly addresses pain point #7 ("I don't know conditions before I ride"). Wind overlay already built — rain and temp complete the story. This is a near-zero-cost close that creates a compelling differentiation moment. |
| Epic 2: Browse & View Saved Routes | Table stakes. Without route management, the app has no retention loop. Every competitor has this. Must ship. |
| Epic 3: Search, Filter & Organize Routes | Also table stakes for anyone with more than 5 saved routes. Keep but scope tightly — search by name + date filter is sufficient for V1. |
| Epic 4: Save & Reuse Favorite Roads | This is LaneShadow's clearest personalization moat. No competitor auto-includes your favorite segments in new routes. The backend is partially built — finish it. |
| Epic 7: Rate Routes & Add Notes | Required for the feedback loop that makes routes improve over time. Ratings + notes are low implementation cost, high retention value. |

### Keep with scope reduction

| Epic | What to Reduce |
|------|---------------|
| Epic 6: Elevation Profile | Show static elevation profile chart with gain/loss numbers. **Cut** the interactive chart-tap → map sync feature (high complexity, low urgency). Riders want to know "is this hilly?" — not a precise GPS elevation cursor. |
| Epic 8: Ride History | Keep "Mark as Ridden" and the ridden badge. **Cut** the ride stats dashboard (total distance, count) — this belongs in a future analytics feature, not V1. |

---

## 2. What to CUT

| Epic | Cut Rationale |
|------|--------------|
| **Epic 5: Avoid Areas (circle drawing)** | Freehand polygon/circle drawing on a mobile map is technically complex and UX-intensive. Competitor Kurviger has this and it's cited as "too technical." Riders don't want to draw polygons — they want to say "avoid Highway 1." This feature should be reframed as a natural language input ("avoid toll roads", "avoid highways") rather than a spatial drawing tool. Cut the drawing UI entirely. |
| Swipe-to-delete on route cards (Epic 3) | Nice-to-have gesture interaction that adds testing complexity for minimal rider value. A delete button in detail view is sufficient for V1. |
| Elevation chart drag → map marker interaction (Epic 6) | See above — interactive sync is scope creep. Static chart answers the rider's actual question. |
| Multiple route comparison multi-overlay view (Epic 1) | The three-overlay simultaneous comparison view requires significant UI work. Showing overlays one at a time (toggle) is sufficient and what all competitors do. |

---

## 3. What to ADD

These are features the research reveals LaneShadow needs that are absent from the original PRD.

### ADD-01: Natural Language Route Planning (HIGH PRIORITY)

**Job**: "When I want to find a scenic ride, I want to describe it in words, so I can skip the pin-dropping workflow."

No competitor supports this. LaneShadow already has an AI planning pipeline (pi SDK, Convex actions). The surface area needed is a text input in the planning sheet that accepts prompts like "2-hour loop from San Jose with mountain views" and translates them to route parameters.

**Acceptance Criteria**:
- User can type a natural language route description in the planning sheet
- System translates the description into origin, destination, duration, and routing preferences
- User can view the interpreted parameters before generating the route
- System generates a route from natural language input with the same quality as manual pin input

**Effort estimate**: Medium — LLM plumbing already exists, new surface is a text field + parameter extraction prompt.

---

### ADD-02: Alternative Routes with Scenic Scoring (HIGH PRIORITY)

**Job**: "When I generate a route, I want to compare 2-3 options by scenicness, so I can pick the best one."

The backend currently returns 1 route. Google Routes API supports `computeAlternativeRoutes`. Calimoto's core value prop is showing multiple twisty-road alternatives. LaneShadow needs to match this before launch or it will fail the most common comparison test.

**Acceptance Criteria**:
- System generates 2-3 route alternatives when planning
- User can view each alternative's scenic score, distance, and weather summary on a comparison card
- User can select any alternative to view full detail
- System ranks alternatives by scenic score by default

**Effort estimate**: Low-Medium — mostly backend config change + comparison card UI.

---

### ADD-03: Conditions-Aware Route Ranking (MEDIUM PRIORITY)

**Job**: "When I'm deciding which route to take, I want the app to factor in current conditions, so I don't need to check 3 apps."

This combines weather data (already built) with the route comparison UI (ADD-02). The result is a route card that surfaces a conditions score: "Route A — 4.2★ scenic, Clear skies, 72°F, light wind." This is the experience that makes LaneShadow worth $X/month.

**Acceptance Criteria**:
- Each route comparison card displays a unified conditions score (weather + road type + time of day)
- System highlights the recommended route based on combined scenic + conditions score
- User can see the conditions score breakdown when they tap a route card
- System displays a "Best for today" badge on the top-ranked route

**Effort estimate**: Medium — depends on ADD-02 shipping first.

---

### ADD-04: AI Route Description (LOWER PRIORITY, HIGH RETENTION)

**Job**: "When I save a route, I want to understand what makes it special, so I can remember why I chose it."

Scenic generates beautiful route descriptions. LaneShadow's AI pipeline can produce these automatically. This is a retention and delight feature — it makes saved routes feel like journal entries, not just data records.

**Acceptance Criteria**:
- System generates a 2-3 sentence natural language description of each saved route
- User can view the AI description in the route detail view
- Description highlights notable features (elevation, road type, scenic landmarks)
- User can regenerate the description if they want a different framing

**Effort estimate**: Low — prompt engineering + display component.

---

## 4. Feature Priority Stack Rank

Ranked by **differentiation impact** (ability to win vs. competitors) × **effort efficiency** (value per week of work):

| Rank | Feature | Differentiation | Rationale |
|------|---------|----------------|-----------|
| 1 | Natural Language Route Planning (ADD-01) | Exclusive | No competitor has this. Low marginal cost given existing AI pipeline. Directly solves pain #8 ("too complicated"). |
| 2 | Alternative Routes with Scenic Scoring (ADD-02) | Parity+ | Required to compete with Calimoto. Unlocks conditions-aware ranking. |
| 3 | Weather Overlays Completion (Epic 1) | Parity+ | Wind built, rain + temp completes the picture. Addresses pain #7. Cost is low. |
| 4 | Conditions-Aware Route Ranking (ADD-03) | Exclusive | Combines weather + routing in one score. No competitor does this. Requires ADD-02 first. |
| 5 | Save & Reuse Favorite Roads (Epic 4) | Exclusive | Personalization moat. Backend partially done. Addresses the "send me somewhere I love" job. |
| 6 | Browse & Manage Saved Routes (Epics 2+3) | Parity | Table stakes for retention. Must ship but not a differentiator. |
| 7 | AI Route Description (ADD-04) | Exclusive | Delight feature. Low cost. Creates emotional connection to saved routes. |
| 8 | Rate Routes & Notes (Epic 7) | Parity | Needed for feedback loop. Low complexity. |
| 9 | Static Elevation Profile (Epic 6, reduced) | Parity | Nice-to-have context. Low complexity if interactive sync is cut. |
| 10 | Ride History (Epic 8, reduced) | Parity | Completes the post-ride loop. Minimal scope. |
| — | Avoid Areas draw tool (Epic 5) | Cut | Reframe as NL input ("avoid highways"). Drawing UI costs too much for too little. |

---

## 5. Pricing Recommendation

**Market context**:
- Calimoto: $80/yr — highest price, most backlash
- Scenic: ~$60/yr — loved but iOS only
- REVER: $40/yr
- Kurviger: €30/yr
- Motobit: €30/yr
- 68°: Free (VC-backed, early)

**Recommendation: $39.99/year with a permanently useful free tier**

| Tier | Price | What You Get |
|------|-------|-------------|
| Free | $0 | 5 route plans/month, 3 saved routes, wind overlay, NL planning (limited) |
| Pro | $39.99/yr | Unlimited routes, all weather overlays, conditions scoring, favorite roads, ride history |

**Rationale**:
1. Price below Scenic ($60) and Calimoto ($80) to avoid subscription fatigue (pain #3)
2. Price above free competitors (68°) to signal quality and fund AI infrastructure costs
3. Free tier must deliver real value — riders who try NL planning and get a good route will convert
4. Annual-only pricing avoids the "cancel monthly" churn pattern that hurts Calimoto
5. Do NOT add a monthly tier at launch — it trains users to churn

**Avoid**: Freemium gates that feel punitive ("pay to see weather"). Weather preview (current conditions badge) should be free; full overlay interaction is Pro.

---

## 6. Positioning Statement

**Primary positioning**:
> LaneShadow is the AI-native motorcycle ride planner that finds your next great ride in plain English, shows you conditions before you leave, and learns your favorite roads over time.

**Against specific competitors**:

| Competitor | LaneShadow's line |
|-----------|------------------|
| Calimoto | "Same twisty roads. No subscription sticker shock. Just tell us where you want to go." |
| Scenic | "Scenic is beautiful — but iOS only. LaneShadow is available everywhere, with AI you can actually talk to." |
| REVER | "More than community routes — routes that know your roads and your weather." |
| 3-app stack | "Stop juggling Google Maps, Weather Channel, and your notes app. One app that does all three." |

**Core brand promise**: LaneShadow knows where you like to ride and handles the planning, so you can focus on the road.

---

## 7. V1 MVP Scope

The minimum viable set that makes LaneShadow worth downloading and paying for:

### Must Ship (MVP Gate)

| Feature | Source | Why Required |
|---------|--------|-------------|
| Natural Language Route Planning | ADD-01 | Primary differentiator. If this doesn't work well, there's no story. |
| Alternative Routes (2-3 options) | ADD-02 | Riders will not accept single-route output in 2026. Must show options. |
| Weather Overlays (rain + temp + wind) | Epic 1 | Conditions context completes the planning story. Wind alone is insufficient. |
| Conditions-Aware Ranking | ADD-03 | Ties NL planning + weather into a single "recommended route" moment. |
| Save Routes + Basic Browse | Epics 2+3 | Without save, there's no retention. Without browse, saves are useless. |
| Favorite Roads (save + include in planning) | Epic 4 | The personalization hook that makes LaneShadow better over time. |

### Ship at V1 if time permits (Nice-to-Have)

| Feature | Source | Drop if pressed |
|---------|--------|----------------|
| Rate Routes + Notes | Epic 7 | Yes — useful but not acquisition-driving |
| AI Route Description | ADD-04 | Yes — delight feature, not blocking |
| Static Elevation Profile | Epic 6 (reduced) | Yes — informational, not critical |
| Mark as Ridden badge | Epic 8 (reduced) | Yes — low complexity, adds completeness |

### Explicitly Deferred to V2

| Feature | Reason |
|---------|--------|
| Avoid Areas (drawing UI) | Reframe as NL input ("avoid highways") when NL planning is mature |
| Turn-by-turn navigation | Integration complexity; Waze/Google Maps export is sufficient for V1 |
| Group rides / social features | High complexity, requires critical mass; V2 after user base exists |
| Personal analytics dashboard | Requires usage data accumulation; meaningful only post-launch |
| Offline mode | Complexity and infrastructure cost; defer until core experience is polished |
| Android Auto / CarPlay | Platform certification overhead; V2 priority given pain point #6 is real |
| Multiple vehicle profiles | Nice-to-have; single profile is fine for V1 |

---

## Strategic Risk Factors

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| NL planning quality is inconsistent | Medium | Invest in prompt quality before launch; gate on confidence score before showing results |
| Google Routes API cost at scale | Medium | Monitor cost per route plan; add caching for popular corridors |
| 68° goes freemium before launch | Low | LaneShadow's personalization (favorite roads + conditions) is not replicable quickly |
| Scenic releases Android app | Medium | Speed to market matters; ship before Scenic expands |
| Riders don't trust AI routing | Medium | Show the reasoning ("This route includes your saved SR-1 segment") to build trust |

---

## Summary Decision Table

| Decision | Recommendation |
|----------|---------------|
| Price | $39.99/yr, generous free tier |
| Primary differentiator | Natural language planning + conditions-aware routing |
| Cut | Avoid Areas draw tool, interactive elevation sync, multi-overlay simultaneous comparison |
| Add | NL planning, alternative routes, conditions scoring, AI route descriptions |
| V1 gate feature | "Plan a scenic ride in one sentence and see which option fits today's weather" |
| Positioning | AI-native planner that knows your roads and conditions |
| Launch target | Both iOS and Android simultaneously (vs. Scenic's iOS-only gap) |
