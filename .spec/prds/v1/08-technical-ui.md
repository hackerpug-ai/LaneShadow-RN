---
stability: CONSTITUTION
last_validated: 2026-04-03
prd_version: 1.1.0
---

# LaneShadow V1 — Technical UI Specification

## Overview

This document specifies the exact props interfaces, layouts, theme token usage, interaction behavior, and testID conventions for every new component and modified screen in the V1 "Ride the Moment" flow. The UX model is a **conversational chat-session** interface where the map is always the primary view and rider interactions happen through a persistent chat input bar.

All components consume semantic tokens exclusively via `useSemanticTheme()`. No hardcoded color values except in `ThemePicker`.

**Primary source**: `.spec/artifacts/team-product/ux-differentiation.md`

---

## State Machine (HomeMapScreen)

The home screen drives a single `planningStatus` enum. All UI states derive from it. The map is always visible — no full-screen sheets or scrims.

```typescript
type PlanningStatus =
  | 'idle'              // ChatInput visible at bottom of map, no active planning
  | 'planning'          // Loading phases shown inline in chat (typing indicator style)
  | 'route_results'     // Routes on map as polylines, ChatMessageOverlay shown
  | 'route_details'     // RouteDetailsSheet open for full route detail view
  | 'session_history'   // SessionSidebar open
  | 'navigation_export' // Deep-link to navigation app firing
```

### Transition table

| From | Event | To |
|------|-------|-----|
| `idle` | send message via ChatInput | `planning` |
| `idle` | open sidebar (hamburger or left edge swipe) | `session_history` |
| `planning` | pipeline phase update | `planning` (update phase label) |
| `planning` | pipeline complete (success) | `route_results` |
| `planning` | cancel | `idle` (session preserved, cancel message in chat) |
| `planning` | pipeline error | `idle` (error message in chat per UC-NLP-11) |
| `route_results` | send refinement message via ChatInput | `planning` |
| `route_results` | tap route attachment card | `route_results` (update `selectedRouteId`) |
| `route_results` | tap "View Details" on attachment card | `route_details` |
| `route_results` | tap "Navigate" on attachment card | `navigation_export` |
| `route_results` | long-press route segment on map | triggers favorite save flow |
| `route_details` | back | `route_results` |
| `session_history` | select session | loads session → `route_results` or `idle` |
| `session_history` | close sidebar | previous state |
| `navigation_export` | deep-link fires | `idle` |

### PlanningState

```typescript
type PlanningState = {
  // ... existing fields ...
  planningStatus: PlanningStatus
  activeSessionId: string | null          // current chat session
  messages: ChatMessage[]                 // chat history for active session
  planningPhase: PlanningPhase | null     // drives inline loading indicator
  routeOptions: PlannedRouteOptionsView | null
  selectedRouteId: string | null
  sketchCoordinates: Array<{ latitude: number; longitude: number }> | null
  isSidebarOpen: boolean                  // drives SessionSidebar visibility
  isSessionViewExpanded: boolean          // ChatSessionView expanded state
  overlayMessageVisible: boolean          // ChatMessageOverlay auto-dismiss tracking
}

type PlanningPhase =
  | 'reading'     // "Reading your ride..."
  | 'finding'     // "Finding scenic roads..."
  | 'weather'     // "Checking weather along the route..."
  | 'building'    // "Building your options..."

type ChatMessage = {
  id: string
  role: 'rider' | 'system'
  text: string
  timestamp: number
  /** Route attachment cards for system messages */
  routeAttachments?: RouteAttachment[]
  /** Error flag for UC-NLP-11 error messages */
  isError?: boolean
}

type RouteAttachment = {
  routeOptionId: string
  label: string
  distanceMi: number
  durationMin: number
  scenicScore: number          // 1-5
  weatherCondition: WeatherCondition | null
  weatherLabel: string | null
  isBestForToday: boolean
}
```

---

## 1. ChatInput

**File**: `components/chat/chat-input.tsx`
**Replaces**: `DescribeRideBar`, `NlpInputSheet` (V1.0 components)

Always-visible floating bar at the bottom of the map screen. This is the primary interaction point for riders.

### Props interface

```typescript
export type ChatInputProps = {
  /** Current text value */
  value: string
  onChangeText: (text: string) => void
  /** Called when user taps send or presses enter */
  onSend: () => void
  /** Called when user taps the expand chevron */
  onExpand: () => void
  /** Called when user taps the manual mode icon */
  onManualMode: () => void
  /** Resolved GPS label, e.g. "Near Asheville, NC" */
  locationLabel: string | null
  /** Whether planning is in progress (disables send) */
  isLoading: boolean
  /** Whether there is an active session with results */
  hasActiveSession: boolean
  /** Suggestion chips shown when idle with no active session */
  suggestions: string[]
  onSuggestionPress: (suggestion: string) => void
  testID?: string
}
```

### Layout

```
┌──────────────────────────────────────────────┐
│ [Suggestion chips row — horizontal scroll]    │  ← only when idle, no session
├──────────────────────────────────────────────┤
│ [▲] [Near Asheville, NC | message...] [→]    │  ← input bar
└──────────────────────────────────────────────┘
```

- Root: `View`, `position: 'absolute'`, `bottom: 0`, `left: 0`, `right: 0`, `paddingBottom: safeAreaInsets.bottom + semantic.space.sm`, `paddingHorizontal: semantic.space.md`
- Suggestion chips row (above bar, shown only when `!hasActiveSession && value.length === 0`):
  - `ScrollView horizontal`, `showsHorizontalScrollIndicator: false`
  - `contentContainerStyle: { flexDirection: 'row', gap: semantic.space.sm, paddingBottom: semantic.space.sm }`
  - Chip style: `height: 36`, `paddingHorizontal: 12`, `borderRadius: 18`, `backgroundColor: semantic.color.surface.default`, `borderWidth: 1`, `borderColor: semantic.color.border.default`
  - Chip text: `Text` variant `labelSmall`, `color: semantic.color.onSurface.muted`
  - Default suggestions: `["Twisty back roads", "Mountain passes", "Coastal cruise", "Half-day loop", "Scenic loop near me"]`
  - On press: sets input value to chip text
- Input bar container: `View`, `flexDirection: 'row'`, `alignItems: 'center'`, `gap: semantic.space.sm`
  - `backgroundColor: semantic.color.surface.default`
  - `borderRadius: semantic.radius.xl`
  - `borderWidth: 1`, `borderColor: semantic.color.border.default`
  - `paddingHorizontal: semantic.space.md`
  - `height: 52`
  - `shadowColor: '#000'`, `shadowOpacity: 0.1`, `shadowRadius: 8`, `shadowOffset: { width: 0, height: -2 }`, `elevation: 4`
