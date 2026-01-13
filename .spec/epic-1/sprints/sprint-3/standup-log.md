# Sprint 3 Standup Log

**Sprint**: Sprint 3 — Backend data flows: PlanRide action + providers + overlays

## Session Entries

(append entries chronologically)

## 2026-01-13 - Backend Engineer Agent - Sprint 3 Tasks 04–06 (normalize route, route index, wind overlay)

### Status
- Current Sprint: sprint-3
- Task: Tasks 04–06 (normalize provider route, compute RouteIndex, wind overlay probing/mapping with soft-fail)
- Status: Completed

### Work Completed
- Normalized provider route output to `RouteSnapshot` (POC geometry policy: overview + leg polylines, no steps)
  - Modified: `convex/actions/agent/tools/normalize-route.ts`
  - Added test: `convex/actions/agent/tools/__tests__/normalize-route.test.ts`
- Implemented deterministic, bounded RouteIndex computation (FNV-1a fingerprint + capped sampling)
  - Modified: `convex/actions/agent/tools/compute-route-index.ts`
- Implemented wind overlay pipeline (Open-Meteo provider, probing, mapping, soft-fail contract)
  - Created: `convex/actions/agent/providers/weather-provider.ts`
  - Created: `convex/actions/agent/tools/probe-conditions.ts`
  - Created: `convex/actions/agent/tools/map-conditions.ts`

### Decisions Made
- Chose **Open-Meteo** for POC wind data (no key, bounded probing).
- Kept wind severity focused on crosswind/gust thresholds; stable legend keys (`low/moderate/high`).
- Soft-fail contract: callers catch weather/mapping errors and return `conditionsStatus: 'unavailable'` without wind overlay.

### Issues/Blockers
- None.

### Next Steps
- Task 07: Implement `planRide` orchestration (LLM → validate sketches → compile → normalize → index → probe/map conditions with soft-fail).

## 2026-01-13 - Backend Engineer Agent - Sprint 3 Tasks 01–03 (errors, RouteSketch contract, routing provider stub)

### Status
- Current Sprint: sprint-3
- Task: Task 01–03 (planning error codes, RouteSketch model + Zod schemas, routing provider abstraction + compileSketch)
- Status: Completed

### Work Completed
- Added TRD §11 planning error codes + documented `throw new Error('CODE')` convention
  - Modified: `lib/errors.ts`
- Added validator-first `RouteSketch` contract with co-located Zod schemas for LangChain structured outputs
  - Created: `models/route-sketch.ts`
- Added co-located Zod schemas for `PlanInput` + nested planning shapes for LangChain tool schemas
  - Modified: `models/saved-routes.ts`
- Re-exported `RouteSketch` types from shared type barrel (type-only)
  - Modified: `types/index.ts`
- Implemented routing provider abstraction with deterministic mock provider + compileSketch tool
  - Created: `convex/actions/agent/providers/routing-provider.ts`
  - Created: `convex/actions/agent/tools/compile-sketch.ts`
- Added optional routing provider env vars (non-breaking)
  - Modified: `convex/lib/env.ts`

### Decisions Made
- Standardized server error throwing on string codes: `throw new Error('CODE')` where `CODE` is in `ServerErrorCode` to enable deterministic UI mapping.
- Kept Convex `v` validators as the source of truth; added co-located Zod schemas strictly for LangChain agent/tool boundaries.
- Implemented a deterministic mock routing provider so the Sprint 3 pipeline can proceed before a real routing integration is chosen.

### Issues/Blockers
- None.

### Next Steps
- Task 04: Normalize provider route output into `RouteSnapshot`.
- Task 05: Compute bounded `RouteIndex`.
- Task 06: Add conditions probing + wind overlay mapping (soft-fail).
- Task 07: Implement `actions.agent.planRide` orchestration using LangChain router agent + validation + provider compilation + normalization.

### Entry Template

```markdown
## [YYYY-MM-DD] - [Agent Name] - [Task/Session Title]

### Status
- Current Sprint: sprint-3
- Task: [task file or description]
- Status: [In Progress | Completed | Blocked]

### Work Completed
- [What changed]
- [Files created/modified]

### Decisions Made
- [Key decisions + rationale]

### Issues/Blockers
- [Anything blocking]

### Next Steps
- [Immediate next actions]
```
