# Native Design System V2 (Copper · Navigator) — PRD

Full replacement of LaneShadow's UI layer with a semantic, token-driven, atomic design system built natively for iOS (Swift/SwiftUI) and Android (Kotlin/Compose), maintained in tandem by AI agents. V2 is framed around the **Navigator** product — a conversational motorcycle route planner over a warm-paper topographic map.

## PRD Metadata

| Field          | Value                                |
|----------------|--------------------------------------|
| Version        | 2.0.0                                |
| Appetite       | 6 weeks                              |
| Scope Level    | full (design system replacement + product reframe) |
| Created        | 2026-04-20                           |
| Last Updated   | 2026-04-20                           |
| Design Source  | `./concepts/designs.html`            |
| Theme Codename | Copper                               |
| Product        | Navigator (conversational route planner) |

## Document Index

| File                                                                                                   | Section                                                               | Stability        |
|--------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------|------------------|
| [00-overview.md](./00-overview.md)                                                                     | Product description, problem statement, Navigator solution            | PRODUCT_CONTEXT  |
| [01-scope.md](./01-scope.md)                                                                           | In scope / out of scope (with 6-week appetite constraint)             | FEATURE_SPEC     |
| [02-roles.md](./02-roles.md)                                                                           | Consumer roles (AI agents + human maintainers)                        | PRODUCT_CONTEXT  |
| [03-functional-groups.md](./03-functional-groups.md)                                                   | Functional group overview and use case summary                        | FEATURE_SPEC     |
| [04-uc-tok.md](./04-uc-tok.md)                                                                         | UC-TOK-01 through UC-TOK-05 — Foundation tokens: 3 typography families, role-based colors, motion recipes, icon catalog, Mapbox styles | FEATURE_SPEC     |
| [05-uc-atm.md](./05-uc-atm.md)                                                                         | UC-ATM-01 through UC-ATM-13 — Atoms (incl. Pill, GlassPanel, PhaseDot, Scrim, design-owned SVG Icon catalog, `LSMap` contract + iOS + Android impls) | FEATURE_SPEC     |
| [06-uc-mol.md](./06-uc-mol.md)                                                                         | UC-MOL-01 through UC-MOL-08 — Molecules (incl. Pill semantics family, ChatInput, Navigator molecules, LocationContextBar + RouteAttachmentCard) | FEATURE_SPEC     |
| [07-uc-org.md](./07-uc-org.md)                                                                         | UC-ORG-01 through UC-ORG-07 — Organisms (incl. TopBar, MapLayer, NavigatorMessage + InlineErrorCallout, RouteSheet, SessionsDrawer) | FEATURE_SPEC     |
| [08-uc-scr.md](./08-uc-scr.md)                                                                         | UC-SCR-01 through UC-SCR-06 — Navigator screens: Idle, Planning, RouteResults, RouteDetails, Sessions, Error | FEATURE_SPEC     |
| [09-uc-sbx.md](./09-uc-sbx.md)                                                                         | UC-SBX-01 through UC-SBX-06 — Sandbox infra, failed-port cleanup, RN retirement, snapshot testing | FEATURE_SPEC     |
| [10-team-contributions.md](./10-team-contributions.md)                                                 | Phase contributions (PM, iOS, Android, Design)                        | —                |
| [11-technical-requirements.md](./11-technical-requirements.md)                                         | Technical specifications (tokens, icon catalog, fonts, sandbox, mock data) | CONSTITUTION     |

## Quick Stats

| Metric                         | Value |
|--------------------------------|-------|
| Functional Groups              | 6     |
| Use Cases (total)              | 45    |
| Platforms targeted             | 2 (iOS, Android) |
| Navigator Screens              | 6 (Idle / Planning / RouteResults / RouteDetails / Sessions / Error) |
| Typography Families            | 3 (opinion · ui · instrument) |
| Motion Recipes                 | 8 (chatOverlayEnter/Dismiss, sidebarSlideIn, sketchPolylineLoop, routeDrawOn, bestBadgeEnter, phaseDotPulse, mapTapDismiss) |
| Icon Catalog Size              | 25 design-owned SVGs (1.5px rounded stroke) |
| Data Entities (mocked)         | 14 (User, Route, Session, NavigatorMessage, RouteAttachment, WeatherSummary, WeatherTimelineEntry, PlanningPhase, SuggestionChip, LocationContext, Greeting, FilterChip, NavigatorError, + supporting) |
| Platform Token Outputs         | 3 (Swift, Kotlin, TypeScript) |
| External Dependencies          | Mapbox SDK (iOS + Android) + Mapbox Studio + Newsreader + Geist + JetBrains Mono + native-theme + native-sandbox + swift-snapshot-testing + dropshots + Convex reference |
| Cleanup passes                 | 2 (UC-SBX-05 early, UC-SBX-04 terminal) |

## Version History

