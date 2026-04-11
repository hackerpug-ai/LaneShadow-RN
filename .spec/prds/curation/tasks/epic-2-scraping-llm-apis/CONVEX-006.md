# CONVEX-006: Intent Extraction HTTP Endpoint

**Task ID:** CONVEX-006
**Epic:** Epic 2 - Web Scraping, LLM Extraction & Public APIs
**Assigned To:** convex-implementer
**Review:** convex-reviewer
**Priority:** P1
**Effort:** L
**Estimate:** 240 min
**Type:** [FEATURE]
**Status:** Backlog

---

## DEPENDENCIES

- **Depends on:** CONVEX-002 (Curation tables + indexes, including intent_param_cache table), AI-003 (agent model registry landed — `getAgentModel` available)
- **PRD References:** S9-API Design — POST /api/intent/extract-params, S10-TRD Section 11

---

## BACKGROUND

The intent extraction endpoint converts user intent strings (e.g., "twisty mountain roads near Asheville") into validated 10-key IntentParams objects. This is the only place the mobile app calls an LLM — and it only happens on cache misses. The endpoint runs as a Convex action and uses the project's `getAgentModel('low')` registry (Cerebras `qwen-3-235b-a22b-instruct-2507` via pi-ai) for the underlying LLM call, keeping it consistent with all other agent infrastructure. It enforces temperature=0 (P4), retries on validation failure, and never sends route candidates to the LLM (P1).

**PRD References:**
- S9-API Design — POST /api/intent/extract-params
- S10-TRD Section 7 (Intent Search Action), AD-11 (Single shipping path)
- S10-TRD AD-10 (P1: text->structure only, P4: temperature=0, P5: deterministic parser)

**Key Constraints:**
- P1: LLM sees only the user's intent string, NEVER route candidates
- P4: temperature=0 enforced, never overridden
- P5: Deterministic JSON schema validation (Zod) replaces Instructor — validates output before caching
- Uses `getAgentModel('low')` from `convex/actions/agent/lib/models.ts` — no direct provider imports
- Returns schemaVersion + latencyMs for client caching decisions
- Max 2 retries on validation failure, then LOW_CONFIDENCE_BROADEN fallback

---

## ACCEPTANCE CRITERIA

### AC-001: Valid Intent Returns Structured Params
**GIVEN** an authenticated user submits a valid intent string (e.g., "twisty roads in Colorado")
**WHEN** the intent extraction action runs
**THEN** the model extracts 10 nullable IntentParams keys (archetype, state, min_length_mi, max_length_mi, max_technical, min_traffic_score, min_remoteness, max_distance_mi, season, sort_by)
**AND** the response includes `params`, `schemaVersion`, and `latencyMs`
**AND** the result is written to intent_param_cache for future cache hits

**Verify:** Submit "twisty mountain roads" intent, verify response contains structured params with archetype="twisties" or "mountain" and schemaVersion matches INTENT_SCHEMA_VERSION.

### AC-002: Invalid Archetype Triggers Retry
**GIVEN** the model returns an archetype value not in the valid enum set
**WHEN** Zod validates the response
**THEN** a validation error is detected
**AND** a retry is triggered with the validation error appended to the prompt
**AND** up to 2 retries are attempted
**AND** all retries use temperature=0

**Verify:** Mock `getAgentModel` to return invalid archetype on first call, valid on second, verify retry behavior.

### AC-003: All Retries Fail Returns LOW_CONFIDENCE_BROADEN
**GIVEN** all extraction attempts (initial + 2 retries) fail Zod validation
**WHEN** the action exhausts all retries
**THEN** the response returns `{ error: "LOW_CONFIDENCE_BROADEN", suggestedParams }` with partial params from the best attempt
**AND** the client can use suggestedParams to retry with a broadened intent

**Verify:** Mock `getAgentModel` to always return invalid data, verify LOW_CONFIDENCE_BROADEN error response.

### AC-004: Authentication Required
**GIVEN** an unauthenticated intent extraction request
**WHEN** the request lacks valid Clerk auth
**THEN** the response is 401 Unauthorized
**AND** no LLM call is made

**Verify:** Submit intent without auth, verify 401 response and no model invocation.

### AC-005: temperature=0 Enforced
**GIVEN** any LLM call in this action
**WHEN** `getAgentModel('low')` is invoked
**THEN** the generate call passes `temperature: 0`
**AND** this is enforced at the call site, never overridden

**Verify:** Inspect implementation for temperature setting, verify hardcoded to 0.

---

## TEST CRITERIA

