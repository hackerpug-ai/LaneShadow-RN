'use node'

import {
  getModel,
  validateToolCall,
  type Tool,
  type ToolCall,
} from '@mariozechner/pi-ai'
import { AgentToolSchemas } from '../lib/piTools'
import { createGeocodingProvider } from '../providers/geocodingProvider'
import { planRideOrchestrator } from '../lib/planRideOrchestrator'
import { buildOptionsFromResults } from '../planRide'
import { runAgent } from '../runAgent'
import { ANTHROPIC_API_KEY } from '../../../lib/env'
import { api, internal } from '../../../_generated/api'
import type { Id } from '../../../_generated/dataModel'
import type { AgentContext, ExecuteContext } from '../ridePlanningAgent'
import type { SubAgentConfig, RoutingAgentResult } from './types'

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

// Uncapped for levelsetting — log attempts but don't limit
export const MAX_COMPILE_ATTEMPTS = 20

// -----------------------------------------------------------------------------
// In-Memory Sketch Store (per-session)
// -----------------------------------------------------------------------------

// Session-scoped state for sketch compilation — tracks pending sketches, succeeded
// segment cache, and attempt count for the retry loop.

type SegmentIdentity = {
  roadName: string
  fromName: string
  toName: string
}

type CachedSegmentResult = {
  // The original segment index in the sketch passed to the first compileSketch call
  segmentIndex: number
  route: import('../providers/routingProvider').ProviderRouteResponse
  identity: SegmentIdentity
}

type PendingSketchState = {
  sketch: any
  succeededSegments: CachedSegmentResult[]
  attemptCount: number
}

const pendingSketches = new Map<string, PendingSketchState>()

export function storePendingSketch(sessionId: string, sketch: any): void {
  // Reset the sketch state when a new sketch is stored (LLM called createRouteSketch again)
  pendingSketches.set(sessionId, { sketch, succeededSegments: [], attemptCount: 0 })
}

export function getPendingSketchState(sessionId: string): PendingSketchState | undefined {
  return pendingSketches.get(sessionId)
}

export function updatePendingSketchState(sessionId: string, state: PendingSketchState): void {
  pendingSketches.set(sessionId, state)
}

export function clearPendingSketch(sessionId: string): void {
  pendingSketches.delete(sessionId)
}

// Legacy accessor — kept for createRouteSketch handler which only needs the sketch
export function getPendingSketch(sessionId: string): any | undefined {
  return pendingSketches.get(sessionId)?.sketch
}

/**
 * Segment identity key for change detection.
 * Two segments with the same (roadName, fromName, toName) are considered identical.
 */
export function segmentKey(seg: SegmentIdentity): string {
  return `${seg.roadName}||${seg.fromName}||${seg.toName}`
}

/**
 * Find which segments in the new sketch are unchanged compared to previously-succeeded segments.
 * Returns a map from new-sketch-index → cached result for each unchanged segment.
 */
export function findUnchangedSegments(
  newSegments: SegmentIdentity[],
  cached: CachedSegmentResult[]
): Map<number, CachedSegmentResult> {
  const cachedByKey = new Map(cached.map((r) => [segmentKey(r.identity), r]))
  const unchanged = new Map<number, CachedSegmentResult>()

  newSegments.forEach((seg, idx) => {
    const hit = cachedByKey.get(segmentKey(seg))
    if (hit) {
      unchanged.set(idx, hit)
    }
  })

  return unchanged
}

/**
 * Merge cached succeeded segments with newly-compiled results into a single ordered array.
 * The result is ordered by segmentIndex (position in the new sketch).
 */
export function mergeSegmentResults(
  newSegments: SegmentIdentity[],
  unchanged: Map<number, CachedSegmentResult>,
  newResults: import('../tools/compileSketch').SegmentCompileResult[]
): import('../tools/compileSketch').SegmentCompileResult[] {
  // newResults are indexed relative to the toCompile subset — remap them
  // The compile call was given segments in order; map back to sketch index
  let newResultIdx = 0
  const merged: import('../tools/compileSketch').SegmentCompileResult[] = []

  for (let i = 0; i < newSegments.length; i++) {
    const cached = unchanged.get(i)
    if (cached) {
      merged.push({ status: 'ok', segmentIndex: i, route: cached.route })
    } else {
      // This was a segment we compiled — get from newResults in order
      const r = newResults[newResultIdx++]
      if (r) {
        merged.push({ ...r, segmentIndex: i })
      }
    }
  }

  return merged
}

// -----------------------------------------------------------------------------
// Tool Handlers
// -----------------------------------------------------------------------------

/**
 * Geocode a place name to coordinates.
 * Exported for reuse by searchAgent (US-078).
 */
export async function runGeocode(
  ctx: AgentContext,
  args: { query: string }
): Promise<unknown> {
  const provider = createGeocodingProvider()
  const results = await provider.geocode(args.query, ctx.currentLocation)
  if (results.length === 0) {
    return {
      type: 'error',
      message: `No results found for "${args.query}"`,
      hint: 'Try a more specific query with city/state, e.g. "Santa Cruz, CA" instead of "Santa Cruz"',
      retryGuidance: 'different_args',
    }
  }
  return { results: results.slice(0, 3) }
}