| Version | Date       | Changes                                                                 | Trigger           |
|---------|------------|-------------------------------------------------------------------------|-------------------|
| 1.0.0   | 2026-04-20 | Initial PRD for V2 Copper design system — full native replacement of social-ride-app UI | New initiative    |
| 1.1.0   | 2026-04-20 | Added UC-SBX-05 (pre-Sprint-2 failed-port cleanup); narrowed UC-SBX-04 to RN-shell-only; updated scope/functional-groups to reflect two-pass cleanup and dependency ordering | User feedback |
| 1.2.0   | 2026-04-20 | Added UC-ATM-06 (Mapbox-backed `LSMap` atom with Copper Studio styles); flipped UC-ORG-02 RouteCard + UC-SCR-02 RouteDetail from `LSPanel` placeholders to real interactive maps | User feedback |
| 1.3.0   | 2026-04-20 | Split UC-ATM-06 into three UCs at PRD level: contract (UC-ATM-06) + iOS impl (UC-ATM-07) + Android impl (UC-ATM-08) | User feedback |
| 1.4.0   | 2026-04-20 | Added three UCs for chat surfaces (UC-MOL-05, UC-ORG-04, UC-SCR-05) covering chat input, menu panel + ephemeral map chat overlay, full chat screen | User feedback |
| **2.0.0** | **2026-04-20** | **MAJOR — full product reframe to Navigator.** Replace social-ride-app screens (Feed / Discover / Profile / Settings / Onboarding / Chat) with the six Navigator screens from `concepts/designs.html` (Idle / Planning / RouteResults / RouteDetails / Sessions / Error). Adopt design-owned SVG icon catalog (25 icons, 1.5px stroke), retire SF Symbols + Material Icons. Restructure typography as three families (opinion / ui / instrument). Convert motion primitives into eight named recipes. Add `LSGlassPanel`, `LSPill`, `LSPhaseDot`, `LSScrim` atoms; split `LSBadge` with weather variants; introduce `LSMapLayer`, `LSNavigatorMessage`, `LSInlineErrorCallout`, `LSRouteSheet`, `LSSessionsDrawer` organisms. Widen `LSMap` contract to multi-polyline with `RouteVariant`. Add Navigator-domain entities (Session, NavigatorMessage, RouteAttachment, WeatherSummary, WeatherTimelineEntry, PlanningPhase, SuggestionChip, LocationContext, Greeting, NavigatorError); retire v1.x entities (Ride, FeedItem, DiscoverSection, SettingsEntry, ProfileData, MenuEntry, Message, ActiveMessage). Bundle three fonts (Newsreader, Geist, JetBrains Mono). | User feedback: `concepts/designs.html` authoritatively describes the Navigator product; v1.x screen roster had zero overlap with it |
| 2.1.0   | 2026-04-20 | Added UC-SBX-06 (visual regression snapshot testing for cross-platform design parity). Uses `swift-snapshot-testing` (iOS) + `dropshots` (Android) to capture every story in light/dark mode as reference PNGs, with a CI-level cross-platform parity diff report. Updated quality gates, technical requirements, and functional group counts (SBX 5→6, total 44→45). | User feedback: snapshot testing to control for cross-platform design drift |

## Reference Materials

- **Design source**: `./concepts/designs.html` — Copper-themed Navigator concept bundle (authoritative for visual decisions).
- **Token primitives**: `~/Projects/native-theme/` — cross-platform `ColorSet`, `TypographyStyle`, `parseColorString` primitives.
- **Sandbox harness**: `~/Projects/native-sandbox/` — Story/SandboxRoot/ThemeController runtime for iOS + Android.
- **Sandbox organization reference**: `~/Projects/storywright/ios/Storywright/Sandbox/` — canonical tier-aggregation pattern (Atoms → Molecules → Organisms → Templates → Modifiers → Infrastructure).
- **Data shape reference**: `/Users/justinrich/Projects/LaneShadow/convex/` — used only as a source of truth for mock data shapes (Route, User); Navigator entities declared inline in `11-technical-requirements.md`.

## Hard Replacement Policy

This PRD defines a **full replacement** of the existing UI layer. Legacy UI artifacts in `react-native/`, `ios/LaneShadow/Views/`, and `android/app/src/main/.../ui/` are to be deleted, **not migrated**. AI agents MUST NOT read legacy UI for implementation guidance — the new V2 Navigator system is the only source of truth. The only touch-point with legacy code is deletion.

Additionally, v2.0.0 retires the v1.x social-app component and screen roster (FeedScreen, DiscoverScreen, ProfileScreen, SettingsScreen, Onboarding/SignIn/SignUp, LSRideCard, LSProfileHeader, LSMenuPanel, LSMapChatOverlay, LSEphemeralMessage, and their supporting entities). UC-SBX-05 includes a grep sweep to verify these names do not survive anywhere in the native trees.

## Next Steps

- `/kb-sprint-plan` — decompose this PRD into human-testable sprints (token sync → atoms → molecules → organisms → Navigator screens → cleanup).
- `/kb-sprint-tasks-plan` — expand each sprint's tasks into implementation-ready files (paired iOS + Android tasks per component).
- `/kb-run-sprint` — execute a sprint via `swift-implementer` + `kotlin-implementer` pairs.
- `/design` — generate per-screen design specifications (plan → detail → mock → review).
- `/native-sandbox` — launch the sandbox browser to verify component parity visually on both platforms.
