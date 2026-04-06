# US-025: Segment Retry Loop with LLM Revision

> Task ID: US-025
> Type: FEATURE
> Priority: P0
> Estimate: 90 minutes
> Assignee: backend-engineer

## CRITICAL CONSTRAINTS

### MUST
- When per-segment compilation returns partial failure, feed structured error back to the LLM and allow it to revise only the failed segments
- Cap retry attempts at 3 (including the initial attempt)
- On successful retry, merge the newly-compiled segments with previously-succeeded segments and stitch the full route

### NEVER
- Recompile segments that already succeeded — only failed segments get retried
- Allow infinite retries — hard cap at 3 total attempts (initial + 2 retries)
- Bypass the LLM for revision — the LLM must see the error and produce a revised sketch (not an automated fix)

### STRICTLY
- The retry loop happens at the agent level: error ToolResult → LLM sees it → LLM calls createRouteSketch with revised segments → compileSketch called again
- Track attempt count in the ToolResult metadata so the LLM knows how many retries remain
- After max retries exhausted with remaining failures, return the best partial route (most segments succeeded) with a user-facing message about which roads couldn't be routed

## SPECIFICATION

**Objective:** Enable the LLM to iteratively fix broken route segments by seeing specific failures and producing revised sketches, converging on a fully-valid route within 3 attempts.

**Success looks like:** LLM sketches a 4-segment route, segment 2 fails, LLM receives "Old La Honda Road doesn't connect Alice's to HMB — try Highway 84," LLM revises segment 2 only, recompile succeeds, full route delivered.

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | First attempt: segment 2 fails, segments 0,1,3 succeed | LLM receives error and calls createRouteSketch with revised segment 2 | Second compileSketch call only compiles revised segment 2 (not segments 0,1,3 again) | `npx vitest run convex/actions/agent/ridePlanningAgent.test.ts` |
| 2 | Second attempt: revised segment 2 now succeeds | compileSketch merges with cached segments 0,1,3 | Returns fully-stitched 4-segment route through normal pipeline | `npx vitest run convex/actions/agent/ridePlanningAgent.test.ts` |
| 3 | Three attempts exhausted, segment 2 still fails | Max retries reached | Returns best partial route (segments 0,1,3) with user message: "I routed most of the trip but couldn't find a path for [road name]. Here's what works." | `npx vitest run convex/actions/agent/ridePlanningAgent.test.ts` |
| 4 | Error feedback includes attempt count | LLM sees error ToolResult | Hint includes `attemptsRemaining: N` field | `npx vitest run convex/actions/agent/ridePlanningAgent.test.ts` |
| 5 | LLM calls compileSketch with a sketch that has the same succeeded segments unchanged | runCompileSketch detects unchanged segments | Skips recompilation of unchanged segments, only compiles modified/new segments | `npx vitest run convex/actions/agent/ridePlanningAgent.test.ts` |

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | runCompileSketch skips recompilation of previously-succeeded segments when revised sketch contains them unchanged | AC-1, AC-5 | `npx vitest run convex/actions/agent/ridePlanningAgent.test.ts -t "skip succeeded"` | [ ] TRUE [ ] FALSE |
| 2 | runCompileSketch stitches cached succeeded segments with newly-compiled revised segments into full route | AC-2 | `npx vitest run convex/actions/agent/ridePlanningAgent.test.ts -t "merge cached"` | [ ] TRUE [ ] FALSE |
| 3 | runCompileSketch returns partial route with user message after 3 failed attempts | AC-3 | `npx vitest run convex/actions/agent/ridePlanningAgent.test.ts -t "max retries"` | [ ] TRUE [ ] FALSE |
| 4 | Error ToolResult hint includes attemptsRemaining field decremented per retry | AC-4 | `npx vitest run convex/actions/agent/ridePlanningAgent.test.ts -t "attempt count"` | [ ] TRUE [ ] FALSE |

## GUARDRAILS

### WRITE-ALLOWED
- `convex/actions/agent/ridePlanningAgent.ts` (MODIFY) — add retry tracking, cached segment merging, max-retry fallback to `runCompileSketch()`
- `convex/actions/agent/ridePlanningAgent.test.ts` (MODIFY) — add retry loop tests
- `convex/actions/agent/lib/piTools.ts` (MODIFY) — add `previousSegmentResults` optional field to compileSketch schema for retry context

