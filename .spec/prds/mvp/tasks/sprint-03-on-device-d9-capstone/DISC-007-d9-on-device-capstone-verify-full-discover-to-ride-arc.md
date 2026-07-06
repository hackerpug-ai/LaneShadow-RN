# DISC-007: D9 on-device capstone — verify the full discover-to-ride arc on the route plan view on real iOS and real Android against live Convex

**Sprint:** [SPRINT.md](./SPRINT.md)
**Type:** FEATURE · **Status:** To Do · **Priority:** P0 · **Effort:** M · **Estimate:** 240 min
**Agent:** react-native-ui-implementer
**Proposed By:** react-native-ui-implementer *(standing in as RN planning specialist; nominal `react-native-ui-planner` non-responsive in this harness per the Sprint 02 record — documented)*
**TDD_MODE:** skipped · **RED_GREEN_REQUIRED:** no  *(capstone verification — no new code is authored; the RED phase IS the gate run itself going red against any broken seam. Axis B `requires_seeded_evidence: yes` on every behavioral AC — each must prove the real-services path with recorded evidence on BOTH platforms.)*

## Outcome

Verify the full discover-to-ride journey completes end-to-end on a real iPhone AND a real Android phone against live Convex dev (no mocks), surface and repair any platform-specific breakage in place under WRITE-ALLOWED, and capture per-platform recorded evidence — satisfying the project iron rule (integration/E2E against real services is the primary acceptance bar) and the binding e2e criterion T-DISC-001.

## Specification

DISC-007 is the terminal MVP **"done" gate** — the D9 on-device capstone. It replays the recorded journey in [SCENARIO 1 (core-discover-to-ride-journey)](../../../scenarios/UC-DISC-01/core-discover-to-ride-journey.scenario.md) and [SCENARIO 2 (edge-cold-boot-and-handoff-fallback)](../../../scenarios/UC-DISC-01/edge-cold-boot-and-handoff-fallback.scenario.md) at the human surface, on real devices, against live Convex, satisfying e2e criterion T-DISC-001.

The task is verification-first: the implementer runs `.maestro/discovery-full-gate.yaml` (or the manual equivalent on real hardware where Maestro cannot reach) on each platform from a cold boot, captures recorded evidence, and any seam that breaks during the run is repaired in place under WRITE-ALLOWED. The arc integrates every prior seam — plan-view-as-landing (DISC-002), curated suggestion cards over the input (DISC-016/017/018), chat-driven curated discovery including state-scoped intent (DISC-019/020/021), card→map render, route detail with score bars + geometry-or-centroid + conditions (DTL-001), save+reopen persistence (SAVE-001), and maps handoff with platform URL schemes + browser fallback (SAVE-002).

**No new feature code is specified**; only verification, evidence capture, and in-scope seam repair. The task explicitly depends on the Sprint 02 `simulator-rendering-fragility` block being unblocked before the gate can run on the iOS-simulator path; **real-hardware runs bypass that block and are the preferred path**.

## Critical Constraints

- **MUST** run the full arc against live Convex dev on BOTH a real iOS device AND a real Android device — real hardware preferred. A freshly-erased iOS simulator / Android emulator is the closest available proxy with that limitation explicitly noted in the evidence. **NEVER** substitute a mocked or offline-stub data path.
- **NEVER** paper over the Sprint 02 BLOCKED gate (`simulator-rendering-fragility` — the app freezes its render surface after any Maestro interaction following `expo run:ios`). If the gate cannot run on a given platform, surface the block explicitly and mark that platform FAIL; do not silently work around render-surface freezing by avoiding Maestro interactions or by switching to a non-representative harness.
- **STRICTLY** frame ACs by **behavior state** (the discover-to-ride arc on the plan view), NOT platform-as-variant. Platform-specific bindings (Apple Maps URL host on iOS, Google Maps scheme on Android, web fallback) are IMPLEMENTATION DETAILS already covered by Sprint 02's SAVE-002 — DISC-007 verifies them at the integrated human surface, it does NOT re-implement them.
- **MUST** record per-platform video or screenshot evidence of the complete arc (gate-replayable: another founder could re-run it and observe the same outcome). Evidence artifact MUST include the platform, the Convex deployment URL, and a timestamp.
- **NEVER** mark the sprint complete on a single platform. BOTH iOS AND Android must pass the full arc against live services. A pass on one platform and a fail (or "could not run") on the other is a sprint-level FAIL.

## Acceptance Criteria

### AC-1: iOS full discover-to-ride arc against live Convex *(PRIMARY)*
- **flow_ref:** `HF-DISC-01-CORE` (UC-DISC-01 journey flow — replays Sprint 01 + 02 seams at the human surface)
- **GIVEN** the app is built and run on a real iPhone pointed at live Convex dev (deployment `quirky-panther-164.convex.cloud`), signed in via the E2E auth button, cold-launched
- **WHEN** the founder completes the full discover-to-ride arc — opens to the route plan view (map + chat home), sees curated suggestion cards over the input, taps a card to plot a route, chats a natural-language request and sees the latest curated route plot, taps a route to its detail, saves it, reopens it from Saved, and taps Ride It
- **THEN** the entire arc completes on iOS against live Convex with no mocks, the app opens directly to the plan view (no separate Discover screen), and Ride It hands off to Apple Maps
- **Test tier:** `e2e` · **Service:** real iOS device (or freshly-erased iOS simulator as closest proxy, limitation noted) + live Convex dev deployment (`quirky-panther-164.convex.cloud`)
- **Verify:** `maestro test .maestro/discovery-full-gate.yaml` on iOS simulator as the closest proxy AND a manual real-iPhone run; capture screenshots/video into `evidence/disc-007/ios/` with a manifest noting platform, Convex URL, timestamp.
- **Scenario** (start `real_ios_device`):
  - **must_observe:** launch route id == `(tabs)/index` (route plan view), NOT `discover`; ≥5 distinct curated road names surfaced across the suggestion cards over the input (count ≥ 5); ≥1 route polyline plotted on the map after tapping a suggestion card (plotted polyline count == 1, was 0 before); detail view shows the tapped route's name (e.g. `Wasatch Ridge Traverse`) as headline, 5 score bars labeled `Twisty`, `Scenic`, `Technical`, `Pavement`, `Traffic`, and a conditions block; save button transitions to the literal `Saved` state in place (button label == `Saved`); Saved screen shows ≥1 saved route row matching the route that was saved (row count was 0 before save); openURL launches with host `maps.apple.com` (URL host == `maps.apple.com`).
  - **must_not_observe:** `(0)` curated suggestion cards over the input; a separate Discover screen before the plan view; blank detail screen on route tap; crash on reopen from Saved (legs/PlanInput error); dead tap on Ride It (no URL open, no maps app launch).
  - **negative_control.would_fail_if:** disconnect from live Convex (no curated catalog returned → 0 suggestion cards); stub catalog substituted (static fixture of <5 roads instead of the live 5,654-route deployment); empty plan view rendered (no suggestion cards over the input); mock maps handoff (no real Linking openURL to `maps.apple.com`); static detail screen (score bars/geometry/conditions hardcoded rather than read from the plotted route).
  - **evidence:** `screenshot` (required capture).

