# LangChain to Pi Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace LangChain agent infrastructure with pi coding-agent SDK while maintaining existing route planning functionality within Convex actions.

**Architecture:** Migrate from LangGraph StateGraph to pi AgentSession API. Tools become pi ToolDefinitions with TypeBox validation. LangSmith tracing replaced by pi event system. Extension-based architecture encapsulates domain logic.

**Tech Stack:** pi SDK (@pi/sdk), TypeBox, AJV, Convex actions, OpenAI GPT-4o

---

## File Structure

### New Files
```
convex/actions/agent/
├── extensions/
│   ├── routePlanningExtension.ts           # Pi extension with tools
│   └── __tests__/
│       └── routePlanningExtension.test.ts  # Extension tests
├── lib/
│   ├── piSession.ts                         # Agent session factory
│   ├── piObserver.ts                        # Event observer
│   ├── piTools.ts                           # Tool definition helpers
│   └── __tests__/
│       └── piObserver.test.ts               # Observer tests
```

### Modified Files
```
convex/actions/agent/planRide.ts             # Use AgentSession
convex/actions/agent/__tests__/planRide.test.ts  # Update tests
convex/lib/env.ts                            # Remove LangSmith, add pi config
package.json                                 # Update dependencies
```

### Removed Files
```
convex/actions/agent/graphs/                 # DELETE entire directory
convex/actions/agent/lib/tracing.ts          # DELETE (LangSmith)
```

---

## Task 1: Update Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Remove LangChain dependencies**

```json
// Remove these lines from package.json:
"@langchain/core": "^1.1.12",
"@langchain/langgraph": "^1.0.15",
"@langchain/openai": "^1.2.1",
"langchain": "^1.2.7",
"langsmith": "^0.4.5"
```

- [ ] **Step 2: Add pi SDK dependencies**

```json
// Add to dependencies in package.json:
"@mariozechner/pi-agent-core": "^0.63.1",
"@mariozechner/pi-ai": "^0.63.1",
"@sinclair/typebox": "^0.33.0"
```

- [ ] **Step 3: Install dependencies**

```bash
pnpm install
```

Expected: No peer dependency conflicts, all packages install successfully.

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "feat: migrate from LangChain to pi SDK dependencies"
```

---

## Task 2: Update Environment Configuration

**Files:**
- Modify: `convex/lib/env.ts`

- [ ] **Step 1: Remove LangSmith environment variables**

```typescript
// DELETE these lines from convex/lib/env.ts:
export const LANGSMITH_TRACING = !isTestEnvironment && optionalEnv('LANGSMITH_TRACING') === 'true'
export const LANGSMITH_API_KEY = !isTestEnvironment ? optionalEnv('LANGSMITH_API_KEY') : ''
export const LANGSMITH_PROJECT = (!isTestEnvironment && optionalEnv('LANGSMITH_PROJECT')) ?? 'LaneShadowDev'
```

- [ ] **Step 2: Update OPENAI_API_KEY comment**

```typescript
// Change comment from:
// OpenAI API key for LangChain router agent

// To:
// OpenAI API key for pi AgentSession (model: gpt-4o)
```

- [ ] **Step 3: Add pi configuration**

```typescript
// Add to convex/lib/env.ts after OPENAI_API_KEY:

/**
 * Pi Agent configuration.
 * Set PI_OBSERVABILITY_ENABLED=true to enable event logging.
 * Automatically disabled during tests (NODE_ENV=test).
 */
export const PI_OBSERVABILITY_ENABLED = !isTestEnvironment && optionalEnv('PI_OBSERVABILITY_ENABLED') === 'true'

/**
 * Pi Agent model configuration.
 * Defaults to gpt-4o for route planning (can override via env).
 */
export const PI_MODEL = optionalEnv('PI_MODEL') ?? 'gpt-4o'

/**
 * Pi Agent temperature for route sketching.
 * Lower temperature = more deterministic route generation.
 */
