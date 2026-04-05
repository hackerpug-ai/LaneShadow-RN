import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest'

import { complete, getModel } from '@mariozechner/pi-ai'
import { enrichRoute } from '../enrichRoute'

// Mock env so OPENAI_API_KEY is deterministic across the whole suite.
vi.mock('../../../../lib/env', () => ({
  OPENAI_API_KEY: 'test-openai-key',
  AI_MODEL: 'gpt-4o',
  GOOGLE_MAPS_API_KEY: 'test-google-key',
  CLERK_WEBHOOK_SECRET: 'test-clerk-webhook-secret',
  CLERK_JWT_ISSUER_DOMAIN: 'test-clerk-jwt-issuer-domain',
  OPENWEATHER_API_KEY: 'test-openweather-key',
}))

// Mock pi-ai: keep TypeBox Type/Static exports intact (enrichRoute needs
// Type at module load), only replace the runtime functions.
vi.mock('@mariozechner/pi-ai', async () => {
  const actual = (await vi.importActual('@mariozechner/pi-ai')) as Record<string, unknown>
  return {
    ...actual,
    complete: vi.fn(),
    getModel: vi.fn(() => ({ api: 'openai-completions', provider: 'openai', name: 'gpt-4o' })),
  }
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const buildTestRoutes = (count: number = 3) =>
  Array.from({ length: count }, (_, idx) => ({
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

const makeAssistant = (routes: { label: string; rationale: string; highlights: string[] }[]) =>
  ({
    role: 'assistant',
    content: [
      {
        type: 'toolCall',
        id: 'call_1',
        name: 'emit_enrichments',
        arguments: { routes },
      },
    ],
    api: 'openai-completions',
    provider: 'openai',
    model: 'gpt-4o-mock',
    usage: {
      input: 10,
      output: 10,
      cacheRead: 0,
      cacheWrite: 0,
      totalTokens: 20,
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
    },
    stopReason: 'toolUse',
    timestamp: Date.now(),
  }) as any

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

  describe('pi-ai integration', () => {
    it('returns enriched labels from pi-ai tool call', async () => {
      vi.mocked(complete).mockResolvedValue(
        makeAssistant([
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
        ])
      )

      const routes = buildTestRoutes(3)
      const result = await enrichRoute({ routes })

      expect(result).toHaveLength(3)
      expect(result[0]).toEqual({
        label: 'High Sierra Crest via Tioga Pass',
        rationale: 'A scenic mountain route crossing the Sierra Nevada through the famous Tioga Pass.',
        highlights: ['Mountain pass', 'Alpine meadows', 'Sweeping views'],
      })
      expect(result[2].label).toBe('Desert Valley Tour')
    })

    it('returns fallback labels when complete() rejects', async () => {
      vi.mocked(complete).mockRejectedValue(new Error('OpenAI API error'))

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
      expect(result[0].label).toBe('Route 1')
    })

    it('returns fallback labels when model skips the tool call', async () => {
      // Assistant replies with text only — no emit_enrichments tool call.
      vi.mocked(complete).mockResolvedValue({
        role: 'assistant',
        content: [{ type: 'text', text: 'sorry, cannot do that' }],
        api: 'openai-completions',
        provider: 'openai',
        model: 'gpt-4o-mock',
        usage: {
          input: 10,
          output: 10,
          cacheRead: 0,
          cacheWrite: 0,
          totalTokens: 20,
          cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
        },
        stopReason: 'stop',
        timestamp: Date.now(),
      } as any)

      const routes = buildTestRoutes(2)
      const result = await enrichRoute({ routes })

      expect(result).toHaveLength(2)
      expect(result[0].label).toBe('Route 1')
    })
  })

  describe('prompt construction', () => {
    it('includes waypoint names in the user message', async () => {
      vi.mocked(complete).mockResolvedValue(
        makeAssistant([
          { label: 'Yosemite Tioga Pass', rationale: 'Scenic route', highlights: ['Mountain'] },
        ])
      )

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

      const [, context] = vi.mocked(complete).mock.calls[0]
      const userMessage = context.messages[0] as { content: string }
      expect(userMessage.content).toContain('San Francisco')
      expect(userMessage.content).toContain('Yosemite Valley')
      expect(userMessage.content).toContain('Tioga Pass')
    })

    it('includes distance and duration stats', async () => {
      vi.mocked(complete).mockResolvedValue(
        makeAssistant([{ label: 'Test', rationale: 'Test', highlights: ['A'] }])
      )

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

      const [, context] = vi.mocked(complete).mock.calls[0]
      const userMessage = context.messages[0] as { content: string }
      expect(userMessage.content).toContain('31.1') // ~50km in miles
      expect(userMessage.content).toContain('60') // 3600s → 60min
    })
  })

  describe('tool schema', () => {
    it('registers emit_enrichments as the only tool', async () => {
      vi.mocked(complete).mockResolvedValue(
        makeAssistant([{ label: 'X', rationale: 'Y', highlights: ['Z'] }])
      )

      await enrichRoute({ routes: buildTestRoutes(1) })

      const [, context] = vi.mocked(complete).mock.calls[0]
      expect(context.tools).toHaveLength(1)
      expect(context.tools?.[0].name).toBe('emit_enrichments')
      expect(context.tools?.[0].parameters).toBeDefined()
    })
  })

  describe('AI_MODEL integration', () => {
    it('forwards AI_MODEL to getModel()', async () => {
      vi.mocked(complete).mockResolvedValue(
        makeAssistant([{ label: 'Test', rationale: 'Test', highlights: ['A'] }])
      )

      await enrichRoute({ routes: buildTestRoutes(1) })

      // AI_MODEL is read at module import time; we just assert getModel was
      // called with 'openai' and *some* model string from env.
      expect(vi.mocked(getModel)).toHaveBeenCalledWith('openai', expect.any(String))
    })
  })
})
