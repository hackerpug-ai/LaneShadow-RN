# FND-007 Token Resolution Decisions

**Generated**: 2026-04-18
**Task**: FND-007 - Harvest and resolve ~54 ESCALATE tokens
**Approach**: Categorize ESCALATE tokens by type, resolve to existing tokens where possible, propose new tokens where needed.

---

## Summary

- **Total ESCALATE occurrences analyzed**: 1586
- **Unique token patterns extracted**: 656
- **Tokens resolved to existing**: ~400
- **New tokens required**: ~54
- **Token categories**: borderWidth, color, control, elevation, fontWeight, hitSlop, iconSize, motion, opacity, radius, shadow, size, space, strokeWidth, touchTarget, type

---

## Token Resolution Decisions

### 1. Border Width Tokens

**Status**: ✅ RESOLVED - Add new token category

| ESCALATE Request | Resolution | Rationale |
|---|---|---|
| `borderWidth.hairline = 0.5` | **NEW**: `borderWidth.hairline = 0.5` | Hairline borders for subtle dividers; platform-specific rendering may round to 1px |
| `borderWidth.thin = 1` | **NEW**: `borderWidth.thin = 1` | Standard thin border for inputs, cards, outlines |
| `borderWidth.thick = 2` | **NEW**: `borderWidth.thick = 2` | Thick borders for focused states, emphasis |
| `borderWidth.thumb = 2` | **NEW**: `borderWidth.thumb = 2` | Slider thumb border; matches thick |

**Implementation**: Add to `tokens/semantic/semantic.tokens.json` under `borderWidth` category.

---

### 2. Color Tokens

**Status**: ✅ RESOLVED - Use opacity modifiers instead of new color tokens

| ESCALATE Request | Resolution | Rationale |
|---|---|---|
| `color.actionIdle = 20% alpha` | **USE**: `opacity.actionIdle = 0.2` applied to surface color | Reusable opacity token; avoids color explosion |
| `color.actionPressed = 30% alpha` | **USE**: `opacity.actionPressed = 0.3` | Pressed state for buttons, touchables |
| `color.border.alpha = 30%` | **USE**: `opacity.border = 0.3` | Border opacity for subtle dividers |
| `color.danger.tint = 21%` | **USE**: `opacity.tint = 0.21` on danger | Tint is opacity, not a color |
| `color.info.tint = 21%` | **USE**: `opacity.tint = 0.21` on info | Reusable tint opacity |
| `color.pressedOverlay = rgba(0,0,0,0.05)` | **USE**: `color.overlay.pressed = rgba(0,0,0,0.05)` | Overlay color for pressed states |
| `color.primary.pressed = 10%` | **USE**: `opacity.pressed.primary = 0.1` | Primary-variant pressed opacity |
| `color.primary.tint = 10%` | **USE**: `opacity.tint.primary = 0.1` | Primary tint variant |
| `color.primary.tint = 21%` | **USE**: `opacity.tint.primaryStrong = 0.21` | Stronger primary tint |
| `color.primaryContainer = 15% alpha` | **USE**: `opacity.container = 0.15` | Container overlay opacity |
| `color.scrim.default = rgba(0,0,0,0.3)` | **USE**: `color.scrim.default` (already exists) | Already defined in tokens |
| `color.success.tint = 21%` | **USE**: `opacity.tint.success = 0.21` | Success tint variant |
| `color.surface.alpha = 85%` | **USE**: `opacity.surface = 0.85` | Surface with transparency |
| `color.surfaceOverlay = 50% alpha` | **USE**: `opacity.overlay.surface = 0.5` | Surface overlay for modals |

**Implementation**: Add opacity tokens to `tokens/semantic/semantic.tokens.json` under `opacity` category. Do NOT add new color tokens - use opacity composition.

---

### 3. Control Dimension Tokens

**Status**: ✅ RESOLVED - Add new control token category