async function runDiscoverCorridor(
  ctx: AgentContext,
  args: {
    start: { lat: number; lng: number }
    end: { lat: number; lng: number }
    preferences?: { scenicBias?: 'default' | 'high'; avoidHighways?: boolean }
  }
): Promise<unknown> {
  const discoverCorridor = await import('../tools/discoverCorridor')

  // Try Convex OSM data first for fast queries
  try {
    const bounds = {
      south: Math.min(args.start.lat, args.end.lat) - 0.5,
      west: Math.min(args.start.lng, args.end.lng) - 0.5,
      north: Math.max(args.start.lat, args.end.lat) + 0.5,
      east: Math.max(args.start.lng, args.end.lng) + 0.5,
    }

    // Query scenic nodes and roads from Convex
    const [nodes, ways] = await Promise.all([
      ctx.runAction(internal.actions.osm.queryNodesInBbox, {
        bounds,
        types: ['viewpoint', 'peak', 'mountain_pass'],
      }),
      ctx.runAction(internal.actions.osm.queryWaysInBbox, {
        bounds,
        highwayClasses: ['trunk', 'primary', 'secondary', 'tertiary'],
      }),
    ])

    // If we got road results from Convex, use them (nodes alone aren't enough for corridor discovery)
    if (ways.length > 0) {
      return {
        roads: ways.map((w: any) => ({
          name: w.name || 'Unknown Road',
          highway: w.highwayClass || 'unknown',
          surface: w.surface || null,
          endpoints: w.geometry.map((g: number[]) => ({ lat: g[1], lng: g[0] })),
        })),
        pois: nodes.map((n: any) => ({
          name: n.name || 'Unknown Point',
          type: n.type as 'viewpoint' | 'peak' | 'pass' | 'scenic_road',
          lat: n.lat,
          lng: n.lon,
          score: n.type === 'mountain_pass' ? 3 : n.type === 'peak' ? 2 : 1,
        })),
        discoveryStatus: 'success' as const,
      }
    }
  } catch (error) {
    // Convex query failed, fall back to Overpass
    console.warn('Convex OSM query failed, falling back to Overpass:', error)
  }

  // Fall back to Overpass tool
  return discoverCorridor.discoverCorridor(args)
}

async function runLookupRoad(
  ctx: AgentContext,
  args: {
    roadName: string
    bbox: { south: number; west: number; north: number; east: number }
  }
): Promise<unknown> {
  const lookupRoad = await import('../tools/lookupRoad')

  // Try Convex OSM data first for fast name lookup
  try {
    const ways = await ctx.runAction(internal.actions.osm.queryWaysByName, {
      name: args.roadName,
      bounds: args.bbox,
    })

    if (ways.length > 0) {
      return {
        exists: true,
        status: 'found' as const,
        matches: ways.map((w: any) => ({
          name: w.name || args.roadName,
          highway: w.highwayClass || 'unknown',
          surface: w.surface || null,
          geometry: w.geometry.map((g: number[]) => ({ lat: g[1], lng: g[0] })),
        })),
      }
    }
  } catch (error) {
    // Convex query failed, fall back to Overpass
    console.warn('Convex OSM query failed, falling back to Overpass:', error)
  }

  // Fall back to Overpass tool
  return lookupRoad.lookupRoad(args)
}

async function runCreateRouteSketch(
  ctx: AgentContext,
  args: {
    label: string
    rationale: string
    segments: Array<{
      roadName: string
      fromName: string
      toName: string
      viaNames: string[] | null
    }>
    anchorPoints: Array<{
      name: string
      kind: 'town' | 'junction' | 'landmark' | 'pass'
      lat: number
      lng: number
    }>
  }
): Promise<unknown> {
  // Store the sketch for use with compileSketch
  const sessionId = ctx.planningSessionId
  const sketch = {
    label: args.label,
    rationale: args.rationale,
    segments: args.segments.map(s => ({
      roadName: s.roadName,
      fromName: s.fromName,
      toName: s.toName,
      viaNames: s.viaNames || undefined,
    })),
    anchorPoints: args.anchorPoints,
  }
  storePendingSketch(sessionId, sketch)

  // Return success so the agent knows the sketch was created
  return {
    type: 'sketch_created',
    sketch,
    message: `Route sketch "${args.label}" created. Now call compileSketch with start/end coordinates to generate the route.`,
  }
}

