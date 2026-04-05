# LaneShadow REACT Strategy

**Date**: 2026-04-05
**Status**: DRAFT - Ready for Review
**Epic**: Context-Aware Agent Enhancement

---

## Executive Summary

This document outlines a REACT (Reasoning + Acting) strategy for LaneShadow's ride planning agent. Given our current architecture (pi-ai agent framework) and available context (user location, past chats, saved routes), we propose a **Context-Enhanced ReAct Pattern** that:

1. **Reduces hallucination** by grounding reasoning in verified context
2. **Improves personalization** by leveraging session history and user preferences
3. **Prevents infinite loops** through explicit action tracking and termination conditions
4. **Maintains token efficiency** through progressive context disclosure

## Current State Analysis

### What We Have

| Asset | Location | Usage | Quality |
|-------|----------|-------|---------|
| **User Location** | `sendMessage.currentLocation` | Passed to agent | High (GPS) |
| **Conversation History** | `session_messages` table | Full history available | High (persistent) |
| **Saved Routes** | `route_plans` table | Not currently used | High (structured) |
| **Agent Framework** | `@mariozechner/pi-ai` | Tool-based agent | High (mature) |
| **System Prompt** | `buildSystemPrompt()` | Basic location context | Medium (minimal) |

### Current Agent Flow

```
User Message → Save to DB → Load History → Run Agent Loop → Save Response
                                    ↓
                           [No explicit reasoning]
                           [Direct tool calls]
                           [No reflection]
```

### Gaps Identified

1. **No explicit reasoning trace** - Agent thinks internally, outputs only results
2. **No context summary** - Full history loaded every time (token waste)
3. **No loop detection** - Relies on `MAX_STEPS = 10` hard limit
4. **No reflection** - Failed actions don't trigger reconsideration
5. **Unused context** - Saved routes, past preferences not leveraged

---

## Proposed REACT Strategy

### Phase 1: Reasoning Trace Injection (Week 1)

**Goal**: Make agent reasoning visible and inspectable

#### Implementation

```typescript
// Extend AgentContext to include reasoning trace
export type AgentContext = {
  sessionId: Id<'planning_sessions'>
  clerkUserId: string
  conversationHistory: { role: string; content: string }[]
  currentLocation?: { lat: number; lng: number }
  runQuery: ActionCtx['runQuery']
  runMutation: ActionCtx['runMutation']
  // NEW: Reasoning trace for observability
  reasoningTrace: {
    step: number
    thought: string
    action: string
    observation?: string
    timestamp: number
  }[]
}

// Modify system prompt to require REACT format
export const buildReactSystemPrompt = (ctx: AgentContext): string => {
  const locBlock = ctx.currentLocation
    ? `Current location: lat=${ctx.currentLocation.lat}, lng=${ctx.currentLocation.lng}`
    : `Location unknown - ask where they're starting`

  return `You are a motorcycle ride planning assistant using the REACT pattern.

${locBlock}

CRITICAL: Format EVERY response as:
Thought: [your reasoning about what to do]
Action: [tool name or "answer"]
${ctx.currentLocation ? '' : 'Observation: [result after action]'}

Examples:
Thought: Rider wants a scenic ride but didn't specify destination. I should ask.
Action: answer
"I'd be happy to plan a scenic ride! Where would you like to go?"

Thought: Rider said "Santa Cruz" and I have their location. I can plan routes.
Action: planRoute(start=current, end=Santa Cruz, preferences=...)

For refinements like "make it shorter":
Thought: Rider wants to shorten the current routes. I'll replan with time constraint.
Action: planRoute(..., maxDuration=shorter)

Errors:
- If geocoding fails: Suggest they try a more specific place name
- If no routes found: Suggest adjusting distance or trying a nearby destination
- Never expose internal error codes

Keep responses to 1-2 sentences. Be conversational, not robotic.`
}
```

#### Benefits

- **Observability**: Every decision is logged
- **Debugging**: Can trace why agent took an action
- **Trust**: Users can see reasoning (optional display)
- **Training**: Data for improving prompts

#### Acceptance Criteria

- [ ] All agent responses include Thought/Action structure
- [ ] Reasoning trace saved to `session_messages` metadata
- [ ] Can export reasoning trace for debugging
- [ ] Token overhead < 20% per turn

---

### Phase 2: Context Summarization (Week 2)

**Goal**: Reduce token usage while preserving relevant context

#### Problem

Current implementation loads **full conversation history** every time. After 20 messages, this is 5k+ tokens of context.

#### Solution: Progressive Context Compression

```typescript
// New: Context summary service
export interface ContextSummary {
  recentMessages: { role: string; content: string }[]  // Last 3 turns
  preferences: {
    avoidHighways: boolean
    scenicBias: 'default' | 'high'
    preferredRegions: string[]  // Extracted from past destinations
    timePreferences: { min?: number; max?: number }  // In minutes
  }
  previousPlans: {
    planId: Id<'route_plans'>
    destination: string
    riderReaction: 'accepted' | 'refined' | 'rejected'
  }[]
}

