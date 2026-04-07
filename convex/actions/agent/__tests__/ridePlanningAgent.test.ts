'use node'

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildSystemPrompt, executeRidePlanningAgent, extractRouteAttachments } from '../ridePlanningAgent'

// -----------------------------------------------------------------------------
// Mocks
// -----------------------------------------------------------------------------

// Mock pi-ai: keep TypeBox Type/Static exports intact (piTools.ts needs them),
// only replace the runtime functions the agent uses.
vi.mock('@mariozechner/pi-ai', async () => {
  const actual = await vi.importActual('@mariozechner/pi-ai') as Record<string, unknown>
  return {
    ...actual,
    stream: vi.fn(),
    getModel: vi.fn(() => ({ api: 'openai-completions', provider: 'openai', name: 'gpt-4o' })),
    validateToolCall: vi.fn((_tools: unknown, toolCall: { arguments: unknown }) => toolCall.arguments),
  }
})

// Mock geocoding provider so no HTTP calls are made.
vi.mock('../providers/geocodingProvider', () => ({
  createGeocodingProvider: vi.fn(() => ({
    geocode: vi.fn().mockResolvedValue([
      { lat: 36.97, lng: -122.03, label: 'Santa Cruz, CA', placeId: 'place_sc', types: ['locality'] },
    ]),
  })),
}))

// Mock the route planning orchestrator.
vi.mock('../lib/planRideOrchestrator', () => ({
  planRideOrchestrator: vi.fn(),
}))

// Mock buildOptionsFromResults so we control the returned planId.
vi.mock('../planRide', () => ({
  buildOptionsFromResults: vi.fn(() => ({
    planId: 'plan_abc',
    options: [{ routeOptionId: 'opt1', label: 'Scenic Route', rationale: 'Nice views' }],
  })),
}))

// Mock env — provide all required keys so the module loads without throwing.
vi.mock('../../../lib/env', () => ({
  OPENAI_API_KEY: 'test-openai-key',
  GOOGLE_GENERATIVE_AI_API_KEY: 'test-google-ai-key',
  ANTHROPIC_API_KEY: 'test-anthropic-key',
  AI_MODEL: 'claude-sonnet-4.6',
  AI_PROVIDER: 'anthropic',
  GOOGLE_MAPS_API_KEY: 'test-google-key',
  CLERK_WEBHOOK_SECRET: 'test-clerk-webhook-secret',
  CLERK_JWT_ISSUER_DOMAIN: 'test-clerk-jwt-issuer-domain',
  CLERK_SECRET_KEY: 'test-clerk-secret-key',
  isTestEnvironment: true,
}))

// Mock internal Convex API references used by the agent (checkUsageInternal, etc.).
// The vitest alias already provides a deep proxy for _generated/api, but vi.mock
// lets individual tests override ctx.runQuery return values cleanly.
vi.mock('../../../_generated/api', () => ({
  api: {
    db: {
      planningSessions: {
        getSessionById: { __fake: true },
      },
    },
  },
  internal: {
    db: {
      planUsage: {
        checkUsageInternal: { __fake: true },
        incrementUsageInternal: { __fake: true },
      },
      routePlans: {
        createForAgentInternal: { __fake: true },
        updatePlanStatus: { __fake: true },
        listBySession: { __fake: true },
      },
    },
  },
}))

// Mock sessionContext so buildInSessionRouteBlock can be controlled per test.
vi.mock('../sessionContext', () => ({
  buildInSessionRouteBlock: vi.fn().mockResolvedValue(''),
}))

// Mock the 7 new tool implementations so tests don't make HTTP calls.
vi.mock('../tools/lookupRoad', () => ({
  lookupRoad: vi.fn().mockResolvedValue({
    exists: true,
    status: 'found',
    matches: [
      { name: 'Skyline Blvd', highway: 'secondary', surface: 'asphalt', geometry: [{ lat: 37.3, lng: -122.1 }, { lat: 37.4, lng: -122.2 }] },
    ],
  }),
}))

vi.mock('../tools/getCurvature', () => ({
  getCurvature: vi.fn().mockResolvedValue({
    score: 2400,
    rating: 'very_twisty',
    kmCornering: 12.3,
    segmentCount: 10,
    surface: 'asphalt',
    status: 'ok',
  }),
}))

vi.mock('../tools/checkSurface', () => ({
  classifySurface: vi.fn().mockReturnValue({
    surface: 'paved',
    material: 'asphalt',
    confidence: 'confirmed',
  }),
}))

vi.mock('../tools/getElevation', () => ({
  getElevation: vi.fn().mockResolvedValue({
    status: 'ok',
    totalGainFt: 1200,
    totalLossFt: 800,
    maxElevationFt: 2800,
    maxGradePct: 9.5,
    steepSegments: [],
  }),
}))

vi.mock('../tools/searchAlongRoute', () => ({
  searchAlongRoute: vi.fn().mockResolvedValue([
    { name: 'Alice\'s Restaurant', address: '17288 Skyline Blvd, Woodside, CA', types: ['restaurant'] },
  ]),
}))

vi.mock('../tools/getRouteWeather', () => ({
  getRouteWeather: vi.fn().mockResolvedValue({
    status: 'ok',
    segments: [{ lat: 37.3, lng: -122.1, tempC: 15, windSpeedKph: 10, rainProbabilityPct: 5, fog: false }],
    routeWeatherSummary: 'Temperature: 15°C. Light winds (10 km/h). Low rain probability (5%).',
  }),
}))

vi.mock('../tools/getUserFavorites', () => ({
  getUserFavorites: vi.fn().mockResolvedValue([
    { roadName: 'Skyline Blvd', rating: 5, rideCount: 12, lastRidden: '2024-03-15' },
  ]),
}))

// Mock compileSketch tools so per-segment path can be unit-tested without HTTP calls.
vi.mock('../tools/compileSketch', () => ({
  compileSketch: vi.fn(),
  compileSegments: vi.fn(),
  stitchSegments: vi.fn(),
}))

// Mock normalizeRoute so route normalization can be controlled per test.
vi.mock('../tools/normalizeRoute', () => ({
  normalizeRoute: vi.fn(),
}))

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/**
 * Build a minimal AssistantMessage shaped object that satisfies the pi-ai type.
 */
const makeAssistantMessage = (
  content: (
    | { type: 'text'; text: string }
    | { type: 'toolCall'; id: string; name: string; arguments: Record<string, unknown> }
  )[],
  stopReason: 'stop' | 'toolUse' = 'stop'
) => ({
  role: 'assistant' as const,
  content,
  api: 'openai-completions' as const,
  provider: 'openai' as const,
  model: 'gpt-4o',
  usage: {
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
    totalTokens: 0,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
  },
  stopReason,
  timestamp: Date.now(),
})

/**
 * Build a mock AssistantMessageEventStream that yields the given events
 * then resolves result() with the provided AssistantMessage.
 *
 * The agent loop uses:
 *   for await (const event of eventStream) { ... }
 *   const assistant = await eventStream.result()
 *
 * We simulate this by returning an object that is both async-iterable and
 * has a result() method.
 */
type MockEvent = { type: string; [key: string]: unknown }

const makeMockStream = (events: MockEvent[], resultMessage: ReturnType<typeof makeAssistantMessage>) => {
  const mockStream = {
    [Symbol.asyncIterator]: async function* () {
      for (const ev of events) {
        yield ev
      }
    },
    result: vi.fn().mockResolvedValue(resultMessage),
  }
  return mockStream
}

/**
 * Shorthand: create a stream that just emits a done event and resolves to
 * the given AssistantMessage (the common case for most existing tests).
 */
const makeSimpleStream = (assistantMessage: ReturnType<typeof makeAssistantMessage>) => {
  const doneEvent: MockEvent = {
    type: 'done',
    reason: assistantMessage.stopReason === 'toolUse' ? 'toolUse' : 'stop',
    message: assistantMessage,
  }
  return makeMockStream([doneEvent], assistantMessage)
}

const makeAgentContext = () => ({
  planningSessionId: 'session_test' as any,
  clerkUserId: 'user_test',
  piMessages: [] as any[],
  currentLocation: { lat: 37.77, lng: -122.42 },
  runQuery: vi.fn().mockResolvedValue({ allowed: true, remaining: 4 }),
  // runPlanRoute calls runMutation three times:
  //  1. createForAgentInternal → { routePlanId }
  //  2. updatePlanStatus       → null (completed OR failed)
  //  3. incrementUsageInternal → null  (success path only)
  // We return { routePlanId } uniformly — the status/usage mutations ignore
  // the return value, so over-returning is harmless.
  runMutation: vi.fn().mockResolvedValue({ routePlanId: 'rp_test' }),
})

// -----------------------------------------------------------------------------
// Tests: buildSystemPrompt
// -----------------------------------------------------------------------------

