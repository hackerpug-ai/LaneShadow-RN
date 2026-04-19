# RouteAttachmentCard - STYLE PROPERTIES MATRIX

**Component:** RouteAttachmentCard
**RN Source:** `react-native/components/ui/route-attachment-card.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|
| RN Wrapper | `react-native/components/ui/route-attachment-card.tsx` | Public API, variants (compact/full), layout |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Weather, distance, duration, scenic icons (see `matrices/ui/atoms/IconSymbol.md`) |
| Text (Paper) | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Typography |

---

## COMPOSITION

**Child atoms:**
- `IconSymbol` - Best badge star, weather icons, stat icons (distance, duration, scenic), chevron (see `matrices/ui/atoms/IconSymbol.md`)

**Composition pattern:** Two variants - compact (map overlay) and full (chat transcript). Both use horizontal single-row layout with badges, label, stats, scenic score.

**Layout:** Compact = badges + label + stats inline. Full = best badge + label + stats icons + scenic score.

---

## STYLE PROPERTIES MATRIX

### Layout — Container (Both Variants)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| borderRadius | RN-wrapper | `12` | `RoundedCornerShape(12.dp)` | `RoundedRectangle(cornerRadius: 12)` | `radius.lg` |
| borderWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | `borderWidth.thin` |

### Visual — Container (by variant × state)

| Variant | State | Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|---|
| compact/full | selected | backgroundColor | RN-wrapper | `${color.primary.default}15` (8% opacity) | `LaneShadowTheme.colors.primary.copy(alpha = 0.08f)` | `theme.colors.primary.opacity(0.08)` | `color.primary.default` + `opacity.boundingBox = 0.08` |
| compact/full | selected | borderColor | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| compact/full | default | backgroundColor | RN-wrapper | `color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| compact/full | default | borderColor | RN-wrapper | `color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |
| compact/full | pressed | opacity | RN-wrapper | `0.8` | `Modifier.alpha(0.8f)` | `.opacity(0.8)` | `opacity.pressed = 0.8` |

### Layout — Compact Variant

| Element | Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|---|
| card | padding | RN-wrapper | `10` | `Modifier.padding(10.dp)` | `.padding(10)` | ESCALATE — propose `space.sm + 2 = 10` |
| card | minWidth | RN-wrapper | `200` | `Modifier.width(200.dp).minWidth(IntrinsicSize.Min)` | `.frame(minWidth: 200)` | n/a |
| content | flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| content | alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| content | gap | RN-wrapper | `8` | `Modifier.padding(end = 8.dp)` | `Spacer(minLength: 8)` | `space.sm` |
| badges | flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| badges | gap | RN-wrapper | `4` | `Modifier.padding(end = 4.dp)` | `Spacer(minLength: 4)` | `space.xs` |

### Layout — Full Variant

| Element | Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|---|
| card | paddingVertical | RN-wrapper | `10` | `Modifier.padding(vertical = 10.dp)` | `.padding(.vertical, 10)` | `space.sm + 2` |
| card | paddingHorizontal | RN-wrapper | `12` | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |
| card | width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| content | flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| content | alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| content | gap | RN-wrapper | `12` | `Modifier.padding(end = 12.dp)` | `Spacer(minLength: 12)` | `space.md` |

### Layout — Best Badge (Both Variants)

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| paddingHorizontal | RN-wrapper | `6` | `Modifier.padding(horizontal = 6.dp)` | `.padding(.horizontal, 6)` | ESCALATE — propose `space.xs + 2 = 6` |
| paddingVertical | RN-wrapper | `2` | `Modifier.padding(vertical = 2.dp)` | `.padding(.vertical, 2)` | ESCALATE — propose `2` |
| borderRadius | RN-wrapper | `8` | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |
| backgroundColor | RN-wrapper | `${color.primary.default}20` (12.5% opacity) | `LaneShadowTheme.colors.primary.copy(alpha = 0.125f)` | `theme.colors.primary.opacity(0.125)` | `color.primary.default` + `opacity.container = 0.125` |

### Typography — Best Badge

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `11` | `11.sp` | `11` | ESCALATE — propose `type.label.xs.fontSize = 11` |
| fontWeight | RN-wrapper | `'700'` (bold) | `FontWeight.Bold` | `.bold` | ESCALATE — propose `type.label.xs.fontWeight = 700` |
| color | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

### Typography — Label

| Variant | Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|---|
| compact | fontSize | RN-wrapper | `14` | `14.sp` | `14` | `type.title.md.fontSize` |
| compact | fontWeight | RN-wrapper | `'600'` (semibold) | `FontWeight.SemiBold` | `.semibold` | `type.title.md.fontWeight` |
| compact | flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.frame(maxWidth: .infinity)` | n/a |
| full | fontSize | RN-wrapper | `14` | `14.sp` | `14` | `type.title.md.fontSize` |
| full | fontWeight | RN-wrapper | `'600'` (semibold) | `FontWeight.SemiBold` | `.semibold` | `type.title.md.fontWeight` |
| full | flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.frame(maxWidth: .infinity)` | n/a |

### Typography — Stats Text

| Element | Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| compact (stats) | fontSize | RN-wrapper | `11` | `11.sp` | `11` | `type.label.xs.fontSize` |
| compact (stats) | color | RN-wrapper | `color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| full (stat value) | fontSize | RN-wrapper | `12` | `12.sp` | `12` | ESCALATE — propose `type.label.sm.fontSize = 12` |
| full (stat value) | fontWeight | RN-wrapper | `'500'` (medium) | `FontWeight.Medium` | `.medium` | ESCALATE — propose `type.label.sm.fontWeight = 500` |
| full (stat value) | color | RN-wrapper | `color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| full (scenic value) | fontSize | RN-wrapper | `12` | `12.sp` | `12` | `type.label.sm.fontSize` |
| full (scenic value) | fontWeight | RN-wrapper | `'600'` (semibold) | `FontWeight.SemiBold` | `.semibold` | `type.label.sm.fontWeight` |
| full (scenic value) | color | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

### Visual — Icons

| Element | Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|---|
| compact (weather) | size | RN-wrapper | `10` | `10.dp` | `10` | ESCALATE — propose `iconSize.xs = 10` |
| full (stat icons) | size | RN-wrapper | `12` | `12.dp` | `12` | ESCALATE — propose `iconSize.xxs = 12` |
| full (scenic leaf) | size | RN-wrapper | `12` | `12.dp` | `12` | `iconSize.xxs` |
| all (stat icons) | color | RN-wrapper | `color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| weather icons | color | RN-wrapper | dynamic (danger/warning/muted) | `LaneShadowTheme.colors.danger/warning/onSurfaceMuted` | `theme.colors.danger/warning/onSurfaceMuted` | `color.danger.default` / `color.warning.default` / `color.onSurface.muted` |
| scenic leaf | color | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

