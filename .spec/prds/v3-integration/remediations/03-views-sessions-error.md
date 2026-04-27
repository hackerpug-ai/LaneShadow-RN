# Design Review: sessions-screen + error-screen
**Reviewer**: frontend-designer Agent C
**Date**: 2026-04-27

---

## Summary

Both screens compose correctly at the structural level — LSMapLayer, LSSessionsDrawer, LSInlineErrorCallout, LSChatInput, and LSTopBar are all wired up. The distortion the user observes originates from a cluster of concrete, catalogued defects: the sessions drawer header uses a wrong typography variant (title.lg instead of opinion-serif "Rides"), the active-row stripe width is 3pt instead of the spec's `--stroke-lg` (2pt) on iOS, the active-row background tint uses a fixed opacity constant instead of `color-mix`, the empty state on both platforms drops the entire dashed-compass-in-copper-ring icon spec and replaces it with a generic clock icon, the sessions screen iOS sandbox story exposes only 1 of the 5 required variants, the error callout suggestion chips on Android ignore the primary/tertiary distinction in colour (all chips read as neutral), the `--elev-drawer` shadow is missing on Android, the fading-callout (S04 Recovered) and offline-dim (V01) interaction states are absent on both platforms, and dark-mode / storm-gate colour variants for the error callout are not exposed in any story on either platform.

Gap count: 19 (sessions-screen: 10 · error-screen: 9).

---

## View: sessions-screen

### Designed inventory

- 5 story variants: S01 Default Light, S02 Default Dark, S03 Empty Light, S04 Scrolled Light, S05 New Confirm Light
- Drawer: 82% width, max 312pt; "Rides" in `.t-opinion-md` italic serif; copper-outline "NEW" chip
- Session rows: title (`.t-title-sm`), italic preview (`.t-body-sm`), timestamp (`.t-instr-sm`), meta chips
- Active row: `--stroke-lg` (2px) left copper stripe + `color-mix(in srgb, var(--surface-card) 94%, var(--signal-default))`
- Section labels: ALL-CAPS (`.t-label-sm`), `--content-tertiary`; sticky in scroll
- Empty state S03: 54px dashed-border copper-whisper circle icon, opinion-serif headline, italic body, primary CTA
- Confirm dialog S05: centered over drawer, `--surface-card`, `--elev-overlay`
- Motion: `sidebarSlideIn` — `decelerated`, 240ms
- Drawer shadow: `2px 0 16px rgba(34,24,16,0.14)` (TOKEN_GAP — `--elev-drawer` not in tokens.css)
- No `org-topbar` — drawer owns chrome

### Native inventory

**iOS** (`SessionsScreenStory.swift`): 1 story only
**Android** (`SessionsScreenStory.kt`): 4 stories — default, empty, overflow, long-copy (no S02 Dark, no S05 Confirm)

### Gaps — sessions-screen

#### Gap A1-01: iOS story only exposes 1 of 5 designed variants
- **Severity**: HIGH
- **Remediation**: Add stories for S02 (dark), S03 (empty), S04 (scrolled), S05 (confirm). Android: add S02, S05.
- **Effort**: iOS=S, Android=S

#### Gap E1-02: "Rides" header uses wrong typography (title.lg, not opinion-serif)
- **Severity**: HIGH
- **iOS file**: `LSSessionsDrawer.swift` line 77 — `LSText("Rides", variant: .title.lg)`
- **Android file**: `LSSessionsDrawer.kt` line 160 — `TypographyVariant.Ui.Title.Lg`
- **Remediation**: Both — change to `.opinion.md` / `TypographyVariant.Opinion.Md`. Apply italic variant.
- **Effort**: iOS=S, Android=S

#### Gap C1-03: Active stripe width wrong — 3pt iOS / `theme.space.xs` Android (should be `--stroke-lg` 2pt)
- **Severity**: MED
- **iOS file**: `LSSessionsDrawer.swift` line 133 — `.frame(width: 3)`
- **Android file**: `LSSessionsDrawer.kt` lines 215–219 — `.width(theme.space.xs)`
- **Remediation**: iOS — `theme.strokeWidth.lg`. Android — `GeneratedTokens.sizing.stroke.lg`.
- **Effort**: iOS=S, Android=S

