# Red-Hat Review Report

**Report Date**: 2026-04-04T12:00:00Z
**Target**: Epic-2 Chat Infrastructure
**Reviewed By**: product-manager, convex-reviewer, pi-reviewer, react-native-ui-reviewer

---

## Executive Summary

Epic-2 Chat Infrastructure has **severe implementation gaps** that prevent core functionality. While database schemas, state machines, and UI components exist, the **critical integration layer between frontend and backend is completely stubbed**. The epic cannot be marked complete.

**BLOCKING ISSUES**:
1. **CRITICAL SECURITY BUG**: RLS bypass in `listHandler` allows any user to read any other user's session messages
2. **FRONTEND-BACKEND DISCONNECT**: `useChatPlanning` hook is 100% stubbed with TODO comments — no actual chat-to-routes flow exists
3. **PI AGENT ARCHITECTURE MISMATCH**: Implementation uses Vercel AI SDK instead of required pi agent core
4. **TYPEBUILD BROKEN**: 50+ TypeScript compilation errors, 123 lint errors

---

## HIGH Confidence Findings (3+ Agents Agree)

### Security

- [ ] **CRITICAL: Row-Level Security Bypass** | Severity: CRITICAL
  - **Location**: `convex/db/sessionMessages.ts:87-99`
  - **Agents**: convex-reviewer, pi-reviewer
  - **Finding**: `listHandler` accepts `sessionId` but NEVER validates ownership. Authenticated user A can call `list({ sessionId: user_B_session_id })` and retrieve all messages.
  - **Fix**: Add session ownership validation before querying messages

### Frontend Integration

- [ ] **useChatPlanning is 100% Stubbed** | Severity: CRITICAL
  - **Location**: `hooks/use-chat-planning.ts:89-93, 149-201`
  - **Agents**: product-manager, react-native-ui-reviewer, pi-reviewer
  - **Finding**: All backend calls are TODO comments. Hook uses `setTimeout` simulation instead of calling `sendMessage` action.
  - **Evidence**: `// TODO: Replace with actual Convex actions when available`
  - **Fix**: Replace mock implementation with real `useAction(api.actions.agent.sendMessage)` calls

- [ ] **No Route Data from Chat** | Severity: CRITICAL
  - **Location**: `hooks/use-chat-planning.ts:182-186`
  - **Agents**: product-manager, react-native-ui-reviewer, pi-reviewer
  - **Finding**: Returns `options: []` — empty array. Users see empty route cards after "planning" completes.
  - **Impact**: Core value proposition completely broken
  - **Fix**: Wire backend response to dispatch action

### Backend Architecture

- [ ] **Pi Agent Implementation Mismatch** | Severity: CRITICAL
  - **Location**: `convex/actions/agent/ridePlanningAgent.ts:1-445`
  - **Agents**: pi-reviewer, convex-reviewer
  - **Finding**: US-013 requires pi agent core, but implementation uses Vercel AI SDK's `generateText`
  - **Evidence**: `import { generateText } from 'ai'` instead of `@mariozechner/pi-agent-core`
  - **Fix**: Rewrite using pi agent's `createAgent` API

- [ ] **Attachments Never Populated** | Severity: HIGH
  - **Location**: `convex/actions/agent/ridePlanningAgent.ts:428-443`
  - **Agents**: convex-reviewer, pi-reviewer, product-manager
  - **Finding**: Tools return route data but `attachments` array remains empty. AC-5 technically failing.
  - **Evidence**: `const attachments: Array<{ type: string; routePlanId?: string }> = []`
  - **Fix**: Extract tool results and populate attachments array

### Stubbed Tools

- [ ] **Three Tools Return Placeholders** | Severity: HIGH
  - **Location**: `convex/actions/agent/ridePlanningAgent.ts:192-267`
  - **Agents**: pi-reviewer, convex-reviewer, product-manager
  - **Finding**: `fetchWeather`, `saveRoute`, `searchFavorites` all return "coming soon" placeholders
  - **Evidence**: `// For now, return a placeholder response`
  - **Fix**: Implement actual functionality or return proper errors