export const PI_TEMPERATURE = Number(optionalEnv('PI_TEMPERATURE') ?? '0')
```

- [ ] **Step 4: Run type check**

```bash
pnpm type-check
```

Expected: No type errors.

- [ ] **Step 5: Commit**

```bash
git add convex/lib/env.ts
git commit -m "feat: add pi agent environment configuration"
```

---

## Task 3: Create Tool Definition Helpers

**Files:**
- Create: `convex/actions/agent/lib/piTools.ts`

- [ ] **Step 1: Write helper functions for pi ToolDefinitions**

```typescript
'use node'

import { Type } from '@sinclair/typebox'

/**
 * Route planning validator schemas using TypeBox for pi ToolDefinitions.
 * These mirror the existing Zod schemas in models/ but use TypeBox for AJV validation.
 */
export const RoutePlanningValidators = {
  PlanInput: Type.Object({
    start: Type.Object({
      lat: Type.Number(),
      lng: Type.Number(),
      label: Type.Optional(Type.String()),
      placeId: Type.Optional(Type.String()),
    }),
    end: Type.Object({
      lat: Type.Number(),
      lng: Type.Number(),
      label: Type.Optional(Type.String()),
      placeId: Type.Optional(Type.String()),
    }),
    departureTime: Type.Integer(),
    preferences: Type.Optional(Type.Object({
      scenicBias: Type.Optional(Type.Union([Type.Literal('low'), Type.Literal('default'), Type.Literal('high')])),
    })),
  }),

  RouteSketch: Type.Object({
    label: Type.String(),
    rationale: Type.String(),
    segments: Type.Array(Type.Object({
      roadName: Type.String(),
      fromName: Type.String(),
      toName: Type.String(),
      viaNames: Type.Optional(Type.Array(Type.String())),
    })),
    anchorPoints: Type.Array(Type.Object({
      name: Type.String(),
      kind: Type.Union([
        Type.Literal('junction'),
        Type.Literal('pass'),
        Type.Literal('vista'),
        Type.Literal('town'),
      ]),
      lat: Type.Optional(Type.Number()),
      lng: Type.Optional(Type.Number()),
    })),
  }),

  RouteSnapshot: Type.Object({
    provider: Type.String(),
    bounds: Type.Object({
      north: Type.Number(),
      south: Type.Number(),
      east: Type.Number(),
      west: Type.Number(),
    }),
    overviewGeometry: Type.Object({
      format: Type.Literal('polyline'),
      encoding: Type.String(),
      precision: Type.Number(),
      value: Type.String(),
    }),
    legs: Type.Array(Type.Any()),
    overlays: Type.Object({
      wind: Type.Optional(Type.Any()),
      temperature: Type.Optional(Type.Any()),
    }),
  }),

  RouteIndex: Type.Object({
    routeFingerprint: Type.String(),
    sampledPoints: Type.Array(Type.Object({
      lat: Type.Number(),
      lng: Type.Number(),
      distanceFromStartMeters: Type.Number(),
    })),
  }),

  ProbedConditions: Type.Array(Type.Object({
    distanceFromStartMeters: Type.Number(),
    lat: Type.Number(),
    lng: Type.Number(),
    wind: Type.Object({
      windSpeed: Type.Number(),
      windDirectionDeg: Type.Number(),
      windGust: Type.Optional(Type.Number()),
      unit: Type.Union([Type.Literal('m/s'), Type.Literal('km/h')]),
      timeIso: Type.String(),
    }),
  })),
}
```

- [ ] **Step 2: Run type check**

```bash
pnpm type-check
```

Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add convex/actions/agent/lib/piTools.ts
git commit -m "feat: add TypeBox validators for pi tool definitions"
```

---

## Task 4: Create Event Observer

**Files:**
- Create: `convex/actions/agent/lib/piObserver.ts`

- [ ] **Step 1: Write pi event observer**

