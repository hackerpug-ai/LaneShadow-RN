---
stability: CONSTITUTION
last_validated: 2026-04-03
prd_version: 1.4.0
---

# LaneShadow V1 — Technical Backend Architecture

## 1. Overview

This document specifies all Convex backend changes required to ship V1: agentic conversational planning via chat sessions using pi core, 2-3 alternative routes, full weather overlays (wind + rain + temperature), conditions-aware route ranking, saved routes CRUD, and rate limiting. It is grounded in the current codebase state as of 2026-04-03.

### Current Architecture (Baseline)

The existing deterministic pipeline:

```
createPlan (mutation) -> schedules executePlan (internalAction)
  -> planRideOrchestrator
      -> findScenicWaypoints (Overpass)  -> 2-3 RouteVariants
      -> compileSketch + normalizeRoute  -> RouteSnapshot per variant (parallel)
      -> computeRouteIndex               -> RouteIndex per variant
      -> probeConditions (Open-Meteo)    -> wind samples only
      -> mapConditions                   -> WindOverlay only
  -> buildOptionsFromResults             -> PlannedRouteOptionsView (wind hardcoded 'unavailable')
  -> updatePlanStatus (COMPLETED)
```

**V1 adds:** Agentic conversational entry point via pi core, rain + temperature overlays, enrichRoute wiring, and overlaysPreview populated from real data.

### V1 Architecture: LLM-First Routing ("The Californians Pattern")

V1 introduces an LLM-first routing architecture where the AI authors routes from its own road knowledge, and Google Maps validates per-segment:

```
Rider Message
    ↓
pi core Agent Session (conversation context)
    ↓
LLM Authors Route Sketch (probabilistic)
    "Take 280 south to 92, hop on Skyline Blvd
     down to Alice's Restaurant, then drop to HMB"
    → RouteSketch with segments + anchorPoints
    ↓
Google Maps Validates Per-Segment (deterministic)
    Segment 1: 280 → Junction 92       ✅ OK
    Segment 2: Skyline Blvd → Alice's   ✅ OK
    Segment 3: Alice's → HMB            ❌ Failed
    ↓
┌─── All pass? ───┐
│ YES             │ NO → Rich feedback to LLM
│ Stitch legs     │      "Segment 3 failed: Skyline
│ into route      │       doesn't reach HMB directly.
│                 │       Google suggests via Hwy 84."
│                 │      → LLM revises failed segments only
│                 │      → Back to validation (max 3 retries)
└─────────────────┘
    ↓
probeConditions (Open-Meteo) → wind + rain + temp
    ↓
mapConditions → all overlays
    ↓
enrichRoute (agent tool) → descriptions, highlights
    ↓
buildOptionsFromResults → PlannedRouteOptionsView
```

**Fallback**: When the LLM is uncertain about roads in an area, it falls back to the deterministic orchestrator (`planRoute` → `findScenicWaypoints` → `compileSketch`).

**Key Principles**:
- **LLM-First (Probabilistic)**: Route authoring from road knowledge, intent understanding, conversation context, segment revision, response generation
- **Google Maps as Ground Truth (Deterministic)**: Per-segment validation, polyline generation, distance/duration computation
- **Deterministic (Guaranteed)**: Weather fetching, conditions scoring, data persistence, state transitions

---

## 2. Schema Changes

### 2.1 models/saved-routes.ts - planInputValidator

Add an optional `nlpText` field to capture the original natural language input.

```typescript
export const planInputValidator = v.object({
  start: routeStopValidator,
  end: routeStopValidator,
  departureTime: v.number(),
  preferences: planPreferencesValidator,
  nlpText: v.optional(v.string()),  // NEW: original agentic input verbatim
})
```

**Rationale:** Storing `nlpText` on `PlanInput` means it propagates to `route_plans.planInput` and `saved_routes.planInput` without schema changes to either table. The agentic text rides along with the structured input everywhere it flows.

**Migration:** Additive optional field - no migration needed. Existing records without `nlpText` remain valid.

### 2.2 models/route-plans.ts - routePlanValidator

