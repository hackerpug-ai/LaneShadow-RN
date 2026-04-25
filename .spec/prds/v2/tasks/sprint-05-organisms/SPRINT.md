# Sprint 5: Organisms

**Sequence:** 5
**Timeline:** Phase 4 · Week 4–5
**Status:** In Progress (remediation)

---

## Overview

This sprint delivers the seven organism UCs — feature-domain compositions that embed Navigator concepts (conversations, routes, sessions) into larger reusable patterns. Every organism remains data-agnostic (takes data as props, never fetches) and composes only from MOL + ATM tiers. The sprint includes the load-bearing `LSMapLayer` canvas that every Navigator screen reuses so positioning, z-ordering, safe-area handling, and overlay stacking are solved exactly once, plus the branded `LSNavigatorMessage`, the warn-stripe `LSInlineErrorCallout`, the multi-metric `LSRouteSheet`, the left-anchored `LSSessionsDrawer`, and the full-card `LSRouteCard` (which consumes the multi-polyline `LSMap` contract from Sprint 3).

Per-platform split: every UC expands to paired `-ios` + `-android` tasks. The 10-task-per-sprint gate is intentionally exceeded (14 paired tasks) to expose parallel execution; the sprint gate still operates at UC granularity.

---

## Package Boundaries (CONSTITUTION)

Inherited from Sprint 1; restated for organism-tier enforcement.

- **Theme package is the ONLY token source.** Every organism imports colors / typography / spacing / motion / elevation / scrim opacities / icon names from the project-local theme package (`tokens/platforms/swift/Sources/LaneShadowTheme/` on iOS, `tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/` + `LaneShadowTheme` Compose wrapper on Android). Animations reference `motion.recipe.*` by name — no inline `.easeInOut(duration: 0.3)` / `tween(300)`.
- **Composition-only rule.** Every organism composes from MOL + ATM tiers. No raw primitives with literal values. `LSMapLayer` slot APIs receive organism content; they do not inline atoms.
- **Data-agnostic.** Organisms take domain data as props (mocked from the fixtures feeding `MockProvider`). No organism reaches out to Convex, networking, or `Observable` view models.
- **Sandbox runtime is the ONLY preview surface.** Every organism ships its stories via `Story`, `SandboxRoot`, `ThemeController`, `ArgValues` from `~/Projects/native-sandbox`, registered into `ios/LaneShadow/Sandbox/Stories/*Stories.swift` and `android/app/src/debug/java/com/laneshadow/sandbox/stories/*Stories.kt`.
- **Story contract (per `~/Projects/native-sandbox/RULES.md` §6).** Every organism story conforms to: dotted tier-first `id` (e.g. `organisms.maplayer.full-stack`, `organisms.navigatormessage.pinned-three-routes`, `organisms.sessionsdrawer.default`), `tier: ComponentTier.organism`, PascalCase `component` name (e.g. `"LSMapLayer"`), short `name`, one-sentence `summary`, stateless render closure fed from mock domain data. Stories register into `OrganismStories.all` on each platform; composed at host level — no global registry.
- **Debug-only on Android.** Every organism Story file lives under `android/app/src/debug/java/com/laneshadow/sandbox/stories/`. Release builds must not ship sandbox code.

---

## Human Test Deliverable

A reviewer can open every organism story in the sandbox on both platforms with mock domain data, toggle light and dark, and confirm the Navigator-specific visual language renders faithfully — `LSMapLayer` stacks scrim + overlays + drawer + sheet + top-bar in the correct z-order, `LSNavigatorMessage` shows the signal-stripe callout with compass chip + opinion-serif body + attached route cards (auto-dismissing at 5s unless pinned), `LSInlineErrorCallout` shows the warn-stripe with suggestion chips, `LSRouteSheet` shows the full instrument readout + weather timeline + sticky action row, and `LSSessionsDrawer` slides in via `motion.recipe.sidebarSlideIn` with the active-session stripe highlighted.

