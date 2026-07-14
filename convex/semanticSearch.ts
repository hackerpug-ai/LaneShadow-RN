/**
 * Semantic Search Query/Mutation Wrappers (INF-006)
 *
 * Provides 7 Convex functions for vector search, route matching, and raw post retrieval.
 * These functions implement the semantic matching layer for route discovery.
 *
 * Prerequisites:
 * - INF-003: curated_routes table with by_embedding vectorIndex (1536 dimensions)
 * - INF-003: route_posts_raw table with by_postId index
 * - INF-003: route_matches table with by_postId and by_routeId_and_confidence indexes
 */

import { v } from 'convex/values'

import { api, internal } from './_generated/api'
import type { Doc, Id, TableNames } from './_generated/dataModel'
import { action, internalQuery, mutation, query } from './_generated/server'

const EMBEDDING_DIMENSIONS = 1536

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// Proper Convex types for our document tables
type CuratedRouteDoc = Doc<'curated_routes'>

// Vector search result types
type VectorSearchHit<TTableName extends TableNames> = {
  _id: Id<TTableName>
  _score: number
}

// Return types for the vector-search actions (explicit annotations needed
// because the api/internal imports create a circular type reference through
// the generated API, preventing inference).
type EmbeddingSearchResult = Array<{
  routeId: Id<'curated_routes'>
  cosineSimilarity: number
  name: string
  state: string
  candidateIdentifiers: string[] | undefined
}>

type HybridSearchResult = Array<{
  routeId: Id<'curated_routes'>
  name: string
  state: string
  cosineSimilarity?: number
  matchType?: 'name' | 'highway' | 'identifier'
}>

// ---------------------------------------------------------------------------
// Internal query: fetchVisibleRoutesByVectorIds
// ---------------------------------------------------------------------------

/**
 * Internal query: fetch curated_routes documents by _id array and filter out
 * shadow rows (duplicateOf != null). Used by the vector-search actions to
 * hydrate vectorSearch hits through a real database reader — actions cannot
 * use ctx.db directly.
 */
export const fetchVisibleRoutesByVectorIds = internalQuery({
  args: { ids: v.array(v.id('curated_routes')) },
  handler: async (ctx, args) => {
    const docs = await Promise.all(
      args.ids.map(async (id) => {
        const doc = (await ctx.db.get(id)) as CuratedRouteDoc | null
        if (!doc) {
          return null
        }
        // Skip shadow rows (duplicateOf != null) so deduped routes don't surface
        if (doc.duplicateOf) {
          return null
        }
        return {
          _id: id,
          name: doc.name,
          state: doc.state,
          candidateIdentifiers: doc.candidateIdentifiers,
        }
      }),
    )
    return docs.filter((d): d is NonNullable<typeof d> => d !== null)
  },
})

// ---------------------------------------------------------------------------
// Action: findCandidateRoutesByEmbedding
// ---------------------------------------------------------------------------

/**
 * Vector search for routes by embedding similarity.
 *
 * Uses curated_routes.by_embedding vectorIndex to find semantically similar routes.
 * Returns route documents with cosine similarity scores, sorted by similarity.
 *
 * Implemented as an action because Convex 1.34.x only exposes vectorSearch on
 * the action context (GenericActionCtx), not on the query context. The action
 * calls ctx.vectorSearch for the vector index, then hydrates the hit documents
 * via the fetchVisibleRoutesByVectorIds internal query (which also filters
 * shadow rows with duplicateOf != null).
 *
 * @param embedding - OpenAI text-embedding-3-small vector (1536 dimensions)
 * @param limit - Maximum number of results (default: 10)
 * @param stateFilter - Optional state filter for vectorIndex (e.g., "CA", "CO")
 * @returns List of routes with { routeId, cosineSimilarity, name, state, candidateIdentifiers }
 */
