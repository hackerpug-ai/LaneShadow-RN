# Task Index: LaneShadow Epic 9

> Generated: 2026-04-06
> Plan: ~/.claude/plans/zany-puzzling-horizon.md
> Total Tasks: 7

## Epic 9: Agent Thinking Transparency

**Folder:** `epic-9-thinking-transparency/`

**Human Test:**
1. Send a route planning message — thinking chip animates through tool steps
2. Tap completed thinking chip — bottom sheet shows full thinking timeline
3. Completed route cards show mini-map preview
4. Tap route card — navigates to full map view
5. Old `reasoning` rows still render correctly

**Tasks:**
- [US-055](US-055.md): Add thinking_card kind + thinkingSteps validators
- [US-056](US-056.md): Add thinking card lifecycle mutations
- [US-057](US-057.md): Wire tool transparency into agent callbacks
- [US-058](US-058.md): Build ThinkingCard component (chip + bottom sheet)
- [US-059](US-059.md): Register thinking_card + chat screen passthrough
- [US-060](US-060.md): Build RouteMiniMap component
- [US-061](US-061.md): Integrate mini-map into route attachment cards

## Dependencies

```
US-055 (data model)
  ├── US-056 (mutations)
  │     └── US-057 (callback wiring)
  └── US-058 (ThinkingCard UI)
        └── US-059 (registry + passthrough)

US-060 (RouteMiniMap) — independent
  └── US-061 (route card integration)
```

## Agent Assignment

| Agent | Tasks |
|-------|-------|
| convex-implementer | US-055, US-056 |
| pi-implementer | US-057 |
| frontend-designer | US-058, US-059, US-060, US-061 |

## Parallelism

- **Wave 1**: US-055 + US-060 (independent foundations)
- **Wave 2**: US-056 + US-058 (both depend on US-055; US-060 continues)
- **Wave 3**: US-057 + US-059 + US-061
- **Wave 4**: Integration verification

## Task Summary

| Task ID | Title | Type | Priority | Estimate |
|---------|-------|------|----------|----------|
| US-055 | Add thinking_card kind + thinkingSteps validators | FEATURE | P0 | 30 min |
| US-056 | Add thinking card lifecycle mutations | FEATURE | P0 | 60 min |
| US-057 | Wire tool transparency into agent callbacks | REFACTOR | P0 | 90 min |
| US-058 | Build ThinkingCard component (chip + bottom sheet) | FEATURE | P0 | 120 min |
| US-059 | Register thinking_card + chat screen passthrough | FEATURE | P1 | 30 min |
| US-060 | Build RouteMiniMap component | FEATURE | P1 | 60 min |
| US-061 | Integrate mini-map into route attachment cards | FEATURE | P1 | 45 min |

**Total Estimated Effort:** ~7.25 hours
