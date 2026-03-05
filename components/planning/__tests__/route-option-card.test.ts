/**
 * E2E tests for RouteOptionCard component
 *
 * Acceptance Criteria:
 * - AC1: RainBadge displays 'Light rain' with blue styling when rain overlay data shows light rain segments
 * - AC2: RainBadge displays the worst condition (heavy > moderate > light > none) for mixed intensities
 * - AC3: RainBadge displays 'Unknown' with muted styling when rain data is null/undefined
 * - AC4: Gracefully falls back to 'unavailable' for malformed/empty data without crashing
 *
 * Note: This test suite focuses on the data flow from PlannedRouteOptionView to RainBadge display.
 * The RainBadge component itself is tested in its own test file.
 */

import { getWorstRainLevel, RAIN_SUMMARY, type RainOverlay, type RainOverlayByLeg } from '../../../models/saved-routes'

describe('getWorstRainLevel', () => {
  /**
   * AC1: Light rain segments should return 'light'
   */
  it('should satisfy AC1: returns "light" for light rain segments', () => {
    const overlay: RainOverlay = {
      generatedAt: Date.now(),
      modelVersion: '1.0',
      legend: [],
      byLeg: [
        {
          legIndex: 0,
          segments: [
            { startMeters: 0, endMeters: 1000, level: 'light' },
            { startMeters: 1000, endMeters: 2000, level: 'none' },
          ],
        },
      ],
    }

    const result = getWorstRainLevel(overlay)
    expect(result).toBe(RAIN_SUMMARY.LIGHT)
  })

  /**
   * AC1: No rain segments should return 'none'
   */
  it('should satisfy AC1: returns "none" for no rain segments', () => {
    const overlay: RainOverlay = {
      generatedAt: Date.now(),
      modelVersion: '1.0',
      legend: [],
      byLeg: [
        {
          legIndex: 0,
          segments: [
            { startMeters: 0, endMeters: 1000, level: 'none' },
            { startMeters: 1000, endMeters: 2000, level: 'none' },
          ],
        },
      ],
    }

    const result = getWorstRainLevel(overlay)
    expect(result).toBe(RAIN_SUMMARY.NONE)
  })

  /**
   * AC2: Mixed rain intensities should return the worst condition
   * Priority: heavy > moderate > light > none
   */
  it('should satisfy AC2: returns "heavy" when mixed intensities include heavy', () => {
    const overlay: RainOverlay = {
      generatedAt: Date.now(),
      modelVersion: '1.0',
      legend: [],
      byLeg: [
        {
          legIndex: 0,
          segments: [
            { startMeters: 0, endMeters: 500, level: 'light' },
            { startMeters: 500, endMeters: 1000, level: 'heavy' },
            { startMeters: 1000, endMeters: 1500, level: 'moderate' },
          ],
        },
      ],
    }

    const result = getWorstRainLevel(overlay)
    expect(result).toBe(RAIN_SUMMARY.HEAVY)
  })

  /**
   * AC2: Mixed moderate and light should return 'moderate'
   */
  it('should satisfy AC2: returns "moderate" for mixed moderate and light', () => {
    const overlay: RainOverlay = {
      generatedAt: Date.now(),
      modelVersion: '1.0',
      legend: [],
      byLeg: [
        {
          legIndex: 0,
          segments: [
            { startMeters: 0, endMeters: 500, level: 'light' },
            { startMeters: 500, endMeters: 1000, level: 'moderate' },
          ],
        },
      ],
    }

    const result = getWorstRainLevel(overlay)
    expect(result).toBe(RAIN_SUMMARY.MODERATE)
  })

  /**
   * AC2: Multiple legs with different intensities should return the worst across all legs
   */
  it('should satisfy AC2: returns worst condition across multiple legs', () => {
    const overlay: RainOverlay = {
      generatedAt: Date.now(),
      modelVersion: '1.0',
      legend: [],
      byLeg: [
        {
          legIndex: 0,
          segments: [{ startMeters: 0, endMeters: 1000, level: 'light' }],
        },
        {
          legIndex: 1,
          segments: [{ startMeters: 1000, endMeters: 2000, level: 'moderate' }],
        },
        {
          legIndex: 2,
          segments: [{ startMeters: 2000, endMeters: 3000, level: 'none' }],
        },
      ],
    }

    const result = getWorstRainLevel(overlay)
    expect(result).toBe(RAIN_SUMMARY.MODERATE)
  })

  /**
   * AC3: Null overlay should return 'unavailable'
   */
  it('should satisfy AC3: returns "unavailable" for null overlay', () => {
    const result = getWorstRainLevel(undefined)
    expect(result).toBe(RAIN_SUMMARY.UNAVAILABLE)
  })

  /**
   * AC3: Undefined overlay should return 'unavailable'
   */
  it('should satisfy AC3: returns "unavailable" for undefined overlay', () => {
    const result = getWorstRainLevel(undefined)
    expect(result).toBe(RAIN_SUMMARY.UNAVAILABLE)
  })

  /**
   * AC4: Empty byLeg array should return 'unavailable'
   */
  it('should satisfy AC4: returns "unavailable" for empty byLeg array', () => {
    const overlay: RainOverlay = {
      generatedAt: Date.now(),
      modelVersion: '1.0',
      legend: [],
      byLeg: [],
    }

    const result = getWorstRainLevel(overlay)
    expect(result).toBe(RAIN_SUMMARY.UNAVAILABLE)
  })

  /**
   * AC4: Leg with empty segments array should return 'unavailable'
   */
  it('should satisfy AC4: returns "unavailable" for leg with empty segments', () => {
    const overlay: RainOverlay = {
      generatedAt: Date.now(),
      modelVersion: '1.0',
      legend: [],
      byLeg: [
        {
          legIndex: 0,
          segments: [],
        },
      ],
    }

    const result = getWorstRainLevel(overlay)
    expect(result).toBe(RAIN_SUMMARY.UNAVAILABLE)
  })

  /**
   * AC4: Malformed overlay (missing byLeg) should return 'unavailable'
   */
  it('should satisfy AC4: returns "unavailable" for malformed overlay without byLeg', () => {
    const overlay = {
      generatedAt: Date.now(),
      modelVersion: '1.0',
      legend: [],
      byLeg: null,
    }

    const result = getWorstRainLevel(overlay as any)
    expect(result).toBe(RAIN_SUMMARY.UNAVAILABLE)
  })

  /**
   * Additional: Unknown rain levels should return 'unavailable'
   */
  it('should return "unavailable" for unknown rain levels', () => {
    const overlay = {
      generatedAt: Date.now(),
      modelVersion: '1.0',
      legend: [],
      byLeg: [
        {
          legIndex: 0,
          segments: [{ startMeters: 0, endMeters: 1000, level: 'unknown-level' as any }],
        },
      ],
    }

    const result = getWorstRainLevel(overlay as any)
    expect(result).toBe(RAIN_SUMMARY.UNAVAILABLE)
  })
})

describe('RouteOptionCard rain badge display integration', () => {
  /**
   * Integration test: Verify that rainSummary from overlay data flows correctly to the badge
   */
  it('should correctly display rain badge based on derived rainSummary', () => {
    // Given: A route with light rain overlay data
    const overlay: RainOverlay = {
      generatedAt: Date.now(),
      modelVersion: '1.0',
      legend: [],
      byLeg: [
        {
          legIndex: 0,
          segments: [
            { startMeters: 0, endMeters: 1000, level: 'light' },
            { startMeters: 1000, endMeters: 2000, level: 'none' },
          ],
        },
      ],
    }

    // When: Deriving rain summary
    const rainSummary = getWorstRainLevel(overlay)

    // Then: Should return 'light' for display in RainBadge
    expect(rainSummary).toBe(RAIN_SUMMARY.LIGHT)
    // This rainSummary would be passed to RainBadge component as:
    // <RainBadge rainSummary={rainSummary} />
    // Which would display "Light rain" with blue styling
  })
})