#### Gap D1-04: Active row background uses flat opacity, not `color-mix` recipe
- **Severity**: MED
- **iOS file**: `LSSessionsDrawer.swift` lines 157–160 — `signal.default.opacity(theme.opacity["5"]!)`
- **Android file**: `LSSessionsDrawer.kt` lines 194–197 — `Signal.default.copy(alpha = ... ?: 0.05f)`
- **Remediation**: Reference `signal.whisper` semantic token directly (which auto-resolves correctly in dark mode). Add to generated theme if absent.
- **Effort**: iOS=S, Android=S

#### Gap B1-05: Empty state — wrong icon on Android, missing entirely on iOS
- **Severity**: HIGH
- **Designed reference**: `sessions-screen.html` lines 986–991 — 54px pill, `--signal-whisper` bg, dashed `--signal-tint` border, compass SVG
- **iOS file**: no empty-state branch in `LSSessionsDrawer`
- **Android file**: `LSSessionsDrawer.kt` lines 291–315 — uses `LSIcon(Clock, Lg, Subtle)` + plain text
- **Remediation**: Both — build copper-whisper circle with dashed signal-tint border + compass icon + opinion-serif headline + italic body + primary CTA.
- **Effort**: iOS=M, Android=M

#### Gap D1-06: Drawer shadow not applied on Android; iOS uses wrong token
- **Severity**: MED
- **iOS file**: `LSSessionsDrawer.swift` lines 67–72 — `theme.elevation.level4.shadowColor.opacity(...)` — wrong elevation level
- **Android file**: `LSSessionsDrawer.kt` lines 84–133 — no `.shadow()` applied
- **Remediation**: Both — apply `2px 0 16px rgba(34,24,16,0.14)` directional shadow as view-local constant until `--elev-drawer` token added.
- **Effort**: iOS=S, Android=S

#### Gap G1-07: S05 Confirm dialog variant not implemented
- **Severity**: MED
- **Designed reference**: HTML lines 1154–1239 — centered dialog with `--surface-scrim` backdrop, opinion-serif headline "Start a new ride?"
- **Remediation**: Add `showingConfirmNewSession` state; show dialog when NEW tapped + `activeSessionId != nil`. Add S05 story.
- **Effort**: iOS=M, Android=M

#### Gap H1-08: Scrim dismiss tap not visually closing drawer on Android
- **Severity**: MED
- **Android file**: `SessionsScreen.kt` lines 59–88 — `DrawerSpec.onDismiss` callback wired but no local `drawerOpen` state
- **Remediation**: Add `var drawerOpen by remember` in `SessionsScreen.kt`; conditionally pass `leadingDrawer = if (drawerOpen) DrawerSpec(...) else null`.
- **Effort**: Android=S

#### Gap F1-09: Motion recipe uses hardcoded duration on iOS; Android uses default Compose spec
- **Severity**: LOW
- **Remediation**: iOS — verify `theme.motion.duration["standard"]` resolves to 240ms. Android — wrap drawer in `AnimatedVisibility` with `slideInHorizontally + fadeIn` using `EaseOutQuart` tween at 240ms.
- **Effort**: iOS=S, Android=S

#### Gap A1-10: Section grouping is static — only one group; no TONIGHT/LAST WEEK/EARLIER
- **Severity**: MED
- **Remediation**: Add date-based grouping at story/template layer. Pass multiple `(groupLabel, sessions)` pairs to `LSSessionsDrawer` (API change to support `GroupedSessions` model).
- **Effort**: iOS=M, Android=M

---

## View: error-screen

### Designed inventory

- 6 story variants: S01 Default Light, S02 Dark Storm-Gate, S03 Extended Impossible, S04 Recovered (suggestion tapped), V01 Offline, V02 Generic Failure (no chips)
- `LSInlineErrorCallout`: glass panel, `--status-warning` 2px top stripe, compass chip (warning tint), "THE NAVIGATOR" label, opinion-serif body, suggestion chips (primary: warning tint; tertiary: plain glass)
- Storm-gate variant: top stripe + compass + label use `--wx-storm` purple
- S04 Recovered: callout fades to 0.55 opacity; send button appears; chat field primed
- V01 Offline: wifi-off glyph watermark; chat dims to 0.7 opacity; buttons disabled
- V02 Generic: no chips rendered

### Native inventory

**iOS** (`ErrorScreenStory.swift`): 1 story — `templates.error.default`
**Android** (`ErrorScreenStory.kt`): 6 stories — default, network, impossible, safety-gate, long-detail, no-suggestions

### Gaps — error-screen

