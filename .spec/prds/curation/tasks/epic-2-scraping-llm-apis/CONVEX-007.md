# CONVEX-007: Admin Dashboard Metrics Endpoint

**Task ID:** CONVEX-007
**Epic:** Epic 2 - Web Scraping, LLM Extraction & Public APIs
**Assigned To:** convex-implementer
**Priority:** P2
**Effort:** S
**Estimate:** 90 min
**Type:** [FEATURE]
**Status:** Backlog

---

## DEPENDENCIES

- **Depends on:** CONVEX-002 (Curation tables + indexes), CONVEX-003 (Admin HTTP endpoints pattern)
- **PRD References:** S9-API Design — GET /api/dashboard/metrics

---

## BACKGROUND

The admin dashboard metrics endpoint provides pipeline health visibility — total routes, enrichments, breakdown by source, last scrape timestamp, estimated LLM cost, and feedback summary. This is an admin-only endpoint (bearer token auth, same as CONVEX-003) that aggregates data across all curation tables for monitoring and operational decision-making.

**PRD References:**
- S9-API Design — GET /api/dashboard/metrics (Internal/Admin-Only)
- S9-TRD Section: Convex Backend (metrics queries)

**Key Constraints:**
- Bearer token auth (same deploy key as admin endpoints in CONVEX-003)
- Full-table scan acceptable at launch volume; add rollup table at 5k+ rows
- Never expose individual user data — feedback is aggregated only

---

## ACCEPTANCE CRITERIA

### AC-001: Metrics Return Complete Dashboard Data
**GIVEN** the database contains curated routes, enrichments, and feedback
**WHEN** an authenticated admin requests GET /api/dashboard/metrics
**THEN** the response includes: totalRoutes, totalEnrichments, bySource (count per source), lastScrape (timestamp of most recent extraction), llmCost (estimated), feedbackSummary (aggregated counts by action type)
**AND** all counts are accurate reflections of the current database state

**Verify:** Seed routes, enrichments, and feedback, call metrics endpoint, verify counts match seeded data.

### AC-002: Bearer Token Auth Required
**GIVEN** a metrics request without valid bearer token
**WHEN** the request is processed
**THEN** the response is 401 Unauthorized
**AND** no metrics data is returned

**Verify:** Call metrics endpoint without auth header, verify 401 response.

### AC-003: No Individual User Data Exposed
**GIVEN** user feedback records exist in the database
**WHEN** metrics are aggregated
**THEN** feedback is returned only as aggregate counts by action type
**AND** no individual userIds, ratings for specific routes, or location data are included
**AND** the response contains only summary statistics

**Verify:** Seed feedback from multiple users, verify metrics response contains no PII.

### AC-004: Last Scrape Timestamp
**GIVEN** routes have been ingested at various times
**WHEN** metrics are computed
**THEN** lastScrape is the maximum extractedAt value across all curated routes
**AND** if no routes exist, lastScrape is null

**Verify:** Seed routes with different extractedAt values, verify lastScrape is the most recent.

### AC-005: LLM Cost Estimation
**GIVEN** the pipeline has run LLM extraction
**WHEN** metrics are computed
**THEN** llmCost returns an estimated cost based on route count and known Haiku pricing
**AND** the estimation formula is documented in code comments

**Verify:** Verify llmCost calculation matches expected formula (routes * estimated cost per route).

---

## TEST CRITERIA

- [ ] GET /api/dashboard/metrics returns all required fields
- [ ] totalRoutes matches actual route count
- [ ] totalEnrichments matches actual enrichment count
- [ ] bySource breaks down route count by source type
- [ ] lastScrape is max extractedAt (or null if empty)
- [ ] feedbackSummary contains aggregate counts by action type
- [ ] llmCost is estimated based on route count
- [ ] Returns 401 without valid bearer token
- [ ] No individual user data (userIds, locations, per-route ratings) in response
- [ ] Convex typecheck passes: `npx convex typecheck`

---

## READING LIST

- `.spec/prds/curation/convex-api-design.md` — Section 10 (Metrics Queries)
- `.spec/prds/curation/09-technical-requirements.md` — API Design (GET /api/dashboard/metrics)
- `convex/_generated/ai/guidelines.md` — Convex query patterns

---

## GUARDRAILS

**WRITE-ALLOWED FILES:**
- `convex/http.ts` (MODIFY — add GET /api/dashboard/metrics route)
- `convex/db/curation.ts` (MODIFY — add curationMetricsInternal query)

**NEVER MODIFY:**
- `convex/schema.ts` — schema is owned by CONVEX-002
- `models/` — validators are owned by CONVEX-001
- Existing endpoints (CONVEX-003, CONVEX-004 artifacts)

---

## CODE PATTERN

