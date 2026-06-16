---
delta_id: DELTA-001
title: Discovery as the map + chat conversation (remove the dedicated Discover screen)
stability: FEATURE_SPEC
status: folded into the canonical PRD body at v3.0.0 (2026-06-15)
added: 2026-06-14
added_after: project start / Sprint 01 already in flight
implement_in: sprint-01 (folded in via kb-sprint-plan --delta-replan, 2026-06-14)
prd_version: 2.0.0
supersedes_at_implementation:
  - UC-DISC-02 (dedicated Discovery default-landing + chat demoted to a drawer entry)
  - UC-DISC-05 (wire RouteDiscoveryScreen MOCK_ROUTES → live hook)
  - UC-DISC-06 (standardize RouteDiscoveryScreen pins on MapboxMapView)
  - UC-DISC-07 / UC-DISC-08 (legibility + empty/loading on the dedicated screen)
  - route app/(app)/(tabs)/discover.tsx (deleted)
---

# DELTA-001 — Discovery as the map + chat conversation

> **✅ Folded into the canonical PRD body at v3.0.0 (2026-06-15).** This delta is now **historical record**. Its content is canonical in [01-scope.md](./01-scope.md), [03-functional-groups.md](./03-functional-groups.md), [05-uc-disc.md](./05-uc-disc.md) (UC-DISC-09/10/11), and [09-technical-requirements/09-routing.md](./09-technical-requirements/09-routing.md) (Route Delta v3.0.0). v3.0.0 went one step further than this delta: it **removes the separate discovery view entirely** and tightens discovery to **curated-route suggestion cards over the chat input + chat-driven NL discovery** — no archetype filter-bar, sort-toggle, or by-state browse picker.

> **This was a post-start delta.** Added **2026-06-14**, *after* the PRD was authored and *after* Sprint 01 was already In Progress on the dedicated-screen approach. It was first approved as *deferred*; on **2026-06-14** the product owner pulled it **into Sprint 01** via `kb-sprint-plan --delta-replan` — Sprint 01 was reframed from "Live Discovery Home" to **"Discovery on the Map/Chat Home"**, the former legibility sprint and the deferred delta sprint were **absorbed**, and the capstone was **re-pointed** at the unified home. The in-flight dedicated-screen work (DISC-001/003/004) is **reworked, not kept**. The v1.1.0 use cases / routing remain the historical record of the dedicated-screen approach; the live plan is [ROADMAP.md](./ROADMAP.md) Sprint 01.

## 1. The core insight

Discovery is **not a separate screen** and **not a new interaction loop to invent**. It is the behavior of the app's single **map + chat home** (`app/(app)/(tabs)/index.tsx`), and it **rides machinery that already exists** there. Verified in code 2026-06-14:

- The chat agent already emits route suggestions as **`routing_card` messages** that render as **`RouteAttachmentCard`s in the chat transcript** (`components/chat/routing-card.tsx` → `components/chat/route-attachment-card.tsx`).
- The map already shows the **latest suggested route** by default (`hooks/use-active-session-route.ts` resolves the newest plan unless one is pinned).
- Pressing a **previous route card** in the transcript already **re-renders that route on the map and returns the user to map view** — `route-attachment-card.tsx:119` (`handlePress` → `onSelect()` + `onViewOnMap()`), `routing-card.tsx:251` (`setSelectedRouteId` + `setDisplayedRoutePlanId` + camera fit), `index.tsx:1209` (`onViewOnMap → setChatMode(false)`).
- The **suggestion-pill slot above the chat input already exists and is context-dependent** (`components/chat/chat-input.tsx:186`), but today it shows generic *planning* prompts (`IDLE_SUGGESTIONS`, `index.tsx:68`) and is keyed to "empty session," not "no route on screen."

So the delta is **small and low-risk**: repoint the existing pills + chat-card machinery at the curated catalog. It is **not** a new discovery surface.

## 2. Discovery is two things on the one home

