import { getRainColor, getTemperatureColor, getWindColor } from '../../lib/map/overlay-colors'
import {
  computeCumulativeDistances,
  decodePolylineGeometry,
  type MapLatLng,
  slicePolylineByMeters,
} from '../../server/lib/polyline'
import type {
  PolylineGeometry,
  RainOverlayByLeg,
  RainOverlaySegment,
  RouteLeg,
  RouteOverlays,
  TemperatureOverlayByLeg,
  TemperatureOverlaySegment,
  WindOverlayByLeg,
  WindOverlaySegment,
} from '../../server/models/saved-routes'
import type { ExtendedTheme } from '../../styles/types'

type RoutePolylineInput = {
  route: {
    overviewGeometry: PolylineGeometry
    legs: RouteLeg[]
    overlays?: RouteOverlays
  }
  routeId?: string
  variant?: 'selected' | 'alternate'
  showLegs?: boolean
  showWindOverlay?: boolean
  showRainOverlay?: boolean
  showTemperatureOverlay?: boolean
}

export type BuiltPolyline = {
  id?: string
  coordinates: { latitude: number; longitude: number }[]
  strokeColor?: string
  strokeWidth?: number
}

const decodeLeg = (leg: RouteLeg): MapLatLng[] => decodePolylineGeometry(leg.geometry)

const buildWindOverlayPolylines = (
  legCoords: MapLatLng[],
  windOverlay: WindOverlayByLeg,
  semanticColors: ExtendedTheme['semantic'],
  routeId?: string,
): BuiltPolyline[] => {
  const distances = computeCumulativeDistances(legCoords)
  const prefix = routeId ? `${routeId}-` : ''

  return windOverlay.segments.flatMap((segment: WindOverlaySegment) => {
    const sliced = slicePolylineByMeters(
      legCoords,
      distances,
      segment.startMeters,
      segment.endMeters,
    )
    if (sliced.length < 2) return []

    return [
      {
        id: `${prefix}wind-${windOverlay.legIndex}-${segment.startMeters}-${segment.endMeters}`,
        coordinates: sliced,
        strokeColor: getWindColor(segment.level, semanticColors),
        strokeWidth: 6,
      },
    ]
  })
}

const buildRainOverlayPolylines = (
  legCoords: MapLatLng[],
  rainOverlay: RainOverlayByLeg,
  semanticColors: ExtendedTheme['semantic'],
  routeId?: string,
): BuiltPolyline[] => {
  const distances = computeCumulativeDistances(legCoords)
  const prefix = routeId ? `${routeId}-` : ''

  return rainOverlay.segments.flatMap((segment: RainOverlaySegment) => {
    const sliced = slicePolylineByMeters(
      legCoords,
      distances,
      segment.startMeters,
      segment.endMeters,
    )
    if (sliced.length < 2) return []

    return [
      {
        id: `${prefix}rain-${rainOverlay.legIndex}-${segment.startMeters}-${segment.endMeters}`,
        coordinates: sliced,
        strokeColor: getRainColor(segment.level, semanticColors),
        strokeWidth: 6,
      },
    ]
  })
}

const buildTemperatureOverlayPolylines = (
  legCoords: MapLatLng[],
  temperatureOverlay: TemperatureOverlayByLeg,
  semanticColors: ExtendedTheme['semantic'],
  routeId?: string,
): BuiltPolyline[] => {
  const distances = computeCumulativeDistances(legCoords)
  const prefix = routeId ? `${routeId}-` : ''

  return temperatureOverlay.segments.flatMap((segment: TemperatureOverlaySegment) => {
    const sliced = slicePolylineByMeters(
      legCoords,
      distances,
      segment.startMeters,
      segment.endMeters,
    )
    if (sliced.length < 2) return []

    return [
      {
        id: `${prefix}temp-${temperatureOverlay.legIndex}-${segment.startMeters}-${segment.endMeters}`,
        coordinates: sliced,
        strokeColor: getTemperatureColor(segment.level, semanticColors),
        strokeWidth: 6,
      },
    ]
  })
}

export const buildRoutePolylines = ({
  route,
  routeId,
  variant = 'selected',
  showLegs = true,
  showWindOverlay = true,
  showRainOverlay = true,
  showTemperatureOverlay = true,
  semantic,
}: RoutePolylineInput & { semantic: ExtendedTheme['semantic'] }): BuiltPolyline[] => {
  const overviewCoords = decodePolylineGeometry(route.overviewGeometry)
  const legCoords = route.legs.map((leg) => decodeLeg(leg))

  const overviewColor =
    variant === 'selected'
      ? semantic.color.routeSelected.default
      : semantic.color.routeAlternate.default
  const legColor =
    variant === 'selected' ? semantic.color.routeSelected.default : semantic.color.onSurface.muted

  const prefix = routeId ? `${routeId}-` : ''
  const polylines: BuiltPolyline[] = []

  if (overviewCoords.length > 1) {
    polylines.push({
      id: `${prefix}overview`,
      coordinates: overviewCoords,
      strokeColor: overviewColor,
      strokeWidth: 6,
    })
  }

  if (showLegs) {
    legCoords.forEach((coords, index) => {
      if (coords.length < 2) return
      polylines.push({
        id: `${prefix}leg-${index}`,
        coordinates: coords,
        strokeColor: legColor,
        strokeWidth: 4,
      })
    })
  }

  if (showWindOverlay) {
    const wind = route.overlays?.wind
    if (wind) {
      wind.byLeg.forEach((overlay) => {
        const coords = legCoords[overlay.legIndex]
        if (!coords || coords.length < 2) return
        polylines.push(...buildWindOverlayPolylines(coords, overlay, semantic, routeId))
      })
    }
  }

  if (showRainOverlay) {
    const rain = route.overlays?.rain
    if (rain) {
      rain.byLeg.forEach((overlay) => {
        const coords = legCoords[overlay.legIndex]
        if (!coords || coords.length < 2) return
        polylines.push(...buildRainOverlayPolylines(coords, overlay, semantic, routeId))
      })
    }
  }

  if (showTemperatureOverlay) {
    const temperature = route.overlays?.temperature
    if (temperature) {
      temperature.byLeg.forEach((overlay) => {
        const coords = legCoords[overlay.legIndex]
        if (!coords || coords.length < 2) return
        polylines.push(...buildTemperatureOverlayPolylines(coords, overlay, semantic, routeId))
      })
    }
  }

  return polylines
}