```typescript
'use node'

import type { ActionCtx } from '../../../_generated/server'
import { backend } from '../../lib/logger'
import { PI_OBSERVABILITY_ENABLED } from '../../../lib/env'

/**
 * Pi event observer for AgentSession lifecycle.
 * Replaces LangSmith tracing with pi event system.
 */
export const createPiObserver = (ctx: ActionCtx) => {
  const userId = ctx.auth?.userId ?? 'anonymous'
  const sessionId = crypto.randomUUID()

  return {
    onSessionStart: (metadata: { model: string; temperature: number }) => {
      if (!PI_OBSERVABILITY_ENABLED) return
      backend.info('pi.session', 'Agent session started', {
        userId,
        sessionId,
        model: metadata.model,
        temperature: metadata.temperature,
      })
    },

    onSessionEnd: (result: { success: boolean; error?: string }) => {
      if (!PI_OBSERVABILITY_ENABLED) return
      backend.info('pi.session', 'Agent session ended', {
        userId,
        sessionId,
        success: result.success,
        error: result.error,
      })
    },

    onToolStart: (toolName: string, args: any) => {
      if (!PI_OBSERVABILITY_ENABLED) return
      backend.info('pi.tool', 'Tool execution started', {
        userId,
        sessionId,
        toolName,
        argKeys: Object.keys(args),
      })
    },

    onToolEnd: (toolName: string, result: any) => {
      if (!PI_OBSERVABILITY_ENABLED) return
      backend.info('pi.tool', 'Tool execution completed', {
        userId,
        sessionId,
        toolName,
      })
    },

    onToolError: (toolName: string, error: Error) => {
      if (!PI_OBSERVABILITY_ENABLED) return
      backend.error('pi.tool', 'Tool execution failed', error, {
        userId,
        sessionId,
        toolName,
      })
    },

    onLlmRequestStart: (params: { model: string; promptTokens: number }) => {
      if (!PI_OBSERVABILITY_ENABLED) return
      backend.info('pi.llm', 'LLM request started', {
        userId,
        sessionId,
        model: params.model,
        promptTokens: params.promptTokens,
      })
    },

    onLlmRequestEnd: (result: { totalTokens: number; finishReason: string }) => {
      if (!PI_OBSERVABILITY_ENABLED) return
      backend.info('pi.llm', 'LLM request completed', {
        userId,
        sessionId,
        totalTokens: result.totalTokens,
        finishReason: result.finishReason,
      })
    },
  }
}
```

- [ ] **Step 2: Run type check**

```bash
pnpm type-check
```

Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add convex/actions/agent/lib/piObserver.ts
git commit -m "feat: add pi event observer to replace LangSmith tracing"
```

---

## Task 5: Create Agent Session Factory

**Files:**
- Create: `convex/actions/agent/lib/piSession.ts`

- [ ] **Step 1: Write AgentSession factory**

```typescript
'use node'

import type { ActionCtx } from '../../../_generated/server'
import { OPENAI_API_KEY, PI_MODEL, PI_TEMPERATURE } from '../../../lib/env'
import { createPiObserver } from './piObserver'
import { createRoutePlanningExtension } from '../extensions/routePlanningExtension'

/**
 * Creates a configured pi AgentSession for route planning.
 *
 * This factory:
 * - Validates OPENAI_API_KEY is configured
 * - Creates event observer for logging
 * - Initializes route planning extension with tools
 * - Returns AgentSession ready for prompting
 *
 * @throws {Error} If OPENAI_API_KEY is not configured
 */
export const createAgentSession = async (ctx: ActionCtx) => {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required for route planning')
  }

  const observer = createPiObserver(ctx)
  const extension = createRoutePlanningExtension(ctx)

  // Import pi SDK dynamically to avoid module resolution issues
  const { createSession } = await import('@mariozechner/pi-agent-core')

  const session = createSession({
    model: `openai:${PI_MODEL}`,
    apiKey: OPENAI_API_KEY,
    temperature: PI_TEMPERATURE,
    observer,
    extensions: [extension],
  })

  return session
}
```

- [ ] **Step 2: Run type check**

```bash
pnpm type-check
```

Expected: May have type errors until extension is created in next task.

- [ ] **Step 3: Commit**

```bash
git add convex/actions/agent/lib/piSession.ts
git commit -m "feat: add pi AgentSession factory for route planning"
```

---

## Task 6: Create Route Planning Extension

**Files:**
- Create: `convex/actions/agent/extensions/routePlanningExtension.ts`

- [ ] **Step 1: Write route planning extension**

```typescript
'use node'