**Test Steps:**
1. Launch `/native-sandbox` on both platforms; confirm the Organisms tier aggregates TopBar+NavBar, MapLayer, NavigatorMessage, InlineErrorCallout, RouteSheet, SessionsDrawer, RouteCard, and SectionHeader stories.
2. Open `LSTopBar` stories and verify the hamburger + "NEW" chips render as `LSGlassPanel(.chrome)` backed circular/rounded chips; confirm the "Record Highlight" variant swaps the trailing chip to a `color.status.recording` indicator.
3. Open `LSMapLayer` stories (`Map Only`, `Map + TopBar`, `Map + Top Overlay`, `Map + Bottom Overlay`, `Map + Scrim + Drawer`, `Map + Sheet`, `Full Stack`) and verify the z-order contract: map → scrim → top/bottom overlays → sheet → drawer → top bar; confirm each slot preserves safe-area / window-inset padding.
4. Open `LSNavigatorMessage` stories and verify the `LSGlassPanel(.callout(accent: .signal))` container with compass chip + "THE NAVIGATOR" label + Newsreader body + attached `LSRouteAttachmentCard` stack (first selected); confirm the unpinned variant auto-dismisses at 5000ms via `motion.recipe.chatOverlayDismiss` and the pinned variant does not.
5. Open `LSInlineErrorCallout` stories and verify the warn-stripe container with body + detail + suggestion-chip footer; tap a suggestion and confirm `onSuggestionTap` fires with the tapped chip.
6. Open `LSRouteSheet` stories and verify the drag handle + best badge + opinion-serif title + 4-column `LSInstrumentReadout` + `LSWeatherTimeline` + sticky action row (outline `Save`, primary `Ride this`); drag down and confirm `onDismiss` fires once.
7. Open `LSSessionsDrawer` stories (`Default (5 sessions, 1 active)`, `Empty State`, `Long List`, `No Active Session`, `Dark Mode`) and verify the 312-wide left drawer with sticky header + NEW button + "THIS WEEK" section label + per-row active stripe; scroll and confirm the header sticks.
8. Open `LSRouteCard` stories and verify the embedded `LSMap` preview auto-frames the polyline with `spacing.3` padding, the polyline resolves to `color.route.{best,alt1,alt2}` by variant, and the card does not reach out to Convex/networking (asserted by platform tests).

---

## Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| UC-ORG-01-ios | Navigation organisms (`LSTopBar` + `LSNavBar`) — iOS SwiftUI | swift-implementer | 150 min |
| UC-ORG-01-android | Navigation organisms (`LSTopBar` + `LSNavBar`) — Android Compose | kotlin-implementer | 150 min |
| UC-ORG-02-ios | `LSMapLayer` organism (map-primary canvas with overlay slots) — iOS SwiftUI | swift-implementer | 300 min |
| UC-ORG-02-android | `LSMapLayer` organism (map-primary canvas with overlay slots) — Android Compose | kotlin-implementer | 300 min |
| UC-ORG-03-ios | `LSNavigatorMessage` + `LSInlineErrorCallout` — iOS SwiftUI | swift-implementer | 240 min |
| UC-ORG-03-android | `LSNavigatorMessage` + `LSInlineErrorCallout` — Android Compose | kotlin-implementer | 240 min |
| UC-ORG-04-ios | `LSRouteSheet` organism — iOS SwiftUI | swift-implementer | 180 min |
| UC-ORG-04-android | `LSRouteSheet` organism — Android Compose | kotlin-implementer | 180 min |
| UC-ORG-05-ios | `LSSessionsDrawer` organism — iOS SwiftUI | swift-implementer | 240 min |
| UC-ORG-05-android | `LSSessionsDrawer` organism — Android Compose | kotlin-implementer | 240 min |
| UC-ORG-06-ios | `LSRouteCard` domain organism (consumes multi-polyline `LSMap`) — iOS SwiftUI | swift-implementer | 180 min |
| UC-ORG-06-android | `LSRouteCard` domain organism (consumes multi-polyline `LSMap`) — Android Compose | kotlin-implementer | 180 min |
| UC-ORG-07-ios | `LSSectionHeader` organism — iOS SwiftUI | swift-implementer | 90 min |
| UC-ORG-07-android | `LSSectionHeader` organism — Android Compose | kotlin-implementer | 90 min |