No additional changes needed. `planInput` already stores the full `PlanInput` object including the new optional `nlpText`.

### 2.3 Schema indexes (convex/schema.ts)

No new indexes required for V1. Existing indexes cover all query patterns:
- `route_plans.by_clerkUserId_and_status` covers the active plan lookup
- `saved_routes.by_ownerType_and_ownerId` covers route list queries
- `favorite_roads.by_userId` covers favorites lookup

### 2.4 models/saved-routes.ts - savedRouteValidator additions

Add optional fields for V1 saved routes features:

```typescript
rating: v.optional(v.number()),         // 1-5 star rating (UC-SR-07)
notes: v.optional(v.string()),          // free-form text note (UC-SR-07)
markedAsRidden: v.optional(v.boolean()), // manual toggle (UC-SR-09)
riddenAt: v.optional(v.number()),        // timestamp when marked as ridden
```

**Migration:** Additive optional fields - no migration needed.

### 2.5 models/route-plans.ts - routePlanValidator additions

Add a `phase` enum field for client progress tracking:

```typescript
export const routePlanPhaseValidator = v.union(
  v.literal('reading'),
  v.literal('finding'),
  v.literal('weather'),
  v.literal('building'),
)

// Add to routePlanValidator:
phase: v.optional(routePlanPhaseValidator),
```

Update `executePlanHandler` to set phase at each orchestrator step. This gives the client a stable enum to switch on instead of parsing status message strings.

### 2.6 models/saved-routes.ts - snapshotMeta overlay tracking

Extend `snapshotMeta.overlays` to track rain and temperature metadata alongside wind:

```typescript
overlays: v.object({
  wind: v.optional(v.object({ generatedAt: v.number(), modelVersion: v.string() })),
  rain: v.optional(v.object({ generatedAt: v.number(), modelVersion: v.string() })),
  temperature: v.optional(v.object({ generatedAt: v.number(), modelVersion: v.string() })),
}),
```

Add `weatherFetchedAt: v.optional(v.number())` to the route plan result so the client can display staleness warnings (e.g., "Weather checked at 7:03 AM — tap to refresh").

### 2.7 New Tables — Chat Sessions

V1 introduces two new tables for the agentic conversational planning experience:

#### planning_sessions

```typescript
planning_sessions: defineTable({
  clerkUserId: v.string(),
  title: v.string(),                    // auto-generated from first message
  status: v.union(
    v.literal('active'),
    v.literal('completed'),
    v.literal('archived'),
  ),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_clerkUserId', ['clerkUserId'])
  .index('by_clerkUserId_and_updatedAt', ['clerkUserId', 'updatedAt'])
```

#### session_messages

```typescript
session_messages: defineTable({
  sessionId: v.id('planning_sessions'),
  role: v.union(v.literal('rider'), v.literal('system')),
  content: v.string(),
  attachments: v.optional(v.array(v.object({
    type: v.literal('route_options'),
    routePlanId: v.id('route_plans'),
  }))),
  createdAt: v.number(),
})
  .index('by_sessionId', ['sessionId'])
```

**Rationale:** Separate tables (rather than messages-in-array on sessions) allows pagination, indexing by session, and avoids document size limits for long conversations.

### 2.8 New Table — Rate Limiting

```typescript
plan_usage: defineTable({
  clerkUserId: v.string(),
  month: v.string(),           // "2026-04"
  planCount: v.number(),
})
  .index('by_clerkUserId_and_month', ['clerkUserId', 'month'])
```

**Definition:** 1 plan = 1 `route_plans` execution. Free tier: 5 plans/month. Refinements in a session that trigger new route generation each count as one plan.

---

## 3. Agent Architecture (pi Core)

### 3.1 Agent Session Management

V1 uses pi core (`@mariozechner/pi-agent-core`) for agent session management:

```typescript
// File: convex/actions/agent/ridePlanningAgent.ts
import { createAgent } from '@mariozechner/pi-agent-core'
import { openai } from '@ai-sdk/openai'

export const ridePlanningAgent = createAgent({
  id: 'ride-planning-agent',
  description: 'Motorcycle ride planning agent that interprets rider intent and generates route options',
  model: openai('gpt-4o-mini'),
  tools: {
    planRoute: {
      description: 'Generate 2-3 scenic motorcycle route alternatives from start to end points',
      parameters: z.object({
        start: z.object({ lat: z.number(), lng: z.number(), label: z.string().optional() }),
        end: z.object({ lat: z.number(), lng: z.number(), label: z.string().optional() }),
        departureTime: z.number(),
        preferences: z.object({
          scenicBias: z.enum(['low', 'default', 'high']).optional(),
          avoidHighways: z.boolean().optional(),
          avoidTolls: z.boolean().optional(),
        }).optional(),
      }),
      execute: async (args) => {
        // Call deterministic orchestrator
        return await planRideOrchestrator(args)
      }
    },
    refineRoute: {
      description: 'Refine existing routes based on rider feedback',
      parameters: z.object({
        routePlanId: z.id('route_plans'),
        refinement: z.string(),
      }),
      execute: async (args) => {
        // Parse refinement and re-run orchestrator
      }
    },
    fetchWeather: {
      description: 'Fetch weather data for a route',
      parameters: z.object({
        routeGeometry: z.object({
          bounds: z.object({ northeast: z.object({ lat: z.number(), lng: z.number() }), southwest: z.object({ lat: z.number(), lng: z.number() }) }),
        }),
        departureTime: z.number(),
      }),
      execute: async (args) => {
        // Call weather provider
      }
    },
    saveRoute: {
      description: 'Save a route to the rider\'s library',
      parameters: z.object({
        routePlanId: z.id('route_plans'),
        name: z.string(),
      }),
      execute: async (args) => {
        // Convex mutation to save route
      }
    },
    searchFavorites: {
      description: 'Search favorite road segments in an area',
      parameters: z.object({
        bounds: z.object({ northeast: z.object({ lat: z.number(), lng: z.number() }), southwest: z.object({ lat: z.number(), lng: z.number() }) }),
      }),
      execute: async (args) => {
        // Convex query for favorites
      }
    },
  },
  systemPrompt: `You are an expert motorcycle navigator who knows road networks. For ANY route request — even generic ones like "scenic ride to Santa Cruz" — author a high-level itinerary using roads you know. Pick specific roads: "Take 280 south to 92, then Skyline Blvd to Alice's, drop down 84 to 1 for the last stretch."

Your role:
1. Author route sketches with named roads and landmarks from your road knowledge
2. When the rider says "avoid Market Street," route around it in your sketch — no API flags needed
3. If a segment fails validation, revise only the failed segments using the feedback provided
4. If you're unsure about roads in an area, say so and fall back to planRoute
5. Provide brief, opinionated responses (1-2 sentences max) — you have opinions about roads
6. Maintain conversation context across exchanges

The map is always the primary view. Your responses supplement the map, not replace it. You are a riding buddy who knows every road, not a search engine.`,
})
```

### 3.2 Agent Tool: parseNaturalLanguageInput

**File:** `convex/actions/agent/tools/parseNaturalLanguageInput.ts`

**Type:** `action` (requires `'use node'` - calls OpenAI)

**Purpose:** Convert a free-text ride description into a structured `PlanInput`. This is the V1 agentic entry point.

**Args:**
```typescript
{
  text: v.string(),          // "scenic 2-hour ride to Santa Cruz, avoid highways"
  sessionId: v.optional(v.id('planning_sessions')),  // for conversation context
  previousMessages: v.optional(v.array(v.object({    // recent session messages for context
    role: v.union(v.literal('rider'), v.literal('system')),
    content: v.string(),
  }))),
  currentLocation: v.optional(v.object({
    lat: v.number(),
    lng: v.number(),
    label: v.optional(v.string()),
  })),
  departureTime: v.optional(v.number()),   // defaults to Date.now()
  devBypassKey: v.optional(v.string()),
}
```

**Returns:**
```typescript
v.object({
  planInput: planInputValidator,
  confidence: v.union(v.literal('high'), v.literal('low')),
  isRefinement: v.boolean(),       // true if interpreting a follow-up, false if new plan
  warnings: v.array(v.string()),   // e.g. "No destination detected - using current location"
})
```

