/**
 * OSM Data Import Mutations
 *
 * Internal mutations for bulk importing OSM nodes and ways from ETL pipeline.
 * Uses upsert pattern (insert or update) to handle re-imports.
 */

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Bulk import OSM nodes (scenic waypoints)
 * Uses upsert pattern: updates existing records by osmId, inserts new ones
 */
export const importNodes = internalMutation({
  args: { nodes: v.array(v.any()) },
  handler: async (ctx, args) => {
    let inserted = 0;
    let updated = 0;

    for (const node of args.nodes) {
      const existing = await ctx.db
        .query("osm_nodes")
        .withIndex("by_osmId", (q) => q.eq("osmId", node.osmId))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, node);
        updated++;
      } else {
        await ctx.db.insert("osm_nodes", node);
        inserted++;
      }
    }

    return { inserted, updated, total: args.nodes.length };
  },
});

/**
 * Bulk import OSM ways (roads)
 * Uses upsert pattern: updates existing records by osmId, inserts new ones
 */
export const importWays = internalMutation({
  args: { ways: v.array(v.any()) },
  handler: async (ctx, args) => {
    let inserted = 0;
    let updated = 0;

    for (const way of args.ways) {
      const existing = await ctx.db
        .query("osm_ways")
        .withIndex("by_osmId", (q) => q.eq("osmId", way.osmId))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, way);
        updated++;
      } else {
        await ctx.db.insert("osm_ways", way);
        inserted++;
      }
    }

    return { inserted, updated, total: args.ways.length };
  },
});

/**
 * Create or update an import job record
 */
export const upsertImportJob = internalMutation({
  args: {
    region: v.string(),
    sourceUrl: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed")
    ),
    nodesImported: v.optional(v.number()),
    waysImported: v.optional(v.number()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check for existing job for this region
    const existing = await ctx.db
      .query("osm_import_jobs")
      .filter((q) => q.eq(q.field("region"), args.region))
      .first();

    if (existing) {
      const isComplete = args.status === "completed" || args.status === "failed";
      return await ctx.db.patch(existing._id, {
        status: args.status,
        error: args.error,
        ...(isComplete && { completedAt: now }),
        nodesImported: args.nodesImported,
        waysImported: args.waysImported,
      });
    } else {
      return await ctx.db.insert("osm_import_jobs", {
        ...args,
        startedAt: now,
        nodesImported: args.nodesImported ?? 0,
        waysImported: args.waysImported ?? 0,
      });
    }
  },
});
