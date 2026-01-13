import type { PlanInput, RouteLeg, RouteSnapshot, RouteStop } from '../../../../models/saved-routes'
import type { ProviderRouteResponse } from '../providers/routing-provider'

type NormalizeRouteParams = {
  providerRoute: ProviderRouteResponse
  planInput: PlanInput
}

const toRouteStop = (lat: number, lng: number, label?: string, placeId?: string): RouteStop => ({
  lat,
  lng,
  label,
  placeId,
})

export const normalizeRoute = ({
  providerRoute,
  planInput,
}: NormalizeRouteParams): RouteSnapshot => {
  const origin = toRouteStop(
    planInput.start.lat,
    planInput.start.lng,
    planInput.start.label,
    planInput.start.placeId
  )
  const destination = toRouteStop(
    planInput.end.lat,
    planInput.end.lng,
    planInput.end.label,
    planInput.end.placeId
  )

  const legs: Array<RouteLeg> = providerRoute.legs.map((leg) => ({
    legIndex: leg.legIndex,
    start: toRouteStop(leg.start.lat, leg.start.lng),
    end: toRouteStop(leg.end.lat, leg.end.lng),
    distanceMeters: leg.distanceMeters,
    durationSeconds: leg.durationSeconds,
    geometry: {
      format: leg.geometry.format,
      encoding: leg.geometry.encoding,
      precision: leg.geometry.precision,
      value: leg.geometry.value,
    },
  }))

  return {
    provider: providerRoute.provider,
    bounds: providerRoute.bounds,
    origin,
    destination,
    waypoints: [], // PlanInput currently has no explicit intermediate waypoints; anchor points are not persisted as stops.
    overviewGeometry: providerRoute.overviewGeometry,
    legs,
    annotations: [],
    overlays: {},
  }
}