describe('buildSystemPrompt', () => {
  let buildInSessionRouteBlockMock: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.clearAllMocks()
    const sessionContextMod = await import('../sessionContext') as any
    buildInSessionRouteBlockMock = sessionContextMod.buildInSessionRouteBlock
    buildInSessionRouteBlockMock.mockResolvedValue('')
  })

  it('includes device location and instructs the agent not to ask for origin when currentLocation is set', async () => {
    const ctx = {
      planningSessionId: 'session_test' as any,
      clerkUserId: 'user_test',
      piMessages: [],
      currentLocation: { lat: 37.77, lng: -122.42 },
      runQuery: vi.fn(),
      runMutation: vi.fn(),
    }

    const prompt = await buildSystemPrompt(ctx)

    expect(prompt).toContain('lat=37.77, lng=-122.42')
    expect(prompt).toContain('Use this as the default origin')
    expect(prompt).toContain('Do NOT ask "where are you starting from?"')
  })

  it('omits device location and prompts to ask when currentLocation is undefined and no lastKnownLocation', async () => {
    const ctx = {
      planningSessionId: 'session_test' as any,
      clerkUserId: 'user_test',
      piMessages: [],
      currentLocation: undefined,
      runQuery: vi.fn().mockResolvedValue({ lastKnownLocation: undefined }),
      runMutation: vi.fn(),
    }

    const prompt = await buildSystemPrompt(ctx)

    expect(prompt).not.toContain('lat=')
    expect(prompt).toContain('ask where they are starting from')
    expect(prompt).not.toContain('Do NOT ask')
  })

  it('uses lastKnownLocation fallback when currentLocation is undefined but session has lastKnownLocation', async () => {
    const ctx = {
      planningSessionId: 'session_test' as any,
      clerkUserId: 'user_test',
      piMessages: [],
      currentLocation: undefined,
      runQuery: vi.fn().mockResolvedValue({
        lastKnownLocation: { lat: 34.05, lng: -118.24, updatedAt: Date.now() },
      }),
      runMutation: vi.fn(),
    }

    const prompt = await buildSystemPrompt(ctx)

    expect(prompt).toContain('last known location')
    expect(prompt).toContain('lat=34.05, lng=-118.24')
    expect(prompt).toContain('may be stale')
    expect(prompt).not.toContain('ask where they are starting from')
  })

  it('includes route summary block when buildInSessionRouteBlock returns content', async () => {
    buildInSessionRouteBlockMock.mockResolvedValue(
      'Routes already planned this session:\n1. SF → Santa Cruz: 75mi · 90min · scenic'
    )
    const ctx = {
      planningSessionId: 'session_test' as any,
      clerkUserId: 'user_test',
      piMessages: [],
      currentLocation: { lat: 37.77, lng: -122.42 },
      runQuery: vi.fn(),
      runMutation: vi.fn(),
    }

    const prompt = await buildSystemPrompt(ctx)

    expect(prompt).toContain('Routes already planned this session:')
    expect(prompt).toContain('SF → Santa Cruz')
  })

  it('has no extra blank lines when buildInSessionRouteBlock returns empty string', async () => {
    buildInSessionRouteBlockMock.mockResolvedValue('')
    const ctx = {
      planningSessionId: 'session_test' as any,
      clerkUserId: 'user_test',
      piMessages: [],
      currentLocation: { lat: 37.77, lng: -122.42 },
      runQuery: vi.fn(),
      runMutation: vi.fn(),
    }

    const prompt = await buildSystemPrompt(ctx)

    // Should not have consecutive blank lines caused by empty routeBlock
    expect(prompt).not.toMatch(/\n{3,}/)
    expect(prompt).not.toContain('Routes already planned')
  })

  // ---------------------------------------------------------------------------
  // US-024: LLM-first prompt guidance
  // ---------------------------------------------------------------------------

  const makeMinimalCtx = () => ({
    planningSessionId: 'session_test' as any,
    clerkUserId: 'user_test',
    piMessages: [] as any[],
    currentLocation: { lat: 37.77, lng: -122.42 },
    runQuery: vi.fn(),
    runMutation: vi.fn(),
  })

  it('llm-first prompt: instructs LLM to author a route sketch for all requests', async () => {
    const ctx = makeMinimalCtx()
    const prompt = await buildSystemPrompt(ctx)

    // Must instruct the LLM to use createRouteSketch as the default first step
    expect(prompt).toContain('createRouteSketch')
    // Must communicate the always-sketch-first principle
    expect(prompt.toLowerCase()).toMatch(/any route request|every route request|all.*request/)
  })

  it('avoid guidance: instructs LLM to route around avoidances in the sketch, not via avoidRoads API', async () => {
    const ctx = makeMinimalCtx()
    const prompt = await buildSystemPrompt(ctx)

    // Prompt must tell LLM to handle avoidance in the sketch
    expect(prompt.toLowerCase()).toMatch(/avoid.*sketch|route around.*sketch|sketch.*avoid/)
    // Must explicitly say no avoidRoads API is needed
    expect(prompt).toMatch(/no.*avoidRoads|avoidRoads.*not needed|avoid.*sketch.*no.*API/i)
  })

  it('fallback guidance: instructs LLM to fall back to planRoute when uncertain', async () => {
    const ctx = makeMinimalCtx()
    const prompt = await buildSystemPrompt(ctx)

    // Must mention planRoute as available fallback
    expect(prompt).toContain('planRoute')
    // Must state the fallback condition (uncertainty)
    expect(prompt.toLowerCase()).toMatch(/uncertain|unsure|don.t know|genuinely/)
  })

  it('planRoute available: preserves planRoute as an available tool in the prompt', async () => {
    const ctx = makeMinimalCtx()
    const prompt = await buildSystemPrompt(ctx)

    // planRoute must remain mentioned as a tool option (fallback)
    expect(prompt).toContain('planRoute')
  })

  it('llm-first prompt: includes viaNames guidance for intermediate landmarks', async () => {
    const ctx = makeMinimalCtx()
    const prompt = await buildSystemPrompt(ctx)

    expect(prompt).toContain('viaNames')
  })

  it('llm-first prompt: includes segment retry hint', async () => {
    const ctx = makeMinimalCtx()
    const prompt = await buildSystemPrompt(ctx)

    // Must mention that failed segments can be revised individually
    expect(prompt.toLowerCase()).toMatch(/fail|didn.t work|revise/)
  })
})

// -----------------------------------------------------------------------------
// Tests: extractRouteAttachments (pure function)
// -----------------------------------------------------------------------------

describe('extractRouteAttachments', () => {
  it('returns attachment with the Convex routePlanId when planRoute persisted a route_plans row', () => {
    const toolResults = [
      {
        toolName: 'planRoute',
        result: {
          type: 'routes',
          data: { planId: 'abc123', options: [] },
          routePlanId: 'rp_convex_id',
        },
      },
    ]

    const attachments = extractRouteAttachments(toolResults)

    expect(attachments).toHaveLength(1)
    expect(attachments[0]).toEqual({ type: 'route_options', routePlanId: 'rp_convex_id' })
  })

  it('returns empty array when planRoute result has no routePlanId', () => {
    const toolResults = [
      {
        toolName: 'planRoute',
        result: { type: 'routes', data: { planId: 'abc123', options: [] } },
      },
    ]

    expect(extractRouteAttachments(toolResults)).toHaveLength(0)
  })

  it('returns empty array when toolName is not planRoute', () => {
    const toolResults = [
      {
        toolName: 'geocode',
        result: { results: [{ lat: 36.97, lng: -122.03, label: 'Santa Cruz' }] },
      },
    ]

    const attachments = extractRouteAttachments(toolResults)

    expect(attachments).toHaveLength(0)
  })

  it('returns empty array when planRoute result type is chat not routes', () => {
    const toolResults = [
      {
        toolName: 'planRoute',
        result: { type: 'chat', message: "You've reached your monthly limit." },
      },
    ]

    const attachments = extractRouteAttachments(toolResults)

    expect(attachments).toHaveLength(0)
  })

  it('returns empty array for an empty input array', () => {
    expect(extractRouteAttachments([])).toHaveLength(0)
  })

  it('returns multiple attachments when multiple planRoute results are present', () => {
    const toolResults = [
      {
        toolName: 'planRoute',
        result: {
          type: 'routes',
          data: { planId: 'plan_1', options: [] },
          routePlanId: 'rp_1',
        },
      },
      {
        toolName: 'geocode',
        result: { results: [] },
      },
      {
        toolName: 'planRoute',
        result: {
          type: 'routes',
          data: { planId: 'plan_2', options: [] },
          routePlanId: 'rp_2',
        },
      },
    ]

    const attachments = extractRouteAttachments(toolResults)

    expect(attachments).toHaveLength(2)
    expect(attachments[0]).toEqual({ type: 'route_options', routePlanId: 'rp_1' })
    expect(attachments[1]).toEqual({ type: 'route_options', routePlanId: 'rp_2' })
  })
})

// -----------------------------------------------------------------------------
// Tests: executeRidePlanningAgent (agent loop integration)
// -----------------------------------------------------------------------------

