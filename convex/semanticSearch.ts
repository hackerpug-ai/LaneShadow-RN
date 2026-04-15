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

import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

const EMBEDDING_DIMENSIONS = 1536;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// Proper Convex types for our document tables
type CuratedRouteDoc = Doc<"curated_routes">;
type RouteMatchDoc = Doc<"route_matches">;
type RoutePostRawDoc = Doc<"route_posts_raw">;

// ---------------------------------------------------------------------------
// Query: findCandidateRoutesByEmbedding
// ---------------------------------------------------------------------------

/**
 * Vector search for routes by embedding similarity.
 *
 * Uses curated_routes.by_embedding vectorIndex to find semantically similar routes.
 * Returns route documents with cosine similarity scores, sorted by similarity.
 *
 * @param embedding - OpenAI text-embedding-3-small vector (1536 dimensions)
 * @param limit - Maximum number of results (default: 10)
 * @param stateFilter - Optional state filter for vectorIndex (e.g., "CA", "CO")
 * @returns List of routes with { routeId, cosineSimilarity, name, state, candidateIdentifiers }
 */
export const findCandidateRoutesByEmbedding = query({
  args: {
    embedding: v.array(v.number()),
    limit: v.optional(v.number()),
    stateFilter: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      routeId: v.id("curated_routes"),
      cosineSimilarity: v.number(),
      name: v.string(),
      state: v.string(),
      candidateIdentifiers: v.optional(v.array(v.string())),
    })
  ),
  handler: async (ctx, args) => {
    const { embedding, limit = 10, stateFilter } = args;

    // Validate embedding dimensions
    if (embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(
        `Invalid embedding dimensions: expected ${EMBEDDING_DIMENSIONS}, got ${embedding.length}`
      );
    }

    // Build vector filter
    const filter = stateFilter
      ? (q: any) => q.eq("state", stateFilter)
      : undefined;

    // Execute vector search
    const results = await (ctx as any).vectorSearch("curated_routes", "by_embedding", {
      vector: embedding,
      limit,
      filter,
    });

    // Fetch full documents and join with _score
    const routes = await Promise.all(
      results.map(async ({ _id, _score }: { _id: any; _score: number }) => {
        const doc = await ctx.db.get(_id) as CuratedRouteDoc | null;
        if (!doc) {
          return null;
        }
        return {
          routeId: _id,
          cosineSimilarity: _score,
          name: doc.name,
          state: doc.state,
          candidateIdentifiers: doc.candidateIdentifiers,
        };
      })
    );

    // Filter out nulls
    return routes.filter((route): route is NonNullable<typeof route> => route !== null);
  },
});

// ---------------------------------------------------------------------------
// Query: findRoutesByIdentifier
// ---------------------------------------------------------------------------

