# Integrate FullChatHistoryView with route attachment interaction

> Task ID: US-017
> Type: FEATURE
> Priority: P0
> Estimate: 180 minutes
> Assignee: ui-developer

## CRITICAL CONSTRAINTS

### MUST

- Build `ChatSessionView` component using `BottomSheetWrapper` preset `three-quarter`
- Rider bubbles right-aligned (primary background), system bubbles left-aligned (surfaceVariant background)
- Route attachments inline and tappable to highlight corresponding polyline on map
- Typing indicator with 3 animated dots, staggered 200ms
- Auto-scroll to newest message on arrival
- Expand/collapse triggered from ChatInput chevron
- Map remains partially visible when expanded

### NEVER

- Fully obscure the map — the expanded view must leave map partially visible or be dismissible
- Break the chat input — it must remain accessible in both minimal and expanded views
- Render route cards as static text — they must be tappable interactive elements

### STRICTLY

- Use `BottomSheetWrapper` with preset `three-quarter` — do not create a custom sheet implementation
- Use `useSemanticTheme()` for all color tokens

## SPECIFICATION

**Objective:** Build the full chat history view that expands from the chat input area, showing all messages chronologically with rider/agent alignment, inline tappable route attachment cards, typing indicator, and auto-scroll behavior.

**Success looks like:** Rider taps the expand chevron, a three-quarter sheet slides up showing the full conversation. Rider messages appear right-aligned, agent messages left-aligned. Route cards are inline and tappable — tapping one highlights the corresponding polyline on the map. Collapsing returns to the minimal map-primary view with input still accessible.

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | Chat has messages from a planning session | Rider taps expand chevron | Three-quarter sheet opens showing full message history | Visual: sheet slides up, messages visible |
| 2 | Chat history is expanded | Messages are displayed | Rider messages right-aligned (primary bg), system messages left-aligned (surfaceVariant bg) | Visual: correct alignment and colors |
| 3 | System message has route attachments | Rider taps a route attachment card | Corresponding polyline highlights on map | Visual: polyline focus changes on tap |
| 4 | Chat is expanded | Rider taps collapse button | View returns to minimal map-primary layout | Visual: sheet collapses, map is primary |
| 5 | Chat is in either minimal or expanded view | Rider looks at input area | Chat input is accessible and functional | Visual: input field visible and typeable |
| 6 | Agent is processing a message | Chat view is visible | Typing indicator shows 3 animated dots with staggered 200ms animation | Visual: dots animate sequentially |
| 7 | New message arrives | Chat is expanded | View auto-scrolls to show the newest message | Visual: scroll position jumps to bottom |

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | Expand opens three-quarter sheet with full message history | AC-1 | Manual: tap chevron, verify sheet | TODO |
| 2 | Messages render with correct alignment per role | AC-2 | Manual: verify rider right, system left | TODO |
| 3 | Route cards are tappable and highlight map polyline | AC-3 | Manual: tap card, verify polyline focus | TODO |
| 4 | Collapse returns to minimal map-primary view | AC-4 | Manual: collapse, verify map visible | TODO |
| 5 | Input accessible in both minimal and expanded views | AC-5 | Manual: type in both states | TODO |
| 6 | Typing indicator shows 3 animated dots staggered 200ms | AC-6 | Manual: observe during planning | TODO |
| 7 | Auto-scroll on new message arrival | AC-7 | Manual: observe scroll on new message | TODO |

## GUARDRAILS

### WRITE-ALLOWED

- `components/chat/chat-session-view.tsx` (NEW)
- `app/(app)/(tabs)/index.tsx` (MODIFY)

### WRITE-PROHIBITED

- `components/sheets/bottom-sheet-wrapper.tsx` (use as-is)
- `convex/` (no backend changes)

## DESIGN

### References

- 08-technical-ui.md §3 — ChatSessionView component spec
- 04-uc-agentic.md UC-AG-10 — Full Chat History wireframe
- 09-technical-client.md §1.3 — `isSessionViewExpanded` state field

### Code Pattern

```typescript
// components/chat/chat-session-view.tsx
export function ChatSessionView({
  messages,
  isExpanded,
  onCollapse,
  onRouteCardTap,
  isTyping,
}: ChatSessionViewProps) {
  const { colors } = useSemanticTheme()
  const flatListRef = useRef<FlatList>(null)

  // Auto-scroll on new message
  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true })
    }
  }, [messages.length])

  return (
    <BottomSheetWrapper preset="three-quarter" visible={isExpanded} onClose={onCollapse}>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            onRouteCardTap={onRouteCardTap}
          />
        )}
      />
      {isTyping && <TypingIndicator />}
    </BottomSheetWrapper>
  )
}
```

### Anti-pattern (DO NOT)

- Do not use `ScrollView` for messages — use `FlatList` for virtualized rendering
- Do not hardcode colors — use semantic theme tokens
- Do not create a new sheet component — use existing `BottomSheetWrapper`
- Do not render all messages in a single re-render — use `keyExtractor` and memo for performance

## CODING STANDARDS

- **brain/docs/coding-standards**: TypeScript strict, composition patterns

## DEPENDENCIES

- Epic 2: Chat Infrastructure (messages state, ChatInput with chevron)
- `BottomSheetWrapper` must support `three-quarter` preset
- `useRideFlow` must expose `isSessionViewExpanded` state and dispatch

## NOTES

- This is the largest task in Epic 3 (180 min) due to the number of interactive elements
- The typing indicator is a simple 3-dot animation, not a shimmer or skeleton
- Route card tap dispatches the same action as tapping a polyline on the map — reuse existing selection logic
- The map should be dimmed but visible behind the expanded sheet