async function runCompileSketch(
  ctx: AgentContext,
  args: {
    start: { lat: number; lng: number; label: string | null }
    end: { lat: number; lng: number; label: string | null }
    departureTime: number
    preferences: {
      scenicBias: 'default' | 'high'
      avoidHighways: boolean
      avoidTolls: boolean
    }
    sketch?: {
      label: string
      rationale: string
      segments: Array<{
        roadName: string
        fromName: string
        toName: string
        viaNames?: string[]
      }>
      anchorPoints: Array<{
        name: string
        kind: 'town' | 'junction' | 'landmark' | 'pass'
        lat?: number
        lng?: number
      }>
    }
  }
): Promise<unknown> {
  const sessionId = ctx.planningSessionId

  // Get sketch from args or from pending store
  let sketch = args.sketch
  if (!sketch) {
    sketch = getPendingSketch(sessionId)
    if (!sketch) {
      return {
        type: 'error',
        message: "No route sketch found. Call createRouteSketch first to define your route itinerary.",
        hint: "Use createRouteSketch to specify the roads and waypoints for your route.",
        retryGuidance: 'create_sketch',
      }
    }
  }

  // Rate-limit check
  const usage = await ctx.runQuery(internal.db.planUsage.checkUsageInternal, {
    clerkUserId: ctx.clerkUserId,
  })

  if (!usage.allowed) {
    return {
      type: 'chat',
      message: `You've reached your monthly limit of ${usage.limit} route plans. Upgrade to Premium for unlimited plans!`,
      hint: 'Do not attempt another planRoute call — the user is rate-limited.',
      retryGuidance: 'stop',
    }
  }

  // Persist a route_plans row up front
  const planInput = {
    start: {
      lat: args.start.lat,
      lng: args.start.lng,
      label: args.start.label ?? undefined,
    },
    end: {
      lat: args.end.lat,
      lng: args.end.lng,
      label: args.end.label ?? undefined,
    },
    departureTime: args.departureTime,
    preferences: args.preferences,
  }

  const { routePlanId } = await ctx.runMutation(
    internal.db.routePlans.createForAgentInternal,
    {
      clerkUserId: ctx.clerkUserId,
      planningSessionId: sessionId,
      planInput,
      startLabel: args.start.label ?? undefined,
      endLabel: args.end.label ?? undefined,
    }
  )

  try {
    // Import compilation tools dynamically to avoid circular deps
    const { compileSketch: compileSketchImpl, compileSegments, stitchSegments } = await import('../tools/compileSketch')
    const { normalizeRoute } = await import('../tools/normalizeRoute')
    const { buildOptionsFromResults: buildOpts } = await import('../planRide')

    let providerRoute: import('../providers/routingProvider').ProviderRouteResponse

    if (sketch.segments.length > 0) {
      // Per-segment compilation path (LLM-authored sketches)

      // ------------------------------------------------------------------
      // Retry tracking (US-025)
      // ------------------------------------------------------------------
      // Load current session state (attempt count + previously-succeeded segments)
      const currentState = getPendingSketchState(sessionId)
      const attemptCount = (currentState?.attemptCount ?? 0) + 1
      const cachedSucceeded: CachedSegmentResult[] = currentState?.succeededSegments ?? []

      // Determine which segments need compilation this attempt.
      // Unchanged segments (same roadName+fromName+toName as a cached success) are skipped.
      const newSegments: SegmentIdentity[] = sketch.segments.map((s: any) => ({
        roadName: s.roadName,
        fromName: s.fromName,
        toName: s.toName,
      }))

      const unchanged = findUnchangedSegments(newSegments, cachedSucceeded)
      const toCompile = sketch.segments.filter((_: any, i: number) => !unchanged.has(i))

      // ------------------------------------------------------------------
      // Max retries exhausted with persistent failures
      // ------------------------------------------------------------------
      const attemptsRemaining = MAX_COMPILE_ATTEMPTS - attemptCount

      if (attemptCount >= MAX_COMPILE_ATTEMPTS && cachedSucceeded.length > 0 && toCompile.length > 0) {
        // Compile the remaining failed segments one last time to see if any succeed
        const lastResults = await compileSegments({
          planInput,
          sketch: { ...sketch, segments: toCompile },
          locationBias: ctx.currentLocation,
        })
        const allResults = mergeSegmentResults(newSegments, unchanged, lastResults)
        const stillFailed = allResults.filter(r => r.status === 'failed')
        const nowSucceeded = allResults.filter(r => r.status === 'ok')

        if (stillFailed.length > 0 && nowSucceeded.length > 0) {
          // Build a partial route from the succeeded segments and return it with a message
          const partialRoute = stitchSegments(nowSucceeded)
          const routeSnapshot = await normalizeRoute({ providerRoute: partialRoute, planInput })
          const results = [{ routeSnapshot, sketch }]

          let built
          try {
            built = buildOpts(results, crypto.randomUUID())
          } catch (buildError) {
            console.error('[runCompileSketch] Error building partial route options:', buildError)
            await ctx.runMutation(internal.db.routePlans.updatePlanStatus, {
              routePlanId,
              status: 'failed',
              errorMessage: `Failed to build route options: ${buildError instanceof Error ? buildError.message : String(buildError)}`,
            })
            throw buildError
          }

          clearPendingSketch(sessionId)

          try {
            await ctx.runMutation(internal.db.routePlans.updatePlanStatus, {
              routePlanId,
              status: 'completed',
              result: built,
            })
          } catch (updateError) {
            console.error('[runCompileSketch] Error updating status to completed:', updateError)
            throw updateError
          }

          await ctx.runMutation(internal.db.planUsage.incrementUsageInternal, {
            clerkUserId: ctx.clerkUserId,
          })

          const failedRoadNames = stillFailed.map(f => newSegments[f.segmentIndex]?.roadName ?? 'unknown road').join(', ')
          return {
            type: 'routes',
            data: {
              ...built,
              message: `I routed most of the trip but couldn't find a path for ${failedRoadNames}. Here's what works.`,
            },
            routePlanId,
          }
        }

        if (stillFailed.length > 0 && nowSucceeded.length === 0) {
          // All remaining segments failed — return a chat message
          clearPendingSketch(sessionId)
          await ctx.runMutation(internal.db.routePlans.updatePlanStatus, {
            routePlanId,
            status: 'failed',
            errorMessage: `All segments failed after ${MAX_COMPILE_ATTEMPTS} attempts`,
          })
          const failedRoadNames = stillFailed.map(f => newSegments[f.segmentIndex]?.roadName ?? 'unknown road').join(', ')
          return {
            type: 'chat',
            message: `I wasn't able to find a path for ${failedRoadNames} after several attempts. Try a different route?`,
          }
        }

        // All succeeded on last attempt — fall through to normal success path
        providerRoute = stitchSegments(nowSucceeded)
        clearPendingSketch(sessionId)
        const routeSnapshot = await normalizeRoute({ providerRoute, planInput })
        const results = [{ routeSnapshot, sketch }]

        let built
        try {
          built = buildOpts(results, crypto.randomUUID())
        } catch (buildError) {
          console.error('[runCompileSketch] Error building route options:', buildError)
          await ctx.runMutation(internal.db.routePlans.updatePlanStatus, {
            routePlanId,
            status: 'failed',
            errorMessage: `Failed to build route options: ${buildError instanceof Error ? buildError.message : String(buildError)}`,
          })
          throw buildError
        }

        try {
          await ctx.runMutation(internal.db.routePlans.updatePlanStatus, {
            routePlanId, status: 'completed', result: built,
          })
        } catch (updateError) {
          console.error('[runCompileSketch] Error updating status to completed:', updateError)
          throw updateError
        }

        await ctx.runMutation(internal.db.planUsage.incrementUsageInternal, { clerkUserId: ctx.clerkUserId })
        return { type: 'routes', data: built, routePlanId }
      }

      // ------------------------------------------------------------------
      // Normal compilation attempt (attempt 1..MAX-1, or first attempt with no cache)
      // ------------------------------------------------------------------
      const segmentResults = await compileSegments({
        planInput,
        sketch: { ...sketch, segments: toCompile },
        locationBias: ctx.currentLocation,
      })

      // Merge new results with cached unchanged segments
      const mergedResults = mergeSegmentResults(newSegments, unchanged, segmentResults)
      const failed = mergedResults.filter(r => r.status === 'failed')
      const succeeded = mergedResults.filter(r => r.status === 'ok')

      if (failed.length > 0) {
        // Total failure: all segments failed - throw exception to terminate agent
        if (succeeded.length === 0) {
          const errorDetails = failed.map(f => ({
            segmentIndex: f.segmentIndex,
            roadName: newSegments[f.segmentIndex].roadName,
            fromName: newSegments[f.segmentIndex].fromName,
            toName: newSegments[f.segmentIndex].toName,
            error: f.status === 'failed' ? f.error : 'unknown',
          }))

          await ctx.runMutation(internal.db.routePlans.updatePlanStatus, {
            routePlanId,
            status: 'failed',
            errorMessage: `All ${failed.length} segments failed to route`,
          })

          throw new Error(
            `All road segments couldn't be routed. ` +
            `Failed segments: ${errorDetails.map(e => `${e.roadName} (${e.fromName} → ${e.toName}): ${e.error}`).join(', ')}. ` +
            `Try using more specific location names or major highways.`
          )
        }

        // Partial failure: some segments succeeded - return error for retry
        // Update the succeeded segment cache for the next retry attempt
        const newCachedSucceeded: CachedSegmentResult[] = succeeded.map(s => ({
          segmentIndex: s.segmentIndex,
          route: (s as Extract<typeof s, { status: 'ok' }>).route,
          identity: newSegments[s.segmentIndex],
        }))

        updatePendingSketchState(sessionId, {
          sketch,
          succeededSegments: newCachedSucceeded,
          attemptCount,
        })

        await ctx.runMutation(internal.db.routePlans.updatePlanStatus, {
          routePlanId,
          status: 'failed',
          errorMessage: `${failed.length} of ${newSegments.length} segments failed`,
        })

        return {
          type: 'error',
          message: `${failed.length} of ${newSegments.length} road segments couldn't be routed.`,
          hint: JSON.stringify({
            type: 'partial_route',
            attemptsRemaining,
            succeeded: succeeded.map(s => ({
              segmentIndex: s.segmentIndex,
              roadName: newSegments[s.segmentIndex].roadName,
            })),
            failed: failed.map(f => ({
              segmentIndex: f.segmentIndex,
              roadName: newSegments[f.segmentIndex].roadName,
              fromName: newSegments[f.segmentIndex].fromName,
              toName: newSegments[f.segmentIndex].toName,
              error: f.status === 'failed' ? f.error : 'unknown',
            })),
            retryGuidance: 'revise_failed_segments',
            hint: 'Revise only the failed segments. Keep succeeded segments unchanged.',
          }),
          retryGuidance: 'revise_failed_segments',
          routePlanId,
        }
      }

      // All segments succeeded — stitch into a single provider route
      providerRoute = stitchSegments(mergedResults)
    } else {
      // Single-shot compilation path (deterministic orchestrator sketches with empty segments)
      providerRoute = await compileSketchImpl({
        planInput,
        sketch,
      })
    }

    // Normalize the route
    const routeSnapshot = await normalizeRoute({
      providerRoute,
      planInput,
    })

    // Build the result
    const results = [{
      routeSnapshot,
      sketch,
    }]

    let built
    try {
      built = buildOpts(results, crypto.randomUUID())
    } catch (buildError) {
      console.error('[runCompileSketch] Error building options:', buildError)
      await ctx.runMutation(internal.db.routePlans.updatePlanStatus, {
        routePlanId,
        status: 'failed',
        errorMessage: `Failed to build route options: ${buildError instanceof Error ? buildError.message : String(buildError)}`,
      })
      throw buildError
    }

    // Clear the pending sketch after successful compilation
    clearPendingSketch(sessionId)

    // Debug: log the result structure before storing
    console.info('[runCompileSketch] Storing route plan result:', {
      routePlanId,
      status: 'completed',
      optionsCount: built.options?.length,
      firstOption: built.options?.[0] ? {
        routeOptionId: built.options[0].routeOptionId,
        hasMap: !!built.options[0].map,
        hasOverviewGeometry: !!built.options[0].map?.overviewGeometry,
        overviewGeometryValue: built.options[0].map?.overviewGeometry?.value?.substring(0, 50) + '...',
        legsCount: built.options[0].map?.legs?.length,
      } : null,
    })

    // Finalize the route_plans row
    try {
      await ctx.runMutation(internal.db.routePlans.updatePlanStatus, {
        routePlanId,
        status: 'completed',
        result: built,
      })
    } catch (updateError) {
      console.error('[runCompileSketch] Error updating status to completed:', updateError)
      throw updateError
    }

    // Increment usage
    await ctx.runMutation(internal.db.planUsage.incrementUsageInternal, {
      clerkUserId: ctx.clerkUserId,
    })

    return { type: 'routes', data: built, routePlanId }
  } catch (error) {
    console.error('[runCompileSketch] Error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)

    // Check if it's a routing compilation error (e.g., invalid road, no connection)
    const isRoutingError = errorMessage.includes('ROUTING_COMPILE_FAILED') ||
                          errorMessage.includes('ZERO_RESULTS') ||
                          errorMessage.includes('NOT_FOUND')

    await ctx.runMutation(internal.db.routePlans.updatePlanStatus, {
      routePlanId,
      status: 'failed',
      errorMessage,
    })

    if (isRoutingError) {
      return {
        type: 'error',
        message: "I couldn't route that way — the roads may not connect or one might not exist. Let me try a different approach.",
        hint: `The route sketch "${sketch.label}" couldn't be compiled. Try using different roads or check if they connect.`,
        retryGuidance: 'revise_sketch',
        routePlanId,
      }
    }

    return {
      type: 'error',
      message: "I couldn't plan your route right now. Please try again.",
      hint: error instanceof Error && error.message.includes('timeout')
        ? 'The route calculation timed out. Try a shorter distance or simpler route.'
        : 'Suggest an alternate destination or relax preferences (e.g. remove avoid-highways).',
      retryGuidance: 'ask_rider',
      routePlanId,
    }
  }
}

async function runPlanRoute(
  ctx: AgentContext,
  args: {
    start: { lat: number; lng: number; label: string | null }
    end: { lat: number; lng: number; label: string | null }
    departureTime: number
    preferences: {
      scenicBias: 'default' | 'high'
      avoidHighways: boolean
      avoidTolls: boolean
    }
  }
): Promise<unknown> {
  // Rate-limit check (limit configurable via RATE_LIMIT_OVERRIDE env var; 0 = unlimited)
  const usage = await ctx.runQuery(internal.db.planUsage.checkUsageInternal, {
    clerkUserId: ctx.clerkUserId,
  })

  if (!usage.allowed) {
    return {
      type: 'chat',
      message: `You've reached your monthly limit of ${usage.limit} route plans. Upgrade to Premium for unlimited plans!`,
      hint: 'Do not attempt another planRoute call — the user is rate-limited.',
      retryGuidance: 'stop',
    }
  }

  // Persist a route_plans row up front so the reactive RoutingCard in the
  // chat transcript can subscribe to status/phase/result updates.
  const planInput = {
    start: {
      lat: args.start.lat,
      lng: args.start.lng,
      label: args.start.label ?? undefined,
    },
    end: {
      lat: args.end.lat,
      lng: args.end.lng,
      label: args.end.label ?? undefined,
    },
    departureTime: args.departureTime,
    preferences: args.preferences,
  }

  const { routePlanId } = await ctx.runMutation(
    internal.db.routePlans.createForAgentInternal,
    {
      clerkUserId: ctx.clerkUserId,
      planningSessionId: ctx.planningSessionId,
      planInput,
      startLabel: args.start.label ?? undefined,
      endLabel: args.end.label ?? undefined,
    }
  )

  console.info('[runPlanRoute] Starting route planning:', {
    routePlanId,
    start: args.start.label,
    end: args.end.label,
    departureTime: new Date(args.departureTime).toISOString(),
  })

  try {
    const results = await planRideOrchestrator({
      planInput,
      departureTimeMs: args.departureTime,
    })

    let built
    try {
      built = buildOptionsFromResults(results, crypto.randomUUID())
    } catch (buildError) {
      console.error('[runPlanRoute] Error building options:', buildError)
      await ctx.runMutation(internal.db.routePlans.updatePlanStatus, {
        routePlanId,
        status: 'failed',
        errorMessage: `Failed to build route options: ${buildError instanceof Error ? buildError.message : String(buildError)}`,
      })
      throw buildError
    }

    // Debug: log the result structure before storing
    console.info('[runPlanRoute] Storing route plan result:', {
      routePlanId,
      status: 'completed',
      optionsCount: built.options?.length,
      firstOption: built.options?.[0] ? {
        routeOptionId: built.options[0].routeOptionId,
        hasMap: !!built.options[0].map,
        hasOverviewGeometry: !!built.options[0].map?.overviewGeometry,
        overviewGeometryValue: built.options[0].map?.overviewGeometry?.value?.substring(0, 50) + '...',
        legsCount: built.options[0].map?.legs?.length,
      } : null,
    })

    try {
      await ctx.runMutation(internal.db.routePlans.updatePlanStatus, {
        routePlanId,
        status: 'completed',
        result: built,
      })
      console.info('[runPlanRoute] Route plan completed successfully:', {
        routePlanId,
        optionsCount: built.options?.length,
      })
    } catch (updateError) {
      console.error('[runPlanRoute] Error updating status to completed:', updateError)
      throw updateError
    }

    // Increment usage (deterministic action)
    await ctx.runMutation(internal.db.planUsage.incrementUsageInternal, {
      clerkUserId: ctx.clerkUserId,
    })

    return { type: 'routes', data: built, routePlanId }
  } catch (error) {
    console.error('[runPlanRoute] Error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.info('[runPlanRoute] Route plan failed:', {
      routePlanId,
      errorMessage,
    })
    await ctx.runMutation(internal.db.routePlans.updatePlanStatus, {
      routePlanId,
      status: 'failed',
      errorMessage,
    })
    return {
      type: 'error',
      message: "I couldn't plan your route right now. Please try again.",
      hint: error instanceof Error && error.message.includes('timeout')
        ? 'The route calculation timed out. Try a shorter distance or simpler route.'
        : 'Suggest an alternate destination or relax preferences (e.g. remove avoid-highways).',
      retryGuidance: 'ask_rider',
      routePlanId,
    }
  }
}

