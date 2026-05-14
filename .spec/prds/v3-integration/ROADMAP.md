---
roadmap: 2
project: LaneShadow Native Integration (V3)
generated: 2026-05-04T12:00:00-07:00
revised: 2026-05-14T20:25:23Z
prd: .spec/prds/v3-integration/README.md
sprint_count: 11
---

# Sprint Roadmap: LaneShadow Native Integration (V3)

## Overview

**Sprints:** 11 (Sprints 6+ reshaped 2026-05-04 view-at-a-time; Sprint 07 component-delivery inserted 2026-05-14)
**Currently in flight:** Sprint 06 (idle parity carry-forward — IDLE-SYNC-iOS / IDLE-SYNC-Android / IDLE-SYNC-Pipeline / CHIP-T03) + Sprint 08 (planning state remediation + STUB-FIX wave); Sprint 07 (Context Capsule / Map Controls) closed 2026-05-13

This roadmap sequences the 25 use cases in `.spec/prds/v3-integration/` so that **all 105 acceptance criteria of UC-FID-01 (Design Fidelity) land in Sprints 1-2 BEFORE any integration work begins.** This honors HUMAN SIGNAL #1's framing — sandbox views are "distorted" because of UI fidelity gaps; live-data wiring on top of distorted UI compounds the problem. By restoring V2 design-system fidelity first, every subsequent integration sprint binds real Convex/Clerk/Mapbox data into a sandbox that already matches the authoritative `.spec/design/system/` mockups.

**Reshape on 2026-05-04 (revision 2):** Per user direction *"each sprint is super overscoped, we need to slow down and take each map view one at a time"*, the previously bundled Sprints 06 (Saved Routes / Sessions / Settings) and 07 (Map / Offline / Error / Ship Gate) were retired and replaced with **five view-at-a-time sprints (06–10): IdleScreen → PlanningScreen → RouteResultsScreen → RouteDetails Bottom Sheet → SessionsScreen.** Each new sprint integrates exactly one screen against real Convex/Clerk/Mapbox data with the Sprint 05 design-review pipeline serving as the per-screen quality gate. The prior bundled scope is preserved at [`ROADMAP-ICEBOX.md`](./ROADMAP-ICEBOX.md) for future re-pickup of deferred surfaces (saved-routes browsing list, settings, offline regions, error recovery, ship-gate hardening, manual PlanRideSheet).

**Insertion on 2026-05-14 (this revision):** Between 2026-05-06 and 2026-05-07, the design system shipped new `mol-context-capsule` + `org-map-controls` components plus a Container Principle that invalidated the Sprint 06 idle implementation against the new design references. A dedicated component-delivery sprint — **Sprint 07: Context Capsule, Map Controls + Autocomplete Carry-Forward** — was inserted between the idle state (Sprint 06) and what was previously Sprint 07 (PlanningScreen, now Sprint 08). Downstream sprints shifted +1: PlanningScreen → Sprint 08, RouteResultsScreen → Sprint 09, RouteDetails → Sprint 10, SessionsScreen → Sprint 11. Total sprint count: 10 → 11. The view-at-a-time progression remains intact; one component-delivery sprint sits between the idle and planning states because every downstream view sprint reuses `LSContextCapsule` + `LSMapControls`.

**Sprint sequence rationale:**

- **Sprint 01** closes the 36 HIGH-severity FID gaps that produce the most visible distortion (typography, glass-panel container, iOS map placeholder, Android build blockers, token errors).
- **Sprint 02** closes the 42 MED-severity FID gaps (motion recipes, missing variants, NavBar variants) AND ships the 27 missing Android organism stories — completing the sandbox infrastructure that subsequent integration sprints need for snapshot-based regression testing.
- **Sprint 03** wires auth + Convex foundation (the substrate every other UC depends on).
- **Sprint 04** wires the conversational planning loop end-to-end — the single biggest integration surface, touching all 6 V2 screens.
- **Sprint 05** ships the **Design Review pipeline** (iOS XCUITest captures → vision LLM eval against `.spec/design/system/` references → fix-oriented JSON → Claude code skill agent → re-eval loop), retiring the sandbox snapshot tests + parity infrastructure in the process. The in-app sandbox catalog UI is preserved for dev exploration.
- **Sprint 06** delivers a production-grade **idle state of the map view** — real map, real location, real greeting, real suggestion chips. Status: T01–T10 Done; T11 + IDLE-SYNC-* carry-forward in flight to close the post-2026-05-06 design-review re-baseline.
- **Sprint 07** *(inserted 2026-05-14, Done 2026-05-13)* delivers two new design-system components — `LSContextCapsule` (5 state variants) and `LSMapControls` (right-edge vertical workbar) — and retrofits the idle state to match the 2026-05-06 redesign (Container Principle); carries autocomplete proximity-gating forward. Every downstream view sprint reuses these components.
- **Sprint 08** delivers a production-grade **planning state of the canonical map view** — copper sketch animation on the persistent map host, `LSContextCapsule(--planning)`, real phase indicator driven by Convex stream, real cancel — that passes the design-review pipeline.
- **Sprint 09** delivers a production-grade **RouteResultsScreen** — three real polylines, real Navigator message, real route attachment cards, real refine + alt-select interactions — that passes the design-review pipeline.
- **Sprint 10** delivers a production-grade **RouteDetails bottom sheet** — real metrics, real weather timeline, real save / ride actions — that passes the design-review pipeline.
- **Sprint 11** delivers a production-grade **SessionsScreen drawer** — real session list, real grouping, real switch-with-camera-restore — that passes the design-review pipeline.

Saved-routes browsing list, Settings, Offline Regions, Error Recovery wiring, manual PlanRideSheet, and ship-gate hardening are explicitly **deferred** to a post-Sprint-11 follow-on plan (see ICEBOX for the prior bundled detail).

**Human testing policy:** Human tests for non-sandbox code must include real-device E2E steps. Simulator/emulator checks may remain as supporting evidence, but any gate that exercises live app flows, auth, Convex, Mapbox, persistence, location, or external services must include a real-device E2E path with recorded evidence. For iOS, use the native XCUITest pattern documented in `docs/REAL_DEVICE_E2E.md`; for Android, use physical-device evidence or mark the step MANUAL/BLOCKED until an equivalent Android device harness exists. Sandbox-only visual/component gates may continue to use simulator/emulator snapshot tooling — but as of Sprint 05, parity-snapshot tests are removed in favor of design-review evaluation.

## Sprint Sequence

