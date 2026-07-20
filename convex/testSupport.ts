/**
 * FIX-08: Test support utilities for fixture setup.
 *
 * Provides a dev-only mutation to bootstrap a founder user so that
 * fixture mutations (which require founder role) can be called by tests.
 *
 * SAFETY: devSetupFounderUser only works when called with an identity
 * whose subject starts with a known test prefix. This prevents abuse.
 */

import { ConvexError, v } from 'convex/values'
import { mutation } from './_generated/server'
import { requireIdentity, TEST_SUBJECT_PREFIXES } from './guards'

/**
 * Public mutation for test/dev bootstrap only.
 * Creates or updates a user record with the specified role.
 * Only allowed for identities with a test-prefix subject.
 */
export const devSetupFounderUser = mutation({
  args: {
    clerkUserId: v.string(),
    role: v.union(v.literal('founder'), v.literal('operator')),
  },
  handler: async (ctx, { clerkUserId, role }) => {
    await requireIdentity(ctx)

    // Safety gate: only allow setting up test identities (subjects that
    // start with a known test prefix). This prevents arbitrary users from
    // escalating their own role in production.
    const isTestSubject = TEST_SUBJECT_PREFIXES.some((p) => clerkUserId.startsWith(p))
    if (!isTestSubject) {
      throw new ConvexError({
        code: 'FORBIDDEN',
        message: `Cannot set up non-test user '${clerkUserId}' via dev bootstrap — only test identities allowed`,
      })
    }

    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_clerkUserId', (q) => q.eq('clerkUserId', clerkUserId))
      .unique()

    if (existingUser) {
      await ctx.db.patch(existingUser._id, { role })
      return { clerkUserId, role, created: false }
    }

    await ctx.db.insert('users', {
      clerkUserId,
      email: `${clerkUserId}@test.lanerunner.dev`,
      name: `Test ${clerkUserId}`,
      role,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastLocalUpdateAt: Date.now(),
    })
    return { clerkUserId, role, created: true }
  },
})