// -----------------------------------------------------------------------------
// Tool Definitions
// -----------------------------------------------------------------------------

type RoutingTool = Tool & { parallelSafe: boolean }

const routingTools: RoutingTool[] = [
  {
    name: 'geocode',
    description:
      "Look up coordinates for a place name, address, or landmark. Use before planRoute or compileSketch when the rider names somewhere other than \"here\". Results are biased toward the rider's current location.",
    parameters: AgentToolSchemas.geocode as any,
    parallelSafe: true,
  },
  {
    name: 'discoverCorridor',
    description: 'Discover real roads and scenic POIs in the corridor between two points. Returns road names with coordinates and a discoveryStatus field. Check discoveryStatus: if "failed" (0 roads, 0 POIs), fall back to planRoute instead of sketching.',
    parameters: AgentToolSchemas.discoverCorridor as any,
    parallelSafe: true,
  },
  {
    name: 'createRouteSketch',
    description:
      "Create a high-level route itinerary by specifying road segments (think \"take Highway 5 to Highway 405 to PCH\"). Use this when the rider asks to avoid specific roads (\"avoid Highway 1\") or requests a particular route (\"take Skyline Blvd\"). After creating the sketch, call compileSketch with start/end coordinates to generate the precise route.",
    parameters: AgentToolSchemas.createRouteSketch as any,
    parallelSafe: true,
  },
  {
    name: 'compileSketch',
    description:
      "Convert a route sketch into a precise route with geometry from Google Maps. Call geocode first if you need coordinates for start/end points. This validates that your sketch roads actually connect and returns detailed turn-by-turn geometry. If routing fails, revise your sketch and try again.",
    parameters: AgentToolSchemas.compileSketch as any,
    parallelSafe: false,
  },
  {
    name: 'planRoute',
    description:
      "Plan a motorcycle route with 2-3 scenic options using the deterministic orchestrator. Call geocode first if you need coordinates for the start or end. Use the rider's current location (given in the system prompt) as start when they say \"here\" or don't specify. For refinements, consider using createRouteSketch + compileSketch for more control.",
    parameters: AgentToolSchemas.planRoute as any,
    parallelSafe: false,
  },
]

