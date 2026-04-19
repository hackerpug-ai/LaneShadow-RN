# TogglesContainer - STYLE PROPERTIES MATRIX

**Component:** TogglesContainer
**RN Source:** `react-native/components/sheets/toggles-container.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/sheets/toggles-container.tsx` | Public API, toggle container layout |
| Switch | `react-native/components/ui/switch.tsx` | Toggle switches (see `matrices/ui/atoms/Switch.md`) |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Toggle icons (road-variant, cash) (see `matrices/ui/atoms/IconSymbol.md`) |
| Text (Paper) | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Toggle label typography |

---

## COMPOSITION

**Child atoms/molecules:**
- `IconSymbol` - Toggle icons (see `matrices/ui/atoms/IconSymbol.md`)
- `Switch` - Toggle switches (see `matrices/ui/atoms/Switch.md`)

**Composition pattern:** Vertical container with two toggle rows (Avoid Highways, Avoid Tolls). Each row has icon container (32×32px, surface background) + label on left, Switch on right. Divider between rows (borderBottom on first row only).

**Layout:** Vertical column. Each row is horizontal with space-between alignment. Icon and label grouped on left with 12px gap.

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| backgroundColor | RN-wrapper | `semantic.color.input.default` | `MaterialTheme.colorScheme.surfaceVariant` | `Color(.systemGray6)` | `color.input.default` |
| borderRadius | RN-wrapper | `semantic.radius.lg` = 12 | `Modifier.clip(RoundedCornerShape(12.dp))` | `.clipShape(RoundedRectangle(cornerRadius: 12))` | `radius.lg` |
| borderWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(..., lineWidth: 1))` | `borderWidth.thin` |
| borderColor | RN-wrapper | `semantic.color.divider.default` | `MaterialTheme.colorScheme.outlineVariant` | `Color(.separator)` | `color.divider.default` |
| overflow | RN-wrapper | `'hidden'` | `Modifier.clipToBounds()` | `.clipped()` | n/a |

### Layout — Toggle Row

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| justifyContent | RN-wrapper | `'space-between'` | `horizontalArrangement = Arrangement.SpaceBetween` | n/a | n/a |
| paddingHorizontal | RN-wrapper | `semantic.space.lg` = 16 | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| paddingVertical | RN-wrapper | `semantic.space.lg` = 16 | `Modifier.padding(vertical = 16.dp)` | `.padding(.vertical, 16)` | `space.lg` |
| borderBottomWidth | RN-wrapper | `1` (first row only) | `Divider(modifier = Modifier.height(1.dp))` | `.overlay(Rectangle().fill(.separator).frame(height: 1), alignment: .bottom)` | `borderWidth.thin` |
| borderBottomColor | RN-wrapper | `semantic.color.divider.default` (first row only) | `MaterialTheme.colorScheme.outlineVariant` | `Color(.separator)` | `color.divider.default` |

### Layout — Toggle Label

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `12` | `Arrangement.spacedBy(12.dp)` | `.spacing(12)` | ESCALATE — propose `space.labelGap = 12` or use `space.md` |
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.frame(maxWidth: .infinity)` | n/a |

### Layout — Icon Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `32` | `Modifier.size(32.dp)` | `.frame(width: 32, height: 32)` | ESCALATE — propose `size.toggleIconContainer = 32` |
| height | RN-wrapper | `32` | n/a | n/a | n/a |
| borderRadius | RN-wrapper | `semantic.radius.md` = 8 | `Modifier.clip(RoundedCornerShape(8.dp))` | `.clipShape(RoundedRectangle(cornerRadius: 8))` | `radius.md` |
| backgroundColor | RN-wrapper | `semantic.color.surface.default` | `MaterialTheme.colorScheme.surface` | `Color(.secondarySystemGroupedBackground)` | `color.surface.default` |
| alignItems | RN-wrapper | `'center'` | `contentAlignment = Alignment.Center` | n/a | n/a |
| justifyContent | RN-wrapper | `'center'` | `contentAlignment = Alignment.Center` | n/a | n/a |

### Typography — Label

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `'bodyMedium'` | `MaterialTheme.typography.bodyMedium` | `.font(.system(size: 14))` | `type.body.md` |
| color | RN-wrapper | `semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurface` | `Color(.label)` | `color.onSurface.default` |
| fontWeight | RN-wrapper | `'500'` | `fontWeight = FontWeight.Medium` | `.fontWeight(.medium)` | ESCALATE — propose `type.body.md.fontWeight.medium = 500` |

### Visual — Icon

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| size | RN-wrapper | `20` | `Modifier.size(20.dp)` | `.frame(width: 20, height: 20)` | `iconSize.md` |
| color | RN-wrapper | `semantic.color.onSurface.muted` (fallback to onSurface.default) | `MaterialTheme.colorScheme.onSurfaceVariant` | `Color(.secondaryLabel)` | `color.onSurface.muted` |

### Icon — Names

| Toggle | Source | Icon name | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| Avoid Highways | RN-wrapper | `'road-variant'` | `Icons.Outlined.Route` or `Icons.Outlined.Terrain` | SF Symbol: `road` | n/a |
| Avoid Tolls | RN-wrapper | `'cash'` | `Icons.Outlined.AttachMoney` | SF Symbol: `dollarsign.circle` | n/a |

### Switch — Props

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| value | RN-wrapper | boolean prop (avoidHighways, avoidTolls) | `checked: Boolean` | `isOn: Bool` | n/a |
| onValueChange | RN-wrapper | callback prop | `onCheckedChange: (Boolean) -> Unit` | `onChange: (Bool) -> Void` | n/a |

---

## NOTES

- **Two toggles:** Avoid Highways (road-variant icon), Avoid Tolls (cash icon)
- **Container:** Input color background, rounded corners, border, hidden overflow
- **Row layout:** Icon container + label (left, flex: 1), Switch (right)
- **Icon container:** 32×32px, surface background, rounded corners (8px), centered content
- **Label:** bodyMedium, medium weight (500), onSurface color
- **Icon:** 20px, onSurface.muted color
- **Divider:** Between rows (borderBottom on first row only)
- **Spacing:** 16px horizontal/vertical padding in rows, 12px gap between icon and label
- **Switch:** Standard Switch component (see Switch matrix)
- **Full width:** Container fills 100% of parent width
