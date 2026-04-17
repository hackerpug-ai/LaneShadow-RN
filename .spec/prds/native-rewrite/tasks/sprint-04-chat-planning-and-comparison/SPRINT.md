# Sprint 4: Chat Planning and Comparison

**Sequence:** 4
**Status:** Planned

## Overview

Wire the Sprint-2 chat, planning, and comparison components into Convex-backed planning flows. This sprint does not build new UI primitives — all chat transcript, input, routing-card, route-option, route-details, and comparison components are delivered by Sprint 2. Sprint 4 connects them to `api.actions.agent.sendMessage`, streaming Convex subscriptions, `route_plans` queries, enrichment, and the ride-flow state machine so riders can complete the full text-planning loop from prompt to preferred-route selection.

## Human Testing Gate

**Gate:** A rider can ask for a ride in chat, watch optimistic messages replace with Convex-confirmed messages, receive streamed AI responses into the Sprint-2 `ChatTranscript`, see route options flow from Convex `route_plans` into the wired `RouteOptionCard`/`RouteAttachmentCard`, compare options in the wired comparison surface, inspect enrichment fields in `RouteDetailsSheet`, and dispatch `SELECT_ROUTE` to transition the ride flow into `ROUTE_DETAILS`.

## Human Test Deliverable

Both native apps run Sprint-2 chat, planning, and comparison components end-to-end against the Convex backend — optimistic send, streaming render, route-plan hydration, comparison highlight, enrichment overlays, and route selection all driven by real data.

## Human Test Steps

1. Open chat on Android, send a planning prompt, and confirm the Sprint-2 `ChatInput` shows optimistic state, the `ChatTranscript` receives the optimistic bubble, and the Convex-confirmed message replaces it with matching server ID.
2. Open chat on iOS, send the same planning prompt, and confirm the `TypingIndicator` appears while `status: 'running'`, streamed tokens incrementally populate `MarkdownText` inside `ChatTranscript`, and the indicator dismisses on `status: 'complete'`.
3. Generate multiple route options and confirm `RoutingCard` morphs into `RouteAttachmentCard` entries driven by `api.db.routePlans.getPlanById`, and that `RouteOptionsSheet` + `RouteOptionCard` hydrate from the same plan on the comparison screen with all map polylines rendered by `MapboxMapView`.
4. Open `RouteDetailsSheet` on both platforms and confirm description, rating, community signals, best months, and weather suitability render only when the underlying Convex field is defined (no placeholders when null).
5. Apply surface filters and confirm they combine with archetype filters against the Convex query instead of replacing them.
6. Tap "Select Route" on a `RouteOptionCard`, confirm `SaveRouteConfirmationSheet` renders, dispatch `SELECT_ROUTE`, and verify the ride-flow state moves cleanly into `ROUTE_DETAILS` with the selected route surfaced.

## Source Coverage

- `07-native-app-backlog.md`
- `12-uc-chat-planning.md`
- `14-uc-route-comparison.md`
- `15-uc-ride-flow.md`
- `17-state-convex-architecture.md`

## Dependencies

- Sprint 2: UI Component Library (all `ChatInput`, `ChatTranscript`, `RoutingCard`, `RouteAttachmentCard`, `RouteOptionCard`, `RouteOptionsSheet`, `RouteDetailsSheet`, `EnrichedRouteCard`, `MapboxMapView`, `RoutePolyline`, `SaveRouteConfirmationSheet`, `SubpageLayout`, `BottomSheetWrapper`, `MenuLayout`, and atomic primitives must ship from Sprint 2 UI-XXX tasks before wiring begins)
- Sprint 3: Auth and Discovery Shell (authenticated Convex client and discovery session context)

## Blocks

- Sprint 5: Turn-by-Turn Navigation
- Sprint 8: Voice Assistant
- Sprint 9: Gatekeeper and Platform Polish
- Sprint 10: Native Parity and React Native Retirement

## Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| CPC-001 | Build planning-session repositories and Convex action/query integration | convex-implementer | 0.5 day |
| CPC-002 | Wire Sprint-2 chat components into the Android streaming planning flow | kotlin-implementer | 1 day |
| CPC-003 | Wire Sprint-2 chat components into the iOS streaming planning flow | swift-implementer | 1 day |
| CPC-004 | Wire Sprint-2 comparison and route-details components into the Android ride flow | kotlin-implementer | 1 day |
| CPC-005 | Wire Sprint-2 comparison and route-details components into the iOS ride flow | swift-implementer | 1 day |
| CPC-006 | Extend native persistence and data contracts for deferred route-display fields | worker | 0.5 day |