/**
 * Text fallback for exact route matches by identifier.
 *
 * Searches curated_routes for exact matches on:
 * - name (case-insensitive)
 * - highwayNumber
 * - candidateIdentifiers array
 *
 * For 5k routes, scan + filter is acceptable.
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
      routeId: v.id("curated_routes"),
      name: v.string(),
      state: v.string(),
      matchType: v.union(v.literal("name"), v.literal("highway"), v.literal("identifier")),
    })
  ),
  handler: async (ctx, args) => {
    const { identifier, stateFilter, limit = 20 } = args;
    const searchTerm = identifier.toLowerCase();

    // Use index for state filtering to reduce scan set
    const routes = stateFilter
      ? await ctx.db.query("curated_routes").withIndex("by_state", (q) => q.eq("state", stateFilter)).collect()
      : await ctx.db.query("curated_routes").collect();

    // Find matches
    const matches: {
      routeId: Id<"curated_routes">;
      name: string;
      state: string;
      matchType: "name" | "highway" | "identifier";
    }[] = [];

    for (const route of routes) {
      // Match by name (case-insensitive)
      if (route.name.toLowerCase().includes(searchTerm)) {
        matches.push({
          routeId: route._id,
          name: route.name,
          state: route.state,
          matchType: "name",
        });
        continue;
      }

      // Match by highwayNumber
      if (route.highwayNumber && route.highwayNumber.toLowerCase().includes(searchTerm)) {
        matches.push({
          routeId: route._id,
          name: route.name,
          state: route.state,
          matchType: "highway",
        });
        continue;
      }

      // Match by candidateIdentifiers
      if (route.candidateIdentifiers) {
        const identifierMatch = route.candidateIdentifiers.find((id) =>
          id.toLowerCase().includes(searchTerm)
        );
        if (identifierMatch) {
          matches.push({
            routeId: route._id,
            name: route.name,
            state: route.state,
            matchType: "identifier",
          });
          continue;
        }
      }

      // Stop if we've hit the limit
      if (matches.length >= limit) {
        break;
      }
    }

    return matches.slice(0, limit);
  },
});

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
    routeId: v.id("curated_routes"),
    searchText: v.string(),
    searchEmbedding: v.array(v.number()),
  },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, args) => {
    const { routeId, searchText, searchEmbedding } = args;

    // Validate embedding dimensions
    if (searchEmbedding.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(
        `Invalid embedding dimensions: expected ${EMBEDDING_DIMENSIONS}, got ${searchEmbedding.length}`
      );
    }

    // Update route with embedding data
    await ctx.db.patch(routeId, {
      searchText,
      searchEmbedding,
    });

    return { ok: true };
  },
});

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
    routeId: v.id("curated_routes"),
    matchConfidence: v.number(),
    cosineSimilarity: v.number(),
    matchReasoning: v.string(),
    rerankModel: v.string(),
    rerankCost: v.number(),
    matchedAt: v.number(),
    isArbitrated: v.boolean(),
    arbitrationNotes: v.optional(v.string()),
  },
  returns: v.id("route_matches"),
  handler: async (ctx, args) => {
    const {
      matchId,
      postId,
      routeId,
      matchConfidence,
      cosineSimilarity,
      rerankCost,
      ...rest
    } = args;

    // Validate ranges
    if (matchConfidence < 0 || matchConfidence > 1) {
      throw new Error(`Invalid matchConfidence: must be [0, 1], got ${matchConfidence}`);
    }
    if (cosineSimilarity < 0 || cosineSimilarity > 1) {
      throw new Error(`Invalid cosineSimilarity: must be [0, 1], got ${cosineSimilarity}`);
    }
    if (rerankCost < 0) {
      throw new Error(`Invalid rerankCost: must be >= 0, got ${rerankCost}`);
    }

    // Insert match record
    const matchIdDoc = await ctx.db.insert("route_matches", {
      matchId,
      postId,
      routeId,
      matchConfidence,
      cosineSimilarity,
      rerankCost,
      ...rest,
    });

    return matchIdDoc;
  },
});

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
      routeId: v.id("curated_routes"),
      matchConfidence: v.number(),
      cosineSimilarity: v.number(),
      matchReasoning: v.string(),
      rerankModel: v.string(),
      rerankCost: v.number(),
      matchedAt: v.number(),
      isArbitrated: v.boolean(),
      arbitrationNotes: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const { postId } = args;

    // Query by postId index
    const matches = await ctx.db
      .query("route_matches")
      .withIndex("by_postId", (q) => q.eq("postId", postId))
      .collect();

    // Sort by matchConfidence descending
    matches.sort((a, b) => b.matchConfidence - a.matchConfidence);

    return matches;
  },
});

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
    routeId: v.id("curated_routes"),
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
    })
  ),
  handler: async (ctx, args) => {
    const { routeId, minConfidence = 0.0, limit = 50 } = args;

    // Over-fetch by 2x to account for filtering
    const overFetchLimit = limit * 2;

    // Query by routeId index
    const matches = await ctx.db
      .query("route_matches")
      .withIndex("by_routeId_and_confidence", (q) => q.eq("routeId", routeId))
      .order("desc")
      .take(overFetchLimit);

    // Filter by minConfidence and limit
    const filtered = matches
      .filter((match) => match.matchConfidence >= minConfidence)
      .slice(0, limit);

    return filtered;
  },
});

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
      _id: v.id("curated_routes"),
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
    })
  ),
  handler: async (ctx, args) => {
    const { incremental = false, limit = 1000 } = args;

    // Fetch all routes (acceptable for 5k records)
    let routes = await ctx.db.query("curated_routes").take(limit);

    // Filter by searchEmbedding if incremental
    if (incremental) {
      routes = routes.filter((route) => !route.searchEmbedding);
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
    }));
  },
});

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
    routeId: v.id("curated_routes"),
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
    })
  ),
  handler: async (ctx, args) => {
    const { routeId, limit = 50 } = args;

    // Get route matches
    const matches = await ctx.db
      .query("route_matches")
      .withIndex("by_routeId_and_confidence", (q) => q.eq("routeId", routeId))
      .order("desc")
      .take(limit);

    // Fetch raw posts for each match
    const results = await Promise.all(
      matches.map(async (match) => {
        const post = await ctx.db
          .query("route_posts_raw")
          .withIndex("by_postId", (q) => q.eq("postId", match.postId))
          .first();

        if (!post) {
          return null;
        }

        return { match, post };
      })
    );

    // Filter out nulls
    return results.filter((result): result is NonNullable<typeof result> => result !== null);
  },
});
