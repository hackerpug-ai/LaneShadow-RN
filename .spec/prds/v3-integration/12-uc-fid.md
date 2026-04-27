---
stability: FEATURE_SPEC
last_validated: 2026-04-27
prd_version: 1.2.0
functional_group: FID
---

# Use Cases: Design Fidelity (FID)

| ID | Title | Description |
|----|-------|-------------|
| UC-FID-01 | Achieve V2 design-system fidelity across all native components | Close all 98 catalogued design gaps so iOS + Android match `.spec/design/system/` authoritative HTML/PNG specs across 6 views, 7 organisms, sandbox story coverage, motion recipes, and build blockers |

---

## UC-FID-01: Achieve V2 design-system fidelity across all native components

This is an umbrella remediation use case that scopes every design-fidelity gap surfaced by the 5-agent frontend-designer review (see `remediations/00-summary.md` and the 5 detailed reports `remediations/01..05*.md`). Across iOS (Swift/SwiftUI) and Android (Kotlin/Compose), the V2 native components diverge from the authoritative HTML/PNG/README design system in 98 catalogued ways spanning typography, map slot rendering, container construction, semantic tokens, motion recipes, sandbox story coverage, missing variants, and Android build blockers.

The single output of this UC is: **a native sandbox in which every story renders pixel-comparable to its HTML/PNG counterpart in `.spec/design/system/views/` and `/organisms/`, on both light and dark themes, on both iOS and Android, with cross-platform parity verified by `pnpm snapshots:check`.**

