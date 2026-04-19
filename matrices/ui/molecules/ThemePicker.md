# ThemePicker - STYLE PROPERTIES MATRIX

**Component:** ThemePicker
**RN Source:** `react-native/components/settings/theme-picker.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/settings/theme-picker.tsx` | Public API, theme selection grid layout, phone preview rendering |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Theme mode icons (sun, moon, system) (see `matrices/ui/atoms/IconSymbol.md`) |
| Text (Paper) | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | "Appearance" label and option labels |

---

## COMPOSITION

**Child atoms:**
- `IconSymbol` - Theme mode icons, check icon (see `matrices/ui/atoms/IconSymbol.md`)

**Composition pattern:** Vertical column with "Appearance" label above horizontal grid of 3 cards (Light, Dark, System). Each card contains phone preview (fake UI showing theme colors), label row with icon + text, and check badge (selected state). Selected card has primary border + shadow.

**Layout:** Horizontal flex grid (flexDirection: 'row') with equal-width cards. Phone preview is 62×96px miniature phone silhouette with fake UI elements.

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| gap | RN-wrapper | `semantic.space.md` = 12 | `Arrangement.spacedBy(12.dp)` inside Column | `.spacing(12)` | `space.md` |

### Layout — Grid

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| gap | RN-wrapper | `semantic.space.md` = 12 | `Arrangement.spacedBy(12.dp)` | `.spacing(12)` | `space.md` |

### Layout — Card

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.frame(maxWidth: .infinity)` | n/a |
| alignItems | RN-wrapper | `'center'` | `horizontalAlignment = Alignment.CenterHorizontally` | n/a | n/a |
| position | RN-wrapper | `'relative'` | `Box(modifier = Modifier)` (default is relative) | default | n/a |
| backgroundColor | RN-wrapper | `semantic.color.surface.default` | `MaterialTheme.colorScheme.surface` | `Color(.secondarySystemGroupedBackground)` | `color.surface.default` |
| borderRadius | RN-wrapper | `semantic.radius.lg` = 12 | `Modifier.clip(RoundedCornerShape(12.dp))` | `.clipShape(RoundedRectangle(cornerRadius: 12))` | `radius.lg` |
| borderWidth | RN-wrapper | `2` | `Modifier.border(2.dp, ...)` | `.overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(..., lineWidth: 2))` | `borderWidth.thick` |
| borderColor (selected) | RN-wrapper | `semantic.color.primary.default` | `MaterialTheme.colorScheme.primary` | `Color(.orange)` | `color.primary.default` |
| borderColor (unselected) | RN-wrapper | `semantic.color.border.default` | `MaterialTheme.colorScheme.outline` | `Color(.separator)` | `color.border.default` |
| padding | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(12.dp)` | `.padding(12)` | `space.md` |
| opacity (pressed) | RN-wrapper | `0.85` | `Modifier.graphicsLayer { alpha = 0.85f }` or `indication` | `.opacity(0.85)` | ESCALATE — propose `opacity.pressed = 0.85` |

### Layout — Preview Wrap

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| alignItems | RN-wrapper | `'center'` | `horizontalAlignment = Alignment.CenterHorizontally` | n/a | n/a |
| marginBottom | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(bottom = 8.dp)` | `.padding(.bottom, 8)` | `space.sm` |

### Layout — Phone Preview

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `62` | `Modifier.width(62.dp)` | `.frame(width: 62)` | ESCALATE — propose `size.phonePreview = 62` |
| height | RN-wrapper | `96` | `Modifier.height(96.dp)` | `.frame(height: 96)` | ESCALATE — propose `size.phonePreviewHeight = 96` |
| borderRadius | RN-wrapper | `10` | `Modifier.clip(RoundedCornerShape(10.dp))` | `.clipShape(RoundedRectangle(cornerRadius: 10))` | ESCALATE — use `radius.lg` = 12 or keep magic number |
| borderWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(cornerRadius: 10).strokeBorder(..., lineWidth: 1))` | `borderWidth.thin` |
| overflow | RN-wrapper | `'hidden'` | `Modifier.clipToBounds()` | `.clipped()` | n/a |

### Layout — Label Row

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| justifyContent | RN-wrapper | `'center'` | `horizontalArrangement = Arrangement.Center` | n/a | n/a |