**Implementation notes:**
- Uses `generateObject` from `ai` (aisdk) with `openai(AI_MODEL)` - same pattern as `enrichRoute.ts`
- Zod schema for LLM output validates start/end coordinates, preferences, confidence
- `currentLocation` is passed as context so the LLM can resolve "from here"
- `previousMessages` provides conversation context for refinement — the LLM can interpret "make it shorter" or "avoid that highway" relative to previous routes
- `departureTime` defaults to `Date.now()` when absent
- Timeout: 10 seconds via `withTimeout` (same pattern as `enrichRoute`)
- Falls back to throwing `AGentic_PARSE_FAILED` error (caller responds conversationally per UC-AG-11)
- The returned `planInput` includes `nlpText: text` so the original input is preserved
- `isRefinement` is true when the LLM detects the input is modifying a previous plan, false for new requests

**New error codes** to add to `convex/errors.ts`:
```typescript
AGENTIC_PARSE_FAILED: 'AGENTIC_PARSE_FAILED',
PLAN_LIMIT_EXCEEDED: 'PLAN_LIMIT_EXCEEDED',
SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
```

### 3.3 Agent Tool: enrichRoute

**File:** `convex/actions/agent/tools/enrichRoute.ts`

**Type:** `action` (already exists, enhance for V1)

**Purpose:** Generate route descriptions, labels, and highlights using agentic reasoning.

**Implementation:**
- Single LLM call processes all routes at once for efficiency
- Generates distinctive labels ("Coastal Cruiser", "Mountain Loop")
- Creates 1-sentence descriptions highlighting notable features
- Returns structured data for deterministic parsing

### 3.4 Conversation Flow

```
1. Rider sends message
2. Agent interprets intent (new plan or refinement?)
3. Agent authors RouteSketch with segments + anchorPoints from road knowledge
4. compileSegments validates each segment independently via Google Maps
5. If segments fail → Agent receives per-segment feedback → revises failed segments only (max 3 retries)
6. All segments pass → stitch legs into complete route
7. probeConditions fetches weather for validated route
8. enrichRoute generates descriptions + labels
9. Agent generates conversational response
10. Client saves message to session_messages
11. Client displays response + route attachments on map

Fallback: If Agent is uncertain about roads in an area →
  planRoute tool → deterministic orchestrator (Overpass + compileSketch)
```

---

## 4. New Convex Actions

### 4.1 planRide action - Agentic path

No new action needed. The existing `planRide` action accepts `planInput` directly. The agentic path is:

```
Agent calls parseNaturalLanguageInput → gets PlanInput
Agent calls planRoute tool → deterministic orchestrator
```

The agent orchestrates the workflow. The client sends messages and receives responses.

### 4.2 Chat Session Actions

| Endpoint | Type | Notes |
|----------|------|-------|
| `api.db.planningSessions.create` | mutation | NEW - creates a new planning session |
| `api.db.planningSessions.list` | query | NEW - user's sessions, newest first, paginated |
| `api.db.planningSessions.get` | query | NEW - single session by ID |
| `api.db.planningSessions.archive` | mutation | NEW - soft archive a session |
| `api.db.sessionMessages.list` | query | NEW - messages for a session, chronological |
| `api.db.sessionMessages.send` | mutation | NEW - adds rider message, triggers agent processing |
| `api.db.sessionMessages.addSystemMessage` | internalMutation | NEW - adds agent response with route attachments |

---

## 5. Modified Existing Functions

### 5.1 weatherProvider.ts - Combined weather fetch

**Current state:** Only exposes `getWindAtPoints`.

**Changes:** Extend to fetch wind + rain + temperature in a single Open-Meteo request per point.

Updated URL pattern:
```
https://api.open-meteo.com/v1/forecast
  ?latitude={lat}&longitude={lng}
  &hourly=windspeed_10m,winddirection_10m,windgusts_10m,precipitation_probability,precipitation,temperature_2m
  &timezone=UTC&start_date={date}&end_date={date}
```

