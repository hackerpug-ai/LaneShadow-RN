# EPIC-4-REMEDIATION: Complete Save & Reuse Favorite Roads

**Status**: REMEDIATION REQUIRED
**Priority**: P0
**Type**: Feature Completion
**Epic Lead**: TBD
**Start Date**: 2026-04-08

---

## Overview

Epic 4 (Save & Reuse Favorite Roads) is **INCOMPLETE**. The foundation exists (schema, CRUD, UI components), but critical integration work is missing. This epic completes the feature by wiring components to the map, integrating favorites with route planning, and adding user feedback.

### Current State

**COMPLETED**:
- ✅ US-040: `favorite_roads` table schema
- ✅ US-041: `favoriteRoads` CRUD operations
- ✅ US-044: FavoriteRoadCard with mini map
- ✅ US-045: Favorite Roads settings section

**PARTIAL** (built but unwired):
- ⚠️ US-042: Long-press gesture handler (component only)
- ⚠️ US-043: SaveFavoriteSheet (component only)

**MISSING**:
- ❌ US-046: "Include favorite roads" toggle
- ❌ US-047: Favorites integration with planning graph
- ❌ US-048: Favorite inclusion indicator badge
- ❌ US-049: "Couldn't include" message for distant favorites
- ❌ US-050: Long-press wiring to home map
- ❌ US-051: SaveFavoriteSheet integration
- ❌ US-052: E2E test coverage
- ❌ US-053: Accessibility verification

---

## Success Criteria

### Functional
- [ ] All 7 acceptance criteria passing
- [ ] End-to-end flow works: save → plan → display feedback
- [ ] Favorites persist across app restarts

### Performance
- [ ] Favorites fetch <500ms for 100 favorites
- [ ] Planning latency +1s max when favorites enabled
- [ ] No N+1 queries when loading favorites list

### Accessibility
- [ ] Long-press has alternative trigger (VoiceOver/TalkBack)
- [ ] Toggle is reachable with assistive tech
- [ ] Favorite inclusion badge is accessible
- [ ] Touch targets meet 44×44px minimum

### Testing
- [ ] Integration test covers full user journey
- [ ] Unit tests for planning graph integration
- [ ] E2E test verifies save → plan → display flow

---

## Task Breakdown

| Task | Title | Estimate | Status | Dependencies |
|------|-------|----------|--------|--------------|
| US-046 | Implement "Include favorite roads" toggle | 60min | Pending | None |
| US-047 | Integrate favorites with planning graph | 240min | Pending | US-046 |
| US-048 | Build favorite inclusion indicator | 90min | Pending | US-047 |
| US-049 | Build "couldn't include" message | 75min | Pending | US-047 |
| US-050 | Wire long-press to home map | 30min | Pending | None |
| US-051 | Wire SaveFavoriteSheet integration | 30min | Pending | US-050 |
| US-052 | Add E2E test for full flow | 60min | Pending | US-047, US-051 |
| US-053 | Accessibility verification | 30min | Pending | All features |

**Total Estimate**: 11.5 hours (695 minutes)

---

## Critical Path

1. **US-046** (Toggle) → **US-047** (Planning integration) → **US-048/US-049** (UI feedback)
2. **US-050** (Long-press) → **US-051** (Save sheet)
3. **US-052** (E2E test) - depends on both paths
4. **US-053** (A11y) - final gate

---

## Dependencies

### Leverage Existing Work
- `favorite_roads` table schema (US-040)
- `favoriteRoads.insert`, `.listByOwner`, `.get`, `.remove` (US-041)
- `FavoriteRoadCard` component (US-044)
- Settings section infrastructure (US-045)

### External Dependencies
- Planning graph API (may need modification)
- Route geometry data structures
- Home map gesture handling

---

## Risk Factors

| Risk | Impact | Mitigation |
|------|--------|------------|
| Planning graph doesn't support favorites | HIGH | Spike in US-047 to verify API capability |
| Long-press conflicts with existing gestures | MEDIUM | Test gesture priority, add alternative trigger |
| Favorites fetch degrades performance | MEDIUM | Implement pagination, add caching |
| A11y requirements block completion | LOW | Use standard RN components, test early |

---

## Out of Scope

- Favorite sharing (user-to-user)
- Favorite folders/collections
- Favorite import/export
- Analytics on favorite usage
- Route replay with favorites highlighted

---

## References

- PRD: `.spec/prd/epic-4-remediation.md`
- Red-hat review: `.spec/reviews/red-hat-epic-4-final.md`
- Epic 4 summary: `.spec/tasks/epic-4/EPIC-4-SUMMARY-UPDATED.md`
- Task inventory: `.spec/tasks/epic-4/EPIC-4-INVENTORY-UPDATED.json`
