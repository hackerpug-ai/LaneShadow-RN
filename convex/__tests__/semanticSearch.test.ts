/**
 * Semantic Search Tests (INF-006)
 *
 * Behavioral tests for vector search, route matching, and raw post retrieval.
 * These tests exercise actual Convex function behavior using mocked contexts.
 *
 * Covers all 10 ACs from INF-006 specification:
 * - AC-1: findCandidateRoutesByEmbedding uses ctx.vectorSearch
 * - AC-2: findCandidateRoutesByEmbedding supports state filter
 * - AC-3: findRoutesByIdentifier matches by name, highway, and candidateIdentifiers
 * - AC-4: updateRouteEmbedding patches only the embedding fields
 * - AC-5: updateRouteEmbedding rejects wrong-dimension embeddings
 * - AC-6: addRouteMatch validates input and returns the new match id
 * - AC-7: addRouteMatch rejects out-of-range confidence/similarity
 * - AC-8: getRouteMatchesForPost uses by_postId index
 * - AC-9: getRouteMatchesForRoute uses by_routeId_and_confidence index
 * - AC-10: getRawPostsForRoute joins route_matches and route_posts_raw
 */

import { describe, expect, it, vi } from 'vitest'
import type { Id } from '../_generated/dataModel'
import {
  addRouteMatch,
  findCandidateRoutesByEmbedding,
  findRoutesByIdentifier,
  getRawPostsForRoute,
  getRouteMatchesForPost,
  getRouteMatchesForRoute,
  updateRouteEmbedding,
} from '../semanticSearch'

// Helper to call the handler from a Convex query/mutation
const callHandler = (fn: any, ctx: any, args: any) => fn.handler(ctx, args)

// ---------------------------------------------------------------------------
// Test data helpers
// ---------------------------------------------------------------------------

const createMockVectorSearchResult = (id: string, score: number) => ({
  _id: `${id}` as Id<'curated_routes'>,
  _score: score,
})

const createMockCuratedRoute = (overrides: Record<string, unknown> = {}) => ({
  _id: ':test-route' as Id<'curated_routes'>,
  routeId: 'test-route-1',
  name: 'Tail of the Dragon',
  name_lower: 'tail of the dragon',
  state: 'TN',
  centroidLat: 35.5,
  centroidLng: -83.5,
  compositeScore: 85.5,
  curvatureScore: 90.0,
  scenicScore: 88.0,
  technicalScore: 82.0,
  trafficScore: 75.0,
  remotenessScore: 80.0,
  primaryArchetype: 'twisties' as const,
  secondaryTags: ['scenic', 'mountain'],
  oneLiner: 'A great twisty route',
  summary: 'This is a detailed summary',
  badges: ['scenic', 'technical'],
  season: 'year_round' as const,
  contentVersion: 1,
  enrichmentVersion: null,
  seededAt: Date.now(),
  highwayNumber: 'US-129',
  candidateIdentifiers: ['The Dragon', 'Deals Gap'],
  searchEmbedding: new Array(1536).fill(0.1),
  searchText: 'Tail of the Dragon US-129 Deals Gap',
  ...overrides,
})

const createMockRouteMatch = (overrides: Record<string, unknown> = {}) => ({
  _id: ':match-id' as Id<'route_matches'>,
  matchId: 'match-123',
  postId: 'post-456',
  routeId: ':test-route' as Id<'curated_routes'>,
  matchConfidence: 0.95,
  cosineSimilarity: 0.88,
  matchReasoning: 'High semantic similarity',
  rerankModel: 'gpt-4o',
  rerankCost: 0.001,
  matchedAt: Date.now(),
  isArbitrated: false,
  ...overrides,
})

const createMockRoutePostRaw = (overrides: Record<string, unknown> = {}) => ({
  _id: ':post-id' as Id<'route_posts_raw'>,
  postId: 'post-456',
  source: 'reddit',
  postUrl: 'https://reddit.com/r/motorcycles/post-456',
  postAuthor: 'rider123',
  postScore: 42,
  postedAt: Date.now() - 3600000,
  rawText: 'Rode the Dragon today, amazing!',
  extractionSchemaVersion: 1,
  extractionModel: 'gpt-4o',
  extractionCost: 0.01,
  extractedAt: Date.now(),
  extractionConfidence: 0.92,
  payload: {
    roadNameMentions: ['Tail of the Dragon', 'US-129'],
    highwayRefs: ['US-129'],
    stateRefs: ['TN', 'NC'],
    landmarkRefs: ["Deal's Gap Motorcycle Resort"],
    sentiment: 'positive',
    aspectScores: { scenic: 0.9, technical: 0.85 },
    attributes: { scenic: true, technical: true },
    warnings: [],
  },
  ...overrides,
})

