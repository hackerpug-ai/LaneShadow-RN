---
stability: PRODUCT_CONTEXT
last_validated: 2026-04-03
prd_version: 1.3.0
---

# Roles

## Primary Actor

### Rider

The motorcycle rider using LaneShadow to discover, plan, and save rides. The Rider is the only human actor in V1.

**Context**: The Rider typically opens the app before a planned ride (same morning or day-before) or spontaneously when free time appears. They want the app to handle the planning overhead so they can focus on the ride itself.

**Core Job**: "When I want to go for a great ride, I want to describe what I'm in the mood for and have a quick conversation with the agent to dial in the perfect route — without leaving the map."

**Modes of use**:
- **Exploratory**: "What's a good 2-hour loop from here today?"
- **Intentional**: "I want to hit SR-1 to Big Sur, what route fits the weather?"
- **Refining**: "That looks good but can you avoid the stretch near Pacifica?"
- **Returning**: "Let me re-ride that coastal route I saved last month."

---

## Supporting Actor

### System (Agentic AI Planner)

The conversational AI agent that interprets rider intent, generates route alternatives, refines routes based on follow-up messages, scores conditions, and enriches routes with descriptions. The System participates in a chat session with the Rider — maintaining context across messages within a session using pi core's agent framework.

**Architecture**: The System combines two complementary approaches:

1. **Agentic Reasoning** (Probabilistic):
   - Understanding natural language ride descriptions
   - Interpreting follow-up messages in conversation context
   - Generating conversational responses and route descriptions
   - Providing helpful error recovery and fallbacks
   - Making judgment calls about rider intent

2. **Deterministic Workflows** (Guaranteed):
   - Route computation via Google Routes API
   - Weather data fetching from Open-Meteo
   - Scenic waypoint discovery via Overpass API
   - Route normalization and indexing
   - Conditions scoring and ranking
   - Data persistence to Convex

**Responsibilities**:
- Maintain conversation context within a planning session using pi core
- Parse natural language ride descriptions into route parameters through agentic reasoning
- Interpret follow-up messages in context of current session and active routes (e.g., "make it shorter" refers to the currently displayed routes)
- Detect whether a message is a new planning request or a refinement of existing routes
- Generate 2–3 alternative scenic routes via deterministic orchestrator workflows
- Fetch and apply weather data (wind, rain, temperature) per route
- Score each route by a combined scenic + conditions ranking
- Generate route names and descriptions as part of conversational responses using agentic capabilities
- Communicate errors, low confidence, and limitations conversationally — never as modal error dialogs
- Auto-include saved favorite road segments in new route generation when enabled
- Use pi core tool execution to run deterministic workflows
- Leverage pi core session management for conversation state persistence

### Agent Personality

- **Tone**: Confident, concise, knowledgeable riding companion. Not a generic assistant — a planner who knows roads.
- **Brevity**: 1–2 sentences max per message. The map does the talking. Verbose explanations are unwelcome.
- **Person**: Second person. "Here are 3 options to Santa Cruz" — not "I found 3 routes for you."
- **Agentic Awareness**: The agent understands context, maintains conversation state, and provides intelligent responses that build on previous exchanges.
- **Examples**:
  - "Here are 3 options avoiding Highway 1. The coastal route picks up some fog after 3pm."
  - "Updated — rerouted through Skyline Blvd instead. Adds 15 min but way better scenery."
  - "I need a bit more detail — where are you starting from?"
  - "Weather data isn't available right now. Routes are ranked by scenicness only."

### Agent Tools (pi Core)

The agent exposes tools that the LLM can call to perform deterministic actions:

1. **planRoute**: Generate route alternatives from structured input
   - Input: start, end, preferences, departure time
   - Output: 2-3 route options with geometry and conditions
   - Workflow: Calls deterministic orchestrator

2. **refineRoute**: Modify existing routes based on constraints
   - Input: existing route IDs, refinement instructions
   - Output: Updated route options
   - Workflow: Re-runs orchestrator with modified preferences

3. **fetchWeather**: Get weather data for routes
   - Input: route geometry, departure time
   - Output: Wind, rain, temperature overlays
   - Workflow: Calls Open-Meteo API

4. **saveRoute**: Persist a route to user's library
   - Input: route option ID, metadata
   - Output: Saved route record
   - Workflow: Convex mutation

5. **searchFavorites**: Find user's favorite road segments
   - Input: geographic area
   - Output: Favorite road segments
   - Workflow: Convex query

The agent uses these tools to accomplish rider goals through agentic reasoning about when and how to combine them.
