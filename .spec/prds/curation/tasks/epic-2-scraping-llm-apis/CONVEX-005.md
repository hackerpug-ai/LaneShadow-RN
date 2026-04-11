# CONVEX-005: User Feedback Mutation Endpoint

**Task ID:** CONVEX-005
**Epic:** Epic 2 - Web Scraping, LLM Extraction & Public APIs
**Assigned To:** convex-implementer
**Priority:** P1
**Effort:** S
**Estimate:** 90 min
**Type:** [FEATURE]
**Status:** Backlog

---

## DEPENDENCIES

- **Depends on:** CONVEX-002 (Curation tables + indexes, including route_feedback table)
- **PRD References:** S9-API Design — POST /api/feedback

---

## BACKGROUND

The feedback endpoint allows authenticated users to record route interactions (save, hide, complete, rate). This is the data flywheel input — user feedback drives continuous improvement of route quality scoring and discovery ranking. The endpoint must enforce server-side authority for userId (from Clerk auth, never from request body) and timestamp (server-generated, never client-supplied).

**PRD References:**
- S9-API Design — POST /api/feedback
- S3-FLY (UC-FLY-01, UC-FLY-02)
- S9-TRD Section: Data Flywheel

**Key Constraints:**
- userId comes from Clerk auth identity, NEVER from the request body
- timestamp is server-generated (Date.now()), NEVER from the request body
- rating is required when action is "rate", must be 1-5
- rating is forbidden for all other actions

---

## ACCEPTANCE CRITERIA

### AC-001: Valid Feedback Recorded
**GIVEN** an authenticated user submits feedback with routeId and action
**WHEN** action is one of "save", "hide", "complete", or "rate"
**THEN** a new record is inserted into route_feedback table
**AND** the response returns `{ success: true, feedbackId }` with the new document ID
**AND** userId is populated from Clerk auth (not request body)
**AND** timestamp is server-generated

**Verify:** Submit feedback for a known route with valid action, verify record in database with correct userId and timestamp.

### AC-002: Rating Required for Rate Action
**GIVEN** an authenticated user submits feedback with action "rate"
**WHEN** the request includes a rating value 1-5
**THEN** the feedback is recorded with the rating value
**AND** if rating is missing or outside 1-5, the request is rejected with validation error

**Verify:** Submit rate action with rating=5, verify success. Submit rate action without rating, verify error.

### AC-003: Rating Forbidden for Non-Rate Actions
**GIVEN** an authenticated user submits feedback with action "save", "hide", or "complete"
**WHEN** the request includes a rating value
**THEN** the request is rejected with validation error
**AND** no feedback record is created

**Verify:** Submit save action with rating=3, verify error response.

### AC-004: Server-Side Authority for userId and Timestamp
**GIVEN** any feedback submission
**WHEN** the handler processes the request
**THEN** userId is extracted from Clerk auth identity (never from request body)
**AND** timestamp is set to Date.now() on the server (never from request body)
**AND** the client cannot override either value

**Verify:** Submit feedback with a different userId in the body, verify the server uses the auth identity instead.

### AC-005: Authentication Required
**GIVEN** an unauthenticated feedback submission
**WHEN** the request lacks valid Clerk auth
**THEN** the response is 401 Unauthorized
**AND** no feedback record is created

**Verify:** Submit feedback without auth, verify 401 response.

---

## TEST CRITERIA

- [ ] POST /api/feedback records valid feedback for all 4 action types
- [ ] userId comes from Clerk auth, not request body
- [ ] timestamp is server-generated (Date.now())
- [ ] Rating required for "rate" action, rejected if missing or out of range
- [ ] Rating forbidden for "save", "hide", "complete" actions
- [ ] Returns 401 for unauthenticated requests
- [ ] Optional fields (locationLat, locationLng, archetypeFilter) are recorded when provided
- [ ] Convex typecheck passes: `npx convex typecheck`

---

## READING LIST

- `.spec/prds/curation/convex-api-design.md` — Section 9 (Feedback Mutation)
- `.spec/prds/curation/09-technical-requirements.md` — API Design (POST /api/feedback), route_feedback schema
- `convex/_generated/ai/guidelines.md` — Convex mutation patterns

---

## GUARDRAILS

**WRITE-ALLOWED FILES:**
- `convex/http.ts` (MODIFY — add POST /api/feedback route registration)
- `convex/db/curation.ts` (MODIFY — add recordRouteFeedback mutation)

**NEVER MODIFY:**
- `convex/schema.ts` — schema is owned by CONVEX-002
- `models/` — validators are owned by CONVEX-001
- Existing endpoints (CONVEX-003, CONVEX-004 artifacts)

---

## CODE PATTERN

