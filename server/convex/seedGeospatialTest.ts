// VALIDATION ONLY — remove before production migration
import { mutation, query } from "./_generated/server";
import { geospatial } from "./geospatialIndex";

/**
 * Seed 100 test routes with valid coordinates across 5+ US states
 *
 * This is a validation-only mutation to test geospatial query performance.
 * Must be removed before production deployment.
 */

interface TestRoute {
  name: string;
  state: string;
  lat: number;
  lng: number;
}

const TEST_ROUTES: TestRoute[] = [
  // Tennessee (20 routes)
  { name: "Test Route TN-01", state: "TN", lat: 36.17, lng: -86.78 },
  { name: "Test Route TN-02", state: "TN", lat: 35.96, lng: -86.85 },
  { name: "Test Route TN-03", state: "TN", lat: 36.05, lng: -86.92 },
  { name: "Test Route TN-04", state: "TN", lat: 36.12, lng: -86.65 },
  { name: "Test Route TN-05", state: "TN", lat: 35.89, lng: -86.45 },
  { name: "Test Route TN-06", state: "TN", lat: 36.25, lng: -87.05 },
  { name: "Test Route TN-07", state: "TN", lat: 35.78, lng: -86.82 },
  { name: "Test Route TN-08", state: "TN", lat: 36.32, lng: -86.78 },
  { name: "Test Route TN-09", state: "TN", lat: 35.65, lng: -86.58 },
  { name: "Test Route TN-10", state: "TN", lat: 36.45, lng: -87.15 },
  { name: "Test Route TN-11", state: "TN", lat: 35.92, lng: -86.28 },
  { name: "Test Route TN-12", state: "TN", lat: 36.18, lng: -86.95 },
  { name: "Test Route TN-13", state: "TN", lat: 35.85, lng: -87.12 },
  { name: "Test Route TN-14", state: "TN", lat: 36.08, lng: -86.52 },
  { name: "Test Route TN-15", state: "TN", lat: 35.72, lng: -86.88 },
  { name: "Test Route TN-16", state: "TN", lat: 36.28, lng: -86.42 },
  { name: "Test Route TN-17", state: "TN", lat: 35.95, lng: -87.25 },
  { name: "Test Route TN-18", state: "TN", lat: 36.15, lng: -86.68 },
  { name: "Test Route TN-19", state: "TN", lat: 35.82, lng: -86.55 },
  { name: "Test Route TN-20", state: "TN", lat: 36.38, lng: -86.98 },

  // North Carolina (20 routes)
  { name: "Test Route NC-01", state: "NC", lat: 35.78, lng: -80.88 },
  { name: "Test Route NC-02", state: "NC", lat: 35.92, lng: -81.05 },
  { name: "Test Route NC-03", state: "NC", lat: 36.05, lng: -80.95 },
  { name: "Test Route NC-04", state: "NC", lat: 35.65, lng: -81.25 },
  { name: "Test Route NC-05", state: "NC", lat: 36.18, lng: -81.15 },
  { name: "Test Route NC-06", state: "NC", lat: 35.85, lng: -80.75 },
  { name: "Test Route NC-07", state: "NC", lat: 36.25, lng: -81.35 },
  { name: "Test Route NC-08", state: "NC", lat: 35.72, lng: -81.08 },
  { name: "Test Route NC-09", state: "NC", lat: 36.08, lng: -80.82 },
  { name: "Test Route NC-10", state: "NC", lat: 35.95, lng: -81.45 },
  { name: "Test Route NC-11", state: "NC", lat: 36.32, lng: -80.68 },
  { name: "Test Route NC-12", state: "NC", lat: 35.58, lng: -81.18 },
  { name: "Test Route NC-13", state: "NC", lat: 36.15, lng: -81.28 },
  { name: "Test Route NC-14", state: "NC", lat: 35.88, lng: -80.95 },
  { name: "Test Route NC-15", state: "NC", lat: 36.42, lng: -81.02 },
  { name: "Test Route NC-16", state: "NC", lat: 35.68, lng: -80.85 },
  { name: "Test Route NC-17", state: "NC", lat: 36.22, lng: -81.55 },
  { name: "Test Route NC-18", state: "NC", lat: 35.78, lng: -81.38 },
  { name: "Test Route NC-19", state: "NC", lat: 36.05, lng: -80.78 },
  { name: "Test Route NC-20", state: "NC", lat: 35.92, lng: -81.22 },

  // California (20 routes)
  { name: "Test Route CA-01", state: "CA", lat: 36.78, lng: -119.42 },
  { name: "Test Route CA-02", state: "CA", lat: 37.25, lng: -119.65 },
  { name: "Test Route CA-03", state: "CA", lat: 36.95, lng: -119.85 },
  { name: "Test Route CA-04", state: "CA", lat: 37.45, lng: -119.35 },
  { name: "Test Route CA-05", state: "CA", lat: 36.58, lng: -119.95 },
  { name: "Test Route CA-06", state: "CA", lat: 37.15, lng: -119.75 },
  { name: "Test Route CA-07", state: "CA", lat: 36.85, lng: -119.55 },
  { name: "Test Route CA-08", state: "CA", lat: 37.35, lng: -120.05 },
  { name: "Test Route CA-09", state: "CA", lat: 36.68, lng: -119.25 },
  { name: "Test Route CA-10", state: "CA", lat: 37.05, lng: -120.15 },
  { name: "Test Route CA-11", state: "CA", lat: 36.42, lng: -119.68 },
  { name: "Test Route CA-12", state: "CA", lat: 37.55, lng: -119.88 },
  { name: "Test Route CA-13", state: "CA", lat: 36.92, lng: -120.25 },
  { name: "Test Route CA-14", state: "CA", lat: 37.18, lng: -119.45 },
  { name: "Test Route CA-15", state: "CA", lat: 36.75, lng: -120.35 },
  { name: "Test Route CA-16", state: "CA", lat: 37.28, lng: -119.58 },
  { name: "Test Route CA-17", state: "CA", lat: 36.55, lng: -119.82 },
  { name: "Test Route CA-18", state: "CA", lat: 37.42, lng: -120.45 },
  { name: "Test Route CA-19", state: "CA", lat: 36.88, lng: -119.72 },
  { name: "Test Route CA-20", state: "CA", lat: 37.08, lng: -120.28 },

  // Colorado (20 routes)
  { name: "Test Route CO-01", state: "CO", lat: 39.15, lng: -105.78 },
  { name: "Test Route CO-02", state: "CO", lat: 39.25, lng: -106.05 },
  { name: "Test Route CO-03", state: "CO", lat: 39.05, lng: -105.55 },
  { name: "Test Route CO-04", state: "CO", lat: 39.45, lng: -106.25 },
  { name: "Test Route CO-05", state: "CO", lat: 38.95, lng: -105.85 },
  { name: "Test Route CO-06", state: "CO", lat: 39.35, lng: -105.65 },
  { name: "Test Route CO-07", state: "CO", lat: 39.18, lng: -106.45 },
  { name: "Test Route CO-08", state: "CO", lat: 38.85, lng: -105.95 },
  { name: "Test Route CO-09", state: "CO", lat: 39.55, lng: -105.75 },
  { name: "Test Route CO-10", state: "CO", lat: 39.08, lng: -106.15 },
  { name: "Test Route CO-11", state: "CO", lat: 38.78, lng: -106.35 },
  { name: "Test Route CO-12", state: "CO", lat: 39.65, lng: -106.55 },
  { name: "Test Route CO-13", state: "CO", lat: 39.28, lng: -105.48 },
  { name: "Test Route CO-14", state: "CO", lat: 38.92, lng: -106.68 },
  { name: "Test Route CO-15", state: "CO", lat: 39.42, lng: -105.88 },
  { name: "Test Route CO-16", state: "CO", lat: 39.12, lng: -106.85 },
  { name: "Test Route CO-17", state: "CO", lat: 38.68, lng: -105.58 },
  { name: "Test Route CO-18", state: "CO", lat: 39.75, lng: -106.28 },
  { name: "Test Route CO-19", state: "CO", lat: 39.02, lng: -106.08 },
  { name: "Test Route CO-20", state: "CO", lat: 38.85, lng: -106.48 },

  // Texas (20 routes)
  { name: "Test Route TX-01", state: "TX", lat: 30.25, lng: -97.75 },
  { name: "Test Route TX-02", state: "TX", lat: 30.35, lng: -98.05 },
  { name: "Test Route TX-03", state: "TX", lat: 30.15, lng: -97.55 },
  { name: "Test Route TX-04", state: "TX", lat: 30.55, lng: -98.25 },
  { name: "Test Route TX-05", state: "TX", lat: 30.05, lng: -97.85 },
  { name: "Test Route TX-06", state: "TX", lat: 30.45, lng: -97.65 },
  { name: "Test Route TX-07", state: "TX", lat: 30.28, lng: -98.45 },
  { name: "Test Route TX-08", state: "TX", lat: 29.95, lng: -97.95 },
  { name: "Test Route TX-09", state: "TX", lat: 30.65, lng: -97.75 },
  { name: "Test Route TX-10", state: "TX", lat: 30.18, lng: -98.15 },
  { name: "Test Route TX-11", state: "TX", lat: 29.88, lng: -98.35 },
  { name: "Test Route TX-12", state: "TX", lat: 30.75, lng: -98.55 },
  { name: "Test Route TX-13", state: "TX", lat: 30.38, lng: -97.48 },
  { name: "Test Route TX-14", state: "TX", lat: 30.02, lng: -98.68 },
  { name: "Test Route TX-15", state: "TX", lat: 30.52, lng: -97.88 },
  { name: "Test Route TX-16", state: "TX", lat: 30.22, lng: -98.85 },
  { name: "Test Route TX-17", state: "TX", lat: 29.78, lng: -97.58 },
  { name: "Test Route TX-18", state: "TX", lat: 30.85, lng: -98.28 },
  { name: "Test Route TX-19", state: "TX", lat: 30.12, lng: -98.08 },
  { name: "Test Route TX-20", state: "TX", lat: 29.95, lng: -98.48 },
];

