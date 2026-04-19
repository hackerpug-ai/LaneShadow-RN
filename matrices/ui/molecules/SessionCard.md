# SessionCard - STYLE PROPERTIES MATRIX

**Component:** SessionCard
**RN Source:** `react-native/components/ui/session-card.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/ui/session-card.tsx` | Public API, layout, states, styling |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Status icon (see `matrices/ui/atoms/IconSymbol.md`) |
| Text (Paper) | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Title, meta, preview text |

---

## COMPOSITION

**Child atoms:**
- `IconSymbol` - Status indicator icon (active/completed/saved) (see `matrices/ui/atoms/IconSymbol.md`)

**Composition pattern:** Card container with header (title + icon + status badge), optional meta row, and preview text. Supports Pressable wrapper for interaction. Active state uses primary color tint.

**Layout:** Vertical column. Header is row (space-between). Meta and preview stacked below.

---

## STYLE PROPERTIES MATRIX

### Layout — Card

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| borderRadius | RN-wrapper | `12` | `RoundedCornerShape(12.dp)` | `RoundedRectangle(cornerRadius: 12)` | `radius.lg` |
| padding | RN-wrapper | `14` | `Modifier.padding(14.dp)` | `.padding(14)` | ESCALATE — between `space.md` (12) and `space.lg` (16); use `14.dp` literal |
| gap | RN-wrapper | `10` | `Arrangement.spacedBy(10.dp)` or `Column(verticalArrangement = Arrangement.spacedBy(10.dp))` | `Spacer(minLength: 10)` | ESCALATE — between `space.sm` (8) and `space.md` (12); use `10.dp` literal |
| borderWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | `borderWidth.thin` |

### Layout — Card (compact variant)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| padding | RN-wrapper | `10` | `Modifier.padding(10.dp)` | `.padding(10)` | ESCALATE — between `space.sm` (8) and `space.md` (12); use `10.dp` literal |
| gap | RN-wrapper | `6` | `Arrangement.spacedBy(6.dp)` | `Spacer(minLength: 6)` | ESCALATE — between `space.xs` (4) and `space.sm` (8); use `6.dp` literal |

### Layout — Header

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| justifyContent | RN-wrapper | `'space-between'` | `horizontalArrangement = Arrangement.SpaceBetween` | n/a | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |

### Layout — Header Left

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `10` | `Arrangement.spacedBy(10.dp)` | `Spacer(minLength: 10)` | ESCALATE — between `space.sm` (8) and `space.md` (12); use `10.dp` literal |
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.frame(maxWidth: .infinity)` | n/a |

### Layout — Status Badge

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| paddingHorizontal | RN-wrapper | `10` | `Modifier.padding(horizontal = 10.dp)` | `.padding(.horizontal, 10)` | ESCALATE — between `space.sm` (8) and `space.md` (12); use `10.dp` literal |
| paddingVertical | RN-wrapper | `4` | `Modifier.padding(vertical = 4.dp)` | `.padding(.vertical, 4)` | `space.xs` |
| borderRadius | RN-wrapper | `12` | `RoundedCornerShape(12.dp)` | `RoundedRectangle(cornerRadius: 12)` | `radius.lg` |

### Visual — Background (by state)

| State | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| active | RN-wrapper | `${semantic.color.primary.default}15` (8% opacity) | `LaneShadowTheme.colors.primary.copy(alpha = 0.08f)` | `theme.colors.primary.opacity(0.08)` | `color.primary.default` + `opacity.faint = 0.08` |
| inactive | RN-wrapper | `semantic.color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |

### Visual — Border (by state)

| State | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| active | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| inactive | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |

### Visual — Elevation (by state)

| State | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| default | RN-wrapper | `semantic.elevation[1]` | `Modifier.shadow(elevation = 1.dp)` | `.shadow(...)` | `elevation[1]` |
| pressed | RN-wrapper | `semantic.elevation[3]` | `Modifier.shadow(elevation = 3.dp)` | `.shadow(...)` | `elevation[3]` |

### Visual — Status Badge Background (by status)

| Status | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| active | RN-wrapper | `${semantic.color.primary.default}25` (15% opacity) | `LaneShadowTheme.colors.primary.copy(alpha = 0.15f)` | `theme.colors.primary.opacity(0.15)` | `color.primary.default` + `opacity.badge = 0.15` |
| completed | RN-wrapper | `${semantic.color.success.default}25` (15% opacity) | `LaneShadowTheme.colors.success.copy(alpha = 0.15f)` | `theme.colors.success.opacity(0.15)` | `color.success.default` + `opacity.badge = 0.15` |
| saved | RN-wrapper | `semantic.color.surfaceVariant.pressed` | `LaneShadowTheme.colors.surfaceVariantPressed` | `theme.colors.surfaceVariantPressed` | `color.surfaceVariant.pressed` |

