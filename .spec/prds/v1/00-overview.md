---
stability: PRODUCT_CONTEXT
last_validated: 2026-04-03
prd_version: 1.4.0
---

# LaneShadow V1 — Product Overview

## Vision

**"Ride the Moment"** — The best rides aren't planned, they're imagined. LaneShadow makes it effortless to turn a feeling into a road.

## Philosophy: The Opinionated Navigator

LaneShadow's AI isn't a transcription service — it's an **opinionated motorcycle navigator** that draws on its knowledge of road networks to author creative routes. When a rider says "scenic ride to Santa Cruz," the AI doesn't just parse keywords and feed them to an algorithm. It picks the roads: *"Take the 280 south to 92, hop on Skyline Blvd down to Alice's Restaurant, then drop to Half Moon Bay via Highway 84."*

This is **"The Californians Pattern"** — named after the SNL sketch where characters have encyclopedic knowledge of LA freeways and strong opinions about which routes to take. That's exactly the role the AI plays: opinionated, knowledgeable, and willing to argue about the best way to get there.

The AI authors routes. Google Maps validates them. When a segment doesn't work, the AI gets specific feedback about *which* leg failed and *why*, then surgically revises just that piece — like a navigator recalculating after a wrong turn, not starting over from scratch.

This means:
- **Generic requests get creative answers.** "Scenic 2-hour ride" doesn't produce algorithmic waypoint clustering — it produces a curated itinerary with named roads the AI knows are good riding.
- **Constraints work naturally.** "Avoid Market Street" doesn't need an API flag — the AI simply routes around it in the sketch.
- **Hallucinations are features, not bugs.** If the AI picks a road that doesn't connect, Google catches it and the AI recovers with an alternative. The retry loop turns imperfect knowledge into validated routes.
- **The rider talks to a navigator, not a search engine.** The conversation feels like asking a local who rides.

## Product Description

LaneShadow is an AI-native motorcycle ride planner built around a conversational map experience. The map is always the primary view. An opinionated AI navigator lives in a lightweight chat interface overlaying the map — like a riding buddy who knows every road. Riders have a conversation with the navigator: "scenic 2-hour loop from San Jose, avoid highways" and the AI authors a route using roads it knows — picking specific highways, backroads, and landmarks — then validates each segment against Google Maps. The result: 2–3 weather-informed route options as chat attachments rendered directly on the map. Then the rider can refine: "actually avoid Highway 1" or "make it shorter" — and the navigator revises the relevant segments without starting over.

Think ChatGPT where the main view is a map, routes are the artifacts, and the AI has opinions about roads.

The system uses an **LLM-first routing architecture**: the AI sketches routes from its own road knowledge, Google Maps validates per-segment, and a retry loop handles any segments that don't work. **pi core** provides the agent framework for session management and conversation context. Deterministic workflows handle weather fetching, data persistence, and conditions scoring. This architecture ensures the AI is the creative engine while Google Maps is the ground truth.

V1 ships the full conversational planning experience, completes the weather overlay story, and adds the personalization foundation (saved routes, favorite roads) that creates long-term retention.

## Problem Statement

Riders who want to plan a great ride today face three compounding problems:

1. **Planning requires 3 separate apps.** Riders use Google Maps to set a route, a weather app to check conditions, and notes or memory to recall favorite roads. There is no single tool that integrates all three.

2. **Route discovery is a manual drag-and-drop workflow.** Every competing app — Calimoto, Scenic, REVER — requires riders to drop pins on a map. This workflow is borrowed from car navigation and ignores how riders actually think about rides: by feeling, duration, vibe, and familiarity, not by GPS coordinates.

3. **Weather context arrives too late.** Riders either check weather separately and try to mentally map it to their route, or they skip weather entirely and get caught in rain. No competitor surfaces weather-per-route as part of the planning decision.

## Solution Summary

LaneShadow V1 solves all three problems in a single, connected experience:

1. **AI-Authored Routes on the Map**: A rider opens the app and sees a map with a chat input bar at the bottom. They type what they want — even something vague like "scenic 2-hour ride" — and the AI navigator authors a route using roads it knows, picking specific highways, backroads, and landmarks. Google Maps validates each segment independently. The result: 2–3 weather-informed route alternatives rendered directly on the map as chat attachments. The rider can then refine iteratively: "avoid Highway 1", "make it shorter", "add a stop at Big Sur." The AI revises only the affected segments, keeping what worked. Each exchange builds on the last within a persistent session. The AI's responses appear as temporary overlays on the map that fade away, keeping the map primary. Full chat history is available by expanding the chat view.

2. **Weather-Informed Route Comparison**: Each route alternative carries a full weather profile (wind, rain, temperature) rendered as overlays on the map polyline and compact badges on route attachment cards. The highest-ranked route gets a "Best for today" conditions badge.

3. **Personalization That Compounds**: Riders save routes they love and mark road segments as favorites. Those favorites automatically influence future route generation — making LaneShadow measurably smarter the longer a rider uses it.

## V1 Gate Test

> A rider opens the app, types "scenic 2-hour ride to Santa Cruz, avoid highways", and 10 seconds later sees 3 route options with weather badges on the map — each built from specific roads the AI chose (not generic algorithmic waypoints). They say "actually avoid Highway 1" and the AI revises just the coastal segments, keeping the mountain legs intact.

If the routes feel like a local rider picked them — not like an algorithm generated them — V1 ships.

---

## Current Implementation Status (as of 2026-04-03)

**Overall Completion**: ~23% of V1 scope implemented

| Functional Group | Completion | Status |
|------------------|-----------|--------|
| Agentic Conversational Planning | 0% (0/11 UCs) | Chat infrastructure does not exist; current implementation is manual form-based |
| WX (Weather & Conditions) | 29% (1/7 implemented, 2/7 partial) | Wind overlay complete; rain/temp/badges/timeline missing |
| SR (Saved Routes & Favorites) | 60% (3/10 implemented, 4/10 partial) | Browse/search/delete implemented; rating/notes/re-plan/export missing |

**Critical Architectural Gap**: The V1 PRD describes an **opinionated AI navigator** that authors routes from road knowledge. The current codebase implements a **manual planning form** backed by a deterministic orchestrator. This requires both chat infrastructure and an LLM-first routing architecture to be built.

**LLM-First Routing Migration**: The current pipeline uses `findScenicWaypoints` (Overpass) → `compileSketch` (single Google Maps call) for route generation. V1 requires:
- **LLM-authored route sketches**: AI picks specific roads and landmarks, not algorithmic waypoint clustering
- **Per-segment Google Maps validation**: Each segment compiled independently, not all-or-nothing
- **Rich retry feedback**: Failed segments return specific context (which leg, why, Google's alternative) for surgical revision
- **Deterministic fallback**: Existing orchestrator remains for areas where the AI is uncertain

**Phase 0 Remediation Required** (BLOCKING V1 Implementation):
- 24 components import directly from `@expo/vector-icons` (breaks web compatibility)
- 10 components use core React Native `Text` instead of Paper (breaks theme system)
- Hardcoded colors in map components (breaks dark mode)

**Estimated Time to V1 Gate Test**: 4-5 weeks after Phase 0 remediation (7-11 hours)

See `.spec/artifacts/team-product/2026-04-03-v1-prd-adjustment-plan-report.md` for comprehensive gap analysis and implementation roadmap.