export const seedRoutes = mutation({
  args: {},
  handler: async (ctx) => {
    let inserted = 0;

    for (const route of TEST_ROUTES) {
      const routeId = `test-${route.state.toLowerCase()}-${String(inserted + 1).padStart(3, "0")}`;

      // Insert into curated_routes table
      const docId = await ctx.db.insert("curated_routes", {
        routeId,
        name: route.name,
        state: route.state,
        source: "editorial" as const,
        primaryArchetype: "twisties" as const,
        secondaryTags: ["test"],
        centroidLat: route.lat,
        centroidLng: route.lng,
        boundsNeLat: route.lat + 0.1,
        boundsNeLng: route.lng + 0.1,
        boundsSwLat: route.lat - 0.1,
        boundsSwLng: route.lng - 0.1,
        lengthMiles: 50.0,
        compositeScore: 75.0,
        curvatureScore: 75.0,
        scenicScore: 75.0,
        technicalScore: 75.0,
        trafficScore: 75.0,
        remotenessScore: 75.0,
        oneLiner: "Test route for geospatial validation",
        summary: "This is a synthetic test route for validating geospatial query performance.",
        badges: ["test"],
        season: "year_round" as const,
        contentVersion: 1,
        seededAt: Date.now(),
        location: {
          type: "Point" as const,
          coordinates: [route.lng, route.lat],
        },
      });

      // Insert into geospatial index
      await geospatial.insert(
        ctx,
        docId,
        { latitude: route.lat, longitude: route.lng },
        { state: route.state, primaryArchetype: "twisties" },
        75.0 // compositeScore as sortKey
      );

      inserted++;
    }

    return { inserted };
  },
});

export const countSeeded = query({
  args: {},
  handler: async (ctx) => {
    const routes = await ctx.db
      .query("curated_routes")
      .filter((q) => q.eq(q.field("source"), "editorial"))
      .collect();

    return routes.length;
  },
});

export const countStates = query({
  args: {},
  handler: async (ctx) => {
    const routes = await ctx.db
      .query("curated_routes")
      .filter((q) => q.eq(q.field("source"), "editorial"))
      .collect();

    const states = new Set(routes.map((r) => r.state));
    return states.size;
  },
});

export const clearSeeded = mutation({
  args: {},
  handler: async (ctx) => {
    const routes = await ctx.db
      .query("curated_routes")
      .filter((q) => q.eq(q.field("source"), "editorial"))
      .collect();

    for (const route of routes) {
      // Remove from geospatial index
      await geospatial.remove(ctx, route._id);
      // Delete from curated_routes table
      await ctx.db.delete(route._id);
    }

    return { deleted: routes.length };
  },
});
