# ChatInput - STYLE PROPERTIES MATRIX

**Component:** ChatInput
**RN Source:** `react-native/components/chat/chat-input.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/KeyboardAvoidingView/KeyboardAvoidingView.js`, `node_modules/react-native/Libraries/Components/TextInput/TextInput.js`, `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/chat/chat-input.tsx` | Public API, input bar, suggestion chips |
| ErrorMessage | `react-native/components/chat/error-message.tsx` | Error display (see `matrices/ui/molecules/ErrorMessage.md`) |
| Icon | `react-native-paper` | Send/cancel/toggle icons |
| TextInput (RN) | `node_modules/react-native/Libraries/Components/TextInput/TextInput.js` | Text input |
| KeyboardAvoidingView (RN) | `node_modules/react-native/Libraries/Components/KeyboardAvoidingView/KeyboardAvoidingView.js` | Keyboard avoidance |

---

## COMPOSITION ANALYSIS

**Child molecules/atoms:**
- `ErrorMessage` - Error message display (see `matrices/ui/molecules/ErrorMessage.md`)
- `SuggestionChips` (inline) - Horizontal scrollable chip list

**Composition pattern:**
- Absolute positioned container at bottom of screen
- KeyboardAvoidingView for keyboard behavior
- Error message (when in ERROR state)
- Suggestion chips (when idle AND no messages sent)
- Input row with container + toggle button
- Input container has manual mode icon + text input + send/cancel button
- Send button becomes cancel button (×) when `isPlanning={true}`
- Toggle button switches between map and chat views
- Press feedback on all interactive elements

**Layout:** Full-width container with 8px gap between elements, absolute bottom positioning with safe area inset

---

## STATE & BEHAVIOR

| State | Type | Source | Native Translation |
|---|---|---|---|
| text | string | useState | `remember { mutableStateOf("") }` / `@State var text: String = ""` |
| keyboardVisible | boolean | useState | `LocalWindowInsets.current.isImeVisible` (Compose) / Keyboard visibility via SwiftUI |
| isIdle | boolean (derived) | `state.phase === 'IDLE'` | Derived from `state.phase` / Computed property |
| isError | boolean (derived) | `state.phase === 'ERROR'` | Derived from `state.phase` / Computed property |

**Side effects:**
- Keyboard listeners: `useEffect` with `Keyboard.addListener` → `LaunchedEffect(Unit) { ... }` with listeners / `.onReceive(NotificationCenter.publisher(...))`
- Auto-dismiss error after 6 seconds: `useEffect([state.phase, dispatch, state])` → `LaunchedEffect(state.phase) { delay(6000); dispatch(...) }` / `.onReceive(timerPublisher) { ... }`

**Callback signatures:**
- `onSend: (message: string) => void` → `(message: String) -> Unit` / `(String) -> Void`
- `onCancel: () => void` → `() -> Unit` / `() -> Void`
- `onToggleChatMode?: () => void` → `() -> Unit` / `() -> Void`
- `onManualModePress?: () => void` → `() -> Unit` / `() -> Void`
- `dispatch?: (action: {type: string}) => void` → `(action: Action) -> Unit` / `(Action) -> Void`

---

## STYLE PROPERTIES MATRIX

### Layout — Container (KeyboardAvoidingView)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| position | RN-wrapper | `'absolute'` | `Modifier.wrapContentSize(unbounded = true)` | `.frame(maxWidth: .infinity, maxHeight: .infinity).overlay(...)` | n/a |
| left | RN-wrapper | `0` | `Modifier.absoluteOffset(x = 0.dp)` / `Modifier.align(Alignment.Start)` | alignment `.leading` | n/a |
| right | RN-wrapper | `0` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| bottom | RN-wrapper | `0` | `Modifier.align(Alignment.Bottom)` / `WindowInsets.toPaddingValues()` | alignment `.bottom` | n/a |
| width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| zIndex | RN-wrapper | `20` | `Modifier.zIndex(20)` (Compose 1.6+) or elevation | `.zIndex(20)` | `elevation.floating` (verify) |
| alignItems | RN-wrapper | `'center'` | `Modifier.align(Alignment.CenterHorizontally)` | `.frame(maxWidth: .infinity).overlay(..., alignment: .center)` | n/a |
| gap | RN-wrapper | `8` | `Arrangement.spacedBy(8.dp)` / `Modifier.padding(end = 8.dp)` between items | `spacing(8)` | `space.sm` |
| behavior (iOS) | RN-wrapper | `'padding'` | `WindowInsetsSides.Bottom` / `imePadding()` | `.keyboardShortcut(...)` handled natively | n/a |
| behavior (Android) | RN-wrapper | `'height'` | `imePadding()` modifier | n/a | n/a |
| pointerEvents | RN-wrapper | `'box-none'` | `Modifier.pointerInput(Unit, ...) { detectTapGestures { ... } }` | `.contentShape(Rectangle()).onTapGesture { ... }` | n/a |

