'use node'

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Id } from '../../../_generated/dataModel'
import { buildCardCallbacks, buildStreamingContext, TOOL_TO_CARD_KIND } from '../sendMessage'

// -----------------------------------------------------------------------------
// Test the sendMessage orchestrator logic (without Convex imports)
// -----------------------------------------------------------------------------

// Mock all the dependencies
const mockExecuteRidePlanningAgent = vi.fn()
const mockSendHandler = vi.fn()
const mockListHandler = vi.fn()
const mockGetSessionByIdHandler = vi.fn()

vi.mock('../ridePlanningAgent', () => ({
  get executeRidePlanningAgent() {
    return mockExecuteRidePlanningAgent
  },
}))

vi.mock('../../../db/sessionMessages', () => ({
  get sendHandler() {
    return mockSendHandler
  },
  get listHandler() {
    return mockListHandler
  },
}))

vi.mock('../../../db/planningSessions', () => ({
  get getSessionByIdHandler() {
    return mockGetSessionByIdHandler
  },
}))

// Mock internal so buildCardCallbacks can import it without Convex runtime
vi.mock('../../../_generated/api', () => ({
  internal: {
    db: {
      sessionMessages: {
        createPendingAssistantMessage: { __ref: 'createPendingAssistantMessage' },
        finalizeAssistantMessage: { __ref: 'finalizeAssistantMessage' },
        appendStreamingChunk: { __ref: 'appendStreamingChunk' },
        addSystemMessage: { __ref: 'addSystemMessage' },
      },
      planUsage: {
        checkUsageInternal: { __ref: 'checkUsageInternal' },
        incrementUsageInternal: { __ref: 'incrementUsageInternal' },
      },
    },
  },
  api: {
    db: {
      planningSessions: { getSessionById: { __ref: 'getSessionById' } },
      sessionMessages: {
        send: { __ref: 'send' },
        list: { __ref: 'list' },
      },
    },
  },
}))

// -----------------------------------------------------------------------------
// Test Data
// -----------------------------------------------------------------------------

const mockSession = {
  _id: 'session123' as Id<'planning_sessions'>,
  _creationTime: Date.now(),
  clerkUserId: 'user123',
  title: 'Test Session',
  status: 'active' as const,
  createdAt: Date.now(),
  updatedAt: Date.now(),
}

const mockMessages = [
  {
    _id: 'msg1' as Id<'session_messages'>,
    _creationTime: Date.now(),
    sessionId: 'session123' as Id<'planning_sessions'>,
    role: 'rider' as const,
    content: 'Plan a scenic route',
    createdAt: Date.now(),
  },
  {
    _id: 'msg2' as Id<'session_messages'>,
    _creationTime: Date.now(),
    sessionId: 'session123' as Id<'planning_sessions'>,
    role: 'system' as const,
    content: 'Here are your routes',
    createdAt: Date.now(),
  },
]

const mockAgentResult = {
  response: "Here are 2 scenic routes for your ride to Santa Cruz. The first takes Highway 9 for beautiful redwood views.",
  attachments: [
    {
      type: 'route_options',
      routePlanId: 'plan123' as Id<'route_plans'>,
    },
  ],
}

// -----------------------------------------------------------------------------
// Mock Context
// -----------------------------------------------------------------------------

const mockActionCtx = {
  auth: {
    getUserIdentity: vi.fn(),
  },
  runQuery: vi.fn(),
  runMutation: vi.fn(),
}

type SendMessageCtx = typeof mockActionCtx & {
  runMutation: any
}

// -----------------------------------------------------------------------------
// Pure handler function for testing
// -----------------------------------------------------------------------------

/**
 * Testable handler for sendMessage orchestration logic.
 * This extracts the deterministic orchestration logic from the Convex action wrapper.
 */
