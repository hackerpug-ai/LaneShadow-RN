# Agentic AI Terminology Quick Reference

**Purpose**: Guide for understanding and using agentic AI terminology in LaneShadow V1 PRD

## Core Concepts

### Agentic AI
An AI system that has **agency** — the ability to make decisions, take actions, and pursue goals autonomously within defined constraints. Unlike traditional chatbots that simply respond to prompts, agentic AI can:

- Maintain context across conversations
- Make decisions about which tools to use
- Plan multi-step workflows
- Handle errors gracefully
- Adapt behavior based on conversation state

### pi Core
The agent framework (`@mariozechner/pi-agent-core`) used in LaneShadow to manage:
- Agent sessions and conversation state
- Tool registration and execution
- LLM integration and streaming
- Error handling and fallbacks
- Permission management

### Deterministic vs Probabilistic

| Aspect | Deterministic | Probabilistic (Agentic) |
|--------|---------------|-------------------------|
| **Definition** | Same input → same output, every time | May produce different results each run |
| **Examples** | Route calculation, weather fetching, data storage | Intent understanding, response generation, description writing |
| **Guarantee** | Always succeeds or fails predictably | May vary in quality or approach |
| **Use for** | Operations that MUST always happen | Creative tasks, analysis, judgment calls |
| **Failure Mode** | Throws errors, can retry | May produce suboptimal results, needs validation |

**Key Rule**: Any action that must ALWAYS happen must be deterministic code — never an agent tool call or LLM decision.

## Terminology Mapping

### When to Use "Agent" vs "AI" vs "LLM"

| Term | When to Use | Example |
|------|-------------|---------|
| **Agent** | The entire system with agency, tools, and goals | "The agent interprets rider intent and generates routes" |
| **LLM** | The language model doing reasoning | "The LLM generates route descriptions" |
| **AI** | Generic term (avoid when more specific term exists) | "AI-native motorcycle ride planner" (in positioning) |
| **Agentic** | Adjective describing agent-like behavior | "Agentic reasoning", "Agentic workflows" |

### Specific Replacements

| Instead of... | Use... | Why |
|---------------|--------|-----|
| "NLP" | "Agentic reasoning" or "Intent understanding" | NLP is too broad; we're doing agent-powered understanding |
| "Natural language processing" | "Conversational planning" or "Intent parsing" | More specific to our use case |
| "Chatbot" | "Agent" | More accurate - it has agency and tool use |
| "System" (as actor) | "Agent" | More precise - it's an agent, not a generic system |
| "AI model" | "Agent" or "LLM" | Distinguishes between the orchestrator (agent) and reasoning engine (LLM) |
| "NLP confidence" | "Intent confidence" | More specific to what we're measuring |
| "Parse natural language" | "Understand rider intent" | More descriptive of the goal |

## Agent Tools

Tools are deterministic functions that agents can call. They should:

1. **Have clear, action-oriented descriptions** (LLM reads these to decide when to call)
2. **Accept structured input** (validated with Zod schemas)
3. **Return deterministic results** (same input → same output)
4. **Handle errors gracefully** (return structured errors, never crash)

### Tool Examples

```typescript
// Good tool description
planRoute: {
  description: 'Generate 2-3 scenic motorcycle route alternatives from start to end points',
  // Clear action, specific outcome
}

// Bad tool description
planRoute: {
  description: 'Do the routing thing',
  // Vague, LLM won't understand when to use it
}
```

## Agent Personality

The agent should:

- **Be concise**: 1-2 sentences max per message
- **Be confident**: Not apologetic, authoritative but friendly
- **Use second person**: "Here are 3 options" not "I found 3 routes for you"
- **Be map-first**: The map is primary, agent responses supplement it
- **Handle errors gracefully**: Never show raw errors, always provide helpful guidance

## Conversation Patterns

### New Planning Session
```
Rider: "scenic 2-hour ride to Santa Cruz, avoid highways"
Agent: [Interprets intent → calls planRoute tool → returns routes]
Agent: "Here are 3 options to Santa Cruz. The coastal route picks up some fog after 3pm."
[Displays routes on map with weather badges]
```

### Refinement
```
Rider: "make it shorter"
Agent: [Understands in context → calls refineRoute tool → returns updated routes]
Agent: "Updated — trimmed to 90 minutes through Skyline Blvd."
[Updates routes on map]
```

### Error Recovery
```
Rider: "ride to [garbled text]"
Agent: [Low confidence → asks for clarification]
Agent: "I need a bit more detail — where are you starting from?"
```

## Implementation Checklist

When implementing agent features:

- [ ] Agent has clear system prompt defining role and constraints
- [ ] Tools have action-oriented descriptions optimized for LLM understanding
- [ ] Deterministic workflows are separate from agent tools
- [ ] Error handling is conversational, not modal
- [ ] Session state persists across app launches
- [ ] Agent responses are concise (1-2 sentences)
- [ ] Map is always primary view, agent supplements it
- [ ] Agent context is maintained across conversation turns
- [ ] Tool calls are logged for debugging
- [ ] Agent decisions can be inspected/evaluated

## Testing Agent Behavior

### Unit Tests
- Tool handlers return expected results for given inputs
- Error conditions are handled gracefully
- Invalid inputs produce helpful error messages

### Integration Tests
- Full conversation flows work end-to-end
- Session state persists correctly
- Agent selects appropriate tools for different requests
- Refinement requests use context from previous turns

### Evaluation Tests
- Intent understanding accuracy (manual review of samples)
- Response quality (helpfulness, conciseness)
- Conversation context maintenance (doesn't "forget" previous messages)
- Tool selection correctness (chooses right tool for the task)

## Common Pitfalls

### Don't
- Make the agent verbose (riders want to ride, not read)
- Show raw error messages (be helpful and conversational)
- Use "NLP" as a buzzword (be specific about what's happening)
- Put deterministic logic in agent tools (keep it in code)
- Let the agent make critical decisions without validation

### Do
- Keep responses brief and actionable
- Use structured error handling with conversational fallbacks
- Be specific about agent capabilities ("agentic reasoning", "intent understanding")
- Separate deterministic workflows from agent tools
- Validate agent outputs before using them in critical paths

## Resources

- **pi core docs**: https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/sdk.md
- **Extension examples**: https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent/examples/extensions
- **Agent design patterns**: See brain/agents/ for cross-project patterns

---

**Last Updated**: 2026-04-03
**Version**: 1.0
**Maintainer**: Product Team