### Layout — Input Row

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `8` | `Arrangement.spacedBy(8.dp)` / `Modifier.padding(end = 8.dp)` between items | `spacing(8)` | `space.sm` |
| width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| paddingHorizontal | RN-wrapper | `semantic.space.md` (= 16) | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |

### Visual — Input Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'flex-end'` | `verticalAlignment = Alignment.Bottom` | `.alignment(.bottom)` | n/a |
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.layoutPriority(1)` | n/a |
| maxWidth | RN-wrapper | `780` | `Modifier.requiredWidthIn(max = 780.dp)` | `.frame(maxWidth: 780)` | ESCALATE — propose `layout.inputMaxWidth = 780` |
| backgroundColor | RN-wrapper | `semantic.color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| borderRadius | RN-wrapper | `semantic.radius.xl` (= 16) | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.xl` |
| borderWidth | RN-wrapper | `1` | `Modifier.border(BorderStroke(1.dp, ...))` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | `borderWidth.thin` |
| borderColor | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |
| paddingHorizontal | RN-wrapper | `16` | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| paddingVertical | RN-wrapper | `10` | `Modifier.padding(vertical = 10.dp)` | `.padding(.vertical, 10)` | ESCALATE — propose `space.inputVertical = 10` |
| gap | RN-wrapper | `12` | `Arrangement.spacedBy(12.dp)` / `Modifier.padding(end = 12.dp)` between items | `spacing(12)` | `space.md` |
| minHeight | RN-wrapper | `56` | `Modifier.heightIn(min = 56.dp)` | `.frame(minHeight: 56)` | ESCALATE — propose `layout.inputMinHeight = 56` |

### Layout — Manual Mode Button

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| alignSelf | RN-wrapper | `'flex-end'` | `Modifier.align(Alignment.End)` | `.frame(maxWidth: .infinity, alignment: .trailing)` | n/a |
| marginBottom | RN-wrapper | `4` | `Modifier.padding(bottom = 4.dp)` | `.padding(.bottom, 4)` | ESCALATE — propose `space.micro = 4` |
| width | RN-wrapper | `32` | `Modifier.width(32.dp)` | `.frame(width: 32)` | ESCALATE — propose `size.iconSm = 32` |
| height | RN-wrapper | `32` | `Modifier.height(32.dp)` | `.frame(height: 32)` | ESCALATE — propose `size.iconSm = 32` |
| borderRadius | RN-wrapper | `16` | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.full` |
| alignItems | RN-wrapper | `'center'` | `Modifier.wrapContentWidth(Alignment.CenterHorizontally)` + vertical | `.frame(alignment: .center)` | n/a |
| justifyContent | RN-wrapper | `'center'` | `Modifier.wrapContentHeight(Alignment.CenterVertically)` | `.frame(alignment: .center)` | n/a |

### Icon — Manual Mode Button

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| size | RN-wrapper | `18` | `Modifier.size(18.dp)` | `.frame(width: 18, height: 18)` | ESCALATE — propose `icon.xs = 18` |
| color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |

### Layout — Text Input Wrapper

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.layoutPriority(1)` | n/a |
| minHeight | RN-wrapper | `24` | `Modifier.heightIn(min = 24.dp)` | `.frame(minHeight: 24)` | ESCALATE — propose `layout.textMinHeight = 24` |
| justifyContent | RN-wrapper | `'center'` | `Modifier.wrapContentHeight(Alignment.CenterVertically)` | `.frame(alignment: .center)` | n/a |
| paddingBottom | RN-wrapper | `8` | `Modifier.padding(bottom = 8.dp)` | `.padding(.bottom, 8)` | `space.sm` |

### Typography — Text Input

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `semantic.type.body.md.fontSize` | `LaneShadowTheme.typography.bodyMedium.fontSize` | `theme.typography.bodyMedium.fontSize` | `type.body.md.fontSize` |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| placeholderTextColor | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| multiline | RN-wrapper | `true` | `TextField(...maxLines = 5)` / `OutlinedTextField(...maxLines = 5)` | `TextEditor(...multilineTextAlignment: ...)` | n/a |
| textAlignVertical | RN-wrapper | `'center'` | `TextField(...textAlign = TextAlign.Center)` / `TextStyle(textAlign = Center)` | `.multilineTextAlignment(.center)` | n/a |
| opacity (disabled) | RN-wrapper | `0.5` | `Modifier.alpha(if (isPlanning) 0.5f else 1f)` | `.opacity(isPlanning ? 0.5 : 1)` | `opacity.disabled = 0.5` |
| maxHeight | RN-wrapper | `140` | `TextField(...maxHeight = 140.dp)` | `TextEditor(...frame(maxHeight: 140))` | ESCALATE — propose `layout.inputMaxHeight = 140` |

### Layout — Send/Cancel Button

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `40` | `Modifier.size(40.dp)` | `.frame(width: 40, height: 40)` | ESCALATE — propose `size.iconButton = 40` |
| height | RN-wrapper | `40` | Included above | Included above | ESCALATE — propose `size.iconButton = 40` |
| borderRadius | RN-wrapper | `20` | `RoundedCornerShape(20.dp)` / `CircleShape` | `Circle()` / `RoundedRectangle(cornerRadius: 20)` | `radius.full` |
| alignItems | RN-wrapper | `'center'` | `Modifier.wrapContentSize(Alignment.CenterHorizontally)` + vertical | `.frame(alignment: .center)` | n/a |
| justifyContent | RN-wrapper | `'center'` | Included above | Included above | n/a |
| marginLeft | RN-wrapper | `'auto'` | `Modifier.wrapContentWidth(Alignment.End)` / Spacer | `.frame(maxWidth: .infinity, alignment: .trailing)` | n/a |
| hitSlop | RN-wrapper | `semantic.space.xs` (= 4) all sides | `Modifier.padding(4.dp).clickable(...)` with negative padding | `.padding(-4).contentShape(Rectangle()).onTapGesture { ... }` | `space.xs` |

### Visual — Send Button (by state)

| State | Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| default | backgroundColor | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| planning | backgroundColor | RN-wrapper | `semantic.color.danger.default` | `LaneShadowTheme.colors.danger` | `theme.colors.danger` | `color.danger.default` |

### Icon — Send/Cancel Button

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| size | RN-wrapper | `20` | `Modifier.size(20.dp)` | `.frame(width: 20, height: 20)` | ESCALATE — propose `icon.sm = 20` |
| color | RN-wrapper | `semantic.color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |

### Layout — Toggle Button

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `40` | `Modifier.size(40.dp)` | `.frame(width: 40, height: 40)` | ESCALATE — propose `size.iconButton = 40` |
| height | RN-wrapper | `40` | Included above | Included above | ESCALATE — propose `size.iconButton = 40` |
| borderRadius | RN-wrapper | `20` | `RoundedCornerShape(20.dp)` / `CircleShape` | `Circle()` | `radius.full` |
| alignItems | RN-wrapper | `'center'` | `Modifier.wrapContentSize(Alignment.CenterHorizontally)` + vertical | `.frame(alignment: .center)` | n/a |
| justifyContent | RN-wrapper | `'center'` | Included above | Included above | n/a |
| backgroundColor | RN-wrapper | `semantic.color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| borderWidth | RN-wrapper | `1.5` | `Modifier.border(BorderStroke(1.5.dp, ...))` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1.5))` | ESCALATE — propose `borderWidth.medium = 1.5` |
| borderColor | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |
| elevation | RN-wrapper | `semantic.elevation[3]` | `Modifier.shadow(elevation = 3.dp, ...)` | `.shadow(...)` | `elevation[3]` |
| hitSlop | RN-wrapper | `semantic.space.xs` (= 4) all sides | `Modifier.padding(4.dp).clickable(...)` with negative padding | `.padding(-4).contentShape(Rectangle()).onTapGesture { ... }` | `space.xs` |