### Layout — Stat Items (Full Variant)

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `3` | `Modifier.padding(end = 3.dp)` | `Spacer(minLength: 3)` | ESCALATE — propose `space.xxs = 3` |

---

## NOTES

- **Two variants:** Compact (map overlay, minimal) and full (chat transcript, detailed)
- **Compact:** Single row, badges + label + stats inline, 200px minWidth
- **Full:** Horizontal single row, best badge + label + stat icons + scenic score, 100% width
- **Best badge:** Star emoji (⭐) in 12.5% opacity primary background
- **Weather badge:** Icon in 12.5% opacity color-matched background
- **Icons:** 10px (compact), 12px (full), dynamic colors for weather
- **Gap:** 8px (compact), 12px (full), 3px (stat items)
- **Border radius:** 12px for card, 8px for badges
- **Selection:** 8% opacity primary background with primary border
- **Press:** 0.8 opacity when pressed
- **Typography:** 11-14sp depending on element, 500-700 weight
- **Flexible label:** Label uses flex: 1 to fill available space
- **Stat icons:** Distance (map-marker-distance), duration (clock-outline), scenic (leaf)
- **Weather icons:** Sunny, rainy, windy, cloudy (dynamic)
- **Weather colors:** Rain = danger, wind = warning, default = onSurface.muted
