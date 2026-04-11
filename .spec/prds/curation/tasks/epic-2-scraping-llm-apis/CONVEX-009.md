# CONVEX-009: HTTP Route Registration for All Curation Endpoints

**Task ID:** CONVEX-009
**Epic:** Epic 2 - Web Scraping, LLM Extraction & Public APIs
**Assigned To:** convex-implementer
**Priority:** P0
**Effort:** S
**Estimate:** 60 min
**Type:** [INTEGRATION]
**Status:** Backlog

---

## DEPENDENCIES

- **Depends on:** CONVEX-003 (Admin endpoints), CONVEX-004 (Public query endpoints), CONVEX-005 (Feedback mutation), CONVEX-006 (Intent extraction), CONVEX-007 (Dashboard metrics)

---

## BACKGROUND

This is the final wiring task for Epic 2. All individual endpoint handlers have been implemented in prior tasks (CONVEX-003 through CONVEX-007), each registering their own routes incrementally. This task ensures all 8 HTTP routes are consistently registered in `convex/http.ts`, each handler delegates correctly to its underlying query/mutation/action, existing non-curation routes are preserved, and no business logic lives in the route handlers themselves.

**PRD References:**
- S9-API Design — All endpoints (Internal + Public)
- S10-TRD Section: Convex Backend, Endpoint Summary

**Key Constraints:**
- This task registers routes ONLY — no business logic in handlers
- All existing routes must be preserved (non-curation routes for other features)
- Each handler delegates to the appropriate query/mutation/action from prior tasks

---

## ACCEPTANCE CRITERIA

### AC-001: All 8 Curation Routes Registered
**GIVEN** all curation endpoint handlers from CONVEX-003 through CONVEX-007 are implemented
**WHEN** convex/http.ts is reviewed
**THEN** the following 8 routes are registered:
1. POST /api/curation/ingest (admin, CONVEX-003)
2. POST /api/curation/metrics (admin, CONVEX-003)
3. GET /api/routes/lean (public, CONVEX-004)
4. GET /api/routes/enrichment (public, CONVEX-004)
5. POST /api/routes/missing-enrichments (public, CONVEX-004)
6. POST /api/feedback (public, CONVEX-005)
7. POST /api/intent/extract-params (public, CONVEX-006)
8. GET /api/dashboard/metrics (admin, CONVEX-007)
**AND** each route delegates to the correct handler function

**Verify:** Grep http.ts for all 8 route paths, verify each has a registered handler.

### AC-002: Existing Routes Preserved
**GIVEN** convex/http.ts contains routes for other features (osm, routing, etc.)
**WHEN** curation routes are added
**THEN** all existing routes continue to function
**AND** no existing routes are removed or modified

**Verify:** Compare http.ts before and after changes, verify existing routes unchanged.

### AC-003: No Business Logic in Handlers
**GIVEN** any curation route handler
**WHEN** the handler code is inspected
**THEN** it contains only: auth check, request parsing, delegation to query/mutation/action, response formatting
**AND** no business logic (data transformation, validation, computation) exists in the handler

**Verify:** Review each handler function, verify it delegates to an underlying function.

### AC-004: Consistent Error Handling
**GIVEN** any route handler encounters an error
**WHEN** the error is caught
**THEN** the response uses consistent error format: `{ error: string }`
**AND** appropriate HTTP status codes are used (401 for auth, 400 for validation, 500 for server errors)

**Verify:** Review error handling in each handler for consistent format.

---

## TEST CRITERIA

- [ ] All 8 curation routes are registered in convex/http.ts
- [ ] Existing non-curation routes are preserved
- [ ] Each handler delegates to a query/mutation/action (no inline business logic)
- [ ] Admin routes use bearer token auth (CURATION_INGEST_KEY)
- [ ] Public routes use Clerk auth
- [ ] Error responses use consistent `{ error: string }` format
- [ ] HTTP status codes are appropriate (401, 400, 500)
- [ ] Convex typecheck passes: `npx convex typecheck`

---

## READING LIST

- `.spec/prds/curation/convex-api-design.md` — Section 5 (HTTP Routes), Section 11 (Endpoint Summary)
- `.spec/prds/curation/09-technical-requirements.md` — API Design (Internal + Public)
- Prior task files: CONVEX-003, CONVEX-004, CONVEX-005, CONVEX-006, CONVEX-007

---

## GUARDRAILS

**WRITE-ALLOWED FILES:**
- `convex/http.ts` (MODIFY — route registrations only)

**NEVER MODIFY:**
- `convex/db/curation.ts` — queries/mutations owned by CONVEX-003/004/005
- `convex/db/intentExtraction.ts` — owned by CONVEX-006
- `convex/lib/intentSchema.ts` — owned by CONVEX-006
- `convex/actions/` — owned by CONVEX-006
- Any file other than `convex/http.ts`