export const findCandidateRoutesByEmbedding = action({
  args: {
    embedding: v.array(v.number()),
    limit: v.optional(v.number()),
    stateFilter: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      routeId: v.id('curated_routes'),
      cosineSimilarity: v.number(),
      name: v.string(),
      state: v.string(),
      candidateIdentifiers: v.optional(v.array(v.string())),
    }),
  ),
  handler: async (ctx, args): Promise<EmbeddingSearchResult> => {
    const { embedding, limit = 10, stateFilter } = args

    // Validate embedding dimensions
    if (embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(
        `Invalid embedding dimensions: expected ${EMBEDDING_DIMENSIONS}, got ${embedding.length}`,
      )
    }

    // Build vector filter
    const filter = stateFilter ? (q: any) => q.eq('state', stateFilter) : undefined

    // Execute vector search (available on ActionCtx)
    const hits: VectorSearchHit<'curated_routes'>[] = await ctx.vectorSearch(
      'curated_routes',
      'by_embedding',
      {
        vector: embedding,
        limit,
        filter,
      },
    )

    // Hydrate documents via internal query (also filters shadow rows)
    const docs: Array<{
      _id: Id<'curated_routes'>
      name: string
      state: string
      candidateIdentifiers: string[] | undefined
    }> = await ctx.runQuery(internal.semanticSearch.fetchVisibleRoutesByVectorIds, {
      ids: hits.map((h: VectorSearchHit<'curated_routes'>) => h._id),
    })

    // Join docs with scores, preserving vector rank order
    const docById = new Map<string, (typeof docs)[0]>(docs.map((d) => [d._id as string, d]))
    return hits
      .filter((h: VectorSearchHit<'curated_routes'>) => docById.has(h._id as string))
      .map((h: VectorSearchHit<'curated_routes'>) => {
        const doc = docById.get(h._id as string)!
        return {
          routeId: h._id,
          cosineSimilarity: h._score,
          name: doc.name,
          state: doc.state,
          candidateIdentifiers: doc.candidateIdentifiers,
        }
      })
  },
})

// ---------------------------------------------------------------------------
// Query: findRoutesByIdentifier
// ---------------------------------------------------------------------------

/**
 * Text fallback for exact route matches by identifier.
 *
 * Searches curated_routes for exact matches on:
 * - name (case-insensitive) via by_name_lower index
 * - highwayNumber via by_highway_number index
 * - candidateIdentifiers array (requires scan, no array-contains index)
 *
 * Uses parallel index queries for optimal performance, then unions and deduplicates.
 *
 * @param identifier - Search string (route name, highway number, or alias)
 * @param stateFilter - Optional state filter
 * @param limit - Maximum number of results (default: 20)
 * @returns List of routes with { routeId, name, state, matchType }
 */
export const findRoutesByIdentifier = query({
  args: {
    identifier: v.string(),
    stateFilter: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      routeId: v.id('curated_routes'),
      name: v.string(),
      state: v.string(),
      matchType: v.union(v.literal('name'), v.literal('highway'), v.literal('identifier')),
    }),
  ),
  handler: async (ctx, args) => {
    const { identifier, stateFilter, limit = 20 } = args
    const searchTermLower = identifier.toLowerCase()

    // Query indexes in parallel
    const [byName, byHighway, allRoutes] = await Promise.all([
      // Index lookup for exact name match (case-insensitive)
      // Filter out shadow rows (duplicateOf != null) so deduped routes don't surface
      ctx.db
        .query('curated_routes')
        .withIndex('by_name_lower', (q) => q.eq('name_lower', searchTermLower))
        .take(limit)
        .then((rows) => rows.filter((r) => !r.duplicateOf)),
      // Index lookup for highway number
      // Filter out shadow rows (duplicateOf != null) so deduped routes don't surface
      ctx.db
        .query('curated_routes')
        .withIndex('by_highway_number', (q) => q.eq('highwayNumber', searchTermLower))
        .take(limit)
        .then((rows) => rows.filter((r) => !r.duplicateOf)),
      // Scan for candidateIdentifiers (no array-contains index in Convex)
      // Use state filter if provided to reduce scan set
      stateFilter
        ? ctx.db
            .query('curated_routes')
            .withIndex('by_state', (q) => q.eq('state', stateFilter))
            .take(limit * 2)
        : ctx.db.query('curated_routes').take(limit * 2),
    ])

    // Collect and deduplicate matches by _id
    const matchMap = new Map<
      Id<'curated_routes'>,
      {
        routeId: Id<'curated_routes'>
        name: string
        state: string
        matchType: 'name' | 'highway' | 'identifier'
      }
    >()

    // Add name matches (highest priority)
    for (const route of byName) {
      matchMap.set(route._id, {
        routeId: route._id,
        name: route.name,
        state: route.state,
        matchType: 'name',
      })
    }

    // Add highway matches (second priority)
    for (const route of byHighway) {
      if (!matchMap.has(route._id)) {
        matchMap.set(route._id, {
          routeId: route._id,
          name: route.name,
          state: route.state,
          matchType: 'highway',
        })
      }
    }

    // Add candidateIdentifiers matches (lowest priority - requires scan)
    for (const route of allRoutes) {
      // Skip if already matched by name or highway
      if (matchMap.has(route._id)) {
        continue
      }

      // Skip shadow rows (duplicateOf != null) so deduped routes don't surface
      if (route.duplicateOf) {
        continue
      }

      // Match by candidateIdentifiers
      if (route.candidateIdentifiers) {
        const identifierMatch = route.candidateIdentifiers.find((id) =>
          id.toLowerCase().includes(searchTermLower),
        )
        if (identifierMatch) {
          matchMap.set(route._id, {
            routeId: route._id,
            name: route.name,
            state: route.state,
            matchType: 'identifier',
          })
        }
      }

      // Stop if we've hit the limit
      if (matchMap.size >= limit) {
        break
      }
    }

    // Convert map to array and apply limit
    return Array.from(matchMap.values()).slice(0, limit)
  },
})

