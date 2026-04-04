import { useRouter, useSegments } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { ScrollView, StyleSheet, View } from 'react-native'
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
import { ChatInput, RouteAttachmentCard } from '../../../components/chat'
import { useCurrentLocation } from '../../../hooks/use-current-location'
import { usePlanInit, usePlanRide } from '../../../hooks/use-plan-ride'
import { useSemanticTheme } from '../../../hooks/use-semantic-theme'
import { useRideFlow } from '../../../hooks/use-ride-flow'
import { useChatPlanning } from '../../../hooks/use-chat-planning'
import { useChatSession } from '../../../hooks/use-chat-session'
import { useRouteComparison } from '../../../hooks/use-route-comparison'
import type { PlanInput, RouteStop } from '../../../types/routes'

type CameraState = {
  center?: { latitude: number; longitude: number }
  zoom?: number
}

// Suggestion chips for idle state
const IDLE_SUGGESTIONS = [
  'Plan a scenic ride',
  'Ride to the coast',
  'Find coffee nearby',
  'Avoid highways',
]

const HomeMapScreen = () => {
  const router = useRouter()
  const segments = useSegments()
  const mapRef = useRef<MapViewHandle | null>(null)
  const { semantic } = useSemanticTheme()
  const insets = useSafeAreaInsets()
  const { data: planInit } = usePlanInit()
  const {
    planRide,
    isRunning: isManualPlanning,
    error: planningError,
    resetError,
    cancelPlanning,
  } = usePlanRide()
  const [sheetVisible, setSheetVisible] = useState(false)
  const [errorSheetVisible, setErrorSheetVisible] = useState(false)
  const [searchStop, setSearchStop] = useState<RouteStop | null>(null)
  const [controlsHeight, setControlsHeight] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  // Chat infrastructure
  const { state: flowState, dispatch: flowDispatch } = useRideFlow()
  const { sendPlanningMessage, cancel: cancelChatPlanning, isPlanning: isChatPlanning } = useChatPlanning(flowDispatch)
  const { messages } = useChatSession(flowState.sessionId, flowState)
  const { polylines, selectRoute } = useRouteComparison(flowState, flowDispatch)
  const createSession = useMutation(api.db.planningSessions.createSession)

  const handleNewSession = async () => {
    await createSession({ firstMessage: '' })
    flowDispatch({ type: 'NEW_SESSION' })
  }

  // Manual mode state (legacy - for PlanRideSheet)
  const [startStop, setStartStop] = useState<RouteStop | null>(null)
  const [endStop, setEndStop] = useState<RouteStop | null>(null)
  const [selectedRouteOptionId, setSelectedRouteOptionId] = useState<string | null>(null)
  const [manualRouteOptions, setManualRouteOptions] = useState<any>(null)
  const [camera, setCamera] = useState<CameraState>({})

  const { location: currentLocation } = useCurrentLocation()

  // Default start stop to current location
  useEffect(() => {
    if (currentLocation && !startStop) {
      setStartStop(currentLocation)
    }
  }, [currentLocation, startStop])

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
    const hasRouteResults = flowState.phase === 'ROUTE_RESULTS' || flowState.phase === 'ROUTE_DETAILS'
    if (hasRouteResults && activeOverlay === '') {
      setActiveOverlay('wind')
    }
    // Reset overlay when planning starts over
    if (flowState.phase === 'IDLE' || flowState.phase === 'PLANNING') {
      setActiveOverlay('')
    }
  }, [flowState.phase, activeOverlay])

  // Get selected option from flow state
  const selectedOption = useMemo(() => {
    if (flowState.phase === 'ROUTE_RESULTS' || flowState.phase === 'ROUTE_DETAILS') {
      if (!flowState.routeOptions?.options?.length) return null
      const explicit = flowState.routeOptions.options.find(
        (opt) => opt.routeOptionId === flowState.selectedRouteId
      )
      return explicit ?? flowState.routeOptions.options[0]
    }
    // Fallback to manual mode
    if (!manualRouteOptions?.options?.length) return null
    return manualRouteOptions.options.find(
      (opt: any) => opt.routeOptionId === selectedRouteOptionId
    ) ?? manualRouteOptions.options[0]
  }, [flowState, manualRouteOptions, selectedRouteOptionId])

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

  // Build polylines for map rendering
  const routePolylines = useMemo(() => {
    // If using chat flow, use polylines from useRouteComparison
    if (flowState.phase === 'ROUTE_RESULTS' || flowState.phase === 'ROUTE_DETAILS') {
      // Flatten the nested polylines array
      return polylines.flatMap(routePolyline => routePolyline.polylines)
    }

    // Fallback to manual mode
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
      semantic,
    })
  }, [selectedOption, semantic, flowState.phase, polylines])

  const markers = useMemo(() => {
    const items: Array<any> = []
    if (startStop) {
      items.push({
        id: 'start',
        title: startStop.label ?? 'Start',
        coordinates: { latitude: startStop.lat, longitude: startStop.lng },
      })
    }
    if (endStop) {
      items.push({
        id: 'end',
        title: endStop.label ?? 'End',
        coordinates: { latitude: endStop.lat, longitude: endStop.lng },
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
  }, [startStop, endStop, searchStop])

  const handleMapClick = useCallback(
    (event: { coordinates?: { latitude: number; longitude: number } }) => {
      const coords = event.coordinates
      if (!coords?.latitude || !coords?.longitude) return
      const nextStop: RouteStop = {
        lat: coords.latitude,
        lng: coords.longitude,
        label: startStop ? 'End' : 'Start',
      }

      if (!startStop) {
        setStartStop(nextStop)
        return
      }

      if (!endStop) {
        setEndStop(nextStop)
        return
      }

      // Restart selection after two points are set
      setStartStop(nextStop)
      setEndStop(null)
      setManualRouteOptions(null)
      setSelectedRouteOptionId(null)
    },
    [startStop, endStop]
  )

  const handlePlanRide = useCallback(async () => {
    if (!startStop || !endStop) return
    resetError()
    setErrorSheetVisible(false)
    setSheetVisible(false)

    const input: PlanInput = {
      start: startStop,
      end: endStop,
      departureTime: Date.now(),
      preferences: {
        scenicBias,
        avoidHighways,
        avoidTolls,
      },
    }

    const result = await planRide(input)
    if (!result) {
      setErrorSheetVisible(true)
      return
    }

    setManualRouteOptions(result)
    setSelectedRouteOptionId(result.options[0]?.routeOptionId ?? null)

    const bounds = result.options[0]?.map.bounds
    if (bounds) {
      const center = {
        latitude: (bounds.north + bounds.south) / 2,
        longitude: (bounds.east + bounds.west) / 2,
      }
      mapRef.current?.setCameraPosition({
        coordinates: center,
        zoom: (camera.zoom ?? 10) + 0.5,
        duration: 500,
      })
      setCamera({ center })
    }
  }, [
    startStop,
    endStop,
    scenicBias,
    avoidHighways,
    avoidTolls,
    planRide,
    resetError,
    camera.zoom,
  ])

  const handleCameraMove = useCallback(
    (event: { coordinates: { latitude: number; longitude: number }; zoom: number }) => {
      if (!event.coordinates?.latitude || !event.coordinates?.longitude) return
      setCamera({
        center: { latitude: event.coordinates.latitude, longitude: event.coordinates.longitude },
        zoom: event.zoom,
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
    setStartStop(null)
    setEndStop(null)
    setManualRouteOptions(null)
    setSelectedRouteOptionId(null)
    setSearchStop(null)
    flowDispatch({ type: 'NEW_SESSION' })
  }

  const handleTryAgain = () => {
    setErrorSheetVisible(false)
    resetError()
    // Optionally retry the last planning attempt
    if (startStop && endStop) {
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
          polylines={routePolylines}
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
            styles.controls,
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

        {/* Route attachment cards when showing results */}
        {(flowState.phase === 'ROUTE_RESULTS' || flowState.phase === 'ROUTE_DETAILS') &&
          flowState.routeOptions?.options && (
            <View
              pointerEvents="box-none"
              style={[
                styles.routeCards,
                {
                  paddingBottom: insets.bottom + semantic.space.xl + 80, // Space for chat input
                  paddingHorizontal: semantic.space.md,
                },
              ]}
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: semantic.space.sm }}
              >
                {flowState.routeOptions.options.map((option) => (
                  <RouteAttachmentCard
                    key={option.routeOptionId}
                    route={option}
                    isSelected={option.routeOptionId === flowState.selectedRouteId}
                    onSelect={selectRoute}
                    testID={`route-card-${option.routeOptionId}`}
                  />
                ))}
              </ScrollView>
            </View>
          )}

        {/* Chat input - always visible at bottom */}
        <ChatInput
          onSend={sendPlanningMessage}
          onCancel={cancelChatPlanning}
          state={flowState}
          suggestions={IDLE_SUGGESTIONS}
          testID="chat-input"
          onNewSession={handleNewSession}
        />

        <PlanRideSheet
          isVisible={sheetVisible}
          onClose={() => setSheetVisible(false)}
          startStop={startStop}
          endStop={endStop}
          onSetStartStop={setStartStop}
          onSetEndStop={setEndStop}
          scenicBias={scenicBias}
          onSetScenicBias={setScenicBias}
          avoidHighways={avoidHighways}
          onToggleAvoidHighways={() => setAvoidHighways((prev) => !prev)}
          avoidTolls={avoidTolls}
          onToggleAvoidTolls={() => setAvoidTolls((prev) => !prev)}
          departureTime={departureTime}
          onSetDepartureTime={setDepartureTime}
          isPlanning={isManualPlanning}
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

        <RoutePlannerLoading isVisible={isManualPlanning} onCancel={cancelPlanning} />
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
  controls: {
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
  routeCards: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 15,
    alignItems: 'center',
  },
})
