import { enrichRoute, type RouteEnrichment } from '../enrichRoute'
import { vi } from 'vitest'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockOpenAISuccess = (responseContent: string): typeof globalThis.fetch => {
  return vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      choices: [
        {
          message: {
            content: responseContent,
          },
        },
      ],
    }),
    text: async () => JSON.stringify({ choices: [{ message: { content: responseContent } }] }),
  }))
}

const mockOpenAITimeout = (): typeof globalThis.fetch => {
  return vi.fn(async (_url: string, options?: RequestInit) => {
    // Simulate timeout by never resolving until aborted
    return new Promise((_, reject) => {
      const signal = options?.signal as AbortSignal | undefined

      if (signal) {
        const handleAbort = () => {
          reject(new Error('AbortError'))
        }
        signal.addEventListener('abort', handleAbort)
      }
    })
  })
}

const mockOpenAIFailure = (error: string): typeof globalThis.fetch => {
  return vi.fn(async () => ({
    ok: false,
    status: 500,
    json: async () => ({ error }),
    text: async () => JSON.stringify({ error }),
  }))
}

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
    delete process.env.ENRICH_MODEL
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('successful OpenAI response', () => {
    it('returns labels for 3 routes from valid OpenAI response', async () => {
      const mockResponse = JSON.stringify({
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
      })

      ;(globalThis as any).fetch = mockOpenAISuccess(mockResponse)

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

    it('handles partial response data gracefully', async () => {
      const mockResponse = JSON.stringify({
        routes: [
          {
            label: 'Full Route',
            rationale: 'Complete data',
            highlights: ['A', 'B'],
          },
          {
            label: 'Missing fields',
            // Missing rationale and highlights
          },
          {
            // Missing label
            rationale: 'No label',
            highlights: ['C'],
          },
        ],
      })

      ;(globalThis as any).fetch = mockOpenAISuccess(mockResponse)

      const routes = buildTestRoutes(3)
      const result = await enrichRoute({ routes })

      expect(result).toHaveLength(3)
      expect(result[0].label).toBe('Full Route')
      expect(result[0].rationale).toBe('Complete data')
      expect(result[0].highlights).toEqual(['A', 'B'])

      expect(result[1].label).toBe('Missing fields')
      expect(result[1].rationale).toBe('')
      expect(result[1].highlights).toEqual([])

      expect(result[2].label).toBe('Route 3')
      expect(result[2].rationale).toBe('No label')
      expect(result[2].highlights).toEqual(['C'])
    })
  })

  describe('error handling', () => {
    it('returns fallback labels on JSON parse error', async () => {
      ;(globalThis as any).fetch = mockOpenAISuccess('invalid json{{}')

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

    it('returns fallback labels on OpenAI timeout', async () => {
      ;(globalThis as any).fetch = mockOpenAITimeout()

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

      // Timeout should be around 10 seconds (with some tolerance for test execution)
      const duration = endTime - startTime
      expect(duration).toBeGreaterThanOrEqual(9000)
      expect(duration).toBeLessThan(15000)
    }, 20000)

    it('returns fallback labels when OPENAI_API_KEY missing', async () => {
      delete process.env.OPENAI_API_KEY
      ;(globalThis as any).fetch = mockOpenAISuccess('{"routes":[]}')

      const routes = buildTestRoutes(2)
      const result = await enrichRoute({ routes })

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        label: 'Route 1',
        rationale: 'A scenic route through the area.',
        highlights: ['Scenic roads', 'Local character'],
      })
    })

    it('returns fallback labels on HTTP error', async () => {
      ;(globalThis as any).fetch = mockOpenAIFailure('Internal Server Error')

      const routes = buildTestRoutes(1)
      const result = await enrichRoute({ routes })

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        label: 'Route 1',
        rationale: 'A scenic route through the area.',
        highlights: ['Scenic roads', 'Local character'],
      })
    })

    it('returns fallback labels on empty response', async () => {
      ;(globalThis as any).fetch = mockOpenAISuccess('')

      const routes = buildTestRoutes(1)
      const result = await enrichRoute({ routes })

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        label: 'Route 1',
        rationale: 'A scenic route through the area.',
        highlights: ['Scenic roads', 'Local character'],
      })
    })
  })

  describe('environment configuration', () => {
    it('uses ENRICH_MODEL env var when set', async () => {
      process.env.ENRICH_MODEL = 'gpt-4o'
      const mockResponse = JSON.stringify({
        routes: [
          {
            label: 'Test Route',
            rationale: 'Test',
            highlights: ['A'],
          },
        ],
      })

      let capturedUrl: string | undefined
      let capturedBody: string | undefined

      ;(globalThis as any).fetch = vi.fn(async (url: string, options?: RequestInit) => {
        capturedUrl = url
        capturedBody = options?.body as string
        return {
          ok: true,
          status: 200,
          json: async () => ({
            choices: [
              {
                message: {
                  content: mockResponse,
                },
              },
            ],
          }),
          text: async () => JSON.stringify({ choices: [{ message: { content: mockResponse } }] }),
        }
      })

      const routes = buildTestRoutes(1)
      await enrichRoute({ routes })

      expect(capturedUrl).toContain('api.openai.com')
      if (capturedBody) {
        const body = JSON.parse(capturedBody)
        expect(body.model).toBe('gpt-4o')
      }
    })

    it('uses default gpt-4o-mini when ENRICH_MODEL not set', async () => {
      // Note: ENRICH_MODEL is already undefined from beforeEach
      vi.clearAllMocks()
      const mockResponse = JSON.stringify({
        routes: [
          {
            label: 'Test Route',
            rationale: 'Test',
            highlights: ['A'],
          },
        ],
      })

      let capturedBody: string | undefined

      ;(globalThis as any).fetch = vi.fn(async (_url: string, options?: RequestInit) => {
        capturedBody = options?.body as string
        return {
          ok: true,
          status: 200,
          json: async () => ({
            choices: [
              {
                message: {
                  content: mockResponse,
                },
              },
            ],
          }),
          text: async () => JSON.stringify({ choices: [{ message: { content: mockResponse } }] }),
        }
      })

      const routes = buildTestRoutes(1)
      await enrichRoute({ routes })

      expect(capturedBody).toBeDefined()
      if (capturedBody) {
        const body = JSON.parse(capturedBody)
        // Debug: log the body to see what's in it
        console.log('Captured body:', JSON.stringify(body, null, 2))
        expect(body.model).toBe('gpt-4o-mini')
      }
    })
  })

  describe('prompt construction', () => {
    it('includes waypoint names in prompt', async () => {
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

      let capturedBody: string | undefined

      ;(globalThis as any).fetch = vi.fn(async (_url: string, options?: RequestInit) => {
        capturedBody = options?.body as string
        return {
          ok: true,
          status: 200,
          json: async () => ({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    routes: [
                      {
                        label: 'Test',
                        rationale: 'Test',
                        highlights: ['A'],
                      },
                    ],
                  }),
                },
              },
            ],
          }),
          text: async () =>
            JSON.stringify({
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      routes: [
                        {
                          label: 'Test',
                          rationale: 'Test',
                          highlights: ['A'],
                        },
                      ],
                    }),
                  },
                },
              ],
            }),
        }
      })

      await enrichRoute({ routes })

      if (capturedBody) {
        const body = JSON.parse(capturedBody)
        const prompt = body.messages[1].content
        expect(prompt).toContain('San Francisco')
        expect(prompt).toContain('Yosemite Valley')
        expect(prompt).toContain('Tioga Pass')
      }
    })

    it('includes route stats in prompt', async () => {
      const routes = [
        {
          waypoints: [{ name: 'Start', type: 'junction' }, { name: 'End', type: 'junction' }],
          stats: { distanceMeters: 50000, durationSeconds: 3600 },
        },
      ]

      let capturedBody: string | undefined

      ;(globalThis as any).fetch = vi.fn(async (_url: string, options?: RequestInit) => {
        capturedBody = options?.body as string
        return {
          ok: true,
          status: 200,
          json: async () => ({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    routes: [
                      {
                        label: 'Test',
                        rationale: 'Test',
                        highlights: ['A'],
                      },
                    ],
                  }),
                },
              },
            ],
          }),
          text: async () =>
            JSON.stringify({
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      routes: [
                        {
                          label: 'Test',
                          rationale: 'Test',
                          highlights: ['A'],
                        },
                      ],
                    }),
                  },
                },
              ],
            }),
        }
      })

      await enrichRoute({ routes })

      if (capturedBody) {
        const body = JSON.parse(capturedBody)
        const prompt = body.messages[1].content
        expect(prompt).toContain('31.1') // ~50km in miles
        expect(prompt).toContain('60') // 3600 seconds in minutes
      }
    })
  })

  describe('output schema', () => {
    it('uses json_object response format', async () => {
      const mockResponse = JSON.stringify({
        routes: [
          {
            label: 'Test',
            rationale: 'Test',
            highlights: ['A'],
          },
        ],
      })

      let capturedBody: string | undefined

      ;(globalThis as any).fetch = vi.fn(async (_url: string, options?: RequestInit) => {
        capturedBody = options?.body as string
        return {
          ok: true,
          status: 200,
          json: async () => ({
            choices: [
              {
                message: {
                  content: mockResponse,
                },
              },
            ],
          }),
          text: async () => JSON.stringify({ choices: [{ message: { content: mockResponse } }] }),
        }
      })

      const routes = buildTestRoutes(1)
      await enrichRoute({ routes })

      if (capturedBody) {
        const body = JSON.parse(capturedBody)
        expect(body.response_format).toEqual({ type: 'json_object' })
      }
    })

    it('sets max_tokens to 500', async () => {
      const mockResponse = JSON.stringify({
        routes: [
          {
            label: 'Test',
            rationale: 'Test',
            highlights: ['A'],
          },
        ],
      })

      let capturedBody: string | undefined

      ;(globalThis as any).fetch = vi.fn(async (_url: string, options?: RequestInit) => {
        capturedBody = options?.body as string
        return {
          ok: true,
          status: 200,
          json: async () => ({
            choices: [
              {
                message: {
                  content: mockResponse,
                },
              },
            ],
          }),
          text: async () => JSON.stringify({ choices: [{ message: { content: mockResponse } }] }),
        }
      })

      const routes = buildTestRoutes(1)
      await enrichRoute({ routes })

      if (capturedBody) {
        const body = JSON.parse(capturedBody)
        expect(body.max_tokens).toBe(500)
      }
    })
  })
})
