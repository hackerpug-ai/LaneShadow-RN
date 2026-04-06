# US-023: Rich Per-Segment Error Feedback to LLM

> Task ID: US-023
> Type: FEATURE
> Priority: P0
> Estimate: 75 minutes
> Assignee: backend-engineer

## CRITICAL CONSTRAINTS

### MUST
- Wire `compileSegments()` + `stitchSegments()` into `runCompileSketch()` in ridePlanningAgent.ts as the primary compilation path for LLM-authored sketches
- Return structured per-segment error feedback in `ToolResult` when any segment fails
- Include `retryGuidance: 'revise_failed_segments'` and a hint listing exactly which segments failed and why

### NEVER
- Remove the existing single-shot compilation path — it remains for deterministic orchestrator sketches (which have empty segments arrays)
- Return generic "ROUTING_COMPILE_FAILED" for per-segment failures — the whole point is granular feedback
- Include successful segment details in error messages — only report failures (LLM should keep successful segments unchanged)

### STRICTLY
- Dispatch path: if `sketch.segments.length > 0` → per-segment compilation; else → existing single-shot
- Error ToolResult must include structured JSON in the `hint` field with `succeeded[]` and `failed[]` arrays
- On full success (all segments ok), the stitched route flows through the existing `normalizeRoute` → `buildOptionsFromResults` path unchanged

## SPECIFICATION

**Objective:** Replace the opaque "ROUTING_COMPILE_FAILED" error with structured per-segment feedback so the LLM knows exactly which road segment broke and can surgically revise.

**Success looks like:** When segment 2 of a 4-segment sketch fails, the LLM receives a ToolResult error naming segment 2's road, the from/to points, the specific error, and guidance to revise only that segment — while segments 0, 1, 3 are marked as succeeded.

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | LLM-authored sketch with 3 valid segments (segments.length > 0) | `runCompileSketch()` is called | Uses per-segment compilation path, returns successful route via existing normalize pipeline | `npx vitest run convex/actions/agent/ridePlanningAgent.test.ts` |
| 2 | LLM-authored sketch where segment 1 fails | `runCompileSketch()` is called | Returns ToolResult with `type: 'error'`, hint containing `failed: [{segmentIndex: 1, roadName, fromName, toName, error}]` and `succeeded: [{segmentIndex: 0}, {segmentIndex: 2}]` | `npx vitest run convex/actions/agent/ridePlanningAgent.test.ts` |
| 3 | Deterministic orchestrator sketch (segments.length === 0) | `runCompileSketch()` is called | Uses existing single-shot compilation path unchanged | `npx vitest run convex/actions/agent/ridePlanningAgent.test.ts` |
| 4 | LLM-authored sketch where ALL segments fail | `runCompileSketch()` is called | Returns ToolResult error with all segments in `failed[]`, empty `succeeded[]`, retryGuidance: 'revise_failed_segments' | `npx vitest run convex/actions/agent/ridePlanningAgent.test.ts` |
| 5 | LLM-authored sketch with partial failure (2 of 3 segments ok) | `runCompileSketch()` is called | Error hint includes the stitched partial route geometry alongside failure details so LLM can show rider what worked | `npx vitest run convex/actions/agent/ridePlanningAgent.test.ts` |

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | runCompileSketch dispatches to compileSegments when sketch has segments | AC-1 | `npx vitest run convex/actions/agent/ridePlanningAgent.test.ts -t "per-segment dispatch"` | [ ] TRUE [ ] FALSE |
| 2 | runCompileSketch returns error ToolResult with structured failed/succeeded arrays when a segment fails | AC-2 | `npx vitest run convex/actions/agent/ridePlanningAgent.test.ts -t "segment error feedback"` | [ ] TRUE [ ] FALSE |
| 3 | runCompileSketch uses single-shot compilation when sketch has no segments | AC-3 | `npx vitest run convex/actions/agent/ridePlanningAgent.test.ts -t "single-shot fallback"` | [ ] TRUE [ ] FALSE |
| 4 | runCompileSketch returns all-failed error with revise_failed_segments guidance when every segment fails | AC-4 | `npx vitest run convex/actions/agent/ridePlanningAgent.test.ts -t "all segments failed"` | [ ] TRUE [ ] FALSE |
| 5 | runCompileSketch includes partial stitched geometry in error hint when some segments succeed and others fail | AC-5 | `npx vitest run convex/actions/agent/ridePlanningAgent.test.ts -t "partial geometry"` | [ ] TRUE [ ] FALSE |

## GUARDRAILS

