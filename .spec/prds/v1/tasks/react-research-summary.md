# REACT Agent Research Summary - LaneShadow

**Session Date:** 2025-04-05
**Status:** Design phase - research complete, ready for implementation planning
**Goal:** Implement REACT patterns for LaneShadow's ride planning agent with context awareness and loop prevention

---

## Current Agent Architecture

### Files Involved
- `convex/actions/agent/ridePlanningAgent.ts` - Main agent execution with pi-ai
- `convex/actions/agent/sendMessage.ts` - Orchestrator entry point
- `convex/db/sessionMessages.ts` - Chat message storage
- `convex/db/routePlans.ts` - Route plan persistence

### Current Tool Set
```typescript
tools = [
  geocode,      // Look up coordinates for place names
  planRoute,    // Generate 2-3 scenic route options
  fetchWeather, // Get weather information
  saveRoute,    // Save to favorites (placeholder)
  searchFavorites // Search saved routes (placeholder)
]
```

### Current Agent Loop
```typescript
// From ridePlanningAgent.ts lines 433-504
for (let step = 0; step < MAX_STEPS; step++) {
  const assistant = await stream(model, context) // or complete()
  context.messages.push(assistant)
  
  if (assistant.stopReason !== 'toolUse') break
  
  for (const call of toolCalls) {
    result = await executeTool(ctx, call, executeCtx)
    context.messages.push(toolResultMsg)
  }
}
```

**Limitations:**
- No visible reasoning (black box decisions)
- Hard MAX_STEPS limit (line 31: `MAX_STEPS = 10`)
- Loads full conversation history every time (token inefficient)
- No session context awareness (past routes, user patterns)
- No loop prevention beyond step count

---

## REACT Pattern Fundamentals

### What REACT Solves
Single-shot LLM calls fail when:
- Task requires external feedback (test output, API responses, file contents)
- Correct next step depends on previous step's result
- Multi-step iteration is needed (write code → run tests → fix → repeat)

### The REACT Loop
```
Think → Act → Observe → Repeat

1. THINK: LLM reasons about current state, decides next action
2. ACT: Call a tool (function, API, database query)
3. OBSERVE: Tool result fed back as ToolMessage
4. REPEAT: LLM decides whether to continue or finalize
```

**Key insight:** All prior observations stay in context window. The conversation history IS the reasoning trace.

---

## LangChain/LangGraph Implementation Analysis

### Two Paths in LangGraph

#### Path 1: Prebuilt `createReactAgent()`
```typescript
import { createReactAgent } from "langchain";
import { ChatAnthropic } from "@langchain/anthropic";

const agent = createReactAgent({
  llm: model,
  tools: [search, get_weather],
  state_modifier: SYSTEM_PROMPT // Injected before messages, not stored
});
```
**Use when:** Prototyping, simple flows, standard MessagesState, no custom inter-step logic

**Limitations:** Cannot add custom nodes between agent/tools, cannot use non-standard state, no mid-loop side effects

#### Path 2: Manual StateGraph Build
```typescript
import { StateGraph, MessagesState, END } from "langgraph";

function agent_node(state: MessagesState) {
  messages = [SYSTEM_PROMPT] + state["messages"]
  response = llm_with_tools.invoke(messages)
  return { messages: [response] }
}

function should_continue(state: MessagesState): string {
  last_msg = state["messages"][-1]
  if (last_msg.tool_calls?.length) return "tools"
  return END
}

workflow = StateGraph(MessagesState)
workflow.add_node("agent", agent_node)
workflow.add_node("tools", ToolNode(tools))
workflow.add_conditional_edges("agent", should_continue)
workflow.add_edge("tools", "agent") // The back-edge creates the loop
```
**Use when:** Production with logging, guardrails, memory writes, custom state fields

### Graph Topology
```
START → Agent Node → conditional → tools → back to agent
                              ↓
                             END
```
The back-edge (`tools → agent`) makes it a **loop**, not a chain.

### Loop Prevention in LangGraph

#### 1. Iteration Counter in Custom State
```typescript
class BoundedAgentState(TypedDict):
  messages: Annotated[list, add_messages]
  iterations: int  # Custom field for loop detection

def agent_node(state: BoundedAgentState):
  if state.get("iterations", 0) >= MAX_ITERATIONS:
    return { messages: [AIMessage("Iteration limit reached")] }
  response = llm_with_tools.invoke(messages)
  return { messages: [response], iterations: state["iterations"] + 1 }
```