const createValidEmbedding = () => new Array(1536).fill(0.1)

// ---------------------------------------------------------------------------
// AC-1: findCandidateRoutesByEmbedding uses ctx.vectorSearch
// ---------------------------------------------------------------------------

describe('AC-1: findCandidateRoutesByEmbedding uses ctx.vectorSearch', () => {
  it('should return routes with cosine similarity from vector search', async () => {
    const embedding = createValidEmbedding()
    const vectorResults = [
      createMockVectorSearchResult(':route1', 0.95),
      createMockVectorSearchResult(':route2', 0.87),
    ]

    const mockRoutes = [
      createMockCuratedRoute({
        _id: ':route1' as Id<'curated_routes'>,
        name: 'Route 1',
        state: 'CA',
      }),
      createMockCuratedRoute({
        _id: ':route2' as Id<'curated_routes'>,
        name: 'Route 2',
        state: 'CO',
      }),
    ]

    const vectorSearch = vi.fn().mockResolvedValue(vectorResults)
    const dbGet = vi.fn((id) => {
      if (id === ':route1') return mockRoutes[0]
      if (id === ':route2') return mockRoutes[1]
      return null
    })

    const ctx = {
      db: { get: dbGet },
    } as any
    ;(ctx as any).vectorSearch = vectorSearch

    const result = await callHandler(findCandidateRoutesByEmbedding, ctx, { embedding })

    expect(vectorSearch).toHaveBeenCalledWith(
      'curated_routes',
      'by_embedding',
      expect.objectContaining({
        vector: embedding,
        limit: 10,
      }),
    )

    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({
      routeId: ':route1',
      cosineSimilarity: 0.95,
      name: 'Route 1',
      state: 'CA',
    })
    expect(result[1]).toMatchObject({
      routeId: ':route2',
      cosineSimilarity: 0.87,
      name: 'Route 2',
      state: 'CO',
    })
  })

  it('should filter out null routes from results', async () => {
    const embedding = createValidEmbedding()
    const vectorResults = [
      createMockVectorSearchResult(':route1', 0.95),
      createMockVectorSearchResult(':deleted-route', 0.87), // This route was deleted
    ]

    const vectorSearch = vi.fn().mockResolvedValue(vectorResults)
    const dbGet = vi.fn((id) => {
      if (id === ':route1')
        return createMockCuratedRoute({ _id: ':route1' as Id<'curated_routes'> })
      if (id === ':deleted-route') return null // Deleted route
      return null
    })

    const ctx = { db: { get: dbGet } } as any
    ;(ctx as any).vectorSearch = vectorSearch

    const result = await callHandler(findCandidateRoutesByEmbedding, ctx, { embedding })

    expect(result).toHaveLength(1)
    expect(result[0].routeId).toBe(':route1')
  })
})

// ---------------------------------------------------------------------------
// AC-2: findCandidateRoutesByEmbedding supports state filter
// ---------------------------------------------------------------------------

