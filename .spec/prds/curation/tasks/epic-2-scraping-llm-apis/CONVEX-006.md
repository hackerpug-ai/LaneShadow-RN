# CONVEX-006: Intent Extraction HTTP Endpoint (Haiku Wrapper)

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

- **Depends on:** CONVEX-002 (Curation tables + indexes, including intent_param_cache table)
- **PRD References:** S9-API Design — POST /api/intent/extract-params, S10-TRD Section 11

---

## BACKGROUND

The intent extraction endpoint is the server-side Haiku wrapper that converts user intent strings (e.g., "twisty mountain roads near Asheville") into validated 10-key IntentParams objects. This is the only place the mobile app calls an LLM — and it only happens on cache misses. The endpoint runs as a Convex action with `'use node'` directive (required for Anthropic SDK), enforces temperature=0 (P4), retries on validation failure, and never sends route candidates to the LLM (P1).

**PRD References:**
- S9-API Design — POST /api/intent/extract-params
- S10-TRD Section 7 (Intent Search Action), AD-11 (Single shipping path)
- S10-TRD AD-10 (P1: text->structure only, P4: temperature=0, P5: deterministic parser)

**Key Constraints:**
- P1: LLM sees only the user's intent string, NEVER route candidates
- P4: temperature=0 enforced, never overridden
- P5: Deterministic parser (Instructor + Pydantic via Anthropic SDK) validates output
- 'use node' directive required for Anthropic SDK
- Returns schemaVersion + latencyMs for client caching decisions
- Max 2 retries on validation failure, then LOW_CONFIDENCE_BROADEN fallback

---

## ACCEPTANCE CRITERIA

### AC-001: Valid Intent Returns Structured Params
**GIVEN** an authenticated user submits a valid intent string (e.g., "twisty roads in Colorado")
**WHEN** the intent extraction action runs
**THEN** Haiku extracts 10 nullable IntentParams keys (archetype, state, min_length_mi, max_length_mi, max_technical, min_traffic_score, min_remoteness, max_distance_mi, season, sort_by)
**AND** the response includes `params`, `schemaVersion`, and `latencyMs`
**AND** the result is written to intent_param_cache for future cache hits

**Verify:** Submit "twisty mountain roads" intent, verify response contains structured params with archetype="twisties" or "mountain" and schemaVersion matches INTENT_SCHEMA_VERSION.

### AC-002: Invalid Archetype Triggers Retry
**GIVEN** Haiku returns an archetype value not in the valid enum set
**WHEN** the deterministic parser validates the response
**THEN** a validation error is detected
**AND** a retry is triggered with the validation error appended to the prompt
**AND** up to 2 retries are attempted
**AND** all retries use temperature=0

**Verify:** Mock Haiku to return invalid archetype on first call, valid on second, verify retry behavior.

### AC-003: All Retries Fail Returns LOW_CONFIDENCE_BROADEN
**GIVEN** all extraction attempts (initial + 2 retries) fail validation
**WHEN** the action exhausts all retries
**THEN** the response returns `{ error: "LOW_CONFIDENCE_BROADEN", suggestedParams }` with partial params from the best attempt
**AND** the client can use suggestedParams to retry with a broadened intent

**Verify:** Mock Haiku to always return invalid data, verify LOW_CONFIDENCE_BROADEN error response.

### AC-004: Authentication Required
**GIVEN** an unauthenticated intent extraction request
**WHEN** the request lacks valid Clerk auth
**THEN** the response is 401 Unauthorized
**AND** no Haiku API call is made

**Verify:** Submit intent without auth, verify 401 response and no Anthropic API usage.

### AC-005: temperature=0 Enforced
**GIVEN** any Haiku API call in this action
**WHEN** the Anthropic SDK is invoked
**THEN** temperature is set to exactly 0
**AND** this is enforced at the client configuration level

**Verify:** Grep the implementation for temperature setting, verify it is hardcoded to 0.

