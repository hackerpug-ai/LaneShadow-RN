# ReasoningCard - STYLE PROPERTIES MATRIX

**Component:** ReasoningCard
**RN Source:** `react-native/components/chat/cards/reasoning-card.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`, `react-native-reanimated`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/chat/cards/reasoning-card.tsx` | Public API, collapsible reasoning display |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Lightbulb icon, chevron icons (see `matrices/ui/atoms/IconSymbol.md`) |
| Pressable | `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` | Touch handling for expand/collapse |
| Reanimated | `react-native-reanimated` | Pulsing dot animation |

---

## COMPOSITION

**Child atoms:**
- `IconSymbol` - Lightbulb icon and chevron icons (see `matrices/ui/atoms/IconSymbol.md`)
- `Pressable` - Touch target for expand/collapse
- `View` - Card container, streaming overlay, body container
- `Text` - Duration label, reasoning content

**Composition pattern:** Collapsible card with header row (icon + label + pulsing dot + chevron) and expandable body with divider.

**Layout:** Horizontal header row with icon, label, pulsing dot (streaming), and chevron. Body expands vertically below divider when tapped.

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| minWidth | RN-wrapper | `'90%'` | `Modifier.fillMaxWidth(0.9f)` | `.frame(minWidth: 0.9)` | n/a |
| minHeight | RN-wrapper | `44` | `44.dp` (touch target) | `44` (touch target) | n/a |
| overflow | RN-wrapper | `'hidden'` | `Modifier.clipToBounds()` | `.clipped()` | n/a |
| position | RN-wrapper | `'relative'` | n/a | n/a | n/a |

### Visual — Card

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| borderRadius | RN-wrapper | `semantic.radius.md` | `LaneShadowTheme.shapes.medium` | `.cornerRadius(8)` | `radius.md` (8) |
| paddingHorizontal | RN-wrapper | `semantic.space.md` | `LaneShadowTheme.spacing.medium` | `.padding(.horizontal, 12)` | `space.md` (12) |
| paddingVertical | RN-wrapper | `semantic.space.sm` | `LaneShadowTheme.spacing.small` | `.padding(.vertical, 8)` | `space.sm` (8) |
| opacity (pressed) | RN-wrapper | `0.7` | `alpha = 0.7f` | `.opacity(0.7)` | n/a |
| opacity (default) | RN-wrapper | `1` | `alpha = 1f` | `.opacity(1)` | n/a |

### Visual — Streaming Overlay

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `${semantic.color.primary.default}14` (8% alpha) | `LaneShadowTheme.colors.primary.copy(alpha = 0.08f)` | `theme.colors.primary.opacity(0.08)` | `color.primary.default` |
| position | RN-wrapper | `'absolute'` | `Modifier.offset{...}` | `.position(...)` | n/a |

### Layout — Header Row

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `semantic.space.sm` | `LaneShadowTheme.spacing.small` | `8` | `space.sm` (8) |

### Visual — Lightbulb Icon

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| name | RN-wrapper | `'lightbulb-on-outline'` | `Icons.Outlined.Lightbulb` | `SF Symbol: "lightbulb"` | n/a |
| size | RN-wrapper | `16` | `16.dp` | `16` | ESCALATE — propose `iconSize.xs = 16` |
| color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |

### Typography — Label

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `semantic.type.label.md.fontSize` | `LaneShadowTheme.typography.labelMedium.fontSize` | `Font.subheadline` | `type.label.md.fontSize` |
| fontWeight | RN-wrapper | `semantic.type.label.md.fontWeight` | `LaneShadowTheme.typography.labelMedium.fontWeight` | `Font.subheadline.regular` | `type.label.md.fontWeight` |
| color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.layoutPriority(1)` | n/a |
| numberOfLines | RN-wrapper | `1` | `maxLines = 1` | `.lineLimit(1)` | n/a |

### Visual — Pulsing Dot

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `6` | `6.dp` | `6` | ESCALATE — custom size |
| height | RN-wrapper | `6` | `6.dp` | `6` | ESCALATE — custom size |
| borderRadius | RN-wrapper | `3` | `3.dp` | `3` | ESCALATE — custom size |
| backgroundColor | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| opacity (animated) | RN-wrapper | `0.4 → 1.0 → 0.4` (repeat) | `alpha = animateFloatAsState(...)` | `.opacity(pulse)` | n/a |
| duration | RN-wrapper | `600ms` | `600ms` | `0.6s` | n/a |
| opacity (reduce motion) | RN-wrapper | `0.7` (static) | `alpha = 0.7f` | `.opacity(0.7)` | n/a |

### Visual — Chevron Icon

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| name (collapsed) | RN-wrapper | `'chevron-down'` | `Icons.Outlined.KeyboardArrowDown` | `SF Symbol: "chevron.down"` | n/a |
| name (expanded) | RN-wrapper | `'chevron-up'` | `Icons.Outlined.KeyboardArrowUp` | `SF Symbol: "chevron.up"` | n/a |
| size | RN-wrapper | `16` | `16.dp` | `16` | ESCALATE — propose `iconSize.xs = 16` |
| color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |

### Layout — Body Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| paddingTop | RN-wrapper | `semantic.space.sm` | `LaneShadowTheme.spacing.small` | `.padding(.top, 8)` | `space.sm` (8) |
| marginTop | RN-wrapper | `semantic.space.sm` | `LaneShadowTheme.spacing.small` | `.padding(.top, 8)` | `space.sm` (8) |
| borderTopWidth | RN-wrapper | `StyleSheet.hairlineWidth` | `1.dp` | `1` | n/a |
| borderTopColor | RN-wrapper | `${semantic.color.onSurface.muted}33` (20% alpha) | `LaneShadowTheme.colors.onSurfaceMuted.copy(alpha = 0.2f)` | `theme.colors.onSurfaceMuted.opacity(0.2)` | `color.onSurface.muted` |

### Typography — Body

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `semantic.type.body.sm.fontSize` | `LaneShadowTheme.typography.bodySmall.fontSize` | `Font.footnote` | `type.body.sm.fontSize` |
| fontWeight | RN-wrapper | `semantic.type.body.sm.fontWeight` | `LaneShadowTheme.typography.bodySmall.fontWeight` | `Font.footnote.regular` | `type.body.sm.fontWeight` |
| color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |

---

## NOTES

- **Muted design:** Reasoning is secondary content - uses muted colors and subtle treatment
- **Duration labels:** "Thinking…" (streaming), "Thought for 3s" (complete with duration), "Thought briefly" (failed or <1s)
- **Pulsing dot:** Indicates active streaming state, respects reduce motion setting
- **Collapsible body:** Tapping expands to show full reasoning text with divider
- **Accessibility:** Live region announces "Agent is thinking" while streaming, full duration on complete
- **Streaming tint:** 8% primary color overlay when streaming for visual feedback
- **Touch target:** 44pt minimum height for accessibility compliance
- **Ripple effect:** Android ripple on press (14% alpha muted color)
- **State-dependent:** Error state with empty body is not expandable
- **Animation timing:** 600ms duration for smooth pulse (not too fast/slow)
