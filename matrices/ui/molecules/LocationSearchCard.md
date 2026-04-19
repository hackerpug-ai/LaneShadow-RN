# LocationSearchCard - STYLE PROPERTIES MATRIX

**Component:** LocationSearchCard
**RN Source:** `react-native/components/chat/cards/location-search-card.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`, `react-native-reanimated`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/chat/cards/location-search-card.tsx` | Public API, location search results display |
| Badge | `react-native/components/ui/badge.tsx` | Place type badges (Gas, Food, Coffee, etc.) |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Not used in this component |
| Pressable | `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` | Result row touch handling |
| Reanimated | `react-native-reanimated` | Pulsing dot animation (running state) |

---

## COMPOSITION

**Child atoms:**
- `Badge` - Place type badges (see `matrices/ui/atoms/Badge.md`)
- `Pressable` - Result row touch targets
- `View` - Card container, result rows
- `Text` - Agent summary, result names, addresses, distances, detour times

**Composition pattern:** Card with optional agent summary header, followed by list of place result rows (numbered circles + content + right info).

**Layout:** Vertical stack. Header (optional), then result rows (horizontal with index circle, content, right info).

---

## STYLE PROPERTIES MATRIX

### Visual — Card Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| borderRadius | RN-wrapper | `semantic.radius.md` | `LaneShadowTheme.shapes.medium` | `.cornerRadius(8)` | `radius.md` (8) |
| overflow | RN-wrapper | `'hidden'` | `Modifier.clipToBounds()` | `.clipped()` | n/a |
| minWidth | RN-wrapper | `'90%'` | `Modifier.fillMaxWidth(0.9f)` | `.frame(minWidth: 0.9)` | n/a |

### Visual — Running State Card

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| padding | RN-wrapper | `semantic.space.md` | `LaneShadowTheme.spacing.medium` | `.padding(12)` | `space.md` (12) |
| gap | RN-wrapper | `semantic.space.sm` | `LaneShadowTheme.spacing.small` | `8` | `space.sm` (8) |

### Visual — Failed State Card

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `${semantic.color.danger.default}1A` (10% alpha) | `LaneShadowTheme.colors.danger.copy(alpha = 0.1f)` | `theme.colors.danger.opacity(0.1)` | `color.danger.default` |
| borderWidth | RN-wrapper | `1` | `1.dp` | `1` | n/a |
| borderColor | RN-wrapper | `${semantic.color.danger.default}4D` (30% alpha) | `LaneShadowTheme.colors.danger.copy(alpha = 0.3f)` | `theme.colors.danger.opacity(0.3)` | `color.danger.default` |
| padding | RN-wrapper | `semantic.space.md` | `LaneShadowTheme.spacing.medium` | `.padding(12)` | `space.md` (12) |

### Layout — Running Row

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |

### Visual — Pulsing Dot

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `8` | `8.dp` | `8` | ESCALATE — custom size |
| height | RN-wrapper | `8` | `8.dp` | `8` | ESCALATE — custom size |
| borderRadius | RN-wrapper | `4` | `4.dp` | `4` | ESCALATE — custom size |
| backgroundColor | RN-wrapper | `semantic.color.info.default` | `LaneShadowTheme.colors.info` | `theme.colors.info` | `color.info.default` |
| opacity (animated) | RN-wrapper | `0.4 → 1.0 → 0.4` (repeat) | `alpha = animateFloatAsState(...)` | `.opacity(pulse)` | n/a |
| duration | RN-wrapper | `600ms` | `600ms` | `0.6s` | n/a |

### Layout — Result Row

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `10` | `10.dp` | `10` | ESCALATE — between `space.sm` (8) and `space.md` (12) |
| paddingVertical | RN-wrapper | `semantic.space.sm` | `LaneShadowTheme.spacing.small` | `.padding(.vertical, 8)` | `space.sm` (8) |
| paddingHorizontal | RN-wrapper | `semantic.space.sm` | `LaneShadowTheme.spacing.small` | `.padding(.horizontal, 8)` | `space.sm` (8) |

### Visual — Result Row Background

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor (selected) | RN-wrapper | `${semantic.color.info.default}1A` (10% alpha) | `LaneShadowTheme.colors.info.copy(alpha = 0.1f)` | `theme.colors.info.opacity(0.1)` | `color.info.default` |
| backgroundColor (pressed) | RN-wrapper | `semantic.color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| backgroundColor (default) | RN-wrapper | `'transparent'` | `Color.Transparent` | `.clear` | n/a |