### Layout — Check Badge

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| position | RN-wrapper | `'absolute'` | `Box(modifier = Modifier.offset(...))` | `.position(...)` | n/a |
| top | RN-wrapper | `semantic.space.xs` = 4 | `Modifier.offset(y = 4.dp)` | `.position(top: 4)` | `space.xs` |
| right | RN-wrapper | `semantic.space.xs` = 4 | `Modifier.offset(x = (-4).dp)` (negative offset from right) | `.position(right: 4)` | `space.xs` |
| width | RN-wrapper | `18` | `Modifier.size(18.dp)` | `.frame(width: 18, height: 18)` | ESCALATE — propose `size.checkBadge = 18` |
| height | RN-wrapper | `18` | n/a | n/a | n/a |
| borderRadius | RN-wrapper | `9` (50%) | `CircleShape` | `Circle()` | `radius.full` |
| alignItems | RN-wrapper | `'center'` | `contentAlignment = Alignment.Center` | n/a | n/a |
| justifyContent | RN-wrapper | `'center'` | `contentAlignment = Alignment.Center` | n/a | n/a |
| backgroundColor | RN-wrapper | `semantic.color.primary.default` | `MaterialTheme.colorScheme.primary` | `Color(.orange)` | `color.primary.default` |

### Typography — Appearance Label

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `'labelLarge'` | `MaterialTheme.typography.labelLarge` | `.font(.system(size: 14, weight: .medium))` | ESCALATE — map to `type.label.lg` |
| color | RN-wrapper | `semantic.color.onSurface.muted` | `MaterialTheme.colorScheme.onSurfaceVariant` | `Color(.secondaryLabel)` | `color.onSurface.muted` |
| textTransform | RN-wrapper | `'uppercase'` | `textAlign = TextAlign.Center` (no uppercase in Compose, use string) | `.textCase(.uppercase)` | n/a |
| letterSpacing | RN-wrapper | `1` | `letterSpacing = 1.sp` | `.tracking(1)` | n/a |
| text | RN-wrapper | `'Appearance'` | `Text("Appearance")` | `Text("Appearance")` | n/a |

### Typography — Option Label

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `'labelMedium'` | `MaterialTheme.typography.labelMedium` | `.font(.system(size: 11, weight: .medium))` | ESCALATE — map to `type.label.md` |
| marginLeft | RN-wrapper | `semantic.space.xs` = 4 | `Modifier.padding(start = 4.dp)` | `.padding(.leading, 4)` | `space.xs` |
| color (selected) | RN-wrapper | `semantic.color.primary.default` | `MaterialTheme.colorScheme.primary` | `Color(.orange)` | `color.primary.default` |
| color (unselected) | RN-wrapper | `semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurface` | `Color(.label)` | `color.onSurface.default` |
| fontWeight (selected) | RN-wrapper | `'700'` | `fontWeight = FontWeight.Bold` | `.fontWeight(.bold)` | ESCALATE — propose `type.label.md.fontWeight.bold = 700` |
| fontWeight (unselected) | RN-wrapper | `'500'` | `fontWeight = FontWeight.Medium` | `.fontWeight(.medium)` | ESCALATE — propose `type.label.md.fontWeight.medium = 500` |

### Icon — Theme Mode Icons

| Option | Source | Icon name | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| Light | RN-wrapper | `'white-balance-sunny'` | `Icons.Outlined.WbSunny` | SF Symbol: `sun.max` | n/a |
| Dark | RN-wrapper | `'moon-waning-crescent'` | `Icons.Outlined.NightsStay` | SF Symbol: `moon` | n/a |
| System | RN-wrapper | `'theme-light-dark'` | `Icons.AutoAwesome` or custom | SF Symbol: `circle.lefthalf.filled` | n/a |
| Check | RN-wrapper | `'check'` | `Icons.Default.Check` | SF Symbol: `checkmark` | n/a |

### Icon — Colors

| State | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| theme icon (selected) | RN-wrapper | `semantic.color.primary.default` | `MaterialTheme.colorScheme.primary` | `Color(.orange)` | `color.primary.default` |
| theme icon (unselected) | RN-wrapper | `semantic.color.onSurface.muted` | `MaterialTheme.colorScheme.onSurfaceVariant` | `Color(.secondaryLabel)` | `color.onSurface.muted` |
| check icon | RN-wrapper | `'#FFFFFF'` | `Color.White` | `Color.white` | n/a (hardcoded) |

