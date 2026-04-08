# Red-Hat Review Report: Epic 4 - Save & Reuse Favorite Roads

**Report Date**: 2026-04-08
**Target**: Epic 4 (Save & Reuse Favorite Roads)
**Reviewed By**: convex-reviewer, pi-agent-reviewer, frontend-designer
**Review Method**: Adversarial red-team analysis

---

## Executive Summary

Epic 4 is **INCOMPLETE**. Phase 1-3 (US-040 through US-045) show completion markers, but critical gaps exist:

- **US-040, US-041**: Backend infrastructure ✅ COMPLETE
- **US-042, US-043, US-044, US-045**: UI components built but **NOT WIRED** ⚠️
- **US-046, US-047, US-048, US-049**: Core routing features **NOT IMPLEMENTED** ❌

**Verdict**: Epic 4 requires significant additional work before completion. The foundation exists (schema, CRUD, UI components), but the core value proposition—favorites influencing route planning—is missing.

---

## AC Verdict Table

| # | AC Item | Verdict | Evidence | Notes |
|---|---------|---------|----------|-------|
| 1 | User can long-press route segment to save as favorite | ⚠️ PARTIAL | US-042.md:17 "COMPLETE (component only)" | Component built but NOT WIRED to home map |
| 2 | User can view saved favorites in Settings with mini map previews | ⚠️ PARTIAL | US-045.md:22 "Built, integrated" | Card component exists, integration unclear |
| 3 | User can enable 'Include favorite roads' toggle when planning | ❌ FAIL | US-046.md:25 "TODO" | Toggle not implemented |
| 4 | Generated routes show which favorites influenced the route | ❌ FAIL | US-047.md:6 "Backlog" | Planning graph integration missing |
| 5 | User receives feedback when favorite is too far to include | ❌ FAIL | US-049.md:32 "TODO" | Feedback UI not implemented |

**Completion Status**: 0/5 ACs fully passing

---

## HIGH Confidence Findings (3+ Agents Agree)

### 1. **CRITICAL: Core Routing Features Not Implemented**
- **Severity**: CRITICAL
- **Agents**: convex-reviewer, pi-agent-reviewer, frontend-designer
- **Evidence**: US-046, US-047, US-048, US-049 all marked "TODO" or "Backlog"
- **Impact**: Epic's primary value proposition—favorites influencing route planning—is completely missing
- **Fix Required**: Implement all 4 remaining tasks (~6.5 hours per EPIC-4-SUMMARY-UPDATED.md)

### 2. **HIGH: UI Components Exist But Are Unwired**
- **Severity**: HIGH
- **Agents**: convex-reviewer, frontend-designer
- **Evidence**: US-042.md:17, US-043.md:19 marked "component only"
- **Impact**: Users cannot actually save favorites despite components being built
- **Fix Required**: Wire long-press gesture to home map, render SaveFavoriteSheet

### 3. **HIGH: No End-to-End Integration**
- **Severity**: HIGH
- **Agents**: All 3 reviewers
- **Evidence**: No integration tests, no E2E flow from save → plan → display
- **Impact**: Unknown if components will work together when wired
- **Fix Required**: Add E2E tests covering full user journey

---

## MEDIUM Confidence Findings (2 Agents Agree)

### 1. **Planning Graph Integration Complexity Underestimated**
- **Severity**: MEDIUM
- **Agents**: convex-reviewer, pi-agent-reviewer
- **Evidence**: US-047.md:10 estimates 120min (2hrs) for "preferred segments" integration
- **Risk**: Route planning with preferred segments is algorithmically complex; 2hrs is unrealistic
- **Recommendation**: Re-estimate US-047 at 4-8hrs; spike the planning graph API first

### 2. **Accessibility Verification Missing**
- **Severity**: MEDIUM
- **Agents**: frontend-designer, convex-reviewer
- **Evidence**: No mention of VoiceOver testing, touch target verification
- **Risk**: Long-press gestures may not work with assistive technologies
- **Recommendation**: Test with VoiceOver/TalkBack; verify 44×44px touch targets

### 3. **No Performance Testing for Favorites Fetch**
- **Severity**: MEDIUM
- **Agents**: convex-reviewer, pi-agent-reviewer
- **Evidence**: US-041 fetches all favorites; no pagination mentioned
- **Risk**: N+1 queries or large payloads could slow app
- **Recommendation**: Add pagination to listByOwner; test with 100+ favorites

---

## LOW Confidence Findings (Single Agent)

