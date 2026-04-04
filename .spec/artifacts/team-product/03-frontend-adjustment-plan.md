# Frontend Adjustment Plan — LaneShadow V1 Chat UI

**Status**: DRAFT
**Team**: product-v1-gap-analysis
**Date**: 2026-04-03
**Dependencies**: `.spec/prds/v1/08-technical-ui.md`, `.spec/prds/v1/09-technical-client.md`

---

## Executive Summary

V1 replaces the single-shot NLP planning flow with a conversational chat-session interface. This plan outlines all component changes required, identifying reusable patterns, modular design opportunities, and implementation dependencies.

**Key Changes**:
- 6 new chat-related components to create
- 3 existing components to modify significantly
- 1 component to remove (NlpInputSheet, replaced by ChatInput)
- 6 new hooks for state management
- Complete home map screen rearchitecture to 6-state machine

---

## Part 1: Modular Design Scan Results

### Existing Reusable Components (Rule of 2 Analysis)

**Rule of 2**: Patterns used 2+ times MUST be extracted to shared components.

| Component | Pattern | Reuse Count | Action | Notes |
|-----------|---------|-------------|--------|-------|
| `Button` | Primary/secondary action button | 50+ files | **REUSE** | Variants: default, secondary, outline, ghost, destructive, glass |
| `Card` | Content container with elevation | 30+ files | **REUSE** | Has compound components: CardHeader, CardTitle, CardContent |
| `Badge` | Status indicator/pill | 20+ files | **REUSE** | Supports custom opacity (used in PlanRideSheet) |
| `Input` | Text input with label/icon | 15+ files | **REUSE** | Focus states, left/right icon support |
| `BottomSheetWrapper` | Bottom sheet container | 10+ files | **REUSE** | Presets: half, three-quarter, full |
| `SheetHandle` | Drag handle for sheets | 8+ files | **REUSE** | Consistent sheet affordance |
| `IconSymbol` | Icon wrapper | 97 files | **REUSE** | Single source of truth for icons |
| `RouteOptionCard` | Route selection card | 3 locations | **EXTEND** | Used in RouteOptionsSheet, can adapt for chat attachments |

### Unmodular Code Flags (Apply Rule of 2)

**These patterns should be extracted but are currently duplicated**:

| File | Line | Pattern | Recommendation |
|------|------|---------|----------------|
| `plan-ride-sheet.tsx` | 112-121 | Bottom sheet with scroll + handle | Already uses BottomSheetWrapper — **GOOD** |
| `route-options-sheet.tsx` | 84-106 | Horizontal scroll action buttons | Extract to `ActionRow` component if used 2+ times |
| `index.tsx` (HomeMapScreen) | 350-384 | Map header overlay + controls | Already extracted to `MapHeaderOverlay`, `MapControls` — **GOOD** |
| `route-option-card.tsx` | Multiple | Card selection state with border | Consider generic `SelectableCard` wrapper |

**Hardcoded Values Found** (should use semantic tokens):

| File | Line | Issue | Token to Use |
|------|------|-------|--------------|
| `index.tsx` | 131 | Wind overlay auto-activation logic | ✅ Uses semantic tokens elsewhere |
| `plan-ride-sheet.tsx` | 158 | `style={styles.swapButton}` with hardcoded borderRadius: 20 | Use `semantic.radius.full` |
| `button.tsx` | 80-107 | Height calculations using semantic.space | ✅ Correct pattern |

### Theme Token Usage Audit

**Current Status**: ✅ **EXCELLENT** - 96 files use `semantic.color.*` tokens

All components consistently use `useSemanticTheme()` hook. No hardcoded color values detected in core UI components. The project follows the theme token system correctly.

**Patterns to Maintain**:
- All colors via `semantic.color.*`
- All spacing via `semantic.space.*`
- All radii via `semantic.radius.*`
- All typography via `semantic.type.*`

---

