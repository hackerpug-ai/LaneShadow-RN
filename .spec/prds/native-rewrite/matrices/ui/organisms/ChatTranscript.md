# ChatTranscript - STYLE PROPERTIES MATRIX

**Component:** ChatTranscript
**RN Source:** `react-native/components/ui/chat-transcript.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/ScrollView/ScrollView.js`, `node_modules/react-native/Libraries/Components/Text/Text.js`, `node_modules/react-native/Libraries/Components/View/View.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|
| RN Wrapper | `react-native/components/ui/chat-transcript.tsx` | Public API, message rendering, scroll behavior |
| MarkdownText | `react-native/components/ui/markdown-text.tsx` | Markdown rendering (see `matrices/ui/molecules/MarkdownText.md`) |
| RouteAttachmentCard | `react-native/components/ui/route-attachment-card.tsx` | Route cards (see `matrices/ui/molecules/RouteAttachmentCard.md`) |
| TypingIndicator | `react-native/components/chat/typing-indicator.tsx` | Streaming indicator (see `matrices/ui/atoms/TypingIndicator.md`) |
| Card Registry | `react-native/components/chat/card-registry.tsx` | Dynamic card component mapping |
| ScrollView (RN) | `node_modules/react-native/Libraries/Components/ScrollView/ScrollView.js` | Scroll container |
| Text (RN) | `node_modules/react-native/Libraries/Components/Text/Text.js` | Typography |

---

## COMPOSITION ANALYSIS

**Child molecules/atoms:**
- `MarkdownText` - Agent message content rendering (see `matrices/ui/molecules/MarkdownText.md`)
- `RouteAttachmentCard` - Route attachment cards in agent messages (see `matrices/ui/molecules/RouteAttachmentCard.md`)
- `TypingIndicator` - Streaming state indicator (see `matrices/ui/atoms/TypingIndicator.md`)
- Card Registry - Dynamic component registry for reasoning, planning, routing, location-search, planning, route-mini-map cards

**Composition pattern:**
- Vertical scroll container with alternating message rows
- Rider messages: right-aligned speech bubble with primary background
- Agent messages: left-aligned text with optional glass container background
- Cards: Full-width left-aligned components from registry
- Timestamp dividers between message clusters
- Auto-scroll to bottom on mount and new messages
- Route attachments render as separate rows below agent messages

**Layout:** ScrollView with flex: 1, 16px padding, 16px gap between messages

---

## STATE & BEHAVIOR

| State | Type | Source | Native Translation |
|---|---|---|---|
| scrollRef | Ref<ScrollView> | useRef | `LazyColumn` with `LazyListState` / `ScrollView` with reader |
| userHasScrolled | boolean | useState | `rememberSaveable { mutableStateOf(false) }` / `@State var userHasScrolled = false` |
| messageIds | string (computed) | useMemo | Derived from `messages.map { it.id }.joinToString(",")` |
| prevMessageIdsRef | Ref<string> | useRef | `rememberPrevious(messageIds)` / `@State var prevMessageIds: String?` |
| handleScroll | callback | useCallback | `Modifier.onScrollPositionChange { layoutOffset, _ -> ... }` / `.onChange(of: scrollPosition)` |

**Side effects:**
- Auto-scroll on mount: `useEffect` with empty deps → `LaunchedEffect(Unit) { ... }` / `.onAppear { ... }`
- Auto-scroll on new messages: `useEffect([messageIds, userHasScrolled])` → `LaunchedEffect(messageIds) { if (hasNewMessages && !userHasScrolled) ... }` / `.onChange(of: messageIds) { if hasNewMessages { ... } }`
- Scroll throttle: 100ms → derived from RN's `scrollEventThrottle`

**Callback signatures:**
- `onRoutePress?: (routeId: string, messageId: string) => void` → `(routeId: String, messageId: String) -> Unit` / `(String, String) -> Void`
- `onViewOnMap?: () => void` → `() -> Unit` / `() -> Void`
- `onScrollBeginDrag?: () => void` → `() -> Unit` / `() -> Void`

---

## STYLE PROPERTIES MATRIX

### Layout — ScrollView Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| height | RN-wrapper | `'100%'` | `Modifier.fillMaxHeight()` | `.frame(maxHeight: .infinity)` | n/a |
| backgroundColor (default) | RN-wrapper | `semantic.color.background.default` | `LaneShadowTheme.colors.background` | `theme.colors.background` | `color.background.default` |
| backgroundColor (transparent) | RN-wrapper | `transparent` | `Modifier.background(Color.Transparent)` | `.background(Color.clear)` | n/a |

### Layout — Content Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| padding | RN-wrapper | `semantic.space.lg` (= 16) | `Modifier.padding(16.dp)` | `.padding(16)` | `space.lg` |
| paddingTop | RN-wrapper | `semantic.space.lg + topInset` | `Modifier.padding(top = 16.dp + topInset.dp)` | `.padding(.top, 16 + topInset)` | `space.lg + topInset` |
| paddingBottom | RN-wrapper | `semantic.space.lg + bottomInset` | `Modifier.padding(bottom = 16.dp + bottomInset.dp)` | `.padding(.bottom, 16 + bottomInset)` | `space.lg + bottomInset` |
| gap | RN-wrapper | `semantic.space.lg` (= 16) | `VerticalArrangement.spacedBy(16.dp)` / `Modifier.padding(bottom = 16.dp)` between items | `spacing(16)` | `space.lg` |

### Visual — Rider Bubble

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| borderRadius | RN-wrapper | `semantic.radius.xl` (= 16) | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.xl` |
| borderBottomRightRadius | RN-wrapper | `semantic.radius.sm` (= 4) | `CutCornerShape(bottomEnd = 4.dp)` via `Shape` composition | `.clipShape(RoundedCorner(topLeading: 16, bottomLeading: 16, topTrailing: 16, bottomTrailing: 4))` | `radius.sm` |
| padding | RN-wrapper | `semantic.space.md` (= 12) | `Modifier.padding(12.dp)` | `.padding(12)` | `space.md` |
| maxWidth | RN-wrapper | `'80%'` | `Modifier.requiredWidthIn(max = 400.dp)` (assumes 500dp screen) | `.frame(maxWidth: .infinity).padding(.trailing, screenWidth * 0.2)` | n/a |
| alignSelf | RN-wrapper | `'flex-end'` | `Modifier.align(Alignment.End)` | `.frame(maxWidth: .infinity, alignment: .trailing)` | n/a |