### AC-2: Android full discover-to-ride arc against live Convex *(PRIMARY)*
- **flow_ref:** `HF-DISC-01-CORE`
- **GIVEN** the app is built and run on a real Android phone pointed at live Convex dev, signed in via the E2E auth button, cold-launched
- **WHEN** the founder completes the identical full discover-to-ride arc on Android — plan view landing, curated cards, tap-to-plot, chat request → curated route plotted, tap route → detail, save, reopen from Saved, Ride It
- **THEN** the entire arc completes on Android against live Convex with no mocks and Ride It hands off to Google Maps (or the browser fallback when Google Maps is unavailable — covered separately in AC-7)
- **Test tier:** `e2e` · **Service:** real Android device (or Android emulator as closest proxy, limitation noted) + live Convex dev deployment
- **Verify:** `maestro test .maestro/discovery-full-gate.yaml` on Android emulator as the closest proxy AND a manual real-Android run; capture into `evidence/disc-007/android/`.
- **Scenario** (start `real_android_device`):
  - **must_observe:** launch route id == `(tabs)/index` (route plan view), NOT `discover`; ≥5 distinct curated road names surfaced across the suggestion cards over the input (count ≥ 5); ≥1 route polyline plotted on the map after tapping a suggestion card (plotted polyline count == 1, was 0 before); detail view shows the tapped route's name (e.g. `Wasatch Ridge Traverse`) as headline, 5 score bars labeled `Twisty`, `Scenic`, `Technical`, `Pavement`, `Traffic`, and a conditions block; save button transitions to the literal `Saved` state in place (button label == `Saved`); Saved screen shows ≥1 saved route row matching the route that was saved (row count was 0 before save); openURL launches with scheme `google.navigation:` OR browser URL host == `maps.google.com` (per AC-7 fallback).
  - **must_not_observe:** `(0)` curated suggestion cards over the input; a separate Discover screen before the plan view; blank detail screen on route tap; crash on reopen from Saved (legs/PlanInput error); dead tap on Ride It (no URL open, no maps app launch, no browser fallback).
  - **negative_control.would_fail_if:** disconnect from live Convex (no curated catalog returned → 0 suggestion cards); stub catalog substituted (static fixture instead of live 5,654-route deployment); empty plan view rendered (no suggestion cards); mock maps handoff (no real Linking openURL to `google.navigation:` or `maps.google.com`); static detail screen (values hardcoded rather than read from the plotted route).
  - **evidence:** `screenshot` (required capture).

### AC-3: State-scoped chat request returns in-state curated routes on BOTH platforms
- **flow_ref:** `HF-DISC-01-CORE`
- **GIVEN** the founder is on the plan view on a real iPhone (and separately a real Android phone) against live Convex dev with no route currently plotted
- **WHEN** the founder chats a state-scoped natural-language request — e.g. `"scenic roads in North Carolina"` or `"twisties in North Carolina"`
- **THEN** at least one curated route located in the named state is returned as a chat route-card AND the latest returned route plots on the map — verifying browse-by-state intent survives conversationally on both platforms
- **Test tier:** `e2e` · **Service:** real iOS device + real Android device + live Convex dev
- **Verify:** manual run on both real devices; type the state-scoped request, screenshot the chat route-cards and the plotted map; confirm ≥1 returned route's state matches the request. Capture into `evidence/disc-007/{platform}/state-scoped/`.
- **Scenario** (cases: `real_ios_device`, `real_android_device`):
  - **must_observe:** ≥1 curated route-card returned whose state field == `NC` or `North Carolina`; query string `scenic roads in North Carolina` echoed/intact in the chat thread (literal substring match); plotted polyline count on the map == 1 for the latest returned route (was 0 before the chat).
  - **must_not_observe:** `(0)` route-cards returned for the state-scoped query; route-cards returned for a state other than the one named; chat response with no plotted route (route-card but plotted polyline count == 0).
  - **negative_control.would_fail_if:** disconnect from live Convex (chat returns no routes); stub chat responder (static reply ignoring the state token); empty chat response (0 route-cards); mock plot path (route-card returned but no polyline plotted).
  - **evidence:** `screenshot` (required capture).

