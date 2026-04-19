# SavedRouteCard - STYLE PROPERTIES MATRIX

**Component:** SavedRouteCard
**RN Source:** `react-native/components/ui/saved-route-card.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/ui/saved-route-card.tsx` | Public API, layout, styling |
| RouteThumbnail | `react-native/components/ui/route-thumbnail.tsx` | Mini map preview (molecule) |
| Text (Paper) | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Name, path, stats display |

---

## COMPOSITION

**Child atoms/molecules:**
- `RouteThumbnail` - Mini map preview component (see `matrices/ui/molecules/RouteThumbnail.md`)

**Composition pattern:** Pressable card with thumbnail (60×60) on left and text container (flex: 1) on right. Text container has name, path, and stats row (distance, duration, date).

**Layout:** Horizontal row. Thumbnail fixed size, text fills remaining space.

---

## STYLE PROPERTIES MATRIX

### Layout — Card

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `Alignment.CenterVertically` | `.center` | n/a |
| padding | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(12.dp)` | `.padding(12)` | `space.md` |
| borderRadius | RN-wrapper | `semantic.radius.lg` = 16 | `RoundedCornerShape(16.dp)` | `cornerRadius: 16` | `radius.lg` |
| borderWidth | RN-wrapper | `StyleSheet.hairlineWidth` | `Modifier.border(1.dp, ...)` | `.stroke(lineWidth: 0.5)` | `borderWidth.thin` |

### Layout — Content

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| gap | RN-wrapper | `semantic.space.md` = 12 | `Arrangement.spacedBy(12.dp)` | `Spacer(12)` | `space.md` |

### Layout — Thumbnail

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| width | RN-wrapper | `60` | `Modifier.width(60.dp)` | `.frame(width: 60)` | ESCALATE — propose `size.thumbnail = 60` |
| height | RN-wrapper | `60` | `Modifier.height(60.dp)` | `.frame(height: 60)` | ESCALATE — propose `size.thumbnail = 60` |

### Layout — Text Container

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.frame(maxWidth: .infinity)` | n/a |
| gap | RN-wrapper | `4` | `Arrangement.spacedBy(4.dp)` | `Spacer(4)` | `space.xs` |

### Layout — Stats Row

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row` | `HStack` | n/a |
| gap | RN-wrapper | `semantic.space.sm` = 8 | `Arrangement.spacedBy(8.dp)` | `Spacer(8)` | `space.sm` |

### Visual — Colors

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.card.default` | `LaneShadowTheme.colors.card` | `theme.colors.card` | `color.card.default` |
| borderColor | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |
| opacity (pressed) | RN-wrapper | `0.8` | `Modifier.alpha(0.8f)` | `.opacity(0.8)` | ESCALATE — `opacity.pressed = 0.8` |

### Typography — Name

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| type | RN-wrapper | `semantic.type.title.sm` | map to LaneShadow | `.font(.title3)` | `type.title.sm` |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| numberOfLines | RN-wrapper | `2` | `maxLines = 2` | `.lineLimit(2)` | n/a |

### Typography — Path

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| type | RN-wrapper | `semantic.type.body.sm` | map to LaneShadow | `.font(.body)` | `type.body.sm` |
| color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| numberOfLines | RN-wrapper | `1` | `maxLines = 1` | `.lineLimit(1)` | n/a |

### Typography — Stats

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| type | RN-wrapper | `semantic.type.body.sm` | map to LaneShadow | `.font(.body)` | `type.body.sm` |
| color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |

### Interaction

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| accessibilityRole | RN-wrapper | `'button'` | `Modifier.semantics { role = Role.Button }` | `.accessibilityAddTraits(.isButton)` | n/a |
| accessibilityLabel | RN-wrapper | ``View ${name}`` | `Modifier.semantics { label = "View $name" }` | `.accessibilityLabel("View \(name)")` | n/a |

---

## NOTES

- **Thumbnail:** 60×60 mini map preview showing route bounds with rotation
- **Three text sections:** Name (2 lines), path (1 line), stats row (distance • duration • date)
- **Bullet separator:** Uses `•` character between stats
- **Press feedback:** 0.8 opacity on press
- **Hairline border:** Uses StyleSheet.hairlineWidth (0.5px on retina)
- **Thumbnail molecule:** Uses RouteThumbnail component; reference its matrix for internal styling
