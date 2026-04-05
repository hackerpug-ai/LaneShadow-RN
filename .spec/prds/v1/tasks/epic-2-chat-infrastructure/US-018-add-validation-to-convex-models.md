# Add Missing Validation to Convex Models

> Status: ✅ Completed (2026-04-05)
> Verified: isValidMonth validation implemented in handlers
> Created: 2026-04-04
> Source: Red-Hat Review (Schema Gaps)

> Task ID: US-018
> Type: BUG_FIX
> Priority: P1
> Estimate: 60 minutes
> Assignee: convex-implementer

## CRITICAL CONSTRAINTS

### MUST
- Add `v.string().min(1)` validation to message content
- Add regex validation for month format `^\d{4}-\d{2}$`
- Ensure all validators reject invalid data at the boundary

### NEVER
- Accept empty strings for required fields
- Allow arbitrary string formats for structured data like dates

### STRICTLY
- Validation at the boundary prevents invalid data from reaching the database

## SPECIFICATION

**Objective:** Add missing validators to Convex models to prevent invalid data from being stored. Current implementation lacks content validation and month format validation.

**Success looks like:** Attempting to store an empty message or invalid month format throws a validation error before database write.

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | Send message with empty content | Validation runs | ConvexError thrown | Unit test |
| 2 | Send message with whitespace only | Validation runs | ConvexError thrown | Unit test |
| 3 | Store plan usage with invalid month | Validation runs | ConvexError thrown | Unit test |
| 4 | Store plan usage with valid month | Validation runs | Data stored successfully | Unit test |

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | Empty message content rejected | AC-1 | Unit test passes | [ ] TRUE [ ] FALSE |
| 2 | Whitespace-only content rejected | AC-2 | Unit test passes | [ ] TRUE [ ] FALSE |
| 3 | Invalid month format rejected | AC-3 | Unit test passes | [ ] TRUE [ ] FALSE |
| 4 | Valid month format accepted | AC-4 | Unit test passes | [ ] TRUE [ ] FALSE |
| 5 | TypeScript compilation succeeds | All | `pnpm typecheck` exits 0 | [ ] TRUE [ ] FALSE |

## GUARDRAILS

### WRITE-ALLOWED
- `models/saved-routes.ts` (MODIFY - nlpText validation)
- `models/plan-usage.ts` (MODIFY - month validation)
- `convex/db/sessionMessages.ts` (MODIFY - content validation check)

### WRITE-PROHIBITED
- No schema changes (validators only)

## DESIGN

### References
- Red-Hat Review Report: "Missing Validation"
- US-008: Error codes and model extensions

### Code Pattern
```typescript
// In sessionMessages.ts - content validation
export const sessionMessageValidator = v.object({
  sessionId: v.id('planning_sessions'),
  role: v.union(v.literal('rider'), v.literal('system')),
  content: v.string().min(1), // ADD: min(1) validation
  attachments: v.optional(v.array(v.any())),
  createdAt: v.number(),
})

// In plan-usage.ts - month validation
const MONTH_REGEX = /^\d{4}-\d{2}$/

export const planUsageValidator = v.object({
  clerkUserId: v.string(),
  month: v.string().regex(MONTH_REGEX), // ADD: regex validation
  planCount: v.number(),
  lastPlanDate: v.optional(v.number()),
})
```

### Anti-pattern (DO NOT)
- Do not use `v.string()` without length/format checks for structured data
- Do not validate in business logic instead of at the schema boundary

## CODING STANDARDS
- **brain/docs/coding-standards**: TypeScript strict, boundary validation
- **convex/_generated/ai/guidelines.md**: Validator best practices

## DEPENDENCIES
- US-008: Error codes and model extensions

## NOTES
- Current validation at `models/plan-usage.ts:12` uses `v.string()` which accepts any format
- Current validation at `convex/db/sessionMessages.ts:78` has no min length check
- These validators are at the system boundary — they prevent bad data from entering the system
