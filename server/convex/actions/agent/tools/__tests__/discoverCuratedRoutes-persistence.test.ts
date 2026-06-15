import { test } from 'vitest'
import { internal } from './_generated/api'
import { assertType } from './test-helpers/assertType'
import { createTestContext } from './test-helpers/createTestContext'
import { v } from 'convex/values'
import { createCuratedRoutesFixtures } from './test-helpers/curatedRoutesFixtures'
import { setupPlanningSession } from './test-helpers/setupPlanningSession'

test('AC-2: discoverCuratedRoutes persists route_plan to route_plans table', async () => {
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
  
  // AND: the route_plan is persisted in the route_plans table
  const routePlan = await ctx.runQuery(internal.db.routePlans.getRoutePlan, { routePlanId: toolResult.routePlanId })
  
  assertType(routePlan, {
    _id: 'route_plans',
    clerkUserId: 'users',
    planningSessionId: 'planning_sessions',
    status: 'completed',
    planInput: v.object({
      start: v.object({ lat: v.number(), lng: v.number() }),
      end: v.object({ lat: v.number(), lng: v.number() }),
      departureTime: v.number(),
      preferences: v.object({
        scenicBias: v.string(),
        avoidHighways: v.boolean(),
        avoidTolls: v.boolean(),
      })
    }),
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
            overviewGeometry: v.string(),
            legs: v.array(v.any()),
            overlays: v.object({}),
          }),
          overlaysPreview: v.object({
            windSummary: v.string(),
            rainSummary: v.string(),
            temperatureSummary: v.string(),
            conditionsStatus: v.string(),
          }),
        })
      )
    })
  })
  
  // Verify the route plan has the expected properties for curated discovery
  expect(routePlan.clerkUserId).toBe(clerkUserId)
  expect(routePlan.planningSessionId).toBe(sessionId)
  expect(routePlan.status).toBe('completed')
  expect(routePlan.planInput.start).toEqual({ lat: 35.59, lng: -82.55 })
  expect(routePlan.planInput.end).toEqual({ lat: 35.59, lng: -82.55 })
  expect(routePlan.planInput.startLabel).toBe('Curated discovery')
  expect(routePlan.result.options.length).toBeGreaterThan(0)
})