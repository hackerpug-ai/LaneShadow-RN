# UC-CHAT: Chat-Based Ride Planning

**Epic**: Conversational Planning
**Status**: Draft
**Last Updated**: 2026-04-16

## Overview

Chat-based ride planning enables riders to plan routes through natural conversation with an AI assistant. Riders send text messages, receive streaming AI responses, view generated route options inline in the chat, and select routes to start the planning flow. The system maintains conversation history, handles network failures gracefully, and provides optimistic UI updates for instant feedback.

## Platform-Specific Implementation

### Android
- **Convex Android SDK**: Action streaming for real-time agent responses
- **Room**: Local message cache for offline viewing
- **Jetpack Compose**: LazyColumn for chat transcript rendering
- **Coroutines/Flow**: Async message handling and streaming
- **WorkManager**: Background message sync

### iOS
- **Convex Swift SDK**: Action streaming for real-time agent responses
- **SwiftData**: Local message cache for offline viewing
- **SwiftUI**: List for chat transcript rendering
- **Async/Await**: Async message handling and streaming
- **Background Tasks**: Background message sync

---

## UC-CHAT-01: Open Chat Interface

### Description
Riders open the chat interface to start a new planning session or resume an existing conversation.

### Preconditions
- User is logged in
- App has network connectivity (for new sessions)
- Chat permissions granted

### Main Flow
1. Rider navigates to Planning tab or taps chat icon
2. System checks for existing active session
3. If session exists:
   - Load chat history from Convex
   - Scroll to latest message
   - Show session context (route plan, location attachments)
4. If no session:
   - Show empty chat state
   - Display suggestion chips above input
   - Show placeholder: "Where would you like to ride?"
5. Chat input bar is always visible at bottom
6. Keyboard doesn't obscure input (KeyboardAvoidingView)

### Acceptance Criteria

#### Android
```gherkin
Given the rider opens the chat interface
When no active session exists
Then display empty chat state with LazyColumn
And show suggestion chips: "Plan a coastal ride", "Find hill routes near me"
And show placeholder text in TextInput: "Where would you like to ride?"
```

```gherkin
Given the rider opens the chat interface
When an active session exists with sessionId
Then query Convex for session_messages via useQuery(api.db.sessionMessages.list)
And render messages in reverse chronological order (newest at bottom)
And scroll LazyColumn to last item on first render
```

```gherkin
Given the rider is viewing the chat interface
When the keyboard appears
Then adjust layout using KeyboardAvoidingView
And ensure input bar remains visible above keyboard
And do not obscure messages with keyboard
```

#### iOS
```gherkin
Given the rider opens the chat interface
When no active session exists
Then display empty chat state with SwiftUI List
And show suggestion chips: "Plan a coastal ride", "Find hill routes near me"
And show placeholder text in TextInput: "Where would you like to ride?"
```

```gherkin
Given the rider opens the chat interface
When an active session exists with sessionId
Then query Convex for session_messages via useQuery(api.db.sessionMessages.list)
And render messages in reverse chronological order (newest at bottom)
And scroll ScrollViewReader to last item on first render
```

```gherkin
Given the rider is viewing the chat interface
When the keyboard appears
Then adjust layout using KeyboardAvoidingView
And ensure input bar remains visible above keyboard
And do not obscure messages with keyboard
```

---

## UC-CHAT-02: Send Text Message

### Description
Riders send text messages to the AI assistant with optimistic UI updates for instant feedback.

### Preconditions
- Chat interface is open
- Input field contains text
- Network connectivity available (or queue for sync)

### Main Flow
1. Rider types message in input field
2. Rider taps send button (or presses Enter on external keyboard)
3. System validates message is not empty
4. System displays optimistic message immediately (client-generated temp ID)
5. System sends message to Convex action (`api.actions.agent.sendMessage`)
6. System disables input and send button (prevent duplicate sends)
7. Backend persists message immediately (before agent processing)
8. System replaces optimistic message with real message (server ID)
9. System re-enables input for next message

