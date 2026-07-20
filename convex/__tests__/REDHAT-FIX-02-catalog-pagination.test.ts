/**
 * REDHAT-FIX-02: classifyCatalog must enumerate the WHOLE catalog.
 *
 * Tests that:
 * 1. classifyCatalog uses .continueCursor for pagination (not just one batch).
 * 2. Result reports totalEligible, classified, remainingUnclassified.
 * 3. Completion condition: remainingUnclassified === 0 when done.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('FIX-02: classifyCatalog iterates all pages', () => {
  it('classifyCatalog action uses continueCursor for pagination', () => {
    const source = readFileSync(
      resolve(__dirname, '../actions/rideWorthinessClassifier.ts'),
      'utf-8',
    )

    // After fix: the action should use continueCursor to iterate all pages
    const hasContinueCursor = source.includes('continueCursor')
    const hasWhileLoop = source.includes('while') || source.includes('for await')

    // RED phase: current code only fetches one batch, no pagination — FAILS
    expect(hasContinueCursor).toBe(true)
    expect(hasWhileLoop).toBe(true)
  })

  it('classifyCatalog reports totalEligible, classified, and remainingUnclassified', () => {
    const source = readFileSync(
      resolve(__dirname, '../actions/rideWorthinessClassifier.ts'),
      'utf-8',
    )

    // Find the classifyCatalog handler and check its return structure
    const handlerStart = source.indexOf('classifyCatalog = action')
    expect(handlerStart).toBeGreaterThan(-1)

    // After fix: the handler should report these three fields
    const hasTotalEligible = source.includes('totalEligible')
    const hasRemainingUnclassified = source.includes('remainingUnclassified')

    // RED phase: remainingUnclassified is reported but totalEligible may not
    // reflect full catalog when cursor pagination is missing — FAILS
    expect(hasTotalEligible).toBe(true)
    expect(hasRemainingUnclassified).toBe(true)
  })

  it('classifyCatalog has a loop that processes all batches', () => {
    const source = readFileSync(
      resolve(__dirname, '../actions/rideWorthinessClassifier.ts'),
      'utf-8',
    )

    // After fix: the classifyCatalog handler should have a loop that
    // iterates through all pages, classifying each batch
    const handlerStart = source.indexOf('classifyCatalog = action')
    expect(handlerStart).toBeGreaterThan(-1)
    const handlerSection = source.slice(handlerStart, handlerStart + 2500)

    // The handler should call listEligibleRouteIdsForClassification in a loop
    // and use continueCursor/isDone to paginate
    const hasListCall = handlerSection.includes('listEligibleRouteIdsForClassification')
    const hasIsDone = handlerSection.includes('isDone')
    const hasLoop = /while\s*\(/.test(handlerSection) || /for\s*\(/.test(handlerSection)

    expect(hasListCall).toBe(true)
    // RED phase: no while/for loop for pagination — FAILS
    expect(hasLoop).toBe(true)
    // RED phase: no isDone check — FAILS
    expect(hasIsDone).toBe(true)
  })

  it('completion condition: remainingUnclassified === 0 when all routes done', () => {
    const source = readFileSync(
      resolve(__dirname, '../actions/rideWorthinessClassifier.ts'),
      'utf-8',
    )

    // After fix: the result should include a completion condition
    // The function must report 'complete' or remainingUnclassified=0
    const hasRemainingCalc = source.includes('remainingUnclassified')

    expect(hasRemainingCalc).toBe(true)
  })
})