describe('AC-2: findCandidateRoutesByEmbedding supports state filter', () => {
  it('should apply state filter when provided', async () => {
    const embedding = createValidEmbedding()
    const vectorResults = [createMockVectorSearchResult(':route1', 0.95)]

    const vectorSearch = vi.fn().mockResolvedValue(vectorResults)
    const dbGet = vi.fn(() =>
      createMockCuratedRoute({ _id: ':route1' as Id<'curated_routes'>, state: 'TN' }),
    )

    const ctx = { db: { get: dbGet } } as any
    ;(ctx as any).vectorSearch = vectorSearch

    await callHandler(findCandidateRoutesByEmbedding, ctx, { embedding, stateFilter: 'TN' })

    expect(vectorSearch).toHaveBeenCalledWith(
      'curated_routes',
      'by_embedding',
      expect.objectContaining({
        vector: embedding,
        limit: 10,
        filter: expect.any(Function),
      }),
    )

    // Verify filter function works correctly
    const filterCall = vectorSearch.mock.calls[0][2].filter
    const mockQuery = { eq: vi.fn().mockReturnThis() }
    filterCall(mockQuery)
    expect(mockQuery.eq).toHaveBeenCalledWith('state', 'TN')
  })

  it('should not apply filter when stateFilter is not provided', async () => {
    const embedding = createValidEmbedding()
    const vectorResults = [createMockVectorSearchResult(':route1', 0.95)]

    const vectorSearch = vi.fn().mockResolvedValue(vectorResults)
    const dbGet = vi.fn(() => createMockCuratedRoute({ _id: ':route1' as Id<'curated_routes'> }))

    const ctx = { db: { get: dbGet } } as any
    ;(ctx as any).vectorSearch = vectorSearch

    await callHandler(findCandidateRoutesByEmbedding, ctx, { embedding })

    expect(vectorSearch).toHaveBeenCalledWith(
      'curated_routes',
      'by_embedding',
      expect.objectContaining({
        vector: embedding,
        limit: 10,
        filter: undefined,
      }),
    )
  })
})

// ---------------------------------------------------------------------------
// AC-3: findRoutesByIdentifier matches by name, highway, and candidateIdentifiers
// ---------------------------------------------------------------------------

describe('AC-3: findRoutesByIdentifier matches by name, highway, and candidateIdentifiers', () => {
  it('should match by name case-insensitively', async () => {
    const mockRoute = createMockCuratedRoute({
      name: 'Tail of the Dragon',
      name_lower: 'tail of the dragon',
    })

    const ctx = {
      db: {
        query: vi.fn(() => ({
          withIndex: vi.fn((indexName, callback) => {
            const qb = { eq: vi.fn().mockReturnThis() }
            callback(qb)
            return {
              take: vi.fn().mockResolvedValue([mockRoute]),
            }
          }),
          take: vi.fn().mockResolvedValue([]),
        })),
      },
    } as any

    const result = await callHandler(findRoutesByIdentifier, ctx, {
      identifier: 'TAIL OF THE DRAGON',
    })

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      name: 'Tail of the Dragon',
      matchType: 'name',
    })
  })

  it('should match by highway number', async () => {
    const mockRoute = createMockCuratedRoute({
      highwayNumber: 'US-129',
      name_lower: 'other name',
    })

    const ctx = {
      db: {
        query: vi.fn(() => ({
          withIndex: vi.fn((indexName, callback) => {
            const qb = { eq: vi.fn().mockReturnThis() }
            callback(qb)
            // Only return the route for highway index, not name index
            if (indexName === 'by_highway_number') {
              return {
                take: vi.fn().mockResolvedValue([mockRoute]),
              }
            }
            return {
              take: vi.fn().mockResolvedValue([]),
            }
          }),
          take: vi.fn().mockResolvedValue([]),
        })),
      },
    } as any

    const result = await callHandler(findRoutesByIdentifier, ctx, { identifier: 'US-129' })

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      name: 'Tail of the Dragon',
      matchType: 'highway',
    })
  })

  it('should match by candidateIdentifiers array', async () => {
    const mockRoute = createMockCuratedRoute({
      candidateIdentifiers: ['The Dragon', 'Deals Gap'],
      name_lower: 'tail of the dragon',
    })

    const ctx = {
      db: {
        query: vi.fn(() => ({
          withIndex: vi.fn((indexName, callback) => {
            const qb = { eq: vi.fn().mockReturnThis() }
            callback(qb)
            return {
              take: vi.fn().mockResolvedValue([]),
            }
          }),
          take: vi.fn().mockResolvedValue([mockRoute]),
        })),
      },
    } as any

    const result = await callHandler(findRoutesByIdentifier, ctx, { identifier: 'Deals Gap' })

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      matchType: 'identifier',
    })
  })

  it('should prioritize name matches over highway matches', async () => {
    const nameRoute = createMockCuratedRoute({
      _id: ':name-route' as Id<'curated_routes'>,
      name: 'Dragon',
      name_lower: 'dragon',
      highwayNumber: 'US-129',
    })

    const highwayRoute = createMockCuratedRoute({
      _id: ':highway-route' as Id<'curated_routes'>,
      name: 'Other Route',
      name_lower: 'other route',
      highwayNumber: 'US-129',
    })

    const ctx = {
      db: {
        query: vi.fn(() => ({
          withIndex: vi.fn((indexName, callback) => {
            const qb = { eq: vi.fn().mockReturnThis() }
            callback(qb)
            if (indexName === 'by_name_lower') {
              return {
                take: vi.fn().mockResolvedValue([nameRoute]),
              }
            }
            if (indexName === 'by_highway_number') {
              // The highway route also has 'US-129', but it should be ignored
              // because nameRoute is already in the matchMap
              return {
                take: vi.fn().mockResolvedValue([highwayRoute]),
              }
            }
            return {
              take: vi.fn().mockResolvedValue([]),
            }
          }),
          take: vi.fn().mockResolvedValue([]),
        })),
      },
    } as any

    const result = await callHandler(findRoutesByIdentifier, ctx, { identifier: 'dragon' })

    // The nameRoute matches by name, so it's added first
    // The highwayRoute also matches by highway, but since it has a different _id,
    // it would normally be added too. However, the test expects only 1 result.
    // This test is actually testing that name matches take priority, but since
    // these are different routes, both should be returned.
    // Let me check the implementation logic again...

    // Actually, looking at the implementation, name matches are added first,
    // then highway matches are added ONLY if the routeId is not already in the map.
    // Since these are different routes with different _ids, both should be returned.

    // The test expectation seems wrong. Let me fix it to expect 2 results.
    expect(result).toHaveLength(2)
    expect(result[0].routeId).toBe(':name-route')
    expect(result[0].matchType).toBe('name')
    expect(result[1].routeId).toBe(':highway-route')
    expect(result[1].matchType).toBe('highway')
  })
})

