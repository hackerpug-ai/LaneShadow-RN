# Design Review: map-layer + topbar-navbar + sessions-drawer
**Reviewer**: frontend-designer Agent D
**Date**: 2026-04-27

---

## Summary

Across all three chrome-layer organisms, both platforms have correct slot presence and the broad z-order contract is intact. The distortion is concentrated in five areas: (1) the iOS `LSMapLayer` safe-area architecture is inverted — it ignores safe areas at the organism level and leaves each overlay slot to manage its own insets, which is wrong per spec; (2) the top-overlay clearance token (`--space-10`, 48pt) is not honored on Android; (3) `LSTopBar` on iOS uses the wrong typography class for the centered title (`title.md` instead of `opinion.md`) and its hit target math is fragile; (4) `LSNavBar` on both platforms is missing the filter-chip row and search-slot variants, providing only a basic back+title+close toolbar; (5) `LSSessionsDrawer` on both platforms wraps the entire organism in `LSGlassPanel.chrome` — a glass blur container — when the design calls for a solid `--surface-card` background. Several additional session-row token substitutions and missing meta-row sub-elements compound the Android drawer's deviation.

---

## Organism: map-layer

### Designed inventory

7 named slots in z-order: `map` (z-0), `scrim` (z-1), `topOverlay`/`bottomOverlay` (z-2), `bottomSheet` (z-3), `leadingDrawer` (z-4), `topBar` (z-5). Organism owns safe-area math centrally. Top overlay inset `--space-10` (48pt). Drawer 82%/312pt. Scrim uses `--surface-scrim`. Motion: `sidebarSlideIn` spring 320ms.

### Native inventory

**iOS** (`LSMapLayer.swift`): All 7 slots present. ZStack ordering correct. Top-overlay padding only system safe area, not the spec's 48pt clearance. `LSBottomSheet` missing `.small` detent.

**Android** (`LSMapLayer.kt`): All 7 slots. Top overlays only `statusBarsPadding()`. Drawer animation `tween` not spring. Scrim correctly wires `onTap = leadingDrawer?.onDismiss`.

### Gaps

#### Gap A-01: Safe-area / top-overlay clearance wrong on both platforms
- **Severity**: HIGH
- **Designed reference**: README — top-overlay `top: var(--space-10)` (48pt)
- **iOS file**: `LSMapLayer.swift` lines 51–53 — `.padding(.top)` only
- **Android file**: `LSMapLayer.kt` lines 81–84 — `statusBarsPadding()` only
- **Remediation**: Add 48pt clearance after system safe area inset. Expose `topBarClearance` parameter defaulting to `theme.space.xxxl`.
- **Effort**: iOS=S, Android=S

#### Gap A-02: Bottom-overlay horizontal inset missing at organism level
- **Severity**: MED
- **Designed reference**: README — bottom-overlay `left/right: var(--space-4)` (12pt)
- **Android file**: `LSMapLayer.kt` lines 88–100 — no horizontal padding on bottom overlay container
- **Remediation**: Android — wrap bottom-overlay in `Modifier.padding(horizontal = theme.space.md)`.
- **Effort**: Android=S

#### Gap A-03: Scrim dismiss tap not wired on iOS
- **Severity**: MED
- **iOS file**: `LSMapLayer.swift` line 43–46 — `LSScrim` has no tap callback; `DrawerSpec.onDismiss` orphaned
- **Remediation**: Pass `onDismiss: leadingDrawer?.onDismiss` to `LSScrim`. If `LSScrim` doesn't accept tap callback, add `onTap` API.
- **Effort**: iOS=S

#### Gap A-04: Drawer slide animation is tween not spring on Android
- **Severity**: LOW
- **Android file**: `LSMapLayer.kt` lines 126–168 — `tween(durationMillis = ...)` with `decelerated` easing
- **Remediation**: Replace with `spring(dampingRatio = 0.85f, stiffness = Spring.StiffnessMedium)`.
- **Effort**: Android=S

#### Gap A-05: `LSBottomSheet` `Small` detent absent on iOS
- **Severity**: LOW
- **Remediation**: Add `.small` case to iOS `BottomSheetSpec.Detent`; map to `PresentationDetent.fraction(0.3)`.
- **Effort**: iOS=S

---

## Organism: topbar-navbar

### Designed inventory

