import { httpRouter } from 'convex/server'
import { Webhook } from 'svix'
import { internal } from './_generated/api'
import { httpAction } from './_generated/server'
import { CLERK_WEBHOOK_SECRET } from './lib/env'

const http = httpRouter()
const convexInternal = internal as any

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