### AC-4: Card → map → detail loop reads values from the SPECIFIC route
- **flow_ref:** `HF-DISC-01-CORE`
- **GIVEN** the founder has previously plotted at least one route on the plan view and has since returned to browsing suggestion cards / chat route-cards on a real device
- **WHEN** the founder taps an earlier curated-route card to re-render it on the map, then taps the re-rendered route
- **THEN** the route re-plots on the map (returning focus to the map view) and the detail view opens showing the route's headline, score bars, geometry-or-centroid, and basic conditions read from that specific route
- **Test tier:** `e2e` · **Service:** real iOS device + real Android device + live Convex dev
- **Verify:** manual run on both real devices: plot route A, browse away, tap route B's card, tap route B on the map; screenshot detail. Confirm the detail's values match route B (not route A or a static fixture). Capture into `evidence/disc-007/{platform}/card-map-detail/`.
- **Scenario** (start `real_ios_device`):
  - **must_observe:** map shows 1 polyline matching route B's geometry after the card tap (route A's polyline is no longer the displayed route, route B's name shows in the route label); detail view headline == route B's name (e.g. `Cherohala Skyway`), NOT route A's name; ≥1 score bar rendered with value > 0 (5 score bars labeled `Twisty` / `Scenic` / `Technical` / `Pavement` / `Traffic`); geometry-or-centroid for route B present: 1 polyline OR 1 centroid pin rendered; conditions block shows a non-empty value: temperature in degrees F, OR the literal string `conditions unavailable`.
  - **must_not_observe:** blank detail screen; detail values matching route A when route B was tapped (static fixture leak); `(0)` score bars rendered.
  - **negative_control.would_fail_if:** disconnect from live Convex (card tap loads no geometry); stub detail screen (static headline/scores regardless of which route tapped); empty detail screen (no score bars / no geometry / no conditions rendered); mock geometry (centroid hardcoded to a single fixed point for every route).
  - **evidence:** `screenshot` (required capture).

### AC-5: Save persists + reopens from Saved with no legs/PlanInput crash
- **flow_ref:** `HF-DISC-01-CORE`
- **GIVEN** the founder is viewing a route's detail on a real device against live Convex dev
- **WHEN** the founder taps Save, fully closes/reopens the app, and navigates to the Saved screen
- **THEN** the route is persisted (save button shows `Saved` state in place) and reappears in the Saved screen on reopen with no legs/PlanInput crash
- **Test tier:** `e2e` · **Service:** real iOS device + real Android device + live Convex dev
- **Verify:** manual run on both real devices: save a route, kill the app, cold-reopen, open Saved; screenshot. Confirm no RN red screen / no PlanInput error. Cross-check the saved row count via the Convex dev dashboard if available. Capture into `evidence/disc-007/{platform}/save-reopen/`.
- **Scenario** (start `real_ios_device`):
  - **must_observe:** save button transitions to the literal `Saved` state in place on tap (button label == `Saved`); Saved screen shows ≥1 saved route row after reopen (row count was 0 before save); saved route row's title == the tapped route's name (e.g. `Wasatch Ridge Traverse`); error/toast count on reopen == 0 (no `legs is undefined`, no PlanInput error).
  - **must_not_observe:** `(0)` saved routes on reopen; crash on reopen from Saved (legs/PlanInput error); save button reverting to unsaved state after reopen.
  - **negative_control.would_fail_if:** disconnect from live Convex (save mutation does not persist); stub persistence layer (save appears to succeed but nothing is written); empty Saved screen on reopen (save silently dropped); mock reopen path (legs/PlanInput crash suppressed by stubbed props).
  - **evidence:** `screenshot` (required capture).

### AC-6: Ride-It hands off to Apple Maps on iOS
- **flow_ref:** `HF-DISC-01-CORE`
- **GIVEN** the founder has a saved (or currently-open) route on a real iPhone against live Convex dev
- **WHEN** the founder taps Ride It
- **THEN** the native Apple Maps app opens with the route's centroid + name as the destination, via a URL whose host is `maps.apple.com`
- **Test tier:** `e2e` · **Service:** real iOS device + live Convex dev
- **Verify:** manual run on a real iPhone: from a route detail or Saved row, tap Ride It; confirm Apple Maps opens and the destination matches. Capture a screenshot of Apple Maps + the LLDB/console log of the openURL string (host `maps.apple.com`) into `evidence/disc-007/ios/handoff/`.
- **Scenario** (start `real_ios_device`):
  - **must_observe:** frontmost app bundle id == `com.apple.Maps` (Apple Maps native app) after the tap; openURL host == `maps.apple.com`; launched URL contains `ll=<lat>,<lng>` (centroid) AND `q=<route name>` (e.g. `q=Wasatch%20Ridge%20Traverse`).
  - **must_not_observe:** dead tap on Ride It (openURL call count == 0); URL host other than `maps.apple.com` (e.g. browser fallback on a device where Apple Maps exists); empty destination in the URL (no `ll=` or `q=`).
  - **negative_control.would_fail_if:** mock Linking.openURL (no native app launch); stub handoff (URL host hardcoded to a non-apple host); empty destination (no centroid/name in the URL); disconnect (route data unavailable so handoff URL cannot be built).
  - **evidence:** `event_log` (required capture).

### AC-7: Ride-It hands off to Google Maps on Android (or browser fallback when unavailable)
- **flow_ref:** `HF-DISC-01-CORE`
- **GIVEN** the founder has a saved (or currently-open) route on a real Android phone against live Convex dev, in two device states — (a) Google Maps installed, (b) Google Maps uninstalled so `Linking.canOpenURL('google.navigation:...')` returns false
- **WHEN** the founder taps Ride It in each device state
- **THEN** (a) with Google Maps installed, the Google Maps app opens via the `google.navigation:` (or `comgooglemaps:`) scheme with the route's centroid + name; (b) with Google Maps unavailable, the browser opens to `maps.google.com` with the route's centroid + name as the destination (no crash, no dead tap)
- **Test tier:** `e2e` · **Service:** real Android device + live Convex dev
- **Verify:** manual run on a real Android phone in both states: (a) with Google Maps installed, tap Ride It → confirm Google Maps opens; (b) uninstall/disable Google Maps, tap Ride It → confirm browser opens to `maps.google.com`. Capture both into `evidence/disc-007/android/handoff-{gmaps,browser}/`.
- **Scenario** (cases: `real_android_device`, `android_no_gmaps`):
  - **case `real_android_device` must_observe:** frontmost app package == `com.google.android.apps.maps` (Google Maps native app) after the tap; URL scheme == `google.navigation:` OR `comgooglemaps:`; launched URL contains `q=<lat>,<lng>` (centroid) AND the route name label.
  - **case `real_android_device` must_not_observe:** dead tap on Ride It (openURL call count == 0); browser fallback firing when Google Maps IS installed (no `maps.google.com` host on this path).
  - **case `android_no_gmaps` must_observe:** system browser opens with URL host == `maps.google.com` (resolved browser package); browser URL contains `q=<lat>,<lng>` (centroid) AND the route name as label; openURL call count == 1 (one successful launch); crash log count == 0.
  - **case `android_no_gmaps` must_not_observe:** dead tap on Ride It (openURL call count == 0); crash when Google Maps is unavailable (crash log count > 0); URL host other than `maps.google.com` in the fallback path.
  - **negative_control.would_fail_if:** mock Linking.openURL (no native app or browser launch); stub fallback (browser path never attempted when canOpenURL is false); empty destination (no centroid/name in either URL); disconnect (route data unavailable so handoff URL cannot be built); static scheme dispatch (always uses `google.navigation:` regardless of canOpenURL result).
  - **evidence:** `event_log` (required capture).

