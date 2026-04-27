# Design Review: navigator-callouts + route-sheet + route-card + section-header
**Reviewer**: frontend-designer Agent E
**Date**: 2026-04-27

---

## Summary

All four content organisms have functional iOS implementations and partial Android implementations, but every organism carries meaningful gaps against the authoritative HTML spec. The heaviest deficits are in **route-card** (iOS card geometry is wrong, Android tags are plain text rather than styled pills), **navigator-callouts** (iOS body text uses the wrong typography variant; both platforms have compass chip construction issues; iOS pinned-bar separator is missing), and **route-sheet** (no scenic-dot strip on iOS; weather timeline time-range params are hardcoded on Android; `bestBadgeEnter` motion is unimplemented on both). **Android sandbox story coverage is zero** — `AppStories.all = emptyList()`. The section-header is the closest organism to spec fidelity on both platforms.

---

## Organism: navigator-callouts

### Designed inventory
- **LSNavigatorMessage**: 6 stories (S.01 message-only, S.02 one attachment, S.03 three attachments, S.04 pinned, S.05 long body, dark mode)
- **LSInlineErrorCallout**: 5 stories (E.01 error-only, E.02 with detail, E.03 with suggestions, E.04 long body + chips, E.05 dark mode)

### Native inventory
**iOS**: 6 + 5 stories (full parity)
**Android**: `AppStories.all = emptyList()` — zero stories

### Gaps

#### Gap E1-01: iOS body text uses `heading.md` instead of `opinion.md`
- **Severity**: HIGH
- **iOS file**: `LSNavigatorMessage.swift` line 35; `LSInlineErrorCallout.swift` line 54 ("proxy" comment)
- **Android file**: Both correct (`Opinion.Md`)
- **Remediation**: iOS — swap both to `TypographyVariant.opinion.md`. Remove proxy comment.
- **Effort**: iOS=S

#### Gap E1-02: iOS compass chip construction non-canonical; Android compass missing signal background
- **Severity**: MED
- **iOS file**: `LSNavigatorMessage.swift` lines 120–136 — manual Circle overlays + opacity string magic
- **Android file**: `LSNavigatorMessage.kt` lines 234–244 — bare `LSPill` with no signal whisper background
- **Remediation**: iOS — single helper `compassChip(accent: .signal)` reading `signal.whisper` directly. Android — pass explicit `background = theme.colors.signal.whisper, border = theme.colors.signal.tint`.
- **Effort**: iOS=S, Android=S

#### Gap E1-03: iOS pinned-bar missing top-border separator
- **Severity**: MED
- **Designed reference**: HTML lines 102–116 — `border-top: var(--stroke-sm) solid var(--signal-tint)`
- **Remediation**: Both — add `Divider(color: signal.tint, thickness: 1)` above pinned indicator.
- **Effort**: iOS=S, Android=S

#### Gap E1-04: Android pinned-indicator dot uses `primary.default` at 12% alpha (nearly invisible)
- **Severity**: MED
- **Android file**: `LSNavigatorMessage.kt` line 262 — `theme.colors.primary.default.copy(alpha = 0.12f)`
- **Remediation**: Replace with `theme.colors.signal.default` at full opacity.
- **Effort**: Android=S

#### Gap E1-05: Suggestion chips lack `is-primed` styling and dashed top separator on both platforms
- **Severity**: MED
- **Designed reference**: HTML lines 640–648 — `.is-primed` chip + `.suggestions { border-top: var(--stroke-sm) dashed var(--status-warning-tint) }`
- **Remediation**: Add Divider with dashed stroke + warning-tint above suggestions row. Add `primedIndex` param + warning-whisper tint background to that chip.
- **Effort**: iOS=M, Android=M

#### Gap E1-06: Android — zero sandbox stories registered
- **Severity**: HIGH
- **Android file**: `AppStories.kt` line 13 — `val all: List<SandboxStory> = emptyList()`
- **Remediation**: Implement `LSNavigatorMessageStories.kt` (6 stories) + `LSInlineErrorCalloutStories.kt` (5 stories) matching iOS IDs. Register in `AppStories.all`.
- **Effort**: Android=M

#### Gap E1-07: iOS message body floats below header row instead of being collocated in text column
- **Severity**: LOW
- **iOS file**: `LSNavigatorMessage.swift` lines 32–46 — body separated from headerRow VStack
- **Android file**: `LSNavigatorMessage.kt` lines 141–157 — body inside Column with label (correct)
- **Remediation**: Move iOS body `LSText` into headerRow's inner VStack alongside label.
- **Effort**: iOS=S

---

## Organism: route-sheet

### Designed inventory
5 stories: best, alt, long-title, mixed-weather, dark.

### Native inventory
**iOS**: 5 stories (full parity)
**Android**: zero stories (`AppStories.all = emptyList()`)

### Gaps

