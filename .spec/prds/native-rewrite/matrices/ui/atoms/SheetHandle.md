# SheetHandle - STYLE PROPERTIES MATRIX

**Component:** SheetHandle
**RN Source:** `react-native/components/sheets/sheet-handle.tsx`
**Framework Primitives:** `View`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|
| RN Wrapper | `react-native/components/sheets/sheet-handle.tsx` | Public API, visual affordance for bottom sheets |
| View | `react-native/Libraries/Components/View/View.js` | Handle rendering |

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a (layout) |
| alignItems | RN-wrapper | `'center'` | `Modifier.align(Alignment.CenterHorizontally)` | `.frame(maxWidth: .infinity).overlay(alignment: .center)` | n/a |
| justifyContent | RN-wrapper | `'center'` | n/a | n/a | n/a |

### Layout — Handle

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| width | RN-wrapper | `48` | `Modifier.width(48.dp)` | `.frame(width: 48)` | n/a (component-specific) |
| height | RN-wrapper | `5` | `Modifier.height(5.dp)` | `.frame(height: 5)` | n/a (component-specific) |
| borderRadius | RN-wrapper | `999` | `CircleShape` | `Capsule()` | n/a (component-specific) |

### Visual — Handle Color

| State | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| default | RN-wrapper | `semantic.color.onSurface.subtle` | `MaterialTheme.colors.onSurface.copy(alpha = 0.6f)` | `Color(UIColor.tertiaryLabel)` | `color.onSurface.subtle` |

### Layout — Flex/Alignment

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| alignSelf | RN-wrapper | `'center'` (container) | `Modifier.align(Alignment.CenterHorizontally)` | `.frame(maxWidth: .infinity).overlay(alignment: .center)` | n/a |

### Interaction

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| accessibilityRole | RN-wrapper | `none` | `Modifier.semantics { role = Role.None }` | n/a | n/a |
| testID | RN-wrapper | `"sheet-handle"` | `Modifier.testTag("sheet-handle")` | `.accessibilityIdentifier("sheet-handle")` | n/a |

### Visual — Background

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.onSurface.subtle` | `MaterialTheme.colors.onSurface.copy(alpha = 0.6f)` | `Color(UIColor.tertiaryLabel)` | `color.onSurface.subtle` |

---

## NOTES

- **Purpose**: Visual affordance at top of bottom sheets indicating draggability
- **Placement**: Centered horizontally at top of sheet content
- **Color**: Uses onSurface.subtle (60% opacity) for subtle appearance
- **Size**: 48×5px pill with full rounded corners (capsule)
- **Accessibility**: Purely visual, no interaction needed
- **Material Design**: Follows MD3 bottom sheet handle pattern
- **Gorhom**: Typically used with Gorhom bottom sheet library