### Acceptance Criteria

#### Android
```gherkin
Given the rider has typed a message
When the rider taps the send button
And message text is not empty after trimming
Then generate temp ID: "temp-{Date.now()}"
And display optimistic message immediately in LazyColumn
And scroll to bottom to show new message
```

```gherkin
Given the rider tapped send
When the optimistic message is displayed
Then disable TextInput (editable=false)
And disable send button (enabled=false)
And show send button as cancel button (× icon)
And invoke Convex action: useAction(api.actions.agent.sendMessage)
```

```gherkin
Given the message was sent to Convex
When the backend responds with messageId
Then remove optimistic message from list (filter by temp ID)
And replace with server-confirmed message (use real messageId)
And re-enable TextInput for next message
```

```gherkin
Given the rider tapped send
When message text is empty after trimming
Then do not send message
And do not display optimistic message
And keep input enabled
```

#### iOS
```gherkin
Given the rider has typed a message
When the rider taps the send button
And message text is not empty after trimming
Then generate temp ID: "temp-{Date.now()}"
And display optimistic message immediately in List
And scroll to bottom to show new message
```

```gherkin
Given the rider tapped send
When the optimistic message is displayed
Then disable TextInput (disabled=true)
And disable send button (disabled=true)
And show send button as cancel button (× icon)
And invoke Convex action: useAction(api.actions.agent.sendMessage)
```

```gherkin
Given the message was sent to Convex
When the backend responds with messageId
Then remove optimistic message from list (filter by temp ID)
And replace with server-confirmed message (use real messageId)
And re-enable TextInput for next message
```

```gherkin
Given the rider tapped send
When message text is empty after trimming
Then do not send message
And do not display optimistic message
And keep input enabled
```

---

## UC-CHAT-03: Receive AI Response

### Description
Riders receive streaming AI responses with typing indicators, markdown rendering, and real-time status updates.

### Preconditions
- Rider sent a message
- Backend agent is processing the request
- Network connectivity maintained

### Main Flow
1. Backend marks message as `status: 'running'`
2. System displays typing indicator (3 animated dots)
3. Backend streams response tokens
4. System renders markdown as tokens arrive:
   - Headers, lists, code blocks, links
5. System updates message content incrementally
6. Backend marks message as `status: 'complete'`
7. System dismisses typing indicator
8. System displays final rendered markdown

### Acceptance Criteria

#### Android
```gherkin
Given the rider sent a message
When the backend sets message.status to 'running'
Then display TypingIndicator component above input
And show 3 animated dots with staggered pulse (150ms delay)
And respect reduce motion preference (static dots if enabled)
```

```gherkin
Given the agent is streaming response tokens
When tokens arrive via Convex streaming
Then render markdown incrementally using Markwon library
And update message.content in real-time
And scroll to bottom as content expands
```

```gherkin
Given the agent response is complete
When the backend sets message.status to 'complete'
Then dismiss TypingIndicator
And display final rendered markdown
And announce completion via accessibilityLiveRegion="polite"
```

```gherkin
Given the agent response contains markdown
When rendering the message content
Then support headers (# ## ###)
And support unordered lists (- *)
And support links ([text](url))
And support code blocks (```language```)
```

#### iOS
```gherkin
Given the rider sent a message
When the backend sets message.status to 'running'
Then display TypingIndicator component above input
And show 3 animated dots with staggered pulse (150ms delay)
And respect reduce motion preference (static dots if enabled)
```

```gherkin
Given the agent is streaming response tokens
When tokens arrive via Convex streaming
Then render markdown incrementally using MarkdownUI library
And update message.content in real-time
And scroll to bottom as content expands
```

```gherkin
Given the agent response is complete
When the backend sets message.status to 'complete'
Then dismiss TypingIndicator
And display final rendered markdown
And announce completion via accessibilityLiveRegion="polite"
```

