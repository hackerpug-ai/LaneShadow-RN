'use node'

/**
 * Tests for agent-owned routing intent.
 *
 * The product contract is: chat is the travel agent interface. Deterministic
 * code supplies location context and tool guardrails; the routing agent owns
 * natural-language interpretation of origins, destinations, and shorthand.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AgentContext } from '../ridePlanningAgent'

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
      planningSessions: {
        updateLastKnownLocation: { __fake: true },
      },
      routePlans: {
        updatePlanStatus: { __fake: true },
      },
    },
  },
}))

const runAgentMock = vi.fn()
vi.mock('../runAgent.js', () => ({ runAgent: (...args: unknown[]) => runAgentMock(...args) }))

const geocodeMock = vi.fn()
vi.mock('../providers/geocodingProvider.js', () => ({
  createGeocodingProvider: () => ({ geocode: (...args: unknown[]) => geocodeMock(...args) }),
}))

describe('Route Start Context: agent-owned intent', () => {
  beforeEach(() => {
    runAgentMock.mockReset()
    geocodeMock.mockReset()
  })

  const makeConfig = (
    currentLocation: { lat: number; lng: number } | undefined,
    userMessage = 'SF to Santacruze',
  ) => ({
    ctx: {
      planningSessionId: 'sess_1' as any,
      clerkUserId: 'user_1',
      currentLocation,
      runQuery: vi.fn().mockResolvedValue(null),
      runMutation: vi.fn().mockResolvedValue(undefined),
      runAction: vi.fn(),
    } as unknown as AgentContext,
    executeCtx: undefined,
    budgetTracker: {} as any,
    userMessage,
  })

  it('prompt supplies default origin context without pre-resolving the rider text', async () => {
    const { buildRoutingPrompt } = await import('../agents/routingAgent')
    const ctx = { runQuery: vi.fn() } as unknown as AgentContext

    const prompt = await buildRoutingPrompt(ctx, {
      lat: 37.7749,
      lng: -122.4194,
      label: 'Current Location',
      source: 'current',
    })

    expect(prompt).toContain('default origin context')
    expect(prompt).toContain('You are responsible for natural-language intent')
    expect(prompt).toContain('Do NOT rely on string-shape rules')
    expect(prompt).toContain('"SF to Santacruze" means San Francisco, CA to Santa Cruz, CA')
    expect(prompt).toContain('NEVER ask "where are you starting from?"')
    expect(prompt).not.toContain('START is already resolved')
    expect(prompt).not.toContain('Use this EXACT start')
  })

  it('with no location context, prompt asks for start only for destination-only route requests', async () => {
    const { buildRoutingPrompt } = await import('../agents/routingAgent')
    const ctx = {
      planningSessionId: 'sess_no_location' as any,
      runQuery: vi.fn().mockResolvedValue(null),
    } as unknown as AgentContext

    const prompt = await buildRoutingPrompt(ctx, null)

    expect(prompt).toContain("Rider's current location: unknown")
    expect(prompt).toContain('"SF to Santacruze"')
    expect(prompt).toContain('Ask where they are starting from only for destination-only')
  })

  it('default start context prefers live location over last-known location', async () => {
    const { getDefaultStartContext } = await import('../agents/routingAgent')
    const ctx = {
      currentLocation: { lat: 37.77, lng: -122.42 },
      runQuery: vi.fn(),
    } as unknown as AgentContext

    await expect(getDefaultStartContext(ctx)).resolves.toEqual({
      lat: 37.77,
      lng: -122.42,
      label: 'Current Location',
      source: 'current',
    })
    expect(ctx.runQuery).not.toHaveBeenCalled()
  })

  it('default start context falls back to last-known location without parsing text', async () => {
    const { getDefaultStartContext } = await import('../agents/routingAgent')
    const ctx = {
      planningSessionId: 'sess_last_known' as any,
      currentLocation: undefined,
      runQuery: vi.fn().mockResolvedValue({
        lastKnownLocation: { lat: 34.05, lng: -118.24 },
      }),
    } as unknown as AgentContext

    await expect(getDefaultStartContext(ctx)).resolves.toEqual({
      lat: 34.05,
      lng: -118.24,
      label: 'Last Known Location',
      source: 'lastKnown',
    })
  })

  it('first routing attempt sends the rider message verbatim and does not geocode aliases in code', async () => {
    const { executeRoutingAgent } = await import('../agents/routingAgent')
    runAgentMock.mockResolvedValue({
      response: 'Planned your SF to Santa Cruz ride.',
      toolResults: [{ toolName: 'planRoute', result: { type: 'routes', routePlanId: 'plan_123' } }],
    })

    const result = await executeRoutingAgent(makeConfig({ lat: 37.77, lng: -122.42 }))

    expect(result.status).toBe('route_ready')
    expect(runAgentMock).toHaveBeenCalledTimes(1)
    expect(geocodeMock).not.toHaveBeenCalled()

    const firstCall = runAgentMock.mock.calls[0][0] as any
    expect(firstCall.context.messages[0].content).toBe('SF to Santacruze')
    expect(firstCall.context.systemPrompt).toContain(
      'You are responsible for natural-language intent',
    )
  })

  it('start-origin clarification is re-driven once when default origin context exists', async () => {
    const { executeRoutingAgent } = await import('../agents/routingAgent')
    runAgentMock
      .mockResolvedValueOnce({
        response: 'Where are you starting from?',
        toolResults: [],
      })
      .mockResolvedValueOnce({
        response: 'Planned your ride.',
        toolResults: [
          { toolName: 'planRoute', result: { type: 'routes', routePlanId: 'plan_456' } },
        ],
      })

    const result = await executeRoutingAgent(
      makeConfig({ lat: 37.77, lng: -122.42 }, 'day trip to Santa Cruz'),
    )

    expect(result.status).toBe('route_ready')
    expect(runAgentMock).toHaveBeenCalledTimes(2)
    expect(geocodeMock).not.toHaveBeenCalled()

    const retryMessage = (runAgentMock.mock.calls[1][0] as any).context.messages[0].content
    expect(retryMessage).toContain('default origin available')
    expect(retryMessage).toContain('lat=37.77')
    expect(retryMessage).toContain('You still own the intent decision')
  })

  it('non-start clarification is surfaced instead of being overwritten by a default origin retry', async () => {
    const { executeRoutingAgent } = await import('../agents/routingAgent')
    runAgentMock.mockResolvedValue({
      response: 'Which Springfield did you mean?',
      toolResults: [],
    })

    const result = await executeRoutingAgent(
      makeConfig({ lat: 37.77, lng: -122.42 }, 'ride to Springfield'),
    )

    expect(result).toEqual({
      status: 'needs_clarification',
      question: 'Which Springfield did you mean?',
    })
    expect(runAgentMock).toHaveBeenCalledTimes(1)
  })

  it('without any location context, start-origin clarification is legitimate and not re-driven', async () => {
    const { executeRoutingAgent } = await import('../agents/routingAgent')
    runAgentMock.mockResolvedValue({
      response: 'Where are you starting from?',
      toolResults: [],
    })

    const cfg = makeConfig(undefined, 'ride to Santa Cruz')
    const result = await executeRoutingAgent(cfg)

    expect(result).toEqual({
      status: 'needs_clarification',
      question: 'Where are you starting from?',
    })
    expect(runAgentMock).toHaveBeenCalledTimes(1)
  })

  it('start clarification detector only matches questions about the route origin', async () => {
    const { isStartLocationClarification } = await import('../agents/routingAgent')

    expect(isStartLocationClarification('Where are you starting from?')).toBe(true)
    expect(isStartLocationClarification('Which part of SF are you starting from?')).toBe(true)
    expect(isStartLocationClarification('Which Springfield did you mean?')).toBe(false)
    expect(isStartLocationClarification('Do you want the coastal or mountain route?')).toBe(false)
  })
})
