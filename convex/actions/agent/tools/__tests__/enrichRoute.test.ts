import { enrichRoute, type RouteEnrichment } from '../enrichRoute'
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'

// Mock the ai module
vi.mock('ai', () => ({
  generateObject: vi.fn(),
}))

// Mock the @ai-sdk/openai module
vi.mock('@ai-sdk/openai', () => ({
  openai: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const buildTestRoutes = (count: number = 3) => {
  return Array.from({ length: count }, (_, idx) => ({
    waypoints: [
      { name: `Start ${idx + 1}`, type: 'junction' },
      { name: `Tioga Pass`, type: 'pass' },
      { name: `End ${idx + 1}`, type: 'junction' },
    ],
    stats: {
      distanceMeters: 50000 + idx * 10000,
      durationSeconds: 3600 + idx * 600,
    },
    preferences: {
      scenicBias: 'high',
      avoidHighways: true,
    },
  }))
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('enrichRoute', () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-openai-key'
    vi.clearAllMocks()
  })

  afterEach(() => {
    delete process.env.AI_MODEL
  })

  describe('aisdk integration', () => {
    it('returns enriched labels from aisdk response', async () => {
      vi.mocked(generateObject).mockResolvedValue({
        object: {
          routes: [
            {
              label: 'High Sierra Crest via Tioga Pass',
              rationale: 'A scenic mountain route crossing the Sierra Nevada through the famous Tioga Pass.',
              highlights: ['Mountain pass', 'Alpine meadows', 'Sweeping views'],
            },
            {
              label: 'Coastal Highway Loop',
              rationale: 'Ocean views with winding coastal roads and dramatic cliffs.',
              highlights: ['Ocean vistas', 'Winding roads', 'Coastal towns'],
            },
            {
              label: 'Desert Valley Tour',
              rationale: 'A journey through high desert valleys with unique geological formations.',
              highlights: ['Desert landscape', 'Rock formations', 'Open roads'],
            },
          ],
        },
        usage: { promptTokens: 100, completionTokens: 50 },
        finishReason: 'stop',
      } as any)

      const routes = buildTestRoutes(3)
      const result = await enrichRoute({ routes })

      expect(result).toHaveLength(3)
      expect(result[0]).toEqual({
        label: 'High Sierra Crest via Tioga Pass',
        rationale: 'A scenic mountain route crossing the Sierra Nevada through the famous Tioga Pass.',
        highlights: ['Mountain pass', 'Alpine meadows', 'Sweeping views'],
      })
      expect(result[1]).toEqual({
        label: 'Coastal Highway Loop',
        rationale: 'Ocean views with winding coastal roads and dramatic cliffs.',
        highlights: ['Ocean vistas', 'Winding roads', 'Coastal towns'],
      })
      expect(result[2]).toEqual({
        label: 'Desert Valley Tour',
        rationale: 'A journey through high desert valleys with unique geological formations.',
        highlights: ['Desert landscape', 'Rock formations', 'Open roads'],
      })
    })

    it('returns fallback labels when aisdk fails', async () => {
      vi.mocked(generateObject).mockRejectedValue(new Error('OpenAI API error'))

      const routes = buildTestRoutes(2)
      const result = await enrichRoute({ routes })

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        label: 'Route 1',
        rationale: 'A scenic route through the area.',
        highlights: ['Scenic roads', 'Local character'],
      })
      expect(result[1]).toEqual({
        label: 'Route 2',
        rationale: 'A scenic route through the area.',
        highlights: ['Scenic roads', 'Local character'],
      })
    })

    it('returns fallback labels when OPENAI_API_KEY missing', async () => {
      delete process.env.OPENAI_API_KEY

      const routes = buildTestRoutes(2)
      const result = await enrichRoute({ routes })

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        label: 'Route 1',
        rationale: 'A scenic route through the area.',
        highlights: ['Scenic roads', 'Local character'],
      })
    })
  })

  describe('prompt construction', () => {
    it('includes waypoint names in aisdk prompt', async () => {
      vi.mocked(generateObject).mockResolvedValue({
        object: {
          routes: [
            {
              label: 'Yosemite Tioga Pass Adventure',
              rationale: 'Scenic mountain route',
              highlights: ['Mountain views'],
            },
          ],
        },
        usage: { promptTokens: 100, completionTokens: 50 },
        finishReason: 'stop',
      } as any)

      const routes = [
        {
          waypoints: [
            { name: 'San Francisco', type: 'city' },
            { name: 'Yosemite Valley', type: 'park' },
            { name: 'Tioga Pass', type: 'pass' },
          ],
          stats: { distanceMeters: 50000, durationSeconds: 3600 },
          preferences: { scenicBias: 'high' },
        },
      ]

      await enrichRoute({ routes })

      expect(vi.mocked(generateObject)).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('San Francisco'),
        })
      )
      expect(vi.mocked(generateObject)).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('Yosemite Valley'),
        })
      )
      expect(vi.mocked(generateObject)).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('Tioga Pass'),
        })
      )
    })

    it('includes route stats in prompt', async () => {
      vi.mocked(generateObject).mockResolvedValue({
        object: {
          routes: [
            {
              label: 'Test Route',
              rationale: 'Test',
              highlights: ['A'],
            },
          ],
        },
        usage: { promptTokens: 100, completionTokens: 50 },
        finishReason: 'stop',
      } as any)

      const routes = [
        {
          waypoints: [
            { name: 'Start', type: 'junction' },
            { name: 'End', type: 'junction' },
          ],
          stats: { distanceMeters: 50000, durationSeconds: 3600 },
        },
      ]

      await enrichRoute({ routes })

      expect(vi.mocked(generateObject)).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('31.1'), // ~50km in miles
        })
      )
      expect(vi.mocked(generateObject)).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('60'), // 3600 seconds in minutes
        })
      )
    })
  })

  describe('schema validation', () => {
    it('uses Zod schema for structured output', async () => {
      vi.mocked(generateObject).mockResolvedValue({
        object: {
          routes: [
            {
              label: 'Test Route',
              rationale: 'Test rationale',
              highlights: ['Highlight 1', 'Highlight 2'],
            },
          ],
        },
        usage: { promptTokens: 100, completionTokens: 50 },
        finishReason: 'stop',
      } as any)

      const routes = buildTestRoutes(1)
      await enrichRoute({ routes })

      // Verify generateObject was called
      expect(vi.mocked(generateObject)).toHaveBeenCalled()

      // Verify schema was passed
      const schemaArg = vi.mocked(generateObject).mock.calls[0][0].schema
      expect(schemaArg).toBeDefined()
      expect(schemaArg._def.typeName).toBe('ZodObject')
    })
  })

  describe('timeout handling', () => {
    it('returns fallback labels on timeout', async () => {
      vi.mocked(generateObject).mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout')), 15000)
          })
      )

      const routes = buildTestRoutes(1)
      const startTime = Date.now()
      const result = await enrichRoute({ routes })
      const endTime = Date.now()

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        label: 'Route 1',
        rationale: 'A scenic route through the area.',
        highlights: ['Scenic roads', 'Local character'],
      })

      // Timeout should be around 10 seconds (with some tolerance)
      const duration = endTime - startTime
      expect(duration).toBeGreaterThanOrEqual(9000)
      expect(duration).toBeLessThanOrEqual(16000) // Allow some margin for timeout overhead
    }, 20000)
  })

  describe('AI_MODEL integration', () => {
    it('uses AI_MODEL environment variable', async () => {
      process.env.AI_MODEL = 'gpt-4o'

      const mockOpenaiCall = vi.mocked(openai)
      mockOpenaiCall.mockReturnValue('mocked-model' as any)

      vi.mocked(generateObject).mockResolvedValue({
        object: {
          routes: [
            {
              label: 'Test',
              rationale: 'Test',
              highlights: ['A'],
            },
          ],
        },
        usage: { promptTokens: 100, completionTokens: 50 },
        finishReason: 'stop',
      } as any)

      const routes = buildTestRoutes(1)
      await enrichRoute({ routes })

      // Verify openai was called with AI_MODEL + apiKey
      expect(mockOpenaiCall).toHaveBeenCalledWith('gpt-4o', expect.objectContaining({ apiKey: expect.any(String) }))
      expect(vi.mocked(generateObject)).toHaveBeenCalled()
    })
  })
})