```gherkin
Given the agent response contains markdown
When rendering the message content
Then support headers (# ## ###)
And support unordered lists (- *)
And support links ([text](url))
And support code blocks (```language```)
```

---

## UC-CHAT-04: View Generated Route Options

### Description
Riders view route options generated by the AI assistant as inline cards in the chat transcript.

### Preconditions
- Agent completed route planning
- Route options are available in `route_plans` table
- Message has attachment: `{ type: 'route_options', routePlanId }`

### Main Flow
1. Agent completes route planning
2. Backend creates attachment on message
3. System renders `RoutingCard` component inline
4. Card shows route options with:
   - Route label (e.g., "Scenic Coastal Route")
   - Start and end locations
   - Distance and duration
   - Weather overlays (rain, wind warnings)
   - Mini-map preview
5. Rider can scroll through multiple options
6. Rider taps card to view route on map

### Acceptance Criteria

#### Android
```gherkin
Given the agent completed route planning
When the message has a route_options attachment
Then render RoutingCard component in LazyColumn
And query route plan via useQuery(api.db.routePlans.getPlanById)
And display loading state while plan loads
```

```gherkin
Given the RoutingCard is rendering
When route plan status is 'running'
Then display 4 phase pills: Reading → Finding → Weather → Building
And animate active phase with pulse (Reanimated)
And show status message: "Planning route..."
```

```gherkin
Given the RoutingCard is rendering
When route plan status is 'completed'
Then morph card into RouteAttachmentCard list
And display each route option with:
  - Start → End labels
  - Distance (e.g., "45.2mi")
  - Duration (e.g., "2h 15m")
  - Weather warnings (rain, wind)
  - Mini-map preview (overviewGeometry)
```

```gherkin
Given the RoutingCard is rendering
When route plan status is 'failed'
Then display error card with red tint
And show errorMessage from route plan
And provide "Try again" button
```

#### iOS
```gherkin
Given the agent completed route planning
When the message has a route_options attachment
Then render RoutingCard component in List
And query route plan via useQuery(api.db.routePlans.getPlanById)
And display loading state while plan loads
```

```gherkin
Given the RoutingCard is rendering
When route plan status is 'running'
Then display 4 phase pills: Reading → Finding → Weather → Building
And animate active phase with pulse (SwiftUI animation)
And show status message: "Planning route..."
```

```gherkin
Given the RoutingCard is rendering
When route plan status is 'completed'
Then morph card into RouteAttachmentCard list
And display each route option with:
  - Start → End labels
  - Distance (e.g., "45.2mi")
  - Duration (e.g., "2h 15m")
  - Weather warnings (rain, wind)
  - Mini-map preview (overviewGeometry)
```

```gherkin
Given the RoutingCard is rendering
When route plan status is 'failed'
Then display error card with red tint
And show errorMessage from route plan
And provide "Try again" button
```

---

## UC-CHAT-05: Select Route from Chat

### Description
Riders select a route option from the chat to preview on the map and start the planning flow.

### Preconditions
- Route options are displayed in chat
- Rider has tapped a route card

### Main Flow
1. Rider taps a route card
2. System highlights selected route (blue border)
3. System updates `selectedRouteId` in context
4. Rider taps "View on Map" button
5. System navigates to map tab
6. Map camera fits to route bounds
7. Route displays on map with full detail
8. Rider can start planning flow from selected route

### Acceptance Criteria

#### Android
```gherkin
Given route options are displayed in chat
When the rider taps a RouteAttachmentCard
Then update selectedRouteId in SelectedRouteContext
And highlight card with primary color border (borderWidth: 1.5dp)
And show checkmark icon on selected card
```

```gherkin
Given a route is selected
When the rider taps "View on Map" button
Then navigate to map tab via router.push('/(app)/(tabs)')
And call mapCamera.fitBounds with route bounds
And display route polyline on map
And set displayedRoutePlanId to current plan
```