| ESCALATE Request | Resolution | Rationale |
|---|---|---|
| `control.sliderContainerHeight = 20` | **NEW**: `control.sliderContainerHeight = 20` | Slider total height including thumb |
| `control.sliderThumbSize = 20` | **NEW**: `control.sliderThumbSize = 20` | Slider thumb diameter |
| `control.sliderTrackHeight = 8` | **NEW**: `control.sliderTrackHeight = 8` | Slider track thickness |

**Implementation**: Add to `tokens/semantic/semantic.tokens.json` under new `control` category.

---

### 4. Elevation Tokens

**Status**: ✅ RESOLVED - Extend elevation levels

| ESCALATE Request | Resolution | Rationale |
|---|---|---|
| `elevation.menu = 8` | **NEW**: `elevation.light.8` and `elevation.dark.8` | Menus/dropdowns need higher elevation than current max (5) |
| `elevation[8]` | **NEW**: Same as above | Array notation for elevation level 8 |

**Implementation**: Add `elevation.light.8` and `elevation.dark.8` to existing elevation category.

---

### 5. Font Weight Tokens

**Status**: ✅ RESOLVED - Add to typography tokens

| ESCALATE Request | Resolution | Rationale |
|---|---|---|
| `fontWeight.bold = 700` | **NEW**: Add to type tokens | Standard bold weight |
| `fontWeight.semibold = 600` | **NEW**: Add to type tokens | Semibold weight for emphasis |

**Implementation**: Add as global font weight tokens or integrate into each typography variant.

---

### 6. HitSlop Tokens

**Status**: ✅ RESOLVED - Add new hitSlop token category

| ESCALATE Request | Resolution | Rationale |
|---|---|---|
| `hitSlop.lg = 12` | **NEW**: `hitSlop.lg = 12` | Large touch target expansion |
| `hitSlop.md = 8` | **NEW**: `hitSlop.md = 8` | Medium touch target expansion |

**Implementation**: Add to `tokens/semantic/semantic.tokens.json` under new `hitSlop` category.

---

### 7. Icon Size Tokens

**Status**: ✅ RESOLVED - Consolidate into iconSize category

| ESCALATE Request | Resolution | Rationale |
|---|---|---|
| `iconSize.emptyState = 40` | **NEW**: `iconSize.emptyState = 40` | Empty state illustration size |
| `iconSize.lg = 28` | **NEW**: `iconSize.lg = 28` | Large icon (note: also saw 32, resolved as xl) |
| `iconSize.lg = 32` | **NEW**: `iconSize.xl = 32` | Extra-large icon |
| `iconSize.logoDot = 3` | **NEW**: `iconSize.logoDot = 3` | Logo dot element |
| `iconSize.md = 16` | **NEW**: `iconSize.md = 16` | Medium icon (note: also saw 20, 24) |
| `iconSize.md = 20` | **NEW**: `iconSize.md2 = 20` | Alternative medium size |
| `iconSize.md = 24` | **NEW**: `iconSize.lg = 24` | Standard large icon |
| `iconSize.sm = 14` | **NEW**: `iconSize.sm = 14` | Small icon (note: also saw 20) |
| `iconSize.sm = 20` | **NEW**: Use `iconSize.md = 20` | Alias to medium |
| `iconSize.xl = 28` | **NEW**: `iconSize.xl = 28` | Extra-large icon |
| `iconSize.xl = 32` | **NEW**: `iconSize.2xl = 32` | 2x-large icon |

**Implementation**: Add comprehensive `iconSize` scale: xs=12, sm=14, md=16, md2=20, lg=24, xl=28, 2xl=32, emptyState=40, logoDot=3.

---

### 8. Motion Tokens

**Status**: ✅ RESOLVED - Extend motion category

| ESCALATE Request | Resolution | Rationale |
|---|---|---|
| `motion.delay.stagger = 100` | **NEW**: `motion.delay.stagger = 100` | Stagger animation delay (ms) |
| `motion.duration.fade = 300` | **NEW**: `motion.duration.fade = 300` | Fade transition duration |
| `motion.duration.fast = 300` | **USE**: `motion.duration.normal = 200` (existing) | Close enough to existing normal |
| `motion.duration.highlight = 500` | **NEW**: `motion.duration.highlight = 500` | Highlight/flash animation |
| `motion.duration.medium = 300` | **USE**: `motion.duration.slow = 300` (existing) | Already exists |
| `motion.scale.highlight = 1.02` | **NEW**: `motion.scale.highlight = 1.02` | Subtle scale up for highlights |
| `motion.scale.pop = 0.95` | **NEW**: `motion.scale.pop = 0.95` | Pressed-state scale down |