| # | Sprint | Gate | Status |
|---|--------|------|--------|
| 1 | [Sprint 01: V2 Critical Distortion Fixes](#sprint-01-v2-critical-distortion-fixes) | Sandbox no longer looks distorted on the most visible HIGH-severity gaps; Android compiles | In Progress |
| 2 | [Sprint 02: V2 Variants, Motion & Sandbox Coverage](#sprint-02-v2-variants-motion--sandbox-coverage) | All designed variants and motion recipes match HTML mockups; Android sandbox stories complete | In Progress |
| 3 | [Sprint 03: Auth & Convex Foundation](#sprint-03-auth--convex-foundation) | Rider can sign in via OAuth on both platforms and see their real name on IdleScreen | In Progress |
| 3R | [Sprint 03 Remediation: Auth Design Fidelity, Component Gaps, and Real E2E](./tasks/sprint-03-auth-design-e2e-remediation/SPRINT.md) | Auth UI matches `auth-screen.html`, missing primitives are implemented, and real human-step auth evidence replaces render-only tests | Planned |
| 4 | [Sprint 04: Conversational Planning Loop](#sprint-04-conversational-planning-loop) | Rider can plan a real route end-to-end via chat and see three live polylines on RouteResults | In Progress |
| 5 | [Sprint 05: Design Review Pipeline](#sprint-05-design-review-pipeline) | A reviewer can run `pnpm design:review` and receive a calibrated, fix-oriented JSON report of per-component design issues consumable from a `design-review` Claude skill | **In Progress (do not retouch)** |
| 6 | [Sprint 06: Map View — Idle State](#sprint-06-map-view--idle-state) | A real idle map view on iOS + Android matches the design reference end-to-end and passes `pnpm design:review --screens idle-screen` with zero `high`-severity issues | In Progress (T01–T10 Done; T11 + IDLE-SYNC carry-forward) |
| 7 | [Sprint 07: Context Capsule, Map Controls + Autocomplete](#sprint-07-context-capsule-map-controls--autocomplete-carry-forward) | New `LSContextCapsule` + right-edge `LSMapControls` ship on iOS + Android; idle state retrofitted to the 2026-05-06 design-system update; autocomplete proximity-gated | **Done** |
| 8 | [Sprint 08: Map View — Planning State](#sprint-08-map-view--planning-state) | From the idle map view, a rider taps a suggestion chip and the same map host transitions to the planning state — copper sketch polyline, `LSContextCapsule(--planning)`, `LSPhaseIndicator` driven by Convex `sessionMessages`, locked chat input, working cancel — passing `pnpm design:review --screens planning-screen` with zero `high`-severity issues | In Progress |
| 9 | [Sprint 09: RouteResultsScreen](#sprint-09-routeresultsscreen) | A real RouteResultsScreen on iOS + Android matches the design reference end-to-end and passes `pnpm design:review --screens route-results-screen` with zero `high`-severity issues | Planned |
| 10 | [Sprint 10: RouteDetails Bottom Sheet](#sprint-10-routedetails-bottom-sheet) | A real RouteDetails bottom sheet on iOS + Android matches the design reference end-to-end and passes `pnpm design:review --screens route-details-screen` with zero `high`-severity issues | Planned |
| 11 | [Sprint 11: SessionsScreen](#sprint-11-sessionsscreen) | A real Sessions drawer on iOS + Android matches the design reference end-to-end and passes `pnpm design:review --screens sessions-screen` with zero `high`-severity issues | Planned |

---

## Per-Sprint Details

### Sprint 01: V2 Critical Distortion Fixes

**Sequence:** 1
**Timeline:** Phase 1 · Week 1
**Status:** In Progress (task expansion 2026-04-27)

#### Human Testing Gate

**Gate:** A reviewer can open the V2 native sandbox on iOS Simulator and Android Emulator and confirm that Newsreader serif typography renders correctly on all designated components, the iOS map slot shows a real Mapbox map (not a LinearGradient placeholder), the Sessions drawer is solid (not glass-blurred), and the Android app compiles without errors.

**Test Steps:**
1. Open the V2 sandbox on iOS Simulator and tap the IdleScreen `default` story; confirm the greeting headline reads in Newsreader italic serif at the opinion-xl size with the meta row ("FRIDAY · 68°F · CLEAR") rendered in copper signal color
2. Tap the SessionsScreen story on both iOS Simulator and Android Emulator; confirm the LSSessionsDrawer is opaque (solid `surface.card`) — no map content visible behind drawer text — and "Rides" header renders in Newsreader opinion-lg italic
3. Run `cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew assembleDebug` and confirm the build completes with zero compilation errors (Session data class declared in LSSessionsDrawer.kt; RouteDetailsScreen.kt polyline decoded via `PolylineDecoder.decodeOrNull()`)
4. Open RouteDetailsScreen story on Android and confirm a real polyline renders on the map (not a blank slate from `emptyList()`)
5. Tap the LSRouteCard story on iOS and confirm the map preview fills the card edge-to-edge with no inner double-rounded corner artifacts
6. Tap the IdleScreen / PlanningScreen / ErrorScreen stories on iOS and confirm the map slot shows a real Mapbox map instead of a two-color `LinearGradient` placeholder
7. Open the LSInlineErrorCallout story on iOS and confirm the body text renders in Newsreader opinion-md (not Geist heading.md proxy)

#### Tasks

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

**Next Sprint Tasks:**

Generated by /kb-sprint-tasks-plan on 2026-04-27

- [FID-S01-T01-ios-newsreader-typography-rollout.md](./tasks/sprint-01-v2-critical-distortion-fixes/FID-S01-T01-ios-newsreader-typography-rollout.md)
- [FID-S01-T02-ios-map-slot-replacement.md](./tasks/sprint-01-v2-critical-distortion-fixes/FID-S01-T02-ios-map-slot-replacement.md)
- [FID-S01-T03-ios-route-card-geometry-fix.md](./tasks/sprint-01-v2-critical-distortion-fixes/FID-S01-T03-ios-route-card-geometry-fix.md)
- [FID-S01-T04-ios-route-sheet-bottom-sheet-shell.md](./tasks/sprint-01-v2-critical-distortion-fixes/FID-S01-T04-ios-route-sheet-bottom-sheet-shell.md)
- [FID-S01-T05-ios-sessions-drawer-container-fix.md](./tasks/sprint-01-v2-critical-distortion-fixes/FID-S01-T05-ios-sessions-drawer-container-fix.md)
- [FID-S01-T06-android-sessions-drawer-container-fix.md](./tasks/sprint-01-v2-critical-distortion-fixes/FID-S01-T06-android-sessions-drawer-container-fix.md)
- [FID-S01-T07-android-build-blockers.md](./tasks/sprint-01-v2-critical-distortion-fixes/FID-S01-T07-android-build-blockers.md)
- [FID-S01-T08-android-token-corrections.md](./tasks/sprint-01-v2-critical-distortion-fixes/FID-S01-T08-android-token-corrections.md)
- [FID-S01-T09-sprint-verification.md](./tasks/sprint-01-v2-critical-distortion-fixes/FID-S01-T09-sprint-verification.md)

#### Dependencies

- Blocks: Sprint 02
- Dependent on: None

#### PRD Coverage

- UC-FID-01 (HIGH-severity AC subset — ~36 ACs)
- `remediations/00-summary.md` themes 1-3, 9 (typography, map slot, glass-panel container, build blockers)

---

### Sprint 02: V2 Variants, Motion & Sandbox Coverage

**Sequence:** 2
**Timeline:** Phase 1 · Week 2
**Status:** In Progress (task expansion 2026-04-28)

#### Human Testing Gate

**Gate:** A reviewer can exercise every designed variant, animation, and motion recipe in the V2 native sandbox on both iOS and Android — including all previously empty Android organism stories — and confirm visual + motion parity with the `.spec/design/system/` HTML mockups, with `pnpm snapshots:check` reporting zero coverage gaps across atoms, molecules, organisms, and templates.

**Test Steps:**
1. Open the PlanningScreen story on iOS and Android; confirm the sketch polyline animates at the deliberate 1400ms linear loop (not the rushed 600ms) and the leading head dot breathes synchronously at 1400ms ease-in-out
2. Cycle through the new mock-provider variants — Idle V01 (no-location), V02 (first-ride), V03 (weather-advisory); Planning V01 (slow), V02 (cancel-confirm), V03 (single-candidate); RouteResults S02 (alt-selected), S04 (refining); RouteDetails S03 (dark), S04 (medium detent), S05 (dismissing), V01 (saved); Sessions S05 (new-confirm); Error S04 (recovered), V01 (offline), storm-gate variant — and confirm each renders the designed visual on both platforms
3. Open RouteResultsScreen S04 (refining) story; confirm the warm scrim overlays the map, polylines dim to 40%, the LSNavigatorMessage auto-dismisses, three primer chips appear, and a copper send button is revealed
4. Save a route from RouteDetails (V01 saved-state); confirm the toast slides in with copper check + the Save button flips to saved variant + a "Saved" pill appears beside the best badge
5. Open the LSNavBar story and toggle between basic, filter-chip-row, and search-slot variants; confirm horizontal scrolling chips and inset search field render on both platforms
6. Run `pnpm snapshots:check` and confirm zero coverage gaps across all tiers (atoms, molecules, organisms, templates) on both iOS and Android
7. Open the Android sandbox story registry and confirm `LSNavigatorMessage` (6 stories), `LSInlineErrorCallout` (5), `LSRouteSheet` (5), `LSRouteCard` (6), `LSSectionHeader` (5) all appear — `AppStories.all` is no longer `emptyList()` for content organisms
8. Run `pnpm snapshots:parity-report` and confirm cross-platform parity ≥95% per tier with all snapshot tests passing

> **Note (added 2026-05-04):** `pnpm snapshots:check` and `pnpm snapshots:parity-report` are scheduled for removal in Sprint 05 (Design Review Pipeline) as part of retiring the brittle sandbox-parity test layer. For Sprint 02, these scripts remain authoritative; for any subsequent re-validation after Sprint 05 ships, use `pnpm design:review --screens <…>` instead.

#### Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| FID-S02-T01 | iOS motion recipes wiring — sketchPolylineLoop 1400ms linear, breathing head dot 1400ms ease-in-out, LSBestBadge `bestBadgeEnter` 200ms scale+fade, record dot pulse, chatOverlayEnter on suggestion chips | swift-implementer | 180 min |
| FID-S02-T02 | Android motion recipes wiring — sketch loop 1400ms, leading head dot composable + animation, drawer `spring(0.85, StiffnessMedium)`, RouteResults polyline `Animatable.animateTo` (replacing manual coroutine loop), record dot pulse, suggestion chip enter | kotlin-implementer | 240 min |
| FID-S02-T03 | iOS missing variants — Idle V01-V03 (no-location pill, first-ride no-pins, weather-advisory card) + Planning V01-V03 (slow apology, cancel-confirm sheet, single-candidate warning) | swift-implementer | 240 min |
| FID-S02-T04 | Android missing variants — Idle V01-V03 + Planning V01-V03 (parity with iOS, including header passing to LSPhaseIndicator) | kotlin-implementer | 240 min |
| FID-S02-T05 | iOS missing variants — RouteResults S02 (alt-selection re-promote) + S04 (refining scrim + primers + send) + V03 (Recall chip) + RouteDetails S03 (dark) / S04 (medium) / S05 (dismissing copper stripe) / V01 (saved-state toast + Save flip) + iOS mixed-weather story variant fix | swift-implementer | 360 min |
| FID-S02-T06 | Android missing variants — RouteResults S02/S04/V03 + RouteDetails S03-S05/V01 + saved-state toast + Save button flip | kotlin-implementer | 360 min |
| FID-S02-T07 | iOS Sessions S05 (new-confirm dialog) + date grouping (TONIGHT / TODAY / THIS WEEK / LAST WEEK / EARLIER) + Error S04 (recovered fade-to-0.55) + V01 (offline wifi-off watermark) + suggestion chip wrap layout (FlowLayout) | swift-implementer | 240 min |
| FID-S02-T08 | Android Sessions S05 + date grouping + Error S04 (recovered) + V01 (offline) + storm-gate variant (`wx.storm` purple) + chip wrap (FlowRow) + suggestion chip primary/tertiary color distinction (warning-amber vs glass) | kotlin-implementer | 300 min |
| FID-S02-T09 | LSNavBar filter-chip row + search-slot variants — paired iOS + Android implementations | swift-implementer + kotlin-implementer | 240 min |
| FID-S02-T10 | Sandbox story coverage + snapshot baselines — iOS templates Idle 1→7, RouteResults 1→7, RouteDetails 2→6, Sessions 1→5, Error 1→6; iOS LSRouteCard 1→6; record snapshot baselines on both platforms; verify `pnpm snapshots:check` + `pnpm snapshots:parity-coverage` clean | kotlin-implementer + swift-implementer | 360 min |

**Next Sprint Tasks:**

Generated by /kb-sprint-tasks-plan on 2026-04-28

- [FID-S02-T01-ios-motion-recipes-wiring.md](./tasks/sprint-02-v2-variants-motion-sandbox-coverage/FID-S02-T01-ios-motion-recipes-wiring.md)
- [FID-S02-T02-android-motion-recipes-wiring.md](./tasks/sprint-02-v2-variants-motion-sandbox-coverage/FID-S02-T02-android-motion-recipes-wiring.md)
- [FID-S02-T03-ios-idle-planning-variants.md](./tasks/sprint-02-v2-variants-motion-sandbox-coverage/FID-S02-T03-ios-idle-planning-variants.md)
- [FID-S02-T04-android-idle-planning-variants.md](./tasks/sprint-02-v2-variants-motion-sandbox-coverage/FID-S02-T04-android-idle-planning-variants.md)
- [FID-S02-T05-ios-route-results-details-variants.md](./tasks/sprint-02-v2-variants-motion-sandbox-coverage/FID-S02-T05-ios-route-results-details-variants.md)
- [FID-S02-T06-android-route-results-details-variants.md](./tasks/sprint-02-v2-variants-motion-sandbox-coverage/FID-S02-T06-android-route-results-details-variants.md)
- [FID-S02-T07-ios-sessions-error-variants.md](./tasks/sprint-02-v2-variants-motion-sandbox-coverage/FID-S02-T07-ios-sessions-error-variants.md)
- [FID-S02-T08-android-sessions-error-variants.md](./tasks/sprint-02-v2-variants-motion-sandbox-coverage/FID-S02-T08-android-sessions-error-variants.md)
- [FID-S02-T09-navbar-filter-search-variants.md](./tasks/sprint-02-v2-variants-motion-sandbox-coverage/FID-S02-T09-navbar-filter-search-variants.md)
- [FID-S02-T10-sandbox-story-coverage-snapshot-baselines.md](./tasks/sprint-02-v2-variants-motion-sandbox-coverage/FID-S02-T10-sandbox-story-coverage-snapshot-baselines.md)

#### Dependencies

- Blocks: Sprint 03
- Dependent on: Sprint 01

#### PRD Coverage

- UC-FID-01 (MED-severity AC subset — ~42 ACs + sandbox story coverage ACs)
- `remediations/00-summary.md` themes 5-8 (motion, story coverage, token correctness, missing variants)

---

### Sprint 03: Auth & Convex Foundation

**Sequence:** 3
**Timeline:** Phase 2 · Week 3
**Status:** In Progress (task expansion 2026-04-28)

#### Human Testing Gate

**Gate:** A rider can sign in via email or Google/Apple OAuth on both iOS and Android, see their session restored on cold-start relaunch, and view the IdleScreen with their real name interpolated into the greeting from `db.users.getCurrentUser`.

**Test Steps:**
1. Launch the iOS app on a fresh Simulator and tap "Continue with Apple" on the SignInScreen; confirm the native Apple Sign-In sheet presents and authentication completes, redirecting to IdleScreen
2. Launch the Android app on a fresh Emulator and tap "Continue with Google" on the SignInScreen; confirm the OAuth flow (Clerk SDK or Custom Tabs fallback) completes and the rider lands on IdleScreen
3. View the IdleScreen and confirm the greeting interpolates the rider's name from the Convex `users` table (e.g., "Where are we riding today, Justin?")
4. Kill the app on both platforms via the simulator/emulator and re-launch; confirm the rider remains signed in (Clerk JWT cached in Keychain on iOS, EncryptedSharedPreferences on Android)
5. Navigate to Settings (via hamburger menu) on both platforms, tap "Sign out", confirm the dialog, and confirm the app redirects to SignInScreen with all local state cleared
6. Run `cd /Users/justinrich/Projects/LaneShadow/server && pnpm convex dev` and watch the new `db.users.getCurrentUser` query return user data when the iOS or Android client subscribes
7. Trigger an `UNAUTHENTICATED` Convex error mid-session (e.g., revoke the token in Clerk dashboard); confirm the app redirects to SignInScreen automatically via the LaneShadowError typed-error pathway
8. Verify the type-generation pipeline by running `pnpm server:codegen` and confirming `ios/LaneShadow/Generated/ConvexTypes.generated.swift` and `android/.../generated/ConvexTypes.kt` files regenerate from `_generated/api.d.ts`

#### Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| AUTH-S03-T01 | Backend additions — `db.users.getCurrentUser` public query (~30 LoC) + optional `limit` arg on `db.sessionMessages.list` (+5 LoC); deploy to Convex dev environment | convex-implementer | 90 min |
| AUTH-S03-T02 | Type-gen pipeline — `server/scripts/generate-mobile-types.ts` reads `_generated/api.d.ts` and emits `ios/LaneShadow/Generated/ConvexTypes.generated.swift` (Codable structs) + `android/app/src/main/.../generated/ConvexTypes.kt` (`@Serializable` data classes); wire into `pnpm server:codegen` | convex-implementer | 360 min |
| AUTH-S03-T03 | iOS ConvexMobile Swift SDK integration via SPM; `Services/ConvexClient+LaneShadow.swift` typed wrapper exposing `subscribeToSessions() -> AsyncStream<[Session]>`, `sendMessage`, `createSession`, etc.; `setAuth` callback bound to Clerk JWT | swift-implementer | 240 min |
| AUTH-S03-T04 | Android ConvexMobile Kotlin SDK integration via Gradle; `services/ConvexClientProvider.kt` Hilt @Singleton wrapper exposing `Flow<List<Session>>`, suspend mutations; `setAuth` callback bound to Clerk JWT | kotlin-implementer | 240 min |
| AUTH-S03-T05 | iOS `Services/ClerkAuth.swift` — `clerk-ios` SDK adapter with email/password + Apple Sign-In + Google OAuth flows; Keychain token storage (default Clerk behavior); deep-link `.onOpenURL` for `laneshadow://oauth-callback` | swift-implementer | 240 min |
| AUTH-S03-T06 | Android `services/ClerkAuth.kt` — `AuthRepository` interface with primary `ClerkAuthRepository` (alpha clerk-android SDK) and `CustomTabsAuthRepository` fallback (single Hilt @Binds swap if SDK proves immature week 1 spike); `EncryptedSharedPreferences` token storage; deep-link intent filter | kotlin-implementer | 360 min |
| AUTH-S03-T07 | iOS `App/RootView.swift` — top-level NavigationStack with AuthGate switch (`.unauthenticated` → SignInScreen / SignUpScreen / OAuthCallbackScreen; `.authenticated` → IdleScreen or last-viewed session phase); `AppEnvironment` @Observable injection of ConvexClient + Clerk | swift-implementer | 180 min |
| AUTH-S03-T08 | Android `MainActivity` Compose shell — `@AndroidEntryPoint` + `LaneShadowApp` with `@HiltAndroidApp`; Navigation Compose typed sealed `Route` interface; `AuthNavGraph` vs `MainNavGraph` selection from auth state Flow | kotlin-implementer | 240 min |
| AUTH-S03-T09 | iOS SignInScreen + SignUpScreen + OAuthCallbackScreen — composed from V2 atoms (LSCard + LSTextField + LSButton) + new `LSAuthProviderButton` molecule (Apple + Google variants); multi-step email-then-password flow matching RN pattern | swift-implementer | 360 min |
| AUTH-S03-T10 | Android SignInScreen + SignUpScreen + OAuthCallbackScreen — Compose composables matching iOS visual + behavioral parity; `LSAuthProviderButton` Android impl | kotlin-implementer | 360 min |
| AUTH-S03-T11 | Real-device XCUITest E2E gate — codify the automated iOS email/password auth path as native XCTest result artifacts with screenshots and xcodebuild logs for non-sandbox auth + Convex restore evidence | swift-implementer | 240 min |

**Next Sprint Tasks:**

Generated by /kb-sprint-tasks-plan on 2026-04-28

- [AUTH-S03-T01-backend-users-query.md](./tasks/sprint-03-auth-convex-foundation/AUTH-S03-T01-backend-users-query.md)
- [AUTH-S03-T02-type-gen-pipeline.md](./tasks/sprint-03-auth-convex-foundation/AUTH-S03-T02-type-gen-pipeline.md)
- [AUTH-S03-T03-ios-convex-client.md](./tasks/sprint-03-auth-convex-foundation/AUTH-S03-T03-ios-convex-client.md)
- [AUTH-S03-T04-android-convex-client.md](./tasks/sprint-03-auth-convex-foundation/AUTH-S03-T04-android-convex-client.md)
- [AUTH-S03-T05-ios-clerk-auth.md](./tasks/sprint-03-auth-convex-foundation/AUTH-S03-T05-ios-clerk-auth.md)
- [AUTH-S03-T06-android-auth-repository.md](./tasks/sprint-03-auth-convex-foundation/AUTH-S03-T06-android-auth-repository.md)
- [AUTH-S03-T07-ios-rootview-auth-gate.md](./tasks/sprint-03-auth-convex-foundation/AUTH-S03-T07-ios-rootview-auth-gate.md)
- [AUTH-S03-T08-android-mainactivity-shell.md](./tasks/sprint-03-auth-convex-foundation/AUTH-S03-T08-android-mainactivity-shell.md)
- [AUTH-S03-T09-ios-auth-screens.md](./tasks/sprint-03-auth-convex-foundation/AUTH-S03-T09-ios-auth-screens.md)
- [AUTH-S03-T10-android-auth-screens.md](./tasks/sprint-03-auth-convex-foundation/AUTH-S03-T10-android-auth-screens.md)
- [AUTH-S03-T11-real-device-wda-e2e.md](./tasks/sprint-03-auth-convex-foundation/AUTH-S03-T11-real-device-wda-e2e.md)

#### Dependencies

- Blocks: Sprint 04
- Dependent on: Sprint 02

#### PRD Coverage

- UC-AUTH-01, UC-AUTH-02, UC-AUTH-03, UC-AUTH-04
- UC-APP-02 (auth-gate routing portion)
- `architecture/ios-architecture.md` § 1-2, `architecture/android-architecture.md` § App entry + Auth, `architecture/ui-design.md` § Sign-in / Sign-up / OAuth screens

#### Remediation Plan

Generated by /kb-sprint-tasks-plan on 2026-04-30 after Sprint 03 review feedback:

- iOS tests were render-only/support-only and did not perform the human testing steps.
- Native auth UI did not match `.spec/design/system/views/auth-screen/auth-screen.html`.
- Missing auth primitives and Clerk/Convex login proof block Sprint 04.

Execute this folder before Sprint 04:

- [sprint-03-auth-design-e2e-remediation/SPRINT.md](./tasks/sprint-03-auth-design-e2e-remediation/SPRINT.md)

---

### Sprint 04: Conversational Planning Loop

**Sequence:** 4
**Timeline:** Phase 2 · Week 4
**Status:** In Progress (task expansion 2026-05-01)

#### Human Testing Gate

**Gate:** A rider can tap a suggestion chip on IdleScreen, watch the Navigator agent stream a real route plan through the PlanningScreen phase indicator, see three live polylines (best/alt1/alt2) materialize on RouteResultsScreen with weather data from `route_enrichments`, tap a route card to view full details on RouteDetailsScreen, refine via chat (reusing the same session), or cancel the in-flight plan.

**Test Steps:**
1. From IdleScreen, tap a suggestion chip ("Plan a scenic 2-hour ride") and confirm the screen transitions to PlanningScreen with the optimistic message immediately visible (temp ID) and reconciled to the server `_id` within ~500ms
2. Watch the LSPhaseIndicator pulse through phases (parsing → searching → drafting → enriching → finalizing) driven by real `db.sessionMessages.list` status updates streaming from Convex
3. After ~30s, see RouteResultsScreen render with three real polylines (best/alt1/alt2 colors) on the LSMap and three `LSRouteAttachmentCard` molecules in the LSNavigatorMessage callout, sourced from `db.routePlans.getPlanById` for the completed plan
4. Tap the BEST route card → confirm the screen transitions to RouteDetailsScreen with the LSRouteSheet showing real distance/duration/elevation/scenic-score in LSInstrumentReadout and the 6-hour LSWeatherTimeline populated from `db.routeEnrichments.list`
5. Tap an alt route card on RouteResultsScreen → confirm `selectedRouteId` updates, the alt polyline promotes from dashed to solid, and the card border re-tints to the alt's color
6. Tap the cancel button mid-planning on PlanningScreen → confirm `db.routePlans.cancelPlan` mutation fires + UI returns to IdleScreen with the session preserved
7. From RouteResultsScreen, refine the plan via the chat input ("make it shorter, avoid Hwy 1") → confirm the session ID is reused (not a new session), the agent re-runs, and refined polylines replace the originals
8. Trigger a planning failure (e.g., agent timeout) → confirm the screen transitions to ErrorScreen with the typed `LaneShadowError` mapping to the right user-facing message and recovery chips populated from the suggestion list

#### Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| CHAT-S04-T01 | iOS `Services/RideFlow.swift` — `@Observable` reducer with pure `reduce(state, event) → state` function; states IDLE / PLANNING / ROUTE_RESULTS / ROUTE_DETAILS / SESSION_HISTORY / ERROR / NAVIGATION_EXPORT; `Services/ChatStore.swift` + `SessionStore.swift` | swift-implementer | 240 min |
| CHAT-S04-T02 | Android `services/RideFlowViewModel.kt` — sealed `RideFlowState` + `RideFlowAction` + pure `reduce()` ported 1:1 from RN `use-ride-flow.ts`; ChatViewModel with StateFlow bindings; `services/AppStateRepository.kt` for camera + last-viewed session via DataStore | kotlin-implementer | 240 min |
| CHAT-S04-T03 | iOS Idle + Planning real-data wiring — IdleScreen subscribes to `db.users.getCurrentUser` + `db.planningSessions.listSessions`; chat input dispatches `db.planningSessions.createSession` + `actions.agent.sendMessage.sendMessage`; PlanningScreen subscribes to `db.sessionMessages.list` + `db.routePlans.getActiveRoutePlansForSession`; phase indicator binds to message status | swift-implementer | 360 min |
| CHAT-S04-T04 | Android Idle + Planning real-data wiring — IdleViewModel + PlanningViewModel collecting Convex Flows; same subscriptions and mutations as iOS, exposed via StateFlow; LSPhaseIndicator receives header string per active phase | kotlin-implementer | 360 min |
| CHAT-S04-T05 | iOS RouteResults real-data wiring — RouteResultsScreen subscribes to `db.routePlans.getPlanById`; renders 3 polylines from `plan.options[]` with variant colors; LSNavigatorMessage receives 3 attached LSRouteAttachmentCards; `onRouteCardTap` callback updates `selectedRouteId` (Gap H1-07 fix); Recall chip after dismiss | swift-implementer | 240 min |
| CHAT-S04-T06 | Android RouteResults real-data wiring — RouteResultsViewModel + alt-selection mutator; Recall chip on dismiss | kotlin-implementer | 240 min |
| CHAT-S04-T07 | iOS RouteDetails real-data wiring — bound to selected route option; subscribe to `db.routeEnrichments.list` for weather; query `db.savedRoutes.getRouteIndexFingerprint` for already-saved state; SaveFavoriteSheet entry-point wiring | swift-implementer | 180 min |
| CHAT-S04-T08 | Android RouteDetails real-data wiring + enrichment + already-saved fingerprint check + SaveFavoriteSheet entry | kotlin-implementer | 180 min |
| CHAT-S04-T09 | Optimistic UI temp-ID reconciliation (both platforms) — append `PendingMessage` with `temp-{timestamp}` ID locally; reconcile on first reactive emission carrying matching `(sessionId, content, role, timestamp)` proximity; cancel button → `cancelPlan` mutation; both screens show pending vs streaming vs complete states | swift-implementer + kotlin-implementer | 240 min |
| CHAT-S04-T10 | LaneShadowError typed error mapping (both platforms) — Swift `enum LaneShadowError` + Kotlin `sealed class LaneShadowError` mirroring RN `lib/convex-error.ts` 1:1; map server error codes (SESSION_NOT_FOUND, RATE_LIMIT_EXCEEDED, PLAN_LIMIT_EXCEEDED, AGENT_TIMEOUT, UNAUTHENTICATED, etc.) to user-facing copy; UNAUTHENTICATED triggers `signOutFlow()`; integrate with ErrorScreen recovery | swift-implementer + kotlin-implementer | 180 min |

**Next Sprint Tasks:**

Generated by /kb-sprint-tasks-plan on 2026-05-01. Tasks T09 and T10 were split into platform-specific files (T09a/T09b, T10a/T10b) per RULES.md "Platform ownership rule for sprint execution" — yielding 12 task files total.

- [CHAT-S04-T01-ios-rideflow-reducer.md](./tasks/sprint-04-conversational-planning-loop/CHAT-S04-T01-ios-rideflow-reducer.md) (swift-implementer, 240 min)
- [CHAT-S04-T02-android-rideflow-viewmodel.md](./tasks/sprint-04-conversational-planning-loop/CHAT-S04-T02-android-rideflow-viewmodel.md) (kotlin-implementer, 240 min)
- [CHAT-S04-T03-ios-idle-planning-wiring.md](./tasks/sprint-04-conversational-planning-loop/CHAT-S04-T03-ios-idle-planning-wiring.md) (swift-implementer, 360 min)
- [CHAT-S04-T04-android-idle-planning-wiring.md](./tasks/sprint-04-conversational-planning-loop/CHAT-S04-T04-android-idle-planning-wiring.md) (kotlin-implementer, 360 min)
- [CHAT-S04-T05-ios-route-results-wiring.md](./tasks/sprint-04-conversational-planning-loop/CHAT-S04-T05-ios-route-results-wiring.md) (swift-implementer, 240 min)
- [CHAT-S04-T06-android-route-results-wiring.md](./tasks/sprint-04-conversational-planning-loop/CHAT-S04-T06-android-route-results-wiring.md) (kotlin-implementer, 240 min)
- [CHAT-S04-T07-ios-route-details-wiring.md](./tasks/sprint-04-conversational-planning-loop/CHAT-S04-T07-ios-route-details-wiring.md) (swift-implementer, 180 min)
- [CHAT-S04-T08-android-route-details-wiring.md](./tasks/sprint-04-conversational-planning-loop/CHAT-S04-T08-android-route-details-wiring.md) (kotlin-implementer, 180 min)
- [CHAT-S04-T09a-ios-optimistic-ui-cancel.md](./tasks/sprint-04-conversational-planning-loop/CHAT-S04-T09a-ios-optimistic-ui-cancel.md) (swift-implementer, 240 min)
- [CHAT-S04-T09b-android-optimistic-ui-cancel.md](./tasks/sprint-04-conversational-planning-loop/CHAT-S04-T09b-android-optimistic-ui-cancel.md) (kotlin-implementer, 240 min)
- [CHAT-S04-T10a-ios-laneshadow-error.md](./tasks/sprint-04-conversational-planning-loop/CHAT-S04-T10a-ios-laneshadow-error.md) (swift-implementer, 180 min)
- [CHAT-S04-T10b-android-laneshadow-error.md](./tasks/sprint-04-conversational-planning-loop/CHAT-S04-T10b-android-laneshadow-error.md) (kotlin-implementer, 180 min)

#### Dependencies

- Blocks: Sprint 05
- Dependent on: Sprint 03

#### PRD Coverage

- UC-CHAT-01, UC-CHAT-02, UC-CHAT-03, UC-CHAT-04, UC-CHAT-06 (error mapping side)
- `architecture/ios-architecture.md` § 3-5, `architecture/android-architecture.md` § State + Convex wrapper, `11-technical-requirements.md` § State Machine + Reactivity Patterns + Error Handling

---

### Sprint 05: Design Review Pipeline

**Sequence:** 5
**Timeline:** Phase 2 · Week 5
**Status:** In Progress (auth-only rescope 2026-05-04)

#### Human Testing Gate

**Gate:** A reviewer can run `pnpm design:review --screens auth-screen` to drive iOS XCUITest captures of every reachable auth-screen state, evaluate them against rendered design-system references via a Claude Sonnet 4.6 vision LLM, and receive a structured fix-oriented JSON report of per-component issues — with observed/expected token deltas, severity, confidence, bounding-box, and `code_search_hint`.

#### Test Steps

1. Verify Phase 0 cleanup: confirm snapshot tests + parity infra removed; `pnpm type-check:native` and `xcodebuild build` pass; sandbox catalog UI preserved
2. Run `pnpm design:references` and confirm 6 auth-screen PNGs + 6 annotations.json files in `.spec/design/system/refs/auth-screen/` (email-entry, existing-user-sign-in, new-user-create-account, default.dark, invalid-email-error, submitting-loading)
3. Run `pnpm design:review --screens auth-screen` and confirm the pipeline runs end-to-end (capture → export → manifest → eval → report)
4. Inspect `.design-review/report.json` and confirm it has a flat `issues[]` array with all article §5 fields, plus a `summary` block with per-severity counts and screens_passed/failed
5. Open `.design-review/report.html` and confirm side-by-side reference vs captured layout for auth-screen states with severity-color-coded issue lists
6. Inject a deliberate spacing regression on iOS AuthScreen (replace one `--space-4` token usage with hardcoded `12.0` padding); re-run `pnpm design:review --screens auth-screen`; confirm the eval flags the spacing issue with severity ≥ med and a `fix_hint` mentioning token replacement; revert the regression and confirm zero med+ issues

#### Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| FID-S05-T01 | Phase 0 cleanup — remove `ios/LaneShadowTests/Sandbox/StorySnapshotTests.swift`, `android/.../AllStoriesSnapshotTest.kt` (+ `SandboxSnapshotTestBase.kt` if unused), `tokens/sandbox/snapshots.parity.json`, `tokens/sandbox/parity-thresholds.json`, `tokens/sandbox/parity-exemptions.json` (if exists), `scripts/snapshots/` directory, all `snapshots:*` package.json scripts, lefthook pre-push parity entries; mark parity gate deferred in `RULES.md` (preserve canonical-id naming spec); verify dev/build still pass on both platforms; sandbox catalog UI (LaneShadowStories, LaneShadowSandboxEntry) preserved | swift-implementer + kotlin-implementer | 120 min |
| FID-S05-T02 | Reference asset production — annotate `.spec/design/system/views/{view}/{view}.html` (×7) with `data-screen` / `data-state` / `data-theme` attributes per `<section>`; build `scripts/design-review/render-references.ts` (Chrome headless via `manifest.json:render.chrome_path`, viewport 390×844, per-section element-handle screenshot clipped to phone-frame) + `scripts/design-review/extract-annotations.ts` (DOM `getBoundingClientRect()` + `getComputedStyle()` resolved against `--*` tokens, enriched from per-view README Token Recipe table); produce ~84 PNGs + ~42 annotations.json under `.spec/design/system/refs/`; add `pnpm design:references` script | convex-implementer | 360 min |
| FID-S05-T03 | iOS XCUITest capture harness — `ios/LaneShadowUITests/DesignReview/DesignReviewHelpers.swift` (XCUIScreen capture helper per article §2.1: tagged XCTAttachment with `keepAlways` lifetime) + `DesignReviewCaptureTests.swift` (~42 test methods, one per (screen, state) — auth/idle/planning/route-results/route-details/sessions/error); reuse real Clerk auth pattern from `ios/LaneShadowUITests/AuthEmailPasswordE2ETests.swift` (`CLERK_TEST_EMAIL`/`CLERK_TEST_PASSWORD`); add `#if DEBUG` accessibility-driven theme override hook if no existing toggle exists; reuse `setupDeterminismEnvironment()` (animations off, frozen locale/timezone, mock providers); wrap in `pnpm design:capture` script invoking `xcodebuild test … -resultBundlePath build/xcresults/design-review.xcresult` | swift-implementer | 480 min |
| FID-S05-T04 | Screenshot export + manifest builder — `scripts/design-review/export-from-xcresult.ts` invokes `xcrun xcresulttool export …`, parses attachment names of form `{screen}.{state}.{action}`, resolves theme from `.xcresult` device metadata, writes `.design-review/captures/{screen}.{state}.{theme}.{png,json}` (article §2.1 metadata schema) + `build-manifest.ts` joins captures + references + annotations into `.design-review/manifest.json` (non-zero exit on missing pairings); add `.design-review/` and `build/xcresults/` to `.gitignore`; add `pnpm design:export` + `pnpm design:manifest` scripts | convex-implementer | 240 min |
| FID-S05-T05 | Vision LLM eval engine — `scripts/design-review/visual-eval.ts` (multimodal Anthropic API call per manifest entry; Claude Sonnet 4.6 model; image 1 = reference, image 2 = captured; system prompt = locked text in `prompts/visual-eval.md` per article §3.1; user content = annotations.json injected verbatim + screen/state/theme context; Zod schema validation per `schemas/visual-issue.zod.ts` with one-shot retry on schema failure); concurrency cap of 3 (env override `DESIGN_REVIEW_CONCURRENCY`); per-entry output at `.design-review/evals/visual/{id}.json`; add `pnpm design:eval` script | convex-implementer | 360 min |
| FID-S05-T06 | Calibration set + prompt tuning (article §4 — DO NOT SKIP) — author `.spec/design/calibration/golden-set.json` with 15 entries (8 passing + 5 single-issue regressions covering spacing/color/typography/overflow/missing + 2 multi-issue combinations, hand-labeled with `expected_issues`); build `scripts/design-review/calibrate.ts` computing precision/recall vs labels per round, refusing to "lock" prompt unless ≥85% on the 10-entry calibration set; iterate `prompts/visual-eval.md` (5–10 rounds, log to `.spec/design/calibration/rounds.md`); verify on 5-entry held-out test set (≤5pp drop); promote to `prompts/visual-eval.locked.md`; add `pnpm design:calibrate` script | convex-implementer | 480 min |
| FID-S05-T07 | Merge + report — `scripts/design-review/merge-report.ts` aggregates per-entry evals, filters by severity threshold (default `med`, env `DESIGN_REVIEW_SEVERITY`), enriches each issue with article §5 fields (`issue_id`, `fix_hint`, `design_token`, `code_search_hint` via curated `component-code-map.json`); produces `.design-review/report.json` (machine, full issue list) + `.design-review/report.html` (human, side-by-side reference vs captured per (screen, state, theme) with severity-color-coded issue list per article §8); add `pnpm design:report` script | convex-implementer | 240 min |
| FID-S05-T08 | Claude Code design-review skill (article §6) — author `~/.claude/skills/design-review/SKILL.md` with frontmatter description triggering on "run design review" / "check design fidelity" / "verify UI matches the design system"; input schema `{ screens?, severity_threshold?, dry_run? }`; skill orchestrates `pnpm design:review` one-shot pipeline (references → capture → export → manifest → eval → report) and parses `report.json` into the `{issues, summary}` schema (per-screen pass/fail breakdown); add `pnpm design:review` umbrella script with `--screens`, `--severity-threshold`, `--dry-run` flags | convex-implementer | 180 min |
| FID-S05-T09 | Re-eval loop (article §6 close-the-loop) — extend the `design-review` skill to accept narrowly-scoped `screens=[…]` for fix-then-re-eval after an agent applies fixes; persist iteration counter at `.design-review/iterations/{screen}.{state}.json` (`{iteration, before_score, current_score, max_iterations}`); cap at 3 iterations to prevent drift; emit `before_score` / `after_score` per issue; return `status: "max_iterations_reached"` when exceeded (refuse further runs without explicit override) | convex-implementer | 120 min |
| FID-S05-T10 | End-to-end smoke test + documentation + scope flag — execute the verification protocol from the plan (Phase 7 smoke test: inject deliberate `var(--space-4)` → `12.0` regression on iOS AuthScreen, run `pnpm design:review --screens auth-screen`, confirm flag with severity ≥ med + token-level `fix_hint`, revert, re-run zero issues); document the pipeline in `docs/REAL_DEVICE_E2E.md` "Design Review Capture Pipeline" subsection (referencing this plan and `~/.claude/plans/plan-a-design-review-logical-clock.md`); capture sample `report.html` artifact for posterity; flag the screens not yet reachable via real flows on insertion date — **sessions-screen** + **saved-routes** states require Sprint 06 wiring; **map/offline** + **error-screen recovered/offline** states require Sprint 07 wiring — for follow-up coverage in those sprints | qa-engineer | 120 min |

**Next Sprint Tasks:**

Generated by /kb-sprint-tasks-plan on 2026-05-04 using convex-planner (×9 tasks) + swift-planner (×1 task — T03 iOS XCUITest harness) invoked in parallel. Avg quality 94/115.

- [FID-S05-T01-phase-0-cleanup.md](./tasks/sprint-05-design-review-pipeline/FID-S05-T01-phase-0-cleanup.md) (swift-implementer + kotlin-implementer, 120 min, INFRA)
- [FID-S05-T02-reference-asset-production.md](./tasks/sprint-05-design-review-pipeline/FID-S05-T02-reference-asset-production.md) (convex-implementer, 360 min)
- [FID-S05-T03-ios-xcuitest-capture-harness.md](./tasks/sprint-05-design-review-pipeline/FID-S05-T03-ios-xcuitest-capture-harness.md) (swift-implementer, 480 min)
- [FID-S05-T04-screenshot-export-and-manifest.md](./tasks/sprint-05-design-review-pipeline/FID-S05-T04-screenshot-export-and-manifest.md) (convex-implementer, 240 min)
- [FID-S05-T05-vision-llm-eval-engine.md](./tasks/sprint-05-design-review-pipeline/FID-S05-T05-vision-llm-eval-engine.md) (convex-implementer, 360 min)
- [FID-S05-T06-calibration-set-and-prompt-tuning.md](./tasks/sprint-05-design-review-pipeline/FID-S05-T06-calibration-set-and-prompt-tuning.md) (convex-implementer, 480 min)
- [FID-S05-T07-merge-and-report.md](./tasks/sprint-05-design-review-pipeline/FID-S05-T07-merge-and-report.md) (convex-implementer, 240 min)
- [FID-S05-T08-design-review-skill.md](./tasks/sprint-05-design-review-pipeline/FID-S05-T08-design-review-skill.md) (convex-implementer, 180 min)
- [FID-S05-T09-re-eval-loop.md](./tasks/sprint-05-design-review-pipeline/FID-S05-T09-re-eval-loop.md) (convex-implementer, 120 min)
- [FID-S05-T10-smoke-test-and-docs.md](./tasks/sprint-05-design-review-pipeline/FID-S05-T10-smoke-test-and-docs.md) (qa-engineer, 120 min, INFRA)

#### Dependencies

- Blocks: Sprint 06
- Dependent on: Sprint 04

#### PRD Coverage

- UC-FID-01 (automated audit subset — pipeline that supersedes `pnpm snapshots:check` + `pnpm snapshots:parity-report` for design fidelity verification)
- `~/.claude/plans/plan-a-design-review-logical-clock.md` (the approved pipeline plan — context, phases, schemas, verification)
- Strategy article: `https://acrobatic-echidna-253.convex.site/article/ec83f182-3599-482a-88c5-b5e76ce28e51` (XCUITest → vision LLM eval → fix-oriented JSON → skill agent → re-eval loop)
- `.spec/design/system/manifest.json` + per-view README.md files (×7) — visual ground-truth + token recipes
- `RULES.md` "Cross-Platform Component Parity" section — parity-rule deferral source-of-truth

#### Per-Task Design Files

| Task | Design Reference |
|------|-----------------|
| FID-S05-T02 | [`.spec/design/system/views/auth-screen/auth-screen.html`](../../../.spec/design/system/views/auth-screen/auth-screen.html) (representative; references span all 7 views) |
| FID-S05-T03 | [`.spec/design/system/manifest.json`](../../../.spec/design/system/manifest.json) (state inventory drives test method enumeration) |
| FID-S05-T05 | [`.spec/design/system/views/auth-screen/README.md`](../../../.spec/design/system/views/auth-screen/README.md) (Token Recipe table format used for all 7 views) |

#### Notes

- **Sandbox catalog UI is preserved** — only the snapshot tests + parity manifest infrastructure are removed. `LaneShadowStories.all` (iOS) and `LaneShadowSandboxEntry.getAllStories()` (Android) remain load-bearing for dev exploration.
- **Coverage caveat at insertion (updated 2026-05-04)** — Sprint 05 is rescoped to auth-screen-only pipeline validation. Other views (idle-screen, planning-screen, route-results-screen, route-details-screen, sessions-screen) will be added incrementally as their corresponding app code ships in Sprints 06–10. T09 (re-eval loop) is descoped from Sprint 05 and deferred to post-Sprint-05.
- **Behavioral axis deferred** — only the visual fidelity axis (article §3.1) is in scope for v0. Behavioral correctness (article §3.2) — text LLM eval against per-screen SHALL/SHALL NOT requirements with action_log capture — is a follow-up plan once the visual loop is calibrated.
- **Android replacement deferred** — sandbox snapshot tests are removed on both platforms in T01, but the design-review pipeline ships iOS-only for v0; Android equivalent (instrumented tests + `UiDevice.takeScreenshot()` or Compose `captureToImage()`) is a follow-up plan if Android design review becomes a priority.

---

### Sprint 06: Map View — Idle State

**Sequence:** 6
**Status:** In Progress (T01–T10 Done 2026-05-04; T11 Sprint Gate carry-forward post-S07 component retrofit; IDLE-SYNC-iOS / IDLE-SYNC-Android / IDLE-SYNC-Pipeline / CHIP-T03 active 2026-05-13; sprint folder: [`tasks/sprint-06-idlescreen/`](./tasks/sprint-06-idlescreen/SPRINT.md))
**Design Reference:** [`.spec/design/system/views/idle-screen/README.md`](../../design/system/views/idle-screen/README.md) · [`idle-screen.html`](../../design/system/views/idle-screen/idle-screen.html) (updated 2026-05-06)

#### Next Sprint Tasks

Generated by /kb-sprint-tasks-plan on 2026-05-04T14:30:00-07:00

- IDLE-S06-CVX-T01-mapbox-reverse-geocode-and-favorites-query.md
- IDLE-S06-CVX-T02-weather-proxy-action.md
- IDLE-S06-IOS-T01-idle-viewmodel-evolution.md
- IDLE-S06-IOS-T02-real-mapbox-warm-paper-and-favorite-pins.md
- IDLE-S06-IOS-T03-location-service-and-chat-input-active.md
- IDLE-S06-IOS-T04-design-review-capture-tests-7-variants.md
- IDLE-S06-AND-T01-idle-viewmodel-parity.md
- IDLE-S06-AND-T02-mapbox-warm-paper-and-favorite-pins.md
- IDLE-S06-AND-T03-location-service-and-chat-input-active.md
- IDLE-S06-AND-T04-instrumented-test-real-data-wiring.md
- IDLE-S06-T11-sprint-gate.md

#### Human Testing Gate

**Gate:** A signed-in rider on iOS + Android can open the app cold and arrive on a real IdleScreen — full-screen Mapbox warm-paper map, real Newsreader greeting interpolating their first name and current day/temperature, real LSChatInput with location pill + suggestion chips + filter button, real LSTopBar — that matches the `idle-screen` design references via `pnpm design:review --screens idle-screen` with **zero `high`-severity issues** across every reachable variant.

**Test Steps:**
1. Sign in via real Clerk auth on iOS Simulator + Android Emulator and confirm cold-start lands on IdleScreen with the greeting headline reading "Where are we riding *today*, {firstName}?" in Newsreader opinion-xl italic
2. Confirm the meta row renders the rider's local day + temperature + condition (e.g., "FRIDAY · 68°F · CLEAR") in copper signal color and the underlying canvas shows a real Mapbox warm-paper tile layer (not a LinearGradient placeholder)
3. Confirm saved-favorite locations appear as copper pin dots and the location pill resolves "Near {city}, {state}" from real CoreLocation / FusedLocationProvider data; toggle MANUAL mode and confirm the tag pill flips to MANUAL with copper tint
4. Tap a suggestion chip and confirm the chat input bar shifts to `is-active`, the filter button swaps to a copper send button, and the placeholder text fills with the chip's primer phrase (the actual planning loop is out-of-scope this sprint — a placeholder transition is acceptable)
5. Toggle dark mode; confirm the greeting rewrites to "tonight" via `Greeting.scope`, all tokens re-resolve on warm-dark ink substrate, and pin dots / glass chips re-tint correctly
6. Run `pnpm design:review --screens idle-screen` against this build on iOS Simulator; confirm zero `high`-severity issues across all variants (S01 default light, S02 typing/send, S03 default dark, S04 filter sheet, V01 no-location, V02 first-ride, V03 weather-advisory)
7. Walk through the variant set on a real iPhone via `xcodebuild test … DesignReviewCaptureTests` and confirm motion (greeting fade, suggestion-chip primed scale, filter-sheet open) matches the design reference; record xcresult artifacts as gate evidence

#### Design Review Gate

Sprint 06 MUST expand the design-review pipeline to cover `idle-screen`. Required deliverables:

1. **Reference assets** — `.spec/design/system/views/idle-screen/` must contain PNGs + annotations for all 7 idle-screen variants (S01 default light, S02 typing/send, S03 default dark, S04 filter sheet, V01 no-location, V02 first-ride, V03 weather-advisory). Run `pnpm design:references` to generate.
2. **XCUITest capture tests** — add `DesignReviewCaptureTests` test methods for every `(idle-screen, state, theme)` tuple. These drive `xcodebuild test` to capture live screenshots against the iOS Simulator build.
3. **Pipeline pass** — `pnpm design:review --screens idle-screen` must produce a report with **zero `high`-severity issues** before the human testing gate can pass. Include the report as gate evidence.
4. **Coverage expansion** — after Sprint 06, `pnpm design:review --screens auth-screen,idle-screen` must work end-to-end, with both views appearing in `report.json` and `report.html`.

The planner MUST include explicit tasks for items 1–3 in the Sprint 06 task table. These are not optional — they are gate blockers. See `RULES.md` §"Design Review Pipeline — View Snapshot Testing" for the full planner contract.

#### Scope

This sprint integrates **only the idle state of the map view.** The suggestion-chip → planning transition may stub to a placeholder (live planning loop is exercised in Sprint 08). Saved-routes browsing, Settings, Sessions drawer, Offline Regions, and Error recovery are **explicitly out of scope** (deferred to post-Sprint-11 follow-on plans — see ICEBOX). The hamburger menu may open a placeholder sheet.

**Carry-forward note (2026-05-13):** The 2026-05-06 design-system update (new `LSContextCapsule` + `LSMapControls`, Container Principle) shipped as a separate component-delivery sprint (Sprint 07). The Sprint 06 design:review re-baseline and Android pipeline integration carry forward into IDLE-SYNC-iOS / IDLE-SYNC-Android / IDLE-SYNC-Pipeline / CHIP-T03 — tracked on the active task list, not in the original Sprint 06 task table.

#### Dependencies

- Blocks: Sprint 07 (component-delivery retrofits this sprint's idle surface) → Sprint 08 (planning state reuses the same map host)
- Dependent on: Sprint 05 (design-review pipeline gates this and every subsequent view sprint)

#### PRD Coverage

- UC-CHAT-01 (suggestion-chip + chat-input affordances on IdleScreen surface only)
- UC-MAP-01 (map render + favorite pins, IdleScreen surface only)
- UC-FID-01 (idle-screen subset — all 7 variants in design reference)
- `architecture/ios-architecture.md` § IdleScreen, `architecture/android-architecture.md` § IdleScreen wiring

---

### Sprint 07: Context Capsule, Map Controls + Autocomplete Carry-Forward

**Sequence:** 7
**Status:** Done (component delivery completed 2026-05-13; design/snapshot review tasks deleted from scope on 2026-05-07; sprint folder: [`tasks/sprint-07-context-capsule-map-controls/`](./tasks/sprint-07-context-capsule-map-controls/SPRINT.md))
**Design Reference:** Design-system update 2026-05-06 — [`mol-context-capsule`](../../design/system/molecules/context-capsule/context-capsule.html) (5 state variants) · [`org-map-controls`](../../design/system/organisms/map-controls/map-controls.html) · [`idle-screen.html`](../../design/system/views/idle-screen/idle-screen.html) (updated 2026-05-06)

#### Why this sprint exists (inserted post-2026-05-06)

On 2026-05-06 the design system shipped four coupled changes (the *map-view redesign*):

1. A new `mol-context-capsule` molecule that replaces the legacy floating greeting headline + standalone advisory card with a single state-driven glass container exposing five state variants (`--idle`, `--planning`, `--route`, `--warning`, `--saved`).
2. A new `org-map-controls` organism — a right-edge **vertically-centered** vertical workbar (zoom +/-, recenter, layers, save, mode-toggle) — codifying the React Native production controls into the design system, anchored at the midline of the map canvas (NOT under the topbar).
3. A new "Container Principle" rule: every textual UI element overlapping the map must sit in a token-driven glass container. No "floating" typography directly on the map.
4. A Mapbox-styled SVG vocabulary (water polygons, parks, streets, neighborhood labels) painted on every view's design reference, replacing the prior topo-curves-only mock.

Sprint 06 production was implemented against the **prior** design contract, so as of 2026-05-06 the captures no longer matched the design references. Sprint 07 closes the implementation gap by shipping the new components on iOS + Android, retrofitting the idle state, fixing iOS layer/map-token regressions found during gate work, and carrying forward autocomplete evidence. The Sprint 06 map host (`LSMapView` / `LSMapHost`) is reused as-is; this sprint only adds new components and updates the idle-state overlay surface.

The original strict design-review + snapshot tasks were deleted from this sprint's scope on 2026-05-07 and are tracked as Sprint 06 carry-forward (IDLE-SYNC-iOS, IDLE-SYNC-Android, IDLE-SYNC-Pipeline, CHIP-T03) rather than gating Sprint 07 closure.

#### Human Testing Gate

**Gate:** A signed-in rider on iOS + Android opens the app cold and arrives at the idle state of the map view, where (a) the new `LSContextCapsule` glass container sits centered below the topbar showing the `--idle` state with greeting headline + meta row, (b) the new `LSMapControls` workbar sits at the **vertical middle of the right edge** of the map canvas with zoom cluster + recenter + layers + chat-mode toggle chips, (c) the legacy floating greeting headline and standalone advisory card are gone, and (d) the carried-forward autocomplete flow shows at most 3 place recommendations and does not enter planning/routing until Send.

**Test Steps:**
1. Sign in via real Clerk auth on iOS Simulator + Android Emulator; confirm cold-start lands on the idle state of the map view with the new `LSContextCapsule` centered below the topbar — NOT the legacy `t-opinion-xl` floating Newsreader headline
2. Confirm the capsule shows "Where are we riding *today*, {firstName}?" in `t-opinion-md` Newsreader (italic em on the time-of-day scope-word, copper signal color) with a meta dot row below in `t-label-sm` showing `{Day} · {Temp} · {Condition}`
3. Confirm the new `LSMapControls` workbar is at the **vertical middle of the right edge** showing (top to bottom): zoom +/- cluster, recenter chip, layers chip, and chat-mode toggle chip — each 40×40pt with `var(--space-2)` gaps
4. Toggle dark mode; confirm both `LSContextCapsule` and `LSMapControls` re-resolve to dark glass with no shape changes; scope-word swaps "today" → "tonight"
5. Trigger the weather-advisory variant (V03); confirm the capsule applies `--warning` modifier with `--status-warning` meta-row tint and the legacy standalone advisory card is no longer present
6. Tap a suggestion chip; confirm the chat input transitions to `is-active` and the capsule remains in `--idle` state (it does NOT switch to `--planning` until Sprint 08 wires the planning loop)
7. Type `Big Sur` in the redesigned idle input; confirm at most 3 Mapbox place recommendations, selection fills the input, and the app does not enter planning/routing until explicit Send

#### Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| CAPS-S07-T01 | iOS LSContextCapsule molecule (5 state variants, glass surface, sandbox stories) | swift-implementer | 240 min |
| CAPS-S07-T02 | Android LSContextCapsule molecule (Compose parity, sandbox stories) | kotlin-implementer | 240 min |
| CAPS-S07-T03 | iOS LSMapControls organism (vertical workbar, sandbox stories) | swift-implementer | 180 min |
| CAPS-S07-T04 | Android LSMapControls organism (Compose parity, sandbox stories) | kotlin-implementer | 180 min |
| CAPS-S07-T05 | iOS IdleScreen retrofit (replace legacy greeting + advisory) | swift-implementer | 180 min |
| CAPS-S07-T06 | Android IdleScreen retrofit (Compose parity) | kotlin-implementer | 180 min |
| CAPS-S07-T10 | Mapbox Search Box autocomplete backend contract carry-forward | convex-implementer | 0 min (done) |
| CAPS-S07-T11 | iOS idle autocomplete carry-forward | swift-implementer | 60 min |
| CAPS-S07-T12 | Android idle autocomplete carry-forward | kotlin-implementer | 60 min |
| CAPS-S07-T13 | Autocomplete gate — evidence archival | qa-engineer | 120 min |
| CAPS-S07-T14 | iOS LSMapLayer overlay-slot positioning fix | swift-implementer | 60 min |
| CAPS-S07-T15 | iOS Mapbox tile rendering fix | swift-implementer | 45 min |
| CAPS-S07-T16 | Android LSMapLayer parity audit | kotlin-implementer | 30 min |

#### Scope

This sprint delivers **components + idle-state retrofit only.** Per-state live-data wiring (planning, route-results, details, sessions) happens in downstream sprints; this sprint adds new components and updates the idle overlay surface. Re-implementing the map host is an anti-pattern.

The strict `pnpm design:review --screens idle-screen` re-baseline and snapshot re-validation were deliberately removed from this sprint's gate on 2026-05-07 and carry forward into Sprint 06 IDLE-SYNC-* tasks.

#### Dependencies

- Blocks: Sprint 08 (PlanningScreen reuses `LSContextCapsule(--planning)` and `LSMapControls`); blocks Sprints 09–11 (every downstream view sprint reuses these components)
- Dependent on: Sprint 06 (idle state baseline + map host)

#### PRD Coverage

- UC-FID-01 (idle-screen subset — re-validation against the 2026-05-06 redesigned design references)
- UC-MAP-01 (right-edge map controls codified)
- UC-CHAT-01 (autocomplete proximity-gating carry-forward)
- New design-system components: `mol-context-capsule`, `org-map-controls`; Container Principle rule

---

### Sprint 08: Map View — Planning State

**Sequence:** 8
**Status:** In Progress (planning expanded 2026-05-07; remediation tasks added 2026-05-08; STUB-FIX wave landed 2026-05-13; sprint folder: [`tasks/sprint-08-planning-state/`](./tasks/sprint-08-planning-state/SPRINT.md))
**Design Reference:** [`.spec/design/system/views/planning-screen/README.md`](../../design/system/views/planning-screen/README.md) · [`planning-screen.html`](../../design/system/views/planning-screen/planning-screen.html)

#### Human Testing Gate

**Gate:** From IdleScreen, a rider can tap a suggestion chip (or send a typed prompt) and arrive on a real PlanningScreen — copper sketch-polyline animating at the deliberate 1400ms linear loop, real LSPhaseIndicator pulsing through the five-step pipeline driven by `db.sessionMessages.list`, locked chat input with copper spinner, working back/cancel — that matches the `planning-screen` design references via `pnpm design:review --screens planning-screen` with **zero `high`-severity issues** across every reachable variant.

**Test Steps:**
1. From IdleScreen, tap a suggestion chip ("Plan a scenic 2-hour ride") and confirm the screen transitions to PlanningScreen with the optimistic message immediately visible (temp ID) and reconciled to the server `_id` within ~500ms
2. Watch the LSPhaseIndicator pulse through phases (parsing → searching → drafting → enriching → finalizing) driven by real Convex `sessionMessages` status updates; confirm the active step has a pulsing copper ring, prior steps render as done, and future steps are pending
3. Confirm the copper sketch polyline animates continuously at 1400ms linear loop with the leading head dot breathing synchronously at 1400ms ease-in-out (matches design reference motion recipe — exact, not 600ms rushed)
4. Confirm the chat input bar is locked: rider's prompt text visible, typing disabled, leading icon dimmed, send button replaced by a copper spinner; back button is the only exit affordance
5. Tap back; confirm the cancel-confirm sheet opens; confirm "Cancel ride" → `db.routePlans.cancelPlan` mutation fires + UI returns to IdleScreen with the session preserved
6. Run `pnpm design:review --screens planning-screen`; confirm zero `high`-severity issues across all variants (S01 Scouting Light, S02 Drawing Light, S03 Weather Light, S04 Scoring Dark, V01 Slow Planning, V02 Cancel Prompt, V03 Single Candidate)
7. Real-iPhone XCUITest capture confirms motion timing on hardware (sketch loop, phase pulse, cancel-confirm slide-up); record xcresult artifacts

#### Design Review Gate

Sprint 08 MUST expand the design-review pipeline to cover `planning-screen`. Required deliverables:

1. **Reference assets** — `.spec/design/system/views/planning-screen/` must contain PNGs + annotations for all 7 planning-screen variants (S01 Scouting Light, S02 Drawing Light, S03 Weather Light, S04 Scoring Dark, V01 Slow Planning, V02 Cancel Prompt, V03 Single Candidate). Run `pnpm design:references` to generate.
2. **XCUITest capture tests** — add `DesignReviewCaptureTests` test methods for every `(planning-screen, state, theme)` tuple.
3. **Pipeline pass** — `pnpm design:review --screens planning-screen` must produce a report with **zero `high`-severity issues** before the human testing gate can pass.
4. **Coverage expansion** — after Sprint 08, `pnpm design:review --screens auth-screen,idle-screen,planning-screen` must work end-to-end.

The planner MUST include explicit tasks for items 1–3 in the Sprint 08 task table. These are gate blockers. See `RULES.md` §"Design Review Pipeline — View Snapshot Testing" for the full planner contract.

#### Scope

This sprint integrates **only the planning state of the canonical map view** — *not* a standalone screen. The Sprint 06 map host + Sprint 07 `LSContextCapsule` and `LSMapControls` are reused as-is; this sprint only swaps capsule state to `--planning`, adds the copper sketch polyline, drives `LSPhaseIndicator` from real `db.sessionMessages` updates, locks `LSChatInput`, and wires the cancel-confirm sheet. When planning completes, the screen may transition to a temporary placeholder; full RouteResults wiring lands in Sprint 09. RouteDetails, Sessions, and Settings remain out of scope.

#### Dependencies

- Blocks: Sprint 09
- Dependent on: Sprint 07 (`LSContextCapsule` + `LSMapControls` components required)

#### PRD Coverage

- UC-CHAT-01 (planning loop initiation from IdleScreen)
- UC-CHAT-02 (phase progression streaming)
- UC-CHAT-04 (cancel + cancel-confirm flow)
- UC-FID-01 (planning-screen subset — all 6 variants)
- `architecture/ios-architecture.md` § PlanningScreen, `architecture/android-architecture.md` § PlanningViewModel

---

### Sprint 09: RouteResultsScreen

**Sequence:** 9
**Status:** Planned
**Design Reference:** [`route-results-screen.html`](../../design/system/views/route-results-screen/route-results-screen.html) · [`README.md`](../../design/system/views/route-results-screen/README.md)

#### Human Testing Gate

**Gate:** When PlanningScreen completes (Sprint 08), the rider arrives on a real RouteResultsScreen — three live polylines (best/alt1/alt2) sourced from `db.routePlans.getPlanById`, pinned LSNavigatorMessage with three attached LSRouteAttachmentCard molecules, working alt-selection promotion, working chat-refine, working dismiss/recall — that matches the `route-results-screen` design references via `pnpm design:review --screens route-results-screen` with **zero `high`-severity issues** across every reachable variant.

**Test Steps:**
1. Run a real planning prompt end-to-end (IdleScreen → PlanningScreen → RouteResultsScreen) and confirm three real polylines render on the paper map with correct colors — best (copper, solid 3.5px), alt1 (sage, dashed), alt2 (slate, dashed)
2. Confirm the LSNavigatorMessage pins above the map with the Navigator's reasoning rendered in Newsreader opinion-md prose, plus three LSRouteAttachmentCard molecules attached (one per option), each showing real distance / time / scenic-score from the plan
3. Tap an alt route card; confirm `selectedRouteId` updates, the alt polyline promotes from dashed to solid, the previously-best route demotes to dashed, and the card border re-tints to the new selection's color
4. Refine via the chat input ("make it shorter, avoid Hwy 1"); confirm the same session ID is reused (not a fresh session), the agent re-runs through PlanningScreen, and refined polylines replace the originals on return
5. Dismiss the LSNavigatorMessage; confirm a copper Recall chip appears at the bottom of the canvas; tap Recall and confirm the message re-pins with the same content
6. Run `pnpm design:review --screens route-results-screen`; confirm zero `high`-severity issues across all variants (S01 default light, S02 alt-selected, S03 dark, S04 refining-scrim, V01 fewer-than-3, V02 single-candidate, V03 recall-chip)
7. Real-iPhone XCUITest capture confirms polyline rendering, message-pin motion, and recall-chip slide-in match the design reference; record xcresult artifacts

#### Design Review Gate

Sprint 09 MUST expand the design-review pipeline to cover `route-results-screen`. Required deliverables:

1. **Reference assets** — `.spec/design/system/views/route-results-screen/` must contain PNGs + annotations for all 7 route-results variants (S01 default light, S02 alt-selected, S03 dark, S04 refining-scrim, V01 fewer-than-3, V02 single-candidate, V03 recall-chip). Run `pnpm design:references` to generate.
2. **XCUITest capture tests** — add `DesignReviewCaptureTests` test methods for every `(route-results-screen, state, theme)` tuple.
3. **Pipeline pass** — `pnpm design:review --screens route-results-screen` must produce a report with **zero `high`-severity issues** before the human testing gate can pass.
4. **Coverage expansion** — after Sprint 09, `pnpm design:review --screens auth-screen,idle-screen,planning-screen,route-results-screen` must work end-to-end.

The planner MUST include explicit tasks for items 1–3 in the Sprint 09 task table. These are gate blockers. See `RULES.md` §"Design Review Pipeline — View Snapshot Testing" for the full planner contract.

#### Scope

This sprint integrates **only RouteResultsScreen.** Tapping the BEST card may transition to a temporary placeholder; full RouteDetails bottom sheet lands in Sprint 10. SaveFavoriteSheet entry, Sessions, and Settings remain out of scope.

#### Dependencies

- Blocks: Sprint 10
- Dependent on: Sprint 08

#### PRD Coverage

- UC-CHAT-03 (alt-selection, chat-refine on RouteResults)
- UC-ROUTE-05 (multi-option display)
- UC-FID-01 (route-results subset — all 7 variants)
- `architecture/ios-architecture.md` § RouteResultsScreen, `architecture/android-architecture.md` § RouteResultsViewModel

---

### Sprint 10: RouteDetails Bottom Sheet

**Sequence:** 10
**Status:** Planned
**Design Reference:** [`.spec/design/system/views/route-details-screen/README.md`](../../design/system/views/route-details-screen/README.md) · [`route-details-screen.html`](../../design/system/views/route-details-screen/route-details-screen.html)

#### Human Testing Gate

**Gate:** From RouteResultsScreen (Sprint 09), the rider can tap a route card and arrive on a real RouteDetailsScreen — single polyline framed against paper canvas, LSRouteSheet at large detent with copper "BEST FOR TODAY" badge, Newsreader-serif title, real 4-column LSInstrumentReadout (DIST / TIME / CLIMB / SCENIC), real 6-cell LSWeatherTimeline from `db.routeEnrichments.list`, sticky outline `Save` + copper primary `Ride this` action row — that matches the `route-details-screen` design references via `pnpm design:review --screens route-details-screen` with **zero `high`-severity issues** across every reachable variant.

**Test Steps:**
1. Tap the BEST card on RouteResultsScreen; confirm the screen transitions to RouteDetailsScreen with the map reduced to that single polyline (copper, solid 3.5px) and the LSRouteSheet anchored at large detent (~62% of phone frame)
2. Confirm the sheet renders the copper "BEST FOR TODAY" badge with copper drop-shadow glow, the Newsreader-serif route title, the via subtitle (e.g., "via Kings Mountain Rd · 47 mi"), and a 4-column instrument grid in JetBrains Mono with real values from the plan
3. Confirm the 6-cell weather timeline renders with condition-tinted cell backgrounds populated from real `db.routeEnrichments.list` data (clear / wind / rain / hot / night) and an italic Newsreader narration line below the grid
4. Drag the sheet to medium detent; confirm weather + narration collapse below the fold while header + instruments + action row stay visible; drag toward dismiss; confirm a copper stripe flashes on the sheet top edge near the dismiss threshold
5. Tap `Save`; confirm SaveFavoriteSheet opens (re-using the wiring from prior sprints); submit; confirm the toast slides in with copper check, the Save button flips to the saved-state variant (copper-tinted), and a "Saved" pill appears beside the best badge
6. Tap `Ride this`; confirm the action fires a placeholder/log (full ride session is post-V3); verify no regression in the rest of the sheet
7. Run `pnpm design:review --screens route-details-screen`; confirm zero `high`-severity issues across all variants (S01 default large light, S02 mixed-weather, S03 dark, S04 medium detent, S05 dismissing, V01 saved-state)
8. Real-iPhone XCUITest capture confirms polyline render, sheet-detent transitions, copper stripe flash, and saved-toast motion match the design reference

#### Design Review Gate

Sprint 10 MUST expand the design-review pipeline to cover `route-details-screen`. Required deliverables:

1. **Reference assets** — `.spec/design/system/views/route-details-screen/` must contain PNGs + annotations for all 6 route-details variants (S01 default large light, S02 mixed-weather, S03 dark, S04 medium detent, S05 dismissing, V01 saved-state). Run `pnpm design:references` to generate.
2. **XCUITest capture tests** — add `DesignReviewCaptureTests` test methods for every `(route-details-screen, state, theme)` tuple.
3. **Pipeline pass** — `pnpm design:review --screens route-details-screen` must produce a report with **zero `high`-severity issues** before the human testing gate can pass.
4. **Coverage expansion** — after Sprint 10, `pnpm design:review --screens auth-screen,idle-screen,planning-screen,route-results-screen,route-details-screen` must work end-to-end.

The planner MUST include explicit tasks for items 1–3 in the Sprint 10 task table. These are gate blockers. See `RULES.md` §"Design Review Pipeline — View Snapshot Testing" for the full planner contract.

#### Scope

This sprint integrates **only RouteDetails bottom sheet** plus the Save → SaveFavoriteSheet → toast roundtrip on this screen. Saved-routes browsing list, Settings, Sessions drawer, and Offline Regions remain **out of scope** (deferred — see ICEBOX).

#### Dependencies

- Blocks: Sprint 11
- Dependent on: Sprint 09

#### PRD Coverage

- UC-ROUTE-01 (save flow entry from RouteDetails)
- UC-ROUTE-05 (detail render)
- UC-CHAT-06 (per-route enrichments display)
- UC-FID-01 (route-details subset — all 6 variants)
- `architecture/ios-architecture.md` § RouteDetailsScreen, `architecture/android-architecture.md` § RouteDetailsViewModel

---

### Sprint 11: SessionsScreen

**Sequence:** 11
**Status:** Planned
**Design Reference:** [`sessions-screen.html`](../../design/system/views/sessions-screen/sessions-screen.html) · [`README.md`](../../design/system/views/sessions-screen/README.md)

#### Human Testing Gate

**Gate:** From any chat/route screen, the rider can tap the LSTopBar hamburger chip and slide open a real SessionsScreen drawer — left-anchored over a scrimmed paper map, active session marked with copper left-edge stripe + tinted row background, all sessions grouped by recency from `db.planningSessions.listSessions`, working tap-to-switch with camera restore, working `+ New session` — that matches the `sessions-screen` design references via `pnpm design:review --screens sessions-screen` with **zero `high`-severity issues** across every reachable variant.

**Test Steps:**
1. From IdleScreen / PlanningScreen / RouteResultsScreen / RouteDetailsScreen, tap the hamburger chip in LSTopBar; confirm the SessionsScreen drawer slides in from the left over a `--surface-scrim`-tinted backdrop map (the underlying screen remains partially visible behind the scrim)
2. Confirm the drawer shows the rider's "Rides" header in Newsreader opinion-lg italic and lists every session sourced from `db.planningSessions.listSessions`, grouped by recency (TONIGHT / TODAY / THIS WEEK / LAST WEEK / EARLIER)
3. Confirm the active session — the one whose context is loaded behind the drawer — carries a copper left-edge stripe (`--signal-default` via `--stroke-lg`) and a tinted row background (`--signal-whisper`), making it instantly identifiable
4. Tap a non-active session row; confirm `activeSessionId` switches, the app routes to that session's appropriate phase screen, and the camera position restores from the per-session cache (`cameraStore.cameraForSession(sessionId)` on iOS / DataStore on Android with `cameraMoveSource: .user | .programmatic` flag)
5. Tap `+ New session`; confirm the new-confirm dialog appears; confirm `db.planningSessions.createSession` fires and the drawer closes back to a fresh IdleScreen
6. Dismiss the drawer (tap scrim or swipe); confirm the backdrop screen returns fully revealed without re-loading state
7. Run `pnpm design:review --screens sessions-screen`; confirm zero `high`-severity issues across all variants (S01 default light, S02 dark, S03 empty-state, S04 long-list scrolled, S05 new-confirm dialog)
8. Real-iPhone XCUITest capture confirms drawer slide-in motion, scrim opacity, copper-stripe rendering, and new-confirm dialog match the design reference

#### Design Review Gate

Sprint 10 MUST expand the design-review pipeline to cover `sessions-screen`. Required deliverables:

1. **Reference assets** — `.spec/design/system/views/sessions-screen/` must contain PNGs + annotations for all 5 sessions variants (S01 default light, S02 dark, S03 empty-state, S04 long-list scrolled, S05 new-confirm dialog). Run `pnpm design:references` to generate.
2. **XCUITest capture tests** — add `DesignReviewCaptureTests` test methods for every `(sessions-screen, state, theme)` tuple.
3. **Pipeline pass** — `pnpm design:review --screens sessions-screen` must produce a report with **zero `high`-severity issues** before the human testing gate can pass.
4. **Coverage expansion** — after Sprint 11, `pnpm design:review --screens auth-screen,idle-screen,planning-screen,route-results-screen,route-details-screen,sessions-screen` must work end-to-end. At this point the pipeline covers **all six V3 views**.

The planner MUST include explicit tasks for items 1–3 in the Sprint 11 task table. These are gate blockers. See `RULES.md` §"Design Review Pipeline — View Snapshot Testing" for the full planner contract.

#### Scope

This sprint integrates **only the Sessions drawer + per-session camera-restore plumbing.** Saved-routes browsing list, Settings, Offline Regions, ErrorScreen recovery wiring, manual PlanRideSheet, and ship-gate hardening remain **explicitly deferred** to a post-V3 follow-on plan (see ICEBOX for the prior bundled scope).

#### Dependencies

- Blocks: Post-Sprint-11 follow-on plan (Saved Routes browsing, Settings, Offline Regions, Error Recovery, manual PlanRideSheet, ship-gate hardening — all deferred surfaces preserved at [`ROADMAP-ICEBOX.md`](./ROADMAP-ICEBOX.md))
- Dependent on: Sprint 10

#### PRD Coverage

- UC-SESS-01, UC-SESS-02, UC-SESS-03 (browse + switch + new-session creation)
- UC-FID-01 (sessions-screen subset — all 5 variants)
- `architecture/ios-architecture.md` § SessionsScreen + CameraStore, `architecture/android-architecture.md` § Sessions wiring + DataStore camera persistence

---

## Cut Authority Reminder

Per HUMAN SIGNAL #4 (`if cross platform testing is too burdensome then we might cut android`):

**Mechanical checkpoint** owned by product-manager (orchestrator):
- If at the start of any view sprint (06–10) the Android implementation isn't tracking on time relative to iOS, escalate to user with cut recommendation for that screen's Android pair.
- Cut layers (defined in `01-scope.md`):
  1. Drop Android snapshot parity tests + Android FID story registration (Sprint 02 T10 Android side) — *executed: parity tests removed in Sprint 05 T01 regardless of cut decision*
  2. Drop Android UI gap-fills for new screens (Sprint 03 + per-view sprints 06–10 Android tasks for new surfaces only — note: Sprint 05 design-review pipeline is iOS-only by design)
  3. Drop Android implementation entirely (all `*-android` and `kotlin-implementer` tasks Sprints 03+)

**iOS path always ships.** All FID work, integration UCs, and the design-review pipeline (Sprint 05) deliver on iOS regardless of Android cut layer. Android coverage in the design-review pipeline is an explicit follow-up plan (see Sprint 05 Notes).

## Roadmap Authoring Notes

- This roadmap was originally synthesized directly by the orchestrator (PRD author) on 2026-04-27 based on the v1.2.0 PRD and the user's explicit "UI-first sequencing" directive, without dispatching parallel implementation_planner / design_planner agents. The simplified path was chosen for efficiency given full PRD context.
- Updated 2026-05-04 (revision 1): **Sprint 05 (Design Review Pipeline)** inserted between the conversational planning loop (Sprint 04) and the saved-routes/sessions/settings work (then Sprint 06, now archived). Source of that sprint: `~/.claude/plans/plan-a-design-review-logical-clock.md` and the design-review strategy article. Folder `tasks/sprint-05-saved-routes-sessions-settings/` was renamed to `tasks/sprint-06-saved-routes-sessions-settings/`.
- Updated 2026-05-04 (revision 2): **Sprints 6+ reshaped to view-at-a-time.** The previously bundled Sprint 06 (Saved Routes / Sessions / Settings, 10 tasks across 4 surfaces) and Sprint 07 (Map / Offline / Error / Ship Gate, 10 tasks across 5 surfaces) were retired and replaced with five focused view-at-a-time sprints (06–10): IdleScreen → PlanningScreen → RouteResultsScreen → RouteDetails Bottom Sheet → SessionsScreen. Per user direction: *"each sprint is super overscoped, we need to slow down and take each map view one at a time."* The prior bundled scope is preserved at [`ROADMAP-ICEBOX.md`](./ROADMAP-ICEBOX.md). Saved-routes browsing list, Settings, Offline Regions, Error Recovery, manual PlanRideSheet, and ship-gate hardening are explicitly **deferred** to a post-Sprint-10 follow-on plan. Per-task tables for sprints 06–10 are intentionally **not** authored in this ROADMAP — they will expand JIT via `/kb-sprint-tasks-plan` when each sprint becomes active.
- Updated 2026-05-14 (revision 3 — this version): **Sprint 07 inserted between IdleScreen (Sprint 06) and PlanningScreen (now Sprint 08)** to deliver the new `mol-context-capsule` molecule + `org-map-controls` organism + autocomplete carry-forward (design-system update 2026-05-06). Downstream sprints shifted +1: PlanningScreen → Sprint 08, RouteResultsScreen → Sprint 09, RouteDetails → Sprint 10, SessionsScreen → Sprint 11. Total sprint count: 10 → 11. Sprint 06 status updated to reflect post-S07 IDLE-SYNC-* carry-forward (idle state re-baseline now tracked on the active task list, not in the Sprint 06 task table). Sprint 08 status updated to reflect active stub-fix wave (2026-05-08–05-13). Sprint 08 reuses `LSContextCapsule(--planning)` and `LSMapControls` rather than re-implementing the map host. No future-sprint scope was changed — only numbering. Folder `tasks/sprint-08-planning-state/` is already on disk under the new numbering; later view sprints (RouteResults, RouteDetails, Sessions) will be created JIT via `/kb-sprint-tasks-plan` at their new numbers (09–11). The earlier "5 view-at-a-time" framing is preserved; this revision adds one component-delivery sprint between the idle and planning states because every downstream view sprint reuses the capsule + controls.
- Task IDs follow the pattern `{GROUP}-S{NN}-T{NN}` for unambiguous referencing. The `kb-sprint-tasks-plan` skill expands each into per-task markdown files when the sprint becomes active.
- Per-platform paired tasks (iOS + Android) are kept separate per project RULES.md "Platform ownership rule for sprint execution" — `swift-*` agents own iOS implementation; `kotlin-*` agents own Android. The Sprint 05 design-review pipeline is iOS-only by user directive.

## Next Steps

```bash
# Sprint 08 (Map View — Planning State) is the actively executing sprint.
# Sprint 06 idle parity carry-forward (IDLE-SYNC-iOS / Android / Pipeline, CHIP-T03) runs in parallel.
/kb-run-sprint sprint-08-planning-state

# When Sprint 08 closes, expand Sprint 09 (RouteResultsScreen) JIT
/kb-sprint-tasks-plan .spec/prds/v3-integration/ROADMAP.md

# Re-plan after PRD edits (delta-replan preserves unchanged sprint sections)
/kb-sprint-plan .spec/prds/v3-integration/README.md --delta-replan
```
