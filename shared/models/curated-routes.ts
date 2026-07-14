/**
 * Curated Routes Models
 *
 * Defines types and validators for curated motorcycle routes.
 * These are hand-picked routes from various sources (FHWA, motorcycle road websites, BDRs, etc.)
 * with lean tier data (basic metadata, scores, and classifications).
 */

import { v } from 'convex/values'

/**
 * Curated route sources
 */
export const CURATED_ROUTE_SOURCE = {
  FHWA: 'fhwa',
  SCENIC_BYWAYS: 'scenic_byways',
  MOTORCYCLEROADS: 'motorcycleroads',
  BESTBIKINGROADS: 'bestbikingroads',
  RIDER_MAG: 'rider_mag',
  BDR: 'bdr',
  EDITORIAL: 'editorial',
} as const

export type CuratedRouteSource = (typeof CURATED_ROUTE_SOURCE)[keyof typeof CURATED_ROUTE_SOURCE]

/**
 * Curated route archetypes (primary classification)
 */
export const CURATED_ROUTE_ARCHETYPE = {
  TWISTIES: 'twisties',
  MOUNTAIN: 'mountain',
  COASTAL: 'coastal',
  ADVENTURE: 'adventure',
  SCENIC_BYWAY: 'scenic_byway',
  DESERT: 'desert',
} as const

export type CuratedRouteArchetype =
  (typeof CURATED_ROUTE_ARCHETYPE)[keyof typeof CURATED_ROUTE_ARCHETYPE]

/**
 * Curated route seasons (best riding season)
 */
export const CURATED_ROUTE_SEASON = {
  YEAR_ROUND: 'year_round',
  APR_NOV: 'apr_nov',
  MAY_SEP: 'may_sep',
  SPRING_FALL: 'spring_fall',
} as const

export type CuratedRouteSeason = (typeof CURATED_ROUTE_SEASON)[keyof typeof CURATED_ROUTE_SEASON]

/**
 * Curated route lean fields (basic metadata, scores, classifications)
 * Corresponds to the "lean tier" in the PRD schema.
 */
export const CURATED_ROUTE_FIELDS = {
  routeId: v.string(),
  name: v.string(),
  state: v.string(),
  source: v.union(
    v.literal('fhwa'),
    v.literal('scenic_byways'),
    v.literal('motorcycleroads'),
    v.literal('bestbikingroads'),
    v.literal('rider_mag'),
    v.literal('bdr'),
    v.literal('editorial'),
  ),
  primaryArchetype: v.union(
    v.literal('twisties'),
    v.literal('mountain'),
    v.literal('coastal'),
    v.literal('adventure'),
    v.literal('scenic_byway'),
    v.literal('desert'),
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
    v.literal('year_round'),
    v.literal('apr_nov'),
    v.literal('may_sep'),
    v.literal('spring_fall'),
  ),
  contentVersion: v.number(),
  enrichmentVersion: v.optional(v.number()), // null = not yet enriched
  seededAt: v.number(), // timestamp
  location: v.optional(
    v.object({
      type: v.literal('Point'),
      coordinates: v.array(v.number()), // [lng, lat] per GeoJSON
    }),
  ),
} as const

/**
 * Curated route type (lean tier)
 */
export type CuratedRoute = {
  routeId: string
  name: string
  state: string
  source: CuratedRouteSource
  primaryArchetype: CuratedRouteArchetype
  secondaryTags: string[]
  centroidLat: number
  centroidLng: number
  boundsNeLat: number
  boundsNeLng: number
  boundsSwLat: number
  boundsSwLng: number
  lengthMiles: number
  compositeScore: number
  curvatureScore: number
  scenicScore: number
  technicalScore: number
  trafficScore: number
  remotenessScore: number
  oneLiner: string
  summary: string
  badges: string[]
  season: CuratedRouteSeason
  contentVersion: number
  enrichmentVersion?: number | null // null = not yet enriched
  seededAt: number // timestamp
  location?: { type: 'Point'; coordinates: [number, number] } | null
  sourceLabel?: string | null
  // DATA-011: generated per-route geometry. Absent until backfilled.
  // 'polyline' → single encoded line in `value`; 'multipolyline' → Overpass full-route
  // segments in `segments` (each an encoded polyline). One of value/segments is present.
  routeGeometry?: {
    format: 'polyline' | 'multipolyline'
    encoding: string
    precision: number
    value?: string
    segments?: string[]
  } | null
  geometryStatus?: 'generated' | 'unresolved' | 'failed' | 'review' | null
  geometryProvenance?: 'scraped_promoted' | 'ai_reconstructed' | 'name_routed' | null
  riderReady?: boolean | null
  rideWorthiness?: {
    verdict: 'ride' | 'marginal' | 'not_a_ride'
    reason: string
    model: string
    classifiedAt: number
  } | null
  retiredAt?: number | null
  duplicateOf?: string | null
}

