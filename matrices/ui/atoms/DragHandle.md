# DragHandle - STYLE PROPERTIES MATRIX

**Component:** DragHandle
**RN Source:** `react-native/components/ui/drag-handle.tsx`
**Framework Primitives:** `View`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|
| RN Wrapper | `react-native/components/ui/drag-handle.tsx` | Public API, visual affordance for draggable sheets |
| View | `react-native/Libraries/Components/View/View.js` | Drag handle rendering |

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| alignSelf | RN-wrapper | `'center'` | `Modifier.align(Alignment.CenterHorizontally)` | `.frame(maxWidth: .infinity).overlay(..., alignment: .top)` | n/a (layout) |
| marginVertical | RN-wrapper | `8` | `Modifier.padding(vertical = 8.dp)` | `.padding(.vertical, 8)` | `space.sm` |

### Layout — Handle

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| width | RN-wrapper | `36` (default) | `Modifier.width(36.dp)` | `.frame(width: 36)` | n/a (component-specific) |
| height | RN-wrapper | `4` (default) | `Modifier.height(4.dp)` | `.frame(height: 4)` | n/a (component-specific) |
| borderRadius | RN-wrapper | `2` (default) | `RoundedCornerShape(2.dp)` | `RoundedRectangle(cornerRadius: 2)` | n/a (component-specific) |

### Visual — Handle Color

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| default | RN-wrapper | `semantic.color.onSurface.subtle` | `MaterialTheme.colors.onSurface.copy(alpha = 0.4f)` | `Color(UIColor.tertiaryLabel)` | `color.onSurface.subtle` |

### Props — Customization

| Prop | Source | Default | Android | iOS | Token |
|---|---|---|---|---|---|
| width | RN-wrapper | `36` | `Modifier.width(width.dp)` | `.frame(width: width)` | n/a (override) |
| height | RN-wrapper | `4` | `Modifier.height(height.dp)` | `.frame(height: height)` | n/a (override) |
| borderRadius | RN-wrapper | `2` | `RoundedCornerShape(borderRadius.dp)` | `RoundedRectangle(cornerRadius: borderRadius)` | n/a (override) |

### Layout — Flex/Alignment

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| alignItems | RN-wrapper | `'center'` (implicit via alignSelf) | `Modifier.align(Alignment.CenterHorizontally)` | `.frame(maxWidth: .infinity).overlay(alignment: .center)` | n/a |
| justifyContent | RN-wrapper | `'center'` (implicit) | n/a | n/a | n/a |

### Interaction

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| accessibilityRole | RN-wrapper | `none` | `Modifier.semantics { role = Role.None }` | n/a | n/a |
| testID | RN-wrapper | passed via prop | `Modifier.testTag(testID)` | `.accessibilityIdentifier(testID)` | n/a |

### Visual — Background

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.onSurface.subtle` | `MaterialTheme.colors.onSurface.copy(alpha = 0.4f)` | `Color(UIColor.tertiaryLabel)` | `color.onSurface.subtle` |

---

## NOTES

- **Purpose**: Visual affordance indicating a bottom sheet is draggable
- **Placement**: Centered horizontally at top of bottom sheet
- **Color**: Uses onSurface.subtle (40% opacity) for subtle appearance
- **Size**: Default 36×4px with 2px border radius (pill shape)
- **Customization**: Width, height, and borderRadius can be overridden via props
- **Spacing**: 8px vertical margin from sheet edge
- **Accessibility**: Typically no interaction, purely visual affordance
- **Material Design**: Follows MD3 bottom sheet drag handle pattern
