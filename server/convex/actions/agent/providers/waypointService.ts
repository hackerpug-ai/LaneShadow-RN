'use node'
import { decodePolyline, haversineDistance, type LatLng } from '../lib/geo'
import type { ProviderLatLng, ProviderPolylineGeometry } from './routingProvider'
import { createRoutingProvider } from './routingProvider'
export type NearestPointResult = { point: ProviderLatLng; distanceMeters: number }
export type DetourInfo = {
  distanceAddedMeters: number
  timeAddedSeconds: number
  reconnectPoint: ProviderLatLng
  nearestPointOnRoute: ProviderLatLng
}
export type DeviationResult = { kind: 'on_route' } | { kind: 'off_route'; detourInfo: DetourInfo }
export const findNearestPointOnPolyline = (
  waypoint: { lat: number; lng: number; name: string },
  routeGeometry: ProviderPolylineGeometry,
): NearestPointResult => {
  const points = decodePolyline(routeGeometry.value)
  if (points.length === 0) {
    throw new Error('Cannot find nearest point on empty polyline')
  }
  if (points.length === 1) {
    const distance = haversineDistance(waypoint, points[0])
    return { point: points[0], distanceMeters: distance }
  }
  let nearestPoint: LatLng = points[0]
  let minDistance = Infinity
  for (let i = 0; i < points.length - 1; i++) {
    const segmentStart = points[i]
    const segmentEnd = points[i + 1]
    const { point, distance } = findClosestPointOnSegment(waypoint, segmentStart, segmentEnd)
    if (distance < minDistance) {
      minDistance = distance
      nearestPoint = point
    }
  }
  return { point: nearestPoint, distanceMeters: minDistance }
}
const findClosestPointOnSegment = (
  point: LatLng,
  segmentStart: LatLng,
  segmentEnd: LatLng,
): { point: LatLng; distance: number } => {
  const dx = segmentEnd.lng - segmentStart.lng
  const dy = segmentEnd.lat - segmentStart.lat
  if (dx === 0 && dy === 0) {
    const distance = haversineDistance(point, segmentStart)
    return { point: segmentStart, distance }
  }
  const t =
    ((point.lng - segmentStart.lng) * dx + (point.lat - segmentStart.lat) * dy) /
    (dx * dx + dy * dy)
  let closest: LatLng
  if (t <= 0) {
    closest = segmentStart
  } else if (t >= 1) {
    closest = segmentEnd
  } else {
    closest = {
      lat: segmentStart.lat + t * dy,
      lng: segmentStart.lng + t * dx,
    }
  }
  const distance = haversineDistance(point, closest)
  return { point: closest, distance }
}
export const calculateDeviation = async (params: {
  waypoint: { lat: number; lng: number; name: string }
  routeGeometry: ProviderPolylineGeometry
}): Promise<DeviationResult> => {
  const { waypoint, routeGeometry } = params
  const nearest = findNearestPointOnPolyline(waypoint, routeGeometry)
  const ON_ROUTE_THRESHOLD_METERS = 500
  if (nearest.distanceMeters <= ON_ROUTE_THRESHOLD_METERS) {
    return { kind: 'on_route' }
  }
  const reconnectPoint = findOptimalReconnectionPoint(waypoint, routeGeometry, nearest.point)
  const routingProvider = createRoutingProvider()
  const detourRoute = await routingProvider.routeDetour({
    origin: nearest.point,
    destination: reconnectPoint,
    waypoint: { lat: waypoint.lat, lng: waypoint.lng },
  })
  const distanceAddedMeters = detourRoute.legs.reduce((sum, leg) => sum + leg.distanceMeters, 0)
  const timeAddedSeconds = detourRoute.legs.reduce((sum, leg) => sum + leg.durationSeconds, 0)
  return {
    kind: 'off_route',
    detourInfo: {
      distanceAddedMeters,
      timeAddedSeconds,
      reconnectPoint,
      nearestPointOnRoute: nearest.point,
    },
  }
}
const findOptimalReconnectionPoint = (
  waypoint: { lat: number; lng: number; name: string },
  routeGeometry: ProviderPolylineGeometry,
  nearestPoint: LatLng,
): LatLng => {
  return nearestPoint
}
