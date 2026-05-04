---
roadmap: 1
project: LaneShadow Native Integration (V3)
generated: 2026-05-04T12:00:00-07:00
prd: .spec/prds/v3-integration/README.md
sprint_count: 7
---

# Sprint Roadmap: LaneShadow Native Integration (V3)

## Overview

**Sprints:** 7 (planning + execution sequenced UI-first per user directive, with Design Review pipeline inserted as Sprint 05 on 2026-05-04)
**Total Tasks:** 70
**Current Sprint:** Sprint 04 (closing — RF-38/39/40 remediation landed 2026-05-03/04)

This roadmap sequences the 25 use cases in `.spec/prds/v3-integration/` so that **all 105 acceptance criteria of UC-FID-01 (Design Fidelity) land in Sprints 1-2 BEFORE any integration work begins.** This honors HUMAN SIGNAL #1's framing — sandbox views are "distorted" because of UI fidelity gaps; live-data wiring on top of distorted UI compounds the problem. By restoring V2 design-system fidelity first, every subsequent integration sprint binds real Convex/Clerk/Mapbox data into a sandbox that already matches the authoritative `.spec/design/system/` mockups.

The original 6-week appetite (HUMAN SIGNAL #4) was extended to 7 weeks on 2026-05-04 to insert a **Design Review pipeline (Sprint 05)** between the conversational planning loop (Sprint 04) and the saved-routes/sessions/settings wiring (now Sprint 06). The design-review pipeline replaces the brittle sandbox-parity snapshot infrastructure with iOS XCUITest captures evaluated by a vision LLM against the design system — closing the loop on automated UC-FID-01 audits and unblocking confidence in subsequent UI-shipping sprints. Explicit Android cut authority is documented in `01-scope.md` Cut Order.

**Sprint sequence rationale:**

- **Sprint 01** closes the 36 HIGH-severity FID gaps that produce the most visible distortion (typography, glass-panel container, iOS map placeholder, Android build blockers, token errors).
- **Sprint 02** closes the 42 MED-severity FID gaps (motion recipes, missing variants, NavBar variants) AND ships the 27 missing Android organism stories — completing the sandbox infrastructure that subsequent integration sprints need for snapshot-based regression testing.
- **Sprint 03** wires auth + Convex foundation (the substrate every other UC depends on).
- **Sprint 04** wires the conversational planning loop end-to-end — the single biggest integration surface, touching all 6 V2 screens.
- **Sprint 05** ships the **Design Review pipeline** (iOS XCUITest captures → vision LLM eval against `.spec/design/system/` references → fix-oriented JSON → Claude code skill agent → re-eval loop), retiring the sandbox snapshot tests + parity infrastructure in the process. The in-app sandbox catalog UI is preserved for dev exploration.
- **Sprint 06** wires saved routes, sessions history, and settings — the secondary persistent flows.
- **Sprint 07** wires location + offline regions, error recovery, the stretch PlanRideSheet, FID LOW-severity polish, and ship-gate hardening.

**Human testing policy:** Human tests for non-sandbox code must include real-device E2E steps. Simulator/emulator checks may remain as supporting evidence, but any gate that exercises live app flows, auth, Convex, Mapbox, persistence, location, or external services must include a real-device E2E path with recorded evidence. For iOS, use the native XCUITest pattern documented in `docs/REAL_DEVICE_E2E.md`; for Android, use physical-device evidence or mark the step MANUAL/BLOCKED until an equivalent Android device harness exists. Sandbox-only visual/component gates may continue to use simulator/emulator snapshot tooling — but as of Sprint 05, parity-snapshot tests are removed in favor of design-review evaluation.

## Sprint Sequence

| # | Sprint | Gate | Tasks | Dependencies | Status |
|---|--------|------|-------|--------------|--------|
| 1 | [Sprint 01: V2 Critical Distortion Fixes](#sprint-01-v2-critical-distortion-fixes) | Sandbox no longer looks distorted on the most visible HIGH-severity gaps; Android compiles | 9 | — | In Progress |
| 2 | [Sprint 02: V2 Variants, Motion & Sandbox Coverage](#sprint-02-v2-variants-motion--sandbox-coverage) | All designed variants and motion recipes match HTML mockups; Android sandbox stories complete | 10 | Sprint 01 | In Progress |
| 3 | [Sprint 03: Auth & Convex Foundation](#sprint-03-auth--convex-foundation) | Rider can sign in via OAuth on both platforms and see their real name on IdleScreen | 11 | Sprint 02 | In Progress |
| 3R | [Sprint 03 Remediation: Auth Design Fidelity, Component Gaps, and Real E2E](./tasks/sprint-03-auth-design-e2e-remediation/SPRINT.md) | Auth UI matches `auth-screen.html`, missing primitives are implemented, and real human-step auth evidence replaces render-only tests | 8 | Sprint 03 | Planned |
| 4 | [Sprint 04: Conversational Planning Loop](#sprint-04-conversational-planning-loop) | Rider can plan a real route end-to-end via chat and see three live polylines on RouteResults | 12 | Sprint 03 | In Progress |
| 5 | [Sprint 05: Design Review Pipeline](#sprint-05-design-review-pipeline) | A reviewer can run `pnpm design:review` and receive a calibrated, fix-oriented JSON report of per-component design issues consumable from a `design-review` Claude skill | 10 | Sprint 04 | In Progress |
| 6 | [Sprint 06: Saved Routes, Sessions & Settings](#sprint-06-saved-routes-sessions--settings) | Rider can save a route, browse saved routes, switch sessions, and toggle theme | 10 | Sprint 05 | In Progress |
| 7 | [Sprint 07: Map, Offline, Error Recovery & Ship Gate](#sprint-07-map-offline-error-recovery--ship-gate) | Rider can use real location, download offline regions, and recover from errors — V3 ships | 10 | Sprint 06 | Planned |

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
**Status:** In Progress (task expansion 2026-05-04 — 10 task files via /kb-sprint-tasks-plan)

#### Human Testing Gate

**Gate:** A reviewer can run `pnpm design:review --screens <…>` (and dispatch the equivalent `design-review` Claude Code skill) to drive iOS XCUITest captures of every reachable design-system view state, evaluate them against rendered design-system references via a calibrated (≥85% precision/recall) Claude Sonnet 4.6 vision LLM, and receive a structured fix-oriented JSON report of per-component issues — with observed/expected token deltas, severity, confidence, bounding-box, and `code_search_hint` — that an autonomous fix agent can act on with a 3-iteration re-eval cap.

#### Test Steps

1. Verify Phase 0 cleanup: confirm `ios/LaneShadowTests/Sandbox/StorySnapshotTests.swift`, `android/.../AllStoriesSnapshotTest.kt`, `tokens/sandbox/snapshots.parity.json`, `tokens/sandbox/parity-thresholds.json`, `scripts/snapshots/`, all `snapshots:*` package.json scripts, and the lefthook pre-push parity gates have been removed; `RULES.md` "Cross-Platform Component Parity" section is annotated as deferred; `pnpm dev`, `pnpm type-check:native`, `xcodebuild build -scheme LaneShadow`, and `cd android && ./gradlew :app:assembleDebug` all succeed; sandbox catalog UI still loads in debug builds on both platforms
2. Run `pnpm design:references` and confirm ~84 PNGs and ~42 annotations.json files are produced under `.spec/design/system/refs/{screen}/`, with iOS-viewport (390×844) renders for every (screen, state, theme) combination across all 7 design system views (auth, idle, planning, route-results, route-details, sessions, error)
3. Run `pnpm design:capture --screens auth-screen` and confirm `xcodebuild test` runs `DesignReviewCaptureTests` against iPhone 15 Pro Simulator, signs in via real Clerk auth (no `bypassAuthForTesting`), drives the app through every reachable auth-screen state (entry, email-entry, existing-user, new-user, invalid-email, submitting), and produces `build/xcresults/design-review.xcresult` with one XCTAttachment per (screen, state)
4. Run `pnpm design:export` and `pnpm design:manifest` and confirm `.design-review/manifest.json` lists every (captured, reference, annotations) triple with no missing pairings; non-zero exit on any orphan capture or missing reference
5. Run `pnpm design:eval` against the unmodified app and confirm zero `high`-severity issues are produced; spot-check that any `med`/`low` issues include observed/expected token names (not raw hex/pixel values), confidence scores in [0,1], and component bounding boxes
6. Inject a deliberate spacing regression on iOS AuthScreen (replace one `var(--space-4)` token usage with hardcoded `12.0` padding); re-run `pnpm design:review --screens auth-screen`; confirm the eval flags the spacing issue with severity ≥ med, confidence ≥ 0.7, and a `fix_hint` mentioning token replacement; revert the regression and confirm zero med+ issues
7. Run `pnpm design:calibrate` and confirm ≥85% precision and ≥85% recall on the 10-entry calibration set, with held-out 5-entry test score within 5pp; verify `scripts/design-review/prompts/visual-eval.locked.md` exists
8. Open `.design-review/report.html` in a browser and confirm the side-by-side reference vs captured layout renders for every captured screen, with severity-color-coded issue lists per (screen, state, theme); dispatch the `design-review` Claude Code skill from a fresh session and verify it returns the article §6 schema (`{issues, summary}`)

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
- **Coverage caveat at insertion** — XCUITest can only drive screens reachable via real flows; sessions-screen + saved-routes-* states unlock in Sprint 06; map/offline + error-recovered/offline states unlock in Sprint 07. Calibration set uses currently-reachable screens (auth/idle/planning/route-results/route-details/error) for the 85% gate.
- **Behavioral axis deferred** — only the visual fidelity axis (article §3.1) is in scope for v0. Behavioral correctness (article §3.2) — text LLM eval against per-screen SHALL/SHALL NOT requirements with action_log capture — is a follow-up plan once the visual loop is calibrated.
- **Android replacement deferred** — sandbox snapshot tests are removed on both platforms in T01, but the design-review pipeline ships iOS-only for v0; Android equivalent (instrumented tests + `UiDevice.takeScreenshot()` or Compose `captureToImage()`) is a follow-up plan if Android design review becomes a priority.

---

### Sprint 06: Saved Routes, Sessions & Settings

**Sequence:** 6
**Timeline:** Phase 2 · Week 6
**Status:** In Progress (originally Sprint 05; renumbered 2026-05-04 with Design Review pipeline insertion. Task expansion 2026-05-03)

#### Human Testing Gate

**Gate:** A rider can save a planned route via the SaveFavoriteSheet, browse all saved routes in a dedicated list with search and soft-delete + undo, view a saved route's snapshot in detail, switch between past sessions in the SessionsDrawer with camera position restored, change theme in Settings, and sign out cleanly.

**Test Steps:**
1. From RouteDetailsScreen, tap "Save"; confirm SaveFavoriteSheet opens with pre-populated name; submit → see toast + Save button flip to "Saved" + saved route appears in SavedRoutesListScreen
2. Open hamburger menu → "Saved Routes"; see paginated list ordered by save date with search field; type a query and confirm `db.savedRoutes.getSavedRoutesList` filters results
3. Swipe (iOS) / long-press (Android) a saved row → Delete → confirm soft-delete via `softDeleteRoute`; tap "Undo" in toast within ~5s → confirm `undoDeleteRoute` restores the route
4. Tap a saved route row → confirm SavedRouteDetailScreen opens hydrated from snapshot; tap "Plan again" → confirm new session created with seeded `planInput`
5. Open hamburger menu → "Sessions"; see grouped sessions (TODAY / YESTERDAY / THIS WEEK / EARLIER); tap a past session → confirm app routes to that session's phase screen with camera position restored from per-session cache
6. Open Settings → toggle theme between Light / Dark / Auto; confirm app theme switches immediately without restart and persists across app close
7. Tap "Sign out" in Settings → confirm dialog → confirm tokens clear + chat camera cache wipes + redirected to SignInScreen
8. Verify hamburger menu navigation works from every CHAT/ROUTE/SESS screen, with the active menu entry highlighted using `surface.role.agent.accent`

#### Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| ROUTE-S06-T01 | iOS SaveFavoriteSheet — V2 LSBottomSheet shell + LSTextField name input + LSInstrumentReadout metadata + Save/Cancel actions; `db.savedRoutes.saveRoute` mutation with `planInput` + `routeSnapshot` + `routeIndex` (fingerprint) + `snapshotMeta`; already-saved fingerprint state | swift-implementer | 180 min |
| ROUTE-S06-T02 | Android SaveFavoriteSheet — same composition + mutation; already-saved fingerprint state | kotlin-implementer | 180 min |
| ROUTE-S06-T03 | iOS SavedRoutesListScreen — `db.savedRoutes.getSavedRoutesList` paginated subscription with search; LSListRow per row (polyline thumbnail, name, distance, saved date, scenic-score pill); LSEmptyState; pull-to-refresh; swipe-to-delete with `softDeleteRoute` + LSToast undo button → `undoDeleteRoute`; rename via `renameRoute` mutation | swift-implementer | 360 min |
| ROUTE-S06-T04 | Android SavedRoutesListScreen — paginated query + search + long-press delete + undo; rename inline | kotlin-implementer | 360 min |
| ROUTE-S06-T05 | iOS SavedRouteDetailScreen — variant of RouteDetailsScreen template hydrated from `db.savedRoutes.getSavedRouteDetail` snapshot; Rename + Delete actions in toolbar; "Plan again" button calls `db.planningSessions.createSession` with seeded `planInput` | swift-implementer | 180 min |
| ROUTE-S06-T06 | Android SavedRouteDetailScreen + Plan again | kotlin-implementer | 180 min |
| SESS-S06-T07 | iOS SessionsScreen wiring — V2 LSSessionsDrawer subscribed to `db.planningSessions.listSessions`; date-grouped sections; tap row switches active session + routes to phase screen + restores camera from `cameraStore.cameraForSession(sessionId)`; `+ New session` creates fresh session; `Services/CameraStore.swift` with `cameraMoveSource: .user | .programmatic` flag (Gap A1-10 fix mirroring RN `isProgrammaticMoveRef`) | swift-implementer | 240 min |
| SESS-S06-T08 | Android SessionsScreen wiring + DataStore camera persistence + cameraMoveSource flag | kotlin-implementer | 240 min |
| APP-S06-T09 | iOS SettingsScreen — sections via LSSectionHeader (Account: avatar + email + Sign Out; Appearance: theme picker chips Light/Dark/Auto persisted to UserDefaults; Storage: link to Offline Regions; About: version + terms + privacy); hamburger menu navigation with all 5 entries (Home / Saved / Sessions / Offline / Settings); UC-APP-04 wiring | swift-implementer | 240 min |
| APP-S06-T10 | Android SettingsScreen + theme persistence via DataStore + sign-out + hamburger menu navigation | kotlin-implementer | 240 min |

**Next Sprint Tasks:**

Generated by /kb-sprint-tasks-plan on 2026-05-03 using project-local specialist planners (`swift-planner` for iOS, `kotlin-planner` for Android — invoked in parallel). Task IDs renamed from S05 → S06 on 2026-05-04 with the Design Review pipeline insertion.

- [ROUTE-S06-T01-ios-save-favorite-sheet.md](./tasks/sprint-06-saved-routes-sessions-settings/ROUTE-S06-T01-ios-save-favorite-sheet.md)
- [ROUTE-S06-T02-android-save-favorite-sheet.md](./tasks/sprint-06-saved-routes-sessions-settings/ROUTE-S06-T02-android-save-favorite-sheet.md)
- [ROUTE-S06-T03-ios-saved-routes-list-screen.md](./tasks/sprint-06-saved-routes-sessions-settings/ROUTE-S06-T03-ios-saved-routes-list-screen.md)
- [ROUTE-S06-T04-android-saved-routes-list-screen.md](./tasks/sprint-06-saved-routes-sessions-settings/ROUTE-S06-T04-android-saved-routes-list-screen.md)
- [ROUTE-S06-T05-ios-saved-route-detail-screen.md](./tasks/sprint-06-saved-routes-sessions-settings/ROUTE-S06-T05-ios-saved-route-detail-screen.md)
- [ROUTE-S06-T06-android-saved-route-detail-screen.md](./tasks/sprint-06-saved-routes-sessions-settings/ROUTE-S06-T06-android-saved-route-detail-screen.md)
- [SESS-S06-T07-ios-sessions-screen-wiring.md](./tasks/sprint-06-saved-routes-sessions-settings/SESS-S06-T07-ios-sessions-screen-wiring.md)
- [SESS-S06-T08-android-sessions-screen-wiring.md](./tasks/sprint-06-saved-routes-sessions-settings/SESS-S06-T08-android-sessions-screen-wiring.md)
- [APP-S06-T09-ios-settings-screen.md](./tasks/sprint-06-saved-routes-sessions-settings/APP-S06-T09-ios-settings-screen.md)
- [APP-S06-T10-android-settings-screen.md](./tasks/sprint-06-saved-routes-sessions-settings/APP-S06-T10-android-settings-screen.md)

#### Dependencies

- Blocks: Sprint 07
- Dependent on: Sprint 05

#### PRD Coverage

- UC-ROUTE-01, UC-ROUTE-02, UC-ROUTE-03, UC-ROUTE-04
- UC-SESS-01, UC-SESS-02, UC-SESS-03
- UC-APP-01, UC-APP-04
- `architecture/ios-architecture.md` § 6-7, `architecture/android-architecture.md` § Per-screen wiring + Persistence

---

### Sprint 07: Map, Offline, Error Recovery & Ship Gate

**Sequence:** 7
**Timeline:** Phase 2 · Week 7
**Status:** Planned (originally Sprint 06; renumbered 2026-05-04 with Design Review pipeline insertion)

#### Human Testing Gate

**Gate:** A rider can grant location permission and recenter the map, browse and download an offline Mapbox region from a new region selector screen with background-resumable downloads, recover from network and agent errors via the inline error callout with typed-error recovery suggestions, optionally use the manual-mode PlanRideSheet, and the app passes all snapshot regression tests across both platforms — V3 ships.

**Test Steps:**
1. On first launch on a fresh device, grant location permission via the platform-native prompt; confirm the current-location dot appears on LSMap and the recenter button flies the camera to current location with `mapTapDismiss` motion
2. Open hamburger menu → "Offline Regions"; tap "Add region" → `OfflineRegionSelectorScreen` opens; drag handles to select a region, enter a name, tap Download; watch `LSDownloadProgressBar` molecule update progress
3. Background the app while downloading and reopen; confirm download resumes (URLSession background config on iOS / WorkManager + ForegroundService on Android with `dataSync` type and `POST_NOTIFICATIONS` permission); wait for completion + checksum validation; confirm region row shows ready badge
4. Trigger a network error mid-planning (toggle airplane mode during `agent.sendMessage`); confirm ErrorScreen renders with `LSInlineErrorCallout` showing typed `NETWORK_TIMEOUT` user-facing copy + recovery chips; tap "Try again" → confirm callout fades to 0.55 opacity and the failed action retries
5. Trigger an uncaught exception in a Compose render path; confirm the global error boundary catches it, routes to ErrorScreen with generic recovery message, and logs the stack trace to `db.performance` (verify via Convex dashboard)
6. (Stretch) From IdleScreen tap manual-mode toggle on LSChatInput → `PlanRideSheet` opens with start/end inputs (Mapbox Search API autocomplete), scenic bias slider, avoid toggles, departure picker; submit → confirm `agent.planRide` action fires and screen transitions to PlanningScreen
7. Run `pnpm design:review` (the Sprint 05 pipeline) across all reachable screens on iOS + Android; confirm zero `high`-severity issues and all calibration thresholds hold post-Sprint-06 wiring (sessions-screen + saved-routes states now reachable + included in coverage)
8. Walk through the full V3 flow on both platforms (sign-in → suggest a ride → plan → save → reopen → re-plan from saved → switch theme → sign out) and confirm every step works end-to-end without console errors — V3 ships

#### Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| MAP-S07-T01 | iOS CoreLocation integration — `CLLocationManager` with `whenInUse` authorization; recenter button on `LSMapLayer.controls`; denied-state notice with `UIApplication.openSettingsURLString` deep-link; current-location dot composable on LSMap | swift-implementer | 180 min |
| MAP-S07-T02 | Android FusedLocationProvider integration — `ACCESS_FINE_LOCATION` permission + recenter + denied-state intent to `Settings.ACTION_APPLICATION_DETAILS_SETTINGS` | kotlin-implementer | 180 min |
| MAP-S07-T03 | iOS OfflineRegionsListScreen + OfflineRegionSelectorScreen — Mapbox iOS SDK 11.x `OfflineManager` + `TileStoreManager`; bbox-selector overlay on LSMap; bottom sheet with name input + estimated size + Download button; LSDownloadProgressBar molecule states (paused/downloading/complete/error); swipe-to-delete | swift-implementer | 360 min |
| MAP-S07-T04 | Android OfflineRegionsListScreen + OfflineRegionSelectorScreen — Mapbox Android SDK 11.22.0 `OfflineManager` + `TileStore`; `MapboxOfflineRepository` wrapper; WorkManager `OfflineDownloadWorker` + ForegroundService with `dataSync` type and `POST_NOTIFICATIONS` runtime permission; LSDownloadProgressBar parity | kotlin-implementer | 480 min |
| MAP-S07-T05 | iOS Mapbox URLSession background-config downloads — `URLSessionConfiguration.background(withIdentifier: "com.laneshadow.offline-tiles")` with delegate handlers; checksum validation on completion; resume on reconnect via reachability monitor | swift-implementer | 180 min |
| CHAT-S07-T06 | iOS ErrorScreen recovery wiring + global error boundary — `LSInlineErrorCallout` populated from `LaneShadowError` typed cases (warning vs storm-gate variant); recovery chip taps re-dispatch failed action; `ErrorBoundary` view-modifier catches uncaught Tasks → routes to ErrorScreen + logs to `db.performance` | swift-implementer | 180 min |
| CHAT-S07-T07 | Android ErrorScreen recovery + global error boundary — `CoroutineExceptionHandler` on top-level scope + Compose `ErrorBoundary` wrapper; storm-gate variant rendering; recovery chip dispatch | kotlin-implementer | 180 min |
| CHAT-S07-T08 | iOS PlanRideSheet manual mode [STRETCH] — V2 LSBottomSheet + place autocomplete via Mapbox Search API + scenic bias slider + avoid-highways/tolls toggles + departure picker; Plan button calls `actions.agent.planRide.planRide` | swift-implementer | 240 min |
| CHAT-S07-T09 | Android PlanRideSheet manual mode [STRETCH] — same composition + planRide action call | kotlin-implementer | 240 min |
| FID-S07-T10 | UC-FID-01 LOW-severity polish + ship-gate hardening — separator dots styled atoms, see-all link `body.md` size, iOS body collocation in headerRow VStack (Gap E1-07), motion timing micro-tuning, full Sprint 05 design-review pass on every reachable screen, regression sweep, V3 ship-gate verification | swift-implementer + kotlin-implementer | 240 min |

#### Dependencies

- Blocks: V3 ship → opens follow-on initiatives (RN retirement Sprint 8 of v2, v3.1 deferred items)
- Dependent on: Sprint 06

#### PRD Coverage

- UC-MAP-01, UC-MAP-02, UC-MAP-03
- UC-CHAT-05 [STRETCH], UC-CHAT-06 (full ErrorScreen wiring)
- UC-APP-03 (global error boundary)
- UC-FID-01 (LOW-severity AC subset — ~20 ACs)
- `architecture/ios-architecture.md` § 8-9, `architecture/android-architecture.md` § Mapbox + Background Tasks, `architecture/ui-design.md` § Offline Regions screens

---

## Cut Authority Reminder

Per HUMAN SIGNAL #4 (`if cross platform testing is too burdensome then we might cut android`):

**Week-2 mechanical checkpoint** owned by product-manager (orchestrator):
- If by end of Sprint 02 the Android Convex client + Clerk auth aren't on track to land in Sprint 03, escalate to user with cut recommendation.
- Cut layers (defined in `01-scope.md`):
  1. Drop Android snapshot parity tests + Android FID story registration (Sprint 02 T10 Android side) — *partially executed: parity tests removed in Sprint 05 T01 regardless of cut decision*
  2. Drop Android UI gap-fills for new screens (Sprints 03, 06, 07 Android tasks for new surfaces only — note: Sprint 05 design-review pipeline is iOS-only by design)
  3. Drop Android implementation entirely (all `*-android` and `kotlin-implementer` tasks Sprints 03+)

**iOS path always ships.** All FID work, integration UCs, and the design-review pipeline (Sprint 05) deliver on iOS regardless of Android cut layer. Android coverage in the design-review pipeline is an explicit follow-up plan (see Sprint 05 Notes).

## Roadmap Authoring Notes

- This roadmap was originally synthesized directly by the orchestrator (PRD author) on 2026-04-27 based on the v1.2.0 PRD and the user's explicit "UI-first sequencing" directive, without dispatching parallel implementation_planner / design_planner agents. The simplified path was chosen for efficiency given full PRD context.
- Updated 2026-05-04: **Sprint 05 (Design Review Pipeline)** inserted between the conversational planning loop (Sprint 04) and the saved-routes/sessions/settings work (now Sprint 06). The previous Sprint 05 → 06 and Sprint 06 → 07. Source of the new sprint: `~/.claude/plans/plan-a-design-review-logical-clock.md` (approved plan in plan-mode session) and the design-review strategy article. Task ID prefixes for renumbered sprints were updated correspondingly (S05 → S06 in saved-routes/sessions/settings; S06 → S07 in map/offline/ship). Folder `tasks/sprint-05-saved-routes-sessions-settings/` was renamed to `tasks/sprint-06-saved-routes-sessions-settings/` and the 10 task files inside were renamed + updated. Sprint 07 had no expanded task folder, only the ROADMAP entries were renumbered.
- Task IDs follow the pattern `{GROUP}-S{NN}-T{NN}` for unambiguous referencing. The `kb-sprint-tasks-plan` skill expands each into per-task markdown files when the sprint becomes active.
- Per-platform paired tasks (iOS + Android) are kept separate per project RULES.md "Platform ownership rule for sprint execution" — `swift-*` agents own iOS implementation; `kotlin-*` agents own Android. The Sprint 05 design-review pipeline is iOS-only by user directive.
- Total task count: 70 (averaging 10 per sprint, the upper limit per skill rules).

## Next Steps

```bash
# Expand Sprint 05 tasks JIT for execution (next up after Sprint 04 closure)
/kb-sprint-tasks-plan .spec/prds/v3-integration/ROADMAP.md

# Run Sprint 05
/kb-run-sprint sprint-05-design-review-pipeline

# Re-plan after PRD edits
/kb-sprint-plan .spec/prds/v3-integration/README.md --delta-replan
```