### Icon — Toggle Button

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| size | RN-wrapper | `20` | `Modifier.size(20.dp)` | `.frame(width: 20, height: 20)` | ESCALATE — propose `icon.sm = 20` |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Layout — Suggestion Chips

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| horizontal | RN-wrapper | `true` | `LazyRow(...)` / `Row(horizontalScrollEnabled = true)` | `ScrollView(.horizontal)` | n/a |
| showsHorizontalScrollIndicator | RN-wrapper | `false` | `LazyRow(...flingBehavior = ...).scrollbar(false)` | `.scrollIndicators(.hidden)` | n/a |
| maxWidth | RN-wrapper | `780` | `Modifier.requiredWidthIn(max = 780.dp)` | `.frame(maxWidth: 780)` | ESCALATE — propose `layout.inputMaxWidth = 780` |
| gap | RN-wrapper | `semantic.space.sm` (= 8) | `Arrangement.spacedBy(8.dp)` / `Modifier.padding(end = 8.dp)` between items | `spacing(8)` | `space.sm` |
| paddingHorizontal | RN-wrapper | `semantic.space.md` (= 16) | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| paddingVertical | RN-wrapper | `semantic.space.sm` (= 8) | `Modifier.padding(vertical = 8.dp)` | `.padding(.vertical, 8)` | `space.sm` |

### Visual — Suggestion Chip

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| paddingHorizontal | RN-wrapper | `semantic.space.md` (= 16) | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| paddingVertical | RN-wrapper | `semantic.space.sm` (= 8) | `Modifier.padding(vertical = 8.dp)` | `.padding(.vertical, 8)` | `space.sm` |
| borderRadius | RN-wrapper | `semantic.radius.full` (= 9999) | `RoundedCornerShape(50.dp)` / `CircleShape` (if height = width) | `Capsule()` | `radius.full` |
| borderWidth | RN-wrapper | `1` | `Modifier.border(BorderStroke(1.dp, Color.Transparent))` | `.overlay(RoundedRectangle(...).stroke(Color.clear, lineWidth: 1))` | `borderWidth.thin` |
| borderColor | RN-wrapper | `'transparent'` | `Color.Transparent` | `Color.clear` | n/a |

### Typography — Suggestion Chip

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `semantic.type.body.sm.fontSize` | `LaneShadowTheme.typography.bodySmall.fontSize` | `theme.typography.bodySmall.fontSize` | `type.body.sm.fontSize` |
| color | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

### Layout — Bottom Padding (dynamic)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| paddingBottom | RN-wrapper | `(keyboardVisible ? 0 : insets.bottom) + semantic.space.md + extraBottomOffset` | Computed from `WindowInsets.ime` + `WindowInsets.safeDrawing` + offset | Computed from keyboard height + safe area inset + offset | n/a (dynamic) |

---

## NOTES

- **Absolute positioning:** Fixed at bottom of screen with z-index 20
- **Keyboard avoidance:** iOS uses padding behavior, Android uses height behavior
- **Dynamic bottom padding:** Adjusts based on keyboard visibility, safe area inset, and extra offset
- **Input container:** 780px max width, surface background, border, 16px radius
- **Send button:** 40px circular button, primary color (send) or danger color (cancel)
- **Toggle button:** 40px circular button, surfaceVariant background with elevation[3]
- **Manual mode button:** 32px circular button in input container
- **Suggestion chips:** Horizontal scroll, 8px gap, pill-shaped with surfaceVariant background
- **Error message:** Renders ErrorMessage component when in ERROR state
- **Disabled state:** Text input shows 50% opacity when planning
- **Hit slop:** 4px on all interactive buttons
- **Send/cancel:** Button switches icon and color based on `isPlanning` prop
- **Error auto-dismiss:** 6-second timer via `useEffect`
- **Keyboard listeners:** Adds/removes listeners on mount/unmount
