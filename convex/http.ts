"use node"

import { Webhook } from 'svix'
import { httpRouter } from 'convex/server'
import { httpAction } from './_generated/server'

const http = httpRouter()

http.route({
  path: '/clerk-webhooks',
  method: 'POST',
  handler: httpAction(async (_ctx, req) => {
    const secret = process.env.CLERK_WEBHOOK_SECRET
    if (!secret) {
      return new Response('Missing webhook secret', { status: 500 })
    }

    const svixId = req.headers.get('svix-id')
    const svixTimestamp = req.headers.get('svix-timestamp')
    const svixSignature = req.headers.get('svix-signature')

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response('Missing svix headers', { status: 400 })
    }

    const body = Buffer.from(await req.arrayBuffer())

    try {
      const event = new Webhook(secret).verify(body, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      })

      console.log('[Clerk webhook] event type:', (event as any)?.type)
      return new Response(null, { status: 200 })
    } catch (error) {
      console.error('[Clerk webhook] verification failed', error)
      return new Response('Invalid signature', { status: 400 })
    }
  }),
})

export default http
