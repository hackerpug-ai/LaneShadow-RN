---
stability: FEATURE_SPEC
last_validated: 2026-04-20
prd_version: 2.0.0
---

# Functional Groups

V2 is organized in six groups that mirror the atomic-design hierarchy, with a dedicated infrastructure group for the sandbox/parity/cleanup work. Each group maps to one sprint in the 6-week appetite — dependencies always flow downward.

| Group                      | Prefix | Description |
|----------------------------|--------|-------------|
| Foundation Tokens & Theme  | TOK    | Canonical `semantic.tokens.json` (3 typography families, role-based color semantics, weather palette, route variants, named motion recipes, spacing/radii/stroke/elevation/opacity, Mapbox Studio style URLs, design-owned icon catalog constants) and the cross-platform generation pipeline into Swift/Kotlin/TypeScript outputs. Leverages `~/Projects/native-theme/` primitives. All downstream groups consume tokens only from here — no literals below this layer. |
| Atoms                      | ATM    | Smallest typed UI primitives including `LSPill`, `LSGlassPanel`, `LSPhaseDot`, `LSScrim`, and a design-owned SVG icon catalog. Paired iOS (SwiftUI) + Android (Compose) implementations with identical public APIs. |
| Molecules                  | MOL    | Compositions of atoms: pill semantics family (TagPill / FilterChip / SuggestionChip / WeatherBadge), Navigator molecules (PhaseIndicator / WeatherTimeline / InstrumentReadout), ChatInput, LocationContextBar, RouteAttachmentCard, plus shared patterns (Card+ListRow, Toolbar+NavHeader, BottomSheet+Toast+Modal, FormField+TabItem+EmptyState). No atom is inlined — molecules always route through atom APIs. |
| Organisms                  | ORG    | Feature-domain compositions for the Navigator: TopBar, MapLayer, NavigatorMessage, InlineErrorCallout, RouteSheet, SessionsDrawer, RouteCard, SectionHeader. Data-agnostic — render from props driven by mock data providers. |
| Screens / Templates        | SCR    | Six Navigator screens: Idle, Planning, RouteResults, RouteDetails, Sessions, Error. Every screen previews in the sandbox with a named mock data provider. No live Convex / Navigator-runtime wiring. Fixture shapes mirror `server/convex/` read types where they align (Route, User) or are declared in Technical Requirements (Session, NavigatorMessage, RouteAttachment, WeatherSummary, WeatherTimelineEntry, PlanningPhase, SuggestionChip, LocationContext). |
| Sandbox Infrastructure     | SBX    | The `native-sandbox` Story registry, tier aggregation, theme controller, mock data providers, cross-platform parity manifest, **visual regression snapshot testing (UC-SBX-06)**, **the pre-Sprint-2 failed-port reset (UC-SBX-05)**, and the terminal React Native shell retirement (UC-SBX-04). |

## Use Case Summary

| Group | Group Name                    | UCs | Cumulative |
|-------|-------------------------------|-----|------------|
| TOK   | Foundation Tokens & Theme     | 5   | 5          |
| ATM   | Atoms                         | 13  | 18         |
| MOL   | Molecules                     | 8   | 26         |
| ORG   | Organisms                     | 7   | 33         |
| SCR   | Screens / Templates           | 6   | 39         |
| SBX   | Sandbox Infrastructure        | 6   | 45         |
| **Total** |                           | **45** |        |

## Dependency Graph

```
   UC-SBX-05 (failed-port cleanup)  ──────┐
          │                               │
          ▼                               │
   TOK (foundation)                       │
    │                                     │
    ▼                                     │
   ATM ─────┐                             │
    │       │                             │
    ▼       │                             │
   MOL      ├──► SBX (story registry + theme + fixtures — UC-SBX-01..03
    │       │        consumed by every tier throughout the initiative)
    ▼       │
   ORG      │
    │       │
    ▼       │
   SCR ─────┴──► UC-SBX-04 (RN shell retirement — terminal)
```

