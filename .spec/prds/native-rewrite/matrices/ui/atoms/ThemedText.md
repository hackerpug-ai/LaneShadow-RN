# ThemedText - STYLE PROPERTIES MATRIX

**Component:** ThemedText
**RN Source:** `react-native/components/themed-text.tsx`
**Framework Primitives:** `Paper Text`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|
| RN Wrapper | `react-native/components/themed-text.tsx` | Public API, semantic color mapping |
| Paper Text | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Typography variants |

---

## STYLE PROPERTIES MATRIX

### Typography — Variants

| Type | Source | Paper variant | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| default | RN-wrapper | `bodyMedium` | `MaterialTheme.typography.bodyMedium` | `.font(.system(size: 16, weight: .regular))` | `type.body.md` |
| defaultSemiBold | RN-wrapper | `titleSmall` | `MaterialTheme.typography.titleSmall` | `.font(.system(size: 14, weight: .semibold))` | n/a (custom) |

### Visual — Color

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Typography — default (bodyMedium)

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | Paper | `16` | `16.sp` | `16` | `type.body.md.fontSize` |
| fontWeight | Paper | `'400'` (normal) | `FontWeight.Normal` | `.regular` | `type.body.md.fontWeight` |
| lineHeight | Paper | `24` | `24.sp` | `24` | `type.body.md.lineHeight` |
| letterSpacing | Paper | `0` (default) | `0.sp` | `0` | n/a (default) |

### Typography — defaultSemiBold (titleSmall)

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | Paper | `14` | `14.sp` | `14` | n/a (custom) |
| fontWeight | Paper | `'600'` (semibold) | `FontWeight.SemiBold` | `.semibold` | `fontWeight.semibold` |
| lineHeight | Paper | `20` | `20.sp` | `20` | n/a (custom) |
| letterSpacing | Paper | `0` (default) | `0.sp` | `0` | n/a (default) |

### Layout — Flex/Alignment

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flex | RN-wrapper | `none` (default) | `Modifier` (no flex) | `.layoutPriority(0)` | n/a (layout) |
| alignSelf | RN-wrapper | `auto` | `Modifier.align(Alignment.Start)` (default) | `.frame(maxWidth: .infinity, alignment: .leading)` | n/a (layout) |

### Interaction

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| accessibilityRole | RN-wrapper | `none` | `Modifier.semantics { role = Role.None }` | n/a | n/a |
| testID | RN-wrapper | passed via prop | `Modifier.testTag(testID)` | `.accessibilityIdentifier(testID)` | n/a |

### Style — Overrides

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| style | RN-wrapper | `style` prop | `Modifier` (no direct style) | `.font(...)` etc. | varies |

---

## NOTES

- **Purpose**: Lightweight themed text wrapper for type-checking
- **Variants**: Only `default` and `defaultSemiBold` types supported
- **Color**: Always uses `onSurface.default` for consistency
- **Paper integration**: Uses Paper Text variants for cross-platform typography
- **Minimal**: Simplified component, not intended for all text use cases
- **Future**: Could expand to support more type variants as needed
