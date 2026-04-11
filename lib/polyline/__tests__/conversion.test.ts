import { describe, it, expect } from 'vitest'
import {
  googleToMapbox,
  mapboxToGoogle,
  googleCoordsToMapbox,
  mapboxCoordsToGoogle,
  convertWeatherSegments,
  isValidCoord,
  clampCoord,
  isGoogleCoord,
  isMapboxCoord,
  detectCoordFormat,
  type GoogleCoord,
  type MapboxCoord,
  type WeatherSegment,
} from '../conversion'

describe('CLR-019: Polyline Coordinate Conversion', () => {
  // =========================================================================
  // AC-001: Google <-> Mapbox coordinate conversion
  // =========================================================================
  describe('AC-001: Google <-> Mapbox coordinate conversion', () => {
    describe('googleToMapbox', () => {
      it('converts Google [lat, lng] to Mapbox [lng, lat]', () => {
        expect(googleToMapbox([37.7749, -122.4194])).toEqual([-122.4194, 37.7749])
      })

      it('round-trips via mapboxToGoogle', () => {
        const original: GoogleCoord = [40.7128, -74.006]
        expect(mapboxToGoogle(googleToMapbox(original))).toEqual(original)
      })

      it('handles origin (0, 0)', () => {
        expect(googleToMapbox([0, 0])).toEqual([0, 0])
      })

      it('handles negative latitude', () => {
        expect(googleToMapbox([-33.8688, 151.2093])).toEqual([151.2093, -33.8688])
      })
    })

    describe('mapboxToGoogle', () => {
      it('converts Mapbox [lng, lat] to Google [lat, lng]', () => {
        expect(mapboxToGoogle([-122.4194, 37.7749])).toEqual([37.7749, -122.4194])
      })

      it('round-trips via googleToMapbox', () => {
        const original: MapboxCoord = [-74.006, 40.7128]
        expect(googleToMapbox(mapboxToGoogle(original))).toEqual(original)
      })
    })

    describe('array conversion', () => {
      it('converts arrays of Google coords to Mapbox', () => {
        const google: GoogleCoord[] = [
          [37.7749, -122.4194],
          [34.0522, -118.2437],
          [40.7128, -74.006],
        ]
        expect(googleCoordsToMapbox(google)).toEqual([
          [-122.4194, 37.7749],
          [-118.2437, 34.0522],
          [-74.006, 40.7128],
        ])
      })

      it('returns empty array for empty input', () => {
        expect(googleCoordsToMapbox([])).toEqual([])
      })

      it('round-trips 1000 coordinates', () => {
        const original: GoogleCoord[] = Array.from({ length: 1000 }, (_, i) => [
          37 + i * 0.001,
          -122 + i * 0.001,
        ])
        const roundTrip = mapboxCoordsToGoogle(googleCoordsToMapbox(original))
        expect(roundTrip).toEqual(original)
      })
    })
  })

  // =========================================================================
  // AC-002: Weather segment preservation
  // =========================================================================
  describe('AC-002: Weather segment preservation', () => {
    const makeSegment = (
      startIndex: number,
      endIndex: number,
      weather: Record<string, unknown>,
      coords: GoogleCoord[],
    ): WeatherSegment => ({ startIndex, endIndex, weather, coords })

    it('converts segment coords while preserving weather data', () => {
      const segment = makeSegment(0, 5, { temp: 72, condition: 'clear' }, [
        [37.7749, -122.4194],
        [37.775, -122.419],
      ])
      const converted = convertWeatherSegments([segment], 'googleToMapbox')
      expect(converted[0].coords).toEqual([
        [-122.4194, 37.7749],
        [-122.419, 37.775],
      ])
      expect(converted[0].weather).toEqual({ temp: 72, condition: 'clear' })
    })

    it('preserves startIndex and endIndex', () => {
      const segment = makeSegment(3, 15, { condition: 'rain' }, [[37, -122]])
      const converted = convertWeatherSegments([segment], 'googleToMapbox')
      expect(converted[0].startIndex).toBe(3)
      expect(converted[0].endIndex).toBe(15)
    })

    it('handles multiple segments', () => {
      const segments = [
        makeSegment(0, 5, { condition: 'clear' }, [[37.7, -122.4]]),
        makeSegment(5, 10, { condition: 'rain' }, [[37.8, -122.3]]),
      ]
      const converted = convertWeatherSegments(segments, 'googleToMapbox')
      expect(converted).toHaveLength(2)
      expect(converted[0].weather).toEqual({ condition: 'clear' })
      expect(converted[1].weather).toEqual({ condition: 'rain' })
    })

    it('round-trips without data loss', () => {
      const segments = [makeSegment(0, 5, { temp: 72 }, [[37.7, -122.4]])]
      const toMapbox = convertWeatherSegments(segments, 'googleToMapbox')
      const back = convertWeatherSegments(toMapbox, 'mapboxToGoogle')
      expect(back[0].coords).toEqual(segments[0].coords)
      expect(back[0].weather).toEqual(segments[0].weather)
    })

    it('handles empty segments array', () => {
      expect(convertWeatherSegments([], 'googleToMapbox')).toEqual([])
    })
  })

  // =========================================================================
  // AC-003: Edge cases
  // =========================================================================
  describe('AC-003: Edge cases', () => {
    it('handles North Pole (lat=90)', () => {
      expect(googleToMapbox([90, 0])).toEqual([0, 90])
      expect(mapboxToGoogle([0, 90])).toEqual([90, 0])
    })

    it('handles South Pole (lat=-90)', () => {
      expect(googleToMapbox([-90, 0])).toEqual([0, -90])
    })

    it('handles date line +180', () => {
      expect(googleToMapbox([0, 180])).toEqual([180, 0])
    })

    it('handles date line -180', () => {
      expect(googleToMapbox([0, -180])).toEqual([-180, 0])
    })

    it('detects NaN as invalid', () => {
      expect(isValidCoord([NaN, 0])).toBe(false)
      expect(isValidCoord([0, NaN])).toBe(false)
    })

    it('detects Infinity as invalid', () => {
      expect(isValidCoord([Infinity, 0])).toBe(false)
      expect(isValidCoord([0, -Infinity])).toBe(false)
    })

    it('detects latitude > 90 as invalid', () => {
      expect(isValidCoord([91, 0])).toBe(false)
    })

    it('detects latitude < -90 as invalid', () => {
      expect(isValidCoord([-91, 0])).toBe(false)
    })

    it('detects longitude > 180 as invalid', () => {
      expect(isValidCoord([0, 181])).toBe(false)
    })

    it('detects longitude < -180 as invalid', () => {
      expect(isValidCoord([0, -181])).toBe(false)
    })

    it('accepts valid coordinates', () => {
      expect(isValidCoord([37.7749, -122.4194])).toBe(true)
      expect(isValidCoord([0, 0])).toBe(true)
      expect(isValidCoord([90, 180])).toBe(true)
      expect(isValidCoord([-90, -180])).toBe(true)
    })

    it('clamps latitude to [-90, 90]', () => {
      expect(clampCoord([95, -122])[0]).toBe(90)
      expect(clampCoord([-95, -122])[0]).toBe(-90)
    })

    it('clamps longitude to [-180, 180]', () => {
      expect(clampCoord([37, 200])[1]).toBe(180)
      expect(clampCoord([37, -200])[1]).toBe(-180)
    })

    it('leaves valid coordinates unchanged', () => {
      expect(clampCoord([37.7749, -122.4194])).toEqual([37.7749, -122.4194])
    })
  })

  // =========================================================================
  // AC-004: Format detection
  // =========================================================================
  describe('AC-004: Format detection', () => {
    it('detects Google format for typical US coordinates', () => {
      expect(detectCoordFormat([[37.7749, -122.4194], [34.0522, -118.2437]])).toBe('google')
    })

    it('detects Mapbox format for Mapbox-ordered coordinates', () => {
      expect(detectCoordFormat([[-122.4194, 37.7749], [-118.2437, 34.0522]])).toBe('mapbox')
    })

    it('returns unknown for empty array', () => {
      expect(detectCoordFormat([])).toBe('unknown')
    })

    it('isGoogleCoord returns true for valid Google coords', () => {
      expect(isGoogleCoord([37.7749, -122.4194])).toBe(true)
      expect(isGoogleCoord([0, 0])).toBe(true)
    })

    it('isMapboxCoord returns true for valid Mapbox coords', () => {
      expect(isMapboxCoord([-122.4194, 37.7749])).toBe(true)
    })
  })

  // =========================================================================
  // AC-005: Performance benchmarks
  // =========================================================================
  describe('AC-005: Performance', () => {
    it('converts 10,000 coordinates in under 50ms', () => {
      const coords: GoogleCoord[] = Array.from({ length: 10000 }, (_, i) => [
        37 + (i * 0.001) % 90,
        -122 + (i * 0.001) % 360 - 180,
      ])

      const start = performance.now()
      const result = googleCoordsToMapbox(coords)
      const elapsed = performance.now() - start

      expect(result).toHaveLength(10000)
      expect(elapsed).toBeLessThan(50)
    })

    it('round-trips 10,000 coordinates in under 100ms', () => {
      const original: GoogleCoord[] = Array.from({ length: 10000 }, (_, i) => [
        37 + (i * 0.001) % 90,
        -122 + (i * 0.001) % 360 - 180,
      ])

      const start = performance.now()
      const roundTrip = mapboxCoordsToGoogle(googleCoordsToMapbox(original))
      const elapsed = performance.now() - start

      expect(roundTrip).toEqual(original)
      expect(elapsed).toBeLessThan(100)
    })

    it('converts 1,000 weather segments in under 100ms', () => {
      const segments: WeatherSegment[] = Array.from({ length: 1000 }, (_, i) => ({
        startIndex: i * 10,
        endIndex: (i + 1) * 10,
        weather: { temp: 70 + (i % 30) },
        coords: Array.from({ length: 10 }, (_, j) => [
          37 + i * 0.01 + j * 0.001,
          -122 + i * 0.01 + j * 0.001,
        ]) as GoogleCoord[],
      }))

      const start = performance.now()
      const converted = convertWeatherSegments(segments, 'googleToMapbox')
      const elapsed = performance.now() - start

      expect(converted).toHaveLength(1000)
      expect(elapsed).toBeLessThan(100)
    })
  })
})
