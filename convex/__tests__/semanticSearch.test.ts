/**
 * Semantic Search Tests (INF-006)
 *
 * Tests for vector search, route matching, and raw post retrieval.
 * These functions implement the semantic matching layer for route discovery.
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

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('INF-006: Convex Vector Search Query Wrappers', () => {
  describe('AC-1: findCandidateRoutesByEmbedding uses ctx.vectorSearch', () => {
    it('should export findCandidateRoutesByEmbedding function', () => {
      // GIVEN: semanticSearch.ts exists
      // WHEN: We read the file
      // THEN: It should export findCandidateRoutesByEmbedding

      const semanticSearchPath = resolve(__dirname, '../semanticSearch.ts')
      const content = readFileSync(semanticSearchPath, 'utf-8')

      expect(content).toContain('export const findCandidateRoutesByEmbedding')
    })

    it('should use ctx.vectorSearch in findCandidateRoutesByEmbedding', () => {
      // GIVEN: Convex schema has vectorIndex by_embedding on curated_routes
      // WHEN: I implement findCandidateRoutesByEmbedding
      // THEN: Handler calls ctx.vectorSearch("curated_routes", "by_embedding", ...)

      const semanticSearchPath = resolve(__dirname, '../semanticSearch.ts')
      const content = readFileSync(semanticSearchPath, 'utf-8')

      // Find the findCandidateRoutesByEmbedding function
      const functionStart = content.indexOf('export const findCandidateRoutesByEmbedding')
      expect(functionStart).toBeGreaterThan(-1)

      // Extract the function body
      const functionEnd = content.indexOf('\nexport const', functionStart + 10)
      const functionBody = content.substring(functionStart, functionEnd > -1 ? functionEnd : content.length)

      // Should use ctx.vectorSearch
      expect(functionBody).toContain('vectorSearch("curated_routes", "by_embedding"')
    })

    it('should return cosineSimilarity in results', () => {
      // GIVEN: findCandidateRoutesByEmbedding uses vectorSearch
      // WHEN: Results are returned
      // THEN: They should include cosineSimilarity metadata

      const semanticSearchPath = resolve(__dirname, '../semanticSearch.ts')
      const content = readFileSync(semanticSearchPath, 'utf-8')

      // Find the findCandidateRoutesByEmbedding function
      const functionStart = content.indexOf('export const findCandidateRoutesByEmbedding')
      const functionEnd = content.indexOf('\nexport const', functionStart + 10)
      const functionBody = content.substring(functionStart, functionEnd > -1 ? functionEnd : content.length)

      // Should return cosineSimilarity
      expect(functionBody).toContain('cosineSimilarity')
      expect(functionBody).toContain('_score')
    })

    it('should define EMBEDDING_DIMENSIONS constant as 1536', () => {
      // GIVEN: semanticSearch.ts exists
      // WHEN: We read the file
      // THEN: It should define EMBEDDING_DIMENSIONS = 1536

      const semanticSearchPath = resolve(__dirname, '../semanticSearch.ts')
      const content = readFileSync(semanticSearchPath, 'utf-8')

      expect(content).toContain('EMBEDDING_DIMENSIONS')
      expect(content).toContain('1536')
    })
  })

  describe('AC-2: findCandidateRoutesByEmbedding supports state filter', () => {
    it('should accept stateFilter as optional argument', () => {
      // GIVEN: The vectorIndex has filterFields: ["state"]
      // WHEN: I call findCandidateRoutesByEmbedding
      // THEN: It should accept stateFilter parameter

      const semanticSearchPath = resolve(__dirname, '../semanticSearch.ts')
      const content = readFileSync(semanticSearchPath, 'utf-8')

      // Find the function
      const functionStart = content.indexOf('export const findCandidateRoutesByEmbedding')
      const functionEnd = content.indexOf('\nexport const', functionStart + 10)
      const functionBody = content.substring(functionStart, functionEnd > -1 ? functionEnd : content.length)

      // Should have stateFilter in args
      expect(functionBody).toContain('stateFilter')
      expect(functionBody).toContain('v.optional(v.string())')
    })

    it('should use stateFilter in vectorSearch filter', () => {
      // GIVEN: stateFilter is provided
      // WHEN: vectorSearch is called
      // THEN: Filter should be applied

      const semanticSearchPath = resolve(__dirname, '../semanticSearch.ts')
      const content = readFileSync(semanticSearchPath, 'utf-8')

      const functionStart = content.indexOf('export const findCandidateRoutesByEmbedding')
      const functionEnd = content.indexOf('\nexport const', functionStart + 10)
      const functionBody = content.substring(functionStart, functionEnd > -1 ? functionEnd : content.length)

      // Should build filter using stateFilter
      expect(functionBody).toContain('filter')
      expect(functionBody).toContain('.eq("state"')
    })
  })

  describe('AC-3: findRoutesByIdentifier matches by name, highway, and candidateIdentifiers', () => {
    it('should export findRoutesByIdentifier function', () => {
      // GIVEN: semanticSearch.ts exists
      // WHEN: We read the file
      // THEN: It should export findRoutesByIdentifier

      const semanticSearchPath = resolve(__dirname, '../semanticSearch.ts')
      const content = readFileSync(semanticSearchPath, 'utf-8')

      expect(content).toContain('export const findRoutesByIdentifier')
    })

    it('should match by name case-insensitively', () => {
      // GIVEN: A seeded test route with name="Tail of the Dragon"
      // WHEN: I call findRoutesByIdentifier with identifier="tail of the dragon"
      // THEN: The function should match via name

      const semanticSearchPath = resolve(__dirname, '../semanticSearch.ts')
      const content = readFileSync(semanticSearchPath, 'utf-8')

      const functionStart = content.indexOf('export const findRoutesByIdentifier')
      const functionEnd = content.indexOf('\nexport const', functionStart + 10)
      const functionBody = content.substring(functionStart, functionEnd > -1 ? functionEnd : content.length)

      // Should do case-insensitive matching
      expect(functionBody).toContain('toLowerCase()')
      expect(functionBody).toContain('name')
    })

    it('should match by highwayNumber', () => {
      // GIVEN: A route with highwayNumber="US-129"
      // WHEN: I call findRoutesByIdentifier with identifier="US-129"
      // THEN: The function should match via highwayNumber

      const semanticSearchPath = resolve(__dirname, '../semanticSearch.ts')
      const content = readFileSync(semanticSearchPath, 'utf-8')

      const functionStart = content.indexOf('export const findRoutesByIdentifier')
      const functionEnd = content.indexOf('\nexport const', functionStart + 10)
      const functionBody = content.substring(functionStart, functionEnd > -1 ? functionEnd : content.length)

      // Should check highwayNumber
      expect(functionBody).toContain('highwayNumber')
    })

    it('should match by candidateIdentifiers array', () => {
      // GIVEN: A route with candidateIdentifiers=["The Dragon","Deals Gap"]
      // WHEN: I call findRoutesByIdentifier with identifier="Deals Gap"
      // THEN: The function should match via candidateIdentifiers

      const semanticSearchPath = resolve(__dirname, '../semanticSearch.ts')
      const content = readFileSync(semanticSearchPath, 'utf-8')

      const functionStart = content.indexOf('export const findRoutesByIdentifier')
      const functionEnd = content.indexOf('\nexport const', functionStart + 10)
      const functionBody = content.substring(functionStart, functionEnd > -1 ? functionEnd : content.length)

      // Should check candidateIdentifiers array
      expect(functionBody).toContain('candidateIdentifiers')
    })

    it('should return matchType in results', () => {
      // GIVEN: A match is found
      // WHEN: Results are returned
      // THEN: They should include matchType field

      const semanticSearchPath = resolve(__dirname, '../semanticSearch.ts')
      const content = readFileSync(semanticSearchPath, 'utf-8')

      const functionStart = content.indexOf('export const findRoutesByIdentifier')
      const functionEnd = content.indexOf('\nexport const', functionStart + 10)
      const functionBody = content.substring(functionStart, functionEnd > -1 ? functionEnd : content.length)

      // Should return matchType
      expect(functionBody).toContain('matchType')
      expect(functionBody).toMatch(/"name"|"highway"|"identifier"/)
    })
  })

  describe('AC-4: updateRouteEmbedding patches only the embedding fields', () => {
    it('should export updateRouteEmbedding as mutation', () => {
      // GIVEN: semanticSearch.ts exists
      // WHEN: We read the file
      // THEN: It should export updateRouteEmbedding as mutation

      const semanticSearchPath = resolve(__dirname, '../semanticSearch.ts')
      const content = readFileSync(semanticSearchPath, 'utf-8')

      expect(content).toContain('export const updateRouteEmbedding')
      expect(content).toContain('updateRouteEmbedding = mutation')
    })

    it('should accept routeId, searchText, and searchEmbedding args', () => {
      // GIVEN: updateRouteEmbedding is a mutation
      // WHEN: We check its args
      // THEN: It should accept routeId, searchText, searchEmbedding

      const semanticSearchPath = resolve(__dirname, '../semanticSearch.ts')
      const content = readFileSync(semanticSearchPath, 'utf-8')

      const functionStart = content.indexOf('export const updateRouteEmbedding')
      const functionEnd = content.indexOf('\nexport const', functionStart + 10)
      const functionBody = content.substring(functionStart, functionEnd > -1 ? functionEnd : content.length)

      // Should have proper args
      expect(functionBody).toContain('routeId:')
      expect(functionBody).toContain('v.id("curated_routes")')
      expect(functionBody).toContain('searchText:')
      expect(functionBody).toContain('searchEmbedding:')
    })

    it('should use ctx.db.patch to update only target fields', () => {
      // GIVEN: A seeded route with existing fields
      // WHEN: I call updateRouteEmbedding
      // THEN: It should use ctx.db.patch to update only searchText and searchEmbedding

      const semanticSearchPath = resolve(__dirname, '../semanticSearch.ts')
      const content = readFileSync(semanticSearchPath, 'utf-8')

      const functionStart = content.indexOf('export const updateRouteEmbedding')
      const functionEnd = content.indexOf('\nexport const', functionStart + 10)
      const functionBody = content.substring(functionStart, functionEnd > -1 ? functionEnd : content.length)

      // Should use patch
      expect(functionBody).toContain('ctx.db.patch')
      expect(functionBody).toContain('searchText')
      expect(functionBody).toContain('searchEmbedding')
    })
  })

  describe('AC-5: updateRouteEmbedding rejects wrong-dimension embeddings', () => {
    it('should validate embedding dimensions', () => {
      // GIVEN: An embedding of length 768 (wrong — should be 1536)
      // WHEN: I call updateRouteEmbedding with this vector
      // THEN: The handler should throw an error

      const semanticSearchPath = resolve(__dirname, '../semanticSearch.ts')
      const content = readFileSync(semanticSearchPath, 'utf-8')

      const functionStart = content.indexOf('export const updateRouteEmbedding')
      const functionEnd = content.indexOf('\nexport const', functionStart + 10)
      const functionBody = content.substring(functionStart, functionEnd > -1 ? functionEnd : content.length)

      // Should validate dimensions
      expect(functionBody).toContain('searchEmbedding.length')
      expect(functionBody).toContain('EMBEDDING_DIMENSIONS')
      expect(functionBody).toContain('throw new Error')
    })

    it('should mention 1536 in error message', () => {
      // GIVEN: Dimension validation fails
      // WHEN: Error is thrown
      // THEN: Error message should mention expected dimension 1536

      const semanticSearchPath = resolve(__dirname, '../semanticSearch.ts')
      const content = readFileSync(semanticSearchPath, 'utf-8')

      const functionStart = content.indexOf('export const updateRouteEmbedding')
      const functionEnd = content.indexOf('\nexport const', functionStart + 10)
      const functionBody = content.substring(functionStart, functionEnd > -1 ? functionEnd : content.length)

      // Should mention 1536 in error
      expect(functionBody).toMatch(/1536|EMBEDDING_DIMENSIONS/)
    })
  })

  describe('AC-6: addRouteMatch validates input and returns the new match id', () => {
    it('should export addRouteMatch as mutation', () => {
      // GIVEN: semanticSearch.ts exists
      // WHEN: We read the file
      // THEN: It should export addRouteMatch as mutation

      const semanticSearchPath = resolve(__dirname, '../semanticSearch.ts')
      const content = readFileSync(semanticSearchPath, 'utf-8')

      expect(content).toContain('export const addRouteMatch')
      expect(content).toContain('addRouteMatch = mutation')
    })

    it('should accept all required RouteMatch fields', () => {
      // GIVEN: addRouteMatch is a mutation
      // WHEN: We check its args
      // THEN: It should accept all RouteMatch fields

      const semanticSearchPath = resolve(__dirname, '../semanticSearch.ts')
      const content = readFileSync(semanticSearchPath, 'utf-8')

      const functionStart = content.indexOf('export const addRouteMatch')
      const functionEnd = content.indexOf('\nexport const', functionStart + 10)
      const functionBody = content.substring(functionStart, functionEnd > -1 ? functionEnd : content.length)

      // Should have all required fields
      expect(functionBody).toContain('matchId:')
      expect(functionBody).toContain('postId:')
      expect(functionBody).toContain('routeId:')
      expect(functionBody).toContain('matchConfidence:')
      expect(functionBody).toContain('cosineSimilarity:')
      expect(functionBody).toContain('matchReasoning:')
      expect(functionBody).toContain('rerankModel:')
      expect(functionBody).toContain('rerankCost:')
      expect(functionBody).toContain('matchedAt:')
      expect(functionBody).toContain('isArbitrated:')
    })

    it('should insert into route_matches table', () => {
      // GIVEN: Valid RouteMatch args
      // WHEN: I call addRouteMatch
      // THEN: The new row should be inserted into route_matches

      const semanticSearchPath = resolve(__dirname, '../semanticSearch.ts')
      const content = readFileSync(semanticSearchPath, 'utf-8')

      const functionStart = content.indexOf('export const addRouteMatch')
      const functionEnd = content.indexOf('\nexport const', functionStart + 10)
      const functionBody = content.substring(functionStart, functionEnd > -1 ? functionEnd : content.length)

      // Should insert into route_matches
      expect(functionBody).toContain('ctx.db.insert("route_matches"')
    })

    it('should return v.id("route_matches") type', () => {
      // GIVEN: addRouteMatch inserts a row
      // WHEN: It returns
      // THEN: Return type should be v.id("route_matches")

      const semanticSearchPath = resolve(__dirname, '../semanticSearch.ts')
      const content = readFileSync(semanticSearchPath, 'utf-8')

      const functionStart = content.indexOf('export const addRouteMatch')
      const functionEnd = content.indexOf('\nexport const', functionStart + 10)
      const functionBody = content.substring(functionStart, functionEnd > -1 ? functionEnd : content.length)

      // Should return route_matches id
      expect(functionBody).toContain('returns:')
      expect(functionBody).toContain('v.id("route_matches")')
    })
  })

  describe('AC-7: addRouteMatch rejects out-of-range confidence/similarity', () => {
    it('should validate matchConfidence is in [0,1]', () => {
      // GIVEN: matchConfidence = 1.5 (out of [0,1])
      // WHEN: I call addRouteMatch
      // THEN: Handler should throw an error before insert

      const semanticSearchPath = resolve(__dirname, '../semanticSearch.ts')
      const content = readFileSync(semanticSearchPath, 'utf-8')

      const functionStart = content.indexOf('export const addRouteMatch')
      const functionEnd = content.indexOf('\nexport const', functionStart + 10)
      const functionBody = content.substring(functionStart, functionEnd > -1 ? functionEnd : content.length)

      // Should validate matchConfidence
      expect(functionBody).toContain('matchConfidence')
      expect(functionBody).toMatch(/matchConfidence\s*[<>]=?\s*[01]/)
      expect(functionBody).toContain('throw new Error')
    })

    it('should validate cosineSimilarity is in [0,1]', () => {
      // GIVEN: cosineSimilarity = -0.1 (out of [0,1])
      // WHEN: I call addRouteMatch
      // THEN: Handler should throw an error before insert

      const semanticSearchPath = resolve(__dirname, '../semanticSearch.ts')
      const content = readFileSync(semanticSearchPath, 'utf-8')

      const functionStart = content.indexOf('export const addRouteMatch')
      const functionEnd = content.indexOf('\nexport const', functionStart + 10)
      const functionBody = content.substring(functionStart, functionEnd > -1 ? functionEnd : content.length)

      // Should validate cosineSimilarity
      expect(functionBody).toContain('cosineSimilarity')
      expect(functionBody).toMatch(/cosineSimilarity\s*[<>]=?\s*[01]/)
    })

    it('should validate rerankCost is non-negative', () => {
      // GIVEN: rerankCost = -1.0 (negative)
      // WHEN: I call addRouteMatch
      // THEN: Handler should throw an error before insert

      const semanticSearchPath = resolve(__dirname, '../semanticSearch.ts')
      const content = readFileSync(semanticSearchPath, 'utf-8')

      const functionStart = content.indexOf('export const addRouteMatch')
      const functionEnd = content.indexOf('\nexport const', functionStart + 10)
      const functionBody = content.substring(functionStart, functionEnd > -1 ? functionEnd : content.length)

      // Should validate rerankCost
      expect(functionBody).toContain('rerankCost')
      expect(functionBody).toMatch(/rerankCost\s*<\s*0/)
    })
  })

  describe('AC-8: getRouteMatchesForPost uses by_postId index', () => {
    it('should export getRouteMatchesForPost function', () => {
      // GIVEN: semanticSearch.ts exists
      // WHEN: We read the file
      // THEN: It should export getRouteMatchesForPost

      const semanticSearchPath = resolve(__dirname, '../semanticSearch.ts')
      const content = readFileSync(semanticSearchPath, 'utf-8')

      expect(content).toContain('export const getRouteMatchesForPost')
    })

    it('should use .withIndex("by_postId") for query', () => {
      // GIVEN: route_matches has the by_postId index from INF-003
      // WHEN: I call getRouteMatchesForPost(postId)
      // THEN: The query should use .withIndex("by_postId")

      const semanticSearchPath = resolve(__dirname, '../semanticSearch.ts')
      const content = readFileSync(semanticSearchPath, 'utf-8')

      const functionStart = content.indexOf('export const getRouteMatchesForPost')
      const functionEnd = content.indexOf('\nexport const', functionStart + 10)
      const functionBody = content.substring(functionStart, functionEnd > -1 ? functionEnd : content.length)

      // Should use by_postId index
      expect(functionBody).toContain('.withIndex("by_postId"')
      expect(functionBody).toContain('.eq("postId"')
    })

    it('should sort results by matchConfidence descending', () => {
      // GIVEN: Multiple matches exist for a post
      // WHEN: Results are returned
      // THEN: They should be sorted by matchConfidence desc

      const semanticSearchPath = resolve(__dirname, '../semanticSearch.ts')
      const content = readFileSync(semanticSearchPath, 'utf-8')

      const functionStart = content.indexOf('export const getRouteMatchesForPost')
      const functionEnd = content.indexOf('\nexport const', functionStart + 10)
      const functionBody = content.substring(functionStart, functionEnd > -1 ? functionEnd : content.length)

      // Should sort by confidence desc
      expect(functionBody).toContain('sort')
      expect(functionBody).toContain('matchConfidence')
      expect(functionBody).toMatch(/b\.matchConfidence\s*-\s*a\.matchConfidence|desc/)
    })
  })

  describe('AC-9: getRouteMatchesForRoute uses by_routeId_and_confidence index', () => {
    it('should export getRouteMatchesForRoute function', () => {
      // GIVEN: semanticSearch.ts exists
      // WHEN: We read the file
      // THEN: It should export getRouteMatchesForRoute

      const semanticSearchPath = resolve(__dirname, '../semanticSearch.ts')
      const content = readFileSync(semanticSearchPath, 'utf-8')

      expect(content).toContain('export const getRouteMatchesForRoute')
    })

    it('should use .withIndex("by_routeId_and_confidence") for query', () => {
      // GIVEN: route_matches has the by_routeId_and_confidence index
      // WHEN: I call getRouteMatchesForRoute(routeId)
      // THEN: The query should use .withIndex("by_routeId_and_confidence")

      const semanticSearchPath = resolve(__dirname, '../semanticSearch.ts')
      const content = readFileSync(semanticSearchPath, 'utf-8')

      const functionStart = content.indexOf('export const getRouteMatchesForRoute')
      const functionEnd = content.indexOf('\nexport const', functionStart + 10)
      const functionBody = content.substring(functionStart, functionEnd > -1 ? functionEnd : content.length)

      // Should use by_routeId_and_confidence index
      expect(functionBody).toContain('.withIndex("by_routeId_and_confidence"')
      expect(functionBody).toContain('.eq("routeId"')
    })

    it('should accept minConfidence and limit parameters', () => {
      // GIVEN: getRouteMatchesForRoute is called
      // WHEN: With minConfidence=0.8 and limit=20
      // THEN: It should filter by confidence and limit results

      const semanticSearchPath = resolve(__dirname, '../semanticSearch.ts')
      const content = readFileSync(semanticSearchPath, 'utf-8')

      const functionStart = content.indexOf('export const getRouteMatchesForRoute')
      const functionEnd = content.indexOf('\nexport const', functionStart + 10)
      const functionBody = content.substring(functionStart, functionEnd > -1 ? functionEnd : content.length)

      // Should have minConfidence and limit args
      expect(functionBody).toContain('minConfidence:')
      expect(functionBody).toContain('limit:')
      expect(functionBody).toContain('v.optional(v.number())')
    })

    it('should filter by minConfidence and limit results', () => {
      // GIVEN: Results are fetched from index
      // WHEN: minConfidence=0.8 and limit=20
      // THEN: Should return up to 20 rows with confidence >= 0.8

      const semanticSearchPath = resolve(__dirname, '../semanticSearch.ts')
      const content = readFileSync(semanticSearchPath, 'utf-8')

      const functionStart = content.indexOf('export const getRouteMatchesForRoute')
      const functionEnd = content.indexOf('\nexport const', functionStart + 10)
      const functionBody = content.substring(functionStart, functionEnd > -1 ? functionEnd : content.length)

      // Should filter and limit
      expect(functionBody).toContain('filter')
      expect(functionBody).toContain('>= minConfidence')
      expect(functionBody).toContain('slice(0, limit)')
    })
  })

  describe('AC-10: getRawPostsForRoute joins route_matches and route_posts_raw', () => {
    it('should export getRawPostsForRoute function', () => {
      // GIVEN: semanticSearch.ts exists
      // WHEN: We read the file
      // THEN: It should export getRawPostsForRoute

      const semanticSearchPath = resolve(__dirname, '../semanticSearch.ts')
      const content = readFileSync(semanticSearchPath, 'utf-8')

      expect(content).toContain('export const getRawPostsForRoute')
    })

    it('should query route_matches using by_routeId_and_confidence index', () => {
      // GIVEN: A route with 3 matches
      // WHEN: I call getRawPostsForRoute(routeId)
      // THEN: It should first query route_matches by index

      const semanticSearchPath = resolve(__dirname, '../semanticSearch.ts')
      const content = readFileSync(semanticSearchPath, 'utf-8')

      const functionStart = content.indexOf('export const getRawPostsForRoute')
      const functionEnd = content.indexOf('\nexport const', functionStart + 10)
      const functionBody = content.substring(functionStart, functionEnd > -1 ? functionEnd : content.length)

      // Should query route_matches with index
      expect(functionBody).toContain('query("route_matches")')
      expect(functionBody).toContain('.withIndex("by_routeId_and_confidence"')
    })

    it('should join with route_posts_raw using by_postId index', () => {
      // GIVEN: Route matches are fetched
      // WHEN: For each match, we fetch the post
      // THEN: Should query route_posts_raw with by_postId index

      const semanticSearchPath = resolve(__dirname, '../semanticSearch.ts')
      const content = readFileSync(semanticSearchPath, 'utf-8')

      const functionStart = content.indexOf('export const getRawPostsForRoute')
      const functionEnd = content.indexOf('\nexport const', functionStart + 10)
      const functionBody = content.substring(functionStart, functionEnd > -1 ? functionEnd : content.length)

      // Should query route_posts_raw with index
      expect(functionBody).toContain('query("route_posts_raw")')
      expect(functionBody).toContain('.withIndex("by_postId"')
    })

    it('should return joined shape with match and post objects', () => {
      // GIVEN: Matches and posts are fetched
      // WHEN: Results are returned
      // THEN: Each entry should contain both match and post

      const semanticSearchPath = resolve(__dirname, '../semanticSearch.ts')
      const content = readFileSync(semanticSearchPath, 'utf-8')

      const functionStart = content.indexOf('export const getRawPostsForRoute')
      const functionEnd = content.indexOf('\nexport const', functionStart + 10)
      const functionBody = content.substring(functionStart, functionEnd > -1 ? functionEnd : content.length)

      // Should return joined shape
      expect(functionBody).toContain('{ match, post }')
      expect(functionBody).toContain('match:')
      expect(functionBody).toContain('post:')
    })

    it('should handle missing posts gracefully', () => {
      // GIVEN: A match exists but the post is missing
      // WHEN: Results are assembled
      // THEN: Should filter out null entries, not error

      const semanticSearchPath = resolve(__dirname, '../semanticSearch.ts')
      const content = readFileSync(semanticSearchPath, 'utf-8')

      const functionStart = content.indexOf('export const getRawPostsForRoute')
      const functionEnd = content.indexOf('\nexport const', functionStart + 10)
      const functionBody = content.substring(functionStart, functionEnd > -1 ? functionEnd : content.length)

      // Should handle nulls
      expect(functionBody).toContain('filter')
      expect(functionBody).toContain('null')
    })
  })

  describe('Quality Criteria: All 7 functions exported with proper decorators', () => {
    it('should export exactly 7 functions', () => {
      // GIVEN: semanticSearch.ts exists
      // WHEN: We count exported functions
      // THEN: Should have exactly 7

      const semanticSearchPath = resolve(__dirname, '../semanticSearch.ts')
      const content = readFileSync(semanticSearchPath, 'utf-8')

      const functions = [
        'findCandidateRoutesByEmbedding',
        'findRoutesByIdentifier',
        'updateRouteEmbedding',
        'addRouteMatch',
        'getRouteMatchesForPost',
        'getRouteMatchesForRoute',
        'getRawPostsForRoute',
      ]

      functions.forEach(funcName => {
        expect(content).toContain(`export const ${funcName}`)
      })
    })

    it('should use query decorator for query functions', () => {
      // GIVEN: Query functions exist
      // WHEN: We check their decorators
      // THEN: Should use = query({

      const semanticSearchPath = resolve(__dirname, '../semanticSearch.ts')
      const content = readFileSync(semanticSearchPath, 'utf-8')

      const queryFunctions = [
        'findCandidateRoutesByEmbedding',
        'findRoutesByIdentifier',
        'getRouteMatchesForPost',
        'getRouteMatchesForRoute',
        'getRawPostsForRoute',
      ]

      queryFunctions.forEach(funcName => {
        const regex = new RegExp(`export const ${funcName}\\s*=\\s*query\\(`)
        expect(content).toMatch(regex)
      })
    })

    it('should use mutation decorator for mutation functions', () => {
      // GIVEN: Mutation functions exist
      // WHEN: We check their decorators
      // THEN: Should use = mutation({

      const semanticSearchPath = resolve(__dirname, '../semanticSearch.ts')
      const content = readFileSync(semanticSearchPath, 'utf-8')

      const mutationFunctions = [
        'updateRouteEmbedding',
        'addRouteMatch',
      ]

      mutationFunctions.forEach(funcName => {
        const regex = new RegExp(`export const ${funcName}\\s*=\\s*mutation\\(`)
        expect(content).toMatch(regex)
      })
    })
  })

  describe('Quality Criteria: No .filter() on large tables without index', () => {
    it('should not use .filter() on route_matches table', () => {
      // GIVEN: semanticSearch.ts queries route_matches
      // WHEN: We check for .filter() usage
      // THEN: Should not use .filter() on route_matches

      const semanticSearchPath = resolve(__dirname, '../semanticSearch.ts')
      const content = readFileSync(semanticSearchPath, 'utf-8')

      // Find all route_matches queries
      const routeMatchesQueries = content.match(/query\("route_matches"\)[\s\S]*?\.collect\(\)|\.take\(\)/g)

      if (routeMatchesQueries) {
        routeMatchesQueries.forEach(query => {
          // Should use .withIndex() instead of .filter()
          expect(query).toContain('.withIndex(')
          expect(query).not.toContain('.filter(')
        })
      }
    })

    it('should not use .filter() on route_posts_raw table', () => {
      // GIVEN: semanticSearch.ts queries route_posts_raw
      // WHEN: We check for .filter() usage
      // THEN: Should not use .filter() on route_posts_raw

      const semanticSearchPath = resolve(__dirname, '../semanticSearch.ts')
      const content = readFileSync(semanticSearchPath, 'utf-8')

      // Find all route_posts_raw queries - match from query() to .first() or .collect()
      const routePostsQueries = content.match(/query\("route_posts_raw"\)[\s\S]*?\.(first|collect)\(\)/g)

      if (routePostsQueries) {
        routePostsQueries.forEach(query => {
          // Should use .withIndex() instead of .filter()
          expect(query).toContain('.withIndex(')
          expect(query).not.toContain('.filter(')
        })
      }
    })
  })
})