---

## CODE PATTERN

**Route Registration Structure:**
```typescript
// convex/http.ts — curation route section

// Admin routes (bearer token auth)
http.route({
  path: "/api/curation/ingest",
  method: "POST",
  handler: ingestRoutesHandler,
});

http.route({
  path: "/api/curation/metrics",
  method: "POST",
  handler: adminMetricsHandler,
});

http.route({
  path: "/api/dashboard/metrics",
  method: "GET",
  handler: dashboardMetricsHandler,
});

// Public routes (Clerk auth)
http.route({
  path: "/api/routes/lean",
  method: "GET",
  handler: leanSyncHandler,
});

http.route({
  path: "/api/routes/enrichment",
  method: "GET",
  handler: enrichmentFetchHandler,
});

http.route({
  path: "/api/routes/missing-enrichments",
  method: "POST",
  handler: missingEnrichmentsHandler,
});

http.route({
  path: "/api/feedback",
  method: "POST",
  handler: feedbackHandler,
});

http.route({
  path: "/api/intent/extract-params",
  method: "POST",
  handler: intentExtractionHandler,
});
```

**Handler Pattern (no business logic):**
```typescript
// Each handler follows this pattern:
const leanSyncHandler = async (ctx: RouteContext, request: Request) => {
  // 1. Auth check
  const identity = await ctx.ctx.auth.getUserIdentity();
  if (!identity) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });

  // 2. Parse request
  const url = new URL(request.url);
  const state = url.searchParams.get("state") ?? undefined;
  const since = url.searchParams.get("since")
    ? Number(url.searchParams.get("since"))
    : undefined;

  // 3. Delegate to query/mutation/action
  const result = await ctx.ctx.runQuery(internal.db.curation.leanSync, {
    state,
    since,
    paginationOpts: { numItems: 100, cursor: null },
  });

  // 4. Format response
  return Response.json(result);
};
```

---

## AGENT INSTRUCTIONS

1. Read the current `convex/http.ts` to understand existing route structure
2. Read CONVEX-003, CONVEX-004, CONVEX-005, CONVEX-006, CONVEX-007 task files to understand what routes each already registered
3. Ensure all 8 curation routes are present in `convex/http.ts`
4. Verify each handler delegates to the correct underlying function
5. Verify no business logic in handlers — only auth, parse, delegate, respond
6. Verify existing non-curation routes are untouched
7. Verify consistent error format across all handlers
8. Run `npx convex typecheck` to verify

---

## ORCHESTRATOR VERIFICATION PROTOCOL

1. **Pre-dispatch:** Verify CONVEX-003, CONVEX-004, CONVEX-005, CONVEX-006, CONVEX-007 are complete
2. **Post-completion verification:**
   ```bash
   npx convex typecheck

   # Verify all 8 routes registered
   grep -c "http.route" convex/http.ts  # should include all curation + existing routes

   # Verify each curation route path
   grep -E "/api/(curation|routes|feedback|intent|dashboard)" convex/http.ts

   # Verify no business logic in handlers (should only see auth, parse, delegate, respond)
   ```
3. **Evidence gate:** typecheck passes, all 8 routes present, existing routes preserved

---

## AGENT ASSIGNMENT

**Primary:** convex-implementer
**Rationale:** Simple Convex HTTP route registration. No complex logic, just wiring.

---

## EVIDENCE GATES

- [ ] All 8 curation routes registered in convex/http.ts
- [ ] Existing non-curation routes preserved
- [ ] Each handler delegates (no inline business logic)
- [ ] Admin routes use bearer token auth
- [ ] Public routes use Clerk auth
- [ ] Consistent error format: `{ error: string }`
- [ ] `npx convex typecheck` passes

---

## REVIEW CRITERIA

- Route registrations are grouped by category (admin, public) with clear comments
- Each handler follows the same pattern: auth -> parse -> delegate -> respond
- No handler contains business logic beyond request/response formatting
- Error responses are consistent across all handlers
- Existing routes for other features (osm, routing) are completely unchanged
- HTTP methods match the API design (GET for reads, POST for writes)

---

## NOTES

- **This task is a final wiring pass.** Prior tasks (CONVEX-003 through CONVEX-007) may have already registered their routes incrementally. This task ensures completeness and consistency.
- **Route registration order** should group admin routes together and public routes together for readability.
- **The http.route() pattern** in Convex requires explicit method specification. Verify GET vs POST for each endpoint.
- **This is the last task in Epic 2's dependency chain.** Once complete, all curation API endpoints are wired and ready for the mobile client (Epic 3, Epic 4).