import type { ActionCtx } from '../../../_generated/server'
import { compileSketch } from '../tools/compileSketch'
import { computeRouteIndex } from '../tools/computeRouteIndex'
import { mapConditions } from '../tools/mapConditions'
import { normalizeRoute } from '../tools/normalizeRoute'
import { probeConditions } from '../tools/probeConditions'
import { createWeatherProvider } from '../providers/weatherProvider'
import { RoutePlanningValidators } from '../lib/piTools'

/**
 * Route planning extension for pi AgentSession.
 *
 * This extension:
 * - Provides system prompt for route sketching behavior
 * - Exposes all route planning tools to the agent
 * - Handles provider initialization (weather, routing)
 */
export const createRoutePlanningExtension = (ctx: ActionCtx) => {
  const weatherProvider = createWeatherProvider()

  const tools = [
    {
      name: 'compileSketch',
      description: 'Convert a route sketch into a provider route by calling routing API. Returns route geometry, legs, bounds, and metadata.',
      parameters: RoutePlanningValidators.PlanInput,
      handler: async (planInput: any, sketch: any) => {
        return await compileSketch({ planInput, sketch })
      },
    },

    {
      name: 'normalizeRoute',
      description: 'Normalize a provider route into a standard RouteSnapshot format with consistent geometry, legs, and metadata.',
      parameters: RoutePlanningValidators.RouteSnapshot,
      handler: async (providerRoute: any, planInput: any) => {
        return await normalizeRoute({ providerRoute, planInput })
      },
    },

    {
      name: 'computeRouteIndex',
      description: 'Build a spatial index for a route by sampling points along the route geometry. Returns fingerprint and sampled points for conditions mapping.',
      parameters: RoutePlanningValidators.RouteSnapshot,
      handler: async (routeSnapshot: any) => {
        return await computeRouteIndex(routeSnapshot)
      },
    },

    {
      name: 'probeConditions',
      description: 'Probe weather conditions (wind, temperature) at points along the route. Returns wind samples for each probed point.',
      parameters: RoutePlanningValidators.RouteIndex,
      handler: async (routeIndex: any, departureTimeMs: number) => {
        return await probeConditions({ routeIndex, departureTimeMs, weatherProvider })
      },
    },

    {
      name: 'mapConditions',
      description: 'Map probed weather conditions onto route legs as segments with wind levels (low/moderate/high). Returns wind overlay with legend and by-leg segments.',
      parameters: RoutePlanningValidators.ProbedConditions,
      handler: async (routeSnapshot: any, routeIndex: any, probed: any) => {
        return await mapConditions({ routeSnapshot, routeIndex, probed })
      },
    },
  ]

  const systemPrompt = buildSystemPrompt()

  return {
    name: 'routePlanning',
    tools,
    systemPrompt,
  }
}

/**
 * System prompt for route planning agent.
 */
