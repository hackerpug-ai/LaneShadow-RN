# LaneShadow Remaining Features - PRD

Complete the motorcycle scenic route planner with weather overlays, route management, personalization, and post-ride experience.

## PRD Metadata

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Appetite | 6 weeks |
| Scope Level | Full feature |
| Created | 2026-03-04 |
| Last Updated | 2026-03-04 |
| Prior Work | Phase 1 Core (90% complete) |

## Document Index

| File | Section | Stability |
|------|---------|-----------|
| [00-overview.md](./00-overview.md) | Product context, remaining scope | PRODUCT_CONTEXT |
| [01-scope.md](./01-scope.md) | In scope / out of scope | FEATURE_SPEC |
| [02-roles.md](./02-roles.md) | User roles | PRODUCT_CONTEXT |
| [03-functional-groups.md](./03-functional-groups.md) | Functional group overview | FEATURE_SPEC |
| [04-uc-p1gap.md](./04-uc-p1gap.md) | UC-P1GAP: Phase 1 Gap Closure | FEATURE_SPEC |
| [05-uc-sr.md](./05-uc-sr.md) | UC-SR: Saved Routes | FEATURE_SPEC |
| [06-uc-pers.md](./06-uc-pers.md) | UC-PERS: Personalization | FEATURE_SPEC |
| [07-uc-post.md](./07-uc-post.md) | UC-POST: Post-Ride Experience | FEATURE_SPEC |
| [08-technical-requirements.md](./08-technical-requirements.md) | Technical specifications | CONSTITUTION |

## Quick Stats

| Metric | Value |
|--------|-------|
| Functional Groups | 4 |
| Use Cases | 14 |
| Existing Components to Extend | 12 |
| New Components | 8 |
| Schema Extensions | 3 tables |

## Version History

| Version | Date | Changes | Trigger |
|---------|------|---------|---------|
| 1.0.0 | 2026-03-04 | Initial rescoped PRD from legacy PRD.md | Codebase analysis |

## Implementation Status (Context)

This PRD covers **remaining work only**. The following is already implemented:

### Completed (Phase 1 Core)
- Start/end location input with Google Places autocomplete
- Departure date and time selection
- 2-3 scenic-biased route options via LLM
- Wind exposure overlay on route polylines
- Route summaries with distance, duration, rationale
- Save routes with immutable snapshots
- Lightweight user accounts (Clerk auth)
- Map controls (zoom, recenter, clear)
- Route option cards with comparison

### Partially Complete
- Rain forecast overlay (data fetched, UI not integrated)
- Temperature overlay (data fetched, UI not integrated)
- Saved Routes screen (stub only)

## Next Steps

- `/kb-project-plan` - Build implementation plan
- `/pixel-perfect:design` - Generate UI design artifacts
- `/trd-plan` - Generate detailed TRD
