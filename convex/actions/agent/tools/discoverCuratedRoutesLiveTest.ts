'use node'

import { v } from 'convex/values'
import { internal } from '../../../_generated/api'
import type { Id } from '../../../_generated/dataModel'
import { internalAction } from '../../../_generated/server'
import type { AgentContext } from '../ridePlanningAgent'
import { executeDiscoverCuratedRoutes } from './discoverCuratedRoutes'

type LiveDiscoverySmokeResult = {
  type: string
  routePlanId?: Id<'route_plans'>
  status?: string
  optionsCount: number
  optionIds: string[]
  optionLabels: string[]
  firstOptionGeometryFormat?: string
}

export const runLiveDiscoverySmoke: any = internalAction({
  args: {
    clerkUserId: v.string(),
    archetypes: v.array(v.string()),
    state: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.object({
    type: v.string(),
    routePlanId: v.optional(v.id('route_plans')),
    status: v.optional(v.string()),
    optionsCount: v.number(),
    optionIds: v.array(v.string()),
    optionLabels: v.array(v.string()),
    firstOptionGeometryFormat: v.optional(v.string()),
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

    const result = await executeDiscoverCuratedRoutes(agentCtx, {
      type: 'toolCall',
      id: `discovery-live-${Date.now()}`,
      name: 'discoverCuratedRoutes',
      arguments: {
        intent: {
          archetypes: args.archetypes,
          state: args.state,
          sort: 'best',
          limit: args.limit ?? 5,
        },
      },
    } as any)

    if (result.type !== 'routes') {
      return {
        type: result.type,
        optionsCount: 0,
        optionIds: [],
        optionLabels: [],
      }
    }

    const plan: any = await ctx.runQuery(internal.db.routePlans.getPlanByIdInternal, {
      routePlanId: result.routePlanId,
    })
    const options = Array.isArray((plan?.result as any)?.options)
      ? (plan?.result as any).options
      : []

    return {
      type: result.type,
      routePlanId: result.routePlanId,
      status: plan?.status,
      optionsCount: options.length,
      optionIds: options.map((option: any) => option.routeOptionId).filter(Boolean),
      optionLabels: options.map((option: any) => option.label).filter(Boolean),
      firstOptionGeometryFormat: options[0]?.map?.overviewGeometry?.format,
    }
  },
})
