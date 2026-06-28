import { useAuth } from '@clerk/clerk-expo'
import polyline from '@mapbox/polyline'
import { useMutation, useQuery } from 'convex/react'
import { useLocalSearchParams, useRouter, useSegments } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Keyboard, Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChatInput } from '../../../components/chat'
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
import { RouteSummaryCarousel } from '../../../components/map/route-summary-carousel'
import { RouteTag } from '../../../components/map/route-tag'
import { SearchResultMarker } from '../../../components/map/search-result-marker'
import { WeatherPillsRow } from '../../../components/map/weather-pills-row'
import { PlanRideSheet } from '../../../components/sheets/plan-ride-sheet'
import { PlanningErrorSheet } from '../../../components/sheets/planning-error-sheet'
import { RoutePlannerLoading } from '../../../components/sheets/planning-loading'
import { RouteDetailsSheet } from '../../../components/sheets/route-details-sheet'
import type { ChatMessage as TranscriptMessage } from '../../../components/ui/chat-transcript'
import { ChatTranscript } from '../../../components/ui/chat-transcript'
import { MotorcyclePlusIcon } from '../../../components/ui/motorcycle-plus-icon'
import { SaveRouteSheet } from '../../../components/ui/save-favorite-sheet'
import { useSearchResults } from '../../../contexts/search-results'
import { useSelectedRoute } from '../../../contexts/selected-route'
import { useThemePreference } from '../../../contexts/theme-preference'
import { api } from '../../../convex/_generated/api'
import type { Doc, Id } from '../../../convex/_generated/dataModel'
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
import { getCurrentLocation } from '../../../lib/get-current-location'
import { deduplicateRouteOptions } from '../../../lib/routes/dedupe-route-options'
import {
  computeCumulativeDistances,
  decodePolylineGeometry,
  type MapLatLng,
} from '../../../shared/lib/polyline'
import type { RouteProvenance } from '../../../shared/models/saved-routes'
import type { PlanInput, RouteStop } from '../../../shared/types/routes'
import { useChatSessionStore } from '../../../stores/chat-session-store'
import { computeInitialCamera } from './compute-initial-camera'

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

// ─────────────────────────────────────────────────────────────────────────
// RUX-004: RouteTag helpers
// ─────────────────────────────────────────────────────────────────────────

/**
 * Compute the midpoint of a route's overview geometry.
 * Uses linear interpolation between decoded coordinates at 50% arc-length.
 * Fallback: bounding box midpoint if geometry is too short.
 */
const computeRouteMidpoint = (overviewGeometry: any, bounds?: any): MapLatLng => {
  if (!overviewGeometry) {
    // Fallback: use bounds center if no geometry
    if (bounds) {
      return {
        latitude: (bounds.northeast.lat + bounds.southwest.lat) / 2,
        longitude: (bounds.northeast.lng + bounds.southwest.lng) / 2,
      }
    }
    return { latitude: 0, longitude: 0 } // Safe default
  }

  try {
    const decoded = decodePolylineGeometry(overviewGeometry)
    if (decoded.length < 2) {
      // Fallback: use bounds center for single-point routes
      if (bounds) {
        return {
          latitude: (bounds.northeast.lat + bounds.southwest.lat) / 2,
          longitude: (bounds.northeast.lng + bounds.southwest.lng) / 2,
        }
      }
      return decoded[0] || { latitude: 0, longitude: 0 }
    }

    // Compute cumulative distances along the polyline
    const cumulativeDistances = computeCumulativeDistances(decoded)
    const totalDistance = cumulativeDistances[cumulativeDistances.length - 1]

    // Find the coordinate at 50% of total distance
    const targetDistance = totalDistance / 2

    // Linear search to find the segment containing the midpoint
    for (let i = 0; i < cumulativeDistances.length - 1; i += 1) {
      const segStart = cumulativeDistances[i]
      const segEnd = cumulativeDistances[i + 1]

      if (targetDistance >= segStart && targetDistance <= segEnd) {
        // Interpolate within this segment
        const t = (targetDistance - segStart) / (segEnd - segStart)
        const start = decoded[i]
        const end = decoded[i + 1]

        return {
          latitude: start.latitude + (end.latitude - start.latitude) * t,
          longitude: start.longitude + (end.longitude - start.longitude) * t,
        }
      }
    }

    // Fallback: return last decoded point
    return decoded[decoded.length - 1]
  } catch (_error) {
    // Fallback: use bounds center on any decode error
    if (bounds) {
      return {
        latitude: (bounds.northeast.lat + bounds.southwest.lat) / 2,
        longitude: (bounds.northeast.lng + bounds.southwest.lng) / 2,
      }
    }
    return { latitude: 0, longitude: 0 }
  }
}

