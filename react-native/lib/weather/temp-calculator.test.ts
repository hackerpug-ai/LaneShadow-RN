/**
 * Temperature Range Calculator Tests
 *
 * Tests for temperature range calculation and formatting
 * Following TDD RED-GREEN-REFACTOR cycle
 */

import { describe, expect, it } from 'vitest'
import type { TemperatureOverlay } from '../../models/saved-routes'
import {
  calculateTempRange,
  formatTempRange,
  getTempRangeDisplay,
  hasExtremeTemp,
  type TempRangeResult,
} from './temp-calculator'

describe('temp-calculator', () => {
  describe('calculateTempRange', () => {
    describe('AC1: high/low display (62F to 85F)', () => {
      it('should return high/low range for varying temperatures', () => {
        // 62F = ~16.7C, 85F = ~29.4C
        const overlay: TemperatureOverlay = {
          generatedAt: Date.now(),
          modelVersion: 'test',
          legend: [],
          byLeg: [
            {
              legIndex: 0,
              segments: [
                { level: 'mild', temperatureCelsius: 17, startMeters: 0, endMeters: 100 },
                { level: 'warm', temperatureCelsius: 29, startMeters: 100, endMeters: 200 },
              ],
            },
          ],
        }

        const result = calculateTempRange(overlay)

        expect(result.status).toBe('range')
        if (result.status === 'range') {
          expect(result.highF).toBe(84) // 29C -> 84.2F -> 84F
          expect(result.lowF).toBe(63) // 17C -> 62.6F -> 63F
        }
      })
    })

    describe('AC2: consistent temperature (around 70F)', () => {
      it('should return consistent status for similar temperatures', () => {
        // All segments around 70F (21C)
        const overlay: TemperatureOverlay = {
          generatedAt: Date.now(),
          modelVersion: 'test',
          legend: [],
          byLeg: [
            {
              legIndex: 0,
              segments: [
                { level: 'mild', temperatureCelsius: 21, startMeters: 0, endMeters: 100 },
                { level: 'mild', temperatureCelsius: 22, startMeters: 100, endMeters: 200 },
              ],
            },
          ],
        }

        const result = calculateTempRange(overlay)

        expect(result.status).toBe('consistent')
        if (result.status === 'consistent') {
          expect(result.tempF).toBe(72) // 22C -> 71.6F -> 72F
        }
      })
    })

    describe('AC3: unavailable temperature data', () => {
      it('should return unavailable status for undefined overlay', () => {
        const result = calculateTempRange(undefined)
        expect(result.status).toBe('unavailable')
      })

      it('should return unavailable status for empty overlay', () => {
        const overlay: TemperatureOverlay = {
          generatedAt: Date.now(),
          modelVersion: 'test',
          legend: [],
          byLeg: [],
        }

        const result = calculateTempRange(overlay)
        expect(result.status).toBe('unavailable')
      })

      it('should return unavailable status for overlay with no temperature values', () => {
        const overlay: TemperatureOverlay = {
          generatedAt: Date.now(),
          modelVersion: 'test',
          legend: [],
          byLeg: [
            {
              legIndex: 0,
              segments: [{ level: 'mild', startMeters: 0, endMeters: 100 }], // No temperatureCelsius
            },
          ],
        }

        const result = calculateTempRange(overlay)
        expect(result.status).toBe('unavailable')
      })
    })

    describe('AC4: extreme temperature values', () => {
      it('should detect cold extreme (below 40F)', () => {
        // 35F = ~1.7C
        const overlay: TemperatureOverlay = {
          generatedAt: Date.now(),
          modelVersion: 'test',
          legend: [],
          byLeg: [
            {
              legIndex: 0,
              segments: [{ level: 'cold', temperatureCelsius: 2, startMeters: 0, endMeters: 100 }],
            },
          ],
        }

        const result = calculateTempRange(overlay)
        const extreme = hasExtremeTemp(result)

        expect(extreme).toBe('cold')
      })

      it('should detect hot extreme (above 90F)', () => {
        // 95F = ~35C
        const overlay: TemperatureOverlay = {
          generatedAt: Date.now(),
          modelVersion: 'test',
          legend: [],
          byLeg: [
            {
              legIndex: 0,
              segments: [{ level: 'hot', temperatureCelsius: 35, startMeters: 0, endMeters: 100 }],
            },
          ],
        }

        const result = calculateTempRange(overlay)
        const extreme = hasExtremeTemp(result)

        expect(extreme).toBe('hot')
      })

      it('should return null for normal temperatures', () => {
        const overlay: TemperatureOverlay = {
          generatedAt: Date.now(),
          modelVersion: 'test',
          legend: [],
          byLeg: [
            {
              legIndex: 0,
              segments: [{ level: 'mild', temperatureCelsius: 20, startMeters: 0, endMeters: 100 }],
            },
          ],
        }

        const result = calculateTempRange(overlay)
        const extreme = hasExtremeTemp(result)

        expect(extreme).toBeNull()
      })
    })
  })

  describe('formatTempRange', () => {
    it('should format range status as "High X°F / Low Y°F"', () => {
      const result: TempRangeResult = { status: 'range', highF: 85, lowF: 62 }
      expect(formatTempRange(result)).toBe('High 85°F / Low 62°F')
    })

    it('should format consistent status as "Around X°F"', () => {
      const result: TempRangeResult = { status: 'consistent', tempF: 70 }
      expect(formatTempRange(result)).toBe('Around 70°F')
    })

    it('should format unavailable status', () => {
      const result: TempRangeResult = { status: 'unavailable' }
      expect(formatTempRange(result)).toBe('Temperature data unavailable')
    })
  })

  describe('hasExtremeTemp', () => {
    it('should return null for unavailable status', () => {
      const result: TempRangeResult = { status: 'unavailable' }
      expect(hasExtremeTemp(result)).toBeNull()
    })

    it('should return null for consistent status', () => {
      const result: TempRangeResult = { status: 'consistent', tempF: 70 }
      expect(hasExtremeTemp(result)).toBeNull()
    })

    it('should return "cold" when low is below 40F', () => {
      const result: TempRangeResult = { status: 'range', highF: 50, lowF: 35 }
      expect(hasExtremeTemp(result)).toBe('cold')
    })

    it('should return "hot" when high is above 90F', () => {
      const result: TempRangeResult = { status: 'range', highF: 95, lowF: 70 }
      expect(hasExtremeTemp(result)).toBe('hot')
    })

    it('should return null when temperatures are in normal range', () => {
      const result: TempRangeResult = { status: 'range', highF: 85, lowF: 62 }
      expect(hasExtremeTemp(result)).toBeNull()
    })
  })

  describe('getTempRangeDisplay', () => {
    it('should return formatted display string', () => {
      const overlay: TemperatureOverlay = {
        generatedAt: Date.now(),
        modelVersion: 'test',
        legend: [],
        byLeg: [
          {
            legIndex: 0,
            segments: [{ level: 'mild', temperatureCelsius: 20, startMeters: 0, endMeters: 100 }],
          },
        ],
      }

      const display = getTempRangeDisplay(overlay)
      expect(display).toBe('Around 68°F')
    })

    it('should return unavailable message for undefined overlay', () => {
      const display = getTempRangeDisplay(undefined)
      expect(display).toBe('Temperature data unavailable')
    })
  })
})
