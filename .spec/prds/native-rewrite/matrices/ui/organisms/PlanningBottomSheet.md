# PlanningBottomSheet - STYLE PROPERTIES MATRIX

**Component:** PlanningBottomSheet
**RN Source:** `react-native/components/sheets/planning-bottom-sheet.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/FlatList/FlatList.js`, `react-native-reanimated`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/sheets/planning-bottom-sheet.tsx` | Public API, planning steps display |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Check icon (see `matrices/ui/atoms/IconSymbol.md`) |
| FlatList (RN) | `node_modules/react-native/Libraries/Components/FlatList/FlatList.js` | Event list |
| Animated (Reanimated) | `react-native-reanimated` | Pulsing dot animation |

---

## COMPOSITION ANALYSIS

**Child molecules/atoms:**
- `IconSymbol` - Check-circle icon
- `StreamingThinking` (inline) - Thinking text with pulsing dot (conditional)

**Composition pattern:**
- Content preset bottom sheet
- Conditional StreamingThinking section (when `isStreaming && thinkingText`)
- Title "Planning Steps"
- FlatList of completed events (tool_complete, agent_complete only)
- Each row shows icon + summary + duration
- Dividers between rows
- Divider before total
- Total row shows spacer + "Total" + total duration
- StreamingThinking has pulsing dot animation (respects reduce motion)

**Layout:** Column layout with FlatList for scrollable event rows

---

## STATE & BEHAVIOR

| State | Type | Source | Native Translation |
|---|---|---|---|
| completedEvents | PlanningEvent[] (computed) | Derived from events filter | `events.filter { it.type in ['tool_complete', 'agent_complete'] }` / `events.filter { ... }` |
| reduceMotion | boolean | useState (in StreamingThinking) | `LocalAccessibilitySettings.isMotionReductionEnabled` / `UIAccessibility.isReduceMotionEnabled` |
| opacity | Animated.Value | useSharedValue (in StreamingThinking) | `animateFloatAsState(...)` / `.opacity(...)` |

**Side effects:**
- Reduce motion listener: `useEffect` with `AccessibilityInfo.addEventListener` → `LocalAccessibilitySettings...` / `.onReceive(NotificationCenter.publisher(...))`
- Pulsing animation: `useEffect([reduceMotion, opacity])` with `withRepeat` → `infiniteRepeatable(...)` / `.animation(.easeInOut(duration: 0.6).repeatForever(...))`

**Callback signatures:**
- `onClose: () => void` → `() -> Unit` / `() -> Void`

**Formatting helper:**
- `formatEventDuration(ms): string` → Formats as "X.Xs" under 10s, "Xs" for 10s+

---

## STYLE PROPERTIES MATRIX

### Layout — Container (implicit via BottomSheetWrapper)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| preset | RN-wrapper | `'content'` | Bottom sheet snap points based on content | `presentationDetents([.fraction(0.0), ...])` auto | n/a |

### Layout — StreamingThinking Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| padding | RN-wrapper | `12` | `Modifier.padding(12.dp)` | `.padding(12)` | `space.md` |
| marginBottom | RN-wrapper | `12` | `Modifier.padding(bottom = 12.dp)` | `.padding(.bottom, 12)` | `space.md` |
| minHeight | RN-wrapper | `80` | `Modifier.heightIn(min = 80.dp)` | `.frame(minHeight: 80)` | semantic.layout.thinkingMinHeight |
| maxHeight | RN-wrapper | `200` | `Modifier.heightIn(max = 200.dp)` | `.frame(maxHeight: 200)` | semantic.layout.thinkingMaxHeight |
| backgroundColor | RN-wrapper | `semantic.color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| borderRadius | RN-wrapper | `semantic.radius.md` (= 8) | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |
| borderWidth | RN-wrapper | `1` | `Modifier.border(BorderStroke(1.dp, ...))` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | `borderWidth.thin` |
| borderColor | RN-wrapper | `primary.default with 30% alpha` | `LaneShadowTheme.colors.primary.copy(alpha = 0.3f)` | `theme.colors.primary.opacity(0.3)` | `color.primary.default + opacity 0.3` |

### Layout — Thinking Header

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `semantic.space.sm` (= 8) | `Arrangement.spacedBy(8.dp)` / `Modifier.padding(end = 8.dp)` between items | `spacing(8)` | `space.sm` |
| marginBottom | RN-wrapper | `8` | `Modifier.padding(bottom = 8.dp)` | `.padding(.bottom, 8)` | `space.sm` |

### Visual — Pulsing Dot

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `8` | `Modifier.size(8.dp)` | `.frame(width: 8, height: 8)` | semantic.size.indicator|
| height | RN-wrapper | `8` | Included above | Included above | semantic.size.indicator|
| borderRadius | RN-wrapper | `4` | `RoundedCornerShape(4.dp)` | `RoundedRectangle(cornerRadius: 4)` | `radius.sm` |
| backgroundColor | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| opacity (animated) | RN-wrapper | `0.4 ↔ 1.0` (pulsing) | `infiniteRepeatable(animation = tween(600ms), repeatMode = RepeatMode.Reverse)` | `.animation(.easeInOut(duration: 0.6).repeatForever(autoreverses: true)).opacity(...)` | n/a |

### Typography — Thinking Label

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `labelMedium` | `LaneShadowTheme.typography.labelMedium` | `theme.typography.labelMedium` | n/a |
| color | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

### Layout — Thinking Scroll

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| maxHeight | RN-wrapper | `150` | `Modifier.heightIn(max = 150.dp)` | `.frame(maxHeight: 150)` | semantic.layout.thinkingScrollMaxHeight |