---

## TEST CRITERIA

- [ ] Valid intent returns 10-key IntentParams object
- [ ] Response includes schemaVersion and latencyMs
- [ ] Invalid archetype triggers retry (up to 2 retries)
- [ ] All retries exhaust → LOW_CONFIDENCE_BROADEN error response
- [ ] temperature=0 hardcoded in Anthropic client configuration
- [ ] Returns 401 for unauthenticated requests
- [ ] No route candidates sent to LLM (P1 compliance)
- [ ] Intent is normalized before cache lookup (stopwords stripped, lowercased, sorted)
- [ ] Cache hit returns cached params without Haiku call
- [ ] Cache miss stores result after successful extraction
- [ ] Convex typecheck passes: `npx convex typecheck`

---

## READING LIST

- `.spec/prds/curation/convex-api-design.md` — Section 7 (Intent Search Action), Section 8 (Intent Param Cache)
- `.spec/prds/curation/09-technical-requirements.md` — Intent Query Service, Intent Cache, API Design
- `.spec/prds/curation/10-trd-detail.md` — AD-10 (Pipeline Principles), AD-11 (Single shipping path)
- `convex/_generated/ai/guidelines.md` — Convex action patterns, 'use node' directive

---

## GUARDRAILS

**WRITE-ALLOWED FILES:**
- `convex/http.ts` (MODIFY — add POST /api/intent/extract-params route)
- `convex/db/intentExtraction.ts` (CREATE — cache read/write mutations and queries)
- `convex/lib/intentSchema.ts` (CREATE — IntentParams type, INTENT_SCHEMA_VERSION, normalization utilities)

**NEVER MODIFY:**
- `convex/schema.ts` — schema is owned by CONVEX-002
- `models/curated-routes.ts` — IntentParams type is owned by CONVEX-001 but the schema version and normalization live in the new file
- Existing curation queries (CONVEX-004 artifacts)

**CONVEX PATTERNS:**
- `'use node'` directive REQUIRED at top of action file (Anthropic SDK needs Node runtime)
- Actions call queries/mutations via `ctx.runQuery` / `ctx.runMutation` with `internal.*` references
- `ConvexError` with stable codes: `'EMPTY_INTENT'`, `'INTENT_EXTRACTION_FAILED'`

---

## CODE PATTERN

**Intent Schema (convex/lib/intentSchema.ts):**
```typescript
export const INTENT_SCHEMA_VERSION = 1;

export const STOPWORDS = new Set([
  "a", "an", "the", "i", "me", "my", "want", "find", "show", "give",
  "please", "some", "any", "with", "for", "of", "to", "on", "in",
  "and", "or", "that", "this", "roads", "road", "ride", "rides",
  "route", "routes",
]);

export const normalizeIntent = (raw: string): string =>
  raw
    .toLowerCase()
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(tok => tok.length > 0 && !STOPWORDS.has(tok))
    .sort()
    .join(" ")
    .trim();
```

**Intent Extraction Action (with 'use node'):**
```typescript
// convex/actions/curation/extractIntentParams.ts
"use node";

import Anthropic from "@anthropic-ai/sdk";
import { internal } from "convex/_generated/api";
import { INTENT_SCHEMA_VERSION, normalizeIntent } from "../../lib/intentSchema";

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
- sort_by: "compositeScore" | "proximity" | null`;