### WRITE-ALLOWED
- `convex/actions/agent/ridePlanningAgent.ts` (MODIFY) — update `runCompileSketch()` with per-segment dispatch and error formatting
- `convex/actions/agent/ridePlanningAgent.test.ts` (MODIFY or NEW) — add tests for per-segment error path

### WRITE-PROHIBITED
- `convex/actions/agent/tools/compileSketch.ts` — already modified in US-021/US-022
- `convex/actions/agent/providers/routingProvider.ts` — provider layer unchanged
- `convex/actions/agent/lib/piTools.ts` — tool schema changes happen in US-025

## DESIGN

### References
- PRD: `.spec/prds/v1/tasks/epic-3-conversation-refinement/llm-first-routing-architecture.md` §3 (Rich Retry Feedback)
- Existing: `convex/actions/agent/ridePlanningAgent.ts:373-533` — current `runCompileSketch()` handler
- Existing: `convex/actions/agent/ridePlanningAgent.ts:67-73` — ToolResult type union

### Interaction Notes
- The dispatch decision (per-segment vs single-shot) is based on `sketch.segments.length > 0`
- Deterministic orchestrator produces sketches with `segments: []` (see `planRideOrchestrator.ts:140-150`)
- LLM-authored sketches always have populated segments
- The error hint is a JSON string embedded in `ToolResult.hint` — the LLM parses this to understand what to revise

### Code Pattern
Source: `convex/actions/agent/ridePlanningAgent.ts:502-531` (existing error handling)

```typescript
// In runCompileSketch, after sketch retrieval:
if (sketch.segments.length > 0) {
  // Per-segment path
  const { compileSegments, stitchSegments } = await import('./tools/compileSketch')
  const segmentResults = await compileSegments(sketch.segments, sketch.anchorPoints, preferences)
  const failed = segmentResults.filter(r => r.status === 'failed')
  
  if (failed.length === 0) {
    // All succeeded — stitch and continue through existing normalize path
    const providerRoute = stitchSegments(segmentResults)
    // ... existing normalize + buildOptionsFromResults flow
  } else {
    // Partial or total failure — rich error feedback
    const succeeded = segmentResults.filter(r => r.status === 'ok')
    return {
      type: 'error',
      message: `${failed.length} of ${segmentResults.length} road segments couldn't be routed.`,
      hint: JSON.stringify({
        type: 'partial_route',
        succeeded: succeeded.map(s => ({ segmentIndex: s.segmentIndex, roadName: s.roadName })),
        failed: failed.map(f => ({
          segmentIndex: f.segmentIndex,
          roadName: f.roadName,
          fromName: sketch.segments[f.segmentIndex].fromName,
          toName: sketch.segments[f.segmentIndex].toName,
          error: f.error,
          suggestion: f.suggestion,
        })),
        retryGuidance: 'revise_failed_segments',
        hint: 'Revise only the failed segments. Keep succeeded segments unchanged.',
      }),
      retryGuidance: 'revise_failed_segments',
    }
  }
} else {
  // Existing single-shot path (unchanged)
}
```

### Anti-pattern (DO NOT)
Do NOT include full route geometry in the error hint JSON. The LLM doesn't need polyline strings — it needs road names and failure reasons. Including geometry bloats the context window.

## CODING STANDARDS

- **`convex/_generated/ai/guidelines.md`**: Convex patterns
- **`brain/docs/TDD-METHODOLOGY.md`**: RED-GREEN-REFACTOR cycle

## DEPENDENCIES

Depends On:
- US-021 — `compileSegments()` function
- US-022 — `stitchSegments()` function and `SegmentResult` type

Blocks:
- US-025 (retry loop builds on this error feedback)

## REQUIRED READING

1. `convex/actions/agent/ridePlanningAgent.ts`
   - Lines: 373-533 (runCompileSketch)
   - Focus: Current compilation handler, error branching, ToolResult construction

2. `convex/actions/agent/ridePlanningAgent.ts`
   - Lines: 67-73 (ToolResult type)
   - Focus: Union type that error results must conform to

3. `convex/actions/agent/lib/planRideOrchestrator.ts`
   - Lines: 140-150 (buildSketchFromVariant)
   - Focus: Confirms deterministic sketches have `segments: []`

## NOTES

- The `hint` field is a JSON string. The LLM parses it to understand the structure. This is an established pattern in the codebase (see existing retryGuidance usage).
- When partial success occurs, we still include a note about the stitched partial geometry being available, but don't embed it in the hint. The LLM should revise failed segments and recompile the full sketch.