#### 2. Argument Hash Comparison (Production)
```python
def compute_call_hash(tool_name: str, args: dict) -> str:
  payload = f"{tool_name}:{json.dumps(args, sort_keys=True)}"
  return hashlib.sha256(payload.encode()).hexdigest()[:16]

class LoopDetector:
  def __init__(self, threshold: int = 3):
    self.threshold = threshold
    self.call_counts: Counter = Counter()

  def record_call(self, tool_name: str, args: dict) -> bool:
    call_hash = compute_call_hash(tool_name, args)
    self.call_counts[call_hash] += 1
    return self.call_counts[call_hash] >= self.threshold
```

**Three loop patterns detected:**
1. Direct repetition: Same tool + same args
2. Ping-pong: A → B → A → B without state change
3. Retry-without-progress: Minor arg variations, no convergence

---

## Loop Detection Research (Production Systems)

### Source: LangSight Blog - "How to Detect and Stop AI Agent Loops"

**Real-world incident:** Support agent called `crm-mcp/lookup_customer` 89 times with identical arguments over 47 minutes, cost $214.

### Three Detection Approaches

#### Approach 1: Argument Hash Comparison (Recommended)
- **Reliability:** >90% of loops with zero false positives at threshold=3
- **Implementation:** SHA256 of `tool_name + normalized_args`
- **Pros:** Simple, deterministic, no false positives on legitimate retries
- **Cons:** Only catches exact repetition

#### Approach 2: Sliding Window Rate Detection
- **Implementation:** Track timestamps of last N calls per tool
- **Trigger:** >N calls in M seconds (default: 10 calls in 60 seconds)
- **Pros:** Catch high-frequency regardless of argument variation
- **Cons:** May flag legitimate polling patterns

#### Approach 3: LLM Output Similarity
- **Implementation:** Cosine similarity >0.95 across consecutive reasoning outputs
- **Pros:** Detects semantic repetition even with different tool calls
- **Cons:** Computationally expensive, usually overkill

### What to Do When Loop Detected

1. **Warn and continue** - Log detection, fire alert, let agent run (early monitoring)
2. **Terminate session** - Hard stop, return structured error (production default)
3. **Inject recovery message** - Tell agent it's stuck, attempt self-recovery

### Budget Guardrails (Backstop)
```typescript
client = LangSightClient({
  max_cost_usd: 1.00,     // Hard stop at $1
  max_steps: 25,          // Hard stop at 25 tool calls
  max_wall_time_s: 120,   // Hard stop at 2 minutes
  budget_soft_alert: 0.80 // Alert at 80%
})
```

**Key insight:** Loop detection catches known patterns; budget guardrails catch everything else.

---

## Pi AI Capabilities

### Relevant Types (from `dist/types.d.ts`)
```typescript
type Message = 
  | UserMessage      // { role: "user", content, timestamp }
  | AssistantMessage // { role: "assistant", content[], api, provider, model, usage, stopReason, timestamp }
  | ToolResultMessage// { role: "toolResult", toolCallId, toolName, content[], isError, timestamp }

type AssistantMessageContent = 
  | TextContent       // { type: "text", text }
  | ThinkingContent   // { type: "thinking", thinking }  <-- Reasoning trace support!
  | ToolCall         // { type: "toolCall", id, name, arguments }

interface Context {
  systemPrompt?: string
  messages: Message[]
  tools?: Tool[]
}

interface Tool<TParameters extends TSchema> {
  name: string
  description: string
  parameters: TSchema
}
```

### Streaming Events (from `dist/types.d.ts`)
```typescript
type AssistantMessageEvent =
  | { type: "start"; partial: AssistantMessage }
  | { type: "text_delta"; contentIndex: number; delta: string }  // For streaming text
  | { type: "thinking_delta"; contentIndex: number; delta: string } // Reasoning traces!
  | { type: "toolcall_start"; contentIndex: number; partial: AssistantMessage }
  | { type: "done"; reason: StopReason; message: AssistantMessage }
  | { type: "error"; reason: StopReason; error: AssistantMessage }
```

**Key finding:** Pi AI **already supports** reasoning traces via `ThinkingContent` and `thinking_delta` events! We just need to enable and capture them.

### Functions Available
```typescript
import { stream, complete, getModel } from '@mariozechner/pi-ai'

// Streaming with event emission
const eventStream = stream(model, context)
for await (const event of eventStream) {
  if (event.type === 'thinking_delta') {
    // Capture reasoning trace
  }
}
const assistant = await eventStream.result()

// Or single-shot
const assistant = await complete(model, context)
```

---

## LaneShadow Context Sources

