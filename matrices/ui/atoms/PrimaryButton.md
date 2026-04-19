# PrimaryButton - STYLE PROPERTIES MATRIX

**Component:** PrimaryButton
**RN Source:** `react-native/components/ui/primary-button.tsx`
**Framework Primitives:** `View`, `Text`, `IconSymbol`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|
| RN Wrapper | `react-native/components/ui/primary-button.tsx` | Public API, glow effect, loading state |
| View | `react-native/Libraries/Components/View/View.js` | Button container, shadow rendering |
| Paper Text | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Text rendering |

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| height | RN-wrapper | `56` (default) | `Modifier.height(56.dp)` | `.frame(height: 56)` | n/a (component-specific) |
| borderRadius | RN-wrapper | `20` | `RoundedCornerShape(20.dp)` | `RoundedRectangle(cornerRadius: 20)` | `radius.xl` |
| paddingHorizontal | RN-wrapper | `24` | `Modifier.padding(horizontal = 24.dp)` | `.padding(.horizontal, 24)` | `space.xl` |
| width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a (layout) |

### Layout — Content

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| justifyContent | RN-wrapper | `'center'` | `horizontalArrangement = Arrangement.Center` | n/a | n/a |
| gap | RN-wrapper | `8` | `Arrangement.spacedBy(8.dp)` | `.spacing(8)` | `space.sm` |

### Visual — Background Color (by state)

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| default | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| disabled | RN-wrapper | `semantic.color.primary.disabled` | `LaneShadowTheme.colors.primaryDisabled` | `theme.colors.primaryDisabled` | `color.primary.disabled` |

### Visual — Text Color

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| default | RN-wrapper | `semantic.color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |
| disabled | RN-wrapper | `semantic.color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |

### Visual — Glow Effect (by state)

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| default | RN-wrapper | `shadowColor: rgba(184, 115, 50, 0.4)` | `Modifier.shadow(color = Color(0xB87333).copy(alpha = 0.4f), ...)` | `.shadow(color: Color(rgba: 0xB8, 0x73, 0x33, 0.4), ...)` | n/a (glow effect) |
| disabled | RN-wrapper | `shadowColor: transparent` | `Modifier.shadow(color = Color.Transparent, ...)` | `.shadow(color: .clear, ...)` | n/a (no glow) |
| shadowOffset | RN-wrapper | `{ width: 0, height: 8 }` | `offset = ShadowOffset(0.dp, 8.dp)` | `.shadow(radius: 16, y: 8)` | n/a (effect) |
| shadowOpacity | RN-wrapper | `0.4` (default), `0` (disabled) | `alpha = 0.4f` (via shadow color alpha) | `opacity: 0.4` (via shadow color alpha) | n/a (effect) |
| shadowRadius | RN-wrapper | `16` | `blurRadius = 16.dp` | `.shadow(radius: 16)` | n/a (effect) |
| elevation (Android) | RN-wrapper | `4` (default), `0` (disabled) | `Modifier.shadow(elevation = 4.dp, ...)` | n/a (Android only) | n/a (Android-specific) |

### Typography — Button Text

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `16` | `16.sp` | `16` | `type.body.md.fontSize` |
| fontWeight | RN-wrapper | `'600'` (semibold) | `FontWeight.SemiBold` | `.semibold` | `fontWeight.semibold` |
| color | RN-wrapper | `semantic.color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |

### Layout — Icon

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| size | RN-wrapper | `20` | `20.dp` | `20` | `iconSize.md` |
| color | RN-wrapper | `semantic.color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |
| spacing | RN-wrapper | `8` | `Spacer(Modifier.width(8.dp))` | `Spacer(minLength: 8)` | `space.sm` |
| position | RN-wrapper | `left of text` | `Row` with `icon + text` | `HStack` with icon + text | n/a (layout) |

### State — Loading

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| loading | RN-wrapper | `loading` prop | show progress indicator | show progress indicator | n/a (behavior) |
| loading text | RN-wrapper | `"Loading..."` | same text | same text | n/a (copy) |
| interaction | RN-wrapper | `disabled when loading` | `enabled = !loading` | `.disabled(loading)` | n/a (behavior) |

### Interaction

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| onPress | RN-wrapper | `onPress` prop | `onClick` callback | `onTap` callback | n/a (callback) |
| accessibilityRole | RN-wrapper | `'button'` | `Modifier.semantics { role = Role.Button }` | `.accessibilityAddTraits(.isButton)` | n/a |
| accessibilityState.disabled | RN-wrapper | `disabled || loading` | `Modifier.semantics { disabled() }` | `.accessibilityAddTraits(.notEnabled)` | n/a |
| testID | RN-wrapper | passed via prop | `Modifier.testTag(testID)` | `.accessibilityIdentifier(testID)` | n/a |

---

## NOTES

- **Height**: Default 56px, customizable via height prop
- **Glow effect**: Orange glow (rgba(184, 115, 50, 0.4)) with 8px offset and 16px radius
- **Disabled**: No glow, uses primary.disabled color
- **Loading**: Shows "Loading..." text, disables button
- **Icon**: Optional 20dp icon left of text with 8dp spacing
- **Shadow**: Android uses elevation 4, iOS uses custom shadow
- **Border radius**: 20px for pill-shaped button
- **Typography**: 16px semibold text with onPrimary color