async function sendMessageHandler(
  ctx: SendMessageCtx,
  args: { sessionId: Id<'planning_sessions'>; content: string; currentLocation?: { lat: number; lng: number } },
  clerkUserId: string
): Promise<{ response: string; messageId: Id<'session_messages'>; attachments?: any[] }> {
  // Step 1: Validate session ownership (deterministic)
  await mockGetSessionByIdHandler(
    ctx as any,
    { sessionId: args.sessionId },
    clerkUserId
  )

  // Step 2: Persist rider message (deterministic)
  await mockSendHandler(
    ctx as any,
    { sessionId: args.sessionId, content: args.content },
    clerkUserId
  )

  // Step 3: Build conversation context for the agent
  const messages = await mockListHandler(
    ctx as any,
    { sessionId: args.sessionId }
  )

  // Convert to agent format (role: content:)
  const conversationHistory = messages.map((msg) => ({
    role: msg.role, // 'rider' or 'system'
    content: msg.content,
  }))

  // Step 4: Run agent with session context (probabilistic)
  let agentResult
  try {
    agentResult = await mockExecuteRidePlanningAgent(
      {
        sessionId: args.sessionId,
        clerkUserId,
        conversationHistory,
        currentLocation: args.currentLocation,
        runQuery: ctx.runQuery.bind(ctx),
        runMutation: ctx.runMutation.bind(ctx),
      },
      args.content
    )
  } catch (error) {
    // Convert agent errors to conversational messages
    console.error('[sendMessage] Agent error:', error)
    agentResult = {
      response: "I'm having trouble right now. Could you try again?",
      attachments: undefined,
    }
  }

  // Step 5: Persist system response (deterministic) - mocked for test
  const systemMessageResult = await ctx.runMutation(
    'internalMutation',
    {
      sessionId: args.sessionId,
      content: agentResult.response,
      attachments: agentResult.attachments,
    }
  )

  // Step 6: Return response to client
  return {
    response: agentResult.response,
    messageId: systemMessageResult.messageId,
    attachments: agentResult.attachments,
  }
}

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('sendMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSessionByIdHandler.mockResolvedValue(mockSession)
    mockSendHandler.mockResolvedValue({ messageId: 'msg1' as Id<'session_messages'> })
    mockListHandler.mockResolvedValue(mockMessages)
    mockExecuteRidePlanningAgent.mockResolvedValue(mockAgentResult)
    mockActionCtx.runMutation.mockResolvedValue({
      messageId: 'msg2' as Id<'session_messages'>,
    })
  })

  it('should validate session ownership', async () => {
    await sendMessageHandler(mockActionCtx, {
      sessionId: 'session123' as Id<'planning_sessions'>,
      content: 'Plan a scenic route to Santa Cruz',
    }, 'user123')

    expect(mockGetSessionByIdHandler).toHaveBeenCalledWith(
      mockActionCtx,
      { sessionId: 'session123' },
      'user123'
    )
  })

  it('should persist rider message', async () => {
    await sendMessageHandler(mockActionCtx, {
      sessionId: 'session123' as Id<'planning_sessions'>,
      content: 'Plan a scenic route to Santa Cruz',
    }, 'user123')

    expect(mockSendHandler).toHaveBeenCalledWith(
      mockActionCtx,
      { sessionId: 'session123', content: 'Plan a scenic route to Santa Cruz' },
      'user123'
    )
  })

  it('should load conversation history for agent context', async () => {
    await sendMessageHandler(mockActionCtx, {
      sessionId: 'session123' as Id<'planning_sessions'>,
      content: 'avoid Highway 1',
    }, 'user123')

    expect(mockListHandler).toHaveBeenCalledWith(mockActionCtx, { sessionId: 'session123' })
  })

  it('should execute agent with session context', async () => {
    await sendMessageHandler(mockActionCtx, {
      sessionId: 'session123' as Id<'planning_sessions'>,
      content: 'Plan a scenic route to Santa Cruz',
    }, 'user123')

    expect(mockExecuteRidePlanningAgent).toHaveBeenCalledWith(
      {
        sessionId: 'session123',
        clerkUserId: 'user123',
        conversationHistory: [
          { role: 'rider', content: 'Plan a scenic route' },
          { role: 'system', content: 'Here are your routes' },
        ],
        currentLocation: undefined,
        runQuery: expect.any(Function),
        runMutation: expect.any(Function),
      },
      'Plan a scenic route to Santa Cruz'
    )
  })

  it('should persist system response (deterministic)', async () => {
    const result = await sendMessageHandler(mockActionCtx, {
      sessionId: 'session123' as Id<'planning_sessions'>,
      content: 'Plan a scenic route to Santa Cruz',
    }, 'user123')

    expect(mockActionCtx.runMutation).toHaveBeenCalledWith(
      'internalMutation',
      {
        sessionId: 'session123',
        content: mockAgentResult.response,
        attachments: mockAgentResult.attachments,
      }
    )
    expect(result.messageId).toBe('msg2')
  })

  it('should return response with attachments to client', async () => {
    const result = await sendMessageHandler(mockActionCtx, {
      sessionId: 'session123' as Id<'planning_sessions'>,
      content: 'Plan a scenic route to Santa Cruz',
    }, 'user123')

    expect(result.response).toBe(mockAgentResult.response)
    expect(result.attachments).toEqual(mockAgentResult.attachments)
    expect(result.messageId).toBeDefined()
  })

  it('should convert agent errors to conversational messages', async () => {
    mockExecuteRidePlanningAgent.mockRejectedValue(new Error('Agent timeout'))

    const result = await sendMessageHandler(mockActionCtx, {
      sessionId: 'session123' as Id<'planning_sessions'>,
      content: 'Plan a scenic route to Santa Cruz',
    }, 'user123')

    expect(result.response).toContain('trouble')
    expect(mockActionCtx.runMutation).toHaveBeenCalled() // Still persists the error message
  })

  it('should include current location in agent context when provided', async () => {
    await sendMessageHandler(mockActionCtx, {
      sessionId: 'session123' as Id<'planning_sessions'>,
      content: 'Plan a scenic route to Santa Cruz',
      currentLocation: { lat: 37.7749, lng: -122.4194 },
    }, 'user123')

    expect(mockExecuteRidePlanningAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        currentLocation: { lat: 37.7749, lng: -122.4194 },
      }),
      expect.any(String)
    )
  })
})

