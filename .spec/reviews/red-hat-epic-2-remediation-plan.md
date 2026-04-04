# Epic-2 Chat Infrastructure: Remediation Plan

**Date**: 2026-04-04
**Source**: Red-Hat Review
**Status**: 9 additional tasks created

---

## Executive Summary

The red-hat review identified **severe implementation gaps** in Epic-2. While original tasks (US-005 through US-014) are marked complete, critical security bugs, missing integrations, and build failures prevent the epic from shipping.

**9 remediation tasks have been created** and assigned to appropriate subagents.

---

## Task Assignment by Subagent

### convex-implementer (Backend Focus)

| Task ID | Title | Priority | Estimate | Dependencies |
|---------|-------|----------|----------|--------------|
| **US-015** | Fix Critical RLS Bypass in Session Messages | P0 | 60 min | US-007 |
| **US-017** | Extract Tool Results and Populate Route Attachments | P0 | 90 min | US-013 |
| **US-018** | Add Missing Validation to Convex Models | P1 | 60 min | US-008 |
| **US-023** | Fix TypeScript and Lint Errors | P0 | 180 min | ALL |

**Total for convex-implementer**: 6.5 hours

**Critical Path**:
1. US-015 (CRITICAL SECURITY BUG)
2. US-023 (BLOCKS DEPLOYMENT)

---

### react-native-ui-implementer (Non-Visible Frontend)

| Task ID | Title | Priority | Estimate | Dependencies |
|---------|-------|----------|----------|--------------|
| **US-016** | Wire useChatPlanning Hook to Backend | P0 | 180 min | US-011, US-013 |
| **US-019** | Improve Error Handling and Add Error UI | P1 | 120 min | US-011, US-013 |
| **US-020** | Fix React Anti-Patterns in Chat Components | P1 | 90 min | US-011, US-012 |
| **US-021** | Add Accessibility Labels and Screen Reader Support | P1 | 60 min | US-012 |
| **US-022** | Add Integration Tests for Chat-to-Route Flow | P1 | 180 min | US-016 |
| **US-023** | Fix TypeScript and Lint Errors | P0 | 180 min | ALL |

**Total for react-native-ui-implementer**: 13 hours

**Critical Path**:
1. US-016 (CORE FEATURE BROKEN)
2. US-023 (BLOCKS DEPLOYMENT)
3. US-022 (TEST COVERAGE)

---

### frontend-designer (Visible UI)

| Task ID | Title | Priority | Estimate | Dependencies |
|---------|-------|------|----------|--------------|
| **US-019** | Improve Error Handling and Add Error UI | P1 | 120 min | US-011, US-013 |

**Total for frontend-designer**: 2 hours

**Responsibilities**:
- Design error message component styling
- Ensure error UI matches semantic theme
- Design error state visual feedback

---

## Execution Order

### Phase 1: Critical Security & Build (MUST DO FIRST)

1. **US-015** (P0) - Fix RLS bypass
   - **Assignee**: convex-implementer
   - **Blocks**: Production deployment
   - **Time**: 60 min

2. **US-023** (P0) - Fix TypeScript/lint errors
   - **Assignee**: convex-implementer + react-native-ui-implementer
   - **Blocks**: All deployment
   - **Time**: 180 min

### Phase 2: Core Integration (Enables Feature)

3. **US-016** (P0) - Wire useChatPlanning to backend
   - **Assignee**: react-native-ui-implementer
   - **Blocks**: End-to-end functionality
   - **Time**: 180 min

4. **US-017** (P0) - Populate route attachments
   - **Assignee**: convex-implementer
   - **Blocks**: US-013 AC-5 completion
   - **Time**: 90 min

### Phase 3: Quality & Polish

5. **US-018** (P1) - Add validation
   - **Assignee**: convex-implementer
   - **Time**: 60 min

6. **US-019** (P1) - Error handling
   - **Assignee**: react-native-ui-implementer + frontend-designer
   - **Time**: 120 min

7. **US-020** (P1) - Fix React patterns
   - **Assignee**: react-native-ui-implementer
   - **Time**: 90 min

8. **US-021** (P1) - Accessibility
   - **Assignee**: react-native-ui-implementer
   - **Time**: 60 min

9. **US-022** (P1) - Integration tests
   - **Assignee**: react-native-ui-implementer + convex-implementer
   - **Time**: 180 min

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| **Total Tasks Created** | 9 |
| **Total Estimated Time** | 19.5 hours |
| **P0 (Critical)** | 4 tasks (810 min = 13.5 hours) |
| **P1 (Important)** | 5 tasks (630 min = 10.5 hours) |
| **convex-implementer** | 4 tasks (390 min = 6.5 hours) |
| **react-native-ui-implementer** | 5 tasks (630 min = 10.5 hours) |
| **frontend-designer** | 1 task (120 min = 2 hours) |

---

## Blocking Issues

### Cannot Ship Until:
1. ✅ US-015: RLS bypass fixed (security)
2. ✅ US-016: Frontend wired to backend (core feature)
3. ✅ US-017: Attachments populated (AC compliance)
4. ✅ US-023: Build succeeds (deployment)

### Should Fix Before Release:
5. US-018: Validation gaps
6. US-019: Error messaging
7. US-020: React patterns
8. US-021: Accessibility
9. US-022: Test coverage

---

## Next Steps

1. **Run `/kb-run-epic epic-2-chat-infrastructure`** to begin execution
2. Tasks are prioritized P0 first, then P1
3. Subagents will work in parallel where dependencies allow
4. All P0 tasks must complete before Epic can be marked done

---

## Files Created

All task files located at:
```
.spec/prds/v1/tasks/epic-2-chat-infrastructure/
├── US-015-fix-critical-rls-bypass.md
├── US-016-wire-chat-planning-to-backend.md
├── US-017-populate-route-attachments.md
├── US-018-add-validation-to-convex-models.md
├── US-019-improve-error-handling.md
├── US-020-fix-react-anti-patterns.md
├── US-021-add-accessibility-labels.md
├── US-022-add-integration-tests.md
└── US-023-fix-typescript-and-lint-errors.md
```

**Epic file updated**: `.spec/prds/v1/tasks/epic-2-chat-infrastructure/EPIC.md`