export async function buildContextSummary(
  ctx: ActionCtx,
  sessionId: Id<'planning_sessions'>
): Promise<ContextSummary> {
  const messages = await ctx.runQuery(api.db.sessionMessages.list, { sessionId })
  
  // Extract preferences from conversation
  const preferences = extractPreferences(messages)
  
  // Track previous plans and reactions
  const previousPlans = extractPlanHistory(messages)
  
  // Keep only recent messages verbatim
  const recentMessages = messages.slice(-3).map(m => ({
    role: m.role,
    content: m.content
  }))
  
  return { recentMessages, preferences, previousPlans }
}

// Updated system prompt injection
export const buildSystemPrompt = (ctx: AgentContext, summary: ContextSummary): string => {
  let prompt = `You are a motorcycle ride planning assistant.

RIDER CONTEXT (from previous conversations):
- Avoids highways: ${summary.preferences.avoidHighways ? 'yes' : 'no'}
- Scenic preference: ${summary.preferences.scenicBias}
- Preferred ride areas: ${summary.preferences.preferredRegions.join(', ') || 'none yet'}
- Typical ride duration: ${durationRange(summary.preferences.timePreferences)}

PREVIOUS PLANS (don't repeat these exactly):
${summary.previousPlans.map(p => `- ${p.destination} (${p.riderReaction})`).join('\n')}

${ctx.currentLocation ? `Current location: lat=${ctx.currentLocation.lat}, lng=${ctx.currentLocation.lng}` : ''}

Use REACT pattern (Thought → Action → Observation).
`
  return prompt
}
```

#### Benefits

- **Token savings**: 60-80% reduction in context size
- **Better focus**: Agent sees patterns, not raw text
- **Preference persistence**: Remembers user choices across sessions

#### Acceptance Criteria

- [ ] Context summary generated before each agent turn
- [ ] Summary includes extracted preferences
- [ ] Previous plans tracked with rider reactions
- [ ] Token usage measured and < 2k tokens per turn after 10 messages

---

### Phase 3: Loop Prevention (Week 2)

**Goal**: Detect and break infinite loops before hitting MAX_STEPS

#### Problem

Current agent has `MAX_STEPS = 10` but no early detection. Agent can:
- Call same tool with same args repeatedly
- Alternate between two tools indefinitely
- Fail and retry without new information

#### Solution: Action Signature Tracking

```typescript
// New: Loop detection
interface ActionSignature {
  toolName: string
  argsHash: string  // SHA-256 of args
  timestamp: number
}

export class LoopDetector {
  private recentActions: ActionSignature[] = []
  private readonly WINDOW = 5  // Check last 5 actions
  private readonly MAX_REPEATS = 2  // Allow 2 repeats, then block
  
