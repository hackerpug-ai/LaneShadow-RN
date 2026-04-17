/**
 * Unit tests for rain timing calculator
 *
 * Tests pure functions for rain timing calculation
 */

import { describe, expect, it } from 'vitest'
import type { RainOverlay, RouteLeg } from '../../models/saved-routes'
import {
  calculateRainTiming,
  formatRainTiming,
  getRainTimingDisplay,
  type RainTimingResult,
} from './timing-calculator'

describe('timing-calculator', () => {
  const mockLegs: RouteLeg[] = [
    {
      legIndex: 0,
      start: { lat: 0, lng: 0 },
      end: { lat: 0, lng: 0 },
      distanceMeters: 10000,
      durationSeconds: 1800, // 30 minutes
      geometry: {
        format: 'polyline',
        encoding: 'utf8',
        precision: 5,
        value: 'test',
      },
    },
    {
      legIndex: 1,
      start: { lat: 0, lng: 0 },
      end: { lat: 0, lng: 0 },
      distanceMeters: 10000,
      durationSeconds: 1800, // 30 minutes
      geometry: {
        format: 'polyline',
        encoding: 'utf8',
        precision: 5,
        value: 'test',
      },
    },
    {
      legIndex: 2,
      start: { lat: 0, lng: 0 },
      end: { lat: 0, lng: 0 },
      distanceMeters: 10000,
      durationSeconds: 1800, // 30 minutes
      geometry: {
        format: 'polyline',
        encoding: 'utf8',
        precision: 5,
        value: 'test',
      },
    },
  ]

  describe('calculateRainTiming', () => {
    it('should return unavailable status when overlay is undefined', () => {
      const result = calculateRainTiming(undefined, mockLegs, Date.now())
      expect(result).toEqual({ status: 'unavailable' })
    })

    it('should return unavailable status when overlay has empty byLeg array', () => {
      const overlay: RainOverlay = {
        generatedAt: Date.now(),
        modelVersion: '1.0',
        legend: [],
        byLeg: [],
      }

      const result = calculateRainTiming(overlay, mockLegs, Date.now())
      expect(result).toEqual({ status: 'unavailable' })
    })

    it('should return no-rain status when all segments are "none"', () => {
      const overlay: RainOverlay = {
        generatedAt: Date.now(),
        modelVersion: '1.0',
        legend: [{ level: 'none', label: 'No rain' }],
        byLeg: [
          { legIndex: 0, segments: [{ startMeters: 0, endMeters: 10000, level: 'none' }] },
          { legIndex: 1, segments: [{ startMeters: 0, endMeters: 10000, level: 'none' }] },
          { legIndex: 2, segments: [{ startMeters: 0, endMeters: 10000, level: 'none' }] },
        ],
      }

      const result = calculateRainTiming(overlay, mockLegs, Date.now())
      expect(result).toEqual({ status: 'no-rain' })
    })

    it('should return throughout status when entire route has rain', () => {
      const overlay: RainOverlay = {
        generatedAt: Date.now(),
        modelVersion: '1.0',
        legend: [{ level: 'light', label: 'Light rain' }],
        byLeg: [
          { legIndex: 0, segments: [{ startMeters: 0, endMeters: 10000, level: 'light' }] },
          { legIndex: 1, segments: [{ startMeters: 0, endMeters: 10000, level: 'light' }] },
          { legIndex: 2, segments: [{ startMeters: 0, endMeters: 10000, level: 'light' }] },
        ],
      }

      const result = calculateRainTiming(overlay, mockLegs, Date.now())
      expect(result).toEqual({ status: 'throughout' })
    })

    it('should return range status for partial rain coverage', () => {
      // Departing at 1pm (13:00)
      const departureTime = new Date('2024-01-01T13:00:00').getTime()

      const overlay: RainOverlay = {
        generatedAt: Date.now(),
        modelVersion: '1.0',
        legend: [
          { level: 'none', label: 'No rain' },
          { level: 'light', label: 'Light rain' },
        ],
        byLeg: [
          { legIndex: 0, segments: [{ startMeters: 0, endMeters: 10000, level: 'none' }] },
          { legIndex: 1, segments: [{ startMeters: 0, endMeters: 10000, level: 'light' }] },
          { legIndex: 2, segments: [{ startMeters: 0, endMeters: 10000, level: 'light' }] },
        ],
      }

      const result = calculateRainTiming(overlay, mockLegs, departureTime)

      expect(result.status).toEqual('range')
      if (result.status === 'range') {
        // Rain starts at leg 1 arrival (1pm + 30min + 30min = 2pm)
        // Rain ends at leg 2 arrival (1pm + 30min + 30min + 30min = 2:30pm)
        expect(result.startHour).toBe(14) // 2pm in 24-hour
        expect(result.endHour).toBe(14) // 2:30pm in 24-hour
        expect(result.endMinute).toBe(30)
      }
    })

    it('should correctly calculate arrival times across multiple legs', () => {
      // Departing at 10am
      const departureTime = new Date('2024-01-01T10:00:00').getTime()

      const overlay: RainOverlay = {
        generatedAt: Date.now(),
        modelVersion: '1.0',
        legend: [{ level: 'light', label: 'Light rain' }],
        byLeg: [
          { legIndex: 0, segments: [{ startMeters: 0, endMeters: 10000, level: 'none' }] },
          { legIndex: 1, segments: [{ startMeters: 0, endMeters: 10000, level: 'light' }] },
        ],
      }

      const result = calculateRainTiming(overlay, mockLegs, departureTime)

      expect(result.status).toEqual('range')
      if (result.status === 'range') {
        // Rain starts at leg 1 arrival (10am + 30min + 30min = 11am)
        expect(result.startHour).toBe(11)
        expect(result.startMinute).toBe(0)
      }
    })

    it('should handle 12am (midnight) correctly', () => {
      // Departing at 11pm
      const departureTime = new Date('2024-01-01T23:00:00').getTime()

      const overlay: RainOverlay = {
        generatedAt: Date.now(),
        modelVersion: '1.0',
        legend: [{ level: 'light', label: 'Light rain' }],
        byLeg: [{ legIndex: 0, segments: [{ startMeters: 0, endMeters: 10000, level: 'light' }] }],
      }

      const result = calculateRainTiming(overlay, mockLegs, departureTime)

      expect(result.status).toEqual('range')
      if (result.status === 'range') {
        // Rain starts at leg 0 arrival (11pm + 30min = 11:30pm)
        expect(result.startHour).toBe(23)
        expect(result.startMinute).toBe(30)
      }
    })
  })

  describe('formatRainTiming', () => {
    it('should return null for no-rain status', () => {
      const result: RainTimingResult = { status: 'no-rain' }
      expect(formatRainTiming(result)).toBeNull()
    })

    it('should return "Rain throughout ride" for throughout status', () => {
      const result: RainTimingResult = { status: 'throughout' }
      expect(formatRainTiming(result)).toBe('Rain throughout ride')
    })

    it('should return "Rain data unavailable" for unavailable status', () => {
      const result: RainTimingResult = { status: 'unavailable' }
      expect(formatRainTiming(result)).toBe('Rain data unavailable')
    })

    it('should format range status with 12-hour format', () => {
      const result: RainTimingResult = {
        status: 'range',
        startHour: 14,
        endHour: 16,
        startMinute: 0,
        endMinute: 30,
      }
      expect(formatRainTiming(result)).toBe('Rain expected 2pm-4:30pm')
    })

    it('should format range status with minutes when needed', () => {
      const result: RainTimingResult = {
        status: 'range',
        startHour: 14,
        endHour: 15,
        startMinute: 15,
        endMinute: 45,
      }
      expect(formatRainTiming(result)).toBe('Rain expected 2:15pm-3:45pm')
    })

    it('should convert midnight (0) to 12am', () => {
      const result: RainTimingResult = {
        status: 'range',
        startHour: 0,
        endHour: 1,
        startMinute: 0,
        endMinute: 0,
      }
      expect(formatRainTiming(result)).toBe('Rain expected 12am-1am')
    })

    it('should convert noon (12) to 12pm', () => {
      const result: RainTimingResult = {
        status: 'range',
        startHour: 12,
        endHour: 13,
        startMinute: 0,
        endMinute: 0,
      }
      expect(formatRainTiming(result)).toBe('Rain expected 12pm-1pm')
    })

    it('should handle single hour ranges', () => {
      const result: RainTimingResult = {
        status: 'range',
        startHour: 14,
        endHour: 14,
        startMinute: 0,
        endMinute: 30,
      }
      expect(formatRainTiming(result)).toBe('Rain expected 2pm-2:30pm')
    })
  })

  describe('getRainTimingDisplay', () => {
    it('should return null when no rain is expected', () => {
      const overlay: RainOverlay = {
        generatedAt: Date.now(),
        modelVersion: '1.0',
        legend: [{ level: 'none', label: 'No rain' }],
        byLeg: [{ legIndex: 0, segments: [{ startMeters: 0, endMeters: 10000, level: 'none' }] }],
      }

      const result = getRainTimingDisplay(overlay, mockLegs, Date.now())
      expect(result).toBeNull()
    })

    it('should return formatted display string for rain scenarios', () => {
      const departureTime = new Date('2024-01-01T13:00:00').getTime()

      const overlay: RainOverlay = {
        generatedAt: Date.now(),
        modelVersion: '1.0',
        legend: [{ level: 'light', label: 'Light rain' }],
        byLeg: [
          { legIndex: 0, segments: [{ startMeters: 0, endMeters: 10000, level: 'light' }] },
          { legIndex: 1, segments: [{ startMeters: 0, endMeters: 10000, level: 'light' }] },
          { legIndex: 2, segments: [{ startMeters: 0, endMeters: 10000, level: 'light' }] },
        ],
      }

      const result = getRainTimingDisplay(overlay, mockLegs, departureTime)
      expect(result).toBe('Rain throughout ride')
    })
  })
})
