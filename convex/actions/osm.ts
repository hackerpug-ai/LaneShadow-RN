/**
 * OSM Actions
 *
 * Fast, reliable OSM data queries from Convex database.
 * Replaces slow Overpass API calls for road verification and scenic waypoint discovery.
 */

'use node';

import { internalAction } from '../_generated/server';
import { v } from 'convex/values';
import { internal } from '../_generated/api';
import type { OsmNode, OsmWay } from '../../models/osm-data';

/**
 * Query OSM nodes within a bounding box
 *
 * Filters by bbox and optionally by node type (viewpoint, peak, mountain_pass).
 */
export const queryNodesInBbox = internalAction({
  args: {
    bounds: v.object({
      south: v.number(),
      west: v.number(),
      north: v.number(),
      east: v.number(),
    }),
    types: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args): Promise<OsmNode[]> => {
    const { bounds, types } = args;

    // Query all nodes (no S2 optimization yet)
    const allNodes = await ctx.runQuery(internal.queries.osm.listAllNodes);

    // Filter by bbox
    const inBbox = allNodes.filter(
      (n) =>
        n.lat >= bounds.south &&
        n.lat <= bounds.north &&
        n.lon >= bounds.west &&
        n.lon <= bounds.east
    );

    // Filter by type if specified
    if (types && types.length > 0) {
      return inBbox.filter((n) => types.includes(n.type));
    }

    return inBbox;
  },
});

/**
 * Query OSM ways within a bounding box
 *
 * Filters by bbox intersection and optionally by highway class.
 */
export const queryWaysInBbox = internalAction({
  args: {
    bounds: v.object({
      south: v.number(),
      west: v.number(),
      north: v.number(),
      east: v.number(),
    }),
    highwayClasses: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args): Promise<OsmWay[]> => {
    const { bounds, highwayClasses } = args;

    // Query all ways
    const allWays = await ctx.runQuery(internal.queries.osm.listAllWays);

    // Filter by bbox intersection
    const inBbox = allWays.filter(
      (w) =>
        w.bounds.south <= bounds.north &&
        w.bounds.north >= bounds.south &&
        w.bounds.west <= bounds.east &&
        w.bounds.east >= bounds.west
    );

    // Filter by highway class if specified
    if (highwayClasses && highwayClasses.length > 0) {
      return inBbox.filter((w) => w.highwayClass && highwayClasses.includes(w.highwayClass));
    }

    return inBbox;
  },
});

/**
 * Query OSM ways by exact name match within a bounding box
 *
 * Uses name index for fast lookups, then filters by bbox.
 */
export const queryWaysByName = internalAction({
  args: {
    name: v.string(),
    bounds: v.object({
      south: v.number(),
      west: v.number(),
      north: v.number(),
      east: v.number(),
    }),
  },
  handler: async (ctx, args): Promise<OsmWay[]> => {
    const { name, bounds } = args;

    // Query by name index
    const ways = await ctx.runQuery(internal.queries.osm.listWaysByName, { name });

    // Filter by bbox
    return ways.filter(
      (w) =>
        w.bounds.south <= bounds.north &&
        w.bounds.north >= bounds.south &&
        w.bounds.west <= bounds.east &&
        w.bounds.east >= bounds.west
    );
  },
});

/**
 * Import OSM nodes (public action wrapper)
 *
 * Can be called from scripts or CLI for ETL pipeline.
 */
export const importNodes = internalAction({
  args: { nodes: v.array(v.any()) },
  handler: async (ctx, args): Promise<{ inserted: number; updated: number; total: number }> => {
    return await ctx.runMutation(internal.db.osm.importNodes, args);
  },
});

/**
 * Import OSM ways (public action wrapper)
 *
 * Can be called from scripts or CLI for ETL pipeline.
 */
export const importWays = internalAction({
  args: { ways: v.array(v.any()) },
  handler: async (ctx, args): Promise<{ inserted: number; updated: number; total: number }> => {
    return await ctx.runMutation(internal.db.osm.importWays, args);
  },
});
