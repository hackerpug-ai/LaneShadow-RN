/**
 * REDHAT-FIX-05: REVIEW approval must re-run the canonical geometry gate.
 *
 * Tests the gate evaluation that approveDisposition must perform
 * before writing verdict:'pass' / riderReady:true.
 */

import { describe, expect, it } from 'vitest'
import { evaluateApprovalCandidate } from '../reviewQueue'

const CENTROID = { lat: 34.95, lng: -120.42 }

describe('REDHAT-FIX-05: evaluateApprovalCandidate', () => {
  it('MUST_OBSERVE: passing candidate gets verdict:pass, riderReady:true', () => {
    const result = evaluateApprovalCandidate({
      anchorCount: 2,
      anchors: [
        { lat: 34.96, lng: -120.42 },
        { lat: 34.94, lng: -120.44 },
      ],
      centroid: CENTROID,
      routedMiles: 41,
      pointCount: 100,
      ratio: 1.0,
      quarantine: false,
      claimedMiles: 41,
    })

    expect(result.verdict).toBe('pass')
    expect(result.riderReady).toBe(true)
    expect(result.failedCondition).toBeUndefined()
  })

  it('MUST_NOT: failing candidate (off-region anchors) does NOT get verdict:pass or riderReady:true', () => {
    const result = evaluateApprovalCandidate({
      anchorCount: 2,
      anchors: [
        { lat: 40.0, lng: -120.42 }, // ~345 mi from centroid
        { lat: 40.1, lng: -120.42 }, // ~355 mi from centroid
      ],
      centroid: CENTROID,
      routedMiles: 41,
      pointCount: 100,
      ratio: 1.0,
      quarantine: false,
      claimedMiles: 41,
    })

    expect(result.verdict).toBe('review')
    expect(result.riderReady).toBe(false)
    expect(result.failedCondition).toBe('anchors')
  })

  it('MUST_NOT: failing candidate (degenerate) does NOT get verdict:pass or riderReady:true', () => {
    const result = evaluateApprovalCandidate({
      anchorCount: 3,
      anchors: [
        { lat: 34.96, lng: -120.42 },
        { lat: 34.94, lng: -120.44 },
        { lat: 34.95, lng: -120.43 },
      ],
      centroid: CENTROID,
      routedMiles: 40,
      pointCount: 2,
      ratio: 1.0,
      quarantine: false,
      claimedMiles: 40,
    })

    expect(result.verdict).toBe('review')
    expect(result.riderReady).toBe(false)
    expect(result.failedCondition).toBe('degenerate')
  })

  it('MUST_NOT: failing candidate (bad ratio) does NOT get verdict:pass or riderReady:true', () => {
    const result = evaluateApprovalCandidate({
      anchorCount: 3,
      anchors: [
        { lat: 34.96, lng: -120.42 },
        { lat: 34.94, lng: -120.44 },
        { lat: 34.95, lng: -120.43 },
      ],
      centroid: CENTROID,
      routedMiles: 80,
      pointCount: 100,
      ratio: 2.0,
      quarantine: false,
      claimedMiles: 40,
    })

    expect(result.verdict).toBe('review')
    expect(result.riderReady).toBe(false)
    expect(result.failedCondition).toBe('ratio')
  })
})
