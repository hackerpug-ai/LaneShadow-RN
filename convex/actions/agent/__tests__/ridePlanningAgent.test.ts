'use node'

import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as aiModule from 'ai'
import {
  executeRidePlanningAgent,
  planRoute,
  refineRoute,
  fetchWeather,
  saveRoute,
  searchFavorites,
  extractRouteAttachments,
} from '../ridePlanningAgent'
import { ERROR_CODES } from '../../../errors'

// -----------------------------------------------------------------------------
// Mocks
// -----------------------------------------------------------------------------

const mockParseNaturalLanguageInput = vi.fn()
const mockPlanRide = vi.fn()
const mockCheckUsage = vi.fn()
const mockIncrementUsage = vi.fn()

// Mock parseNaturalLanguageInput
vi.mock('../tools/parseNaturalLanguageInput', () => ({
  get parseNaturalLanguageInput() {
    return mockParseNaturalLanguageInput
  },
}))

// Mock planRide
vi.mock('../planRide', () => ({
  get planRide() {
    return mockPlanRide
  },
}))

// Mock internal planUsage functions
vi.mock('../../../_generated/api', () => ({
  internal: {
    db: {
      planUsage: {
        checkUsageInternal: {
          __fake: true,
        },
        incrementUsageInternal: {
          __fake: true,
        },
      },
    },
  },
}))

// Mock AI SDK generateText
vi.mock('ai', async () => {
  const actual = await vi.importActual('ai')
  return {
    ...actual,
    generateText: vi.fn(),
  }
})

// -----------------------------------------------------------------------------
// Test Data
// -----------------------------------------------------------------------------

const mockAgentContext = {
  sessionId: 'session123' as any,
  clerkUserId: 'user123',
  conversationHistory: [],
  currentLocation: { lat: 37.7749, lng: -122.4194 },
  runQuery: vi.fn(),
  runMutation: vi.fn(),
}

const mockPlanInput = {
  start: { lat: 37.7749, lng: -122.4194, label: 'San Francisco' },
  end: { lat: 37.8719, lng: -122.2728, label: 'Oakland' },
  departureTime: Date.now() + 3_600_000,
  preferences: { scenicBias: 'default' as const },
  nlpText: 'scenic ride to Oakland',
}

