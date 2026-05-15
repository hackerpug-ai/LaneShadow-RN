# Design Review: idle-screen + planning-screen
**Reviewer**: frontend-designer Agent A
**Date**: 2026-04-27

---

## Summary

- **Idle-screen gaps**: 4 HIGH, 6 MED, 3 LOW (13 total)
- **Planning-screen gaps**: 4 HIGH, 5 MED, 2 LOW (11 total)
- **Overall verdict**: Both screens are structurally composed correctly — `LSMapLayer`, `LSTopBar`, `LSChatInput`, and `LSPhaseIndicator` are all wired in and the slot contract is followed. However, both impls are significantly hollowed out compared to the design: the map slot renders a `LinearGradient` placeholder instead of the paper-warm topographic canvas; the greeting meta row uses the wrong semantic token for its label color; the designed variant coverage is far sparser in both iOS and Android (idle has only 1 sandbox story vs. 7 designed states; planning covers phases but omits all 3 edge-state variants on Android); the `is-active` send-button swap in the chat input is not represented at all; weather advisory, no-location, and slow-planning states are entirely absent from native sandbox stories; and the sketching polyline animation uses incorrect duration and easing values relative to the `sketchPolylineLoop` recipe. These are the "distortions" — the map looks wrong because it's a gradient, the greeting meta row is likely the wrong copper shade, and the phase indicator header is missing the compass chip on Android.

---

## View 1: idle-screen

### Designed inventory (from README + HTML)

| ID | Description | Theme |
|----|-------------|-------|
| S01 | Default — dormant map, 4 chips, MANUAL location, "today" greeting | Light |
| S02 | Typing/Send — chip primed (copper tint), send button revealed, filter hidden | Light |
| S03 | Default Dark — all tokens re-resolve; greeting rewrites to "tonight" | Dark |
| S04 | Filter Sheet — `.medium` detent bottom sheet over scrimmed map | Light |
| V01 | No Location — copper-framed "Tap to set start" pill; chat input dimmed at `var(--opacity-disabled)` | Light |
| V02 | First Ride — no favorite pins; onboarding suggestion chips; fresh-state greeting | Light |
| V03 | Weather Advisory — warning-accented meta row; rain-tinted advisory card; short/dry chips | Light |

### Native inventory (iOS + Android)

**iOS sandbox stories** (IdleScreenStory.swift, line 7–19):
- `templates.idle.default` — 1 story only; hardcoded to `provider.value(variant: "default")`

**Android sandbox stories** (IdleScreenStory.kt, lines 22–119):
- `templates.idle.default`, `templates.idle.empty`, `templates.idle.overflow`, `templates.idle.long-copy`

Neither platform covers S02, S03, S04, V01, V02, V03.

### Gaps — idle-screen

#### Gap A-01: Six of seven design variants absent from iOS sandbox
- **Severity**: HIGH
- **Designed reference**: `.spec/design/system/views/mapapp/idle/README.md` Variants table (all 7 rows)
- **iOS file**: `ios/LaneShadow/Sandbox/Stories/Templates/IdleScreenStory.swift` lines 7–19
- **Android file**: `android/.../sandbox/stories/templates/IdleScreenStory.kt` lines 22–119 — has 4 variants but they're stress tests not designed states
- **Observation**: Design defines 7 distinct visual states (S01–V03). iOS exposes 1. Android exposes 4 stress tests (empty/overflow/long-copy) instead of designed state variants. Snapshot regression cannot detect bugs in 6/7 designed states.
- **Remediation**: Add 6 new mock variants + stories per platform: `typing-send`, `dark`, `filter-sheet`, `no-location`, `first-ride`, `weather-advisory`. Story IDs: `templates.idle.{variant}`.
- **Effort**: iOS=M, Android=M

