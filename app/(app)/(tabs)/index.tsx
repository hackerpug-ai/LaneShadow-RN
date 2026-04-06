import { useRouter, useSegments, useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { ScrollView, StyleSheet, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MenuLayout } from '../../../components/layouts/menu-layout'
import { MapControls } from '../../../components/map/map-controls'
import { MapPlanningIndicator } from '../../../components/map/map-planning-indicator'
import { MapHeaderOverlay } from '../../../components/map/map-header-overlay'
import { MotorcyclePlusIcon } from '../../../components/ui/motorcycle-plus-icon'
import type { MapViewHandle } from '../../../components/map/map-view'
import { MapViewWrapper } from '../../../components/map/map-view'
import { OverlayToggle } from '../../../components/map/overlay-toggle'
import type { OverlayType } from '../../../components/map/overlay-toggle'
import { buildRoutePolylines } from '../../../components/map/route-polyline'
import { PlanRideSheet } from '../../../components/sheets/plan-ride-sheet'
import { PlanningErrorSheet } from '../../../components/sheets/planning-error-sheet'
import { RoutePlannerLoading } from '../../../components/sheets/planning-loading'
import { ChatInput, RouteAttachmentCard } from '../../../components/chat'
import { ChatTranscript } from '../../../components/ui/chat-transcript'
import type { ChatMessage as TranscriptMessage } from '../../../components/ui/chat-transcript'
import { useCurrentLocation } from '../../../hooks/use-current-location'
import { useToastMessages } from '../../../hooks/use-toast-messages'
import { MapToastStack } from '../../../components/map/map-toast-stack'
import { usePlanInit, usePlanRide } from '../../../hooks/use-plan-ride'
import { useSemanticTheme } from '../../../hooks/use-semantic-theme'
import { useRideFlow } from '../../../hooks/use-ride-flow'
import { useChatPlanning } from '../../../hooks/use-chat-planning'
import { useRouteComparison } from '../../../hooks/use-route-comparison'
import { useActiveSessionRoute } from '../../../hooks/use-active-session-route'
import { useSelectedRoute } from '../../../contexts/selected-route'
import type { PlanInput, RouteStop } from '../../../types/routes'
import { decodePolylineGeometry } from '../../../lib/polyline'

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

const CHAT_TRANSITION_MS = 260

const HomeMapScreen = () => {
  useRouter()
  useSegments()
  const mapRef = useRef<MapViewHandle | null>(null)
  const { semantic } = useSemanticTheme()
  const insets = useSafeAreaInsets()
  const { sessionId: sessionIdParam, chat: chatParam } = useLocalSearchParams<{
    sessionId?: string
    chat?: string
  }>()

  // Visibility model:
  //   - `chatMode`: full transcript visible, map faded out.
  //   - map mode: lightweight toast pills for new agent messages,
  //     managed by useToastMessages hook. Tap any toast → chat mode.
  const [chatMode, setChatMode] = useState(chatParam === '1')
  const [mapPlanningVisible, setMapPlanningVisible] = useState(false)
  const [mapMounted, setMapMounted] = useState(!chatMode)
  const [transcriptMounted, setTranscriptMounted] = useState(chatMode)
  const mapOpacity = useSharedValue(chatMode ? 0 : 1)
  const chatOpacity = useSharedValue(chatMode ? 1 : 0)
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
  const {
    sendPlanningMessage,
    cancel: cancelChatPlanning,
    sessionId: planningSessionId,
  } = useChatPlanning(flowDispatch)
  const { polylines, selectRoute } = useRouteComparison(flowState, flowDispatch)
  const createSession = useMutation(api.db.planningSessions.createSession)
  const { location: currentLocation } = useCurrentLocation()

  // Fetch sessions so we can fall back to the most recent one on app open.
  const sessions = useQuery(api.db.planningSessions.listSessions)

  // Resolve which session drives the chat transcript and map route.
  // Priority: explicit URL param → active planning session → most recent session.
  // Note: we deliberately DO NOT use `flowState.sessionId` — that's a
  // locally-generated string used by the state machine.
  const activeChatSessionId: Id<'planning_sessions'> | null = useMemo(() => {
    if (sessionIdParam) return sessionIdParam as Id<'planning_sessions'>
    if (planningSessionId) return planningSessionId as Id<'planning_sessions'>
    if (sessions && sessions.length > 0) return sessions[0]._id
    return null
  }, [sessionIdParam, planningSessionId, sessions])

  // Agent-produced route from Convex (task #258). Subscribes to the latest
  // routing_card in the current session and exposes the active route option.
  const {
    activeOption: agentActiveOption,
    routePlan: agentRoutePlan,
  } = useActiveSessionRoute(activeChatSessionId ?? undefined)

  // Track the last plan id we animated the camera to, so we only fit once
  // per newly resolved plan (not on every re-render).
  const lastFittedPlanIdRef = useRef<string | null>(null)

  // Hydrate flowState from a restored session on app reload. When the session
  // came from the sessions[0] fallback (not active planning) and has completed
  // routes, transition the flow state to ROUTE_RESULTS so route cards appear.
  const hydratedSessionRef = useRef<string | null>(null)
  useEffect(() => {
    if (
      !planningSessionId &&
      !sessionIdParam &&
      activeChatSessionId &&
      agentRoutePlan?.status === 'completed' &&
      agentRoutePlan?.result &&
      flowState.phase === 'IDLE' &&
      hydratedSessionRef.current !== activeChatSessionId
    ) {
      hydratedSessionRef.current = activeChatSessionId
      flowDispatch({
        type: 'LOAD_SESSION',
        sessionId: activeChatSessionId,
        routeOptions: agentRoutePlan.result,
        selectedRouteId: agentActiveOption?.routeOptionId,
      })
    }
  }, [
    activeChatSessionId,
    agentRoutePlan,
    agentActiveOption,
    flowState.phase,
    planningSessionId,
    sessionIdParam,
    flowDispatch,
  ])

  const rawTranscriptMessages = useQuery(
    api.db.sessionMessages.list,
    activeChatSessionId ? { sessionId: activeChatSessionId } : 'skip'
  )

  // Derive isPlanning from live message statuses: if any assistant row is
  // still running or streaming, the agent is working.
  const isPlanning = useMemo(
    () =>
      rawTranscriptMessages?.some(
        (msg) => msg.status === 'running' || msg.status === 'streaming'
      ) ?? false,
    [rawTranscriptMessages]
  )

  // Dismiss planning indicator when agent finishes (fallback for cancel or no-message scenarios)
  useEffect(() => {
    if (!isPlanning) setMapPlanningVisible(false)
  }, [isPlanning])

  const transcriptMessages: TranscriptMessage[] = useMemo(() => {
    return (
      rawTranscriptMessages
        ?.filter(
          (msg) =>
            msg.kind !== 'agent_turn' &&
            msg.kind !== 'tool_result_hidden' &&
            !(
              msg.role === 'system' &&
              (msg.kind === 'text' || !msg.kind) &&
              !msg.content?.trim() &&
              msg.status !== 'streaming'
            )
        )
        .map((msg) => ({
          id: msg._id,
          role: (msg.role === 'system' ? 'agent' : 'rider') as 'rider' | 'agent',
          content: msg.content,
          timestamp: new Date(msg.createdAt),
          kind: msg.kind as TranscriptMessage['kind'],
          status: msg.status,
          attachments: msg.attachments,
        })) ?? []
    )
  }, [rawTranscriptMessages])

  const handleNewSession = async () => {
    await createSession({ firstMessage: '' })
    flowDispatch({ type: 'NEW_SESSION' })
    setSelectedRouteId(null)
    lastFittedPlanIdRef.current = null
  }

  // Toast-style messages for map mode — lightweight pills instead of
  // the full transcript overlay. The hook manages baseline tracking,
  // filtering (agent text only), and per-toast lifecycle.
  const { toasts, dismissToast, clearAll: clearToasts } = useToastMessages({
    transcriptMessages,
    chatMode,
    sessionId: activeChatSessionId,
    isLoading: rawTranscriptMessages === undefined,
  })


  const handleSendMessage = useCallback(
    (message: string) => {
      if (!chatMode) {
        setMapPlanningVisible(true)
      }
      void sendPlanningMessage(
        message,
        currentLocation ? { lat: currentLocation.lat, lng: currentLocation.lng } : undefined
      )
    },
    [chatMode, sendPlanningMessage, currentLocation]
  )

  // Cancel handler that routes to the appropriate cancel function
  // based on which planning mode is active
  const handleCancel = useCallback(() => {
    if (isManualPlanning) {
      cancelPlanning()
    } else {
      cancelChatPlanning()
    }
  }, [isManualPlanning, cancelPlanning, cancelChatPlanning])

  // Cycle the transcript visibility when the chat button / overlay is tapped.
  //   hidden    → pinned (chat mode)
  //   map mode  → chat mode (show transcript)
  //   chat mode → map mode (hide transcript)
  const cycleTranscript = useCallback(() => {
    if (chatMode) {
      setChatMode(false)
      return
    }
    clearToasts()
    setTranscriptMounted(true)
    setMapMounted(true)
    setChatMode(true)
  }, [chatMode, clearToasts])

  // Respond to deep-link param changes (e.g. drawer tapping a session when
  // the home tab is already mounted).
  useEffect(() => {
    if (chatParam === '1' && !chatMode) {
      setTranscriptMounted(true)
      setChatMode(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatParam, sessionIdParam])

  // Opacity orchestration — map fades out when chat mode is active,
  // transcript fades in. No transient scrim needed — toasts handle map mode.
  useEffect(() => {
    mapOpacity.value = withTiming(chatMode ? 0 : 1, { duration: CHAT_TRANSITION_MS })
    chatOpacity.value = withTiming(chatMode ? 1 : 0, { duration: CHAT_TRANSITION_MS })
    const t = setTimeout(() => {
      if (chatMode) setMapMounted(false)
      else {
        setMapMounted(true)
        setTranscriptMounted(false)
      }
    }, CHAT_TRANSITION_MS + 60)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatMode])

  // Fit camera to agent-produced route.
  const { setSelectedRouteId, registerFitHandler } = useSelectedRoute()
  const pendingFitRef = useRef(false)

  const doFit = useCallback(() => {
    if (!agentActiveOption) return
    if (!mapRef.current) {
      // Map not mounted yet — defer until it remounts
      pendingFitRef.current = true
      return
    }
    const coords = decodePolylineGeometry(agentActiveOption.map.overviewGeometry)
    if (coords.length > 0) {
      // Pad enough to clear the floating header (safe area top + header ~72)
      // and the bottom input bar + suggestions (~160 + safe area bottom).
      const padTop = insets.top + 80
      const padBottom = insets.bottom + 180
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: padTop, right: 60, bottom: padBottom, left: 60 },
        animated: true,
      })
    }
  }, [agentActiveOption, insets.top, insets.bottom])

  // When mapMounted flips back to true, flush any pending fit
  useEffect(() => {
    if (mapMounted && pendingFitRef.current) {
      pendingFitRef.current = false
      // Brief delay for the MapView to finish its onMapReady
      const t = setTimeout(doFit, 300)
      return () => clearTimeout(t)
    }
  }, [mapMounted, doFit])

  // Zoom to current location on fresh app start
  const didInitialCenterRef = useRef(false)
  useEffect(() => {
    if (currentLocation && mapMounted && mapRef.current && !didInitialCenterRef.current) {
      didInitialCenterRef.current = true
      mapRef.current.recenterToUser()
    }
  }, [currentLocation, mapMounted])

  // Register the fit handler so other tabs / chat overlay can trigger it
  useEffect(() => {
    registerFitHandler(doFit)
    return () => registerFitHandler(null)
  }, [doFit, registerFitHandler])

  // Auto-fit when a new plan resolves for the first time
  useEffect(() => {
    if (!agentActiveOption || !agentRoutePlan?._id) return
    const planId = agentRoutePlan._id as string
    if (lastFittedPlanIdRef.current === planId) return
    lastFittedPlanIdRef.current = planId
    doFit()
  }, [agentActiveOption, agentRoutePlan, doFit])

  const mapLayerStyle = useAnimatedStyle(() => ({ opacity: mapOpacity.value }))
  const chatLayerStyle = useAnimatedStyle(() => ({ opacity: chatOpacity.value }))

  // Manual mode state (legacy - for PlanRideSheet)
  const [startStop, setStartStop] = useState<RouteStop | null>(null)
  const [endStop, setEndStop] = useState<RouteStop | null>(null)
  const [selectedRouteOptionId, setSelectedRouteOptionId] = useState<string | null>(null)
  const [manualRouteOptions, setManualRouteOptions] = useState<any>(null)
  const [camera, setCamera] = useState<CameraState>({})

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
    // If using chat flow state machine, use polylines from useRouteComparison
    // This includes ROUTE_RESULTS, ROUTE_DETAILS, and PLANNING (when refining existing routes)
    const hasRouteOptions = (flowState.phase === 'ROUTE_RESULTS' || flowState.phase === 'ROUTE_DETAILS' || flowState.phase === 'PLANNING') && 'routeOptions' in flowState && flowState.routeOptions

    if (hasRouteOptions) {
      // Flatten the nested polylines array
      return polylines.flatMap(routePolyline => routePolyline.polylines)
    }

    // Agent-produced route from Convex subscription: renders when the agent
    // has planned a route but the flow state machine hasn't transitioned into
    // ROUTE_RESULTS yet (e.g. agent chat flow, task #258).
    if (agentActiveOption) {
      return buildRoutePolylines({
        route: {
          overviewGeometry: agentActiveOption.map.overviewGeometry,
          legs: agentActiveOption.map.legs,
          overlays: (agentActiveOption.map as any)?.overlays,
        },
        variant: 'selected',
        showLegs: true,
        showWindOverlay: true,
        semantic,
      })
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
  }, [selectedOption, semantic, flowState, polylines, agentActiveOption])

  const markers = useMemo(() => {
    const items: any[] = []
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
      // Only drop pins in manual planning mode (PlanRideSheet open)
      if (!sheetVisible) return
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
    [startStop, endStop, sheetVisible]
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

  // --- Manual planning mode fallback (US-018) ---
  // Extract routing preferences the rider has expressed in chat messages so
  // that PlanRideSheet can be pre-populated when they switch to manual mode.
  const extractPreferencesFromMessages = useCallback(
    (messages: TranscriptMessage[]) => {
      const allText = messages
        .filter((m) => m.role === 'rider')
        .map((m) => m.content.toLowerCase())
        .join(' ')

      return {
        avoidHighways: allText.includes('avoid highway') || allText.includes('no highways'),
        avoidTolls: allText.includes('avoid toll') || allText.includes('no tolls'),
        scenic:
          allText.includes('scenic') ||
          allText.includes('twisties') ||
          allText.includes('curvy'),
      }
    },
    []
  )

  const handleManualModePress = useCallback(() => {
    // Carry over preferences from the chat conversation
    const prefs = extractPreferencesFromMessages(transcriptMessages)

    if (prefs.avoidHighways) setAvoidHighways(true)
    if (prefs.avoidTolls) setAvoidTolls(true)
    if (prefs.scenic) setScenicBias('high')

    // Default start to current location for manual mode
    if (currentLocation && !startStop) setStartStop(currentLocation)

    // Open PlanRideSheet — session history is NOT destroyed
    setSheetVisible(true)
  }, [transcriptMessages, extractPreferencesFromMessages, currentLocation, startStop])

  const clearAll = () => {
    setStartStop(null)
    setEndStop(null)
    setManualRouteOptions(null)
    setSelectedRouteOptionId(null)
    setSearchStop(null)
    setSelectedRouteId(null)
    lastFittedPlanIdRef.current = null
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
        {/* Map layer — cross-fades out when chat mode is entered */}
        {mapMounted && (
          <Animated.View
            style={[StyleSheet.absoluteFill, mapLayerStyle]}
            pointerEvents={chatMode ? 'none' : 'auto'}
          >
            <MapViewWrapper
              ref={mapRef}
              polylines={routePolylines}
              markers={markers}
              onMapClick={handleMapClick}
              onCameraMove={handleCameraMove}
            />
          </Animated.View>
        )}

        {/* Chat transcript layer — only visible in chat mode. Map mode
            uses lightweight MapToastStack instead of the full transcript. */}
        {transcriptMounted && (
          <Animated.View
            style={[StyleSheet.absoluteFill, chatLayerStyle, styles.chatLayer]}
            pointerEvents={chatMode ? 'auto' : 'none'}
          >
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: semantic.color.background.default },
              ]}
            />
            <ChatTranscript
              messages={transcriptMessages}
              topInset={insets.top + 72}
              bottomInset={insets.bottom + 96}
              transparent
              onViewOnMap={() => setChatMode(false)}
            />
          </Animated.View>
        )}

        <View pointerEvents="box-none" style={[styles.headerOverlay, {}]}>
          <MapHeaderOverlay
            title={chatMode ? 'Chat' : 'Lane Shadow'}
            leftAction={{
              icon: 'menu',
              onPress: () => setMenuOpen(true),
              testID: 'map-header-left-button',
              accessibilityLabel: 'Open menu',
            }}
            rightAction={{
              icon: 'motorbike',
              onPress: handleNewSession,
              testID: 'map-header-new-session',
              accessibilityLabel: 'Start new ride session',
              renderIcon: () => (
                <MotorcyclePlusIcon size={24} color={semantic.color.onSurface.default} />
              ),
            }}
            testID="map-header-overlay"
          />

          {/* Overlay toggle - only shown when a route is selected and not in chat mode */}
          {selectedOption && !chatMode && (
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

        {/* Right-side workbar — always rendered so the chat/map toggle
            stays in a consistent space. Map mode exposes zoom/recenter/clear
            above the toggle; chat mode collapses to just the toggle and
            leaves room for future chat-specific operations. */}
        <View
          onLayout={(e) => setControlsHeight(e.nativeEvent.layout.height)}
          style={[
            styles.controls,
            {
              right: semantic.space.sm,
              transform: [{ translateY: -controlsHeight / 2 }],
            },
          ]}
          pointerEvents="box-none"
        >
          <MapControls
            mode={chatMode ? 'chat' : 'map'}
            onZoomIn={() => zoom(1)}
            onZoomOut={() => zoom(-1)}
            onRecenter={recenter}
            onClear={clearAll}
          />
        </View>

        {/* Route attachment cards when showing results (map mode only, hidden while toasts are visible) */}
        {/* Show during ROUTE_RESULTS, ROUTE_DETAILS, and PLANNING (when refining existing routes) */}
        {!chatMode &&
          toasts.length === 0 &&
          (flowState.phase === 'ROUTE_RESULTS' || flowState.phase === 'ROUTE_DETAILS' || flowState.phase === 'PLANNING') &&
          'routeOptions' in flowState &&
          flowState.routeOptions?.options && (
            <Animated.View
              pointerEvents="box-none"
              key={`route-cards-${flowState.phase}-${flowState.sessionId}`}
              entering={FadeInDown.duration(300).springify()}
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
            </Animated.View>
          )}

        {/* Planning indicator - shown in map mode while agent is working */}
        {/* Planning indicator — stays visible until agent finishes,
            but hides when toasts are showing (toast = agent responded) */}
        <MapPlanningIndicator
          visible={mapPlanningVisible && !chatMode && toasts.length === 0}
          bottomOffset={insets.bottom + 96}
        />

        {/* Toast-style message notifications — map mode only */}
        {!chatMode && toasts.length > 0 && (
          <MapToastStack
            messages={toasts}
            onDismiss={dismissToast}
            onTapToChat={() => {
              clearToasts()
              cycleTranscript()
            }}
            bottomOffset={insets.bottom + 96}
            testID="map-toast-stack"
          />
        )}

        {/* Chat input - always visible at bottom */}
        <ChatInput
          onSend={handleSendMessage}
          onCancel={handleCancel}
          state={flowState}
          isPlanning={isPlanning || isManualPlanning}
          suggestions={IDLE_SUGGESTIONS}
          testID="chat-input"
          chatMode={chatMode}
          onToggleChatMode={cycleTranscript}
          onManualModePress={handleManualModePress}
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
  chatLayer: {
    zIndex: 10,
  },
})