/**
 * Curated route validator (lean tier)
 */
export const curatedRouteValidator = v.object({
  ...CURATED_ROUTE_FIELDS,

  // ========================================================================
  // DATA-011: generated per-route line geometry (name-anchored backfill).
  // Optional — rows without it fall back to the centroid in discoverCuratedRoutes.
  // ========================================================================
  routeGeometry: v.optional(
    v.object({
      format: v.union(v.literal('polyline'), v.literal('multipolyline')),
      encoding: v.string(),
      precision: v.number(),
      value: v.optional(v.string()), // single-line form
      segments: v.optional(v.array(v.string())), // multipolyline form (Overpass full route)
    }),
  ),
  geometryStatus: v.optional(
    v.union(
      v.literal('generated'),
      v.literal('unresolved'),
      v.literal('failed'),
      v.literal('review'),
    ),
  ),
  geometryProvenance: v.optional(
    v.union(v.literal('scraped_promoted'), v.literal('ai_reconstructed'), v.literal('name_routed')),
  ),
  riderReady: v.optional(v.boolean()),
  rideWorthiness: v.optional(
    v.object({
      verdict: v.union(v.literal('ride'), v.literal('marginal'), v.literal('not_a_ride')),
      reason: v.string(),
      model: v.string(),
      classifiedAt: v.number(),
    }),
  ),
  retiredAt: v.optional(v.number()),
  duplicateOf: v.optional(v.string()),
  quarantine: v.optional(
    v.object({
      reason: v.union(v.literal('zero_length'), v.literal('length_outlier'), v.literal('test_row')),
      flaggedAt: v.number(),
    }),
  ),

  // ========================================================================
  // Semantic matching (Epic 3 — INF-003)
  // ========================================================================
  name_lower: v.optional(v.string()), // Case-insensitive search index (INF-006 A8)
  searchEmbedding: v.optional(v.array(v.number())),
  searchText: v.optional(v.string()),
  candidateIdentifiers: v.optional(v.array(v.string())),
  matchConfidence: v.optional(v.number()),
  llmReconciliationLog: v.optional(
    v.array(
      v.object({
        runId: v.string(),
        reconciledAt: v.number(),
        conflictsResolved: v.number(),
        notes: v.string(),
      }),
    ),
  ),

  // ========================================================================
  // Enrichment outputs
  // ========================================================================
  description: v.optional(v.string()),
  descriptiveSummary: v.optional(v.string()), // Rich description for waypoint matching (B2)
  rating: v.optional(v.number()),
  designation: v.optional(v.string()),
  sourceLabel: v.optional(v.string()),
  sourceUrl: v.optional(v.string()),
  sourceRefs: v.optional(v.array(v.string())),
  groundTruth: v.optional(v.boolean()),
  groundTruthSource: v.optional(v.string()),
  groundTruthProvider: v.optional(v.string()),
  editorialRank: v.optional(v.number()),
  sourceRank: v.optional(v.number()),
  sourceRankKind: v.optional(v.string()),
  sourceCollection: v.optional(v.string()),
  sourceCollectionTitle: v.optional(v.string()),
  groundTruthNotes: v.optional(v.string()),
  relatedArticleUrl: v.optional(v.string()),
  relatedArticleTitle: v.optional(v.string()),
  stateRaw: v.optional(v.string()),
  statesAll: v.optional(v.array(v.string())),
  highwayNumber: v.optional(v.string()),
  elevationGainM: v.optional(v.number()),
  surface: v.optional(v.string()),
  aadt: v.optional(v.number()),
  aadtMedian: v.optional(v.number()),
  aadtMax: v.optional(v.number()),
  pavementIri: v.optional(v.number()),
  mentionFrequency: v.optional(v.number()),

  // ========================================================================
  // Scoring outputs
  // ========================================================================
  mentionFrequencyScore: v.optional(v.number()),
  designationScore: v.optional(v.number()),
  elevationDramaScore: v.optional(v.number()),
  roadQualityScore: v.optional(v.number()),
  lowTrafficScore: v.optional(v.number()),
  weatherSuitability: v.optional(v.number()),
  bestMonths: v.optional(v.array(v.string())),
  sourceCount: v.optional(v.number()),
  qualityTier: v.optional(v.string()),

  // ========================================================================
  // Geometry (geocode stage)
  // ========================================================================
  routePolyline: v.optional(v.string()), // Encoded polyline for map rendering
  waypointCount: v.optional(v.number()), // Number of waypoints from source
  geometrySource: v.optional(v.string()), // "scraped" | "nominatim" | "fhwa_existing" | "osrm"

  // ========================================================================
  // HYG: Score-scale normalization marker (Sprint 03 catalog hygiene)
  // ÷100 idempotency guard — stamped when editorial scores are normalized at rest.
  // ========================================================================
  scoreScaleNormalizedAt: v.optional(v.number()),
})

