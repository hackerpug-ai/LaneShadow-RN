/**
 * Curated Route Enrichments Models
 *
 * Defines types and validators for enriched curated route data.
 * This is the "rich tier" with detailed descriptions, photos, sources, and metadata.
 */

import { v } from "convex/values";

/**
 * Curated route enrichment fields (rich tier)
 * Corresponds to the "rich tier" in the PRD schema.
 */
export const CURATED_ROUTE_ENRICHMENT_FIELDS = {
  routeId: v.string(),
  fullDescription: v.string(),
  history: v.string(),
  roadClassification: v.string(),
  surfaceMaterial: v.string(),
  totalElevationGainM: v.number(),
  elevationProfile: v.optional(v.any()), // complex JSON structure
  nearestCities: v.array(v.string()),
  ridershipLevel: v.string(),
  seasonalNotes: v.string(),
  safetyWarnings: v.string(),
  gpxUrl: v.optional(v.string()),
  photos: v.array(v.object({
    url: v.string(),
    caption: v.string(),
    attribution: v.string(),
  })),
  sources: v.array(v.object({
    site: v.string(),
    url: v.string(),
    lastFetched: v.number(),
    extractionConfidence: v.number(),
  })),
  recommendedStarts: v.array(v.any()),
  fuelStops: v.array(v.any()),
  extractedBy: v.string(),
  extractedAt: v.number(),
  extractionSchemaVersion: v.number(),
  enrichmentVersion: v.number(),
  lastEnrichedAt: v.number(),
} as const;

/**
 * Photo type
 */
export type CuratedRoutePhoto = {
  url: string;
  caption: string;
  attribution: string;
};

/**
 * Source type
 */
export type CuratedRouteSource = {
  site: string;
  url: string;
  lastFetched: number; // timestamp
  extractionConfidence: number; // 0-1 score
};

/**
 * Curated route enrichment type (rich tier)
 */
export type CuratedRouteEnrichment = {
  routeId: string;
  fullDescription: string;
  history: string;
  roadClassification: string;
  surfaceMaterial: string;
  totalElevationGainM: number;
  elevationProfile?: any; // complex JSON structure
  nearestCities: string[];
  ridershipLevel: string;
  seasonalNotes: string;
  safetyWarnings: string;
  gpxUrl?: string | null;
  photos: CuratedRoutePhoto[];
  sources: CuratedRouteSource[];
  recommendedStarts: any[];
  fuelStops: any[];
  extractedBy: string;
  extractedAt: number; // timestamp
  extractionSchemaVersion: number;
  enrichmentVersion: number;
  lastEnrichedAt: number; // timestamp
};

/**
 * Curated route enrichment validator (rich tier)
 */
export const curatedRouteEnrichmentValidator = v.object(CURATED_ROUTE_ENRICHMENT_FIELDS);