Same concurrency limiter (MAX_CONCURRENT=8) and per-point timeout (8s). Batching all variables into one call per point is strictly better than separate calls.

### 5.2 probeConditions.ts - Combined output

Returns `ProbedConditionsPoint[]` with wind + rain + temperature samples per point. Existing `selectRepresentativePoints` logic (max 25 probes) is unchanged.

### 5.3 mapConditions.ts - All three overlays

Returns `{ wind: WindOverlay, rain: RainOverlay, temperature: TemperatureOverlay }`.

Rain levels: `none` (prob<20%, precip<0.1mm), `light`, `moderate`, `heavy` (prob>80% OR precip>4mm).
Temperature levels: Use existing thresholds from `getWorstTemperatureLevel` in models/saved-routes.ts.

### 5.4 planRideOrchestrator.ts - Wire rain+temp+enrichRoute

Conditions block produces all three overlays. After conditions, `enrichRoute` runs once for all routes (single LLM call). `buildOptionsFromResults` populates `overlaysPreview` from real data using existing utility functions.

---

## 6. Conditions Scoring (Best for Today)

Deterministic score computation in `buildOptionsFromResults`:

```typescript
const computeConditionsScore = (overlaysPreview): number => {
  let score = 100
  if (overlaysPreview.rainSummary === 'heavy') score -= 40
  else if (overlaysPreview.rainSummary === 'moderate') score -= 25
  else if (overlaysPreview.rainSummary === 'light') score -= 10
  if (overlaysPreview.windSummary === 'high') score -= 20
  else if (overlaysPreview.windSummary === 'moderate') score -= 10
  if (overlaysPreview.temperatureSummary === 'hot') score -= 10
  else if (overlaysPreview.temperatureSummary === 'cold') score -= 10
  return Math.max(0, score)
}
```

Add `conditionsScore: number` to `PlannedRouteOptionView`. Options sorted by score descending.

---

## 7. API Contract

### 7.1 PlannedRouteOptionView additions

- `highlights?: string[]` - from enrichRoute (agent-generated)
- `conditionsScore: number` - 0-100, higher = better conditions
- `overlaysPreview` - populated from real overlay data (not hardcoded)

### 7.2 parseNaturalLanguageInput action

New public action: `text + currentLocation? + departureTime?` → `{ planInput, confidence, warnings }`

### 7.3 Endpoint Summary

| Endpoint | Type | Notes |
|----------|------|-------|
| **Route Plans** | | |
| `api.db.routePlans.createPlan` | mutation | Unchanged |
| `api.db.routePlans.getActivePlan` | query | Reactive |
| `api.db.routePlans.getPlanStatus` | query | NEW - returns plan phase + status for progress tracking |
| `api.db.routePlans.cancelPlan` | mutation | Unchanged |
| `api.actions.agent.planRide.planRide` | action | Returns real overlays + conditionsScore |
| `api.actions.agent.parseNaturalLanguageInput` | action | NEW - Agentic entry point with session context |
| **Chat Sessions** | | |
| `api.db.planningSessions.create` | mutation | NEW - creates a new planning session |
| `api.db.planningSessions.list` | query | NEW - user's sessions, newest first, paginated |
| `api.db.planningSessions.get` | query | NEW - single session by ID |
| `api.db.planningSessions.archive` | mutation | NEW - soft archive a session |
| `api.db.sessionMessages.list` | query | NEW - messages for a session, chronological |
| `api.db.sessionMessages.send` | mutation | NEW - adds rider message, optionally triggers planning |
| `api.db.sessionMessages.addSystemMessage` | internalMutation | NEW - adds agent response with route attachments |
| **Saved Routes** | | |
| `api.db.savedRoutes.save` | mutation | NEW - create from PlannedRouteOptionView |
| `api.db.savedRoutes.list` | query | NEW - by owner, paginated, newest first |
| `api.db.savedRoutes.getById` | query | NEW - single route detail |
| `api.db.savedRoutes.rename` | mutation | NEW - update name field |
| `api.db.savedRoutes.delete` | mutation | NEW - soft delete (set deletedAt) |
| `api.db.savedRoutes.rate` | mutation | NEW - set rating (1-5) |
| `api.db.savedRoutes.addNote` | mutation | NEW - set/update note text |
| `api.db.savedRoutes.search` | query | NEW - filter by name text match |
| `api.db.savedRoutes.markAsRidden` | mutation | NEW - toggle ridden status |
| **Rate Limiting** | | |
| `api.db.planUsage.check` | query | NEW - returns current month's plan count and limit |
| `api.db.planUsage.increment` | internalMutation | NEW - increments plan count (called by planRide) |