- Left: expand chevron `Pressable` (min 44x44 touch target)
  - `IconSymbol name="chevron-up"` size 18, `color: semantic.color.onSurface.muted`
  - `onPress → onExpand`
- Center: `TextInput` (React Native core)
  - `flex: 1`
  - `singleline` (no multiline)
  - `placeholder`: when `locationLabel` exists: `"Plan a ride from ${locationLabel}..."`, else: `"Describe your ride..."`
  - `placeholderTextColor: semantic.color.onSurface.subtle`
  - `color: semantic.color.onSurface.default`
  - `fontSize: 15`
  - `returnKeyType: 'send'`
  - `onSubmitEditing → onSend` (when value is non-empty)
- Right: send button `Pressable` (min 44x44 touch target)
  - When `value.trim().length > 0 && !isLoading`:
    - `IconSymbol name="arrow-up-circle-fill"` size 28, `color: semantic.color.primary.default`
  - When `isLoading`:
    - `ActivityIndicator` size 20, `color: semantic.color.primary.default`
  - When empty:
    - Manual mode icon: `IconSymbol name="sliders"` size 20, `color: semantic.color.onSurface.muted`
    - `onPress → onManualMode`
  - `onPress → onSend` (when value present)

### Theme tokens

| Token | Usage |
|-------|-------|
| `semantic.color.surface.default` | Bar background, chip background |
| `semantic.color.border.default` | Bar border, chip border |
| `semantic.color.primary.default` | Send icon |
| `semantic.color.onSurface.default` | Input text |
| `semantic.color.onSurface.subtle` | Placeholder text |
| `semantic.color.onSurface.muted` | Expand icon, manual icon, chip text |
| `semantic.radius.xl` | Bar rounding |
| `semantic.space.md` | Horizontal padding |
| `semantic.space.sm` | Chip gap, bar internal gap |

### Interaction behavior

- Send button enabled only when `value.trim().length > 0` and `!isLoading`
- Keyboard return key triggers send
- Expand chevron opens `ChatSessionView` as an expanded overlay
- When idle with no session: suggestion chips visible above the bar
- When active session exists: chips hidden, input ready for refinement
- Manual mode icon (sliders) visible only when input is empty — opens PlanRideSheet as fallback

### testID conventions

| testID | Element |
|--------|---------|
| `chat-input` | Root `View` |
| `chat-input-text` | `TextInput` |
| `chat-input-send` | Send `Pressable` |
| `chat-input-expand` | Expand chevron `Pressable` |
| `chat-input-manual` | Manual mode `Pressable` |
| `chat-input-suggestion-{index}` | Each suggestion chip |

---

## 2. ChatMessageOverlay

**File**: `components/chat/chat-message-overlay.tsx`

Temporary AI response card overlaying the map. Shown after planning completes with route results.

### Props interface

```typescript
export type ChatMessageOverlayProps = {
  /** The AI response text */
  message: string
  /** Route attachment cards to display inline */
  routeAttachments: RouteAttachment[]
  /** Currently selected route ID */
  selectedRouteId: string | null
  onSelectRoute: (routeOptionId: string) => void
  onViewDetails: (routeOptionId: string) => void
  onNavigate: (routeOptionId: string) => void
  onSaveRoute: (routeOptionId: string) => void
  /** Called when overlay is dismissed */
  onDismiss: () => void
  /** Whether the overlay is visible */
  isVisible: boolean
  testID?: string
}
```

### Layout

```
┌─────────────────────────────┐
│ AI response text             │  ← top-left, semi-transparent card
│                              │
│ ┌──────────────────────────┐│
│ │ RouteAttachmentCard #1   ││  ← inline compact cards
│ └──────────────────────────┘│
│ ┌──────────────────────────┐│
│ │ RouteAttachmentCard #2   ││
│ └──────────────────────────┘│
└─────────────────────────────┘
```

- Root: `Animated.View`, `position: 'absolute'`, `top: safeAreaInsets.top + semantic.space.md`, `left: semantic.space.md`, `right: semantic.space['2xl']`
  - Entry animation: `translateY` from `-20` to `0`, opacity `0` to `1`, duration 300ms, `Easing.out(Easing.cubic)`
  - Exit animation (auto-dismiss): opacity fade-out 200ms
  - Exit animation (swipe): `translateY` to `-40`, opacity to `0`, 200ms
- Card container: `View`
  - `backgroundColor: semantic.color.surface.default` at 92% opacity (append `EB` hex alpha)
  - `borderRadius: semantic.radius.lg`
  - `padding: semantic.space.md`
  - `shadowColor: '#000'`, `shadowOpacity: 0.15`, `shadowRadius: 12`, `shadowOffset: { width: 0, height: 4 }`, `elevation: 6`
  - Backdrop blur effect via `blurRadius` if available, else solid background
- AI text: `Text` variant `bodyMedium`, `color: semantic.color.onSurface.default`, `marginBottom: semantic.space.sm`
- Route attachment cards: `View`, `gap: semantic.space.sm`
  - Each card: `<RouteAttachmentCard>` component

### Auto-dismiss behavior

- Overlay auto-dismisses after 5 seconds unless:
  - User taps the overlay (pins it — remains visible until manually swiped away)
  - User is interacting with a route attachment card
- Swipe up gesture dismisses immediately
- `PanResponder` handles swipe detection: if `dy < -30`, trigger dismiss animation

### Theme tokens

| Token | Usage |
|-------|-------|
| `semantic.color.surface.default` | Card background (with alpha) |
| `semantic.color.onSurface.default` | AI text |
| `semantic.radius.lg` | Card rounding |
| `semantic.space.md` | Card padding, top offset |
| `semantic.space.sm` | Card internal gap |
| `semantic.space['2xl']` | Right margin (keeps overlay away from map controls) |

### testID conventions

| testID | Element |
|--------|---------|
| `chat-message-overlay` | Root `Animated.View` |
| `chat-message-overlay-text` | AI text `Text` |
| `chat-message-overlay-cards` | Route cards container |

---

## 3. ChatSessionView

**File**: `components/chat/chat-session-view.tsx`

Expanded scrollable chat history. Opened via the expand chevron on `ChatInput`. Shows the map partially behind (bottom sheet style).