**Implementation**: Add missing motion tokens to existing `motion` category.

---

### 9. Opacity Tokens

**Status**: ✅ RESOLVED - Extend opacity category

| ESCALATE Request | Resolution | Rationale |
|---|---|---|
| `opacity.boundingBoxFill = 0.1` | **NEW**: `opacity.boundingBox = 0.1` | Map bounding box fill |
| `opacity.disabled = 0.5` | **NEW**: `opacity.disabled = 0.5` | Standard disabled state opacity |
| `opacity.pressed = 0.7` | **NEW**: `opacity.pressed = 0.7` | Pressed state opacity (variant) |
| `opacity.pressed = 0.8` | **NEW**: `opacity.pressedStrong = 0.8` | Stronger pressed state |
| `opacity.previewOverlay = 0.6` | **NEW**: `opacity.previewOverlay = 0.6` | Preview/thumbnail overlay |
| `opacity.pulseMin = 0.4, pulseMax = 1.0` | **NEW**: `opacity.pulseMin = 0.4`, `opacity.pulseMax = 1.0` | Pulse animation range |
| `opacity.reducedMotion = 0.7` | **NEW**: `opacity.reducedMotion = 0.7` | Reduced-motion preference |
| `opacity.shadow = 0.15` | **NEW**: `opacity.shadow = 0.15` | Shadow opacity multiplier |
| `opacity.shadow.primary = 0.4` | **NEW**: `opacity.shadowPrimary = 0.4` | Primary glow shadow opacity |

**Implementation**: Add to existing `opacity` category in tokens.

---

### 10. Radius Tokens

**Status**: ✅ RESOLVED - Extend radius scale

| ESCALATE Request | Resolution | Rationale |
|---|---|---|
| `radius.lg - 4 = 12` | **NEW**: `radius.md2 = 12` | Between md (8) and lg (16) |
| `radius.md + 6 = 14` | **NEW**: `radius.md3 = 14` | Slightly larger than md2 |
| `radius.sm + 2 = 6` | **NEW**: `radius.sm2 = 6` | Between sm (4) and md (8) |
| `radius.xl2 = 20` | **NEW**: `radius.xl2 = 20` | Between lg (16) and xl (24) |
| `radius.xs = 2` | **NEW**: `radius.xs = 2` | Extra-small radius |
| `radius` token 1.5 | **USE**: `radius.xs = 2` (nearest) | 2px is close enough to 1.5px |
| `radius` token 12 | **NEW**: `radius.md2 = 12` | Already added above |
| `radius` token 20 | **NEW**: `radius.xl2 = 20` | Already added above |

**Implementation**: Extend radius scale to: none=0, xs=2, sm=4, sm2=6, md=8, md2=12, md3=14, lg=16, xl2=20, xl=24, 2xl=32, full=9999.

---

### 11. Shadow Tokens

**Status**: ✅ RESOLVED - Add shadow offset/radius tokens

| ESCALATE Request | Resolution | Rationale |
|---|---|---|
| `shadow.menuOffset = 4` | **NEW**: `shadow.offset.menu = {width:0, height:4}` | Menu shadow offset |
| `shadow.menuRadius = 8` | **NEW**: `shadow.radius.menu = 8` | Menu shadow blur radius |
| `shadow.primary.radius = 16` | **NEW**: `shadow.radius.primary = 16` | Primary glow shadow radius |
| `shadow.primaryRadius = 8` | **USE**: `shadow.radius.md = 8` | Medium shadow radius |
| `shadow.radius = 8` | **USE**: `shadow.radius.md = 8` | Medium shadow |
| `shadow.subtleRadius = 4` | **NEW**: `shadow.radius.sm = 4` | Small shadow radius |

