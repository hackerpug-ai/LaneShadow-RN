# US-064: Road Surface Verification Tool

> Task ID: US-064
> Type: FEATURE
> Priority: P0
> Estimate: 60 minutes
> Assignee: backend-engineer

## CRITICAL CONSTRAINTS

### MUST
- Create agent tool `checkSurface` that returns surface type and confidence for a road from OSM tags
- Classify roads: `paved` (asphalt, concrete, paved), `unpaved` (gravel, dirt, ground, sand), `unknown` (no surface tag)
- For `unknown` surface, infer from highway class: primary/secondary/trunk/motorway → likely paved; track/path → likely unpaved

### NEVER
- Recommend unpaved roads to riders without explicit warning — `unpaved` and `unknown` roads MUST be flagged
- Make a separate Overpass call if `lookupRoad` (US-062) already returned surface data — consume from existing response

### STRICTLY
- Return confidence level: `confirmed` (OSM has explicit surface tag), `inferred` (from highway class), `unknown` (no data)
- The tool MUST be callable both standalone (own Overpass query) and as a post-processor on lookupRoad data

## SPECIFICATION

**Objective:** Prevent the LLM from recommending gravel or dirt roads to street motorcycle riders by giving it surface verification data.

**Success looks like:** LLM checks `checkSurface("Old Mountain Road", {bbox})` → `{ surface: "unpaved", material: "gravel", confidence: "confirmed" }` and excludes it from the sketch, or warns the rider.

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | A road with explicit OSM `surface=asphalt` tag | `checkSurface` is called | Returns `{ surface: "paved", material: "asphalt", confidence: "confirmed" }` | `npx vitest run convex/actions/agent/tools/__tests__/checkSurface.test.ts -t "paved road"` |
| 2 | A road with explicit OSM `surface=gravel` tag | `checkSurface` is called | Returns `{ surface: "unpaved", material: "gravel", confidence: "confirmed" }` | `npx vitest run convex/actions/agent/tools/__tests__/checkSurface.test.ts -t "unpaved road"` |
| 3 | A primary highway with no surface tag | `checkSurface` is called | Returns `{ surface: "paved", material: null, confidence: "inferred" }` | `npx vitest run convex/actions/agent/tools/__tests__/checkSurface.test.ts -t "inferred paved"` |
| 4 | A `highway=track` road with no surface tag | `checkSurface` is called | Returns `{ surface: "unpaved", material: null, confidence: "inferred" }` | `npx vitest run convex/actions/agent/tools/__tests__/checkSurface.test.ts -t "inferred unpaved"` |

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | checkSurface returns paved with confirmed confidence when OSM surface tag is asphalt | AC-1 | `npx vitest run convex/actions/agent/tools/__tests__/checkSurface.test.ts -t "paved road"` | [ ] TRUE [ ] FALSE |
| 2 | checkSurface returns unpaved with confirmed confidence when OSM surface tag is gravel | AC-2 | `npx vitest run convex/actions/agent/tools/__tests__/checkSurface.test.ts -t "unpaved road"` | [ ] TRUE [ ] FALSE |
| 3 | checkSurface infers paved for primary/secondary/trunk highways without surface tag | AC-3 | `npx vitest run convex/actions/agent/tools/__tests__/checkSurface.test.ts -t "inferred paved"` | [ ] TRUE [ ] FALSE |
| 4 | checkSurface infers unpaved for track/path highways without surface tag | AC-4 | `npx vitest run convex/actions/agent/tools/__tests__/checkSurface.test.ts -t "inferred unpaved"` | [ ] TRUE [ ] FALSE |

## GUARDRAILS

### WRITE-ALLOWED
- `convex/actions/agent/tools/checkSurface.ts` (NEW) — surface verification tool
- `convex/actions/agent/tools/__tests__/checkSurface.test.ts` (NEW) — tests
- `convex/actions/agent/lib/piTools.ts` (MODIFY) — add `checkSurface` schema

### WRITE-PROHIBITED
- `convex/actions/agent/tools/lookupRoad.ts` — consume data from it, don't modify it
- `convex/actions/agent/ridePlanningAgent.ts` — wiring in US-069

## DESIGN

### References
- Research: holocron §2 — OSM surface tags for motorcycle safety
- OSM wiki: `surface=*`, `smoothness=*` tag documentation
- roadcurvature.com filtering: excludes `surface=gravel|dirt|unpaved` by default

### Interaction Notes
- This tool is lightweight — primarily a tag parser, not a heavy API call
- Can be combined with `lookupRoad` response data to avoid extra queries
- The LLM uses this to filter roads: "Excluding Old Mountain Road (gravel surface)"

### Code Pattern
```typescript
const PAVED_SURFACES = new Set(['asphalt', 'concrete', 'paved', 'concrete:plates', 'concrete:lanes', 'paving_stones', 'sett'])
const UNPAVED_SURFACES = new Set(['gravel', 'dirt', 'ground', 'sand', 'mud', 'grass', 'unpaved', 'compacted', 'fine_gravel', 'earth'])
const LIKELY_PAVED_HIGHWAYS = new Set(['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'motorway_link', 'trunk_link', 'primary_link', 'secondary_link', 'tertiary_link'])
const LIKELY_UNPAVED_HIGHWAYS = new Set(['track', 'path', 'bridleway'])
```

### Anti-pattern (DO NOT)
Do NOT treat `unknown` surface as `paved` — always flag uncertainty so the LLM can warn the rider or prefer a verified-paved alternative.

## CODING STANDARDS

- **`convex/_generated/ai/guidelines.md`**: Convex patterns
- **`brain/docs/TDD-METHODOLOGY.md`**: RED-GREEN-REFACTOR

## DEPENDENCIES

- Depends on: US-062 (lookupRoad response includes surface data)
- Blocks: US-069 (wiring)

## REQUIRED READING

1. `convex/actions/agent/tools/lookupRoad.ts` (from US-062)
   - Focus: Response format, surface tag extraction from Overpass

## NOTES

- This is intentionally simple — a tag classifier, not a ML model. The value is in making surface data available to the LLM's decision-making.
- Consider combining `lookupRoad` + `checkSurface` + `getCurvature` into a single `analyzeRoad` composite tool later to reduce tool call overhead. For V1, keep them separate for cleaner testing.
