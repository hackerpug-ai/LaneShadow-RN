# Extract Tool Results and Populate Route Attachments

> Status: PENDING
> Created: 2026-04-04
> Source: Red-Hat Review (Backend Integration Gap)

> Task ID: US-017
> Type: BUG_FIX
> Priority: P0
> Estimate: 90 minutes
> Assignee: convex-implementer

## CRITICAL CONSTRAINTS

### MUST
- Extract route plan IDs from tool results in `ridePlanningAgent.ts`
- Populate the `attachments` array before returning from `sendMessage`
- Ensure AC-5 requirement is met: "Response persisted as system message with route attachment in DB"

### NEVER
- Return empty `attachments` array when tool results contain route data
- Leave attachments stubbed with comment "agent will be configured"

### STRICTLY
- Tool execution returns JSON with route data — must be parsed and added to attachments

## SPECIFICATION

**Objective:** Fix the bug where tool execution returns route data but the `attachments` array remains empty. The agent extracts tool results but never populates the attachments array, so route plan IDs are never attached to system messages.

**Success looks like:** When a route is generated, the system message persisted to the database includes route attachments with valid `routePlanId` values.

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | planRoute tool executed | Tool returns route data | Attachment populated with routePlanId | Integration test |
| 2 | refineRoute tool executed | Tool returns route data | Attachment populated with routePlanId | Integration test |
| 3 | No route generated | Tool returns chat response | Attachments array empty | Integration test |
| 4 | System message persisted | Message has attachments | Route IDs queryable in DB | Integration test |

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | planRoute results populate attachments | AC-1 | Integration test passes | [ ] TRUE [ ] FALSE |
| 2 | refineRoute results populate attachments | AC-2 | Integration test passes | [ ] TRUE [ ] FALSE |
| 3 | Chat responses have empty attachments | AC-3 | Integration test passes | [ ] TRUE [ ] FALSE |
| 4 | System messages queryable by routePlanId | AC-4 | Integration test passes | [ ] TRUE [ ] FALSE |
| 5 | TypeScript compilation succeeds | All | `pnpm typecheck` exits 0 | [ ] TRUE [ ] FALSE |

## GUARDRAILS

### WRITE-ALLOWED
- `convex/actions/agent/ridePlanningAgent.ts` (MODIFY)
- `convex/actions/agent/__tests__/ridePlanningAgent.test.ts` (MODIFY)

### WRITE-PROHIBITED
- No changes to tool signatures
- No changes to message persistence (US-007)

## DESIGN

### References
- Red-Hat Review Report: "Attachments Never Populated"
- US-013: ridePlanningAgent implementation
- US-007: Session message persistence (addSystemMessage)

### Code Pattern
```typescript
// In ridePlanningAgent.ts sendMessage action
const { response, toolResults } = await executeRidePlanningAgent(...)

// Extract tool results and build attachments
const attachments: Array<{ type: string; routePlanId?: string }> = []

for (const toolResult of toolResults) {
  if (toolResult.toolName === 'planRoute' || toolResult.toolName === 'refineRoute') {
    const routeData = JSON.parse(toolResult.result)
    if (routeData.planId) {
      attachments.push({
        type: 'route',
        routePlanId: routeData.planId
      })
    }
  }
}

// Persist system message with attachments
await ctx.runMutation(internal.db.sessionMessages.addSystemMessage, {
  sessionId: args.sessionId,
  content: response.text,
  attachments,
})
```

### Anti-pattern (DO NOT)
- Do not leave attachments empty: `const attachments = []`
- Do not use placeholder comments about "agent will be configured"

## CODING STANDARDS
- **brain/docs/coding-standards**: TypeScript strict, no placeholder implementations
- **convex/_generated/ai/guidelines.md**: Agent result handling

## DEPENDENCIES
- US-007: Session message persistence
- US-013: ridePlanningAgent implementation

## NOTES
- Tool execution at lines 320-337 returns JSON with route data
- Current code at lines 428-443 has TODO comment and empty attachments array
- This breaks US-013 AC-5: "Response persisted as system message with route attachment in DB"
- Without this fix, route plan IDs are never attached to messages, breaking conversation → route attachment flow