#### Gap B-01: Map slot renders LinearGradient placeholder instead of paper topographic canvas
- **Severity**: HIGH (primary visual distortion on iOS)
- **Designed reference**: `idle-screen.html` lines 186–215 — `.view-idle-screen__map-slot` with `background: var(--map-paper)`, contour SVGs at `var(--map-contour)` 0.9pt + `var(--map-contour-faint)` 0.7pt, favorite pins using `var(--signal-default)`
- **iOS file**: `ios/LaneShadow/Views/Templates/IdleScreen.swift` lines 61–78 — `mapView` is a `LinearGradient(colors: [theme.colors.surface.default, theme.colors.background.default])` with `Text("Map Layer")`
- **Android file**: `android/.../ui/templates/IdleScreen.kt` lines 98–106 — uses real `LSMap` (Mapbox), but favorite pin overlay dots not added as composable overlays
- **Remediation**: iOS — `ZStack` with `Color(theme.colors.map.paper)`, `Canvas` drawing contour SVG paths at `theme.colors.map.contour`/`map.contourFaint`, absolute-positioned `Circle` favorite pins. Android — add favorite-pin `Box` overlays as absolute composables inside the `LSMap` slot.
- **Effort**: iOS=L, Android=M

#### Gap D-01: Greeting meta row uses wrong color token — `onSurface.default` instead of `signal.default`
- **Severity**: HIGH
- **Designed reference**: `idle-screen.html` line 541 — `color: var(--signal-default)` (copper)
- **iOS file**: `ios/LaneShadow/Views/Templates/IdleScreen.swift` line 88 — `theme.colors.onSurface.default`
- **Android file**: `android/.../ui/templates/IdleScreen.kt` line 184 — `theme.colors.primary.default` (correct)
- **Remediation**: iOS line 88 — change `theme.colors.onSurface.default` to `theme.colors.signal.default`.
- **Effort**: iOS=S

#### Gap D-02: Dark-mode story absent from iOS idle-screen
- **Severity**: HIGH
- **Designed reference**: `idle-screen.html` line 712 — `data-theme="dark"`; greeting rewrites to "tonight"
- **iOS file**: no dark story; `PlanningScreenStory.swift` line 96 shows the pattern (`.preferredColorScheme(.dark)`)
- **Remediation**: Add `IdleMockProvider` "dark" variant with greeting "tonight"/`mode = "auto"`. Add story `templates.idle.dark` with `.preferredColorScheme(.dark)` on both platforms.
- **Effort**: iOS=S, Android=S

#### Gap B-02: S02 Typing/Send state — primed chip + send button reveal not in native impl
- **Severity**: MED
- **Designed reference**: `idle-screen.html` lines 676–694 — chip gains `is-primed`; trailing slot swaps from filter-btn to copper send button
- **Remediation**: Add `IdleMockProvider` `"typing-send"` variant with `chatInputValue = "Coastal cruise down Hwy 1"` + primed-chip flag. Pass through `LSChatInput`. Add story `templates.idle.typing-send`.
- **Effort**: iOS=S, Android=S

#### Gap B-03: S04 Filter sheet not implemented — neither platform composes a bottom sheet onto IdleScreen
- **Severity**: MED
- **Designed reference**: `idle-screen.html` lines 819–900 — bottom sheet at `var(--surface-card)` with drag handle, "Refine the ask" title, filter chips
- **Remediation**: Add `showFilterSheet: Bool` state. Overlay `LSBottomSheet` with "Duration" + "Avoid" filter chip groups when shown. Add story `templates.idle.filter-sheet`.
- **Effort**: iOS=M, Android=M

#### Gap B-04: V01 No-location state — chat dimming and "Tap to set start" pill absent
- **Severity**: MED
- **Designed reference**: `idle-screen.html` lines 953–992 — copper-framed pill, chat at `var(--opacity-disabled)`, headline "Where are we starting from?"
- **Remediation**: Add `LocationMode.needed` enum case. When mode `.needed`, render copper-bordered "Tap to set start" pill + apply `theme.opacity.disabled` to chat input. Add `IdleMockProvider` `"no-location"` variant + story.
- **Effort**: iOS=M, Android=M

#### Gap B-05: V02 First-ride variant — no-favorites map state not expressed
- **Severity**: MED
- **Designed reference**: `idle-screen.html` lines 1007–1091 — no pin elements; onboarding chips; "First ride? Ask me anything." greeting
- **Remediation**: Add `"first-ride"` mock variant with onboarding chips, `hasFavorites = false` flag preventing pin rendering. Add story.
- **Effort**: iOS=S, Android=S

