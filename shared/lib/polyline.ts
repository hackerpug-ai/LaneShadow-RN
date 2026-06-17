import polyline from '@mapbox/polyline'
import type { PolylineGeometry } from '../models/saved-routes'

export type LatLng = { lat: number; lng: number }
export type MapLatLng = { latitude: number; longitude: number }

export const decodePolylineGeometry = (geometry: PolylineGeometry): MapLatLng[] => {
  const decoded = polyline.decode(geometry.value, geometry.precision)
  return decoded.map(([latitude, longitude]: [number, number]) => ({ latitude, longitude }))
}

const toRadians = (value: number): number => (value * Math.PI) / 180

export const haversineMeters = (a: MapLatLng, b: MapLatLng): number => {
  const R = 6371000 // meters
  const dLat = toRadians(b.latitude - a.latitude)
  const dLon = toRadians(b.longitude - a.longitude)
  const lat1 = toRadians(a.latitude)
  const lat2 = toRadians(b.latitude)

  const sinLat = Math.sin(dLat / 2)
  const sinLon = Math.sin(dLon / 2)

  const aa = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon
  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa))
  return R * c
}

export const computeCumulativeDistances = (coords: MapLatLng[]): number[] => {
  if (coords.length === 0) {
    return []
  }

  const distances: number[] = [0]
  for (let i = 1; i < coords.length; i += 1) {
    const segment = haversineMeters(coords[i - 1], coords[i])
    distances.push(distances[i - 1] + segment)
  }
  return distances
}

const interpolatePoint = (start: MapLatLng, end: MapLatLng, t: number): MapLatLng => {
  return {
    latitude: start.latitude + (end.latitude - start.latitude) * t,
    longitude: start.longitude + (end.longitude - start.longitude) * t,
  }
}

export type {
  ConversionDirection,
  CoordFormat,
  GoogleCoord,
  MapboxCoord,
  WeatherSegment,
} from './polyline/conversion'
/**
 * Slice a decoded polyline by distance (meters) along the path, returning a
 * new coordinate array that begins/ends at the requested distances. This is
 * used to render wind overlay segments with distinct colors.
 */
// CLR-019: Coordinate conversion re-exports
export {
  clampCoord,
  convertWeatherSegments,
  detectCoordFormat,
  googleCoordsToMapbox,
  googleToMapbox,
  isGoogleCoord,
  isMapboxCoord,
  isValidCoord,
  mapboxCoordsToGoogle,
  mapboxToGoogle,
} from './polyline/conversion'

export const slicePolylineByMeters = (
  coords: MapLatLng[],
  cumulativeDistances: number[] | undefined,
  startMeters: number,
  endMeters: number,
): MapLatLng[] => {
  if (coords.length < 2 || endMeters <= startMeters) {
    return []
  }

  const distances = cumulativeDistances ?? computeCumulativeDistances(coords)
  const sliced: MapLatLng[] = []

  for (let i = 0; i < coords.length - 1; i += 1) {
    const segStart = distances[i]
    const segEnd = distances[i + 1]

    if (segEnd <= startMeters) continue
    if (segStart >= endMeters) break

    const clampedStart = Math.max(segStart, startMeters)
    const clampedEnd = Math.min(segEnd, endMeters)

    if (clampedEnd < clampedStart) continue

    const startT = (clampedStart - segStart) / (segEnd - segStart)
    const endT = (clampedEnd - segStart) / (segEnd - segStart)

    const startPoint = startT <= 0 ? coords[i] : interpolatePoint(coords[i], coords[i + 1], startT)
    const endPoint = endT >= 1 ? coords[i + 1] : interpolatePoint(coords[i], coords[i + 1], endT)

    if (sliced.length === 0) {
      sliced.push(startPoint)
    } else {
      const last = sliced[sliced.length - 1]
      if (last.latitude !== startPoint.latitude || last.longitude !== startPoint.longitude) {
        sliced.push(startPoint)
      }
    }

    sliced.push(endPoint)
  }

  return sliced
}