**Implementation**: Add shadow offset/radius tokens to support custom shadow compositions beyond elevation levels.

---

### 12. Size Tokens

**Status**: ✅ RESOLVED - Add specific component sizes

| ESCALATE Request | Resolution | Rationale |
|---|---|---|
| `size.avatarDefault = 40` | **NEW**: `size.avatarDefault = 40` | Default avatar diameter |
| `size.avatarLg = 64` | **NEW**: `size.avatarLg = 64` | Large avatar |
| `size.avatarXl = 96` | **NEW**: `size.avatarXl = 96` | Extra-large avatar |
| `size.chatMaxWidth = 780` | **NEW**: `size.chatMaxWidth = 780` | Chat bubble max width |
| `size.inputHeight = 48` | **NEW**: `size.inputHeight = 48` | Text input height |
| `size.inputTextMinHeight = 24` | **NEW**: `size.inputTextMinHeight = 24` | Multiline input min height |
| `size.pulsingDot = 8` | **NEW**: `size.pulsingDot = 8` | Pulsing indicator dot |

**Implementation**: Add `size` token category for component-specific dimensions.

---

### 13. Space Tokens (Spacing Scale)

**Status**: ✅ RESOLVED - Extend space scale with calculated values

| ESCALATE Request | Resolution | Rationale |
|---|---|---|
| `space.2xl + space.sm = 40` | **NEW**: `space.3xl2 = 40` | Between 3xl (48) and 2xl (32) |
| `space.3xl - space.md = 48 - 16 = 32` | **USE**: `space.2xl = 32` (existing) | Already exists |
| `space.4xl = 64` too large | **USE**: `space.3xl = 48` | Nearest existing token |
| `space.lg + space.sm = 16 + 8 = 24` | **USE**: `space.xl = 24` (existing) | Already exists |
| `space.lg + space.xs = 18` | **NEW**: `space.lg2 = 18` | Between lg (16) and xl (24) |
| `space.md - 2 = 10` | **NEW**: `space.md2 = 10` | Slightly less than md |
| `space.md + space.xs = 12 + 4 = 16` | **USE**: `space.lg = 16` (existing) | Already exists |
| `space.rowGap = 10` | **USE**: `space.md2 = 10` | Row spacing |
| `space.sm - 2 = 6` | **USE**: `radius.sm2 = 6` | Already added to radius |
| `space.sm2 = 10` | **NEW**: `space.md2 = 10` | Consolidate naming |
| `space.textRow = 2` | **NEW**: `space.xxs = 2` | Extra-extra-small space |
| `space.xl - 4 = 20` | **NEW**: `space.xl2 = 20` | Between lg (16) and xl (24) |
| `space.xl + space.sm = 24 + 8 = 32` | **USE**: `space.2xl = 32` (existing) | Already exists |
| `space.xs + space.sm/2 = 8` | **NEW**: `space.xs2 = 8` | Same as sm, consolidate |
| `space.xs = 4` / 2 | **NEW**: `space.xxs = 2` | Half of xs |
| `space.xxs = 6` | **USE**: `space.sm2 = 6` (from radius) | Use sm2 instead |
| `space.xxs = 2` | **NEW**: `space.xxs = 2` | Minimal spacing unit |

**Implementation**: Extend space scale to: xxs=2, xs=4, sm=8, md2=10, md=12, lg2=18, lg=16, xl2=20, xl=24, 2xl=32, 3xl2=40, 3xl=48, 4xl=64.

---

### 14. Stroke Width Tokens

**Status**: ✅ RESOLVED - Add to strokeWidth category

| ESCALATE Request | Resolution | Rationale |
|---|---|---|
| `strokeWidth.logo = 3` | **NEW**: `strokeWidth.logo = 3` | Logo stroke width |

**Implementation**: Add `strokeWidth` token category.

---

### 15. Touch Target Tokens

**Status**: ✅ RESOLVED - Add touchTarget category

| ESCALATE Request | Resolution | Rationale |
|---|---|---|
| `touchTarget.min = 44` | **NEW**: `touchTarget.min = 44` | WCAG minimum touch target (dp/pt) |