- [ ] Valid intent returns 10-key IntentParams object
- [ ] Response includes schemaVersion and latencyMs
- [ ] Invalid archetype triggers retry (up to 2 retries)
- [ ] All retries exhaust → LOW_CONFIDENCE_BROADEN error response
- [ ] temperature=0 in LLM call configuration
- [ ] Returns 401 for unauthenticated requests
- [ ] No route candidates sent to LLM (P1 compliance)
- [ ] Intent is normalized before cache lookup (stopwords stripped, lowercased, sorted)
- [ ] Cache hit returns cached params without LLM call
- [ ] Cache miss stores result after successful extraction
- [ ] Convex typecheck passes: `npx convex typecheck`

---

## READING LIST

- `convex/actions/agent/lib/models.ts` (from AI-001) — `getAgentModel('low')`, `IntelligenceLevel`
- `.spec/prds/curation/convex-api-design.md` — Section 7 (Intent Search Action), Section 8 (Intent Param Cache)
- `.spec/prds/curation/09-technical-requirements.md` — Intent Query Service, Intent Cache, API Design
- `.spec/prds/curation/10-trd-detail.md` — AD-10 (Pipeline Principles), AD-11 (Single shipping path)
- `convex/actions/agent/agents/routingAgent.ts` — example of how pi-ai model generate is called in this codebase

---

## GUARDRAILS

**WRITE-ALLOWED FILES:**
- `convex/http.ts` (MODIFY — add POST /api/intent/extract-params route)
- `convex/db/intentExtraction.ts` (CREATE — cache read/write mutations and queries)
- `convex/lib/intentSchema.ts` (CREATE — IntentParams type, INTENT_SCHEMA_VERSION, Zod validator, normalization utilities)
- `convex/actions/curation/extractIntentParams.ts` (CREATE — action with `'use node'` directive)

**NEVER MODIFY:**
- `convex/schema.ts` — schema is owned by CONVEX-002
- `convex/actions/agent/lib/models.ts` — registry is owned by AI-001
- `models/curated-routes.ts` — validators owned by CONVEX-001
- Existing curation queries (CONVEX-004 artifacts)

**CONVEX PATTERNS:**
- `'use node'` directive REQUIRED at top of action file — pi-ai requires Node runtime
- Actions call queries/mutations via `ctx.runQuery` / `ctx.runMutation` with `internal.*` references
- `ConvexError` with stable codes: `'EMPTY_INTENT'`, `'INTENT_EXTRACTION_FAILED'`
- Import `getAgentModel` from `'../agent/lib/models'` — never import from `@mariozechner/pi-ai` directly

---

## CODE PATTERN

**Intent Schema (convex/lib/intentSchema.ts):**
```typescript
import { z } from 'zod'

export const INTENT_SCHEMA_VERSION = 1

export const STOPWORDS = new Set([
  'a', 'an', 'the', 'i', 'me', 'my', 'want', 'find', 'show', 'give',
  'please', 'some', 'any', 'with', 'for', 'of', 'to', 'on', 'in',
  'and', 'or', 'that', 'this', 'roads', 'road', 'ride', 'rides',
  'route', 'routes',
])

export const normalizeIntent = (raw: string): string =>
  raw
    .toLowerCase()
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(tok => tok.length > 0 && !STOPWORDS.has(tok))
    .sort()
    .join(' ')
    .trim()

export const IntentParamsSchema = z.object({
  archetype: z.enum(['twisties', 'mountain', 'coastal', 'adventure', 'scenic_byway', 'desert']).nullable(),
  state: z.string().nullable(),
  min_length_mi: z.number().nullable(),
  max_length_mi: z.number().nullable(),
  max_technical: z.number().min(0).max(1).nullable(),
  min_traffic_score: z.number().min(0).max(1).nullable(),
  min_remoteness: z.number().min(0).max(1).nullable(),
  max_distance_mi: z.number().nullable(),
  season: z.enum(['year_round', 'apr_nov', 'may_sep', 'spring_fall']).nullable(),
  sort_by: z.enum(['compositeScore', 'proximity']).nullable(),
})

export type IntentParams = z.infer<typeof IntentParamsSchema>
```

