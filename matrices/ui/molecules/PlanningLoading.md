# PlanningLoading - STYLE PROPERTIES MATRIX

**Component:** PlanningLoading
**RN Source:** `react-native/components/sheets/planning-loading.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native-paper/src/components/ActivityIndicator/ActivityIndicator.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/sheets/planning-loading.tsx` | Public API, loading overlay layout |
| ActivityIndicator | `node_modules/react-native-paper/src/components/ActivityIndicator/ActivityIndicator.js` | Platform loading spinner |
| Button | `react-native/components/ui/button.tsx` | Cancel button (see `matrices/ui/atoms/Button.md`) |
| Text (Paper) | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | "Planning your route..." message |

---

## COMPOSITION

**Child atoms/molecules:**
- `Button` - Cancel button (see `matrices/ui/atoms/Button.md`)

**Composition pattern:** Full-screen overlay with scrim background. Centered content column with ActivityIndicator, message text, and cancel button. Used during route planning operation.

**Layout:** Absolute positioned container (full screen) with zIndex 1000. Content centered vertically and horizontally.

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| position | RN-wrapper | `'absolute'` | `Modifier.fillMaxSize()` with parent Box | `.frame(maxWidth: .infinity, maxHeight: .infinity).position(x: 0, y: 0)` | n/a |
| top | RN-wrapper | `0` | Included in absolute fill | Included in absolute fill | n/a |
| left | RN-wrapper | `0` | Included in absolute fill | Included in absolute fill | n/a |
| right | RN-wrapper | `0` | Included in absolute fill | Included in absolute fill | n/a |
| bottom | RN-wrapper | `0` | Included in absolute fill | Included in absolute fill | n/a |
| zIndex | RN-wrapper | `1000` | `Modifier.zIndex(1000f)` | `.zIndex(1000)` | n/a |

### Layout — Content

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| justifyContent | RN-wrapper | `'center'` | `contentAlignment = Alignment.Center` | n/a | n/a |
| alignItems | RN-wrapper | `'center'` | `horizontalAlignment = Alignment.CenterHorizontally` | n/a | n/a |
| gap | RN-wrapper | `semantic.space.lg` = 16 | `Arrangement.spacedBy(16.dp)` inside Column | `.spacing(16)` | `space.lg` |

### Visual — Container Background

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.scrim.default` | `Color.Black.copy(alpha = 0.6f)` or custom scrim color | `Color.black.opacity(0.6)` or `Color(.systemBackground).opacity(0.8)` | `color.scrim.default` |

### Visual — ActivityIndicator

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| size | RN-wrapper | `semantic.space.xl` = 24 | `Modifier.size(24.dp)` | `.controlSize(.large)` | ESCALATE — propose `size.activityIndicator = 24` |
| color | RN-wrapper | `semantic.color.primary.default` | `Color(...)` in ActivityIndicator | `.tint(...)` | `color.primary.default` |
| animating | RN-wrapper | `true` | `animating = true` | `isAnimating = true` | n/a |

### Typography — Message

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `'bodyMedium'` | `MaterialTheme.typography.bodyMedium` | `.font(.system(size: 14))` | `type.body.md` |
| color | RN-wrapper | `semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurface` | `Color(.label)` | `color.onSurface.default` |
| text | RN-wrapper | `'Planning your route...'` | `Text("Planning your route...")` | `Text("Planning your route...")` | n/a |

### Button — Cancel

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `'outline'` | `OutlinedButton` or `ButtonDefaults.outlinedButtonColors` | `.buttonStyle(.bordered)` | `buttonVariant.outline` |
| size | RN-wrapper | `'lg'` | `ContentPadding.Large` | `.controlSize(.large)` | `buttonSize.lg` |
| text | RN-wrapper | `'Cancel'` | `Text("Cancel")` | `Text("Cancel")` | n/a |

### Accessibility

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| accessibilityRole | RN-wrapper | `'progressbar'` | `Modifier.semantics { role = Role.ProgressBar }` | `.accessibilityElement(children: .ignore).accessibilityAddTraits(.updatesFrequently)` | n/a |
| accessibilityLabel | RN-wrapper | `'Planning your route'` | `contentDescription = "Planning your route"` | `.accessibilityLabel("Planning your route")` | n/a |

### Empty State

| Condition | Source | Behavior | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| !isVisible | RN-wrapper | `return null` | EmptyContent or null return | EmptyView or null return | n/a |

---

## NOTES

- **Full-screen overlay:** Absolute positioned container covering entire screen with high z-index
- **Scrim background:** Uses scrim color (typically semi-transparent black)
- **Centered content:** ActivityIndicator, message, and cancel button centered on screen
- **ActivityIndicator:** 24px size, primary color, always animating
- **Message:** "Planning your route..." in bodyMedium typography
- **Cancel button:** Outline variant, large size
- **Spacing:** 16px gap between elements
- **Early exit:** Returns null when isVisible is false
- **zIndex:** 1000 to ensure overlay appears above other content
