# US-062: OSM Road Lookup Tool (Verify Road Exists + Get Attributes)

> Task ID: US-062
> Type: FEATURE
> Priority: P0
> Estimate: 90 minutes
> Assignee: backend-engineer

## CRITICAL CONSTRAINTS

### MUST
- Create a new agent tool `lookupRoad` that queries Overpass API by road name within a bounding box
- Return structured data: road exists (boolean), road geometry (simplified), highway class, surface type, and any name variants
- Reuse the existing Overpass integration pattern from `findScenicWaypoints.ts` (same endpoint, timeout, retry logic)

### NEVER
- Make the LLM skip this tool when it "knows" the road — the tool MUST be available and the system prompt must encourage use
- Query the entire planet — always scope to a bounding box derived from the start/end region
- Block on Overpass failures — if Overpass is down, return a "unverified" status so the LLM can proceed with lower confidence

### STRICTLY
- Overpass query timeout: 8s (match existing `OVERPASS_TIMEOUT_MS`)
- Return max 5 matching ways per query (road name may match multiple segments)
- Use the same `retryOnce` + `withTimeout` pattern from `findScenicWaypoints.ts`

## SPECIFICATION

**Objective:** Give the LLM agent a tool to verify that a road name it's about to include in a route sketch actually exists in the target region, and get its attributes (surface, highway class).

**Success looks like:** LLM calls `lookupRoad("Skyline Boulevard", {bbox})` and gets back `{ exists: true, highway: "secondary", surface: "asphalt", geometry: [...simplified coords...] }` — or `{ exists: false, suggestions: ["Skyline Drive"] }` for non-existent roads.

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | A valid road name ("Skyline Boulevard") and a bounding box around the SF Bay Area | `lookupRoad` is called | Returns `exists: true` with highway class, surface type, and simplified geometry | `npx vitest run convex/actions/agent/tools/__tests__/lookupRoad.test.ts -t "existing road"` |
| 2 | A non-existent road name ("Fake Mountain Highway") and a bounding box | `lookupRoad` is called | Returns `exists: false` with empty geometry and up to 3 similar name suggestions from fuzzy matching | `npx vitest run convex/actions/agent/tools/__tests__/lookupRoad.test.ts -t "non-existent road"` |
| 3 | A valid road name but Overpass API is unreachable (timeout) | `lookupRoad` is called | Returns `{ exists: null, status: 'unverified', reason: 'overpass_timeout' }` — does NOT throw | `npx vitest run convex/actions/agent/tools/__tests__/lookupRoad.test.ts -t "overpass timeout"` |
| 4 | A road name with multiple matching ways (e.g., "Main Street" in a city) | `lookupRoad` is called | Returns max 5 matching ways, sorted by highway class priority (primary > secondary > tertiary) | `npx vitest run convex/actions/agent/tools/__tests__/lookupRoad.test.ts -t "multiple matches"` |

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | lookupRoad returns exists=true with highway class and surface for a known road in the bounding box | AC-1 | `npx vitest run convex/actions/agent/tools/__tests__/lookupRoad.test.ts -t "existing road"` | [ ] TRUE [ ] FALSE |
| 2 | lookupRoad returns exists=false with name suggestions for a road not found in the bounding box | AC-2 | `npx vitest run convex/actions/agent/tools/__tests__/lookupRoad.test.ts -t "non-existent road"` | [ ] TRUE [ ] FALSE |
| 3 | lookupRoad returns unverified status without throwing when Overpass times out | AC-3 | `npx vitest run convex/actions/agent/tools/__tests__/lookupRoad.test.ts -t "overpass timeout"` | [ ] TRUE [ ] FALSE |
| 4 | lookupRoad returns at most 5 ways sorted by highway class when multiple matches exist | AC-4 | `npx vitest run convex/actions/agent/tools/__tests__/lookupRoad.test.ts -t "multiple matches"` | [ ] TRUE [ ] FALSE |

## GUARDRAILS

### WRITE-ALLOWED
- `convex/actions/agent/tools/lookupRoad.ts` (NEW) — new tool implementation
- `convex/actions/agent/tools/__tests__/lookupRoad.test.ts` (NEW) — tests
- `convex/actions/agent/lib/piTools.ts` (MODIFY) — add `lookupRoad` schema to AgentToolSchemas

### WRITE-PROHIBITED
- `convex/actions/agent/tools/findScenicWaypoints.ts` — read for patterns only, do not modify
- `convex/actions/agent/ridePlanningAgent.ts` — wiring happens in US-069

## DESIGN

### References
- Research: holocron doc `js71smnvvxr3k1z5gmbydspsh184bqz7` §1 (Grounding Tools)
- Pattern: `convex/actions/agent/tools/findScenicWaypoints.ts` — Overpass query pattern
- OSM wiki: https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_API_by_Example

### Interaction Notes
- Tool is called by LLM BEFORE authoring a route sketch — during the "thinking" phase
- Bounding box derived from geocoded start/end points + padding (reuse `BBOX_PADDING_DEGREES`)
- Results cached in agent conversation context — no persistent caching needed for V1

### Code Pattern
Source: `convex/actions/agent/tools/findScenicWaypoints.ts:9-15`

```typescript
// Overpass query for road by name within bbox
const query = `
  [out:json][timeout:8];
  way["name"~"${escapedRoadName}","i"]["highway"~"primary|secondary|tertiary|trunk|motorway|unclassified"]
    (${south},${west},${north},${east});
  out geom;
`
```

### Anti-pattern (DO NOT)
Do NOT query Overpass without a bounding box — unbounded name queries are extremely slow and may be rate-limited. Do NOT treat `exists: null` (unverified) as `exists: false` — the LLM should proceed with lower confidence, not refuse to use the road.

## CODING STANDARDS

- **`convex/_generated/ai/guidelines.md`**: Convex patterns for actions
- **`brain/docs/TDD-METHODOLOGY.md`**: RED-GREEN-REFACTOR cycle

## DEPENDENCIES

- Depends on: Epic 3 completion (LLM-first prompt must exist for this tool to be useful)
- Blocks: US-063 (curvature scoring), US-064 (surface verification), US-069 (wiring)

## REQUIRED READING

1. `convex/actions/agent/tools/findScenicWaypoints.ts`
   - Lines: ALL
   - Focus: Overpass query pattern, retry logic, bbox calculation, response parsing

2. `convex/actions/agent/lib/piTools.ts`
   - Lines: 1-60
   - Focus: AgentToolSchemas pattern, TypeBox schema definitions

3. `models/route-sketch.ts`
   - Lines: ALL
   - Focus: AnchorPoint structure (the bounding box comes from anchor coordinates)

## NOTES

- The Overpass `~"name","i"` syntax does case-insensitive regex matching, which handles "Skyline Blvd" vs "Skyline Boulevard"
- For name suggestions on miss: query with a broader regex (first word only) and return top matches by Levenshtein distance
- Consider extracting shared Overpass utilities into a `lib/overpass.ts` if overlap with `findScenicWaypoints.ts` is significant
