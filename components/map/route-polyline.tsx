import type {
  PolylineGeometry,
  RouteLeg,
  RouteOverlays,
  WindOverlayByLeg,
  WindOverlaySegment,
  RainOverlayByLeg,
  RainOverlaySegment,
} from '../../models/saved-routes'
import type { ExtendedTheme } from '../../styles/types'
import { computeCumulativeDistances, decodePolylineGeometry, slicePolylineByMeters, type MapLatLng } from '../../lib/polyline'
import { getRainColor, getWindColor } from '../../lib/map/overlay-colors'

type RoutePolylineInput = {
  route: {
    overviewGeometry: PolylineGeometry
    legs: Array<RouteLeg>
    overlays?: RouteOverlays
  }
  variant?: 'selected' | 'alternate'
  showLegs?: boolean
  showWindOverlay?: boolean
  showRainOverlay?: boolean
}

export type BuiltPolyline = {
  id?: string
  coordinates: Array<{ latitude: number; longitude: number }>
  strokeColor?: string
  strokeWidth?: number
}

const decodeLeg = (leg: RouteLeg): Array<MapLatLng> => decodePolylineGeometry(leg.geometry)

const buildWindOverlayPolylines = (
  legCoords: Array<MapLatLng>,
  windOverlay: WindOverlayByLeg,
  semanticColors: ExtendedTheme['semantic']
): Array<BuiltPolyline> => {
  const distances = computeCumulativeDistances(legCoords)

  return windOverlay.segments.flatMap((segment: WindOverlaySegment) => {
    const sliced = slicePolylineByMeters(legCoords, distances, segment.startMeters, segment.endMeters)
    if (sliced.length < 2) return []

    return [
      {
        id: `wind-${windOverlay.legIndex}-${segment.startMeters}-${segment.endMeters}`,
        coordinates: sliced,
        strokeColor: getWindColor(segment.level, semanticColors),
        strokeWidth: 6,
      },
    ]
  })
}

const buildRainOverlayPolylines = (
  legCoords: Array<MapLatLng>,
  rainOverlay: RainOverlayByLeg,
  semanticColors: ExtendedTheme['semantic']
): Array<BuiltPolyline> => {
  const distances = computeCumulativeDistances(legCoords)

  return rainOverlay.segments.flatMap((segment: RainOverlaySegment) => {
    const sliced = slicePolylineByMeters(legCoords, distances, segment.startMeters, segment.endMeters)
    if (sliced.length < 2) return []

    return [
      {
        id: `rain-${rainOverlay.legIndex}-${segment.startMeters}-${segment.endMeters}`,
        coordinates: sliced,
        strokeColor: getRainColor(segment.level, semanticColors),
        strokeWidth: 6,
      },
    ]
  })
}

export const buildRoutePolylines = ({
  route,
  variant = 'selected',
  showLegs = true,
  showWindOverlay = true,
  showRainOverlay = true,
  semantic,
}: RoutePolylineInput & { semantic: ExtendedTheme['semantic'] }): Array<BuiltPolyline> => {
  const overviewCoords = decodePolylineGeometry(route.overviewGeometry)
  const legCoords = route.legs.map((leg) => decodeLeg(leg))

  const overviewColor =
    variant === 'selected' ? semantic.color.routeSelected.default : semantic.color.routeAlternate.default
  const legColor = variant === 'selected' ? semantic.color.routeAlternate.default : semantic.color.onSurface.muted

  const polylines: Array<BuiltPolyline> = []

  if (overviewCoords.length > 1) {
    polylines.push({
      id: 'overview',
      coordinates: overviewCoords,
      strokeColor: overviewColor,
      strokeWidth: 6,
    })
  }

  if (showLegs) {
    legCoords.forEach((coords, index) => {
      if (coords.length < 2) return
      polylines.push({
        id: `leg-${index}`,
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
        polylines.push(...buildWindOverlayPolylines(coords, overlay, semantic))
      })
    }
  }

  if (showRainOverlay) {
    const rain = route.overlays?.rain
    if (rain) {
      rain.byLeg.forEach((overlay) => {
        const coords = legCoords[overlay.legIndex]
        if (!coords || coords.length < 2) return
        polylines.push(...buildRainOverlayPolylines(coords, overlay, semantic))
      })
    }
  }

  return polylines
}