**TopBar**: 4 variants (Default, With Title, Hamburger Only, Record Highlight). Title uses `.t-opinion-md` (Newsreader serif). Chips `--space-9` (40pt) tall with `--radius-md`, `--surface-overlay`, `blur(8px)`. Record dot pulse via `@keyframes`.

**NavBar**: 3 variants (Back+Title+Close, Filter chip row, Search slot). Container `--surface-card`, no blur.

### Native inventory

**iOS TopBar**: 4 variants present. Title uses `.title.md` (wrong). Chip size fragile arithmetic. Record dot static.

**iOS NavBar**: Single variant only. No filter row, no search slot.

**Android TopBar**: 3 trailing variants. `chipHeight = 40.dp` hardcoded. `RecordHighlightChip` no glass wrapper. Pulse stubbed.

**Android NavBar**: Delegates to `LSToolbar`. No filter row, no search slot.

### Gaps

#### Gap B-01: TopBar centered title uses wrong typography on both platforms
- **Severity**: HIGH
- **Designed reference**: README — `.t-opinion-md` for TopBar centered title
- **iOS file**: `LSTopBar.swift` line 39 — `LSText(title, variant: .title.md)`
- **Android file**: `LSTopBar.kt` line 106 — `TypographyVariant.Ui.Title.Md`
- **Remediation**: iOS — `.opinion.md`. Android — `TypographyVariant.Opinion.Md`.
- **Effort**: iOS=S, Android=S

#### Gap B-02: LSNavBar missing filter-chip row variant
- **Severity**: HIGH
- **Designed reference**: README NavBar — N.02 with `mol-filter-chip` horizontal scroll row
- **Remediation**: Add `filterChips: [FilterChipSpec]?` parameter. Render horizontal scrolling `LSFilterChip` row when non-nil.
- **Effort**: iOS=M, Android=M

#### Gap B-03: LSNavBar missing search slot variant
- **Severity**: MED
- **Designed reference**: README NavBar — N.03 with `--surface-inset` background
- **Remediation**: Add `searchSlot: SearchSlotSpec?` parameter. Pair with B-02 as one NavBar extension task.
- **Effort**: iOS=M, Android=M

#### Gap B-04: RecordHighlightChip missing glass panel wrapper on Android
- **Severity**: MED
- **Android file**: `LSTopBar.kt` lines 232–252 — bare `Row`, no glass, no border, no `--status-error-tint` background
- **Remediation**: Wrap content in `LSGlassPanel` with record-specific variant (or apply error-tint background + border).
- **Effort**: Android=S

#### Gap B-05: Record dot pulse animation stubbed on both platforms
- **Severity**: MED
- **iOS file**: `LSTopBar.swift` line 103–106 — static `Circle`
- **Android file**: `LSTopBar.kt` line 261 — comment "would be added in production"
- **Remediation**: iOS — `@State pulsing` + `.animation(.easeInOut(duration: 1.4).repeatForever(), value: pulsing)`. Android — `InfiniteTransition` cycling 1.0↔0.45 over 1400ms.
- **Effort**: iOS=S, Android=S

#### Gap B-06: Hamburger chip hit target fragile on iOS / hardcoded on Android (both <44pt)
- **Severity**: LOW
- **iOS file**: `LSTopBar.swift` line 116 — `chipSize = theme.space.xl + theme.space.md + theme.space.xs` (fragile sum)
- **Android file**: `LSTopBar.kt` line 54 — `chipHeight = 40.dp` literal
- **Remediation**: iOS — replace arithmetic + use `.contentShape(Rectangle().size(CGSize(width: 44, height: 44)))`. Android — replace `40.dp` with token + `Modifier.minimumTouchTargetSize()`.
- **Effort**: iOS=S, Android=S

---

## Organism: sessions-drawer

### Designed inventory

Container: `--surface-card` (solid, NO blur), `--elev-overlay` shadow, border-right separator. Width: 312pt/82%. Header: opinion-lg "Rides" title. Active row: `--signal-whisper` background, `--stroke-lg` (2pt) left stripe `--signal-default`.

### Native inventory

**iOS** (`LSSessionsDrawer.swift`): Wraps in `LSGlassPanel(.chrome)` (WRONG — should be solid). Title uses `.title.lg` (wrong). Active stripe 3pt hardcoded. Active row uses raw alpha. No meta row sub-elements.

