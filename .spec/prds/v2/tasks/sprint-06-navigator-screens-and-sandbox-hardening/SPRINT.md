# Sprint 6: Navigator Screens & Sandbox Hardening

**Sequence:** 6
**Timeline:** Phase 5 · Week 5–6
**Status:** Planned

---

## Overview

This sprint delivers the six Navigator screen UCs (the full Idle → Planning → RouteResults → RouteDetails → Sessions → Error flow described in `concepts/designs.html`) plus the final hardening of the sandbox infrastructure (story registry + parity manifest, theme controller + `argTypes` controls, mock data providers and fixtures) and the cross-platform visual-regression snapshot test suite (`swift-snapshot-testing` + `dropshots`). Every screen renders from a named `*MockProvider` — there is no live Convex or Navigator-runtime wiring. Both platforms end this sprint with every story light-and-dark snapshotted, the parity diff report producing green, and the full 45-UC catalog visually reviewable.

Per-platform split: every UC expands to paired `-ios` + `-android` tasks. The 10-task-per-sprint gate is intentionally exceeded (20 paired tasks) to expose parallel execution; the sprint gate still operates at UC granularity.

---

## Package Boundaries (CONSTITUTION)

Inherited from Sprint 1; restated for screen-tier + sandbox infra enforcement.

- **Theme package is the ONLY token source.** Every screen imports exclusively from the project-local theme package (`tokens/platforms/swift/Sources/LaneShadowTheme/` on iOS, `tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/` + `LaneShadowTheme` Compose wrapper on Android). No literal tokens anywhere in screen composition.
- **Screens are data-agnostic.** Every screen renders from a named `*MockProvider` from UC-SBX-03 that feeds fixtures from `tokens/sandbox/fixtures/*.fixtures.json`. No live Convex queries, no networking, no Navigator-runtime wiring — this sprint is the shell only.
- **Sandbox runtime is the ONLY preview + test surface.**
  - Stories register via `Story`, `SandboxRoot`, `ThemeController`, `ArgValues` from `~/Projects/native-sandbox` (SPM path ref on iOS, Gradle composite on Android).
  - UC-SBX-01 finalizes the story registry + tier aggregators inside `ios/LaneShadow/Sandbox/` and `android/app/src/debug/java/com/laneshadow/sandbox/` — no external registration surface.
  - UC-SBX-02 finalizes `ThemeController` wiring and `ArgValues` controls through native-sandbox APIs; do not build a competing theme toggle or argTypes system.
  - UC-SBX-03 providers expose named fixtures via native-sandbox's provider hooks; screen tests consume the same providers.
  - UC-SBX-06 snapshot tests (`swift-snapshot-testing` + `dropshots`) iterate over every native-sandbox Story, not over `#Preview {}` blocks or custom harnesses.
- **Screens use `ComponentTier.template` — not a new tier.** Native-sandbox's `ComponentTier` enum is fixed at 6 values (`atom`, `molecule`, `organism`, `template`, `modifier`, `infrastructure`); per RULES §6 the host may not extend it. Every Navigator screen story uses `tier: ComponentTier.template`, dotted id `templates.{screen}.{variant}` (e.g. `templates.idle.greeting`, `templates.planning.thinking`, `templates.routeresults.three-alts`), PascalCase `component` (e.g. `"IdleScreen"`), short `name`, one-sentence `summary`, stateless render closure consuming a named `*MockProvider`. Stories register into `TemplateStories.all` on each platform.
- **Sandbox infrastructure tasks use `ComponentTier.infrastructure`.** UC-SBX-01 (story registry + parity manifest), UC-SBX-02 (theme controller + argTypes controls — host-side wiring only; do not extend the native-sandbox args system per RULES §10), UC-SBX-03 (mock providers + fixtures), and UC-SBX-06 (snapshot tests) each register their host-side demonstration/diagnostic stories under `InfrastructureStories.all` with dotted `infrastructure.{area}.{variant}` IDs.
- **Host-level composition.** `LaneShadowSandbox` composes `AtomStories.all + MoleculeStories.all + OrganismStories.all + TemplateStories.all + InfrastructureStories.all` on each platform — no global registry, no reflection. Parity manifest (`tokens/sandbox/stories.parity.json`) enumerates every story ID exactly once with its ios-only / android-only allow-list.