  recordAction(toolName: string, args: any): void {
    const argsHash = this.hashArgs(args)
    this.recentActions.push({
      toolName,
      argsHash,
      timestamp: Date.now()
    })
    
    // Keep only recent window
    if (this.recentActions.length > this.WINDOW) {
      this.recentActions.shift()
    }
  }
  
  detectLoop(): { isLooping: boolean; reason?: string } {
    // Check for exact repeats
    const lastAction = this.recentActions[this.recentActions.length - 1]
    if (!lastAction) return { isLooping: false }
    
    const repeats = this.recentActions.filter(
      a => a.toolName === lastAction.toolName && a.argsHash === lastAction.argsHash
    ).length
    
    if (repeats > this.MAX_REPEATS) {
      return {
        isLooping: true,
        reason: `Repeated ${lastAction.toolName} with same args ${repeats} times`
      }
    }
    
    // Check for oscillation (A → B → A → B)
    if (this.recentActions.length >= 4) {
      const last4 = this.recentActions.slice(-4)
      const pattern = last4.map(a => `${a.toolName}:${a.argsHash}`).join(',')
      const reversed = [...last4].reverse().map(a => `${a.toolName}:${a.argsHash}`).join(',')
      
      if (pattern === reversed) {
        return {
          isLooping: true,
          reason: 'Oscillating between two actions'
        }
      }
    }
    
    return { isLooping: false }
  }
  
  private hashArgs(args: any): string {
    // Simple hash for args (production: use crypto.subtle.digest)
    return JSON.stringify(args).length.toString()
  }
}

// Integration in agent loop
const loopDetector = new LoopDetector()

for (const call of toolCalls) {
  // Check for loop BEFORE executing
  const { isLooping, reason } = loopDetector.detectLoop()
  if (isLooping) {
    throw new Error(`Agent loop detected: ${reason}`)
  }
  
  // Record action and execute
  loopDetector.recordAction(call.name, validated)
  result = await executeTool(ctx, call, executeCtx)
  
  // If tool failed, don't retry with same args
  if ((result as any)?.type === 'error') {
    toolCalls = []  // Break the loop
    break
  }
}
```

#### Benefits

- **Early exit**: Catch loops before MAX_STEPS
- **Better errors**: Explain why loop was detected
- **Cost savings**: Wasted API calls avoided

#### Acceptance Criteria

- [ ] Loop detector checks before each tool call
- [ ] Exact repeats detected after 2nd occurrence
- [ ] Oscillation patterns detected
- [ ] Loop error messages are user-friendly

---

### Phase 4: Reflection & Recovery (Week 3)

**Goal**: Agent reflects on failures and tries alternative approaches

#### Problem

Current agent:
- Fails tool → reports error → waits for user
- No self-correction
- No learning from failures

#### Solution: Reflection Step After Failures

```typescript
// New: Reflection tool
const tools: Tool[] = [
  // ... existing tools
  {
    name: 'reflect',
    description: `Reflect on a failed action and consider alternatives.
    Use when:
    - A tool returns an error
    - No routes are found
    - Geocoding fails
    Inputs: { failedAction: string, error: string }
    Returns: { alternativeApproach: string, shouldRetry: boolean }`,
    parameters: {
      type: 'object',
      properties: {
        failedAction: { type: 'string' },
        error: { type: 'string' }
      },
      required: ['failedAction', 'error']
    }
  }
]

// Reflection handler
async function runReflect(
  ctx: AgentContext,
  args: { failedAction: string; error: string }
): Promise<unknown> {
  // Called by agent after failure to decide what to do
  // This is probabilistic - the LLM reasons about alternatives
  
  // Example reflections (agent-generated):
  // - "Geocoding failed for 'FooBar'. Maybe they meant 'Santa Cruz'?"
  // - "No routes found. Perhaps the distance is too short?"
  // - "Weather API down. I can still plan routes without weather."
  
  return {
    type: 'reflection',
    alternativeApproach: 'Try asking rider to clarify or adjust constraints',
    shouldRetry: false
  }
}

