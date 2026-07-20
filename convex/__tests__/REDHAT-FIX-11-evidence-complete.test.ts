/**
 * REDHAT-FIX-11 [UNIT]: a freeway/fhwa route must NOT be classified as
 * evidence-complete unless a rescue-first geometry attempt was recorded. The
 * classifier must gate evidenceComplete on the geometry attempt for freeways;
 * non-freeway routes are evidence-complete without one.
 *
 * Fresh report (HIGH): the classifier wrote freeway_rescue_first_* best-effort
 * (swallowed errors) and still called the LLM + persisted a complete
 * classification — no evidenceComplete prerequisite.
 */

import { describe, expect, it } from 'vitest'

import { determineEvidenceComplete } from '../actions/rideWorthinessClassifier'

describe('determineEvidenceComplete (REDHAT-FIX-11 evidence prerequisite)', () => {
  it('non-freeway route is evidence-complete without a geometry attempt', () => {
    expect(determineEvidenceComplete({ isFreeway: false, geometryAttempted: false })).toBe(true)
  })

  it('non-freeway route with a geometry attempt is evidence-complete', () => {
    expect(determineEvidenceComplete({ isFreeway: false, geometryAttempted: true })).toBe(true)
  })

  it('freeway route WITHOUT a geometry attempt is NOT evidence-complete', () => {
    expect(determineEvidenceComplete({ isFreeway: true, geometryAttempted: false })).toBe(false)
  })

  it('freeway route WITH a geometry attempt is evidence-complete', () => {
    expect(determineEvidenceComplete({ isFreeway: true, geometryAttempted: true })).toBe(true)
  })
})
