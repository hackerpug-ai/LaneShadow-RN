'use node'

import { v } from 'convex/values'
import { clerkClient } from '../../lib/clerk-backend'
import { internal } from '../_generated/api'
import type { Id } from '../_generated/dataModel'
import { action } from '../_generated/server'
import { requireSession } from '../guards'

const buildNameParts = (
  name?: string | null,
): { first_name?: string | null; last_name?: string | null } => {
  if (!name) return {}
  const trimmed = name.trim()
  if (!trimmed) return {}
  const [first, ...rest] = trimmed.split(' ')
  return {
    first_name: first || null,
    last_name: rest.join(' ') || null,
  }
}

export const updateCurrentProfile = action({
  args: {
    name: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  returns: v.object({ userId: v.id('users') }),
  handler: async (ctx, args): Promise<{ userId: Id<'users'> }> => {
    const { user } = await requireSession(ctx)
    const { clerkUserId } = user

    if (!args.name && !args.email) {
      throw new Error('NO_FIELDS_TO_UPDATE')
    }

    const nameParts = buildNameParts(args.name)
    await clerkClient.users.updateUser(clerkUserId, {
      firstName: nameParts.first_name ?? undefined,
      lastName: nameParts.last_name ?? undefined,
      // Email updates are not issued here; Clerk requires dedicated flows.
    })

    const clerkUser = await clerkClient.users.getUser(clerkUserId)

    await ctx.runMutation(internal.db.clerkSync.internalUpsertUserFromClerk, {
      eventId: 'action:updateCurrentProfile',
      data: {
        id: clerkUser.id,
        email_addresses: clerkUser.emailAddresses?.map((e: any) => ({
          id: e.id,
          email_address: e.emailAddress,
        })),
        primary_email_address_id: clerkUser.primaryEmailAddressId ?? null,
        first_name: clerkUser.firstName ?? null,
        last_name: clerkUser.lastName ?? null,
        created_at: Number(clerkUser.createdAt ?? Date.now()),
        updated_at: Number(clerkUser.updatedAt ?? Date.now()),
      },
    })

    const local: { userId: Id<'users'> } = await ctx.runQuery(
      internal.db.users.getUserIdByClerkId,
      {
        clerkUserId: clerkUser.id,
      },
    )

    return { userId: local.userId }
  },
})