### Build Issues

- [ ] **TypeScript Compilation Fails** | Severity: CRITICAL
  - **Agents**: convex-reviewer, react-native-ui-reviewer, pi-reviewer
  - **Finding**: `pnpm type-check` exits with 50+ errors. US-008 AC-4 requires compilation success.
  - **Impact**: Code cannot deploy
  - **Fix**: Resolve all TS errors

- [ ] **Lint Fails with 123 Errors** | Severity: HIGH
  - **Agents**: react-native-ui-reviewer, convex-reviewer
  - **Finding**: `pnpm lint` exits with errors
  - **Fix**: Address all lint violations

### Testing Issues

- [ ] **Test Theatre** | Severity: HIGH
  - **Location**: `hooks/use-chat-planning.test.ts`, `convex/actions/agent/__tests__/planRide.test.ts:159-167`
  - **Agents**: react-native-ui-reviewer, convex-reviewer, product-manager
  - **Finding**: Tests verify mock implementation, not real backend flow. `expect(true).toBe(true) // Placeholder`
  - **Impact**: Tests pass but feature doesn't work
  - **Fix**: Add integration tests for full ChatInput → backend → polyline flow

---

## MEDIUM Confidence Findings (2 Agents Agree)

### Missing Error Handling

- [ ] **Generic Error Messages** | Severity: MEDIUM
  - **Location**: `convex/actions/agent/sendMessage.ts:96-103`
  - **Agents**: convex-reviewer, product-manager
  - **Finding**: All errors convert to "I'm having trouble right now. Could you try again?" — not actionable
  - **Fix**: Map specific error codes to conversational messages

- [ ] **No Error State UI** | Severity: HIGH
  - **Location**: `hooks/use-chat-planning.ts:221-224`
  - **Agents**: react-native-ui-reviewer, product-manager
  - **Finding**: PLANNING_ERROR dispatched but no UI renders error messages
  - **Fix**: Add error message rendering component

### Missing Validation

- [ ] **Missing Message Content Validation** | Severity: MEDIUM
  - **Location**: `convex/db/sessionMessages.ts:78`
  - **Agents**: convex-reviewer, pi-reviewer
  - **Finding**: No validation that content is non-empty string
  - **Fix**: Add `v.string().min(1)` validation

- [ ] **Missing Month Format Validation** | Severity: MEDIUM
  - **Location**: `models/plan-usage.ts:12`
  - **Agents**: convex-reviewer, product-manager
  - **Finding**: `month: v.string()` accepts any format, not just "YYYY-MM"
  - **Fix**: Add regex validation for `^\d{4}-\d{2}$`

### React Anti-Patterns

- [ ] **useState Duplication** | Severity: MEDIUM
  - **Location**: `components/chat/chat-input.tsx:129`
  - **Agents**: react-native-ui-reviewer, convex-reviewer
  - **Finding**: Local text state duplicates parent state
  - **Fix**: Lift state to parent or use uncontrolled input

- [ ] **Missing setTimeout Cleanup** | Severity: MEDIUM
  - **Location**: `hooks/use-chat-planning.ts:179-201`
  - **Agents**: react-native-ui-reviewer, convex-reviewer
  - **Finding**: Async operation in useEffect without cleanup
  - **Risk**: Memory leak if component unmounts during timeout
  - **Fix**: Store timer ID in ref and cleanup

### Accessibility Gaps

- [ ] **Missing Accessibility Labels** | Severity: MEDIUM
  - **Location**: `components/chat/chat-input.tsx:188-203`
  - **Agents**: react-native-ui-reviewer, product-manager
  - **Finding**: TextInput lacks `accessibilityLabel`
  - **Fix**: Add `accessibilityLabel="Chat input field"`