const buildSystemPrompt = (): string => {
  return [
    'You are a motorcycle route planning agent.',
    '',
    'Your task is to generate 2-3 scenic route options based on user input.',
    '',
    'Route Planning Process:',
    '1. Generate route sketches with label, rationale, segments, and anchorPoints',
    '2. For each sketch:',
    '   - Call compileSketch to convert to provider route',
    '   - Call normalizeRoute to standardize format',
    '   - Call computeRouteIndex to build spatial index',
    '   - Call probeConditions to fetch weather data',
    '   - Call mapConditions to apply wind overlays',
    '3. Return structured route options with stats and overlays',
    '',
    'Route Sketch Format:',
    '- label: Human-readable route name',
    '- rationale: Why this route is scenic',
    '- segments: Array of {roadName, fromName, toName, viaNames?}',
    '- anchorPoints: Array of {name, kind, lat?, lng?}',
    '',
    'Constraints:',
    '- Maximum 10 segments per sketch',
    '- Prefer anchorPoints with lat/lng coordinates',
    '- Avoid highways and major roads for scenic routes',
    '- Consider elevation changes (passes, vistas)',
    '',
    'Error Handling:',
    '- If compileSketch fails, skip that sketch',
    '- If probeConditions fails, return route without weather data',
    '- Always return at least 1 valid route option',
  ].join('\n')
}
```

- [ ] **Step 2: Run type check**

```bash
pnpm type-check
```

Expected: No type errors (piSession should now resolve correctly).

- [ ] **Step 3: Commit**

```bash
git add convex/actions/agent/extensions/routePlanningExtension.ts
git commit -m "feat: add route planning extension with tools and system prompt"
```

---

## Task 7: Update planRide Action

**Files:**
- Modify: `convex/actions/agent/planRide.ts`

- [ ] **Step 1: Remove LangGraph import**

```typescript
// DELETE this line:
import { runPlanningGraph } from './graphs/planningGraph'
```

- [ ] **Step 2: Add pi session import**

```typescript
// ADD this import:
import { createAgentSession } from './lib/piSession'
```

- [ ] **Step 3: Replace handler implementation**

```typescript
// REPLACE the entire handler with:

export const planRide = action({
  args: { planInput: planInputValidator },
  returns: plannedRouteOptionsViewValidator,
  handler: async (ctx, args): Promise<PlannedRouteOptionsView> => {
    const session = await requireSession(ctx)

    backend.info('convex.action', 'planRide started', {
      userId: session.user._id,
      origin: args.planInput.start,
      destination: args.planInput.end,
      departureTime: args.planInput.departureTime,
    })

    // Create pi AgentSession with route planning extension
    const agentSession = await createAgentSession(ctx)

    // Build user prompt from PlanInput
    const userPrompt = buildUserPrompt(args.planInput)

    try {
      // Prompt agent to plan route
      const result = await agentSession.prompt(userPrompt, {
        userId: session.user._id,
        requestId: crypto.randomUUID(),
      })

      // Parse agent response into PlannedRouteOptionsView
      const parsed = parseAgentResponse(result)

      if (!parsed.options.length) {
        backend.error('convex.action', 'Agent produced no route options', new Error('NO_ROUTES_GENERATED'), {
          userId: session.user._id,
        })
        throw new Error('NO_ROUTES_GENERATED')
      }

      backend.info('convex.action', 'planRide completed successfully', {
        userId: session.user._id,
        optionsCount: parsed.options.length,
        planId: parsed.planId,
      })

      return parsed
    } catch (error) {
      backend.error('convex.action', 'Agent execution failed', error as Error, {
        userId: session.user._id,
      })
      throw error
    }
  },
})

/**
 * Build user prompt from PlanInput for agent.
 */
const buildUserPrompt = (planInput: any): string => {
  const parts = [
    'Plan a scenic motorcycle route.',
    '',
    'Route Details:',
    `- Start: ${planInput.start.label ?? `${planInput.start.lat},${planInput.start.lng}`}`,
    `- End: ${planInput.end.label ?? `${planInput.end.lat},${planInput.end.lng}`}`,
    `- Departure: ${new Date(planInput.departureTime).toISOString()}`,
    '',
    'Preferences:',
    `- Scenic bias: ${planInput.preferences?.scenicBias ?? 'default'}`,
    '',
    'Generate 2-3 route options using the available tools.',
    'Each option should include a label, rationale, and complete route geometry.',
  ]
  return parts.join('\n')
}

/**
 * Parse agent response into PlannedRouteOptionsView.
 */
