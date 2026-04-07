import { ConvexError } from 'convex/values'
import { describe, expect, it, vi } from 'vitest'

import { ERROR_CODES } from '../../../errors'
import { BudgetTracker } from '../budgetTracker'

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function makeUsage(total: number) {
  return {
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
    totalTokens: 0,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total },
  }
}

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('BudgetTracker', () => {
  describe('accumulation', () => {
    it('sums usage.cost.total across multiple add() calls', () => {
      const tracker = new BudgetTracker(1.0, { mode: 'gate' })
      tracker.add(makeUsage(0.10))
      tracker.add(makeUsage(0.05))
      tracker.add(makeUsage(0.20))
      expect(tracker.getCumulative()).toBeCloseTo(0.35)
    })
  })

  describe('no throw below limit', () => {
    it('does not throw when a single add() stays under the limit', () => {
      const tracker = new BudgetTracker(0.25, { mode: 'gate' })
      expect(() => tracker.add(makeUsage(0.10))).not.toThrow()
    })
  })

  describe('throw at limit', () => {
    it('throws ConvexError with AGENT_BUDGET_EXCEEDED when cumulative reaches the limit', () => {
      const tracker = new BudgetTracker(0.25, { mode: 'gate' })
      tracker.add(makeUsage(0.10))
      tracker.add(makeUsage(0.10))
      // Third add pushes cumulative to 0.30 >= 0.25
      expect(() => tracker.add(makeUsage(0.10))).toThrow(ConvexError)
    })

    it('thrown error carries the expected code, cumulativeUSD, and limitUSD', () => {
      const tracker = new BudgetTracker(0.25, { mode: 'gate' })
      tracker.add(makeUsage(0.10))
      try {
        tracker.add(makeUsage(0.20))
        expect.fail('should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(ConvexError)
        const convexErr = err as ConvexError<{ code: string; cumulativeUSD: number; limitUSD: number }>
        expect(convexErr.data.code).toBe(ERROR_CODES.AGENT_BUDGET_EXCEEDED)
        expect(convexErr.data.limitUSD).toBe(0.25)
        expect(convexErr.data.cumulativeUSD).toBeCloseTo(0.30)
      }
    })

    it('throws exactly on the crossing call, not a cycle later', () => {
      const tracker = new BudgetTracker(0.15, { mode: 'gate' })
      tracker.add(makeUsage(0.10)) // cumulative: 0.10 — no throw
      // This call crosses the limit and must throw immediately
      expect(() => tracker.add(makeUsage(0.10))).toThrow(ConvexError)
    })
  })

  describe('getCumulative and getRemainingBudget', () => {
    it('getCumulative returns the running total after adds', () => {
      const tracker = new BudgetTracker(1.0, { mode: 'gate' })
      tracker.add(makeUsage(0.12))
      tracker.add(makeUsage(0.08))
      expect(tracker.getCumulative()).toBeCloseTo(0.20)
    })

    it('getRemainingBudget returns limitUSD minus cumulative', () => {
      const tracker = new BudgetTracker(1.0, { mode: 'gate' })
      tracker.add(makeUsage(0.30))
      expect(tracker.getRemainingBudget()).toBeCloseTo(0.70)
    })

    it('getRemainingBudget can be negative after limit is crossed', () => {
      const tracker = new BudgetTracker(0.25, { mode: 'gate' })
      tracker.add(makeUsage(0.10))
      try {
        tracker.add(makeUsage(0.20))
      } catch {
        // expected
      }
      expect(tracker.getRemainingBudget()).toBeLessThan(0)
    })
  })

  describe('custom limit', () => {
    it('respects a custom $0.001 limit and throws on a tiny cost', () => {
      const tracker = new BudgetTracker(0.001, { mode: 'gate' })
      expect(() => tracker.add(makeUsage(0.002))).toThrow(ConvexError)
    })

    it('does not throw when cost is exactly below the custom limit', () => {
      const tracker = new BudgetTracker(0.001, { mode: 'gate' })
      expect(() => tracker.add(makeUsage(0.0005))).not.toThrow()
    })
  })

  describe('log mode', () => {
    it('does not throw when limit exceeded in log mode', () => {
      const tracker = new BudgetTracker(0.10, { mode: 'log' })
      tracker.add(makeUsage(0.05))
      // This would exceed the limit in gate mode — must not throw in log mode
      expect(() => tracker.add(makeUsage(0.10))).not.toThrow()
    })

    it('calls console.warn when limit exceeded in log mode', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const tracker = new BudgetTracker(0.10, { mode: 'log' })
      tracker.add(makeUsage(0.05))
      tracker.add(makeUsage(0.10))
      expect(warnSpy).toHaveBeenCalled()
      warnSpy.mockRestore()
    })

    it('includes agentLabel in log output when provided', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const tracker = new BudgetTracker(0.10, { mode: 'log' })
      tracker.add(makeUsage(0.05))
      tracker.add(makeUsage(0.10), 'routingAgent')
      const warnMessage = warnSpy.mock.calls[0]?.[0] as string
      expect(warnMessage).toContain('routingAgent')
      warnSpy.mockRestore()
    })

    it('still accumulates cumulative cost in log mode even after limit exceeded', () => {
      const tracker = new BudgetTracker(0.10, { mode: 'log' })
      tracker.add(makeUsage(0.05))
      tracker.add(makeUsage(0.10))
      expect(tracker.getCumulative()).toBeCloseTo(0.15)
    })
  })

  describe('gate mode (backwards compatible)', () => {
    it('throws ConvexError in gate mode (same as no-option constructor)', () => {
      const tracker = new BudgetTracker(0.10, { mode: 'gate' })
      tracker.add(makeUsage(0.05))
      expect(() => tracker.add(makeUsage(0.10))).toThrow(ConvexError)
    })
  })

  describe('agentLabel parameter', () => {
    it('accepts optional agentLabel parameter without throwing (gate mode, under limit)', () => {
      const tracker = new BudgetTracker(1.0, { mode: 'gate' })
      expect(() => tracker.add(makeUsage(0.05), 'testAgent')).not.toThrow()
    })

    it('log message includes cost and cumulative when agentLabel provided', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const tracker = new BudgetTracker(0.10, { mode: 'log' })
      tracker.add(makeUsage(0.15), 'enrichmentAgent')
      const warnMessage = warnSpy.mock.calls[0]?.[0] as string
      expect(warnMessage).toContain('[BudgetTracker]')
      expect(warnMessage).toContain('enrichmentAgent')
      warnSpy.mockRestore()
    })
  })
})