- **UC-SBX-05 (failed-port cleanup)** must run *before* ATM. It deletes the prior 1:1 RN-to-native port artifacts from `ios/LaneShadow/Views/` and `android/.../ui/` so new V2 atoms land on clean ground. Runs in parallel with TOK since their file scopes do not overlap.
- **TOK** must land before any atom compiles (atoms consume token constants at type-check time on both platforms).
- **SBX story-registry skeleton (UC-SBX-01..03)** lands in parallel with TOK so atoms have somewhere to register as they come online.
- **ATM → MOL → ORG → SCR** is a strict chain: a downstream tier may not inline a literal or a primitive from the tier above it (e.g., MOL cannot inline a raw SwiftUI `Text`; it must use the `LSText` atom).
- **UC-SBX-04 (RN shell retirement)** runs last.
- **UC-SBX-06 (snapshot testing)** lands in Sprint 5 alongside SCR, after all components from ATM through SCR are registered. Snapshot tests cover the full catalog.

## Cross-platform Pairing Rule

Every non-infrastructure UC produces **two paired tasks** when expanded by `kb-sprint-tasks-plan`:

- `UC-{GROUP}-{NN}-ios` → dispatched to `swift-planner` / `swift-implementer` / `swift-reviewer`.
- `UC-{GROUP}-{NN}-android` → dispatched to `kotlin-planner` / `kotlin-implementer` / `kotlin-reviewer`.

Both paired tasks must complete and pass their platform's lint/typecheck/test verification before the UC is considered Done. If one platform finishes first, it does not merge ahead; both merge together or neither does.

### Exception: LSMap atom (UC-ATM-11 / UC-ATM-12 / UC-ATM-13)

The Mapbox-backed map atom is the only UC set where platform-specific work is split at the PRD level rather than at sprint-tasks level. SDK integration diverges materially per platform (SPM vs Gradle, `UIViewRepresentable` vs `AndroidView`, Mapbox SDK API surface differences) and benefits from explicit contract/impl sequencing:

- **UC-ATM-11** (shared contract) lands first — tokens, multi-polyline typed API with `RouteVariant`, annotation kinds, fixture polylines, stub implementations on both platforms.
- **UC-ATM-12** (iOS impl) and **UC-ATM-13** (Android impl) run in parallel after UC-ATM-11 merges, each fulfilling the contract on its platform.

Both platform UCs together replace what would otherwise have been a single UC's paired iOS/Android tasks.

## Sprint Alignment

Each group maps to a sprint; the SBX group is split across the initiative because its early-cleanup UC and terminal-cleanup UC bracket the main build:

| Sprint | Group / UCs            | Human Testing Gate |
|--------|------------------------|---------------------|
| 1      | TOK (all 5) **in parallel with** UC-SBX-05 (failed-port cleanup) | "Pre-Sprint-2 reset: the failed-port UI is gone from both native trees, sandbox still launches with zero stories, both platforms build green. Then: the token swatch story renders every semantic color, every typography family variant, every spacing rung, every motion recipe on both platforms, matching the Navigator concepts." |
| 2      | ATM (13 UCs)           | "Open every atom story in the sandbox on both platforms. Toggle light/dark. Do atoms — especially `LSGlassPanel`, `LSPill`, the design-owned SVG icons, `LSBadge` weather variants, `LSPhaseDot` active-state pulse, and the `LSMap` stub — look identical across platforms and faithful to the concepts?" |
| 3      | MOL (8 UCs)            | "Open every molecule story. Verify composition over atoms (no inlined primitives). `LSChatInput`, `LSPhaseIndicator`, `LSWeatherTimeline`, `LSInstrumentReadout`, `LSRouteAttachmentCard` all render per-variant across platforms." |
| 4      | ORG (7 UCs)            | "Open every organism story with mock domain data. `LSNavigatorMessage` branding, `LSInlineErrorCallout` stripe, `LSRouteSheet` bottom-sheet layout, `LSSessionsDrawer` slide-in all match the concepts. Parity across platforms." |
| 5      | SCR (6 UCs) + SBX (UC-SBX-01..03 parity/theme/fixtures hardened alongside screens, UC-SBX-06 snapshot testing) | "Open every Navigator screen story on both platforms with its fixture provider — Idle, Planning, RouteResults, RouteDetails, Sessions, Error. Does each screen feel right end-to-end with mock data? Does the cross-platform parity manifest pass? Does `pnpm snapshots:parity-report` show green (every story has light+dark snapshots on both platforms with no diffs)?" |
| 6      | UC-SBX-04 (terminal)   | "`react-native/` is gone. Cross-platform parity check passes. `/native-sandbox` still launches on both platforms. Pre-commit + pre-push gates pass." |

This gate-first organization is the load-bearing contract between `kb-prd-plan` and `kb-sprint-plan` — the gate sentence is what the human verifies to sign off the sprint.