---

### CPC-001: Build planning-session repositories and Convex action/query integration

Implement Convex-side orchestration: `api.actions.agent.sendMessage`, `api.db.sessionMessages.list`, `api.db.routePlans.getPlanById`, `api.db.planningSessions.createSession`, plus streaming subscriptions used by the platform chat wirings. Surface enrichment fields (description, rating, community signals, best months, weather suitability) via `api.db.routePlans.getPlanById` so the Sprint-2 `RouteDetailsSheet` renders them.

**Components Consumed:** None (backend-only task; produces the Convex surface area consumed by CPC-002..005).

---

### CPC-002: Wire Sprint-2 chat components into the Android streaming planning flow

Connect the Sprint-2 chat component set to Convex on Android. The task wires composables (no component construction): bind `ChatInput` send taps to `useAction(api.actions.agent.sendMessage)`, emit optimistic bubbles into `ChatTranscript`, render `TypingIndicator` while `status: 'running'`, stream tokens into `MarkdownText`, render planning progress via `RoutingCard` and morph into `RouteAttachmentCard` when the plan completes, and handle error, limit, and timeout states through `ErrorMessage`, `ConnectionBanner`, and `ErrorToast`. Persist messages to Room via `ChatMessageManager`. All UI primitives ship from Sprint 2.

**Components Consumed:**
- `ChatInput` (organism) — from 12 UC-CHAT-01/02/03/07
- `ChatTranscript` (organism) — from 12 UC-CHAT-01/02/03/04/06
- `SuggestionChips` (molecule) — from 12 UC-CHAT-01/02/08
- `KeyboardAvoidingInput` (molecule) — from 12 UC-CHAT-01/02
- `EmptyState` (molecule) — from 12 UC-CHAT-01
- `MenuLayout` (template) — from 12 UC-CHAT-01
- `AppHeader` (molecule) — from 12 UC-CHAT-01/06
- `IconSymbol` (atom) — from 12 UC-CHAT-02/06/07/08
- `Button` (atom) — from 12 UC-CHAT-02/04/05/07/08
- `TypingIndicator` (atom) — from 12 UC-CHAT-03
- `MarkdownText` (molecule) — from 12 UC-CHAT-03
- `ReasoningCard` (molecule) — from 12 UC-CHAT-03
- `ThinkingCard` (molecule) — from 12 UC-CHAT-03
- `RoutingCard` (molecule) — from 12 UC-CHAT-04
- `RouteAttachmentCard` (molecule) — from 12 UC-CHAT-04/05
- `RouteMiniMap` (molecule) — from 12 UC-CHAT-04/05
- `PlanningCard` (molecule) — from 12 UC-CHAT-04
- `WeatherPill` (molecule) — from 12 UC-CHAT-04
- `RainBadge` (molecule) — from 12 UC-CHAT-04
- `WindBadge` (molecule) — from 12 UC-CHAT-04
- `StatRow` (molecule) — from 12 UC-CHAT-04
- `SessionSidebar` (organism) — from 12 UC-CHAT-06
- `SessionCard` (molecule) — from 12 UC-CHAT-06
- `SearchBar` (molecule) — from 12 UC-CHAT-06
- `Skeleton` (atom) — from 12 UC-CHAT-06
- `BottomActionSheet` (template) — from 12 UC-CHAT-07
- `LocationSearchCard` (molecule) — from 12 UC-CHAT-07
- `WaypointMarker` (molecule) — from 12 UC-CHAT-07
- `ErrorMessage` (molecule) — from 12 UC-CHAT-08
- `ConnectionBanner` (molecule) — from 12 UC-CHAT-08
- `ErrorToast` (molecule) — from 12 UC-CHAT-08

---

### CPC-003: Wire Sprint-2 chat components into the iOS streaming planning flow

iOS mirror of CPC-002. Connect the Sprint-2 chat component set to Convex via the Convex Swift SDK: bind `ChatInput` send to the action, drive optimistic and streamed rendering through `ChatTranscript` + `MarkdownText`, stream through `TypingIndicator`, hydrate `RoutingCard`/`RouteAttachmentCard` from `api.db.routePlans.getPlanById`, persist messages to SwiftData, and route errors through the shared error components. No new UI primitives; wiring only.