### Session-Level Context (Available Now)
1. **Conversation history** - `session_messages` table
   - All rider/system messages in current session
   - Already loaded in `sendMessage.ts` line 184-195

2. **Current location** - Passed to `sendMessage` action
   - `args.currentLocation: { lat, lng }`
   - Used in system prompt (ridePlanningAgent.ts line 77-79)

3. **Routes planned in session** - `route_plans` table
   - Filter by `clerkUserId` and session's timeframe
   - Contains: start/end points, preferences, result status

### Future Context (Planned)
1. **Saved routes** - `saved_routes` table (schema exists, not yet populated)
   - User's favorite routes
   - Historical preferences (scenicBias, avoidHighways, etc.)

2. **User patterns** (to be extracted)
   - Preferred destinations
   - Typical ride duration
   - Scenic vs highway preference ratio

---

## Proposed Architecture: Pi Module Pattern

### Design Goals
1. **Reusable** - Can be contributed back to pi-ai ecosystem
2. **Non-breaking** - Wraps existing pi-ai `complete()`/`stream()`, doesn't replace
3. **Extensible** - Other pi projects can use for their own agents
4. **TypeScript-first** - Leverages Pi's existing type system

### Module Structure
```
pi-ai/modules/
├── react/
│   ├── index.ts           # Public API: createReactAgent()
│   ├── agent.ts           # Core ReAct loop execution
│   ├── loop-detector.ts   # Loop detection logic
│   ├── context-manager.ts # Context summarization
│   ├── types.ts           # Public types
│   └── README.md
```

### Public API Design
```typescript
import { createReactAgent } from '@mariozechner/pi-ai/react'

const agent = createReactAgent({
  model: getModel('openai', 'gpt-4o'),
  tools: [geocode, planRoute, fetchWeather],
  
  // LaneShadow-specific context injection
  contextProvider: async (sessionId) => {
    return {
      recentRoutes: await getRecentRoutes(sessionId),
      userLocation: await getCurrentLocation(sessionId),
      savedRoutes: await getSavedRoutes(sessionId), // Future
    }
  },
  
  // Loop detection config
  loopDetection: {
    enabled: true,
    maxIterations: 8,
    maxRepetition: 3,  // Same tool+args 3x = loop
    action: 'terminate' // | 'warn' | 'inject_recovery'
  },
  
  // Reasoning trace capture
  captureReasoning: true, // Emit thinking_delta events
})

// Usage
const result = await agent.invoke({
  sessionId,
  userMessage: "Plan a scenic ride to Santa Cruz",
  currentLocation: { lat: 37.7749, lng: -122.4194 }
})

// Or streaming
for await (const event of agent.stream({...})) {
  if (event.type === 'thinking_delta') {
    // Show user what agent is considering
  }
  if (event.type === 'tool_call') {
    // Show tool execution
  }
}
```

### Context Summarization Strategy
```typescript
interface AgentContext {
  // Static per session
  sessionId: string
  clerkUserId: string
  currentLocation?: { lat: number; lng: number }
  
  // Dynamic (updated each turn)
  recentRoutes: RoutePlan[]  // Last 3 routes in session
  conversationSummary?: string // Compressed history after N turns
  preferencesExtracted: {
    scenicBias: 'default' | 'high'
    avoidHighways: boolean
    typicalDuration: { min: number; max: number }
  }
}
```

**Summarization trigger:** When `messages.length > 10`, compress older messages into summary:
- Extract tool calls and results
- Note user preferences expressed
- Preserve route planning outcomes
- Replace with single summary message

---

## Implementation Phases

### Phase 1: Core REACT Module (Foundation)
**Files to create:**
- `convex/actions/agent/react/index.ts`
- `convex/actions/agent/react/agent.ts`
- `convex/actions/agent/react/types.ts`

**Deliverables:**
1. `createReactAgent()` factory function
2. Loop with `thinking_delta` capture
3. Iteration counter (hard limit)
4. Basic context injection interface

**Acceptance:**
- Existing tests pass
- New tests show reasoning traces captured
- Loop terminates at MAX_ITERATIONS

### Phase 2: Loop Detection (Production Safety)
**Files to create:**
- `convex/actions/agent/react/loop-detector.ts`

**Deliverables:**
1. Argument hash comparison
2. Sliding window rate detection (optional)
3. Configurable action (warn/terminate/inject)

**Acceptance:**
- Tests for all three loop patterns
- Zero false positives on legitimate retries
- Budget guardrails as backstop

