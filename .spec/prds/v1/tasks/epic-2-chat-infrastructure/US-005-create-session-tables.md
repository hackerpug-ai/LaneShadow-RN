# Create planning_sessions and session_messages Convex tables

> Status: COMPLETE (2026-04-04)

> Task ID: US-005
> Type: INFRA
> Priority: P0
> Estimate: 60 minutes
> Assignee: convex-implementer

## CRITICAL CONSTRAINTS

### MUST
- Add `planning_sessions` table with fields: clerkUserId, title, status (active/completed/archived), createdAt, updatedAt
- Add `session_messages` table with fields: sessionId, role (rider/system), content, attachments (optional array), createdAt
- Add indexes: `by_clerkUserId`, `by_clerkUserId_and_updatedAt` on planning_sessions; `by_sessionId` on session_messages
- Define validators in `models/planning-sessions.ts` and `models/session-messages.ts` following the validator-first pattern from `models/route-plans.ts`

### NEVER
- Store messages as an array on sessions (document size limits)
- Use 'user'/'assistant' for role values — must be 'rider'/'system'
- Modify existing tables or validators in `models/route-plans.ts` or `models/saved-routes.ts`

### STRICTLY
- Follow the exact schema from PRD 07-technical-backend.md Section 2.7

## SPECIFICATION

**Objective:** Create the two foundational Convex tables for the agentic conversational planning experience.

**Success looks like:** `npx convex dev --once` succeeds with the new tables and indexes created. Validator types are exported and usable by CRUD operations.

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | New validators defined | `npx convex dev --once` is run | Schema deploys successfully | `npx convex dev --once` exits 0 |
| 2 | planning_sessions table created | Schema is inspected | Has all required fields and indexes | Code review |
| 3 | session_messages table created | Schema is inspected | Has all required fields and indexes | Code review |
| 4 | Validators defined | TypeScript is checked | Validators export correctly typed | `pnpm typecheck` exits 0 |

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | Convex schema deploys without errors | AC-1 | `npx convex dev --once` exits 0 | [ ] TRUE [ ] FALSE |
| 2 | TypeScript compilation succeeds | AC-4 | `pnpm typecheck` exits 0 | [ ] TRUE [ ] FALSE |
| 3 | planning_sessions has by_clerkUserId and by_clerkUserId_and_updatedAt indexes | AC-2 | Code review of convex/schema.ts | [ ] TRUE [ ] FALSE |
| 4 | session_messages has by_sessionId index | AC-3 | Code review of convex/schema.ts | [ ] TRUE [ ] FALSE |

## GUARDRAILS

### WRITE-ALLOWED
- `models/planning-sessions.ts` (NEW)
- `models/session-messages.ts` (NEW)
- `convex/schema.ts` (MODIFY — add new table definitions)

### WRITE-PROHIBITED
- `models/route-plans.ts`
- `models/saved-routes.ts`

## DESIGN

### References
- PRD 07-technical-backend.md Section 2.7 — exact schema definition
- `models/route-plans.ts` — validator-first pattern to follow

### Code Pattern
```typescript
// models/planning-sessions.ts
export const planningSessionStatusValidator = v.union(
  v.literal('active'),
  v.literal('completed'),
  v.literal('archived'),
);

export const planningSessionValidator = v.object({
  clerkUserId: v.string(),
  title: v.string(),
  status: planningSessionStatusValidator,
  createdAt: v.number(),
  updatedAt: v.number(),
});
```

### Anti-pattern (DO NOT)
- Do not embed messages inside the session document
- Do not use 'user'/'assistant' terminology — this app uses 'rider'/'system'

## CODING STANDARDS
- **brain/docs/coding-standards**: TypeScript strict, composition patterns

## DEPENDENCIES
No task dependencies.

## NOTES
- Separate tables allow pagination, indexing by session, and avoid document size limits for long conversations
- Attachments on session_messages use `v.id('route_plans')` to reference route plan results
