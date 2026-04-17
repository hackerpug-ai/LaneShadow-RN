/**
 * INF-003 Schema Tests
 *
 * TDD tests for INF-003: Verify vector index, route_posts_raw, and route_matches schema
 * These tests inspect the schema and validators to ensure proper registration.
 */

import { describe, expect, it } from 'vitest'

describe('INF-003: Convex Vector Index + Match Audit Schema', () => {
  describe('AC-1: curated_routes validator extended with new optional fields', () => {
    it('should include semantic matching fields', async () => {
      const { curatedRouteValidator } = await import('../../models/curated-routes')
      const validatorFields = (curatedRouteValidator as any).fields

      // Semantic matching fields
      expect(validatorFields.searchEmbedding).toBeDefined()
      expect(validatorFields.searchText).toBeDefined()
      expect(validatorFields.candidateIdentifiers).toBeDefined()
      expect(validatorFields.matchConfidence).toBeDefined()
      expect(validatorFields.llmReconciliationLog).toBeDefined()
    })

    it('should include enrichment output fields', async () => {
      const { curatedRouteValidator } = await import('../../models/curated-routes')
      const validatorFields = (curatedRouteValidator as any).fields

      // Enrichment output fields
      expect(validatorFields.description).toBeDefined()
      expect(validatorFields.rating).toBeDefined()
      expect(validatorFields.designation).toBeDefined()
      expect(validatorFields.sourceUrl).toBeDefined()
      expect(validatorFields.sourceRefs).toBeDefined()
      expect(validatorFields.highwayNumber).toBeDefined()
      expect(validatorFields.elevationGainM).toBeDefined()
      expect(validatorFields.surface).toBeDefined()
      expect(validatorFields.aadt).toBeDefined()
      expect(validatorFields.aadtMedian).toBeDefined()
      expect(validatorFields.aadtMax).toBeDefined()
      expect(validatorFields.pavementIri).toBeDefined()
      expect(validatorFields.mentionFrequency).toBeDefined()
    })

    it('should include scoring output fields', async () => {
      const { curatedRouteValidator } = await import('../../models/curated-routes')
      const validatorFields = (curatedRouteValidator as any).fields

      // Scoring output fields
      expect(validatorFields.mentionFrequencyScore).toBeDefined()
      expect(validatorFields.designationScore).toBeDefined()
      expect(validatorFields.elevationDramaScore).toBeDefined()
      expect(validatorFields.roadQualityScore).toBeDefined()
      expect(validatorFields.lowTrafficScore).toBeDefined()
      expect(validatorFields.weatherSuitability).toBeDefined()
      expect(validatorFields.bestMonths).toBeDefined()
      expect(validatorFields.sourceCount).toBeDefined()
      expect(validatorFields.qualityTier).toBeDefined()
    })
  })

  describe('AC-2: vectorIndex registered on curated_routes', () => {
    it('should have by_embedding vector index with dimensions 1536', async () => {
      const schema = await import('../schema')
      const tables = (schema.default as any).tables
      const table = tables.curated_routes

      // Verify vector index exists
      const vectorIndex = table.vectorIndexes.find((i: any) => i.indexDescriptor === 'by_embedding')
      expect(vectorIndex).toBeDefined()
      expect(vectorIndex.dimensions).toBe(1536)
      expect(vectorIndex.vectorField).toBe('searchEmbedding')
    })
  })

  describe('AC-3: route_posts_raw table created', () => {
    it('should have route_posts_raw table with routePostRawValidator', async () => {
      const { routePostRawValidator } = await import('../../models/curated-routes')
      expect(routePostRawValidator).toBeDefined()

      const schema = await import('../schema')
      const tables = (schema.default as any).tables
      const table = tables.route_posts_raw

      // Verify table exists
      expect(table).toBeDefined()
      expect(table).toHaveProperty('indexes')
      expect(table).toHaveProperty('validator')
    })

    it('should have all required indexes on route_posts_raw', async () => {
      const schema = await import('../schema')
      const tables = (schema.default as any).tables
      const table = tables.route_posts_raw

      const indexNames = table.indexes.map((i: any) => i.indexDescriptor)
      expect(indexNames).toContain('by_postId')
      expect(indexNames).toContain('by_source_and_extracted_at')
      expect(indexNames).toContain('by_extraction_schema_version')

      // Verify index field configurations
      const byPostIdIndex = table.indexes.find((i: any) => i.indexDescriptor === 'by_postId')
      expect(byPostIdIndex?.fields).toEqual(['postId'])

      const bySourceAndExtractedAtIndex = table.indexes.find(
        (i: any) => i.indexDescriptor === 'by_source_and_extracted_at',
      )
      expect(bySourceAndExtractedAtIndex?.fields).toEqual(['source', 'extractedAt'])

      const byExtractionSchemaVersionIndex = table.indexes.find(
        (i: any) => i.indexDescriptor === 'by_extraction_schema_version',
      )
      expect(byExtractionSchemaVersionIndex?.fields).toEqual(['extractionSchemaVersion'])
    })
  })

  describe('AC-4: route_matches table created', () => {
    it('should have route_matches table with routeMatchValidator', async () => {
      const { routeMatchValidator } = await import('../../models/curated-routes')
      expect(routeMatchValidator).toBeDefined()

      const schema = await import('../schema')
      const tables = (schema.default as any).tables
      const table = tables.route_matches

      // Verify table exists
      expect(table).toBeDefined()
      expect(table).toHaveProperty('indexes')
      expect(table).toHaveProperty('validator')
    })

    it('should have all required indexes on route_matches', async () => {
      const schema = await import('../schema')
      const tables = (schema.default as any).tables
      const table = tables.route_matches

      const indexNames = table.indexes.map((i: any) => i.indexDescriptor)
      expect(indexNames).toContain('by_postId')
      expect(indexNames).toContain('by_routeId')
      expect(indexNames).toContain('by_routeId_and_confidence')

      // Verify index field configurations
      const byPostIdIndex = table.indexes.find((i: any) => i.indexDescriptor === 'by_postId')
      expect(byPostIdIndex?.fields).toEqual(['postId'])

      const byRouteIdIndex = table.indexes.find((i: any) => i.indexDescriptor === 'by_routeId')
      expect(byRouteIdIndex?.fields).toEqual(['routeId'])

      const byRouteIdAndConfidenceIndex = table.indexes.find(
        (i: any) => i.indexDescriptor === 'by_routeId_and_confidence',
      )
      expect(byRouteIdAndConfidenceIndex?.fields).toEqual(['routeId', 'matchConfidence'])
    })
  })

  describe('AC-5: Schema migration is non-breaking', () => {
    it('should not remove any existing curated_routes fields', async () => {
      const { curatedRouteValidator } = await import('../../models/curated-routes')
      const validatorFields = (curatedRouteValidator as any).fields

      // Verify all existing fields are still present
      const requiredFields = [
        'routeId',
        'name',
        'state',
        'source',
        'primaryArchetype',
        'secondaryTags',
        'centroidLat',
        'centroidLng',
        'boundsNeLat',
        'boundsNeLng',
        'boundsSwLat',
        'boundsSwLng',
        'lengthMiles',
        'compositeScore',
        'curvatureScore',
        'scenicScore',
        'technicalScore',
        'trafficScore',
        'remotenessScore',
        'oneLiner',
        'summary',
        'badges',
        'season',
        'contentVersion',
        'enrichmentVersion',
        'seededAt',
        'location',
      ]

      requiredFields.forEach((field) => {
        expect(validatorFields[field]).toBeDefined()
      })
    })
  })

  describe('AC-6: No legacy route_mentions table', () => {
    it('should not have route_mentions table', async () => {
      const schema = await import('../schema')
      const tables = (schema.default as any).tables

      // Verify route_mentions table does NOT exist
      expect(tables.route_mentions).toBeUndefined()
    })
  })
})
