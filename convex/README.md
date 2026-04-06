# Convex Backend - React Native Template

Serverless backend for the React Native + Convex template.

## Quick Start

```bash
# Start Convex development
pnpm dev

# View database dashboard
npx convex dashboard

# Run a query
npx convex run users:list
```

## Structure

```
convex/
├── _generated/        # Auto-generated TypeScript types (ignore)
├── schema.ts          # Database schema (define tables here)
├── users.ts          # Example API (users queries/mutations)
└── README.md         # This file
```

## Convex Validator-First Pattern (`v` Everywhere)

All data models are defined in `/models` using **Convex `v` validators** directly.

### Define a Model

**Step 1: Create model in `/models/mymodel.ts`**

```typescript
import { Infer, v } from 'convex/values'

export const MY_MODEL_FIELDS = {
  title: v.string(),
  count: v.number(),
} as const

export const myModelValidator = v.object(MY_MODEL_FIELDS)
export type MyModel = Infer<typeof myModelValidator>
```

**Step 2: Add to schema in `convex/schema.ts`**

```typescript
import { myModelValidator } from '../models/mymodel'

export default defineSchema({
  myModels: defineTable(myModelValidator).index('by_title', ['title']),
})
```

**Step 3: Write functions using `query`/`mutation`/`action` + `v`**

```typescript
import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id('myModels'),
      _creationTime: v.number(),
      title: v.string(),
      count: v.number(),
    })
  ),
  handler: async (ctx) => {
    return await ctx.db.query('myModels').collect()
  },
})

export const create = mutation({
  args: { title: v.string(), count: v.number() },
  returns: v.object({ id: v.id('myModels') }),
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('myModels', args)
    return { id }
  },
})
```

### Function Types

| Type | Runtime | Use For | DB Access |
|------|---------|---------|-----------|
| **Query** | V8 | Read-only operations, fast | ✅ Read only |
| **Mutation** | V8 | Write to database | ✅ Full access |
| **Action** | Node.js | External APIs, cross-runtime | ❌ Cannot access DB directly |

## Key References

- **Convex Docs**: https://docs.convex.dev
- **Project Models**: See `/models/README.md`

## Clerk webhooks → Convex sync (users/orgs/memberships)

- Endpoint: `POST /clerk-webhooks` (Convex HTTP router)
- Security: Svix signature verification with `CLERK_WEBHOOK_SECRET`
- Events handled:
  - `user.created`, `user.updated`, `user.deleted`
  - `organization.created`, `organization.updated`, `organization.deleted`
  - `organizationMembership.created`, `organizationMembership.updated`, `organizationMembership.deleted`
- Internal mutations: `convex/db/clerk-sync.ts` (idempotent, uses indexes)
- Local edit guard: user/org updates are skipped if `lastLocalUpdateAt` is newer than the webhook `updated_at`.

### Required Convex env vars

Set these in the Convex dashboard (Environment Variables):

- `CLERK_WEBHOOK_SECRET=whsec_...`
- `CLERK_JWT_ISSUER_DOMAIN=...`

### Clerk dashboard setup

1) Clerk → Webhooks → Add Endpoint  
2) URL: `https://<your-deployment>.convex.site/clerk-webhooks`  
3) Select events listed above  
4) Copy Signing Secret → `CLERK_WEBHOOK_SECRET`

### Testing

- In Clerk webhook settings, send test events (start with `user.created`, `organization.created`, then `organizationMembership.created`).
- Check Convex logs: signature failures return 401; unhandled events return 200 (no retries).

---

## Agentic Architecture: Agent-First Planning

**Principle**: Be agent-planned first, then dynamic. When designing features, default to using LLMs for strategy, decision-making, and semantic reasoning before reaching for deterministic code.

### The Problem: "Coding in 2015"

Historically, software plans avoided using LLMs for strategizing or making decisions. The LLM coded as if it were 2015 — reaching for hardcoded logic, enum switches, and rigid schemas instead of leveraging its own reasoning capabilities.

This resulted in:
- **Stingy plans**: 3 hardcoded preference flags instead of natural language refinement
- ** brittle UX**: "avoid Highway 1" does nothing because the system can't represent it
- **Missed opportunities**: No dynamic adaptation, no semantic understanding of user intent

### Agent-First Thinking

When architecting Convex features, ask:

1. **Can an LLM author this instead of me hardcoding it?**
   - Route itineraries → LLM sketches, Google Maps validates
   - User preferences → Natural language, not 3 boolean flags
   - Error messages → LLM explains what went wrong and suggests fixes

2. **Am I encoding domain knowledge in code that should live in the agent's context?**
   - Road network knowledge ("Highway 1 is coastal") → LLM knows this
   - Riding constraints ("twisty roads are better") → Agent reasoning
   - Route refinement patterns → System prompt, not switch statements

3. **Is this deterministic or probabilistic?**
   - **Deterministic**: State transitions, recording data, schema validation
   - **Probabilistic (Agentic)**: Reading specs, generating plans, making judgment calls, creative work

### Pattern: LLM-Authored + Validated

The best pattern is often:

```
LLM authors semantic structure (flexible, expressive)
    ↓
Deterministic code validates and materializes it (safe, reliable)
    ↓
Failure loop with feedback (retry with guidance)
```

