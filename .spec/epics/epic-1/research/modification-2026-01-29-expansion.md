# Epic 1 Modification Record: v1.0 Expansion

**Date**: 2026-01-29
**Type**: Expansion
**Description**: Transform POC into comprehensive v1 with 3 phases

---

## Modification Summary

Expanded epic-1 from a 5-sprint POC to a 9-sprint v1.0 with three distinct phases:

1. **Phase 1: Core POC** (Sprints 1-5) — Original scope + rain/temp overlays
2. **Phase 2: Personalization** (Sprints 6-7) — Favorite roads, avoid areas, elevation
3. **Phase 3: Post-Ride** (Sprints 8-9) — Ratings, notes, history, time optimization

---

## Agent Analyses

### Engineering Manager

**Recommendation**: MODIFY (Phased Approach)

**Key Points**:
- Rain/temp overlays are low-effort (same Open-Meteo provider)
- Road surface quality has no free data source — deferred
- Elevation can use Open-Meteo (free, no API key)
- Post-ride features require 3 new tables
- Proposed 3-phase approach with incremental delivery

**Technical Concerns**:
- LLM context window growth with more overlay data
- Favorite road matching algorithm performance
- Analytics query complexity for ride history

### Product Manager

**Recommendation**: MODIFY (Phased with Prioritization)

**Key Points**:
- Rain overlay = HIGH priority (safety-critical)
- Temperature = MEDIUM (comfort)
- Analytics dashboard = VERY LOW (engagement before validation)
- Favorite roads = HIGH (addresses repeat rider behavior)
- Time optimization = LOW (nice-to-have)

**User Value Assessment**:
| Feature | User Job | Priority |
|---------|----------|----------|
| Rain overlay | Avoid weather surprises | HIGH |
| Favorite roads | Reuse known great roads | HIGH |
| Side-by-side comparison | Faster decisions | HIGH |
| Ride rating | Remember quality | MEDIUM |
| Analytics | See patterns | LOW |

### Scope Definer

**Recommendation**: MODIFY (Protect Sprint 4)

**Key Points**:
- 4x scope expansion requires phasing
- Sprint 4 (50% complete) must complete as planned
- Active sprint protection is critical
- Proposed 8-9 sprint total roadmap

**Sprint Impact**:
- Sprint 4: No changes (continue as planned)
- Sprint 5: Extended to include rain/temp overlays
- Sprints 6-9: New phases added

---

## Changes Made

### Files Created
- `.spec/epics/epic-1/trd/README.md` — TRD index and overview
- `.spec/epics/epic-1/trd/phase-2-personalization.md` — Phase 2 TRD
- `.spec/epics/epic-1/trd/phase-3-post-ride.md` — Phase 3 TRD
- `.spec/epics/epic-1/research/modification-2026-01-29-expansion.md` — This record

### Files Modified
- `.spec/epics/epic-1/PRD.md` — Expanded with phased roadmap and v1.0 scope
- `.spec/epics/epic-1/EPIC-ROADMAP.md` — Added Sprints 6-9, restructured

### Files Renamed/Moved
- `SPRINT_PLAN.md` → `EPIC-ROADMAP.md`
- `TRD.md` → `trd/phase-1-core.md`

---

## Downstream Flags

### Active Sprint Impact
- ⚠️ **Sprint 4**: No changes required — continue as planned
- ⚠️ **Sprint 5**: Scope expanded to include rain/temp overlays

### TRD Updates Required
- ✅ Phase 1 TRD preserved (moved to trd/phase-1-core.md)
- ✅ Phase 2 TRD created (trd/phase-2-personalization.md)
- ✅ Phase 3 TRD created (trd/phase-3-post-ride.md)

### Schema Changes Required (Future)
- Sprint 5: None (overlay schema extension only)
- Sprint 6: `user_preferences`, `favorite_roads` tables
- Sprint 8: `ride_history` table, `saved_routes` rating fields

---

## Deferred Features

| Feature | Reason | Future Consideration |
|---------|--------|---------------------|
| Road surface quality | No reliable free data source | v2 with crowdsourcing |
| Personal analytics dashboard | Engagement feature; needs usage data | v2 after history validates |
| Live ride tracking | Out of scope for planning app | Separate product |
| Social/sharing | Needs user base first | v2 |

---

## Next Steps

1. Complete Sprint 4 (UI implementation)
2. Start Sprint 5 with weather overlay additions
3. Begin Phase 2 design/spec refinement during Sprint 5
4. Validate Phase 1 before committing to Phase 2 development

---

## Contributors

- @engineering-manager — Technical feasibility, phasing strategy
- @product-manager — User value analysis, prioritization
- @scope-definer — Sprint impact, scope boundaries