### Props interface

```typescript
export type ChatSessionViewProps = {
  isVisible: boolean
  onClose: () => void
  messages: ChatMessage[]
  /** Current input value (shared with ChatInput) */
  inputValue: string
  onInputChange: (text: string) => void
  onSend: () => void
  isLoading: boolean
  selectedRouteId: string | null
  onSelectRoute: (routeOptionId: string) => void
  onViewDetails: (routeOptionId: string) => void
  onNavigate: (routeOptionId: string) => void
  onSaveRoute: (routeOptionId: string) => void
  testID?: string
}
```

### Layout

```
BottomSheetWrapper preset="three-quarter"
└─ View (flex: 1, column)
   ├─ SheetHandle
   ├─ FlatList (flex: 1, messages)
   │  ├─ [rider message]  → right-aligned bubble
   │  ├─ [system message] → left-aligned bubble
   │  │  └─ RouteAttachmentCard (inline)
   │  ├─ [system message] → left-aligned bubble
   │  └─ [typing indicator] → left-aligned, when loading
   └─ View (input row at bottom)
      └─ TextInput + Send button (mirrors ChatInput layout)
```

- Root: `BottomSheetWrapper preset="three-quarter"` (≈75% height, map visible above)
- Message list: `FlatList`
  - `inverted: false`
  - `contentContainerStyle: { paddingHorizontal: semantic.space.md, paddingBottom: semantic.space.md }`
  - Auto-scroll to bottom on new message via `ref.scrollToEnd({ animated: true })`
- Rider message bubble:
  - `View`, `alignSelf: 'flex-end'`, `maxWidth: '80%'`
  - `backgroundColor: semantic.color.primary.default`
  - `borderRadius: semantic.radius.lg`
  - `padding: semantic.space.md`
  - Text: `Text` variant `bodyMedium`, `color: semantic.color.onPrimary.default`
- System message bubble:
  - `View`, `alignSelf: 'flex-start'`, `maxWidth: '85%'`
  - `backgroundColor: semantic.color.surfaceVariant.default`
  - `borderRadius: semantic.radius.lg`
  - `padding: semantic.space.md`
  - Text: `Text` variant `bodyMedium`, `color: semantic.color.onSurface.default`
  - Error messages: `borderLeftWidth: 3`, `borderLeftColor: semantic.color.danger.default`
  - Route attachments rendered below text within the same bubble container, `marginTop: semantic.space.sm`
- Typing indicator (when `isLoading`):
  - `View`, `alignSelf: 'flex-start'`
  - `backgroundColor: semantic.color.surfaceVariant.default`
  - `borderRadius: semantic.radius.lg`
  - `padding: semantic.space.md`
  - Three animated dots: `Animated.View` circles, size 8, `backgroundColor: semantic.color.onSurface.muted`
  - Dots animate opacity in staggered sequence: 0.3 → 1.0 → 0.3, each offset by 200ms
- Bottom input row: mirrors `ChatInput` bar layout but without expand chevron, positioned inside the sheet

### Theme tokens

| Token | Usage |
|-------|-------|
| `semantic.color.primary.default` | Rider bubble background |
| `semantic.color.onPrimary.default` | Rider bubble text |
| `semantic.color.surfaceVariant.default` | System bubble background, typing indicator |
| `semantic.color.onSurface.default` | System bubble text |
| `semantic.color.onSurface.muted` | Typing dots, timestamps |
| `semantic.color.danger.default` | Error message border |
| `semantic.radius.lg` | Bubble rounding |
| `semantic.space.md` | Bubble padding, list horizontal padding |
| `semantic.space.sm` | Attachment margin-top, message gap |

### testID conventions

| testID | Element |
|--------|---------|
| `chat-session-view` | Root wrapper |
| `chat-message-list` | `FlatList` |
| `chat-message-{id}` | Each message bubble |
| `chat-typing-indicator` | Typing indicator |
| `chat-session-input` | Bottom input `TextInput` |
| `chat-session-send` | Bottom send button |

---

## 4. SessionSidebar

**File**: `components/chat/session-sidebar.tsx`

Left slide-out drawer showing session history. Opened via hamburger icon or left edge swipe.

### Props interface

```typescript
export type SessionListItem = {
  sessionId: string
  title: string           // First rider message, truncated to 40 chars
  createdAt: number       // timestamp
  routeCount: number      // number of route options in session
  isActive: boolean
}

export type SessionSidebarProps = {
  isVisible: boolean
  onClose: () => void
  sessions: SessionListItem[]
  activeSessionId: string | null
  onSelectSession: (sessionId: string) => void
  onNewSession: () => void
  testID?: string
}
```

### Layout

```
┌────────────────────────┬──────────────────────────┐
│ Session Sidebar         │                          │
│                         │      (map visible,       │
│ [+ New Session]         │       dimmed overlay)    │
│                         │                          │
│ ● Today's ride          │                          │
│   3 routes · 2h ago     │                          │
│                         │                          │
│   Mountain loop         │                          │
│   2 routes · yesterday  │                          │
│                         │                          │
│   Coastal cruise        │                          │
│   1 route · Mar 30      │                          │
│                         │                          │
└────────────────────────┴──────────────────────────┘
```

- Root: `Animated.View`, `position: 'absolute'`, `top: 0`, `bottom: 0`, `left: 0`, `width: 300`
  - Entry animation: `translateX` from `-300` to `0`, duration 250ms, `Easing.out(Easing.cubic)`
  - Exit animation: `translateX` from `0` to `-300`, duration 200ms
  - `backgroundColor: semantic.color.surface.default`
  - `shadowColor: '#000'`, `shadowOpacity: 0.2`, `shadowRadius: 16`, `shadowOffset: { width: 4, height: 0 }`, `elevation: 8`
- Scrim overlay (behind sidebar, covers map): `Pressable`, `position: 'absolute'`, full screen
  - `backgroundColor: '#00000040'` (25% black)
  - `onPress → onClose`
- Header: `View`, `flexDirection: 'row'`, `justifyContent: 'space-between'`, `alignItems: 'center'`, `paddingHorizontal: semantic.space.lg`, `paddingTop: safeAreaInsets.top + semantic.space.md`
  - Title: `Text` variant `titleMedium`, `color: semantic.color.onSurface.default`, text `"Sessions"`
  - Close button: `Pressable`, `IconSymbol name="xmark"` size 20
