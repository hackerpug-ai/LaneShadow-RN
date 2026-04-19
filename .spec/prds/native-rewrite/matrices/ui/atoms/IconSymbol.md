# IconSymbol - STYLE PROPERTIES MATRIX

**Component:** IconSymbol
**RN Source:** `react-native/components/ui/icon-symbol.tsx`
**Framework Primitives:** `MaterialCommunityIcons` (Android/Web), `SF Symbols` (iOS - native)

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|
| RN Wrapper | `react-native/components/ui/icon-symbol.tsx` | Public API, icon name mapping, size/color props |
| MaterialCommunityIcons | `@expo/vector-icons/MaterialCommunityIcons` | Icon rendering on Android/Web |
| SF Symbols | `expo-symbols` (iOS native) | Icon system on iOS (native fallback) |

---

## STYLE PROPERTIES MATRIX

### Layout — Size

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| default size | RN-wrapper | `24` | `24.dp` | `Image(uiImage: ...).resizable().scaledToFit().frame(width: 24, height: 24)` | `iconSize.md` |
| custom size | RN-wrapper | `size` prop | `Modifier.size(size.dp)` | `.frame(width: size, height: size)` | `iconSize.*` (various) |
| weight | RN-wrapper | `weight` prop (iOS only) | n/a | `.symbolRenderingMode(.hierarchical)` + `.weight(...)` | n/a (SF Symbol API) |

### Visual — Color

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| default | RN-wrapper | `color` prop (required) | `tint = Color(...)` | `.foregroundColor(Color(...))` | varies by usage |
| opacity | RN-wrapper | `1.0` (default) | `alpha = 1f` | `.opacity(1.0)` | n/a (can override) |

### Icon — Name Mapping

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| name type | RN-wrapper | `IconName = keyof typeof MaterialCommunityIcons.glyphMap` | `MaterialCommunityIcons.glyphMap[name]` | `UIImage(systemName: ...)` (requires manual mapping) | n/a (icon system) |
| mapping strategy | RN-wrapper | `SF Symbol names → Material names` | Use Material name directly | Manual mapping table | n/a (design decision) |

### Platform — Native Implementation

| Platform | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| Android | RN-wrapper | `MaterialCommunityIcons` | `Icon(MaterialCommunityIcons, ...)` | n/a | n/a (platform-specific) |
| iOS (native) | RN-wrapper | `SF Symbols` | n/a | `Image(systemName: ...)` | n/a (platform-specific) |
| iOS (RN) | RN-wrapper | `MaterialCommunityIcons` | n/a | `Icon(...)` (fallback) | n/a (fallback) |

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

### Interaction

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| accessibilityRole | RN-wrapper | `'image'` | `Modifier.semantics { role = Role.Image }` | `.accessibilityElement` | n/a |
| accessibilityLabel | RN-wrapper | passed via prop | `Modifier.semantics { this.contentDescription = label }` | `.accessibilityLabel(label)` | n/a |
| testID | RN-wrapper | passed via prop | `Modifier.testTag(testID)` | `.accessibilityIdentifier(testID)` | n/a |

### Style

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| style | RN-wrapper | `style` prop (TextStyle) | `Modifier` (no direct style prop) | `.font(...)` etc. | varies |

---

## NOTES

- **Icon system**: Uses MaterialCommunityIcons on all platforms for consistency
- **SF Symbols**: iOS native can use SF Symbols with manual name mapping
- **Size**: Default 24dp, customizable via size prop
- **Color**: Required color prop, applies tint to icon
- **Weight**: Only applies to iOS SF Symbols, ignored on Android
- **Accessibility**: Should provide accessibilityLabel for screen readers
- **Name mapping**: SF Symbol names need manual mapping to Material names
- **Multicolor**: Some SF Symbols support multicolor rendering mode
