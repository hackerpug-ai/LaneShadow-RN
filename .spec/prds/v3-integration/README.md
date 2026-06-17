---
title: LaneShadow Native Integration (V3) — Wire Native Screens to Real Data
version: 1.2.0
appetite: 6
human_signal_count: 4
human_signal_last_elicited: 2026-04-27T00:00:00-07:00
---

# LaneShadow Native Integration (V3) — PRD

The integration sprint that takes V2's static native UI (six Navigator screens running off mock providers on iOS + Android) and wires it to real Convex data, real Clerk auth, real Mapbox location, and the React Native app's full feature set — minus local LLM and voice.

> **Human Signals (Authoritative head-boss anchors).** DO NOT edit blockquote text. See `brain/docs/HUMAN-SIGNAL.md`. The four signals below are authoritative scope — every UC, scope decision, and architecture choice in this PRD traces back to one of them.

## HUMAN SIGNAL: The Broken Thing
*Elicited 2026-04-27 via `kb-prd-plan` — prompt: "In one sentence: what is broken today that this fixes?"*

> 1) all the full views in sandbox mode are distorted, because they are not real implementations. Just doing the real feature in the app will fix it. 2) we only have a UI system, we need to wire all services into the app to make it real

## HUMAN SIGNAL: North-Star User
*Elicited 2026-04-27 via `kb-prd-plan` — prompt: "Name one user who will notice this, and what they'll do differently after."*

> Feature parity to what's in React Native

## HUMAN SIGNAL: Explicit Non-Goals
*Elicited 2026-04-27 via `kb-prd-plan` — prompt: "What would you deliberately NOT build, even if obvious?"*

> no new functionality outside of what is visible in react native, ex: local llm not in scope, voice not in scope

## HUMAN SIGNAL: Appetite & Cut Rules
*Elicited 2026-04-27 via `kb-prd-plan` — prompt: "Appetite (6 weeks confirmed) — what forces you to cut?"*

> if cross platform testing is too burdensome then we might cut android

## PRD Metadata

| Field | Value |
|-------|-------|
| Version | 1.2.0 |
| Appetite | 6 weeks |
| Scope Level | full (integration of v2 native UI with real services + RN parity surfaces + design-fidelity remediations) |
| Created | 2026-04-27 |
| Last Updated | 2026-04-27 |
| Design Source | `concepts/designs.html` (V2 — authoritative) + this PRD's `architecture/ui-design.md` for new surfaces |
| Predecessor | `.spec/prds/v2/` (Native Design System V2 — Copper Navigator) |
| RN Reference | `/Users/justinrich/Projects/LaneShadow/react-native/` (parity target — no migration; agents may read for reference only) |

## Document Index

