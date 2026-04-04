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
