# IntentSearchSheet - STYLE PROPERTIES MATRIX

**Component:** IntentSearchSheet
**RN Source:** `react-native/components/discovery/intent-search-sheet.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/ScrollView/ScrollView.js`, `node_modules/react-native/Libraries/Components/ActivityIndicator/ActivityIndicator.js`, `node_modules/react-native-paper/src/components/Typography/Text.tsx`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/discovery/intent-search-sheet.tsx` | Public API, search states |
| IntentSummaryPill | `react-native/components/discovery/intent-summary-pill.tsx` | Summary pill (see `matrices/ui/molecules/IntentSummaryPill.md`) |
| Button | `react-native/components/ui/button.tsx` | Clear button (see `matrices/ui/atoms/Button.md`) |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Icons (see `matrices/ui/atoms/IconSymbol.md`) |
| BottomSheetWrapper | `react-native/components/sheets/bottom-sheet-wrapper.tsx` | Sheet container |
| ScrollView (RN) | `node_modules/react-native/Libraries/Components/ScrollView/ScrollView.js` | Horizontal scroll for chips |
| ActivityIndicator (RN) | `node_modules/react-native/Libraries/Components/ActivityIndicator/ActivityIndicator.js` | Loading spinner |

---

## COMPOSITION ANALYSIS

**Child molecules/atoms:**
- `IntentSummaryPill` - Intent summary display (see `matrices/ui/molecules/IntentSummaryPill.md`)
- `Button` - Clear button (see `matrices/ui/atoms/Button.md`)
- `IconSymbol` - Search, close, wifi-off icons

**Composition pattern:**
- Bottom sheet with half preset, hasTextInput for keyboard handling
- Header with title and subtitle
- Input row with search icon, text input, clear button
- Four visual states:
  1. **idle**: Empty input field
  2. **cache_hit**: Shows IntentSummaryPill with instant results
  3. **searching**: Shows ActivityIndicator with status messages
  4. **offline_unsupported**: Shows empty state with recent intent chips
- 48px height input row with surface background
- Recent intent chips in horizontal scroll for offline state

**Layout:** Column layout with 16px gap

---

## STATE & BEHAVIOR

No local state. State-driven by `searchState` prop.

**Search states:**
- `{status: 'idle'}`
- `{status: 'cache_hit'; summary: string}`
- `{status: 'searching'}`
- `{status: 'offline_unsupported'; recentIntents: string[]}`
- `{status: 'results'; summary: string}`

**Callback signatures:**
- `onSearch: (query: string) => void` → `(query: String) -> Unit` / `(String) -> Void`
- `onClear: () => void` → `() -> Unit` / `() -> Void`
- `onRecentIntentTap: (intent: string) => void` → `(intent: String) -> Unit` / `(String) -> Void`
- `onChangeQuery: (text: string) => void` → `(text: String) -> Unit` / `(String) -> Void`

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.fillMaxHeight()` / `Modifier.weight(1f)` | `.frame(maxHeight: .infinity)` | n/a |
| gap | RN-wrapper | `16` | `Arrangement.spacedBy(16.dp)` / `Modifier.padding(bottom = 16.dp)` between items | `spacing(16)` | `space.lg` |

### Layout — Header

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| gap | RN-wrapper | `4` | `Arrangement.spacedBy(4.dp)` / `Modifier.padding(bottom = 4.dp)` between items | `spacing(4)` | ESCALATE — propose `space.micro = 4` |
| paddingBottom | RN-wrapper | `16` | `Modifier.padding(bottom = 16.dp)` | `.padding(.bottom, 16)` | `space.lg` |
| borderBottomWidth | RN-wrapper | `1` | `Modifier.border(BorderStroke(1.dp, ...))` / `Divider()` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | `borderWidth.thin` |
| borderBottomColor | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |

### Typography — Header Title

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `titleLarge` | `LaneShadowTheme.typography.titleLarge` | `theme.typography.titleLarge` | n/a |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Typography — Header Subtitle

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `bodyMedium` | `LaneShadowTheme.typography.bodyMedium` | `theme.typography.bodyMedium` | n/a |
| color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |

### Layout — Input Row

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| height | RN-wrapper | `48` | `Modifier.height(48.dp)` | `.frame(height: 48)` | ESCALATE — propose `layout.inputHeight = 48` |
| paddingHorizontal | RN-wrapper | `12` | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |
| backgroundColor | RN-wrapper | `semantic.color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| borderRadius | RN-wrapper | `semantic.radius.lg` (= 12) | `RoundedCornerShape(12.dp)` | `RoundedRectangle(cornerRadius: 12)` | `radius.lg` |
| borderWidth | RN-wrapper | `1` | `Modifier.border(BorderStroke(1.dp, ...))` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | `borderWidth.thin` |
| borderColor | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |

### Layout — Input Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.layoutPriority(1)` | n/a |
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `8` | `Arrangement.spacedBy(8.dp)` / `Modifier.padding(end = 8.dp)` between items | `spacing(8)` | `space.sm` |

### Icon — Search Icon

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| size | RN-wrapper | `20` | `Modifier.size(20.dp)` | `.frame(width: 20, height: 20)` | ESCALATE — propose `icon.sm = 20` |
| color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |

### Typography — Input Text

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `bodyLarge` | `LaneShadowTheme.typography.bodyLarge` | `theme.typography.bodyLarge` | n/a |
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.layoutPriority(1)` | n/a |
| color (has query) | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| color (empty) | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

### Layout — Clear Button

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `32` | `Modifier.size(32.dp)` | `.frame(width: 32, height: 32)` | ESCALATE — propose `size.iconSm = 32` |
| height | RN-wrapper | `32` | Included above | Included above | ESCALATE — propose `size.iconSm = 32` |

### Icon — Clear Button

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| size | RN-wrapper | `20` | `Modifier.size(20.dp)` | `.frame(width: 20, height: 20)` | ESCALATE — propose `icon.sm = 20` |
| color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |

### Layout — State Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.fillMaxHeight()` / `Modifier.weight(1f)` | `.frame(maxHeight: .infinity)` | n/a |
| justifyContent | RN-wrapper | `'center'` | `Modifier.wrapContentHeight(Alignment.CenterVertically)` | `.frame(maxHeight: .infinity).overlay(..., alignment: .center)` | n/a |

### Layout — Loading Container (searching state)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| alignItems | RN-wrapper | `'center'` | `Modifier.align(Alignment.CenterHorizontally)` + vertical | `.frame(maxWidth: .infinity).overlay(..., alignment: .center)` | n/a |
| paddingVertical | RN-wrapper | `32` | `Modifier.padding(vertical = 32.dp)` | `.padding(.vertical, 32)` | `space.xl` |
| gap | RN-wrapper | `semantic.space.md` (= 12) | `Arrangement.spacedBy(12.dp)` / `Modifier.padding(end = 12.dp)` between items | `spacing(12)` | `space.md` |

### Visual — Loading Spinner

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| size | RN-wrapper | `'large'` | `Modifier.size(48.dp)` (large default) | `.progressViewStyle(.circular).scaleEffect(1.2)` | n/a |
| color | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` / `.tint(.primary)` | `color.primary.default` |

### Typography — Loading Messages

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| textAlign | RN-wrapper | `'center'` | `TextAlign.Center` | `.multilineTextAlignment(.center)` | n/a |

### Layout — Offline Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.fillMaxHeight()` / `Modifier.weight(1f)` | `.frame(maxHeight: .infinity)` | n/a |
| justifyContent | RN-wrapper | `'center'` | `Modifier.wrapContentHeight(Alignment.CenterVertically)` | `.frame(maxHeight: .infinity).overlay(..., alignment: .center)` | n/a |
| gap | RN-wrapper | `semantic.space.lg` (= 16) | `Arrangement.spacedBy(16.dp)` / `Modifier.padding(bottom = 16.dp)` between items | `spacing(16)` | `space.lg` |