#### Gap E2-01: Error callout body uses wrong typography on iOS (heading.md not opinion.md)
- **Severity**: HIGH
- **iOS file**: `LSInlineErrorCallout.swift` line 54 — `LSText(messageBody, variant: .heading.md)` ("Use heading.md as proxy")
- **Android file**: `LSInlineErrorCallout.kt` line 109 — `TypographyVariant.Opinion.Md` (correct)
- **Remediation**: iOS — change to `.opinion.md`.
- **Effort**: iOS=S

#### Gap D2-02: Suggestion chips ignore primary/tertiary color distinction
- **Severity**: HIGH
- **Designed reference**: HTML lines 380–411 — `sugg-chip--primary` (warning tint bg/border/text) vs `sugg-chip--tertiary` (plain glass)
- **iOS file**: `LSInlineErrorCallout.swift` line 82 — `LSSuggestionChip` renders identically; no warning theming
- **Android file**: `LSInlineErrorCallout.kt` lines 174–192 — `isPrimary` maps to `ContentColor.Primary`/`Secondary`, not status warning colors
- **Android template**: `ErrorScreen.kt` line 76 — `isPrimary = true` hardcoded for ALL chips
- **Remediation**: Update `SuggestionChip` to use `StatusColor.Warning` for primary chips; fix `ErrorScreen.kt` to map tertiary chips correctly.
- **Effort**: iOS=M, Android=M

#### Gap D2-03: Storm-gate variant (`--wx-storm`) not implemented
- **Severity**: HIGH
- **Designed reference**: HTML lines 289–353 — `.callout--storm` modifier
- **Remediation**: Add `AccentColor.Storm`; thread `errorVariant: ErrorVariant` through `LSInlineErrorCallout`. Switch compass/label/border/stripe/chips based on variant.
- **Effort**: iOS=M, Android=M

#### Gap G2-04: S04 Recovered state (callout fade + send button) not implemented
- **Severity**: MED
- **Remediation**: Add `calloutOpacity` state; animate to 0.55 + show send button on suggestion tap. Add S04 story.
- **Effort**: iOS=S, Android=S

#### Gap B2-05: V01 Offline variant missing — wifi-off glyph + chat dim absent
- **Severity**: MED
- **Designed reference**: HTML lines 946–1059 — wifi-off SVG at `opacity: 0.25`, `--status-warning`; chat at 0.7 opacity
- **Remediation**: Add `isOffline: Bool` to `ErrorScreenState`. Render wifi-off glyph + dim chat.
- **Effort**: iOS=M, Android=M

#### Gap H2-06: Suggestion chips use HStack/Row (no wrap) — overflow clips
- **Severity**: MED
- **Remediation**: iOS — replace `HStack` with `FlowLayout`. Android — replace `Row` with `FlowRow`.
- **Effort**: iOS=M, Android=S

#### Gap A2-07: iOS exposes only 1 of 6 variants; story set asymmetric with Android
- **Severity**: HIGH
- **Remediation**: Add to iOS: network, impossible, safety-gate, long-detail, no-suggestions stories.
- **Effort**: iOS=S

#### Gap C2-08: Map slot wrong on both — iOS gradient placeholder; Android live interactive (should be static preview with broken-segment polyline)
- **Severity**: LOW
- **Remediation**: Both — switch map slot to static/preview mode; add broken-segment polyline overlay (dashed `--status-error`).
- **Effort**: iOS=M, Android=S

#### Gap F2-09: No chatOverlayEnter motion for suggestion chips
- **Severity**: LOW
- **Remediation**: Wrap `suggestionsRow` in `AnimatedVisibility` with `.move(edge:.bottom).combined(with:.opacity)`.
- **Effort**: iOS=S, Android=S

---

## Top-Priority Remediations

1. **E1-02 + E2-01 — Opinion-serif typography for "Rides" + callout body** (multiple files)
2. **D2-02 + D2-03 — Suggestion chip primary/tertiary distinction + storm-gate variant** (M each)
3. **B1-05 — Sessions empty state** (M each)
4. **A1-01 + A2-07 — Sandbox stories** (S each)
5. **G2-04 + B2-05 — Recovered state + Offline state** (M each)
6. **C1-03 + D1-04 — Active stripe + signal-whisper token** (S each)
7. **A1-10 — Date-based session grouping** (M each)
8. **D1-06 — Drawer trailing shadow** (S each)
