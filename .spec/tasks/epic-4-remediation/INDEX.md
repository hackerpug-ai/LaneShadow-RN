# Epic 4 Remediation - Task Index

**Epic**: Complete Save & Reuse Favorite Roads
**Status**: REMEDIATION REQUIRED
**Total Tasks**: 8
**Total Estimate**: 695 minutes (11.5 hours)

---

## Task List

| ID | Title | Type | Estimate | Priority | Status |
|----|-------|------|----------|----------|--------|
| [US-046](./US-046.md) | Implement "Include Favorite Roads" Toggle | FEATURE | 60min | P0 | Pending |
| [US-047](./US-047.md) | Integrate Favorites with Planning Graph | FEATURE + SPIKE | 240min | P0 | Pending |
| [US-048](./US-048.md) | Build Favorite Inclusion Indicator | FEATURE | 90min | P0 | Pending |
| [US-049](./US-049.md) | Build "Couldn't Include" Message | FEATURE | 75min | P0 | Pending |
| [US-050](./US-050.md) | Wire Long-Press to Home Map | FEATURE | 30min | P0 | Pending |
| [US-051](./US-051.md) | Wire SaveFavoriteSheet Integration | FEATURE | 30min | P0 | Pending |
| [US-052](./US-052.md) | Add E2E Test for Full Flow | TESTING | 60min | P0 | Pending |
| [US-053](./US-053.md) | Accessibility Verification | TESTING | 30min | P0 | Pending |

---

## Execution Order

### Phase 1: Foundation (US-046)
- **US-046**: Add toggle to PlanRideSheet
- No dependencies, can start immediately

### Phase 2: Backend Integration (US-047)
- **US-047**: Integrate favorites with planning graph
- **Spike first** (60min) to verify API capability
- Depends on: US-046

### Phase 3: UI Feedback (US-048, US-049)
- **US-048**: Favorite inclusion indicator badge
- **US-049**: Exclusion message for distant favorites
- Both depend on: US-047

### Phase 4: Save Flow (US-050, US-051)
- **US-050**: Wire long-press to home map
- **US-051**: Wire SaveFavoriteSheet integration
- US-051 depends on: US-050

### Phase 5: Quality Gates (US-052, US-053)
- **US-052**: E2E test for full flow
- **US-053**: Accessibility verification
- US-052 depends on: US-047, US-051
- US-053 depends on: All features

---

## Critical Path

The critical path for completing this epic is:

```
US-046 (60min)
  ↓
US-047 Spike (60min)
  ↓
US-047 Implementation (180min)
  ↓
US-048 (90min) + US-049 (75min) [parallel]
  ↓
US-052 (60min)
  ↓
US-053 (30min)
```

**Critical Path Total**: ~555 minutes (9.25 hours)

The save flow (US-050, US-051) can be completed in parallel with the backend integration phase.

---

## Dependencies

### External Dependencies
- Planning graph API capability (verified in US-047 spike)
- Existing components from US-042, US-043, US-044, US-045

### Task Dependencies
```
US-046 → US-047 → US-048, US-049 → US-052 → US-053
                    ↓
US-050 → US-051 → US-052
```

---

## Acceptance Criteria Coverage

| AC | Description | Task(s) |
|----|-------------|---------|
| AC-1 | Include Favorites Toggle | US-046 |
| AC-2 | Favorites Influence Route Planning | US-047 |
| AC-3 | Favorites Proximity Filter | US-047 |
| AC-4 | Favorite Inclusion Indicator | US-048 |
| AC-5 | Favorite Exclusion Feedback | US-049 |
| AC-6 | Long-Press to Save Favorite | US-050 |
| AC-7 | Save Favorite Sheet Integration | US-051 |

**Quality Gates**:
- Functional: US-052 (E2E test)
- Performance: Verified in US-047
- Accessibility: US-053
- Testing: US-052

---

## Risk Mitigation

| Risk | Task | Mitigation |
|------|------|------------|
| Planning graph doesn't support favorites | US-047 | Spike first, verify API before implementation |
| Long-press gesture conflicts | US-050 | Test gesture priority, add alternative trigger |
| A11y requirements block completion | US-053 | Test early, use standard components |
| Performance degradation | US-047 | Implement caching, pagination |

---

## Completion Checklist

Before marking this epic complete:

- [ ] All 8 tasks marked as completed
- [ ] All 7 acceptance criteria passing
- [ ] E2E test passing (US-052)
- [ ] Accessibility audit passing (US-053)
- [ ] No critical/high-severity bugs
- [ ] Performance benchmarks met
- [ ] Code review approved
- [ ] Documentation updated

---

## References

- [PRD](../prd/epic-4-remediation.md)
- [Epic Overview](./EPIC.md)
- [Red-hat Review](../reviews/red-hat-epic-4-final.md)
- [Original Epic 4 Summary](../epic-4/EPIC-4-SUMMARY-UPDATED.md)
