/**
 * Curated Routes Models
 *
 * Defines types and validators for curated motorcycle routes.
 * These are hand-picked routes from various sources (FHWA, motorcycle road websites, BDRs, etc.)
 * with lean tier data (basic metadata, scores, and classifications).
 */

import { v } from "convex/values";

/**
 * Curated route sources
 */
export const CURATED_ROUTE_SOURCE = {
  FHWA: "fhwa",
  MOTORCYCLEROADS: "motorcycleroads",
  BESTBIKINGROADS: "bestbikingroads",
  BDR: "bdr",
  EDITORIAL: "editorial",
} as const;

export type CuratedRouteSource = (typeof CURATED_ROUTE_SOURCE)[keyof typeof CURATED_ROUTE_SOURCE];

/**
 * Curated route archetypes (primary classification)
 */
export const CURATED_ROUTE_ARCHETYPE = {
  TWISTIES: "twisties",
  MOUNTAIN: "mountain",
  COASTAL: "coastal",
  ADVENTURE: "adventure",
  SCENIC_BYWAY: "scenic_byway",
  DESERT: "desert",
} as const;

export type CuratedRouteArchetype = (typeof CURATED_ROUTE_ARCHETYPE)[keyof typeof CURATED_ROUTE_ARCHETYPE];

/**
 * Curated route seasons (best riding season)
 */
export const CURATED_ROUTE_SEASON = {
  YEAR_ROUND: "year_round",
  APR_NOV: "apr_nov",
  MAY_SEP: "may_sep",
  SPRING_FALL: "spring_fall",
} as const;

export type CuratedRouteSeason = (typeof CURATED_ROUTE_SEASON)[keyof typeof CURATED_ROUTE_SEASON];

/**
 * Curated route lean fields (basic metadata, scores, classifications)
 * Corresponds to the "lean tier" in the PRD schema.
 */
export const CURATED_ROUTE_FIELDS = {
  routeId: v.string(),
  name: v.string(),
  state: v.string(),
  source: v.union(
    v.literal("fhwa"),
    v.literal("motorcycleroads"),
    v.literal("bestbikingroads"),
    v.literal("bdr"),
    v.literal("editorial")
  ),
  primaryArchetype: v.union(
    v.literal("twisties"),
    v.literal("mountain"),
    v.literal("coastal"),
    v.literal("adventure"),
    v.literal("scenic_byway"),
    v.literal("desert")
  ),
  secondaryTags: v.array(v.string()),
  centroidLat: v.number(),
  centroidLng: v.number(),
  boundsNeLat: v.number(),
  boundsNeLng: v.number(),
  boundsSwLat: v.number(),
  boundsSwLng: v.number(),
  lengthMiles: v.number(),
  compositeScore: v.number(),
  curvatureScore: v.number(),
  scenicScore: v.number(),
  technicalScore: v.number(),
  trafficScore: v.number(),
  remotenessScore: v.number(),
  oneLiner: v.string(),
  summary: v.string(),
  badges: v.array(v.string()),
  season: v.union(
    v.literal("year_round"),
    v.literal("apr_nov"),
    v.literal("may_sep"),
    v.literal("spring_fall")
  ),
  contentVersion: v.number(),
  enrichmentVersion: v.optional(v.number()), // null = not yet enriched
  seededAt: v.number(), // timestamp
} as const;

/**
 * Curated route type (lean tier)
 */
export type CuratedRoute = {
  routeId: string;
  name: string;
  state: string;
  source: CuratedRouteSource;
  primaryArchetype: CuratedRouteArchetype;
  secondaryTags: string[];
  centroidLat: number;
  centroidLng: number;
  boundsNeLat: number;
  boundsNeLng: number;
  boundsSwLat: number;
  boundsSwLng: number;
  lengthMiles: number;
  compositeScore: number;
  curvatureScore: number;
  scenicScore: number;
  technicalScore: number;
  trafficScore: number;
  remotenessScore: number;
  oneLiner: string;
  summary: string;
  badges: string[];
  season: CuratedRouteSeason;
  contentVersion: number;
  enrichmentVersion?: number | null; // null = not yet enriched
  seededAt: number; // timestamp
};

/**
 * Curated route validator (lean tier)
 */
export const curatedRouteValidator = v.object(CURATED_ROUTE_FIELDS);
