# MapToastStack - STYLE PROPERTIES MATRIX

**Component:** MapToastStack
**RN Source:** `react-native/components/map/map-toast-stack.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`, `react-native-reanimated`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/map/map-toast-stack.tsx` | Public API, toast stack rendering |
| Pressable (RN) | `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` | Tap-to-dismiss interaction |
| Text (RN) | `node_modules/react-native/Libraries/Text/Text.js` | Toast message text |
| Reanimated | `react-native-reanimated` | Fade-in/fade-out animations |
| TypingIndicator | `react-native/components/chat/typing-indicator.tsx` | Streaming state indicator (see `matrices/ui/atoms/TypingIndicator.md`) |

---

## COMPOSITION ANALYSIS

**Child molecules/atoms:**
- `TypingIndicator` - Animated typing dots for streaming toasts

**Composition pattern:**
- Absolute positioned container at bottom of screen (above ChatInput)
- Vertical stack of toast messages with 8dp gap between toasts
- Each toast is a translucent pill-shaped surface with hairline border
- Toasts auto-dismiss after 5 seconds (deferred while streaming)
- New toasts push existing ones upward
- Tap any toast to enter full chat mode
- Streaming toasts show inline typing indicator
- Max 2 lines per toast with ellipsis truncation
- 85% max width with 200dp minimum
- Fade-in (200ms) and fade-out (300ms) animations

**Layout:** Absolute positioned container with centered content, 16dp horizontal padding

---

## STATE & BEHAVIOR

| State | Type | Source | Native Translation |
|---|---|---|---|
| (none - stateless container) | - | - | - |

**Side effects:**
- Per-toast auto-fade timer: `useEffect` with `setTimeout` → `LaunchedEffect(toast.id) { delay(autoFadeMs); onDismiss(toast.id) }` / `.onReceive(timerPublisher) { ... }`
- Timer cleared while streaming: Conditional effect → Conditional `LaunchedEffect` / Conditional timer subscription

**Callback signatures:**
- `onDismiss: (id: string) => void` → `(id: String) -> Unit` / `(String) -> Void`
- `onTapToChat: () => void` → `() -> Unit` / `() -> Void`

---

## STYLE PROPERTIES MATRIX

### Layout — Toast Stack Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| position | StyleSheet | `'absolute'` | `Modifier.wrapContentSize(unbounded = true)` | `.frame(maxWidth: .infinity, maxHeight: .infinity).overlay(...)` | n/a |
| left | StyleSheet | `0` | `Modifier.align(Alignment.Start)` / absolute positioning | `.frame(maxWidth: .infinity).overlay(..., alignment: .leading)` | n/a |
| right | StyleSheet | `0` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| bottom | prop | `bottomOffset` | `Modifier.offset(y = -bottomOffset.dp)` / `Modifier.align(Alignment.Bottom)` | `.offset(y: -bottomOffset)` | n/a (dynamic prop) |
| zIndex | StyleSheet | `25` | `Modifier.zIndex(25)` (Compose 1.6+) or elevation | `.zIndex(25)` | n/a |
| alignItems | StyleSheet | `'center'` | `Modifier.wrapContentSize(Alignment.CenterHorizontally)` + vertical | `.frame(alignment: .center)` | n/a |
| gap | semantic | `semantic.space.sm` (= 8) | `Arrangement.spacedBy(8.dp)` / vertical spacing | `spacing(8)` | `space.sm` |
| paddingHorizontal | semantic | `semantic.space.lg` (= 16) | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| pointerEvents | StyleSheet | `'box-none'` | `Modifier.pointerInput(Unit, ...)` with passthrough | `.allowsHitTesting(false)` with child hit testing | n/a |

### Visual — Individual Toast

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | semantic | `semantic.color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| borderColor | semantic | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |
| borderRadius | semantic | `semantic.radius.xl` (= 16) | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.xl` |
| borderWidth | StyleSheet | `StyleSheet.hairlineWidth` (= 0.5) | `Modifier.border(BorderStroke(0.5.dp, ...))` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 0.5))` | `borderWidth.hairline` |
| paddingVertical | semantic | `semantic.space.sm` (= 8) | `Modifier.padding(vertical = 8.dp)` | `.padding(.vertical, 8)` | `space.sm` |
| paddingHorizontal | semantic | `semantic.space.lg` (= 16) | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| maxWidth | constant | `85%` | `Modifier.requiredWidthIn(max = maxWidth * 0.85f)` | `.frame(maxWidth: geometry.size.width * 0.85)` | n/a (percentage) |
| minWidth | constant | `200` | `Modifier.requiredWidthIn(min = 200.dp)` | `.frame(minWidth: 200)` | ESCALATE — propose `layout.toastMinWidth = 200` |
| opacity | constant | `0.92` | `Modifier.alpha(0.92f)` | `.opacity(0.92)` | `opacity.surface = 0.92` |
| alignSelf | StyleSheet | `'center'` | `Modifier.align(Alignment.CenterHorizontally)` | `.frame(maxWidth: .infinity, alignment: .center)` | n/a |
| elevation | semantic | `semantic.elevation[2]` | `Modifier.shadow(elevation = 2.dp, ...)` | `.shadow(...)` | `elevation.light.2` |