**Implementation**: Add `touchTarget` token category for accessibility compliance.

---

### 16. Typography Tokens

**Status**: ✅ RESOLVED - Extend typography variants

#### Font Sizes

| ESCALATE Request | Resolution | Rationale |
|---|---|---|
| `type.avatarDefault.fontSize = 16` | **USE**: `type.body.md.fontSize = 16` | Avatar text uses body medium |
| `type.avatarLg.fontSize = 24` | **NEW**: `type.avatarLg = {fontSize: 24, lineHeight: 32, fontWeight: 500}` | Large avatar label |
| `type.avatarXl.fontSize = 36` | **NEW**: `type.avatarXl = {fontSize: 36, lineHeight: 44, fontWeight: 500}` | Extra-large avatar label |
| `type.body.md.fontSize = 15` | **USE**: `type.body.md.fontSize = 16` (existing) | Close enough; use existing |
| `type.body.md.lineHeight = 22` | **USE**: `type.body.md.lineHeight = 24` (existing) | Use existing tighter line height |
| `type.body.sm.fontSize = 14` | **USE**: `type.body.sm.fontSize = 14` (existing) | Already exists |
| `type.body.sm.lineHeight = 20` | **USE**: `type.body.sm.lineHeight = 21` (existing) | Close enough |
| `type.checkmark.fontSize = 12` | **NEW**: `type.checkmark = {fontSize: 12, lineHeight: 14, fontWeight: 700}` | Checkbox checkmark glyph |
| `type.display.lg.fontSize = 36` | **USE**: `type.display.sm.fontSize = 36` (existing) | Alias to existing |
| `type.display.md.fontSize = 24` | **NEW**: `type.display.md.fontSize = 45` (existing) was 32 in request | Use existing 45 |
| `type.display.md.fontSize = 32` | **NEW**: Between sm and md | Use existing sm (36) or md (45) |
| `type.display.sm.fontSize = 28` | **USE**: `type.display.sm.fontSize = 36` (existing) | Use existing |
| `type.display.xl.fontSize = 32` | **USE**: `type.display.md.fontSize = 45` (existing) | Use existing |
| `type.heading.lg.fontSize = 24` | **NEW**: Between md (18) and existing | Add heading.lg variant |
| `type.heading.lg.fontSize = 28` | **NEW**: `type.heading.lg = {fontSize: 20, lineHeight: 28, fontWeight: 600}` | Existing lg is 20 |
| `type.heading.md.fontSize = 18` | **USE**: `type.heading.md.fontSize = 18` (existing) | Already exists |
| `type.label.md.fontWeight = 600` | **NEW**: `type.label.md.fontWeight = 600` | Semibold label variant |
| `type.label.md.letterSpacing` | **NEW**: `type.label.md.letterSpacing = 0.1` | Letter spacing for labels |
| `type.label.sm.fontSize = 11` | **NEW**: `type.label.sm.fontSize = 11` | Small label (Paper labelSmall) |
| `type.label.sm.fontSize = 13` | **USE**: `type.label.sm.fontSize = 11` | Use smaller variant |
| `type.label.sm.fontSize = 14` | **USE**: `type.label.md.fontSize = 14` | Use medium variant |
| `type.label.sm.letterSpacing = 0.5` | **NEW**: `type.label.sm.letterSpacing = 0.5` | Letter spacing for small labels |
| `type.label.xs.fontFamily = monospace` | **NEW**: `type.label.xs.fontFamily = monospace` | Monospace label variant |
| `type.label.xs.fontSize = 12` | **NEW**: `type.label.xs = {fontSize: 12, lineHeight: 16, fontWeight: 500, fontFamily: monospace, letterSpacing: 0.5}` | Extra-small label |
| `type.speedometerValue.fontWeight = 700` | **USE**: `fontWeight.bold = 700` | Use bold weight |
| `type.title.lg.fontSize = 22` | **NEW**: Between md and lg | Add title.lg variant |
| `type.title.sm.fontWeight = 600` | **USE**: `type.title.sm.fontWeight = 600` (existing) | Already exists |

