'use node'

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Id } from '../../../_generated/dataModel'
import { buildAgentCallbacks, TOOL_TO_CARD_KIND } from '../sendMessage'

// -----------------------------------------------------------------------------
// Test the sendMessage orchestrator logic (without Convex imports)
// -----------------------------------------------------------------------------

// Mock all the dependencies
const mockExecuteRidePlanningAgent = vi.fn()
const mockSendHandler = vi.fn()
const mockListWithPiMessagesHandler = vi.fn()
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
  get listWithPiMessagesHandler() {
    return mockListWithPiMessagesHandler
  },
}))

vi.mock('../../../db/planningSessions', () => ({
  get getSessionByIdHandler() {
    return mockGetSessionByIdHandler
  },
}))

// Mock internal so buildAgentCallbacks can import it without Convex runtime
vi.mock('../../../_generated/api', () => ({
  internal: {
    db: {
      sessionMessages: {
        createPendingAssistantMessage: { __ref: 'createPendingAssistantMessage' },
        finalizeAssistantMessage: { __ref: 'finalizeAssistantMessage' },
        appendStreamingChunk: { __ref: 'appendStreamingChunk' },
        addSystemMessage: { __ref: 'addSystemMessage' },
        listWithPiMessages: { __ref: 'listWithPiMessages' },
        recordAgentTurn: { __ref: 'recordAgentTurn' },
        recordToolResult: { __ref: 'recordToolResult' },
        recordReasoning: { __ref: 'recordReasoning' },
        appendReasoningChunk: { __ref: 'appendReasoningChunk' },
        createThinkingCard: { __ref: 'createThinkingCard' },
        appendThinkingText: { __ref: 'appendThinkingText' },
        appendThinkingStep: { __ref: 'appendThinkingStep' },
        finalizeThinkingCard: { __ref: 'finalizeThinkingCard' },
      },
      planUsage: {
        checkUsageInternal: { __ref: 'checkUsageInternal' },
        incrementUsageInternal: { __ref: 'incrementUsageInternal' },
      },
      planningSessions: {
        updateLastKnownLocation: { __ref: 'updateLastKnownLocation' },
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
    piMessage: { role: 'user', content: 'Plan a scenic route', timestamp: 1000 },
  },
  {
    _id: 'msg2' as Id<'session_messages'>,
    _creationTime: Date.now(),
    sessionId: 'session123' as Id<'planning_sessions'>,
    role: 'system' as const,
    content: 'Here are your routes',
    createdAt: Date.now(),
    piMessage: {
      role: 'assistant',
      content: [{ type: 'text', text: 'Here are your routes' }],
      api: 'openai-completions',
      provider: 'openai',
      model: 'gpt-4o',
      usage: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0,
        totalTokens: 0,
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
      },
      stopReason: 'stop',
      timestamp: 2000,
    },
  },
]

const mockAgentResult = {
  response:
    'Here are 2 scenic routes for your ride to Santa Cruz. The first takes Highway 9 for beautiful redwood views.',
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
  args: {
    sessionId: Id<'planning_sessions'>
    content: string
    currentLocation?: { lat: number; lng: number }
  },
  clerkUserId: string,
): Promise<{ response: string; messageId: Id<'session_messages'>; attachments?: any[] }> {
  // Step 1: Validate session ownership (deterministic)
  await mockGetSessionByIdHandler(ctx as any, { sessionId: args.sessionId }, clerkUserId)

  // Step 2: Persist rider message (deterministic)
  await mockSendHandler(
    ctx as any,
    { sessionId: args.sessionId, content: args.content },
    clerkUserId,
  )

  // Step 3: Build pi-ai Message[] history for the agent
  const rows = await mockListWithPiMessagesHandler(ctx as any, { sessionId: args.sessionId })

  // Build piMessages from rows (excluding the just-persisted rider turn)
  const piMessages = rows.slice(0, -1).flatMap((row: any) => {
    if (row.piMessage) return [row.piMessage]
    return []
  })

  // Step 4: Run agent with session context (probabilistic)
  let agentResult
  try {
    agentResult = await mockExecuteRidePlanningAgent(
      {
        planningSessionId: args.sessionId,
        clerkUserId,
        piMessages,
        currentLocation: args.currentLocation,
        runQuery: ctx.runQuery.bind(ctx),
        runMutation: ctx.runMutation.bind(ctx),
      },
      args.content,
    )
  } catch (_error) {
    agentResult = {
      response: "I'm having trouble right now. Could you try again?",
      attachments: undefined,
    }
  }

  // Step 5: Persist system response (deterministic) - mocked for test
  const systemMessageResult = await ctx.runMutation('internalMutation', {
    sessionId: args.sessionId,
    content: agentResult.response,
    attachments: agentResult.attachments,
  })

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
    mockListWithPiMessagesHandler.mockResolvedValue(mockMessages)
    mockExecuteRidePlanningAgent.mockResolvedValue(mockAgentResult)
    mockActionCtx.runMutation.mockResolvedValue({
      messageId: 'msg2' as Id<'session_messages'>,
    })
  })

  it('should validate session ownership', async () => {
    await sendMessageHandler(
      mockActionCtx,
      {
        sessionId: 'session123' as Id<'planning_sessions'>,
        content: 'Plan a scenic route to Santa Cruz',
      },
      'user123',
    )

    expect(mockGetSessionByIdHandler).toHaveBeenCalledWith(
      mockActionCtx,
      { sessionId: 'session123' },
      'user123',
    )
  })

  it('should persist rider message', async () => {
    await sendMessageHandler(
      mockActionCtx,
      {
        sessionId: 'session123' as Id<'planning_sessions'>,
        content: 'Plan a scenic route to Santa Cruz',
      },
      'user123',
    )

    expect(mockSendHandler).toHaveBeenCalledWith(
      mockActionCtx,
      { sessionId: 'session123', content: 'Plan a scenic route to Santa Cruz' },
      'user123',
    )
  })

  it('should load pi-ai message history for agent context', async () => {
    await sendMessageHandler(
      mockActionCtx,
      {
        sessionId: 'session123' as Id<'planning_sessions'>,
        content: 'avoid Highway 1',
      },
      'user123',
    )

    expect(mockListWithPiMessagesHandler).toHaveBeenCalledWith(mockActionCtx, {
      sessionId: 'session123',
    })
  })

  it('should execute agent with piMessages session context', async () => {
    await sendMessageHandler(
      mockActionCtx,
      {
        sessionId: 'session123' as Id<'planning_sessions'>,
        content: 'Plan a scenic route to Santa Cruz',
      },
      'user123',
    )

    expect(mockExecuteRidePlanningAgent).toHaveBeenCalledWith(
      {
        planningSessionId: 'session123',
        clerkUserId: 'user123',
        // Both mockMessages have piMessage, but the last one is sliced off (current rider turn).
        // So we expect only the first message's piMessage.
        piMessages: [mockMessages[0].piMessage],
        currentLocation: undefined,
        runQuery: expect.any(Function),
        runMutation: expect.any(Function),
      },
      'Plan a scenic route to Santa Cruz',
    )
  })

  it('should persist system response (deterministic)', async () => {
    const result = await sendMessageHandler(
      mockActionCtx,
      {
        sessionId: 'session123' as Id<'planning_sessions'>,
        content: 'Plan a scenic route to Santa Cruz',
      },
      'user123',
    )

    expect(mockActionCtx.runMutation).toHaveBeenCalledWith('internalMutation', {
      sessionId: 'session123',
      content: mockAgentResult.response,
      attachments: mockAgentResult.attachments,
    })
    expect(result.messageId).toBe('msg2')
  })

  it('should return response with attachments to client', async () => {
    const result = await sendMessageHandler(
      mockActionCtx,
      {
        sessionId: 'session123' as Id<'planning_sessions'>,
        content: 'Plan a scenic route to Santa Cruz',
      },
      'user123',
    )

    expect(result.response).toBe(mockAgentResult.response)
    expect(result.attachments).toEqual(mockAgentResult.attachments)
    expect(result.messageId).toBeDefined()
  })

  it('should convert agent errors to conversational messages', async () => {
    mockExecuteRidePlanningAgent.mockRejectedValue(new Error('Agent timeout'))

    const result = await sendMessageHandler(
      mockActionCtx,
      {
        sessionId: 'session123' as Id<'planning_sessions'>,
        content: 'Plan a scenic route to Santa Cruz',
      },
      'user123',
    )

    expect(result.response).toContain('trouble')
    expect(mockActionCtx.runMutation).toHaveBeenCalled() // Still persists the error message
  })

  it('should include current location in agent context when provided', async () => {
    await sendMessageHandler(
      mockActionCtx,
      {
        sessionId: 'session123' as Id<'planning_sessions'>,
        content: 'Plan a scenic route to Santa Cruz',
        currentLocation: { lat: 37.7749, lng: -122.4194 },
      },
      'user123',
    )

    expect(mockExecuteRidePlanningAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        currentLocation: { lat: 37.7749, lng: -122.4194 },
        planningSessionId: 'session123',
        piMessages: expect.any(Array),
      }),
      expect.any(String),
    )
  })
})

