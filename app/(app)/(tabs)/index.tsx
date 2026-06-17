import { useAuth } from '@clerk/clerk-expo'
import { useQuery } from 'convex/react'
import { useLocalSearchParams, useRouter, useSegments } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Keyboard, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChatInput, RouteAttachmentCard } from '../../../components/chat'
import { MenuLayout } from '../../../components/layouts/menu-layout'
import type { MapboxMapViewHandle } from '../../../components/map'
import { MapboxMapView } from '../../../components/map'
import { MapControls } from '../../../components/map/map-controls'
import { MapHeaderOverlay } from '../../../components/map/map-header-overlay'
import { MapPlanningIndicator } from '../../../components/map/map-planning-indicator'
import { MapToastStack } from '../../../components/map/map-toast-stack'
import type { MapboxCamera } from '../../../components/map/mapbox-map-view'
import { buildRoutePolylines } from '../../../components/map/route-polyline'
import {
  RoutePolyline,
  type SegmentSelectData,
} from '../../../components/map/route-polyline-component'
import { SearchResultMarker } from '../../../components/map/search-result-marker'
import { WeatherPillsRow } from '../../../components/map/weather-pills-row'
import { PlanRideSheet } from '../../../components/sheets/plan-ride-sheet'
import { PlanningErrorSheet } from '../../../components/sheets/planning-error-sheet'
import { RoutePlannerLoading } from '../../../components/sheets/planning-loading'
import type { ChatMessage as TranscriptMessage } from '../../../components/ui/chat-transcript'
import { ChatTranscript } from '../../../components/ui/chat-transcript'
import { MotorcyclePlusIcon } from '../../../components/ui/motorcycle-plus-icon'
import { SaveRouteSheet } from '../../../components/ui/save-favorite-sheet'
import { useSearchResults } from '../../../contexts/search-results'
import { useSelectedRoute } from '../../../contexts/selected-route'
import { useThemePreference } from '../../../contexts/theme-preference'
import { useActiveSessionRoute } from '../../../hooks/use-active-session-route'
import { useChatPlanning } from '../../../hooks/use-chat-planning'
import { useCuratedDiscovery } from '../../../hooks/use-curated-discovery'
import { useCurrentLocation } from '../../../hooks/use-current-location'
import { useIsRouteSaved } from '../../../hooks/use-is-route-saved'
import { usePlanInit, usePlanRide } from '../../../hooks/use-plan-ride'
import { type RideFlowAction, useRideFlow } from '../../../hooks/use-ride-flow'
import { useRouteComparison } from '../../../hooks/use-route-comparison'
import { useSemanticTheme } from '../../../hooks/use-semantic-theme'
import { useToastMessages } from '../../../hooks/use-toast-messages'
import { api } from '../../../server/convex/_generated/api'
import type { Doc, Id } from '../../../server/convex/_generated/dataModel'
import { decodePolylineGeometry } from '../../../server/lib/polyline'
import type { RouteProvenance } from '../../../server/models/saved-routes'
import type { PlanInput, RouteStop } from '../../../server/types/routes'
import { useChatSessionStore } from '../../../stores/chat-session-store'

type CameraState = {
  center?: { latitude: number; longitude: number }
  zoom?: number
}

// Persistent camera state that survives chat/map toggles
type PersistentCameraState = {
  center: { latitude: number; longitude: number }
  zoom: number
  timestamp: number
}

const CHAT_TRANSITION_MS = 260