/**
 * Derive archetype label from route option.
 * Uses the route label or falls back to 'Route' for MVP.
 * In future: extract from session plan context (scenic bias, etc.).
 */
const deriveArchetypeLabel = (route: any): string => {
  // Check if the label contains common archetype keywords
  const label = (route?.label || '').toLowerCase()

  if (label.includes('scenic')) return 'scenic'
  if (label.includes('twisties')) return 'twisties'
  if (label.includes('technical')) return 'technical'
  if (label.includes('cruising')) return 'cruising'
  if (label.includes('sport')) return 'sport'
  if (label.includes('adventure')) return 'adventure'

  // Fallback: 'Route' (MVP acceptable per design spec §14)
  return 'Route'
}

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

  // RUX-003: Route Details Sheet state
  const [routeDetailsSheetVisible, setRouteDetailsSheetVisible] = useState(false)

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
  const { location: currentLocation, loading: locationLoading } = useCurrentLocation()

  // A2: hold the map on a loading state until device location resolves, then
  // open directly on the rider at zoom CURRENT_LOCATION_OPEN_ZOOM (~3–5 mi radius). Avoids the old
  // "max zoom" initial view on a fresh login. If location is denied/unavailable,
  // fall back to a continental default so the map is never blank. Hard cap at
  // 8s so a stuck permission dialog can't hang the screen.
  const [maxHoldElapsed, setMaxHoldElapsed] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setMaxHoldElapsed(true), 8000)
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

  // Session-scoped camera lookup — apply in strict precedence order:
  // 1. Active session slot (explicit resume)
  // 2. Current location (cold open with live location)
  // 3. Default slot (cold open fallback)
  // 4. Continental default (location denied/unavailable)
  // Recomputes when any of these inputs change.
  const activeSessionKey: string | null = activeChatSessionId ?? null
  const initialCamera: MapboxCamera | undefined = useMemo(() => {
    const sessionSlot = activeSessionKey ? cameraBySession[activeSessionKey] : null
    return computeInitialCamera({
      sessionSlot,
      currentLocation,
      defaultCameraSlot,
      locationLoading,
      cameraStoreHydrated,
    })
  }, [
    cameraStoreHydrated,
    activeSessionKey,
    cameraBySession,
    defaultCameraSlot,
    currentLocation,
    locationLoading,
  ])

  // Gate the map mount on having a definitive camera, or on the 8s hard cap.
  const initialCameraReady = initialCamera !== undefined || maxHoldElapsed

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

  // Handle selecting a curated route from suggestion pills — plot directly, no chat round-trip
  const [selectedCuratedRouteId, setSelectedCuratedRouteId] = useState<string | null>(null)

  // Determine if there's an active route for chat input logic
  const hasActiveRoute = !!agentActiveOption || !!selectedCuratedRouteId

  // RUX-001: Deduplicate routes for the carousel
  const distinctRoutes = useMemo(
    () =>
      (flowState as { routeOptions?: { options: any[] } }).routeOptions?.options
        ? deduplicateRouteOptions(
            (flowState as { routeOptions?: { options: any[] } }).routeOptions!.options,
          )
        : [],
    [flowState],
  )

  // Curated route discovery pills (DISC-011)
  const {
    isLoading,
    isEmpty,
    routes: curatedDiscoveryRoutes,
  } = useCuratedDiscovery({ sort: 'nearest', limit: 5 })
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
    async (message: string) => {
      if (!chatMode) {
        setMapPlanningVisible(true)
      }
      // Guarantee a location for the first send so the agent always has an
      // origin and never asks "where are you starting from?". If device
      // location is already resolved, use it; otherwise resolve now (<=2s).
      const loc = currentLocation ?? (await getCurrentLocation(2000))
      void sendPlanningMessage(message, loc ? { lat: loc.lat, lng: loc.lng } : undefined)
    },
    [chatMode, sendPlanningMessage, currentLocation],
  )

  const {
    setSelectedRouteId,
    setDisplayedRoutePlanId,
    registerFitHandler,
    requestFitToRouteWithReset,
  } = useSelectedRoute()

  // DISC-016: create a completed curated route_plan on tap so the standard
  // machinery (displayedRoutePlanId → useActiveSessionRoute → RoutePolyline →
  // doFit) plots the route directly, with NO chat round-trip.
  const createCuratedPlan = useMutation(api.db.routePlans.createCuratedRoutePlan)

  const handleSelectCuratedRoute = useCallback(
    async (routeId: string) => {
      const route = curatedDiscoveryRoutes?.find((r: any) => r.id === routeId)
      if (!route) return
      // RUX-007: Show the map planning indicator while the mutation is pending,
      // mirroring the regular-search path (handleSendMessage calls setMapPlanningVisible(true))
      if (!chatMode) {
        setMapPlanningVisible(true)
      }
      // DISC-016: plot DIRECTLY through the standard route machinery — NO chat
      // message is appended to the transcript. The mutation creates a COMPLETED
      // route_plan whose option carries the centroid-encoded overviewGeometry;
      // setting displayedRoutePlanId + selectedRouteId makes useActiveSessionRoute
      // resolve it, RoutePolyline renders home-route-polyline, and the auto-fit
      // effect (doFit) frames the centroid at zoom 12.
      try {
        const { routePlanId } = await createCuratedPlan({
          routeId: route.id,
          name: route.name,
          centroidLat: route.lat,
          centroidLng: route.lng,
          archetype: route.archetype,
          compositeScore: route.score,
          distanceMi: route.distanceMi ?? 0,
        })
        setSelectedCuratedRouteId(routeId)
        setSelectedRouteId(`curated-${route.id}`)
        setDisplayedRoutePlanId(routePlanId)
        requestFitToRouteWithReset()
      } finally {
        // Clear the indicator once the mutation resolves (or rejects).
        // The isPlanning-keyed auto-dismiss effect (343-344) won't fire here
        // because this isn't a streaming session_messages update; we clear explicitly.
        setMapPlanningVisible(false)
      }
    },
    [
      chatMode,
      curatedDiscoveryRoutes,
      createCuratedPlan,
      setSelectedRouteId,
      setDisplayedRoutePlanId,
      requestFitToRouteWithReset,
    ],
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
  // RUX-008: Auto-switch from chat mode to map mode on plan completion so route plots + fits.
  // Guard with autoSwitchedPlanIdRef to fire ONCE per NEW completed plan, not on every chatMode change.
  useEffect(() => {
    if (
      (flowState.phase === 'PLANNING' ||
        flowState.phase === 'ROUTE_RESULTS' ||
        flowState.phase === 'IDLE') &&
      agentRoutePlan?.status === 'completed' &&
      agentRoutePlan?.result
    ) {
      const planId = agentRoutePlan._id as string | null

      // RUX-008: Only auto-switch if this is a NEW completed plan (not one we've already handled).
      // This ensures the auto-switch fires once per plan, and the rider can manually
      // open chat afterward without being yanked back to map.
      if (planId && planId !== autoSwitchedPlanIdRef.current) {
        autoSwitchedPlanIdRef.current = planId
        if (chatMode) {
          setChatMode(false)
        }
      }

      flowDispatch({
        type: 'PLANNING_SUCCESS',
        routeOptions: agentRoutePlan.result,
      })
    }
  }, [
    flowState.phase,
    agentRoutePlan?.status,
    agentRoutePlan?.result,
    agentRoutePlan?._id,
    flowDispatch,
    chatMode,
  ])

  useEffect(() => {
    if (flowState.phase === 'PLANNING' && agentRoutePlan?.status === 'failed') {
      flowDispatch({
        type: 'PLANNING_ERROR',
        error: "I couldn't plan that route. Could you try again?",
      })
    }
  }, [flowState.phase, agentRoutePlan?.status, flowDispatch])

  // Fit camera to agent-produced route.
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

  // RUX-002: doFit accepts an optional route override so the carousel re-fit
  // effect can fit the flow-state-selected route without going through
  // agentActiveOption.  Without an override, falls back to agentActiveOption
  // (original auto-fit-on-plan-resolve behaviour).
  const doFit = useCallback(
    (routeOverride?: { map: any }) => {
      const option = routeOverride ?? agentActiveOption
      if (!option) return
      if (!mapRef.current) {
        // Map not mounted yet — defer until it remounts
        pendingFitRef.current = true
        return
      }

      // Multi-segment route (DATA-011-C4): if overviewSegments present, fit all segments
      const overviewSegments = (option.map as any)?.overviewSegments
      let allCoords: Array<{ latitude: number; longitude: number }> = []

      if (overviewSegments?.length) {
        // Decode all segments and collect all coordinates
        for (const segmentStr of overviewSegments) {
          const decoded = polyline.decode(segmentStr, 5)
          const segmentCoords: Array<{ latitude: number; longitude: number }> = decoded.map(
            ([latitude, longitude]: [number, number]) => ({ latitude, longitude }),
          )
          allCoords.push(...segmentCoords)
        }
      } else {
        // Single-line route (legacy): use overviewGeometry
        allCoords = decodePolylineGeometry(option.map.overviewGeometry)
      }

      if (allCoords.length > 1) {
        // Multi-point: fit to the polyline bounds
        // Pad enough to clear the floating header (safe area top + header ~72)
        // and the bottom input bar + suggestions (~160 + safe area bottom).
        const padTop = insets.top + 80
        const padBottom = insets.bottom + 180
        mapRef.current.fitToCoordinates(allCoords, {
          top: padTop,
          right: 60,
          bottom: padBottom,
          left: 60,
        })
      } else if (allCoords.length === 1) {
        // DISC-012 AC-3: centroid-only curated route — center on the single point
        mapRef.current.setCameraPosition({
          coordinates: allCoords[0],
          zoom: 12,
        })
      }
      // Clear the flag after fitting so subsequent chat/map toggles preserve position
      setShouldFitToRoute(false)
    },
    [agentActiveOption, insets.top, insets.bottom],
  )

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
    // RUX-008: Auto-switch from chat to map so the deferred doFit flushes
    // and the route plots + frames without a manual toggle. The
    // lastFittedPlanIdRef guard above ensures this fires once per NEW plan
    // (not on every re-render), preventing repeated yanking out of chat.
    if (chatMode && autoSwitchedPlanIdRef.current !== planId) {
      autoSwitchedPlanIdRef.current = planId
      setChatMode(false)
    }
    doFit()
  }, [agentActiveOption, agentRoutePlan, doFit, chatMode])

  // RUX-002: Re-fit camera when carousel pages to a new route (selectedRouteId changes)
  useEffect(() => {
    if (flowState.phase !== 'ROUTE_RESULTS' && flowState.phase !== 'ROUTE_DETAILS') {
      return
    }
    const state = flowState as any
    if (!state.selectedRouteId) return
    if (!mapMounted || !mapRef.current) return

    // Find the selected route option in the flow state so doFit uses the
    // paged route's coordinates (not the agentActiveOption default).
    const selectedOption = state.routeOptions?.options?.find(
      (opt: any) => opt.routeOptionId === state.selectedRouteId,
    )
    if (!selectedOption) return

    // Defer fit briefly to ensure map is ready
    const t = setTimeout(() => {
      doFit(selectedOption)
    }, 100)
    return () => clearTimeout(t)
  }, [flowState, mapMounted, doFit])

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

  // RUX-008: Guard auto-switch to fire ONCE per NEW completed plan id.
  // This prevents the effect from re-firing on every chatMode change.
  const autoSwitchedPlanIdRef = useRef<string | null>(null)

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

  // RUX-003: Handle polyline tap — opens RouteDetailsSheet (not SaveRouteSheet)
  const handleSegmentSelect = useCallback(
    (segment: SegmentSelectData) => {
      // Tap on polyline opens the details sheet for the active route
      // Save is relocated to be reachable from the details sheet and the map controls
      if (!agentRoutePlan || !agentActiveOption) {
        return
      }

      setSelectedSegment(segment)
      setHighlightedSegmentId(segment.segmentId)

      // Small delay to show highlight before sheet appears
      setTimeout(() => {
        setRouteDetailsSheetVisible(true)
      }, 100)
    },
    [agentRoutePlan, agentActiveOption],
  )

  // RUX-004: Handle route tag tap — reuses the same open-details flow as RUX-003
  const handleRouteTagPress = useCallback(() => {
    // Open RouteDetailsSheet (same destination as polyline tap)
    // No chat message, no SaveRouteSheet (save is in the details sheet)
    setRouteDetailsSheetVisible(true)
  }, [])

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

  // RUX-003: Close details sheet
  const handleCloseDetailsSheet = useCallback(() => {
    setRouteDetailsSheetVisible(false)
    setHighlightedSegmentId(undefined)
    setSelectedSegment(null)
  }, [])

  // RUX-001: Handle carousel card press — opens RouteDetailsSheet (not SaveRouteSheet)
  const handleCarouselCardPress = useCallback(
    (routeId: string) => {
      // Select the route so the map polyline updates
      selectRoute(routeId)
      // Open RouteDetailsSheet (components/sheets/route-details-sheet.tsx)
      setRouteDetailsSheetVisible(true)
      // Do NOT send a chat message
    },
    [selectRoute],
  )

  // RUX-003: Handle Save button from details sheet — opens SaveRouteSheet
  const handleSaveFromDetails = useCallback(() => {
    if (!agentRoutePlan || !agentActiveOption) {
      return
    }

    // Build save data for the active route
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

    const routeSnapshot = {
      provider: 'route_plans',
      bounds: agentActiveOption.map.bounds,
      origin: agentRoutePlan.planInput.start,
      destination: agentRoutePlan.planInput.end,
      waypoints: [],
      overviewGeometry: agentActiveOption.map.overviewGeometry,
      legs: agentActiveOption.map.legs,
      annotations: [],
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
    setRouteDetailsSheetVisible(false)
    setSaveRouteSheetVisible(true)
  }, [agentRoutePlan, agentActiveOption, buildRouteProvenance])

  return (
    <MenuLayout testID="home-menu-layout" menuOpen={menuOpen} onMenuOpenChange={setMenuOpen}>
      <View style={styles.container}>
        {/* Map layer — cross-fades out when chat mode is entered */}
        {mapMounted && !initialCameraReady && (
          <View style={[StyleSheet.absoluteFill, styles.mapLoading]}>
            <ActivityIndicator size="large" />
          </View>
        )}
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

              {/* RUX-004: Route Tag — tappable pill showing archetype + distance on the selected route */}
              {(agentActiveOption || selectedOption) && (
                <RouteTag
                  routeId={(agentActiveOption || selectedOption)!.routeOptionId}
                  coordinate={computeRouteMidpoint(
                    (agentActiveOption || selectedOption)!.map.overviewGeometry,
                    (agentActiveOption || selectedOption)!.map.bounds,
                  )}
                  archetype={deriveArchetypeLabel(agentActiveOption || selectedOption)}
                  distanceMeters={(agentActiveOption || selectedOption)!.stats.distanceMeters}
                  isSelected={true}
                  onPress={handleRouteTagPress}
                  testID="route-tag"
                />
              )}
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
              // MapHeaderOverlay appends "-left-button" → renders "map-header-left-button"
              // (passing the full id here doubled the suffix and broke the e2e selector).
              testID: 'map-header',
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

        {/* Route summary carousel — single card above input (replaces per-variant stack) */}
        {!chatMode &&
          toasts.length === 0 &&
          !mapPlanningVisible &&
          (flowState.phase === 'ROUTE_RESULTS' ||
            flowState.phase === 'ROUTE_DETAILS' ||
            flowState.phase === 'PLANNING') && (
            <Animated.View
              pointerEvents="box-none"
              key={`route-carousel-${flowState.phase}-${flowState.sessionId}`}
              entering={FadeInDown.duration(300).springify()}
            >
              <RouteSummaryCarousel
                distinctRoutes={distinctRoutes}
                selectedRouteId={
                  'selectedRouteId' in flowState ? (flowState.selectedRouteId ?? null) : null
                }
                onCardPress={handleCarouselCardPress}
                onRouteChange={selectRoute}
                hasActiveRoute={hasActiveRoute}
                bottomOffset={insets.bottom + 80}
              />
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

        {/* E2E hook: a top-level (a11y-exposed) marker present whenever a route
            is active. Most of the map-mode UI is accessibility-encapsulated, so
            this sibling of ChatInput lets Maestro assert the route rendered. */}
        {hasActiveRoute ? (
          <View testID="route-on-map-marker" style={styles.e2eMarker} pointerEvents="none">
            <Text accessibilityLabel="route on map" style={styles.e2eMarkerText}>
              route
            </Text>
          </View>
        ) : null}

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

        {/* RUX-003: Route Details Sheet */}
        <RouteDetailsSheet
          isVisible={routeDetailsSheetVisible}
          onClose={handleCloseDetailsSheet}
          route={agentActiveOption || selectedOption}
          onSave={handleSaveFromDetails}
          testID="route-details-sheet"
        />

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
  mapLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b0b0c',
  },
  e2eMarker: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  e2eMarkerText: {
    fontSize: 2,
    color: '#000',
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
  chatLayer: {
    zIndex: 10,
  },
})