**(1) Suggestion pills above the chat input — when there is NO route on the map.**
- The pills suggest **whole curated routes** (drawn from the live catalog), not generic planning prompts. Tapping one plots that route on the map.
- **Visibility is keyed to "no active route on the map"** (not "empty session"): pills show whenever the map has no route displayed — including mid-conversation or after a route is dismissed/cleared — and **hide whenever a route is on screen**.

**(2) Routes — as a card in chat and/or on the map.**
- In chat: **any route the agent suggests is a card in the chat history** (the existing `RouteAttachmentCard`).
- On the map: the **latest suggested route** is rendered.
- The rider can **press a previous route card in the chat history** and that route renders on the map, **returning them to map view** after the press.
- Natural-language discovery is **in scope**: "twisties near Asheville" → the agent returns curated route(s) as cards → latest plots on the map → refine by chatting further.

## 3. Full user flow (confirmed 2026-06-14)

**Home = one full-screen map with a docked chat input. No separate Discover screen. No drawer-hidden chat.**

**State A — no route on the map** (cold open, or after clearing/dismissing a route):
1. Suggestion pills above the input offer **whole curated routes** (e.g. "Tail of the Dragon · 11mi twisties"). Tap → that route plots on the map.
2. Or chat it: "twisties near Asheville" → agent returns curated route card(s) and plots the latest on the map.

**State B — route(s) on the map** (pills hidden, because a route is on screen):
3. Latest suggested route renders on the map; every suggested route is a card in chat history.
4. Tap an earlier route card → it re-renders on the map and drops the rider back to map view *(existing behavior)*.
5. Keep refining by chatting → new cards + map updates each turn.
6. Tap the route/pin → detail (headline, score bars, geometry/weather) → **Save** → **Ride-it** *(unchanged MVP)*.

**Full chat view:** the existing `chatMode` toggle, surfaced as a **button to the right of the chat input** (the existing toast → chat tap path also stays).

```
┌─────────────────────────────────┐     STATE A (no route): pills suggest whole routes
│         FULL-SCREEN MAP         │     STATE B (route on map): pills hidden, route shown
│            ~ route ~            │
│  ┌───────────────────────────┐  │  ← agent reply / route card lives in chat history
│  │  pill  ·  pill  ·  pill    │  │  ← suggestion pills (State A only): whole curated routes
│  ┌──────────────────────┐ ┌──┐  │
│  │  ask… (chat input)   │ │▢ │  │  ← footer: input + [open full chat] button (not send)
│  └──────────────────────┘ └──┘  │
└─────────────────────────────────┘
```

## 4. Scope deltas

**Moves INTO scope**
- **Natural-language / chat-driven curated-route discovery** — the agent interprets requests and returns curated routes as the existing route cards. (Previously the explicit Out-of-Scope bullet "Natural-language search inside Discovery" in [01-scope.md](./01-scope.md).)
- **Curated-route suggestion pills** — the existing idle-pill slot, re-pointed to whole curated routes and re-keyed to "no route on the map."

**Changes / leaves scope**
- **Dedicated Discovery screen** (`discover.tsx` / `RouteDiscoveryScreen` as a standalone route) — **removed** from the target architecture.
- **Archetype filter-chips + best/nearest sort-toggle** (`DiscoveryFilterBar`, `DiscoverySortToggle`) — **dropped** from the discovery UX (redundant with conversational refinement; keeps the map clean). Components may be deleted or left unmounted.
- **Chat-agent "demotion to a drawer entry"** — superseded. Chat is integral to the home; the full chat view opens from the footer button (reusing the existing `chatMode` toggle).

**Reused as-is (no change)**
- The `routing_card` / `RouteAttachmentCard` → map → "tap an old card to re-render + return to map" loop.
- The Sprint-1 backend (`listCuratedRoutes`, `useCuratedDiscovery`, geospatial seed, archetype map, state/length normalize) as the **data source** feeding both the pills and the agent's curated-route results.
- Route detail, Save (`curatedRouteRef`), and Ride-it handoff.

## 5. Use-case deltas (authored in full when the delta sprint is scheduled)

Existing DISC use cases stay in [05-uc-disc.md](./05-uc-disc.md) as the Sprint 01 record. At delta-implementation time:

