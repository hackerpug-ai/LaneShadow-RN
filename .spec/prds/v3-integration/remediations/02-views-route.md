# Design Review: route-results-screen + route-details-screen
**Reviewer**: frontend-designer Agent B
**Date**: 2026-04-27

---

## Summary

- RouteResults gaps: 3 HIGH, 4 MED, 2 LOW
- RouteDetails gaps: 3 HIGH, 3 MED, 2 LOW
- **Overall verdict**: Both screens share a common root problem — the native sandbox story sets present a single static variant each while the design specifies 7 (RouteResults) and 6 (RouteDetails) variants covering dark mode, interactive state changes (alt-selected, refining, dismissed, medium/dismissing detent, saved toast), and edge-case compositions. Beyond story coverage, the most visually damaging gaps are: (1) the polyline animation architecture differs between platforms in a way that will produce visible frame-rate problems on Android; (2) the refining state (S04) with its warm scrim, primer chips, send-button reveal, and auto-dismiss of the NavigatorMessage is entirely absent on both platforms; (3) the saved-state toggle (V01) with toast confirmation and Save-button flip is unimplemented; (4) Android `RouteDetailsScreen` passes `emptyList()` for polyline coordinates, guaranteeing a blank map.

---

## View: route-results-screen

### Designed inventory

| ID | Story | Key visual |
|----|-------|-----------|
| S01 | Default · Best Pre-selected · Light | 3 polylines, NavMessage pinned, card 1 copper-selected + Best badge |
| S02 | Alt1 Tapped · Sage Promoted · Light | Alt1 card selected; sage polyline promoted; compass chip re-tints |
| S03 | Default · Dark | Ink map; copper outer glow on best polyline |
| S04 | Refining | Chat active; warm scrim; routes dim to 40%; NavMessage dismissed; 3 primer chips; copper send button |
| V01 | Two Candidates | 2 polylines + 2 cards |
| V02 | Weather Divergent | Per-card weather badges; storm hatching on map quadrant |
| V03 | Message Dismissed | Recall glass chip parked at message position |

### Native inventory

**iOS** (`RouteResultsScreenStory.swift`): 1 story — `templates.route-results.default`
**Android** (`RouteResultsScreenStory.kt`): 3 stories — `default`, `empty`, `overflow`

### Gaps — route-results-screen

#### Gap A1-01: Missing S02 Alt-Selection story and state
- **Severity**: HIGH
- **Designed reference**: README S02 + HTML `.view-route-results-screen__rt-card--selected-alt1` with `color-mix(var(--surface-card) 92%, var(--route-alt1))`
- **iOS file**: `RouteResultsScreenStory.swift` (no alt story); `RouteResultsScreen.swift` lines 95–98 (selectedRouteId never mutated)
- **Android file**: `RouteResultsScreenStory.kt` lines 15–43; `RouteResultsScreen.kt` lines 80–91 (variant assigned by index, not selection)
- **Remediation**: Add `onRouteCardTap` handler updating `selectedRouteId`; derive polyline stroke style from selection; add S02 story.
- **Effort**: iOS=M, Android=M

#### Gap A1-02: Missing S04 Refining state (entire interaction path absent)
- **Severity**: HIGH
- **Designed reference**: HTML lines 567–595 — refine-primers + refine-scrim at `var(--surface-scrim-soft)`
- **Remediation**: Add `isRefining` flag toggled on chat focus; conditionally render scrim at z-index 11 with `var(--surface-scrim-soft)`; dim polylines to 40%; auto-dismiss NavMessage; render primer chip row (3 glass chips).
- **Effort**: iOS=L, Android=L

#### Gap A1-03: Missing V03 Recall chip (dismissed Navigator message)
- **Severity**: MED
- **Designed reference**: HTML lines 598–615 — pill-shaped glass chip at `top: 108px; right: var(--space-4)`
- **Remediation**: Add `isMessageDismissed` state; when true, hide `LSNavigatorMessage` and show Recall glass pill at top-overlay position.
- **Effort**: iOS=M, Android=M

#### Gap A1-04: Dark mode story absent (S03)
- **Severity**: MED
- **Remediation**: Add `templates.route-results.dark` story with `.preferredColorScheme(.dark)` / `LaneShadowTheme(darkTheme = true)`.
- **Effort**: iOS=S, Android=S

#### Gap A1-05: Polyline animation architecture diverges (Android stutter risk)
- **Severity**: MED
- **iOS file**: `RouteResultsScreen.swift` lines 141–167 — `withAnimation(.timingCurve)` (correct)
- **Android file**: `RouteResultsScreen.kt` lines 99–113 — manual `repeat(steps)` with `delay(20ms)` coroutine loop (will stutter under composition load)
- **Remediation**: Android — replace manual loop with `Animatable(0f).animateTo(1f, animationSpec = tween(600, FastOutSlowInEasing))` + `delay(index * 120L)` stagger.
- **Effort**: Android=M

#### Gap B1-06: V02 Weather-Divergent variant + storm-hatch map layer absent
- **Severity**: MED
- **Remediation**: Add `weatherDivergent` mock with per-route weather conditions; add storm-hatch SVG/shader overlay slot.
- **Effort**: iOS=M, Android=M

#### Gap H1-07: Route card tap not connected on iOS
- **Severity**: LOW
- **iOS file**: `RouteResultsScreen.swift` lines 182–205 — `LSNavigatorMessage` receives `attachments:` but no `onCardTap` callback
- **Remediation**: Add `onRouteCardTap` to component signature; thread through `LSNavigatorMessage` → tap handler.
- **Effort**: iOS=S

