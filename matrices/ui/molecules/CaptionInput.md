# CaptionInput - STYLE PROPERTIES MATRIX

**Component:** CaptionInput
**RN Source:** `react-native/components/ui/caption-input.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native/Libraries/Components/TextInput/TextInput.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/ui/caption-input.tsx` | Public API, layout, visual styling |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Action icons (at, auto-fix, send) (see `matrices/ui/atoms/IconSymbol.md`) |
| TextInput | `node_modules/react-native/Libraries/Components/TextInput/TextInput.js` | Multi-line text input |
| Pressable | `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` | Action button containers |

---

## COMPOSITION

**Child atoms:**
- `IconSymbol` - Action icons (mention, AI assist, send) (see `matrices/ui/atoms/IconSymbol.md`)
- `TextInput` - Multi-line text input (RN primitive)
- `Pressable` - Action button containers (RN primitive)

**Composition pattern:** Container with multi-line TextInput and absolute-positioned action button row.

**Layout:** Vertical container with TextInput filling width, action buttons absolutely positioned at bottom-right.

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| borderRadius | RN-wrapper | `semantic.radius.xl` | `LaneShadowTheme.shapes.extraLarge` | `.cornerRadius(16)` | `radius.xl` (16) |
| padding | RN-wrapper | `semantic.space.md` | `LaneShadowTheme.spacing.medium` | `.padding(12)` | `space.md` (12) |
| position | RN-wrapper | `'relative'` | n/a | n/a | n/a |

### Layout — Input

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| minHeight | RN-wrapper | `80` | `80.dp` | `80` | ESCALATE — custom height for caption |
| maxHeight | RN-wrapper | `120` | `120.dp` | `120` | ESCALATE — custom max height |
| paddingRight | RN-wrapper | `120` | `120.dp` | `120` | ESCALATE — space for action buttons |
| textAlignVertical | RN-wrapper | `'top'` | `textAlign = TextAlign.Top` | n/a (iOS default) | n/a |

### Layout — Action Buttons

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| position | RN-wrapper | `'absolute'` | `Modifier.offset{...}` | `.position(...)` | n/a |
| right | RN-wrapper | `8` | `8.dp` | `8` | `space.xs` (4) + 4 |
| bottom | RN-wrapper | `8` | `8.dp` | `8` | `space.xs` (4) + 4 |
| gap | RN-wrapper | `semantic.space.xs` | `LaneShadowTheme.spacing.extraSmall` | `4` | `space.xs` (4) |

### Visual — Action Buttons

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width/height | RN-wrapper | `36` | `36.dp` | `36` | ESCALATE — between `space.lg` (16) and `space.xl` (24) |
| backgroundColor (normal) | RN-wrapper | `semantic.color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| backgroundColor (pressed) | RN-wrapper | `semantic.color.surface.pressed` | `LaneShadowTheme.colors.surfacePressed` | `theme.colors.surfacePressed` | `color.surface.pressed` |
| backgroundColor (send) | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| backgroundColor (send pressed) | RN-wrapper | `semantic.color.primary.pressed` | `LaneShadowTheme.colors.primaryPressed` | `theme.colors.primaryPressed` | `color.primary.pressed` |
| borderRadius | RN-wrapper | `semantic.radius.full` | `CircleShape` | `.cornerRadius(9999)` | `radius.full` |
| padding | RN-wrapper | `semantic.space.sm` | `LaneShadowTheme.spacing.small` | `.padding(8)` | `space.sm` (8) |
| opacity (disabled) | RN-wrapper | `0.4` | `alpha = 0.4f` | `.opacity(0.4)` | n/a |

### Typography — Input

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `semantic.type.body.md.fontSize` | `LaneShadowTheme.typography.bodyMedium.fontSize` | `Font.body` | `type.body.md.fontSize` |
| fontWeight | RN-wrapper | `semantic.type.body.md.fontWeight` | `LaneShadowTheme.typography.bodyMedium.fontWeight` | `Font.body.regular` | `type.body.md.fontWeight` |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| placeholderTextColor | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

### Visual — Icons

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| size | RN-wrapper | `20` | `20.dp` | `20` | ESCALATE — between `iconSize.sm` (16) and `iconSize.md` (24) |
| color (disabled) | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| color (send) | RN-wrapper | `semantic.color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |

---

## NOTES

- **Multi-line input:** Configured for captions with 3 lines default, 80-120px height range
- **Action buttons:** @ mention and AI assist buttons are disabled (opacity 0.4) for future feature expansion
- **Send button:** Only active button, uses primary color for prominence
- **Fixed button position:** Action buttons absolutely positioned to avoid affecting input layout
- **Right padding:** Input has 120px right padding to prevent text overlap with action buttons
- **Icon size:** 20px for action buttons (between small and medium icon sizes)
- **Compact spacing:** Small gap (4px) between action buttons for tight layout