### AC-8: Cold-boot edge — full arc still completes from a fresh install (SCENARIO 2 P1)
- **flow_ref:** `HF-DISC-01-EDGE`
- **GIVEN** the app is freshly installed (or had its storage cleared) on a real Android phone pointed at live Convex dev — i.e. true cold-boot state with no cached routes/saves
- **WHEN** the founder launches cold and completes the full discover-to-ride arc from the empty state
- **THEN** the full arc still completes — plan view landing, suggestion cards present, tap-to-plot, chat returns curated routes, detail renders, save persists, maps handoff opens — proving the cold-boot edge from SCENARIO 2 does not regress
- **Test tier:** `e2e` · **Service:** real Android device (fresh install) + live Convex dev
- **Verify:** manual run: uninstall/reinstall (or clear app storage) on a real Android phone, then run the full arc cold; capture screenshots into `evidence/disc-007/android/cold-boot/`. Run `maestro test .maestro/discovery-full-gate.yaml` from a wiped emulator state as the closest proxy.
- **Scenario** (start `real_android_device`):
  - **must_observe:** launch route id == `(tabs)/index` (route plan view) on cold boot, NOT `discover` or `onboarding`; ≥5 curated road names in suggestion cards despite cold boot (count ≥ 5); ≥1 route plotted after a card tap (plotted polyline count == 1); Saved screen row count on reopen ≥1 (save persisted across cold-boot run, was 0 before save).
  - **must_not_observe:** `(0)` suggestion cards on cold boot (catalog query gated on warm cache); blank plan view requiring a manual refresh; save silently dropped on cold-boot reopen.
  - **negative_control.would_fail_if:** disconnect from live Convex (cold-boot has no cached fallback, so 0 suggestion cards); stub bootstrap (warm-state fixture used instead of true cold boot); empty initial state (plan view renders with no suggestion cards because the catalog query is gated on a warm cache); mock persistence (save appears to work pre-bootstrap but is silently dropped).
  - **evidence:** `screenshot` (required capture).

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | The full discover-to-ride arc completes on a real iOS device against live Convex dev with no mocks, opens directly to the route plan view (launch route id `(tabs)/index`), plots a curated route on card tap (plotted polyline count == 1), opens a detail view with 5 score bars + geometry-or-centroid + conditions, persists a save (button label `Saved`, Saved row count ≥ 1), reopens it from Saved without crashing (error count == 0), and hands off to Apple Maps (URL host `maps.apple.com`). | AC-1 | `maestro test .maestro/discovery-full-gate.yaml` (iOS) + manual real-iPhone run; evidence in `evidence/disc-007/ios/` |
| TC-2 | The full discover-to-ride arc completes on a real Android device against live Convex dev with no mocks, with identical observable behavior to iOS except for the Google Maps handoff. | AC-2 | `maestro test .maestro/discovery-full-gate.yaml` (Android) + manual real-Android run; evidence in `evidence/disc-007/android/` |
| TC-3 | A state-scoped chat request (e.g. `scenic roads in North Carolina`) returns ≥1 curated route-card located in the named state (state field `NC` or `North Carolina`) and plots the latest returned route on the map (plotted polyline count == 1), on BOTH iOS and Android against live Convex. | AC-3 | manual run on both real devices; evidence in `evidence/disc-007/{platform}/state-scoped/` |
| TC-4 | Tapping an earlier curated-route card re-renders that specific route on the map (not a previously plotted route), and tapping the re-rendered route opens a detail whose headline, score bars (≥1 with value > 0), geometry-or-centroid, and conditions match that specific route. | AC-4 | manual run on both real devices; evidence in `evidence/disc-007/{platform}/card-map-detail/` |
| TC-5 | Saving a route persists it (save button transitions to label `Saved`) and the saved route reappears in the Saved screen after a full app kill and cold reopen (row count ≥ 1), with no legs/PlanInput crash (error count == 0), on BOTH platforms. | AC-5 | manual run on both real devices; evidence in `evidence/disc-007/{platform}/save-reopen/` |
| TC-6 | Tapping Ride It on iOS opens the native Apple Maps app (frontmost bundle id `com.apple.Maps`) via a URL whose host is `maps.apple.com` with the route's centroid + name as the destination (URL contains `ll=` and `q=`). | AC-6 | manual real-iPhone run; capture openURL log + screenshot in `evidence/disc-007/ios/handoff/` |
| TC-7 | Tapping Ride It on Android opens Google Maps (frontmost package `com.google.android.apps.maps`, scheme `google.navigation:` or `comgooglemaps:`) when Google Maps is installed, AND opens the browser to host `maps.google.com` with the route's centroid + name as destination when Google Maps is unavailable (no crash, no dead tap, openURL call count == 1). | AC-7 | manual real-Android run in both device states; evidence in `evidence/disc-007/android/handoff-{gmaps,browser}/` |
| TC-8 | After a fresh install / storage-clear cold boot on Android, the full discover-to-ride arc still completes against live Convex dev with ≥5 suggestion cards on the plan view, ≥1 plotted route, and a save that persists across the cold-boot run (Saved row count ≥ 1 on reopen). | AC-8 | `maestro test .maestro/discovery-full-gate.yaml` (Android, wiped state) + manual fresh-install real-Android run; evidence in `evidence/disc-007/android/cold-boot/` |
| TC-9 | All non-gate verification gates pass before declaring the sprint complete: `pnpm type-check` exits 0, `pnpm lint` exits 0, `pnpm test` exits 0, and `pnpm vitest run scripts/__tests__/check-convex-health.integration.test.ts` confirms the live Convex dev deployment is reachable and healthy. | AC-1 | `pnpm type-check && pnpm lint && pnpm test && pnpm vitest run scripts/__tests__/check-convex-health.integration.test.ts` |
| TC-10 | The Sprint 02 `simulator-rendering-fragility` block status is explicitly recorded in the sprint record as `RESOLVED`, `BYPASSED-VIA-REAL-HARDWARE`, or `STILL-BLOCKED` — and if `STILL-BLOCKED` on the iOS-simulator path, the real-hardware iOS run (AC-1) is the binding evidence and the limitation is disclosed in the evidence manifest. | AC-1 | manual; documented in sprint record + `evidence/disc-007/manifest.json` |