export const extractIntentParams = async (
  ctx: any,
  args: { intent: string }
): Promise<{
  params: Record<string, any>;
  schemaVersion: number;
  latencyMs: number;
} | { error: string; suggestedParams: Record<string, any> }> => {
  const start = Date.now();

  // Normalize and check cache
  const normalized = normalizeIntent(args.intent);
  if (!normalized) throw new ConvexError("EMPTY_INTENT");

  const cached = await ctx.runQuery(
    internal.db.intentExtraction.getByNormalizedIntent,
    { normalizedIntent: normalized, schemaVersion: INTENT_SCHEMA_VERSION }
  );

  if (cached) {
    await ctx.runMutation(internal.db.intentExtraction.bumpHit, {
      cacheId: cached._id,
    });
    return {
      params: JSON.parse(cached.paramsJson),
      schemaVersion: INTENT_SCHEMA_VERSION,
      latencyMs: Date.now() - start,
    };
  }

  // Cache miss: call Haiku
  const client = new Anthropic(); // uses ANTHROPIC_API_KEY env var
  const MAX_RETRIES = 2;
  let lastError: string | null = null;
  let bestParams: Record<string, any> = {};

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.messages.create({
        model: "claude-3-5-haiku-latest",
        max_tokens: 512,
        temperature: 0, // P4: hardcoded, never overridden
        system: SYSTEM_PROMPT,
        messages: [
          { role: "user", content: args.intent },
          ...(lastError
            ? [{ role: "assistant" as const, content: JSON.stringify(bestParams) }]
            : []),
          ...(lastError
            ? [{ role: "user" as const, content: `Validation error: ${lastError}. Fix and return valid JSON.` }]
            : []),
        ],
      });

      const parsed = JSON.parse(
        response.content[0].type === "text" ? response.content[0].text : "{}"
      );
      const validated = validateIntentParams(parsed);

      // Cache the result
      await ctx.runMutation(internal.db.intentExtraction.upsert, {
        normalizedIntent: normalized,
        paramsJson: JSON.stringify(validated),
        schemaVersion: INTENT_SCHEMA_VERSION,
      });

      return {
        params: validated,
        schemaVersion: INTENT_SCHEMA_VERSION,
        latencyMs: Date.now() - start,
      };
    } catch (e) {
      lastError = (e as Error).message;
      bestParams = { ...bestParams }; // keep partial for fallback
    }
  }

  // All retries exhausted
  return {
    error: "LOW_CONFIDENCE_BROADEN",
    suggestedParams: bestParams,
  };
};
```

**Intent Cache DB Module (convex/db/intentExtraction.ts):**
```typescript
// Queries and mutations for intent_param_cache table
export const getByNormalizedIntent = internalQuery({
  args: {
    normalizedIntent: v.string(),
    schemaVersion: v.number(),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("intent_param_cache"),
      paramsJson: v.string(),
      hitCount: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    return ctx.db
      .query("intent_param_cache")
      .withIndex("by_normalizedIntent_and_schemaVersion",
        q => q.eq("normalizedIntent", args.normalizedIntent)
              .eq("schemaVersion", args.schemaVersion)
      )
      .unique();
  },
});

export const upsert = internalMutation({
  args: {
    normalizedIntent: v.string(),
    paramsJson: v.string(),
    schemaVersion: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("intent_param_cache")
      .withIndex("by_normalizedIntent_and_schemaVersion",
        q => q.eq("normalizedIntent", args.normalizedIntent)
              .eq("schemaVersion", args.schemaVersion)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        paramsJson: args.paramsJson,
        hitCount: existing.hitCount + 1,
        lastHitAt: Date.now(),
      });
    } else {
      await ctx.db.insert("intent_param_cache", {
        normalizedIntent: args.normalizedIntent,
        paramsJson: args.paramsJson,
        schemaVersion: args.schemaVersion,
        hitCount: 1,
        createdAt: Date.now(),
        lastHitAt: Date.now(),
      });
    }
  },
});

