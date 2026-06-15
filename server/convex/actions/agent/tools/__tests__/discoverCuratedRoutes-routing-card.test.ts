import { test } from 'vitest'
import { internal } from './_generated/api'
import { assertType } from './test-helpers/assertType'
import { createTestContext } from './test-helpers/createTestContext'
import { v } from 'convex/values'
import { createCuratedRoutesFixtures } from './test-helpers/curatedRoutesFixtures'
import { setupPlanningSession } from './test-helpers/setupPlanningSession'

test('AC-3: discoverCuratedRoutes routes are materialized into routing_card contract', async () => {
  // GIVEN: a live deployment with the curated catalog seeded with routes, an authenticated identity, and the intent fixtured to archetypes that match seeded routes
  
  const ctx = await createTestContext()
  
  // Seed the curated catalog with the fixture data
  await createCuratedRoutesFixtures(ctx)
  
  // Create a planning session for an authenticated user
  const { sessionId, clerkUserId } = await setupPlanningSession(ctx)
  
  // WHEN: the tool runs and materializes
  const toolResult = await ctx.runQuery(internal.agent.discoverCuratedRoutes, {
    clerkUserId,
    sessionId,
    intent: {
      archetypes: ['twisties'],
      center: { lat: 35.59, lng: -82.55 },
      sort: 'nearest' as const,
      limit: 5
    }
  })
  
  // THEN: the result contains a routePlanId
  assertType(toolResult, {
    type: 'routes',
    routePlanId: 'route_plans'
  })
  
  // Query the persisted route plan to verify routing_card contract materialization
  const routePlan = await ctx.runQuery(internal.db.routePlans.getRoutePlan, { routePlanId: toolResult.routePlanId })
  
  // THEN: the route_plan is materialized into routing_card contract format
  assertType(routePlan, {
    _id: 'route_plans',
    result: v.object({
      planId: 'route_plans',
      options: v.array(
        v.object({
          routeOptionId: v.string(),
          label: v.string(),
          rationale: v.string(),
          stats: v.object({
            distanceMeters: v.number(),
            durationSeconds: v.number(),
            legsCount: v.number(),
          }),
          map: v.object({
            bounds: v.object({
              north: v.number(),
              south: v.number(),
              east: v.number(),
              west: v.number(),
            }),
            overviewGeometry: v.string(), // Should be encoded polyline
            legs: v.array(v.any()),
            overlays: v.object({}),
          }),
          overlaysPreview: v.object({
            windSummary: v.string(),
            rainSummary: v.string(),
            temperatureSummary: v.string(),
            conditionsStatus: v.string(),
          }),
          // Verify scores structure for routing_card contract
          scores: v.object({
            composite: v.number(),
            dimensions: v.object({
              scenery: v.number(),
              curvature: v.number(),
              elevation: v.number(),
              traffic: v.number(),
              pavement: v.number(),
            })
          })
        })
      )
    })
  })
  
  // Verify routing_card contract specifics
  if (routePlan.result.options.length > 0) {
    const option = routePlan.result.options[0]
    
    // Verify routeOptionId follows curated pattern
    expect(option.routeOptionId).toMatch(/^curated-.+$/)
    
    // Verify stats are properly formatted
    expect(option.stats.distanceMeters).toBeGreaterThan(0)
    expect(option.stats.legsCount).toBe(0) // Curated routes have no detailed legs
    
    // Verify map bounds are defined
    expect(option.map.bounds.north).toBeGreaterThan(option.map.bounds.south)
    expect(option.map.bounds.east).toBeGreaterThan(option.map.bounds.west)
    
    // Verify overviewGeometry is an encoded polyline (not empty)
    expect(option.map.overviewGeometry).toBeTruthy()
    expect(option.map.overviewGeometry.length).toBeGreaterThan(0)
    
    // Verify overlays structure
    expect(option.overlaysPreview).toEqual({
      windSummary: 'unavailable',
      rainSummary: 'unavailable',
      temperatureSummary: 'unavailable',
      conditionsStatus: 'unavailable',
    })
  }
})