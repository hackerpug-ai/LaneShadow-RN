import { describe, expect, it } from 'vitest'
import {
  CLOUD_PHASE_DURATION_MS,
  calculateProgress,
  estimateTimeRemaining,
  getNextStatus,
} from '../status-tracker'

describe('calculateProgress', () => {
  it('returns 0 for draft status', () => {
    expect(calculateProgress('draft', null)).toBe(0)
  })

  it('returns 100 for complete status', () => {
    expect(calculateProgress('complete', null)).toBe(100)
  })

  it('returns 50 for error status', () => {
    expect(calculateProgress('error', null)).toBe(50)
  })

  it('returns 0 for partial with no phaseStartTime', () => {
    expect(calculateProgress('partial', null)).toBe(0)
  })

  it('returns 50 at start of cloud phase', () => {
    const now = 10000
    expect(calculateProgress('partial', now, now)).toBe(50)
  })

  it('returns 100 when cloud phase fully elapsed', () => {
    const start = 10000
    expect(calculateProgress('partial', start, start + CLOUD_PHASE_DURATION_MS)).toBe(100)
  })

  it('caps at 100 even if elapsed exceeds duration', () => {
    const start = 10000
    expect(calculateProgress('partial', start, start + CLOUD_PHASE_DURATION_MS * 2)).toBe(100)
  })
})

describe('estimateTimeRemaining', () => {
  it('returns 0 for draft', () => {
    expect(estimateTimeRemaining('draft', null)).toBe(0)
  })

  it('returns 0 for complete', () => {
    expect(estimateTimeRemaining('complete', null)).toBe(0)
  })

  it('returns 0 for error', () => {
    expect(estimateTimeRemaining('error', null)).toBe(0)
  })

  it('returns full duration at start of cloud phase', () => {
    const now = 10000
    const remaining = estimateTimeRemaining('partial', now, now)
    expect(remaining).toBe(Math.round(CLOUD_PHASE_DURATION_MS / 1000))
  })

  it('returns 0 when cloud phase fully elapsed', () => {
    const start = 10000
    expect(estimateTimeRemaining('partial', start, start + CLOUD_PHASE_DURATION_MS)).toBe(0)
  })
})

describe('getNextStatus', () => {
  it('transitions draft to partial', () => {
    expect(getNextStatus('draft', 'success')).toBe('partial')
  })

  it('transitions partial to complete on success', () => {
    expect(getNextStatus('partial', 'success')).toBe('complete')
  })

  it('returns error on error result', () => {
    expect(getNextStatus('draft', 'error')).toBe('error')
    expect(getNextStatus('partial', 'error')).toBe('error')
  })

  it('stays complete', () => {
    expect(getNextStatus('complete', 'success')).toBe('complete')
  })
})