// ---------------------------------------------------------------------------
// AC-4: updateRouteEmbedding patches only the embedding fields
// ---------------------------------------------------------------------------

describe('AC-4: updateRouteEmbedding patches only the embedding fields', () => {
  it('should update searchText and searchEmbedding fields', async () => {
    const routeId = ':test-route' as Id<'curated_routes'>
    const searchText = 'Updated search text'
    const searchEmbedding = createValidEmbedding()

    const dbPatch = vi.fn().mockResolvedValue(undefined)

    const ctx = { db: { patch: dbPatch } } as any

    const result = await callHandler(updateRouteEmbedding, ctx, {
      routeId,
      searchText,
      searchEmbedding,
    })

    expect(dbPatch).toHaveBeenCalledWith(routeId, {
      searchText,
      searchEmbedding,
    })

    expect(result).toEqual({ ok: true })
  })

  it('should not modify other fields', async () => {
    const routeId = ':test-route' as Id<'curated_routes'>
    const searchText = 'Updated search text'
    const searchEmbedding = createValidEmbedding()

    const dbPatch = vi.fn().mockResolvedValue(undefined)

    const ctx = { db: { patch: dbPatch } } as any

    await callHandler(updateRouteEmbedding, ctx, { routeId, searchText, searchEmbedding })

    const patchArgs = dbPatch.mock.calls[0][1]
    expect(Object.keys(patchArgs)).toHaveLength(2)
    expect(patchArgs).toHaveProperty('searchText')
    expect(patchArgs).toHaveProperty('searchEmbedding')
  })
})

// ---------------------------------------------------------------------------
// AC-5: updateRouteEmbedding rejects wrong-dimension embeddings
// ---------------------------------------------------------------------------