```gherkin
Given the rider is viewing the selected route on map
When the route is displayed
Then show route overview geometry (polyline)
And display start/end markers
And show route label in bottom sheet
And provide "Start Planning" button
```

#### iOS
```gherkin
Given route options are displayed in chat
When the rider taps a RouteAttachmentCard
Then update selectedRouteId in SelectedRouteEnvironment
And highlight card with primary color border (borderWidth: 1.5)
And show checkmark icon on selected card
```

```gherkin
Given a route is selected
When the rider taps "View on Map" button
Then navigate to map tab via router.push('/(app)/(tabs)')
And call mapCamera.fitBounds with route bounds
And display route polyline on map
And set displayedRoutePlanId to current plan
```

```gherkin
Given the rider is viewing the selected route on map
When the route is displayed
Then show route overview geometry (polyline)
And display start/end markers
And show route label in bottom sheet
And provide "Start Planning" button
```

---

## UC-CHAT-06: View Chat History

### Description
Riders view and navigate chat history with pagination, search, and session management.

### Preconditions
- Rider has sent at least one message
- Chat history exists in Convex

### Main Flow
1. Rider opens chat interface
2. System loads recent messages (last 50)
3. Rider scrolls up to load older messages
4. System pagulates older messages in batches of 50
5. Rider taps search icon
6. System shows search input
7. Rider enters search query
8. System filters messages by content
9. Rider taps result to jump to message
10. Rider can view previous sessions from session list

### Acceptance Criteria

#### Android
```gherkin
Given the rider opens the chat interface
When messages are loaded from Convex
Then query last 50 messages via useQuery(api.db.sessionMessages.list)
And render in LazyColumn with reverseLayout (newest at bottom)
And show pagination indicator when scrolling up
```

```gherkin
Given the rider scrolls to top of chat
When older messages exist
Then load next batch via pagination cursor
And prepend messages to LazyColumn (maintain scroll position)
And show "Loading older messages..." indicator
```

```gherkin
Given the rider taps the search icon
When the search interface opens
Then show SearchView in toolbar
And filter messages by content match
And highlight search query in results
```

```gherkin
Given the rider taps a search result
When the result is selected
Then scroll LazyColumn to message position
And highlight message with yellow tint
And dismiss search interface
```

#### iOS
```gherkin
Given the rider opens the chat interface
When messages are loaded from Convex
Then query last 50 messages via useQuery(api.db.sessionMessages.list)
And render in List with reverseLayout (newest at bottom)
And show pagination indicator when scrolling up
```

```gherkin
Given the rider scrolls to top of chat
When older messages exist
Then load next batch via pagination cursor
And prepend messages to List (maintain scroll position)
And show "Loading older messages..." indicator
```

```gherkin
Given the rider taps the search icon
When the search interface opens
Then show SearchBar in navigation bar
And filter messages by content match
And highlight search query in results
```

```gherkin
Given the rider taps a search result
When the result is selected
Then scroll ScrollViewReader to message position
And highlight message with yellow tint
And dismiss search interface
```

---

## UC-CHAT-07: Share Location in Chat

### Description
Riders attach their current location or a selected point on the map to the chat conversation.

### Preconditions
- Chat interface is open
- Location permissions granted
- GPS available (or last known location exists)

### Main Flow
1. Rider taps location attachment button
2. System shows two options:
   - "Current Location"
   - "Select on Map"
3. Rider selects option:
   - **Current Location**: Attach GPS coordinates
   - **Select on Map**: Open map, rider taps point, attach coordinates
4. System formats location as:
   - Coordinates: `(37.7749, -122.4194)`
   - Reverse geocoded name: "San Francisco, CA"
5. Rider can add message text with location
6. Rider taps send
7. Message includes location attachment

### Acceptance Criteria

#### Android
```gherkin
Given the rider taps the location attachment button
When the location options appear
Then show bottom sheet with two options:
  - "Current Location" with icon
  - "Select on Map" with icon
```