#### Gap B-06: V03 Weather advisory card entirely absent
- **Severity**: MED
- **Designed reference**: `idle-screen.html` lines 1144–1160 — `view-idle-screen__greeting-meta--warning` modifier; advisory card at `var(--wx-rain-tint)` with `border-left var(--stroke-lg) var(--wx-rain)`, italic Newsreader body
- **Remediation**: Add `weatherSeverity`, `advisoryText` to `IdleScreenState`. Render advisory card below headline when `weatherSeverity == "advisory"`. Add `"weather-advisory"` mock variant + story.
- **Effort**: iOS=M, Android=M

#### Gap E-01: Greeting headline uses wrong typography on iOS — `heading.md` instead of `t-opinion-xl`
- **Severity**: HIGH (primary contributor to "distorted" feel)
- **Designed reference**: `idle-screen.html` line 548 — `<h2 class="t-opinion-xl">`
- **iOS file**: `ios/LaneShadow/Views/Templates/IdleScreen.swift` line 111 — `theme.type.heading.md.font`
- **Android file**: `android/.../ui/templates/IdleScreen.kt` line 191 — `theme.typography.opinion.xl` (correct)
- **Remediation**: iOS line 111 — change to `theme.type.opinion.xl.font`.
- **Effort**: iOS=S

#### Gap G-01: Greeting meta separator dots not rendered as styled atoms
- **Severity**: LOW
- **Designed reference**: `idle-screen.html` lines 541–546 — `.view-idle-screen__greeting-dot` spans at `var(--space-1)` diameter, opacity 0.6
- **Remediation**: Parse `state.greeting.meta` by ` · ` and reconstruct as HStack of Text + `Circle` views.
- **Effort**: iOS=S, Android=S

#### Gap H-01: iOS greeting headline uses HStack-of-Text word-split — risks word-wrap break + emphasis missing copper color
- **Severity**: LOW
- **Designed reference**: `idle-screen.html` line 548 — `<em>` inline; emphasis at `var(--signal-default)`
- **iOS file**: `IdleScreen.swift` lines 92–110 — splits by word
- **Android file**: `IdleScreen.kt` lines 71–96 — `buildAnnotatedString` (correct)
- **Remediation**: Replace iOS HStack with `AttributedString`-based `Text` view, range-styling the emphasis word with `signal.default` foreground + italic.
- **Effort**: iOS=S

#### Gap H-02: Suggestion chip horizontal scroll behavior not validated by stories
- **Severity**: LOW
- **Remediation**: Tag existing overflow stories explicitly as horizontal-scroll tests. Verify `LSChatInput` uses `ScrollView(.horizontal)` / `LazyRow`.
- **Effort**: iOS=S, Android=S

---

## View 2: planning-screen

### Designed inventory

| ID | Description | Theme |
|----|-------------|-------|
| S01 | Phase 1 Scouting | Light |
| S02 | Phase 2 Drawing | Light |
| S03 | Phase 3 Weather — wx-dots over dimmed sketch | Light |
| S04 | Phase 4 Scoring Dark — 3 candidate polylines (best/alt1/alt2) | Dark |
| V01 | Slow Planning — apology note appears below steps | Light |
| V02 | Cancel Prompt — phase card dims; cancel-confirm sheet | Light |
| V03 | Single Candidate — warning-copper accent on indicator; over-constraint advisory | Light |

### Native inventory

**iOS** (PlanningScreenStory.swift): 6 stories — phase1, default(phase2), phase3, phase4, phase5, dark
**Android** (PlanningScreenStory.kt): 4 stories — default(phase3), empty, overflow, long-copy

Neither covers V01, V02, V03.

### Gaps — planning-screen

#### Gap A-02: Android stories don't cover phase walkthrough (S01–S04)
- **Severity**: HIGH
- **Remediation**: Add Android `PlanningMockProvider` `phase1`, `phase2`, `phase4-dark` variants + stories.
- **Effort**: Android=M

#### Gap A-03: V01 Slow-planning, V02 Cancel-confirm, V03 Single-candidate absent on both platforms
- **Severity**: HIGH
- **Designed reference**: `planning-screen.html` V01 lines 984–1097 (italic apology with dashed border); V02 (scrim + cancel `role="alertdialog"`); V03 (`var(--status-warning)` border-top + over-constraint advisory)
- **Remediation**: Extend `PlanningScreenState` with `isSlowPlanning`, `slowPlanningNote`, `isCancelling`, `warningVariant`. Render: italic apology Text below indicator on slow; scrim + confirm sheet on cancel; warning variant on `LSPhaseIndicator`.
- **Effort**: iOS=L, Android=L