const routingParallelSafeTools = new Set(routingTools.filter(t => t.parallelSafe).map(t => t.name))

// -----------------------------------------------------------------------------
// Tool Dispatcher
// -----------------------------------------------------------------------------

export async function executeRoutingTool(
  ctx: AgentContext,
  call: ToolCall,
  executeCtx?: ExecuteContext
): Promise<unknown> {
  const validated = validateToolCall(routingTools, call)

  // Notify caller that tool is starting; capture any pending card messageId
  let pendingMessageId: Id<'session_messages'> | undefined
  if (executeCtx?.onToolStart) {
    const startResult = await executeCtx.onToolStart(call.name, validated)
    if (startResult) {
      pendingMessageId = startResult.messageId
    }
  }

  let result: unknown
  try {
    switch (call.name) {
      case 'geocode':
        result = await runGeocode(ctx, validated)
        break
      case 'discoverCorridor':
        result = await runDiscoverCorridor(ctx, validated)
        break
      case 'createRouteSketch':
        result = await runCreateRouteSketch(ctx, validated)
        break
      case 'compileSketch':
        result = await runCompileSketch(ctx, validated)
        break
      case 'planRoute':
        result = await runPlanRoute(ctx, validated)
        break
      default:
        result = { type: 'error', message: `Unknown tool: ${call.name}` }
    }
  } catch (err) {
    // Re-throw after notifying so the agent loop's error handler still fires
    if (executeCtx?.onToolFinish) {
      await executeCtx.onToolFinish(call.id, call.name, pendingMessageId, {
        type: 'error',
        message: err instanceof Error ? err.message : String(err),
        hint: "An unexpected error occurred. Ask the rider what they'd like to do.",
        retryGuidance: 'ask_rider',
      })
    }
    throw err
  }

  if (executeCtx?.onToolFinish) {
    await executeCtx.onToolFinish(call.id, call.name, pendingMessageId, result)
  }

  return result
}

