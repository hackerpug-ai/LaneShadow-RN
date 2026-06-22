'use node'

/**
 * Integration tests for explicit origin vs destination-only route requests (AC-1..AC-4).
 *
 * AC-1: "Sf to Marin county" with available location → resolves to start=SF, dest=Marin (no clarification)
 * AC-2: "day trip to Santa Cruz" with available location → resolves to start=currentLocation, dest=Santa Cruz
 * AC-3: "Oakland to Half Moon Bay" → resolves to start=Oakland, dest=HMB (not reverse)
 * AC-4: routing sub-agent never surfaces start-clarification when location is available
 *
 * These tests verify the deterministic logic that extracts explicit origins,
 * defaults to current location, and prevents the agent from asking for clarification.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AgentContext } from '../ridePlanningAgent'

// Mock the Convex API to avoid network deps
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

// Mock ONLY the external boundaries (the LLM call + the geocoding network provider) so we can
// drive executeRoutingAgent's DETERMINISTIC recovery for real. runAgent is the model round-trip
// (the project's real LLM tier is Maestro E2E); the geocoder hits Google over the network.
// Everything under test — start resolution + the re-drive guard — runs real.
const runAgentMock = vi.fn()
vi.mock('../runAgent.js', () => ({ runAgent: (...args: unknown[]) => runAgentMock(...args) }))

const geocodeMock = vi.fn()
vi.mock('../providers/geocodingProvider.js', () => ({
  createGeocodingProvider: () => ({ geocode: (...args: unknown[]) => geocodeMock(...args) }),
}))

// Import the real implementation from routingAgent
// (This tests the actual extractExplicitOrigin function, not a duplicate)

describe('Route Start Resolution (AC-1..AC-4)', () => {
  describe('AC-1: "Sf to Marin county" detects explicit origin and uses it', () => {
    it('extracts "Sf" as explicit origin, not destination', async () => {
      const { extractExplicitOrigin } = await import('../agents/routingAgent')
      const origin = extractExplicitOrigin('Sf to Marin county')
      expect(origin).toBe('Sf')
    })

    it('extracts "San Francisco" from "San Francisco to Marin county"', async () => {
      const { extractExplicitOrigin } = await import('../agents/routingAgent')
      const origin = extractExplicitOrigin('San Francisco to Marin county')
      expect(origin).toBe('San Francisco')
    })

    it('does not extract origin from "day trip to San Francisco"', async () => {
      const { extractExplicitOrigin } = await import('../agents/routingAgent')
      const origin = extractExplicitOrigin('day trip to San Francisco')
      expect(origin).toBeNull()
    })
  })

  describe('AC-2: "day trip to Santa Cruz" defaults to current location', () => {
    it('recognizes "day trip to X" as destination-only', async () => {
      const { extractExplicitOrigin } = await import('../agents/routingAgent')
      const origin = extractExplicitOrigin('day trip to Santa Cruz')
      expect(origin).toBeNull()
    })

    it('recognizes "ride to X" as destination-only', async () => {
      const { extractExplicitOrigin } = await import('../agents/routingAgent')
      const origin = extractExplicitOrigin('ride to Santa Cruz')
      expect(origin).toBeNull()
    })

    it('recognizes "scenic ride to X" as destination-only', async () => {
      const { extractExplicitOrigin } = await import('../agents/routingAgent')
      const origin = extractExplicitOrigin('scenic ride to Napa')
      expect(origin).toBeNull()
    })

    it('recognizes "take me to X" as destination-only', async () => {
      const { extractExplicitOrigin } = await import('../agents/routingAgent')
      const origin = extractExplicitOrigin('take me to the coast')
      expect(origin).toBeNull()
    })
  })

  describe('AC-3: "Oakland to Half Moon Bay" extracts Oakland as origin (not reversed)', () => {
    it('extracts "Oakland" as origin from "Oakland to Half Moon Bay"', async () => {
      const { extractExplicitOrigin } = await import('../agents/routingAgent')
      const origin = extractExplicitOrigin('Oakland to Half Moon Bay')
      expect(origin).toBe('Oakland')
    })

    it('extracts "Fremont" from "Fremont to San Jose"', async () => {
      const { extractExplicitOrigin } = await import('../agents/routingAgent')
      const origin = extractExplicitOrigin('Fremont to San Jose')
      expect(origin).toBe('Fremont')
    })

    it('does not confuse destination with origin', async () => {
      const { extractExplicitOrigin } = await import('../agents/routingAgent')
      const origin = extractExplicitOrigin('Los Angeles to San Francisco')
      // LA is the origin, not SF
      expect(origin).toBe('Los Angeles')
    })
  })

  describe('AC-3 edge cases: ambiguous origins should default to current location (safe)', () => {
    it('"take Highway 1 to PCH" has no explicit origin (it is a road instruction)', async () => {
      const { extractExplicitOrigin } = await import('../agents/routingAgent')
      const origin = extractExplicitOrigin('take Highway 1 to PCH')
      expect(origin).toBeNull()
    })

    it('"go to somewhere fun" has no explicit origin', async () => {
      const { extractExplicitOrigin } = await import('../agents/routingAgent')
      const origin = extractExplicitOrigin('go to somewhere fun')
      expect(origin).toBeNull()
    })
  })

  describe('Prompt constraint: NEVER ask start when location is available', () => {
    it('buildRoutingPrompt contains no-ask instruction when currentLocation is provided', async () => {
      const { buildRoutingPrompt } = await import('../agents/routingAgent')

      const ctx = {
        planningSessionId: 'test_session' as any,
        clerkUserId: 'test_user',
        piMessages: [],
        currentLocation: { lat: 37.7749, lng: -122.4194 },
        runQuery: vi.fn(),
        runMutation: vi.fn(),
        runAction: vi.fn(),
      } as unknown as AgentContext

      const prompt = await buildRoutingPrompt(ctx)

      // Must contain explicit "never ask" instruction
      expect(prompt).toContain('NEVER ask "where are you starting from?"')
    })

    it('buildRoutingPrompt contains no-ask instruction when lastKnownLocation is available', async () => {
      const { buildRoutingPrompt } = await import('../agents/routingAgent')

      const ctx = {
        planningSessionId: 'test_session' as any,
        clerkUserId: 'test_user',
        piMessages: [],
        currentLocation: undefined,
        runQuery: vi.fn().mockResolvedValue({
          lastKnownLocation: { lat: 34.05, lng: -118.24 },
        }),
        runMutation: vi.fn(),
        runAction: vi.fn(),
      } as unknown as AgentContext

      const prompt = await buildRoutingPrompt(ctx)

      // Must contain explicit "never ask" instruction
      expect(prompt).toContain('NEVER ask "where are you starting from?"')
    })
  })

  describe('resolveStartLocation: deterministic start (explicit origin geocoded, else current)', () => {
    it('explicit origin → uses the geocoder TOP result (commit-to-first, never disambiguates)', async () => {
      const { resolveStartLocation } = await import('../agents/routingAgent')
      const geocoder = {
        geocode: vi.fn().mockResolvedValue([
          { lat: 37.7749, lng: -122.4194, label: 'San Francisco, CA' },
          { lat: 37.78, lng: -122.41, label: 'San Francisco (other candidate)' },
        ]),
      }
      const start = await resolveStartLocation('Sf to Marin county', { lat: 1, lng: 2 }, geocoder)
      expect(geocoder.geocode).toHaveBeenCalledWith('Sf', { lat: 1, lng: 2 })
      // Top result — NOT the second candidate, NOT a clarification.
      expect(start).toEqual({ lat: 37.7749, lng: -122.4194, label: 'San Francisco, CA' })
    })

    it('destination-only ("day trip to Santa Cruz") → defaults to current location', async () => {
      const { resolveStartLocation } = await import('../agents/routingAgent')
      const geocoder = { geocode: vi.fn() }
      const start = await resolveStartLocation('day trip to Santa Cruz', { lat: 37.3, lng: -121.9 }, geocoder)
      expect(geocoder.geocode).not.toHaveBeenCalled()
      expect(start).toEqual({ lat: 37.3, lng: -121.9, label: 'Current Location' })
    })

    it('explicit origin but geocode FAILS → falls back to current location (never asks)', async () => {
      const { resolveStartLocation } = await import('../agents/routingAgent')
      const geocoder = { geocode: vi.fn().mockRejectedValue(new Error('network')) }
      const start = await resolveStartLocation('Oakland to Half Moon Bay', { lat: 37.8, lng: -122.27 }, geocoder)
      expect(start).toEqual({ lat: 37.8, lng: -122.27, label: 'Current Location' })
    })

    it('no explicit origin AND no location → null (agent legitimately asks where they are)', async () => {
      const { resolveStartLocation } = await import('../agents/routingAgent')
      const geocoder = { geocode: vi.fn() }
      const start = await resolveStartLocation('plan me a ride', undefined, geocoder)
      expect(start).toBeNull()
    })
  })

  describe('buildRoutingPrompt: injects the deterministically-resolved start as a fixed coordinate', () => {
    it('with a resolvedStart, the prompt hands the agent exact coords + forbids asking', async () => {
      const { buildRoutingPrompt } = await import('../agents/routingAgent')
      const ctx = { runQuery: vi.fn() } as unknown as AgentContext
      const prompt = await buildRoutingPrompt(ctx, {
        lat: 37.7749,
        lng: -122.4194,
        label: 'San Francisco, CA',
      })
      expect(prompt).toContain('lat=37.7749')
      expect(prompt).toContain('lng=-122.4194')
      expect(prompt).toContain('San Francisco, CA')
      expect(prompt).toContain('START is already resolved')
      expect(prompt).toContain('NEVER ask "where are you starting from?"')
    })
  })

  describe('AC-4: executeRoutingAgent never surfaces a start-clarification when a location exists', () => {
    beforeEach(() => {
      runAgentMock.mockReset()
      geocodeMock.mockReset()
    })

    const makeConfig = (currentLocation: { lat: number; lng: number } | undefined) => ({
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
      userMessage: 'Sf to Marin county',
    })

    it('agent asks for start on attempt 1 → code re-drives and returns the route (no clarification surfaced)', async () => {
      const { executeRoutingAgent } = await import('../agents/routingAgent')
      geocodeMock.mockResolvedValue([{ lat: 37.7749, lng: -122.4194, label: 'San Francisco, CA' }])
      // Attempt 1: the LLM asks for sub-city precision (the bug). Attempt 2 (after the resolved
      // start is re-asserted by our deterministic guard): it plans the route.
      runAgentMock
        .mockResolvedValueOnce({ response: 'Which part of SF are you starting from?', toolResults: [] })
        .mockResolvedValueOnce({
          response: 'Planned your SF→Marin ride.',
          // A real route_ready: the agent CALLED planRoute (extractRouteAttachments picks this up).
          toolResults: [{ toolName: 'planRoute', result: { type: 'routes', routePlanId: 'plan_123' } }],
        })

      const result = await executeRoutingAgent(makeConfig({ lat: 37.77, lng: -122.41 }))

      expect(runAgentMock).toHaveBeenCalledTimes(2) // re-drove deterministically
      expect(result.status).toBe('route_ready')
      // The augmented retry message must carry the resolved start coordinate.
      const secondCallMessage = (runAgentMock.mock.calls[1][0] as any).context.messages[0].content
      expect(secondCallMessage).toContain('lat=37.7749')
    })

    it('no location available → does NOT re-drive; the (destination) clarification is surfaced once', async () => {
      const { executeRoutingAgent } = await import('../agents/routingAgent')
      geocodeMock.mockResolvedValue([])
      runAgentMock.mockResolvedValue({ response: 'Where would you like to go?', toolResults: [] })

      const cfg = makeConfig(undefined)
      cfg.userMessage = 'plan me a ride' // no explicit origin, no location → resolvedStart is null
      const result = await executeRoutingAgent(cfg)

      expect(runAgentMock).toHaveBeenCalledTimes(1) // no recovery loop without a location
      expect(result.status).toBe('needs_clarification')
    })
  })
})