// ---------------------------------------------------------------------------
// Mutation: updateRouteEmbedding
// ---------------------------------------------------------------------------

/**
 * Update search embedding for a curated route.
 *
 * Used during curation ingest to add semantic search capability to routes.
 * Only updates searchText and searchEmbedding fields.
 *
 * @param routeId - Curated route document ID
 * @param searchText - Concatenated search text for embedding
 * @param searchEmbedding - OpenAI text-embedding-3-small vector (1536 dimensions)
 * @returns { ok: true }
 */
export const updateRouteEmbedding = mutation({
  args: {
    routeId: v.id('curated_routes'),
    searchText: v.string(),
    searchEmbedding: v.array(v.number()),
  },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, args) => {
    const { routeId, searchText, searchEmbedding } = args

    // Validate embedding dimensions
    if (searchEmbedding.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(
        `Invalid embedding dimensions: expected ${EMBEDDING_DIMENSIONS}, got ${searchEmbedding.length}`,
      )
    }

    // Update route with embedding data
    await ctx.db.patch(routeId, {
      searchText,
      searchEmbedding,
    })

    return { ok: true }
  },
})

// ---------------------------------------------------------------------------
// Mutation: addRouteMatch
// ---------------------------------------------------------------------------

/**
 * Record a (post → route) match decision.
 *
 * Creates an audit log entry for route matching results from the semantic
 * matching pipeline (vector search + LLM reranking).
 *
 * @param matchId - Unique match identifier
 * @param postId - Community post ID
 * @param routeId - Curated route document ID
 * @param matchConfidence - Confidence score [0, 1]
 * @param cosineSimilarity - Vector similarity score [0, 1]
 * @param matchReasoning - LLM explanation for the match
 * @param rerankModel - Model used for reranking (e.g., "gpt-4o")
 * @param rerankCost - Cost of reranking in USD
 * @param matchedAt - Timestamp of match decision
 * @param isArbitrated - Whether match was manually arbitrated
 * @param arbitrationNotes - Optional arbitration notes
 * @returns Match document ID
 */
export const addRouteMatch = mutation({
  args: {
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
  },
  returns: v.id('route_matches'),
  handler: async (ctx, args) => {
    const { matchId, postId, routeId, matchConfidence, cosineSimilarity, rerankCost, ...rest } =
      args

    // Validate ranges
    if (matchConfidence < 0 || matchConfidence > 1) {
      throw new Error(`Invalid matchConfidence: must be [0, 1], got ${matchConfidence}`)
    }
    if (cosineSimilarity < 0 || cosineSimilarity > 1) {
      throw new Error(`Invalid cosineSimilarity: must be [0, 1], got ${cosineSimilarity}`)
    }
    if (rerankCost < 0) {
      throw new Error(`Invalid rerankCost: must be >= 0, got ${rerankCost}`)
    }

    // Insert match record
    const matchIdDoc = await ctx.db.insert('route_matches', {
      matchId,
      postId,
      routeId,
      matchConfidence,
      cosineSimilarity,
      rerankCost,
      ...rest,
    })

    return matchIdDoc
  },
})

// ---------------------------------------------------------------------------
// Query: getRouteMatchesForPost
// ---------------------------------------------------------------------------

/**
 * Get all route matches for a specific post.
 *
 * Queries route_matches.by_postId index for all matches to a given post.
 * Results are sorted by matchConfidence descending.
 *
 * @param postId - Community post ID
 * @returns List of route matches for the post
 */