**Components Consumed:**
- `ChatInput` (organism) — from 12 UC-CHAT-01/02/03/07
- `ChatTranscript` (organism) — from 12 UC-CHAT-01/02/03/04/06
- `SuggestionChips` (molecule) — from 12 UC-CHAT-01/02/08
- `KeyboardAvoidingInput` (molecule) — from 12 UC-CHAT-01/02
- `EmptyState` (molecule) — from 12 UC-CHAT-01
- `MenuLayout` (template) — from 12 UC-CHAT-01
- `AppHeader` (molecule) — from 12 UC-CHAT-01/06
- `IconSymbol` (atom) — from 12 UC-CHAT-02/06/07/08
- `Button` (atom) — from 12 UC-CHAT-02/04/05/07/08
- `TypingIndicator` (atom) — from 12 UC-CHAT-03
- `MarkdownText` (molecule) — from 12 UC-CHAT-03
- `ReasoningCard` (molecule) — from 12 UC-CHAT-03
- `ThinkingCard` (molecule) — from 12 UC-CHAT-03
- `RoutingCard` (molecule) — from 12 UC-CHAT-04
- `RouteAttachmentCard` (molecule) — from 12 UC-CHAT-04/05
- `RouteMiniMap` (molecule) — from 12 UC-CHAT-04/05
- `PlanningCard` (molecule) — from 12 UC-CHAT-04
- `WeatherPill` (molecule) — from 12 UC-CHAT-04
- `RainBadge` (molecule) — from 12 UC-CHAT-04
- `WindBadge` (molecule) — from 12 UC-CHAT-04
- `StatRow` (molecule) — from 12 UC-CHAT-04
- `SessionSidebar` (organism) — from 12 UC-CHAT-06
- `SessionCard` (molecule) — from 12 UC-CHAT-06
- `SearchBar` (molecule) — from 12 UC-CHAT-06
- `Skeleton` (atom) — from 12 UC-CHAT-06
- `BottomActionSheet` (template) — from 12 UC-CHAT-07
- `LocationSearchCard` (molecule) — from 12 UC-CHAT-07
- `WaypointMarker` (molecule) — from 12 UC-CHAT-07
- `ErrorMessage` (molecule) — from 12 UC-CHAT-08
- `ConnectionBanner` (molecule) — from 12 UC-CHAT-08
- `ErrorToast` (molecule) — from 12 UC-CHAT-08

---

### CPC-004: Wire Sprint-2 comparison and route-details components into the Android ride flow

Wire the Sprint-2 comparison surface to the ride-flow state machine. Bind `RouteOptionsSheet` + `RouteOptionCard` (and `EnrichedRouteCard` when enrichment data exists) to `state.routeOptions.options`, drive `MapboxMapView` polyline selection through `selectedRouteId`, render enrichment-populated `RouteDetailsSheet` fields (description, rating, community signals, best months, weather suitability) when defined, and dispatch `SELECT_ROUTE` via `SaveRouteConfirmationSheet` to transition to `ROUTE_DETAILS`. Surface design-system primitives (cards, chips, metrics, detail rows) are consumed as-is from Sprint 2; any styling tokens required for rank color-coding, delta chips, or metric rows are pulled from Sprint-2 theme tokens without extension in this sprint.

**Components Consumed:**
- `RouteComparisonView` (screen) — from 14 UC-COMP-01/03/05/06
- `SubpageLayout` (template) — from 14 UC-COMP-01/05
- `RouteOptionCard` (molecule) — from 14 UC-COMP-01/02/03/05/06
- `RouteOptionsSheet` (organism) — from 14 UC-COMP-01/03/06
- `MapboxMapView` (organism) — from 14 UC-COMP-01/03
- `RoutePolyline` (atom) — from 14 UC-COMP-01/03
- `RoutePolylineComponent` (atom) — from 14 UC-COMP-01/03
- `StatRow` (molecule) — from 14 UC-COMP-01/02/05/06
- `RouteBadge` (molecule) — from 14 UC-COMP-01/02/06
- `EnrichmentStatusBadge` (molecule) — from 14 UC-COMP-01/02
- `WeatherPill` (molecule) — from 14 UC-COMP-01
- `IconSymbol` (atom) — from 14 UC-COMP-02/04
- `Badge` (atom) — from 14 UC-COMP-02/04/06
- `RouteDetailsSheet` (organism) — from 14 UC-COMP-02/04/05
- `BottomSheetWrapper` (template) — from 14 UC-COMP-02/04/05/06
- `SegmentDetailView` (molecule) — from 14 UC-COMP-02
- `EnrichedRouteCard` (organism) — from 14 UC-COMP-02
- `WaypointMarker` (molecule) — from 14 UC-COMP-03
- `SearchResultMarker` (molecule) — from 14 UC-COMP-03
- `MapControls` (molecule) — from 14 UC-COMP-03
- `Button` (atom) — from 14 UC-COMP-04/05/06
- `RouteTimeline` (organism) — from 14 UC-COMP-04
- `RouteLegTimeline` (molecule) — from 14 UC-COMP-04
- `PrimaryButton` (atom) — from 14 UC-COMP-05
- `SaveRouteConfirmationSheet` (molecule) — from 14 UC-COMP-05/06
- `SavedRouteCard` (molecule) — from 14 UC-COMP-06

