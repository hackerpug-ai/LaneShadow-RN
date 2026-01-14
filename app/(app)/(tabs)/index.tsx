import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Icon, Text } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MapControls } from '../../../components/map/map-controls'
import type { MapViewHandle } from '../../../components/map/map-view'
import { MapViewWrapper } from '../../../components/map/map-view'
import { buildRoutePolylines } from '../../../components/map/route-polyline'
import { WhereToBar } from '../../../components/map/where-to-bar'
import { BottomSheetWrapper } from '../../../components/sheets/bottom-sheet-wrapper'
import { Button } from '../../../components/ui/button'
import { usePlanInit, usePlanRide } from '../../../hooks/use-plan-ride'
import { useSemanticTheme } from '../../../hooks/use-semantic-theme'
import type { PlanInput, PlannedRouteOptionsView, RouteStop } from '../../../types/routes'

type PlanningStatus = 'idle' | 'planning' | 'results' | 'error'

type CameraState = {
  center?: { latitude: number; longitude: number }
  zoom?: number
}

type PlanningState = {
  planningStatus: PlanningStatus
  startStop: RouteStop | null
  endStop: RouteStop | null
  routeOptions: PlannedRouteOptionsView | null
  selectedRouteOptionId: string | null
  camera: CameraState
}

type Action =
  | { type: 'setStart'; payload: RouteStop | null }
  | { type: 'setEnd'; payload: RouteStop | null }
  | { type: 'setStatus'; payload: PlanningStatus }
  | { type: 'setRouteOptions'; payload: PlannedRouteOptionsView | null }
  | { type: 'setSelectedOption'; payload: string | null }
  | { type: 'setCamera'; payload: CameraState }
  | { type: 'resetSelections' }

const planningReducer = (state: PlanningState, action: Action): PlanningState => {
  switch (action.type) {
    case 'setStart':
      return { ...state, startStop: action.payload }
    case 'setEnd':
      return { ...state, endStop: action.payload }
    case 'setStatus':
      return { ...state, planningStatus: action.payload }
    case 'setRouteOptions':
      return { ...state, routeOptions: action.payload }
    case 'setSelectedOption':
      return { ...state, selectedRouteOptionId: action.payload }
    case 'setCamera':
      return { ...state, camera: { ...state.camera, ...action.payload } }
    case 'resetSelections':
      return {
        ...state,
        startStop: null,
        endStop: null,
        routeOptions: null,
        selectedRouteOptionId: null,
        planningStatus: 'idle',
      }
    default:
      return state
  }
}

const initialState: PlanningState = {
  planningStatus: 'idle',
  startStop: null,
  endStop: null,
  routeOptions: null,
  selectedRouteOptionId: null,
  camera: {},
}

