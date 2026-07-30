import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'
import { curatedRouteEnrichmentValidator } from '../shared/models/curated-route-enrichments'
import { curatedRouteStateCountValidator } from '../shared/models/curated-route-state-counts'
import {
  communityWaypointMentionValidator,
  curatedRouteGeometryValidator,
  curatedRouteValidator,
  routeMatchValidator,
  routePostRawValidator,
} from '../shared/models/curated-routes'
import {
  curationArtifactReleaseValidator,
  curationArtifactShardValidator,
} from '../shared/models/curation-artifacts'
import { favoriteRoadValidator } from '../shared/models/favorite-roads'
import { orgMembershipValidator } from '../shared/models/org-memberships'
import { orgValidator } from '../shared/models/orgs'
import { osmImportJobValidator, osmNodeValidator, osmWayValidator } from '../shared/models/osm-data'
import { performanceValidator } from '../shared/models/performance'
import { planUsageValidator } from '../shared/models/plan-usage'
import { planningSessionValidator } from '../shared/models/planning-sessions'
import { routeEnrichmentValidator } from '../shared/models/route-enrichments'
import { routeFeedbackValidator } from '../shared/models/route-feedback'
import { routePlanValidator } from '../shared/models/route-plans'
import { planInputValidator, savedRouteValidator } from '../shared/models/saved-routes'
import { sessionMessageValidator } from '../shared/models/session-messages'
import { tripPlanValidator } from '../shared/models/trip-plan'
import { userValidator } from '../shared/models/users'
import { waypointValidator } from '../shared/models/waypoints'

/**
 * Convex Database Schema for React Native + Convex Template
 *
 * Define all tables here using validators derived from models/
 * See models/README.md for validator-first (Convex `v`) patterns
 */
