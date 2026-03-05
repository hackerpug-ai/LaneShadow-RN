# Motorcycle Scenic Route Planner – v1.0

## Purpose

This PRD defines the scope and requirements for LaneShadow, a motorcycle trip planning application focused on scenic route discovery with comprehensive safety context and personalization features.

## Problem Statement

Motorcycle riders lack a simple, motorcycle-specific tool for discovering scenic routes they can trust, save for future rides, and personalize based on their preferences and riding history.

## Vision

Create the go-to route planning companion for recreational motorcyclists that combines AI-powered scenic route discovery with weather-aware safety overlays, personal route preferences, and ride tracking.

## Target User

**Primary**: Solo recreational motorcycle riders who plan rides ahead of time and prefer scenic, enjoyable routes over purely fastest paths.

**Characteristics**:
- Plans rides in advance (not real-time navigation)
- Values scenic quality over speed
- Wants weather/safety context before departing
- Returns to favorite roads and routes
- Rides 2-4 times per month (seasonal)

---

## Phased Delivery Roadmap

### Phase 1: Core POC (Sprints 1-5) ✅ In Progress

**Goal**: Validate core value proposition — scenic route discovery with wind overlay.

| Feature | Status | Sprint |
|---------|--------|--------|
| Start/end location input | ✅ Done | 1-4 |
| Departure date and time | ✅ Done | 4 |
| 2-3 scenic-biased route options | ✅ Done | 3 |
| Wind exposure overlay | ✅ Done | 3 |
| Route summaries (distance, duration, rationale) | ✅ Done | 3-4 |
| Save and reopen routes | ⏳ Sprint 4 | 4 |
| Lightweight user accounts | ✅ Done | 1 |
| Rain forecast overlay | 🆕 Planned | 5 |
| Temperature overlay | 🆕 Planned | 5 |
| Side-by-side route comparison | 🆕 Planned | 5 |
| Enhanced rationale display | 🆕 Planned | 5 |

### Phase 2: Personalization (Sprints 6-7)

**Goal**: Enable riders to customize route generation based on preferences and favorites.

| Feature | Priority | Sprint |
|---------|----------|--------|
| Favorite roads library | HIGH | 6 |
| Avoid specific areas/roads | MEDIUM | 6 |
| Elevation profile visualization | MEDIUM | 7 |
| Enhanced overlay comparison view | MEDIUM | 7 |

### Phase 3: Post-Ride Experience (Sprints 8-9)

**Goal**: Close the ride loop with tracking, rating, and history.

| Feature | Priority | Sprint |
|---------|----------|--------|
| Route rating system (1-5 stars) | MEDIUM | 8 |
| Ride notes/comments | MEDIUM | 8 |
| Ride history browser | MEDIUM | 8 |
| Time-of-day optimization | LOW | 9 |

### Deferred (v2+ / Pending Data Availability)

| Feature | Reason |
|---------|--------|
| Road surface quality scoring | No reliable free data source identified |
| Personal analytics dashboard | Requires usage data; engagement feature |
| Live ride tracking/navigation | Out of scope for planning-focused app |
| Push notifications | Deferred until core value validated |
| Social/sharing features | Deferred until user base established |
| Multiple vehicle profiles | Single vehicle focus for v1 |

---

## In Scope (v1.0 Complete)

### Phase 1 - Core Planning
- Start and end location input with Google Places autocomplete
- Departure date and time selection
- 2-3 scenic-biased route options via LLM-powered planning
- Weather overlays: wind exposure, rain forecast, temperature
- Route summaries with distance, duration, and scenic rationale
- Side-by-side route comparison with overlay preview
- Save routes with immutable snapshots
- Reopen saved routes with identical rendering
- Lightweight user accounts (Clerk auth)

### Phase 2 - Personalization
- Favorite roads library (save, browse, include in routes)
- Avoid areas/roads preference
- Elevation profile visualization
- Multi-overlay comparison view

### Phase 3 - Post-Ride
- Route rating system
- Ride notes and comments
- Ride history browser
- Time-of-day departure optimization

---

## Out of Scope (v1.0)

- Live ride tracking or turn-by-turn navigation
- Push notifications
- Route dragging or waypoint editing
- Road surface quality scoring (data source TBD)
- Social features (sharing, following, public routes)
- Multiple vehicle profiles
- Offline mode
- Personal analytics dashboard

---

## Core User Flows

### Flow 1: Plan a Ride (Primary)
1. User enters start, end, and departure time
2. (Optional) User sets preferences (avoid highways, scenic bias)
3. App generates 2-3 scenic route options with overlays
4. User compares routes side-by-side with weather context
5. User selects preferred route and views details
6. User saves route for the ride

### Flow 2: Reopen Saved Route
1. User opens saved routes list
2. User selects a route
3. App renders identical snapshot (no recomputation)
4. User can view all overlays and details

### Flow 3: Post-Ride Review (Phase 3)
1. User completes ride
2. User opens saved route
3. User rates the route (1-5 stars)
4. User adds notes/comments
5. Route appears in ride history

### Flow 4: Personalize Preferences (Phase 2)
1. User discovers a great road segment
2. User saves road as favorite
3. On next plan, favorite roads influence route generation
4. User can also set areas to avoid

---

## Success Metrics

### Phase 1 Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| Route save rate | >40% of planned routes | saved / planned |
| Time to decision | <3 min comparing | session timing |
| Overlay engagement | >60% view weather overlays | toggle tracking |
| Return usage | >2 sessions/month | MAU/sessions |

### Phase 2 Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| Favorite roads adoption | >30% of active users | users with 1+ favorites |
| Preference-influenced routes | >50% of plans | plans with preferences set |
| Favorite road reuse | >20% of routes include a favorite | route analysis |

### Phase 3 Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| Rating completion | >25% of saved routes rated | ratings / saves |
| Notes added | >10% of rated routes have notes | notes / ratings |
| History engagement | >1 history view/month | page views |

---

## Risks & Assumptions

### Assumptions
- A1: LLM has sufficient knowledge of scenic motorcycle roads
- A2: Riders trust algorithmic route recommendations
- A3: Weather overlay data (wind, rain, temp) is accurate enough for planning
- A4: Riders will save routes (not just plan and forget)
- A5: Favorite roads will be reused, not just saved

### Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| LLM hallucinates roads | Medium | High | Provider validation, repair loop |
| Weather data inaccuracy | Low | Medium | Advisory labeling, time bounds |
| Low route save rate | Medium | High | Improve UX, add incentives |
| Preference complexity | Medium | Medium | Start simple, iterate |
| Road surface data unavailable | High | Medium | Defer to v2, explore crowdsourcing |

---

## Change Log

| Date | Version | Type | Description | Contributors |
|------|---------|------|-------------|--------------|
| 2025-01-11 | 0.1 | Initial | POC scope definition | — |
| 2026-01-29 | 1.0 | Expansion | Phased v1 with 3 phases: weather overlays, personalization, post-ride | @engineering-manager, @product-manager, @scope-definer |