## Part 2: Component Inventory

### Components to CREATE

| # | Component | File Path | Purpose | Reuses |
|---|-----------|-----------|---------|--------|
| 1 | **ChatInput** | `components/chat/chat-input.tsx` | Always-visible floating input bar at bottom of map | `Button`, `IconSymbol`, `semantic` tokens |
| 2 | **ChatMessageOverlay** | `components/chat/chat-message-overlay.tsx` | Temporary AI response card overlaying map | `RouteAttachmentCard`, `Animated.View` |
| 3 | **ChatSessionView** | `components/chat/chat-session-view.tsx` | Expanded scrollable chat history (bottom sheet) | `BottomSheetWrapper`, `SheetHandle` |
| 4 | **RouteAttachmentCard** | `components/chat/route-attachment-card.tsx` | Compact route card for chat messages | `Badge`, `Button`, `IconSymbol`, `RouteWeatherBadge` |
| 5 | **SessionSidebar** | `components/chat/session-sidebar.tsx` | Left slide-out session history drawer | `Button`, `IconSymbol`, `FlatList` |
| 6 | **RouteWeatherBadge** | `components/ui/route-weather-badge.tsx` | Inline weather badge for route cards | `IconSymbol`, semantic tokens |
| 7 | **WeatherTimelineSheet** | `components/sheets/weather-timeline-sheet.tsx` | Hourly weather chart sheet | `BottomSheetWrapper`, `SheetHandle`, `Button` |
| 8 | **AnimatedSketchPolyline** | `components/map/animated-sketch-polyline.tsx` | "Drawing" animation during planning phase | Maps `Polyline`, `Animated` API |

### Components to MODIFY

| # | Component | File Path | Changes | Breaking? |
|---|-----------|-----------|---------|----------|
| 1 | **HomeMapScreen** | `app/(app)/(tabs)/index.tsx` | Replace 4-state reducer with 6-state machine; integrate ChatInput, SessionSidebar, ChatMessageOverlay; remove FloatingSearchInput | **YES** - Requires state migration |
| 2 | **PlanRideSheet** | `components/sheets/plan-ride-sheet.tsx` | Add as fallback from ChatInput manual mode; ensure all preferences flow through to chat context | Minor |
| 3 | **RouteOptionsSheet** | `components/sheets/route-options-sheet.tsx` | Add weather badges to route cards using new `RouteWeatherBadge` | Minor |
| 4 | **RouteOptionCard** | `components/planning/route-option-card.tsx` | Extract shared layout with `RouteAttachmentCard`; both use same data shape | Refactor opportunity |

### Components to REMOVE

| Component | File Path | Replaced By | Migration Path |
|-----------|-----------|-------------|----------------|
| **FloatingSearchInput** | `components/ui/floating-search-input.tsx` | `ChatInput` | Remove from HomeMapScreen bottom overlay |
| **NlpInputSheet** | (not found in current code) | `ChatInput` | Was in V1 spec but not implemented |

---

## Part 3: New Hooks Required

| Hook | File Path | Purpose | Dependencies |
|------|-----------|---------|--------------|
| **useRideFlow** | `hooks/use-ride-flow.ts` | Main 6-state reducer; replaces `planningReducer` | New file |
| **useChatSession** | `hooks/use-chat-session.ts` | Session CRUD: create, load, send message | Convex queries/mutations |
| **useSessionHistory** | `hooks/use-session-history.ts` | Session list for sidebar | Convex query |
| **useMessageOverlay** | `hooks/use-message-overlay.ts` | Auto-dismiss timer for overlay | None |
| **useChatPlanning** | `hooks/use-chat-planning.ts` | Wraps `usePlanRide` with chat lifecycle | `usePlanRide`, Convex |
| **useRouteComparison** | `hooks/use-route-comparison.ts` | Route selection + polyline memoization | Existing `buildRoutePolylines` |
| **useWeatherOverlay** | `hooks/use-weather-overlay.ts` | Overlay state + availability (already exists in index.tsx, extract) | Extract from HomeMapScreen |

