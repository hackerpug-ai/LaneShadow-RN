'use node'

import { v } from 'convex/values'
import { internal } from '../../../_generated/api'
import type { AgentContext } from '../ridePlanningAgent'
import type { ToolCall } from '@mariozechner/pi-ai'
import { validateToolCall } from '@mariozechner/pi-ai'
import polyline from '@mapbox/polyline'
import { uiArchetypeToDbSet } from '../../../util/archetypeMap'

export const discoverCuratedRoutesArgsValidator = v.object({
  intent: v.object({
    archetypes: v.optional(v.array(v.string())),
    state: v.optional(v.string()),
    center: v.optional(v.object({ lat: v.number(), lng: v.number() })),
    sort: v.optional(v.union(v.literal('best'), v.literal('nearest'))),
    limit: v.optional(v.number()),
  }),
})

export const discoverCuratedRoutesResultValidator = v.union(
  v.object({
    type: v.literal('routes'),
    routePlanId: v.id('route_plans'),
  }),
  v.object({
    type: v.literal('chat'),
    message: v.string(),
  }),
  v.object({
    type: v.literal('error'),
    message: v.string(),
    routePlanId: v.optional(v.id('route_plans')),
  }),
)

export const discoverCuratedRoutesSchema = {
  name: 'discoverCuratedRoutes',
  description:
    'Find curated motorcycle routes based on archetypes, location, and preferences. Returns existing curated routes with scores and geometry information.',
  parameters: discoverCuratedRoutesArgsValidator,
}

async function runDiscoverCuratedRoutes(
  ctx: AgentContext,
  args: { intent: any },
): Promise<DiscoverCuratedRoutesResult> {
  // Rate-limit check (limit configurable via RATE_LIMIT_OVERRIDE env var; 0 = unlimited)
  const usage = await ctx.runQuery(internal.db.planUsage.checkUsageInternal, {
    clerkUserId: ctx.clerkUserId,
  })

  if (!usage.allowed) {
    return {
      type: 'chat',
      message: `You've reached your monthly limit of ${usage.limit} route discoveries. Upgrade to Premium for unlimited discoveries!`,
    }
  }

  // Map UI archetypes to DB archetype set
  const dbArchetypeSet = new Set<string>()
  if (args.intent.archetypes && args.intent.archetypes.length > 0) {
    for (const ui of args.intent.archetypes) {
      const dbMappings = uiArchetypeToDbSet(ui as any)
      for (const db of dbMappings) {
        dbArchetypeSet.add(db)
      }
    }
  }

  // Build query parameters for listCuratedRoutes
  const queryArgs: any = {
    limit: args.intent.limit ?? 10,
    sort: args.intent.sort ?? 'best',
  }

  if (args.intent.state) {
    queryArgs.state = args.intent.state
  }

  if (args.intent.center) {
    queryArgs.center = args.intent.center
  }

  if (dbArchetypeSet.size > 0) {
    queryArgs.archetypes = args.intent.archetypes!
  }

  // Call the curated routes API
  const curatedRoutes = await ctx.runQuery(internal.curatedRoutes.listCuratedRoutes, queryArgs)

  if (curatedRoutes.length === 0) {
    // No matches found - return conversational response
    const searchQuery = args.intent.archetypes?.join(', ') || 'routes'
    const location = args.intent.state || args.intent.center ? 
      `in ${args.intent.state || 'your area'}` : 
      'near you'
    
    return {
      type: 'chat',
      message: `I couldn't find any ${searchQuery} routes ${location}. Try a different search or broaden your criteria.`,
    }
  }

  // Persist a route_plans row for the curated routes
  // Use the centroid as both start and end since this is a single-point discovery, not a trip
  const centerPoint = args.intent.center || { lat: 0, lng: 0 }
  const planInput = {
    start: {
      lat: centerPoint.lat,
      lng: centerPoint.lng,
      label: 'Curated discovery',
    },
    end: {
      lat: centerPoint.lat,
      lng: centerPoint.lng,
      label: curatedRoutes[0]?.name || 'Discovery',
    },
    departureTime: Date.now(),
    preferences: { scenicBias: 'default', avoidHighways: false, avoidTolls: false },
  }

  const { routePlanId } = await ctx.runMutation(internal.db.routePlans.createForAgentInternal, {
    clerkUserId: ctx.clerkUserId,
    planningSessionId: ctx.planningSessionId,
    planInput,
    startLabel: 'Curated discovery',
    endLabel: curatedRoutes[0]?.name || 'Discovery',
  })

  // Build the result options from curated routes
  const options = curatedRoutes.map((route: any) => {
        return {
      routeOptionId: `curated-${route.routeId}`,
      label: route.name,
      rationale: route.summary || `Curated ${route.primaryArchetype} route in ${route.state}`,
      stats: {
        distanceMeters: (route.distanceMi || 0) * 1609.344, // Convert miles to meters
        durationSeconds: 0, // Not available for curated routes
        legsCount: 0, // Not available for curated routes
      },
      // Preserve composite + per-dimension scores on 0-1 scale (already normalized)
      scores: {
        composite: route.score || 0, // already 0-1
        dimensions: {
          scenery: route.scores?.scenery || 0, // already 0-1
          curvature: route.scores?.curvature || 0, // already 0-1
          elevation: route.scores?.elevation || 0, // already 0-1
          traffic: route.scores?.traffic || 0, // already 0-1
          pavement: route.scores?.pavement || 0, // already 0-1
        }
      },
    map: {
      bounds: {
        north: route.centroidLat + 0.5, // Fallback bounds
        south: route.centroidLat - 0.5,
        east: route.centroidLng + 0.5,
        west: route.centroidLng - 0.5,
      },
      overviewGeometry: encodeCentroidToPolyline(route.centroidLat, route.centroidLng),
      legs: [], // No detailed legs for curated routes
      overlays: {},
    },
      overlaysPreview: {
        windSummary: 'unavailable',
        rainSummary: 'unavailable',
        temperatureSummary: 'unavailable',
        conditionsStatus: 'unavailable',
      },
    }
  })

  // Update the route plan with completed status
  await ctx.runMutation(internal.db.routePlans.updatePlanStatus, {
    routePlanId,
    status: 'completed',
    result: {
      planId: routePlanId,
      options,
    },
  })

  return { type: 'routes', routePlanId }
}

// Helper function to encode centroid as polyline (single point fallback)
function encodeCentroidToPolyline(lat: number, lng: number): string {
  return polyline.encode([[lat, lng]])
}

export async function executeDiscoverCuratedRoutes(
  ctx: AgentContext,
  call: ToolCall,
): Promise<DiscoverCuratedRoutesResult> {
  const validated = validateToolCall([discoverCuratedRoutesSchema], call) as any
  const intent = validated.intent
  
  return runDiscoverCuratedRoutes(ctx, { intent })
}

// Export types
export type DiscoverCuratedRoutesResult = any