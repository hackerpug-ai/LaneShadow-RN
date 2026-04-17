// VALIDATION ONLY — remove before production migration
import { query } from "./_generated/server";
import { geospatial } from "./geospatialIndex";

/**
 * Validation queries for geospatial index performance
 *
 * These queries validate that nearest-neighbor and rectangular range queries
 * perform within acceptable latency (< 500ms) on the Convex deployment.
 */

export const validateNearestNeighbor = query({
  args: {},
  handler: async (ctx) => {
    const start = Date.now();

    // Query for nearest 10 routes to Nashville, TN
    const results = await geospatial.nearest(ctx, {
      point: { latitude: 36.17, longitude: -86.78 },
      limit: 10,
    });

    const latency_ms = Date.now() - start;
    const status = results.length >= 1 && latency_ms < 500 ? "PASS" : "FAIL";

    return {
      status,
      latency_ms,
      count: results.length,
      query: "nearest-neighbor",
      target: "Nashville, TN",
    };
  },
});

export const validateRectangularRange = query({
  args: {},
  handler: async (ctx) => {
    const start = Date.now();

    // Query for routes in a ~200mi x 200mi box over the Southeast US
    const results = await geospatial.query(ctx, {
      shape: {
        type: "rectangle",
        rectangle: {
          west: -89.0,  // Extended to include Tennessee
          south: 34.0,  // Extended to include Tennessee/North Carolina
          east: -82.0,  // Extended to include North Carolina
          north: 38.0,  // Extended to include Tennessee
        },
      },
      limit: 100,
    });

    const latency_ms = Date.now() - start;
    const status = results.results.length >= 1 && latency_ms < 500 ? "PASS" : "FAIL";

    return {
      status,
      latency_ms,
      count: results.results.length,
      query: "rectangular-range",
      bounds: "Southeast US box",
    };
  },
});

export const debugGeospatialData = query({
  args: {},
  handler: async (ctx) => {
    // Count how many routes are in the geospatial index
    const allRoutes = await geospatial.query(ctx, {
      shape: {
        type: "rectangle",
        rectangle: {
          west: -180,
          south: -90,
          east: 180,
          north: 90,
        },
      },
      limit: 1000,
    });

    return {
      total_in_index: allRoutes.results.length,
      has_more: allRoutes.nextCursor !== undefined,
    };
  },
});
