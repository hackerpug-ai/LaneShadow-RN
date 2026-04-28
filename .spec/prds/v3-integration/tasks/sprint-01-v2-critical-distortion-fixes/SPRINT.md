# Sprint 01: V2 Critical Distortion Fixes

**Sequence:** 1
**Timeline:** Phase 1 · Week 1
**Status:** In Progress (remedial tasks added 2026-04-27)

## Overview

Sprint 01 closes the 36 HIGH-severity FID gaps that produce the most visible distortion (typography, glass-panel container, iOS map placeholder, Android build blockers, token errors). This is pure UI fidelity work — no Convex or auth changes.

## Human Testing Gate

**Gate:** A reviewer can open the V2 native sandbox on iOS Simulator and Android Emulator and confirm that Newsreader serif typography renders correctly on all designated components, the iOS map slot shows a real Mapbox map (not a LinearGradient placeholder), the Sessions drawer is solid (not glass-blurred), and the Android app compiles without errors.

**Test Steps:**
1. Open the V2 sandbox on iOS Simulator and tap the IdleScreen `default` story; confirm the greeting headline reads in Newsreader italic serif at the opinion-xl size with the meta row ("FRIDAY · 68°F · CLEAR") rendered in copper signal color
2. Tap the SessionsScreen story on both iOS Simulator and Android Emulator; confirm the LSSessionsDrawer is opaque (solid `surface.card`) — no map content visible behind drawer text — and "Rides" header renders in Newsreader opinion-lg italic
3. Run `cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew assembleDebug` and confirm the build completes with zero compilation errors (Session data class declared in LSSessionsDrawer.kt; RouteDetailsScreen.kt polyline decoded via `PolylineDecoder.decodeOrNull()`)
4. Open RouteDetailsScreen story on Android and confirm a real polyline renders on the map (not a blank slate from `emptyList()`)
5. Tap the LSRouteCard story on iOS and confirm the map preview fills the card edge-to-edge with no inner double-rounded corner artifacts
6. Tap the IdleScreen / PlanningScreen / ErrorScreen stories on iOS and confirm the map slot shows a real Mapbox map instead of a two-color `LinearGradient` placeholder
7. Open the LSInlineErrorCallout story on iOS and confirm the body text renders in Newsreader opinion-md (not Geist heading.md proxy)

## Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| FID-S01-T01 | iOS Newsreader serif typography rollout — IdleScreen greeting (opinion-xl), Sessions "Rides" (opinion-lg italic), Error callout body (opinion-md), NavigatorMessage body (opinion-md), TopBar centered title (opinion-md), SectionHeader caps variant (label-sm) | swift-implementer | 240 min |
| FID-S01-T02 | iOS map slot replacement — replace LinearGradient placeholders in IdleScreen / PlanningScreen / ErrorScreen with real LSMap (or paper substrate + contour SVGs) + favorite pin overlays | swift-implementer | 360 min |
| FID-S01-T03 | iOS LSRouteCard geometry fix — `LSCard(padding: .zero)`, remove inner `clipShape`, switch to `aspectRatio(9/4)`, re-apply padding inside `routeInfo` | swift-implementer | 90 min |
| FID-S01-T04 | iOS LSRouteSheet bottom-sheet shell — wrap in `LSBottomSheet(detent: .large, onDismiss:)`, add 5-dot scenic strip, fix via subtitle to `body.sm`, fix Save/Ride 1:2 button proportion | swift-implementer | 240 min |
| FID-S01-T05 | iOS Sessions drawer container fix (glass→solid `surface.card` + `--elev-overlay` shadow + border-right separator) + iOS token corrections (active stripe `strokeWidth.lg`, active row `signal.whisper`, hamburger 44pt hit target, drawer shadow tier) | swift-implementer | 240 min |
| FID-S01-T06 | Android Sessions drawer container fix (glass→solid) + Android token corrections (active stripe `stroke.lg`, active row `signal.whisper`, hamburger 48dp hit target, drawer shadow `2px 0 16px`) | kotlin-implementer | 240 min |
| FID-S01-T07 | Android critical build blockers — declare `Session` data class in LSSessionsDrawer.kt; decode `state.route.polyline` via `PolylineDecoder.decodeOrNull()` in RouteDetailsScreen.kt | kotlin-implementer | 60 min |
| FID-S01-T08 | Android remaining HIGH-severity token corrections — pinned indicator dot full-opacity `signal.default`, LSRouteCard heart `IconColor.Signal`, LSRouteCard map `aspectRatio(9f/4f)`, LSRouteSheet `timeRange: Pair<String, String>` prop, LSSectionHeader baseline alignment | kotlin-implementer | 180 min |
| FID-S01-T09 | Sprint 01 verification — capture screenshots of every modified component on both platforms; visually compare against `.spec/design/system/` HTML/PNG; record findings in sprint summary | qa-engineer | 60 min |
| FID-S01-T10 | iOS test infrastructure fixes — fix MapSlotTests compilation, add programmatic font/dimension assertions to TypographyTests and RouteSheetShellTests | swift-implementer | 120 min |
| FID-S01-T11 | iOS implementation fixes — hamburger ≥44pt tap target, LSPaperMap map.paper token, theme tokens for hardcoded pin/dot sizes | swift-implementer | 90 min |
| FID-S01-T12 | Android implementation fixes — real shadow (no stub), surface.card token, timeRange Pair parameter, minimumInteractiveComponentSize for tap target | kotlin-implementer | 120 min |