#### Gap F-01: Sketch polyline animation duration wrong — both platforms use ~600ms instead of 1400ms linear loop
- **Severity**: HIGH (visible kinetic distortion)
- **Designed reference**: `planning-screen.html` line 237 — `1400ms linear infinite`; README "TOKEN_GAP" emitted
- **iOS file**: `PlanningScreen.swift` lines 214–228 — uses `theme.motion.duration["slower"] ?? 600` with `"standard"` cubic-bezier easing
- **Android file**: `PlanningScreen.kt` lines 56–79 — uses `theme.motion.duration["deliberate"]` (also 600ms) with linear
- **Remediation**: Both platforms — replace token lookup with view-local constant `1400ms`. iOS use `Animation.linear(duration: 1.4).repeatForever(autoreverses: false)`. Android use `tween(durationMillis = 1400, easing = LinearEasing)`.
- **Effort**: iOS=S, Android=S

#### Gap F-02: Breathing head dot duration wrong — iOS 400ms, Android missing entirely
- **Severity**: MED
- **Remediation**: iOS — change `breathingDotAnimationRecipe` to 1400ms easeInOut. Android — add separate Circle composable as leading head dot, animate scale 1.0→1.25 over 1400ms.
- **Effort**: iOS=S, Android=M

#### Gap C-01: S03 weather condition dot badges not implemented; sketch dimming not implemented
- **Severity**: MED
- **Designed reference**: `planning-screen.html` lines 766–778 — wx-dot--clear at (44%,42%), wx-dot--wind at (70%,36%)
- **Remediation**: Extend `PlanningScreenState` with `weatherDots: [WxDot]?`. When `activePhase == 3`, dim sketch to 0.55 opacity + overlay weather dot composables at fractional positions.
- **Effort**: iOS=M, Android=M

#### Gap C-02: S04 Scoring — three candidate polylines (best/alt1/alt2) not rendered
- **Severity**: MED
- **Remediation**: Extend `PlanningScreenState` with `candidatePolylines: [PolylineData]?`. When non-nil, render best/alt1/alt2 with `RouteVariant` colors and 0.9/0.55/0.45 opacities.
- **Effort**: iOS=M, Android=M

#### Gap G-02: Phase indicator missing header string on Android — italic Newsreader opinion header
- **Severity**: MED
- **Designed reference**: `planning-screen.html` line 561 — `t-opinion-sm` italic header inside phase indicator
- **iOS file**: `PlanningScreen.swift` lines 105–110 — passes `header: phaseHeader` (correct)
- **Android file**: `PlanningScreen.kt` lines 151–165 — no `header` param passed
- **Remediation**: Compute phase header string per active phase, pass to `LSPhaseIndicator(header = phaseHeader)`. Add `header` param to Android `LSPhaseIndicator` if missing.
- **Effort**: Android=S

#### Gap D-03: PlanningScreen dark mode map background not re-resolved on iOS
- **Severity**: LOW (dependent on B-01 fix)
- **Remediation**: After B-01, verify dark mode `theme.colors.map.paper` resolves to `var(--ink-900)` equivalent.
- **Effort**: iOS=S (post B-01)

#### Gap H-03: Chat input thinking state — verify location bar + suggestion row hidden
- **Severity**: LOW
- **Remediation**: Visual verification on simulator/emulator. If still showing, add `if !isThinking` guards in `LSChatInput`.
- **Effort**: iOS=S, Android=S

---

## Top-Priority Remediations

1. **B-01 iOS map slot replace LinearGradient** (iOS=L)
2. **E-01 iOS greeting headline opinion-xl typography** (iOS=S)
3. **D-01 iOS greeting meta signal.default color** (iOS=S)
4. **F-01 sketch polyline 1400ms linear** (iOS=S, Android=S)
5. **F-02 breathing head dot duration sync** (iOS=S, Android=M)
6. **G-02 Android phase indicator header** (Android=S)
7. **D-02 iOS dark idle story** (iOS=S)
8. **A-03 V01/V02/V03 planning edge-state coverage** (iOS=L, Android=L)