const HomeMapScreen = () => {
  const mapRef = useRef<MapViewHandle | null>(null)
  const { semantic } = useSemanticTheme()
  const insets = useSafeAreaInsets()
  const { data: planInit } = usePlanInit()
  const { planRide, isRunning: isPlanning, error: planningError, resetError } = usePlanRide()
  const [sheetVisible, setSheetVisible] = useState(false)
  const [searchStop, setSearchStop] = useState<RouteStop | null>(null)

  const [state, dispatch] = useReducer(planningReducer, initialState)

  const [scenicBias, setScenicBias] = useState<'default' | 'high'>('default')
  const [avoidHighways, setAvoidHighways] = useState(false)
  const [avoidTolls, setAvoidTolls] = useState(false)

  useEffect(() => {
    if (planInit?.defaults?.preferences) {
      setScenicBias(planInit.defaults.preferences.scenicBias)
      setAvoidHighways(planInit.defaults.preferences.avoidHighways ?? false)
      setAvoidTolls(planInit.defaults.preferences.avoidTolls ?? false)
    }
  }, [planInit])

  const selectedOption = useMemo(() => {
    if (!state.routeOptions?.options?.length) return null
    const explicit = state.routeOptions.options.find(
      (opt) => opt.routeOptionId === state.selectedRouteOptionId
    )
    return explicit ?? state.routeOptions.options[0]
  }, [state.routeOptions, state.selectedRouteOptionId])

  const polylines = useMemo(() => {
    if (!selectedOption) return []
    return buildRoutePolylines({
      route: {
        overviewGeometry: selectedOption.map.overviewGeometry,
        legs: selectedOption.map.legs,
        overlays: (selectedOption.map as any)?.overlays,
      },
      variant: 'selected',
      showLegs: true,
      showWindOverlay: true,
      semantic: semantic,
    })
  }, [selectedOption, semantic])

  const markers = useMemo(() => {
    const items: Array<any> = []
    if (state.startStop) {
      items.push({
        id: 'start',
        title: state.startStop.label ?? 'Start',
        coordinates: { latitude: state.startStop.lat, longitude: state.startStop.lng },
      })
    }
    if (state.endStop) {
      items.push({
        id: 'end',
        title: state.endStop.label ?? 'End',
        coordinates: { latitude: state.endStop.lat, longitude: state.endStop.lng },
      })
    }
    if (searchStop) {
      items.push({
        id: 'search',
        title: searchStop.label ?? 'Search',
        coordinates: { latitude: searchStop.lat, longitude: searchStop.lng },
      })
    }
    return items
  }, [state.startStop, state.endStop, searchStop])

  const handleMapClick = useCallback(
    (event: { coordinates?: { latitude: number; longitude: number } }) => {
      const coords = event.coordinates
      if (!coords?.latitude || !coords?.longitude) return
      const nextStop: RouteStop = {
        lat: coords.latitude,
        lng: coords.longitude,
        label: state.startStop ? 'End' : 'Start',
      }

      if (!state.startStop) {
        dispatch({ type: 'setStart', payload: nextStop })
        dispatch({ type: 'setStatus', payload: 'idle' })
        return
      }

      if (!state.endStop) {
        dispatch({ type: 'setEnd', payload: nextStop })
        dispatch({ type: 'setStatus', payload: 'idle' })
        return
      }

      // Restart selection after two points are set
      dispatch({ type: 'resetSelections' })
      dispatch({ type: 'setStart', payload: nextStop })
    },
    [state.startStop, state.endStop]
  )

  const handlePlanRide = useCallback(async () => {
    if (!state.startStop || !state.endStop) return
    resetError()
    dispatch({ type: 'setStatus', payload: 'planning' })

    const input: PlanInput = {
      start: state.startStop,
      end: state.endStop,
      departureTime: Date.now(),
      preferences: {
        scenicBias,
        avoidHighways,
        avoidTolls,
      },
    }

    const result = await planRide(input)
    if (!result) {
      dispatch({ type: 'setStatus', payload: 'error' })
      return
    }

    dispatch({ type: 'setRouteOptions', payload: result })
    dispatch({ type: 'setSelectedOption', payload: result.options[0]?.routeOptionId ?? null })
    dispatch({ type: 'setStatus', payload: 'results' })
    setSheetVisible(false)

    const bounds = result.options[0]?.map.bounds
    if (bounds) {
      const center = {
        latitude: (bounds.north + bounds.south) / 2,
        longitude: (bounds.east + bounds.west) / 2,
      }
      mapRef.current?.setCameraPosition({
        coordinates: center,
        zoom: (state.camera.zoom ?? 10) + 0.5,
        duration: 500,
      })
      dispatch({ type: 'setCamera', payload: { center } })
    }
  }, [
    state.startStop,
    state.endStop,
    scenicBias,
    avoidHighways,
    avoidTolls,
    planRide,
    resetError,
    state.camera.zoom,
  ])

  const handleCameraMove = useCallback(
    (event: { coordinates: { latitude: number; longitude: number }; zoom: number }) => {
      if (!event.coordinates?.latitude || !event.coordinates?.longitude) return
      dispatch({
        type: 'setCamera',
        payload: {
          center: { latitude: event.coordinates.latitude, longitude: event.coordinates.longitude },
          zoom: event.zoom,
        },
      })
    },
    []
  )

  const zoom = (delta: number) => {
    mapRef.current?.zoomBy(delta)
  }

  const recenter = () => {
    mapRef.current?.recenterToUser()
  }

  const clearAll = () => {
    dispatch({ type: 'resetSelections' })
    setSearchStop(null)
  }

  return (
    <View style={styles.container}>
      <MapViewWrapper
        ref={mapRef}
        polylines={polylines}
        markers={markers}
        onMapClick={handleMapClick}
        onCameraMove={handleCameraMove}
      />

      <MapControls
        onZoomIn={() => zoom(1)}
        onZoomOut={() => zoom(-1)}
        onRecenter={recenter}
        onClear={clearAll}
      />

      <View
        pointerEvents="box-none"
        style={[
          styles.bottomOverlay,
          {
            paddingBottom: insets.bottom + semantic.space.lg,
            paddingHorizontal: semantic.space.lg,
            gap: semantic.space.sm,
          },
        ]}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <WhereToBar
            onPlaceSelected={(place) => {
              setSearchStop(place)
              mapRef.current?.setCameraPosition({
                coordinates: { latitude: place.lat, longitude: place.lng },
                zoom: (state.camera.zoom ?? 12) + 0.5,
                duration: 500,
              })
            }}
            onClear={() => {
              setSearchStop(null)
            }}
          />
        </View>

        <Button
          icon={<Icon source="map-plus" size={30} />}
          size="icon"
          variant="default"
          textStyle={{ color: semantic.color.onSurface.default }}
          onPress={() => setSheetVisible(true)}
          accessibilityLabel="Plan ride"
          testID="plan-ride-button"
        ></Button>
      </View>

      <BottomSheetWrapper
        isVisible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        preset="half"
      >
        <View
          style={{
            gap: semantic.space.sm,
          }}
        >
          <Text variant="titleMedium" style={{ color: semantic.color.onSurface.default }}>
            Plan Ride
          </Text>

          <Text variant="bodyMedium" style={{ color: semantic.color.onSurface.default }}>
            Start:{' '}
            {state.startStop
              ? `${state.startStop.lat.toFixed(4)}, ${state.startStop.lng.toFixed(4)}`
              : 'Tap map'}
          </Text>
          <Text variant="bodyMedium" style={{ color: semantic.color.onSurface.default }}>
            End:{' '}
            {state.endStop
              ? `${state.endStop.lat.toFixed(4)}, ${state.endStop.lng.toFixed(4)}`
              : 'Tap map'}
          </Text>

          <View
            style={{
              flexDirection: 'row',
              gap: semantic.space.sm,
            }}
          >
            <Button
              size="sm"
              variant={scenicBias === 'default' ? 'secondary' : 'outline'}
              onPress={() => setScenicBias('default')}
              testID="pref-scenic-default"
            >
              Scenic: default
            </Button>
            <Button
              size="sm"
              variant={scenicBias === 'high' ? 'secondary' : 'outline'}
              onPress={() => setScenicBias('high')}
              testID="pref-scenic-high"
            >
              Scenic: high
            </Button>
          </View>

          <View
            style={{
              flexDirection: 'row',
              gap: semantic.space.sm,
            }}
          >
            <Button
              size="sm"
              variant={avoidHighways ? 'secondary' : 'outline'}
              onPress={() => setAvoidHighways((prev) => !prev)}
              testID="pref-avoid-highways"
            >
              Avoid highways
            </Button>
            <Button
              size="sm"
              variant={avoidTolls ? 'secondary' : 'outline'}
              onPress={() => setAvoidTolls((prev) => !prev)}
              testID="pref-avoid-tolls"
            >
              Avoid tolls
            </Button>
          </View>

          {planningError ? (
            <Text variant="bodyMedium" style={{ color: semantic.color.danger.default }}>
              {planningError}
            </Text>
          ) : null}

          <Button
            variant="default"
            disabled={!state.startStop || !state.endStop || isPlanning}
            onPress={handlePlanRide}
            testID="plan-ride-submit"
          >
            {isPlanning ? 'Planning...' : 'Plan ride'}
          </Button>

          <Button variant="outline" onPress={clearAll} testID="plan-ride-clear">
            Clear selection
          </Button>
        </View>
      </BottomSheetWrapper>
    </View>
  )
}

export default HomeMapScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bottomOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'flex-end',
    zIndex: 20,
    flex: 1,
    minWidth: 0,
    maxWidth: 780,
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'nowrap',
    flexBasis: 'auto',
  },

  plannerButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