// Modified agent loop
for (const call of toolCalls) {
  try {
    result = await executeTool(ctx, call, executeCtx)
  } catch (err) {
    // Instead of failing immediately, give agent a chance to reflect
    const reflectionResult = await executeTool(ctx, {
      name: 'reflect',
      args: {
        failedAction: call.name,
        error: err instanceof Error ? err.message : String(err)
      }
    }, executeCtx)
    
    // If reflection suggests a retry, continue loop
    if ((reflectionResult as any)?.shouldRetry) {
      continue  // Agent will try next action
    }
    
    // Otherwise, break with helpful message
    break
  }
}
```

#### Benefits

- **Self-recovery**: Agent fixes own mistakes
- **Better UX**: Fewer "try again" messages to user
- **Robustness**: Handles transient failures gracefully

#### Acceptance Criteria

- [ ] Reflection tool available after failures
- [ ] Agent can suggest alternatives
- [ ] Reflection doesn't cause infinite loops
- [ ] Reflection results are logged

---

### Phase 5: Personalization Engine (Week 4)

**Goal**: Leverage saved routes and past preferences for better recommendations

#### Problem

Current agent:
- Treats each request independently
- Doesn't learn from past rides
- Doesn't leverage saved routes

#### Solution: Context-Aware Preferences

```typescript
// New: User preferences extracted from history
export interface RiderProfile {
  // Extracted from past conversations
  preferences: {
    avoidHighways: boolean  // How often they ask to avoid highways
    scenicBias: 'default' | 'high'  // How often they mention "scenic"
    typicalDuration: { min: number; max: number }  // Usual ride length
    preferredRegions: string[]  // Destinations they repeat
    avoidRegions: string[]  // Places they rejected
  }
  
  // From saved routes
  favoriteRoads: {
    roadName: string
    usedInPlans: number
    lastUsed: number
  }[]
  
  // Behavioral patterns
  patterns: {
    plansPerWeek: number
    refinementRate: number  // How often they refine vs accept
    peakPlanningTimes: number[]  // Hours when they plan rides
  }
}

export async function buildRiderProfile(
  ctx: ActionCtx,
  clerkUserId: string
): Promise<RiderProfile> {
  // Analyze all past sessions
  const sessions = await ctx.runQuery(internal.db.planningSessions.listByUserInternal, {
    clerkUserId
  })
  
  const profile: RiderProfile = {
    preferences: {
      avoidHighways: false,
      scenicBias: 'default',
      typicalDuration: { min: 60, max: 180 },
      preferredRegions: [],
      avoidRegions: []
    },
    favoriteRoads: [],
    patterns: {
      plansPerWeek: 0,
      refinementRate: 0,
      peakPlanningTimes: []
    }
  }
  
  // Extract preferences from conversation history
  for (const session of sessions) {
    const messages = await ctx.runQuery(api.db.sessionMessages.list, {
      sessionId: session._id
    })
    
    for (const msg of messages) {
      const content = msg.content.toLowerCase()
      
      // Track highway avoidance
      if (content.includes('avoid highway') || content.includes('no highway')) {
        profile.preferences.avoidHighways = true
      }
      
      // Track scenic preference
      if (content.includes('scenic')) {
        profile.preferences.scenicBias = 'high'
      }
      
      // Extract duration preferences
      const durationMatch = content.match(/(\d+)\s*(min|hour|hr)/)
      if (durationMatch) {
        const value = parseInt(durationMatch[1])
        profile.preferences.typicalDuration.min = Math.min(
          profile.preferences.typicalDuration.min,
          value
        )
      }
    }
  }
  
  return profile
}

