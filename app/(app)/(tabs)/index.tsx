import { useRouter, useSegments } from 'expo-router'
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MenuLayout } from '../../../components/layouts/menu-layout'
import { MapControls } from '../../../components/map/map-controls'
import { MapHeaderOverlay } from '../../../components/map/map-header-overlay'
import type { MapViewHandle } from '../../../components/map/map-view'
import { MapViewWrapper } from '../../../components/map/map-view'
import { OverlayToggle } from '../../../components/map/overlay-toggle'
import type { OverlayType } from '../../../components/map/overlay-toggle'
import { buildRoutePolylines } from '../../../components/map/route-polyline'
import { PlanRideSheet } from '../../../components/sheets/plan-ride-sheet'
import { PlanningErrorSheet } from '../../../components/sheets/planning-error-sheet'
import { RoutePlannerLoading } from '../../../components/sheets/planning-loading'
import { FloatingSearchInput } from '../../../components/ui/floating-search-input'
import { useCurrentLocation } from '../../../hooks/use-current-location'
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
  const router = useRouter()
  const segments = useSegments()
  const mapRef = useRef<MapViewHandle | null>(null)
  const { semantic } = useSemanticTheme()
  const insets = useSafeAreaInsets()
  const { data: planInit } = usePlanInit()
  const {
    planRide,
    isRunning: isPlanning,
    error: planningError,
    resetError,
    cancelPlanning,
  } = usePlanRide()
  const [sheetVisible, setSheetVisible] = useState(false)
  const [errorSheetVisible, setErrorSheetVisible] = useState(false)
  const [searchStop, setSearchStop] = useState<RouteStop | null>(null)
  const [controlsHeight, setControlsHeight] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [state, dispatch] = useReducer(planningReducer, initialState)
  const { location: currentLocation } = useCurrentLocation()

  // Default start stop to current location
  useEffect(() => {
    if (currentLocation && !state.startStop) {
      dispatch({ type: 'setStart', payload: currentLocation })
    }
  }, [currentLocation, state.startStop])

  const [scenicBias, setScenicBias] = useState<'default' | 'high'>('default')
  const [avoidHighways, setAvoidHighways] = useState(false)
  const [avoidTolls, setAvoidTolls] = useState(false)
  const [departureTime, setDepartureTime] = useState(new Date())

  // Overlay state - defaults to wind when route is first selected, persists locally
  const [activeOverlay, setActiveOverlay] = useState<OverlayType | ''>('')

  useEffect(() => {
    if (planInit?.defaults?.preferences) {
      setScenicBias(planInit.defaults.preferences.scenicBias)
      setAvoidHighways(planInit.defaults.preferences.avoidHighways ?? false)
      setAvoidTolls(planInit.defaults.preferences.avoidTolls ?? false)
    }
  }, [planInit])

  // Default to wind overlay when route is first selected (AC from spec)
  useEffect(() => {
    if (state.planningStatus === 'results' && activeOverlay === '') {
      setActiveOverlay('wind')
    }
    // Reset overlay when planning starts over
    if (state.planningStatus === 'idle' || state.planningStatus === 'planning') {
      setActiveOverlay('')
    }
  }, [state.planningStatus, activeOverlay])

  const selectedOption = useMemo(() => {
    if (!state.routeOptions?.options?.length) return null
    const explicit = state.routeOptions.options.find(
      (opt) => opt.routeOptionId === state.selectedRouteOptionId
    )
    return explicit ?? state.routeOptions.options[0]
  }, [state.routeOptions, state.selectedRouteOptionId])

  // Determine overlay availability based on selected route option
  const overlayAvailability = useMemo(() => {
    return {
      // Wind data is always available (part of base route planning)
      wind: true,
      // Rain and temperature availability depends on conditionsStatus
      rain: selectedOption?.overlaysPreview?.conditionsStatus === 'ok',
      temperature: selectedOption?.overlaysPreview?.conditionsStatus === 'ok',
    }
  }, [selectedOption])

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
    setErrorSheetVisible(false)
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
      setErrorSheetVisible(true)
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

  const handleTryAgain = () => {
    setErrorSheetVisible(false)
    resetError()
    // Optionally retry the last planning attempt
    if (state.startStop && state.endStop) {
      handlePlanRide()
    }
  }

  const handleBack = () => {
    setErrorSheetVisible(false)
    resetError()
    setSheetVisible(true) // Reopen planning sheet
  }

  const handleCloseError = () => {
    setErrorSheetVisible(false)
    resetError()
  }

  return (
    <MenuLayout testID="home-menu-layout" menuOpen={menuOpen} onMenuOpenChange={setMenuOpen}>
      <View style={styles.container}>
        <MapViewWrapper
          ref={mapRef}
          polylines={polylines}
          markers={markers}
          onMapClick={handleMapClick}
          onCameraMove={handleCameraMove}
        />

        <View pointerEvents="box-none" style={[styles.headerOverlay, {}]}>
          <MapHeaderOverlay
            title="Lane Shadow"
            leftAction={{
              icon: 'menu',
              onPress: () => setMenuOpen(true),
              testID: 'map-header-left-button',
            }}
            rightAction={{
              icon: 'cog',
              onPress: () => router.push('/(app)/(tabs)/settings'),
              testID: 'map-header-right-button',
            }}
            testID="map-header-overlay"
          />

          {/* Overlay toggle - only shown when a route is selected (AC4) */}
          {selectedOption && (
            <View
              style={[
                styles.overlayToggle,
                {
                  top: insets.top + semantic.space['2xl'],
                  right: semantic.space.lg,
                },
              ]}
            >
              <OverlayToggle
                value={activeOverlay}
                onValueChange={setActiveOverlay}
                availability={overlayAvailability}
                testID="overlay-toggle"
              />
            </View>
          )}
        </View>

        <View
          onLayout={(e) => setControlsHeight(e.nativeEvent.layout.height)}
          style={[
            styles.constrols,
            {
              right: semantic.space.sm,
              transform: [{ translateY: -controlsHeight / 2 }],
            },
          ]}
        >
          <MapControls
            onZoomIn={() => zoom(1)}
            onZoomOut={() => zoom(-1)}
            onRecenter={recenter}
            onClear={clearAll}
          />
        </View>

        <View
          pointerEvents="box-none"
          style={[
            styles.bottomOverlay,
            {
              paddingBottom: insets.bottom + semantic.space.sm,
              paddingHorizontal: semantic.space.sm,
              gap: semantic.space.sm,
            },
          ]}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <FloatingSearchInput
              value={searchStop?.label ?? ''}
              onChangeText={(text) => {
                setSearchStop({ label: text, lat: 0, lng: 0 })
              }}
              placeholder="Where to?"
              onClear={() => setSearchStop(null)}
              onPress={() => {
                setSheetVisible(true)
              }}
              testID="where-to-search"
            />
          </View>
        </View>

        <PlanRideSheet
          isVisible={sheetVisible}
          onClose={() => setSheetVisible(false)}
          startStop={state.startStop}
          endStop={state.endStop}
          onSetStartStop={(stop) => dispatch({ type: 'setStart', payload: stop })}
          onSetEndStop={(stop) => dispatch({ type: 'setEnd', payload: stop })}
          scenicBias={scenicBias}
          onSetScenicBias={setScenicBias}
          avoidHighways={avoidHighways}
          onToggleAvoidHighways={() => setAvoidHighways((prev) => !prev)}
          avoidTolls={avoidTolls}
          onToggleAvoidTolls={() => setAvoidTolls((prev) => !prev)}
          departureTime={departureTime}
          onSetDepartureTime={setDepartureTime}
          isPlanning={isPlanning}
          onPlanRide={handlePlanRide}
          onClearSelection={clearAll}
        />

        <PlanningErrorSheet
          isVisible={errorSheetVisible}
          message={planningError || 'An error occurred while planning your route.'}
          onTryAgain={handleTryAgain}
          onBack={handleBack}
          onClose={handleCloseError}
        />

        <RoutePlannerLoading isVisible={isPlanning} onCancel={cancelPlanning} />
      </View>
    </MenuLayout>
  )
}

export default HomeMapScreen

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flex: 1,
  },
  constrols: {
    position: 'absolute',
    zIndex: 30,
    top: '50%',
    alignItems: 'center',
  },
  headerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 30,
  },
  overlayToggle: {
    position: 'absolute',
    zIndex: 25,
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