### Typography — Toast Text

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | semantic | `semantic.type.body.sm.fontSize` (= 14) | `LaneShadowTheme.typography.bodySmall.fontSize` | `theme.typography.bodySmall.fontSize` | `type.body.sm.fontSize` |
| color | semantic | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| numberOfLines | constant | `2` | `Text(...maxLines = 2)` / `overflow = TextOverflow.Ellipsis` | `.lineLimit(2)` | n/a |
| flexShrink | constant | `1` | `Modifier.weight(1f)` | `.layoutPriority(1)` | n/a |

### Layout — Toast Content Row

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | StyleSheet | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | StyleSheet | `'flex-end'` | `verticalAlignment = Alignment.Bottom` | `.alignment(.bottom)` | n/a |
| flexWrap | StyleSheet | `'wrap'` | Not directly supported (use FlowRow) | Not supported | n/a |

### Layout — Typing Indicator Slot

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| marginLeft | semantic | `semantic.space.xs` (= 4) | `Modifier.padding(start = 4.dp)` | `.padding(.leading, 4)` | `space.xs` |
| paddingBottom | constant | `2` | `Modifier.padding(bottom = 2.dp)` | `.padding(.bottom, 2)` | ESCALATE — propose `space.typingIndicatorBottom = 2` |

### Animation — Toast Transitions

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| entering | Reanimated | `FadeIn.duration(200)` | `AnimatedVisibility(...enter = fadeIn(tween(200)))` | `.transition(.opacity).animation(.easeInOut(duration: 0.2))` | `motion.duration.fast` |
| exiting | Reanimated | `FadeOut.duration(300)` | `AnimatedVisibility(...exit = fadeOut(tween(300)))` | `.transition(.opacity).animation(.easeInOut(duration: 0.3))` | `motion.duration.normal` |

---

## NOTES

- **Auto-dismiss:** 5-second timer per toast (configurable via `autoFadeMs` prop)
- **Streaming defer:** Auto-fade timer deferred while toast status is 'streaming' or 'running'
- **Tap-to-chat:** Tapping any toast dismisses it and invokes `onTapToChat` callback
- **Z-index:** 25 to float above ChatInput (z-index 20)
- **Bottom offset:** Dynamic prop to clear ChatInput height
- **Max width:** 85% of screen width with 200dp minimum
- **Max lines:** 2 lines with ellipsis for long messages
- **Hairline border:** 0.5dp border for subtle edge definition
- **Semi-translucent:** 92% opacity for glass effect
- **Elevation:** Level 2 shadow for depth
- **Gap:** 8dp vertical gap between stacked toasts
- **Streaming indicator:** Inline TypingIndicator component when status is streaming
- **Fade animations:** 200ms fade-in, 300ms fade-out
- **Centering:** Toasts centered horizontally with alignSelf: 'center'
