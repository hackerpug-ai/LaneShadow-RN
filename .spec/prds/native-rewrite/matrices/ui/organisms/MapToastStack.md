# MapToastStack - STYLE PROPERTIES MATRIX

**Component:** MapToastStack
**RN Source:** `react-native/components/map/map-toast-stack.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`, `react-native-reanimated`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/map/map-toast-stack.tsx` | Public API, toast stack |
| TypingIndicator | `react-native/components/chat/typing-indicator.tsx` | Streaming indicator (see `matrices/ui/atoms/TypingIndicator.md`) |
| Pressable (RN) | `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` | Tap to chat |
| Animated (Reanimated) | `react-native-reanimated` | Fade in/out animations |

---

## COMPOSITION ANALYSIS

**Child molecules/atoms:**
- `TypingIndicator` - Streaming indicator (see `matrices/ui/atoms/TypingIndicator.md`)

**Composition pattern:**
- Absolute positioned container at bottom with z-index 25
- Stacks toasts vertically with 8px gap
- Each toast is a pill-shaped surface with 92% opacity
- Fade in (200ms) and fade out (300ms) animations
- Auto-dismiss after 5000ms (deferred while streaming)
- Max 2 lines per toast
- Toasts show inline typing indicator when streaming
- Tap any toast to enter full chat mode

**Layout:** Absolute positioned, horizontally centered, vertically at `bottomOffset` from screen bottom

---

## STATE & BEHAVIOR

| State | Type | Source | Native Translation |
|---|---|---|---|
| timerRef | Ref<setTimeout> | useRef (in MapToast) | `LaunchedEffect(toast) { delay(autoFadeMs); onDismiss(toast.id) }` / `.onReceive(timerPublisher) { ... }` |

**Side effects:**
- Auto-fade timer: `useEffect([isStreaming, autoFadeMs, onDismiss, toast.id])` → `LaunchedEffect(Unit) { if (!isStreaming) delay(autoFadeMs); onDismiss(...) }` / `.task { try? await Task.sleep(...); onDismiss() }`

**Callback signatures:**
- `onDismiss: (id: string) => void` → `(id: String) -> Unit` / `(String) -> Void`
- `onTapToChat: () => void` → `() -> Unit` / `() -> Void`

**Animations:**
- Fade in: 200ms duration
- Fade out: 300ms duration

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| position | RN-wrapper | `'absolute'` | `Modifier.wrapContentSize(unbounded = true)` | `.frame(maxWidth: .infinity, maxHeight: .infinity).overlay(...)` | n/a |
| left | RN-wrapper | `0` | `Modifier.absoluteOffset(x = 0.dp)` | alignment `.leading` | n/a |
| right | RN-wrapper | `0` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| bottom | RN-wrapper | `bottomOffset` (prop) | `Modifier.padding(bottom = bottomOffset.dp)` | `.padding(.bottom, bottomOffset)` | n/a (dynamic) |
| zIndex | RN-wrapper | `25` | `Modifier.zIndex(25)` (Compose 1.6+) or elevation | `.zIndex(25)` | `elevation.toast` (verify) |
| alignItems | RN-wrapper | `'center'` | `Modifier.align(Alignment.CenterHorizontally)` | `.frame(maxWidth: .infinity).overlay(..., alignment: .center)` | n/a |
| paddingHorizontal | RN-wrapper | `semantic.space.lg` (= 16) | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| gap | RN-wrapper | `semantic.space.sm` (= 8) | `VerticalArrangement.spacedBy(8.dp)` / `Modifier.padding(bottom = 8.dp)` between items | `spacing(8)` | `space.sm` |
| pointerEvents | RN-wrapper | `'box-none'` | `Modifier.pointerInput(Unit, ...) { detectTapGestures { ... } }` on children | `.contentShape(Rectangle()).onTapGesture { ... }` | n/a |

### Visual — Toast Pill

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| borderColor | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |
| borderWidth | RN-wrapper | `StyleSheet.hairlineWidth` (= 1) | `Modifier.border(BorderStroke(1.dp, ...))` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | `borderWidth.hairline` |
| opacity | RN-wrapper | `0.92` | `Modifier.alpha(0.92f)` | `.opacity(0.92)` | `opacity.toast = 0.92` |
| borderRadius | RN-wrapper | `semantic.radius.xl` (= 16) | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.xl` |
| paddingVertical | RN-wrapper | `semantic.space.sm` (= 8) | `Modifier.padding(vertical = 8.dp)` | `.padding(.vertical, 8)` | `space.sm` |
| paddingHorizontal | RN-wrapper | `semantic.space.lg` (= 16) | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| maxWidth | RN-wrapper | `85%` | `Modifier.requiredWidthIn(max = maxWidth * 0.85f)` | `.frame(maxWidth: screenWidth * 0.85)` | semantic.layout.toastMaxWidth |
| minWidth | RN-wrapper | `200` | `Modifier.requiredWidthIn(min = 200.dp)` | `.frame(minWidth: 200)` | semantic.layout.toastMinWidth |
| alignSelf | RN-wrapper | `'center'` | `Modifier.align(Alignment.CenterHorizontally)` | `.frame(maxWidth: .infinity).overlay(..., alignment: .center)` | n/a |
| elevation | RN-wrapper | `semantic.elevation[2]` | `Modifier.shadow(elevation = 2.dp, ...)` | `.shadow(...)` | `elevation[2]` |

### Layout — Toast Content

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'flex-end'` | `verticalAlignment = Alignment.Bottom` | `.alignment(.bottom)` | n/a |
| flexWrap | RN-wrapper | `'wrap'` | `Modifier.wrapContentWidth(...)` | n/a (SwiftUI auto-wraps) | n/a |
| flexShrink | RN-wrapper | `1` | `Modifier.weight(1f)` | `.layoutPriority(1)` | n/a |

### Typography — Toast Text

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `semantic.type.body.sm.fontSize` | `LaneShadowTheme.typography.bodySmall.fontSize` | `theme.typography.bodySmall.fontSize` | `type.body.sm.fontSize` |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| numberOfLines | RN-wrapper | `2` | `maxLines = 2` | `.lineLimit(2)` | n/a |
| flexShrink | RN-wrapper | `1` | `Modifier.weight(1f)` | `.layoutPriority(1)` | n/a |

### Layout — Typing Indicator Slot

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| marginLeft | RN-wrapper | `semantic.space.xs` (= 4) | `Modifier.padding(start = 4.dp)` | `.padding(.leading, 4)` | `space.xs` |
| paddingBottom | RN-wrapper | `2` | `Modifier.padding(bottom = 2.dp)` | `.padding(.bottom, 2)` | semantic.space.typingOffset |

---

## NOTES

- **Positioning:** Absolute positioned at bottom, z-index 25 (above ChatInput's z-index 20)
- **Animations:** Reanimated FadeIn/FadeOut with 200ms/300ms durations
- **Auto-dismiss:** 5000ms timer, deferred while streaming (`isStreaming = true`)
- **Max width:** 85% of screen width, min 200px
- **Opacity:** 92% for semi-translucent effect
- **Border:** Hairline width (1px) using border color
- **Elevation:** elevation[2] for shadow
- **Streaming:** Shows inline typing indicator when toast status is 'streaming' or 'running'
- **Text truncation:** Max 2 lines, wraps with flexShrink: 1
- **Tap interaction:** Tap any toast triggers `onTapToChat` callback
- **Gap:** 8px between stacked toasts
- **Horizontal padding:** 16px on container