- New session button: `Button variant="outline" size="md"` full-width, `marginHorizontal: semantic.space.lg`, `marginVertical: semantic.space.md`
  - `icon={<IconSymbol name="plus" size={16} />}`
  - Children: `"New Session"`
  - `testID="sidebar-new-session"`
- Session list: `FlatList`
  - `contentContainerStyle: { paddingHorizontal: semantic.space.lg }`
  - Each item: `Pressable`, `paddingVertical: semantic.space.md`, `borderBottomWidth: 1`, `borderBottomColor: semantic.color.border.default`
    - Active session: `backgroundColor: semantic.color.primary.default` at 10% opacity (append `1A` hex alpha)
    - Active indicator: `View`, `width: 4`, `height: '100%'`, `backgroundColor: semantic.color.primary.default`, `borderRadius: 2`, `position: 'absolute'`, `left: -semantic.space.lg`
    - Title: `Text` variant `labelLarge`, `color: semantic.color.onSurface.default`, single line, `numberOfLines: 1`
    - Subtitle: `Text` variant `labelSmall`, `color: semantic.color.onSurface.muted`
      - Format: `"{routeCount} route{s} · {relative time}"`
    - Route count badge: `View`, `minWidth: 20`, `height: 20`, `borderRadius: 10`, `backgroundColor: semantic.color.primary.default`, `position: 'absolute'`, `right: 0`, `top: semantic.space.md`
      - `Text` variant `labelSmall`, `color: semantic.color.onPrimary.default`, `textAlign: 'center'`

### Gesture handling

- Left edge swipe to open: `PanResponder` on `HomeMapScreen` detects `dx > 30` starting from `x < 20` → opens sidebar
- Swipe left on sidebar to close: `PanResponder` on sidebar detects `dx < -30` → triggers close animation

### Theme tokens

| Token | Usage |
|-------|-------|
| `semantic.color.surface.default` | Sidebar background |
| `semantic.color.primary.default` | Active indicator, route count badge, active bg (with alpha) |
| `semantic.color.onPrimary.default` | Badge text |
| `semantic.color.onSurface.default` | Session title, header title |
| `semantic.color.onSurface.muted` | Session subtitle |
| `semantic.color.border.default` | Session dividers |
| `semantic.space.lg` | Horizontal padding |
| `semantic.space.md` | Vertical padding, header top spacing |

### testID conventions

| testID | Element |
|--------|---------|
| `session-sidebar` | Root `Animated.View` |
| `session-sidebar-scrim` | Background overlay `Pressable` |
| `sidebar-new-session` | New Session button |
| `sidebar-session-{sessionId}` | Each session row |
| `sidebar-close` | Close button |

---

## 5. RouteAttachmentCard

**File**: `components/chat/route-attachment-card.tsx`

Compact route card rendered inline within chat messages. Reuses data from existing `RouteOptionCard` but styled for chat context.

### Props interface

```typescript
export type RouteAttachmentCardProps = {
  routeOptionId: string
  label: string
  distanceMi: number
  durationMin: number
  scenicScore: number             // 1-5
  weatherCondition: WeatherCondition | null
  weatherLabel: string | null
  isBestForToday: boolean
  isSelected: boolean
  onSelect: () => void
  onViewDetails: () => void
  onNavigate: () => void
  onSave: () => void
  testID?: string
}
```

### Layout

```
┌─────────────────────────────────────────────┐
│ ★ Best for today                             │  ← badge row (conditional)
├─────────────────────────────────────────────┤
│ Mountain Pass via 441        [WeatherBadge]  │  ← label + weather
│ 2h 15m · 94 mi · scenic ●●●○○               │  ← stats row
├─────────────────────────────────────────────┤
│ [Save]                         [Navigate →]  │  ← action row
└─────────────────────────────────────────────┘
```

- Root: `Pressable`, `onPress → onSelect`
  - `backgroundColor: semantic.color.surface.default`
  - Selected: `borderWidth: 2`, `borderColor: semantic.color.primary.default`
  - Unselected: `borderWidth: 1`, `borderColor: semantic.color.border.default`
  - `borderRadius: semantic.radius.md`
  - `padding: semantic.space.sm`
  - `width: '100%'`
- "Best for today" badge (shown when `isBestForToday`):
  - `View`, `flexDirection: 'row'`, `alignItems: 'center'`, `gap: 4`, `marginBottom: semantic.space.xs`
  - `IconSymbol name="star-fill"` size 12, `color: semantic.color.warning.default`
  - `Text` variant `labelSmall`, `color: semantic.color.warning.default`, text: `"Best for today"`
  - Badge entrance: staggered `Animated.timing` — `opacity` 0→1 and `translateY` 4→0, duration 300ms, delay 400ms after card renders
- Label row: `View`, `flexDirection: 'row'`, `justifyContent: 'space-between'`, `alignItems: 'center'`
  - Route label: `Text` variant `labelLarge`, `color: semantic.color.onSurface.default`, `flex: 1`, `numberOfLines: 1`
  - `RouteWeatherBadge` (right side, when `weatherCondition` is non-null)
- Stats row: `View`, `flexDirection: 'row'`, `alignItems: 'center'`, `gap: semantic.space.xs`, `marginTop: 2`
  - Duration: `Text` variant `labelSmall`, `color: semantic.color.onSurface.muted`
  - Separator: `Text` variant `labelSmall`, `color: semantic.color.onSurface.subtle`, text `"·"`
  - Distance: `Text` variant `labelSmall`, `color: semantic.color.onSurface.muted`
  - Separator: same
  - Scenic: `Text` variant `labelSmall`, `color: semantic.color.onSurface.muted`
    - Rendered as filled/empty dots: `"scenic "` + `"●"` repeated `scenicScore` times + `"○"` repeated `5 - scenicScore` times
- Action row: `View`, `flexDirection: 'row'`, `justifyContent: 'space-between'`, `marginTop: semantic.space.sm`, `borderTopWidth: 1`, `borderTopColor: semantic.color.border.default`, `paddingTop: semantic.space.sm`
  - Save button: `Pressable`, `flexDirection: 'row'`, `alignItems: 'center'`, `gap: 4`
    - `IconSymbol name="bookmark"` size 14, `color: semantic.color.onSurface.muted`
    - `Text` variant `labelSmall`, `color: semantic.color.onSurface.muted`, text: `"Save"`
    - `onPress → onSave`
  - Navigate button: `Pressable`, `flexDirection: 'row'`, `alignItems: 'center'`, `gap: 4`
    - `Text` variant `labelSmall`, `color: semantic.color.primary.default`, text: `"Navigate"`
    - `IconSymbol name="arrow-right"` size 14, `color: semantic.color.primary.default`
    - `onPress → onNavigate`