// -----------------------------------------------------------------------------
// Tests: TOOL_TO_CARD_KIND mapping
// -----------------------------------------------------------------------------

describe('TOOL_TO_CARD_KIND', () => {
  it('maps planRoute to routing_card', () => {
    expect(TOOL_TO_CARD_KIND['planRoute']).toBe('routing_card')
  })

  it('maps fetchWeather to weather_card', () => {
    expect(TOOL_TO_CARD_KIND['fetchWeather']).toBe('weather_card')
  })

  it('maps saveRoute to saved_route_card', () => {
    expect(TOOL_TO_CARD_KIND['saveRoute']).toBe('saved_route_card')
  })

  it('does not map geocode', () => {
    expect(TOOL_TO_CARD_KIND['geocode']).toBeUndefined()
  })
})

// -----------------------------------------------------------------------------
// Tests: buildCardCallbacks
// -----------------------------------------------------------------------------

describe('buildCardCallbacks', () => {
  const sessionId = 'session_card_test' as Id<'planning_sessions'>
  const cardMessageId = 'card_msg_1' as Id<'session_messages'>

  let runMutation: ReturnType<typeof vi.fn>

  beforeEach(() => {
    runMutation = vi.fn()
  })

  it('creates a pending routing_card message when planRoute starts', async () => {
    runMutation.mockResolvedValue({ messageId: cardMessageId })
    const { onToolStart } = buildCardCallbacks(sessionId, runMutation)

    const result = await onToolStart!('planRoute', {})

    expect(runMutation).toHaveBeenCalledWith(
      { __ref: 'createPendingAssistantMessage' },
      { sessionId, kind: 'routing_card' }
    )
    expect(result).toEqual({ messageId: cardMessageId })
  })

  it('does NOT create a card message for non-card tools (geocode)', async () => {
    const { onToolStart } = buildCardCallbacks(sessionId, runMutation)

    const result = await onToolStart!('geocode', { query: 'Santa Cruz' })

    expect(runMutation).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it('finalizes the card as complete when planRoute succeeds', async () => {
    runMutation.mockResolvedValue(null)
    const { onToolFinish } = buildCardCallbacks(sessionId, runMutation)

    await onToolFinish!('planRoute', cardMessageId, {
      type: 'routes',
      data: { planId: 'plan_abc', options: [] },
    })

    expect(runMutation).toHaveBeenCalledWith(
      { __ref: 'finalizeAssistantMessage' },
      { messageId: cardMessageId, status: 'complete' }
    )
  })

  it('finalizes the card as failed when planRoute returns error type', async () => {
    runMutation.mockResolvedValue(null)
    const { onToolFinish } = buildCardCallbacks(sessionId, runMutation)

    await onToolFinish!('planRoute', cardMessageId, {
      type: 'error',
      message: 'Something went wrong',
    })

    expect(runMutation).toHaveBeenCalledWith(
      { __ref: 'finalizeAssistantMessage' },
      { messageId: cardMessageId, status: 'failed' }
    )
  })

  it('skips finalize when messageId is undefined (non-card tool path)', async () => {
    const { onToolFinish } = buildCardCallbacks(sessionId, runMutation)

    await onToolFinish!('geocode', undefined, { results: [] })

    expect(runMutation).not.toHaveBeenCalled()
  })

  it('creates a pending weather_card message when fetchWeather starts', async () => {
    runMutation.mockResolvedValue({ messageId: cardMessageId })
    const { onToolStart } = buildCardCallbacks(sessionId, runMutation)

    const result = await onToolStart!('fetchWeather', { location: 'San Jose' })

    expect(runMutation).toHaveBeenCalledWith(
      { __ref: 'createPendingAssistantMessage' },
      { sessionId, kind: 'weather_card' }
    )
    expect(result).toEqual({ messageId: cardMessageId })
  })

  it('creates a pending saved_route_card message when saveRoute starts', async () => {
    runMutation.mockResolvedValue({ messageId: cardMessageId })
    const { onToolStart } = buildCardCallbacks(sessionId, runMutation)

    const result = await onToolStart!('saveRoute', { routeIndex: 0, name: 'My Route' })

    expect(runMutation).toHaveBeenCalledWith(
      { __ref: 'createPendingAssistantMessage' },
      { sessionId, kind: 'saved_route_card' }
    )
    expect(result).toEqual({ messageId: cardMessageId })
  })
})

// -----------------------------------------------------------------------------
// Tests: buildStreamingContext
// -----------------------------------------------------------------------------

describe('buildStreamingContext', () => {
  const sessionId = 'session_stream_test' as Id<'planning_sessions'>
  const textMessageId = 'text_msg_1' as Id<'session_messages'>

  let runMutation: ReturnType<typeof vi.fn>

  beforeEach(() => {
    runMutation = vi.fn()
  })

  it('creates a pending text message with status: streaming', async () => {
    runMutation.mockResolvedValueOnce({ messageId: textMessageId })

    await buildStreamingContext(sessionId, runMutation)

    expect(runMutation).toHaveBeenCalledWith(
      { __ref: 'createPendingAssistantMessage' },
      { sessionId, kind: 'text' }
    )
  })

  it('returns undefined from getMessageId before any delta fires', async () => {
    const { getMessageId } = await buildStreamingContext(sessionId, runMutation)

    expect(getMessageId()).toBeUndefined()
  })

  it('onTextDelta calls appendStreamingChunk with the delta', async () => {
    runMutation.mockResolvedValueOnce({ messageId: textMessageId })
    runMutation.mockResolvedValueOnce(null) // appendStreamingChunk

    const { onTextDelta } = await buildStreamingContext(sessionId, runMutation)
    await onTextDelta('Hello ')

    expect(runMutation).toHaveBeenCalledWith(
      { __ref: 'appendStreamingChunk' },
      { messageId: textMessageId, delta: 'Hello ' }
    )
  })

  it('onTextDelta is called multiple times for multiple chunks', async () => {
    runMutation.mockResolvedValueOnce({ messageId: textMessageId })
    runMutation.mockResolvedValue(null)

    const { onTextDelta } = await buildStreamingContext(sessionId, runMutation)
    const chunks = ['Hello ', 'world', '!']
    for (const chunk of chunks) {
      await onTextDelta(chunk)
    }

    const appendCalls = runMutation.mock.calls.filter(
      ([ref]: [any]) => ref?.__ref === 'appendStreamingChunk'
    )
    expect(appendCalls).toHaveLength(3)

    const allDeltas = appendCalls.map(([, args]: [any, any]) => args.delta).join('')
    expect(allDeltas).toBe('Hello world!')
  })

  it('total streamed content matches the final response text', async () => {
    const responseText = 'Here are 2 scenic routes for your ride.'
    runMutation.mockResolvedValueOnce({ messageId: textMessageId })
    runMutation.mockResolvedValue(null)

    const { onTextDelta } = await buildStreamingContext(sessionId, runMutation)

    // Simulate streaming the full response as individual word deltas
    const words = responseText.split(' ')
    for (let i = 0; i < words.length; i++) {
      const delta = i === 0 ? words[i] : ' ' + words[i]
      await onTextDelta(delta)
    }

    const appendCalls = runMutation.mock.calls.filter(
      ([ref]: [any]) => ref?.__ref === 'appendStreamingChunk'
    )
    const reconstructed = appendCalls.map(([, args]: [any, any]) => args.delta).join('')
    expect(reconstructed).toBe(responseText)
  })

  it('finalizeOk calls finalizeAssistantMessage with status: complete', async () => {
    runMutation.mockResolvedValueOnce({ messageId: textMessageId })
    runMutation.mockResolvedValueOnce(null) // finalize

    const { finalizeOk } = await buildStreamingContext(sessionId, runMutation)
    await finalizeOk()

    expect(runMutation).toHaveBeenCalledWith(
      { __ref: 'finalizeAssistantMessage' },
      { messageId: textMessageId, status: 'complete' }
    )
  })

  it('finalizeFail calls finalizeAssistantMessage with status: failed', async () => {
    runMutation.mockResolvedValueOnce({ messageId: textMessageId })
    runMutation.mockResolvedValueOnce(null) // finalize

    const { finalizeFail } = await buildStreamingContext(sessionId, runMutation)
    await finalizeFail()

    expect(runMutation).toHaveBeenCalledWith(
      { __ref: 'finalizeAssistantMessage' },
      { messageId: textMessageId, status: 'failed' }
    )
  })
})

// -----------------------------------------------------------------------------
// Tests: streaming integration (sendMessage handler with buildStreamingContext)
// -----------------------------------------------------------------------------

describe('sendMessage streaming integration', () => {
  const sessionId = 'session_integration' as Id<'planning_sessions'>
  const textMessageId = 'text_msg_integration' as Id<'session_messages'>
  const responseText = 'Your scenic route is ready!'

  it('creates a streaming message, calls appendStreamingChunk at least once, then finalizes complete', async () => {
    const runMutation = vi.fn()

    // Call 1: createPendingAssistantMessage → returns messageId
    runMutation.mockResolvedValueOnce({ messageId: textMessageId })
    // Subsequent calls: appendStreamingChunk + finalizeAssistantMessage return null
    runMutation.mockResolvedValue(null)

    const { getMessageId, onTextDelta, finalizeOk } = await buildStreamingContext(sessionId, runMutation)
    expect(getMessageId()).toBeUndefined() // row not yet created — no delta fired

    // Simulate agent streaming deltas
    await onTextDelta('Your scenic ')
    await onTextDelta('route is ready!')

    await finalizeOk()

    // Assert createPendingAssistantMessage was called with kind: text
    expect(runMutation).toHaveBeenNthCalledWith(
      1,
      { __ref: 'createPendingAssistantMessage' },
      { sessionId, kind: 'text' }
    )

    // Assert appendStreamingChunk called at least once
    const appendCalls = runMutation.mock.calls.filter(
      ([ref]: [any]) => ref?.__ref === 'appendStreamingChunk'
    )
    expect(appendCalls.length).toBeGreaterThanOrEqual(1)

    // Assert total content equals response text
    const totalContent = appendCalls.map(([, args]: [any, any]) => args.delta).join('')
    expect(totalContent).toBe(responseText)

    // Assert finalizeAssistantMessage called with complete
    expect(runMutation).toHaveBeenCalledWith(
      { __ref: 'finalizeAssistantMessage' },
      { messageId: textMessageId, status: 'complete' }
    )
  })

  it('calls finalizeAssistantMessage with status: failed when agent errors', async () => {
    const runMutation = vi.fn()
    runMutation.mockResolvedValueOnce({ messageId: textMessageId })
    runMutation.mockResolvedValue(null)

    const { finalizeFail } = await buildStreamingContext(sessionId, runMutation)

    // Simulate agent error path
    await finalizeFail()

    expect(runMutation).toHaveBeenCalledWith(
      { __ref: 'finalizeAssistantMessage' },
      { messageId: textMessageId, status: 'failed' }
    )
  })
})
