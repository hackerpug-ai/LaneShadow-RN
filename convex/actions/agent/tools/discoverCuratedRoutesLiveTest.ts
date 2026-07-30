'use node'

import polyline from '@mapbox/polyline'
import { v } from 'convex/values'
import { internal } from '../../../_generated/api'
import type { Id } from '../../../_generated/dataModel'
import { internalAction } from '../../../_generated/server'
import type { AgentContext } from '../ridePlanningAgent'
import { executeDiscoverCuratedRoutes } from './discoverCuratedRoutes'

type OptionGeometrySummary = {
  routeOptionId: string
  routeId: string
  geometryValue: string
  precision: number
  pointCount: number
  overviewSegmentsCount: number
}

type LiveDiscoverySmokeResult = {
  type: string
  routePlanId?: Id<'route_plans'>
  status?: string
  optionsCount: number
  optionIds: string[]
  optionLabels: string[]
  firstOptionGeometryFormat?: string
  optionGeometries: OptionGeometrySummary[]
}

function summarizeOptionGeometry(option: any): OptionGeometrySummary | null {
  const routeOptionId = typeof option?.routeOptionId === 'string' ? option.routeOptionId : ''
  const routeId = routeOptionId.startsWith('curated-')
    ? routeOptionId.slice('curated-'.length)
    : routeOptionId
  const overview = option?.map?.overviewGeometry
  if (!overview || typeof overview.value !== 'string') return null

  const precision = typeof overview.precision === 'number' ? overview.precision : 5
  let pointCount = 0
  try {
    const segments = option?.map?.overviewSegments
    if (Array.isArray(segments) && segments.length > 0) {
      for (const seg of segments) {
        pointCount += polyline.decode(seg, precision).length
      }
    } else {
      pointCount = polyline.decode(overview.value, precision).length
    }
  } catch {
    pointCount = 0
  }

  return {
    routeOptionId,
    routeId,
    geometryValue: overview.value,
    precision,
    pointCount,
    overviewSegmentsCount: Array.isArray(option?.map?.overviewSegments)
      ? option.map.overviewSegments.length
      : 0,
  }
}

export const runLiveDiscoverySmoke: any = internalAction({
  args: {
    clerkUserId: v.string(),
    archetypes: v.optional(v.array(v.string())),
    state: v.optional(v.string()),
    sort: v.optional(v.union(v.literal('best'), v.literal('nearest'))),
    limit: v.optional(v.number()),
    center: v.optional(v.object({ lat: v.number(), lng: v.number() })),
  },
  returns: v.object({
    type: v.string(),
    routePlanId: v.optional(v.id('route_plans')),
    status: v.optional(v.string()),
    optionsCount: v.number(),
    optionIds: v.array(v.string()),
    optionLabels: v.array(v.string()),
    firstOptionGeometryFormat: v.optional(v.string()),
    optionGeometries: v.array(
      v.object({
        routeOptionId: v.string(),
        routeId: v.string(),
        geometryValue: v.string(),
        precision: v.number(),
        pointCount: v.number(),
        overviewSegmentsCount: v.number(),
      }),
    ),
  }),
  handler: async (ctx, args): Promise<LiveDiscoverySmokeResult> => {
    const agentCtx: AgentContext = {
      planningSessionId: undefined as unknown as Id<'planning_sessions'>,
      clerkUserId: args.clerkUserId,
      piMessages: [],
      runQuery: async (_ref, queryArgs) => {
        if (
          queryArgs &&
          typeof queryArgs === 'object' &&
          'limit' in queryArgs &&
          'sort' in queryArgs
        ) {
          return ctx.runQuery((internal as any).curatedRoutes.listCuratedRoutesInternal, queryArgs)
        }
        return ctx.runQuery(_ref as any, queryArgs as any)
      },
      runMutation: ctx.runMutation.bind(ctx),
      runAction: ctx.runAction.bind(ctx),
    }

    const intent: Record<string, unknown> = {
      sort: args.sort ?? 'best',
      limit: args.limit ?? 5,
    }
    if (args.archetypes && args.archetypes.length > 0) {
      intent.archetypes = args.archetypes
    }
    if (args.state) intent.state = args.state
    if (args.center) intent.center = args.center

    const result = await executeDiscoverCuratedRoutes(agentCtx, {
      type: 'toolCall',
      id: `discovery-live-${Date.now()}`,
      name: 'discoverCuratedRoutes',
      arguments: { intent },
    } as any)

    if (result.type !== 'routes') {
      return {
        type: result.type,
        optionsCount: 0,
        optionIds: [],
        optionLabels: [],
        optionGeometries: [],
      }
    }

    const plan: any = await ctx.runQuery(internal.db.routePlans.getPlanByIdInternal, {
      routePlanId: result.routePlanId,
    })
    const options = Array.isArray((plan?.result as any)?.options)
      ? (plan?.result as any).options
      : []

    const optionGeometries = options
      .map(summarizeOptionGeometry)
      .filter((g: OptionGeometrySummary | null): g is OptionGeometrySummary => g != null)

    return {
      type: result.type,
      routePlanId: result.routePlanId,
      status: plan?.status,
      optionsCount: options.length,
      optionIds: options.map((option: any) => option.routeOptionId).filter(Boolean),
      optionLabels: options.map((option: any) => option.label).filter(Boolean),
      firstOptionGeometryFormat: options[0]?.map?.overviewGeometry?.format,
      optionGeometries,
    }
  },
})
