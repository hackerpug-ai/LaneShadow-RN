/**
 * Migration script to fix favorite_roads documents missing userId field
 *
 * Run with: npx convex run fix_favorite_roads
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const fixMissingUserIds = mutation({
  handler: async (ctx) => {
    // Get all favorite_roads documents
    const favoriteRoads = await ctx.db.query("favorite_roads").collect();

    let fixedCount = 0;
    const errors: string[] = [];

    for (const road of favoriteRoads) {
      // Check if clerkUserId is missing or null
      if (!road.clerkUserId) {
        try {
          // Delete documents without userId (they're corrupted)
          await ctx.db.delete(road._id);
          fixedCount++;
          console.log(`Deleted corrupted favorite_road: ${road._id}`);
        } catch (error) {
          errors.push(`Failed to delete ${road._id}: ${error}`);
        }
      }
    }

    return {
      fixed: fixedCount,
      errors,
      message: `Fixed ${fixedCount} corrupted favorite_road documents`,
    };
  },
});

export const checkCorruption = query({
  handler: async (ctx) => {
    const favoriteRoads = await ctx.db.query("favorite_roads").collect();
    const corrupted = favoriteRoads.filter((road) => !road.clerkUserId);

    return {
      total: favoriteRoads.length,
      corrupted: corrupted.length,
      corruptedIds: corrupted.map((r) => r._id),
    };
  },
});
