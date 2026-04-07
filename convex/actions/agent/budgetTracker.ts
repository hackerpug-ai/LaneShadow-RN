"use node";

import { ConvexError } from 'convex/values'
import type { Usage } from '@mariozechner/pi-ai'

import { ERROR_CODES } from '../../errors'

// -----------------------------------------------------------------------------
// BudgetTracker
// -----------------------------------------------------------------------------

export type BudgetTrackerOptions = {
  mode?: 'log' | 'gate'
}

/**
 * Tracks cumulative LLM spend for a single agent session and enforces a
 * configurable USD limit.
 *
 * In 'gate' mode (default for backwards compat when not specified explicitly):
 * Throws `ConvexError(AGENT_BUDGET_EXCEEDED)` when `add()` pushes over limit.
 *
 * In 'log' mode:
 * Logs a `console.warn` when limit exceeded but does NOT throw.
 *
 * Default mode is 'gate' for backwards compatibility with existing callers.
 * New multi-agent usage should pass `{ mode: 'log' }` to observe costs before
 * setting hard limits.
 */
export class BudgetTracker {
  private cumulativeUSD = 0
  private readonly mode: 'log' | 'gate'

  constructor(
    private readonly limitUSD: number = 0.25,
    options: BudgetTrackerOptions = {}
  ) {
    this.mode = options.mode ?? 'gate'
  }

  /**
   * Accumulate cost from an `AssistantMessage` usage object.
   * Optional `agentLabel` is included in log/error messages for traceability.
   *
   * In 'gate' mode: throws `ConvexError` with `AGENT_BUDGET_EXCEEDED` if limit reached.
   * In 'log' mode: calls `console.warn` when limit exceeded but does NOT throw.
   */
  add(usage: Usage, agentLabel?: string): void {
    this.cumulativeUSD += usage.cost.total

    if (this.cumulativeUSD >= this.limitUSD) {
      if (this.mode === 'gate') {
        throw new ConvexError({
          code: ERROR_CODES.AGENT_BUDGET_EXCEEDED,
          cumulativeUSD: this.cumulativeUSD,
          limitUSD: this.limitUSD,
        })
      } else {
        const label = agentLabel ? ` agent=${agentLabel}` : ''
        console.warn(
          `[BudgetTracker]${label} cost=${usage.cost.total} cumulative=${this.cumulativeUSD} limit=${this.limitUSD} exceeded`
        )
      }
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
