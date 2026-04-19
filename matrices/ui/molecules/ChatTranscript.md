# ChatTranscript - STYLE PROPERTIES MATRIX

**Component:** ChatTranscript
**RN Source:** `react-native/components/ui/chat-transcript.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/ScrollView/ScrollView.js`, `node_modules/react-native/Libraries/Components/View/View.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|
| RN Wrapper | `react-native/components/ui/chat-transcript.tsx` | Public API, message layout, auto-scroll logic |
| RouteAttachmentCard | `react-native/components/ui/route-attachment-card.tsx` | Route cards (see `matrices/ui/molecules/RouteAttachmentCard.md`) |
| MarkdownText | `react-native/components/ui/markdown-text.tsx` | Agent message markdown rendering |
| TypingIndicator | `react-native/components/chat/typing-indicator.tsx` | Streaming state indicator |
| Text (Paper) | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Typography |

---

## COMPOSITION

**Child molecules/atoms:**
- `RouteAttachmentCard` - Route attachments (full variant) (see `matrices/ui/molecules/RouteAttachmentCard.md`)
- `TypingIndicator` - Loading indicator for streaming messages
- `MarkdownText` - Markdown rendering for agent messages

**Composition pattern:** ScrollView with column of message rows. Rider messages right-aligned with bubble, agent messages left-aligned without bubble. Timestamp dividers between clusters.

**Layout:** Vertical column with 16px gap between messages. Auto-scrolls to bottom on new messages.

---

## STYLE PROPERTIES MATRIX

### Layout — ScrollView

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| contentContainerStyle (padding) | RN-wrapper | `semantic.space.lg` = 16 | `Modifier.padding(16.dp)` | `.padding(16)` | `space.lg` |
| contentContainerStyle (paddingTop) | RN-wrapper | `space.lg + topInset` | `Modifier.padding(top = (16 + topInset).dp)` | `.padding(.top, 16 + topInset)` | `space.lg` + safe area |
| contentContainerStyle (paddingBottom) | RN-wrapper | `space.lg + bottomInset` | `Modifier.padding(bottom = (16 + bottomInset).dp)` | `.padding(.bottom, 16 + bottomInset)` | `space.lg` + safe area |
| contentContainerStyle (gap) | RN-wrapper | `semantic.space.lg` = 16 | `Modifier.padding(end = 16.dp)` between items | `Spacer(minLength: 16)` | `space.lg` |
| showsVerticalScrollIndicator | RN-wrapper | `false` | `verticalScrollbarEnabled = false` | `.scrollIndicators(.hidden)` | n/a |

### Visual — ScrollView

| State | Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|---|
| default | backgroundColor | RN-wrapper | `semantic.color.background.default` | `LaneShadowTheme.colors.background` | `theme.colors.background` | `color.background.default` |
| transparent | backgroundColor | RN-wrapper | `null` (transparent) | `Color.Transparent` | `.clear` | n/a |

### Layout — Timestamp Divider

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| alignItems | RN-wrapper | `'center'` | `horizontalAlignment = Alignment.CenterHorizontally` | n/a | n/a |
| paddingVertical | RN-wrapper | `4` | `Modifier.padding(vertical = 4.dp)` | `.padding(.vertical, 4)` | ESCALATE — propose `space.xs = 4` |

### Typography — Timestamp

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| type | RN-wrapper | `semantic.type.label.sm` | `MaterialTheme.typography.labelSmall` → map to LaneShadow | `.font(.system(size: 12, weight: .medium))` | `type.label.sm` |
| color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| textAlign | RN-wrapper | `'center'` | `TextAlign.Center` | `.multilineTextAlignment(.center)` | n/a |

### Layout — Rider Message Row

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| justifyContent | RN-wrapper | `'flex-end'` | `horizontalArrangement = Arrangement.End` | n/a | n/a |

### Layout — Rider Bubble

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| maxWidth | RN-wrapper | `'80%'` | `Modifier.fillMaxWidth(0.8f)` | `.frame(maxWidth: .infinity * 0.8)` | n/a |
| padding | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(12.dp)` | `.padding(12)` | `space.md` |
| borderRadius | RN-wrapper | `semantic.radius.xl` = 24 | `RoundedCornerShape(24.dp)` | `RoundedRectangle(cornerRadius: 24)` | `radius.xl` |
| borderBottomRightRadius | RN-wrapper | `semantic.radius.sm` = 4 | `CornerShape(bottomEnd = 4.dp)` | custom shape | `radius.sm` |