// -----------------------------------------------------------------------------
// Routing Prompt
// -----------------------------------------------------------------------------

/**
 * Build the routing sub-agent system prompt.
 * Phase 1 only — no enrichment instructions.
 */
export function buildRoutingPrompt(ctx: AgentContext): string {
  let locBlock: string
  if (ctx.currentLocation) {
    locBlock = `The rider's current location is lat=${ctx.currentLocation.lat}, lng=${ctx.currentLocation.lng}. Use this as the default origin when the rider asks for a route without specifying where they're starting from. Do NOT ask "where are you starting from?" when this location is available — just use it.`
  } else {
    locBlock = `Rider's current location: unknown — ask where they are starting from before planning a route.`
  }

  return `You are an expert motorcycle navigator with strong opinions about the best routes — think of yourself as a local who has ridden every road in the area. Be concise — 1-2 sentences per response. Use 2nd person ("your ride", "you'll see").

${locBlock}

## Your Job: Author Routes, Don't Just Transcribe Them

For ANY route request — even generic ones like "scenic 2-hour ride" or "take me somewhere fun" — your job is to pick great roads and author a route sketch.

### Phase 1: Discover → Pick → Sketch → Compile

Get a route on the map ASAP so the rider can see it and decide. ALWAYS discover real roads first before sketching.

**Workflow**:
1. If the rider names a place (not "here"), call geocode first to get coordinates.
2. Call discoverCorridor with start/end to see what roads and POIs exist.
3. Check discoveryStatus: if "failed" (0 roads, 0 POIs), immediately call planRoute instead — do not attempt to sketch.
4. PICK roads from discovery results based on the rider's intent:
   - "scenic" → roads near peaks, passes, viewpoints
   - "avoid highways" → skip motorway/trunk class roads
   - "take Skyline Blvd" → use road name directly from discovery or geocode results
5. Author createRouteSketch using real road names + coordinates from discovery.
   - ALL anchor points MUST have lat/lng from discovery or geocode
   - Use road endpoints as segment fromName/toName anchor coordinates
   - Use POI coordinates for landmark/pass anchors
6. Call compileSketch to generate the route.
7. Present in 1-2 sentences.

That's 3-4 tool calls.

**Uncertainty fallback**: If discovery returns few roads (0-2 roads), empty POIs, or you're genuinely unsure about an area, fall back to planRoute instead of sketching. DO NOT create a sketch without real coordinates from discovery.

**IMPORTANT: If a tool call fails with a validation error, fix the arguments and retry. Do NOT give up after one failure.**

**How to author a sketch**:
- Fill in segments with specific road names: roadName, fromName, toName
- Use viaNames to include intermediate landmarks along each road — e.g., "Skeggs Point" on Skyline Blvd — these pin the route to the roads you intend
- Add anchorPoints for key junctions, towns, passes, or landmarks along the route
- Each anchorPoint kind MUST be one of: "town", "junction", "landmark", "pass" — use "landmark" for parks, scenic spots, restaurants, or anything that isn't a town/junction/pass
- ALL anchor points MUST have lat/lng coordinates from discovery or geocode results

**Avoidances**: When the rider says "avoid Highway 1" or "skip the freeway," route around it in your sketch using alternative roads — no avoidRoads API parameter is needed. Just don't include that road in your segments.

**Segment retry (CRITICAL)**: When compileSketch returns a partial_route error:
- Call compileSketch AGAIN with a revised sketch that keeps the succeeded segments IDENTICAL (same roadName, fromName, toName)
- Only change the failed segments — try different fromName/toName endpoints or add viaNames to pin the road
- Do NOT call createRouteSketch to start over — compileSketch caches succeeded segments and only re-routes the failed ones
- If the same segment fails 3 times, fall back to planRoute for that leg

**Examples**:
- "Scenic ride to Santa Cruz" → geocode("Santa Cruz") → discoverCorridor → createRouteSketch with Skyline Blvd + Highway 9 (using discovered coordinates) → compileSketch → done
- "Avoid Highway 1, get to Santa Cruz" → discoverCorridor → pick inland roads (CA-17, CA-35) from results → createRouteSketch → compileSketch → done
- "Scenic ride through rural Montana" → discoverCorridor → if few roads found, fall back to planRoute

**Presentation**:
- 1-2 sentences, highlight scenic features, road types, rough duration.
- Never expose tool names or technical details to the rider.

**Errors**: suggest what the rider can try next without surfacing internals.

When done, respond with a JSON summary:
{"status": "route_ready", "routePlanId": "<id>", "summary": "<1-2 sentence summary>"}
OR if clarification needed:
{"status": "needs_clarification", "question": "<what you need to know>"}
OR if failed:
{"status": "failed", "reason": "<why it failed>"}`
}

