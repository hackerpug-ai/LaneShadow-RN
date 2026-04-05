'use node'

import { ConvexError } from 'convex/values'
import type { Usage } from '@mariozechner/pi-ai'

import { ERROR_CODES } from '../../errors'

// -----------------------------------------------------------------------------
// BudgetTracker
// -----------------------------------------------------------------------------

/**
 * Tracks cumulative LLM spend for a single agent session and enforces a
 * configurable USD limit. Throws `ConvexError(AGENT_BUDGET_EXCEEDED)` the
 * moment an `add()` call pushes the running total over the limit so callers
 * can abort the agent loop immediately.
 */
export class BudgetTracker {
  private cumulativeUSD = 0

  constructor(private readonly limitUSD: number = 0.25) {}

  /**
   * Accumulate cost from an `AssistantMessage` usage object.
   * Throws `ConvexError` with `AGENT_BUDGET_EXCEEDED` if the cumulative total
   * has reached or exceeded `limitUSD` after adding.
   */
  add(usage: Usage): void {
    this.cumulativeUSD += usage.cost.total

    if (this.cumulativeUSD >= this.limitUSD) {
      throw new ConvexError({
        code: ERROR_CODES.AGENT_BUDGET_EXCEEDED,
        cumulativeUSD: this.cumulativeUSD,
        limitUSD: this.limitUSD,
      })
    }
  }

  /** Returns the running total in USD accumulated so far. */
  getCumulative(): number {
    return this.cumulativeUSD
  }

  /**
   * Returns remaining budget in USD.
   * May be negative if the limit was exceeded (budget overage).
   */
  getRemainingBudget(): number {
    return this.limitUSD - this.cumulativeUSD
  }
}