## Dependencies

- Blocks: Sprint 02
- Dependent on: None

## PRD Coverage

- UC-FID-01 (HIGH-severity AC subset — ~36 ACs)
- `remediations/00-summary.md` themes 1-3, 9 (typography, map slot, glass-panel container, build blockers)

## Task Detail Files

Generated by `/kb-sprint-tasks-plan` on 2026-04-27.

| Task | File | Agent | ACs |
|------|------|-------|-----|
| FID-S01-T01 | [FID-S01-T01-ios-newsreader-typography-rollout.md](./FID-S01-T01-ios-newsreader-typography-rollout.md) | swift-implementer | 6 |
| FID-S01-T02 | [FID-S01-T02-ios-map-slot-replacement.md](./FID-S01-T02-ios-map-slot-replacement.md) | swift-implementer | 5 |
| FID-S01-T03 | [FID-S01-T03-ios-route-card-geometry-fix.md](./FID-S01-T03-ios-route-card-geometry-fix.md) | swift-implementer | 3 |
| FID-S01-T04 | [FID-S01-T04-ios-route-sheet-bottom-sheet-shell.md](./FID-S01-T04-ios-route-sheet-bottom-sheet-shell.md) | swift-implementer | 4 |
| FID-S01-T05 | [FID-S01-T05-ios-sessions-drawer-container-fix.md](./FID-S01-T05-ios-sessions-drawer-container-fix.md) | swift-implementer | 5 |
| FID-S01-T06 | [FID-S01-T06-android-sessions-drawer-container-fix.md](./FID-S01-T06-android-sessions-drawer-container-fix.md) | kotlin-implementer | 5 |
| FID-S01-T07 | [FID-S01-T07-android-build-blockers.md](./FID-S01-T07-android-build-blockers.md) | kotlin-implementer | 2 |
| FID-S01-T08 | [FID-S01-T08-android-token-corrections.md](./FID-S01-T08-android-token-corrections.md) | kotlin-implementer | 5 |
| FID-S01-T09 | [FID-S01-T09-sprint-verification.md](./FID-S01-T09-sprint-verification.md) | qa-engineer | 3 |
| FID-S01-T10 | [FID-S01-T10-ios-test-infrastructure-fixes.md](./FID-S01-T10-ios-test-infrastructure-fixes.md) | swift-implementer | 4 |
| FID-S01-T11 | [FID-S01-T11-ios-implementation-fixes.md](./FID-S01-T11-ios-implementation-fixes.md) | swift-implementer | 3 |
| FID-S01-T12 | [FID-S01-T12-android-implementation-fixes.md](./FID-S01-T12-android-implementation-fixes.md) | kotlin-implementer | 4 |