---

## Human Test Deliverable

A reviewer can open every Navigator screen story on iOS and Android, cycle through each screen's mock-provider variants, and confirm the full product narrative renders end-to-end — Idle greeting with italicized "today" + suggestion chips + location badge; Planning with sketching polyline loop + active-phase ring pulse + thinking-state chat input; RouteResults with three concurrent polylines + NavigatorMessage carrying three attached route cards; RouteDetails with the full bottom sheet; Sessions with scrimmed map + slide-in drawer; Error with warn-stripe callout + recovery suggestions. The cross-platform parity manifest passes, and `pnpm snapshots:parity-report` produces a green side-by-side iOS/Android diff for every component variant.

**Test Steps:**
1. Launch `/native-sandbox --platform ios` and `/native-sandbox --platform android`; confirm the Screens tier aggregates Idle, Planning, RouteResults, RouteDetails, Sessions, and Error stories on both platforms.
2. Open `Screens / Idle` and verify: `LSTopBar`, greeting overlay (label + opinion-serif headline with italicized "today"), favorite-pin map, `LSChatInput` with 4 suggestion chips + location badge ("Near Santa Cruz, CA" MANUAL). Tap a suggestion chip and confirm the input fills with the chip's label.
3. Open `Screens / Planning` and verify: top bar, `LSPhaseIndicator` with 5 steps (one active with `motion.recipe.phaseDotPulse`), map with continuous `motion.recipe.sketchPolylineLoop` animation, chat input with filled prompt + `LSSpinner` (non-interactive).
4. Open `Screens / RouteResults` and verify: three concurrent polylines drawn on via `motion.recipe.routeDrawOn` with 120ms stagger, camera auto-frames union bounds with `spacing.4` padding, `LSNavigatorMessage` pinned with three compact `LSRouteAttachmentCard`s (first selected), refine-prompt chat input.
5. Open `Screens / RouteDetails` and verify: single best-variant polyline with `spacing.4` padding, `LSRouteSheet` at `.large` detent with `LSBestBadge` + opinion-serif title + 4-column instrument readout + 6-hour weather timeline + sticky action row; drag down to dismiss.
6. Open `Screens / Sessions` and verify: scrim at 0.35, `LSSessionsDrawer` slides in via `motion.recipe.sidebarSlideIn`, "Rides" header + "NEW" button + "THIS WEEK" section label + 5 session rows with the active one stripe-highlighted. Tap the scrim to dismiss.
7. Open `Screens / Error` and verify: `LSInlineErrorCallout` with warn-stripe + compass chip + body + detail + "Try inland" + "End at Big Sur" suggestion chips; tap a suggestion and confirm `onSuggestionTap` fires.
8. Run `pnpm sandbox:parity-check` and confirm every story ID on iOS matches an equivalent on Android (respecting the explicit ios-only / android-only allow-list in `stories.parity.json`).
9. Run `pnpm snapshots:check` and confirm every story has light + dark reference snapshots on both platforms with zero orphans; open the HTML output of `pnpm snapshots:parity-report` and scan every component pair for visual parity.
10. Toggle light/dark in every screen story on both platforms and confirm the Copper Paper Dark Mapbox style reloads, glass chrome re-resolves, opinion-serif typography stays legible, and route-variant colors remain distinguishable.

---

## Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| UC-SCR-01-ios | `IdleScreen` — map + greeting overlay + chat input with suggestions — iOS SwiftUI | swift-implementer | 120 min |
| UC-SCR-01-android | `IdleScreen` — map + greeting overlay + chat input with suggestions — Android Compose | kotlin-implementer | 120 min |
| UC-SCR-02-ios | `PlanningScreen` — sketching polyline + phase indicator + thinking chat — iOS SwiftUI | swift-implementer | 180 min |
| UC-SCR-02-android | `PlanningScreen` — sketching polyline + phase indicator + thinking chat — Android Compose | kotlin-implementer | 180 min |
| UC-SCR-03-ios | `RouteResultsScreen` — 3 alt polylines + NavigatorMessage + refine chat — iOS SwiftUI | swift-implementer | 180 min |
| UC-SCR-03-android | `RouteResultsScreen` — 3 alt polylines + NavigatorMessage + refine chat — Android Compose | kotlin-implementer | 180 min |
| UC-SCR-04-ios | `RouteDetailsScreen` — single polyline + `LSRouteSheet` — iOS SwiftUI | swift-implementer | 150 min |
| UC-SCR-04-android | `RouteDetailsScreen` — single polyline + `LSRouteSheet` — Android Compose | kotlin-implementer | 150 min |
| UC-SCR-05-ios | `SessionsScreen` — scrimmed map + `LSSessionsDrawer` — iOS SwiftUI | swift-implementer | 120 min |
| UC-SCR-05-android | `SessionsScreen` — scrimmed map + `LSSessionsDrawer` — Android Compose | kotlin-implementer | 120 min |
| UC-SCR-06-ios | `ErrorScreen` — map + `LSInlineErrorCallout` + recovery chat — iOS SwiftUI | swift-implementer | 120 min |
| UC-SCR-06-android | `ErrorScreen` — map + `LSInlineErrorCallout` + recovery chat — Android Compose | kotlin-implementer | 120 min |
| UC-SBX-01-ios | Story registry + tier aggregation + parity manifest (finalize) — iOS | swift-implementer | 240 min |
| UC-SBX-01-android | Story registry + tier aggregation + parity manifest (finalize) — Android | kotlin-implementer | 240 min |
| UC-SBX-02-ios | Theme controller + light/dark toggle + `argTypes` controls (finalize) — iOS | swift-implementer | 180 min |
| UC-SBX-02-android | Theme controller + light/dark toggle + `argTypes` controls (finalize) — Android | kotlin-implementer | 180 min |
| UC-SBX-03-ios | Mock data providers + fixtures (finalize all 6 screen providers) — iOS | swift-implementer | 240 min |
| UC-SBX-03-android | Mock data providers + fixtures (finalize all 6 screen providers) — Android | kotlin-implementer | 240 min |
| UC-SBX-06-ios | Snapshot testing for design parity (`swift-snapshot-testing`) — iOS | swift-implementer | 480 min |
| UC-SBX-06-android | Snapshot testing for design parity (`dropshots`) — Android | kotlin-implementer | 480 min |
| REM-01 | Add accessibility requirements to RULES.md | general-purpose | 30 min |
| REM-02 | Add lefthook hooks for hardcoded token detection | general-purpose | 60 min |
| REM-03 | Document Mapbox snapshot determinism strategy | general-purpose | 30 min |
| REM-04 | Add error-state notes to screen task specs (12 files) | general-purpose | 30 min |
| REM-05 | Add device geometry note to parity documentation | general-purpose | 15 min |

---

## Human Testing Gate

**Gate:** Every Navigator screen story — Idle, Planning, RouteResults, RouteDetails, Sessions, Error — renders end-to-end on both iOS and Android from its named mock provider, feeling right at the product narrative level; the cross-platform parity manifest (`pnpm sandbox:parity-check`) passes; and `pnpm snapshots:parity-report` produces a green side-by-side iOS vs. Android diff for every component variant (every story has light + dark reference snapshots on both platforms with no diffs and no orphans).

---

## Source Coverage

- `.spec/prds/v2/08-uc-scr.md` — UC-SCR-01 through UC-SCR-06 acceptance criteria
- `.spec/prds/v2/09-uc-sbx.md` — UC-SBX-01, UC-SBX-02, UC-SBX-03, UC-SBX-06 acceptance criteria
- `.spec/prds/v2/concepts/designs.html` — authoritative Copper Navigator composition
- `.spec/prds/v2/11-technical-requirements.md` — Navigator entity schemas, Story/ThemeController/MockProvider API, snapshot dependency list
- `swift-snapshot-testing` — https://github.com/pointfreeco/swift-snapshot-testing
- `dropshots` — https://github.com/dropbox/dropshots
- All atoms (Sprints 2, 3), molecules (Sprint 4), organisms (Sprint 5) as composition inputs
- `tokens/sandbox/fixtures/*.fixtures.json`, `tokens/sandbox/stories.parity.json`, `tokens/sandbox/snapshots.parity.json` (emitted)

### Per-Task Design Files

