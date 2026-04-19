# RideShareSheet — STYLE PROPERTIES MATRIX

**Component:** RideShareSheet
**Level:** Organism (Delta)
**Source:** UC-REC-06 (NEW for Sprint 2)
**Platform Mapping:** Android `BottomSheetScaffold` + share actions, iOS `.sheet` + share actions

---

## TRANSLATION SOURCES

| Property | RN wrapper source | Framework primitives | Native target file | Variants |
|---|---|---|---|---|
| Layout | NEW component (no RN source) | Bottom sheet + share APIs | Android: `app/src/main/java/com/laneshadow/ui/organisms/RideShareSheet.kt`<br>iOS: `app/ui/organisms/RideShareSheet.swift` | 3 variants: GPX, link, summary |

---

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property for this net-new component.

### Layout — Sheet Container

**Source files read:**
- Specification: UC-REC-06 (ride sharing use case)
- Design: Ride-context share sheet (GPX/link/summary variants)

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | detent | UC spec | `medium` (50% of screen) | `BottomSheetScaffold(sheetPeekHeight = 0.5 * screenHeight)` | `.presentationDetents([.medium])` | n/a |
| Visual | backgroundColor | UC spec | `semantic.color.card.default` | `LaneShadowTheme.colors.card` | `theme.colors.card` | `color.card.default` |
| Visual | cornerRadius | UC spec | `16` (top only) | `shape = RoundedCornerShape(16.dp)` | `.presentationCornerRadius(16)` | `radius.lg` |
| Visual | scrimColor | UC spec | `scrim.default` | `scrimColor = Color.Black.copy(alpha = 0.55f)` | `.background(Color.black.opacity(0.55))` | `color.scrim.default` |

### Layout — Header

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | padding | UC spec | `16` | `Modifier.padding(16.dp)` | `.padding(16)` | ESCALATE — `space.lg` |
| Layout | paddingBottom | UC spec | `12` | `Modifier.padding(bottom = 12.dp)` | `.padding(.bottom, 12)` | ESCALATE — `space.md` |
| Typography | variant | UC spec | `title.md` | `MaterialTheme.typography.titleMedium` | `.font(.titleMedium)` | ESCALATE — map to semantic |
| Typography | color | UC spec | `onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Layout — Share Options

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | gap | UC spec | `8` | `Spacer(Modifier.height(8.dp))` | `Spacer(minLength: 8)` | `space.sm` |
| Layout | padding | UC spec | `horizontal 16` | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |

### Layout — Share Option Item

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | height | UC spec | `56` | `Modifier.height(56.dp)` | `.frame(height: 56)` | ESCALATE — `touchTarget.min` |
| Layout | padding | UC spec | `12 16` | `Modifier.padding(horizontal = 16.dp, vertical = 12.dp)` | `.padding(.horizontal, 16).padding(.vertical, 12)` | ESCALATE — `space.md` + `space.lg` |
| Visual | backgroundColor (pressed) | UC spec | `muted.pressed` | (pressed branch) | (pressed branch) | `color.muted.pressed` |
| Visual | borderRadius | UC spec | `8` | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |
| Layout | gap | UC spec | `12` | `Spacer(Modifier.width(12.dp))` | `Spacer(minLength: 12)` | ESCALATE — `space.md` |

### Icon — Share Option

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Icon | size | UC spec | `24` | `Modifier.size(24.dp)` | `.frame(width: 24, height: 24)` | `iconSize.lg` |
| Icon | color | UC spec | `onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |

### Typography — Share Option Label

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Typography | fontSize | UC spec | `16` | `16.sp` | `font(.system(size: 16))` | `type.body.md.fontSize` |
| Typography | fontWeight | UC spec | `'400'` | `FontWeight.Normal` | `.regular` | `type.body.md.fontWeight` |
| Typography | color | UC spec | `onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Typography — Share Option Subtitle

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Typography | fontSize | UC spec | `12` | `12.sp` | `font(.system(size: 12))` | ESCALATE — `type.label.sm.fontSize = 11` (closest) |
| Typography | color | UC spec | `onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

### Layout — Cancel Button

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | padding | UC spec | `16` | `Modifier.padding(16.dp)` | `.padding(16)` | ESCALATE — `space.lg` |
| Layout | marginTop | UC spec | `8` | `Modifier.padding(top = 8.dp)` | `.padding(.top, 8)` | `space.sm` |

---

## DESIGN NOTES

- **Net-new component** for Sprint 2 delta
- Bottom sheet for sharing rides
- Three share options: GPX file, shareable link, summary text
- Each option shows icon + label + subtitle
- Cancel button at bottom
- Different from generic share sheet (ride-specific)

---

## VERIFICATION GATES

- Sheet slides up smoothly
- All options tappable
- Icons visible
- Labels readable
- Cancel button works

---

## DEPENDENCIES

- UI-001 (core theme contract)
- Button component
- IconSymbol component
- Share system (Android `ShareCompat.IntentBuilder`, iOS `UIActivityViewController`)
- Bottom sheet system

---

## COMPOSITION

- RideShareSheet = BottomSheet + [Header, ShareOptions, CancelButton]
- ShareOptions = [ShareOptionItem, ShareOptionItem, ShareOptionItem]
- ShareOptionItem = Row + [Icon, Column(label, subtitle)]
- Used by: RideCompletionScreen, RouteDetailsSheet