### Haptic feedback

- `onSelect`: light impact (`Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)`)
- `onSave`: medium impact (`Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)`)

### Theme tokens

| Token | Usage |
|-------|-------|
| `semantic.color.surface.default` | Card background |
| `semantic.color.primary.default` | Selected border, navigate text/icon |
| `semantic.color.border.default` | Unselected border, action row divider |
| `semantic.color.warning.default` | "Best for today" badge |
| `semantic.color.onSurface.default` | Route label |
| `semantic.color.onSurface.muted` | Stats text, save button |
| `semantic.color.onSurface.subtle` | Dot separator |
| `semantic.radius.md` | Card rounding |
| `semantic.space.sm` | Card padding, action row gap/padding |
| `semantic.space.xs` | Stats row gap, badge row gap |

### Skeleton loading

While route data is loading, render a skeleton variant:
- Same card dimensions
- Animated shimmer effect: `Animated.loop` driving `translateX` on a gradient overlay
- Three placeholder lines: label (60% width), stats (40% width), action row (full width)
- `backgroundColor: semantic.color.surfaceVariant.default`

### testID conventions

| testID | Element |
|--------|---------|
| `route-attachment-card-{routeOptionId}` | Root `Pressable` |
| `route-attachment-badge-{routeOptionId}` | "Best for today" badge |
| `route-attachment-save-{routeOptionId}` | Save button |
| `route-attachment-navigate-{routeOptionId}` | Navigate button |

---

## 6. RouteWeatherBadge

**File**: `components/ui/route-weather-badge.tsx`

Compact inline badge shown within `RouteAttachmentCard` and `RouteDetailsSheet`.

### Props interface

```typescript
export type WeatherCondition = 'clear' | 'rain' | 'temp-high' | 'temp-low' | 'wind'

export type RouteWeatherBadgeProps = {
  condition: WeatherCondition
  /** Short label: "Rain 2pm", "92°F", "38°F", "25mph" */
  label: string
  testID?: string
}
```

### Layout

- `View`, `flexDirection: 'row'`, `alignItems: 'center'`, `gap: 4`
- `height: 24`, `paddingHorizontal: semantic.space.sm`, `borderRadius: semantic.radius.sm`
- Left: `IconSymbol` size 14
- Right: `Text` variant `labelSmall`

### Condition → visual mapping

| condition | icon name | background | text/icon color |
|-----------|-----------|-----------|-----------------|
| `'clear'` | — (render `null`) | — | — |
| `'rain'` | `"weather-rainy"` | `semantic.color.danger.default` at 15% opacity | `semantic.color.danger.default` |
| `'temp-high'` | `"thermometer"` | `semantic.color.warning.default` at 15% opacity | `semantic.color.warning.default` |
| `'temp-low'` | `"thermometer"` | `semantic.color.info.default` at 15% opacity | `semantic.color.info.default` |
| `'wind'` | `"weather-windy"` | `semantic.color.warning.default` at 15% opacity | `semantic.color.warning.default` |

Background opacity is achieved with hex alpha suffix (e.g., `color + '26'` for ~15%).

### Theme tokens

| Token | Usage |
|-------|-------|
| `semantic.color.danger.default` | Rain badge |
| `semantic.color.warning.default` | Temp-high and wind badges |
| `semantic.color.info.default` | Temp-low badge |
| `semantic.radius.sm` | Badge rounding |
| `semantic.space.sm` | Horizontal padding |

### testID conventions

| testID | Element |
|--------|---------|
| `route-weather-badge` | Root `View` |
| `route-weather-badge-icon` | `IconSymbol` |
| `route-weather-badge-label` | `Text` |

---

## 7. WeatherTimelineSheet

**File**: `components/sheets/weather-timeline-sheet.tsx`

Expandable half-sheet showing hourly weather for a selected route. Opens from route detail view.

### Props interface

```typescript
export type WeatherHour = {
  hour: string          // "2pm", "3pm"
  tempF: number
  precipProbability: number  // 0-100
  condition: WeatherCondition
}

export type WeatherTimelineSheetProps = {
  isVisible: boolean
  onClose: () => void
  routeLabel: string
  /** Departure time for the route */
  departureTime: Date
  /** Estimated arrival time */
  arrivalTime: Date
  hours: WeatherHour[]
  /** Called when user taps "Adjust departure" */
  onAdjustDeparture: (suggestedTime: Date) => void
  testID?: string
}
```

### Layout

```
BottomSheetWrapper preset="half"
└─ BottomSheetScrollView
   ├─ SheetHandle
   ├─ View (row): routeLabel (titleMedium) + "for this route" (bodySmall, muted)
   ├─ View (row): departure time → arrival time chip
   ├─ [Chart area] Hourly weather visualization
   ├─ Divider
   └─ Button variant="outline" "Adjust departure to avoid rain"
```

**Chart area**

- `ScrollView horizontal` containing a simple bar chart or line chart
- Implementation: use `react-native-gifted-charts` `LineChart` or `BarChart` if already installed, otherwise a custom `View`-based bar chart is acceptable
- X-axis: hour labels (`hours[].hour`)
- Y-axis: temperature (°F) as a line, precipitation probability as semi-transparent bars behind the line
- Bar color: `semantic.color.danger.default` at 30% opacity for precip
- Line color: `semantic.color.primary.default`
- Chart height: 120, width scrollable based on number of hours
- If `react-native-gifted-charts` is not installed, render a simplified version: a `ScrollView` with hourly `View` blocks showing `IconSymbol` (weather condition) + temperature + precip percentage stacked vertically

**Departure adjustment button**

- Shown only when at least one hour has `precipProbability > 50`
- `Button variant="outline"` full-width
- Text: `"Adjust departure to avoid rain → [suggestedTime]"`
- Suggested time: first hour after the rain window where `precipProbability < 30`
- `testID="weather-adjust-departure"`

### Theme tokens

| Token | Usage |
|-------|-------|
| `semantic.color.primary.default` | Temperature line |
| `semantic.color.danger.default` | Precipitation bars |
| `semantic.color.onSurface.default` | Labels |
| `semantic.color.onSurface.muted` | Secondary text |
| `semantic.space.lg` | Sheet horizontal padding |

### testID conventions

