# New Compositions Needed — Sprint 2 Delta Input

**Generated:** 2026-04-17
**Source:** UI Composition audit across UC files `09–16`
**Next step:** Run `/kb-sprint-plan .spec/prds/native-rewrite/README.md --delta-replan` and feed the **Tier A** list below as NEW compositions.

---

## Summary

| Source UC File | UCs Audited | New Compositions Flagged |
|---|---|---|
| 09-uc-navigation.md (NAV) | 8 | 9 |
| 10-uc-ride-recording.md (REC) | 7 | 2 |
| 11-uc-offline.md (OFFL) | 9 | 3 |
| 12-uc-chat-planning.md (CHAT) | 8 | 2 |
| 13-uc-voice-assistant.md (VOICE) | 8 | 2 |
| 14-uc-route-comparison.md (COMP) | 6 | 3 |
| 15-uc-ride-flow.md (FLOW) | 11 | 7 |
| 16-uc-gatekeeper.md (GATE) | 8 | 6 |
| **Total** | **65** | **34** |

---

## Tier A — Net-new UI components (recommended for Sprint 2 delta)

These are components that genuinely require new code — new atomic primitives, new visualizations, or domain-specific compositions that cannot be expressed by combining existing 08a components without introducing significant duplication in feature sprints.

| Proposed Name | Level | From UC | Rationale |
|---|---|---|---|
| `VoiceListeningVisualizer` | atom | UC-VOICE-02 | Real-time audio amplitude waveform. `Progress` + `TypingIndicator` cannot express continuous mic level. |
| `Speedometer` | molecule | UC-NAV-04 | Radial speed gauge with speed-limit color state machine. No existing gauge primitive. |
| `TurnInstructionCard` | molecule | UC-NAV-02, UC-FLOW-06 | Maneuver icon + street + distance + lane guidance. Consolidates `TurnInstructionBanner` from FLOW-06. |
| `BoundingBoxOverlay` | molecule | UC-OFFL-02 | Interactive region-selection polygon on map. Different from route polylines. |
| `RegionBoundsPreview` | molecule | UC-OFFL-01 | Static region thumbnail (map-bounds snapshot). Different from `RouteThumbnail`. |
| `PlatformNotificationTemplate` | molecule | UC-NAV-07, UC-OFFL-09 | Cross-platform OS notification template (Android foreground service + iOS background task). Consolidates `NavigationNotification` + `BackgroundDownloadNotification`. |
| `ElevationProfileChart` | organism | UC-COMP-04 | Native chart (Vico on Android, Swift Charts on iOS) with grade-colored segments + crosshair. No chart primitive in 08a. |
| `CompletionSummaryCard` | organism | UC-REC-05, UC-NAV-06, UC-FLOW-08 | Post-ride summary hero (metrics + curvature + polyline preview + save/discard CTAs). Consolidates `RideCompletionScreen` + `RideSummaryScreen` use cases. |
| `RideShareSheet` | organism | UC-REC-06 | Ride-context share sheet (GPX/link/summary variants). Different from generic share. |
| `GatekeeperUpgradePrompt` | organism | UC-GATE-03, UC-GATE-08 | Paywall modal with tier cards + benefits + CTAs + offline variant. |
| `RideCompletionScreen` | screen | UC-NAV-06, UC-FLOW-08 | Full completion flow composing `CompletionSummaryCard`. |

**Tier A total: 11 compositions × 2 platforms = 22 new Sprint 2 delta tasks.**

---

## Tier B — Compositional patterns (recommended NOT for Sprint 2 delta)

These can be expressed by composing existing 08a atoms/molecules in feature-sprint tasks. Document as patterns in the consuming UC, skip adding to the catalog.

| Proposed Name | Level | From UC | Existing components that cover it |
|---|---|---|---|
| `GpsAcquisitionOverlay` | molecule | UC-NAV-01 | `EmptyState` + `Progress` + `Button` |
| `NavigationErrorDialog` | molecule | UC-NAV-08 | `DeleteConfirmationDialog` pattern or `Banner` + `Button` |
| `ReroutingFailureDialog` | molecule | UC-NAV-03 | Same as above — generic alert dialog pattern |
| `NavigationMetricsBar` | molecule | UC-NAV-04 | `StatRow` row + `OverlayPill` |
| `OptimisticMessageBubble` | molecule | UC-CHAT-02 | `Card` with pending-state variant (`Skeleton` loading fallback) |
| `ChatSearchResultItem` | molecule | UC-CHAT-06 | `Card` + `Badge` + highlighted `ThemedText` |
| `AudioQualityMeter` | molecule | UC-VOICE-07 | `Progress` + `Badge` composition |
| `MetricGrid` | molecule | UC-COMP-02 | Layout pattern using `StatRow` cells with color-coded variants |
| `RouteDeltaRow` | molecule | UC-COMP-06 | `StatRow` with delta icon variant + sign formatting |
| `SubscriptionTierCard` | molecule | UC-GATE-03 | `Card` + `Badge` + `Button` |
| `TrialCountIndicator` | molecule | UC-GATE-01 | `Badge` with store-bound text |
| `PurchaseVerificationOverlay` | molecule | UC-GATE-04 | `Progress` + `Banner` + existing overlay pattern |
| `RecordingStatusIndicator` | molecule | UC-FLOW-07 | `Badge` + `StatRow` in status bar |
| `SessionResetAlert` | molecule | UC-FLOW-10 | `Banner` + `ErrorToast` / platform alert |
| `SubscriptionSettingsSection` | organism | UC-GATE-05 | Parallel of existing `FavoriteRoadsSection` pattern — composition, not new component |
| `NavigationStartScreen` | screen | UC-NAV-01 | `MapViewWrapper` + navigation template — no net-new screen composition |