### Typography — Title

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `16` | `16.sp` | `16` | `type.body.md.fontSize` |
| fontWeight | RN-wrapper | `700` (bold) | `FontWeight.Bold` | `.bold` | ESCALATE — propose `fontWeight.bold = 700` |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| numberOfLines | RN-wrapper | `1` | `maxLines = 1` | `.lineLimit(1)` | n/a |

### Typography — Status Badge Text

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `11` | `11.sp` | `11` | `type.label.xs.fontSize` |
| fontWeight | RN-wrapper | `700` (bold) | `FontWeight.Bold` | `.bold` | ESCALATE — `fontWeight.bold = 700` |
| textTransform | RN-wrapper | `'capitalize'` | `text = ...replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }` | `.textCase(.capitalize)` or manual | n/a |

### Typography — Status Text Color (by status)

| Status | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| active | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| completed | RN-wrapper | `semantic.color.success.default` | `LaneShadowTheme.colors.success` | `theme.colors.success` | `color.success.default` |
| saved | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

### Typography — Meta Text

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `13` | `13.sp` | `13` | ESCALATE — between `type.label.sm` (12) and `type.body.sm` (14); use `13.sp` literal |
| fontWeight | RN-wrapper | `500` (medium) | `FontWeight.Medium` | `.medium` | `type.label.md.fontWeight` |
| color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

### Typography — Preview Text

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `14` | `14.sp` | `14` | `type.body.sm.fontSize` |
| lineHeight | RN-wrapper | `20` | `LineHeight(20.sp)` | `.lineSpacing(20 - 14)` = 6 | `type.body.sm.lineHeight` |
| fontWeight | RN-wrapper | `400` (regular) | `FontWeight.Normal` | `.regular` | `type.body.sm.fontWeight` |
| color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| numberOfLines (default) | RN-wrapper | `2` | `maxLines = 2` | `.lineLimit(2)` | n/a |
| numberOfLines (compact) | RN-wrapper | `1` | `maxLines = 1` | `.lineLimit(1)` | n/a |

### Visual — Icon

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| size | RN-wrapper | `18` | `Modifier.size(18.dp)` | `.frame(width: 18, height: 18)` | ESCALATE — between `iconSize.sm` (16) and `iconSize.md` (18); use `18.dp` literal |

### Icon Name (by status)

| Status | Source | Icon name | Android equivalent | iOS equivalent |
|---|---|---|---|---|
| active | RN-wrapper | `radiobox-marked` | `Icons.Filled.RadioButtonChecked` | `SF Symbol: "checkmark.circle.fill"` |
| completed | RN-wrapper | `check-circle` | `Icons.Filled.CheckCircle` | `SF Symbol: "checkmark.circle.fill"` |
| saved | RN-wrapper | `bookmark` | `Icons.Outlined.Bookmark` or `Icons.Filled.Bookmark` | `SF Symbol: "bookmark.fill"` |

### Icon Color (by status)

| Status | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| active | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| completed | RN-wrapper | `semantic.color.success.default` | `LaneShadowTheme.colors.success` | `theme.colors.success` | `color.success.default` |
| saved | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

### Interaction

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| opacity (pressed) | RN-wrapper | `0.8` (when !isActive) | `Modifier.alpha(0.8f)` | `.opacity(0.8)` | ESCALATE — propose `opacity.pressed = 0.8` |
| accessibilityRole | RN-wrapper | `'button'` | `Modifier.semantics { role = Role.Button }` | `.accessibilityAddTraits(.isButton)` | n/a |
| accessibilityState.selected | RN-wrapper | `isActive` | `Modifier.semantics { selected = isActive }` | `.accessibilityAddTraits(.isSelected)` | n/a |
| delayLongPress | RN-wrapper | `500` | `Modifier.combinedClickable(...onLongClick = ..., delayLongPressMillis = 500)` | `.gesture(LongPressGesture(minimumDuration: 0.5).onEnded { ... })` | n/a |

---

## NOTES

- **Three states:** Active (primary tint), completed (green accent), saved (neutral)
- **Compact variant:** Smaller padding and gap when `compact=true`
- **Status icons:** Uses MaterialCommunityIcons names; map to platform equivalents
- **Status badge:** Pill-shaped badge with status text and background color
- **Date formatting:** Relative dates (Today, Yesterday, X days ago) or absolute date
- **Elevation:** Default elevation[1], elevation[3] on press (when not active)
- **Preview truncation:** 2 lines default, 1 line when compact
- **Active state:** 8% opacity primary background with primary border
- **Long press:** 500ms delay for long press gesture
