# LaneShadow V1 PRD - Agentic Terminology Update Summary

**Date**: 2026-04-03
**Version**: 1.3.0
**Purpose**: Update PRD to reflect pi core agent framework migration and agentic AI patterns

## Overview

The LaneShadow V1 PRD has been updated to reflect the migration to **pi core** as the primary agent framework and to use precise agentic AI terminology throughout. This update maintains the existing product vision and user experience while accurately describing the technical architecture.

## Files Updated

### 1. README.md
- **Version**: Updated to 1.3.0
- **Document Index**: Changed "UC-NLP" to "UC-AG" (Agentic Conversational Planning)
- **Functional Groups**: Updated description from "NLP (Conversational Planning)" to "Agentic Conversational Planning"
- **Version History**: Added entry for 1.3.0 explaining the terminology update and pi core integration

### 2. 00-overview.md
- **Product Description**: Updated to mention "agentic AI planner" and "pi core" agent framework
- **Solution Summary**: Changed "conversational AI" to "agentic conversational planning" and added details about hybrid architecture
- **Current Status**: Added section on "Agent Framework Migration" explaining the current state and requirements
- **Key Changes**:
  - "conversational AI copilot" → "agentic AI copilot"
  - Added explanation of agentic (probabilistic) vs deterministic (guaranteed) patterns

### 3. 02-roles.md
- **System Role**: Updated to "Agentic AI Planner" with detailed architecture explanation
- **Architecture Section**: Added comprehensive description of hybrid agentic+deterministic approach
- **Agent Personality**: Updated to include "Agentic Awareness" as a personality trait
- **Agent Tools Section**: Added detailed description of pi core tools:
  - planRoute
  - refineRoute
  - fetchWeather
  - saveRoute
  - searchFavorites
- **Key Changes**:
  - "conversational AI planner" → "agentic AI planner"
  - Added explanation of when to use agentic vs deterministic approaches
  - Detailed tool descriptions for pi core integration

### 4. 03-functional-groups.md
- **Table**: Changed "NLP" to "AG" with updated description mentioning pi core
- **AG Description**: Updated to explain "agentic conversational planning" with pi core
- **Group Rationale**: Added "Agent Architecture" subsection explaining pi core usage
- **Key Changes**:
  - "Conversational Planning" → "Agentic Conversational Planning"
  - Added pi core implementation details
  - Explained agent responsibilities and tool usage

### 5. 04-uc-agentic.md (NEW - replaces 04-uc-nlp.md)
- **Filename**: Changed from `04-uc-nlp.md` to `04-uc-agentic.md`
- **Use Case Prefix**: Changed from "UC-NLP-" to "UC-AG-"
- **Descriptions**: Updated all use cases to use agentic terminology
- **UC-AG-01**: Added "Agent uses pi core session management"
- **UC-AG-02**: Added "Agent uses pi core tool execution to run deterministic orchestrator"
- **UC-AG-06**: Updated to mention "pi core's agentic capabilities"
- **UC-AG-07**: Added "Agent uses pi core session context to maintain conversation state"
- **UC-AG-09**: Updated to mention "pi core session persistence"
- **UC-AG-11**: Added "Agent uses pi core error handling patterns"
- **Key Changes**:
  - All "System" references → "Agent" (agentic entity)
  - "NLP" → "agentic reasoning" or "intent understanding"
  - Added pi core-specific implementation details
  - Emphasized agentic vs deterministic workflow separation

### 6. 07-technical-backend.md
- **Architecture Section**: Added comprehensive "V1 Architecture: Agentic + Deterministic Hybrid" section
- **Agent Architecture**: Added new section 3.0 covering:
  - Agent Session Management with pi core
  - Complete agent definition with tools
  - System prompt
  - Tool descriptions