---

## Part 4: Component Hierarchy

### Chat Components Structure

```
components/chat/
├── chat-input.tsx           # Always-visible input bar
├── chat-message-overlay.tsx # Temporary AI response overlay
├── chat-session-view.tsx    # Expanded chat history (BottomSheetWrapper)
├── route-attachment-card.tsx # Compact route card for messages
├── session-sidebar.tsx      # Left drawer for history
└── __tests__/               # Component tests
    ├── chat-input.test.tsx
    ├── chat-message-overlay.test.tsx
    └── ...
```

### Modified Home Map Screen Structure

```
app/(app)/(tabs)/index.tsx (HomeMapScreen)
├── MapViewWrapper (always visible)
├── MapHeaderOverlay (top, absolute)
├── MapControls (right, absolute)
├── OverlayToggle (top-right, shown when route selected)
├── ChatInput (bottom, absolute) ← NEW
├── ChatMessageOverlay (top-left, absolute) ← NEW (conditional)
├── SessionSidebar (left, absolute) ← NEW (conditional)
├── PlanRideSheet (bottom sheet, fallback manual mode)
├── RoutePlannerLoading (overlay during planning)
└── PlanningErrorSheet (error state)
```

---

## Part 5: Implementation Order (Dependencies)

**Phase 1: Foundation (State Machine)**
1. Create `hooks/use-ride-flow.ts` with 6-state reducer
2. Create `hooks/use-chat-session.ts` with Convex integration
3. Create `hooks/use-session-history.ts`
4. Migrate `index.tsx` to use new state machine (no UI changes yet)

**Phase 2: Chat Input Core**
5. Create `components/ui/route-weather-badge.tsx`
6. Create `components/chat/route-attachment-card.tsx`
7. Create `components/chat/chat-input.tsx`
8. Integrate ChatInput into HomeMapScreen (replace FloatingSearchInput)

**Phase 3: Chat Messages & History**
9. Create `hooks/use-message-overlay.ts`
10. Create `components/chat/chat-message-overlay.tsx`
11. Create `components/chat/session-sidebar.tsx`
12. Integrate sidebar gesture handling into HomeMapScreen

**Phase 4: Expanded Chat View**
13. Create `components/chat/chat-session-view.tsx`
14. Wire expand chevron to open ChatSessionView

**Phase 5: Weather Enhancements**
15. Create `components/sheets/weather-timeline-sheet.tsx`
16. Add weather badges to RouteOptionCard
17. Wire badge tap to WeatherTimelineSheet

**Phase 6: Planning Animations**
18. Create `components/map/animated-sketch-polyline.tsx`
19. Wire sketch animation to planning phase

---

## Part 6: Theme Token Requirements

### New Tokens Needed (if not present)

Validate these exist in `hooks/use-semantic-theme.ts`:

```typescript
// Surface variants (for chat bubbles)
semantic.color.surfaceVariant.default
semantic.color.surfaceVariant.pressed
semantic.color.surfaceVariant.disabled

// On-primary colors (for rider message bubble)
semantic.color.onPrimary.default

// Danger color (for error messages, rain badges)
semantic.color.danger.default
semantic.color.danger.pressed
semantic.color.danger.disabled

// Info color (for temp-low badges)
semantic.color.info.default

// Warning color (for temp-high, wind badges)
semantic.color.warning.default
semantic.color.warning.pressed
```

### Spacing Tokens Used

All new components use existing tokens:
- `semantic.space.xs` - 4px (tight gaps)
- `semantic.space.sm` - 8px (internal gaps)
- `semantic.space.md` - 12px (standard padding)
- `semantic.space.lg` - 16px (loose padding)
- `semantic.space.xl` - 20px (extra loose)
- `semantic.space['2xl']` - 24px (section spacing)
- `semantic.space['3xl']` - 32px (large spacing)
- `semantic.space['4xl']` - 40px (hero spacing)