const parseAgentResponse = (agentResponse: string): PlannedRouteOptionsView => {
  try {
    const parsed = JSON.parse(agentResponse)

    if (!parsed.options || !Array.isArray(parsed.options)) {
      throw new Error('Invalid agent response: missing options array')
    }

    return {
      planId: parsed.planId ?? crypto.randomUUID(),
      options: parsed.options,
    }
  } catch (error) {
    backend.error('convex.action', 'Failed to parse agent response', error as Error, {
      responseLength: agentResponse.length,
    })
    throw new Error('AGENT_RESPONSE_INVALID')
  }
}
```

- [ ] **Step 4: Run type check**

```bash
pnpm type-check
```

Expected: No type errors.

- [ ] **Step 5: Commit**

```bash
git add convex/actions/agent/planRide.ts
git commit -m "feat: use pi AgentSession for route planning"
```

---

## Task 8: Remove LangGraph Files

**Files:**
- Remove: `convex/actions/agent/graphs/`
- Remove: `convex/actions/agent/lib/tracing.ts`

- [ ] **Step 1: Remove LangGraph directory**

```bash
rm -rf convex/actions/agent/graphs
```

- [ ] **Step 2: Remove tracing file**

```bash
rm convex/actions/agent/lib/tracing.ts
```

- [ ] **Step 3: Stage deletions**

```bash
git add convex/actions/agent/graphs convex/actions/agent/lib/tracing.ts
```

- [ ] **Step 4: Commit**

```bash
git commit -m "refactor: remove LangGraph and LangSmith tracing files"
```

---

## Task 9: Create Extension Tests

**Files:**
- Create: `convex/actions/agent/extensions/__tests__/routePlanningExtension.test.ts`

- [ ] **Step 1: Write failing test for extension creation**

```typescript
'use node'

import { describe, it, expect, beforeEach, jest } from 'vitest'
import { createRoutePlanningExtension } from '../routePlanningExtension'

// Mock all tools
jest.mock('../../tools/compileSketch')
jest.mock('../../tools/normalizeRoute')
jest.mock('../../tools/computeRouteIndex')
jest.mock('../../tools/probeConditions')
jest.mock('../../tools/mapConditions')
jest.mock('../../providers/weatherProvider')