**Tier B total: 16 compositional patterns — documented in UC files, no Sprint 2 delta tasks.**

---

## Tier C — State infrastructure (not UI components)

These are architectural concerns, not UI library entries. Document in `17-state-convex-architecture.md`, not in `08a`.

| Proposed Name | Level | From UC | Notes |
|---|---|---|---|
| `RideFlowStateProvider` | template (state) | UC-FLOW-01 | State/dispatch context; architectural, not visual. |
| `SubscriptionGatekeeperProvider` | template (state) | UC-GATE-02 | Parallels existing `ModelGatekeeperProvider` — is that one in 08a? If yes, mirror it. |
| `HydrationGate` | template (state) | UC-FLOW-09 | Suspense gate during state rehydration. State management pattern. |
| `RideFlowNavigator` | template (state) | UC-FLOW-11 | State→navigation observer. Routing/state pattern. |

**Tier C total: 4 state infrastructure items — add to `17-state-convex-architecture.md`, not Sprint 2.**

---

## Recommended Sprint 2 delta input

For the `/kb-sprint-plan --delta-replan` run, feed only the **Tier A** list (11 compositions). This expands Sprint 2 by ~22 tasks (dual iOS/Android). Existing 63 Sprint-2 tasks remain UNCHANGED; only new tasks are appended in the delta.

Suggested task-ID sequence for the delta:
- UI-064/065: Android/iOS — `VoiceListeningVisualizer` (atom)
- UI-066/067: Android/iOS — `Speedometer` (molecule)
- UI-068/069: Android/iOS — `TurnInstructionCard` (molecule)
- UI-070/071: Android/iOS — `BoundingBoxOverlay` (molecule)
- UI-072/073: Android/iOS — `RegionBoundsPreview` (molecule)
- UI-074/075: Android/iOS — `PlatformNotificationTemplate` (molecule) — platform-specific variants
- UI-076/077: Android/iOS — `ElevationProfileChart` (organism)
- UI-078/079: Android/iOS — `CompletionSummaryCard` (organism)
- UI-080/081: Android/iOS — `RideShareSheet` (organism)
- UI-082/083: Android/iOS — `GatekeeperUpgradePrompt` (organism)
- UI-084/085: Android/iOS — `RideCompletionScreen` (screen)

**Sprint 2 total after delta: 85 tasks (63 original + 22 delta).**

---

## Open questions for user review

1. **Tier A/B boundary** — Are any Tier B items worth promoting to Tier A? Specifically:
   - `MetricGrid` — UC-COMP-02 spec calls for a grid with rank color coding (best/middle/worst). Pure composition or worth a dedicated catalog entry?
   - `SubscriptionTierCard` — appears only in one UC (UC-GATE-03) but is a distinctive pattern. Catalog entry or Tier B?
   - `OptimisticMessageBubble` — chat has many message types. Worth a catalog entry for consistency across chat platforms?

2. **Platform notification** — iOS and Android notification UI are platform-specific and typically not in the component catalog. Should `PlatformNotificationTemplate` live in the catalog or a separate "platform infrastructure" doc?

3. **Tier C items** — these should be documented somewhere. `17-state-convex-architecture.md` or a new `18-state-infrastructure.md`?

4. **Existing `ModelGatekeeperProvider`** in 08a — verify it exists; if so, mirror the pattern for `SubscriptionGatekeeperProvider`.

---

## Files modified in Edit 1 (UC annotations)

- `09-uc-navigation.md` — 8 UCs annotated
- `10-uc-ride-recording.md` — 7 UCs annotated
- `11-uc-offline.md` — 9 UCs annotated
- `12-uc-chat-planning.md` — 8 UCs annotated
- `13-uc-voice-assistant.md` — 8 UCs annotated
- `14-uc-route-comparison.md` — 6 UCs annotated
- `15-uc-ride-flow.md` — 11 UCs annotated (had initial clobber error, repaired)
- `16-uc-gatekeeper.md` — 8 UCs annotated