- **parseNaturalLanguageInput**: Updated to "Agent Tool" with enhanced documentation
- **Conversation Flow**: Added detailed flow diagram showing agent interaction
- **Error Handling**: Added section 9.0 on "Error Handling and Fallbacks" with agentic patterns
- **Performance**: Added section 12.0 breaking down agentic vs deterministic operation timing
- **Testing**: Added section 13.0 including "Agent Evaluation"
- **Key Changes**:
  - Added pi core integration examples with code
  - Explained when to use agentic vs deterministic approaches
  - Added complete agent tool definitions
  - Updated error handling to use conversational agent patterns
  - Added performance considerations for LLM calls

### 7. 04-uc-nlp.md (DEPRECATED)
- **Status**: Replaced by `04-uc-agentic.md`
- **Action**: Old file should be removed but kept for reference during migration

## Terminology Changes Reference

| Old Term | New Term | Rationale |
|----------|----------|-----------|
| NLP | Agentic Conversational Planning | More precise - emphasizes agent capabilities not just language processing |
| Natural Language Processing | Agentic reasoning / Intent understanding | Describes what the agent actually does |
| AI Planner | Agentic AI Planner | Specifies the type of AI (agentic) |
| Conversational AI | Agentic AI | More precise about the architecture |
| System (role) | Agent | More accurate - it's an agent, not a generic system |
| NLP confidence | Intent confidence | More specific to the task |
| NLP parsing | Intent understanding / parsing | More descriptive |
| Chatbot | Agent | More accurate - it has agency and tool use |
| AI model | Agent / LLM | Distinguishes between the agent (orchestrator) and LLM (reasoning engine) |

## Architecture Patterns Added

### Agentic (Probabilistic)
- Intent understanding from natural language
- Conversation context maintenance
- Response generation
- Route description writing
- Error recovery and helpful fallbacks
- Judgment calls about rider intent

### Deterministic (Guaranteed)
- Route computation via Google Routes API
- Weather data fetching from Open-Meteo
- Scenic waypoint discovery via Overpass API
- Route normalization and indexing
- Conditions scoring and ranking
- Data persistence to Convex

### Key Principle
**Any action that must ALWAYS happen must be deterministic code — never an agent tool call or LLM decision.**

## pi Core Integration Details Added

### Agent Tools Defined
1. **planRoute**: Generate route alternatives from structured input
2. **refineRoute**: Modify existing routes based on constraints
3. **fetchWeather**: Get weather data for routes
4. **saveRoute**: Persist a route to user's library
5. **searchFavorites**: Find user's favorite road segments

### Session Management
- pi core handles conversation state
- Session persistence across app launches
- Message history and context tracking
- Automatic session creation and resumption

### System Prompt
- Agent personality and behavior guidelines
- Tool usage instructions
- Error handling patterns
- Response style (concise, map-first)

## Implementation Impact

### No Breaking Changes
- All existing use cases remain valid
- Product vision unchanged
- User experience goals unchanged
- Technical constraints unchanged

### New Technical Requirements
- Implement pi core agent session management
- Create agent tool handlers
- Update error handling to use agentic patterns
- Add agent evaluation testing
- Implement conversation state persistence

### Migration Path
1. Install and configure pi core (already in package.json)
2. Create agent definition with tools
3. Implement session management
4. Update existing actions to work with agent tools
5. Add agentic error handling
6. Test conversation flows end-to-end

## Validation Checklist

- [x] All terminology updated consistently across files
- [x] pi core integration details added
- [x] Agent tools documented with parameters
- [x] Agentic vs deterministic separation explained
- [x] Error handling patterns updated
- [x] Performance considerations added
- [x] Testing strategy includes agent evaluation
- [x] Use cases updated with agentic details
- [x] Architecture diagrams updated
- [x] Code examples provided for pi core usage

## Next Steps

1. Review updated PRD files with team
2. Validate pi core integration approach with engineering
3. Update implementation plan based on new architecture
4. Begin implementation of agent session management
5. Create agent tool handlers
6. Test agent conversation flows

## Related Documentation

- pi core GitHub: https://github.com/badlogic/pi-mono
- pi SDK docs: https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/sdk.md
- Extension examples: https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent/examples/extensions

---

**Document Owner**: Product Team
**Reviewers**: Engineering, Design, Product
**Status**: Ready for Review
**Next Review**: After engineering validation of pi core approach