#### Gap E2-01: iOS `LSRouteSheet` does not wrap in `mol-bottom-sheet` shell
- **Severity**: HIGH
- **iOS file**: `LSRouteSheet.swift` lines 47–66 — `VStack(spacing: 0)` with no `LSBottomSheet`, no drag handle
- **Android file**: `LSRouteSheet.kt` lines 84–88 — `LSBottomSheet(detent = ...)` (correct)
- **Remediation**: Wrap iOS body in `LSBottomSheet(detent: .large, onDismiss: onDismiss)`.
- **Effort**: iOS=M

#### Gap E2-02: `bestBadgeEnter` motion unimplemented on both platforms
- **Severity**: MED
- **Designed reference**: README — Best badge scales 0.8→1.0 + fades in 200ms after sheet settles
- **Remediation**: iOS — `.scaleEffect()` + `.opacity()` with 200ms spring on `.onAppear`. Android — `AnimatedVisibility(scaleIn + fadeIn, 200ms)`.
- **Effort**: iOS=S, Android=S

#### Gap E2-03: Scenic-dot strip missing on both platforms; via subtitle uses wrong size
- **Severity**: MED
- **Designed reference**: HTML lines 159–168 — 5 scenic dots, copper-filled count = score; via `.t-body-sm`
- **iOS file**: `LSRouteSheet.swift` lines 73–85 — no dots; via `.body.md` (wrong)
- **Android file**: `LSRouteSheet.kt` lines 99–129 — no dots; via `Body.Md` (wrong)
- **Remediation**: Add scenic dot row above/beside badge (5 dots, `signal.default` filled, `border.strong` empty). Change via to `.body.sm`/`Body.Sm`.
- **Effort**: iOS=M, Android=M

#### Gap E2-04: iOS action row equal width — Save and Ride should be 1:2 ratio
- **Severity**: MED
- **iOS file**: `LSRouteSheet.swift` lines 112–132 — both buttons `.frame(maxWidth: .infinity)`
- **Android file**: `LSRouteSheet.kt` lines 163–177 — `Modifier.weight(1f)` and `weight(2f)` (correct)
- **Remediation**: iOS — proportional sizing via Layout with flex weights, or convert to `GeometryReader`-based proportional HStack.
- **Effort**: iOS=S

#### Gap E2-05: Android weather timeline `from`/`to` hardcoded as `"9am"`/`"3pm"`
- **Severity**: MED
- **Android file**: `LSRouteSheet.kt` lines 143–148 — string literals regardless of `weatherTimeline` content
- **Remediation**: Add `timeRange: Pair<String, String>` param to `LSRouteSheet`; pass to `LSWeatherTimeline`.
- **Effort**: Android=S

#### Gap E2-06: Android — zero sandbox stories for LSRouteSheet
- **Severity**: HIGH
- **Remediation**: Implement `LSRouteSheetStories.kt` (5 stories).
- **Effort**: Android=M

---

## Organism: route-card

### Designed inventory
6 stories: default, saved, alt variant, long-title overflow, missing data, dark mode.

### Native inventory
**iOS**: 6 stories (parity)
**Android**: zero stories

### Gaps

#### Gap E3-01: iOS `LSRouteCard` map preview inset by `LSCard(padding: .spacing4)` (visible distortion)
- **Severity**: HIGH
- **Designed reference**: HTML lines 32–35 — `.org-route-card { padding: var(--space-0) }`; map slot is edge-to-edge
- **iOS file**: `LSRouteCard.swift` line 26 — `LSCard(padding: .spacing4)`
- **Remediation**: iOS — `LSCard(padding: .zero)`; re-apply padding inside `routeInfo`.
- **Effort**: iOS=S

#### Gap E3-02: iOS `LSRouteCard` double-clips map with inner `clipShape`
- **Severity**: HIGH
- **iOS file**: `LSRouteCard.swift` line 57 — `.clipShape(RoundedRectangle(cornerRadius: theme.radius.md))`
- **Remediation**: Remove the inner `.clipShape`. Let `LSCard` outer container clip to its radius.
- **Effort**: iOS=S

#### Gap E3-03: Map preview uses fixed 160pt height instead of `aspect-ratio: 9/4`
- **Severity**: MED
- **Designed reference**: README — `aspect-ratio: 9 / 4` enforces ~160pt at 360pt card width but scales with width
- **Remediation**: iOS — `.aspectRatio(9.0/4.0, contentMode: .fill)` instead of `.frame(height: 160)`. Android — `Modifier.aspectRatio(9f/4f)`.
- **Effort**: iOS=S, Android=S

#### Gap E3-04: Android saved-state heart icon uses `ContentColor.Primary` instead of signal copper
- **Severity**: MED
- **Android file**: `LSRouteCard.kt` lines 74–80 — `IconColor.Content(ContentColor.Primary)`
- **Remediation**: Change to `IconColor.Signal`.
- **Effort**: Android=S