| testID | Element |
|--------|---------|
| `weather-timeline-sheet` | Root wrapper |
| `weather-chart` | Chart container |
| `weather-adjust-departure` | Adjust departure button |

---

## 8. AnimatedSketchPolyline

**File**: `components/map/animated-sketch-polyline.tsx`
**Used by**: `HomeMapScreen` when `planningStatus === 'planning'`

Wraps `react-native-maps` `Polyline` with a dash-offset animation simulating a "drawing" effect.

### Props interface

```typescript
export type AnimatedSketchPolylineProps = {
  /** Approximate bounding-box coordinates — not the final route */
  coordinates: Array<{ latitude: number; longitude: number }>
  /** Whether the animation is running */
  isAnimating: boolean
  testID?: string
}
```

### Implementation notes

- Uses `Animated.Value` driving a JS-side `strokeDashOffset` simulation
- Since `react-native-maps` `Polyline` does not natively support `strokeDashOffset` animation, the component draws the path progressively by slicing `coordinates` array from 0 to `n`, where `n` is driven by `Animated.timing` over 2000ms with `useNativeDriver: false`
- `strokeColor`: `semantic.color.primary.default` at 40% opacity — construct as `primaryColor + '66'` (hex alpha)
- `strokeWidth: 3`
- `lineDashPattern: [8, 6]`
- Loops continuously via `Animated.loop` while `isAnimating`
- Renders `null` when `coordinates.length === 0`

### Coordinate generation

`HomeMapScreen` is responsible for producing the sketch coordinates from the bounding box of the rider's start point and (optionally) destination. A simple diagonal with noise is sufficient — this is purely visual. Example helper:

```typescript
// Generates a rough S-curve path between start and (optional) end
function buildSketchCoordinates(
  start: { lat: number; lng: number },
  end?: { lat: number; lng: number }
): Array<{ latitude: number; longitude: number }>
```

The helper lives in `HomeMapScreen` as a local constant, not exported.

### Theme tokens

| Token | Usage |
|-------|-------|
| `semantic.color.primary.default` | Polyline stroke color (+ hex alpha `66`) |

### testID conventions