**Intent Extraction Action (convex/actions/curation/extractIntentParams.ts):**
```typescript
'use node'

import { getAgentModel } from '../agent/lib/models'
import { internal } from 'convex/_generated/api'
import { INTENT_SCHEMA_VERSION, normalizeIntent, IntentParamsSchema } from '../../lib/intentSchema'
import type { IntentParams } from '../../lib/intentSchema'

const SYSTEM_PROMPT = `You extract structured search parameters from motorcycle ride intent strings.
Return a JSON object with these 10 nullable keys:
- archetype: "twisties" | "mountain" | "coastal" | "adventure" | "scenic_byway" | "desert" | null
- state: US state abbreviation | null
- min_length_mi: number | null
- max_length_mi: number | null
- max_technical: 0-1 | null
- min_traffic_score: 0-1 | null
- min_remoteness: 0-1 | null
- max_distance_mi: number | null
- season: "year_round" | "apr_nov" | "may_sep" | "spring_fall" | null
- sort_by: "compositeScore" | "proximity" | null
Return ONLY the JSON object, no explanation.`

export const extractIntentParams = async (
  ctx: any,
  args: { intent: string }
): Promise<
  { params: IntentParams; schemaVersion: number; latencyMs: number } |
  { error: string; suggestedParams: Partial<IntentParams> }
> => {
  const start = Date.now()

  const normalized = normalizeIntent(args.intent)
  if (!normalized) throw new ConvexError('EMPTY_INTENT')

  // Cache hit path
  const cached = await ctx.runQuery(
    internal.db.intentExtraction.getByNormalizedIntent,
    { normalizedIntent: normalized, schemaVersion: INTENT_SCHEMA_VERSION }
  )
  if (cached) {
    await ctx.runMutation(internal.db.intentExtraction.bumpHit, { cacheId: cached._id })
    return {
      params: JSON.parse(cached.paramsJson),
      schemaVersion: INTENT_SCHEMA_VERSION,
      latencyMs: Date.now() - start,
    }
  }

  // Cache miss: call model via registry
  const model = getAgentModel('low')
  const MAX_RETRIES = 2
  let lastError: string | null = null
  let bestParams: Partial<IntentParams> = {}

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const userContent = lastError
      ? `${args.intent}\n\nPrevious attempt failed validation: ${lastError}. Fix and return valid JSON.`
      : args.intent

    // pi-ai generate call — temperature=0 enforced (P4)
    const response = await model.generate({
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
      temperature: 0,   // P4: hardcoded, never overridden
      maxTokens: 512,
    })

    try {
      const raw = typeof response === 'string' ? response : response.text ?? response.content ?? ''
      const parsed = JSON.parse(raw.trim())
      const validated = IntentParamsSchema.parse(parsed)

      await ctx.runMutation(internal.db.intentExtraction.upsert, {
        normalizedIntent: normalized,
        paramsJson: JSON.stringify(validated),
        schemaVersion: INTENT_SCHEMA_VERSION,
      })

      return {
        params: validated,
        schemaVersion: INTENT_SCHEMA_VERSION,
        latencyMs: Date.now() - start,
      }
    } catch (e) {
      lastError = (e as Error).message
      if (attempt === 0 && Object.keys(bestParams).length === 0) {
        try { bestParams = JSON.parse(
          typeof response === 'string' ? response : response.text ?? '{}'
        ) } catch {}
      }
    }
  }

  return { error: 'LOW_CONFIDENCE_BROADEN', suggestedParams: bestParams }
}
```

**Intent Cache DB Module (convex/db/intentExtraction.ts):**
```typescript
export const getByNormalizedIntent = internalQuery({
  args: { normalizedIntent: v.string(), schemaVersion: v.number() },
  returns: v.union(v.null(), v.object({
    _id: v.id('intent_param_cache'),
    paramsJson: v.string(),
    hitCount: v.number(),
  })),
  handler: async (ctx, args) =>
    ctx.db.query('intent_param_cache')
      .withIndex('by_normalizedIntent_and_schemaVersion',
        q => q.eq('normalizedIntent', args.normalizedIntent)
               .eq('schemaVersion', args.schemaVersion))
      .unique(),
})

export const upsert = internalMutation({
  args: { normalizedIntent: v.string(), paramsJson: v.string(), schemaVersion: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db.query('intent_param_cache')
      .withIndex('by_normalizedIntent_and_schemaVersion',
        q => q.eq('normalizedIntent', args.normalizedIntent)
               .eq('schemaVersion', args.schemaVersion))
      .unique()
    if (existing) {
      await ctx.db.patch(existing._id, { paramsJson: args.paramsJson, hitCount: existing.hitCount + 1, lastHitAt: Date.now() })
    } else {
      await ctx.db.insert('intent_param_cache', {
        normalizedIntent: args.normalizedIntent, paramsJson: args.paramsJson,
        schemaVersion: args.schemaVersion, hitCount: 1,
        createdAt: Date.now(), lastHitAt: Date.now(),
      })
    }
  },
})

export const bumpHit = internalMutation({
  args: { cacheId: v.id('intent_param_cache') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.cacheId)
    if (doc) await ctx.db.patch(args.cacheId, { hitCount: doc.hitCount + 1, lastHitAt: Date.now() })
  },
})
```

---

## AGENT INSTRUCTIONS