### Typography — Thinking Text

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `bodyMedium` | `LaneShadowTheme.typography.bodyMedium` | `theme.typography.bodyMedium` | n/a |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| lineHeight | RN-wrapper | `20` | `LaneShadowTheme.typography.bodyMedium.lineHeight` | `theme.typography.bodyMedium.lineSpacing` + baseline | ESCALATE — verify `type.body.md.lineHeight = 20` |

### Typography — Sheet Title

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `titleMedium` | `LaneShadowTheme.typography.titleMedium` | `theme.typography.titleMedium` | n/a |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Layout — Event Row

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'flex-start'` | `verticalAlignment = Alignment.Top` | `.alignment(.top)` | n/a |
| gap | RN-wrapper | `10` | `Arrangement.spacedBy(10.dp)` / `Modifier.padding(end = 10.dp)` between items | `spacing(10)` | semantic.space.rowGap |
| minHeight | RN-wrapper | `44` | `Modifier.heightIn(min = 44.dp)` | `.frame(minHeight: 44)` | ESCALATE — verify `touchTarget.minTouch = 44` |
| paddingVertical | RN-wrapper | `4` | `Modifier.padding(vertical = 4.dp)` | `.padding(.vertical, 4)` | semantic.space.micro|

### Icon — Event Row Check Icon

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| size | RN-wrapper | `16` | `Modifier.size(16.dp)` | `.frame(width: 16, height: 16)` | semantic.icon.xs|
| color | RN-wrapper | `semantic.color.success.default` | `LaneShadowTheme.colors.success` | `theme.colors.success` | `color.success.default` |
| name | RN-wrapper | `'check-circle-outline'` | `Icons.Rounded.CheckCircle` | `checkmark.circle` | n/a |

### Typography — Event Summary

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `bodyMedium` | `LaneShadowTheme.typography.bodyMedium` | `theme.typography.bodyMedium` | n/a |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.layoutPriority(1)` | n/a |
| lineHeight | RN-wrapper | `20` | `LaneShadowTheme.typography.bodyMedium.lineHeight` | `theme.typography.bodyMedium.lineSpacing` + baseline | ESCALATE — verify `type.body.md.lineHeight = 20` |
| numberOfLines | RN-wrapper | `2` | `maxLines = 2` | `.lineLimit(2)` | n/a |

### Typography — Event Duration

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `labelMedium` | `LaneShadowTheme.typography.labelMedium` | `theme.typography.labelMedium` | n/a |
| color | RN-wrapper | `semantic.color.onSurface.subtle` (or muted or default fallback) | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| minWidth | RN-wrapper | `44` | `Modifier.requiredWidthIn(min = 44.dp)` | `.frame(minWidth: 44)` | n/a |
| textAlign | RN-wrapper | `'right'` | `TextAlign.End` | `.multilineTextAlignment(.trailing)` | n/a |

### Visual — Item Separator

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| height | RN-wrapper | `StyleSheet.hairlineWidth` (= 1) | `Modifier.height(1.dp)` | `.frame(height: 1)` | `borderWidth.hairline` |
| backgroundColor | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |
| marginVertical | RN-wrapper | `2` | `Modifier.padding(vertical = 2.dp)` | `.padding(.vertical, 2)` | semantic.space.separatorGap |

### Visual — Divider (before total)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| height | RN-wrapper | `1` | `Modifier.height(1.dp)` | `.frame(height: 1)` | `borderWidth.thin` |
| backgroundColor | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |
| marginVertical | RN-wrapper | `4` | `Modifier.padding(vertical = 4.dp)` | `.padding(.vertical, 4)` | semantic.space.micro|

### Layout — Total Row

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'flex-start'` | `verticalAlignment = Alignment.Top` | `.alignment(.top)` | n/a |
| gap | RN-wrapper | `10` | `Arrangement.spacedBy(10.dp)` / `Modifier.padding(end = 10.dp)` between items | `spacing(10)` | semantic.space.rowGap |

### Layout — Total Spacer

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `26` (aligns with icon 16 + gap 10) | `Modifier.width(26.dp)` | `.frame(width: 26)` | n/a (icon + gap) |

### Typography — Total Label

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `labelLarge` | `LaneShadowTheme.typography.labelLarge` | `theme.typography.labelLarge` | n/a |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| fontWeight | RN-wrapper | `'700'` (bold) | `FontWeight.Bold` | `.weight(.bold)` | ESCALATE — verify `type.label.lg.fontWeight = 700` |
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.layoutPriority(1)` | n/a |

### Typography — Total Duration

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `labelLarge` | `LaneShadowTheme.typography.labelLarge` | `theme.typography.labelLarge` | n/a |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| fontWeight | RN-wrapper | `'700'` (bold) | `FontWeight.Bold` | `.weight(.bold)` | ESCALATE — verify `type.label.lg.fontWeight = 700` |

---

## NOTES

- **Bottom sheet:** Content preset (sized to content)
- **StreamingThinking:** Only renders when `isStreaming && thinkingText`
- **Pulsing dot:** 0.4 ↔ 1.0 opacity animation, 600ms duration, respects reduce motion
- **Reduce motion:** When enabled, dot is static at 0.7 opacity
- **Event filtering:** Only shows tool_complete and agent_complete events
- **Check icons:** 16px success color, check-circle-outline
- **Event layout:** Icon + flex:1 summary + right-aligned duration
- **Total row:** Spacer (26px) aligns with icon column, bold labels
- **Duration format:** "< 10s: X.Xs", "≥ 10s: Xs" (rounded)
- **Dividers:** Hairline (1px) border color, 2px vertical margin
- **Min height:** 44px for event rows (touch target)
- **Scroll:** FlatList with scrollEnabled=false (render all at once)
