# ThemedView - STYLE PROPERTIES MATRIX

**Component:** ThemedView
**RN Source:** `react-native/components/themed-view.tsx`
**Framework Primitives:** `View`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|
| RN Wrapper | `react-native/components/themed-view.tsx` | Public API, semantic background color |
| View | `react-native/Libraries/Components/View/View.js` | Container rendering |

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'column'` | `Column(...)` | `VStack` | n/a (default) |
| width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a (layout) |
| height | RN-wrapper | `'auto'` | `Modifier.wrapContentHeight()` | n/a | n/a (layout) |

### Visual — Background Color

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |

### Layout — Flex/Alignment

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flex | RN-wrapper | `none` (default) | `Modifier` (no flex) | `.layoutPriority(0)` | n/a (layout) |
| alignSelf | RN-wrapper | `auto` | `Modifier.align(Alignment.Start)` (default) | n/a | n/a (layout) |

### Style — Overrides

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| style | RN-wrapper | `style` prop | `Modifier` (no direct style) | `.background(...)` etc. | varies |

### Interaction

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| accessibilityRole | RN-wrapper | `none` | `Modifier.semantics { role = Role.None }` | n/a | n/a |
| testID | RN-wrapper | passed via prop | `Modifier.testTag(testID)` | `.accessibilityIdentifier(testID)` | n/a |

### Border — Default

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| borderWidth | RN-wrapper | `0` (none) | `Modifier.border(0.dp)` | n/a | n/a (default) |
| borderRadius | RN-wrapper | `0` (none) | `Modifier.clip(RectangleShape)` | n/a | n/a (default) |

---

## NOTES

- **Purpose**: Lightweight themed view wrapper for consistent background + border tokens
- **Background**: Always uses `surface.default` for consistency
- **Minimal**: Simplified component for basic themed containers
- **Style overrides**: Supports style prop for customization
- **Flex**: Column direction by default (standard for containers)
- **Future**: Could expand to support border, radius, and more semantic tokens