export const getRouteMatchesForPost = query({
  args: {
    postId: v.string(),
  },
  returns: v.array(
    v.object({
      matchId: v.string(),
      routeId: v.id('curated_routes'),
      matchConfidence: v.number(),
      cosineSimilarity: v.number(),
      matchReasoning: v.string(),
      rerankModel: v.string(),
      rerankCost: v.number(),
      matchedAt: v.number(),
      isArbitrated: v.boolean(),
      arbitrationNotes: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const { postId } = args

    // Query by postId index
    const matches = await ctx.db
      .query('route_matches')
      .withIndex('by_postId', (q) => q.eq('postId', postId))
      .collect()

    // Sort by matchConfidence descending
    matches.sort((a, b) => b.matchConfidence - a.matchConfidence)

    return matches
  },
})

// ---------------------------------------------------------------------------
// Query: getRouteMatchesForRoute
// ---------------------------------------------------------------------------

/**
 * Get all posts matched to a specific route.
 *
 * Queries route_matches.by_routeId_and_confidence index for all posts
 * matched to a given route. Results are sorted by matchConfidence descending.
 *
 * Uses over-fetch pattern: fetches 2x limit, then filters by minConfidence.
 * This works around index ordering limitations (compound index is ordered
 * by routeId first, then matchConfidence).
 *
 * @param routeId - Curated route document ID
 * @param minConfidence - Minimum confidence threshold (default: 0.0)
 * @param limit - Maximum number of results (default: 50)
 * @returns List of route matches for the route
 */
export const getRouteMatchesForRoute = query({
  args: {
    routeId: v.id('curated_routes'),
    minConfidence: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      matchId: v.string(),
      postId: v.string(),
      matchConfidence: v.number(),
      cosineSimilarity: v.number(),
      matchReasoning: v.string(),
      rerankModel: v.string(),
      rerankCost: v.number(),
      matchedAt: v.number(),
      isArbitrated: v.boolean(),
      arbitrationNotes: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const { routeId, minConfidence = 0.0, limit = 50 } = args

    // Over-fetch by 2x to account for filtering
    const overFetchLimit = limit * 2

    // Query by routeId index
    const matches = await ctx.db
      .query('route_matches')
      .withIndex('by_routeId_and_confidence', (q) => q.eq('routeId', routeId))
      .order('desc')
      .take(overFetchLimit)

    // Filter by minConfidence and limit
    const filtered = matches
      .filter((match) => match.matchConfidence >= minConfidence)
      .slice(0, limit)

    return filtered
  },
})

// ---------------------------------------------------------------------------
// Query: verifyEmbeddings
// ---------------------------------------------------------------------------

/**
 * One-off query to verify embeddings in production.
 * Confirms all routes have embeddings and checks dimensions.
 */
export const verifyEmbeddings = query({
  args: {},
  returns: v.object({
    totalRoutes: v.number(),
    withEmbedding: v.number(),
    withoutEmbedding: v.number(),
    sampleRoute: v.optional(
      v.object({
        routeId: v.string(),
        name: v.string(),
        embeddingDimensions: v.number(),
        hasEmbedding: v.boolean(),
      }),
    ),
  }),
  handler: async (ctx) => {
    const routes = await ctx.db.query('curated_routes').take(10000)

    const withEmbedding = routes.filter((r) => r.searchEmbedding && r.searchEmbedding.length > 0)
    const withoutEmbedding = routes.filter(
      (r) => !r.searchEmbedding || r.searchEmbedding.length === 0,
    )

    const sample = withEmbedding[0]

    return {
      totalRoutes: routes.length,
      withEmbedding: withEmbedding.length,
      withoutEmbedding: withoutEmbedding.length,
      sampleRoute: sample
        ? {
            routeId: sample.routeId,
            name: sample.name,
            embeddingDimensions: sample.searchEmbedding?.length || 0,
            hasEmbedding: !!sample.searchEmbedding,
          }
        : undefined,
    }
  },
})

// ---------------------------------------------------------------------------
// Query: getRoutesNeedingEmbedding
// ---------------------------------------------------------------------------

/**
 * Get routes that need embeddings generated.
 *
 * Fetches all routes if incremental=false, or only routes without
 * searchEmbedding if incremental=true.
 *
 * @param incremental - If true, only return routes without searchEmbedding
 * @param limit - Maximum number of results (default: 1000)
 * @returns List of route documents
 */
export const getRoutesNeedingEmbedding = query({
  args: {
    incremental: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id('curated_routes'),
      routeId: v.string(),
      name: v.string(),
      state: v.string(),
      source: v.string(),
      centroidLat: v.number(),
      centroidLng: v.number(),
      lengthMiles: v.optional(v.float64()),
      boundsNeLat: v.optional(v.float64()),
      boundsNeLng: v.optional(v.float64()),
      boundsSwLat: v.optional(v.float64()),
      boundsSwLng: v.optional(v.float64()),
      candidateIdentifiers: v.optional(v.array(v.string())),
      highwayNumber: v.optional(v.string()),
      searchEmbedding: v.optional(v.array(v.number())),
    }),
  ),
  handler: async (ctx, args) => {
    const { incremental = false, limit = 1000 } = args

    // Fetch all routes (acceptable for 5k records)
    let routes = await ctx.db.query('curated_routes').take(limit)

    // Filter by searchEmbedding if incremental
    if (incremental) {
      routes = routes.filter((route) => !route.searchEmbedding)
    }

    // Map to the expected output format
    return routes.map((route) => ({
      _id: route._id,
      routeId: route.routeId,
      name: route.name,
      state: route.state,
      source: route.source,
      centroidLat: route.centroidLat,
      centroidLng: route.centroidLng,
      lengthMiles: route.lengthMiles,
      boundsNeLat: route.boundsNeLat,
      boundsNeLng: route.boundsNeLng,
      boundsSwLat: route.boundsSwLat,
      boundsSwLng: route.boundsSwLng,
      candidateIdentifiers: route.candidateIdentifiers,
      highwayNumber: route.highwayNumber,
      searchEmbedding: route.searchEmbedding,
    }))
  },
})

