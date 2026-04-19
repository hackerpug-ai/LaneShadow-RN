# Card - STYLE PROPERTIES MATRIX

**Component:** Card
**RN Source:** `react-native/components/ui/card.tsx`
**Framework Primitives:** `Pressable`, `View`, `Text`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|
| RN Wrapper | `react-native/components/ui/card.tsx` | Public API, variants, compound components, visual decisions |
| Pressable | `react-native/Libraries/Components/Pressable/Pressable.js` | Press feedback (when onPress provided) |
| Paper Text | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Typography metrics for title/description |

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| borderRadius | RN-wrapper | `semantic.radius.lg` = 16 | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.lg` |
| padding | RN-wrapper | `semantic.space.lg` = 16 | `Modifier.padding(16.dp)` | `.padding(16)` | `space.lg` |
| width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a (layout) |

### Visual — Background Color (by variant × state)

| Variant | State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| default | default | RN-wrapper | `semantic.color.card.default` | `LaneShadowTheme.colors.card` | `theme.colors.card` | `color.card.default` |
| default | pressed | RN-wrapper | `semantic.color.card.pressed` | `LaneShadowTheme.colors.cardPressed` | `theme.colors.cardPressed` | `color.card.pressed` |
| default | disabled | RN-wrapper | `semantic.color.card.disabled` | `LaneShadowTheme.colors.cardDisabled` | `theme.colors.cardDisabled` | `color.card.disabled` |
| primary | default | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| primary | pressed | RN-wrapper | `semantic.color.primary.pressed` | `LaneShadowTheme.colors.primaryPressed` | `theme.colors.primaryPressed` | `color.primary.pressed` |
| success | default | RN-wrapper | `semantic.color.success.default` | `LaneShadowTheme.colors.success` | `theme.colors.success` | `color.success.default` |
| success | pressed | RN-wrapper | `semantic.color.success.pressed` | `LaneShadowTheme.colors.successPressed` | `theme.colors.successPressed` | `color.success.pressed` |
| warning | default | RN-wrapper | `semantic.color.warning.default` | `LaneShadowTheme.colors.warning` | `theme.colors.warning` | `color.warning.default` |
| warning | pressed | RN-wrapper | `semantic.color.warning.pressed` | `LaneShadowTheme.colors.warningPressed` | `theme.colors.warningPressed` | `color.warning.pressed` |
| danger | default | RN-wrapper | `semantic.color.danger.default` | `LaneShadowTheme.colors.danger` | `theme.colors.danger` | `color.danger.default` |
| danger | pressed | RN-wrapper | `semantic.color.danger.pressed` | `LaneShadowTheme.colors.dangerPressed` | `theme.colors.dangerPressed` | `color.danger.pressed` |

### Visual — Border (when showBorder=true)

| Variant | Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| any | borderWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | `borderWidth.thin` |
| any | borderColor | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |

### Visual — Elevation (by state)

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| default | RN-wrapper | `semantic.elevation[2]` | `Modifier.shadow(elevation = 2.dp, ...)` | `.shadow(color: ..., radius: 4, y: 2)` | `elevation.light.2` |
| pressed | RN-wrapper | `semantic.elevation[3]` | `Modifier.shadow(elevation = 3.dp, ...)` | `.shadow(color: ..., radius: 8, y: 4)` | `elevation.light.3` |

### Typography — CardTitle

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | Paper | `16` | `16.sp` | `16` | `type.title.md.fontSize` |
| fontWeight | Paper | `'600'` (semibold) | `FontWeight.SemiBold` | `.semibold` | `fontWeight.semibold` |
| lineHeight | Paper | `24` | `LineHeightStyle` or `lineHeight = 24.sp` | `.lineSpacing(24 - 16)` = 8 | `type.title.md.lineHeight` |
| color (default variant) | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| color (colored variant) | RN-wrapper | `semantic.color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |

### Typography — CardDescription

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | Paper | `14` | `14.sp` | `14` | `type.body.sm.fontSize` |
| fontWeight | Paper | `'400'` (normal) | `FontWeight.Normal` | `.regular` | `type.body.sm.fontWeight` |
| lineHeight | Paper | `21` | `LineHeightStyle` or `lineHeight = 21.sp` | `.lineSpacing(21 - 14)` = 7 | `type.body.sm.lineHeight` |
| color (default variant) | RN-wrapper | `semantic.color.onSurface.muted` | `MaterialTheme.colors.onSurface.copy(alpha = 0.7f)` | `Color(UIColor.tertiaryLabel)` | `color.onSurface.muted` |
| color (colored variant) | RN-wrapper | `semantic.color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |

### Layout — CardHeader

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| justifyContent | RN-wrapper | `'space-between'` | `horizontalArrangement = Arrangement.SpaceBetween` | n/a | n/a |
| marginBottom | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(bottom = 12.dp)` | `.padding(.bottom, 12)` | `space.md` |

### Layout — CardContent

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.layoutPriority(1)` | n/a (layout) |

### Interaction

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| accessibilityRole | RN-wrapper | `'button'` (when onPress) | `Modifier.semantics { role = Role.Button }` | `.accessibilityAddTraits(.isButton)` | n/a |
| accessibilityState.disabled | RN-wrapper | `disabled` prop | `Modifier.semantics { disabled() }` | `.accessibilityAddTraits(.notEnabled)` | n/a |
| testID | RN-wrapper | passed via prop | `Modifier.testTag(testID)` | `.accessibilityIdentifier(testID)` | n/a |

### State — Press Feedback

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| pressable | RN-wrapper | `when onPress provided` | `clickable()` + `indication = ripple()` | `.buttonStyle(.plain)` | n/a (behavior) |
| pressed state | RN-wrapper | `elevation[3] + background pressed color` | `pressed` state callback | `.pressed()` callback | n/a (behavior) |

---

## NOTES

- **Compound components**: `CardHeader`, `CardTitle`, `CardContent`, `CardDescription`
- **Variants**: default, primary, success, warning, danger
- **Border**: Optional (showBorder prop), uses thin border with border color
- **Elevation**: Default 2, increases to 3 when pressed
- **Pressable**: Only interactive when onPress prop provided
- **Typography colors**: White text on colored variants, onSurface/default on default
- **Spacing**: 16px internal padding, 12px margin below header
