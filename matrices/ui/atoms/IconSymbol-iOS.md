# IconSymbol (iOS) - STYLE PROPERTIES MATRIX

**Component:** IconSymbol (iOS)
**RN Source:** `react-native/components/ui/icon-symbol.ios.tsx`
**Framework Primitives:** `SF Symbols` (iOS native)

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|
| RN Wrapper | `react-native/components/ui/icon-symbol.ios.tsx` | Public API, SF Symbol name mapping |
| SF Symbols | `expo-symbols` | iOS native icon system |

---

## STYLE PROPERTIES MATRIX

### Layout — Size

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| default size | RN-wrapper | `24` | `24.dp` | `Image(uiImage: ...).resizable().scaledToFit().frame(width: 24, height: 24)` | `iconSize.md` |
| custom size | RN-wrapper | `size` prop | `Modifier.size(size.dp)` | `.frame(width: size, height: size)` | `iconSize.*` (various) |

### Visual — Color

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| default | RN-wrapper | `color` prop (required) | `tint = Color(...)` | `.foregroundColor(Color(...))` | varies by usage |
| opacity | RN-wrapper | `1.0` (default) | `alpha = 1f` | `.opacity(1.0)` | n/a (can override) |

### Icon — Name Mapping

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| name type | RN-wrapper | `SF Symbol name` | Use Material name directly | `UIImage(systemName: ...)` | n/a (iOS-specific) |
| mapping strategy | RN-wrapper | `SF Symbol names → Material names` | Manual mapping table | Direct SF Symbol name | n/a (design decision) |

### Platform — Native Implementation

| Platform | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| iOS (native) | RN-wrapper | `SF Symbols` | n/a | `Image(systemName: ...)` | n/a (platform-specific) |
| iOS (fallback) | RN-wrapper | `MaterialCommunityIcons` | n/a | `Icon(...)` (fallback) | n/a (fallback) |

### Size — Standard Tokens

| Token | Source | Value | Android | iOS | Usage |
|---|---|---|---|---|---|
| xs | tokens | `12` | `12.dp` | `12` | Small icons, badges |
| sm | tokens | `14` | `14.dp` | `14` | Inline icons, buttons |
| md | tokens | `16` | `16.dp` | `16` | List icons, inputs |
| md2 | tokens | `20` | `20.dp` | `20` | Input icons |
| lg | tokens | `24` | `24.dp` | `24` | Default size, navigation |
| xl | tokens | `28` | `28.dp` | `28` | Large icons |
| 2xl | tokens | `32` | `32.dp` | `32` | Extra large icons |
| emptyState | tokens | `40` | `40.dp` | `40` | Empty state icons |
| logoDot | tokens | `3` | `3.dp` | `3` | Logo decoration dots |

### Weight — iOS SF Symbol

| Weight | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| default | RN-wrapper | `regular` | n/a | `.weight(.regular)` | n/a (SF Symbol) |
| medium | RN-wrapper | `medium` | n/a | `.weight(.medium)` | n/a (SF Symbol) |
| semibold | RN-wrapper | `semibold` | n/a | `.weight(.semibold)` | n/a (SF Symbol) |
| bold | RN-wrapper | `bold` | n/a | `.weight(.bold)` | n/a (SF Symbol) |

### Rendering Mode — iOS

| Mode | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| default | RN-wrapper | n/a | n/a | `.renderingMode(.template)` | n/a (SF Symbol) |
| multicolor | RN-wrapper | n/a | n/a | `.renderingMode(.original)` | n/a (SF Symbol) |
| hierarchical | RN-wrapper | n/a | n/a | `.symbolRenderingMode(.hierarchical)` | n/a (SF Symbol) |
| palette | RN-wrapper | n/a | n/a | `.symbolRenderingMode(.palette)` | n/a (SF Symbol) |

### Variant — iOS SF Symbol

| Variant | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fill | RN-wrapper | `.fill` suffix | n/a | `.symbolVariant(.fill)` | n/a (SF Symbol) |
| circle | RN-wrapper | `.circle` suffix | n/a | `.symbolVariant(.circle)` | n/a (SF Symbol) |
| square | RN-wrapper | `.square` suffix | n/a | `.symbolVariant(.square)` | n/a (SF Symbol) |
| rectangle | RN-wrapper | `.rectangle` suffix | n/a | `.symbolVariant(.rectangle)` | n/a (SF Symbol) |

### Interaction

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| accessibilityRole | RN-wrapper | `'image'` | `Modifier.semantics { role = Role.Image }` | `.accessibilityElement` | n/a |
| accessibilityLabel | RN-wrapper | passed via prop | `Modifier.semantics { this.contentDescription = label }` | `.accessibilityLabel(label)` | n/a |
| testID | RN-wrapper | passed via prop | `Modifier.testTag(testID)` | `.accessibilityIdentifier(testID)` | n/a |

---

## NOTES

- **iOS-specific**: Uses native SF Symbols instead of MaterialCommunityIcons
- **Name mapping**: Requires manual mapping from SF Symbol names to Material names for Android
- **Weight**: Supports SF Symbol weights (regular, medium, semibold, bold)
- **Variants**: Supports SF Symbol variants (fill, circle, square, rectangle)
- **Rendering modes**: Supports template, multicolor, hierarchical, palette modes
- **Size**: Standard icon size tokens apply
- **Fallback**: Can fall back to MaterialCommunityIcons if needed
- **Platform-specific**: This file only used on iOS, Android uses icon-symbol.tsx
