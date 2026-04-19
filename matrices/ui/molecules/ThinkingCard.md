# ThinkingCard - STYLE PROPERTIES MATRIX

**Component:** ThinkingCard
**RN Source:** `react-native/components/chat/cards/thinking-card.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`, `react-native-reanimated`, `BottomSheetWrapper`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/chat/cards/thinking-card.tsx` | Public API, collapsible thinking steps display |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Lightbulb, chevron, tool icons (see `matrices/ui/atoms/IconSymbol.md`) |
| BottomSheetWrapper | `react-native/components/sheets/bottom-sheet-wrapper.tsx` | Full-screen sheet for timeline |
| Reanimated | `react-native-reanimated` | Pulsing dot animation |

---

## COMPOSITION

**Child atoms:**
- `IconSymbol` - Lightbulb icon, chevron, step type icons (see `matrices/ui/atoms/IconSymbol.md`)
- `Pressable` - Touch target for opening sheet
- `BottomSheetWrapper` - Full-screen timeline sheet
- `View` - Card container, streaming overlay, step rows
- `Text` - Summary label, step summaries, timestamps

**Composition pattern:** Collapsible chip (header row) + full-screen bottom sheet with timeline of steps.

**Layout:** Horizontal header row with icon, summary, pulsing dot (streaming), and chevron. Tapping opens full-screen sheet with step timeline.

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| minWidth | RN-wrapper | `'90%'` | `Modifier.fillMaxWidth(0.9f)` | `.frame(minWidth: 0.9)` | n/a |
| minHeight | RN-wrapper | `44` | `44.dp` (touch target) | `44` (touch target) | n/a |
| overflow | RN-wrapper | `'hidden'` | `Modifier.clipToBounds()` | `.clipped()` | n/a |
| position | RN-wrapper | `'relative'` | n/a | n/a | n/a |

### Visual — Card (same as ReasoningCard)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| borderRadius | RN-wrapper | `semantic.radius.md` | `LaneShadowTheme.shapes.medium` | `.cornerRadius(8)` | `radius.md` (8) |
| paddingHorizontal | RN-wrapper | `semantic.space.md` | `LaneShadowTheme.spacing.medium` | `.padding(.horizontal, 12)` | `space.md` (12) |
| paddingVertical | RN-wrapper | `semantic.space.sm` | `LaneShadowTheme.spacing.small` | `.padding(.vertical, 8)` | `space.sm` (8) |

### Visual — Bottom Sheet Header

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| alignItems | RN-wrapper | `'center'` | `horizontalAlignment = Alignment.CenterHorizontally` | `.frame(maxWidth: .infinity)` | n/a |
| gap | RN-wrapper | `semantic.space.sm` | `LaneShadowTheme.spacing.small` | `8` | `space.sm` (8) |

### Typography — Sheet Title

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `semantic.type.heading.lg.fontSize` | `LaneShadowTheme.typography.headingLarge.fontSize` | `Font.title` | `type.heading.lg.fontSize` |
| fontWeight | RN-wrapper | `semantic.type.heading.lg.fontWeight` | `LaneShadowTheme.typography.headingLarge.fontWeight` | `Font.title.bold` | `type.heading.lg.fontWeight` |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Visual — Duration Badge

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| borderRadius | RN-wrapper | `semantic.radius.sm` | `LaneShadowTheme.shapes.small` | `.cornerRadius(4)` | `radius.sm` (4) |
| paddingHorizontal | RN-wrapper | `semantic.space.sm` | `LaneShadowTheme.spacing.small` | `.padding(.horizontal, 8)` | `space.sm` (8) |
| paddingVertical | RN-wrapper | `semantic.space.xs` | `LaneShadowTheme.spacing.extraSmall` | `.padding(.vertical, 4)` | `space.xs` (4) |
| alignSelf | RN-wrapper | `'center'` | `Modifier.align(Alignment.CenterHorizontally)` | `.frame(maxWidth: .infinity)` | n/a |

### Layout — Timeline

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| paddingTop | RN-wrapper | `12` | `12.dp` | `12` | `space.md` (12) |
| gap | RN-wrapper | `semantic.space.lg` | `LaneShadowTheme.spacing.large` | `16` | `space.lg` (16) |

### Layout — Step Row

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'flex-start'` | `verticalAlignment = Alignment.Top` | `.alignment(.top)` | n/a |
| gap | RN-wrapper | `semantic.space.md` | `LaneShadowTheme.spacing.medium` | `12` | `space.md` (12) |

### Layout — Icon Column

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `24` | `24.dp` | `24` | n/a |
| alignItems | RN-wrapper | `'center'` | `horizontalAlignment = Alignment.CenterHorizontally` | `.frame(maxWidth: .infinity)` | n/a |

### Visual — Timeline Connector

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `1` | `1.dp` | `1` | n/a |
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.layoutPriority(1)` | n/a |
| marginTop | RN-wrapper | `4` | `4.dp` | `4` | `space.xs` (4) |
| minHeight | RN-wrapper | `20` | `20.dp` | `20` | n/a |
| backgroundColor | RN-wrapper | `${semantic.color.onSurface.muted}33` (20% alpha) | `LaneShadowTheme.colors.onSurfaceMuted.copy(alpha = 0.2f)` | `theme.colors.onSurfaceMuted.opacity(0.2)` | `color.onSurface.muted` |

### Layout — Content Column

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.layoutPriority(1)` | n/a |
| gap | RN-wrapper | `semantic.space.xs` | `LaneShadowTheme.spacing.extraSmall` | `4` | `space.xs` (4) |

### Visual — Step Icons

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| size | RN-wrapper | `20` | `20.dp` | `20` | ESCALATE — propose `iconSize.md = 20` |
| color (thinking) | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| color (tool_start) | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| color (tool_finish) | RN-wrapper | `semantic.color.success.default` | `LaneShadowTheme.colors.success` | `theme.colors.success` | `color.success.default` |

---

## NOTES

- **Step timeline:** Full-screen sheet shows step-by-step thinking process with icons and timestamps
- **Step types:** Thinking (lightbulb), tool start (magnify, primary), tool finish (check, success)
- **Relative timestamps:** Steps show time from base timestamp (first step or message createdAt)
- **Truncated summary:** Chip summary truncated to 120 characters with "..." suffix
- **Sheet behavior:** Full-screen preset for immersive timeline view
- **Icon mapping:** Different icons for step types (lightbulb, magnify, check-circle)
- **Timeline connector:** Vertical line connecting step icons (1px width, 20% alpha)
- **Timestamp format:** "<1000ms" or ">=1000ms" → "Xs" format
- **Bold tool names:** Tool start steps show tool name in bold if present
- **Empty state:** "No thinking steps recorded" when steps array is empty