describe('AC-5: updateRouteEmbedding rejects wrong-dimension embeddings', () => {
  it('should throw error for embedding with wrong dimensions', async () => {
    const routeId = ':test-route' as Id<'curated_routes'>
    const searchText = 'Search text'
    const wrongEmbedding = new Array(768).fill(0.1) // Wrong: 768 instead of 1536

    const ctx = { db: { patch: vi.fn() } } as any

    await expect(
      callHandler(updateRouteEmbedding, ctx, {
        routeId,
        searchText,
        searchEmbedding: wrongEmbedding,
      }),
    ).rejects.toThrow('Invalid embedding dimensions: expected 1536, got 768')
  })

  it('should throw error for empty embedding', async () => {
    const routeId = ':test-route' as Id<'curated_routes'>
    const searchText = 'Search text'
    const emptyEmbedding: number[] = []

    const ctx = { db: { patch: vi.fn() } } as any

    await expect(
      callHandler(updateRouteEmbedding, ctx, {
        routeId,
        searchText,
        searchEmbedding: emptyEmbedding,
      }),
    ).rejects.toThrow('Invalid embedding dimensions: expected 1536, got 0')
  })

  it('should accept correct 1536-dimension embedding', async () => {
    const routeId = ':test-route' as Id<'curated_routes'>
    const searchText = 'Search text'
    const correctEmbedding = createValidEmbedding()

    const dbPatch = vi.fn().mockResolvedValue(undefined)
    const ctx = { db: { patch: dbPatch } } as any

    await expect(
      callHandler(updateRouteEmbedding, ctx, {
        routeId,
        searchText,
        searchEmbedding: correctEmbedding,
      }),
    ).resolves.toEqual({ ok: true })

    expect(dbPatch).toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// AC-6: addRouteMatch validates input and returns the new match id
// ---------------------------------------------------------------------------

describe('AC-6: addRouteMatch validates input and returns the new match id', () => {
  it('should insert route match and return id', async () => {
    const matchArgs = {
      matchId: 'match-123',
      postId: 'post-456',
      routeId: ':test-route' as Id<'curated_routes'>,
      matchConfidence: 0.95,
      cosineSimilarity: 0.88,
      matchReasoning: 'High semantic similarity',
      rerankModel: 'gpt-4o',
      rerankCost: 0.001,
      matchedAt: Date.now(),
      isArbitrated: false,
    }

    const insertedId = ':inserted-match' as Id<'route_matches'>
    const dbInsert = vi.fn().mockResolvedValue(insertedId)

    const ctx = { db: { insert: dbInsert } } as any

    const result = await callHandler(addRouteMatch, ctx, matchArgs)

    expect(dbInsert).toHaveBeenCalledWith(
      'route_matches',
      expect.objectContaining({
        matchId: 'match-123',
        postId: 'post-456',
        routeId: ':test-route',
        matchConfidence: 0.95,
        cosineSimilarity: 0.88,
      }),
    )

    expect(result).toBe(insertedId)
  })
})

// ---------------------------------------------------------------------------
// AC-7: addRouteMatch rejects out-of-range confidence/similarity
// ---------------------------------------------------------------------------

describe('AC-7: addRouteMatch rejects out-of-range confidence/similarity', () => {
  it('should throw error for matchConfidence > 1', async () => {
    const matchArgs = {
      matchId: 'match-123',
      postId: 'post-456',
      routeId: ':test-route' as Id<'curated_routes'>,
      matchConfidence: 1.5, // Invalid: > 1
      cosineSimilarity: 0.88,
      matchReasoning: 'Test',
      rerankModel: 'gpt-4o',
      rerankCost: 0.001,
      matchedAt: Date.now(),
      isArbitrated: false,
    }

    const ctx = { db: { insert: vi.fn() } } as any

    await expect(callHandler(addRouteMatch, ctx, matchArgs)).rejects.toThrow(
      'Invalid matchConfidence: must be [0, 1], got 1.5',
    )
  })

  it('should throw error for matchConfidence < 0', async () => {
    const matchArgs = {
      matchId: 'match-123',
      postId: 'post-456',
      routeId: ':test-route' as Id<'curated_routes'>,
      matchConfidence: -0.1, // Invalid: < 0
      cosineSimilarity: 0.88,
      matchReasoning: 'Test',
      rerankModel: 'gpt-4o',
      rerankCost: 0.001,
      matchedAt: Date.now(),
      isArbitrated: false,
    }

    const ctx = { db: { insert: vi.fn() } } as any

    await expect(callHandler(addRouteMatch, ctx, matchArgs)).rejects.toThrow(
      'Invalid matchConfidence: must be [0, 1], got -0.1',
    )
  })

  it('should throw error for cosineSimilarity > 1', async () => {
    const matchArgs = {
      matchId: 'match-123',
      postId: 'post-456',
      routeId: ':test-route' as Id<'curated_routes'>,
      matchConfidence: 0.95,
      cosineSimilarity: 1.2, // Invalid: > 1
      matchReasoning: 'Test',
      rerankModel: 'gpt-4o',
      rerankCost: 0.001,
      matchedAt: Date.now(),
      isArbitrated: false,
    }

    const ctx = { db: { insert: vi.fn() } } as any

    await expect(callHandler(addRouteMatch, ctx, matchArgs)).rejects.toThrow(
      'Invalid cosineSimilarity: must be [0, 1], got 1.2',
    )
  })

  it('should throw error for cosineSimilarity < 0', async () => {
    const matchArgs = {
      matchId: 'match-123',
      postId: 'post-456',
      routeId: ':test-route' as Id<'curated_routes'>,
      matchConfidence: 0.95,
      cosineSimilarity: -0.1, // Invalid: < 0
      matchReasoning: 'Test',
      rerankModel: 'gpt-4o',
      rerankCost: 0.001,
      matchedAt: Date.now(),
      isArbitrated: false,
    }

    const ctx = { db: { insert: vi.fn() } } as any

    await expect(callHandler(addRouteMatch, ctx, matchArgs)).rejects.toThrow(
      'Invalid cosineSimilarity: must be [0, 1], got -0.1',
    )
  })

  it('should throw error for negative rerankCost', async () => {
    const matchArgs = {
      matchId: 'match-123',
      postId: 'post-456',
      routeId: ':test-route' as Id<'curated_routes'>,
      matchConfidence: 0.95,
      cosineSimilarity: 0.88,
      matchReasoning: 'Test',
      rerankModel: 'gpt-4o',
      rerankCost: -0.01, // Invalid: negative
      matchedAt: Date.now(),
      isArbitrated: false,
    }

    const ctx = { db: { insert: vi.fn() } } as any

    await expect(callHandler(addRouteMatch, ctx, matchArgs)).rejects.toThrow(
      'Invalid rerankCost: must be >= 0, got -0.01',
    )
  })

  it('should accept valid boundary values', async () => {
    const matchArgs = {
      matchId: 'match-123',
      postId: 'post-456',
      routeId: ':test-route' as Id<'curated_routes'>,
      matchConfidence: 0.0, // Valid: boundary
      cosineSimilarity: 1.0, // Valid: boundary
      matchReasoning: 'Test',
      rerankModel: 'gpt-4o',
      rerankCost: 0.0, // Valid: boundary
      matchedAt: Date.now(),
      isArbitrated: false,
    }

    const dbInsert = vi.fn().mockResolvedValue(':match-id' as Id<'route_matches'>)
    const ctx = { db: { insert: dbInsert } } as any

    await expect(callHandler(addRouteMatch, ctx, matchArgs)).resolves.toBe(':match-id')
    expect(dbInsert).toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// AC-8: getRouteMatchesForPost uses by_postId index
// ---------------------------------------------------------------------------

describe('AC-8: getRouteMatchesForPost uses by_postId index', () => {
  it('should query using by_postId index', async () => {
    const postId = 'post-456'
    const mockMatches = [
      createMockRouteMatch({ postId, matchConfidence: 0.95 }),
      createMockRouteMatch({ postId, matchConfidence: 0.87 }),
    ]

    const withIndex = vi.fn((indexName, callback) => {
      expect(indexName).toBe('by_postId')
      // Call the callback with a query builder
      const qb = { eq: vi.fn().mockReturnThis() }
      callback(qb)
      // Return the final builder with collect
      return {
        collect: vi.fn().mockResolvedValue(mockMatches),
      }
    })

    const ctx = { db: { query: vi.fn(() => ({ withIndex })) } } as any

    const result = await callHandler(getRouteMatchesForPost, ctx, { postId })

    expect(withIndex).toHaveBeenCalledWith('by_postId', expect.any(Function))
    expect(result).toHaveLength(2)
  })

  it('should sort results by matchConfidence descending', async () => {
    const postId = 'post-456'
    const mockMatches = [
      createMockRouteMatch({ postId, matchConfidence: 0.75 }),
      createMockRouteMatch({ postId, matchConfidence: 0.95 }),
      createMockRouteMatch({ postId, matchConfidence: 0.87 }),
    ]

    const withIndex = vi.fn((indexName, callback) => {
      const qb = { eq: vi.fn().mockReturnThis() }
      callback(qb)
      return {
        collect: vi.fn().mockResolvedValue(mockMatches),
      }
    })

    const ctx = { db: { query: vi.fn(() => ({ withIndex })) } } as any

    const result = await callHandler(getRouteMatchesForPost, ctx, { postId })

    expect(result[0].matchConfidence).toBe(0.95)
    expect(result[1].matchConfidence).toBe(0.87)
    expect(result[2].matchConfidence).toBe(0.75)
  })
})

// ---------------------------------------------------------------------------
// AC-9: getRouteMatchesForRoute uses by_routeId_and_confidence index
// ---------------------------------------------------------------------------

describe('AC-9: getRouteMatchesForRoute uses by_routeId_and_confidence index', () => {
  it('should query using by_routeId_and_confidence index', async () => {
    const routeId = ':test-route' as Id<'curated_routes'>
    const mockMatches = [
      createMockRouteMatch({ routeId, matchConfidence: 0.95 }),
      createMockRouteMatch({ routeId, matchConfidence: 0.87 }),
    ]

    const withIndex = vi.fn((indexName, callback) => {
      expect(indexName).toBe('by_routeId_and_confidence')
      const qb = { eq: vi.fn().mockReturnThis() }
      callback(qb)
      return {
        order: vi.fn(() => ({
          take: vi.fn().mockResolvedValue(mockMatches),
        })),
      }
    })

    const ctx = { db: { query: vi.fn(() => ({ withIndex })) } } as any

    const result = await callHandler(getRouteMatchesForRoute, ctx, { routeId })

    expect(withIndex).toHaveBeenCalledWith('by_routeId_and_confidence', expect.any(Function))
    expect(result).toHaveLength(2)
  })

  it('should filter by minConfidence', async () => {
    const routeId = ':test-route' as Id<'curated_routes'>
    const mockMatches = [
      createMockRouteMatch({ routeId, matchConfidence: 0.95 }),
      createMockRouteMatch({ routeId, matchConfidence: 0.75 }),
      createMockRouteMatch({ routeId, matchConfidence: 0.87 }),
    ]

    const withIndex = vi.fn((indexName, callback) => {
      const qb = { eq: vi.fn().mockReturnThis() }
      callback(qb)
      return {
        order: vi.fn(() => ({
          take: vi.fn().mockResolvedValue(mockMatches),
        })),
      }
    })

    const ctx = { db: { query: vi.fn(() => ({ withIndex })) } } as any

    const result = await callHandler(getRouteMatchesForRoute, ctx, { routeId, minConfidence: 0.8 })

    expect(result).toHaveLength(2)
    expect(result.every((m: { matchConfidence: number }) => m.matchConfidence >= 0.8)).toBe(true)
  })

  it('should limit results', async () => {
    const routeId = ':test-route' as Id<'curated_routes'>
    const mockMatches = Array.from({ length: 20 }, (_, i) =>
      createMockRouteMatch({ routeId, matchConfidence: 0.9 - i * 0.01 }),
    )

    const withIndex = vi.fn((indexName, callback) => {
      const qb = { eq: vi.fn().mockReturnThis() }
      callback(qb)
      return {
        order: vi.fn(() => ({
          take: vi.fn().mockResolvedValue(mockMatches),
        })),
      }
    })

    const ctx = { db: { query: vi.fn(() => ({ withIndex })) } } as any

    const result = await callHandler(getRouteMatchesForRoute, ctx, { routeId, limit: 5 })

    expect(result).toHaveLength(5)
  })
})

// ---------------------------------------------------------------------------
// AC-10: getRawPostsForRoute joins route_matches and route_posts_raw
// ---------------------------------------------------------------------------

describe('AC-10: getRawPostsForRoute joins route_matches and route_posts_raw', () => {
  it('should join route_matches with route_posts_raw', async () => {
    const routeId = ':test-route' as Id<'curated_routes'>
    const mockMatches = [
      createMockRouteMatch({ routeId, postId: 'post-1' }),
      createMockRouteMatch({ routeId, postId: 'post-2' }),
    ]

    const mockPosts = [
      createMockRoutePostRaw({ postId: 'post-1', _id: ':post-1' as Id<'route_posts_raw'> }),
      createMockRoutePostRaw({ postId: 'post-2', _id: ':post-2' as Id<'route_posts_raw'> }),
    ]

    let postCallCount = 0
    const matchWithIndex = vi.fn((indexName, callback) => {
      const qb = { eq: vi.fn().mockReturnThis() }
      callback(qb)
      return {
        order: vi.fn(() => ({
          take: vi.fn().mockResolvedValue(mockMatches),
        })),
      }
    })

    const postWithIndex = vi.fn((indexName, callback) => {
      const qb = { eq: vi.fn().mockReturnThis() }
      callback(qb)
      return {
        first: vi.fn().mockImplementation(() => {
          const post = mockPosts[postCallCount]
          postCallCount++
          return post
        }),
      }
    })

    const ctx = {
      db: {
        query: vi.fn((tableName) => {
          if (tableName === 'route_matches') return { withIndex: matchWithIndex }
          if (tableName === 'route_posts_raw') return { withIndex: postWithIndex }
          return { withIndex: vi.fn() }
        }),
      },
    } as any

    const result = await callHandler(getRawPostsForRoute, ctx, { routeId })

    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({
      match: expect.objectContaining({ postId: 'post-1' }),
      post: expect.objectContaining({ postId: 'post-1' }),
    })
    expect(result[1]).toMatchObject({
      match: expect.objectContaining({ postId: 'post-2' }),
      post: expect.objectContaining({ postId: 'post-2' }),
    })
  })

  it('should filter out matches with missing posts', async () => {
    const routeId = ':test-route' as Id<'curated_routes'>
    const mockMatches = [
      createMockRouteMatch({ routeId, postId: 'post-1' }),
      createMockRouteMatch({ routeId, postId: 'post-missing' }), // Post doesn't exist
    ]

    const _mockPosts = [createMockRoutePostRaw({ postId: 'post-1' })]

    const matchWithIndex = vi.fn((indexName, callback) => {
      const qb = { eq: vi.fn().mockReturnThis() }
      callback(qb)
      return {
        order: vi.fn(() => ({
          take: vi.fn().mockResolvedValue(mockMatches),
        })),
      }
    })

    const postWithIndex = vi.fn((indexName, callback) => {
      const qb = { eq: vi.fn().mockReturnThis() }
      callback(qb)
      return {
        first: vi.fn().mockResolvedValue(null),
      }
    })

    const ctx = {
      db: {
        query: vi.fn((tableName) => {
          if (tableName === 'route_matches') return { withIndex: matchWithIndex }
          if (tableName === 'route_posts_raw') return { withIndex: postWithIndex }
          return { withIndex: vi.fn() }
        }),
      },
    } as any

    const result = await callHandler(getRawPostsForRoute, ctx, { routeId })

    expect(result).toHaveLength(0) // Both posts are null, so filtered out
  })

  it('should use by_postId index for post lookup', async () => {
    const routeId = ':test-route' as Id<'curated_routes'>
    const mockMatches = [createMockRouteMatch({ routeId, postId: 'post-1' })]
    const mockPosts = [createMockRoutePostRaw({ postId: 'post-1' })]

    const postWithIndex = vi.fn((indexName, callback) => {
      expect(indexName).toBe('by_postId')
      const qb = { eq: vi.fn().mockReturnThis() }
      callback(qb)
      return {
        first: vi.fn().mockResolvedValue(mockPosts[0]),
      }
    })

    const matchWithIndex = vi.fn((indexName, callback) => {
      const qb = { eq: vi.fn().mockReturnThis() }
      callback(qb)
      return {
        order: vi.fn(() => ({
          take: vi.fn().mockResolvedValue(mockMatches),
        })),
      }
    })

    const ctx = {
      db: {
        query: vi.fn((tableName) => {
          if (tableName === 'route_matches') return { withIndex: matchWithIndex }
          if (tableName === 'route_posts_raw') return { withIndex: postWithIndex }
          return { withIndex: vi.fn() }
        }),
      },
    } as any

    await callHandler(getRawPostsForRoute, ctx, { routeId })

    expect(postWithIndex).toHaveBeenCalledWith('by_postId', expect.any(Function))
  })
})
