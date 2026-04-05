import { describe, expect, it, vi } from 'vitest'
import { buildInSessionRouteBlock } from '../sessionContext'
import type { RoutePlanSummary } from '../../../db/routePlans'

// ---------------------------------------------------------------------------
// Mock _generated/api so internal.db.routePlans.listBySession resolves to a
// stable sentinel object. Tests override ctx.runQuery directly.
// ---------------------------------------------------------------------------

vi.mock('../../../_generated/api', () => ({
  internal: {
    db: {
      routePlans: {
        listBySession: { __fake: 'listBySession' },
      },
    },
  },
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SESSION_ID = 'session_abc123' as any

function makeCtx(routes: RoutePlanSummary[]) {
  return {
    runQuery: vi.fn().mockResolvedValue(routes),
  }
}

function makeRoute(overrides: Partial<RoutePlanSummary> = {}): RoutePlanSummary {
  return {
    _id: 'route_001' as any,
    _creationTime: Date.now(),
    startLabel: 'Home',
    endLabel: 'Santa Cruz',
    preferences: { scenicBias: 'default', avoidHighways: false, avoidTolls: false },
    status: 'completed',
    distanceMeters: 67592, // ~42mi
    durationSeconds: 4500, // 75min
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('buildInSessionRouteBlock', () => {
  describe('empty session', () => {
    it('returns empty string when no routes exist', async () => {
      const ctx = makeCtx([])
      const result = await buildInSessionRouteBlock(ctx, SESSION_ID)
      expect(result).toBe('')
    })

    it('calls listBySession with correct args', async () => {
      const ctx = makeCtx([])
      await buildInSessionRouteBlock(ctx, SESSION_ID)
      expect(ctx.runQuery).toHaveBeenCalledWith(
        { __fake: 'listBySession' },
        { sessionId: SESSION_ID, limit: 5, status: 'completed' }
      )
    })
  })

  describe('single route', () => {
    it('returns correctly formatted block with header and trailing refinement hint', async () => {
      const route = makeRoute()
      const ctx = makeCtx([route])
      const result = await buildInSessionRouteBlock(ctx, SESSION_ID)

      expect(result).toContain('Routes already planned this session:')
      expect(result).toContain('1. Home \u2192 Santa Cruz:')
      expect(result).toContain('42mi')
      expect(result).toContain('75min')
      expect(result).toContain('default')
      expect(result).toContain('When refining, reference these by endpoint pair and only change what the rider asks.')
    })

    it('produces correct line structure', async () => {
      const route = makeRoute()
      const ctx = makeCtx([route])
      const result = await buildInSessionRouteBlock(ctx, SESSION_ID)
      const lines = result.split('\n')

      expect(lines).toHaveLength(3)
      expect(lines[0]).toBe('Routes already planned this session:')
      expect(lines[1]).toMatch(/^1\./)
      expect(lines[2]).toBe('When refining, reference these by endpoint pair and only change what the rider asks.')
    })
  })

  describe('multiple routes', () => {
    it('renders all 5 routes numbered 1-5', async () => {
      const routes = [
        makeRoute({ _id: 'r1' as any, startLabel: 'Home', endLabel: 'Santa Cruz' }),
        makeRoute({ _id: 'r2' as any, startLabel: 'Home', endLabel: 'Half Moon Bay', distanceMeters: 45060, durationSeconds: 2700 }),
        makeRoute({ _id: 'r3' as any, startLabel: 'Home', endLabel: 'Stinson Beach' }),
        makeRoute({ _id: 'r4' as any, startLabel: 'Home', endLabel: 'Muir Beach' }),
        makeRoute({ _id: 'r5' as any, startLabel: 'Home', endLabel: 'Point Reyes' }),
      ]
      const ctx = makeCtx(routes)
      const result = await buildInSessionRouteBlock(ctx, SESSION_ID)
      const lines = result.split('\n')

      // header + 5 routes + trailing hint
      expect(lines).toHaveLength(7)
      expect(lines[0]).toBe('Routes already planned this session:')
      expect(lines[1]).toMatch(/^1\. Home/)
      expect(lines[2]).toMatch(/^2\. Home/)
      expect(lines[3]).toMatch(/^3\. Home/)
      expect(lines[4]).toMatch(/^4\. Home/)
      expect(lines[5]).toMatch(/^5\. Home/)
      expect(lines[6]).toContain('When refining')
    })
  })

  describe('missing labels fallback', () => {
    it('falls back to lat/lng when startLabel and endLabel are absent', async () => {
      const route = makeRoute({
        startLabel: undefined,
        endLabel: undefined,
      })
      const ctx = makeCtx([route])
      const result = await buildInSessionRouteBlock(ctx, SESSION_ID)

      // Without coords stored in RoutePlanSummary, both fall back to 'unknown'
      expect(result).toContain('unknown \u2192 unknown')
    })
  })

  describe('preference shorthand permutations', () => {
    it('renders "default" for default scenicBias with no avoidances', async () => {
      const route = makeRoute({
        preferences: { scenicBias: 'default', avoidHighways: false, avoidTolls: false },
      })
      const ctx = makeCtx([route])
      const result = await buildInSessionRouteBlock(ctx, SESSION_ID)
      expect(result).toContain('default')
    })

    it('renders "scenic" for high scenicBias with no avoidances', async () => {
      const route = makeRoute({
        preferences: { scenicBias: 'high', avoidHighways: false, avoidTolls: false },
      })
      const ctx = makeCtx([route])
      const result = await buildInSessionRouteBlock(ctx, SESSION_ID)
      expect(result).toContain('scenic')
      expect(result).not.toContain('avoid-highways')
      expect(result).not.toContain('avoid-tolls')
    })

    it('renders "scenic+avoid-highways" for high scenic + avoidHighways', async () => {
      const route = makeRoute({
        preferences: { scenicBias: 'high', avoidHighways: true, avoidTolls: false },
      })
      const ctx = makeCtx([route])
      const result = await buildInSessionRouteBlock(ctx, SESSION_ID)
      expect(result).toContain('scenic+avoid-highways')
      expect(result).not.toContain('avoid-tolls')
    })

    it('renders "scenic+avoid-tolls" for high scenic + avoidTolls', async () => {
      const route = makeRoute({
        preferences: { scenicBias: 'high', avoidHighways: false, avoidTolls: true },
      })
      const ctx = makeCtx([route])
      const result = await buildInSessionRouteBlock(ctx, SESSION_ID)
      expect(result).toContain('scenic+avoid-tolls')
      expect(result).not.toContain('avoid-highways')
    })

    it('renders "scenic+avoid-highways+avoid-tolls" for all flags set', async () => {
      const route = makeRoute({
        preferences: { scenicBias: 'high', avoidHighways: true, avoidTolls: true },
      })
      const ctx = makeCtx([route])
      const result = await buildInSessionRouteBlock(ctx, SESSION_ID)
      expect(result).toContain('scenic+avoid-highways+avoid-tolls')
    })

    it('renders "avoid-highways" for default scenic + avoidHighways only', async () => {
      const route = makeRoute({
        preferences: { scenicBias: 'default', avoidHighways: true, avoidTolls: false },
      })
      const ctx = makeCtx([route])
      const result = await buildInSessionRouteBlock(ctx, SESSION_ID)
      expect(result).toContain('avoid-highways')
      expect(result).not.toContain('scenic')
    })

    it('renders "avoid-tolls" for default scenic + avoidTolls only', async () => {
      const route = makeRoute({
        preferences: { scenicBias: 'default', avoidHighways: false, avoidTolls: true },
      })
      const ctx = makeCtx([route])
      const result = await buildInSessionRouteBlock(ctx, SESSION_ID)
      expect(result).toContain('avoid-tolls')
      expect(result).not.toContain('scenic')
    })

    it('renders "default" when avoidHighways and avoidTolls are undefined', async () => {
      const route = makeRoute({
        preferences: { scenicBias: 'default' },
      })
      const ctx = makeCtx([route])
      const result = await buildInSessionRouteBlock(ctx, SESSION_ID)
      expect(result).toContain('default')
    })
  })

  describe('zero distance and duration', () => {
    it('renders "0mi · 0min" without crashing', async () => {
      const route = makeRoute({
        distanceMeters: 0,
        durationSeconds: 0,
      })
      const ctx = makeCtx([route])
      const result = await buildInSessionRouteBlock(ctx, SESSION_ID)
      expect(result).toContain('0mi')
      expect(result).toContain('0min')
    })

    it('renders "0mi · 0min" when distanceMeters and durationSeconds are undefined', async () => {
      const route = makeRoute({
        distanceMeters: undefined,
        durationSeconds: undefined,
      })
      const ctx = makeCtx([route])
      const result = await buildInSessionRouteBlock(ctx, SESSION_ID)
      expect(result).toContain('0mi')
      expect(result).toContain('0min')
    })
  })

  describe('distance and duration rounding', () => {
    it('rounds distance to nearest integer mile', async () => {
      // 67592 meters = 42.003... miles → rounds to 42
      const route = makeRoute({ distanceMeters: 67592 })
      const ctx = makeCtx([route])
      const result = await buildInSessionRouteBlock(ctx, SESSION_ID)
      expect(result).toContain('42mi')
    })

    it('rounds duration to nearest integer minute', async () => {
      // 4530 seconds = 75.5 minutes → rounds to 76
      const route = makeRoute({ durationSeconds: 4530 })
      const ctx = makeCtx([route])
      const result = await buildInSessionRouteBlock(ctx, SESSION_ID)
      expect(result).toContain('76min')
    })
  })
})