**Feedback Mutation:**
```typescript
// convex/db/curation.ts
export const recordRouteFeedback = mutation({
  args: {
    routeId: v.string(),
    action: routeFeedbackActionValidator,
    rating: v.optional(v.number()),
    locationLat: v.optional(v.number()),
    locationLng: v.optional(v.number()),
    archetypeFilter: v.optional(v.string()),
  },
  returns: v.object({ feedbackId: v.id("route_feedback") }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("UNAUTHORIZED");

    const clerkUserId = identity.subject;

    // Validate rating rules
    if (args.action === "rate") {
      if (!args.rating || args.rating < 1 || args.rating > 5) {
        throw new ConvexError("INVALID_RATING");
      }
    } else {
      if (args.rating !== undefined) {
        throw new ConvexError("RATING_ONLY_ALLOWED_ON_RATE");
      }
    }

    const feedbackId = await ctx.db.insert("route_feedback", {
      routeId: args.routeId,
      userId: clerkUserId,      // from auth, NEVER from args
      action: args.action,
      rating: args.rating ?? undefined,
      locationLat: args.locationLat ?? undefined,
      locationLng: args.locationLng ?? undefined,
      archetypeFilter: args.archetypeFilter ?? undefined,
      timestamp: Date.now(),    // server-generated, NEVER from args
    });

    return { feedbackId };
  },
});
```

**HTTP Route Handler:**
```typescript
// In convex/http.ts
const feedbackHandler = async (ctx: RouteContext, request: Request) => {
  const identity = await ctx.ctx.auth.getUserIdentity();
  if (!identity) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = await request.json() as {
    routeId: string;
    action: string;
    rating?: number;
    locationLat?: number;
    locationLng?: number;
    archetypeFilter?: string;
  };

  try {
    const result = await ctx.ctx.runMutation(
      internal.db.curation.recordRouteFeedback,
      {
        routeId: body.routeId,
        action: body.action,
        rating: body.rating,
        locationLat: body.locationLat,
        locationLng: body.locationLng,
        archetypeFilter: body.archetypeFilter,
      }
    );
    return Response.json(result);
  } catch (e) {
    return Response.json(
      { error: (e as Error).message },
      { status: 400 }
    );
  }
};
```

---

## AGENT INSTRUCTIONS

1. Read `convex/_generated/ai/guidelines.md` for Convex mutation patterns
2. Read `convex/http.ts` to understand existing route registration
3. Read `convex/db/curation.ts` for existing curation mutations
4. Read `models/route-feedback.ts` for the routeFeedbackActionValidator
5. Add `recordRouteFeedback` mutation to `convex/db/curation.ts`
6. Register POST /api/feedback route in `convex/http.ts`
7. Enforce: userId from auth only, timestamp from server only, rating rules
8. Run `npx convex typecheck` to verify

---

## ORCHESTRATOR VERIFICATION PROTOCOL

1. **Pre-dispatch:** Verify CONVEX-002 is complete
2. **Post-completion verification:**
   ```bash
   npx convex typecheck
   grep -n "feedback" convex/http.ts
   grep -n "recordRouteFeedback" convex/db/curation.ts
   ```
3. **Evidence gate:** typecheck passes, feedback route registered, mutation exists

---

## AGENT ASSIGNMENT

**Primary:** convex-implementer
**Rationale:** Standard Convex mutation + HTTP route. Small task, straightforward patterns.

---

## EVIDENCE GATES

- [ ] POST /api/feedback route registered in convex/http.ts
- [ ] recordRouteFeedback mutation in convex/db/curation.ts
- [ ] userId extracted from Clerk auth (not args)
- [ ] timestamp is Date.now() (not from args)
- [ ] Rating validation enforced (required for rate, forbidden for others)
- [ ] Returns 401 without auth
- [ ] `npx convex typecheck` passes

---

## REVIEW CRITERIA

- userId is NEVER read from request body (server authority)
- timestamp is NEVER read from request body (server authority)
- Error codes are stable and match ConvexError pattern (UNAUTHORIZED, INVALID_RATING, RATING_ONLY_ALLOWED_ON_RATE)
- Mutation has explicit returns validator
- HTTP handler delegates to mutation (no business logic in handler)

---

## NOTES

- **This is the data flywheel input.** Every user interaction (save, hide, complete, rate) feeds back into route quality scoring over time.
- **Server-side authority for userId and timestamp is non-negotiable.** A malicious client could otherwise impersonate users or backdate interactions.
- **The feedback table uses indexes** by_route, by_user, and by_user_and_route (created in CONVEX-002) for efficient aggregation queries in the data flywheel.
- **Optional location fields** (locationLat, locationLng) capture where the user was when they interacted — useful for location-aware personalization.
- **archetypeFilter** captures which filter was active — useful for understanding search context during feedback.