// ---------------------------------------------------------------------------
// Query: getRawPostsForRoute
// ---------------------------------------------------------------------------

/**
 * Get all raw posts for a specific route.
 *
 * Joins route_matches → route_posts_raw to fetch full post data for all
 * posts matched to a given route.
 *
 * @param routeId - Curated route document ID
 * @param limit - Maximum number of results (default: 50)
 * @returns List of { match, post } objects
 */
export const getRawPostsForRoute = query({
  args: {
    routeId: v.id('curated_routes'),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      match: v.object({
        matchId: v.string(),
        postId: v.string(),
        matchConfidence: v.number(),
        cosineSimilarity: v.number(),
        matchReasoning: v.string(),
        rerankModel: v.string(),
        rerankCost: v.number(),
        matchedAt: v.number(),
        isArbitrated: v.boolean(),
        arbitrationNotes: v.optional(v.string()),
      }),
      post: v.object({
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
      }),
    }),
  ),
  handler: async (ctx, args) => {
    const { routeId, limit = 50 } = args

    // Get route matches
    const matches = await ctx.db
      .query('route_matches')
      .withIndex('by_routeId_and_confidence', (q) => q.eq('routeId', routeId))
      .order('desc')
      .take(limit)

    // Fetch raw posts for each match
    const results = await Promise.all(
      matches.map(async (match) => {
        const post = await ctx.db
          .query('route_posts_raw')
          .withIndex('by_postId', (q) => q.eq('postId', match.postId))
          .first()

        if (!post) {
          return null
        }

        return { match, post }
      }),
    )

    // Filter out nulls
    return results.filter((result): result is NonNullable<typeof result> => result !== null)
  },
})

// ---------------------------------------------------------------------------
// Action: findCandidateRoutesHybrid (B3)
// ---------------------------------------------------------------------------

/**
 * Hybrid search for routes using both vector and text search.
 *
 * Executes vector search and text search in parallel, then unions the results
 * without duplicates. This provides the best of both semantic similarity and
 * exact identifier matching.
 *
 * Implemented as an action because Convex 1.34.x only exposes vectorSearch on
 * the action context. The action calls:
 *   - ctx.vectorSearch for the vector leg
 *   - ctx.runQuery(api.semanticSearch.findRoutesByIdentifier) for the text leg
 *     (which already excludes duplicateOf shadows via by_name_lower filtering)
 *   - ctx.runQuery(internal.semanticSearch.fetchVisibleRoutesByVectorIds) to
 *     hydrate vector hits and filter shadow rows
 *
 * @param embedding - OpenAI text-embedding-3-small vector (1536 dimensions)
 * @param identifier - Search string for text fallback
 * @param stateFilter - Optional state filter for both searches
 * @param limit - Maximum number of results (default: 20)
 * @returns List of routes with { routeId, name, state, cosineSimilarity?, matchType? }
 */