// Inject profile into system prompt
export const buildSystemPrompt = (
  ctx: AgentContext,
  summary: ContextSummary,
  profile: RiderProfile
): string => {
  let prompt = `You are a motorcycle ride planning assistant.

RIDER PROFILE (learned from ${profile.patterns.plansPerWeek} previous plans):
- Highway preference: ${profile.preferences.avoidHighways ? 'Avoids highways' : 'OK with highways'}
- Scenic preference: ${profile.preferences.scenicBias === 'high' ? 'Loves scenic roads' : 'Standard scenicness'}
- Typical ride length: ${profile.preferences.typicalDuration.min}-${profile.preferences.typicalDuration.max} minutes
- Favorite destinations: ${profile.preferences.preferredRegions.join(', ') || 'None yet'}

TIP: If they ask for a ride like "last time", check their preferred regions first.

${ctx.currentLocation ? `Current location: lat=${ctx.currentLocation.lat}, lng=${ctx.currentLocation.lng}` : ''}

Use REACT pattern (Thought → Action → Observation).
`
  return prompt
}
```

#### Benefits

- **Personalization**: Routes match rider style
- **Efficiency**: Faster to acceptable results
- **Delight**: "Remembers" preferences automatically

#### Acceptance Criteria

- [ ] Rider profile built from past sessions
- [ ] Profile influences route planning
- [ ] Profile updates incrementally (not full rebuild)
- [ ] Profile respects privacy (no cross-user leakage)

---

## Implementation Roadmap

### Week 1: Foundation
- [ ] Add reasoning trace to `AgentContext`
- [ ] Update system prompt for REACT format
- [ ] Implement trace persistence
- [ ] Add trace export utility

### Week 2: Context & Loops
- [ ] Build `ContextSummary` service
- [ ] Implement `LoopDetector` class
- [ ] Integrate both into agent loop
- [ ] Add metrics for token usage

### Week 3: Reflection
- [ ] Add `reflect` tool
- [ ] Implement reflection-after-failure logic
- [ ] Test recovery scenarios
- [ ] Document reflection patterns

### Week 4: Personalization
- [ ] Build `RiderProfile` service
- [ ] Implement profile extraction
- [ ] Inject profile into prompts
- [ ] A/B test personalization impact

---

## Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| **Avg tokens/turn** | ~2,500 | <1,500 | After 10 messages |
| **Loop rate** | ~5% | <1% | Loops per 100 turns |
| **Refinement rate** | Unknown | <2 refinements | Avg to get accepted route |
| **Time to first route** | ~12s | <10s | P95 latency |
| **User satisfaction** | Unknown | >4.0/5.0 | In-app survey |

---

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Token cost increases** | Medium | Low | Progressive disclosure, limit trace length |
| **Loop detection too aggressive** | High | Low | Allow 2-3 repeats before blocking |
| **Profile extraction misses context** | Medium | Medium | Manual review of extraction logic |
| **Reflection causes confusion** | Low | Low | Test thoroughly, keep reflections internal |
| **REACT format feels robotic** | Medium | Medium | Train LLM on natural language examples |

---

## Open Questions

1. **Should reasoning traces be visible to users?**
   - Pro: Transparency, trust
   - Con: Token cost, complexity
   - **Decision**: Hide by default, show in debug mode

2. **How often to rebuild rider profile?**
   - Option A: Every session (expensive)
   - Option B: Incremental updates (complex)
   - Option C: Scheduled batch (balanced)
   - **Decision**: Option C - nightly batch + incremental

3. **Should reflection suggestions be auto-applied?**
   - Pro: Faster resolution
   - Con: Loss of user control
   - **Decision**: Ask user confirmation

---

## Next Steps

1. **Review this strategy** with product and engineering
2. **Prioritize phases** based on impact vs effort
3. **Create implementation tasks** in Epic format
4. **Set up monitoring** for success metrics
5. **Begin Phase 1** (Reasoning Traces)

---

## References

- REACT Research: `holocron:js78e0v0gvsketzm42evjddhcd848c33`
- Pi-Mono Documentation: https://github.com/badlogic/pi-mono
- Current Agent: `convex/actions/agent/ridePlanningAgent.ts`
- Session Schema: `convex/db/sessionMessages.ts`
