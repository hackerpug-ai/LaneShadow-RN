import { describe, expect, it } from 'vitest'
import { v } from 'convex/values'

// AC-1: curatedRouteValidator has all 20+ lean fields
describe('curatedRouteValidator', () => {
  it('has all lean fields from PRD schema', async () => {
    const { curatedRouteValidator } = await import('../curated-routes')
    expect(curatedRouteValidator).toBeDefined()
    expect(curatedRouteValidator.kind).toBe('object')

    const fields = curatedRouteValidator.fields

    // Verify all required fields exist
    expect(fields.routeId).toBeDefined()
    expect(fields.name).toBeDefined()
    expect(fields.state).toBeDefined()
    expect(fields.source).toBeDefined()
    expect(fields.primaryArchetype).toBeDefined()
    expect(fields.secondaryTags).toBeDefined()
    expect(fields.centroidLat).toBeDefined()
    expect(fields.centroidLng).toBeDefined()
    expect(fields.boundsNeLat).toBeDefined()
    expect(fields.boundsNeLng).toBeDefined()
    expect(fields.boundsSwLat).toBeDefined()
    expect(fields.boundsSwLng).toBeDefined()
    expect(fields.lengthMiles).toBeDefined()
    expect(fields.compositeScore).toBeDefined()
    expect(fields.curvatureScore).toBeDefined()
    expect(fields.scenicScore).toBeDefined()
    expect(fields.technicalScore).toBeDefined()
    expect(fields.trafficScore).toBeDefined()
    expect(fields.remotenessScore).toBeDefined()
    expect(fields.oneLiner).toBeDefined()
    expect(fields.summary).toBeDefined()
    expect(fields.badges).toBeDefined()
    expect(fields.season).toBeDefined()
    expect(fields.contentVersion).toBeDefined()
    expect(fields.enrichmentVersion).toBeDefined()
    expect(fields.seededAt).toBeDefined()
  })

  it('source field accepts exactly 5 literal values', async () => {
    const { CURATED_ROUTE_FIELDS } = await import('../curated-routes')
    const sourceValidator = CURATED_ROUTE_FIELDS.source

    expect(sourceValidator.kind).toBe('union')
    const members = sourceValidator.members.map((m: { value: string }) => m.value)
    expect(members).toContain('fhwa')
    expect(members).toContain('motorcycleroads')
    expect(members).toContain('bestbikingroads')
    expect(members).toContain('bdr')
    expect(members).toContain('editorial')
    expect(members.length).toBe(5)
  })

  it('primaryArchetype field accepts exactly 6 literal values', async () => {
    const { CURATED_ROUTE_FIELDS } = await import('../curated-routes')
    const archetypeValidator = CURATED_ROUTE_FIELDS.primaryArchetype

    expect(archetypeValidator.kind).toBe('union')
    const members = archetypeValidator.members.map((m: { value: string }) => m.value)
    expect(members).toContain('twisties')
    expect(members).toContain('mountain')
    expect(members).toContain('coastal')
    expect(members).toContain('adventure')
    expect(members).toContain('scenic_byway')
    expect(members).toContain('desert')
    expect(members.length).toBe(6)
  })

  it('season field accepts exactly 4 literal values', async () => {
    const { CURATED_ROUTE_FIELDS } = await import('../curated-routes')
    const seasonValidator = CURATED_ROUTE_FIELDS.season

    expect(seasonValidator.kind).toBe('union')
    const members = seasonValidator.members.map((m: { value: string }) => m.value)
    expect(members).toContain('year_round')
    expect(members).toContain('apr_nov')
    expect(members).toContain('may_sep')
    expect(members).toContain('spring_fall')
    expect(members.length).toBe(4)
  })

  it('enrichmentVersion field is optional', async () => {
    const { curatedRouteValidator } = await import('../curated-routes')
    const fields = curatedRouteValidator.fields
    expect(fields.enrichmentVersion?.isOptional).toBe('optional')
  })
})