const mockRouteOptions = {
  planId: 'plan123',
  options: [
    {
      routeOptionId: 'opt1',
      label: 'Scenic Bay Route',
      rationale: 'Beautiful views of the bay',
      stats: { distanceMeters: 15000, durationSeconds: 900, legsCount: 1 },
      map: {
        bounds: { north: 1, south: 0, east: 1, west: 0 },
        overviewGeometry: { format: 'polyline' as const, encoding: 'encoded_polyline', precision: 5, value: 'test' },
        legs: [],
        overlays: {},
      },
      overlaysPreview: {
        windSummary: 'unavailable',
        rainSummary: 'unavailable',
        temperatureSummary: 'unavailable',
        conditionsStatus: 'unavailable',
      },
    },
  ],
}

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('ridePlanningAgent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('planRoute', () => {
    it('should parse input and call orchestrator when within rate limit', async () => {
      mockAgentContext.runQuery.mockResolvedValue({ count: 1, limit: 5, allowed: true, remaining: 4 })
      mockParseNaturalLanguageInput.mockResolvedValue({
        planInput: mockPlanInput,
        confidence: 'high' as const,
        isRefinement: false,
        warnings: [],
      })
      mockPlanRide.mockResolvedValue(mockRouteOptions)
      mockAgentContext.runMutation.mockResolvedValue({ count: 2, limit: 5, allowed: true, remaining: 3 })

      const result = await planRoute(mockAgentContext, {
        request: 'scenic ride to Oakland',
        currentLocation: { lat: 37.7749, lng: -122.4194 },
      })

      expect(result.type).toBe('routes')
      if (result.type === 'routes') {
        expect(result.data).toEqual(mockRouteOptions)
      }
      expect(mockAgentContext.runMutation).toHaveBeenCalled()
    })

    it('should return upsell message when rate limit exceeded', async () => {
      mockAgentContext.runQuery.mockResolvedValue({ count: 5, limit: 5, allowed: false, remaining: 0 })

      const result = await planRoute(mockAgentContext, {
        request: 'scenic ride to Oakland',
        currentLocation: { lat: 37.7749, lng: -122.4194 },
      })

      expect(result.type).toBe('chat')
      if (result.type === 'chat') {
        expect(result.message).toContain('monthly limit')
      }
      expect(mockParseNaturalLanguageInput).not.toHaveBeenCalled()
      expect(mockPlanRide).not.toHaveBeenCalled()
    })

    it('should return conversational message for low confidence parse', async () => {
      mockAgentContext.runQuery.mockResolvedValue({ count: 1, limit: 5, allowed: true, remaining: 4 })
      mockParseNaturalLanguageInput.mockResolvedValue({
        planInput: mockPlanInput,
        confidence: 'low' as const,
        isRefinement: false,
        warnings: ['Could not determine destination'],
      })

      const result = await planRoute(mockAgentContext, {
        request: 'unclear request',
        currentLocation: { lat: 37.7749, lng: -122.4194 },
      })

      expect(result.type).toBe('chat')
      if (result.type === 'chat') {
        expect(result.message).toContain('trouble understanding')
      }
    })

    it('should return error message on orchestrator failure', async () => {
      mockAgentContext.runQuery.mockResolvedValue({ count: 1, limit: 5, allowed: true, remaining: 4 })
      mockParseNaturalLanguageInput.mockResolvedValue({
        planInput: mockPlanInput,
        confidence: 'high' as const,
        isRefinement: false,
        warnings: [],
      })
      mockPlanRide.mockRejectedValue(new Error('Orchestrator failed'))

      const result = await planRoute(mockAgentContext, {
        request: 'scenic ride to Oakland',
        currentLocation: { lat: 37.7749, lng: -122.4194 },
      })

      expect(result.type).toBe('error')
      if (result.type === 'error') {
        expect(result.message).toContain("couldn't plan your route")
      }
    })
  })

  describe('refineRoute', () => {
    it('should refine existing route when previous route exists', async () => {
      const contextWithHistory = {
        ...mockAgentContext,
        conversationHistory: [
          { role: 'rider', content: 'plan a route' },
          { role: 'system', content: 'Here are your routes' },
        ],
      }

      contextWithHistory.runQuery.mockResolvedValue({ count: 1, limit: 5, allowed: true, remaining: 4 })
      mockParseNaturalLanguageInput.mockResolvedValue({
        planInput: { ...mockPlanInput, preferences: { ...mockPlanInput.preferences, avoidHighways: true } },
        confidence: 'high' as const,
        isRefinement: true,
        warnings: [],
      })
      mockPlanRide.mockResolvedValue(mockRouteOptions)
      contextWithHistory.runMutation.mockResolvedValue({ count: 2, limit: 5, allowed: true, remaining: 3 })

      const result = await refineRoute(contextWithHistory, { refinement: 'avoid highways' })

      expect(result.type).toBe('routes')
      if (result.type === 'routes') {
        expect(result.data).toEqual(mockRouteOptions)
      }
    })

    it('should return chat message when no previous route exists', async () => {
      const result = await refineRoute(mockAgentContext, { refinement: 'make it shorter' })

      expect(result.type).toBe('chat')
      if (result.type === 'chat') {
        expect(result.message).toContain("don't have a route to refine")
      }
    })
  })

  describe('fetchWeather', () => {
    it('should return weather data placeholder', async () => {
      const result = await fetchWeather(mockAgentContext, { location: 'San Francisco' })

      expect(result.type).toBe('weather')
      if (result.type === 'weather') {
        expect(result.data).toBeDefined()
      }
    })
  })

  describe('saveRoute', () => {
    it('should return confirmation when route exists', async () => {
      const contextWithHistory = {
        ...mockAgentContext,
        conversationHistory: [
          { role: 'rider', content: 'plan a route' },
          { role: 'system', content: 'Here are your routes' },
        ],
      }

      const result = await saveRoute(contextWithHistory, { routeIndex: 0, name: 'My Favorite Route' })

      expect(result.type).toBe('confirmation')
      if (result.type === 'confirmation') {
        expect(result.message).toContain('save')
      }
    })

    it('should return chat message when no route to save', async () => {
      const result = await saveRoute(mockAgentContext, { routeIndex: 0 })

      expect(result.type).toBe('chat')
      if (result.type === 'chat') {
        expect(result.message).toContain("don't see a route")
      }
    })
  })

  describe('searchFavorites', () => {
    it('should return search results placeholder', async () => {
      const result = await searchFavorites(mockAgentContext, { query: 'coastal' })

      expect(result.type).toBe('chat')
      if (result.type === 'chat') {
        expect(result.message).toContain('Searching')
      }
    })
  })

  describe('extractRouteAttachments', () => {
    it('should extract route plan IDs from planRoute tool results', () => {
      const toolResults = [
        {
          toolName: 'planRoute',
          result: JSON.stringify({
            type: 'routes',
            data: { planId: 'plan123', options: [] },
          }),
        },
      ]

      const attachments = extractRouteAttachments(toolResults)

      expect(attachments).toHaveLength(1)
      expect(attachments[0]).toMatchObject({
        type: 'route',
        routePlanId: 'plan123',
      })
    })

    it('should extract route plan IDs from refineRoute tool results', () => {
      const toolResults = [
        {
          toolName: 'refineRoute',
          result: JSON.stringify({
            type: 'routes',
            data: { planId: 'plan456', options: [] },
          }),
        },
      ]

      const attachments = extractRouteAttachments(toolResults)

      expect(attachments).toHaveLength(1)
      expect(attachments[0]).toMatchObject({
        type: 'route',
        routePlanId: 'plan456',
      })
    })

    it('should return empty array when no route tools are called', () => {
      const toolResults = [
        {
          toolName: 'fetchWeather',
          result: JSON.stringify({ type: 'weather', data: {} }),
        },
      ]

      const attachments = extractRouteAttachments(toolResults)

      expect(attachments).toHaveLength(0)
    })

    it('should handle multiple route tool calls', () => {
      const toolResults = [
        {
          toolName: 'planRoute',
          result: JSON.stringify({
            type: 'routes',
            data: { planId: 'plan123', options: [] },
          }),
        },
        {
          toolName: 'refineRoute',
          result: JSON.stringify({
            type: 'routes',
            data: { planId: 'plan456', options: [] },
          }),
        },
      ]

      const attachments = extractRouteAttachments(toolResults)

      expect(attachments).toHaveLength(2)
      expect(attachments[0].routePlanId).toBe('plan123')
      expect(attachments[1].routePlanId).toBe('plan456')
    })

    it('should handle malformed tool results gracefully', () => {
      const toolResults = [
        {
          toolName: 'planRoute',
          result: 'invalid json',
        },
      ]

      const attachments = extractRouteAttachments(toolResults)

      expect(attachments).toHaveLength(0)
    })
  })

  describe('executeRidePlanningAgent', () => {
    it('should return empty attachments when no route tool is called', async () => {
      // Mock generateText to simulate chat-only response
      vi.mocked(aiModule.generateText).mockResolvedValue({
        text: 'Hello! How can I help you today?',
        toolCalls: [],
        toolResults: [],
        usage: { promptTokens: 10, completionTokens: 20 } as any,
        finishReason: 'stop' as const,
        warnings: undefined,
        responseMessages: {} as any,
        requestId: '',
        experimental_providerMetadata: undefined as any,
      } as any)

      const result = await executeRidePlanningAgent(mockAgentContext, 'hello, how are you?')

      // Verify attachments are undefined or empty for chat-only responses
      expect(result.attachments).toBeUndefined()
    })
  })
})
