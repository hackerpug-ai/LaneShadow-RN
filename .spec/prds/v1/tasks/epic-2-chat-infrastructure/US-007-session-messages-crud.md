# Create session messages CRUD operations

> Status: COMPLETE (2026-04-04)

> Task ID: US-007
> Type: FEATURE
> Priority: P0
> Estimate: 60 minutes
> Assignee: convex-implementer

## CRITICAL CONSTRAINTS

### MUST
- Create `convex/db/sessionMessages.ts` with: list (query), send (mutation), addSystemMessage (internalMutation)
- `send` adds a rider message AND bumps the parent session's `updatedAt`
- `addSystemMessage` adds agent responses with optional route attachments
- Messages are append-only

### NEVER
- Allow riders to create system messages via the public `send` mutation
- Allow message editing or deletion — append-only log
- Expose `addSystemMessage` as a public mutation

### STRICTLY
- `send` must validate that the session belongs to the authenticated user before inserting

## SPECIFICATION

**Objective:** Implement message CRUD operations for session messages, supporting both rider-initiated messages and system-generated responses with route attachments.

**Success looks like:** Riders can send messages, system can add responses with route attachments, and all messages are listed in chronological order per session.

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | Active session | send is called with rider content | Message added with role 'rider', session updatedAt bumped | Unit test |
| 2 | Session with messages | list is called with sessionId | Returns messages in chronological order | Unit test |
| 3 | Route plan completed | addSystemMessage is called | System message with route attachment stored | Unit test |
| 4 | Rider tries to send to another user's session | send is called | Throws authorization error | Unit test |

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | send creates rider message and bumps session updatedAt | AC-1 | Unit test passes | [ ] TRUE [ ] FALSE |
| 2 | list returns messages ordered by createdAt ascending | AC-2 | Unit test passes | [ ] TRUE [ ] FALSE |
| 3 | addSystemMessage stores attachments correctly | AC-3 | Unit test passes | [ ] TRUE [ ] FALSE |
| 4 | send rejects cross-user session access | AC-4 | Unit test passes | [ ] TRUE [ ] FALSE |
| 5 | TypeScript compilation succeeds | All | `pnpm typecheck` exits 0 | [ ] TRUE [ ] FALSE |

## GUARDRAILS

### WRITE-ALLOWED
- `convex/db/sessionMessages.ts` (NEW)
- `convex/db/__tests__/sessionMessages.test.ts` (NEW)

### WRITE-PROHIBITED
- `convex/db/planningSessions.ts` (read-only reference for session validation)
- `convex/db/routePlans.ts`

## DESIGN

### References
- PRD UC-AG-01, UC-AG-02, UC-AG-07
- `convex/db/planningSessions.ts` — session ownership pattern

### Code Pattern
```typescript
// addSystemMessage is internal — only callable by other Convex functions
export const addSystemMessageHandler = async (ctx, args) => {
  const now = Date.now();
  await ctx.db.insert('session_messages', {
    sessionId: args.sessionId,
    role: 'system',
    content: args.content,
    attachments: args.attachments,
    createdAt: now,
  });
  await ctx.db.patch(args.sessionId, { updatedAt: now });
};
```

### Anti-pattern (DO NOT)
- Do not allow public creation of system messages
- Do not implement message pagination yet — list returns all messages for a session

## CODING STANDARDS
- **brain/docs/coding-standards**: TypeScript strict, composition patterns

## DEPENDENCIES
- US-005: session_messages table must exist
- US-006: planningSessions CRUD for session validation

## NOTES
- Attachments follow the schema: `{ type: 'route_options', routePlanId: Id<'route_plans'> }`
- Future epics may add more attachment types (weather, saved routes)