const HomeMapScreen = () => {
  const router = useRouter()
  useSegments()
  const mapRef = useRef<MapboxMapViewHandle | null>(null)
  const { semantic } = useSemanticTheme()
  const { isDark } = useThemePreference()
  const insets = useSafeAreaInsets()
  const { isLoaded: clerkLoaded, isSignedIn } = useAuth()
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

  // Persistent camera state that survives chat/map toggles
  const [persistentCamera, setPersistentCamera] = useState<PersistentCameraState | null>(null)
  const [shouldFitToRoute, setShouldFitToRoute] = useState(false)
  const isProgrammaticMoveRef = useRef(false)
  const previousChatModeRef = useRef(chatMode)

  // Chat session store — persisted to AsyncStorage. Holds the last viewed
  // session id (so we resume where the user left off) plus the per-session
  // camera cache (so each session restores its own map position).
  const defaultCameraSlot = useChatSessionStore((s) => s.defaultCamera)
  const cameraBySession = useChatSessionStore((s) => s.bySession)
  const lastViewedSessionId = useChatSessionStore((s) => s.lastViewedSessionId)
  const cameraStoreHydrated = useChatSessionStore((s) => s._hydrated)
  const saveCameraToStore = useChatSessionStore((s) => s.setCamera)
  const setLastViewedSession = useChatSessionStore((s) => s.setLastViewedSession)

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

  // Track when we've explicitly started a new session (to prevent falling back to old session)
  const [explicitlyNewSession, setExplicitlyNewSession] = useState(false)

  // US-050: Save Route Sheet state
  const [saveRouteSheetVisible, setSaveRouteSheetVisible] = useState(false)
  const [saveRouteData, setSaveRouteData] = useState<{
    suggestedName: string
    planInput: any
    routeSnapshot: any
    routeIndex: any
    snapshotMeta: any
    routeProvenance?: RouteProvenance
  } | null>(null)
  const [_selectedSegment, setSelectedSegment] = useState<SegmentSelectData | null>(null)
  const [highlightedSegmentId, setHighlightedSegmentId] = useState<string | undefined>(undefined)

  // Chat infrastructure
  const { state: flowState, dispatch: flowDispatch } = useRideFlow()
  const {
    sendPlanningMessage,
    cancel: cancelChatPlanning,
    sessionId: planningSessionId,
    resetSession,
  } = useChatPlanning(flowDispatch)
  const { polylines, selectRoute } = useRouteComparison(flowState, flowDispatch)
  const { location: currentLocation } = useCurrentLocation()

  // Fallback readiness: after 2.5s let the map mount even without a camera,
  // so fresh installs with slow/denied location don't see an indefinite blank.
  const [cameraFallbackReady, setCameraFallbackReady] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setCameraFallbackReady(true), 2500)
    return () => clearTimeout(t)
  }, [])

  const {
    results: searchResults,
    selectedResultId: selectedSearchResultId,
    setSelectedResultId: setSelectedSearchResultId,
    clearResults: clearSearchResults,
  } = useSearchResults()

  // Fetch sessions so we can fall back to the most recent one on app open.
  // Only query when Clerk auth is loaded and user is signed in to prevent race conditions.
  const sessions = useQuery(
    api.db.planningSessions.listSessions,
    clerkLoaded && isSignedIn ? undefined : 'skip',
  )

  // Resolve which session drives the chat transcript and map route.
  // Priority:
  //   1. explicit URL param (deep link / drawer tap)
  //   2. active planning session (currently-running chat)
  //   3. last viewed session from persistent store (if it still exists)
  //   4. most recent session (newest in the list) — only as a last resort
  // Note: we deliberately DO NOT use `flowState.sessionId` — that's a
  // locally-generated string used by the state machine.
  const activeChatSessionId: Id<'planning_sessions'> | null = useMemo(() => {
    if (sessionIdParam) return sessionIdParam as Id<'planning_sessions'>
    if (planningSessionId) return planningSessionId as Id<'planning_sessions'>
    if (explicitlyNewSession) return null
    if (!sessions || sessions.length === 0) return null
    // Prefer the last-viewed session if it still exists in the list.
    if (lastViewedSessionId) {
      const match = sessions.find((s: Doc<'planning_sessions'>) => s._id === lastViewedSessionId)
      if (match) return match._id
    }
    // Fall back to the newest session.
    return sessions[0]._id
  }, [sessionIdParam, planningSessionId, sessions, explicitlyNewSession, lastViewedSessionId])

  // Persist the active session id so the next launch resumes here.
  useEffect(() => {
    if (!cameraStoreHydrated) return
    if (activeChatSessionId === lastViewedSessionId) return
    setLastViewedSession(activeChatSessionId ?? null)
  }, [activeChatSessionId, lastViewedSessionId, cameraStoreHydrated, setLastViewedSession])

  // Session-scoped camera lookup — use the active session's cached position
  // when available, otherwise fall back to the default slot, then to current
  // location. Recomputes when the session id or cache contents change.
  const activeSessionKey: string | null = activeChatSessionId ?? null
  const initialCamera: MapboxCamera | undefined = useMemo(() => {
    if (!cameraStoreHydrated) return undefined
    const sessionSlot = activeSessionKey ? cameraBySession[activeSessionKey] : null
    const slot = sessionSlot ?? defaultCameraSlot
    if (slot) {
      return {
        center: [slot.center.longitude, slot.center.latitude],
        zoom: slot.zoom,
      }
    }
    if (currentLocation) {
      return {
        center: [currentLocation.lng, currentLocation.lat],
        zoom: 14,
      }
    }
    return undefined
  }, [cameraStoreHydrated, activeSessionKey, cameraBySession, defaultCameraSlot, currentLocation])

  // Gate the map mount on having a camera, or on the fallback timer.
  const initialCameraReady = initialCamera !== undefined || cameraFallbackReady

  // Keep a ref mirror of the active session id so async camera-move callbacks
  // always read the latest value without forcing re-renders of the memoized
  // handleCameraMove callback.
  const activeSessionKeyRef = useRef<string | null>(activeSessionKey)
  useEffect(() => {
    activeSessionKeyRef.current = activeSessionKey
  }, [activeSessionKey])

  // Agent-produced route from Convex (task #258). Subscribes to the latest
  // routing_card in the current session and exposes the active route option.
  const {
    activeOption: agentActiveOption,
    routePlan: agentRoutePlan,
    newestRoutePlanId,
  } = useActiveSessionRoute(activeChatSessionId)

  // Track the last plan id we animated the camera to, so we only fit once
  // per newly resolved plan (not on every re-render).
  const lastFittedPlanIdRef = useRef<string | null>(null)

  // Determine if there's an active route for chat input logic
  const hasActiveRoute = !!agentActiveOption || !!selectedCuratedRouteId

  // Curated route discovery pills (DISC-011)
  const { isLoading, isEmpty, routes: curatedDiscoveryRoutes } = useCuratedDiscovery({ sort: 'nearest', limit: 5 })
  const curatedPills = (curatedDiscoveryRoutes ?? []).map((r) => ({
    label: `${r.name} · ${Math.round(r.distanceMi ?? 0)}mi`,
    routeId: r.id,
  }))

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

  // Clear the explicitly-new-session flag when a new session is actually created
  useEffect(() => {
    if (planningSessionId && explicitlyNewSession) {
      setExplicitlyNewSession(false)
    }
  }, [planningSessionId, explicitlyNewSession])

  const rawTranscriptMessages = useQuery(
    api.db.sessionMessages.list,
    activeChatSessionId ? { sessionId: activeChatSessionId } : 'skip',
  )

  // Derive isPlanning from live message statuses: if any assistant row is
  // still running or streaming, the agent is working.
  const isPlanning = useMemo(
    () =>
      rawTranscriptMessages?.some(
        (msg: Doc<'session_messages'>) => msg.status === 'running' || msg.status === 'streaming',
      ) ?? false,
    [rawTranscriptMessages],
  )

  // Dismiss planning indicator when agent finishes (fallback for cancel or no-message scenarios)
  useEffect(() => {
    if (!isPlanning) setMapPlanningVisible(false)
  }, [isPlanning])

  const transcriptMessages: TranscriptMessage[] = useMemo(() => {
    const filtered =
      rawTranscriptMessages
        ?.filter(
          (msg: Doc<'session_messages'>) =>
            msg.kind !== 'agent_turn' &&
            msg.kind !== 'tool_result_hidden' &&
            !(
              msg.role === 'system' &&
              (msg.kind === 'text' || !msg.kind) &&
              !msg.content?.trim() &&
              msg.status !== 'streaming'
            ),
        )
        .map((msg: Doc<'session_messages'>) => ({
          id: msg._id,
          role: (msg.role === 'system' ? 'agent' : 'rider') as 'rider' | 'agent',
          content: msg.content,
          timestamp: new Date(msg.createdAt),
          kind: msg.kind as TranscriptMessage['kind'],
          status: msg.status,
          attachments: msg.attachments,
          thinkingSteps: msg.thinkingSteps,
        })) ?? []

    // Debug logging to see what messages are being passed to the transcript
    const routingCardMessages = filtered.filter((m: TranscriptMessage) => m.kind === 'routing_card')
    if (routingCardMessages.length > 0) {
    }

    return filtered
  }, [rawTranscriptMessages])

  // Toast-style messages for map mode — lightweight pills instead of
  // the full transcript overlay. The hook manages baseline tracking,
  // filtering (agent text only), and per-toast lifecycle.
  const {
    toasts,
    dismissToast,
    clearAll: clearToasts,
  } = useToastMessages({
    transcriptMessages,
    chatMode,
    sessionId: activeChatSessionId ?? undefined,
    isLoading: rawTranscriptMessages === undefined,
  })

  const handleSendMessage = useCallback(
    (message: string) => {
      if (!chatMode) {
        setMapPlanningVisible(true)
      }
      void sendPlanningMessage(
        message,
        currentLocation ? { lat: currentLocation.lat, lng: currentLocation.lng } : undefined,
      )
    },
    [chatMode, sendPlanningMessage, currentLocation],
  )

  // Handle selecting a curated route from suggestion pills — plot directly, no chat round-trip
  const [selectedCuratedRouteId, setSelectedCuratedRouteId] = useState<string | null>(null)

  const handleSelectCuratedRoute = useCallback(
    (routeId: string) => {
      const route = curatedDiscoveryRoutes?.find((r: any) => r.id === routeId)
      if (!route || !mapRef.current) return
      // Focus camera on the route's centroid (single-point fallback for geometry-less routes)
      mapRef.current.setCameraPosition({
        coordinates: { latitude: route.lat, longitude: route.lng },
        zoom: 12,
      })
      setSelectedCuratedRouteId(routeId)
      // DISCONNECTED — no chat message sent
    },
    [curatedDiscoveryRoutes, mapRef],
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
  }, [chatParam, chatMode])

  // Opacity orchestration — map fades out when chat mode is active,
  // transcript fades in. No transient scrim needed — toasts handle map mode.
  useEffect(() => {
    mapOpacity.value = withTiming(chatMode ? 0 : 1, { duration: CHAT_TRANSITION_MS })
    chatOpacity.value = withTiming(chatMode ? 1 : 0, { duration: CHAT_TRANSITION_MS })
    const t = setTimeout(() => {
      if (chatMode) {
        setMapMounted(false)
      } else {
        setMapMounted(true)
        setTranscriptMounted(false)
      }
    }, CHAT_TRANSITION_MS + 60)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatMode, mapOpacity, chatOpacity])

  // Track previous chat mode for restoration logic
  useEffect(() => {
    previousChatModeRef.current = chatMode
  }, [chatMode])

  // Reactive bridge: transition out of PLANNING/IDLE when agent route plan completes.
  // Also updates flowState when already in ROUTE_RESULTS and a new plan arrives.
  useEffect(() => {
    if (
      (flowState.phase === 'PLANNING' ||
        flowState.phase === 'ROUTE_RESULTS' ||
        flowState.phase === 'IDLE') &&
      agentRoutePlan?.status === 'completed' &&
      agentRoutePlan?.result
    ) {
      flowDispatch({
        type: 'PLANNING_SUCCESS',
        routeOptions: agentRoutePlan.result,
      })
    }
  }, [flowState.phase, agentRoutePlan?.status, agentRoutePlan?.result, flowDispatch])

  useEffect(() => {
    if (flowState.phase === 'PLANNING' && agentRoutePlan?.status === 'failed') {
      flowDispatch({
        type: 'PLANNING_ERROR',
        error: "I couldn't plan that route. Could you try again?",
      })
    }
  }, [flowState.phase, agentRoutePlan?.status, flowDispatch])

  // Fit camera to agent-produced route.
  const {
    setSelectedRouteId,
    setDisplayedRoutePlanId,
    registerFitHandler,
    requestFitToRouteWithReset,
  } = useSelectedRoute()
  const pendingFitRef = useRef(false)

  const handleNewSession = () => {
    // Clear session ID to stay on current view with no session
    router.replace('/(app)/(tabs)' as any)
    // Reset local state
    flowDispatch({ type: 'NEW_SESSION' })
    setSelectedRouteId(null)
    setDisplayedRoutePlanId(null)
    setSelectedCuratedRouteId(null)
    lastFittedPlanIdRef.current = null
    resetSession()
    clearSearchResults()
    // Mark that we've explicitly started a new session (prevent falling back to old session)
    setExplicitlyNewSession(true)
  }

  const doFit = useCallback(() => {
    if (!agentActiveOption) return
    if (!mapRef.current) {
      // Map not mounted yet — defer until it remounts
      pendingFitRef.current = true
      return
    }
    const coords = decodePolylineGeometry(agentActiveOption.map.overviewGeometry)
    if (coords.length > 1) {
      // Multi-point: fit to the polyline bounds
      // Pad enough to clear the floating header (safe area top + header ~72)
      // and the bottom input bar + suggestions (~160 + safe area bottom).
      const padTop = insets.top + 80
      const padBottom = insets.bottom + 180
      mapRef.current.fitToCoordinates(coords, {
        top: padTop,
        right: 60,
        bottom: padBottom,
        left: 60,
      })
    } else if (coords.length === 1) {
      // DISC-012 AC-3: centroid-only curated route — center on the single point
      mapRef.current.setCameraPosition({
        coordinates: coords[0],
        zoom: 12,
      })
    }
    // Clear the flag after fitting so subsequent chat/map toggles preserve position
    setShouldFitToRoute(false)
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

  // Restore camera position when transitioning from chat mode to map mode
  const restorationInProgressRef = useRef(false)
  useEffect(() => {
    // Only restore when actually transitioning from chat to map mode
    const wasInChatMode = previousChatModeRef.current

    // Prevent infinite loops and only restore on chat→map transition
    if (restorationInProgressRef.current) return
    if (!wasInChatMode || chatMode) return // Not a chat→map transition
    if (!mapMounted || !persistentCamera || shouldFitToRoute) return
    if (!mapRef.current) return

    restorationInProgressRef.current = true
    isProgrammaticMoveRef.current = true
    // Small delay to ensure map is ready
    const t = setTimeout(() => {
      if (mapRef.current && persistentCamera) {
        mapRef.current.setCameraPosition({
          coordinates: persistentCamera.center,
          zoom: persistentCamera.zoom,
          duration: 300,
        })
      }
      // Reset the flags after the animation completes
      setTimeout(() => {
        restorationInProgressRef.current = false
        isProgrammaticMoveRef.current = false
      }, 400)
    }, 100)
    return () => {
      clearTimeout(t)
      restorationInProgressRef.current = false
      isProgrammaticMoveRef.current = false
    }
  }, [chatMode, mapMounted, persistentCamera, shouldFitToRoute])

  // Initial camera now handled via MapboxMapView's `initialCamera` prop,
  // which applies Mapbox defaultSettings with animationMode="none" — no fly-in.
  // See `initialCamera` memo above.

  // In-place session switch: when the active session changes while the map
  // stays mounted (e.g. tapping a session in the drawer), jump the camera to
  // that session's cached position with no animation. The `initialCamera`
  // prop only runs at mount, so a mounted map needs an imperative hop.
  const lastSessionKeyRef = useRef<string | null>(activeSessionKey)
  useEffect(() => {
    const previous = lastSessionKeyRef.current
    lastSessionKeyRef.current = activeSessionKey
    if (previous === activeSessionKey) return
    if (!mapMounted || !mapRef.current || !cameraStoreHydrated) return

    const slot = activeSessionKey
      ? (cameraBySession[activeSessionKey] ?? defaultCameraSlot)
      : defaultCameraSlot
    if (!slot) return

    // Mark the move as programmatic so handleCameraMove doesn't overwrite
    // the destination session's cache with a transient value.
    isProgrammaticMoveRef.current = true
    mapRef.current.setCameraPosition({
      coordinates: slot.center,
      zoom: slot.zoom,
      duration: 0,
    })
    const t = setTimeout(() => {
      isProgrammaticMoveRef.current = false
    }, 100)
    return () => clearTimeout(t)
  }, [activeSessionKey, mapMounted, cameraStoreHydrated, cameraBySession, defaultCameraSlot])

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
    // Set the flag to allow camera reset for new plans
    setShouldFitToRoute(true)
    doFit()
  }, [agentActiveOption, agentRoutePlan, doFit])

  // Fit camera to search results when they populate
  const lastSearchResultCountRef = useRef(0)
  useEffect(() => {
    if (searchResults.length > 0 && searchResults.length !== lastSearchResultCountRef.current) {
      lastSearchResultCountRef.current = searchResults.length
      if (mapRef.current && !chatMode) {
        const coords = searchResults.map((r) => ({
          latitude: r.location.lat,
          longitude: r.location.lng,
        }))
        mapRef.current.fitToCoordinates(coords, {
          top: insets.top + 80,
          right: 60,
          bottom: insets.bottom + 180,
          left: 60,
        })
      }
    }
    if (searchResults.length === 0) {
      lastSearchResultCountRef.current = 0
    }
  }, [searchResults, chatMode, insets.top, insets.bottom])

  // Animate to selected search result marker when tapped from chat
  useEffect(() => {
    if (!selectedSearchResultId || chatMode) return
    const result = searchResults.find((r) => r.id === selectedSearchResultId)
    if (result && mapRef.current) {
      mapRef.current.setCameraPosition({
        coordinates: { latitude: result.location.lat, longitude: result.location.lng },
        zoom: 14,
        duration: 500,
      })
    }
  }, [selectedSearchResultId, searchResults, chatMode])

  // Reset selection when a new plan is created (latest plan = default selected)
  const lastSeenPlanIdRef = useRef<string | null>(null)
  useEffect(() => {
    const _currentPlanId = agentRoutePlan?._id as string | null
    const newestPlanId = newestRoutePlanId as string | null

    // Reset when the newest plan changes (not just the displayed plan)
    if (newestPlanId && newestPlanId !== lastSeenPlanIdRef.current) {
      lastSeenPlanIdRef.current = newestPlanId
      // Reset to null so it defaults to the first option of the new plan
      setSelectedRouteId(null)
      // Clear any pinned plan override so the newest plan shows
      setDisplayedRoutePlanId(null)
    }
  }, [newestRoutePlanId, setSelectedRouteId, setDisplayedRoutePlanId, agentRoutePlan?._id])

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
  const [includeFavorites, setIncludeFavorites] = useState(false)

  // Reset includeFavorites when sheet closes (US-046)
  useEffect(() => {
    if (!sheetVisible) {
      setIncludeFavorites(false)
    }
  }, [sheetVisible])

  // Query user's favorite roads
  const favorites = useQuery(api.db.favoriteRoads.list)
  const hasFavorites = (favorites?.length ?? 0) > 0

  useEffect(() => {
    if (planInit?.defaults?.preferences) {
      setScenicBias(planInit.defaults.preferences.scenicBias)
      setAvoidHighways(planInit.defaults.preferences.avoidHighways ?? false)
      setAvoidTolls(planInit.defaults.preferences.avoidTolls ?? false)
    }
  }, [planInit])

  // Get selected option from flow state
  const selectedOption = useMemo(() => {
    if (flowState.phase === 'ROUTE_RESULTS' || flowState.phase === 'ROUTE_DETAILS') {
      if (!flowState.routeOptions?.options?.length) return null
      const explicit = flowState.routeOptions.options.find(
        (opt) => opt.routeOptionId === flowState.selectedRouteId,
      )
      return explicit ?? flowState.routeOptions.options[0]
    }
    // Fallback to manual mode
    if (!manualRouteOptions?.options?.length) return null
    return (
      manualRouteOptions.options.find((opt: any) => opt.routeOptionId === selectedRouteOptionId) ??
      manualRouteOptions.options[0]
    )
  }, [flowState, manualRouteOptions, selectedRouteOptionId])

  // Determine overlay availability based on selected route option
  const _overlayAvailability = useMemo(() => {
    // Only show overlays when the route actually has overlay data
    const hasOverlayData = selectedOption?.overlaysPreview?.conditionsStatus === 'ok'

    return {
      // Wind data is only available when overlay data exists
      wind: hasOverlayData,
      // Rain and temperature availability depends on conditionsStatus
      rain: hasOverlayData,
      temperature: hasOverlayData,
    }
  }, [selectedOption])

  // Build polylines for map rendering
  const routePolylines = useMemo(() => {
    // If using chat flow state machine, use polylines from useRouteComparison
    // This includes ROUTE_RESULTS, ROUTE_DETAILS, and PLANNING (when refining existing routes).
    // During PLANNING, existing route options are preserved so the old route stays
    // visible on the map until a new one arrives.
    const hasRouteOptions =
      (flowState.phase === 'ROUTE_RESULTS' ||
        flowState.phase === 'ROUTE_DETAILS' ||
        flowState.phase === 'PLANNING') &&
      'routeOptions' in flowState &&
      flowState.routeOptions

    if (hasRouteOptions) {
      const flattened = polylines.flatMap((routePolyline) => routePolyline.polylines)

      return flattened
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
        routeId: agentActiveOption.routeOptionId,
        variant: 'selected',
        showLegs: true,
        showWindOverlay: true,
        semantic,
      })
    }

    if (!selectedOption) return []
    return buildRoutePolylines({
      route: {
        overviewGeometry: selectedOption.map.overviewGeometry,
        legs: selectedOption.map.legs,
        overlays: (selectedOption.map as any)?.overlays,
      },
      routeId: selectedOption.routeOptionId,
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
      // Dismiss keyboard on any map tap
      Keyboard.dismiss()
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
    [startStop, endStop, sheetVisible],
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
      includeFavorites,
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
    includeFavorites,
    planRide,
    resetError,
    camera.zoom,
  ])

  const handleCameraMove = useCallback(
    (event: { coordinates: { latitude: number; longitude: number }; zoom: number }) => {
      if (!event.coordinates?.latitude || !event.coordinates?.longitude) return
      const newCamera = {
        center: { latitude: event.coordinates.latitude, longitude: event.coordinates.longitude },
        zoom: event.zoom,
      }
      setCamera(newCamera)
      // Skip persistence during programmatic restores (chat→map, session switch).
      if (isProgrammaticMoveRef.current) return

      // In-memory state that survives chat/map toggles within the same session.
      setPersistentCamera({
        center: newCamera.center,
        zoom: newCamera.zoom,
        timestamp: Date.now(),
      })

      // Persist to AsyncStorage keyed by the active session (or default when
      // there is no session). This is what enables "open where I left off"
      // both across app launches and when switching between sessions.
      const sessionKey = activeSessionKeyRef.current
      saveCameraToStore(sessionKey, newCamera.center, newCamera.zoom)
      // Also update the default slot so brand-new sessions start at the last
      // place the user was looking, rather than snapping to a stale default.
      if (sessionKey) {
        saveCameraToStore(null, newCamera.center, newCamera.zoom)
      }
    },
    [saveCameraToStore],
  )

  const zoom = (delta: number) => {
    mapRef.current?.zoomBy(delta)
  }

  const recenter = () => {
    mapRef.current?.recenterToUser()
  }

  // Dismiss keyboard when tapping outside the input
  const handleDismissKeyboard = useCallback(() => {
    Keyboard.dismiss()
  }, [])

  // --- Manual planning mode fallback (US-018) ---
  // Extract routing preferences the rider has expressed in chat messages so
  // that PlanRideSheet can be pre-populated when they switch to manual mode.
  const extractPreferencesFromMessages = useCallback((messages: TranscriptMessage[]) => {
    const allText = messages
      .filter((m) => m.role === 'rider')
      .map((m) => m.content.toLowerCase())
      .join(' ')

    return {
      avoidHighways: allText.includes('avoid highway') || allText.includes('no highways'),
      avoidTolls: allText.includes('avoid toll') || allText.includes('no tolls'),
      scenic:
        allText.includes('scenic') || allText.includes('twisties') || allText.includes('curvy'),
    }
  }, [])

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
    setSelectedCuratedRouteId(null)
    lastFittedPlanIdRef.current = null
    resetSession()
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

  const buildRouteProvenance = useCallback((routeOption: any): RouteProvenance | undefined => {
    const direct = routeOption?.routeProvenance
    if (direct?.sourceLabel || direct?.designation || direct?.description || direct?.sourceUrl) {
      return direct
    }

    const fallback = {
      sourceLabel: routeOption?.sourceLabel,
      designation: routeOption?.designation,
      description: routeOption?.description,
      sourceUrl: routeOption?.sourceUrl,
    }

    return fallback.sourceLabel ||
      fallback.designation ||
      fallback.description ||
      fallback.sourceUrl
      ? fallback
      : undefined
  }, [])

  // US-050: Handle segment long-press for route saving
  const handleSegmentSelect = useCallback(
    (segment: SegmentSelectData) => {
      // When long-pressing a segment, we want to save the full route, not just the segment
      // So we use the same data flow as the bookmark button
      if (!agentRoutePlan || !agentActiveOption) {
        return
      }

      setSelectedSegment(segment)
      setHighlightedSegmentId(segment.segmentId)

      // Build the same route data as the bookmark button
      const startLabel = agentRoutePlan.startLabel ?? 'Start'
      const endLabel = agentRoutePlan.endLabel ?? 'Destination'
      const suggestedName = `${startLabel} → ${endLabel}`

      const routeIndex = {
        routeFingerprint: agentActiveOption.routeOptionId,
        sampledPoints: [],
      }

      const snapshotMeta = {
        savedAt: Date.now(),
        routingProvider: 'route_plans',
        overlays: {
          wind: agentActiveOption.overlaysPreview?.windSummary
            ? { generatedAt: Date.now(), modelVersion: '1.0' }
            : undefined,
        },
        conditionsStatus: agentActiveOption.overlaysPreview?.conditionsStatus ?? 'unavailable',
        metaVersion: 1,
      }

      // Build complete RouteSnapshot from agentActiveOption.map
      // The map object only has bounds, overviewGeometry, legs - we need to add missing fields
      const routeSnapshot = {
        provider: 'route_plans',
        bounds: agentActiveOption.map.bounds,
        origin: agentRoutePlan.planInput.start,
        destination: agentRoutePlan.planInput.end,
        waypoints: [], // No waypoints for simple A->B routes
        overviewGeometry: agentActiveOption.map.overviewGeometry,
        legs: agentActiveOption.map.legs,
        annotations: [], // Will be populated by enrichment if needed
        overlays: agentActiveOption.map.overlays || {},
      }

      const routeData = {
        suggestedName,
        planInput: agentRoutePlan.planInput,
        routeSnapshot,
        routeIndex,
        snapshotMeta,
        routeProvenance: buildRouteProvenance(agentActiveOption),
      }

      setSaveRouteData(routeData)

      // Small delay to show highlight before sheet appears
      setTimeout(() => {
        setSaveRouteSheetVisible(true)
      }, 100)
    },
    [agentRoutePlan, agentActiveOption, buildRouteProvenance],
  )

  // US-050: Handle save route button press
  const handleSaveRoutePress = useCallback(() => {
    if (!agentRoutePlan || !agentActiveOption) {
      return
    }

    // Build suggested name from start/end labels if available
    const startLabel = agentRoutePlan.startLabel ?? 'Start'
    const endLabel = agentRoutePlan.endLabel ?? 'Destination'
    const suggestedName = `${startLabel} → ${endLabel}`

    // Build routeIndex from the active option
    const routeIndex = {
      routeFingerprint: agentActiveOption.routeOptionId,
      sampledPoints: [], // Will be populated by the mutation
    }

    // Build snapshotMeta
    const snapshotMeta = {
      savedAt: Date.now(),
      routingProvider: 'route_plans', // The plan came from the route_plans table
      overlays: {
        wind: agentActiveOption.overlaysPreview?.windSummary
          ? { generatedAt: Date.now(), modelVersion: '1.0' }
          : undefined,
      },
      conditionsStatus: agentActiveOption.overlaysPreview?.conditionsStatus ?? 'unavailable',
      metaVersion: 1,
    }

    // Build complete RouteSnapshot from agentActiveOption.map
    // The map object only has bounds, overviewGeometry, legs - we need to add missing fields
    const routeSnapshot = {
      provider: 'route_plans',
      bounds: agentActiveOption.map.bounds,
      origin: agentRoutePlan.planInput.start,
      destination: agentRoutePlan.planInput.end,
      waypoints: [], // No waypoints for simple A->B routes
      overviewGeometry: agentActiveOption.map.overviewGeometry,
      legs: agentActiveOption.map.legs,
      annotations: [], // Will be populated by enrichment if needed
      overlays: agentActiveOption.map.overlays || {},
    }

    const routeData = {
      suggestedName,
      planInput: agentRoutePlan.planInput,
      routeSnapshot,
      routeIndex,
      snapshotMeta,
      routeProvenance: buildRouteProvenance(agentActiveOption),
    }

    setSaveRouteData(routeData)
    setSaveRouteSheetVisible(true)
  }, [agentRoutePlan, agentActiveOption, buildRouteProvenance])

  const handleCloseSaveRouteSheet = useCallback(() => {
    setSaveRouteSheetVisible(false)
    setSaveRouteData(null)
    setHighlightedSegmentId(undefined)
    setSelectedSegment(null)
  }, [])

  const handleSaveRouteSuccess = useCallback(() => {
    // Sheet will close via onSuccess prop
    setSaveRouteData(null)
    setHighlightedSegmentId(undefined)
    setSelectedSegment(null)
  }, [])

  return (
    <MenuLayout testID="home-menu-layout" menuOpen={menuOpen} onMenuOpenChange={setMenuOpen}>
      <View style={styles.container}>
        {/* Map layer — cross-fades out when chat mode is entered */}
        {mapMounted && initialCameraReady && (
          <Animated.View
            style={[StyleSheet.absoluteFill, mapLayerStyle]}
            pointerEvents={chatMode ? 'none' : 'auto'}
          >
            <MapboxMapView
              ref={mapRef}
              theme={isDark ? 'dark' : 'light'}
              initialCamera={initialCamera}
              markers={markers}
              onMapClick={handleMapClick}
              onCameraMove={handleCameraMove}
            >
              <RoutePolyline
                polylines={routePolylines}
                onSegmentSelect={handleSegmentSelect}
                selectedSegmentId={highlightedSegmentId}
                testID="home-route-polyline"
              />
              {searchResults.map((result, i) => (
                <SearchResultMarker
                  key={result.id}
                  id={result.id}
                  coordinate={{ latitude: result.location.lat, longitude: result.location.lng }}
                  index={i + 1}
                  name={result.name}
                  placeType={result.types?.[0]}
                  isSelected={result.id === selectedSearchResultId}
                  onPress={setSelectedSearchResultId}
                />
              ))}
            </MapboxMapView>
          </Animated.View>
        )}

        {/* Chat transcript layer — only visible in chat mode. Map mode
            uses lightweight MapToastStack instead of the full transcript. */}
        {transcriptMounted && (
          <Animated.View
            style={[StyleSheet.absoluteFill, chatLayerStyle, styles.chatLayer]}
            pointerEvents={chatMode ? 'auto' : 'none'}
          >
            <View style={StyleSheet.absoluteFill} testID="chat-dismiss-keyboard-pressable">
              <Pressable
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: semantic.color.background.default },
                ]}
                onPress={handleDismissKeyboard}
              />
              <ChatTranscript
                messages={transcriptMessages}
                topInset={insets.top + 72}
                bottomInset={insets.bottom + 96}
                transparent
                onViewOnMap={() => setChatMode(false)}
                onScrollBeginDrag={handleDismissKeyboard}
              />
            </View>
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

          {/* Weather pills - only shown when a route is selected and not in chat mode */}
          {/* TEMP: Force show for testing */}
          {selectedOption && !chatMode && (
            <View
              style={[
                styles.weatherPills,
                {
                  top: insets.top + semantic.space['3xl'] + 8, // Positioned below header area
                  right: semantic.space.lg,
                },
              ]}
              testID="weather-pills-container"
              pointerEvents="box-none"
            >
              <WeatherPillsRow overlays={selectedOption.overlays} testID="weather-pills-row" />
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
            onSaveRoute={handleSaveRoutePress}
            hasRouteToSave={!chatMode && !!agentActiveOption && !!agentRoutePlan}
            isSavedRoute={useIsRouteSaved(agentActiveOption?.routeOptionId)}
          />
        </View>

        {/* Route attachment cards when showing results (map mode only, hidden while toasts are visible) */}
        {/* Show during ROUTE_RESULTS, ROUTE_DETAILS, and PLANNING (when refining existing routes) */}
        {!chatMode &&
          toasts.length === 0 &&
          !mapPlanningVisible &&
          (flowState.phase === 'ROUTE_RESULTS' ||
            flowState.phase === 'ROUTE_DETAILS' ||
            flowState.phase === 'PLANNING') &&
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
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ gap: semantic.space.sm }}
              >
                {flowState.routeOptions.options.map((option) => (
                  <RouteAttachmentCard
                    key={option.routeOptionId}
                    route={option}
                    isSelected={option.routeOptionId === flowState.selectedRouteId}
                    onSelect={selectRoute}
                    testID={`route-card-${option.routeOptionId}`}
                    includeFavorites={includeFavorites}
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
          suggestions={
            // DISC-017: Fix discovery slot to show curated cards only — never generic IDLE_SUGGESTIONS
            isLoading 
              ? [] // Loading: show nothing 
              : isEmpty 
                ? ['No nearby routes'] // Empty: show "no nearby routes" message
                : curatedPills // Has routes: show curated pills only
          }
          testID="chat-input"
          placeholder={!hasActiveRoute ? "Find a route — try 'twisties near Asheville'" : undefined}
          chatMode={chatMode}
          onToggleChatMode={cycleTranscript}
          onManualModePress={handleManualModePress}
          hasMessages={transcriptMessages.length > 0}
          hasActiveRoute={hasActiveRoute}
          dispatch={(action: { type: string }) => flowDispatch(action as RideFlowAction)}
          onSelectRoute={handleSelectCuratedRoute}
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
          includeFavorites={includeFavorites}
          onToggleIncludeFavorites={() => setIncludeFavorites((prev) => !prev)}
          hasFavorites={hasFavorites}
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

        {/* US-050: Save Route Sheet */}
        <SaveRouteSheet
          visible={saveRouteSheetVisible}
          onClose={handleCloseSaveRouteSheet}
          routeData={saveRouteData}
          onSuccess={handleSaveRouteSuccess}
          onCancel={handleCloseSaveRouteSheet}
        />
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
  weatherPills: {
    position: 'absolute',
    zIndex: 26,
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
