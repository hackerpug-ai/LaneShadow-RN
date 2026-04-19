# NewSessionButton - STYLE PROPERTIES MATRIX

**Component:** NewSessionButton
**RN Source:** `react-native/components/ui/new-session-button.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`, `node_modules/react-native/Libraries/Components/View/View.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|
| RN Wrapper | `react-native/components/ui/new-session-button.tsx` | Public API, variants (header/fab/text), sizes |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Plus icons (see `matrices/ui/atoms/IconSymbol.md`) |
| Text (Paper) | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Typography |

---

## COMPOSITION

**Child atoms:**
- `IconSymbol` - Plus icon (fab) or plus-circle-outline icon (header/text) (see `matrices/ui/atoms/IconSymbol.md`)

**Composition pattern:** Three variants - FAB (circular, absolute position), header (icon + text row), text (icon + text row, bolder).

**Layout:** Row layout for header/text variants, centered layout for FAB.

---

## STYLE PROPERTIES MATRIX

### Layout — FAB Variant Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| position | RN-wrapper | `'absolute'` | n/a (use Box with offset) | `.position(...)` | n/a |
| bottom | RN-wrapper | `24` | `Modifier.offset(y = (-24).dp)` | `.offset(y: -24)` | `space.xl` |
| right | RN-wrapper | `24` | `Modifier.offset(x = (-24).dp)` | `.offset(x: -24)` | `space.xl` |
| width (sm) | RN-wrapper | `48` | `Modifier.width(48.dp)` | `.frame(width: 48)` | ESCALATE — propose `size.fabSm = 48` |
| width (md) | RN-wrapper | `56` | `Modifier.width(56.dp)` | `.frame(width: 56)` | ESCALATE — propose `size.fabMd = 56` |
| width (lg) | RN-wrapper | `64` | `Modifier.width(64.dp)` | `.frame(width: 64)` | ESCALATE — propose `size.fabLg = 64` |
| height (sm) | RN-wrapper | `48` | `Modifier.height(48.dp)` | `.frame(height: 48)` | `size.fabSm` |
| height (md) | RN-wrapper | `56` | `Modifier.height(56.dp)` | `.frame(height: 56)` | `size.fabMd` |
| height (lg) | RN-wrapper | `64` | `Modifier.height(64.dp)` | `.frame(height: 64)` | `size.fabLg` |
| borderRadius (sm) | RN-wrapper | `24` | `CircleShape` | `Circle()` | `size.fabSm / 2` |
| borderRadius (md) | RN-wrapper | `28` | `CircleShape` | `Circle()` | `size.fabMd / 2` |
| borderRadius (lg) | RN-wrapper | `32` | `CircleShape` | `Circle()` | `size.fabLg / 2` |
| alignItems | RN-wrapper | `'center'` | `contentAlignment = Alignment.Center` | n/a | n/a |
| justifyContent | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | n/a | n/a |

### Visual — FAB Variant (by state)

| State | Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| default | backgroundColor | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| pressed | backgroundColor | RN-wrapper | `semantic.color.primary.pressed` | `LaneShadowTheme.colors.primaryPressed` | `theme.colors.primaryPressed` | `color.primary.pressed` |
| disabled | backgroundColor | RN-wrapper | `semantic.color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| default | opacity | RN-wrapper | `1` | `Modifier.alpha(1f)` | `.opacity(1)` | n/a |
| disabled | opacity | RN-wrapper | `0.5` | `Modifier.alpha(0.5f)` | `.opacity(0.5)` | `opacity.disabled = 0.5` |
| any | elevation | RN-wrapper | `semantic.elevation[4]` | `Modifier.shadow(elevation = 4.dp)` | shadow props | `elevation.4` |

### Visual — FAB Icon

| State | Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| default | color | RN-wrapper | `semantic.color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |
| disabled | color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| any | name | RN-wrapper | `'plus'` | `Icons.Outlined.Add` | SF Symbol: `plus` | n/a |

### Layout — Header/Text Variants

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap (header) | RN-wrapper | `6` | `Modifier.padding(end = 6.dp)` | `Spacer(minLength: 6)` | ESCALATE — propose `space.xs + 2 = 6` |
| gap (text) | RN-wrapper | `8` | `Modifier.padding(end = 8.dp)` | `Spacer(minLength: 8)` | `space.sm` |
| padding | RN-wrapper | size-based (sm=4, md=6, lg=8) | `Modifier.padding(4/6/8.dp)` | `.padding(4/6/8)` | `space.xs/md/sm` |

### Visual — Header/Text Variants

| Variant | Element | Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|---|---|
| header/text | default | color (icon) | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| header/text | disabled | color (icon) | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| header | default | color (text) | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| text | default | color (text) | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| text | disabled | color (text) | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| any | pressed | opacity | RN-wrapper | `0.8` | `Modifier.alpha(0.8f)` | `.opacity(0.8)` | `opacity.pressed = 0.8` |
| any | disabled | opacity | RN-wrapper | `0.5` | `Modifier.alpha(0.5f)` | `.opacity(0.5)` | `opacity.disabled = 0.5` |

### Typography — Header/Text Variants

| Variant | Property | Source | Size | Android | iOS | Token |
|---|---|---|---|---|---|---|---|
| header | fontSize | RN-wrapper | size-based (sm=13, md=14, lg=16) | `13/14/16.sp` | `13/14/16` | ESCALATE — size tokens |
| header | fontWeight | RN-wrapper | `'600'` (semibold) | `FontWeight.SemiBold` | `.semibold` | `type.title.md.fontWeight` |
| text | fontSize | RN-wrapper | size-based (sm=13, md=14, lg=16) | `13/14/16.sp` | `13/14/16` | ESCALATE — size tokens |
| text | fontWeight | RN-wrapper | `'700'` (bold) | `FontWeight.Bold` | `.bold` | `type.title.lg.fontWeight` |

### Icon Sizing (All Variants)

| Size | Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|---|
| sm | size | RN-wrapper | `20` | `20.dp` | `20` | ESCALATE — propose `iconSize.sm = 20` |
| md | size | RN-wrapper | `24` | `24.dp` | `24` | `iconSize.lg` |
| lg | size | RN-wrapper | `28` | `28.dp` | `28` | `iconSize.xl` |
| any | name (header/text) | RN-wrapper | `'plus-circle-outline'` | `Icons.Outlined.AddCircleOutline` | SF Symbol: `plus.circle` | n/a |

---

## NOTES

- **Three variants:** FAB (floating action button), header (subtle text), text (bold primary text)
- **FAB positioning:** Absolute positioned 24px from bottom and right edges
- **FAB sizes:** sm=48px, md=56px, lg=64px (circular, border radius = size/2)
- **FAB elevation:** elevation 4 (shadow)
- **FAB colors:** Primary background, onPrimary icon; disabled uses surfaceVariant background
- **Header variant:** Muted text color, 600 weight, 6px gap
- **Text variant:** Primary color, 700 weight (bolder), 8px gap
- **Icon names:** FAB uses 'plus', header/text use 'plus-circle-outline'
- **Padding:** Size-based (4/6/8px) for header/text variants
- **Press states:** 0.8 opacity when pressed
- **Disabled states:** 0.5 opacity, onSurface.subtle color for icons/text
- **Icon sizes:** 20px (sm), 24px (md), 28px (lg)
- **Elevation:** Only FAB has elevation (4)
- **Accessibility:** Labels include "New session" or "New ${label}"