| File | Section | Stability |
|------|---------|-----------|
| [00-overview.md](./00-overview.md) | Product description, problem, solution | PRODUCT_CONTEXT |
| [01-scope.md](./01-scope.md) | In scope / out of scope / cut order | FEATURE_SPEC |
| [02-roles.md](./02-roles.md) | Rider personas (consumer roles) + agent build roles | PRODUCT_CONTEXT |
| [03-functional-groups.md](./03-functional-groups.md) | 7 functional groups (FID, AUTH, CHAT, ROUTE, SESS, MAP, APP) | FEATURE_SPEC |
| [04-uc-auth.md](./04-uc-auth.md) | UC-AUTH-01 through UC-AUTH-04 — Clerk auth, sign-in/up, session, sign-out | FEATURE_SPEC |
| [05-uc-chat.md](./05-uc-chat.md) | UC-CHAT-01 through UC-CHAT-06 — Idle/Planning/Results/Details/Error/PlanRide on real data | FEATURE_SPEC |
| [06-uc-route.md](./06-uc-route.md) | UC-ROUTE-01 through UC-ROUTE-04 — Saved routes CRUD + soft-delete + undo | FEATURE_SPEC |
| [07-uc-sess.md](./07-uc-sess.md) | UC-SESS-01 through UC-SESS-03 — Sessions drawer with real history + camera persistence | FEATURE_SPEC |
| [08-uc-map.md](./08-uc-map.md) | UC-MAP-01 through UC-MAP-03 — Location, offline regions, background download | FEATURE_SPEC |
| [09-uc-app.md](./09-uc-app.md) | UC-APP-01 through UC-APP-04 — Settings, top-level routing, error boundary, hamburger menu | FEATURE_SPEC |
| [10-team-contributions.md](./10-team-contributions.md) | Phase contributions (PM, convex-planner, swift-planner, kotlin-planner, ui-designer) + 5 frontend-designer remediation reviews | — |
| [11-technical-requirements.md](./11-technical-requirements.md) | Cross-platform technical specs, SDKs, schema additions, offline strategy, error taxonomy | CONSTITUTION |
| [12-uc-fid.md](./12-uc-fid.md) | UC-FID-01 — Single umbrella UC with ~70 acceptance criteria covering all 98 catalogued design-fidelity gaps (typography, map slot, glass-panel, motion, stories, variants, build blockers) | FEATURE_SPEC |
| [architecture/ios-architecture.md](./architecture/ios-architecture.md) | Full iOS architecture spec (swift-planner output) | CONSTITUTION |
| [architecture/android-architecture.md](./architecture/android-architecture.md) | Full Android architecture spec (kotlin-planner output) | CONSTITUTION |
| [architecture/ui-design.md](./architecture/ui-design.md) | UI/UX design for new surfaces (ui-designer output) | FEATURE_SPEC |
| [remediations/00-summary.md](./remediations/00-summary.md) | Synthesis of 98 design-fidelity gaps with effort rollup, recurring themes, and PRD scoping recommendation | FEATURE_SPEC |
| [remediations/01-views-idle-planning.md](./remediations/01-views-idle-planning.md) | Idle + Planning view gaps (Agent A — 24 gaps) | FEATURE_SPEC |
| [remediations/02-views-route.md](./remediations/02-views-route.md) | RouteResults + RouteDetails view gaps (Agent B — 17 gaps) | FEATURE_SPEC |
| [remediations/03-views-sessions-error.md](./remediations/03-views-sessions-error.md) | Sessions + Error view gaps (Agent C — 19 gaps) | FEATURE_SPEC |
| [remediations/04-organisms-chrome.md](./remediations/04-organisms-chrome.md) | map-layer + topbar-navbar + sessions-drawer organism gaps (Agent D — 18 gaps) | FEATURE_SPEC |
| [remediations/05-organisms-content.md](./remediations/05-organisms-content.md) | navigator-callouts + route-sheet + route-card + section-header organism gaps (Agent E — 20 gaps) | FEATURE_SPEC |

## Quick Stats

| Metric | Value |
|--------|-------|
| Functional Groups | 7 |
| Use Cases | 25 (24 integration + 1 design-fidelity umbrella) |
| Platforms targeted | 2 (iOS 17+, Android API 26+) |
| New screens (no v2 equivalent) | 9 (SignIn, SignUp, OAuthCallback, SavedRoutesList, Settings, OfflineRegionsList, OfflineRegionSelector, SaveFavoriteSheet, PlanRideSheet [stretch]) |
| New molecules proposed | 2 (LSDownloadProgressBar, LSAuthProviderButton) |
| New atoms or tokens | 0 |
| Design-fidelity gaps catalogued | 98 (36 HIGH · 42 MED · 20 LOW) across 6 views + 7 organisms × 2 platforms |
| Convex API endpoints to wire | 11 critical + 10 important |
| Backend additions | 2 (`db.users.getCurrentUser` query, optional `limit` on `db.sessionMessages.list`) |
| External SDKs introduced | ConvexMobile (Swift + Kotlin), Clerk (clerk-ios + clerk-android with Custom Tabs fallback) |

## Version History