describe('executeRidePlanningAgent', () => {
  let mockStream: ReturnType<typeof vi.fn>
  let planRideOrchestrator: ReturnType<typeof vi.fn>
  let buildOptionsFromResults: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.clearAllMocks()
    // Re-acquire mock references after clearAllMocks.
    const piAi = await import('@mariozechner/pi-ai') as any
    mockStream = piAi.stream

    const orchestratorMod = await import('../lib/planRideOrchestrator') as any
    planRideOrchestrator = orchestratorMod.planRideOrchestrator

    const planRideMod = await import('../planRide') as any
    buildOptionsFromResults = planRideMod.buildOptionsFromResults
    // Restore the default return value after clearAllMocks wiped it.
    buildOptionsFromResults.mockReturnValue({
      planId: 'plan_abc',
      options: [{ routeOptionId: 'opt1', label: 'Scenic Route', rationale: 'Nice views' }],
    })

    // Restore buildInSessionRouteBlock default (returns "" so no route block in prompt).
    const sessionContextMod = await import('../sessionContext') as any
    sessionContextMod.buildInSessionRouteBlock.mockResolvedValue('')
  })

  it('returns text response with no attachments for a single-turn chat', async () => {
    const msg = makeAssistantMessage([{ type: 'text', text: 'Hello! How can I help you plan your ride?' }], 'stop')
    mockStream.mockReturnValueOnce(makeSimpleStream(msg))

    const ctx = makeAgentContext()
    const result = await executeRidePlanningAgent(ctx, 'hello')

    expect(mockStream).toHaveBeenCalledTimes(1)
    expect(result.response).toBe('Hello! How can I help you plan your ride?')
    expect(result.attachments).toBeUndefined()
    expect(planRideOrchestrator).not.toHaveBeenCalled()
  })

  it('calls planRoute tool then returns text with route attachment', async () => {
    // First call: agent wants to plan a route.
    const toolCallMsg = makeAssistantMessage(
      [
        {
          type: 'toolCall',
          id: 'tc1',
          name: 'planRoute',
          arguments: {
            start: { lat: 37.77, lng: -122.42, label: null },
            end: { lat: 36.97, lng: -122.03, label: 'Santa Cruz, CA' },
            departureTime: Date.now() + 3_600_000,
            preferences: { scenicBias: 'high', avoidHighways: false, avoidTolls: false },
          },
        },
      ],
      'toolUse'
    )
    // Second call: agent summarises.
    const textMsg = makeAssistantMessage([{ type: 'text', text: 'Here are 3 scenic routes to Santa Cruz.' }], 'stop')
    mockStream
      .mockReturnValueOnce(makeSimpleStream(toolCallMsg))
      .mockReturnValueOnce(makeSimpleStream(textMsg))

    planRideOrchestrator.mockResolvedValue([])

    const ctx = makeAgentContext()
    const result = await executeRidePlanningAgent(ctx, 'plan a scenic ride to Santa Cruz')

    expect(mockStream).toHaveBeenCalledTimes(2)
    expect(planRideOrchestrator).toHaveBeenCalledTimes(1)
    // runPlanRoute writes the route_plans row (create → finalize) and
    // increments usage after a successful planRoute: three mutations.
    expect(ctx.runMutation).toHaveBeenCalledTimes(3)
    expect(result.response).toBe('Here are 3 scenic routes to Santa Cruz.')
    expect(result.attachments).toEqual([
      { type: 'route_options', routePlanId: 'rp_test' },
    ])
  })

  it('passes planningSessionId to createForAgentInternal when planRoute tool runs', async () => {
    const toolCallMsg = makeAssistantMessage(
      [
        {
          type: 'toolCall',
          id: 'tc_session',
          name: 'planRoute',
          arguments: {
            start: { lat: 37.77, lng: -122.42, label: null },
            end: { lat: 36.97, lng: -122.03, label: 'Santa Cruz, CA' },
            departureTime: Date.now() + 3_600_000,
            preferences: { scenicBias: 'default', avoidHighways: false, avoidTolls: false },
          },
        },
      ],
      'toolUse'
    )
    const textMsg = makeAssistantMessage([{ type: 'text', text: 'Routes ready.' }], 'stop')
    mockStream
      .mockReturnValueOnce(makeSimpleStream(toolCallMsg))
      .mockReturnValueOnce(makeSimpleStream(textMsg))

    planRideOrchestrator.mockResolvedValue([])

    const ctx = makeAgentContext()
    await executeRidePlanningAgent(ctx, 'plan a ride to Santa Cruz')

    // The first runMutation call must be createForAgentInternal.
    // Verify it received planningSessionId from ctx.planningSessionId.
    const { internal: internalApi } = await import('../../../_generated/api') as any
    const firstCall = ctx.runMutation.mock.calls[0]
    expect(firstCall[0]).toBe(internalApi.db.routePlans.createForAgentInternal)
    expect(firstCall[1]).toMatchObject({ planningSessionId: 'session_test' })
  })

  it('does not call orchestrator and returns upsell message when usage limit is reached', async () => {
    // First stream call: agent tries to plan a route.
    const toolCallMsg = makeAssistantMessage(
      [
        {
          type: 'toolCall',
          id: 'tc_rate',
          name: 'planRoute',
          arguments: {
            start: { lat: 37.77, lng: -122.42, label: null },
            end: { lat: 36.97, lng: -122.03, label: 'Santa Cruz' },
            departureTime: Date.now() + 3_600_000,
            preferences: { scenicBias: 'default', avoidHighways: false, avoidTolls: false },
          },
        },
      ],
      'toolUse'
    )
    // Second stream call: agent returns the upsell text from the tool result.
    const upsellMsg = makeAssistantMessage(
      [{ type: 'text', text: "You've reached your monthly limit. Upgrade to Premium!" }],
      'stop'
    )
    mockStream
      .mockReturnValueOnce(makeSimpleStream(toolCallMsg))
      .mockReturnValueOnce(makeSimpleStream(upsellMsg))

    const ctx = makeAgentContext()
    // Usage check fails.
    ctx.runQuery.mockResolvedValue({ allowed: false, remaining: 0 })

    const result = await executeRidePlanningAgent(ctx, 'plan a ride to Santa Cruz')

    // Orchestrator must NOT be called when rate-limited.
    expect(planRideOrchestrator).not.toHaveBeenCalled()
    // Usage must NOT be incremented.
    expect(ctx.runMutation).not.toHaveBeenCalled()
    // The final response comes from the second stream call.
    expect(result.response).toBe("You've reached your monthly limit. Upgrade to Premium!")
    // No route attachment since no route was actually planned.
    expect(result.attachments).toBeUndefined()
  })

  it('executes geocode then planRoute then text (multi-step)', async () => {
    // Step 1: geocode.
    const geoMsg = makeAssistantMessage(
      [{ type: 'toolCall', id: 'tc_geo', name: 'geocode', arguments: { query: 'Santa Cruz' } }],
      'toolUse'
    )
    // Step 2: planRoute using geocoded coords.
    const planMsg = makeAssistantMessage(
      [
        {
          type: 'toolCall',
          id: 'tc_plan',
          name: 'planRoute',
          arguments: {
            start: { lat: 37.77, lng: -122.42, label: null },
            end: { lat: 36.97, lng: -122.03, label: 'Santa Cruz, CA' },
            departureTime: Date.now() + 3_600_000,
            preferences: { scenicBias: 'high', avoidHighways: false, avoidTolls: false },
          },
        },
      ],
      'toolUse'
    )
    // Step 3: final text.
    const textMsg = makeAssistantMessage(
      [{ type: 'text', text: 'Here are 3 scenic routes to Santa Cruz.' }],
      'stop'
    )
    mockStream
      .mockReturnValueOnce(makeSimpleStream(geoMsg))
      .mockReturnValueOnce(makeSimpleStream(planMsg))
      .mockReturnValueOnce(makeSimpleStream(textMsg))

    planRideOrchestrator.mockResolvedValue([])

    const ctx = makeAgentContext()
    const result = await executeRidePlanningAgent(ctx, 'scenic ride to Santa Cruz')

    expect(mockStream).toHaveBeenCalledTimes(3)
    expect(planRideOrchestrator).toHaveBeenCalledTimes(1)
    // create + finalize + incrementUsage = 3 mutations
    expect(ctx.runMutation).toHaveBeenCalledTimes(3)
    expect(result.response).toBe('Here are 3 scenic routes to Santa Cruz.')
    expect(result.attachments).toEqual([
      { type: 'route_options', routePlanId: 'rp_test' },
    ])
  })

  it('caps the loop at MAX_STEPS (10) if stream keeps returning toolUse', async () => {
    // Simulate an agent that never stops — always requests a tool call.
    const neverStop = makeAssistantMessage(
      [{ type: 'toolCall', id: 'tc_loop', name: 'fetchWeather', arguments: { location: null } }],
      'toolUse'
    )
    // mockReturnValue sets a default that applies to all calls not covered by Once mocks.
    mockStream.mockReturnValue(makeSimpleStream(neverStop))

    const ctx = makeAgentContext()
    // Should resolve without throwing (loop terminates at max steps).
    await expect(executeRidePlanningAgent(ctx, 'weather please')).resolves.toBeDefined()

    // The loop runs at most MAX_STEPS (10) iterations.
    expect(mockStream).toHaveBeenCalledTimes(10)
  })

  it('throws when API key is missing', async () => {
    // Simulate the provider throwing because there is no key configured.
    mockStream.mockImplementationOnce(() => {
      throw new Error('GOOGLE_GENERATIVE_AI_API_KEY not configured')
    })

    const ctx = makeAgentContext()
    await expect(executeRidePlanningAgent(ctx, 'test')).rejects.toThrow()
  })

  // ---------------------------------------------------------------------------
  // Tests: new callback wiring (US-307)
  // ---------------------------------------------------------------------------

  it('fires onThinkingDelta for each thinking_delta event from the stream', async () => {
    const finalMsg = makeAssistantMessage([{ type: 'text', text: 'Done thinking.' }], 'stop')
    const events: MockEvent[] = [
      { type: 'thinking_delta', contentIndex: 0, delta: 'Hmm, ' },
      { type: 'thinking_delta', contentIndex: 0, delta: 'let me think...' },
      { type: 'done', reason: 'stop', message: finalMsg },
    ]
    mockStream.mockReturnValueOnce(makeMockStream(events, finalMsg))

    const onThinkingDelta = vi.fn().mockResolvedValue(undefined)
    const ctx = makeAgentContext()
    await executeRidePlanningAgent(ctx, 'hello', { onThinkingDelta })

    expect(onThinkingDelta).toHaveBeenCalledTimes(2)
    expect(onThinkingDelta).toHaveBeenNthCalledWith(1, 'Hmm, ')
    expect(onThinkingDelta).toHaveBeenNthCalledWith(2, 'let me think...')
  })

  it('fires onToolPending for each toolcall_start event from the stream', async () => {
    // At toolcall_start the runtime initialises arguments to {} — args are not
    // yet populated. The contract exposes only the tool name at this point.
    const partialToolCall = {
      type: 'toolCall' as const,
      id: 'tc_partial',
      name: 'geocode',
      arguments: {},
    }
    const finalMsg = makeAssistantMessage(
      [{ type: 'toolCall', id: 'tc_partial', name: 'geocode', arguments: { query: 'Santa Cruz' } }],
      'toolUse'
    )
    const textMsg = makeAssistantMessage([{ type: 'text', text: 'Found it.' }], 'stop')

    // Construct partial AssistantMessage for the toolcall_start event.
    const partialMsg = {
      ...finalMsg,
      content: [partialToolCall],
    }
    const events: MockEvent[] = [
      { type: 'toolcall_start', contentIndex: 0, partial: partialMsg },
      { type: 'done', reason: 'toolUse', message: finalMsg },
    ]
    mockStream
      .mockReturnValueOnce(makeMockStream(events, finalMsg))
      .mockReturnValueOnce(makeSimpleStream(textMsg))

    const onToolPending = vi.fn().mockResolvedValue(undefined)
    const ctx = makeAgentContext()
    await executeRidePlanningAgent(ctx, 'geocode Santa Cruz', { onToolPending })

    expect(onToolPending).toHaveBeenCalledTimes(1)
    expect(onToolPending).toHaveBeenCalledWith({ name: 'geocode' })
  })

  it('fires onStepStart once per loop iteration with (step, MAX_STEPS)', async () => {
    // Two-step loop: tool call then text.
    const toolMsg = makeAssistantMessage(
      [{ type: 'toolCall', id: 'tc_step', name: 'fetchWeather', arguments: { location: null } }],
      'toolUse'
    )
    const textMsg = makeAssistantMessage([{ type: 'text', text: 'Weather is nice.' }], 'stop')
    mockStream
      .mockReturnValueOnce(makeSimpleStream(toolMsg))
      .mockReturnValueOnce(makeSimpleStream(textMsg))

    const onStepStart = vi.fn().mockResolvedValue(undefined)
    const ctx = makeAgentContext()
    await executeRidePlanningAgent(ctx, 'weather', { onStepStart })

    expect(onStepStart).toHaveBeenCalledTimes(2)
    expect(onStepStart).toHaveBeenNthCalledWith(1, 0, 10)
    expect(onStepStart).toHaveBeenNthCalledWith(2, 1, 10)
  })

  it('fires onAgentTurn once per assistant turn that has tool calls', async () => {
    const toolMsg = makeAssistantMessage(
      [{ type: 'toolCall', id: 'tc_turn', name: 'fetchWeather', arguments: { location: null } }],
      'toolUse'
    )
    const textMsg = makeAssistantMessage([{ type: 'text', text: 'The weather looks good.' }], 'stop')
    mockStream
      .mockReturnValueOnce(makeSimpleStream(toolMsg))
      .mockReturnValueOnce(makeSimpleStream(textMsg))

    const onAgentTurn = vi.fn().mockResolvedValue(undefined)
    const ctx = makeAgentContext()
    await executeRidePlanningAgent(ctx, 'weather', { onAgentTurn })

    // Only the turn with tool calls triggers onAgentTurn (not the final text turn).
    expect(onAgentTurn).toHaveBeenCalledTimes(1)
    expect(onAgentTurn).toHaveBeenCalledWith(toolMsg)
  })

  it('fires onToolResultPiMessage after each tool result with correct toolCallId and ToolResultMessage', async () => {
    const toolMsg = makeAssistantMessage(
      [{ type: 'toolCall', id: 'tc_result', name: 'fetchWeather', arguments: { location: null } }],
      'toolUse'
    )
    const textMsg = makeAssistantMessage([{ type: 'text', text: 'Done.' }], 'stop')
    mockStream
      .mockReturnValueOnce(makeSimpleStream(toolMsg))
      .mockReturnValueOnce(makeSimpleStream(textMsg))

    const onToolResultPiMessage = vi.fn().mockResolvedValue(undefined)
    const ctx = makeAgentContext()
    await executeRidePlanningAgent(ctx, 'weather', { onToolResultPiMessage })

    expect(onToolResultPiMessage).toHaveBeenCalledTimes(1)
    const [toolCallId, toolResultMsg] = onToolResultPiMessage.mock.calls[0]
    expect(toolCallId).toBe('tc_result')
    expect(toolResultMsg).toMatchObject({
      role: 'toolResult',
      toolCallId: 'tc_result',
      toolName: 'fetchWeather',
      isError: false,
    })
    expect(toolResultMsg.content[0].text).toContain('weather')
  })

  it('back-compat: runs normally with no callbacks provided (no crashes, tools execute)', async () => {
    const toolMsg = makeAssistantMessage(
      [{ type: 'toolCall', id: 'tc_compat', name: 'fetchWeather', arguments: { location: null } }],
      'toolUse'
    )
    const textMsg = makeAssistantMessage([{ type: 'text', text: 'Looks sunny!' }], 'stop')
    mockStream
      .mockReturnValueOnce(makeSimpleStream(toolMsg))
      .mockReturnValueOnce(makeSimpleStream(textMsg))

    const ctx = makeAgentContext()
    // No executeCtx at all — must not crash.
    const result = await executeRidePlanningAgent(ctx, 'weather')

    expect(result.response).toBe('Looks sunny!')
    expect(mockStream).toHaveBeenCalledTimes(2)
  })

  // ---------------------------------------------------------------------------
  // Tests: LoopDetector integration (US-318)
  // ---------------------------------------------------------------------------

  it('LoopDetector intercepts 3rd identical tool call — tool NOT executed, error result injected', async () => {
    const identicalCall = {
      type: 'toolCall' as const,
      id: 'tc_loop',
      name: 'fetchWeather',
      arguments: { location: 'SF' },
    }

    // Three consecutive steps each requesting the exact same tool call.
    const step1 = makeAssistantMessage([identicalCall], 'toolUse')
    const step2 = makeAssistantMessage([{ ...identicalCall, id: 'tc_loop2' }], 'toolUse')
    const step3 = makeAssistantMessage([{ ...identicalCall, id: 'tc_loop3' }], 'toolUse')
    const finalMsg = makeAssistantMessage([{ type: 'text', text: 'Sorry, something went wrong.' }], 'stop')

    mockStream
      .mockReturnValueOnce(makeSimpleStream(step1))
      .mockReturnValueOnce(makeSimpleStream(step2))
      .mockReturnValueOnce(makeSimpleStream(step3))
      .mockReturnValueOnce(makeSimpleStream(finalMsg))

    const onToolResultPiMessage = vi.fn().mockResolvedValue(undefined)
    const ctx = makeAgentContext()
    const result = await executeRidePlanningAgent(ctx, 'weather', { onToolResultPiMessage })

    // 4 stream calls: 3 tool steps + 1 final text
    expect(mockStream).toHaveBeenCalledTimes(4)

    // The 3rd call (id: tc_loop3) should be intercepted — onToolResultPiMessage
    // should have been called for it with isError: true.
    const loopInterceptCall = onToolResultPiMessage.mock.calls.find(
      ([id]: [string]) => id === 'tc_loop3'
    )
    expect(loopInterceptCall).toBeDefined()
    const loopMsg = loopInterceptCall![1]
    expect(loopMsg.isError).toBe(true)
    expect(loopMsg.content[0].text).toContain('identical arguments')

    // Final response should come through
    expect(result.response).toBe('Sorry, something went wrong.')
  })

  it('LoopDetector does NOT fire for calls with different args (no false positives)', async () => {
    // Two calls with the same tool name but different arguments — should NOT trigger loop.
    const call1 = makeAssistantMessage(
      [{ type: 'toolCall', id: 'tc_geo1', name: 'geocode', arguments: { query: 'Santa Cruz' } }],
      'toolUse'
    )
    const call2 = makeAssistantMessage(
      [{ type: 'toolCall', id: 'tc_geo2', name: 'geocode', arguments: { query: 'San Francisco' } }],
      'toolUse'
    )
    const finalMsg = makeAssistantMessage([{ type: 'text', text: 'Got both locations.' }], 'stop')

    mockStream
      .mockReturnValueOnce(makeSimpleStream(call1))
      .mockReturnValueOnce(makeSimpleStream(call2))
      .mockReturnValueOnce(makeSimpleStream(finalMsg))

    const ctx = makeAgentContext()
    const result = await executeRidePlanningAgent(ctx, 'geocode two places')

    // Both tool calls should have executed without loop interception.
    expect(mockStream).toHaveBeenCalledTimes(3)
    expect(result.response).toBe('Got both locations.')
  })

  // ---------------------------------------------------------------------------
  // Tests: BudgetTracker integration (US-318)
  // ---------------------------------------------------------------------------

  it('BudgetTracker throws after cumulative cost exceeds limit — loop aborts with AGENT_BUDGET_EXCEEDED', async () => {
    // Produce an assistant message whose usage pushes cost over the $0.25 limit.
    const expensiveMsg = makeAssistantMessage([{ type: 'text', text: 'Hello' }], 'stop')
    // Override cost to exceed the $0.25 limit immediately.
    expensiveMsg.usage = {
      input: 1000,
      output: 1000,
      cacheRead: 0,
      cacheWrite: 0,
      totalTokens: 2000,
      cost: { input: 0.1, output: 0.2, cacheRead: 0, cacheWrite: 0, total: 0.30 },
    }

    mockStream.mockReturnValueOnce(makeSimpleStream(expensiveMsg))

    const ctx = makeAgentContext()
    await expect(executeRidePlanningAgent(ctx, 'hello')).rejects.toMatchObject({
      data: { code: 'AGENT_BUDGET_EXCEEDED' },
    })
  })

  it('BudgetTracker does NOT throw when cumulative cost is under limit (normal operation)', async () => {
    // Cost well under $0.25 limit — should proceed normally.
    const cheapMsg = makeAssistantMessage([{ type: 'text', text: 'Cheap response.' }], 'stop')
    cheapMsg.usage = {
      input: 10,
      output: 10,
      cacheRead: 0,
      cacheWrite: 0,
      totalTokens: 20,
      cost: { input: 0.001, output: 0.001, cacheRead: 0, cacheWrite: 0, total: 0.002 },
    }

    mockStream.mockReturnValueOnce(makeSimpleStream(cheapMsg))

    const ctx = makeAgentContext()
    const result = await executeRidePlanningAgent(ctx, 'hello')

    expect(result.response).toBe('Cheap response.')
    expect(mockStream).toHaveBeenCalledTimes(1)
  })

  // ---------------------------------------------------------------------------
  // Tests: summarizeForContext wiring (US-310)
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // Tests: parallel tool execution (US-320)
  // ---------------------------------------------------------------------------

  it('US-320: two concurrent geocode calls both execute (parallel safe)', async () => {
    // The model asks for two geocodes in a single turn.
    const twoGeoMsg = makeAssistantMessage(
      [
        { type: 'toolCall', id: 'tc_geo_sc', name: 'geocode', arguments: { query: 'Santa Cruz' } },
        { type: 'toolCall', id: 'tc_geo_hmb', name: 'geocode', arguments: { query: 'Half Moon Bay' } },
      ],
      'toolUse'
    )
    const textMsg = makeAssistantMessage([{ type: 'text', text: 'Got both.' }], 'stop')
    mockStream
      .mockReturnValueOnce(makeSimpleStream(twoGeoMsg))
      .mockReturnValueOnce(makeSimpleStream(textMsg))

    const { createGeocodingProvider } = await import('../providers/geocodingProvider') as any
    const ctx = makeAgentContext()
    await executeRidePlanningAgent(ctx, 'geocode Santa Cruz and Half Moon Bay')

    // createGeocodingProvider is called once per geocode tool invocation.
    // Collect all geocode mock calls across every instance.
    const allGeocodeCalls: unknown[][] = (createGeocodingProvider.mock.results as Array<{ value: any }>)
      .flatMap(r => (r.value.geocode.mock.calls as unknown[][]))

    expect(allGeocodeCalls).toHaveLength(2)
    const queries = allGeocodeCalls.map(args => args[0])
    expect(queries).toContain('Santa Cruz')
    expect(queries).toContain('Half Moon Bay')
  })

  it('US-320: geocode (safe) and planRoute (unsafe) in same turn — geocode runs parallel-safe, planRoute sequential', async () => {
    // Simulate a model turn that requests both geocode and planRoute together.
    const mixedMsg = makeAssistantMessage(
      [
        { type: 'toolCall', id: 'tc_geo_mix', name: 'geocode', arguments: { query: 'Monterey' } },
        {
          type: 'toolCall',
          id: 'tc_plan_mix',
          name: 'planRoute',
          arguments: {
            start: { lat: 37.77, lng: -122.42, label: null },
            end: { lat: 36.6, lng: -121.9, label: 'Monterey, CA' },
            departureTime: Date.now() + 3_600_000,
            preferences: { scenicBias: 'high', avoidHighways: false, avoidTolls: false },
          },
        },
      ],
      'toolUse'
    )
    const textMsg = makeAssistantMessage([{ type: 'text', text: 'Done.' }], 'stop')
    mockStream
      .mockReturnValueOnce(makeSimpleStream(mixedMsg))
      .mockReturnValueOnce(makeSimpleStream(textMsg))

    planRideOrchestrator.mockResolvedValue([])

    const onToolResultPiMessage = vi.fn().mockResolvedValue(undefined)
    const ctx = makeAgentContext()
    const result = await executeRidePlanningAgent(ctx, 'ride to Monterey', { onToolResultPiMessage })

    // Both tool results must be present.
    expect(onToolResultPiMessage).toHaveBeenCalledTimes(2)
    const ids = onToolResultPiMessage.mock.calls.map(([id]: [string]) => id)
    expect(ids).toContain('tc_geo_mix')
    expect(ids).toContain('tc_plan_mix')

    // planRoute must have executed (runMutation called).
    expect(ctx.runMutation).toHaveBeenCalled()
    expect(result.response).toBe('Done.')
  })

  it('US-320: result ordering is preserved regardless of parallel execution order', async () => {
    // Two geocodes in a single turn; results must appear in call order (sc before hmb).
    const twoGeoMsg = makeAssistantMessage(
      [
        { type: 'toolCall', id: 'tc_order_1', name: 'geocode', arguments: { query: 'Santa Cruz' } },
        { type: 'toolCall', id: 'tc_order_2', name: 'geocode', arguments: { query: 'Half Moon Bay' } },
      ],
      'toolUse'
    )
    const textMsg = makeAssistantMessage([{ type: 'text', text: 'Ordered.' }], 'stop')
    mockStream
      .mockReturnValueOnce(makeSimpleStream(twoGeoMsg))
      .mockReturnValueOnce(makeSimpleStream(textMsg))

    const onToolResultPiMessage = vi.fn().mockResolvedValue(undefined)
    const ctx = makeAgentContext()
    await executeRidePlanningAgent(ctx, 'both places', { onToolResultPiMessage })

    expect(onToolResultPiMessage).toHaveBeenCalledTimes(2)
    // Results must arrive in the same order as the original tool calls.
    expect(onToolResultPiMessage.mock.calls[0][0]).toBe('tc_order_1')
    expect(onToolResultPiMessage.mock.calls[1][0]).toBe('tc_order_2')
  })

  // ---------------------------------------------------------------------------
  // Tests: US-023 — per-segment compilation dispatch in runCompileSketch
  // ---------------------------------------------------------------------------

  describe('per-segment dispatch (US-023)', () => {
    // Helpers shared across US-023 tests
    const makeCompileSketchCall = (sketchOverride?: Partial<{
      label: string
      rationale: string
      segments: Array<{ roadName: string; fromName: string; toName: string; viaNames?: string[] }>
      anchorPoints: Array<{ name: string; kind: 'town' | 'junction' | 'landmark' | 'pass'; lat?: number; lng?: number }>
    }>) =>
      makeAssistantMessage(
        [
          {
            type: 'toolCall',
            id: 'tc_compile',
            name: 'compileSketch',
            arguments: {
              start: { lat: 37.77, lng: -122.42, label: 'SF' },
              end: { lat: 36.97, lng: -122.03, label: 'Santa Cruz' },
              departureTime: Date.now() + 3_600_000,
              preferences: { scenicBias: 'high', avoidHighways: false, avoidTolls: false },
              sketch: {
                label: 'Test Sketch',
                rationale: 'Scenic coastal route',
                segments: [
                  { roadName: 'Skyline Blvd', fromName: 'SF', toName: 'Palo Alto' },
                  { roadName: 'CA-84', fromName: 'Palo Alto', toName: 'Half Moon Bay' },
                  { roadName: 'CA-1', fromName: 'Half Moon Bay', toName: 'Santa Cruz' },
                ],
                anchorPoints: [],
                ...sketchOverride,
              },
            },
          },
        ],
        'toolUse'
      )

    const makeProviderRoute = () => ({
      provider: 'google',
      bounds: { north: 37.8, south: 36.9, east: -121.9, west: -122.5 },
      overviewGeometry: { format: 'polyline' as const, encoding: 'google_encoded_polyline', precision: 5, value: 'abc123' },
      legs: [
        {
          legIndex: 0,
          start: { lat: 37.77, lng: -122.42 },
          end: { lat: 36.97, lng: -122.03 },
          distanceMeters: 100_000,
          durationSeconds: 5_400,
          geometry: { format: 'polyline' as const, encoding: 'google_encoded_polyline', precision: 5, value: 'leg_abc' },
        },
      ],
    })

    const makeRouteSnapshot = () => ({
      routeOptionId: 'snap1',
      label: 'Test Sketch',
      rationale: 'Scenic coastal route',
      stats: { distanceMeters: 100_000, durationSeconds: 5_400 },
      highlights: [],
      waypoints: [],
      geometry: [],
      legs: [],
    })

    let compileSegmentsMock: ReturnType<typeof vi.fn>
    let stitchSegmentsMock: ReturnType<typeof vi.fn>
    let compileSketchImplMock: ReturnType<typeof vi.fn>
    let normalizeRouteMock: ReturnType<typeof vi.fn>

    beforeEach(async () => {
      const compileSketchMod = await import('../tools/compileSketch') as any
      compileSegmentsMock = compileSketchMod.compileSegments
      stitchSegmentsMock = compileSketchMod.stitchSegments
      compileSketchImplMock = compileSketchMod.compileSketch

      const normalizeRouteMod = await import('../tools/normalizeRoute') as any
      normalizeRouteMock = normalizeRouteMod.normalizeRoute

      // Default: normalize returns a route snapshot
      normalizeRouteMock.mockResolvedValue(makeRouteSnapshot())
    })

    it('per-segment dispatch: dispatches to compileSegments when sketch has segments', async () => {
      // All 3 segments succeed
      const segmentResults = [
        { status: 'ok', segmentIndex: 0, route: makeProviderRoute() },
        { status: 'ok', segmentIndex: 1, route: makeProviderRoute() },
        { status: 'ok', segmentIndex: 2, route: makeProviderRoute() },
      ]
      compileSegmentsMock.mockResolvedValue(segmentResults)
      stitchSegmentsMock.mockReturnValue(makeProviderRoute())

      const toolMsg = makeCompileSketchCall()
      const textMsg = makeAssistantMessage([{ type: 'text', text: 'Here is your route.' }], 'stop')
      mockStream
        .mockReturnValueOnce(makeSimpleStream(toolMsg))
        .mockReturnValueOnce(makeSimpleStream(textMsg))

      const ctx = makeAgentContext()
      const result = await executeRidePlanningAgent(ctx, 'plan a sketch route')

      // compileSegments must have been called (per-segment path)
      expect(compileSegmentsMock).toHaveBeenCalledTimes(1)
      // compileSketch (single-shot) must NOT have been called
      expect(compileSketchImplMock).not.toHaveBeenCalled()
      // stitchSegments must have been called to combine results
      expect(stitchSegmentsMock).toHaveBeenCalledTimes(1)
      // Result should be a successful route
      expect(result.response).toBe('Here is your route.')
    })

    it('segment error feedback: returns structured failed/succeeded arrays when a segment fails', async () => {
      // Segment 1 fails, segments 0 and 2 succeed
      const segmentResults = [
        { status: 'ok', segmentIndex: 0, route: makeProviderRoute() },
        { status: 'failed', segmentIndex: 1, error: 'ZERO_RESULTS: No route found for CA-84' },
        { status: 'ok', segmentIndex: 2, route: makeProviderRoute() },
      ]
      compileSegmentsMock.mockResolvedValue(segmentResults)

      const toolMsg = makeCompileSketchCall()
      const textMsg = makeAssistantMessage([{ type: 'text', text: 'Some segments failed.' }], 'stop')
      mockStream
        .mockReturnValueOnce(makeSimpleStream(toolMsg))
        .mockReturnValueOnce(makeSimpleStream(textMsg))

      let capturedToolResult: unknown
      const onToolResultPiMessage = vi.fn().mockImplementation(async (_id: string, msg: unknown) => {
        if ((_id as string) === 'tc_compile') {
          capturedToolResult = msg
        }
      })

      const ctx = makeAgentContext()
      await executeRidePlanningAgent(ctx, 'plan a sketch route', { onToolResultPiMessage })

      // The tool result should be an error
      const resultText = (capturedToolResult as any).content[0].text
      const parsed = JSON.parse(resultText)

      expect(parsed.type).toBe('error')
      expect(parsed.message).toContain('1 of 3')

      const hint = JSON.parse(parsed.hint)
      expect(hint.type).toBe('partial_route')
      expect(hint.retryGuidance).toBe('revise_failed_segments')

      // failed array should contain segment 1
      expect(hint.failed).toHaveLength(1)
      expect(hint.failed[0]).toMatchObject({
        segmentIndex: 1,
        roadName: 'CA-84',
        fromName: 'Palo Alto',
        toName: 'Half Moon Bay',
        error: 'ZERO_RESULTS: No route found for CA-84',
      })

      // succeeded array should contain segments 0 and 2
      expect(hint.succeeded).toHaveLength(2)
      expect(hint.succeeded[0]).toMatchObject({ segmentIndex: 0, roadName: 'Skyline Blvd' })
      expect(hint.succeeded[1]).toMatchObject({ segmentIndex: 2, roadName: 'CA-1' })
    })

    it('single-shot fallback: uses single-shot compilation when sketch has no segments', async () => {
      compileSketchImplMock.mockResolvedValue(makeProviderRoute())

      const toolMsg = makeCompileSketchCall({
        segments: [],
        anchorPoints: [],
      })
      const textMsg = makeAssistantMessage([{ type: 'text', text: 'Single-shot route ready.' }], 'stop')
      mockStream
        .mockReturnValueOnce(makeSimpleStream(toolMsg))
        .mockReturnValueOnce(makeSimpleStream(textMsg))

      const ctx = makeAgentContext()
      await executeRidePlanningAgent(ctx, 'plan a route')

      // Must use single-shot, not per-segment
      expect(compileSketchImplMock).toHaveBeenCalledTimes(1)
      expect(compileSegmentsMock).not.toHaveBeenCalled()
      expect(stitchSegmentsMock).not.toHaveBeenCalled()
    })

    it('all segments failed: returns error with all in failed[], empty succeeded[], revise_failed_segments guidance', async () => {
      // All 3 segments fail
      const segmentResults = [
        { status: 'failed', segmentIndex: 0, error: 'Road not found: Skyline Blvd' },
        { status: 'failed', segmentIndex: 1, error: 'Road not found: CA-84' },
        { status: 'failed', segmentIndex: 2, error: 'Road not found: CA-1' },
      ]
      compileSegmentsMock.mockResolvedValue(segmentResults)

      const toolMsg = makeCompileSketchCall()
      const textMsg = makeAssistantMessage([{ type: 'text', text: 'All failed.' }], 'stop')
      mockStream
        .mockReturnValueOnce(makeSimpleStream(toolMsg))
        .mockReturnValueOnce(makeSimpleStream(textMsg))

      let capturedToolResult: unknown
      const onToolResultPiMessage = vi.fn().mockImplementation(async (_id: string, msg: unknown) => {
        if ((_id as string) === 'tc_compile') {
          capturedToolResult = msg
        }
      })

      const ctx = makeAgentContext()
      await executeRidePlanningAgent(ctx, 'plan a sketch route', { onToolResultPiMessage })

      const resultText = (capturedToolResult as any).content[0].text
      const parsed = JSON.parse(resultText)

      expect(parsed.type).toBe('error')
      expect(parsed.message).toContain('3 of 3')
      expect(parsed.retryGuidance).toBe('revise_failed_segments')

      const hint = JSON.parse(parsed.hint)
      expect(hint.retryGuidance).toBe('revise_failed_segments')
      expect(hint.succeeded).toHaveLength(0)
      expect(hint.failed).toHaveLength(3)
      expect(hint.failed[0]).toMatchObject({ segmentIndex: 0, roadName: 'Skyline Blvd' })
      expect(hint.failed[1]).toMatchObject({ segmentIndex: 1, roadName: 'CA-84' })
      expect(hint.failed[2]).toMatchObject({ segmentIndex: 2, roadName: 'CA-1' })

      // stitchSegments must NOT be called when all fail
      expect(stitchSegmentsMock).not.toHaveBeenCalled()
    })

    it('partial geometry: includes partial stitched route info in error hint when some segments succeed', async () => {
      // 2 of 3 succeed
      const segmentResults = [
        { status: 'ok', segmentIndex: 0, route: makeProviderRoute() },
        { status: 'ok', segmentIndex: 1, route: makeProviderRoute() },
        { status: 'failed', segmentIndex: 2, error: 'ZERO_RESULTS: CA-1 blocked' },
      ]
      compileSegmentsMock.mockResolvedValue(segmentResults)

      const toolMsg = makeCompileSketchCall()
      const textMsg = makeAssistantMessage([{ type: 'text', text: 'Partial failure.' }], 'stop')
      mockStream
        .mockReturnValueOnce(makeSimpleStream(toolMsg))
        .mockReturnValueOnce(makeSimpleStream(textMsg))

      let capturedToolResult: unknown
      const onToolResultPiMessage = vi.fn().mockImplementation(async (_id: string, msg: unknown) => {
        if ((_id as string) === 'tc_compile') {
          capturedToolResult = msg
        }
      })

      const ctx = makeAgentContext()
      await executeRidePlanningAgent(ctx, 'plan a sketch route', { onToolResultPiMessage })

      const resultText = (capturedToolResult as any).content[0].text
      const parsed = JSON.parse(resultText)

      expect(parsed.type).toBe('error')
      expect(parsed.message).toContain('1 of 3')

      const hint = JSON.parse(parsed.hint)
      // succeeded should have 2 entries (partial route)
      expect(hint.succeeded).toHaveLength(2)
      expect(hint.succeeded[0]).toMatchObject({ segmentIndex: 0, roadName: 'Skyline Blvd' })
      expect(hint.succeeded[1]).toMatchObject({ segmentIndex: 1, roadName: 'CA-84' })
      // failed should have 1 entry
      expect(hint.failed).toHaveLength(1)
      expect(hint.failed[0]).toMatchObject({
        segmentIndex: 2,
        roadName: 'CA-1',
        fromName: 'Half Moon Bay',
        toName: 'Santa Cruz',
      })
    })
  })

  // ---------------------------------------------------------------------------
  // Tests: US-025 — segment retry loop with cached segment merging
  // ---------------------------------------------------------------------------

  describe('segment retry loop (US-025)', () => {
    // Helpers shared across US-025 tests
    const RETRY_SESSION = 'session_retry_025' as any

    const makeSegment = (roadName: string, fromName: string, toName: string) => ({
      roadName, fromName, toName,
    })

    const makeCompileCall = (sessionId: string, segments: Array<{ roadName: string; fromName: string; toName: string }>, callId = 'tc_retry') =>
      makeAssistantMessage(
        [
          {
            type: 'toolCall',
            id: callId,
            name: 'compileSketch',
            arguments: {
              start: { lat: 37.77, lng: -122.42, label: 'SF' },
              end: { lat: 36.97, lng: -122.03, label: 'Santa Cruz' },
              departureTime: Date.now() + 3_600_000,
              preferences: { scenicBias: 'high', avoidHighways: false, avoidTolls: false },
              sketch: {
                label: '4-Segment Route',
                rationale: 'Scenic coastal loop',
                segments,
                anchorPoints: [],
              },
            },
          },
        ],
        'toolUse'
      )

    const makeProviderRoute = (value = 'abc123') => ({
      provider: 'google' as const,
      bounds: { north: 37.8, south: 36.9, east: -121.9, west: -122.5 },
      overviewGeometry: { format: 'polyline' as const, encoding: 'google_encoded_polyline', precision: 5, value },
      legs: [
        {
          legIndex: 0,
          start: { lat: 37.77, lng: -122.42 },
          end: { lat: 36.97, lng: -122.03 },
          distanceMeters: 100_000,
          durationSeconds: 5_400,
          geometry: { format: 'polyline' as const, encoding: 'google_encoded_polyline', precision: 5, value: 'leg_abc' },
        },
      ],
    })

    const makeRouteSnapshot = () => ({
      routeOptionId: 'snap_retry',
      label: '4-Segment Route',
      rationale: 'Scenic coastal loop',
      stats: { distanceMeters: 100_000, durationSeconds: 5_400 },
      highlights: [],
      waypoints: [],
      geometry: [],
      legs: [],
    })

    let compileSegmentsMock: ReturnType<typeof vi.fn>
    let stitchSegmentsMock: ReturnType<typeof vi.fn>
    let normalizeRouteMock: ReturnType<typeof vi.fn>

    beforeEach(async () => {
      const compileSketchMod = await import('../tools/compileSketch') as any
      compileSegmentsMock = compileSketchMod.compileSegments
      stitchSegmentsMock = compileSketchMod.stitchSegments

      const normalizeRouteMod = await import('../tools/normalizeRoute') as any
      normalizeRouteMock = normalizeRouteMod.normalizeRoute
      normalizeRouteMock.mockResolvedValue(makeRouteSnapshot())
    })

    it('skip succeeded: only compiles segment 2 on retry when segments 0,1,3 are unchanged and already succeeded', async () => {
      // The 4 segments (0-3)
      const segs = [
        makeSegment('I-280 S', 'SF', 'CA-92 junction'),
        makeSegment('Skyline Blvd', 'CA-92', "Alice's Restaurant"),
        makeSegment('Old La Honda Rd', "Alice's Restaurant", 'Half Moon Bay'),  // this will fail on first attempt
        makeSegment('CA-1 N', 'Half Moon Bay', 'Santa Cruz'),
      ]
      // Revised segment 2 (different road)
      const segsRevised = [
        ...segs.slice(0, 2),
        makeSegment('CA-84', "Alice's Restaurant", 'Half Moon Bay'),  // revised
        segs[3],
      ]

      // First attempt: segment 2 fails, others succeed
      const firstResults = [
        { status: 'ok', segmentIndex: 0, route: makeProviderRoute('seg0') },
        { status: 'ok', segmentIndex: 1, route: makeProviderRoute('seg1') },
        { status: 'failed', segmentIndex: 2, error: 'ZERO_RESULTS: Old La Honda Rd' },
        { status: 'ok', segmentIndex: 3, route: makeProviderRoute('seg3') },
      ]

      // Second attempt (only segment 2 should be compiled): succeeds
      const secondResults = [
        { status: 'ok', segmentIndex: 2, route: makeProviderRoute('seg2_revised') },
      ]

      compileSegmentsMock
        .mockResolvedValueOnce(firstResults)
        .mockResolvedValueOnce(secondResults)

      stitchSegmentsMock.mockReturnValue(makeProviderRoute('stitched'))

      const ctx1 = { ...makeAgentContext(), planningSessionId: RETRY_SESSION }
      const ctx2 = { ...makeAgentContext(), planningSessionId: RETRY_SESSION }
      ctx1.runMutation = vi.fn().mockResolvedValue({ routePlanId: 'rp_retry_1' })
      ctx2.runMutation = vi.fn().mockResolvedValue({ routePlanId: 'rp_retry_2' })

      // First call: attempt 1, segment 2 fails
      const errorTextMsg = makeAssistantMessage([{ type: 'text', text: 'Segment 2 failed.' }], 'stop')
      mockStream
        .mockReturnValueOnce(makeSimpleStream(makeCompileCall(RETRY_SESSION, segs, 'tc_attempt1')))
        .mockReturnValueOnce(makeSimpleStream(errorTextMsg))

      await executeRidePlanningAgent(ctx1, 'plan a route')

      // Second call: attempt 2 with revised segment 2
      const successTextMsg = makeAssistantMessage([{ type: 'text', text: 'Route compiled.' }], 'stop')
      mockStream
        .mockReturnValueOnce(makeSimpleStream(makeCompileCall(RETRY_SESSION, segsRevised, 'tc_attempt2')))
        .mockReturnValueOnce(makeSimpleStream(successTextMsg))

      await executeRidePlanningAgent(ctx2, 'try revised segment 2')

      // compileSegments called twice total
      expect(compileSegmentsMock).toHaveBeenCalledTimes(2)

      // Second call to compileSegments must only include segment 2 (the changed one)
      const secondCallArgs = compileSegmentsMock.mock.calls[1][0]
      expect(secondCallArgs.sketch.segments).toHaveLength(1)
      expect(secondCallArgs.sketch.segments[0].roadName).toBe('CA-84')
    })

    it('merge cached: revised segment 2 success merges with cached 0,1,3 for fully stitched 4-segment route', async () => {
      const segs = [
        makeSegment('I-280 S', 'SF', 'CA-92 junction'),
        makeSegment('Skyline Blvd', 'CA-92', "Alice's Restaurant"),
        makeSegment('Old La Honda Rd', "Alice's Restaurant", 'Half Moon Bay'),
        makeSegment('CA-1 N', 'Half Moon Bay', 'Santa Cruz'),
      ]
      const segsRevised = [
        ...segs.slice(0, 2),
        makeSegment('CA-84', "Alice's Restaurant", 'Half Moon Bay'),
        segs[3],
      ]

      const MERGE_SESSION = 'session_merge_025' as any

      const firstResults = [
        { status: 'ok', segmentIndex: 0, route: makeProviderRoute('s0') },
        { status: 'ok', segmentIndex: 1, route: makeProviderRoute('s1') },
        { status: 'failed', segmentIndex: 2, error: 'ZERO_RESULTS' },
        { status: 'ok', segmentIndex: 3, route: makeProviderRoute('s3') },
      ]
      // On retry, only seg 2 is compiled
      const secondResults = [
        { status: 'ok', segmentIndex: 2, route: makeProviderRoute('s2_new') },
      ]

      compileSegmentsMock
        .mockResolvedValueOnce(firstResults)
        .mockResolvedValueOnce(secondResults)

      stitchSegmentsMock.mockReturnValue(makeProviderRoute('stitched_full'))
      normalizeRouteMock.mockResolvedValue(makeRouteSnapshot())

      const ctx1 = { ...makeAgentContext(), planningSessionId: MERGE_SESSION }
      const ctx2 = { ...makeAgentContext(), planningSessionId: MERGE_SESSION }
      ctx1.runMutation = vi.fn().mockResolvedValue({ routePlanId: 'rp_m1' })
      ctx2.runMutation = vi.fn().mockResolvedValue({ routePlanId: 'rp_m2' })

      const errMsg = makeAssistantMessage([{ type: 'text', text: 'Retry needed.' }], 'stop')
      mockStream
        .mockReturnValueOnce(makeSimpleStream(makeCompileCall(MERGE_SESSION, segs, 'tc_m1')))
        .mockReturnValueOnce(makeSimpleStream(errMsg))
      await executeRidePlanningAgent(ctx1, 'plan route')

      const successMsg = makeAssistantMessage([{ type: 'text', text: 'Here is your route.' }], 'stop')
      mockStream
        .mockReturnValueOnce(makeSimpleStream(makeCompileCall(MERGE_SESSION, segsRevised, 'tc_m2')))
        .mockReturnValueOnce(makeSimpleStream(successMsg))

      let capturedResult: unknown
      const onToolResultPiMessage = vi.fn().mockImplementation(async (id: string, msg: unknown) => {
        if (id === 'tc_m2') capturedResult = msg
      })

      const result = await executeRidePlanningAgent(ctx2, 'revised route', { onToolResultPiMessage })

      // stitchSegments must have been called with all 4 segments (3 cached + 1 new)
      expect(stitchSegmentsMock).toHaveBeenCalledTimes(1)
      const stitchArgs = stitchSegmentsMock.mock.calls[0][0]
      expect(stitchArgs).toHaveLength(4)
      // Segment 2 should be the revised one (s2_new)
      const seg2Result = stitchArgs.find((r: any) => r.segmentIndex === 2)
      expect(seg2Result?.route?.overviewGeometry?.value).toBe('s2_new')
      // Final response should be routes
      const resultText = (capturedResult as any).content[0].text
      const parsed = JSON.parse(resultText)
      expect(parsed.type).toBe('routes')
      expect(result.response).toBe('Here is your route.')
    })

    it('attempt count: error hint includes attemptsRemaining decremented per retry', async () => {
      const ATTEMPTS_SESSION = 'session_attempts_025' as any
      const segs = [
        makeSegment('Road A', 'Start', 'Middle'),
        makeSegment('Road B', 'Middle', 'End'),
      ]

      // Segment 1 fails on every attempt
      const failResults = [
        { status: 'ok', segmentIndex: 0, route: makeProviderRoute() },
        { status: 'failed', segmentIndex: 1, error: 'ZERO_RESULTS: Road B' },
      ]

      compileSegmentsMock.mockResolvedValue(failResults)
      stitchSegmentsMock.mockReturnValue(makeProviderRoute('partial'))
      normalizeRouteMock.mockResolvedValue(makeRouteSnapshot())

      const capturedHints: unknown[] = []

      // Run attempt 1
      const ctx1 = { ...makeAgentContext(), planningSessionId: ATTEMPTS_SESSION }
      ctx1.runMutation = vi.fn().mockResolvedValue({ routePlanId: 'rp_a1' })
      const onResult1 = vi.fn().mockImplementation(async (id: string, msg: unknown) => {
        if (id === 'tc_a1') capturedHints.push(msg)
      })
      const errMsg1 = makeAssistantMessage([{ type: 'text', text: 'Attempt 1 failed.' }], 'stop')
      mockStream
        .mockReturnValueOnce(makeSimpleStream(makeCompileCall(ATTEMPTS_SESSION, segs, 'tc_a1')))
        .mockReturnValueOnce(makeSimpleStream(errMsg1))
      await executeRidePlanningAgent(ctx1, 'attempt 1', { onToolResultPiMessage: onResult1 })

      // Attempt 2 — compileSegments called again (segment 1 still fails)
      // On retry only segment 1 needs compiling (segment 0 is cached)
      const failSegOnly = [
        { status: 'failed', segmentIndex: 1, error: 'ZERO_RESULTS: Road B still fails' },
      ]
      compileSegmentsMock.mockResolvedValue(failSegOnly)

      const ctx2 = { ...makeAgentContext(), planningSessionId: ATTEMPTS_SESSION }
      ctx2.runMutation = vi.fn().mockResolvedValue({ routePlanId: 'rp_a2' })
      const onResult2 = vi.fn().mockImplementation(async (id: string, msg: unknown) => {
        if (id === 'tc_a2') capturedHints.push(msg)
      })
      const errMsg2 = makeAssistantMessage([{ type: 'text', text: 'Attempt 2 failed.' }], 'stop')
      mockStream
        .mockReturnValueOnce(makeSimpleStream(makeCompileCall(ATTEMPTS_SESSION, segs, 'tc_a2')))
        .mockReturnValueOnce(makeSimpleStream(errMsg2))
      await executeRidePlanningAgent(ctx2, 'attempt 2', { onToolResultPiMessage: onResult2 })

      expect(capturedHints).toHaveLength(2)

      // Attempt 1 error hint should show 2 attempts remaining
      const hint1Text = (capturedHints[0] as any).content[0].text
      const hint1 = JSON.parse(JSON.parse(hint1Text).hint)
      expect(hint1.attemptsRemaining).toBe(2)

      // Attempt 2 error hint should show 1 attempt remaining
      const hint2Text = (capturedHints[1] as any).content[0].text
      const hint2 = JSON.parse(JSON.parse(hint2Text).hint)
      expect(hint2.attemptsRemaining).toBe(1)
    })

    it('max retries: returns partial route with user message after 3 failed attempts on same session', async () => {
      const MAX_SESSION = 'session_max_025' as any
      const segs = [
        makeSegment('Road X', 'A', 'B'),
        makeSegment('Bad Road', 'B', 'C'),
      ]

      // Segment 1 fails every time
      const firstAttemptResults = [
        { status: 'ok', segmentIndex: 0, route: makeProviderRoute('rx') },
        { status: 'failed', segmentIndex: 1, error: 'ZERO_RESULTS: Bad Road' },
      ]
      // On retry attempts 2 and 3: only segment 1 is compiled (segment 0 cached)
      const retryFailResults = [
        { status: 'failed', segmentIndex: 1, error: 'ZERO_RESULTS: Bad Road still broken' },
      ]

      compileSegmentsMock
        .mockResolvedValueOnce(firstAttemptResults)
        .mockResolvedValueOnce(retryFailResults)
        .mockResolvedValueOnce(retryFailResults)

      // stitchSegments is called for the partial route (attempt 3 max retries fallback)
      stitchSegmentsMock.mockReturnValue(makeProviderRoute('partial_best'))
      normalizeRouteMock.mockResolvedValue(makeRouteSnapshot())

      // Attempt 1
      const ctx1 = { ...makeAgentContext(), planningSessionId: MAX_SESSION }
      ctx1.runMutation = vi.fn().mockResolvedValue({ routePlanId: 'rp_mx1' })
      const errMsg1 = makeAssistantMessage([{ type: 'text', text: 'First failed.' }], 'stop')
      mockStream
        .mockReturnValueOnce(makeSimpleStream(makeCompileCall(MAX_SESSION, segs, 'tc_mx1')))
        .mockReturnValueOnce(makeSimpleStream(errMsg1))
      await executeRidePlanningAgent(ctx1, 'first attempt')

      // Attempt 2
      const ctx2 = { ...makeAgentContext(), planningSessionId: MAX_SESSION }
      ctx2.runMutation = vi.fn().mockResolvedValue({ routePlanId: 'rp_mx2' })
      const errMsg2 = makeAssistantMessage([{ type: 'text', text: 'Second failed.' }], 'stop')
      mockStream
        .mockReturnValueOnce(makeSimpleStream(makeCompileCall(MAX_SESSION, segs, 'tc_mx2')))
        .mockReturnValueOnce(makeSimpleStream(errMsg2))
      await executeRidePlanningAgent(ctx2, 'second attempt')

      // Attempt 3 — max retries hit, should return partial route
      const ctx3 = { ...makeAgentContext(), planningSessionId: MAX_SESSION }
      ctx3.runMutation = vi.fn().mockResolvedValue({ routePlanId: 'rp_mx3' })
      let capturedResult: unknown
      const onResult3 = vi.fn().mockImplementation(async (id: string, msg: unknown) => {
        if (id === 'tc_mx3') capturedResult = msg
      })
      const finalMsg = makeAssistantMessage([{ type: 'text', text: 'Partial route delivered.' }], 'stop')
      mockStream
        .mockReturnValueOnce(makeSimpleStream(makeCompileCall(MAX_SESSION, segs, 'tc_mx3')))
        .mockReturnValueOnce(makeSimpleStream(finalMsg))
      await executeRidePlanningAgent(ctx3, 'third attempt', { onToolResultPiMessage: onResult3 })

      // On attempt 3, should return a routes result (partial) with a user message, not an error
      const resultText = (capturedResult as any).content[0].text
      const parsed = JSON.parse(resultText)
      // Returns a chat/routes result with a partial-route message
      expect(['routes', 'chat']).toContain(parsed.type)
      // The message must mention the failed road and indicate partial routing
      const msgContent = parsed.message ?? parsed.data?.message ?? ''
      const fullContent = JSON.stringify(parsed)
      expect(fullContent).toMatch(/Bad Road|couldn't find a path|partial|routed most/)
    })
  })

  it('US-310: ToolResultMessage pushed to context contains summarized planRoute result (no geometry), while toolResultsTracker holds full result', async () => {
    // The full planRoute result includes geometry-heavy options with nested waypoints.
    const fullRouteResult = {
      type: 'routes',
      routePlanId: 'rp_summary_test',
      data: {
        planId: 'plan_summary',
        options: [
          {
            routeOptionId: 'opt1',
            label: 'Scenic Route',
            rationale: 'Great views',
            stats: { distanceMeters: 80_000, durationSeconds: 5_400 },
            highlights: ['Ocean views', 'Redwood forest'],
            waypoints: [{ lat: 37.1, lng: -122.1 }, { lat: 36.9, lng: -122.0 }],
            geometry: [{ lat: 37.1, lng: -122.1 }, { lat: 37.0, lng: -122.05 }, { lat: 36.9, lng: -122.0 }],
            legs: [{ steps: [{ instruction: 'Turn left', distance: 1000 }] }],
          },
        ],
      },
    }

    // buildOptionsFromResults returns the full data payload.
    buildOptionsFromResults.mockReturnValue(fullRouteResult.data)
    planRideOrchestrator.mockResolvedValue([])

    // ctx.runMutation: first call returns routePlanId, rest return null.
    const ctx = makeAgentContext()
    ctx.runMutation
      .mockResolvedValueOnce({ routePlanId: 'rp_summary_test' }) // createForAgentInternal
      .mockResolvedValueOnce(null)                                  // updatePlanStatus
      .mockResolvedValueOnce(null)                                  // incrementUsageInternal

    const toolCallMsg = makeAssistantMessage(
      [
        {
          type: 'toolCall',
          id: 'tc_summary',
          name: 'planRoute',
          arguments: {
            start: { lat: 37.77, lng: -122.42, label: null },
            end: { lat: 36.97, lng: -122.03, label: 'Santa Cruz, CA' },
            departureTime: Date.now() + 3_600_000,
            preferences: { scenicBias: 'high', avoidHighways: false, avoidTolls: false },
          },
        },
      ],
      'toolUse'
    )
    const textMsg = makeAssistantMessage([{ type: 'text', text: 'Here are your routes.' }], 'stop')
    mockStream
      .mockReturnValueOnce(makeSimpleStream(toolCallMsg))
      .mockReturnValueOnce(makeSimpleStream(textMsg))

    // Capture the ToolResultMessage pushed to context via the callback.
    let capturedToolResultMsg: unknown
    const onToolResultPiMessage = vi.fn().mockImplementation(async (_id: string, msg: unknown) => {
      capturedToolResultMsg = msg
    })

    await executeRidePlanningAgent(ctx, 'plan a ride to Santa Cruz', { onToolResultPiMessage })

    expect(onToolResultPiMessage).toHaveBeenCalledTimes(1)

    // The ToolResultMessage content must be the SUMMARIZED form — no geometry/waypoints/legs.
    const contentText = (capturedToolResultMsg as any).content[0].text
    const parsed = JSON.parse(contentText)

    // Summarized shape has type, routePlanId, summary — NOT data.options with geometry.
    expect(parsed.type).toBe('routes')
    expect(parsed.routePlanId).toBe('rp_summary_test')
    expect(parsed.summary).toBeDefined()
    expect(Array.isArray(parsed.summary)).toBe(true)
    expect(parsed.summary[0]).toMatchObject({
      index: 0,
      label: 'Scenic Route',
      distanceMi: expect.any(Number),
      durationMin: expect.any(Number),
    })

    // Geometry fields must NOT be present in the context message.
    expect(parsed.data).toBeUndefined()
    expect(parsed.summary[0].geometry).toBeUndefined()
    expect(parsed.summary[0].waypoints).toBeUndefined()
    expect(parsed.summary[0].legs).toBeUndefined()

    // The attachment extraction (which uses toolResultsTracker) must still work
    // with the full result — routePlanId is present in the attachment.
    const finalResult = await (async () => {
      // Re-run to get the return value (the prior run already finished).
      // Instead, check the return value of the already-completed run above.
      return null
    })()
    void finalResult

    // Verify the agent still produced correct attachments (full result in tracker).
    // We do this by running a second independent call and asserting attachments.
    buildOptionsFromResults.mockReturnValue(fullRouteResult.data)
    planRideOrchestrator.mockResolvedValue([])
    ctx.runMutation
      .mockResolvedValueOnce({ routePlanId: 'rp_summary_test' })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)

    const toolCallMsg2 = makeAssistantMessage(
      [
        {
          type: 'toolCall',
          id: 'tc_summary2',
          name: 'planRoute',
          arguments: {
            start: { lat: 37.77, lng: -122.42, label: null },
            end: { lat: 36.97, lng: -122.03, label: 'Santa Cruz, CA' },
            departureTime: Date.now() + 3_600_000,
            preferences: { scenicBias: 'high', avoidHighways: false, avoidTolls: false },
          },
        },
      ],
      'toolUse'
    )
    const textMsg2 = makeAssistantMessage([{ type: 'text', text: 'Routes ready.' }], 'stop')
    mockStream
      .mockReturnValueOnce(makeSimpleStream(toolCallMsg2))
      .mockReturnValueOnce(makeSimpleStream(textMsg2))

    const ctx2 = makeAgentContext()
    ctx2.runMutation
      .mockResolvedValueOnce({ routePlanId: 'rp_summary_test' })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)

    const result2 = await executeRidePlanningAgent(ctx2, 'plan a ride to Santa Cruz')
    expect(result2.attachments).toEqual([
      { type: 'route_options', routePlanId: 'rp_summary_test' },
    ])
  })

  // ---------------------------------------------------------------------------
  // Tests: US-069 — tool registration and system prompt tool workflow
  // ---------------------------------------------------------------------------

  describe('tool registration', () => {
    it('all 7 new tools appear in the agent context passed to stream', async () => {
      const { stream: mockStreamFn } = await import('@mariozechner/pi-ai') as any

      // Capture the context object passed to stream to inspect available tools.
      let capturedContext: any = null
      mockStreamFn.mockImplementationOnce((model: any, context: any) => {
        capturedContext = context
        const msg = makeAssistantMessage([{ type: 'text', text: 'Ready.' }], 'stop')
        return makeSimpleStream(msg)
      })

      const ctx = makeAgentContext()
      await executeRidePlanningAgent(ctx, 'hello')

      expect(capturedContext).not.toBeNull()
      const toolNames = capturedContext.tools.map((t: any) => t.name) as string[]

      expect(toolNames).toContain('lookupRoad')
      expect(toolNames).toContain('getCurvature')
      expect(toolNames).toContain('checkSurface')
      expect(toolNames).toContain('getElevation')
      expect(toolNames).toContain('searchAlongRoute')
      expect(toolNames).toContain('getRouteWeather')
      expect(toolNames).toContain('getUserFavorites')
    })
  })

  describe('grounding before sketch', () => {
    it('system prompt instructs LLM to call lookupRoad before sketch for scenic requests', async () => {
      const ctx = makeAgentContext()
      const prompt = await buildSystemPrompt(ctx)

      expect(prompt).toContain('lookupRoad')
      expect(prompt.toLowerCase()).toMatch(/scenic|twisty|exploratory/)
      expect(prompt.toLowerCase()).toMatch(/pre-sketch|before.*sketch|grounding/)
    })

    it('lookupRoad tool executes and returns road match data when called', async () => {
      const { lookupRoad: lookupRoadMock } = await import('../tools/lookupRoad') as any

      const lookupCall = makeAssistantMessage(
        [
          {
            type: 'toolCall',
            id: 'tc_lookup',
            name: 'lookupRoad',
            arguments: {
              roadName: 'Skyline Blvd',
              bbox: { south: 37.2, west: -122.4, north: 37.6, east: -121.9 },
            },
          },
        ],
        'toolUse'
      )
      const textMsg = makeAssistantMessage(
        [{ type: 'text', text: 'Skyline Blvd is verified — very twisty with asphalt surface.' }],
        'stop'
      )
      mockStream
        .mockReturnValueOnce(makeSimpleStream(lookupCall))
        .mockReturnValueOnce(makeSimpleStream(textMsg))

      const ctx = makeAgentContext()
      const result = await executeRidePlanningAgent(ctx, 'scenic ride on Skyline')

      expect(lookupRoadMock).toHaveBeenCalledTimes(1)
      expect(lookupRoadMock).toHaveBeenCalledWith({
        roadName: 'Skyline Blvd',
        bbox: { south: 37.2, west: -122.4, north: 37.6, east: -121.9 },
      })
      expect(result.response).toContain('Skyline Blvd')
    })
  })

  describe('curvature in rationale', () => {
    it('system prompt instructs LLM to cite curvature scores in route rationale', async () => {
      const ctx = makeAgentContext()
      const prompt = await buildSystemPrompt(ctx)

      expect(prompt).toContain('getCurvature')
      expect(prompt.toLowerCase()).toMatch(/curvature|twisty|score/)
      expect(prompt.toLowerCase()).toMatch(/cite|reference|data/)
    })

    it('getCurvature tool executes and returns score data when called', async () => {
      const { getCurvature: getCurvatureMock } = await import('../tools/getCurvature') as any

      const curvatureCall = makeAssistantMessage(
        [
          {
            type: 'toolCall',
            id: 'tc_curv',
            name: 'getCurvature',
            arguments: {
              roadName: 'Skyline Blvd',
              geometry: [{ lat: 37.3, lng: -122.1 }, { lat: 37.4, lng: -122.2 }],
              surface: 'asphalt',
            },
          },
        ],
        'toolUse'
      )
      const textMsg = makeAssistantMessage(
        [{ type: 'text', text: 'Skyline Blvd scores 2400 — very twisty!' }],
        'stop'
      )
      mockStream
        .mockReturnValueOnce(makeSimpleStream(curvatureCall))
        .mockReturnValueOnce(makeSimpleStream(textMsg))

      const ctx = makeAgentContext()
      const result = await executeRidePlanningAgent(ctx, 'twisty mountain roads')

      expect(getCurvatureMock).toHaveBeenCalledTimes(1)
      expect(result.response).toContain('2400')
    })
  })

  describe('skip grounding', () => {
    it('system prompt documents when to skip grounding tools (direct A-to-B, named roads, retries)', async () => {
      const ctx = makeAgentContext()
      const prompt = await buildSystemPrompt(ctx)

      // Must describe when to skip grounding
      expect(prompt.toLowerCase()).toMatch(/skip.*grounding|when to skip/)
      // Must mention direct A-to-B as a skip case
      expect(prompt.toLowerCase()).toMatch(/direct|a-to-b|fastest/)
      // Must mention retry loops as a skip case
      expect(prompt.toLowerCase()).toMatch(/retry|re-compilation/)
    })
  })

  describe('post-compile enrichment', () => {
    it('system prompt instructs LLM to call getElevation and getRouteWeather after compileSketch', async () => {
      const ctx = makeAgentContext()
      const prompt = await buildSystemPrompt(ctx)

      expect(prompt).toContain('getElevation')
      expect(prompt).toContain('getRouteWeather')
      expect(prompt.toLowerCase()).toMatch(/after.*compil|post.compil/)
    })

    it('getElevation tool executes and returns elevation profile when called', async () => {
      const { getElevation: getElevationMock } = await import('../tools/getElevation') as any

      const elevCall = makeAssistantMessage(
        [
          {
            type: 'toolCall',
            id: 'tc_elev',
            name: 'getElevation',
            arguments: {
              polyline: [{ lat: 37.3, lng: -122.1 }, { lat: 37.5, lng: -122.3 }],
            },
          },
        ],
        'toolUse'
      )
      const textMsg = makeAssistantMessage(
        [{ type: 'text', text: 'Your route climbs 1200ft to a peak of 2800ft.' }],
        'stop'
      )
      mockStream
        .mockReturnValueOnce(makeSimpleStream(elevCall))
        .mockReturnValueOnce(makeSimpleStream(textMsg))

      const ctx = makeAgentContext()
      const result = await executeRidePlanningAgent(ctx, 'show me elevation for the route')

      expect(getElevationMock).toHaveBeenCalledTimes(1)
      expect(result.response).toContain('1200ft')
    })

    it('getRouteWeather tool executes and returns weather summary when called', async () => {
      const { getRouteWeather: getRouteWeatherMock } = await import('../tools/getRouteWeather') as any

      const weatherCall = makeAssistantMessage(
        [
          {
            type: 'toolCall',
            id: 'tc_weather',
            name: 'getRouteWeather',
            arguments: {
              polyline: [{ lat: 37.3, lng: -122.1 }, { lat: 37.5, lng: -122.3 }],
              departureTimeMs: Date.now() + 3_600_000,
            },
          },
        ],
        'toolUse'
      )
      const textMsg = makeAssistantMessage(
        [{ type: 'text', text: 'Weather looks great: 15°C, light winds.' }],
        'stop'
      )
      mockStream
        .mockReturnValueOnce(makeSimpleStream(weatherCall))
        .mockReturnValueOnce(makeSimpleStream(textMsg))

      const ctx = makeAgentContext()
      const result = await executeRidePlanningAgent(ctx, 'check weather for my route')

      expect(getRouteWeatherMock).toHaveBeenCalledTimes(1)
      expect(result.response).toContain('15°C')
    })

    it('searchAlongRoute tool executes and returns nearby places when called', async () => {
      const { searchAlongRoute: searchAlongRouteMock } = await import('../tools/searchAlongRoute') as any

      const sarCall = makeAssistantMessage(
        [
          {
            type: 'toolCall',
            id: 'tc_sar',
            name: 'searchAlongRoute',
            arguments: {
              routePolyline: 'encodedPolylineString',
              query: 'gas station',
              originOffset: null,
            },
          },
        ],
        'toolUse'
      )
      const textMsg = makeAssistantMessage(
        [{ type: 'text', text: "Alice's Restaurant is a great stop along Skyline." }],
        'stop'
      )
      mockStream
        .mockReturnValueOnce(makeSimpleStream(sarCall))
        .mockReturnValueOnce(makeSimpleStream(textMsg))

      const ctx = makeAgentContext()
      const result = await executeRidePlanningAgent(ctx, 'find stops along the route')

      expect(searchAlongRouteMock).toHaveBeenCalledTimes(1)
      expect(result.response).toContain("Alice's Restaurant")
    })
  })
})