| Task | Design Reference |
|------|-----------------|
| UC-SCR-01-ios | [`concepts/uc-scr-01-idle.html`](../../concepts/uc-scr-01-idle.html) |
| UC-SCR-01-android | [`concepts/uc-scr-01-idle.html`](../../concepts/uc-scr-01-idle.html) |
| UC-SCR-02-ios | [`concepts/uc-scr-02-planning.html`](../../concepts/uc-scr-02-planning.html) |
| UC-SCR-02-android | [`concepts/uc-scr-02-planning.html`](../../concepts/uc-scr-02-planning.html) |
| UC-SCR-03-ios | [`concepts/uc-scr-03-route-results.html`](../../concepts/uc-scr-03-route-results.html) |
| UC-SCR-03-android | [`concepts/uc-scr-03-route-results.html`](../../concepts/uc-scr-03-route-results.html) |
| UC-SCR-04-ios | [`concepts/uc-scr-04-route-details.html`](../../concepts/uc-scr-04-route-details.html) |
| UC-SCR-04-android | [`concepts/uc-scr-04-route-details.html`](../../concepts/uc-scr-04-route-details.html) |
| UC-SCR-05-ios | [`concepts/uc-scr-05-sessions.html`](../../concepts/uc-scr-05-sessions.html) |
| UC-SCR-05-android | [`concepts/uc-scr-05-sessions.html`](../../concepts/uc-scr-05-sessions.html) |
| UC-SCR-06-ios | [`concepts/uc-scr-06-error.html`](../../concepts/uc-scr-06-error.html) |
| UC-SCR-06-android | [`concepts/uc-scr-06-error.html`](../../concepts/uc-scr-06-error.html) |
| UC-SBX-01-ios | [`concepts/designs.html`](../../concepts/designs.html) (infrastructure — no per-UC spec) |
| UC-SBX-01-android | [`concepts/designs.html`](../../concepts/designs.html) (infrastructure — no per-UC spec) |
| UC-SBX-02-ios | [`concepts/designs.html`](../../concepts/designs.html) (infrastructure — no per-UC spec) |
| UC-SBX-02-android | [`concepts/designs.html`](../../concepts/designs.html) (infrastructure — no per-UC spec) |
| UC-SBX-03-ios | [`concepts/designs.html`](../../concepts/designs.html) (infrastructure — no per-UC spec) |
| UC-SBX-03-android | [`concepts/designs.html`](../../concepts/designs.html) (infrastructure — no per-UC spec) |
| UC-SBX-06-ios | [`concepts/designs.html`](../../concepts/designs.html) (infrastructure — no per-UC spec) |
| UC-SBX-06-android | [`concepts/designs.html`](../../concepts/designs.html) (infrastructure — no per-UC spec) |

---

## Blocks

- Sprint 7 (React Native Shell Retirement) — UC-SBX-04 requires all V2 screens to have passed their human testing gate (this sprint's gate is the precondition) before the `react-native/` shell can be safely deleted without regressing the V2 system.

---

## Task Detail Files

Generated by /kb-sprint-tasks-plan on 2026-04-25.

- `UC-SBX-01-ios-story-registry.md`
- `UC-SBX-01-android-story-registry.md`
- `UC-SBX-02-ios-theme-controller-arg-controls.md`
- `UC-SBX-02-android-theme-controller-arg-controls.md`
- `UC-SBX-03-ios-mock-providers-fixtures.md`
- `UC-SBX-03-android-mock-providers-fixtures.md`
- `UC-SCR-01-ios-idle-screen.md`
- `UC-SCR-01-android-idle-screen.md`
- `UC-SCR-02-ios-planning-screen.md`
- `UC-SCR-02-android-planning-screen.md`
- `UC-SCR-03-ios-route-results-screen.md`
- `UC-SCR-03-android-route-results-screen.md`
- `UC-SCR-04-ios-route-details-screen.md`
- `UC-SCR-04-android-route-details-screen.md`
- `UC-SCR-05-ios-sessions-screen.md`
- `UC-SCR-05-android-sessions-screen.md`
- `UC-SCR-06-ios-error-screen.md`
- `UC-SCR-06-android-error-screen.md`
- `UC-SBX-06-ios-snapshot-testing.md`
- `UC-SBX-06-android-snapshot-testing.md`
- `REM-01-accessibility-standards.md`
- `REM-02-token-enforcement-hook.md`
- `REM-03-snapshot-determinism-docs.md`
- `REM-04-error-state-specs.md`
- `REM-05-parity-device-geometry-note.md`