// -----------------------------------------------------------------------------
// Main Entry Point
// -----------------------------------------------------------------------------

/**
 * Execute the routing sub-agent.
 * Owns route creation: geocoding, sketch authoring, compilation, and planRoute fallback.
 */
export async function executeRoutingAgent(config: SubAgentConfig): Promise<RoutingAgentResult> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured')
  }

  const { ctx, executeCtx, budgetTracker, userMessage } = config

  // Routing agent uses Haiku — narrower tool set and focused prompt compensate for smaller model
  // Sonnet for routing — Haiku generates vague waypoint names ("Summit area")
  // that geocode to wrong locations. Sonnet produces precise names that work.
  const model = getModel('anthropic', 'claude-sonnet-4-6' as any)

  const systemPrompt = buildRoutingPrompt(ctx)

  const context = {
    systemPrompt,
    // Sub-agent gets NO conversation history — only the current user message
    messages: [
      { role: 'user' as const, content: userMessage, timestamp: Date.now() },
    ],
    tools: routingTools,
  }

  const result = await runAgent({
    model,
    context,
    executor: (call: ToolCall) => executeRoutingTool(ctx, call, executeCtx),
    callbacks: executeCtx ? {
      onToolStart: executeCtx.onToolStart,
      onToolFinish: executeCtx.onToolFinish,
      onAgentTurn: executeCtx.onAgentTurn,
      onToolResultPiMessage: executeCtx.onToolResultPiMessage,
      // NOT forwarding onTextDelta or onThinkingDelta — sub-agent text doesn't stream to UI
    } : undefined,
    maxSteps: 20, // uncapped for now — levelsetting resource needs
    timeoutMs: 300_000, // 5 min — uncapped for levelsetting
    budgetTracker,
    parallelSafeTools: routingParallelSafeTools,
  })

  // Determine result from tool results and response text
  const { extractRouteAttachments } = await import('../ridePlanningAgent')
  const attachments = extractRouteAttachments(result.toolResults)

  if (attachments.length > 0 && attachments[0].routePlanId) {
    const summary = result.response || 'Route ready!'
    return {
      status: 'route_ready',
      routePlanId: attachments[0].routePlanId,
      summary,
    }
  }

  if (result.response && result.toolResults.length === 0) {
    // Agent responded with text but no tool calls — needs clarification
    return {
      status: 'needs_clarification',
      question: result.response,
    }
  }

  // Try to parse structured result from response text
  if (result.response) {
    try {
      const parsed = JSON.parse(result.response)
      if (parsed.status === 'route_ready' && parsed.routePlanId) {
        return { status: 'route_ready', routePlanId: parsed.routePlanId, summary: parsed.summary ?? '' }
      }
      if (parsed.status === 'needs_clarification' && parsed.question) {
        return { status: 'needs_clarification', question: parsed.question }
      }
      if (parsed.status === 'failed') {
        return { status: 'failed', reason: parsed.reason ?? 'Unknown failure' }
      }
    } catch {
      // Not JSON — fall through
    }

    return {
      status: 'needs_clarification',
      question: result.response,
    }
  }

  return {
    status: 'failed',
    reason: 'Routing agent did not produce a route or response',
  }
}