---

## 8. External Dependencies

| Dependency | Purpose | Already in project |
|-----------|---------|------------------|
| Google Routes API v2 | Route computation | Yes |
| Open-Meteo | Wind, rain, temperature | Yes |
| OpenAI via aisdk | Agentic parsing, route enrichment | Yes |
| Overpass API | Scenic waypoint discovery | Yes |
| pi core | Agent framework and session management | Yes |

**No new external services required for V1.**

---

## 9. Error Handling and Fallbacks

### 9.1 Agentic Error Recovery

The agent handles errors conversationally:

| Error Type | Agent Response | Retry Strategy |
|------------|----------------|----------------|
| Low intent confidence | "I need a bit more detail — where are you starting from?" | Ask for clarification |
| Route generation failed | "I couldn't find routes matching that. Try being more specific." | Suggest specificity |
| Weather unavailable | "Weather data isn't available right now. Routes are ranked by scenicness only." | Degrade gracefully |
| Network timeout | "I'm having trouble connecting. Check your signal and try again." | Retry on next message |
| Plan limit exceeded | "You've used your 5 free plans this month. Upgrade to Pro for unlimited." | Upsell |

### 9.2 Deterministic Error Handling

- Orchestrator failures return partial results (Promise.allSettled)
- Weather failures are non-fatal (continue without weather)
- Invalid agent tool calls throw structured errors
- All errors logged with context for debugging

---

## 10. Navigation Export

Navigation export (UC-SR-10) is **client-side only**. The client constructs a deep-link URL from `routeSnapshot.origin`, `routeSnapshot.destination`, and intermediate waypoints. No backend action required.

Google Maps: `https://www.google.com/maps/dir/?api=1&origin=...&destination=...&waypoints=...`
Waze: `https://waze.com/ul?ll=...&navigate=yes`

---

## 11. Migration Strategy

All V1 schema changes are additive optional fields or new tables. No migration actions required for existing data. Existing records remain valid. Missing overlays surface as `'unavailable'` via existing utility functions. New tables (`planning_sessions`, `session_messages`, `plan_usage`) are created fresh.

---

## 12. Performance Considerations

### 12.1 Agentic Operations

- **parseNaturalLanguageInput**: ~2-5 seconds (LLM call)
- **enrichRoute**: ~3-8 seconds (single LLM call for all routes)
- **Total agentic overhead**: ~5-13 seconds

### 12.2 Deterministic Operations

- **findScenicWaypoints**: ~1-2 seconds
- **compileSketch + normalizeRoute**: ~2-4 seconds per route (parallel)
- **probeConditions**: ~1-3 seconds (parallel)
- **Total deterministic time**: ~4-9 seconds

### 12.3 End-to-End Target

- **Target**: <12 seconds from message send to route display
- **Strategy**: Parallelize agentic and deterministic operations where possible
- **Fallback**: Show progressive status updates ("Reading your ride...", "Finding scenic roads...", "Checking weather...")

---

## 13. Testing Strategy

### 13.1 Unit Tests

- Agent tool handlers (parseNaturalLanguageInput, enrichRoute)
- Orchestrator workflow steps
- Weather mapping logic
- Conditions scoring

### 13.2 Integration Tests

- End-to-end conversation flows
- Session persistence
- Error recovery scenarios
- Rate limiting

### 13.3 Agent Evaluation

- Intent understanding accuracy
- Response quality and safety
- Conversation context maintenance
- Tool selection correctness
