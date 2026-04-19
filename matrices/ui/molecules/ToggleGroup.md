# ToggleGroup - STYLE PROPERTIES MATRIX

**Component:** ToggleGroup
**RN Source:** `react-native/components/ui/toggle-group.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|
| RN Wrapper | `react-native/components/ui/toggle-group.tsx` | Public API, variants, sizes, selection modes, layout |
| Pressable | `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` | Press feedback, hit behavior |
| Toggle (child) | `react-native/components/ui/toggle.tsx` | Child toggle atoms referenced via context |

---

## COMPOSITION

**Child atoms:**
- `Toggle` - Individual toggle buttons (see `matrices/ui/atoms/Toggle.md`)

**Composition pattern:** Context-based composition. Parent ToggleGroup provides variant, size, disabled state to children via ToggleGroupContext. Each ToggleGroupItem renders as a Pressable with toggle styling.

**Layout:** Horizontal row (`flexDirection: 'row'`), center alignment, gap between items.

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `semantic.space.xs` = 4 | `Modifier.padding` or `Arrangement.spacedBy(4.dp)` | `Spacer(minLength: 4)` or spacing | `space.xs` |

### Layout — Item Heights (by size)

| Size | Source | Height value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| sm | RN-wrapper | `36` | `Modifier.height(36.dp)` | `.frame(height: 36)` | `space.xl + space.md` (composed) |
| default | RN-wrapper | `40` | `Modifier.height(40.dp)` | `.frame(height: 40)` | `space.2xl + space.sm` |
| lg | RN-wrapper | `44` | `Modifier.height(44.dp)` | `.frame(height: 44)` | `space.2xl + space.md` |

### Layout — Item Padding

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| paddingHorizontal | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |
| iconSpacing | RN-wrapper | `semantic.space.sm` = 8 | `Spacer(Modifier.width(8.dp))` | `Spacer(minLength: 8)` | `space.sm` |

### Layout — Border Radius

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| borderRadius | RN-wrapper | `semantic.radius.md` = 8 | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |

### Visual — Background Color (by variant × state)

| Variant | State | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| default | idle | RN-wrapper | `'transparent'` | `Color.Transparent` | `.clear` | n/a |
| default | pressed | RN-wrapper | `semantic.color.muted.pressed` | `LaneShadowTheme.colors.mutedPressed` | `theme.colors.mutedPressed` | `color.muted.pressed` |
| default | selected | RN-wrapper | `semantic.color.accent.default` | `LaneShadowTheme.colors.accent` | `theme.colors.accent` | `color.accent.default` |
| outline | idle | RN-wrapper | `'transparent'` | `Color.Transparent` | `.clear` | n/a |
| outline | pressed | RN-wrapper | `semantic.color.muted.pressed` | `LaneShadowTheme.colors.mutedPressed` | `theme.colors.mutedPressed` | `color.muted.pressed` |
| outline | selected | RN-wrapper | `semantic.color.accent.default` | `LaneShadowTheme.colors.accent` | `theme.colors.accent` | `color.accent.default` |

### Visual — Border (outline variant only)

| Variant | Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| outline | borderWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | `borderWidth.thin` |
| outline | borderColor | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |

### Visual — Text Color

| State | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| idle | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| selected | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| pressed | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| disabled | RN-wrapper | `semantic.color.onSurface.disabled` | `LaneShadowTheme.colors.onSurfaceDisabled` | `theme.colors.onSurfaceDisabled` | `color.onSurface.disabled` |

### Visual — Opacity

| State | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| disabled | RN-wrapper | `0.5` | `Modifier.alpha(0.5f)` | `.opacity(0.5)` | `opacity.disabled` |

### Typography

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper (via Toggle) | 14 | `14.sp` | `14` | `type.label.md.fontSize` |
| fontWeight | RN-wrapper (via Toggle) | 500 (medium) | `FontWeight.Medium` | `.medium` | `type.label.md.fontWeight` |

### Interaction

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| accessibilityRole | RN-wrapper | `'button'` | `Modifier.semantics { role = Role.Button }` | `.accessibilityAddTraits(.isButton)` | n/a |
| accessibilityState.selected | RN-wrapper | `isPressed` | `Modifier.semantics { selected = isPressed }` | `.accessibilityAddTraits(.isSelected)` | n/a |
| accessibilityState.disabled | RN-wrapper | `disabled` | `Modifier.semantics { disabled() }` | `.accessibilityAddTraits(.notEnabled)` | n/a |

---

## NOTES

- **Selection modes:** Supports `single` (radio behavior) and `multiple` (checkbox behavior)
- **Context pattern:** ToggleGroupContext provides variant, size, disabled, and selection state to children
- **Child composition:** ToggleGroupItem renders as Pressable with Toggle-like styling
- **Gap spacing:** Uses `space.xs` (4pt) gap between items in the row
- **State management:** Parent manages value state; children call `onValueChange` on press
- **Android ripple:** Uses `android_ripple` with `semantic.color.muted.pressed` for press feedback