---

### CPC-005: Wire Sprint-2 comparison and route-details components into the iOS ride flow

iOS mirror of CPC-004. Wire the Sprint-2 comparison surface to the ride-flow state machine via the Convex Swift SDK: bind `RouteOptionsSheet` to `state.routeOptions.options`, drive `MapboxMapView` highlighting via `selectedRouteId`, surface `RouteDetailsSheet` enrichment fields only when defined, and route `SELECT_ROUTE` through `SaveRouteConfirmationSheet` into the `ROUTE_DETAILS` transition. No UI primitives are built in this task.

**Components Consumed:**
- `RouteComparisonView` (screen) — from 14 UC-COMP-01/03/05/06
- `SubpageLayout` (template) — from 14 UC-COMP-01/05
- `RouteOptionCard` (molecule) — from 14 UC-COMP-01/02/03/05/06
- `RouteOptionsSheet` (organism) — from 14 UC-COMP-01/03/06
- `MapboxMapView` (organism) — from 14 UC-COMP-01/03
- `RoutePolyline` (atom) — from 14 UC-COMP-01/03
- `RoutePolylineComponent` (atom) — from 14 UC-COMP-01/03
- `StatRow` (molecule) — from 14 UC-COMP-01/02/05/06
- `RouteBadge` (molecule) — from 14 UC-COMP-01/02/06
- `EnrichmentStatusBadge` (molecule) — from 14 UC-COMP-01/02
- `WeatherPill` (molecule) — from 14 UC-COMP-01
- `IconSymbol` (atom) — from 14 UC-COMP-02/04
- `Badge` (atom) — from 14 UC-COMP-02/04/06
- `RouteDetailsSheet` (organism) — from 14 UC-COMP-02/04/05
- `BottomSheetWrapper` (template) — from 14 UC-COMP-02/04/05/06
- `SegmentDetailView` (molecule) — from 14 UC-COMP-02
- `EnrichedRouteCard` (organism) — from 14 UC-COMP-02
- `WaypointMarker` (molecule) — from 14 UC-COMP-03
- `SearchResultMarker` (molecule) — from 14 UC-COMP-03
- `MapControls` (molecule) — from 14 UC-COMP-03
- `Button` (atom) — from 14 UC-COMP-04/05/06
- `RouteTimeline` (organism) — from 14 UC-COMP-04
- `RouteLegTimeline` (molecule) — from 14 UC-COMP-04
- `PrimaryButton` (atom) — from 14 UC-COMP-05
- `SaveRouteConfirmationSheet` (molecule) — from 14 UC-COMP-05/06
- `SavedRouteCard` (molecule) — from 14 UC-COMP-06

---

### CPC-006: Extend native persistence and data contracts for deferred route-display fields

Add the deferred route-data-display fields (description, rating, community signals, best months, weather suitability) to the Android Room entities and iOS SwiftData models, update the shared Convex → native DTO mappers, and expose the fields in platform UI contracts so `RouteDetailsSheet` wirings in CPC-004/005 can render them only when the underlying field is defined. No new UI primitives are introduced — all binding is into Sprint-2 `RouteDetailsSheet` and `EnrichedRouteCard`.

**Components Consumed:**
- `RouteDetailsSheet` (organism) — consumer of the new fields (from 14 UC-COMP-02/04/05; fields described in 12 UC-CHAT-04 and 14 UC-COMP-02)
- `EnrichedRouteCard` (organism) — enrichment-aware variant consuming the same fields (from 14 UC-COMP-02)
