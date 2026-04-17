/**
 * Unit tests for coordinate conversion utilities.
 */

import {
  convertCoordinateArray,
  convertCoordinateArrayToGoogle,
  googleToMapbox,
  latLngToMapbox,
  mapboxToGoogle,
  mapboxToLatLng,
} from '../coordinate-converter'

describe('coordinate-converter', () => {
  describe('googleToMapbox', () => {
    it('should convert [lat, lng] to [lng, lat]', () => {
      const googleCoords: [number, number] = [37.7749, -122.4194]
      const result = googleToMapbox(googleCoords)
      expect(result).toEqual([-122.4194, 37.7749])
    })

    it('should handle negative coordinates', () => {
      const googleCoords: [number, number] = [-33.8688, 151.2093] // Sydney
      const result = googleToMapbox(googleCoords)
      expect(result).toEqual([151.2093, -33.8688])
    })

    it('should handle zero coordinates', () => {
      const googleCoords: [number, number] = [0, 0]
      const result = googleToMapbox(googleCoords)
      expect(result).toEqual([0, 0])
    })
  })

  describe('mapboxToGoogle', () => {
    it('should convert [lng, lat] to [lat, lng]', () => {
      const mapboxCoords: [number, number] = [-122.4194, 37.7749]
      const result = mapboxToGoogle(mapboxCoords)
      expect(result).toEqual([37.7749, -122.4194])
    })

    it('should be reversible with googleToMapbox', () => {
      const original: [number, number] = [40.7128, -74.006] // New York
      const converted = googleToMapbox(original)
      const back = mapboxToGoogle(converted)
      expect(back).toEqual(original)
    })
  })

  describe('convertCoordinateArray', () => {
    it('should convert array of Google coordinates to Mapbox format', () => {
      const googleCoords: [number, number][] = [
        [37.7749, -122.4194],
        [34.0522, -118.2437],
        [40.7128, -74.006],
      ]
      const result = convertCoordinateArray(googleCoords)
      expect(result).toEqual([
        [-122.4194, 37.7749],
        [-118.2437, 34.0522],
        [-74.006, 40.7128],
      ])
    })

    it('should handle empty array', () => {
      const result = convertCoordinateArray([])
      expect(result).toEqual([])
    })

    it('should handle single coordinate', () => {
      const googleCoords: [number, number][] = [[37.7749, -122.4194]]
      const result = convertCoordinateArray(googleCoords)
      expect(result).toEqual([[-122.4194, 37.7749]])
    })
  })

  describe('convertCoordinateArrayToGoogle', () => {
    it('should convert array of Mapbox coordinates to Google format', () => {
      const mapboxCoords: [number, number][] = [
        [-122.4194, 37.7749],
        [-118.2437, 34.0522],
        [-74.006, 40.7128],
      ]
      const result = convertCoordinateArrayToGoogle(mapboxCoords)
      expect(result).toEqual([
        [37.7749, -122.4194],
        [34.0522, -118.2437],
        [40.7128, -74.006],
      ])
    })

    it('should be reversible with convertCoordinateArray', () => {
      const original: [number, number][] = [
        [37.7749, -122.4194],
        [34.0522, -118.2437],
      ]
      const converted = convertCoordinateArray(original)
      const back = convertCoordinateArrayToGoogle(converted)
      expect(back).toEqual(original)
    })
  })

  describe('latLngToMapbox', () => {
    it('should convert lat/lng object to Mapbox format', () => {
      const coord = { latitude: 37.7749, longitude: -122.4194 }
      const result = latLngToMapbox(coord)
      expect(result).toEqual([-122.4194, 37.7749])
    })
  })

  describe('mapboxToLatLng', () => {
    it('should convert Mapbox coordinates to lat/lng object', () => {
      const mapboxCoords: [number, number] = [-122.4194, 37.7749]
      const result = mapboxToLatLng(mapboxCoords)
      expect(result).toEqual({ latitude: 37.7749, longitude: -122.4194 })
    })

    it('should be reversible with latLngToMapbox', () => {
      const original = { latitude: 40.7128, longitude: -74.006 }
      const converted = latLngToMapbox(original)
      const back = mapboxToLatLng(converted)
      expect(back).toEqual(original)
    })
  })

  describe('real-world coordinates', () => {
    it('should correctly convert Golden Gate Bridge coordinates', () => {
      const goldenGate: [number, number] = [37.8199, -122.4783]
      const mapbox = googleToMapbox(goldenGate)
      expect(mapbox).toEqual([-122.4783, 37.8199])
    })

    it('should correctly convert Eiffel Tower coordinates', () => {
      const eiffelTower: [number, number] = [48.8584, 2.2945]
      const mapbox = googleToMapbox(eiffelTower)
      expect(mapbox).toEqual([2.2945, 48.8584])
    })

    it('should correctly convert Sydney Opera House coordinates', () => {
      const sydneyOpera: [number, number] = [-33.8568, 151.2153]
      const mapbox = googleToMapbox(sydneyOpera)
      expect(mapbox).toEqual([151.2153, -33.8568])
    })
  })
})
