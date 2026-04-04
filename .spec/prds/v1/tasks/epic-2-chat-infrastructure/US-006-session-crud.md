# Create planning session CRUD operations

> Status: COMPLETE (2026-04-04)

> Task ID: US-006
> Type: FEATURE
> Priority: P0
> Estimate: 75 minutes
> Assignee: convex-implementer

## CRITICAL CONSTRAINTS

### MUST
- Create `convex/db/planningSessions.ts` with: create (mutation), list (query), get (query), archive (mutation)
- Auto-generate title from first message (first 50 chars)
- All endpoints require auth via `requireIdentity`
- Follow the handler + wrapper pattern from `convex/db/routePlans.ts`

### NEVER
- Allow cross-user session access — every query/mutation must filter by authenticated user's clerkUserId
- Hard-delete sessions — use archive (status change) only

### STRICTLY
- All mutations must update the `updatedAt` timestamp

## SPECIFICATION

**Objective:** Implement CRUD operations for planning sessions so the frontend can create, list, retrieve, and archive conversational planning sessions.

**Success looks like:** All four operations work correctly with auth enforcement. Sessions are user-scoped and append-only (no hard delete).

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | Authenticated user | create is called | Returns sessionId with status 'active' | Unit test |
| 2 | User has sessions | list is called | Returns sessions ordered by updatedAt desc | Unit test |
| 3 | User requests another user's session | get is called | Throws SESSION_NOT_FOUND | Unit test |
| 4 | Active session exists | archive is called | Status changes to 'archived' | Unit test |

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | create returns a valid sessionId with active status | AC-1 | Unit test passes | [ ] TRUE [ ] FALSE |
| 2 | list returns sessions in updatedAt descending order | AC-2 | Unit test passes | [ ] TRUE [ ] FALSE |
| 3 | get throws for wrong user's session | AC-3 | Unit test passes | [ ] TRUE [ ] FALSE |
| 4 | archive changes status to archived | AC-4 | Unit test passes | [ ] TRUE [ ] FALSE |
| 5 | TypeScript compilation succeeds | All | `pnpm typecheck` exits 0 | [ ] TRUE [ ] FALSE |

## GUARDRAILS

### WRITE-ALLOWED
- `convex/db/planningSessions.ts` (NEW)
- `convex/db/__tests__/planningSessions.test.ts` (NEW)

### WRITE-PROHIBITED
- `convex/db/routePlans.ts`
- `convex/db/users.ts`

## DESIGN

### References
- `convex/db/routePlans.ts` — handler + wrapper pattern to follow
- PRD UC-AG-01, UC-AG-09

### Code Pattern
```typescript
// Follow handler + wrapper pattern
export const createSessionHandler = async (ctx, args) => {
  const identity = await requireIdentity(ctx);
  const now = Date.now();
  return ctx.db.insert('planning_sessions', {
    clerkUserId: identity.clerkUserId,
    title: args.title.slice(0, 50),
    status: 'active',
    createdAt: now,
    updatedAt: now,
  });
};
```

### Anti-pattern (DO NOT)
- Do not expose internal mutations for session creation — use the authenticated wrapper
- Do not implement soft-delete as a separate status — archive IS the soft delete

## CODING STANDARDS
- **brain/docs/coding-standards**: TypeScript strict, composition patterns

## DEPENDENCIES
- US-005: planning_sessions table must exist

## NOTES
- Title auto-generation from first message happens at create time — caller passes the first message content