#### Gap G1-08: iOS chat input has duplicated `.padding` + `.accessibilityIdentifier`
- **Severity**: LOW
- **iOS file**: `RouteResultsScreen.swift` lines 247–251 — both modifiers stack twice (resulting in 2× horizontal padding)
- **Remediation**: Remove duplicates.
- **Effort**: iOS=S

---

## View: route-details-screen

### Designed inventory

| ID | Story | Key visual |
|----|-------|-----------|
| S01 | Default · Large Detent · Light | 4-col instrument; 6 clear cells; outline Save + copper Ride this |
| S02 | Mixed Weather · Light | clear→wind→rain cells; italic narration |
| S03 | Default · Dark | Ink substrate; bloom; night-moon cells |
| S04 | Medium Detent · Light | Sheet pulled down; weather collapses |
| S05 | Dismissing · Light | Sheet near-collapsed; copper stripe flashes on top edge |
| V01 | Saved State · Light | Toast with copper check; Save button flips; "Saved" pill |

### Native inventory

**iOS** (`RouteDetailsScreenStory.swift`): 2 stories — `default`, `mixed-weather` (mixed-weather story has wiring bug)
**Android** (`RouteDetailsScreenStory.kt`): 3 stories — `default`, `mixed-weather`, `alt-route`

### Gaps — route-details-screen

#### Gap A2-01: Android `RouteDetailsScreen` passes `emptyList()` for polyline coordinates
- **Severity**: HIGH (blank map)
- **Android file**: `RouteDetailsScreen.kt` lines 88–98 — `PolylineData(coordinates = emptyList(), ...)` with comment "Mock data doesn't have real coordinates"
- **Remediation**: Decode `state.route.polyline` using `PolylineDecoder.decodeOrNull()` (already imported in `RouteResultsScreen.kt:32`); pass result as `coordinates`.
- **Effort**: Android=S

#### Gap A2-02: iOS mixed-weather story does not load `mixedWeather` variant
- **Severity**: HIGH
- **iOS file**: `RouteDetailsScreenStory.swift` lines 22–28 — `RouteDetailsScreen(provider: RouteDetailsMockProvider.self)` no variant arg → defaults to "default"
- **Remediation**: Either create a `MixedWeatherRouteDetailsMockProvider` subclass OR add `variant: String` parameter to `RouteDetailsScreen.init` matching Android.
- **Effort**: iOS=S

#### Gap A2-03: V01 Saved-state story and toast absent on both platforms
- **Severity**: HIGH
- **Designed reference**: HTML lines 553–583 — toast with `var(--surface-glass)` + `var(--signal-tint)` border + copper left stripe; Save button flips to saved variant; "Saved" pill beside best badge
- **Remediation**: Add `isSaved` state; pass to `LSRouteSheet`; toggle on `onSave`; render toast overlay.
- **Effort**: iOS=M, Android=M

#### Gap A2-04: S03/S04/S05 stories absent (dark, medium detent, dismissing)
- **Severity**: MED
- **Remediation**: Add 3 stories: `dark`, `medium-detent`, `dismissing`. The `BottomSheetSpec` already accepts `detent:` — just supply `.medium`/`.dismissing` values.
- **Effort**: iOS=S, Android=S

#### Gap F2-05: Dismissing copper stripe flash not implemented
- **Severity**: MED
- **Designed reference**: HTML lines 601–622 — `::before` pseudo-element with copper gradient at `var(--stroke-lg)` height
- **Remediation**: Screen-level — add dismissing story. Organism-level — `LSRouteSheet` needs drag-progress prop; overlay copper stripe gradient when `dragProgress > mediumDetentThreshold`.
- **Effort**: iOS=S, Android=S (story only; organism work flagged to E)

#### Gap H2-06: Save button `aria-pressed` / saved-state accessibility not modelled
- **Severity**: MED
- **Remediation**: Subsumed by A2-03 — `isSaved` state at screen level.
- **Effort**: iOS=S, Android=S

#### Gap D2-07: Scenic dot tokens (organism-level)
- **Severity**: LOW
- **Remediation**: Agent E confirms `LSRouteCard`/`LSRouteSheet` scenic dots use `var(--signal-default)` and `var(--border-strong)`.
- **Effort**: deferred to Agent E

#### Gap G2-08: Android `LSRouteSheet.timeRange` not passed
- **Severity**: LOW
- **Android file**: `RouteDetailsScreen.kt` lines 113–123 — `LSRouteSheet(...)` call has no `timeRange` argument
- **Remediation**: Add `timeRange: Pair<String, String>?` to `RouteDetailsScreenState`; derive from first/last `WeatherTimelineEntry.hour` values; pass to `LSRouteSheet`.
- **Effort**: Android=S

---

## Top-Priority Remediations

1. **A2-01 — Android blank map** (Android=S): Decode `polyline` field
2. **A1-02 — Refining state / S04** (iOS=L, Android=L): Core refinement UX
3. **A2-03 + H2-06 — Saved state / V01** (iOS=M, Android=M): Post-commitment microinteraction
4. **A1-01 — Alt-selection state / S02** (iOS=M, Android=M): Card tap → polyline re-promotion
5. **A2-02 — iOS mixed-weather story wiring** (iOS=S): One-line story bug
6. **A1-03 — Recall chip after message dismiss** (iOS=M, Android=M)
7. **A1-04 + A2-04 — Dark mode + detent stories** (iOS=S, Android=S each)
8. **A1-05 — Android polyline animation architecture** (Android=M)
9. **G1-08 — iOS double padding on chat input** (iOS=S)
10. **G2-08 — Android `timeRange` missing from state** (Android=S)