### Layout — Empty State (offline)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| alignItems | RN-wrapper | `'center'` | `Modifier.align(Alignment.CenterHorizontally)` + vertical | `.frame(maxWidth: .infinity).overlay(..., alignment: .center)` | n/a |
| gap | RN-wrapper | `semantic.space.md` (= 12) | `Arrangement.spacedBy(12.dp)` / `Modifier.padding(end = 12.dp)` between items | `spacing(12)` | `space.md` |

### Icon — Offline Icon

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| size | RN-wrapper | `48` | `Modifier.size(48.dp)` | `.frame(width: 48, height: 48)` | ESCALATE — propose `icon.xl = 48` |
| color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

### Typography — Offline Messages

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant (title) | RN-wrapper | `titleMedium` | `LaneShadowTheme.typography.titleMedium` | `theme.typography.titleMedium` | n/a |
| variant (body) | RN-wrapper | `bodyMedium` | `LaneShadowTheme.typography.bodyMedium` | `theme.typography.bodyMedium` | n/a |
| textAlign | RN-wrapper | `'center'` | `TextAlign.Center` | `.multilineTextAlignment(.center)` | n/a |
| color (title) | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| color (body) | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |

### Layout — Chips Container (horizontal scroll)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| horizontal | RN-wrapper | `true` | `LazyRow(...)` / `Row(horizontalScrollEnabled = true)` | `ScrollView(.horizontal)` | n/a |
| showsHorizontalScrollIndicator | RN-wrapper | `false` | `LazyRow(...flingBehavior = ...).scrollbar(false)` | `.scrollIndicators(.hidden)` | n/a |
| gap | RN-wrapper | `semantic.space.sm` (= 8) | `Arrangement.spacedBy(8.dp)` / `Modifier.padding(end = 8.dp)` between items | `spacing(8)` | `space.sm` |
| paddingHorizontal | RN-wrapper | `16` | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| paddingVertical | RN-wrapper | `8` | `Modifier.padding(vertical = 8.dp)` | `.padding(.vertical, 8)` | `space.sm` |

### Visual — Recent Intent Chip

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| paddingHorizontal | RN-wrapper | `16` | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| paddingVertical | RN-wrapper | `8` | `Modifier.padding(vertical = 8.dp)` | `.padding(.vertical, 8)` | `space.sm` |
| borderRadius | RN-wrapper | `semantic.radius.full` (= 9999) | `RoundedCornerShape(50.dp)` / `CircleShape` (if height = width) | `Capsule()` | `radius.full` |
| borderWidth | RN-wrapper | `1` | `Modifier.border(BorderStroke(1.dp, ...))` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | `borderWidth.thin` |
| borderColor | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |

### Typography — Recent Intent Chip

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `labelMedium` | `LaneShadowTheme.typography.labelMedium` | `theme.typography.labelMedium` | n/a |
| color | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

---

## NOTES

- **Bottom sheet:** Half preset with hasTextInput for keyboard handling
- **Input row:** 48px height, surface background, 12px radius
- **Search icon:** 20px, left-aligned with 4px margin
- **Input text:** bodyLarge, muted color when empty, onSurface when has query
- **Clear button:** 32px ghost button, disabled when no query
- **Cache hit state:** Shows IntentSummaryPill with summary
- **Searching state:** Large primary spinner, centered with messages
- **Offline state:** 48px wifi-off icon, centered with horizontal scrollable chips
- **Chips:** Pill-shaped (full radius), surfaceVariant background, 8px gap
- **Auto-dismiss:** No auto-dismiss (user must clear manually)
- **Spacing:** 16px gap between major sections, 4px gap in header
