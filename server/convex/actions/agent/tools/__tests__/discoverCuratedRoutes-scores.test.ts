import { test } from 'vitest'
import { internal } from './_generated/api'
import { assertType } from './test-helpers/assertType'
import { createTestContext } from './test-helpers/createTestContext'
import { v } from 'convex/values'
import { createCuratedRoutesFixtures } from './test-helpers/curatedRoutesFixtures'
import { setupPlanningSession } from './test-helpers/setupPlanningSession'

test('AC-5: discoverCuratedRoutes preserves composite + per-dimension scores on 0-1 scale', async () => {
  // GIVEN: a live deployment with the curated catalog seeded with routes that have scores, an authenticated identity, and the intent fixtured to archetypes that match seeded routes
  
  const ctx = await createTestContext()
  
  // Seed the curated catalog with the fixture data including scores
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
  
  // THEN: the result contains route options with normalized scores on 0-1 scale
  assertType(toolResult, {
    type: 'routes',
    routePlanId: 'route_plans'
  })
  
  // Query the persisted route plan to verify score normalization
  const routePlan = await ctx.runQuery(internal.db.routePlans.getRoutePlan, { routePlanId: toolResult.routePlanId })
  
  // Verify the route plan exists and has options
  assertType(routePlan, {
    _id: 'route_plans',
    options: v.array(
      v.object({
        routeOptionId: v.string(),
        scores: v.object({
          composite: v.number(), // Should be 0-1 scale
          dimensions: v.object({
            scenery: v.number(), // Should be 0-1 scale
            curvature: v.number(), // Should be 0-1 scale
            elevation: v.number(), // Should be 0-1 scale
            traffic: v.number(), // Should be 0-1 scale
            pavement: v.number(), // Should be 0-1 scale
          })
        })
      })
    )
  })
  
  // Verify scores are normalized to 0-1 scale
  const option = routePlan.options[0]
  if (option) {
    // Composite score should be between 0 and 1
    expect(option.scores.composite).toBeGreaterThanOrEqual(0)
    expect(option.scores.composite).toBeLessThanOrEqual(1)
    
    // All dimension scores should be between 0 and 1
    Object.values(option.scores.dimensions).forEach(score => {
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(1)
    })
  }
})