Example: Route Sketching
- `createRouteSketch`: LLM describes "Highway 280 → Skyline → PCH" in natural segments
- `compileSketch`: Google Maps validates geometry, returns specific errors if roads don't connect
- Agent retry: "Highway 92 doesn't intersect Skyline there, try Highway 84 instead"

### When to Use Which

| Use LLM/Agent for... | Use Deterministic Code for... |
|---------------------|------------------------------|
| Understanding user intent | Recording state transitions |
| Generating route sketches | Database persistence |
| Explaining errors to users | Schema validation |
| Making judgment calls | API calls with retry logic |
| Semantic reasoning | Parsing structured output |
| Natural language refinement | Phase progression |
| Creative problem-solving | Emission of events |

**Rule of thumb**: If you're writing a switch statement with >3 cases, ask if an LLM could handle the semantic mapping instead.

---

## Manual Verification: `planRide` Action

This section provides a repeatable checklist for verifying the `actions.agent.planRide` action.

### Required Environment Variables

Set these in the Convex dashboard (Environment Variables → Development):

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | ✅ Yes | OpenAI API key for LLM route sketching |
| `LANGSMITH_TRACING` | Optional | Set to `true` to enable LangSmith tracing |
| `LANGSMITH_API_KEY` | Optional | LangSmith API key (required if tracing enabled) |
| `LANGSMITH_PROJECT` | Optional | LangSmith project name (default: `LaneShadowDev`) |

> **Note**: Routing and weather providers currently use mock/stub implementations. No additional keys required for POC.

### Running `planRide`

**Prerequisites**: User must be authenticated via Clerk. The action requires a valid session.

```bash
# Basic invocation (requires authenticated user context)
npx convex run actions/agent/planRide:planRide '{
  "planInput": {
    "start": { "lat": 37.7749, "lng": -122.4194, "label": "San Francisco" },
    "end": { "lat": 37.3382, "lng": -121.8863, "label": "San Jose" },
    "departureTime": 1736784000000,
    "preferences": { "scenicBias": "default" }
  }
}'
```

### Expected Output Shape

A successful call returns `PlannedRouteOptionsView`:

```json
{
  "planId": "uuid-string",
  "options": [
    {
      "routeOptionId": "uuid-string",
      "label": "Scenic coastal route",
      "rationale": "Takes scenic Highway 1...",
      "stats": {
        "distanceMeters": 75000,
        "durationSeconds": 4500,
        "legsCount": 1
      },
      "map": {
        "bounds": { "north": 37.8, "south": 37.3, "east": -121.8, "west": -122.5 },
        "overviewGeometry": { "format": "polyline", "encoding": "...", "precision": 5, "value": "..." },
        "legs": [{ "legIndex": 0, "start": {...}, "end": {...}, "distanceMeters": 75000, "durationSeconds": 4500, "geometry": {...} }]
      },
      "overlaysPreview": {
        "windSummary": "low",
        "conditionsStatus": "ok"
      }
    }
  ]
}
```

**Sanity checks**:
- [ ] `planId` is a non-empty string
- [ ] `options` array has 1–3 entries
- [ ] Each option has `label`, `rationale`, `stats`, `map`, `overlaysPreview`
- [ ] `stats.legsCount` matches `map.legs.length`
- [ ] `overlaysPreview.conditionsStatus` is `"ok"` or `"unavailable"`

### Error Code Verification

| Scenario | Expected Error Code | How to Trigger |
|----------|---------------------|----------------|
| Unauthenticated | `AUTH_REQUIRED` | Call without valid Clerk session |
| Missing/invalid input | `INVALID_INPUT` | Omit required fields or use invalid coordinates |
| LLM failure | `LLM_SKETCH_INVALID` | Remove `OPENAI_API_KEY` from env vars |

**Test unauthenticated access**:
```bash
# This should fail with AUTH_REQUIRED
# (Use a Convex admin dashboard or curl without auth headers)
```

### Degraded Mode: Conditions Unavailable

When weather probing fails, routes should still be returned with degraded overlay status.

**To simulate conditions failure**:
1. The current implementation uses mock weather data
2. To test soft-fail, modify `probeConditions` to throw, or add a `WEATHER_DISABLED=true` env check

**Expected degraded response**:
```json
{
  "overlaysPreview": {
    "windSummary": "unavailable",
    "conditionsStatus": "unavailable"
  }
}
```

**Verification checklist**:
- [ ] Routes are still returned (not a hard failure)
- [ ] `conditionsStatus` is `"unavailable"`
- [ ] `windSummary` is `"unavailable"`
- [ ] No wind overlay data in `routeSnapshot.overlays`

### LangSmith Observability (Optional)

When `LANGSMITH_TRACING=true`:

1. Set `LANGSMITH_API_KEY` and optionally `LANGSMITH_PROJECT`
2. Run `planRide`
3. View traces at [smith.langchain.com](https://smith.langchain.com)
4. Traces include:
   - Run metadata (`userId`, `planInputHash`)
   - Tags: `planRide`, `v1`
   - Full LLM invocation details (prompt, response, latency)
