import { v } from 'convex/values'
import type { OrgMembership } from '../../models/org-memberships'
import type { Org } from '../../models/orgs'
import type { Id } from '../_generated/dataModel'
import type { MutationCtx } from '../_generated/server'
import { internalMutation } from '../_generated/server'

type ClerkUserEvent = {
  id: string
  email_addresses?: { id: string; email_address: string }[]
  primary_email_address_id?: string | null
  first_name?: string | null
  last_name?: string | null
  updated_at: number
  created_at: number
}

type ClerkOrgEvent = {
  id: string
  name?: string | null
  slug?: string | null
  image_url?: string | null
  updated_at: number
  created_at: number
}

type ClerkMembershipEvent = {
  id: string
  organization_id: string
  public_user_data?: {
    user_id?: string
    first_name?: string | null
    last_name?: string | null
    profile_image_url?: string | null
    email_address?: string | null
  }
  role: string
  updated_at: number
  created_at: number
}

export const mapClerkUser = (data: ClerkUserEvent) => {
  const primaryId = data.primary_email_address_id
  const primaryEmail =
    data.email_addresses?.find((e) => e.id === primaryId)?.email_address ??
    data.email_addresses?.[0]?.email_address

  return {
    clerkUserId: data.id,
    email: primaryEmail ?? 'unknown@example.com',
    name: [data.first_name, data.last_name].filter(Boolean).join(' ').trim() || 'Unknown User',
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    lastLocalUpdateAt: data.updated_at,
  }
}

export const mapClerkOrg = (data: ClerkOrgEvent) => {
  return {
    clerkOrgId: data.id,
    name: data.name ?? 'Unnamed Organization',
    slug: data.slug ?? undefined,
    imageUrl: data.image_url ?? undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    lastLocalUpdateAt: data.updated_at,
  }
}

