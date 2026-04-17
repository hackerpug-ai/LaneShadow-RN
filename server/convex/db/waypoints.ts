import { mutation, query } from '../_generated/server'
import { v } from 'convex/values'

/**
 * Create a new waypoint
 */
export const createWaypoint = mutation({
  args: {
    routePlanId: v.id('route_plans'),
    kind: v.union(v.literal('on_route'), v.literal('off_route')),
    location: v.object({
      lat: v.number(),
      lng: v.number(),
    }),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    order: v.optional(v.number()),
    detourInfo: v.optional(
      v.object({
        distanceKm: v.number(),
        durationMinutes: v.number(),
        reason: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const waypointId = await ctx.db.insert('waypoints', {
      routePlanId: args.routePlanId,
      kind: args.kind,
      status: 'pending',
      location: args.location,
      name: args.name,
      description: args.description,
      order: args.order,
      detourInfo: args.detourInfo,
      createdAt: now,
      updatedAt: now,
    })
    return await ctx.db.get(waypointId)
  },
})

/**
 * Get a single waypoint by ID
 */
export const getWaypoint = query({
  args: {
    waypointId: v.id('waypoints'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.waypointId)
  },
})

/**
 * List all waypoints for a route plan
 */
export const listWaypointsByRoutePlan = query({
  args: {
    routePlanId: v.id('route_plans'),
  },
  handler: async (ctx, args) => {
    const waypoints = await ctx.db
      .query('waypoints')
      .withIndex('by_routePlanId', (q) => q.eq('routePlanId', args.routePlanId))
      .collect()
    return waypoints
  },
})

/**
 * List waypoints by route plan and status
 */
export const listWaypointsByRoutePlanAndStatus = query({
  args: {
    routePlanId: v.id('route_plans'),
    status: v.union(
      v.literal('pending'),
      v.literal('evaluating'),
      v.literal('ready'),
      v.literal('approved'),
      v.literal('rejected'),
      v.literal('applied')
    ),
  },
  handler: async (ctx, args) => {
    const waypoints = await ctx.db
      .query('waypoints')
      .withIndex('by_routePlanId_and_status', (q) =>
        q.eq('routePlanId', args.routePlanId).eq('status', args.status)
      )
      .collect()
    return waypoints
  },
})

/**
 * List all waypoints by status across all route plans
 */
export const listWaypointsByStatus = query({
  args: {
    status: v.union(
      v.literal('pending'),
      v.literal('evaluating'),
      v.literal('ready'),
      v.literal('approved'),
      v.literal('rejected'),
      v.literal('applied')
    ),
  },
  handler: async (ctx, args) => {
    // Since we don't have a status-only index, we need to scan
    // This is acceptable for admin/monitoring queries
    const waypoints = await ctx.db
      .query('waypoints')
      .filter((q) => q.eq(q.field('status'), args.status))
      .collect()
    return waypoints
  },
})

/**
 * Update a waypoint
 */
export const updateWaypoint = mutation({
  args: {
    waypointId: v.id('waypoints'),
    status: v.optional(
      v.union(
        v.literal('pending'),
        v.literal('evaluating'),
        v.literal('ready'),
        v.literal('approved'),
        v.literal('rejected'),
        v.literal('applied')
      )
    ),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    order: v.optional(v.number()),
    detourInfo: v.optional(
      v.object({
        distanceKm: v.number(),
        durationMinutes: v.number(),
        reason: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { waypointId, ...updates } = args
    const existing = await ctx.db.get(waypointId)
    if (!existing) {
      throw new Error('Waypoint not found')
    }
    await ctx.db.patch(waypointId, {
      ...updates,
      updatedAt: Date.now(),
    })
    return await ctx.db.get(waypointId)
  },
})

/**
 * Delete a waypoint
 */
export const deleteWaypoint = mutation({
  args: {
    waypointId: v.id('waypoints'),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.waypointId)
    if (!existing) {
      throw new Error('Waypoint not found')
    }
    await ctx.db.delete(args.waypointId)
    return { success: true }
  },
})
