---
stability: FEATURE_SPEC
last_validated: 2026-04-16
prd_version: 2.0.0
---

# Functional Groups

## Groups Overview

| Group | Prefix | File | Description |
|-------|--------|------|-------------|
| Repo Restructure | RESTR | 04-uc-restructure.md | Move Convex to server/, RN app to react-native/, create placeholder dirs |
| Design System | DESIGN | 08-design-system.md, 08a–08d | W3C DTCG token pipeline, Style Dictionary, **atomic component library — all 195 components delivered up-front in Sprint 2** (atoms → molecules → organisms → templates → screens). Feature sprints consume these components by name; see each UC's `UI Components` block. New compositions flow through Sprint 2 via `/kb-sprint-plan --delta-replan` — never inline in a feature sprint. |
| Turn-by-Turn Navigation | NAV | 09-uc-navigation.md | Mapbox Navigation SDK, voice instructions, route deviation detection |
| Ride Recording | REC | 10-uc-ride-recording.md | Background location tracking, sensor fusion, curvature detection |
| Offline Downloads | OFFL | 11-uc-offline.md | Map tile region download, storage management, background download |
| Chat-Based Planning | CHAT | 12-uc-chat-planning.md | AI-powered route planning via natural language, streaming responses |
| Voice Assistant | VOICE | 13-uc-voice-assistant.md | Hands-free STT/TTS, motorcycle noise handling, wake-word activation |
| Route Comparison | COMP | 14-uc-route-comparison.md | Side-by-side route evaluation, elevation profiles, metric comparison |
| Ride Flow | FLOW | 15-uc-ride-flow.md | Full ride lifecycle state machine (IDLE → DISCOVERING → ... → COMPLETED) |
| Gatekeeper & Billing | GATE | 16-uc-gatekeeper.md | Trial counter, feature gating, StoreKit 2 / Play Billing subscriptions |

## Use Case Summary

| Group | Prefix | Use Cases | Priority |
|-------|--------|-----------|----------|
| Repo Restructure | RESTR | 6 | P0 |
| Design System | DESIGN | 5 | P0 |
| Turn-by-Turn Navigation | NAV | 8 | P0 |
| Ride Recording | REC | 7 | P0 |
| Offline Downloads | OFFL | 9 | P0 |
| Chat-Based Planning | CHAT | 8 | P0 |
| Voice Assistant | VOICE | 8 | P1 |
| Route Comparison | COMP | 6 | P1 |
| Ride Flow | FLOW | 11 | P1 |
| Gatekeeper & Billing | GATE | 8 | P2 |
| **Total** | | **76** | |

## Cross-Cutting Concerns

These concerns span multiple functional groups and are documented in 06-technical-requirements.md:

| Concern | Affected Groups | Platform |
|---------|----------------|----------|
| Foreground Services (Android) | NAV, REC, OFFL | Android only |
| Background Location | NAV, REC | Both |
| Permissions System | NAV, REC, VOICE, OFFL | Both |
| Deep Linking | NAV, CHAT, GATE | Both |
| Push Notifications | FLOW, GATE | Both |
| Room/SwiftData Schema | REC, OFFL, CHAT, FLOW, GATE | Both |
| Convex SDK Integration | All groups | Both |
| Design Token Consumption | All UI groups | Both |
| UI Composition (per-UC) | All UI groups | Both — each UC in files 09–16 declares its components inline; see `08a` for catalog |
| Component Deltas | All UI groups that need compositions beyond the 195 in `08a` | Absorbed into Sprint 2 via `/kb-sprint-plan --delta-replan` before the consuming feature sprint begins |