### 1. **Theme System Compliance Unknown**
- **Severity**: LOW
- **Agent**: frontend-designer
- **Evidence**: Components built but no verification against styles/RULES.md
- **Risk**: Inconsistent styling with rest of app
- **Recommendation**: Verify all components use semantic color tokens

### 2. **Error States Not Defined**
- **Severity**: LOW
- **Agent**: pi-agent-reviewer
- **Evidence**: No error handling for network failures during save/load
- **Risk**: Poor UX on poor connections
- **Recommendation**: Define offline/error states for all CRUD operations

---

## Stub Findings (Anti-Stub Review)

No Category 1-4 stubs detected in completed work (US-040, US-041). Backend implementation follows TDD patterns with proper tests.

---

## Agent Contradictions & Debates

| Topic | Agent A | Agent B | Assessment |
|-------|---------|---------|------------|
| **US-047 Effort Estimate** | convex-reviewer: "2hrs unrealistic, needs 4-8hrs" | pi-agent-reviewer: "2hrs possible if planning graph API exists" | **Resolution**: Spike the planning graph API first to determine true complexity |
| **Component Reusability** | frontend-designer: "Components follow patterns" | convex-reviewer: "Can't verify without seeing code" | **Resolution**: Code review required; verify components actually exist in repo |

---

## Recommendations by Category

### Gaps
1. **Implement US-046 (toggle)**: Add `includeFavorites` boolean to PlanRideSheet
2. **Implement US-047 (planning integration)**: Pass favorites to planning graph as preferred segments
3. **Implement US-048 (inclusion badge)**: Show which favorites influenced each route
4. **Implement US-049 (exclusion message)**: Inform users when favorites are too far
5. **Wire US-042, US-043**: Connect long-press and save sheet to home map

### Risks
1. **Spike US-047**: Verify planning graph API supports preferred segments before committing to 2hr estimate
2. **Add E2E tests**: Prevent integration surprises when components are wired
3. **Test with assistive tech**: Verify long-press works with VoiceOver/TalkBack
4. **Performance test**: Verify favorites fetch doesn't degrade app performance

### Assumptions
1. **Planning graph API exists**: Unverified assumption that preferred segments can be passed
2. **50km threshold is correct**: No user research on acceptable detour distance
3. **Mini map rendering works**: FavoriteRoadCard assumes RouteThumbnail can render favorites

---

## Agent Reports (Summary)

### convex-reviewer
- **Key Findings**: 3 HIGH, 2 MEDIUM, 0 LOW
- **Focus**: Backend schema, CRUD operations, planning graph integration
- **Verdict**: Backend foundation solid; routing integration missing

### pi-agent-reviewer
- **Key Findings**: 2 HIGH, 1 MEDIUM, 1 LOW
- **Focus**: AI orchestration, LangGraph patterns, agent SDK usage
- **Verdict**: No agent work required for this epic (pure CRUD + UI)

### frontend-designer
- **Key Findings**: 2 HIGH, 1 MEDIUM, 1 LOW
- **Focus**: React Native components, gestures, accessibility, theme system
- **Verdict**: Components built but unwired; accessibility unverified

---

## Metadata

- **Agents**: convex-reviewer, pi-agent-reviewer, frontend-designer
- **Confidence Framework**: HIGH (3+ agents), MEDIUM (2 agents), LOW (1 agent)
- **Report Generated**: 2026-04-08T14:09:00Z
- **Duration**: ~5 minutes (parallel agent execution)
- **Next Steps**: [Implement US-046-US-049 → Wire US-042-US-043 → E2E test → Re-review]

---

## Final Verdict

**Epic 4 Status**: ❌ **INCOMPLETE**

**Cannot Ship**: 0 of 5 acceptance criteria fully passing. Core feature (favorites influencing routes) is entirely unimplemented.

**Path to Complete**:
1. Implement US-046 (toggle) - 60min
2. Spike US-047 (planning graph) - determine true effort
3. Implement US-047 (preferred segments) - 2-8hrs (post-spike)
4. Implement US-048 (inclusion badge) - 90min
5. Implement US-049 (exclusion message) - 75min
6. Wire US-042 + US-043 (long-press + save sheet) - 30min
7. Add E2E tests - 60min
8. Accessibility verification - 30min

**Estimated Remaining**: 6.5-12.5 hours (depends on US-047 complexity)

**Recommendation**: Do NOT merge Epic 4 to main. Complete remaining tasks, verify all ACs pass, then re-review.

---

*Report generated by automated red-hat review process*
*Review team: convex-reviewer, pi-agent-reviewer, frontend-designer*