describe('routePlanningExtension', () => {
  const mockCtx = {} as any

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates extension with all tools', () => {
    const extension = createRoutePlanningExtension(mockCtx)

    expect(extension.name).toBe('routePlanning')
    expect(extension.tools).toHaveLength(5)
    expect(extension.tools.map((t: any) => t.name)).toEqual([
      'compileSketch',
      'normalizeRoute',
      'computeRouteIndex',
      'probeConditions',
      'mapConditions',
    ])
  })

  it('includes system prompt for route sketching', () => {
    const extension = createRoutePlanningExtension(mockCtx)

    expect(extension.systemPrompt).toContain('motorcycle route planning')
    expect(extension.systemPrompt).toContain('route sketches')
    expect(extension.systemPrompt).toContain('scenic')
  })

  it('tool definitions have correct metadata', () => {
    const extension = createRoutePlanningExtension(mockCtx)
    const compileTool = extension.tools.find((t: any) => t.name === 'compileSketch')

    expect(compileTool).toBeDefined()
    expect(compileTool?.description).toContain('convert')
    expect(compileTool?.description).toContain('route sketch')
    expect(compileTool?.parameters).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test convex/actions/agent/extensions/__tests__/routePlanningExtension.test.ts
```

Expected: Tests pass (extension is already created).

- [ ] **Step 3: Commit**

```bash
git add convex/actions/agent/extensions/__tests__/routePlanningExtension.test.ts
git commit -m "test: add extension tests"
```

---

## Task 10: Create Observer Tests

**Files:**
- Create: `convex/actions/agent/lib/__tests__/piObserver.test.ts`

- [ ] **Step 1: Write failing test for observer**

```typescript
'use node'

import { describe, it, expect, beforeEach, jest } from 'vitest'
import { createPiObserver } from '../piObserver'
import { backend } from '../../lib/logger'

// Mock logger
jest.mock('../../lib/logger', () => ({
  backend: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  },
}))

describe('piObserver', () => {
  const mockCtx = {
    auth: { userId: 'test-user-123' },
  } as any

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates observer with lifecycle handlers', () => {
    const observer = createPiObserver(mockCtx)

    expect(observer.onSessionStart).toBeDefined()
    expect(observer.onSessionEnd).toBeDefined()
    expect(observer.onToolStart).toBeDefined()
    expect(observer.onToolEnd).toBeDefined()
    expect(observer.onToolError).toBeDefined()
    expect(observer.onLlmRequestStart).toBeDefined()
    expect(observer.onLlmRequestEnd).toBeDefined()
  })

  it('logs session start event', () => {
    const observer = createPiObserver(mockCtx)

    observer.onSessionStart({ model: 'gpt-4o', temperature: 0 })

    expect(backend.info).toHaveBeenCalledWith(
      'pi.session',
      'Agent session started',
      expect.objectContaining({
        userId: 'test-user-123',
        model: 'gpt-4o',
        temperature: 0,
      })
    )
  })

  it('logs tool execution events', () => {
    const observer = createPiObserver(mockCtx)

    observer.onToolStart('compileSketch', { sketch: {} })
    observer.onToolEnd('compileSketch', { route: {} })

    expect(backend.info).toHaveBeenCalledWith(
      'pi.tool',
      'Tool execution started',
      expect.objectContaining({
        toolName: 'compileSketch',
      })
    )
  })
})
```

- [ ] **Step 2: Run test to verify it passes**

```bash
pnpm test convex/actions/agent/lib/__tests__/piObserver.test.ts
```

Expected: Tests pass.

- [ ] **Step 3: Commit**

```bash
git add convex/actions/agent/lib/__tests__/piObserver.test.ts
git commit -m "test: add observer tests"
```

---

## Task 11: Update planRide Tests

**Files:**
- Modify: `convex/actions/agent/__tests__/planRide.test.ts`

- [ ] **Step 1: Replace LangGraph mocks with pi mocks**

```typescript
// REPLACE mock imports:

// OLD (remove):
// import { runPlanningGraph } from '../graphs/planningGraph'
// jest.mock('../graphs/planningGraph')

// NEW (add):
import { createAgentSession } from '../lib/piSession'
jest.mock('../lib/piSession')
```

- [ ] **Step 2: Update test cases**

```typescript
// REPLACE test implementation:

