import {
  computeCumulativeDistances,
  decodePolylineGeometry,
  type MapLatLng,
} from '../../../shared/lib/polyline'

function boundsCenter(bounds: any): MapLatLng | null {
  if (
    typeof bounds?.north === 'number' &&
    typeof bounds?.south === 'number' &&
    typeof bounds?.east === 'number' &&
    typeof bounds?.west === 'number'
  ) {
    return {
      latitude: (bounds.north + bounds.south) / 2,
      longitude: (bounds.east + bounds.west) / 2,
    }
  }

  if (
    typeof bounds?.northeast?.lat === 'number' &&
    typeof bounds?.southwest?.lat === 'number' &&
    typeof bounds?.northeast?.lng === 'number' &&
    typeof bounds?.southwest?.lng === 'number'
  ) {
    return {
      latitude: (bounds.northeast.lat + bounds.southwest.lat) / 2,
      longitude: (bounds.northeast.lng + bounds.southwest.lng) / 2,
    }
  }

  return null
}

/**
 * Compute the midpoint of a route's overview geometry.
 * Uses linear interpolation between decoded coordinates at 50% arc-length.
 * Falls back to bounds center when geometry is too short.
 */
export const computeRouteMidpoint = (overviewGeometry: any, bounds?: any): MapLatLng => {
  const fallbackCenter = boundsCenter(bounds)
  if (!overviewGeometry) {
    return fallbackCenter ?? { latitude: 0, longitude: 0 }
  }

  try {
    const decoded = decodePolylineGeometry(overviewGeometry)
    if (decoded.length < 2) {
      return fallbackCenter ?? decoded[0] ?? { latitude: 0, longitude: 0 }
    }

    const cumulativeDistances = computeCumulativeDistances(decoded)
    const totalDistance = cumulativeDistances[cumulativeDistances.length - 1]
    const targetDistance = totalDistance / 2

    for (let i = 1; i < cumulativeDistances.length; i += 1) {
      if (cumulativeDistances[i] >= targetDistance) {
        const prevDistance = cumulativeDistances[i - 1]
        const segmentDistance = cumulativeDistances[i] - prevDistance
        const t = segmentDistance > 0 ? (targetDistance - prevDistance) / segmentDistance : 0
        const prev = decoded[i - 1]
        const curr = decoded[i]
        return {
          latitude: prev.latitude + (curr.latitude - prev.latitude) * t,
          longitude: prev.longitude + (curr.longitude - prev.longitude) * t,
        }
      }
    }

    return (
      decoded[Math.floor(decoded.length / 2)] ?? fallbackCenter ?? { latitude: 0, longitude: 0 }
    )
  } catch {
    return fallbackCenter ?? { latitude: 0, longitude: 0 }
  }
}