- **Maps to**: All 6 V2 Navigator screens (IdleScreen, PlanningScreen, RouteResultsScreen, RouteDetailsScreen, SessionsScreen, ErrorScreen) + all 7 V2 organisms (map-layer, topbar-navbar, sessions-drawer, navigator-callouts, route-sheet, route-card, section-header) + sandbox infrastructure (story registries, mock providers, snapshot tests on both platforms).
- **Backend**: None (pure UI remediation — no Convex changes).
- **Effort estimate**: ~206h iOS + ~154h Android + ~32h shared = ~6 weeks of one-implementer work on each platform, parallelizable across V3 integration sprints.
- **Severity rollup**: 36 HIGH (visually distorted today) + 42 MED (missing variants/wrong tokens) + 20 LOW (polish).
- **Cut authority** (per HUMAN SIGNAL #4): Android-side remediations are first-cut candidates per the V3 cut sequence; iOS path always ships.

### Acceptance Criteria

The criteria below are organized by component (views first, then organisms, then cross-cutting). Each AC closes one or more catalogued gaps. Gap IDs reference the per-component reports in `remediations/`.

#### IdleScreen (V2)

- ☐ User can view IdleScreen on iOS with the greeting headline rendered in Newsreader opinion-xl typography (currently `theme.type.heading.md.font` — Geist UI sans) [Gap E-01]
- ☐ User can view IdleScreen on iOS with the greeting meta row ("FRIDAY · 68°F · CLEAR") rendered in `theme.colors.signal.default` copper (currently `theme.colors.onSurface.default`) [Gap D-01]
- ☐ User can view IdleScreen on iOS with the greeting headline emphasis word rendered as an inline `AttributedString` reflowing across line breaks (currently HStack-of-Text word-split risks word-wrap break) [Gap H-01]
- ☐ User can view IdleScreen on iOS with the map slot rendering a `theme.colors.map.paper` substrate plus SVG contour overlays at `map.contour` (0.9pt) and `map.contourFaint` (0.7pt) plus absolute-positioned favorite pin dots (currently `LinearGradient` placeholder + `Text("Map Layer")`) [Gap B-01]
- ☐ User can view IdleScreen on Android with absolute-positioned favorite pin dot composables overlaying the live LSMap, using `theme.colors.signal.default` fill, `surface.card` border, `theme.shadows.chrome` [Gap B-01]
- ☐ User can view IdleScreen on both platforms with greeting meta separator dots rendered as styled `Circle` atoms at `space.1` diameter, opacity 0.6 (currently single string with `·` character) [Gap G-01]
- ☐ User can view all 7 designed IdleScreen variants (S01 default, S02 typing-send, S03 dark, S04 filter sheet, V01 no-location, V02 first-ride, V03 weather-advisory) registered as named sandbox stories on both platforms (currently iOS=1, Android=4 stress tests) [Gap A-01]
- ☐ User can view IdleScreen S02 typing-send state with a primed copper-tinted chip and the trailing slot swapped from filter button to copper send button on both platforms [Gap B-02]
- ☐ User can view IdleScreen S04 filter sheet rendered as `LSBottomSheet` overlay with "Refine the ask" title + "Duration" + "Avoid" filter chip groups + Apply/Cancel actions on both platforms [Gap B-03]
- ☐ User can view IdleScreen V01 no-location state with a copper-bordered "Tap to set start" pill (`signal.tint` border, `signal.whisper` background) and chat input at `theme.opacity.disabled` on both platforms [Gap B-04]
- ☐ User can view IdleScreen V02 first-ride state with no favorite pins on the map and onboarding suggestion chips ("Short & scenic", "Learn the roads", etc.) on both platforms [Gap B-05]
- ☐ User can view IdleScreen V03 weather-advisory state with the meta row in `status.warning` color and an advisory card below the headline at `wx.rainTint` background with `wx.rain` left border stripe and italic Newsreader body on both platforms [Gap B-06]
- ☐ User can view IdleScreen suggestion chip row scrolling horizontally without clipping using `ScrollView(.horizontal)` (iOS) / `LazyRow` (Android) [Gap H-02]

#### PlanningScreen (V2)

- ☐ User can view PlanningScreen sketch polyline animating at 1400ms with linear easing on both platforms (currently 600ms with cubic-bezier on iOS, 600ms linear on Android — both >2× too fast) [Gap F-01]
- ☐ User can view PlanningScreen leading head-dot breathing at 1400ms ease-in-out reverse animation on both platforms (currently 400ms iOS / missing Android) [Gap F-02]
- ☐ User can view PlanningScreen on Android with the `LSPhaseIndicator` header passed an italic Newsreader opinion-sm string per active phase ("Let me think on that…", "Three loops are forming…", etc.) (currently no `header` parameter passed) [Gap G-02]
- ☐ User can view PlanningScreen S03 weather-check state with the sketch polyline dimmed to 0.55 opacity and two floating weather-condition badge dots overlaid (clear at 44%/42%, wind at 70%/36%) on both platforms [Gap C-01]
- ☐ User can view PlanningScreen S04 scoring state with three concurrent candidate polylines drawn at `route.best`/`route.alt1`/`route.alt2` colors at 0.9/0.55/0.45 opacities respectively on both platforms [Gap C-02]
- ☐ User can view PlanningScreen V01 slow-planning state with an italic apology note in `content.tertiary` color appearing below the phase indicator with a dashed border above on both platforms [Gap A-03]
- ☐ User can view PlanningScreen V02 cancel-confirm state with the phase card at `theme.opacity.disabled`, a scrim at `surface.scrim`, and a centered confirm sheet with "Cancel this plan?" + Keep/Cancel actions on both platforms [Gap A-03]
- ☐ User can view PlanningScreen V03 single-candidate state with `LSPhaseIndicator` border-top in `status.warning` and the compass chip background at warning tint on both platforms [Gap A-03]
- ☐ User can view all phase walkthrough stories (S01 phase1 scouting, S02 phase2 drawing, S03 phase3 weather, S04 phase4 scoring dark) registered as named sandbox stories on Android (currently only `default`/`empty`/`overflow`/`long-copy`) [Gap A-02]
- ☐ User can view PlanningScreen on iOS in dark mode with the map slot resolving `theme.colors.map.paper` to the dark ink substrate after the IdleScreen map fix lands [Gap D-03]
- ☐ User can view PlanningScreen with `LSChatInput` in `is-thinking` state hiding the location bar and suggestion row on both platforms (verify on simulator) [Gap H-03]

#### RouteResultsScreen (V2)

- ☐ User can tap any route attachment card on RouteResultsScreen to update `selectedRouteId` and re-promote that route's polyline from dashed to solid + re-tint the card border with the variant's color (`route.best`/`route.alt1`/`route.alt2`) on both platforms [Gap A1-01]
- ☐ User can view RouteResultsScreen S04 refining state with a warm scrim at `surface.scrim-soft`, polylines dimmed to 40% opacity, the `LSNavigatorMessage` auto-dismissed, three refine primer chips above the chat input ("make it shorter", "avoid Hwy 1", etc.), and a copper send button revealed on both platforms [Gap A1-02]
- ☐ User can view RouteResultsScreen V03 dismissed-message state with the `LSNavigatorMessage` hidden and a "Recall" glass pill (`surface.glass` + `border.glass` + `backdrop-filter blur(14px)`) parked at the message position; tapping Recall restores the message on both platforms [Gap A1-03]
- ☐ User can view RouteResultsScreen S03 dark mode story registered as `templates.route-results.dark` with the system color scheme set to dark on both platforms [Gap A1-04]
- ☐ User can view RouteResultsScreen on Android with the staggered polyline draw-on animation driven by `Animatable.animateTo()` with 120ms stagger (currently a manual `repeat(steps)` coroutine frame loop that stutters under composition load) [Gap A1-05]
- ☐ User can view RouteResultsScreen V02 weather-divergent state with per-card weather badges (clear/clear/rain) and storm-hatch SVG overlay on the affected map quadrant on both platforms [Gap B1-06]
- ☐ User can view RouteResultsScreen on iOS with `LSNavigatorMessage` accepting an `onRouteCardTap: (String) -> Void` callback and threading taps to the `selectedRouteId` mutator (currently no card-tap handler in component signature) [Gap H1-07]
- ☐ User can view RouteResultsScreen chat input on iOS without duplicate `.padding(.horizontal, theme.space.md)` and `.accessibilityIdentifier(...)` modifier applications stacking (currently both apply twice) [Gap G1-08]

#### RouteDetailsScreen (V2)

- ☐ User can view RouteDetailsScreen on Android with a real polyline rendered, decoded from `state.route.polyline` via `PolylineDecoder.decodeOrNull()` (currently `emptyList()` produces a blank map) [Gap A2-01]
- ☐ User can view RouteDetailsScreen on iOS with the mixed-weather story actually loading the `mixedWeather` mock variant (currently the story instantiates `RouteDetailsScreen(provider:)` with no variant arg, defaulting to `default`) [Gap A2-02]
- ☐ User can save a route from RouteDetailsScreen and see a glass + copper-stripe toast slide in at the top, the Save button flip to the saved variant (`signal.tint` border, `signal.whisper` background, `signal.default` text), and a "Saved" pill appear beside the best badge on both platforms [Gap A2-03, H2-06]
- ☐ User can view all 6 designed RouteDetailsScreen variants (S01 default, S02 mixed-weather, S03 dark, S04 medium detent, S05 dismissing, V01 saved) registered as sandbox stories on both platforms (currently iOS=2 with bug, Android=3) [Gap A2-04]
- ☐ User can drag the `LSRouteSheet` toward dismiss past the medium detent and see a copper top-edge stripe gradient flash (linear-gradient transparent → `signal.default` → transparent at `stroke.lg` height, opacity 0.85) on both platforms [Gap F2-05]
- ☐ User can view RouteDetailsScreen on Android with the weather timeline header showing the actual time range derived from `weatherTimeline` data (currently hardcoded `"9am — 3pm"` regardless of fixture) [Gap G2-08]

#### SessionsScreen (V2)

- ☐ User can view all 5 designed SessionsScreen variants (S01 default light, S02 default dark, S03 empty, S04 scrolled, S05 new-confirm) registered as named sandbox stories on both platforms (currently iOS=1, Android=4 missing dark and confirm) [Gap A1-01 sessions]
- ☐ User can tap NEW in the SessionsDrawer with an active session present and see a centered confirm dialog ("Start a new ride?") with `surface-card` background + `surface-scrim` backdrop + opinion-serif headline + Cancel/Start-new actions on both platforms [Gap G1-07]
- ☐ User can view SessionsScreen on Android with scrim taps closing the drawer visually via a `drawerOpen` state (currently `DrawerSpec.onDismiss` callback fires but drawer may not visually close) [Gap H1-08]
- ☐ User can view SessionsDrawer animating in with the spec's `sidebarSlideIn` recipe (240ms decelerated easing) on both platforms (currently iOS uses theme motion tokens with possible key-name mismatch; Android uses default Compose animation) [Gap F1-09]
- ☐ User can view SessionsDrawer with sessions grouped into multiple date sections (TONIGHT / TODAY / THIS WEEK / LAST WEEK / EARLIER) with `LSSectionHeader` between groups (currently single static `groupLabel` parameter on both platforms) [Gap A1-10]

#### ErrorScreen (V2)

- ☐ User can view ErrorScreen on iOS with the `LSInlineErrorCallout` body text rendered in Newsreader opinion-md typography (currently `heading.md` proxy with explicit comment "Use heading.md as proxy for opinion.md") [Gap E2-01]
- ☐ User can view ErrorScreen suggestion chips with primary chips styled in warning-amber (background `status.warning.tint`, border `status.warning`, text `status.warning`) and tertiary chips in plain glass (background `surface.glass`, text `content.primary`) on both platforms (currently neither styling is applied — Android uses `ContentColor.Primary`/`Secondary`, iOS uses identical default chip styling for all) [Gap D2-02]
- ☐ User can view ErrorScreen ErrorScreen.kt on Android passing per-chip `isPrimary` flags (not all `true`) so tertiary chips ("Rewrite the ask") render in tertiary styling [Gap D2-02]
- ☐ User can view ErrorScreen with a storm-gate variant when the error is a safety-gate, using `wx.storm` purple for top stripe + compass chip + label + suggestion-chip dashed divider (currently the safety-gate mock data exists in Android but renders identically to warning-amber; iOS has no storm variant in `ErrorMockProvider` at all) [Gap D2-03]
- ☐ User can tap a suggestion chip on ErrorScreen and see the `LSInlineErrorCallout` fade to 0.55 opacity, the chat field populated with the suggestion text, the filter button hidden, and the copper send button revealed on both platforms [Gap G2-04]
- ☐ User can view ErrorScreen V01 offline variant with a wifi-off SVG glyph watermark on the map at `opacity 0.25` in `status.warning` color, the chat input at `opacity 0.7`, and leading/trailing buttons disabled on both platforms (currently iOS has no "network" mock variant, Android has the data but template doesn't render offline UI) [Gap B2-05]
- ☐ User can view ErrorScreen suggestion chip row wrapping to multiple lines via FlowLayout (iOS) / FlowRow (Android) when chip count or label length overflows the callout (currently `HStack`/`Row` clips on both platforms) [Gap H2-06]
- ☐ User can view all 6 designed ErrorScreen variants (S01 default, S02 dark storm-gate, S03 extended impossible, S04 recovered, V01 offline, V02 generic failure) registered as named sandbox stories on iOS (currently 1 story; Android has 6 already) [Gap A2-07]
- ☐ User can view ErrorScreen with a static map preview rendering a broken-segment polyline overlay (dashed `status.error`) and origin/broken-mark/destination pins on both platforms (currently iOS=`LinearGradient`, Android=live interactive Mapbox) [Gap C2-08]
- ☐ User can view ErrorScreen suggestion chip row entering with a `chatOverlayEnter` motion (slide-up + fade) on both platforms (currently appears instantly) [Gap F2-09]

#### LSMapLayer organism

- ☐ User can view top-overlay slot content with 48pt clearance from the screen top (`var(--space-10)`) below the system safe-area inset, exposed via a `topBarClearance` parameter on both platforms (currently both platforms apply only system safe area) [Gap A-01 chrome]
- ☐ User can view bottom-overlay slot content with `theme.space.md` (12pt) horizontal inset on Android (currently no horizontal padding applied at organism level) [Gap A-02 chrome]
- ☐ User can tap the scrim on iOS with the active drawer when present and see the `DrawerSpec.onDismiss` callback fire (currently `LSScrim` has no tap callback; `onDismiss` orphaned) [Gap A-03 chrome]
- ☐ User can view LSMapLayer drawer animating in/out via a `spring(dampingRatio = 0.85, stiffness = StiffnessMedium)` on Android (currently `tween` with `decelerated` cubic-bezier — flat feel vs designed spring) [Gap A-04 chrome]
- ☐ User can pass a `BottomSheetSpec.Detent.small` value on iOS (matching Android's `SheetDetent.Small`) and have the sheet present at the corresponding peek fraction (~0.3) (currently iOS only supports `.medium` and `.large`) [Gap A-05 chrome]

#### LSTopBar / LSNavBar organism

- ☐ User can view the LSTopBar centered title rendered in Newsreader opinion-md typography (`.t-opinion-md`) on both platforms (currently `title.md` Geist 600 — wrong family entirely) [Gap B-01 chrome]
- ☐ User can view LSNavBar with a `filterChips: [FilterChipSpec]?` parameter that, when non-empty, renders a horizontally-scrolling `LSFilterChip` row below the toolbar (currently no filter row variant on either platform) [Gap B-02 chrome]
- ☐ User can view LSNavBar with a `searchSlot: SearchSlotSpec?` parameter that, when non-nil, renders an inset search field (`surface.inset` background, `radius.lg` corners, leading search icon) below the toolbar (currently no search variant on either platform) [Gap B-03 chrome]
- ☐ User can view the record-highlight chip on Android wrapped in `LSGlassPanel` with `status.errorTint` background and `status.error` border (currently bare `Row` with no glass, no border, no error-tint background) [Gap B-04 chrome]
- ☐ User can view the record-highlight dot pulsing infinitely between full and 0.45 opacity over 1400ms ease-in-out on both platforms (currently iOS static `Circle`, Android stub-comment "would be added in production") [Gap B-05 chrome]
- ☐ User can tap the LSTopBar hamburger button with a tap target ≥44pt on iOS (via `.contentShape(Rectangle().size(...))`) / ≥48dp on Android (via `Modifier.minimumTouchTargetSize()`) while keeping the visual chip at 40pt/40dp (currently iOS arithmetic sum of 3 tokens may not equal 40pt; Android hardcodes `40.dp` literal; neither meets accessibility 44pt/48dp tap target) [Gap B-06 chrome]

#### LSSessionsDrawer organism

- ☐ User can view the LSSessionsDrawer container rendered with a solid `theme.colors.surface.card` background plus `--elev-overlay` shadow plus 1pt right-edge separator (currently both platforms wrap in `LSGlassPanel.chrome` — translucent glass that lets map content bleed through) [Gap C-01 chrome]
- ☐ User can view the SessionsDrawer "Rides" header rendered in Newsreader opinion-lg italic typography (`.t-opinion-lg`) on both platforms (currently `title.lg` Geist 600) [Gap C-02 chrome]
- ☐ User can view the SessionsDrawer active-row left stripe rendered at `theme.strokeWidth.lg` (2pt) on both platforms (currently iOS 3pt hardcoded, Android `theme.space.xs` which is the wrong token) [Gap C-03 chrome]
- ☐ User can view the SessionsDrawer active-row background using `theme.colors.signal.whisper` semantic token, which auto-resolves to `copper-100` on light and `rgba(238,124,43,0.12)` on dark (currently both platforms apply raw alpha to `signal.default`, breaking dark mode) [Gap C-04 chrome]
- ☐ User can view each SessionsDrawer session row with a third meta-row line containing a variant-colored dot atom (8pt × 2pt rectangle, copper/alt1/alt2 fill) and a meta label ("Active", "3 routes") on iOS (currently iOS has no third meta row; Android has the label but no variant dot) [Gap C-05 chrome]
- ☐ User can view SessionsDrawer session rows sized to content with token-driven padding (`space.sm` vertical, `space.lg` leading, `space.md` trailing) on iOS (currently fixed `sessionRowHeight: CGFloat = 72`) [Gap C-06 chrome]
- ☐ System compiles `LSSessionsDrawer.kt` on Android successfully — `Session` data class declared inline with fields `(id: String, title: String, whenLabel: String, preview: String, meta: String)` or imported from a shared model package (currently the `Session` type is referenced throughout the file but never declared, blocking compilation) [Gap C-07 chrome]
- ☐ User can pass a `sections: [SessionSection]` parameter (each with `label` + `sessions`) to `LSSessionsDrawer` and see multiple `LSSectionHeader` rows between groups on both platforms (currently single static `groupLabel: String`) [Gap C-08 chrome]
- ☐ User can view the SessionsDrawer trailing edge with a `2px 0 16px rgba(34,24,16,0.14)` directional shadow on light theme and `2px 0 16px rgba(0,0,0,0.60)` on dark on both platforms (currently iOS uses `elevation.level4` which is the wrong elevation tier; Android applies no shadow at all) [Gap D1-06]

#### LSNavigatorMessage / LSInlineErrorCallout organisms

- ☐ User can view LSNavigatorMessage and LSInlineErrorCallout body text on iOS rendered in Newsreader opinion-md typography (currently both use `heading.md` with comment "Use heading.md as proxy for opinion.md") [Gap E1-01]
- ☐ User can view the compass chip in LSNavigatorMessage on iOS constructed via a single `compassChip(accent: .signal)` helper that reads `signal.whisper` directly (currently manual Circle overlays with raw `opacity["20"]!` string-key force-unwrap that risks crash) [Gap E1-02]
- ☐ User can view the compass chip in LSNavigatorMessage on Android with explicit `background = theme.colors.signal.whisper` and `border = theme.colors.signal.tint` (currently bare `LSPill(Sm)` with default surface — no signal-whisper background) [Gap E1-02]
- ☐ User can view LSNavigatorMessage pinned-bar with a 1pt dashed `signal.tint` divider above the pinned indicator on both platforms (currently no separator on either platform) [Gap E1-03]
- ☐ User can view LSNavigatorMessage pinned-indicator dot rendered at full opacity using `theme.colors.signal.default` on Android (currently `primary.default` at 12% alpha — nearly invisible) [Gap E1-04]
- ☐ User can view LSInlineErrorCallout suggestion-chips section with a 1pt dashed `status.warning.tint` divider above and an `is-primed` first chip styled in warning-whisper background + warning-amber text on both platforms (currently both lack divider; Android `isPrimary` flag maps to neutral `ContentColor.Primary` instead of warning-amber) [Gap E1-05]
- ☐ User can view LSNavigatorMessage body text on iOS collocated inside the headerRow's inner `VStack` alongside the "THE NAVIGATOR" label (currently rendered in the outer `VStack` below headerRow, misaligning action buttons against single label line when body is short) [Gap E1-07]

#### LSRouteSheet organism

- ☐ User can view LSRouteSheet on iOS wrapped in `LSBottomSheet(detent: .large, onDismiss: onDismiss)` with a drag handle and dismiss gesture (currently a plain `VStack(spacing: 0)` with no sheet shell, no handle, no detent system) [Gap E2-01]
- ☐ User can view LSBestBadge entering with a `scaleEffect()` 0.8→1.0 + `opacity()` 0→1 spring animation over 200ms after the sheet settles, on both platforms (currently no animation — badge pops with sheet) [Gap E2-02]
- ☐ User can view a 5-dot scenic indicator strip beside the LSBestBadge with copper-filled dots = scenic score and `border.strong` empty dots on both platforms (currently neither platform renders the strip) [Gap E2-03]
- ☐ User can view the via subtitle ("via Bear Creek Pass...") in `body.sm` typography on both platforms (currently `body.md` — one size larger than designed) [Gap E2-03]
- ☐ User can view the LSRouteSheet action row on iOS with the Save button at relative width 1 and the "Ride this" button at relative width 2 (currently both `.frame(maxWidth: .infinity)` — equal widths; Android already uses `weight(1f)`/`weight(2f)` correctly) [Gap E2-04]
- ☐ User can view the LSWeatherTimeline header time range on Android derived from the actual `weatherTimeline` data via a `timeRange: Pair<String, String>` parameter (currently hardcoded `from = "9am"`, `to = "3pm"`) [Gap E2-05]

#### LSRouteCard organism

- ☐ User can view LSRouteCard on iOS with the map preview filling card width edge-to-edge by passing `LSCard(padding: .zero)` and re-applying `padding(theme.space.md)` inside `routeInfo` (currently `LSCard(padding: .spacing4)` insets the map from card edges) [Gap E3-01]
- ☐ User can view LSRouteCard on iOS without the inner `clipShape(RoundedRectangle(cornerRadius: theme.radius.md))` on the map preview, letting the outer `LSCard` clip the corners (currently produces a dark double-rounded corner artifact) [Gap E3-02]
- ☐ User can view LSRouteCard map preview using `aspectRatio(9.0/4.0, contentMode: .fill)` (iOS) / `Modifier.aspectRatio(9f/4f)` (Android) so it scales proportionally with card width (currently both hardcode `mapPreviewHeight = 160`) [Gap E3-03]
- ☐ User can view LSRouteCard saved-state heart icon on Android using `IconColor.Signal` (copper) (currently `IconColor.Content(ContentColor.Primary)` — charcoal/white, losing the saved-state affordance) [Gap E3-04]
- ☐ User can view LSRouteCard difficulty tags on Android as styled `LSTagPill` (or `LSPill` with explicit colors) wired to `status.success.tint` (easy) / `status.warning.tint` (moderate) / `status.error.tint` (hard) (currently plain `LSText` with `ContentColor.Secondary` — no pill, no semantic tint, accessibility violation) [Gap E3-05]
- ☐ User can view LSRouteCard subtitle separator pipe at `strokeWidth.thin` × `space.md` (12pt) on iOS (currently height literal `10`) and rendered at all on Android using a `Box` with `border.default` color (currently no visible separator) [Gap E3-06]

#### LSSectionHeader organism

- ☐ User can view LSSectionHeader on iOS with a `titleStyle: TitleStyle` enum (.regular/.caps); when `.caps`, the title renders in `.label.sm` typography with `.tertiary` color (currently always `title.md` regardless of variant — "caps" story renders identical to default) [Gap E4-01]
- ☐ User can view LSSectionHeader See-all link rendered in `body.md` typography on both platforms (currently `body.sm` — one size smaller than designed) [Gap E4-02]
- ☐ User can view LSSectionHeader on Android with title and see-all link aligned by baseline using `Modifier.alignBy(LastBaseline)` on each Row child (currently `verticalAlignment = Alignment.CenterVertically` — link appears slightly high relative to title) [Gap E4-03]
- ☐ User can view LSSectionHeader on Android with `Modifier.padding(vertical = theme.space.md)` applied at the row level (currently no vertical padding — relies on caller for spacing) [Gap E4-04]

#### Sandbox stories — Android

- ☐ User can view all 6 LSNavigatorMessage stories registered in Android sandbox (S.01 message-only, S.02 one attachment, S.03 three attachments, S.04 pinned, S.05 long body, dark mode) (currently `AppStories.all = emptyList()`) [Gap E1-06]
- ☐ User can view all 5 LSInlineErrorCallout stories registered in Android sandbox (E.01 error-only, E.02 with detail, E.03 with suggestions, E.04 long body + chips, E.05 dark mode) [Gap E1-06]
- ☐ User can view all 5 LSRouteSheet stories registered in Android sandbox (best, alt, long-title, mixed-weather, dark) [Gap E2-06]
- ☐ User can view all 6 LSRouteCard stories registered in Android sandbox (default, saved, alt variant, long-title overflow, missing data, dark mode) [Gap E3-07]
- ☐ User can view all 5 LSSectionHeader stories registered in Android sandbox (title-only, title + see-all, caps label, custom inset, dark mode) [Gap E4-05]
- ☐ System validates story-id parity (canonical kebab-case 4-deep) across iOS + Android via `pnpm snapshots:check` and `pnpm snapshots:parity-report` with zero parity violations (modulo platform-only stories explicitly tagged `*_only`)

#### Cross-platform parity (umbrella)

- ☐ User can render every V2 story (atoms, molecules, organisms, templates) in both light and dark theme on both iOS and Android with snapshot tests passing (`swift-snapshot-testing` iOS + `dropshots` Android), with parity coverage at ≥95% per `parity-coverage.ts` per-tier thresholds
- ☐ User can run `pnpm snapshots:check` pre-push and see zero coverage gaps across all tiers (atoms, molecules, organisms, templates) on both platforms
- ☐ System ensures no V2 atom or token is added beyond the 2 already approved in V3 (`LSDownloadProgressBar`, `LSAuthProviderButton`) and the 3 token gaps already documented (`--surface-scrim-soft`, `--elev-drawer`, `--space-hairline`) — design source authority remains `.spec/design/system/`

### Cut Authority Tags

The following AC sub-groups carry `[ANDROID-CUT-CANDIDATE]` markers per HUMAN SIGNAL #4 — first-cut candidates if cross-platform testing burdens scope:

- **Android sandbox stories** (5 ACs in "Sandbox stories — Android" section above): the entire `AppStories.all = emptyList()` remediation across LSNavigatorMessage + LSInlineErrorCallout + LSRouteSheet + LSRouteCard + LSSectionHeader stories
- **Cross-platform parity tests** (2 ACs in "Cross-platform parity"): dropshots Android snapshot tests + parity verification scripts on Android side
- **Android-only token corrections beyond build blockers** (subset of ACs in LSSessionsDrawer / LSTopBar / LSNavigatorMessage / LSRouteCard sections): non-blocking Android polish that can defer to v3.1 if cut

The following ACs are **never cut** (always ship on iOS, even if Android cut):

- All iOS typography fixes (Newsreader serif rollout)
- iOS map slot replacement (LinearGradient → paper substrate)
- iOS sessions-drawer container (glass-panel → solid surface-card)
- iOS LSRouteCard map geometry (clipShape + aspect-ratio)
- iOS LSRouteSheet bottom-sheet shell
- iOS sandbox story coverage (1→7 per view)
- All shared motion recipe wiring
- All `[CRITICAL BUILD BLOCKER]` ACs:
  - Android `Session` data class declaration in `LSSessionsDrawer.kt`
  - Android `RouteDetailsScreen.kt` polyline decoding (currently `emptyList()`)
