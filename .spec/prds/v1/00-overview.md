---
stability: PRODUCT_CONTEXT
last_validated: 2026-04-03
prd_version: 1.3.0
---

# LaneShadow V1 — Product Overview

## Vision

**"Ride the Moment"** — The best rides aren't planned, they're imagined. LaneShadow makes it effortless to turn a feeling into a road.

## Product Description

LaneShadow is an AI-native motorcycle ride planner built around a conversational map experience. The map is always the primary view. An agentic AI planner lives in a lightweight chat interface overlaying the map — like a copilot looking over your shoulder. Riders have a conversation with the planner: "scenic 2-hour loop from San Jose, avoid highways" returns 2–3 weather-informed route options as chat attachments rendered directly on the map. Then the rider can refine: "actually avoid Highway 1" or "make it shorter" — and the planner updates the routes in-context without starting over.

Think ChatGPT where the main view is a map and routes are the artifacts.

The system uses **pi core** as its agent framework, combining agentic reasoning (for understanding rider intent and generating route descriptions) with deterministic workflows (for route computation, weather fetching, and data persistence). This hybrid architecture ensures reliable route generation while maintaining the flexibility of conversational interaction.

V1 ships the full conversational planning experience, completes the weather overlay story, and adds the personalization foundation (saved routes, favorite roads) that creates long-term retention.

## Problem Statement

Riders who want to plan a great ride today face three compounding problems:

1. **Planning requires 3 separate apps.** Riders use Google Maps to set a route, a weather app to check conditions, and notes or memory to recall favorite roads. There is no single tool that integrates all three.

2. **Route discovery is a manual drag-and-drop workflow.** Every competing app — Calimoto, Scenic, REVER — requires riders to drop pins on a map. This workflow is borrowed from car navigation and ignores how riders actually think about rides: by feeling, duration, vibe, and familiarity, not by GPS coordinates.

3. **Weather context arrives too late.** Riders either check weather separately and try to mentally map it to their route, or they skip weather entirely and get caught in rain. No competitor surfaces weather-per-route as part of the planning decision.

## Solution Summary

LaneShadow V1 solves all three problems in a single, connected experience:

1. **Agentic Conversational Planning on the Map**: A rider opens the app and sees a map with a chat input bar at the bottom. They type what they want — the agent interprets intent using agentic reasoning, generates 2–3 scenic route alternatives through a deterministic orchestrator, and renders them directly on the map as chat attachments. The rider can then refine iteratively: "avoid Highway 1", "make it shorter", "add a stop at Big Sur." Each exchange builds on the last within a persistent session. The agent's responses appear as temporary overlays on the map that fade away, keeping the map primary. Full chat history is available by expanding the chat view.

2. **Weather-Informed Route Comparison**: Each route alternative carries a full weather profile (wind, rain, temperature) rendered as overlays on the map polyline and compact badges on route attachment cards. The highest-ranked route gets a "Best for today" conditions badge.

3. **Personalization That Compounds**: Riders save routes they love and mark road segments as favorites. Those favorites automatically influence future route generation — making LaneShadow measurably smarter the longer a rider uses it.

## V1 Gate Test

> A rider opens the app, types "scenic 2-hour ride to Santa Cruz, avoid highways", and 10 seconds later sees 3 route options with weather badges on the map. They say "actually avoid Highway 1" and get updated options without starting over.

If that works and feels magical, V1 ships.

---

## Current Implementation Status (as of 2026-04-03)

**Overall Completion**: ~23% of V1 scope implemented

| Functional Group | Completion | Status |
|------------------|-----------|--------|
| Agentic Conversational Planning | 0% (0/11 UCs) | Chat infrastructure does not exist; current implementation is manual form-based |
| WX (Weather & Conditions) | 29% (1/7 implemented, 2/7 partial) | Wind overlay complete; rain/temp/badges/timeline missing |
| SR (Saved Routes & Favorites) | 60% (3/10 implemented, 4/10 partial) | Browse/search/delete implemented; rating/notes/re-plan/export missing |

**Critical Architectural Gap**: The V1 PRD describes a **conversational AI copilot** for ride planning. The current codebase implements a **manual planning form**. This is a fundamental architectural mismatch requiring chat infrastructure and agentic tooling to be built from scratch.

**Agent Framework Migration**: The codebase includes pi core dependencies (`@mariozechner/pi-agent-core`, `@mariozechner/pi-ai`) but the current implementation uses a deterministic orchestrator pattern without pi agent sessions. V1 requires implementing proper agentic workflows that combine:
- **Agentic reasoning**: Understanding rider intent, generating conversational responses, creating route descriptions
- **Deterministic workflows**: Route computation, weather fetching, data persistence

**Phase 0 Remediation Required** (BLOCKING V1 Implementation):
- 24 components import directly from `@expo/vector-icons` (breaks web compatibility)
- 10 components use core React Native `Text` instead of Paper (breaks theme system)
- Hardcoded colors in map components (breaks dark mode)

**Estimated Time to V1 Gate Test**: 4-5 weeks after Phase 0 remediation (7-11 hours)

See `.spec/artifacts/team-product/2026-04-03-v1-prd-adjustment-plan-report.md` for comprehensive gap analysis and implementation roadmap.
