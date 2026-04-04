'use node'

import type { PlanInput } from '../../../../../models/saved-routes'
import { parseNaturalLanguageInput } from '../parseNaturalLanguageInput'
import { vi, beforeEach, describe, it, expect } from 'vitest'

// Mock generateObject from AI SDK
const mockGenerateObject = vi.fn()

vi.mock('ai', () => ({
  generateObject: vi.fn().mockImplementation(() => mockGenerateObject()),
}))

vi.mock('@ai-sdk/openai', () => ({
  openai: vi.fn().mockReturnValue('mocked-model'),
}))

// Mock withTimeout to avoid actual delays
vi.mock('../../lib/reliability', () => ({
  withTimeout: async (fn, { ms, label }) => {
    return await fn()
  },
}))

// Mock environment variables
process.env.OPENAI_API_KEY = 'test-api-key'

describe('parseNaturalLanguageInput', () => {
  const mockCurrentLocation = { lat: 37.7749, lng: -122.4194 }
  const mockDepartureTime = Date.now() + 3600000

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Given: "2-hour scenic ride from SF to SC"', () => {
    const input = '2-hour scenic ride from SF to SC'

    it('When: parseNaturalLanguageInput called. Then: Returns PlanInput with confidence "high". Verify: Unit test', async () => {
      mockGenerateObject.mockResolvedValueOnce({
        object: {
          origin: {
            lat: 37.7749,
            lng: -122.4194,
            label: 'San Francisco',
          },
          destination: {
            lat: 37.3382,
            lng: -121.8863,
            label: 'Santa Cruz',
          },
          departureTime: mockDepartureTime,
          preferences: {
            scenicBias: 'high',
          },
          isRefinement: false,
          confidence: 'high',
          warnings: [],
        },
      })

      const result = await parseNaturalLanguageInput({
        text: input,
        currentLocation: mockCurrentLocation,
        departureTime: mockDepartureTime,
      })

      expect(result.confidence).toBe('high')
      expect(result.planInput).toBeDefined()
      expect(result.planInput.start).toBeDefined()
      expect(result.planInput.end).toBeDefined()
      expect(result.planInput.departureTime).toBeGreaterThan(0)
      expect(result.planInput.preferences.scenicBias).toBe('high')
      expect(result.planInput.nlpText).toBe(input)
      expect(result.isRefinement).toBe(false)
      expect(result.warnings).toEqual([])
    })
  })

  describe('Given: "make it shorter" with conversation history', () => {
    const input = 'make it shorter'
    const previousMessages = [
      { role: 'user', content: 'Plan a ride from SF to San Jose' },
      { role: 'assistant', content: 'I found a route for you...' },
    ]

    it('When: parseNaturalLanguageInput called. Then: Returns isRefinement true. Verify: Unit test', async () => {
      mockGenerateObject.mockResolvedValueOnce({
        object: {
          origin: {
            lat: 37.7749,
            lng: -122.4194,
            label: 'San Francisco',
          },
          destination: {
            lat: 37.3382,
            lng: -121.8863,
            label: 'San Jose',
          },
          departureTime: mockDepartureTime,
          preferences: {
            scenicBias: 'default',
          },
          isRefinement: true,
          confidence: 'high',
          warnings: [],
        },
      })

      const result = await parseNaturalLanguageInput({
        text: input,
        currentLocation: mockCurrentLocation,
        departureTime: mockDepartureTime,
        previousMessages,
      })

      expect(result.confidence).toBeDefined()
      expect(result.isRefinement).toBe(true)
      expect(result.planInput).toBeDefined()
      expect(result.planInput.nlpText).toBe(input)
    })
  })

  describe('Given: Ambiguous "ride" with no details', () => {
    const input = 'ride'

    it('When: parseNaturalLanguageInput called. Then: Returns confidence "low" with warnings. Verify: Unit test', async () => {
      mockGenerateObject.mockResolvedValueOnce({
        object: {
          origin: {
            lat: 37.7749,
            lng: -122.4194,
          },
          destination: {
            lat: 37.7749,
            lng: -122.4194,
          },
          departureTime: mockDepartureTime,
          preferences: {
            scenicBias: 'default',
          },
          isRefinement: false,
          confidence: 'low',
          warnings: ['Origin location is unclear', 'Destination location is unclear'],
        },
      })

      const result = await parseNaturalLanguageInput({
        text: input,
        currentLocation: mockCurrentLocation,
        departureTime: mockDepartureTime,
      })

      expect(result.confidence).toBe('low')
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings.some((w) => w.includes('unclear'))).toBe(true)
      expect(result.planInput.nlpText).toBe(input)
      expect(result.isRefinement).toBe(false)
    })
  })

  describe('Edge cases', () => {
    it('handles empty input gracefully', async () => {
      const result = await parseNaturalLanguageInput({
        text: '',
        currentLocation: mockCurrentLocation,
        departureTime: mockDepartureTime,
      })

      expect(result.confidence).toBe('low')
      expect(result.warnings.length).toBeGreaterThan(0)
      })

    it('handles very long input', async () => {
      mockGenerateObject.mockResolvedValueOnce({
        object: {
          origin: {
            lat: 37.7749,
            lng: -122.4194,
            label: 'San Francisco',
          },
          destination: {
            lat: 37.3382,
            lng: -121.8863,
            label: 'Santa Cruz',
          },
          departureTime: mockDepartureTime,
          preferences: {
            scenicBias: 'default',
          },
          isRefinement: false,
          confidence: 'high',
          warnings: [],
        },
      })

      const longInput = 'a'.repeat(5000)

      const result = await parseNaturalLanguageInput({
        text: longInput,
        currentLocation: mockCurrentLocation,
        departureTime: mockDepartureTime,
      })

      expect(result).toBeDefined()
      expect(result.planInput.nlpText).toBe(longInput)
    })

    it('sets departureTime to reasonable default when not specified', async () => {
      mockGenerateObject.mockResolvedValueOnce({
        object: {
          origin: {
            lat: 37.7749,
            lng: -122.4194,
            label: 'San Francisco',
          },
          destination: {
            lat: 37.3382,
            lng: -121.8863,
            label: 'Santa Cruz',
          },
          departureTime: undefined, // Not specified
          preferences: {
            scenicBias: 'high',
          },
          isRefinement: false,
          confidence: 'high',
          warnings: [],
        },
      })

      const result = await parseNaturalLanguageInput({
        text: 'ride from SF to SC',
        currentLocation: mockCurrentLocation,
        departureTime: mockDepartureTime,
      })

      expect(result.planInput.departureTime).toBeGreaterThan(Date.now())
      expect(result.planInput.departureTime).toBeLessThan(Date.now() + 86400000) // Within 24h
    })
  })
})
