# Implement parseNaturalLanguageInput action

> Task ID: US-009
> Type: FEATURE
> Priority: P0
> Estimate: 120 minutes
> Assignee: backend-engineer

## CRITICAL CONSTRAINTS

### MUST
- Create `convex/actions/agent/tools/parseNaturalLanguageInput.ts` as a `'use node'` module
- Use `generateObject` from `'ai'` with `openai(AI_MODEL)` — same pattern as `enrichRoute.ts`
- Accept: text, currentLocation, departureTime, previousMessages
- Return: `{ planInput, confidence, isRefinement, warnings }`
- Set `nlpText` on the returned `planInput`
- Timeout after 10 seconds
- Throw `AGENTIC_PARSE_FAILED` on failure

### NEVER
- Trust LLM coordinates without bounds validation (lat: -90 to 90, lng: -180 to 180)
- Let this function call the orchestrator — it only parses input
- Make multiple LLM calls — single call only

### STRICTLY
- Single LLM call per invocation
- Limit `previousMessages` to last 10 messages
- Validate all coordinate bounds before returning

## SPECIFICATION

**Objective:** Parse natural language ride requests into structured `PlanInput` objects using an LLM, enabling the conversational planning flow.

**Success looks like:** Natural language like "2-hour scenic ride from SF to Santa Cruz" returns a valid `PlanInput` with high confidence. Ambiguous inputs return low confidence with warnings. Refinements in context are detected via `isRefinement`.

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | "2-hour scenic ride from SF to SC" | parseNaturalLanguageInput called | Returns PlanInput with confidence 'high' | Unit test |
| 2 | "make it shorter" with previous context | parseNaturalLanguageInput called | Returns isRefinement true | Unit test |
| 3 | Ambiguous "ride" with no details | parseNaturalLanguageInput called | Returns confidence 'low' with warnings | Unit test |
| 4 | LLM timeout after 10s | parseNaturalLanguageInput called | Throws AGENTIC_PARSE_FAILED | Unit test |
| 5 | LLM returns invalid coordinates | parseNaturalLanguageInput called | Coordinates rejected, error thrown | Unit test |

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | Clear ride request returns high confidence PlanInput | AC-1 | Unit test passes | [ ] TRUE [ ] FALSE |
| 2 | Refinement in context detected correctly | AC-2 | Unit test passes | [ ] TRUE [ ] FALSE |
| 3 | Ambiguous input returns low confidence | AC-3 | Unit test passes | [ ] TRUE [ ] FALSE |
| 4 | Timeout throws AGENTIC_PARSE_FAILED | AC-4 | Unit test passes | [ ] TRUE [ ] FALSE |
| 5 | Invalid coordinates are rejected | AC-5 | Unit test passes | [ ] TRUE [ ] FALSE |
| 6 | TypeScript compilation succeeds | All | `pnpm typecheck` exits 0 | [ ] TRUE [ ] FALSE |

## GUARDRAILS

### WRITE-ALLOWED
- `convex/actions/agent/tools/parseNaturalLanguageInput.ts` (NEW)
- `convex/actions/agent/tools/__tests__/parseNaturalLanguageInput.test.ts` (NEW)

### WRITE-PROHIBITED
- `convex/actions/agent/tools/enrichRoute.ts` (reference only)
- `convex/actions/agent/planRide.ts`

## DESIGN

### References
- `convex/actions/agent/tools/enrichRoute.ts` — pattern to follow for generateObject usage
- PRD UC-AG-01, UC-AG-07
- PRD 07-technical-backend.md §3

### Code Pattern
```typescript
'use node';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function parseNaturalLanguageInput(args: {
  text: string;
  currentLocation: { lat: number; lng: number };
  departureTime: number;
  previousMessages?: Array<{ role: string; content: string }>;
}): Promise<ParseResult> {
  const messages = (args.previousMessages ?? []).slice(-10);
  // Single generateObject call with timeout
  // Validate coordinate bounds on result
  // Set nlpText on planInput
}
```

### Anti-pattern (DO NOT)
- Do not chain multiple LLM calls
- Do not call the route planning orchestrator from this function
- Do not trust LLM-generated coordinates without validation

## CODING STANDARDS
- **brain/docs/coding-standards**: TypeScript strict, composition patterns

## DEPENDENCIES
- US-008: Error codes (AGENTIC_PARSE_FAILED) and model extensions (nlpText field)

## NOTES
- The `AI_MODEL` constant should come from `convex/lib/env.ts` following the existing pattern
- Previous messages provide conversation context for refinement detection
- Confidence levels: 'high', 'medium', 'low' — used by the agent to decide follow-up behavior