| testID | Element |
|--------|---------|
| `animated-sketch-polyline` | Wrapping `View` (polylines don't support testID natively) |

---

## 9. OverlayToggle

**File**: `components/map/overlay-toggle.tsx`
**Used by**: `HomeMapScreen` for switching between wind/rain/temp overlays on the map

Existing component — no structural changes for V1.1. Continues to function as a map control for toggling weather overlay layers.

---

## 10. Modified: HomeMapScreen (`app/(app)/(tabs)/index.tsx`)

### State additions

Replace old `PlanningState` with the new chat-session model:

```typescript
activeSessionId: string | null             // default null
messages: ChatMessage[]                    // default []
planningPhase: PlanningPhase | null        // default null
sketchCoordinates: Array<{ latitude: number; longitude: number }> | null  // default null
isSidebarOpen: boolean                     // default false
isSessionViewExpanded: boolean             // default false
overlayMessageVisible: boolean             // default false
```

Add to `Action` discriminated union:

```typescript
| { type: 'setActiveSession'; payload: { sessionId: string; messages: ChatMessage[] } }
| { type: 'addMessage'; payload: ChatMessage }
| { type: 'setPlanningPhase'; payload: PlanningPhase | null }
| { type: 'setSketchCoordinates'; payload: Array<{ latitude: number; longitude: number }> | null }
| { type: 'setSidebarOpen'; payload: boolean }
| { type: 'setSessionViewExpanded'; payload: boolean }
| { type: 'setOverlayMessageVisible'; payload: boolean }
| { type: 'clearSession'; payload: undefined }
```

### Component substitutions

| Remove | Replace with |
|--------|-------------|
| `<FloatingSearchInput>` | — (no longer needed) |
| `<DescribeRideBar>` | `<ChatInput>` (always visible at bottom) |
| `<NlpInputSheet>` | `<ChatSessionView>` (expanded view) |
| `<RoutePlannerLoading>` | Inline typing indicator in chat |
| `<RouteResultsTray>` | `<ChatMessageOverlay>` + `<RouteAttachmentCard>` in messages |

### Map layout

```
┌────────────────────────────────┐
│ [≡] (sidebar)     [+ New]      │  ← map header buttons
│                                 │
│ ┌─────────────┐                │
│ │ AI message   │  ← temporary  │
│ │ overlay      │    top-left   │
│ └─────────────┘                │
│                                 │
│      [MAP WITH ROUTES]          │
│                                 │
│ ┌──────────────────────────┐   │
│ │ [▲] [message........] [→]│   │  ← ChatInput (always visible)
│ └──────────────────────────┘   │
└────────────────────────────────┘
```

Add to header (top bar):
- Left: hamburger menu `Pressable`, `IconSymbol name="line-3-horizontal"` size 24
  - `onPress → dispatch({ type: 'setSidebarOpen', payload: true })`
  - `testID="map-sidebar-button"`
- Right: "New Session" `Pressable`, `IconSymbol name="plus"` size 20
  - `onPress → dispatch({ type: 'clearSession' })`
  - `testID="map-new-session-button"`

Add to render:

```tsx
{/* Sketch animation during planning */}
{state.planningStatus === 'planning' && state.sketchCoordinates && (
  <AnimatedSketchPolyline
    coordinates={state.sketchCoordinates}
    isAnimating={true}
    testID="planning-sketch-polyline"
  />
)}

{/* Chat message overlay after results */}
{state.overlayMessageVisible && state.planningStatus === 'route_results' && (
  <ChatMessageOverlay
    message={lastSystemMessage.text}
    routeAttachments={lastSystemMessage.routeAttachments ?? []}
    selectedRouteId={state.selectedRouteId}
    onSelectRoute={handleSelectRoute}
    onViewDetails={handleViewDetails}
    onNavigate={handleNavigate}
    onSaveRoute={handleSave}
    onDismiss={() => dispatch({ type: 'setOverlayMessageVisible', payload: false })}
    isVisible={true}
    testID="chat-overlay"
  />
)}

{/* Session sidebar */}
<SessionSidebar
  isVisible={state.isSidebarOpen}
  onClose={() => dispatch({ type: 'setSidebarOpen', payload: false })}
  sessions={sessions}
  activeSessionId={state.activeSessionId}
  onSelectSession={handleSelectSession}
  onNewSession={handleNewSession}
  testID="session-sidebar"
/>

{/* Chat input — always rendered */}
<ChatInput
  value={inputValue}
  onChangeText={setInputValue}
  onSend={handleSend}
  onExpand={() => dispatch({ type: 'setSessionViewExpanded', payload: true })}
  onManualMode={handleManualMode}
  locationLabel={locationLabel}
  isLoading={state.planningStatus === 'planning'}
  hasActiveSession={state.activeSessionId !== null}
  suggestions={defaultSuggestions}
  onSuggestionPress={handleSuggestionPress}
  testID="chat-input"
/>

{/* Expanded chat session view */}
<ChatSessionView
  isVisible={state.isSessionViewExpanded}
  onClose={() => dispatch({ type: 'setSessionViewExpanded', payload: false })}
  messages={state.messages}
  inputValue={inputValue}
  onInputChange={setInputValue}
  onSend={handleSend}
  isLoading={state.planningStatus === 'planning'}
  selectedRouteId={state.selectedRouteId}
  onSelectRoute={handleSelectRoute}
  onViewDetails={handleViewDetails}
  onNavigate={handleNavigate}
  onSaveRoute={handleSave}
  testID="chat-session-view"
/>
```

### Alternative route polylines

When `planningStatus === 'route_results'` and `routeOptions` contains multiple options:

```typescript
const allPolylines = useMemo(() => {
  if (!state.routeOptions?.options) return []
  return state.routeOptions.options.flatMap((option, idx) => {
    const isSelected = option.routeOptionId === state.selectedRouteId
    return buildRoutePolylines({
      route: { overviewGeometry: option.map.overviewGeometry, legs: option.map.legs },
      variant: isSelected ? 'selected' : 'alternate',
      semantic,
    })
  })
}, [state.routeOptions, state.selectedRouteId, semantic])
```

`buildRoutePolylines` with `variant: 'alternate'` should produce:
- `strokeColor: semantic.color.routeAlternate.default` (or primary at 35% opacity)
- `strokeWidth: 3`
- `lineDashPattern: [6, 4]`

### Map tap on alternate polyline

`onMapClick` handler extended:

```typescript
// When status is 'route_results', check if tapped coordinate is near an alternate polyline
// If within threshold (~50m), select that route
// This reserves the handler slot per the UX spec
```

This is a post-MVP refinement but the `onMapClick` handler must not be used for point placement when `planningStatus === 'route_results'`.

---

## 11. Modified: Saved Routes Screen (`app/(app)/(tabs)/saved-routes.tsx`)

### Current state

The screen is functional: `FlatList` of `SavedRouteCard` components with search, date filtering, swipe-to-delete, and empty states. The `SubpageLayout` wrapper is missing — the screen uses a raw `View` root.

### Required polish

1. **Wrap in SubpageLayout**: Replace the root `View` with `SubpageLayout title="Saved Routes" testID="saved-routes-screen"`. Remove the standalone `FilterHeader` sticky behavior since `SubpageLayout` manages the header. The `FilterHeader` becomes a non-sticky `ListHeaderComponent`.

   > Note: Verify `SubpageLayout` does not break the existing filter UX before committing. If sticky filter header is important, keep raw `View` and add a manual header matching `SubpageLayout` visual style.

2. **Empty state CTA**: Update to open chat input with pre-filled suggestion by navigating with a query param: `router.push('/(app)/(tabs)?startChat=true')`. `HomeMapScreen` reads this param and focuses the `ChatInput` on mount.

3. **Route detail navigation**: No changes required — `/(app)/saved-route/[id]` is the existing detail route. Verify `SubpageLayout` is used there.

### SavedRouteCard enhancements (if polish time exists)

- Add a `RouteWeatherBadge` to the card when the route has a recent weather snapshot stored
- Show a `"Best for today"` conditions badge when the saved route has been re-evaluated with today's weather (V1 nice-to-have)

---

## 12. Modified: Saved Route Detail (`app/(app)/saved-route/[id].tsx`)

No structural changes required for V1. Verify:

- Uses `SubpageLayout`
- The `RouteOptionCard variant="selected"` displays correctly
- "Ride this route" CTA navigates to home screen and pre-fills the saved route

---

## 13. Favorite Roads Settings (`app/(app)/(tabs)/settings.tsx` + sub-screen)

### Current state

The `settings.tsx` screen has a Favorite Roads section (from US-045). The section exists but may lack polish.

### Required polish

Per UX spec, Favorite Roads is a personalization moat. The settings entry point should:

1. **List entry**: `settings.tsx` shows a `Pressable` row "Favorite Roads" with a chevron, leading to a dedicated screen
2. **Favorite Roads screen** (`app/(app)/favorite-roads.tsx`):
   - Uses `SubpageLayout title="Favorite Roads"`
   - `FlatList` of `FavoriteRoadCard` components (from US-044, already built)
   - Empty state: `EmptyState icon="road" headline="No favorite roads yet" body="Long-press any route segment on the map to save a road as a favorite."`
   - Each card shows the road name, a mini-map thumbnail, and a delete button

### testID conventions

| testID | Element |
|--------|---------|
| `favorite-roads-screen` | Root `SubpageLayout` |
| `favorite-roads-list` | `FlatList` |
| `favorite-road-card-{id}` | Each `FavoriteRoadCard` |
| `favorite-roads-empty-state` | `EmptyState` |

---

## Animation Specifications

### Polyline animations

| Animation | Duration | Easing | Details |
|-----------|----------|--------|---------|
| Polyline draw (sketch) | 2000ms | linear | Progressive coordinate slice, looping |
| Polyline draw (result) | 500ms | ease-out | Start-to-end coordinate reveal |
| Route selection cross-fade | 200ms | linear | Opacity transition between selected/alternate |

### Chat animations

| Animation | Duration | Easing | Details |
|-----------|----------|--------|---------|
| Message overlay entrance | 300ms | ease-out (cubic) | Slide-in from top, `translateY -20 → 0`, opacity `0 → 1` |
| Message overlay auto-dismiss | 200ms | linear | Fade-out opacity `1 → 0` |
| Message overlay swipe dismiss | 200ms | ease-in | `translateY → -40`, opacity `→ 0` |
| Sidebar slide-in | 250ms | ease-out (cubic) | `translateX -300 → 0` |
| Sidebar slide-out | 200ms | ease-in | `translateX 0 → -300` |
| Typing indicator dots | 600ms per dot | ease-in-out | Staggered opacity `0.3 → 1.0 → 0.3`, offset 200ms each |

### Weather & badge animations

| Animation | Duration | Easing | Details |
|-----------|----------|--------|---------|
| Weather overlay fade-in | 200ms | ease-in | On toggle |
| "Best for today" badge | 300ms | ease-out | Staggered entrance after cards settle, delay 400ms, `opacity 0→1`, `translateY 4→0` |
| Skeleton shimmer | 1500ms | linear | Looping `translateX` gradient sweep |

### Haptic feedback points

| Interaction | Feedback style |
|-------------|---------------|
| Route attachment card selection | `Haptics.ImpactFeedbackStyle.Light` |
| Save route confirmation | `Haptics.ImpactFeedbackStyle.Medium` |
| Long-press favorite road | `Haptics.ImpactFeedbackStyle.Heavy` |

---

## Component Dependency Graph

```
HomeMapScreen
├─ ChatInput                              NEW (replaces DescribeRideBar + NlpInputSheet)
├─ ChatMessageOverlay                     NEW (replaces RouteResultsTray)
│  └─ RouteAttachmentCard                 NEW
│     └─ RouteWeatherBadge               EXISTING
├─ ChatSessionView                        NEW (expanded chat history)
│  ├─ BottomSheetWrapper                 EXISTING
│  └─ RouteAttachmentCard                NEW
│     └─ RouteWeatherBadge               EXISTING
├─ SessionSidebar                         NEW (session history drawer)
├─ AnimatedSketchPolyline                 EXISTING (rendered via MapViewWrapper overlay)
├─ WeatherTimelineSheet                   EXISTING
│  └─ BottomSheetWrapper                 EXISTING
├─ RouteDetailsSheet                      EXISTING (no change)
│  └─ BottomSheetWrapper                 EXISTING
├─ PlanRideSheet                          EXISTING (manual fallback)
├─ OverlayToggle                          EXISTING (no change)
└─ PlanningErrorSheet                     EXISTING (now renders as error message in chat)
```

---

## Unmodular Code Flags

These exist in the current codebase and should be addressed when touching the related files:

| File | Issue | Recommended fix |
|------|-------|-----------------|
| `components/sheets/planning-loading.tsx` | Full-screen `Modal` scrim covers map | Remove — replaced by inline typing indicator in chat |
| `components/sheets/route-options-sheet.tsx` | `preset="full"` covers map | Remove — replaced by `RouteAttachmentCard` in chat messages |
| `components/map/describe-ride-bar.tsx` | V1.0 component, replaced by ChatInput | Remove — replaced by `ChatInput` |
| `components/sheets/nlp-input-sheet.tsx` | V1.0 component, replaced by ChatInput | Remove — replaced by `ChatInput` + `ChatSessionView` |
| `components/sheets/route-results-tray.tsx` | V1.0 component, replaced by overlay | Remove — replaced by `ChatMessageOverlay` |
| `app/(app)/(tabs)/index.tsx:240` | `departureTime: Date.now()` ignores user-set departure | Was fixed in US-107 but verify it uses `departureTime` state |
| `components/ui/route-option-card.tsx:49` | Uses `useTheme<ExtendedTheme>()` directly | Prefer `useSemanticTheme()` for consistency |

---

## Theme Token Reference (Quick Lookup)

All tokens accessed via `const { semantic } = useSemanticTheme()`.

| Token path | Type | Typical usage |
|-----------|------|--------------|
| `semantic.color.primary.default` | string | Brand color, active states, polylines, send icon, rider bubble |
| `semantic.color.onPrimary.default` | string | Text/icons on primary bg, rider bubble text |
| `semantic.color.surface.default` | string | Card, sheet, chat input backgrounds |
| `semantic.color.surfaceVariant.default` | string | System bubbles, inactive chips, skeleton loading |
| `semantic.color.background.default` | string | Screen background |
| `semantic.color.onSurface.default` | string | Primary text, system bubble text |
| `semantic.color.onSurface.muted` | string | Secondary text, icons, stats |
| `semantic.color.onSurface.subtle` | string | Placeholders, separators |
| `semantic.color.border.default` | string | Input borders, card borders, dividers |
| `semantic.color.danger.default` | string | Error, rain warning, error message border |
| `semantic.color.warning.default` | string | Advisory weather, "Best for today" badge |
| `semantic.color.info.default` | string | Cold temp |
| `semantic.color.routeSelected.default` | string | Selected polyline |
| `semantic.color.routeAlternate.default` | string | Alternate polylines |
| `semantic.space.xs` | number | 4 |
| `semantic.space.sm` | number | 8 |
| `semantic.space.md` | number | 12-16 |
| `semantic.space.lg` | number | 20-24 |
| `semantic.space.xl` | number | 32 |
| `semantic.space['2xl']` | number | 48 |
| `semantic.radius.sm` | number | Tight rounding |
| `semantic.radius.md` | number | Card rounding |
| `semantic.radius.lg` | number | Input/bubble rounding |
| `semantic.radius.xl` | number | Bar rounding |

---

## File Creation Checklist

New files to create for V1.1:

- [ ] `components/chat/chat-input.tsx`
- [ ] `components/chat/chat-message-overlay.tsx`
- [ ] `components/chat/chat-session-view.tsx`
- [ ] `components/chat/session-sidebar.tsx`
- [ ] `components/chat/route-attachment-card.tsx`

Existing files to keep (no structural changes):

- `components/ui/route-weather-badge.tsx`
- `components/map/animated-sketch-polyline.tsx`
- `components/sheets/weather-timeline-sheet.tsx`
- `components/sheets/route-details-sheet.tsx`
- `components/map/overlay-toggle.tsx`
- `app/(app)/favorite-roads.tsx`

Files to remove (replaced by chat model):

- `components/map/describe-ride-bar.tsx` → replaced by `ChatInput`
- `components/sheets/nlp-input-sheet.tsx` → replaced by `ChatInput`
- `components/sheets/route-results-tray.tsx` → replaced by `ChatMessageOverlay`
- `components/sheets/planning-loading.tsx` → replaced by inline typing indicator

Existing files to modify:

- [ ] `app/(app)/(tabs)/index.tsx` — state overhaul + component substitutions + sidebar/overlay integration
- [ ] `app/(app)/(tabs)/saved-routes.tsx` — SubpageLayout wrap + CTA update
- [ ] `components/map/map-view.tsx` — add `overlayPolylines` prop for sketch polyline
- [ ] `components/map/route-polyline.ts` — add `'alternate'` variant support
