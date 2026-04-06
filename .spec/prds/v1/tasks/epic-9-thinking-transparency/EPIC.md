# Epic 9: Agent Thinking Transparency

> Epic Sequence: 9
> PRD: .spec/prd/thinking-transparency/ (planned)
> Plan: ~/.claude/plans/zany-puzzling-horizon.md
> Tasks: 7

## Overview

Surface the ride planning agent's thinking process in real-time to build user trust. Currently the agent's tool calls (geocode, planRoute, fetchWeather) and reasoning are invisible beyond a minimal "Thinking..." chip. This epic introduces a `thinking_card` message kind that aggregates thinking deltas and tool activity into a collapsible timeline, plus a route mini-map preview on completed route cards.

Inspired by ChatGPT's collapsible reasoning UI: one-line animated summary in chat, bottom sheet with full thinking/search details when tapped.

## Human Test Steps

When this epic is complete:

1. Send a route planning message in chat
2. A collapsible "thinking" chip appears, animating through step summaries ("Searching for Santa Cruz...", "Planning route...", "Checking weather...")
3. After completion, the chip shows "Thought for Ns" — tap to open bottom sheet with full thinking timeline
4. Bottom sheet shows: tool calls with results, agent reasoning text, timestamps
5. Completed route cards show a mini-map preview with the polyline
6. Tapping a route card navigates to the full map view
7. Old `reasoning` rows from previous sessions still render correctly

## Acceptance Criteria (from Plan)

- Agent tool starts/finishes are captured as structured `thinkingSteps[]` in a single `thinking_card` message row
- Collapsed chip shows latest step summary (max 120 chars) with streaming animation
- Bottom sheet renders full thinking timeline with icons, summaries, and details
- Route cards display a non-interactive mini-map with the route polyline at 120pt height
- Backward compatibility: existing `reasoning` kind rows still render via `ReasoningCard`
- No regression on existing chat/agent functionality

## Dependencies

This epic depends on:
- Epic 5: Scenic Routing Rearchitecture (agent tools must be stable)

This epic blocks:
- Nothing — this is a transparency/UX improvement

## Task List

| Task ID | Title | Type | Priority | Assignee | Blocked By |
|---------|-------|------|----------|----------|------------|
| US-055 | Add thinking_card kind + thinkingSteps validators | FEATURE | P0 | convex-implementer | - |
| US-056 | Add thinking card lifecycle mutations | FEATURE | P0 | convex-implementer | US-055 |
| US-057 | Wire tool transparency into agent callbacks | REFACTOR | P0 | pi-implementer | US-056 |
| US-058 | Build ThinkingCard component (chip + bottom sheet) | FEATURE | P0 | frontend-designer | US-055 |
| US-059 | Register thinking_card + chat screen passthrough | FEATURE | P1 | frontend-designer | US-058 |
| US-060 | Build RouteMiniMap component | FEATURE | P1 | frontend-designer | - |
| US-061 | Integrate mini-map into route attachment cards | FEATURE | P1 | frontend-designer | US-060 |
