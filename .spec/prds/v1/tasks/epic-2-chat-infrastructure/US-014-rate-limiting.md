# Implement plan_usage rate limiting and conversational error recovery

> Status: COMPLETE (2026-04-04)

> Task ID: US-014
> Type: FEATURE
> Priority: P1
> Estimate: 60 minutes
> Assignee: backend-engineer

## CRITICAL CONSTRAINTS

### MUST
- Create `plan_usage` table with clerkUserId, month ("2026-04"), planCount
- Create check and increment endpoints
- Free tier: 5 plans/month
- Wire into `planRide` action
- Handle all error types conversationally: low confidence, generation failure, weather unavailable, network timeout, plan limit exceeded
- No modal dialogs — all errors as chat messages

### NEVER
- Block the user without a helpful message explaining what happened
- Hard-code plan limits without making them configurable per tier
- Allow race conditions on increment (use atomic operations)

### STRICTLY
- 1 plan = 1 `route_plans` execution. Refinements that trigger new route generation each count as one plan.

## SPECIFICATION

**Objective:** Implement usage-based rate limiting for route plan generation and ensure all error conditions are communicated as conversational chat messages rather than modal dialogs.

**Success looks like:** Users are limited to 5 plans/month on the free tier. When the limit is reached, they receive a friendly upsell message in chat. All error types produce helpful, conversational messages.

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | User has 0 plans this month | check called | Returns { count: 0, limit: 5, allowed: true } | Unit test |
| 2 | User has 5 plans this month | check called | Returns { count: 5, limit: 5, allowed: false } | Unit test |
| 3 | User creates a plan | increment called | Creates or updates monthly record | Unit test |
| 4 | Rate limit exceeded | Plan attempted | Friendly upsell message in chat | Integration test |
| 5 | Low confidence parse | NLP returns low confidence | Helpful clarification message | Integration test |
| 6 | Network timeout | External API fails | Retry suggestion message | Integration test |

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | check returns correct count and allowed status | AC-1, AC-2 | Unit test passes | [ ] TRUE [ ] FALSE |
| 2 | increment creates or updates monthly record | AC-3 | Unit test passes | [ ] TRUE [ ] FALSE |
| 3 | Rate limit exceeded produces conversational upsell | AC-4 | Integration test passes | [ ] TRUE [ ] FALSE |
| 4 | All error types produce helpful chat messages | AC-5, AC-6 | Integration test passes | [ ] TRUE [ ] FALSE |
| 5 | TypeScript compilation succeeds | All | `pnpm typecheck` exits 0 | [ ] TRUE [ ] FALSE |

## GUARDRAILS

### WRITE-ALLOWED
- `models/plan-usage.ts` (NEW)
- `convex/db/planUsage.ts` (NEW)
- `convex/db/__tests__/planUsage.test.ts` (NEW)
- `convex/schema.ts` (MODIFY — add plan_usage table)

### WRITE-PROHIBITED
- `convex/actions/agent/lib/planRideOrchestrator.ts` (rate limit check is in the action layer, not orchestrator)

## DESIGN

### References
- PRD UC-AG-11 — Rate Limiting
- PRD 07-technical-backend.md §2.8 — plan_usage table schema

### Code Pattern
```typescript
// models/plan-usage.ts
export const planUsageValidator = v.object({
  clerkUserId: v.string(),
  month: v.string(),  // "2026-04"
  planCount: v.number(),
});

// convex/db/planUsage.ts
export async function checkUsage(ctx, clerkUserId: string) {
  const month = new Date().toISOString().slice(0, 7);
  const record = await ctx.db.query('plan_usage')
    .withIndex('by_clerkUserId_and_month', q => q.eq('clerkUserId', clerkUserId).eq('month', month))
    .unique();
  const count = record?.planCount ?? 0;
  return { count, limit: 5, allowed: count < 5 };
}
```

### Anti-pattern (DO NOT)
- Do not check rate limits inside the orchestrator — check at the action entry point
- Do not show raw error codes to users — always wrap in conversational messages
- Do not use modal dialogs for any error condition

## CODING STANDARDS
- **brain/docs/coding-standards**: TypeScript strict, composition patterns

## DEPENDENCIES
No task dependencies.

## NOTES
- Month format is "YYYY-MM" (e.g., "2026-04") for easy querying
- Future tiers (premium, pro) will increase the limit — keep the limit configurable
- Conversational error messages should be empathetic and suggest next steps
