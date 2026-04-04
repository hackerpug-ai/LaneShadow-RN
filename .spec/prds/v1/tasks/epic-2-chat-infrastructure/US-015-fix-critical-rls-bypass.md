# Fix Critical RLS Bypass in Session Messages

> Status: PENDING
> Created: 2026-04-04
> Source: Red-Hat Review (CRITICAL SECURITY BUG)

> Task ID: US-015
> Type: BUG_FIX
> Priority: P0
> Estimate: 60 minutes
> Assignee: convex-implementer

## CRITICAL CONSTRAINTS

### MUST
- Add session ownership validation in `listHandler` before querying messages
- Ensure `clerkUserId` is validated against session owner
- Return SESSION_NOT_FOUND error for cross-user access attempts
- Add validation to all session message operations (send, list, addSystemMessage)

### NEVER
- Allow any authenticated user to read another user's session messages
- Skip ownership validation for performance reasons

### STRICTLY
- Row-Level Security (RLS) must be enforced at the handler level, not just in wrapper queries

## SPECIFICATION

**Objective:** Fix CRITICAL security vulnerability where `listHandler` accepts a `sessionId` but NEVER validates that the session belongs to the authenticated user, allowing user A to retrieve all messages from user B's session.

**Success looks like:** Attempting to list messages from another user's session returns a SESSION_NOT_FOUND error. All session message operations validate ownership.

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | User A authenticated | listHandler called with User B's sessionId | SESSION_NOT_FOUND error thrown | Integration test |
| 2 | User A authenticated | send called with User B's sessionId | SESSION_NOT_FOUND error thrown | Integration test |
| 3 | User A authenticated | Own session messages queried | Messages returned successfully | Integration test |
| 4 | Wrapper query called | clerkUserId passed | Parameter used in ownership check | Unit test |

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | Cross-user session access rejected | AC-1 | Integration test passes | [ ] TRUE [ ] FALSE |
| 2 | Cross-user send rejected | AC-2 | Integration test passes | [ ] TRUE [ ] FALSE |
| 3 | Valid session access succeeds | AC-3 | Integration test passes | [ ] TRUE [ ] FALSE |
| 4 | TypeScript compilation succeeds | All | `pnpm typecheck` exits 0 | [ ] TRUE [ ] FALSE |

## GUARDRAILS

### WRITE-ALLOWED
- `convex/db/sessionMessages.ts` (MODIFY)

### WRITE-PROHIBITED
- No changes to schema or API contracts

## DESIGN

### References
- Red-Hat Review Report: "CRITICAL: Row-Level Security Bypass"
- US-007: Session Messages CRUD (original implementation)

### Code Pattern
```typescript
export const listHandler = async (
  ctx: ListMessagesCtx,
  args: { sessionId: Id<'planning_sessions'> },
  clerkUserId: string // MUST be passed from wrapper
): Promise<SessionMessageDoc[]> => {
  // CRITICAL: Validate session ownership first
  const session = await ctx.db.get(args.sessionId)
  if (!session || session.clerkUserId !== clerkUserId) {
    throw new ConvexError(ERROR_CODES.SESSION_NOT_FOUND)
  }

  // Now safe to query messages
  const messages = await ctx.db
    .query('session_messages')
    .withIndex('by_sessionId', (q) => q.eq('sessionId', args.sessionId))
    .collect()

  return messages.sort((a, b) => a.createdAt - b.createdAt)
}
```

### Anti-pattern (DO NOT)
- Do not trust sessionId from client without validation
- Do not skip ownership check for performance

## CODING STANDARDS
- **brain/docs/coding-standards**: TypeScript strict, security-first
- **convex/_generated/ai/guidelines.md**: RLS best practices

## DEPENDENCIES
- US-007: Session Messages CRUD

## NOTES
- This is a CRITICAL security bug — must be fixed before any production deployment
- The wrapper query (line 139-149) calls `requireIdentity()` but passes clerkUserId to listHandler which IGNORES IT
- Attack vector: Authenticated user A can call `list({ sessionId: user_B_session_id })` and retrieve all messages
