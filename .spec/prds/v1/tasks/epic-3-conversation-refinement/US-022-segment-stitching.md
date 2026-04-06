# US-022: Segment Stitching & Partial Result Types

> Task ID: US-022
> Type: FEATURE
> Priority: P0
> Estimate: 60 minutes
> Assignee: backend-engineer

## CRITICAL CONSTRAINTS

### MUST
- Implement `stitchSegments()` that combines successful segment routes into a single `ProviderRouteResponse`
- Produce a valid `ProviderRouteResponse` with merged legs, unified bounds, and concatenated overview polyline
- Export `SegmentResult` and `SegmentCompilationResult` types for use by error feedback (US-023) and retry loop (US-025)

### NEVER
- Stitch failed segments — only `status: 'ok'` segments contribute to the stitched route
- Break the existing `ProviderRouteResponse` contract — the stitched result must be indistinguishable from a single-call result
- Re-encode polylines — concatenate the encoded strings (Google's encoded polyline format is concatenation-safe for overview display)

### STRICTLY
- Leg indices in the stitched result must be renumbered sequentially (0, 1, 2...) regardless of source segment indices
- Bounds must be the union (max envelope) of all segment bounds
- Distance and duration are summed across all successful legs

## SPECIFICATION

**Objective:** Combine independently-compiled route segments into a unified route that downstream code (normalizeRoute, map display) can consume without changes.

**Success looks like:** `stitchSegments()` takes a `SegmentResult[]` where some are ok and some failed, produces a `ProviderRouteResponse` from the ok segments, and the result passes through `normalizeRoute()` without errors.

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | 3 SegmentResults all with `status: 'ok'` | `stitchSegments()` is called | Returns ProviderRouteResponse with 3 legs, merged bounds, concatenated overview polyline | `npx vitest run convex/actions/agent/tools/compileSketch.test.ts` |
| 2 | 3 SegmentResults where segment 1 is `status: 'failed'` | `stitchSegments()` is called | Returns ProviderRouteResponse with 2 legs (from segments 0 and 2), legs renumbered 0,1 | `npx vitest run convex/actions/agent/tools/compileSketch.test.ts` |
| 3 | Stitched ProviderRouteResponse from 3 segments | Passed to `normalizeRoute()` | Returns valid RouteSnapshot with correct leg count and geometry | `npx vitest run convex/actions/agent/tools/compileSketch.test.ts` |
| 4 | 3 SegmentResults ALL `status: 'failed'` | `stitchSegments()` is called | Throws error (cannot stitch zero successful segments) | `npx vitest run convex/actions/agent/tools/compileSketch.test.ts` |

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | stitchSegments produces ProviderRouteResponse with correct leg count when all segments succeed | AC-1 | `npx vitest run convex/actions/agent/tools/compileSketch.test.ts -t "stitch all ok"` | [ ] TRUE [ ] FALSE |
| 2 | stitchSegments excludes failed segments and renumbers legs sequentially when partial failure occurs | AC-2 | `npx vitest run convex/actions/agent/tools/compileSketch.test.ts -t "stitch partial"` | [ ] TRUE [ ] FALSE |
| 3 | Stitched route passes through normalizeRoute without errors when fed valid segment results | AC-3 | `npx vitest run convex/actions/agent/tools/compileSketch.test.ts -t "stitch normalize"` | [ ] TRUE [ ] FALSE |
| 4 | stitchSegments throws error when all segments have failed status | AC-4 | `npx vitest run convex/actions/agent/tools/compileSketch.test.ts -t "stitch all failed"` | [ ] TRUE [ ] FALSE |

## GUARDRAILS

### WRITE-ALLOWED
- `convex/actions/agent/tools/compileSketch.ts` (MODIFY) — add `stitchSegments()`, export types
- `convex/actions/agent/tools/compileSketch.test.ts` (MODIFY) — add stitching tests

### WRITE-PROHIBITED
- `convex/actions/agent/tools/normalizeRoute.ts` — stitched output must be compatible as-is
- `convex/actions/agent/providers/routingProvider.ts` — provider types unchanged

## DESIGN

### References
- PRD: `.spec/prds/v1/tasks/epic-3-conversation-refinement/llm-first-routing-architecture.md` §2 (segment stitching)
- Existing: `convex/actions/agent/providers/routingProvider.ts:24-34` — ProviderRouteResponse type
- Existing: `convex/actions/agent/tools/normalizeRoute.ts` — downstream consumer of stitched result

### Interaction Notes
- Overview polyline: concatenate encoded polyline strings from each successful segment's `overviewGeometry.value`
- Bounds merging: `north = max(all norths)`, `south = min(all souths)`, `east = max(all easts)`, `west = min(all wests)`
- Leg renumbering: iterate successful segments in order, assign legIndex 0, 1, 2...

### Code Pattern
Source: `convex/actions/agent/providers/routingProvider.ts:24-34`

```typescript
type SegmentCompilationResult = {
  allSucceeded: boolean
  segments: SegmentResult[]
  stitchedRoute?: ProviderRouteResponse  // present when at least one segment succeeded
  failedSegments: SegmentResult[]        // convenience: just the failed ones
}

function stitchSegments(results: SegmentResult[]): ProviderRouteResponse {
  const ok = results.filter(r => r.status === 'ok' && r.route)
  if (ok.length === 0) throw new Error('All segments failed — cannot stitch')
  
  return {
    provider: 'google',
    bounds: mergeBounds(ok.map(r => r.route!.bounds)),
    overviewGeometry: {
      format: 'polyline',
      encoding: 'google_encoded_polyline',
      precision: 5,
      value: ok.map(r => r.route!.overviewGeometry.value).join(''),
    },
    legs: ok.flatMap((r, i) => r.route!.legs.map(leg => ({ ...leg, legIndex: i }))),
  }
}
```

### Anti-pattern (DO NOT)
Do NOT decode and re-encode polylines. Google's encoded polyline format supports concatenation for display purposes. Decoding/re-encoding would be wasteful and could introduce floating-point drift.

## CODING STANDARDS

- **`convex/_generated/ai/guidelines.md`**: Convex patterns
- **`brain/docs/TDD-METHODOLOGY.md`**: RED-GREEN-REFACTOR cycle

## DEPENDENCIES

Depends On:
- US-021 — provides `SegmentResult` type and `compileSegments()`

Blocks:
- US-023 (error feedback uses SegmentCompilationResult)
- US-025 (retry loop uses stitchSegments)

## REQUIRED READING

1. `convex/actions/agent/providers/routingProvider.ts`
   - Lines: 8-34 (ProviderPolylineGeometry, ProviderLeg, ProviderRouteResponse)
   - Focus: The shape that stitchSegments must produce

2. `convex/actions/agent/tools/normalizeRoute.ts`
   - Lines: ALL
   - Focus: How ProviderRouteResponse is consumed — stitched output must be compatible

## NOTES

- Polyline concatenation is valid for overview display. If precise distance calculations are needed later, a decode-merge-reencode approach would be required, but that's out of scope here.
- The `SegmentCompilationResult` wrapper type is the handoff contract between compilation (US-021), stitching (this task), error feedback (US-023), and retry (US-025).