### Icon — Sizes

| Location | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| theme icons | RN-wrapper | `16` | `Modifier.size(16.dp)` | `.frame(width: 16, height: 16)` | `iconSize.sm` |
| check icon | RN-wrapper | `10` | `Modifier.size(10.dp)` | `.frame(width: 10, height: 10)` | ESCALATE — propose `iconSize.xs = 10` |

### Visual — Selected Card Shadow

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| shadowColor | RN-wrapper | `'#B87333'` (copper) | `shadowColor = Color(0xFFB87333)` | `Color(.orange)` or `Color(hex: 0xB87333)` | n/a (hardcoded copper) |
| shadowOffset | RN-wrapper | `{ width: 0, height: 0 }` | `offset = IntOffset(0, 0)` (glow effect) | `.shadow(color: .black.opacity(0), radius: 8, x: 0, y: 0)` | n/a |
| shadowOpacity | RN-wrapper | `0.35` | `ambientShadowAlpha = 0.35f` | `.opacity(0.35)` | ESCALATE — use `opacity.glow = 0.35` |
| shadowRadius | RN-wrapper | `8` | `shadowRadius = 8.dp` | `.radius = 8` | ESCALATE — use `shadowRadius.md = 8` |
| elevation | RN-wrapper | `4` | `Modifier.graphicsLayer { shadowElevation = 4f }` | `.shadow(color: .black.opacity(0.15), radius: 4, x: 0, y: 2)` | `elevation[4]` |

### Preview Colors — Hardcoded (PREVIEW constant)

| Theme | Element | Source | Value | Token mapping |
|---|---|---|---|---|---|
| Light | bg | RN-wrapper | `'#F5F0EB'` | Hardcoded preview color (not token) |
| Light | surface | RN-wrapper | `'#F7F3EF'` | Hardcoded preview color |
| Light | text | RN-wrapper | `'#1E1E1E'` | Hardcoded preview color |
| Light | muted | RN-wrapper | `'#6B7280'` | Hardcoded preview color |
| Light | border | RN-wrapper | `'#D9D0C7'` | Hardcoded preview color |
| Light | accent | RN-wrapper | `'#B87333'` | Hardcoded preview color (copper) |
| Dark | bg | RN-wrapper | `'#1B1715'` | Hardcoded preview color |
| Dark | surface | RN-wrapper | `'#2B2725'` | Hardcoded preview color |
| Dark | text | RN-wrapper | `'rgba(255,255,255,0.92)'` | Hardcoded preview color |
| Dark | muted | RN-wrapper | `'rgba(255,255,255,0.55)'` | Hardcoded preview color |
| Dark | border | RN-wrapper | `'#3A3431'` | Hardcoded preview color |
| Dark | accent | RN-wrapper | `'#B87333'` | Hardcoded preview color (copper) |

---

## NOTES

- **3 options:** Light (sun icon), Dark (moon icon), System (split preview)
- **Phone preview:** 62×96px miniature phone showing fake UI (status bar, header, content, nav bar)
- **Split preview (System):** Left half light theme, right half dark theme to show "follows system"
- **Selected state:** Primary border (2px), shadow glow, check badge (18×18px circle at top-right)
- **Unselected state:** Border color, no shadow, no check badge
- **Grid layout:** 3 cards in horizontal row with equal width (flex: 1)
- **Card spacing:** 12px gap between cards
- **Pressed opacity:** 0.85 on card press
- **Preview colors:** Hardcoded PREVIEW constants (not from semantic tokens) to always show target theme appearance
- **Appearance label:** Uppercase, 1px letter spacing, muted color
- **Typography:** labelLarge for "Appearance", labelMedium for option labels
- **Icon sizes:** 16px for theme icons, 10px for check icon
- **Icon colors:** Primary when selected, muted when unselected
- **Font weights:** Bold (700) for selected labels, medium (500) for unselected
- **Shadows:** Selected cards get copper glow shadow (elevation 4)
- **Phone UI:** Fake elements include status bar dots, header line, content lines, accent bar, nav dots
- **Accessibility:** Cards use semantic theme for border/color, but preview uses hardcoded colors
