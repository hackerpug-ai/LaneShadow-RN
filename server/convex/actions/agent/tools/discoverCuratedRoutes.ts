import { v } from 'convex/values'
import { internal } from '../../_generated/api'
import type { AgentContext } from '../types'
import type { ToolCall } from '@mariozechner/pi-ai'
import { validateToolCall } from '../validateToolCall'

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
  args: { intent: typeof discoverCuratedRoutesArgsValidator['shape'] },
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
  const { routePlanId } = await ctx.runMutation(internal.db.routePlans.createForAgentInternal, {
    clerkUserId: ctx.clerkUserId,
    planningSessionId: ctx.planningSessionId,
    planInput: {
      start: args.intent.center || { lat: 0, lng: 0 },
      end: args.intent.center || { lat: 0, lng: 0 },
      departureTime: Date.now(),
      preferences: { scenicBias: 'default', avoidHighways: false, avoidTolls: false },
    },
    startLabel: 'Curated discovery',
    endLabel: curatedRoutes[0]?.name,
  })

  // Build the result options from curated routes
  const options = curatedRoutes.map(route => {
    // Normalize scores from 0-100 scale to 0-1 scale as required
    const normalizeScore = (score: number) => Math.min(Math.max(score / 100, 0), 1)
    
    return {
      routeOptionId: `curated-${route.routeId}`,
      label: route.name,
      rationale: route.summary || `Curated ${route.primaryArchetype} route in ${route.state}`,
      stats: {
        distanceMeters: (route.distanceMi || 0) * 1609.344, // Convert miles to meters
        durationSeconds: 0, // Not available for curated routes
        legsCount: 0, // Not available for curated routes
      },
      // Preserve composite + per-dimension scores on 0-1 scale
      scores: {
        composite: normalizeScore(route.score || 0),
        dimensions: {
          scenery: normalizeScore(route.scores?.scenery || 0),
          curvature: normalizeScore(route.scores?.curvature || 0),
          elevation: normalizeScore(route.scores?.elevation || 0),
          traffic: normalizeScore(route.scores?.traffic || 0),
          pavement: normalizeScore(route.scores?.pavement || 0),
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

// Helper function to map UI archetypes to database archetypes
function uiArchetypeToDbSet(uiArchetype: string): string[] {
  const UI_TO_DB: Record<string, string[]> = {
    scenic: ['scenic_byway', 'coastal'],
    technical: ['mountain'],
    cruising: ['scenic_byway'],
    sport: ['twisties'],
    adventure: ['adventure', 'desert'],
    twisties: ['twisties'],
  }
  
  return UI_TO_DB[uiArchetype] || []
}

// Helper function to encode centroid as polyline (single point fallback)
function encodeCentroidToPolyline(lat: number, lng: number): string {
  // This is a simplified implementation - in a real scenario you'd use @mapbox/polyline
  // For now, return a basic encoded polyline representing a single point
  const latitude = lat * 1000000
  const longitude = lng * 1000000
  
  // Simplified encoding for demonstration
  const result = []
  let resultLat = 0
  let resultLng = 0
  
  const deltaLat = latitude - resultLat
  const deltaLng = longitude - resultLng
  
  resultLat += deltaLat
  resultLng += deltaLng
  
  // Basic polyline encoding (simplified)
  return 'b' + Math.floor(resultLat).toString(36) + Math.floor(resultLng).toString(36)
}

export async function executeDiscoverCuratedRoutes(
  ctx: AgentContext,
  call: ToolCall,
): Promise<DiscoverCuratedRoutesResult> {
  const validated = validateToolCall([discoverCuratedRoutesSchema], call)
  const intent = (validated as { intent: typeof discoverCuratedRoutesArgsValidator['shape'] }).intent
  
  return runDiscoverCuratedRoutes(ctx, { intent })
}

// Export types
export type DiscoverCuratedRoutesResult = typeof discoverCuratedRoutesResultValidator['shape']