### Remediation Tasks (from red-hat review 2026-04-25)

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| REMEDIATION-01 | UC-ORG-03 Android: Missing tests + disabled stories | kotlin-implementer | 120 min |
| REMEDIATION-02 | UC-ORG-03 iOS: Auto-dismiss + attachment composition | swift-implementer | 90 min |
| REMEDIATION-03 | UC-ORG-02 iOS: Replace EmptyView stubs in MapLayer | swift-implementer | 90 min |
| REMEDIATION-04 | Token sweep: Replace hardcoded values across organisms | swift-implementer + kotlin-implementer | 60 min |

---

## Human Testing Gate

**Gate:** Every organism story renders on both iOS and Android with mock domain data, composing only from MOL + ATM tiers — `LSMapLayer` z-order + safe-area stacking, `LSNavigatorMessage` signal-stripe branding with auto-dismiss behavior, `LSInlineErrorCallout` warn-stripe with suggestion chips, `LSRouteSheet` bottom-sheet layout with instrument readout + weather timeline + sticky action row, `LSSessionsDrawer` slide-in with active-session stripe, `LSRouteCard` multi-polyline map preview — all match the Copper Navigator concepts with parity across platforms.

---

## Source Coverage

- `.spec/prds/v2/07-uc-org.md` — UC-ORG-01 through UC-ORG-07 acceptance criteria
- `.spec/prds/v2/concepts/designs.html` — authoritative Copper Navigator composition reference
- `.spec/prds/v2/11-technical-requirements.md` — entity schemas (`Session`, `NavigatorMessage`, `RouteAttachment`, `RouteDetails`, `WeatherTimelineEntry`) and `LSMapLayer` slot API
- All atoms (Sprints 2, 3) and molecules (Sprint 4) as composition inputs

### Per-Task Design Files

| Task | Design Reference |
|------|-----------------|
| UC-ORG-01-ios | [`concepts/uc-org-01-topbar-navbar.html`](../../concepts/uc-org-01-topbar-navbar.html) |
| UC-ORG-01-android | [`concepts/uc-org-01-topbar-navbar.html`](../../concepts/uc-org-01-topbar-navbar.html) |
| UC-ORG-02-ios | [`concepts/uc-org-02-maplayer.html`](../../concepts/uc-org-02-maplayer.html) |
| UC-ORG-02-android | [`concepts/uc-org-02-maplayer.html`](../../concepts/uc-org-02-maplayer.html) |
| UC-ORG-03-ios | [`concepts/uc-org-03-navigator-message-error-callout.html`](../../concepts/uc-org-03-navigator-message-error-callout.html) |
| UC-ORG-03-android | [`concepts/uc-org-03-navigator-message-error-callout.html`](../../concepts/uc-org-03-navigator-message-error-callout.html) |
| UC-ORG-04-ios | [`concepts/uc-org-04-route-sheet.html`](../../concepts/uc-org-04-route-sheet.html) |
| UC-ORG-04-android | [`concepts/uc-org-04-route-sheet.html`](../../concepts/uc-org-04-route-sheet.html) |
| UC-ORG-05-ios | [`concepts/uc-org-05-sessions-drawer.html`](../../concepts/uc-org-05-sessions-drawer.html) |
| UC-ORG-05-android | [`concepts/uc-org-05-sessions-drawer.html`](../../concepts/uc-org-05-sessions-drawer.html) |
| UC-ORG-06-ios | [`concepts/uc-org-06-route-card.html`](../../concepts/uc-org-06-route-card.html) |
| UC-ORG-06-android | [`concepts/uc-org-06-route-card.html`](../../concepts/uc-org-06-route-card.html) |
| UC-ORG-07-ios | [`concepts/uc-org-07-section-header.html`](../../concepts/uc-org-07-section-header.html) |
| UC-ORG-07-android | [`concepts/uc-org-07-section-header.html`](../../concepts/uc-org-07-section-header.html) |

---

## Blocks

- Sprint 6 (Navigator Screens) — every screen assembles one or more of these organisms into the `LSMapLayer` canvas; `LSTopBar`, `LSMapLayer`, `LSNavigatorMessage`, `LSInlineErrorCallout`, `LSRouteSheet`, `LSSessionsDrawer`, and `LSRouteCard` are all consumed by UC-SCR-01..06.
- Sprint 7 — indirectly, through the RN-retirement gate being "all V2 screens still render after cleanup".