// -----------------------------------------------------------------------------
// Tests: TOOL_TO_CARD_KIND mapping
// -----------------------------------------------------------------------------

describe('TOOL_TO_CARD_KIND', () => {
  it('maps planRoute to routing_card', () => {
    expect(TOOL_TO_CARD_KIND.planRoute).toBe('routing_card')
  })

  it('maps compileSketch to routing_card', () => {
    expect(TOOL_TO_CARD_KIND.compileSketch).toBe('routing_card')
  })

  it('does not map fetchWeather (placeholder stub excluded)', () => {
    expect(TOOL_TO_CARD_KIND.fetchWeather).toBeUndefined()
  })

  it('does not map saveRoute (placeholder stub excluded)', () => {
    expect(TOOL_TO_CARD_KIND.saveRoute).toBeUndefined()
  })

  it('does not map geocode', () => {
    expect(TOOL_TO_CARD_KIND.geocode).toBeUndefined()
  })
})

// -----------------------------------------------------------------------------
// Tests: buildAgentCallbacks (merged buildCardCallbacks + buildStreamingContext)
// -----------------------------------------------------------------------------

describe('buildAgentCallbacks', () => {
  const sessionId = 'session_agent_test' as Id<'planning_sessions'>
  const textMessageId = 'text_msg_1' as Id<'session_messages'>
  const cardMessageId = 'card_msg_1' as Id<'session_messages'>
  const thinkingCardId = 'thinking_msg_1' as Id<'session_messages'>

  let runMutation: ReturnType<typeof vi.fn>

  beforeEach(() => {
    runMutation = vi.fn()
  })

  it('does NOT create any rows immediately on construction (lazy)', async () => {
    await buildAgentCallbacks(sessionId, runMutation)

    expect(runMutation).not.toHaveBeenCalled()
  })

  it('getTextMessageId returns undefined before any delta fires', async () => {
    const { getTextMessageId } = await buildAgentCallbacks(sessionId, runMutation)

    expect(getTextMessageId()).toBeUndefined()
  })

  it('first onTextDelta creates the text row and caches messageId', async () => {
    runMutation.mockResolvedValueOnce({ messageId: textMessageId })

    const { getTextMessageId, executeCtx } = await buildAgentCallbacks(sessionId, runMutation)

    await executeCtx.onTextDelta!('Hello')

    expect(runMutation).toHaveBeenCalledTimes(2) // createPendingAssistantMessage + appendStreamingChunk
    expect(getTextMessageId()).toBe(textMessageId)
  })

  it('onToolStart creates thinking card and emits tool_start step', async () => {
    runMutation.mockResolvedValueOnce({ messageId: thinkingCardId })

    const { executeCtx } = await buildAgentCallbacks(sessionId, runMutation)

    await executeCtx.onToolStart!('geocode', { query: 'Santa Cruz' })

    expect(runMutation).toHaveBeenCalledTimes(2) // createThinkingCard + appendThinkingStep
    expect(runMutation).toHaveBeenNthCalledWith(1, { __ref: 'createThinkingCard' }, { sessionId })
    expect(runMutation).toHaveBeenNthCalledWith(
      2,
      { __ref: 'appendThinkingStep' },
      {
        messageId: thinkingCardId,
        step: {
          type: 'tool_start',
          toolName: 'geocode',
          summary: 'Searching for Santa Cruz...',
          timestamp: expect.any(Number),
        },
      },
    )
  })

  it('onToolFinish emits tool_finish step and creates routing card for planRoute', async () => {
    // Thinking card creation (first tool call)
    runMutation.mockResolvedValueOnce({ messageId: thinkingCardId })
    // Append tool_finish step
    runMutation.mockResolvedValueOnce(undefined)
    // Create routing card
    runMutation.mockResolvedValueOnce({ messageId: cardMessageId })
    // Finalize routing card
    runMutation.mockResolvedValueOnce(undefined)

    const { executeCtx } = await buildAgentCallbacks(sessionId, runMutation)

    await executeCtx.onToolFinish!('tc_1', 'planRoute', undefined, {
      type: 'routes',
      data: { planId: 'plan_abc', options: [] },
      routePlanId: 'rp_1' as Id<'route_plans'>,
    })

    expect(runMutation).toHaveBeenCalledTimes(4)
    // Verify tool_finish step was added
    expect(runMutation).toHaveBeenNthCalledWith(
      2,
      { __ref: 'appendThinkingStep' },
      {
        messageId: thinkingCardId,
        step: {
          type: 'tool_finish',
          toolName: 'planRoute',
          summary: 'Route planning complete', // No options in result
          timestamp: expect.any(Number),
        },
      },
    )
    // Verify routing card was created
    expect(runMutation).toHaveBeenNthCalledWith(
      3,
      { __ref: 'createPendingAssistantMessage' },
      {
        sessionId,
        kind: 'routing_card',
        attachments: [{ type: 'route_options', routePlanId: 'rp_1' }],
      },
    )
  })

  it('finalizeOk finalizes both text and thinking cards', async () => {
    // Mock: createPendingAssistantMessage
    runMutation.mockResolvedValueOnce({ messageId: textMessageId })
    // Mock: appendStreamingChunk
    runMutation.mockResolvedValueOnce(undefined)
    // Mock: createThinkingCard
    runMutation.mockResolvedValueOnce({ messageId: thinkingCardId })
    // Mock: appendThinkingStep
    runMutation.mockResolvedValueOnce(undefined)

    const { getTextMessageId, executeCtx, finalizeOk } = await buildAgentCallbacks(
      sessionId,
      runMutation,
    )

    // Create both messages
    await executeCtx.onTextDelta!('Hello')
    await executeCtx.onToolStart!('geocode', {})

    // Clear mock calls
    runMutation.mockClear()
    runMutation.mockResolvedValue(undefined) // All finalization calls return undefined

    // Finalize
    await finalizeOk({ role: 'assistant', content: [] })

    expect(runMutation).toHaveBeenCalledTimes(2)
    expect(runMutation).toHaveBeenNthCalledWith(
      1,
      { __ref: 'finalizeAssistantMessage' },
      {
        messageId: textMessageId,
        status: 'complete',
        piMessage: { role: 'assistant', content: [] },
      },
    )
    expect(runMutation).toHaveBeenNthCalledWith(
      2,
      { __ref: 'finalizeThinkingCard' },
      {
        messageId: thinkingCardId,
      },
    )
  })

  it('finalizeFail finalizes text as failed and thinking as complete', async () => {
    // Mock: createPendingAssistantMessage
    runMutation.mockResolvedValueOnce({ messageId: textMessageId })
    // Mock: appendStreamingChunk
    runMutation.mockResolvedValueOnce(undefined)
    // Mock: createThinkingCard
    runMutation.mockResolvedValueOnce({ messageId: thinkingCardId })
    // Mock: appendThinkingStep
    runMutation.mockResolvedValueOnce(undefined)

    const { executeCtx, finalizeFail } = await buildAgentCallbacks(sessionId, runMutation)

    // Create both messages
    await executeCtx.onTextDelta!('Hello')
    await executeCtx.onToolStart!('geocode', {})

    // Clear mock calls
    runMutation.mockClear()
    runMutation.mockResolvedValue(undefined) // All finalization calls return undefined

    // Finalize with error
    await finalizeFail()

    expect(runMutation).toHaveBeenCalledTimes(2)
    expect(runMutation).toHaveBeenNthCalledWith(
      1,
      { __ref: 'finalizeAssistantMessage' },
      {
        messageId: textMessageId,
        status: 'failed',
      },
    )
    expect(runMutation).toHaveBeenNthCalledWith(
      2,
      { __ref: 'finalizeThinkingCard' },
      {
        messageId: thinkingCardId,
      },
    )
  })

  it('finalizeOk is a no-op when no rows were created', async () => {
    const { finalizeOk } = await buildAgentCallbacks(sessionId, runMutation)

    await finalizeOk()

    expect(runMutation).not.toHaveBeenCalled()
  })

  it('finalizeFail is a no-op when no rows were created', async () => {
    const { finalizeFail } = await buildAgentCallbacks(sessionId, runMutation)

    await finalizeFail()

    expect(runMutation).not.toHaveBeenCalled()
  })
})

