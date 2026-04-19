# FavoriteRoadCard - STYLE PROPERTIES MATRIX

**Component:** FavoriteRoadCard
**RN Source:** `react-native/components/ui/favorite-road-card.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|
| RN Wrapper | `react-native/components/ui/favorite-road-card.tsx` | Public API, layout, press states |
| RouteThumbnail | `react-native/components/ui/route-thumbnail.tsx` | Mini map preview (see `matrices/ui/molecules/RouteThumbnail.md`) |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Delete icon (see `matrices/ui/atoms/IconSymbol.md`) |
| Text (Paper) | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Typography |

---

## COMPOSITION

**Child molecules/atoms:**
- `RouteThumbnail` - Mini map preview (80×80) (see `matrices/ui/molecules/RouteThumbnail.md`)
- `IconSymbol` - Delete button icon (see `matrices/ui/atoms/IconSymbol.md`)

**Composition pattern:** Horizontal row with thumbnail, text (flex: 1), and delete button. Entire card pressable, delete button stops propagation.

**Layout:** Row layout with 16px gap, thumbnail fixed size, text fills space, delete button at end.

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| padding | RN-wrapper | `semantic.space.lg` = 16 | `Modifier.padding(16.dp)` | `.padding(16)` | `space.lg` |
| borderRadius | RN-wrapper | `semantic.radius.lg` = 16 | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.lg` |
| borderWidth | RN-wrapper | `StyleSheet.hairlineWidth` (0.5) | `Modifier.border(0.5.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 0.5))` | `borderWidth.hairline` |

### Visual — Container (by state)

| State | Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| any | backgroundColor | RN-wrapper | `semantic.color.card.default` | `LaneShadowTheme.colors.card` | `theme.colors.card` | `color.card.default` |
| any | borderColor | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |
| pressed | opacity | RN-wrapper | `0.8` | `Modifier.alpha(0.8f)` | `.opacity(0.8)` | `opacity.pressed = 0.8` |
| default | opacity | RN-wrapper | `1` | `Modifier.alpha(1f)` | `.opacity(1)` | n/a |

### Layout — Content Row

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(end = 12.dp)` between items | `Spacer(minLength: 12)` | `space.md` |

### Layout — RouteThumbnail

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `80` | `Modifier.width(80.dp)` | `.frame(width: 80)` | ESCALATE — propose `size.thumbnailSm = 80` |
| height | RN-wrapper | `80` | `Modifier.height(80.dp)` | `.frame(height: 80)` | `size.thumbnailSm` |

### Layout — Text Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.frame(maxWidth: .infinity)` | n/a |

### Typography — Road Name

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| type | RN-wrapper | `semantic.type.title.md` | `MaterialTheme.typography.titleMedium` → map to LaneShadow | `.font(.system(size: 16, weight: .semibold))` | `type.title.md` |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| numberOfLines | RN-wrapper | `2` | `maxLines = 2` | `.lineLimit(2)` | n/a |

### Layout — Delete Button Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| zIndex | RN-wrapper | `1` | `Modifier.zIndex(1)` | `.zIndex(1)` | n/a |

### Layout — Delete Button Content

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| padding | RN-wrapper | `8` | `Modifier.padding(8.dp)` | `.padding(8)` | `space.sm` |
| borderRadius | RN-wrapper | `8` | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |
| margin | RN-wrapper | `-8` | `Modifier.padding(-8.dp)` (offset) | `.padding(-8)` | `-space.sm` |

### Visual — Delete Button (by state)

| State | Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| pressed | opacity | RN-wrapper | `0.6` | `Modifier.alpha(0.6f)` | `.opacity(0.6)` | `opacity.actionPressed = 0.6` |
| default | opacity | RN-wrapper | `1` | `Modifier.alpha(1f)` | `.opacity(1)` | n/a |

### Visual — Delete Icon

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| size | RN-wrapper | `20` | `20.dp` | `20` | ESCALATE — propose `iconSize.actionButton = 20` |
| color | RN-wrapper | `semantic.color.danger.default` | `LaneShadowTheme.colors.danger` | `theme.colors.danger` | `color.danger.default` |
| name | RN-wrapper | `'trash-can-outline'` | `Icons.Outlined.Delete` | SF Symbol: `trash` | n/a |

### Interaction

| Element | Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| card | accessibilityRole | RN-wrapper | `'button'` | `Modifier.semantics { role = Role.Button }` | `.accessibilityAddTraits(.isButton)` | n/a |
| card | accessibilityLabel | RN-wrapper | `` `View ${name}` `` | `contentDescription = "View ${name}"` | `.accessibilityLabel("View ${name}")` | n/a |
| delete | accessibilityRole | RN-wrapper | `'button'` | `Modifier.semantics { role = Role.Button }` | `.accessibilityAddTraits(.isButton)` | n/a |
| delete | accessibilityLabel | RN-wrapper | `'Delete favorite'` | `contentDescription = "Delete favorite"` | `.accessibilityLabel("Delete favorite")` | n/a |
| delete | pressPropagation | RN-wrapper | `stopPropagation` | `Modifier.clickable {...}.pointerInput(Unit) { detectTapGestures { } }` | `.simultaneousGesture(...)` | n/a |

---

## NOTES

- **Thumbnail size:** 80×80 (smaller than default 96×96)
- **Layout:** Horizontal row with thumbnail, flexible text, fixed delete button
- **Gap:** 12px between elements
- **Card padding:** 16px
- **Border:** Hairline width (0.5px) using StyleSheet.hairlineWidth
- **Press states:** Card opacity 0.8 when pressed, delete button opacity 0.6 when pressed
- **Delete button:** Negative margin (-8px) to offset padding, maintaining layout
- **zIndex:** Delete button z-index 1 to ensure it sits above card for touch handling
- **Border radius:** 16px for card, 8px for delete button
- **Danger color:** Delete icon uses danger color (#E35D6A)
- **Event propagation:** Delete button stops propagation to prevent card press
- **Text truncation:** Road name limited to 2 lines
