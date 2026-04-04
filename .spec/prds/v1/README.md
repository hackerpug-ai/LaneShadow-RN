# LaneShadow V1: Ride the Moment - PRD

We believe the best rides aren't planned -- they're imagined -- so we're making it effortless to turn a feeling into a road.

## PRD Metadata

| Field | Value |
|-------|-------|
| Version | 1.1.0 |
| Appetite | 6 weeks |
| Scope Level | Full feature |
| Created | 2026-04-03 |
| Last Updated | 2026-04-03 |
| Vision | Ride the Moment |

## Document Index

| File | Section | Stability |
|------|---------|-----------|
| [00-overview.md](./00-overview.md) | Product description, problem statement, solution, current status | PRODUCT_CONTEXT |
| [01-scope.md](./01-scope.md) | In scope / out of scope (6-week appetite) | FEATURE_SPEC |
| [02-roles.md](./02-roles.md) | Rider + System/AI Planner roles, AI personality | PRODUCT_CONTEXT |
| [03-functional-groups.md](./03-functional-groups.md) | 3 groups: NLP (Conversational Planning), WX, SR | FEATURE_SPEC |
| [04-uc-nlp.md](./04-uc-nlp.md) | UC-NLP-01 through UC-NLP-11 (Conversational Planning) | FEATURE_SPEC |
| [05-uc-wx.md](./05-uc-wx.md) | UC-WX-01 through UC-WX-07 (Weather & Conditions) | FEATURE_SPEC |
| [06-uc-sr.md](./06-uc-sr.md) | UC-SR-01 through UC-SR-10 (Saved Routes & Favorites) | FEATURE_SPEC |
| [07-technical-backend.md](./07-technical-backend.md) | Convex schema, actions, chat sessions, rate limiting | CONSTITUTION |
| [08-technical-ui.md](./08-technical-ui.md) | UI screen specs, chat components, state machine, animations | CONSTITUTION |
| [09-technical-client.md](./09-technical-client.md) | Client state architecture, hooks, data flow | CONSTITUTION |
| [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) | Current implementation status, gap analysis, phased roadmap | IMPLEMENTATION_GUIDE |

## Quick Stats

| Metric | Value |
|--------|-------|
| **Current Completion** | ~23% overall (as of 2026-04-03) |
| Functional Groups | 3 (NLP, WX, SR) |
| Use Cases | 28 |
| **Implemented UCs** | 4 (14%) |
| **Partial UCs** | 10 (36%) |
| **New UCs** | 14 (50%) |
| New Components | 10 (5 chat + 5 existing) |
| Reused Components | 10+ |
| New Convex Tables | 3 (planning_sessions, session_messages, plan_usage) |
| New Convex Endpoints | 15+ (sessions, messages, saved routes, rate limiting) |
| Modified Backend Functions | 5 |
| New Hooks | 8 |
| External Dependencies | 0 new (all existing) |
| **Phase 0 Remediation** | 7-11 hours (BLOCKING) |
| **Est. Time to V1** | 4-5 weeks after Phase 0 |

## V1 Gate Test

> A rider opens the app, types "scenic 2-hour ride to Santa Cruz, avoid highways", and 10 seconds later sees 3 route options with weather badges on the map. They say "actually avoid Highway 1" and get updated options without starting over.

If that works and feels magical, V1 ships.

## Positioning

> LaneShadow -- the AI-native motorcycle ride planner. Have a conversation with your map, see conditions before you leave, and it learns your favorite roads over time.

## Pricing

| Tier | Price | Includes |
|------|-------|---------|
| Free | $0 | 5 plans/month, 3 saved routes, wind overlay |
| Pro | $39.99/yr | Unlimited plans, all weather overlays, conditions scoring, favorite roads |

**Plan definition:** 1 plan = 1 route generation execution. A single chat session may contain multiple plans (initial + refinements). Messages that don't trigger route generation are free.

## Version History

| Version | Date | Changes | Trigger |
|---------|------|---------|---------|
| 1.0.0 | 2026-04-03 | Initial V1 PRD | New strategy based on competitive analysis + user research |
| 1.1.0 | 2026-04-03 | UX model change: single-shot NLP to conversational chat sessions | Reviewer feedback (frontend-designer, convex-planner, product-manager) + founder vision for map-first copilot experience |
| 1.2.0 | 2026-04-03 | Add IMPLEMENTATION_STATUS.md with current gap analysis and phased roadmap | Product team adjustment plan report — comprehensive codebase analysis against V1 PRD scope |

## Team

| Role | Deliverable |
|------|-------------|
| product-manager | Core sections (00-06), all 28 use cases |
| convex-planner | Backend architecture (07) |
| frontend-designer | UI screen specs (08) |
| react-vite-planner | Client state architecture (09) |

## Next Steps

- `/kb-project-plan` - Build implementation plan from this PRD
- `/kb-run-epic` - Execute implementation tasks
- `npx convex dev --once` - Deploy backend changes
- `npx expo run:ios` - Test on simulator