export const bumpHit = internalMutation({
  args: { cacheId: v.id("intent_param_cache") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.cacheId);
    if (doc) {
      await ctx.db.patch(args.cacheId, {
        hitCount: doc.hitCount + 1,
        lastHitAt: Date.now(),
      });
    }
  },
});
```

---

## AGENT INSTRUCTIONS

1. Read `convex/_generated/ai/guidelines.md` for Convex action patterns
2. Read `convex/http.ts` for existing route registration
3. Read `models/curated-routes.ts` for IntentParams type and validators
4. Create `convex/lib/intentSchema.ts` — INTENT_SCHEMA_VERSION, normalizeIntent, STOPWORDS, validateIntentParams
5. Create `convex/db/intentExtraction.ts` — getByNormalizedIntent (internalQuery), upsert (internalMutation), bumpHit (internalMutation)
6. Create the action file with `'use node'` directive — extractIntentParams action with Haiku call, retry logic, cache integration
7. Register POST /api/intent/extract-params route in `convex/http.ts`
8. temperature=0 is hardcoded — never overridden, not configurable
9. NEVER send route candidates to the LLM (P1 hard constraint)
10. NEVER use temperature > 0 (P4 hard constraint)
11. Run `npx convex typecheck` to verify

---

## ORCHESTRATOR VERIFICATION PROTOCOL

1. **Pre-dispatch:** Verify CONVEX-002 is complete (schema + intent_param_cache table)
2. **Post-completion verification:**
   ```bash
   npx convex typecheck

   # Verify 'use node' directive
   head -1 convex/actions/curation/extractIntentParams.ts

   # Verify temperature=0
   grep -n "temperature" convex/actions/curation/extractIntentParams.ts

   # Verify route registration
   grep -n "intent/extract-params" convex/http.ts
   ```
3. **Evidence gate:** typecheck passes, 'use node' present, temperature=0 enforced, route registered

---

## AGENT ASSIGNMENT

**Primary:** convex-implementer
**Review:** convex-reviewer
**Rationale:** Complex Convex action with Node runtime requirement, Anthropic SDK integration, retry logic, and cache management. Reviewer should verify P1/P4/P5 compliance.

---

## EVIDENCE GATES

- [ ] 'use node' directive at top of action file
- [ ] POST /api/intent/extract-params route registered
- [ ] temperature=0 hardcoded in Anthropic client configuration
- [ ] Valid intent returns 10-key params + schemaVersion + latencyMs
- [ ] Invalid archetype triggers retry (up to 2)
- [ ] All retries fail → LOW_CONFIDENCE_BROADEN error
- [ ] Cache hit returns cached params without Haiku call
- [ ] Cache miss stores result after successful extraction
- [ ] Returns 401 without auth
- [ ] `npx convex typecheck` passes

---

## REVIEW CRITERIA

- `'use node'` directive is the FIRST line of the action file (not after imports)
- Anthropic SDK is instantiated with `new Anthropic()` using env var `ANTHROPIC_API_KEY`
- temperature=0 is set in the `create()` call options, not as a default parameter
- Intent normalization is deterministic (same input always produces same cache key)
- Retry logic appends validation error to prompt for correction
- LOW_CONFIDENCE_BROADEN returns partial params (best effort) not an empty object
- Cache operations use internal mutations/queries via `ctx.runMutation`/`ctx.runQuery`
- validateIntentParams checks all enum fields against the valid Literal types
- No route candidates are ever included in the LLM prompt (P1 compliance)

---

## NOTES

- **This is the ONLY place the mobile app calls an LLM.** Every other path is pure SQL or cached data.
- **The action requires `'use node'`** because the Anthropic SDK imports Node.js modules. Without this directive, the Convex bundle fails to build.
- **ANTHROPIC_API_KEY** must be set as a Convex environment variable: `npx convex env set ANTHROPIC_API_KEY <key>`
- **Intent normalization** uses sort() to make "twisty mountain" and "mountain twisty" share a cache entry.
- **INTENT_SCHEMA_VERSION = 1** — bump when the Haiku prompt or params schema changes. Old cache rows coexist harmlessly (different schemaVersion = cache miss).
- **validateIntentParams** is the P5 deterministic parser — it must fail loudly on schema violations and trigger retries, never silently accept invalid data.
- **The LOW_CONFIDENCE_BROADEN response** tells the client to try a broader query (e.g., drop the archetype filter). The suggestedParams provide a starting point.