- [ ] **No Screen Reader Announcements** | Severity: MEDIUM
  - **Location**: `components/chat/chat-input.tsx:32-63`
  - **Agents**: react-native-ui-reviewer, product-manager
  - **Finding**: PlanningProgress component uses only visual text
  - **Fix**: Add `accessibilityLiveRegion="polite"`

---

## LOW Confidence Findings (Single Agent)

- [ ] **Title Truncation UX** | Severity: LOW
  - **Agent**: convex-reviewer
  - **Finding**: `title: args.firstMessage.slice(0, 50)` truncates silently
  - **Fix**: Add explicit validation and warning

- [ ] **Hardcoded Border Widths** | Severity: LOW
  - **Agent**: react-native-ui-reviewer
  - **Finding**: `borderWidth: 1` in StyleSheet
  - **Fix**: Use semantic token

---

## Agent Contradictions & Debates

| Topic | Agent A | Agent B | Assessment |
|-------|---------|---------|------------|
| **Session Parameter** | product-manager notes `firstMessage` parameter mismatch with spec | convex-reviewer confirmed parameter exists but naming inconsistent | **Valid**: Spec says auto-generate title, implementation requires passing message |
| **Refinement Counting** | product-manager questions if all refinements should count | convex-reviewer notes implementation counts all | **Design decision needed**: Clarify if "free refinement" allowance needed |
| **Progress Indicator** | react-native-ui-reviewer flags fake 2s phases | product-manager notes 12s timeout requirement | **Valid**: Fake progress doesn't reflect real backend status |

---

## Recommendations by Category

### Security (Must Fix Before Ship)
1. **Add RLS check** to `listHandler` before querying messages
2. **Validate session ownership** in all session message operations

### Critical Integration (Must Fix Before Ship)
3. **Wire useChatPlanning to backend** — replace all TODO comments with real `sendMessage` calls
4. **Extract tool results** and populate attachments array
5. **Fix TypeScript compilation** — resolve all 50+ errors

### Architecture (Should Fix)
6. **Rewrite agent using pi core** or update spec to allow Vercel AI SDK
7. **Implement or remove stubbed tools** (weather, saveRoute, searchFavorites)
8. **Add session state persistence** to agent workflow

### UX/Accessibility (Should Fix)
9. **Add error message display** for PLANNING_ERROR state
10. **Add accessibility labels** to all interactive elements
11. **Add screen reader announcements** for phase updates

### Testing (Should Fix)
12. **Add integration test** for full ChatInput → backend → polyline flow
13. **Remove vanity tests** (`expect(true).toBe(true)`)

---

## Agent Reports (Summary)

- **product-manager**: 18 HIGH confidence findings — focused on product gaps, scope risks, unvalidated assumptions
- **convex-reviewer**: 8 HIGH confidence findings — identified CRITICAL RLS bypass, missing validation, attachment stub bug
- **pi-reviewer**: 8 HIGH confidence findings — flagged pi agent architecture mismatch, tool stubs, missing attachment handling
- **react-native-ui-reviewer**: 18 HIGH confidence findings — found critical frontend wire-up gaps, test theatre, accessibility violations

---

## Metadata

- **Agents**: 4 specialized reviewers
  - product-manager (Glob, Grep, Read, Write, Bash)
  - convex-reviewer (Glob, Grep, Read, Write, Bash, Task)
  - pi-reviewer (Glob, Grep, Read, Write, Bash, Task)
  - react-native-ui-reviewer (Glob, Grep, Read, Write, Bash, Task)
- **Confidence Framework**: HIGH (3+ agents), MEDIUM (2 agents), LOW (1 agent)
- **Report Generated**: 2026-04-04T12:00:00Z
- **Duration**: ~4 minutes parallel execution
- **Next Steps**: **DO NOT SHIP** — Route back to implementation with critical focus on security bug, frontend wire-up, and pi agent architecture