**Metrics Query:**
```typescript
// convex/db/curation.ts
export const curationMetricsInternal = internalQuery({
  args: {},
  returns: v.object({
    totalRoutes: v.number(),
    totalEnrichments: v.number(),
    bySource: v.record(v.string(), v.number()),
    lastScrape: v.union(v.number(), v.null()),
    llmCost: v.number(),
    feedbackSummary: v.record(v.string(), v.number()),
  }),
  handler: async (ctx) => {
    // Full-table scan — acceptable at launch volume (<5k routes)
    const routes = await ctx.db.query("curated_routes").collect();
    const enrichments = await ctx.db.query("curated_route_enrichments").collect();
    const feedback = await ctx.db.query("route_feedback").collect();

    // bySource breakdown
    const bySource: Record<string, number> = {};
    for (const route of routes) {
      bySource[route.source] = (bySource[route.source] ?? 0) + 1;
    }

    // lastScrape = max extractedAt
    const lastScrape = routes.length > 0
      ? Math.max(...routes.map(r => r.extractedAt))
      : null;

    // LLM cost estimate: Haiku ~$0.25/1M input + $1.25/1M output
    // Average: ~200 input tokens + ~300 output tokens per route
    // ~= $0.0001 per route extraction
    const llmCost = routes.length * 0.0001;

    // Feedback summary by action type
    const feedbackSummary: Record<string, number> = {};
    for (const fb of feedback) {
      feedbackSummary[fb.action] = (feedbackSummary[fb.action] ?? 0) + 1;
    }

    return {
      totalRoutes: routes.length,
      totalEnrichments: enrichments.length,
      bySource,
      lastScrape,
      llmCost: Math.round(llmCost * 100) / 100,
      feedbackSummary,
    };
  },
});
```

**HTTP Route Handler:**
```typescript
// In convex/http.ts
const metricsHandler = async (ctx: RouteContext, request: Request) => {
  // Bearer token auth (same as CONVEX-003 admin endpoints)
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (token !== process.env.CURATION_INGEST_KEY) {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const metrics = await ctx.ctx.runQuery(
    internal.db.curation.curationMetricsInternal,
    {}
  );
  return Response.json(metrics);
};
```

---

## AGENT INSTRUCTIONS

1. Read `convex/http.ts` for existing route registration pattern (especially CONVEX-003 admin endpoints)
2. Read `convex/db/curation.ts` for existing curation queries
3. Add `curationMetricsInternal` internalQuery to `convex/db/curation.ts`
4. Register GET /api/dashboard/metrics route in `convex/http.ts`
5. Use bearer token auth (same `CURATION_INGEST_KEY` env var as CONVEX-003)
6. Feedback is aggregated counts only — never expose userIds or per-route ratings
7. Full-table scan is acceptable at launch volume; document the 5k+ rollup table upgrade path
8. Run `npx convex typecheck` to verify

---

## ORCHESTRATOR VERIFICATION PROTOCOL

1. **Pre-dispatch:** Verify CONVEX-002 and CONVEX-003 are complete
2. **Post-completion verification:**
   ```bash
   npx convex typecheck
   grep -n "dashboard/metrics" convex/http.ts
   grep -n "curationMetricsInternal" convex/db/curation.ts
   ```
3. **Evidence gate:** typecheck passes, metrics route registered, internalQuery exists

---

## AGENT ASSIGNMENT

**Primary:** convex-implementer
**Rationale:** Standard Convex query + HTTP route. Small task, straightforward aggregation patterns.

---

## EVIDENCE GATES

- [ ] GET /api/dashboard/metrics route registered in convex/http.ts
- [ ] curationMetricsInternal internalQuery in convex/db/curation.ts
- [ ] Response includes all required fields (totalRoutes, totalEnrichments, bySource, lastScrape, llmCost, feedbackSummary)
- [ ] Bearer token auth enforced
- [ ] No individual user data in response
- [ ] `npx convex typecheck` passes

---

## REVIEW CRITERIA

- Auth uses same CURATION_INGEST_KEY as CONVEX-003 (consistent admin auth)
- Feedback is aggregated (counts by action) — no PII exposed
- LLM cost estimation formula is documented in code comments
- Full-table scan is acceptable at current volume; code comments document upgrade path
- lastScrape is null for empty database (not 0 or undefined)
- bySource uses route.source values as keys (matches source literal types)

---

## NOTES

- **Full-table scan is acceptable at launch** because route counts will be in the hundreds to low thousands. The TRD documents the upgrade path: add a rollup table at 5k+ rows with periodic aggregation.
- **LLM cost estimation** is approximate. The formula ($0.0001 per route) is based on Haiku pricing and average token usage. This gives operators a ballpark for cost tracking.
- **feedbackSummary** is intentionally simple — just counts by action type. Detailed feedback analysis (sentiment, patterns) is a future enhancement for the data flywheel.
- **This endpoint is admin-only** because it exposes operational metrics (route counts, costs, scrape timestamps) that are not relevant to end users.