export const findCandidateRoutesHybrid = action({
  args: {
    embedding: v.array(v.number()),
    identifier: v.string(),
    stateFilter: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      routeId: v.id('curated_routes'),
      name: v.string(),
      state: v.string(),
      cosineSimilarity: v.optional(v.number()),
      matchType: v.optional(
        v.union(v.literal('name'), v.literal('highway'), v.literal('identifier')),
      ),
    }),
  ),
  handler: async (ctx, args): Promise<HybridSearchResult> => {
    const { embedding, identifier, stateFilter, limit = 20 } = args

    // Build vector filter
    const filter = stateFilter ? (q: any) => q.eq('state', stateFilter) : undefined

    // Run vector search (ActionCtx) and text search (query) in parallel
    const [vectorHits, textResults]: [
      VectorSearchHit<'curated_routes'>[],
      Array<{
        routeId: Id<'curated_routes'>
        name: string
        state: string
        matchType: 'name' | 'highway' | 'identifier'
      }>,
    ] = await Promise.all([
      ctx.vectorSearch('curated_routes', 'by_embedding', {
        vector: embedding,
        limit,
        filter,
      }),
      ctx.runQuery(api.semanticSearch.findRoutesByIdentifier, {
        identifier,
        stateFilter,
        limit,
      }),
    ])

    // Hydrate vector-hit documents and filter shadows via internal query
    const vectorDocs: Array<{
      _id: Id<'curated_routes'>
      name: string
      state: string
      candidateIdentifiers: string[] | undefined
    }> = await ctx.runQuery(internal.semanticSearch.fetchVisibleRoutesByVectorIds, {
      ids: vectorHits.map((h: VectorSearchHit<'curated_routes'>) => h._id),
    })

    // Build vector routes with similarity scores (preserving vector rank)
    const docById = new Map<string, (typeof vectorDocs)[0]>(
      vectorDocs.map((d) => [d._id as string, d]),
    )
    const vectorRoutes = vectorHits
      .filter((h: VectorSearchHit<'curated_routes'>) => docById.has(h._id as string))
      .map((h: VectorSearchHit<'curated_routes'>) => {
        const doc = docById.get(h._id as string)!
        return {
          routeId: h._id,
          name: doc.name,
          state: doc.state,
          cosineSimilarity: h._score,
        }
      })

    // Union results without duplicates (deduplicate by routeId)
    const seen = new Set<Id<'curated_routes'>>()
    const results: HybridSearchResult = []

    // Add vector results first (they have similarity scores)
    for (const route of vectorRoutes) {
      if (!seen.has(route.routeId)) {
        seen.add(route.routeId)
        results.push(route)
      }
    }

    // Add text results that aren't already in the set
    for (const route of textResults) {
      if (!seen.has(route.routeId)) {
        seen.add(route.routeId)
        results.push({
          routeId: route.routeId,
          name: route.name,
          state: route.state,
          matchType: route.matchType,
        })
      }
    }

    // Return up to limit
    return results.slice(0, limit)
  },
})

// ---------------------------------------------------------------------------
// Mutation: addCommunityWaypointMention (B3)
// ---------------------------------------------------------------------------

/**
 * Add a community waypoint mention from a post.
 *
 * Records waypoint mentions extracted from community posts by the LLM
 * extraction pipeline. These mentions are used for waypoint discovery
 * and matching.
 *
 * @param postId - Community post ID
 * @param postUrl - URL of the community post
 * @param name - Name of the waypoint
 * @param lat - Optional latitude
 * @param lng - Optional longitude
 * @param region - Geographic region
 * @param proposedCategory - Proposed waypoint category
 * @param riderQuote - Quote from the rider mentioning the waypoint
 * @param confidenceScore - Extraction confidence score [0, 1]
 * @param extractedAt - Timestamp of extraction
 * @returns Inserted document ID
 */
export const addCommunityWaypointMention = mutation({
  args: {
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
  },
  returns: v.id('community_waypoint_mentions'),
  handler: async (ctx, args) => {
    const { confidenceScore, ...rest } = args

    // Validate confidenceScore is in [0, 1]
    if (confidenceScore < 0 || confidenceScore > 1) {
      throw new Error(`Invalid confidenceScore: must be [0, 1], got ${confidenceScore}`)
    }

    // Insert waypoint mention
    const mentionId = await ctx.db.insert('community_waypoint_mentions', {
      confidenceScore,
      ...rest,
    })

    return mentionId
  },
})
