# US-068: User Favorites Lookup Tool

> Task ID: US-068
> Type: FEATURE
> Priority: P2
> Estimate: 60 minutes
> Assignee: backend-engineer

## CRITICAL CONSTRAINTS

### MUST
- Create agent tool `getUserFavorites` that queries the user's saved routes and favorite road segments within a region
- Return: favorite road names, ratings, ride count, and last ridden date
- Query Convex tables for the authenticated user's data — respect existing auth/RLS patterns

### NEVER
- Expose other users' data — strictly scoped to the authenticated user's favorites
- Require favorites to exist — return empty array gracefully for new users
- Make this a blocking dependency for route authoring — favorites are enrichment, not required

### STRICTLY
- Filter favorites by bounding box of the planned route region
- Sort by: rating (desc), then ride count (desc), then recency
- Return max 10 favorites per query

## SPECIFICATION

**Objective:** Let the LLM incorporate the rider's favorite roads into new route suggestions, creating a personalization loop where the app gets smarter the longer a rider uses it.

**Success looks like:** LLM calls `getUserFavorites({bbox})` and gets `[{ roadName: "Skyline Blvd", rating: 5, rideCount: 12, lastRidden: "2026-03-15" }]` → then includes it in the sketch: "Including your favorite Skyline Blvd."

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | A user with 3 favorite roads in the Bay Area and a Bay Area bounding box | `getUserFavorites` is called | Returns all 3 favorites sorted by rating desc | `npx vitest run convex/actions/agent/tools/__tests__/getUserFavorites.test.ts -t "with favorites"` |
| 2 | A new user with no saved favorites | `getUserFavorites` is called | Returns empty array, does NOT throw | `npx vitest run convex/actions/agent/tools/__tests__/getUserFavorites.test.ts -t "no favorites"` |
| 3 | A user with favorites in multiple regions, queried with a Bay Area bbox | `getUserFavorites` is called | Returns only favorites within the Bay Area bbox, not other regions | `npx vitest run convex/actions/agent/tools/__tests__/getUserFavorites.test.ts -t "region filter"` |
| 4 | A user with 15 favorites in the region | `getUserFavorites` is called | Returns max 10, sorted by rating then ride count | `npx vitest run convex/actions/agent/tools/__tests__/getUserFavorites.test.ts -t "max limit"` |

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | getUserFavorites returns all matching favorites sorted by rating descending | AC-1 | `npx vitest run convex/actions/agent/tools/__tests__/getUserFavorites.test.ts -t "with favorites"` | [x] TRUE [ ] FALSE |
| 2 | getUserFavorites returns empty array for users with no favorites | AC-2 | `npx vitest run convex/actions/agent/tools/__tests__/getUserFavorites.test.ts -t "no favorites"` | [x] TRUE [ ] FALSE |
| 3 | getUserFavorites filters results to only favorites within the provided bounding box | AC-3 | `npx vitest run convex/actions/agent/tools/__tests__/getUserFavorites.test.ts -t "region filter"` | [x] TRUE [ ] FALSE |
| 4 | getUserFavorites returns at most 10 results even when more exist in the region | AC-4 | `npx vitest run convex/actions/agent/tools/__tests__/getUserFavorites.test.ts -t "max limit"` | [x] TRUE [ ] FALSE |

## GUARDRAILS

### WRITE-ALLOWED
- `convex/actions/agent/tools/getUserFavorites.ts` (NEW)
- `convex/actions/agent/tools/__tests__/getUserFavorites.test.ts` (NEW)
- `convex/actions/agent/lib/piTools.ts` (MODIFY) — add `getUserFavorites` schema

### WRITE-PROHIBITED
- `convex/schema.ts` — no schema changes; query existing tables
- `convex/actions/agent/ridePlanningAgent.ts` — wiring in US-069

## DESIGN

### References
- Research: holocron §7 (Personalization & Memory Tools)
- PRD: `.spec/prds/v1/03-functional-groups.md` SR group — "favorite roads automatically influence future route generation"
- Existing: Convex `savedRoutes` / `favoriteSegments` tables (from Epic 6)

### Interaction Notes
- Called at the START of route authoring — LLM checks favorites before picking roads
- Results injected into the LLM's context: "The rider's favorites in this region: Skyline Blvd (5 stars), Page Mill Rd (4 stars)"
- If no favorites exist, the LLM proceeds normally — no degraded experience for new users

### Anti-pattern (DO NOT)
Do NOT query all user data and filter client-side — use Convex indexes for bbox filtering. Do NOT expose internal IDs or sensitive data — return only road names, ratings, and metadata.

## CODING STANDARDS

- **`convex/_generated/ai/guidelines.md`**: Convex patterns
- **`brain/docs/TDD-METHODOLOGY.md`**: RED-GREEN-REFACTOR

## DEPENDENCIES

- Depends on: Epic 6 (Save Routes Core — the favorites tables must exist)
- Note: This tool can be BUILT now against the expected schema but won't return real data until Epic 6 ships
- Blocks: US-069 (wiring)

## REQUIRED READING

1. `convex/schema.ts` — existing table definitions for saved routes
2. `convex/_generated/ai/guidelines.md` — Convex query patterns

## NOTES

- Epic 6 defines the saved routes and favorites schema. This tool queries it. If building before Epic 6, stub the Convex query to return empty results and write tests against mock data.
- The bounding box filter assumes favorites have lat/lng coordinates. If the favorites schema stores polylines instead of centroids, this tool needs to check if any point of the favorite intersects the bbox.