## Reading List

- `.spec/scenarios/UC-DISC-01/core-discover-to-ride-journey.scenario.md` — **all** — SCENARIO 1 — the P0 happy-path journey this capstone replays on both platforms from cold boot; binds the must_observe list
- `.spec/scenarios/UC-DISC-01/edge-cold-boot-and-handoff-fallback.scenario.md` — **all** — SCENARIO 2 — P1 cold-boot + Google Maps unavailable → browser fallback edge case; non-negotiable PRD scope
- `.maestro/discovery-full-gate.yaml` — **all** — The full-gate Maestro flow that drives the human arc; the primary replay harness on simulator/emulator
- `AGENTS.md` — **all** — Stack, key commands (`pnpm type-check` / `lint` / `test`, `maestro`, Convex health), directory layout, agent dispatch rules
- `.spec/prds/mvp/10-e2e-testing-criteria.md` — **all** — e2e criterion T-DISC-001 — the binding PASS/FAIL contract for the gate (BOTH platforms, recorded evidence, no mocks)
- `.spec/prds/mvp/05-uc-disc.md` — **all** — UC-DISC-01 PRD scope: the discover-to-ride journey on a real device, the ACs this capstone verifies
- `app/(app)/(tabs)/index.tsx` — **all** — Plan-view-as-landing wiring — confirm the app boots to map + chat home, NOT a separate Discover screen (Sprint 01 DISC-002 seam)
- `components/chat-input.tsx` — **all** — Curated suggestion cards over the input (Sprint 01 DISC-016/017/018 seam) — tap-to-plot path
- `app/(app)/curated-route/[id].tsx` — **all** — Detail view score bars + geometry-or-centroid + conditions (Sprint 02 DTL-001 / DESIGN-002/003 seam)
- `lib/maps-deeplink.ts` — **all** — Apple Maps / Google Maps / browser-fallback URL scheme dispatch (Sprint 02 SAVE-002 seam) — verify, do NOT re-implement
- `scripts/__tests__/check-convex-health.integration.test.ts` — **all** — Convex dev deployment health gate — must be green before any platform run begins

## Guardrails

- **WRITE-ALLOWED:**
  - In-place repairs to existing seams broken during the capstone run: plan-view routing/landing, suggestion-card tap-to-plot wiring, chat→curated-route plot wiring, detail rendering (score bars / geometry / conditions), save persistence + Saved reopen, maps-handoff URL scheme dispatch — minimal changes only, each justified by a failing gate observation
  - Updates to `.maestro/discovery-full-gate.yaml` and any per-platform sub-flows to reflect the real entrypoint (cold boot → plan view) and to surface the state-scoped chat step
  - Updates to `.maestro/` evidence-capture directives and to any helper that records platform/deployment/timestamp onto captured artifacts
  - Addition of an `evidence/disc-007/` folder for per-platform video/screenshot artifacts and a per-run manifest (platform, Convex URL, timestamp, pass/fail, observed values)
  - Documentation notes in the sprint record capturing the Sprint 02 `simulator-rendering-fragility` status (`resolved` / `still-blocked` / `bypassed-via-real-hardware`)
- **WRITE-PROHIBITED:**
  - Re-implementation of the maps handoff logic or platform URL schemes (covered by Sprint 02 SAVE-002) — verify only
  - Introduction of any mock / stub / fixture data path that bypasses live Convex (e.g. hardcoded route catalog, fake chat responses) — this voids the gate
  - Weakening of UC-DISC-01's recorded scenarios (must_observe counts, quoted strings, must_not_observe signatures) to make a failing run "pass"
  - Marking the gate passed on a single platform, or marking it passed while the Sprint 02 `simulator-rendering-fragility` block is unresolved on the iOS-simulator path without disclosing that
  - Skipping the cold-boot edge (SCENARIO 2) or the handoff-fallback edge (SCENARIO 2) — both are non-negotiable PRD scope
  - Any change to Convex schema or functions — DISC-007 is RN-only; backend breakage surfaces as a FAIL and routes to `convex-implementer`, not patched here

## Design

- **References:**
  - `.spec/scenarios/UC-DISC-01/core-discover-to-ride-journey.scenario.md`
  - `.spec/scenarios/UC-DISC-01/edge-cold-boot-and-handoff-fallback.scenario.md`
  - `.spec/prds/mvp/10-e2e-testing-criteria.md` (e2e criterion T-DISC-001)
  - `.maestro/discovery-full-gate.yaml`