### Visual — Agent Message Row (transparent mode)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.surface.default` with 85% opacity (`D9` hex) | `LaneShadowTheme.colors.surface.copy(alpha = 0.85f)` | `theme.colors.surface.opacity(0.85)` | `color.surface.default + opacity 0.85` |
| borderRadius | RN-wrapper | `semantic.radius.lg` (= 12) | `RoundedCornerShape(12.dp)` | `RoundedRectangle(cornerRadius: 12)` | `radius.lg` |
| paddingHorizontal | RN-wrapper | `semantic.space.md` (= 12) | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |
| paddingVertical | RN-wrapper | `semantic.space.sm` (= 8) | `Modifier.padding(vertical = 8.dp)` | `.padding(.vertical, 8)` | `space.sm` |

### Typography — Rider Bubble Text

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `semantic.type.body.lg.fontSize` | `LaneShadowTheme.typography.bodyLarge.fontSize` | `theme.typography.bodyLarge.fontSize` | `type.body.lg.fontSize` |
| fontWeight | RN-wrapper | `semantic.type.body.lg.fontWeight` | `LaneShadowTheme.typography.bodyLarge.fontWeight` | `theme.typography.bodyLarge.weight` | `type.body.lg.fontWeight` |
| lineHeight | RN-wrapper | `semantic.type.body.lg.lineHeight` | `LaneShadowTheme.typography.bodyLarge.lineHeight` | `theme.typography.bodyLarge.lineSpacing` + baseline | `type.body.lg.lineHeight` |
| color | RN-wrapper | `semantic.color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |

### Typography — Agent Message Text

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | MarkdownText | `semantic.type.body.md.fontSize` | `LaneShadowTheme.typography.bodyMedium.fontSize` | `theme.typography.bodyMedium.fontSize` | `type.body.md.fontSize` |
| fontWeight | MarkdownText | `semantic.type.body.md.fontWeight` | `LaneShadowTheme.typography.bodyMedium.fontWeight` | `theme.typography.bodyMedium.weight` | `type.body.md.fontWeight` |
| lineHeight | MarkdownText | `semantic.type.body.md.lineHeight` | `LaneShadowTheme.typography.bodyMedium.lineHeight` | `theme.typography.bodyMedium.lineSpacing` + baseline | `type.body.md.lineHeight` |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Typography — Timestamp Divider

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `semantic.type.label.sm.fontSize` | `LaneShadowTheme.typography.labelSmall.fontSize` | `theme.typography.labelSmall.fontSize` | `type.label.sm.fontSize` |
| fontWeight | RN-wrapper | `semantic.type.label.sm.fontWeight` | `LaneShadowTheme.typography.labelSmall.fontWeight` | `theme.typography.labelSmall.weight` | `type.label.sm.fontWeight` |
| textAlign | RN-wrapper | `'center'` | `TextAlign.Center` | `.multilineTextAlignment(.center)` | n/a |
| color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| paddingVertical | RN-wrapper | `4` | `Modifier.padding(vertical = 4.dp)` | `.padding(.vertical, 4)` | semantic.space.micro|

### Layout — Empty State

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| alignItems | RN-wrapper | `'center'` | `Modifier.align(Alignment.CenterHorizontally)` + vertical center | `.frame(maxWidth: .infinity, maxHeight: .infinity).overlay(..., alignment: .center)` | n/a |
| justifyContent | RN-wrapper | `'center'` | `Modifier.fillMaxSize(), contentPadding = ...` | `.frame(maxWidth: .infinity, maxHeight: .infinity).overlay(..., alignment: .center)` | n/a |
| padding | RN-wrapper | `32` | `Modifier.padding(32.dp)` | `.padding(32)` | `space.3xl` (48) is close, consider ESCALATE for 32 |

### Typography — Empty State

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `semantic.type.body.md.fontSize` | `LaneShadowTheme.typography.bodyMedium.fontSize` | `theme.typography.bodyMedium.fontSize` | `type.body.md.fontSize` |
| lineHeight | RN-wrapper | `22` | `LaneShadowTheme.typography.bodyMedium.lineHeight` (verify matches) | `theme.typography.bodyMedium.lineSpacing` + baseline | ESCALATE — verify `type.body.md.lineHeight` equals 22 |
| textAlign | RN-wrapper | `'center'` | `TextAlign.Center` | `.multilineTextAlignment(.center)` | n/a |
| color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| marginTop | RN-wrapper | `semantic.space.md` (= 12) | `Modifier.padding(top = 12.dp)` | `.padding(.top, 12)` | `space.md` |

### Icon — Empty State Icon

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| size | RN-wrapper | `40` | `Modifier.size(40.dp)` | `.frame(width: 40, height: 40)` | semantic.icon.lg|
| color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

### Layout — Route Attachments Row

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| marginLeft | RN-wrapper | `0` | `Modifier.padding(start = 0.dp)` | `.padding(.leading, 0)` | n/a |
| gap | RN-wrapper | `8` | `HorizontalArrangement.spacedBy(8.dp)` / `Modifier.padding(end = 8.dp)` between items | `spacing(8)` | `space.sm` |
| marginTop | RN-wrapper | `4` | `Modifier.padding(top = 4.dp)` | `.padding(.top, 4)` | semantic.space.micro|

### Interaction — ScrollView

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| keyboardDismissMode | RN-wrapper | `'on-drag'` | `IME keyboard behavior` (platform default) | `.keyboardShortcut(.defaultAction)` | n/a |
| keyboardShouldPersistTaps | RN-wrapper | `'handled'` | `clickable(onClick = { ... }, interactionSource = ...)` | `.onTapGesture { ... }` | n/a |
| showsVerticalScrollIndicator | RN-wrapper | `false` | `Modifier.verticalScroll(rememberScrollState(), flingBehavior = ...).scrollbar(false)` | `.scrollIndicators(.hidden)` | n/a |

---

## NOTES

- **Scroll behavior:** Auto-scrolls to bottom on mount and when new messages arrive (detected via messageIds change)
- **User scroll detection:** Tracks when user scrolls away from bottom (within 50px threshold) to prevent auto-scroll interruption
- **Message ordering:** Messages arrive sorted by `createdAt` ascending; reasoning rows naturally render above paired responses due to earlier timestamps
- **Bubble shape:** Rider bubble has tight bottom-right corner (radius.sm = 4px) for classic "sent" appearance
- **Glass container:** Agent messages render with 85% opacity surface background when `transparent=true` for map overlay mode
- **Route attachments:** Render as separate full-width rows below agent messages to prevent overlap
- **Card registry:** Dynamic component lookup for specialized message types (reasoning, planning, routing, location-search, route-mini-map)
- **Timestamp logic:** Shows on first message OR when >5 minutes elapsed OR on new calendar day
- **Safe area:** Respects `topInset` and `bottomInset` props for overlay positioning
- **Empty state:** Centered icon and text when `messages.length === 0`