export const mapClerkMembership = ({
  data,
  userId,
  orgId,
}: {
  data: ClerkMembershipEvent
  userId: Id<'users'>
  orgId: Id<'orgs'>
}) => {
  return {
    orgId,
    userId,
    role: data.role,
    clerkMembershipId: data.id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

export const shouldSkipWebhookUpdate = (
  localTimestamp: number,
  remoteTimestamp: number,
): boolean => {
  return localTimestamp > remoteTimestamp
}

const getUserIdByClerkId = async (
  ctx: MutationCtx,
  clerkUserId: string,
): Promise<Id<'users'> | null> => {
  const existing = await ctx.db
    .query('users')
    .withIndex('by_clerkUserId', (q) => q.eq('clerkUserId', clerkUserId))
    .unique()
  return existing?._id ?? null
}

const getOrgIdByClerkId = async (
  ctx: MutationCtx,
  clerkOrgId: string,
): Promise<Id<'orgs'> | null> => {
  const existing = await ctx.db
    .query('orgs')
    .withIndex('by_clerkOrgId', (q) => q.eq('clerkOrgId', clerkOrgId))
    .unique()
  return existing?._id ?? null
}

export const internalUpsertUserFromClerk = internalMutation({
  args: {
    eventId: v.string(),
    data: v.object({
      id: v.string(),
      email_addresses: v.optional(v.array(v.object({ id: v.string(), email_address: v.string() }))),
      primary_email_address_id: v.optional(v.union(v.string(), v.null())),
      first_name: v.optional(v.union(v.string(), v.null())),
      last_name: v.optional(v.union(v.string(), v.null())),
      updated_at: v.number(),
      created_at: v.number(),
    }),
  },
  returns: v.null(),
  handler: async (ctx, { data }) => {
    const mapped = mapClerkUser(data)

    // Skip placeholder users with no email addresses
    if (!data.email_addresses || data.email_addresses.length === 0) {
      return null
    }

    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerkUserId', (q) => q.eq('clerkUserId', mapped.clerkUserId))
      .unique()

    if (existing) {
      if (shouldSkipWebhookUpdate(existing.lastLocalUpdateAt, mapped.updatedAt)) {
        return null
      }

      await ctx.db.patch(existing._id, {
        email: mapped.email,
        name: mapped.name,
        updatedAt: mapped.updatedAt,
      })
      return null
    }

    await ctx.db.insert('users', mapped)
    return null
  },
})

export const internalDeleteUserFromClerk = internalMutation({
  args: {
    eventId: v.string(),
    data: v.object({ id: v.string() }),
  },
  returns: v.null(),
  handler: async (ctx, { data }) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerkUserId', (q) => q.eq('clerkUserId', data.id))
      .unique()

    if (!existing) {
      return null
    }

    // Cascade delete memberships first
    const memberships = ctx.db
      .query('org_memberships')
      .withIndex('by_userId', (q) => q.eq('userId', existing._id))
    for await (const membership of memberships) {
      await ctx.db.delete(membership._id)
    }

    await ctx.db.delete(existing._id)
    return null
  },
})

export const internalUpsertOrgFromClerk = internalMutation({
  args: {
    eventId: v.string(),
    data: v.object({
      id: v.string(),
      name: v.optional(v.union(v.string(), v.null())),
      slug: v.optional(v.union(v.string(), v.null())),
      image_url: v.optional(v.union(v.string(), v.null())),
      updated_at: v.number(),
      created_at: v.number(),
    }),
  },
  returns: v.null(),
  handler: async (ctx, { data }) => {
    const mapped: Org = mapClerkOrg(data)

    const existing = await ctx.db
      .query('orgs')
      .withIndex('by_clerkOrgId', (q) => q.eq('clerkOrgId', mapped.clerkOrgId))
      .unique()

    if (existing) {
      if (shouldSkipWebhookUpdate(existing.lastLocalUpdateAt, mapped.updatedAt)) {
        return null
      }

      await ctx.db.patch(existing._id, {
        name: mapped.name,
        slug: mapped.slug,
        imageUrl: mapped.imageUrl,
        updatedAt: mapped.updatedAt,
      })
      return null
    }

    await ctx.db.insert('orgs', mapped)
    return null
  },
})

export const internalDeleteOrgFromClerk = internalMutation({
  args: {
    eventId: v.string(),
    data: v.object({ id: v.string() }),
  },
  returns: v.null(),
  handler: async (ctx, { data }) => {
    const org = await ctx.db
      .query('orgs')
      .withIndex('by_clerkOrgId', (q) => q.eq('clerkOrgId', data.id))
      .unique()

    if (!org) {
      return null
    }

    // Cascade delete memberships for this org
    const memberships = ctx.db
      .query('org_memberships')
      .withIndex('by_orgId', (q) => q.eq('orgId', org._id))
    for await (const membership of memberships) {
      await ctx.db.delete(membership._id)
    }

    await ctx.db.delete(org._id)
    return null
  },
})

export const internalUpsertOrgMembershipFromClerk = internalMutation({
  args: {
    eventId: v.string(),
    data: v.object({
      id: v.string(),
      organization_id: v.string(),
      public_user_data: v.optional(
        v.object({
          user_id: v.optional(v.string()),
          first_name: v.optional(v.union(v.string(), v.null())),
          last_name: v.optional(v.union(v.string(), v.null())),
          profile_image_url: v.optional(v.union(v.string(), v.null())),
          email_address: v.optional(v.union(v.string(), v.null())),
        }),
      ),
      role: v.string(),
      updated_at: v.number(),
      created_at: v.number(),
    }),
  },
  returns: v.null(),
  handler: async (ctx, { data }) => {
    const orgId = await getOrgIdByClerkId(ctx, data.organization_id)
    if (!orgId) {
      // Cannot attach membership without org; skip gracefully.
      return null
    }

    const clerkUserId = data.public_user_data?.user_id
    if (!clerkUserId) {
      return null
    }

    let userId = await getUserIdByClerkId(ctx, clerkUserId)
    if (!userId) {
      // Create a minimal user if possible from membership data
      const createdAt = data.created_at
      const updatedAt = data.updated_at
      const email = data.public_user_data?.email_address ?? 'unknown@example.com'
      const name =
        [data.public_user_data?.first_name, data.public_user_data?.last_name]
          .filter(Boolean)
          .join(' ')
          .trim() || 'Unknown User'

      userId = await ctx.db.insert('users', {
        clerkUserId,
        email,
        name,
        createdAt,
        updatedAt,
        lastLocalUpdateAt: updatedAt,
      })
    }

    const existing = await ctx.db
      .query('org_memberships')
      .withIndex('by_userId_and_orgId', (q) => q.eq('userId', userId!).eq('orgId', orgId))
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, {
        role: data.role,
        clerkMembershipId: data.id,
        updatedAt: data.updated_at,
      })
      return null
    }

    const mapped: OrgMembership = mapClerkMembership({ data, userId: userId!, orgId })
    await ctx.db.insert('org_memberships', mapped)
    return null
  },
})

export const internalDeleteOrgMembershipFromClerk = internalMutation({
  args: {
    eventId: v.string(),
    data: v.object({
      organization_id: v.string(),
      public_user_data: v.optional(v.object({ user_id: v.optional(v.string()) })),
    }),
  },
  returns: v.null(),
  handler: async (ctx, { data }) => {
    const orgId = await getOrgIdByClerkId(ctx, data.organization_id)
    const clerkUserId = data.public_user_data?.user_id
    if (!orgId || !clerkUserId) {
      return null
    }

    const userId = await getUserIdByClerkId(ctx, clerkUserId)
    if (!userId) {
      return null
    }

    const existing = await ctx.db
      .query('org_memberships')
      .withIndex('by_userId_and_orgId', (q) => q.eq('userId', userId).eq('orgId', orgId))
      .unique()

    if (existing) {
      await ctx.db.delete(existing._id)
    }

    return null
  },
})
