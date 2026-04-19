# SearchBar - STYLE PROPERTIES MATRIX

**Component:** SearchBar
**RN Source:** `react-native/components/ui/search-bar.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/ui/search-bar.tsx` | Public API, layout, visual styling |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Search icon (see `matrices/ui/atoms/IconSymbol.md`) |
| Text | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Placeholder text display |

---

## COMPOSITION

**Child atoms:**
- `IconSymbol` - Search magnifying glass icon (see `matrices/ui/atoms/IconSymbol.md`)

**Composition pattern:** Row container with icon and text placeholder. Non-interactive (triggers `onPress` for expansion).

**Layout:** Horizontal row (`flexDirection: 'row'`), center alignment, fixed icon-to-text gap.

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `12` | `Modifier.padding` or `Arrangement.spacedBy(12.dp)` | `Spacer(minLength: 12)` | ESCALATE — between `space.md` (12) and `space.lg` (16); use `12.dp` literal |
| borderRadius | RN-wrapper | `12` | `RoundedCornerShape(12.dp)` | `RoundedRectangle(cornerRadius: 12)` | `radius.lg` |
| paddingVertical | RN-wrapper | `12` | `Modifier.padding(vertical = 12.dp)` | `.padding(.vertical, 12)` | `space.md` |
| paddingHorizontal | RN-wrapper | `16` | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |

### Visual — Background Color

| State | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| default | RN-wrapper | `semantic.color.card.default` | `LaneShadowTheme.colors.card` | `theme.colors.card` | `color.card.default` |

### Visual — Icon

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| name | RN-wrapper | `'magnify'` | `Icons.Outlined.Search` (Material Icons) | `SF Symbol: "magnifyingglass"` | n/a |
| size | RN-wrapper | `20` | `Modifier.size(20.dp)` | `.frame(width: 20, height: 20)` | ESCALATE — propose `iconSize.sm = 20` |
| color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

### Typography — Placeholder

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `15` | `15.sp` | `15` | ESCALATE — between `type.body.sm` (14) and `type.body.md` (16); use `15.sp` literal |
| color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.frame(maxWidth: .infinity)` | n/a |

### Interaction

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| onPress | RN-wrapper | callback prop | `Modifier.clickable { onPress() }` | `.onTapGesture { onPress() }` | n/a |

---

## NOTES

- **Non-interactive input:** SearchBar is a visual placeholder that triggers `onPress` to expand into a full search input
- **Value display:** Shows `value` if provided, otherwise shows `placeholder` text
- **Icon positioning:** Icon placed on left, text fills remaining space (flex: 1)
- **Border radius:** Uses `radius.lg` (12pt) for rounded card appearance
- **Background:** Uses `color.card.default` for card-like appearance
- **Platform icon mapping:** Material Icons `Search` (Android) / SF Symbol `magnifyingglass` (iOS)
