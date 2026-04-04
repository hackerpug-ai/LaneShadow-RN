# LaneShadow v1 — Unified Strategy & UX Recommendation

**Date**: 2026-04-03
**Authors**: product-manager + frontend-designer (synthesized by orchestrator)
**Status**: RECOMMENDATION — for founder review

---

## The One-Line Strategy

**Build the motorcycle app where you describe your ride in a sentence and get back weather-informed options in 10 seconds.**

No competitor does this. Every competitor requires manual pin-dropping. LaneShadow leapfrogs the market by treating the rider's intent as the input, not coordinates.

---

## What We're Building (V1 MVP)

### The 6 Must-Ship Features

| # | Feature | Source | Why It's Required |
|---|---------|--------|-------------------|
| 1 | **Natural Language Route Planning** | NEW | Primary differentiator. No competitor has it. The AI pipeline exists. |
| 2 | **2-3 Alternative Routes** | NEW | Single-route output is unacceptable in 2026. Google `computeAlternativeRoutes` makes this near-free. |
| 3 | **Full Weather Overlays** (rain + temp + wind) | Epic 1 | Wind is built. Rain + temp completes the story. Addresses pain #7. |
| 4 | **Conditions-Aware Route Ranking** | NEW | "Best for today" badge combining weather + scenicness. No competitor does this. |
| 5 | **Save Routes + Basic Browse** | Epics 2+3 | Table stakes for retention. Search by name + date filter. |
| 6 | **Favorite Roads** (save + auto-include) | Epic 4 | Personalization moat. Backend partially built. |

### Nice-to-Haves (ship if time)

- Rate routes + notes (Epic 7) — retention
- AI route descriptions (NEW) — delight
- Static elevation profile (Epic 6, no interactive sync) — context
- Mark as Ridden badge (Epic 8) — completeness

### Explicitly Cut

- **Avoid Areas draw tool** (Epic 5) — reframe as NL input ("avoid Highway 1")
- Swipe-to-delete, multi-overlay simultaneous comparison, elevation chart interactivity
- Turn-by-turn navigation, group rides, offline mode, Android Auto/CarPlay — all V2

---

## The UX Flow (7 States)

```
IDLE → tap "Where to, or describe your ride..." bar
  ↓
NLP INPUT → bottom sheet: multi-line text + suggestion chips + preference chips + optional destination
  ↓  tap "Plan It"
PLANNING → sheet morphs to progress phases: "Reading your ride..." → "Finding scenic roads..." → "Checking weather..." → "Building options..."
  ↓  ~8-12 seconds
ROUTE RESULTS → sheet collapses to 30% tray, map shows 2-3 polylines simultaneously
  ↓  tap route card or map polyline
SELECTED → "Start Navigation" button appears, weather detail expandable
  ↓  tap Go
NAVIGATION → map zooms to rider, floating nav bar with next turn + ETA

At any point: "Switch to manual mode" → existing PlanRideSheet (prefs carry over)
```

### Key Design Decisions (from both agents)

1. **Map stays visible throughout** — no full-screen scrims after NLP input
2. **Weather is always-on** in route cards and on map polyline — not a toggle to find
3. **Progress shows real backend phases** not fake timer text
4. **Manual mode is fallback**, not primary — NLP is the default experience
5. **Route cards are compact (80px)** with label + stats + weather badge in a horizontal scroll
6. **"Describe Your Ride" bar** replaces the current "Where to?" search — sets a different mental model

### New Components Needed (7)

| Component | What It Does |
|-----------|-------------|
| `DescribeRideBar` | Entry bar in map header — replaces "Where to?" |
| `NlpInputSheet` | Multi-line text + chips + optional destination |
| `PlanningProgressSheet` | Phase-labeled progress (replaces full-screen loading) |
| `RouteResultsTray` | Compact 30% sheet with horizontal card scroll |
| `WeatherTimelineSheet` | Expandable hourly weather chart for a route |
| `RouteWeatherBadge` | Compact inline badge (icon + label) on route cards |
| `AnimatedSketchPolyline` | Dashed animated polyline during planning |

### Existing Components Reused (10+)

BottomSheetWrapper, LocationInput, PreferencesRow, Button, Badge, IconSymbol, MapViewWrapper, RouteOptionCard, SheetHandle, RouteTimeline

---

## Pricing

| Tier | Price | Includes |
|------|-------|---------|
| **Free** | $0 | 5 plans/month, 3 saved routes, wind overlay, limited NL planning |
| **Pro** | $39.99/yr | Unlimited plans, all weather overlays, conditions scoring, favorite roads, ride history |

Rationale: Below Calimoto ($80) and Scenic ($60). Above free apps. Annual-only at launch — no monthly tier to prevent churn training.

---

## Positioning

> **LaneShadow** — the AI-native motorcycle ride planner. Describe your ride in plain English, see conditions before you leave, and it learns your favorite roads over time.

| vs Competitor | Our Line |
|--------------|----------|
| Calimoto ($80) | Same twisty roads. No sticker shock. Just tell us where you want to go. |
| Scenic (iOS only) | Beautiful — but we're on Android too, with AI you can actually talk to. |
| REVER | More than community routes — routes that know your roads and your weather. |
| 3-app stack | Stop juggling Google Maps, weather apps, and your notes. One app. |

---

## V1 Gate Test

**A rider opens the app, types "scenic 2-hour ride to Santa Cruz, avoid highways", and 10 seconds later sees 3 route options with weather badges showing which route avoids afternoon rain.**

If that works and feels magical, V1 ships.

---

## Risk Factors

| Risk | Mitigation |
|------|-----------|
| NL planning quality inconsistent | Confidence scoring — show results only when confident. Fallback to manual mode. |
| Google Routes API cost | Cache popular corridors. Monitor cost per plan. |
| Scenic launches Android | Ship first. Our NLP + weather is 12+ months ahead. |
| Riders don't trust AI routing | Show reasoning: "This route includes your saved SR-1 segment" |

---

## Recommended Next Steps

1. **Implement `computeAlternativeRoutes`** — get 2-3 routes from Google immediately (2 hours)
2. **Build `NlpInputSheet` + `DescribeRideBar`** — the signature UX (1 week)
3. **Complete rain + temperature overlays** — close Epic 1 gaps (3 days)
4. **Build `RouteResultsTray` with weather badges** — the results experience (1 week)
5. **Wire NL input → orchestrator** — connect text description to route planning pipeline (3 days)
6. **Ship public beta** with NL planning + weather + 2-3 routes as the hero flow
