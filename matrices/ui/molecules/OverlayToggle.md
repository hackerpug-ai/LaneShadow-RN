# OverlayToggle - STYLE PROPERTIES MATRIX

**Component:** OverlayToggle
**RN Source:** `react-native/components/map/overlay-toggle.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`, `react-native/components/ui/toggle-group.tsx`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/map/overlay-toggle.tsx` | Public API, pill container layout |
| ToggleGroup | `react-native/components/ui/toggle-group.tsx` | Single-selection toggle behavior (see `matrices/ui/molecules/ToggleGroup.md`) |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Overlay icons (wind, rain, temperature) (see `matrices/ui/atoms/IconSymbol.md`) |
| Pressable | `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` | Toggle item press feedback |

---

## COMPOSITION

**Child atoms:**
- `IconSymbol` - Overlay type icons (wind, rain, temperature) (see `matrices/ui/atoms/IconSymbol.md`)

**Composition pattern:** Horizontal row of three pill-style toggle buttons (wind, rain, temperature) within a rounded container. Uses `ToggleGroup` context for single-selection behavior. Disabled toggles show at 50% opacity with no press feedback. Selected toggle shows accent background with copper icon.

**Layout:** Horizontal flex container with rounded container background. Three toggle items arranged horizontally with 4px horizontal margin each.

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| backgroundColor | RN-wrapper | `semantic.color.surface.default` | `MaterialTheme.colorScheme.surface` | `Color(.systemBackground)` | `color.surface.default` |
| borderRadius | RN-wrapper | `semantic.radius.xl` = 16 | `Modifier.clip(RoundedCornerShape(16.dp))` | `.clipShape(RoundedRectangle(cornerRadius: 16))` | `radius.xl` |
| paddingHorizontal | RN-wrapper | `semantic.space.xs` = 4 | `Modifier.padding(horizontal = 4.dp)` | `.padding(.horizontal, 4)` | `space.xs` |
| paddingVertical | RN-wrapper | `semantic.space.xs` = 4 | `Modifier.padding(vertical = 4.dp)` | `.padding(.vertical, 4)` | `space.xs` |

### Layout — Toggle Item

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `semantic.space['3xl']` = 48 | `Modifier.size(48.dp)` | `.frame(width: 48, height: 48)` | ESCALATE — propose `size.overlayToggleButton = 48` |
| height | RN-wrapper | `semantic.space['3xl']` = 48 | n/a | n/a | n/a |
| borderRadius | RN-wrapper | `semantic.radius.lg` = 12 | `Modifier.clip(RoundedCornerShape(12.dp))` | `.clipShape(RoundedRectangle(cornerRadius: 12))` | `radius.lg` |
| marginHorizontal | RN-wrapper | `4` | `Modifier.padding(horizontal = 4.dp)` | `.padding(.horizontal, 4)` | `space.xs` |
| alignItems | RN-wrapper | `'center'` | `contentAlignment = Alignment.Center` | n/a | n/a |
| justifyContent | RN-wrapper | `'center'` | `contentAlignment = Alignment.Center` | n/a | n/a |

### Visual — Item Background Color

| State | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| selected | RN-wrapper | `semantic.color.accent.default` | `MaterialTheme.colorScheme.tertiaryContainer` | `Color(.systemOrange)` | `color.accent.default` |
| normal | RN-wrapper | `semantic.color.surfaceVariant.default` | `MaterialTheme.colorScheme.surfaceVariant` | `Color(.systemGray6)` | `color.surfaceVariant.default` |
| disabled | RN-wrapper | `'transparent'` | `Color.Transparent` | `Color.clear` | n/a |

### Visual — Icon Color

| State | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| selected | RN-wrapper | `semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurface` | `Color(.label)` | `color.onSurface.default` |
| normal | RN-wrapper | `semantic.color.onSurface.muted` | `MaterialTheme.colorScheme.onSurfaceVariant` | `Color(.secondaryLabel)` | `color.onSurface.muted` |
| disabled | RN-wrapper | `semantic.color.onSurface.disabled` → `semantic.color.onSurface.muted` fallback | `MaterialTheme.colorScheme.onSurface.copy(alpha = 0.38f)` | `Color(.tertiaryLabel)` | `color.onSurface.disabled` |

### Visual — Disabled State

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| opacity | RN-wrapper | `0.5` | `Modifier.alpha(0.5f)` | `.opacity(0.5)` | ESCALATE — propose `opacity.disabledOverlay = 0.5` |

### Visual — Ripple Effect (Android)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| color | RN-wrapper | `${semantic.color.primary.default}33` (20% opacity) | `rememberRipple(bounded = true, radius = 24.dp, color = Color.Blue.copy(alpha = 0.2f))` | n/a (iOS doesn't have ripple) | `color.primary.default` + `opacity.subtle` |

### Visual — Elevation

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| elevation | RN-wrapper | `semantic.elevation[2]` | `Modifier.shadow(4.dp, ambient = 0.1f, spot = 0f)` or `Modifier.graphicsLayer { shadowElevation = 4f }` | `.shadow(color: .black.opacity(0.1), radius: 4, x: 0, y: 2)` | `elevation[2]` |

### Icon — Size

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| size | RN-wrapper | `semantic.space.lg` = 16 | `Modifier.size(16.dp)` | `.frame(width: 16, height: 16)` | ESCALATE — propose `iconSize.overlayToggle = 16` |

### Interaction

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| onPress | RN-wrapper | callback prop (via ToggleGroup) | `Modifier.clickable { onPress() }` | `.onTapGesture { onPress() }` | n/a |
| disabled | RN-wrapper | `!available` | `Modifier.enabled(false)` or `enabled: false` | `.disabled(true)` | n/a |
| accessibilityRole | RN-wrapper | `'button'` | `Modifier.semantics { role = Role.Button }` | `.accessibilityAddTraits(.isButton)` | n/a |
| accessibilityState | RN-wrapper | `{ disabled: !available, selected: isSelected }` | `Modifier.semantics { disabled = !available; selected = isSelected }` | `.accessibilityElement(children: .combine).accessibilityLabel(...).accessibilityAddTraits(.isButton).accessibilityValue(selected ? "Yes" : "No")` | n/a |
| accessibilityLabel | RN-wrapper | OVERLAY_LABELS (e.g., 'Wind overlay') | `contentDescription = "Wind overlay"` | `.accessibilityLabel("Wind overlay")` | n/a |

---

## NOTES

- **ToggleGroup pattern:** Uses `ToggleGroup` with `type="single"` for single-selection behavior
- **Disabled state:** Unavailable overlays show at 50% opacity and don't respond to press
- **Selection feedback:** Selected toggle shows accent background (copper/orange)
- **Ripple effect:** Android-only ripple effect using primary color at 20% opacity
- **Icon names:** Wind = 'weather-windy', Rain = 'water-outline', Temperature = 'thermometer'
- **Container padding:** 4px horizontal/vertical padding around toggle items
- **Item spacing:** 4px horizontal margin between toggle items
- **Square items:** Toggle items are square (48×48px) for consistent touch targets
- **Accessibility:** Each toggle has accessibilityLabel (e.g., 'Wind overlay') and exposes disabled/selected state