- **Pattern:** Integration capstone against real services — replay the recorded human journey from cold boot on each real device against live Convex, capture per-platform recorded evidence, and repair any broken seam in place under WRITE-ALLOWED. The gate is behavior-state-driven (the discover-to-ride arc on the plan view), not platform-as-variant; the same replayed journey runs on iOS and Android with platform-specific bindings isolated to the maps-handoff seam.
- **Pattern source:** Project iron rule (`AGENTS.md` + `RULES.md`): integration/E2E against real services is the primary acceptance bar; the PRD's UC-DISC-01 `test_tier` is `e2e` against real iOS + real Android + live Convex dev.
- **Anti-pattern:** Mocked / virtualized / single-platform tests that "pass" without exercising the real Convex catalog (the live 5,654-route deployment) on BOTH a real iPhone and a real Android phone. A green Maestro run on the iOS simulator alone, or a unit test of `lib/maps-deeplink.ts`, does NOT satisfy the gate — both are simulator-rendering-fragility-paper-over or mock-only anti-patterns that violate T-DISC-001.

## Verification Gates

| Gate | Command |
|------|---------|
| TypeCheck | `pnpm type-check` |
| Lint | `pnpm lint` |
| Test | `pnpm test` |
| ConvexHealth | `pnpm vitest run scripts/__tests__/check-convex-health.integration.test.ts` |
| Maestro-iOS | `maestro test .maestro/discovery-full-gate.yaml` *(iOS simulator — closest proxy for real iPhone; real-hardware run is binding)* |
| Maestro-Android | `maestro test .maestro/discovery-full-gate.yaml` *(Android emulator — closest proxy for real Android; real-hardware run is binding)* |
| E2E-iOS-Real | manual real-iPhone run of the full arc against live Convex dev; capture into `evidence/disc-007/ios/` |
| E2E-Android-Real | manual real-Android run of the full arc against live Convex dev; capture into `evidence/disc-007/android/` |

## Coding Standards

- `AGENTS.md` (stack, commands, directory layout, agent dispatch)
- `RULES.md` (specialist table, platform enforcement, multi-platform policy)
- `convex/_generated/ai/guidelines.md` *(any backend interaction — DISC-007 should NOT modify Convex, only surface backend issues)*
- `brain/docs/TDD-METHODOLOGY.md` (RED → GREEN → REFACTOR — applied here as failing-gate-run → seam-repair → clean-rerun, given `tdd_mode: skipped`)

## Agent Assignment

**Agent:** `react-native-ui-implementer` — This sprint's nominal planner (`react-native-ui-planner`) is non-responsive in this harness per the Sprint 02 record; the project's `RULES.md` specialist table names `react-native-ui-implementer` as the RN implementation specialist, and this capstone is overwhelmingly an RN + Expo + react-native-paper human-surface verification task. The implementer is the agent that will both run the arc on-device and author any seam repairs uncovered (e.g. plan-view routing, chat-to-map plot wiring, save persistence, Apple/Google Maps URL schemes — all RN code). Implementation-tracked throughout as a documented stand-in.

## Evidence Gates

- Per-platform recorded evidence under `evidence/disc-007/{ios,android}/` — screenshots/video of the complete arc, plus a per-run manifest (`platform`, `convex_url`, `timestamp`, `pass/fail`, observed values).
- The Sprint 02 `simulator-rendering-fragility` block status is recorded in the sprint record (`RESOLVED` / `BYPASSED-VIA-REAL-HARDWARE` / `STILL-BLOCKED`).
- All non-gate verification gates green before declaring the sprint complete: TypeCheck, Lint, Test, ConvexHealth (per TC-9).

## Review Criteria

- All 8 ACs satisfied on BOTH real iOS and real Android against live Convex dev — single-platform pass is a sprint-level FAIL (T-DISC-001).
- Every behavioral AC's scenario is observed with the recorded must_observe values; no must_not_observe signature appears in the evidence.
- The Sprint 02 simulator-rendering-fragility block is never papered over — it is either resolved, bypassed via real hardware (with disclosure), or surfaces as a FAIL.
- No WRITE-PROHIBITED change introduced (no Convex schema/functions changes, no mock/stub paths, no scenario weakening).
- Post-gate reflection step 6 (actually ride a discovered road within two weeks) is explicitly NOT required to mark the sprint complete — it is a founder reflection only.

## Dependencies

- **Depends on:**
  - Sprint 01 (all tasks): `DATA-001`, `DATA-002`, `DATA-004`, `DATA-005`, `DATA-008`, `DATA-008b`, `DATA-009`, `DATA-010`, `DATA-011`; `DISC-002`, `DISC-016`, `DISC-017`, `DISC-018`, `DISC-019`, `DISC-020`, `DISC-021`; `OPS-001`; `DESIGN-S01-001` through `DESIGN-S01-007`; `REDHAT-FIX-001` through `REDHAT-FIX-005`
  - Sprint 02 (all tasks): `DATA-003`, `DATA-006`; `DTL-001`; `DESIGN-001` through `DESIGN-004`; `SAVE-001`; `SAVE-002` (maps-handoff platform URL schemes + browser fallback)
  - **PREREQUISITE-GATE:** the Sprint 02 BLOCKED gate (`simulator-rendering-fragility` — app freezes its render surface after any Maestro interaction following `expo run:ios`) must be either `RESOLVED` or explicitly `BYPASSED` via real-hardware runs before DISC-007's iOS gate can be marked PASS. **DISC-007 MUST NOT paper over this block.**
- **Blocks:** None (terminal task — MVP "done" gate).

## Notes