export default defineSchema({
  /**
   * Users table - Demo table showing the pattern
   * Every user has an email (indexed for quick lookups), name, and creation timestamp
   */
  users: defineTable(userValidator)
    .index('by_email', ['email'])
    .index('by_clerkUserId', ['clerkUserId']),

  orgs: defineTable(orgValidator).index('by_clerkOrgId', ['clerkOrgId']),

  org_memberships: defineTable(orgMembershipValidator)
    .index('by_userId_and_orgId', ['userId', 'orgId'])
    .index('by_orgId', ['orgId'])
    .index('by_userId', ['userId']),

  saved_routes: defineTable(savedRouteValidator)
    .index('by_ownerType_and_ownerId', ['ownerType', 'ownerId'])
    .index('by_createdByUserId', ['createdByUserId'])
    .index('by_ownerType_ownerId_routeFingerprint', ['ownerType', 'ownerId', 'routeFingerprint'])
    // DATA-003: bookmark lookup — "is this curated route saved?" / list bookmarks.
    .index('by_curated_route', ['curatedRouteRef']),

  /**
   * Favorite roads table - Stores user's favorite road segments
   * Indexed by clerkUserId for efficient user-specific queries
   * Indexed by createdAt for chronological ordering
   */
  favorite_roads: defineTable(favoriteRoadValidator)
    .index('by_clerkUserId', ['clerkUserId'])
    .index('by_createdAt', ['createdAt']),

  route_plans: defineTable(routePlanValidator)
    .index('by_clerkUserId_and_status', ['clerkUserId', 'status'])
    .index('by_planningSessionId_and_status', ['planningSessionId', 'status']),

  /**
   * Plan usage table - Tracks monthly route plan usage per user for rate limiting
   * Free tier: 5 plans per month
   * Indexed by clerkUserId and month for efficient usage queries
   */
  plan_usage: defineTable(planUsageValidator).index('by_clerkUserId_and_month', [
    'clerkUserId',
    'month',
  ]),

  /**
   * Planning sessions table - Agentic conversational planning sessions
   * Indexed by clerkUserId for user session lookup
   * Indexed by clerkUserId and updatedAt for chronological ordering
   */
  planning_sessions: defineTable(planningSessionValidator)
    .index('by_clerkUserId', ['clerkUserId'])
    .index('by_clerkUserId_and_updatedAt', ['clerkUserId', 'updatedAt']),

  /**
   * Session messages table - Messages within planning sessions
   * Indexed by sessionId for efficient message retrieval
   * Indexed by sessionId and status for fast "is anything streaming/running?" lookups
   * Separate table allows pagination and avoids document size limits
   */
  session_messages: defineTable(sessionMessageValidator)
    .index('by_sessionId', ['sessionId'])
    .index('by_sessionId_and_status', ['sessionId', 'status']),

  performance: defineTable(performanceValidator)
    .index('by_processType', ['processType'])
    .index('by_agent_and_createdAt', ['agent', 'createdAt'])
    .index('by_createdAt', ['createdAt']),

  /**
   * OSM nodes table - Scenic waypoints (viewpoints, peaks, mountain passes)
   * Indexed by s2Token for efficient spatial queries
   * Indexed by osmId for deduplication during import
   */
  osm_nodes: defineTable(osmNodeValidator)
    .index('by_osmId', ['osmId'])
    .index('by_s2Token', ['s2Token'])
    .index('by_type', ['type']),

  /**
   * OSM ways table - Road segments with simplified geometry
   * Indexed by s2Tokens for spatial bbox queries (ways can span multiple cells)
   * Indexed by name for exact road name lookups
   * Indexed by highwayClass for filtering by road type
   */
  osm_ways: defineTable(osmWayValidator)
    .index('by_osmId', ['osmId'])
    .index('by_name', ['name'])
    .index('by_highwayClass', ['highwayClass']),

  /**
   * OSM import jobs table - Tracks ETL import progress
   * Indexed by status for job queue queries
   */
  osm_import_jobs: defineTable(osmImportJobValidator).index('by_status', ['status']),

  /**
   * Trip plans table - Stores no-tool LLM trip plan generation records
   * Indexed by clerkUserId for user trip plan lookups
   */
  trip_plans: defineTable({
    clerkUserId: v.string(),
    planInput: planInputValidator,
    status: v.union(
      v.literal('pending'),
      v.literal('generating'),
      v.literal('needs_retry'),
      v.literal('completed'),
      v.literal('failed'),
    ),
    result: v.optional(tripPlanValidator),
    attemptCount: v.number(),
    error: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_user', ['clerkUserId']),

  /**
   * Route enrichments table - Tracks background enrichment jobs with cache support
   * Indexed by routePlanId for finding enrichments for a specific route plan
   * Indexed by contentFingerprint and phase for cache lookup and invalidation
   * Indexed by planningSessionId and status for efficient session-scoped invalidation
   */
  route_enrichments: defineTable(routeEnrichmentValidator)
    .index('by_routePlanId', ['routePlanId'])
    .index('by_contentFingerprint_and_phase', ['contentFingerprint', 'phase'])
    .index('by_planningSessionId_and_status', ['planningSessionId', 'status']),

  /**
   * Waypoints table - Stores user waypoints for route plans
   * Indexed by routePlanId for efficient route-specific queries
   * Indexed by routePlanId and status for workflow filtering
   */
  waypoints: defineTable(waypointValidator)
    .index('by_routePlanId', ['routePlanId'])
    .index('by_routePlanId_and_status', ['routePlanId', 'status']),

  /**
   * Curated routes table - Hand-picked motorcycle routes from various sources
   * Indexed by source for filtering by data source (FHWA, BDR, etc.)
   * Indexed by primaryArchetype for filtering by route type (twisties, mountain, coastal, etc.)
   * Indexed by state for geographic filtering
   * Indexed by compositeScore for sorting by quality ranking
   * Indexed by routeId for upsert operations during curation ingest
   * Indexed by name_lower for case-insensitive name searches (INF-006 A8)
   * Indexed by highwayNumber for highway number searches (INF-006 A8)
   * Vector indexed by searchEmbedding for semantic similarity search (INF-003)
   */
  curated_routes: defineTable(curatedRouteValidator)
    .index('by_source', ['source'])
    .index('by_archetype', ['primaryArchetype'])
    .index('by_state', ['state'])
    .index('by_composite_score', ['compositeScore'])
    .index('by_riderReady_and_composite_score', ['riderReady', 'compositeScore'])
    .index('by_routeId', ['routeId'])
    .index('by_name_lower', ['name_lower'])
    .index('by_highway_number', ['highwayNumber'])
    // REVIEW queue (status-field pattern): geometryStatus='review' — no separate table.
    .index('by_geometry_status', ['geometryStatus'])
    .vectorIndex('by_embedding', {
      vectorField: 'searchEmbedding',
      dimensions: 1536,
      filterFields: ['state'],
    }),

  /**
   * Curated route enrichments table - Rich tier data for curated routes
   * Indexed by routeId for finding enrichments for a specific curated route
   */
  curated_route_enrichments: defineTable(curatedRouteEnrichmentValidator).index('by_routeId', [
    'routeId',
  ]),

  /**
   * Curated route geometry table (DATA-011 16MB-read fix).
   * Large generated MultiLineString geometry lives here, NOT inside curated_routes,
   * so the browse/scoring queries that scan many route docs stay under Convex's
   * 16MB single-execution read limit. Keyed + indexed by routeId.
   */
  curated_route_geometry: defineTable(curatedRouteGeometryValidator).index('by_routeId', [
    'routeId',
  ]),

  /**
   * Curated route state counts table - Denormalized summary of routes per state
   * Used by listCuratedRouteStates to avoid reading all 5,654+ full documents
   * and exceeding the 16MB single-execution read limit.
   * Indexed by stateName for fast lookups.
   */
  curated_route_state_counts: defineTable(curatedRouteStateCountValidator).index('by_state_name', [
    'stateName',
  ]),

  /**
   * Route feedback table - User feedback on curated routes
   * Indexed by userId for user-specific feedback queries
   * Indexed by routeId for route-specific feedback aggregation
   * Indexed by action for filtering by feedback type (save, hide, complete, rate)
   */
  route_feedback: defineTable(routeFeedbackValidator)
    .index('by_user', ['userId'])
    .index('by_route', ['routeId'])
    .index('by_action', ['action']),

  /**
   * Route posts raw table - Raw LLM extraction artifacts per community post (INF-003)
   * Indexed by postId for unique-like access
   * Indexed by source and extractedAt for time windowing by source
   * Indexed by extractionSchemaVersion for re-extraction by version
   */
  route_posts_raw: defineTable(routePostRawValidator)
    .index('by_postId', ['postId'])
    .index('by_source_and_extracted_at', ['source', 'extractedAt'])
    .index('by_extraction_schema_version', ['extractionSchemaVersion']),

  /**
   * Route matches table - Audit log of (post → route) match decisions (INF-003)
   * Indexed by postId for finding all matches for a post
   * Indexed by routeId for finding all posts matched to a route
   * Indexed by routeId and matchConfidence for top matches per route
   */
  route_matches: defineTable(routeMatchValidator)
    .index('by_postId', ['postId'])
    .index('by_routeId', ['routeId'])
    .index('by_routeId_and_confidence', ['routeId', 'matchConfidence']),

  /**
   * Community waypoint mentions table - Waypoint mentions from community posts (B2)
   * Indexed by postId for finding all mentions for a post
   * Indexed by proposedCategory for category-based filtering
   * Indexed by extractedAt for time-based queries
   */
  community_waypoint_mentions: defineTable(communityWaypointMentionValidator)
    .index('by_postId', ['postId'])
    .index('by_proposed_category', ['proposedCategory'])
    .index('by_extractedAt', ['extractedAt']),

  /**
   * Curation artifact releases table - Metadata for batch artifact releases stored in Convex File Storage
   * Indexed by source and releaseId for upserts
   * Indexed by source and active for resolving the current release
   */
  curation_artifact_releases: defineTable(curationArtifactReleaseValidator)
    .index('by_source', ['source'])
    .index('by_source_and_releaseId', ['source', 'releaseId'])
    .index('by_source_and_active', ['source', 'active']),

  /**
   * Curation artifact shards table - Metadata for release shards stored in Convex File Storage
   * Indexed by source and releaseId for release lookups
   * Indexed by source, releaseId, and state for shard upserts
   */
  curation_artifact_shards: defineTable(curationArtifactShardValidator)
    .index('by_source_and_releaseId', ['source', 'releaseId'])
    .index('by_source_and_releaseId_and_state', ['source', 'releaseId', 'state']),

  /**
   * Curation artifacts (S4-T5) — waterfall terminal records, REVIEW candidates,
   * and founder disposition audit trail. Distinct from file-storage release/shard tables.
   */
  curation_artifacts: defineTable({
    routeId: v.string(),
    artifactType: v.union(
      v.literal('review_candidate'),
      v.literal('disposition'),
      v.literal('waterfall_result'),
    ),
    terminalState: v.optional(
      v.union(
        v.literal('recovered'),
        v.literal('queued'),
        v.literal('retirement_eligible'),
        v.literal('cost_blocked'),
      ),
    ),
    provenance: v.optional(v.string()),
    failedCondition: v.optional(v.string()),
    bestCandidateGeometry: v.optional(v.string()),
    disposition: v.optional(
      v.union(v.literal('approve'), v.literal('retry'), v.literal('retire'), v.literal('unretire')),
    ),
    // S5-T2: founder confirmation reason recorded on retire/unretire dispositions
    reason: v.optional(v.string()),
    confirmed: v.optional(v.boolean()),
    lever: v.optional(v.number()),
    leversRun: v.optional(v.array(v.number())),
    costUsd: v.optional(v.number()),
    attemptedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index('by_routeId', ['routeId'])
    .index('by_artifactType', ['artifactType']),

  /**
   * REDHAT-FIX-02: Durable whole-catalog classifier run state. Persists the
   * pagination cursor + processed/failed counts so an interrupted run resumes
   * from the persisted cursor instead of restarting from zero, and completion
   * counters derive from the persisted run (provable coverage).
   */
  classifier_runs: defineTable({
    runId: v.string(),
    status: v.union(v.literal('running'), v.literal('completed'), v.literal('failed')),
    cursor: v.optional(v.string()),
    processedCount: v.number(),
    failedCount: v.number(),
    totalEligible: v.optional(v.number()),
    isDone: v.boolean(),
    startedAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_runId', ['runId'])
    .index('by_status', ['status']),

  /**
   * S4-T6 / VER-05: Stratified couch-sample (~25 routes) for founder visual review.
   * Routes carry provenance + difficulty so stratification can be re-queried.
   *
   * FIX-10: Immutable frozen manifest with server-computed hash.
   * manifestHash = SHA-256(sorted routeIds + per-route geometry hashes + catalogVersion).
   * Once status='frozen', the manifest is IMMUTABLE — reject re-freeze or mutation.
   */
  couch_samples: defineTable({
    sampleId: v.string(),
    size: v.number(),
    routes: v.array(
      v.object({
        routeId: v.string(),
        provenance: v.union(
          v.literal('scraped_promoted'),
          v.literal('ai_reconstructed'),
          v.literal('name_routed'),
        ),
        anchorCount: v.number(),
        claimedMiles: v.union(v.number(), v.null()),
        routedMiles: v.number(),
        difficulty: v.union(v.literal('easy'), v.literal('medium'), v.literal('hard')),
        descriptionLength: v.number(),
      }),
    ),
    // REDHAT-FIX-15: per-route geometry hashes captured at freeze time, so
    // couchGateStatus can recompute them and block on post-approval drift.
    routeHashes: v.optional(v.array(v.object({ routeId: v.string(), hash: v.string() }))),
    createdAt: v.number(),
    // FIX-10: Immutable manifest fields (migration-safe: all optional)
    manifestHash: v.optional(v.string()),
    catalogVersion: v.optional(v.string()),
    status: v.optional(v.union(v.literal('draft'), v.literal('frozen'))),
    frozenAt: v.optional(v.number()),
    frozenBy: v.optional(v.string()),
  }).index('by_sampleId', ['sampleId']),

  /**
   * S4-T6 / VER-05: Founder couch verdicts. Overall pass unblocks waterfall --all.
   * Per-route verdict is true | off | wrong; a single wrong forces overall fail.
   *
   * FIX-03/04: Verdicts are bound to a frozen manifest with exact membership.
   * APPEND-ONLY: multiple verdicts per sampleId; couchGateStatus reads latest.
   * manifestHash + catalogVersion bind the verdict to a specific frozen manifest.
   */
  couch_verdicts: defineTable({
    sampleId: v.string(),
    overallVerdict: v.union(v.literal('pass'), v.literal('fail')),
    routeVerdicts: v.array(
      v.object({
        routeId: v.string(),
        verdict: v.union(v.literal('true'), v.literal('off'), v.literal('wrong')),
      }),
    ),
    recordedAt: v.number(),
    recordedBy: v.optional(v.string()),
    // FIX-03/04: Manifest binding fields (migration-safe: all optional)
    manifestHash: v.optional(v.string()),
    catalogVersion: v.optional(v.string()),
  })
    .index('by_sampleId', ['sampleId'])
    .index('by_overallVerdict', ['overallVerdict']),

  /**
   * REDHAT-FIX-14: Explicit active-manifest transition log. The active couch
   * manifest is NOT derived from the latest frozen sample — an operator must
   * explicitly activate a frozen manifest (activateCouchManifest). This prevents
   * an ordinary authenticated user from freezing a new manifest to invalidate a
   * prior approved unlock (a trust-gate DoS / unauthorized control-plane change).
   * Append-only audit trail: couchGateStatus binds to the latest activation.
   */
  couch_manifest_activations: defineTable({
    sampleId: v.string(),
    manifestHash: v.optional(v.string()),
    catalogVersion: v.optional(v.string()),
    activatedBy: v.string(),
    reason: v.optional(v.string()),
    activatedAt: v.number(),
  })
    .index('by_sampleId', ['sampleId'])
    .index('by_activatedAt', ['activatedAt']),

  /**
   * S5-T1: Full-batch coverage reports + founder acceptance/escalation artifacts.
   * One logical runId may have coverage_report + acceptance rows; retirement stays
   * locked until an explicit accept or resolved escalation records retirementUnlockedAt.
   */
  batch_acceptance_artifacts: defineTable({
    runId: v.string(),
    artifactKind: v.union(v.literal('coverage_report'), v.literal('acceptance')),
    isDone: v.optional(v.boolean()),
    continueCursor: v.optional(v.union(v.string(), v.null())),
    totalCostUSD: v.optional(v.number()),
    maxCostUSD: v.optional(v.number()),
    batchStopReason: v.optional(v.union(v.string(), v.null())),
    riderReadyCount: v.optional(v.number()),
    levers: v.optional(
      v.array(
        v.object({
          lever: v.string(),
          leverNumber: v.number(),
          provenance: v.string(),
          candidateCount: v.number(),
          passCount: v.number(),
          realizedRate: v.number(),
          passRate: v.number(),
          assumptionLabel: v.string(),
          assumptionIsTarget: v.boolean(),
          escalationFloor: v.union(v.number(), v.null()),
        }),
      ),
    ),
    terminalStates: v.optional(v.any()),
    provenanceCounts: v.optional(v.any()),
    pageTotals: v.optional(v.any()),
    decision: v.optional(
      v.union(
        v.literal('accepted'),
        v.literal('rejected'),
        v.literal('escalation_required'),
        v.null(),
      ),
    ),
    acceptedAt: v.optional(v.union(v.number(), v.null())),
    retirementUnlockedAt: v.optional(v.union(v.number(), v.null())),
    escalations: v.optional(v.any()),
    resolution: v.optional(v.any()),
    observedRates: v.optional(v.any()),
    reason: v.optional(v.string()),
    /** REDHAT-FIX-02: founder who made the acceptance decision (clerkUserId). */
    operatorIdentity: v.optional(v.string()),
    /** REDHAT-FIX-02: ISO-8601 timestamp of the decision (decision.timestamp). */
    decisionTimestamp: v.optional(v.string()),
    /**
     * REDHAT-FIX-02: fail-closed provenance proving the coverage_report came from
     * a real runFullBatch / persistCoverageReport path (not a seed fixture).
     */
    reportProvenance: v.optional(
      v.object({
        producedBy: v.string(),
        sourceRunKind: v.string(),
      }),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_runId', ['runId'])
    .index('by_artifactKind', ['artifactKind'])
    .index('by_runId_and_kind', ['runId', 'artifactKind']),

  /**
   * S5-T3: Independent top-50-by-composite-rank founder review artifacts.
   * APPEND-ONLY. Independent of couch_verdicts / retirement unlock.
   * One wrong / duplicate headliner / test-seed marker forces status=fail.
   */
  top50_reviews: defineTable({
    reviewId: v.string(),
    status: v.union(v.literal('pass'), v.literal('fail')),
    routeVerdicts: v.array(
      v.object({
        routeId: v.string(),
        verdict: v.union(v.literal('correct'), v.literal('plausible'), v.literal('wrong')),
        isDuplicate: v.optional(v.boolean()),
        isTestSeed: v.optional(v.boolean()),
        reason: v.optional(v.string()),
      }),
    ),
    offendingRouteIds: v.array(v.string()),
    offendingReasons: v.array(v.string()),
    reviewedRowCount: v.number(),
    expectedRowCount: v.number(),
    contaminationCount: v.number(),
    recordedAt: v.number(),
    recordedBy: v.optional(v.string()),
  })
    .index('by_reviewId', ['reviewId'])
    .index('by_recordedAt', ['recordedAt']),

  /**
   * S6-T1 / risk #22: geospatial re-index migration gate evaluations.
   * Founder query reads gateDeployable / pointCount / riderReadyCount before SURF deploy.
   */
  surf_migration_gates: defineTable({
    gateId: v.string(),
    pointCount: v.number(),
    riderReadyCount: v.number(),
    gateDeployable: v.boolean(),
    surfGateDeployed: v.boolean(),
    evaluatedAt: v.number(),
    routeIdPrefix: v.optional(v.string()),
  }).index('by_gateId', ['gateId']),
})
