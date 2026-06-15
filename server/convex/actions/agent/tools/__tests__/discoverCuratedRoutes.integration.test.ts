import { test } from 'vitest'
import { internal } from './_generated/api'
import { assertType } from './test-helpers/assertType'
import { createTestContext } from './test-helpers/createTestContext'
import { v } from 'convex/values'
import { createCuratedRoutesFixtures } from './test-helpers/curatedRoutesFixtures'
import { setupPlanningSession } from './test-helpers/setupPlanningSession'

test('AC-1: NL twisties-near-Asheville surfaces the seeded curated route as a routing_card', async () => {
  // GIVEN: a live deployment with the curated catalog seeded with a twisties route near Asheville NC and a contrasting coastal route in CA, an authenticated identity, and the intent fixtured to {archetypes:['twisties'], center: Asheville, sort:'nearest'}
  
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
  
  // THEN: a completed route_plans row exists whose result.options[].label includes the Asheville twisties route and excludes the CA coastal route; the routing_card attachment points at that routePlanId
  
  // Should return a routes result with a routePlanId
  assertType(toolResult, {
    type: 'routes',
    routePlanId: v.id('route_plans')
  })
  
  // Verify the route_plans row exists and has the correct status
  const routePlan = await ctx.runQuery(internal.db.routePlans.getPlanByIdInternal, {
    routePlanId: toolResult.routePlanId
  })
  
  if (!routePlan) {
    throw new Error('Expected route_plan to exist')
  }
  
  if (routePlan.status !== 'completed') {
    throw new Error(`Expected route_plan.status to be 'completed', got '${routePlan.status}'`)
  }
  
  if (!routePlan.result) {
    throw new Error('Expected route_plan.result to exist')
  }
  
  if (!routePlan.result.options || routePlan.result.options.length !== 1) {
    throw new Error(`Expected exactly 1 option, got ${routePlan.result.options?.length || 0}`)
  }
  
  const option = routePlan.result.options[0]
  if (option.label !== 'Tail of the Dragon') {
    throw new Error(`Expected option.label to be 'Tail of the Dragon', got '${option.label}'`)
  }
  
  if (option.stats.compositeScore !== 0.91) {
    throw new Error(`Expected compositeScore to be 0.91, got ${option.stats.compositeScore}`)
  }
  
  // Verify that the CA coastal route is NOT included
  const coastalOptionExists = routePlan.result.options.some(opt => 
    opt.label === 'Pacific Coast Hwy'
  )
  if (coastalOptionExists) {
    throw new Error('CA coastal route should not be included in results')
  }
  
  // Negative control: test empty catalog scenario
  // This test should fail until we have real empty catalog support
  const emptyCatalogResult = await ctx.runQuery(internal.agent.discoverCuratedRoutes, {
    clerkUserId,
    sessionId,
    intent: {
      archetypes: ['adventure'],
      state: 'Rhode Island'
    }
  })
  
  // For empty catalog, we expect a chat result with no routePlanId
  assertType(emptyCatalogResult, {
    type: 'chat',
    message: v.string()
  })
  
  if (emptyCatalogResult.type === 'routes' && emptyCatalogResult.routePlanId) {
    throw new Error('Empty catalog should not return routes with routePlanId')
  }
})