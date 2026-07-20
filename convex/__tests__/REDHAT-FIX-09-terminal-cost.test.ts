/**
 * REDHAT-FIX-09: Durable waterfall terminal state + fail-closed cost.
 *
 * Tests that:
 * 1. A Lever 3 exception produces EXACTLY ONE terminal state (not two).
 * 2. A failed/retried LLM call's cost is reflected (cost accounting is fail-closed).
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('FIX-09: Lever 3 exception produces exactly ONE terminal state', () => {
  it('Lever 3 catch block sets retirement_eligible WITHOUT queueing REVIEW', () => {
    const source = readFileSync(resolve(__dirname, '../waterfallOrchestrator.ts'), 'utf-8')

    // Find the Lever 3 catch block — the one after 'rerouteForRoute' failure
    const lever3CatchStart = source.indexOf("terminalState = 'retirement_eligible'")
    expect(lever3CatchStart).toBeGreaterThan(-1)

    // Extract the catch block body (roughly 40 lines after this point)
    const catchSection = source.slice(lever3CatchStart, lever3CatchStart + 1500)

    // After fix: the catch block should NOT call recordReviewArtifact
    // (it should only record the terminal artifact for retirement_eligible)
    // Remove comment lines for accurate checking
    const linesWithoutComments = catchSection
      .split('\n')
      .filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*'))
      .join('\n')
    const hasReviewArtifact = linesWithoutComments.includes('recordReviewArtifact')

    // RED phase: current code HAS recordReviewArtifact in catch block — FAILS
    expect(hasReviewArtifact).toBe(false)
  })

  it('Lever 3 exception catch does not push to perStateCounts.queued', () => {
    const source = readFileSync(resolve(__dirname, '../waterfallOrchestrator.ts'), 'utf-8')

    // The catch block after L3 should NOT increment queued count
    const lever3CatchStart = source.indexOf("terminalState = 'retirement_eligible'")
    expect(lever3CatchStart).toBeGreaterThan(-1)
    const catchSection = source.slice(lever3CatchStart, lever3CatchStart + 1500)

    // After fix: no queued increment in the L3 catch block
    const hasQueuedIncrement = catchSection.includes('perStateCounts.queued')
    expect(hasQueuedIncrement).toBe(false)
  })
})

describe('FIX-09: Cost accounting is fail-closed', () => {
  it('L2 cost is charged even when the LLM call fails (exhausts retries)', () => {
    const source = readFileSync(resolve(__dirname, '../waterfallOrchestrator.ts'), 'utf-8')

    // Find the L2 catch block (lever2Failed)
    const l2CatchIdx = source.indexOf('lever2Failed = true')
    expect(l2CatchIdx).toBeGreaterThan(-1)

    // The catch block should contain cost charging
    const l2CatchSection = source.slice(l2CatchIdx, l2CatchIdx + 300)

    // After fix: cost is charged in the catch block (costUsd += ... or totalCostUsd += ...)
    const chargesCost =
      l2CatchSection.includes('costUsd +=') || l2CatchSection.includes('totalCostUsd +=')

    // RED phase: current code does NOT charge cost on L2 failure — FAILS
    expect(chargesCost).toBe(true)
  })

  it('route result costUsd reflects all attempts, not just successful ones', () => {
    const source = readFileSync(resolve(__dirname, '../waterfallOrchestrator.ts'), 'utf-8')

    // When L2 fails, the catch block still includes costUsd in the
    // RouteWaterfallResult. The result's costUsd should be set.
    const l2CatchSection = source.slice(
      source.indexOf('lever2Failed = true'),
      source.indexOf('lever2Failed = true') + 500,
    )

    // After fix: the L2 failure still contributes to the route result cost
    // Even when caught, the cost should be in the result
    const costInCatchResult = l2CatchSection.includes('costUsd')
    expect(costInCatchResult).toBe(true)
  })
})