**Android** (`LSSessionsDrawer.kt`): Wraps in `LSGlassPanel(Chrome)` (WRONG). Title uses `Ui.Title.Lg` (wrong). Active stripe `theme.space.xs` (wrong token). Preview text uses raw `material3.Text`. **`Session` data class not declared in file — won't compile**.

### Gaps

#### Gap C-01: Container uses glass panel instead of solid surface-card on both platforms
- **Severity**: HIGH (primary distortion — map bleeds through drawer making text unreadable)
- **Designed reference**: README — container `background: var(--surface-card)`, `box-shadow: var(--elev-overlay)`; HTML explicitly does NOT apply glass blur
- **iOS file**: `LSSessionsDrawer.swift` line 38 — `LSGlassPanel(variant: .chrome, padding: .spacing4)`
- **Android file**: `LSSessionsDrawer.kt` line 84 — `LSGlassPanel(variant = GlassVariant.Chrome, ...)`
- **Remediation**: Replace with plain `VStack`/`Column` + `background(theme.colors.surface.card)` + shadow via `--elev-overlay`. Add border-right separator.
- **Effort**: iOS=S, Android=S

#### Gap C-02: "Rides" title uses wrong typography (title.lg, not opinion.lg)
- **Severity**: HIGH
- **iOS file**: `LSSessionsDrawer.swift` line 77
- **Android file**: `LSSessionsDrawer.kt` line 159
- **Remediation**: iOS — `.opinion.lg`. Android — `TypographyVariant.Opinion.Lg`.
- **Effort**: iOS=S, Android=S

#### Gap C-03: Active stripe width wrong (3pt iOS / `theme.space.xs` Android)
- **Severity**: MED
- **Remediation**: iOS — `theme.strokeWidth.lg`. Android — `GeneratedTokens.sizing.stroke.lg`.
- **Effort**: iOS=S, Android=S

#### Gap C-04: Active row background uses raw opacity instead of `--signal-whisper` token
- **Severity**: MED
- **Remediation**: Use `theme.colors.signal.whisper` directly. Add semantic token to generated theme if missing.
- **Effort**: iOS=S, Android=S

#### Gap C-05: Session row missing variant dot + meta-chip sub-elements on iOS
- **Severity**: MED
- **iOS file**: `LSSessionsDrawer.swift` lines 128–167 — no third meta row
- **Remediation**: iOS — add third HStack with variant dot (`Rectangle().fill(variantColor).frame(width: 8, height: 2)`) + `LSText(metaLabel, variant: .label.sm)`. Android — add Box with colored variant dot before meta label.
- **Effort**: iOS=M, Android=S

#### Gap C-06: Session row height hardcoded at 72pt on iOS
- **Severity**: LOW
- **iOS file**: `LSSessionsDrawer.swift` line 11 — `private let sessionRowHeight: CGFloat = 72`
- **Remediation**: Remove fixed-height frame; let row size to content with padding tokens.
- **Effort**: iOS=S

#### Gap C-07: Android Session data class undeclared (build break)
- **Severity**: HIGH (file won't compile)
- **Android file**: `LSSessionsDrawer.kt` references `Session` type but no declaration
- **Remediation**: Add `data class Session(val id, val title, val whenLabel, val preview, val meta)` at top of file or import from shared model package.
- **Effort**: Android=S

#### Gap C-08: Section-label grouped sections not implemented (multiple groups)
- **Severity**: LOW
- **Remediation**: Change session list API to accept `sections: [SessionSection]` model; render `LSSectionHeader` per group.
- **Effort**: iOS=M, Android=M

---

## Top-Priority Remediations

1. **C-01** — Remove `LSGlassPanel` from drawer; use solid `--surface-card`. Primary distortion fix.
2. **C-07** — Define `Session` data class in Android. Build break.
3. **A-01** — Top-overlay 48pt clearance on both platforms.
4. **B-01 + C-02** — Opinion-serif typography on TopBar title + drawer header.
5. **B-02 + B-03** — NavBar filter-chip row + search slot variants.
6. **C-04** — `signal.whisper` semantic token for active row.
7. **A-03** — iOS scrim dismiss tap.
8. **B-04 + B-05** — Record chip glass + pulse animation.
9. **C-05** — iOS session row meta sub-elements.
