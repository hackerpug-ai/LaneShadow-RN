import { describe, expect, it } from 'vitest'

// AC-2: enrichmentValidator handles nested photo/source objects
describe('curatedRouteEnrichmentValidator', () => {
  it('has all fields from PRD rich tier schema', async () => {
    const { curatedRouteEnrichmentValidator } = await import('../curated-route-enrichments.js')
    expect(curatedRouteEnrichmentValidator).toBeDefined()
    expect(curatedRouteEnrichmentValidator.kind).toBe('object')

    const fields = curatedRouteEnrichmentValidator.fields

    // Verify scalar fields
    expect(fields.routeId).toBeDefined()
    expect(fields.fullDescription).toBeDefined()
    expect(fields.history).toBeDefined()
    expect(fields.roadClassification).toBeDefined()
    expect(fields.surfaceMaterial).toBeDefined()
    expect(fields.totalElevationGainM).toBeDefined()
    expect(fields.elevationProfile).toBeDefined()
    expect(fields.nearestCities).toBeDefined()
    expect(fields.ridershipLevel).toBeDefined()
    expect(fields.seasonalNotes).toBeDefined()
    expect(fields.safetyWarnings).toBeDefined()
    expect(fields.gpxUrl).toBeDefined()
    expect(fields.extractedBy).toBeDefined()
    expect(fields.extractedAt).toBeDefined()
    expect(fields.extractionSchemaVersion).toBeDefined()
    expect(fields.enrichmentVersion).toBeDefined()
    expect(fields.lastEnrichedAt).toBeDefined()

    // Verify nested array fields
    expect(fields.photos).toBeDefined()
    expect(fields.sources).toBeDefined()
    expect(fields.recommendedStarts).toBeDefined()
    expect(fields.fuelStops).toBeDefined()
  })

  it('photos field is an array validator', async () => {
    const { CURATED_ROUTE_ENRICHMENT_FIELDS } = await import('../curated-route-enrichments.js')
    const photosValidator = CURATED_ROUTE_ENRICHMENT_FIELDS.photos

    expect(photosValidator.kind).toBe('array')
  })

  it('sources field is an array validator', async () => {
    const { CURATED_ROUTE_ENRICHMENT_FIELDS } = await import('../curated-route-enrichments.js')
    const sourcesValidator = CURATED_ROUTE_ENRICHMENT_FIELDS.sources

    expect(sourcesValidator.kind).toBe('array')
  })

  it('elevationProfile and gpxUrl are optional fields', async () => {
    const { curatedRouteEnrichmentValidator } = await import('../curated-route-enrichments.js')
    const fields = curatedRouteEnrichmentValidator.fields
    expect(fields.elevationProfile?.isOptional).toBe('optional')
    expect(fields.gpxUrl?.isOptional).toBe('optional')
  })
})
