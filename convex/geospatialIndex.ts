// @convex-dev/geospatial version: 0.2.1
import { GeospatialIndex } from "@convex-dev/geospatial";
import { components } from "./_generated/api";

/**
 * Geospatial index for curated_routes table
 *
 * Provides efficient nearest-neighbor and rectangular range queries
 * for route discovery based on geographic proximity.
 *
 * This is a standalone geospatial index that stores route coordinates
 * separately from the main curated_routes table, enabling fast spatial
 * queries without loading full route documents.
 *
 * Index Structure:
 * - key: string (route document ID)
 * - coordinates: { latitude, longitude } - route centroid
 * - filterKeys: { state, primaryArchetype } - for filtering queries
 * - sortKey: compositeScore - for result ranking
 */
export const geospatial = new GeospatialIndex<string, {
  state: string;
  primaryArchetype: string;
}>(components.geospatial);
