import { AppleMaps, GoogleMaps } from 'expo-maps'
import { Fragment, useMemo } from 'react'
import { Platform } from 'react-native'
import type { ComponentType } from 'react'
import type {
  PolylineGeometry,
  RouteLeg,
  RouteOverlays,
  WindOverlayByLeg,
  WindOverlaySegment,
} from '../../models/saved-routes'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import {
  computeCumulativeDistances,
  decodePolylineGeometry,
  slicePolylineByMeters,
  type MapLatLng,
} from '../../lib/polyline'

type RoutePolylineProps = {
  route: {
    overviewGeometry: PolylineGeometry
    legs: Array<RouteLeg>
    overlays?: RouteOverlays
  }
  variant?: 'selected' | 'alternate'
  showLegs?: boolean
  showWindOverlay?: boolean
}

const getWindColor = (level: string, semantic: ReturnType<typeof useSemanticTheme>['semantic']): string => {
  switch (level) {
    case 'low':
      return semantic.color.success.default
    case 'moderate':
      return semantic.color.warning.default
    case 'high':
      return semantic.color.danger.default
    default:
      return semantic.color.info.default
  }
}

const decodeLeg = (leg: RouteLeg): Array<MapLatLng> => decodePolylineGeometry(leg.geometry)

const buildLegOverlayPolylines = (
  leg: RouteLeg,
  legCoords: Array<MapLatLng>,
  windOverlay: WindOverlayByLeg,
  semanticColors: ReturnType<typeof useSemanticTheme>['semantic'],
  PolylineComponent: ComponentType<any>
) => {
  const distances = computeCumulativeDistances(legCoords)

  return windOverlay.segments.flatMap((segment: WindOverlaySegment, index: number) => {
    const sliced = slicePolylineByMeters(legCoords, distances, segment.startMeters, segment.endMeters)
    if (sliced.length < 2) return []

    return [
      <PolylineComponent
        key={`wind-${windOverlay.legIndex}-${index}`}
        coordinates={sliced}
        strokeColor={getWindColor(segment.level, semanticColors)}
        strokeWidth={6}
        zIndex={3}
      />,
    ]
  })
}

export const RoutePolyline = ({
  route,
  variant = 'selected',
  showLegs = true,
  showWindOverlay = true,
}: RoutePolylineProps) => {
  const { semantic } = useSemanticTheme()
  const PolylineComponent: ComponentType<any> =
    (Platform.OS === 'ios' ? (AppleMaps as any)?.Polyline : (GoogleMaps as any)?.Polyline) ||
    (() => null)

  const overviewCoords = useMemo(() => decodePolylineGeometry(route.overviewGeometry), [route.overviewGeometry])
  const legCoords = useMemo(() => route.legs.map((leg) => decodeLeg(leg)), [route.legs])

  const overviewColor =
    variant === 'selected' ? semantic.color.routeSelected.default : semantic.color.routeAlternate.default
  const legColor =
    variant === 'selected' ? semantic.color.routeAlternate.default : semantic.color.onSurface.muted

  const windPolylines = useMemo(() => {
    if (!showWindOverlay) return []
    const wind = route.overlays?.wind
    if (!wind) return []

    return wind.byLeg.flatMap((overlay) => {
      const leg = route.legs.find((l) => l.legIndex === overlay.legIndex)
      const coords = legCoords[overlay.legIndex]
      if (!leg || !coords) return []
      return buildLegOverlayPolylines(leg, coords, overlay, semantic, PolylineComponent)
    })
  }, [PolylineComponent, legCoords, route.legs, route.overlays?.wind, semantic, showWindOverlay])

  return (
    <Fragment>
      {overviewCoords.length > 1 && (
        <PolylineComponent
          coordinates={overviewCoords}
          strokeColor={overviewColor}
          strokeWidth={6}
          zIndex={1}
        />
      )}

      {showLegs &&
        legCoords.map((coords, index) => {
          if (coords.length < 2) return null
          return (
            <PolylineComponent
              key={`leg-${index}`}
              coordinates={coords}
              strokeColor={legColor}
              strokeWidth={4}
              zIndex={2}
            />
          )
        })}

      {windPolylines}
    </Fragment>
  )
}