Standing-in planning specialist: `react-native-ui-implementer` (nominal `react-native-ui-planner` non-responsive in this harness per Sprint 02 record — documented). `tdd_mode` is `skipped` under the capstone-verification rationale, NOT `red_first`: no new behavioral spec drives new code — only the integrated human arc is verified against real services. Axis B (`requires_seeded_evidence`) is `true` on every behavioral AC. PRIMARY ACs (AC-1 iOS full arc, AC-2 Android full arc) are BOTH non-negotiable — single-platform pass is a sprint-level FAIL per T-DISC-001. Real hardware is the binding evidence path; simulator/emulator Maestro runs are closest-available proxies with the limitation disclosed. The Sprint 02 `simulator-rendering-fragility` block is named explicitly in AC-1, TC-10, and the prerequisites — it is never silently worked around. Backend (Convex) breakage surfaced during the run is routed to `convex-implementer`, NOT patched in DISC-007 (WRITE-PROHIBITED). Post-gate reflection step 6 (actually ride a discovered road within two weeks) is explicitly NOT required to mark the sprint complete — it is a founder reflection only.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "DISC-007",
  "tdd_mode": "skipped",
  "tdd_mode_rationale": "Capstone verification task — no new code is authored; DISC-007 verifies/repairs seams already implemented across Sprint 01 (DATA/DISC/OPS/DESIGN) and Sprint 02 (DTL-001, SAVE-001/002, DESIGN-001..004). The RED phase IS the gate run itself going red against any broken seam on a real device against live Convex. requires_seeded_evidence stays TRUE on every behavioral AC (Axis B) — each must prove the real-services path with recorded evidence on BOTH platforms. Honest classification: skipped-TDD-by-capstone-rationale, NOT red_first, because there is no new behavioral spec to drive new code — only the integrated human arc to verify.",
  "verification_policy": {
    "requires_tests": false,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "real_ios_device": {
      "description": "real iPhone (or freshly-erased iOS simulator as closest real-device proxy, limitation noted) pointed at live Convex dev deployment quirky-panther-164.convex.cloud, signed in via the E2E auth button, cold-launched to the route plan view",
      "seed_method": "ui_flow",
      "records": [
        "app signed in against live Convex dev quirky-panther-164.convex.cloud",
        "cold-launched to the route plan view (map + chat home)"
      ]
    },
    "real_android_device": {
      "description": "real Android phone (or Android emulator as closest real-device proxy, limitation noted) pointed at live Convex dev deployment quirky-panther-164.convex.cloud, signed in via the E2E auth button, cold-launched to the route plan view",
      "seed_method": "ui_flow",
      "records": [
        "app signed in against live Convex dev quirky-panther-164.convex.cloud",
        "cold-launched to the route plan view (map + chat home)"
      ]
    },
    "android_no_gmaps": {
      "description": "real Android phone with Google Maps uninstalled so Linking.canOpenURL('google.navigation:...') returns false, signed in against live Convex dev",
      "seed_method": "ui_flow",
      "records": [
        "Google Maps uninstalled on Android device",
        "canOpenURL('google.navigation:...') === false"
      ]
    }
  },
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "primary": true, "description": "GIVEN the app is built and run on a real iPhone pointed at live Convex dev, signed in, cold-launched, WHEN the founder completes the full discover-to-ride arc, THEN the entire arc completes on iOS against live Convex with no mocks, opens directly to the plan view (launch route id '(tabs)/index', NOT 'discover'), and Ride It hands off to Apple Maps (URL host 'maps.apple.com').", "verify": "maestro test .maestro/discovery-full-gate.yaml (iOS) + manual real-iPhone run; evidence in evidence/disc-007/ios/", "maps_to_ac": null },
    { "id": "AC-2", "type": "acceptance_criterion", "primary": true, "description": "GIVEN the app is built and run on a real Android phone pointed at live Convex dev, signed in, cold-launched, WHEN the founder completes the identical full discover-to-ride arc on Android, THEN the entire arc completes on Android against live Convex with no mocks and Ride It hands off to Google Maps (scheme 'google.navigation:' or browser fallback 'maps.google.com' per AC-7).", "verify": "maestro test .maestro/discovery-full-gate.yaml (Android) + manual real-Android run; evidence in evidence/disc-007/android/", "maps_to_ac": null },
    { "id": "AC-3", "type": "acceptance_criterion", "primary": false, "description": "GIVEN the founder is on the plan view on a real iPhone and a real Android phone against live Convex dev with no route plotted, WHEN the founder chats a state-scoped request (e.g. 'scenic roads in North Carolina'), THEN >=1 curated route located in the named state (state field 'NC' or 'North Carolina') is returned as a chat route-card AND the latest returned route plots on the map (plotted polyline count == 1) on BOTH platforms.", "verify": "manual run on both real devices; evidence in evidence/disc-007/{platform}/state-scoped/", "maps_to_ac": null },
    { "id": "AC-4", "type": "acceptance_criterion", "primary": false, "description": "GIVEN a route has been previously plotted and the founder is browsing suggestion/chat cards, WHEN the founder taps an earlier curated-route card then taps the re-rendered route, THEN the specific route (route B) re-plots on the map and the detail view opens showing route B's name as headline (not route A's), >=1 score bar with value > 0 (5 bars labeled Twisty/Scenic/Technical/Pavement/Traffic), geometry-or-centroid (1 polyline OR 1 centroid pin), and a conditions block with a non-empty value (temperature in deg F OR literal 'conditions unavailable').", "verify": "manual run on both real devices; evidence in evidence/disc-007/{platform}/card-map-detail/", "maps_to_ac": null },
    { "id": "AC-5", "type": "acceptance_criterion", "primary": false, "description": "GIVEN the founder is viewing a route detail against live Convex dev, WHEN the founder taps Save then fully closes/reopens the app and opens Saved, THEN the route persists (button label transitions to literal 'Saved') and reappears in Saved (row count >= 1, was 0 before save) with no legs/PlanInput crash (error/toast count on reopen == 0).", "verify": "manual run on both real devices; evidence in evidence/disc-007/{platform}/save-reopen/", "maps_to_ac": null },
    { "id": "AC-6", "type": "acceptance_criterion", "primary": false, "description": "GIVEN a saved/open route on a real iPhone against live Convex dev, WHEN the founder taps Ride It, THEN Apple Maps native app opens (frontmost bundle id 'com.apple.Maps') via a URL whose host is 'maps.apple.com' with the route's centroid + name as destination (URL contains 'll=<lat>,<lng>' AND 'q=<route name>').", "verify": "manual real-iPhone run; capture openURL log + screenshot in evidence/disc-007/ios/handoff/", "maps_to_ac": null },
    { "id": "AC-7", "type": "acceptance_criterion", "primary": false, "description": "GIVEN a saved/open route on a real Android phone in two states — Google Maps installed and Google Maps uninstalled (canOpenURL('google.navigation:...') === false), WHEN the founder taps Ride It, THEN (a) Google Maps opens (frontmost package 'com.google.android.apps.maps', scheme 'google.navigation:'/'comgooglemaps:') with centroid + name, AND (b) the browser opens to host 'maps.google.com' with centroid + name as destination (no crash, no dead tap, openURL call count == 1).", "verify": "manual real-Android run in both device states; evidence in evidence/disc-007/android/handoff-{gmaps,browser}/", "maps_to_ac": null },
    { "id": "AC-8", "type": "acceptance_criterion", "primary": false, "description": "GIVEN the app is freshly installed / storage-cleared on a real Android phone against live Convex dev (true cold boot), WHEN the founder completes the full arc from the empty state, THEN the full arc still completes — plan view landing (launch route id '(tabs)/index', NOT 'discover'/'onboarding'), >=5 suggestion cards (count >= 5), >=1 plotted route (plotted polyline count == 1), and a save that persists across cold-boot (Saved row count >= 1, was 0 before save) — proving the SCENARIO 2 cold-boot edge does not regress.", "verify": "maestro test .maestro/discovery-full-gate.yaml (Android, wiped state) + manual fresh-install real-Android run; evidence in evidence/disc-007/android/cold-boot/", "maps_to_ac": null },
    { "id": "TC-1", "type": "test_criterion", "description": "The full discover-to-ride arc completes on a real iOS device against live Convex dev with no mocks, opens directly to the route plan view (launch route id '(tabs)/index'), plots a curated route on card tap (plotted polyline count == 1), opens a detail view with 5 score bars + geometry-or-centroid + conditions, persists a save (button label 'Saved', Saved row count >= 1), reopens it from Saved without crashing (error count == 0), and hands off to Apple Maps (URL host 'maps.apple.com').", "verify": "maestro test .maestro/discovery-full-gate.yaml (iOS) + manual real-iPhone run; evidence in evidence/disc-007/ios/", "maps_to_ac": "AC-1" },
    { "id": "TC-2", "type": "test_criterion", "description": "The full discover-to-ride arc completes on a real Android device against live Convex dev with no mocks, with identical observable behavior to iOS except for the Google Maps handoff.", "verify": "maestro test .maestro/discovery-full-gate.yaml (Android) + manual real-Android run; evidence in evidence/disc-007/android/", "maps_to_ac": "AC-2" },
    { "id": "TC-3", "type": "test_criterion", "description": "A state-scoped chat request returns >=1 curated route-card located in the named state (state field 'NC' or 'North Carolina') and plots the latest returned route on the map (plotted polyline count == 1), on BOTH iOS and Android against live Convex.", "verify": "manual run on both real devices; evidence in evidence/disc-007/{platform}/state-scoped/", "maps_to_ac": "AC-3" },
    { "id": "TC-4", "type": "test_criterion", "description": "Tapping an earlier curated-route card re-renders that specific route on the map (not a previously plotted route), and tapping it opens a detail whose values match that specific route (headline == route B's name, >=1 score bar with value > 0).", "verify": "manual run on both real devices; evidence in evidence/disc-007/{platform}/card-map-detail/", "maps_to_ac": "AC-4" },
    { "id": "TC-5", "type": "test_criterion", "description": "Saving a route persists it (button label transitions to 'Saved') and the saved route reappears in Saved after a full app kill and cold reopen (row count >= 1) with no legs/PlanInput crash (error count == 0), on BOTH platforms.", "verify": "manual run on both real devices; evidence in evidence/disc-007/{platform}/save-reopen/", "maps_to_ac": "AC-5" },
    { "id": "TC-6", "type": "test_criterion", "description": "Tapping Ride It on iOS opens Apple Maps (frontmost bundle id 'com.apple.Maps') via a URL whose host is 'maps.apple.com' with the route's centroid + name as destination (URL contains 'll=' and 'q=').", "verify": "manual real-iPhone run; capture openURL log + screenshot in evidence/disc-007/ios/handoff/", "maps_to_ac": "AC-6" },
    { "id": "TC-7", "type": "test_criterion", "description": "Tapping Ride It on Android opens Google Maps (frontmost package 'com.google.android.apps.maps', scheme 'google.navigation:'/'comgooglemaps:') when installed, AND opens the browser to host 'maps.google.com' with the route's centroid + name as destination when Google Maps is unavailable (no crash, no dead tap, openURL call count == 1).", "verify": "manual real-Android run in both device states; evidence in evidence/disc-007/android/handoff-{gmaps,browser}/", "maps_to_ac": "AC-7" },
    { "id": "TC-8", "type": "test_criterion", "description": "After a fresh install / storage-clear cold boot on Android, the full arc still completes against live Convex dev with >=5 suggestion cards, >=1 plotted route, and a save that persists across the cold-boot run (Saved row count >= 1 on reopen).", "verify": "maestro test .maestro/discovery-full-gate.yaml (Android, wiped state) + manual fresh-install real-Android run; evidence in evidence/disc-007/android/cold-boot/", "maps_to_ac": "AC-8" },
    { "id": "TC-9", "type": "test_criterion", "description": "All non-gate verification gates pass before declaring the sprint complete: pnpm type-check, pnpm lint, pnpm test, and the Convex health integration test all exit 0.", "verify": "pnpm type-check && pnpm lint && pnpm test && pnpm vitest run scripts/__tests__/check-convex-health.integration.test.ts", "maps_to_ac": "AC-1" },
    { "id": "TC-10", "type": "test_criterion", "description": "The Sprint 02 simulator-rendering-fragility block status is explicitly recorded as RESOLVED, BYPASSED-VIA-REAL-HARDWARE, or STILL-BLOCKED — and if STILL-BLOCKED on the iOS-simulator path, the real-hardware iOS run (AC-1) is the binding evidence and the limitation is disclosed in the evidence manifest.", "verify": "manual; documented in sprint record + evidence/disc-007/manifest.json", "maps_to_ac": "AC-1" }
  ]
}
-->
