import { httpRouter } from 'convex/server'
import { Webhook } from 'svix'
import { internal } from './_generated/api'
import { httpAction } from './_generated/server'
import { CLERK_WEBHOOK_SECRET } from './lib/env'

const http = httpRouter()
const convexInternal = internal as any

// Curation admin endpoints - for Python seed pipeline
// NOTE: CURATION_DEPLOY_KEY must be set in Convex environment
http.route({
  path: '/admin/curation/routes',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const deployKey = process.env.CURATION_DEPLOY_KEY
    if (!deployKey) {
      return new Response(JSON.stringify({ error: 'configuration_error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const authHeader = req.headers.get('authorization') ?? ''
    const expected = `Bearer ${deployKey}`
    if (authHeader !== expected) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    let parsed: { routes: unknown }
    try {
      parsed = await req.json()
    } catch {
      return new Response(JSON.stringify({ error: 'invalid_body', detail: 'not json' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    try {
      const result = await ctx.runMutation(
        convexInternal.curationAdmin.internalUpsertCuratedRoutes,
        { routes: (parsed as any).routes }
      )
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: 'invalid_body', detail: err?.message ?? 'validation failed' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }),
})

http.route({
  path: '/admin/curation/enrichments',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const deployKey = process.env.CURATION_DEPLOY_KEY
    if (!deployKey) {
      return new Response(JSON.stringify({ error: 'configuration_error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const authHeader = req.headers.get('authorization') ?? ''
    const expected = `Bearer ${deployKey}`
    if (authHeader !== expected) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    let parsed: { enrichments: unknown }
    try {
      parsed = await req.json()
    } catch {
      return new Response(JSON.stringify({ error: 'invalid_body', detail: 'not json' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    try {
      const result = await ctx.runMutation(
        convexInternal.curationAdmin.internalUpsertCuratedRouteEnrichments,
        { enrichments: (parsed as any).enrichments }
      )
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: 'invalid_body', detail: err?.message ?? 'validation failed' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }),
})

// Dashboard metrics endpoint - for admin monitoring
http.route({
  path: '/admin/curation/metrics',
  method: 'GET',
  handler: httpAction(async (ctx, req) => {
    const deployKey = process.env.CURATION_DEPLOY_KEY
    if (!deployKey) {
      return new Response(JSON.stringify({ error: 'configuration_error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const authHeader = req.headers.get('authorization') ?? ''
    const expected = `Bearer ${deployKey}`
    if (authHeader !== expected) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const metrics = await ctx.runQuery(convexInternal.curationMetrics.curationMetricsInternal, {})
    return new Response(JSON.stringify(metrics), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }),
})

// Admin dashboard metrics endpoint (CONVEX-007)
http.route({
  path: '/api/dashboard/metrics',
  method: 'GET',
  handler: httpAction(async (ctx, request) => {
    const deployKey = process.env.CURATION_DEPLOY_KEY
    if (!deployKey) {
      return new Response(JSON.stringify({ error: 'configuration_error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const authHeader = request.headers.get('authorization') ?? ''
    const expected = `Bearer ${deployKey}`
    if (authHeader !== expected) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const metrics = await ctx.runQuery(convexInternal.db.curation.dashboardMetrics, {})
    return new Response(JSON.stringify(metrics), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }),
})

// Public curation endpoints (CONVEX-004) - require Clerk auth
http.route({
  path: '/api/routes/lean',
  method: 'GET',
  handler: httpAction(async (ctx, request) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return new Response(JSON.stringify({ error: 'UNAUTHORIZED' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const url = new URL(request.url)
    const state = url.searchParams.get('state') ?? undefined
    const since = url.searchParams.get('since')
      ? Number(url.searchParams.get('since'))
      : undefined
    const numItems = url.searchParams.get('numItems')
      ? Number(url.searchParams.get('numItems'))
      : 100
    const cursor = url.searchParams.get('cursor') ?? undefined

    try {
      const result = await ctx.runQuery(convexInternal.db.curation.leanSync, {
        state,
        since,
        paginationOpts: {
          numItems,
          cursor,
        },
      })
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (e: any) {
      return new Response(
        JSON.stringify({ error: (e as Error).message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }),
})

http.route({
  path: '/api/routes/enrichment',
  method: 'GET',
  handler: httpAction(async (ctx, request) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return new Response(JSON.stringify({ error: 'UNAUTHORIZED' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const url = new URL(request.url)
    const idsParam = url.searchParams.get('ids')
    if (!idsParam) {
      return new Response(JSON.stringify({ error: 'MISSING_IDS' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const routeIds = idsParam.split(',').slice(0, 50) // max 50

    try {
      const enrichments = await ctx.runQuery(
        convexInternal.db.curation.fetchEnrichments,
        { routeIds }
      )
      return new Response(JSON.stringify({ enrichments }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (e: any) {
      return new Response(
        JSON.stringify({ error: (e as Error).message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }),
})

http.route({
  path: '/api/routes/missing-enrichments',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return new Response(JSON.stringify({ error: 'UNAUTHORIZED' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    let body: { pairs: Array<{ routeId: string; version: number }> }
    try {
      body = await request.json()
    } catch {
      return new Response(JSON.stringify({ error: 'invalid_body', detail: 'not json' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    try {
      const stale = await ctx.runQuery(
        convexInternal.db.curation.checkMissingEnrichments,
        { pairs: body.pairs }
      )
      return new Response(JSON.stringify({ stale }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (e: any) {
      return new Response(
        JSON.stringify({ error: (e as Error).message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }),
})

// User feedback endpoint (CONVEX-005)
http.route({
  path: '/api/feedback',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return new Response(JSON.stringify({ error: 'UNAUTHORIZED' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    let body: {
      routeId: string
      action: string
      rating?: number
      locationLat?: number
      locationLng?: number
      archetypeFilter?: string
    }
    try {
      body = await request.json()
    } catch {
      return new Response(JSON.stringify({ error: 'invalid_body', detail: 'not json' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    try {
      const result = await ctx.runMutation(
        convexInternal.db.routeFeedback.recordRouteFeedback,
        {
          routeId: body.routeId,
          action: body.action,
          rating: body.rating,
          locationLat: body.locationLat,
          locationLng: body.locationLng,
          archetypeFilter: body.archetypeFilter,
        }
      )
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (e: any) {
      return new Response(
        JSON.stringify({ error: (e as Error).message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }),
})

// Intent extraction endpoint (CONVEX-006)
http.route({
  path: '/api/intent/extract-params',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return new Response(JSON.stringify({ error: 'UNAUTHORIZED' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    let body: { intent: string }
    try {
      body = await request.json()
    } catch {
      return new Response(JSON.stringify({ error: 'invalid_body', detail: 'not json' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    try {
      const result = await ctx.runAction(
        convexInternal.actions.curation.intentExtraction.extractIntentParams,
        { intent: body.intent }
      )
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (e: any) {
      return new Response(
        JSON.stringify({ error: (e as Error).message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }),
})

// OSM import endpoints - for ETL pipeline
http.route({
  path: '/osm/importNodes',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const { nodes } = await req.json()

    const result = await ctx.runMutation(convexInternal.db.osm.importNodes, { nodes })

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  }),
})

http.route({
  path: '/osm/importWays',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const { ways } = await req.json()

    const result = await ctx.runMutation(convexInternal.db.osm.importWays, { ways })

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  }),
})

http.route({
  path: '/clerk-webhooks',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const svixId = req.headers.get('svix-id')
    const svixTimestamp = req.headers.get('svix-timestamp')
    const svixSignature = req.headers.get('svix-signature')

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response('Missing Svix headers', { status: 400 })
    }

    // IMPORTANT: Svix verification must use the exact raw body bytes.
    // In Convex HTTP actions, `Buffer` isn't available, so we verify using the raw text.
    const body = await req.text()

    let event: { type: string; data: any }
    try {
      event = new Webhook(CLERK_WEBHOOK_SECRET).verify(body, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as { type: string; data: any }
    } catch (error) {
      console.error('[Clerk webhook] verification failed', error)
      return new Response('Invalid signature', { status: 401 })
    }

    const data = event.data as any

    const sanitizeEmailAddresses = (
      emailAddresses: any
    ): { id: string; email_address: string }[] | undefined => {
      if (!Array.isArray(emailAddresses)) return undefined
      return emailAddresses
        .map((e) => ({ id: e?.id, email_address: e?.email_address }))
        .filter((e) => typeof e.id === 'string' && typeof e.email_address === 'string')
    }

    switch (event.type) {
      case 'user.created':
      case 'user.updated': {
        const userData = {
          id: String(data.id),
          email_addresses: sanitizeEmailAddresses(data.email_addresses),
          primary_email_address_id:
            data.primary_email_address_id === undefined
              ? undefined
              : (data.primary_email_address_id ?? null),
          first_name: data.first_name === undefined ? undefined : (data.first_name ?? null),
          last_name: data.last_name === undefined ? undefined : (data.last_name ?? null),
          updated_at: Number(data.updated_at),
          created_at: Number(data.created_at),
        }

        await ctx.runMutation(convexInternal.db.clerkSync.internalUpsertUserFromClerk, {
          eventId: svixId,
          data: userData,
        })
        break
      }
      case 'user.deleted': {
        await ctx.runMutation(convexInternal.db.clerkSync.internalDeleteUserFromClerk, {
          eventId: svixId,
          data: { id: String(data.id) },
        })
        break
      }
      case 'organization.created':
      case 'organization.updated': {
        const orgData = {
          id: String(data.id),
          name: data.name === undefined ? undefined : (data.name ?? null),
          slug: data.slug === undefined ? undefined : (data.slug ?? null),
          image_url: data.image_url === undefined ? undefined : (data.image_url ?? null),
          updated_at: Number(data.updated_at),
          created_at: Number(data.created_at),
        }

        await ctx.runMutation(convexInternal.db.clerkSync.internalUpsertOrgFromClerk, {
          eventId: svixId,
          data: orgData,
        })
        break
      }
      case 'organization.deleted': {
        await ctx.runMutation(convexInternal.db.clerkSync.internalDeleteOrgFromClerk, {
          eventId: svixId,
          data: { id: String(data.id) },
        })
        break
      }
      case 'organizationMembership.created':
      case 'organizationMembership.updated': {
        const membershipData = {
          id: String(data.id),
          organization_id: String(data.organization_id),
          public_user_data: data.public_user_data
            ? {
                user_id:
                  data.public_user_data.user_id === undefined
                    ? undefined
                    : String(data.public_user_data.user_id),
                first_name:
                  data.public_user_data.first_name === undefined
                    ? undefined
                    : (data.public_user_data.first_name ?? null),
                last_name:
                  data.public_user_data.last_name === undefined
                    ? undefined
                    : (data.public_user_data.last_name ?? null),
                profile_image_url:
                  data.public_user_data.profile_image_url === undefined
                    ? undefined
                    : (data.public_user_data.profile_image_url ?? null),
                email_address:
                  data.public_user_data.email_address === undefined
                    ? undefined
                    : (data.public_user_data.email_address ?? null),
              }
            : undefined,
          role: String(data.role),
          updated_at: Number(data.updated_at),
          created_at: Number(data.created_at),
        }

        await ctx.runMutation(convexInternal.db.clerkSync.internalUpsertOrgMembershipFromClerk, {
          eventId: svixId,
          data: membershipData,
        })
        break
      }
      case 'organizationMembership.deleted': {
        const membershipDeletedData = {
          organization_id: String(data.organization_id),
          public_user_data: data.public_user_data
            ? {
                user_id:
                  data.public_user_data.user_id === undefined
                    ? undefined
                    : String(data.public_user_data.user_id),
              }
            : undefined,
        }

        await ctx.runMutation(convexInternal.db.clerkSync.internalDeleteOrgMembershipFromClerk, {
          eventId: svixId,
          data: membershipDeletedData,
        })
        break
      }
      default:
        // Return 200 for unhandled events so Clerk does not retry indefinitely
        return new Response('Unhandled event', { status: 200 })
    }

    return new Response(null, { status: 200 })
  }),
})

export default http