| Version | Date | Changes | Trigger |
|---------|------|---------|---------|
| 1.0.0 | 2026-04-27 | Initial PRD for V3 integration: wire native screens to real services, achieve RN parity (minus local LLM and voice) | New initiative |
| 1.1.0 | 2026-04-27 | Added Design Fidelity (FID) functional group with 10 use cases. Synthesized from a 5-agent frontend-designer review of `.spec/design/system/views/` + `/organisms/` against native iOS + Android implementations. 98 gaps catalogued (36 HIGH / 42 MED / 20 LOW) across 6 views + 7 organisms; primary themes: iOS Newsreader serif typography, iOS map placeholder, sessions-drawer glass-panel container, motion recipe wiring, sandbox story coverage, missing variants. FID work runs as Phase 0 in week 1, parallel to AUTH foundation. Detailed per-component reports added under `remediations/`. | Frontend-designer team review (user-initiated) |
| 1.2.0 | 2026-04-27 | Consolidated FID functional group from 10 themed UCs into a single umbrella UC `UC-FID-01: Achieve V2 design-system fidelity across all native components`. The umbrella UC contains ~70 acceptance criteria organized by component (6 views + 7 organisms + sandbox stories + cross-platform parity) covering all 98 catalogued gaps with explicit gap-ID traceability back to `remediations/` reports. Total UC count drops 34 → 25; total AC count is unchanged (each previous UC's ACs absorbed into the umbrella). Sprint sequencing now operates on AC-severity-subsets within UC-FID-01 rather than UC-by-UC. | User scope rationalization request |

## Reference Materials

- **V2 PRD (predecessor)**: `.spec/prds/v2/` — defines the design system; this PRD is what V2 explicitly deferred as `[DEFERRED: integration-initiative]`.
- **Discovery reports**: `.spec/research/v3-integration-discovery/01-react-native-business-logic.md` and `02-native-current-state.md`.
- **RN reference**: `/Users/justinrich/Projects/LaneShadow/react-native/` — read-only parity target. The RN app is preserved for reference; sprint 7 RN retirement is deferred to a follow-on.
- **Convex backend**: `/Users/justinrich/Projects/LaneShadow/convex/` — production-ready; only 2 minor additions needed.
- **Architecture refs (this PRD)**: `architecture/ios-architecture.md`, `architecture/android-architecture.md`, `architecture/ui-design.md`.

## Hard Replacement Policy

V3 does NOT replace v2's UI primitives. The v2 atoms, molecules, organisms, and six Navigator screens are preserved verbatim. v3 adds:
1. App-shell wiring outside the sandbox (auth gate, navigation, top-level state).
2. Real data sources (Convex client) replacing mock providers on the six v2 screens.
3. Nine new screens that compose existing v2 primitives.
4. Two new molecules (`LSDownloadProgressBar`, `LSAuthProviderButton`) — no new atoms or tokens.

The React Native app at `react-native/` is **preserved as a reference**, not deleted. Sprint 7 of v2 (RN retirement) is **deferred** until v3 ships and parity is verified.

Legacy infrastructure that becomes dead code (Android `models/` MLX-related files, RN model gatekeeper) is flagged for removal in a v3.1 cleanup pass — not in v3 scope.

## Cut Authority (Per HUMAN SIGNAL #4)

Pre-authorized cut sequence is defined in [01-scope.md](./01-scope.md). Summary:
- **Cut Layer 1**: Drop Android snapshot parity tests
- **Cut Layer 2**: Stop Android UI gap-fills (new screens iOS-only)
- **Cut Layer 3**: Drop Android implementation entirely

A **week-2 checkpoint** mechanically enforces the cut decision. If Android Convex+auth aren't green by end of week 2, escalate to user with cut recommendation.

## Next Steps

- `/kb-sprint-plan` — decompose this PRD into 6 weekly human-testable sprints
- `/kb-sprint-tasks-plan` — expand each sprint into iOS + Android paired tasks
- `/design` — generate per-screen specs for the 9 new UI surfaces (SignIn, SignUp, OAuthCallback, SavedRoutesList, Settings, OfflineRegionsList, OfflineRegionSelector, SaveFavoriteSheet, PlanRideSheet)
- `/kb-run-sprint` — execute via swift-implementer + kotlin-implementer + convex-implementer pairs