### Phase 3: Context Management (Token Optimization)
**Files to create:**
- `convex/actions/agent/react/context-manager.ts`

**Deliverables:**
1. Load recent routes from `route_plans`
2. Summarize old conversation history
3. Extract user preferences from routes
4. Inject into system prompt

**Acceptance:**
- Token usage reduced by 60-80% on long sessions
- Agent references past routes in responses
- Tests show context preserved across summarization

### Phase 4: Integration & Migration
**Files to modify:**
- `convex/actions/agent/sendMessage.ts` - Swap `executeRidePlanningAgent` for REACT agent
- `convex/actions/agent/ridePlanningAgent.ts` - Extract tools for reuse

**Deliverables:**
1. Migrate to `createReactAgent()`
2. Add context provider for LaneShadow data
3. Enable reasoning trace streaming to frontend
4. Add loop detection metrics to monitoring

**Acceptance:**
- All existing tests pass
- New integration tests pass
- Manual testing shows visible reasoning
- Monitoring shows loop detection working

---

## Key Technical Decisions

### 1. Why Pi Module Pattern?
- **Alignment:** Pi AI already has modular patterns (MCP, providers)
- **Portability:** Other pi-ai projects can reuse this
- **Maintainability:** Clear separation from pi-ai core
- **Future-proof:** Could be contributed upstream

### 2. Why Not LangGraph.js?
- **Size:** ~100KB+ dependency for what we can build in ~500 lines
- **Schema mismatch:** Our tools use TypeBox, LangChain uses Zod
- **Overhead:** We don't need graph flexibility for single-agent use case
- **Learning curve:** Team already knows pi-ai, not LangChain

### 3. Why Not Build Inside LaneShadow Only?
- **Reusability:** Other pi-ai projects need REACT too
- **Testing:** Module can be tested independently
- **Contributing:** Could give back to pi-ai community

### 4. Context Summarization Approach
- **When:** After 10 messages (configurable)
- **What:** Compress all but last 3 turns into summary
- **How:** Extract tool calls, results, preferences; drop verbatim text
- **Preserve:** Route plans, user decisions, current task state

### 5. Loop Detection Thresholds
- **Repetition:** 3 identical calls (production-tested)
- **Iteration:** 8 max turns (configurable)
- **Time window:** 60 seconds (optional rate-based detection)
- **Action:** Terminate (production), warn (staging)

---

## Open Questions for Design Phase

1. **Module interface:** Should `createReactAgent()` return a pi-ai-compatible object, or a new interface?

2. **Context loading:** Should context provider be async (loaded each turn) or sync (cached at start)?

3. **Reasoning trace storage:** Should we persist reasoning traces to `session_messages` for debugging?

4. **Multi-tenancy:** How to handle context when multiple users share a session group?

5. **Saved routes integration:** Should saved routes be loaded eagerly (at session start) or lazily (on demand)?

6. **Testing strategy:** How to test loop detection without triggering actual LLM calls in CI?

7. **Migration path:** Can we run old and new agents in parallel for A/B testing?

8. **Pi module naming:** Should this be `@mariozechner/pi-ai-react` or bundled in core?

---

## References

### LangChain/LangGraph
- **Docs:** https://docs.langchain.com/oss/python/langchain/agents
- **LangGraph.js:** https://github.com/langchain-ai/langgraphjs
- **ReAct pattern:** https://abstractalgorithms.dev/langgraph-react-agent-pattern

### Loop Detection
- **LangSight blog:** https://langsight.dev/blog/ai-agent-loop-detection/
- **Agent loops anatomy:** https://stevekinney.com/writing/agent-loops

### Pi AI
- **Types:** `node_modules/@mariozechner/pi-ai/dist/types.d.ts`
- **Stream API:** `node_modules/@mariozechner/pi-ai/dist/stream.d.ts`

### LaneShadow Codebase
- Agent: `convex/actions/agent/ridePlanningAgent.ts`
- Orchestrator: `convex/actions/agent/sendMessage.ts`
- Messages: `convex/db/sessionMessages.ts`
- Routes: `convex/db/routePlans.ts`
- Models: `models/session-messages.ts`, `models/route-plans.ts`, `models/saved-routes.ts`

---

## Next Steps

1. **Review this summary** - Confirm understanding and priorities
2. **Answer open questions** - Resolve technical decisions
3. **Create detailed design spec** - Architecture, interfaces, data flow
4. **Write implementation plan** - Break into tasks with acceptance criteria
5. **Begin Phase 1** - Core REACT module

**Status:** Ready for design phase once questions are answered.
