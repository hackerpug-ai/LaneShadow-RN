/**
 * OSM Queries
 *
 * Internal queries for OSM data access.
 */

import { internalQuery } from '../_generated/server';
import { v } from 'convex/values';

/**
 * Query all OSM nodes (for action-level filtering)
 */
export const listAllNodes = internalQuery({
  handler: async (ctx) => {
    return await ctx.db.query('osm_nodes').collect();
  },
});

/**
 * Query all OSM ways (for action-level filtering)
 */
export const listAllWays = internalQuery({
  handler: async (ctx) => {
    return await ctx.db.query('osm_ways').collect();
  },
});

/**
 * Query OSM ways by name index
 */
export const listWaysByName = internalQuery({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.query('osm_ways').withIndex('by_name', (q) => q.eq('name', args.name)).collect();
  },
});
