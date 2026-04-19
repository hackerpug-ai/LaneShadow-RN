# Avatar - STYLE PROPERTIES MATRIX

**Component:** Avatar
**RN Source:** `react-native/components/ui/avatar.tsx`
**Atomic Level:** Atom
**Domain:** Core

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|
| RN Wrapper | `react-native/components/ui/avatar.tsx` | Public API, sizes, variants, badge positioning |
| AvatarBadge | `react-native/components/ui/avatar.tsx` (exported component) | Badge status indicator |

---

## STYLE PROPERTIES MATRIX

### Layout — Dimensions (by size)

| Size | Source | Width × Height | Android | iOS | Token |
|---|---|---|---|---|---|
| default | RN-wrapper | 40 × 40 | `Modifier.size(40.dp)` | `.frame(width: 40, height: 40)` | `size.avatarDefault` |
| lg | RN-wrapper | 64 × 64 | `Modifier.size(64.dp)` | `.frame(width: 64, height: 64)` | `size.avatarLg` |
| xl | RN-wrapper | 96 × 96 | `Modifier.size(96.dp)` | `.frame(width: 96, height: 96)` | `size.avatarXl` |

### Layout — Border Radius

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| borderRadius | RN-wrapper | `radius.full` = 9999 | `CircleShape` | `Circle()` | `radius.full` |
| overflow | RN-wrapper | `'hidden'` | `Modifier.clip(CircleShape)` | `.clipped()` | n/a |

### Visual — Background

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `color.muted.default` | `LaneShadowTheme.colors.muted` | `theme.colors.muted` | `color.muted.default` |

### Visual — Border/Ring

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| borderWidth (showBorder) | RN-wrapper | 2 | `Modifier.border(2.dp, ...)` | `.overlay(Circle().stroke(..., lineWidth: 2))` | `borderWidth.thick` |
| borderColor (showBorder) | RN-wrapper | `color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |
| borderWidth (showRing) | RN-wrapper | 2 | `Modifier.border(2.dp, ...)` | (same) | `borderWidth.thick` |
| borderColor (showRing) | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

### Typography — Initials (by size)

| Size | Source | fontSize | Android | iOS | Token |
|---|---|---|---|---|---|
| default | RN-wrapper | 16 | `16.sp` | `.font(.system(size: 16))` | `type.body.sm.fontSize` |
| lg | RN-wrapper | 24 | `24.sp` | `.font(.system(size: 24))` | `type.title.lg.fontSize` |
| xl | RN-wrapper | 36 | `36.sp` | `.font(.system(size: 36))` | `type.display.sm.fontSize` |
| fontWeight | RN-wrapper | `'500'` | `FontWeight.Medium` | `.medium` | `type.label.sm.fontWeight` |
| color | RN-wrapper | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Image

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| resizeMode | RN-wrapper | `'cover'` | `ContentScale.Crop` | `.scaledToFill()` | n/a |
| borderRadius | RN-wrapper | `radius.full` | `Clip(CircleShape)` | `.clipShape(Circle())` | `radius.full` |

### Badge Positioning

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| position | RN-wrapper | absolute | `Modifier.wrapContentSize(unbounded = true).offset(...)` | `.offset(...)` | n/a |
| top | RN-wrapper | -4 | `offset(y = (-4).dp)` | `.offset(y: -4)` | n/a (-4px = -xs) |
| right | RN-wrapper | -4 | `offset(x = (-4).dp)` | `.offset(x: -4)` | n/a (-4px = -xs) |

### AvatarBadge Component

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| borderRadius | RN-wrapper | `radius.full` | `CircleShape` | `Circle()` | `radius.full` |
| minWidth | RN-wrapper | 20 | `Modifier.widthIn(min = 20.dp)` | `.frame(minWidth: 20)` | n/a (20px) |
| minHeight | RN-wrapper | 20 | `Modifier.heightIn(min = 20.dp)` | `.frame(minHeight: 20)` | n/a (20px) |
| paddingHorizontal | RN-wrapper | 4 | `Modifier.padding(horizontal = 4.dp)` | `.padding(.horizontal, 4)` | `space.xs` |
| paddingVertical | RN-wrapper | 2 | `Modifier.padding(vertical = 2.dp)` | `.padding(.vertical, 2)` | n/a (2px = half xs) |
| backgroundColor (default) | RN-wrapper | `color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| backgroundColor (success) | RN-wrapper | `color.success.default` | `LaneShadowTheme.colors.success` | `theme.colors.success` | `color.success.default` |
| backgroundColor (warning) | RN-wrapper | `color.warning.default` | `LaneShadowTheme.colors.warning` | `theme.colors.warning` | `color.warning.default` |
| backgroundColor (danger) | RN-wrapper | `color.danger.default` | `LaneShadowTheme.colors.danger` | `theme.colors.danger` | `color.danger.default` |

---

## NOTES

- **Size variants**: default (40px), lg (64px), xl (96px)
- **Initials sizing**: Scales with avatar (16px / 24px / 36px)
- **Fallback**: Uses `color.muted.default` background for initials
- **Border options**: showBorder uses border color, showRing uses primary color
- **Badge positioning**: Absolute at top-right (-4, -4) offset
- **AvatarBadge**: Compound component for status indicators