/**
 * Curated route geometry validator (side table).
 *
 * DATA-011 16MB-read fix: the generated MultiLineString geometry is large (up to
 * MAX_SEGMENTS encoded polylines per route). Storing it INSIDE each curated_routes
 * doc made the browse/scoring queries that scan many rows (mode 4 reads up to 2,000
 * full docs) exceed Convex's 16MB single-execution read limit. Geometry now lives in
 * its own table keyed by routeId (by_routeId index) so curated_routes docs stay lean;
 * only the small geometryStatus stays on the route doc. Fetched on demand for the
 * ~10 routes a discovery actually plots.
 */
export const curatedRouteGeometryValidator = v.object({
  routeId: v.string(),
  format: v.union(v.literal('polyline'), v.literal('multipolyline')),
  encoding: v.string(),
  precision: v.number(),
  value: v.optional(v.string()), // single-line form
  segments: v.optional(v.array(v.string())), // multipolyline form (Overpass full route)
  provenance: v.optional(
    v.union(v.literal('scraped_promoted'), v.literal('ai_reconstructed'), v.literal('name_routed')),
  ),
  verification: v.optional(
    v.object({
      routeId: v.string(),
      verdict: v.union(v.literal('pass'), v.literal('review')),
      failedCondition: v.optional(
        v.union(v.literal('ratio'), v.literal('anchors'), v.literal('degenerate')),
      ),
      provenance: v.optional(v.string()),
      geometry: v.optional(v.string()),
      geometryStatus: v.union(v.literal('generated'), v.literal('review')),
      anchorCount: v.number(),
      anchors: v.array(
        v.object({
          lat: v.number(),
          lng: v.number(),
          formatted: v.string(),
          distanceFromCentroid: v.number(),
        }),
      ),
      pointCount: v.number(),
      degenerate: v.boolean(),
      ratio: v.union(v.number(), v.null()),
      claimedMiles: v.union(v.number(), v.null()),
      routedMiles: v.number(),
    }),
  ),
})

/**
 * Route post raw validator (Epic 3 — INF-003)
 *
 * Stores raw LLM extraction artifacts per community post.
 * This is the source of truth for what the LLM extracted, separate from
 * route matching decisions.
 */
export const routePostRawValidator = v.object({
  postId: v.string(),
  source: v.string(),
  postUrl: v.string(),
  postAuthor: v.optional(v.string()),
  postScore: v.optional(v.number()),
  postedAt: v.optional(v.number()),
  rawText: v.string(),
  extractionSchemaVersion: v.number(),
  extractionModel: v.string(),
  extractionCost: v.number(),
  extractedAt: v.number(),
  extractionConfidence: v.optional(v.number()),
  postEmbedding: v.optional(v.array(v.number())), // Semantic embedding for waypoint matching (B2)
  payload: v.object({
    roadNameMentions: v.array(v.string()),
    highwayRefs: v.array(v.string()),
    stateRefs: v.array(v.string()),
    landmarkRefs: v.optional(v.array(v.string())),
    sentiment: v.string(),
    aspectScores: v.optional(v.record(v.string(), v.number())),
    attributes: v.optional(v.record(v.string(), v.boolean())),
    warnings: v.optional(v.array(v.string())),
  }),
})

/**
 * Route match validator (Epic 3 — INF-003)
 *
 * Stores audit log of (post → route) match decisions.
 * One post can match zero, one, or many routes.
 */
export const routeMatchValidator = v.object({
  matchId: v.string(),
  postId: v.string(),
  routeId: v.id('curated_routes'),
  matchConfidence: v.number(),
  cosineSimilarity: v.number(),
  matchReasoning: v.string(),
  rerankModel: v.string(),
  rerankCost: v.number(),
  matchedAt: v.number(),
  isArbitrated: v.boolean(),
  arbitrationNotes: v.optional(v.string()),
})

/**
 * Community waypoint mention validator (B2 — Epic 3)
 *
 * Stores waypoint mentions extracted from community posts (UC-RIDER-03).
 * Emitted by the LLM extraction pipeline when processing forum content.
 */
export const communityWaypointMentionValidator = v.object({
  postId: v.string(),
  postUrl: v.string(),
  name: v.string(),
  lat: v.optional(v.nullable(v.number())),
  lng: v.optional(v.nullable(v.number())),
  region: v.string(),
  proposedCategory: v.union(
    v.literal('pause'),
    v.literal('wander'),
    v.literal('taste'),
    v.literal('gather'),
    v.literal('other'),
  ),
  riderQuote: v.string(),
  confidenceScore: v.number(),
  extractedAt: v.number(),
})