describe('planRide action (pi SDK)', () => {
  const mockCtx = {} as unknown as any

  beforeEach(() => {
    jest.clearAllMocks()
    ;(requireSession as jest.Mock).mockResolvedValue(mockSession)
  })

  it('creates AgentSession and prompts for route planning', async () => {
    const mockAgentResponse = {
      planId: 'test-plan-id',
      options: [
        {
          routeOptionId: 'opt-1',
          label: 'Scenic Route 1',
          rationale: 'Coastal views',
          stats: {
            distanceMeters: 50000,
            durationSeconds: 3600,
            legsCount: 1,
          },
          map: {
            bounds: { north: 1, south: 0, east: 1, west: 0 },
            overviewGeometry: {
              format: 'polyline',
              encoding: 'utf8',
              precision: 5,
              value: 'OVERVIEW',
            },
            legs: [
              {
                legIndex: 0,
                start: { lat: 0, lng: 0 },
                end: { lat: 1, lng: 1 },
                distanceMeters: 50000,
                durationSeconds: 3600,
                geometry: {
                  format: 'polyline',
                  encoding: 'utf8',
                  precision: 5,
                  value: 'LEG',
                },
              },
            ],
          },
          overlaysPreview: {
            windSummary: 'moderate',
            rainSummary: 'unavailable',
            temperatureSummary: 'mild',
            maxTemperatureF: 65,
            conditionsStatus: 'ok',
          },
        },
      ],
    }

    const mockSession = {
      prompt: jest.fn().mockResolvedValue(JSON.stringify(mockAgentResponse)),
    }
    ;(createAgentSession as jest.Mock).mockResolvedValue(mockSession)

    const planInput = {
      start: { lat: 37.0, lng: -122.0, label: 'San Francisco' },
      end: { lat: 37.1, lng: -122.1, label: 'Half Moon Bay' },
      departureTime: Date.UTC(2026, 0, 1, 12, 0, 0),
      preferences: { scenicBias: 'default' },
    }

    const result = await (planRide as any).handler(mockCtx, { planInput })

    expect(createAgentSession).toHaveBeenCalledWith(mockCtx)
    expect(mockSession.prompt).toHaveBeenCalledWith(
      expect.stringContaining('Plan a scenic motorcycle route'),
      expect.objectContaining({
        userId: 'user-id-123',
      })
    )
    expect(result.planId).toBe('test-plan-id')
    expect(result.options).toHaveLength(1)
  })

  it('throws error when agent produces no options', async () => {
    const mockSession = {
      prompt: jest.fn().mockResolvedValue(JSON.stringify({ planId: 'test', options: [] })),
    }
    ;(createAgentSession as jest.Mock).mockResolvedValue(mockSession)

    const planInput = {
      start: { lat: 0, lng: 0 },
      end: { lat: 1, lng: 1 },
      departureTime: Date.now(),
    }

    await expect((planRide as any).handler(mockCtx, { planInput })).rejects.toThrow('NO_ROUTES_GENERATED')
  })
})
```

- [ ] **Step 3: Run tests**

```bash
pnpm test convex/actions/agent/__tests__/planRide.test.ts
```

Expected: Tests pass.

- [ ] **Step 4: Commit**

```bash
git add convex/actions/agent/__tests__/planRide.test.ts
git commit -m "test: update planRide tests for pi SDK"
```

---

## Task 12: Run Full Test Suite

**Files:**
- Test: All tests

- [ ] **Step 1: Run all tests**

```bash
pnpm test
```

Expected: All tests pass. If any fail, debug and fix.

- [ ] **Step 2: Run type check**

```bash
pnpm type-check
```

Expected: No type errors.

- [ ] **Step 3: Commit any fixes**

```bash
git add .
git commit -m "fix: resolve test failures from pi migration"
```

---

## Task 13: Verification and Cleanup

**Files:**
- Verify: All changes

- [ ] **Step 1: Verify Convex build**

```bash
npx convex dev --once
```

Expected: Convex builds successfully without errors.

- [ ] **Step 2: Check for any remaining LangChain references**

```bash
grep -r "langchain" convex/ --exclude-dir=node_modules
grep -r "LangGraph" convex/ --exclude-dir=node_modules
grep -r "langsmith" convex/ --exclude-dir=node_modules
```

Expected: No results (or only in comments/history).

- [ ] **Step 3: Update documentation**

If you have a README or docs that mention LangChain, update them to reference pi SDK.

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "docs: update references from LangChain to pi SDK"
```

---

## Verification Steps

After completing all tasks:

1. **Dependencies verified**: `pnpm install` succeeds
2. **Type check passes**: `pnpm type-check` shows no errors
3. **Tests pass**: `pnpm test` shows all tests passing
4. **Convex builds**: `npx convex dev --once` succeeds
5. **No LangChain references**: `grep -r "langchain"` returns no results in source files

---

## Rollback Plan

If issues arise:

1. Revert to pre-migration commit: `git revert <migration-commit>`
2. Feature flag approach: Add `USE_PI_AGENT` env var to conditionally use pi or LangChain
3. Monitor error rates and latency post-deployment

---

## Open Questions for Implementation

1. **pi SDK import path**: Verify correct import from `@mariozechner/pi-agent-core`
2. **AgentSession API**: Confirm `createSession()` and `prompt()` methods match actual SDK
3. **Extension format**: Validate tool definition structure matches pi's expectations
4. **Event system**: Ensure observer hooks match pi's actual event types

Research these during implementation by referencing:
- https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent/docs
- https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent/examples/sdk