---

## Part 7: Convex Dependencies

All new hooks require these Convex operations (to be implemented by backend):

| Operation | Type | Hook | Purpose |
|-----------|------|------|---------|
| `api.db.planningSessions.list` | Query | useSessionHistory | Session list for sidebar |
| `api.db.planningSessions.get` | Query | useChatSession | Active session metadata |
| `api.db.planningSessions.create` | Mutation | useChatSession | Create new session |
| `api.db.sessionMessages.list` | Query | useChatSession | Messages for active session |
| `api.db.sessionMessages.send` | Mutation | useChatPlanning | Send rider message |
| `api.db.sessionMessages.addSystemMessage` | Mutation | useChatPlanning | Add system response with attachments |
| `api.db.routePlans.getPlanStatus` | Query | useChatPlanning | Phase tracking during planning |
| `api.actions.agent.parseNaturalLanguageInput` | Action | useChatPlanning | Parse chat message to PlanInput |

---

## Part 8: Testing Strategy

### Unit Tests per Component

| Component | Test Coverage | Key Scenarios |
|-----------|--------------|---------------|
| ChatInput | ✅ Create | Send enabled/disabled, expand press, suggestion chips, manual mode |
| ChatMessageOverlay | ✅ Create | Auto-dismiss timer, pin behavior, swipe to dismiss |
| ChatSessionView | ✅ Create | Scroll to bottom, message bubbles, typing indicator |
| RouteAttachmentCard | ✅ Create | Selection state, weather badge, action buttons |
| SessionSidebar | ✅ Create | Session list render, active state, new session button |
| RouteWeatherBadge | ✅ Create | All condition types, colors, icons |
| WeatherTimelineSheet | ✅ Create | Chart rendering, adjust departure button |

### Integration Tests

| Test | Scope |
|------|-------|
| Chat flow: send message → planning → results → overlay | HomeMapScreen + hooks |
| Session resume: load session → routes restore | HomeMapScreen + Convex |
| Refinement: send message from results → new routes | HomeMapScreen + hooks |

---

## Part 9: Open Questions

1. **AnimatedSketchPolyline coordinate generation**: Should the helper function `buildSketchCoordinates` live in HomeMapScreen or be extracted to a utility module? Recommendation: Keep local to HomeMapScreen as it's purely visual.

2. **Weather chart library**: Should we use `react-native-gifted-charts` or build a custom View-based chart? Recommendation: Start with custom View-based chart for V1 simplicity; can upgrade to library later if needed.

3. **Chat message pagination**: Should we implement pagination for `sessionMessages.list` query? Recommendation: Yes — Convex queries should paginate server-side, but V1 can assume sessions stay within default page size.

---

## Part 10: Migration Checklist

- [ ] Verify all theme tokens exist in `use-semantic-theme.ts`
- [ ] Implement all Convex queries/mutations (backend task)
- [ ] Create all new hooks with test coverage
- [ ] Create all new chat components with test coverage
- [ ] Migrate HomeMapScreen to 6-state machine
- [ ] Replace FloatingSearchInput with ChatInput
- [ ] Add sidebar gesture handling
- [ ] Test full chat flow end-to-end
- [ ] Test session resume flow
- [ ] Test refinement message flow
- [ ] Performance test: polyline rendering with 2-3 alternate routes
- [ ] Accessibility audit: testIDs, labels, roles

---

## Appendix: Component Props Reference

See `.spec/prds/v1/08-technical-ui.md` for complete props interfaces for all new components. All components follow these standards:

- Export `type {ComponentName}Props` alongside component
- Use `testID` prop for all testable elements
- Use `useSemanticTheme()` hook for all styling
- Follow semantic naming for testID: `{component-name}-{element}`