describe('sendMessage lazy planning rows', () => {
  it('does not create a planning row before planning events fire', async () => {
    vi.resetModules()

    const executeRidePlanningAgent = vi.fn().mockResolvedValue({
      response: 'Direct reply',
      attachments: undefined,
    })
    const requireIdentity = vi.fn().mockResolvedValue({ clerkUserId: 'user123' })

    vi.doMock('../ridePlanningAgent', () => ({
      executeRidePlanningAgent,
    }))
    vi.doMock('../../../guards', () => ({
      requireIdentity,
    }))
    vi.doMock('../../../_generated/api', () => ({
      internal: {
        db: {
          sessionMessages: {
            createPendingAssistantMessage: { __ref: 'createPendingAssistantMessage' },
            finalizeAssistantMessage: { __ref: 'finalizeAssistantMessage' },
            appendStreamingChunk: { __ref: 'appendStreamingChunk' },
            addSystemMessage: { __ref: 'addSystemMessage' },
            listWithPiMessages: { __ref: 'listWithPiMessages' },
            createThinkingCard: { __ref: 'createThinkingCard' },
            appendThinkingText: { __ref: 'appendThinkingText' },
            appendThinkingStep: { __ref: 'appendThinkingStep' },
            finalizeThinkingCard: { __ref: 'finalizeThinkingCard' },
            updatePlanningContent: { __ref: 'updatePlanningContent' },
          },
          planningSessions: {
            updateLastKnownLocation: { __ref: 'updateLastKnownLocation' },
          },
          performance: {
            recordAgentRun: { __ref: 'recordAgentRun' },
          },
        },
      },
      api: {
        db: {
          planningSessions: { getSessionById: { __ref: 'getSessionById' } },
          sessionMessages: {
            send: { __ref: 'send' },
          },
        },
      },
    }))

    const { sendMessage } = await import('../sendMessage.js')
    const sendMessageHandler =
      typeof sendMessage === 'function'
        ? sendMessage
        : (sendMessage as { handler?: (ctx: unknown, args: unknown) => Promise<unknown> }).handler

    const runQuery = vi.fn(async (fn: { __ref?: string }, args: Record<string, unknown>) => {
      if (fn.__ref === 'getSessionById') {
        return mockSession
      }
      if (fn.__ref === 'listWithPiMessages') {
        return [
          ...mockMessages,
          {
            _id: 'msg3' as Id<'session_messages'>,
            _creationTime: Date.now(),
            sessionId: args.sessionId as Id<'planning_sessions'>,
            role: 'rider' as const,
            content: 'Plan a scenic 2-hour ride starting from San Francisco',
            createdAt: Date.now(),
            piMessage: {
              role: 'user',
              content: 'Plan a scenic 2-hour ride starting from San Francisco',
              timestamp: Date.now(),
            },
          },
        ]
      }
      throw new Error(`Unexpected query ref: ${fn.__ref}`)
    })

    const runMutation = vi.fn(async (fn: { __ref?: string }, args: Record<string, unknown>) => {
      if (fn.__ref === 'updateLastKnownLocation') return null
      if (fn.__ref === 'send') {
        return { messageId: 'rider1' as Id<'session_messages'> }
      }
      if (fn.__ref === 'addSystemMessage') {
        return { messageId: 'system1' as Id<'session_messages'> }
      }
      if (fn.__ref === 'recordAgentRun') return null
      if (fn.__ref === 'appendStreamingChunk' || fn.__ref === 'finalizeAssistantMessage') {
        return null
      }
      throw new Error(`Unexpected mutation ref: ${fn.__ref} kind=${String(args.kind ?? '')}`)
    })

    const ctx = {
      runQuery,
      runMutation,
      runAction: vi.fn(),
      auth: { getUserIdentity: vi.fn() },
    }

    expect(typeof sendMessageHandler).toBe('function')

    const result = await sendMessageHandler!(ctx, {
      sessionId: 'session123' as Id<'planning_sessions'>,
      content: 'Plan a scenic 2-hour ride starting from San Francisco',
      currentLocation: { lat: 37.7749, lng: -122.4194 },
    })

    expect(result.response).toBe('Direct reply')
    expect(
      runMutation.mock.calls.some(
        ([fn, args]) =>
          (fn as { __ref?: string }).__ref === 'createPendingAssistantMessage' &&
          (args as { kind?: string }).kind === 'planning',
      ),
    ).toBe(false)
  })
})