```gherkin
Given the rider selects "Current Location"
When location is available
Then fetch last known location via FusedLocationProvider
And reverse geocode via Geocoder.getFromLocation()
And format attachment: "📍 San Francisco, CA (37.7749, -122.4194)"
```

```gherkin
Given the rider selects "Select on Map"
When the map interface opens
Then display full-screen map with current location
And enable tap-to-select mode
And show pin at tapped coordinates
And confirm selection with "Attach Location" button
```

```gherkin
Given the rider sends a message with location
When the message is created
Then include location attachment in Convex message
And render location card in chat with:
  - Location name
  - Coordinates
  - "View on Map" button
```

#### iOS
```gherkin
Given the rider taps the location attachment button
When the location options appear
Then show bottom sheet with two options:
  - "Current Location" with icon
  - "Select on Map" with icon
```

```gherkin
Given the rider selects "Current Location"
When location is available
Then fetch last known location via CLLocationManager
And reverse geocode via CLGeocoder
And format attachment: "📍 San Francisco, CA (37.7749, -122.4194)"
```

```gherkin
Given the rider selects "Select on Map"
When the map interface opens
Then display full-screen map with current location
And enable tap-to-select mode
And show pin at tapped coordinates
And confirm selection with "Attach Location" button
```

```gherkin
Given the rider sends a message with location
When the message is created
Then include location attachment in Convex message
And render location card in chat with:
  - Location name
  - Coordinates
  - "View on Map" button
```

---

## UC-CHAT-08: Chat Error Handling

### Description
Riders see appropriate error messages and recovery options when network loss, Convex timeout, or empty response occurs.

### Preconditions
- Chat interface is open
- Rider sent a message
- Error condition occurs

### Main Flow
1. Rider sends message
2. Error condition occurs:
   - **Network loss**: No connectivity
   - **Convex timeout**: Action takes > 30s
   - **Empty response**: Agent returns no content
   - **Monthly limit**: Rider exceeded plan limits
3. System detects error type
4. System displays error message:
   - Network: "Connection lost. Tap to retry."
   - Timeout: "Request timed out. Please try again."
   - Empty: "I couldn't generate a response. Please rephrase."
   - Limit: "You've reached your monthly limit. Upgrade to continue."
5. System provides recovery action:
   - Retry button (network, timeout)
   - Rephrase prompt (empty response)
   - Upgrade link (limit)
6. Rider can dismiss error and continue

### Acceptance Criteria

#### Android
```gherkin
Given the rider sent a message
And network connectivity is lost
When the Convex action fails with network error
Then display ErrorMessage component above input
And show text: "Connection lost. Tap to retry."
And provide "Retry" button
And keep message in input field for resend
```

```gherkin
Given the rider sent a message
And Convex action times out (> 30s)
When the timeout error occurs
Then display ErrorMessage component above input
And show text: "Request timed out. Please try again."
And provide "Retry" button
And clear isSending state to allow retry
```

```gherkin
Given the rider sent a message
And agent returns empty response
When the empty response is detected
Then display ErrorMessage component above input
And show text: "I couldn't generate a response. Please rephrase."
And provide suggestion chips: "Try asking differently"
```

```gherkin
Given the rider sent a message
And backend returns monthly limit error
When the limit error is detected
Then display ErrorMessage component above input
And show text: "You've reached your monthly limit. Upgrade to continue."
And provide "Upgrade Plan" button (navigate to subscription screen)
```

```gherkin
Given an error message is displayed
When 6 seconds have elapsed
Then auto-dismiss error via setTimeout
And clear error from state
```

#### iOS
```gherkin
Given the rider sent a message
And network connectivity is lost
When the Convex action fails with network error
Then display ErrorMessage component above input
And show text: "Connection lost. Tap to retry."
And provide "Retry" button
And keep message in input field for resend
```