#### Gap E3-05: Android difficulty tags rendered as plain `LSText` (no pill, no semantic tint)
- **Severity**: HIGH (accessibility violation)
- **Designed reference**: HTML lines 254–258 — `<span class="ls-pill org-route-card__tag--moderate">` with status tint
- **Android file**: `LSRouteCard.kt` lines 103–107 — plain `LSText`, `ContentColor.Secondary`
- **Remediation**: Replace with `LSTagPill` (or `LSPill` with explicit colors) wired to: easy → `status.success.tint`, moderate → `status.warning.tint`, hard → `status.error.tint`.
- **Effort**: Android=M

#### Gap E3-06: iOS subtitle separator uses raw `10` literal; Android has no separator pipe
- **Severity**: LOW
- **iOS file**: `LSRouteCard.swift` line 148 — `.frame(width: theme.strokeWidth.thin, height: 10)` (should be `theme.space.md` 12pt)
- **Android file**: `LSRouteCard.kt` lines 92–96 — `Spacer` only, no visible separator
- **Remediation**: iOS — change `10` to `theme.space.md`. Android — add `Box` with width `strokeWidth.thin`, height `space.md`, color `border.default`.
- **Effort**: iOS=S, Android=S

#### Gap E3-07: Android — zero sandbox stories for LSRouteCard
- **Severity**: HIGH
- **Remediation**: Implement `LSRouteCardStories.kt` (6 stories).
- **Effort**: Android=M

---

## Organism: section-header

### Designed inventory
5 stories: title-only, title + see-all, caps label, custom inset, dark mode.

### Native inventory
**iOS**: 5 stories (parity)
**Android**: zero stories

### Gaps

#### Gap E4-01: iOS no caps-label variant — same `title.md` typography as default
- **Severity**: MED
- **Designed reference**: HTML lines 222–227 — caps title uses `.t-label-sm` (8.5pt 600 0.14em uppercase)
- **iOS file**: `LSSectionHeader.swift` lines 41–43 — always `LSText(title, variant: .title.md)`
- **Android file**: `LSSectionHeader.kt` lines 87–110 — single-arg overload uses `Ui.Label.Sm` + `Subtle` (correct)
- **Remediation**: iOS — add `titleStyle: TitleStyle` enum (.regular/.caps); when .caps, use `.label.sm` + `.tertiary` color.
- **Effort**: iOS=S

#### Gap E4-02: See-all link uses `body.sm` instead of `body.md`
- **Severity**: LOW
- **Designed reference**: HTML — `t-body-md` (12pt Geist 400)
- **iOS file**: `LSSectionHeader.swift` line 54 — `.body.sm`
- **Android file**: `LSSectionHeader.kt` line 131 — `Ui.Body.Sm`
- **Remediation**: Both — change to `.body.md`/`Body.Md`.
- **Effort**: iOS=S, Android=S

#### Gap E4-03: Android uses `Alignment.CenterVertically` instead of baseline alignment
- **Severity**: MED
- **Designed reference**: HTML — `align-items: baseline`
- **iOS file**: `LSSectionHeader.swift` line 41 — `HStack(alignment: .firstTextBaseline)` (correct)
- **Android file**: `LSSectionHeader.kt` line 52 — `verticalAlignment = Alignment.CenterVertically` (wrong)
- **Remediation**: Use `Modifier.alignBy(LastBaseline)` or `FirstBaseline` on each Row child.
- **Effort**: Android=S

#### Gap E4-04: Android no vertical padding parameter — hardcoded zero/external
- **Severity**: LOW
- **Android file**: `LSSectionHeader.kt` line 48 — Row only has `padding(start = inset)`
- **Remediation**: Apply `Modifier.padding(vertical = theme.space.md)` matching iOS.
- **Effort**: Android=S

#### Gap E4-05: Android — zero sandbox stories for LSSectionHeader
- **Severity**: HIGH
- **Remediation**: Implement `LSSectionHeaderStories.kt` (5 stories).
- **Effort**: Android=S

---

## Top-Priority Remediations

1. **E3-01 + E3-02 — iOS map preview inset + double-clip** (iOS=S each, primary visible distortion)
2. **E2-01 — iOS LSRouteSheet missing bottom-sheet shell** (iOS=M)
3. **E1-01 — iOS callout body opinion-md typography** (iOS=S)
4. **E3-05 — Android difficulty tags as styled pills** (Android=M, accessibility)
5. **E1-04 — Android pinned dot opacity fix** (Android=S)
6. **E3-04 — Android heart icon signal color** (Android=S)
7. **E4-01 — iOS section-header caps variant** (iOS=S)
8. **E4-03 — Android section-header baseline alignment** (Android=S)
9. **E2-04 — iOS route-sheet action row 1:2 proportion** (iOS=S)
10. **E2-05 — Android route-sheet timeRange param** (Android=S)
11. **E1-07 — iOS navigator message body collocation** (iOS=S)
12. **E1-06 + E2-06 + E3-07 + E4-05 — Android sandbox stories** (Android=M each, 4 organism story files)
13. **E1-05 — Dashed separator + is-primed chip styling** (M each)
14. **E2-02 — bestBadgeEnter motion** (S each)
