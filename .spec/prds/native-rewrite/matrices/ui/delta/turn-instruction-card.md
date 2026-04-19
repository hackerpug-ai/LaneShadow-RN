# TurnInstructionCard — STYLE PROPERTIES MATRIX

**Component:** TurnInstructionCard
**Level:** Molecule (Delta)
**Source:** UC-NAV-02, UC-FLOW-06 (NEW for Sprint 2)
**Platform Mapping:** Android `Row` + icons, iOS `HStack` + icons

---

## TRANSLATION SOURCES

| Property | RN wrapper source | Framework primitives | Native target file | Variants |
|---|---|---|---|---|
| Layout | NEW component (no RN source) | Row + icons | Android: `app/src/main/java/com/laneshadow/ui/molecules/TurnInstructionCard.kt`<br>iOS: `app/ui/molecules/TurnInstructionCard.swift` | 1 fixed layout with dynamic content |

---

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property for this net-new component.

### Layout — Card Container

**Source files read:**
- Specification: UC-NAV-02, UC-FLOW-06 (navigation/ride flow use cases)
- Design: Maneuver icon + street + distance + lane guidance

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flexDirection | UC spec | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout | alignItems | UC spec | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| Layout | padding | UC spec | `12` | `Modifier.padding(12.dp)` | `.padding(12)` | ESCALATE — `space.md` |
| Layout | gap | UC spec | `12` | `Spacer(Modifier.width(12.dp))` | `Spacer(minLength: 12)` | ESCALATE — `space.md` |
| Visual | backgroundColor | UC spec | `semantic.color.card.default` | `LaneShadowTheme.colors.card` | `theme.colors.card` | `color.card.default` |
| Visual | borderRadius | UC spec | `12` | `RoundedCornerShape(12.dp)` | `RoundedRectangle(cornerRadius: 12)` | `radius.md` |
| Visual | shadow | UC spec | `elevation[2]` | `Modifier.shadow(elevation = 2.dp)` | `.shadow(color:.black.opacity(0.05), radius:4, y:2)` | `elevation.light.2` |

### Layout — Maneuver Icon

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | size | UC spec | `40` | `Modifier.size(40.dp)` | `.frame(width: 40, height: 40)` | ESCALATE — `size.turnIcon = 40` |
| Visual | backgroundColor | UC spec | `semantic.color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| Visual | borderRadius | UC spec | `radius.md` = 8 | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |
| Icon | name | UC spec | Dynamic (turn-left, turn-right, etc.) | `Icons.Outlined.[Direction]` | `[direction].fill` | n/a |
| Icon | size | UC spec | `24` | `Modifier.size(24.dp)` | `.frame(width: 24, height: 24)` | `iconSize.lg` |
| Icon | color | UC spec | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

### Typography — Street Name

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Typography | fontSize | UC spec | `16` | `16.sp` | `font(.system(size: 16))` | `type.body.md.fontSize` |
| Typography | fontWeight | UC spec | `'600'` | `FontWeight.SemiBold` | `.semibold` | `type.body.md.fontWeight` |
| Typography | color | UC spec | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Typography | maxWidth | UC spec | `200` | `Modifier.requiredWidthIn(max = 200.dp)` | `.frame(maxWidth: 200)` | ESCALATE — propose `size.streetNameMaxWidth = 200` |

### Typography — Distance

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Typography | fontSize | UC spec | `14` | `14.sp` | `font(.system(size: 14))` | `type.label.md.fontSize` |
| Typography | fontWeight | UC spec | `'500'` | `FontWeight.Medium` | `.medium` | `type.label.md.fontWeight` |
| Typography | color | UC spec | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

### Layout — Lane Guidance

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flexDirection | UC spec | `'row'` | `Row(...)` | `HStack` | n/a |
| Layout | gap | UC spec | `4` | `Spacer(Modifier.width(4.dp))` | `Spacer(minLength: 4)` | `space.xs` |
| Layout | laneIconSize | UC spec | `16` | `Modifier.size(16.dp)` | `.frame(width: 16, height: 16)` | `iconSize.sm` |
| Visual | laneColor | UC spec | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

---

## DESIGN NOTES

- **Net-new component** for Sprint 2 delta
- Consolidates turn instruction display
- Shows maneuver icon, street name, distance, lane guidance
- Compact card layout
- Used in navigation overlay and ride completion
- Replaces `TurnInstructionBanner` from FLOW-06

---

## VERIFICATION GATES

- Icon matches turn direction
- Street name readable
- Distance formatted correctly
- Lane guidance visible
- Card layout balanced

---

## DEPENDENCIES

- UI-001 (core theme contract)
- IconSymbol component (or custom maneuver icons)

---

## COMPOSITION

- TurnInstructionCard = Row + [ManeuverIcon, Column(street, distance), LaneGuidance]
- Used by: NavigationOverlay, RideCompletionScreen