```gherkin
Given the rider sent a message
And Convex action times out (> 30s)
When the timeout error occurs
Then display ErrorMessage component above input
And show text: "Request timed out. Please try again."
And provide "Retry" button
And clear isSending state to allow retry
```

```gherkin
Given the rider sent a message
And agent returns empty response
When the empty response is detected
Then display ErrorMessage component above input
And show text: "I couldn't generate a response. Please rephrase."
And provide suggestion chips: "Try asking differently"
```

```gherkin
Given the rider sent a message
And backend returns monthly limit error
When the limit error is detected
Then display ErrorMessage component above input
And show text: "You've reached your monthly limit. Upgrade to continue."
And provide "Upgrade Plan" button (navigate to subscription screen)
```

```gherkin
Given an error message is displayed
When 6 seconds have elapsed
Then auto-dismiss error via DispatchQueue.asyncAfter
And clear error from state
```

---

## Shared Cross-Platform Requirements

### Performance
- Optimistic message display: < 50ms latency from send tap
- Streaming token rendering: < 100ms per token batch
- Chat history pagination: < 500ms per 50-message batch
- Route card loading: < 1s for 3-route options

### Reliability
- Optimistic messages always replaced with server messages (no orphaned temps)
- Duplicate sends blocked via isSending flag
- Network failures gracefully surfaced with recovery actions
- Session state preserved across app backgrounding/foregrounding

### Accessibility
- All messages accessible via screen reader
- Typing indicator announces "Assistant is typing"
- Route cards announce route details (distance, duration, weather)
- Error messages read automatically
- Suggestion chips accessible via custom actions

### Error Handling
- Network errors: Retry button with message preservation
- Timeout errors: Clear messaging, retry available
- Empty responses: Rephrase suggestions
- Limit errors: Upgrade path with clear CTAs
- Validation errors: Inline feedback (empty message, etc.)

### State Management
- Optimistic messages use temp IDs (`temp-{timestamp}`)
- Server messages use Convex IDs (`Id<'session_messages'>`)
- isSending flag prevents duplicate sends
- Session ID reused for refinement, cleared for new rides
- Error state cleared automatically after 6s

---

## Related Components

### React Native (Current Implementation)
- `hooks/use-chat-planning.ts` - Chat planning orchestration hook
- `components/chat/chat-input.tsx` - Always-visible input bar with suggestions
- `components/chat/routing-card.tsx` - Live route planning progress
- `components/chat/route-attachment-card.tsx` - Completed route options
- `components/chat/typing-indicator.tsx` - Animated typing indicator
- `components/chat/card-registry.ts` - Message type to component mapping

### Native Modules (Required for Rewrite)
- **Android**: `ChatMessageManager.kt` - Room database wrapper for message cache
- **iOS**: `ChatMessageManager.swift` - SwiftData wrapper for message cache
- **Shared**: `StreamingConvexClient` - Platform-specific Convex streaming handler

---

## Dependencies

### External SDKs
- **Convex Android SDK** (Android): Action streaming, query subscriptions
- **Convex Swift SDK** (iOS): Action streaming, query subscriptions
- **Room** (Android): Local message cache
- **SwiftData** (iOS): Local message cache
- **Markwon** (Android): Markdown rendering
- **MarkdownUI** (iOS): Markdown rendering

### Internal Services
- **Convex Backend**: `api.actions.agent.sendMessage` - Agent orchestration
- **Convex Backend**: `api.db.sessionMessages.list` - Message history
- **Convex Backend**: `api.db.routePlans.getPlanById` - Route plan queries
- **Convex Backend**: `api.db.planningSessions.createSession` - Session management

---

## Success Metrics

- **Message send success rate**: > 98% (excluding network failures)
- **Optimistic UI latency**: < 50ms from send tap to display
- **Streaming token latency**: < 100ms from backend to display
- **Route card rendering time**: < 1s from plan completion to display
- **Error recovery rate**: > 80% of errors result in successful retry
- **Session continuation rate**: > 90% of riders reuse session for refinement
