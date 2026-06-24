/**
 * useRouteComparison - Manages route polyline rendering and selection
 *
 * Provides polylines for rendering on the map and handles route selection.
 * Supports multi-route display with visual distinction (selected vs unselected).
 *
 * This hook bridges the route planning state with map rendering.
 */

import { useCallback, useMemo } from 'react'
import { buildRoutePolylines } from '../components/map/route-polyline'
import type { RideFlowState } from './use-ride-flow'
import { useSemanticTheme } from './use-semantic-theme'

/**
 * Route polyline data for map rendering
 */
export type RoutePolyline = {
  id: string
  routeOptionId: string
  isSelected: boolean
  polylines: ReturnType<typeof buildRoutePolylines>
}

/**
 * Hook return value
 */
type UseRouteComparisonReturn = {
  polylines: RoutePolyline[]
  selectedRouteId: string | null
  selectRoute: (routeId: string) => void
  clearSelection: () => void
}

/**
 * Main hook - returns polylines for map rendering
 *
 * Usage:
 * ```tsx
 * const { state, dispatch } = useRideFlow()
 * const { polylines, selectRoute } = useRouteComparison(state, dispatch)
 *
 * <MapView>
 *   {polylines.map(route => (
 *     route.polylines.map(polyline => (
 *       <Polyline key={polyline.id} coordinates={polyline.coordinates} />
 *     ))
 *   ))}
 * </MapView>
 * ```
 */
export const useRouteComparison = (
  state: RideFlowState,
  dispatch: (action: any) => void,
): UseRouteComparisonReturn => {
  const { semantic } = useSemanticTheme()

  // Extract route options from state
  const routeOptions = useMemo(() => {
    if (state.phase === 'ROUTE_RESULTS' || state.phase === 'ROUTE_DETAILS') {
      return state.routeOptions
    }
    if (state.phase === 'PLANNING' && state.routeOptions) {
      return state.routeOptions
    }
    return null
  }, [state])

  // Get selected route ID
  const selectedRouteId = useMemo(() => {
    if (state.phase === 'ROUTE_DETAILS') {
      return state.selectedRouteId
    }
    if (state.phase === 'ROUTE_RESULTS') {
      return state.selectedRouteId
    }
    if (state.phase === 'PLANNING') {
      return state.selectedRouteId ?? null
    }
    return null
  }, [state])

  // Build polylines for the SELECTED route only (RUX-002)
  const polylines = useMemo((): RoutePolyline[] => {
    if (!routeOptions?.options?.length || !selectedRouteId) {
      return []
    }

    // Find the selected route option
    const selectedOption = routeOptions.options.find(
      (option) => option.routeOptionId === selectedRouteId,
    )

    // If selected route not found, return empty (no mismatch polylines)
    if (!selectedOption) {
      return []
    }

    // Build polylines for the SELECTED route only (RUX-002)
    const routePolylines = buildRoutePolylines({
      route: {
        overviewGeometry: selectedOption.map.overviewGeometry,
        overviewSegments: (selectedOption.map as any)?.overviewSegments,
        legs: selectedOption.map.legs,
        overlays: (selectedOption.map as any)?.overlays,
      },
      routeId: selectedOption.routeOptionId,
      variant: 'selected',
      showLegs: true,
      showWindOverlay: true,
      semantic,
    })

    return [
      {
        id: `route-${selectedOption.routeOptionId}`,
        routeOptionId: selectedOption.routeOptionId,
        isSelected: true,
        polylines: routePolylines,
      },
    ]
  }, [routeOptions, selectedRouteId, semantic])

  // Select a route
  const selectRoute = useCallback(
    (routeId: string) => {
      dispatch({
        type: 'SELECT_ROUTE',
        routeId,
      })
    },
    [dispatch],
  )

  // Clear selection
  const clearSelection = useCallback(() => {
    // No explicit clear action in state machine
    // This would need to be added or handled via NEW_SESSION
    dispatch({
      type: 'NEW_SESSION',
    })
  }, [dispatch])

  return {
    polylines,
    selectedRouteId,
    selectRoute,
    clearSelection,
  }
}