### Visual — Rider Bubble

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

### Typography — Rider Bubble Text

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| type | RN-wrapper | `semantic.type.body.lg` | `MaterialTheme.typography.bodyLarge` → map to LaneShadow | `.font(.system(size: 16, weight: .regular))` | `type.body.lg` |
| color | RN-wrapper | `semantic.color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |
| flexShrink | RN-wrapper | `1` | `Modifier.width(IntrinsicSize.Min)` (no wrap) | `.fixedSize(horizontal: true, vertical: false)` | n/a |

### Layout — Agent Message Row

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |

### Layout — Agent Text Row

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'flex-end'` | `verticalAlignment = Alignment.Bottom` | `.alignment(.bottom)` | n/a |
| flexWrap | RN-wrapper | `'wrap'` | `Modifier.wrapContentWidth(...)` | n/a | n/a |

### Visual — Agent Message (transparent mode)

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `${color.surface.default}D9` (~85% opacity) | `LaneShadowTheme.colors.surface.copy(alpha = 0.85f)` | `theme.colors.surface.opacity(0.85)` | `color.surface.default` + `opacity.surface = 0.85` |
| borderRadius | RN-wrapper | `semantic.radius.lg` = 16 | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.lg` |
| paddingHorizontal | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |
| paddingVertical | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(vertical = 8.dp)` | `.padding(.vertical, 8)` | `space.sm` |

### Layout — Route Attachments Row

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| marginLeft | RN-wrapper | `0` | `Modifier.padding(start = 0.dp)` | `.padding(.leading, 0)` | n/a |
| gap | RN-wrapper | `8` | `Modifier.padding(end = 8.dp)` between items | `Spacer(minLength: 8)` | `space.sm` |
| marginTop | RN-wrapper | `4` | `Modifier.padding(top = 4.dp)` | `.padding(.top, 4)` | `space.xs` |

### Layout — Typing Indicator Slot

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| marginLeft | RN-wrapper | `semantic.space.xs` = 4 | `Modifier.padding(start = 4.dp)` | `.padding(.leading, 4)` | `space.xs` |
| paddingBottom | RN-wrapper | `6` | `Modifier.padding(bottom = 6.dp)` | `.padding(.bottom, 6)` | ESCALATE — propose `6` |

### Layout — Empty State

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| alignItems | RN-wrapper | `'center'` | `horizontalAlignment = Alignment.CenterHorizontally` | n/a | n/a |
| justifyContent | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | n/a | n/a |
| padding | RN-wrapper | `32` | `Modifier.padding(32.dp)` | `.padding(32)` | `space.2xl` |

### Typography — Empty State

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| type | RN-wrapper | `semantic.type.body.md` | `MaterialTheme.typography.bodyMedium` → map to LaneShadow | `.font(.system(size: 16, weight: .regular))` | `type.body.md` |
| color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| textAlign | RN-wrapper | `'center'` | `TextAlign.Center` | `.multilineTextAlignment(.center)` | n/a |
| lineHeight | RN-wrapper | `22` | `LineHeight(22.sp)` | `.lineSpacing(22 - 16)` = 6 | ESCALATE — propose `type.body.md.lineHeight` |

---

## NOTES

- **Rider messages:** Right-aligned speech bubble with primary background and onPrimary text
- **Agent messages:** Left-aligned, no bubble — plain text with optional glass container (85% opacity surface)
- **Rider bubble:** Tight bottom-right corner (4px radius) for "sent" bubble appearance
- **Timestamps:** Shown on first message OR when >5 minutes elapsed since previous
- **Auto-scroll:** Scrolls to bottom on mount and new messages, respects manual scroll position
- **Gap:** 16px between messages in scroll view
- **Padding:** 16px content padding + safe area insets
- **Max width:** Rider bubbles limited to 80% width
- **Route attachments:** Render as separate rows below agent messages, 8px gap
- **Transparent mode:** Optional prop for map overlay, glass container for agent messages
- **Empty state:** Centered icon and text, 32px padding
- **Typography:** bodyLarge for rider, bodyMedium for agent/empty state, labelSmall for timestamps
- **Keyboard:** Dismisses on drag, taps handled
- **Scroll indicator:** Hidden