1. Confirm AI-003 is complete (`convex/actions/agent/lib/models.ts` exists with `getAgentModel`)
2. Read `convex/actions/agent/agents/routingAgent.ts` to understand how pi-ai model calls are structured in this codebase
3. Create `convex/lib/intentSchema.ts` — INTENT_SCHEMA_VERSION, normalizeIntent, STOPWORDS, IntentParamsSchema (Zod)
4. Create `convex/db/intentExtraction.ts` — getByNormalizedIntent, upsert, bumpHit
5. Create `convex/actions/curation/extractIntentParams.ts` with `'use node'` — uses `getAgentModel('low')`, Zod validation, retry loop, cache integration
6. Register POST /api/intent/extract-params route in `convex/http.ts`
7. temperature=0 is hardcoded at the model.generate() call site — never overridden, not configurable
8. NEVER send route candidates to the LLM (P1 hard constraint)
9. Run `npx convex typecheck` to verify

**Note on pi-ai generate API:** Check the actual `model.generate()` / `model.chat()` signature from the pi-ai package before writing the implementation — the exact call shape may differ slightly from the pattern above. The pattern shows the intent; adjust field names to match the real API.

---

## ORCHESTRATOR VERIFICATION PROTOCOL

1. **Pre-dispatch:** Verify AI-003 is complete (grep `getAgentModel` in `convex/actions/agent/agents/`)
2. **Post-completion verification:**
   ```bash
   npx convex typecheck

   # Verify 'use node' directive
   head -1 convex/actions/curation/extractIntentParams.ts

   # Verify temperature=0
   grep -n "temperature" convex/actions/curation/extractIntentParams.ts

   # Verify no direct provider imports
   grep -n "anthropic\|pi-ai\|cerebras" convex/actions/curation/extractIntentParams.ts

   # Verify getAgentModel usage
   grep -n "getAgentModel" convex/actions/curation/extractIntentParams.ts

   # Verify route registration
   grep -n "intent/extract-params" convex/http.ts
   ```
3. **Evidence gate:** typecheck passes, `'use node'` present, temperature=0 enforced, `getAgentModel` used (no direct provider imports), route registered

---

## AGENT ASSIGNMENT

**Primary:** convex-implementer
**Review:** convex-reviewer
**Rationale:** Convex action with pi-ai model call via registry, Zod validation, retry logic, and cache management. Reviewer should verify P1/P4/P5 compliance and that no provider strings leak into the action file.

---

## EVIDENCE GATES

- [ ] `'use node'` directive at top of action file
- [ ] POST /api/intent/extract-params route registered
- [ ] temperature=0 hardcoded in model.generate() call
- [ ] `getAgentModel('low')` used — no `@anthropic-ai/sdk` or direct `getModel()` import
- [ ] Valid intent returns 10-key params + schemaVersion + latencyMs
- [ ] Invalid archetype triggers retry (up to 2)
- [ ] All retries fail → LOW_CONFIDENCE_BROADEN error
- [ ] Cache hit returns cached params without LLM call
- [ ] Cache miss stores result after successful extraction
- [ ] Returns 401 without auth
- [ ] `npx convex typecheck` passes

---

## REVIEW CRITERIA

- `'use node'` directive is the FIRST line of the action file (not after imports)
- `getAgentModel('low')` is the ONLY model instantiation — no `new Anthropic()`, no `getModel()` direct call
- temperature=0 is set in the generate/chat call options, not as a default parameter
- Intent normalization is deterministic (same input always produces same cache key)
- Retry loop appends Zod validation error to prompt for correction
- LOW_CONFIDENCE_BROADEN returns partial params (best effort) not an empty object
- Zod schema covers all 10 IntentParams fields with correct enum literals (matching curated_routes source/archetype/season literals from CONVEX-001)
- No route candidates ever included in the LLM prompt (P1 compliance)

---

## DEPENDENCIES

Depends On:
- CONVEX-002 (intent_param_cache table in schema)
- AI-003 (`getAgentModel` available at `convex/actions/agent/lib/models.ts`)

Blocks:
- CONVEX-009 (HTTP route registration for all endpoints)

---

## NOTES

- **Provider**: Uses `getAgentModel('low')` → Cerebras `qwen-3-235b-a22b-instruct-2507` via pi-ai. No Anthropic SDK dependency. `CEREBRAS_API_KEY` must be set in Convex env (handled by AI-002).
- **`'use node'` is still required** — pi-ai requires Node runtime just as the Anthropic SDK did. This directive is about the runtime, not the provider.
- **Zod replaces Instructor** — Instructor is a Python/Anthropic-specific library. Zod provides equivalent deterministic schema validation for the TypeScript side. The retry-on-validation-failure pattern (P5) is preserved, just implemented with `IntentParamsSchema.parse()` instead of Instructor's validator.
- **INTENT_SCHEMA_VERSION = 1** — bump when the prompt or params schema changes. Old cache rows coexist harmlessly (different schemaVersion = cache miss).
- **pi-ai generate API shape:** Confirm the exact `model.generate()` signature from the installed `@mariozechner/pi-ai` package before implementing — field names (`maxTokens` vs `max_tokens`, response shape) may differ. The code pattern above shows intent; the implementer must verify against the real API.