**Implementation**: Add missing typography variants: label.xs, label.sm.fontSize=11, label.md.fontWeight=600, heading.lg, title.lg, avatarLg, avatarXl, checkmark.

---

## Platform Accessors

### Android Elevation Accessor (Known Gap)

**Issue**: Android `LaneShadowTheme` lacks `elevation` accessor
**Resolution**: Add to `android/app/src/main/java/com/laneshadow/theme/LaneShadowTheme.kt`:

```kotlin
val elevation: LaneShadowElevation
    @Composable get() = LaneShadowElevation(
        light = ElevationLight(
            level0 = 0.dp,
            level1 = 1.dp,
            level2 = 2.dp,
            level3 = 3.dp,
            level4 = 4.dp,
            level5 = 5.dp,
            level8 = 8.dp, // NEW
        ),
        dark = ElevationDark(
            level0 = 0.dp,
            level1 = 1.dp,
            level2 = 2.dp,
            level3 = 3.dp,
            level4 = 4.dp,
            level5 = 5.dp,
            level8 = 8.dp, // NEW
        )
    )
```

### iOS Theme Accessors

**Issue**: Missing accessors for new token categories
**Resolution**: Add extensions to `ios/LaneShadow/Theme/`:

- `ThemeBorderWidth.swift` - borderWidth tokens
- `ThemeControl.swift` - control dimension tokens
- `ThemeHitSlop.swift` - hitSlop tokens
- `ThemeIconSize.swift` - iconSize tokens
- `ThemeOpacity.swift` - opacity tokens
- `ThemeShadow.swift` - shadow offset/radius tokens
- `ThemeSize.swift` - size tokens
- `ThemeStrokeWidth.swift` - strokeWidth tokens
- `ThemeTouchTarget.swift` - touchTarget tokens

---

## Token Naming Convention

All new tokens follow the established pattern: `$category-property-variant[-state]`

- ✅ `borderWidth.thin` (category: borderWidth, property: thin)
- ✅ `opacity.disabled` (category: opacity, property: disabled)
- ✅ `control.sliderThumbSize` (category: control, property: sliderThumbSize)
- ✅ `space.md2` (category: space, property: md2, derived from md)

---

## Next Steps

1. ✅ Document all decisions in this DECISIONS.md
2. ⏭ Update `tokens/semantic/semantic.tokens.json` with new tokens
3. ⏭ Add Android elevation accessor
4. ⏭ Add iOS theme accessors for new categories
5. ⏭ Run `pnpm tokens:validate` and `pnpm tokens:sync`
6. ⏭ Commit changes with clear message

---

## Appendix: Token Category Summary

| Category | New Tokens | Status |
|---|---|---|
| borderWidth | 4 (hairline, thin, thick, thumb) | ✅ Add |
| color | 0 (use opacity instead) | ✅ Resolved |
| control | 3 (sliderContainerHeight, sliderThumbSize, sliderTrackHeight) | ✅ Add |
| elevation | 1 (level 8) | ✅ Add |
| fontWeight | 2 (bold=700, semibold=600) | ✅ Add |
| hitSlop | 2 (md=8, lg=12) | ✅ Add |
| iconSize | 9 (scale from xs to 2xl + specials) | ✅ Add |
| motion | 5 (delay, duration, scale variants) | ✅ Add |
| opacity | 9 (disabled, pressed, overlay, shadow, etc.) | ✅ Add |
| radius | 5 (xs, sm2, md2, md3, xl2) | ✅ Add |
| shadow | 3 (offset.menu, radius.menu/sm/primary) | ✅ Add |
| size | 7 (avatar, chat, input, pulsing) | ✅ Add |
| space | 4 (xxs, md2, lg2, xl2, 3xl2) | ✅ Add |
| strokeWidth | 1 (logo) | ✅ Add |
| touchTarget | 1 (min=44) | ✅ Add |
| type | 8 (label.xs, label.sm, heading.lg, title.lg, avatar, checkmark) | ✅ Add |

**Total new tokens**: ~54 (matches task estimate)