### WRITE-PROHIBITED
- `convex/actions/agent/tools/compileSketch.ts` — compilation logic unchanged from US-021/US-022
- `convex/actions/agent/runAgent.ts` — agent loop unchanged; retry is tool-level, not loop-level

## DESIGN

### References
- PRD: `.spec/prds/v1/tasks/epic-3-conversation-refinement/llm-first-routing-architecture.md` §3 (Rich Retry Feedback, retry diagram)
- Existing: `convex/actions/agent/ridePlanningAgent.ts:38-52` — pendingSketchStore pattern (reuse for caching succeeded segments)

### Interaction Notes
- Retry state is tracked per-session using the existing `pendingSketchStore` pattern — extend it to cache `succeededSegmentResults`
- The LLM doesn't call a special "retry" tool — it just calls `createRouteSketch` again with revised segments, then `compileSketch` as normal
- `runCompileSketch` detects retry context by checking if there are cached succeeded segments for this session
- Segment identity for "unchanged" detection: compare `(roadName, fromName, toName)` tuples between previous and new sketch

### Code Pattern
Source: `convex/actions/agent/ridePlanningAgent.ts:38-52` (pending sketch store)

```typescript
// Extend pending sketch store with segment cache
type PendingSketchState = {
  sketch: RouteSketch
  succeededSegments?: SegmentResult[]  // cached from previous attempt
  attemptCount: number                  // 1-based, max 3
}

// In runCompileSketch:
const state = getPendingSketchState(sessionId)
const attemptCount = state?.attemptCount ?? 1

if (state?.succeededSegments && sketch.segments.length > 0) {
  // Identify which segments are unchanged (same roadName + fromName + toName)
  const unchanged = findUnchangedSegments(sketch.segments, state.succeededSegments)
  const toCompile = sketch.segments.filter((_, i) => !unchanged.has(i))
  
  // Compile only changed segments
  const newResults = await compileSegments(toCompile, sketch.anchorPoints, preferences)
  
  // Merge: cached results for unchanged + new results for revised
  const merged = mergeSegmentResults(state.succeededSegments, newResults, unchanged)
  // ... stitch or error feedback
}
```

### Anti-pattern (DO NOT)
Do NOT implement retry logic inside the ReAct agent loop (`runAgent.ts`). The retry is emergent from the tool interaction: error ToolResult → LLM decides to revise → LLM calls tools again. The agent loop's existing maxSteps (10) naturally caps the conversation length.

## CODING STANDARDS

- **`convex/_generated/ai/guidelines.md`**: Convex patterns
- **`brain/docs/TDD-METHODOLOGY.md`**: RED-GREEN-REFACTOR cycle

## DEPENDENCIES

Depends On:
- US-023 — structured error feedback (the errors the LLM sees and responds to)
- US-024 — LLM-first prompt (the LLM must understand it should revise failed segments)

Blocks:
- None — this is the capstone task for the retry flow

## REQUIRED READING

1. `convex/actions/agent/ridePlanningAgent.ts`
   - Lines: 38-52 (pendingSketchStore)
   - Focus: Session-scoped state pattern to extend for retry caching

2. `convex/actions/agent/ridePlanningAgent.ts`
   - Lines: 373-533 (runCompileSketch)
   - Focus: Where retry detection and cached segment merging slots in

3. `convex/actions/agent/runAgent.ts`
   - Lines: 69-100 (runAgent config)
   - Focus: maxSteps=10 naturally limits retry conversations; no changes needed

## NOTES

- The retry loop is not a programmatic loop — it's an emergent multi-turn conversation. The LLM sees the error, decides to revise, and calls tools again. This keeps the LLM in control and allows it to ask the rider for input if needed.
- Segment identity matching (roadName + fromName + toName) is intentionally coarse. If the LLM changes a viaName but keeps the same road, we still recompile that segment — only exact road/endpoint matches skip recompilation.
- The 3-attempt cap counts compileSketch calls for the same session, not tool calls overall. Reset when the rider sends a new message.