**New**
- **UC-DISC-09 — Rider discovers whole curated routes from the suggestion pills.** ☐ Rider can see suggestion pills offering whole curated routes whenever no route is on the map. ☐ Rider can tap a suggested-route pill and see that curated route plot on the map. ☐ System hides the suggestion pills whenever a route is displayed on the map. ☐ System sources the pill suggestions from the live curated catalog (not hardcoded prompts).
- **UC-DISC-10 — Rider discovers curated routes by chatting; results ride the existing card→map loop.** ☐ Rider can type a natural-language request and receive curated route(s) as cards in the chat history. ☐ Rider can see the latest suggested curated route rendered on the map. ☐ Rider can press an earlier curated-route card in the chat history and see it re-render on the map, returning to map view. ☐ System carries composite scores through chat-driven results on the raw 0–1 scale (rendered as bars/%, never 0–100).
- **UC-DISC-11 — Unified map/chat home replaces the dedicated Discover screen.** ☐ Rider can launch the app and land on the single map/chat home (no separate Discover screen, no drawer-hidden chat). ☐ Rider can open the full chat view from a button to the right of the chat input in the bottom footer. ☐ System renders that button as a navigation affordance distinct from the chat send action.

**Superseded at implementation**
- **UC-DISC-02** (dedicated Discovery default-home + chat demotion) → replaced by UC-DISC-11.
- **UC-DISC-05 / UC-DISC-06** (wire/standardize the standalone `RouteDiscoveryScreen`) → obsolete; discovery rides `index.tsx`.
- **UC-DISC-07 / UC-DISC-08** (legibility + empty/loading on the dedicated screen) → re-scoped to the pills + chat affordances on the home (the structured filter-bar/sort overlays they assert are dropped).
- **UC-DISC-01** (full discover-to-ride capstone) → updated to land on the unified home rather than the dedicated screen.

## 6. Routing delta — see [09-technical-requirements/09-routing.md](./09-technical-requirements/09-routing.md) "Route Delta (v2.0.0 — folded into Sprint 01)"

- **DELETED** `app/(app)/(tabs)/discover.tsx` — the dedicated Discovery route is removed.
- **CHANGED** `app/(app)/(tabs)/index.tsx` — already the map + chat home; gains curated-route suggestion pills (keyed to "no route on map"), curated routes via the agent's `routing_card`s, and a footer "open full chat" button. Becomes the default landing.
- **SUPERSEDED** the drawer "Plan a ride" entry as the chat path — chat is reached on the home / via the footer button.

## 7. Implementation timing

- **Folded into Sprint 01 on 2026-06-14** via `kb-sprint-plan --delta-replan`. Sprint 01 was reframed from "Live Discovery Home" (dedicated screen) to **"Discovery on the Map/Chat Home"**; the in-flight dedicated-screen tasks (DISC-001/003/004) are reworked into **DATA-008 + DISC-010..015**. See [ROADMAP.md](./ROADMAP.md) → Sprint 01.
- **Absorbed / re-pointed:** the former Sprint 02 (legibility of the dedicated screen) and the previously-deferred delta sprint were **absorbed into Sprint 01**; the capstone (now Sprint 03) was **re-pointed** at the unified home. Route Detail (now Sprint 02) is unaffected — it is its own pushed route.
- **Net-new backend:** one task — **DATA-008** — gives the chat agent a tool to map a natural-language request to `listCuratedRoutes` and surface curated routes through the existing `routing_card` contract (the determinism seam). No schema change.

## 8. Test-criteria delta

[10-e2e-testing-criteria.md](./10-e2e-testing-criteria.md) criteria for UC-DISC-09/10/11 are authored JIT when the delta sprint is scheduled, against real iOS + Android + live Convex. NL parsing for chat-driven discovery introduces a **determinism seam** — fixture the model/intent signal and assert engine OUTCOMES (which curated routes are surfaced/plotted), not prose, per the e2e harness rules. The capstone (UC-DISC-01) is updated to verify the discover-to-ride arc on the unified home.