### Visual — Index Circle

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width/height | RN-wrapper | `28` | `28.dp` | `28` | ESCALATE — custom size |
| borderRadius | RN-wrapper | `14` | `14.dp` | `14` | ESCALATE — custom size (half of width/height) |
| backgroundColor (selected) | RN-wrapper | `semantic.color.info.default` | `LaneShadowTheme.colors.info` | `theme.colors.info` | `color.info.default` |
| backgroundColor (unselected) | RN-wrapper | `${semantic.color.info.default}26` (15% alpha) | `LaneShadowTheme.colors.info.copy(alpha = 0.15f)` | `theme.colors.info.opacity(0.15)` | `color.info.default` |
| color (selected) | RN-wrapper | `semantic.color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |
| color (unselected) | RN-wrapper | `semantic.color.info.default` | `LaneShadowTheme.colors.info` | `theme.colors.info` | `color.info.default` |
| fontWeight | RN-wrapper | `700` | `FontWeight.Bold` | `.bold()` | n/a |

### Typography — Result Name

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `semantic.type.body.md.fontSize` | `LaneShadowTheme.typography.bodyMedium.fontSize` | `Font.body` | `type.body.md.fontSize` |
| fontWeight | RN-wrapper | `600` | `FontWeight.SemiBold` | `.semibold()` | n/a |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| numberOfLines | RN-wrapper | `1` | `maxLines = 1` | `.lineLimit(1)` | n/a |

### Layout — Name Row

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `6` | `6.dp` | `6` | ESCALATE — between `space.xs` (4) and `space.sm` (8) |

### Layout — Result Content

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.layoutPriority(1)` | n/a |
| gap | RN-wrapper | `2` | `2.dp` | `2` | ESCALATE — minimal gap |

### Typography — Result Address

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `semantic.type.body.sm.fontSize` | `LaneShadowTheme.typography.bodySmall.fontSize` | `Font.footnote` | `type.body.sm.fontSize` |
| color | RN-wrapper | `semantic.color.muted.default` | `LaneShadowTheme.colors.muted` | `theme.colors.muted` | `color.muted.default` |
| numberOfLines | RN-wrapper | `1` | `maxLines = 1` | `.lineLimit(1)` | n/a |

### Layout — Right Info

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| alignItems | RN-wrapper | `'flex-end'` | `horizontalAlignment = Alignment.End` | `.frame(maxWidth: .infinity, alignment: .trailing)` | n/a |
| gap | RN-wrapper | `2` | `2.dp` | `2` | ESCALATE — minimal gap |
| minWidth | RN-wrapper | `50` | `50.dp` | `50` | ESCALATE — custom width |

### Typography — Detour Time

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `semantic.type.label.sm.fontSize` | `LaneShadowTheme.typography.labelSmall.fontSize` | `Font.caption` | `type.label.sm.fontSize` |
| fontWeight | RN-wrapper | `600` | `FontWeight.SemiBold` | `.semibold()` | n/a |
| color | RN-wrapper | `semantic.color.warning.default` | `LaneShadowTheme.colors.warning` | `theme.colors.warning` | `color.warning.default` |

### Typography — Distance Label

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `semantic.type.label.sm.fontSize` | `LaneShadowTheme.typography.labelSmall.fontSize` | `Font.caption` | `type.label.sm.fontSize` |
| color | RN-wrapper | `semantic.color.muted.default` | `LaneShadowTheme.colors.muted` | `theme.colors.muted` | `color.muted.default` |

---

## NOTES

- **Place type badges:** Maps place types to badges (Gas→warning, Food→success, Coffee→info, etc.)
- **Numbered results:** Index circles (1-5) with colored fill for selection state
- **Distance formatting:** "<1000m" or ">=1000m" → "X.X km" or "X m" format
- **Detour time:** Shows "+X min" if detour > 0 minutes
- **Selection state:** Selected result has 10% info color background
- **Press feedback:** Haptic impact on result row press
- **Map integration:** Selected result populates map markers via `useSearchResults` context
- **Running state:** Shows pulsing dot with "Searching nearby places..." message
- **Failed state:** Red-tinted card with error message
- **Agent summary:** Optional conversational summary at top of results
- **Empty state:** "No places found." when results array is empty
- **Badge variants:** Uses semantic badge variants (warning, success, info, secondary, default, outline)
