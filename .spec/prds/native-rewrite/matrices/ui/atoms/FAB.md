# FAB - STYLE PROPERTIES MATRIX

**Component:** FAB (Floating Action Button)
**RN Source:** `react-native/components/ui/fab.tsx`
**Framework Primitives:** `react-native-paper/src/components/FAB/FAB.tsx`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|
| RN Wrapper | `react-native/components/ui/fab.tsx` | Public API, semantic color mapping, visual decisions |
| Paper FAB | `node_modules/react-native-paper/src/components/FAB/FAB.tsx` | FAB layout, sizing, elevation, animations |
| Paper FAB (Android) | `node_modules/react-native-paper/src/components/FAB/ADAFAESF.tsx` | Android-specific implementation |

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| size | Paper | `56` (standard) | `Modifier.size(56.dp)` | `.frame(width: 56, height: 56)` | n/a (component-specific) |
| borderRadius | RN-wrapper | `semantic.radius.xl` = 16 | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.xl` |
| elevation | Paper | `6` (standard FAB) | `Modifier.shadow(elevation = 6.dp, ...)` | `.shadow(color: ..., radius: 12, y: 6)` | `elevation.light.4` (approx) |
| padding | Paper | `16` (internal) | `Modifier.padding(16.dp)` | `.padding(16)` | `space.lg` |

### Visual — Background Color

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| default | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| disabled | Paper | `opacity: 0.5` | `Modifier.alpha(0.5f)` | `.opacity(0.5)` | `opacity.disabled` |

### Visual — Text Color

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| default | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Visual — Icon Color

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| default | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Typography — Label

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | Paper | `14` | `14.sp` | `14` | `type.label.md.fontSize` |
| fontWeight | Paper | `'500'` (medium) | `FontWeight.Medium` | `.medium` | `type.label.md.fontWeight` |
| textTransform | Paper | `uppercase` | `textTransform = androidx.compose.ui.text.style.TextAlign` | `.textCase(.uppercase)` | n/a |
| letterSpacing | Paper | `0.75` | `letterSpacing = 0.75.sp` | `.tracking(0.75)` | n/a (component-specific) |

### Layout — Icon

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| size | Paper | `24` | `24.dp` | `24` | `iconSize.lg` |
| position | Paper | `left of label` | `Row` with `icon + label` | `HStack` with icon + label | n/a (layout) |
| spacing | Paper | `12` (icon to label) | `Spacer(Modifier.width(12.dp))` | `Spacer(minLength: 12)` | `space.md` |

### State — Visibility

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| visible | RN-wrapper | `visible` prop | `Modifier.alpha(if (visible) 1f else 0f)` | `.opacity(visible ? 1 : 0)` | n/a (behavior) |
| animation | Paper | `fade in/out` | `animateFloatAsState(...)` | `.animation(.easeInOut)` + `.opacity()` | `motion.duration.fade` |

### Interaction

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| accessibilityRole | Paper | `'button'` | `Modifier.semantics { role = Role.Button }` | `.accessibilityAddTraits(.isButton)` | n/a |
| onPress | RN-wrapper | `onPress` prop | `onClick` callback | `onTap` callback | n/a (callback) |
| testID | RN-wrapper | passed via prop | `Modifier.testTag(testID)` | `.accessibilityIdentifier(testID)` | n/a |

### Shadow/Elevation (by platform)

| Platform | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| Android | Paper | `elevation: 6` | `Modifier.shadow(elevation = 6.dp, ...)` | n/a | n/a (Android-specific) |
| iOS | Paper | `shadow` | n/a | `.shadow(color: ..., radius: ..., y: ...)` | `elevation.light.4` (approx) |

---

## NOTES

- **Size**: Standard FAB is 56×56dp, Mini FAB would be 40×40dp
- **Shape**: Uses `radius.xl` (16px) for rounded rectangle, not full circle
- **Elevation**: Higher elevation (6dp) than standard buttons for floating effect
- **Icon**: 24dp icon positioned left of label with 12dp spacing
- **Label**: Uppercase text with 0.75 letter spacing for Material Design feel
- **Visibility**: Animated fade in/out when visible prop changes
- **Positioning**: FAB is typically positioned absolutely at bottom-right of screen
- **Accessibility**: Properly labeled as button with press action
