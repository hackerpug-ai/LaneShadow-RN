# US-077: Create webSearch Tool

> Epic: 3c — Agent Orchestrator Refactor
> Sequence: 2 (depends on US-070, parallel with US-071/072/076)
> Agent: convex-implementer
> Reviewer: convex-reviewer

## Context

Some rider questions can't be answered from LLM training data or Google Places: "is Skyline Blvd closed today?", "what's the speed limit on Highway 9?", "any road construction near Big Sur?". A lightweight web search tool gives the search agent access to current information.

## Tool Schema

### Input (TypeBox)

```typescript
webSearch: Type.Object({
  query: Type.String({
    description: 'Search query in natural language (e.g., "Skyline Blvd road closure 2026", "speed limit Highway 9 Santa Cruz")',
  }),
  maxResults: Type.Union([Type.Integer(), Type.Null()], {
    description: 'Maximum number of results to return. Null for default (3).',
  }),
})
```

### Output

```typescript
type WebSearchResult =
  | WebSearchHit[]
  | { status: 'error'; reason: string }

type WebSearchHit = {
  title: string
  snippet: string
  url: string
}
```

## Reusable Modules

This tool reuses the web search provider created in US-070, adapted from holocron's Jina implementation.

| Module | What it provides | Source pattern |
|--------|-----------------|---------------|
| `providers/webSearchProvider.ts` | `createWebSearchProvider().search()` — Jina Search API wrapper | Adapted from `holocron/convex/research/search.ts` (lines 469-502) and `holocron/convex/research/tools.ts` (lines 185-261) |
| `lib/reliability.ts` | `withTimeout()` — 8s timeout wrapper | Existing (no changes needed) |

### Holocron Jina Pattern (reference)

From `/Users/justinrich/Projects/holocron/convex/research/search.ts`:
```typescript
// Endpoint
const response = await fetch(`https://s.jina.ai/?q=${encodedQuery}`, {
  method: 'GET',
  headers: {
    Authorization: `Bearer ${JINA_API_KEY}`,
    Accept: 'application/json',
  },
})

// Response shape
{ data: [{ url, title, description, domain? }] }

// Map description → snippet
```

Key differences from holocron:
- Holocron uses 500-char content truncation → we use 200 chars (tighter agent context)
- Holocron returns 8+ results → we return 3 (search agent only needs enough to synthesize)
- Holocron has rate limiting (90 RPM via DB-backed sliding window) → we skip this initially (agent use is ~1-2 QPM)
- Holocron uses `JINA_API_KEY` env var → we do the same, with unauthenticated fallback

## Acceptance Criteria

- [x] `convex/actions/agent/tools/webSearch.ts` exists
- [x] Delegates to `createWebSearchProvider().search()` (created in US-070) — does NOT call Jina API directly
- [x] Input: `query: string`, optional `maxResults` (default 3)
- [x] Output: array of `{ title, snippet, url }` — compact enough for LLM context without summarization
- [ ] Results are trimmed: snippet max 200 chars, no HTML tags <!-- FAIL: 200-char truncation present in provider but no HTML stripping logic exists in either webSearch.ts or webSearchProvider.ts -->
- [x] Soft-fail: returns `[]` on provider failure (never throws)
- [x] Tool schema added to `piTools.ts` as `AgentToolSchemas.webSearch`
- [x] Wrapped with `traceableToolAsync` for observability

## Files to Create/Modify

| File | Change |
|------|--------|
| `convex/actions/agent/tools/webSearch.ts` | **CREATE** — thin wrapper around webSearchProvider |
| `convex/actions/agent/lib/piTools.ts` | Add `webSearch` schema |

## Implementation Notes

- The `webSearchProvider` (created in US-070) handles Jina API endpoint, auth header, response parsing, timeout — the tool just passes params and wraps with tracing
- API key: `optionalEnv('JINA_API_KEY')` in `convex/lib/env.ts` — add if not present. Unauthenticated requests work but have lower rate limits.
- Keep the tool simple — this is a thin wrapper, not a research system. 3 results with short snippets is sufficient for the search agent to synthesize an answer.
- The search agent's LLM (Haiku) synthesizes the snippets into a rider-friendly answer — the raw results don't go to the user.
