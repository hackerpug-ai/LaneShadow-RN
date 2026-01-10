/**
 * Users API - Demo functions showing Zod validation pattern
 *
 * Shows how to:
 * - Use zQuery and zMutation for Zod-validated functions
 * - Import and use Zod schemas from models/
 * - Define return types with Zod
 */

import { z } from 'zod'
import { UserSchema } from '../models/users'
import { zMutation, zQuery } from './z'

/**
 * List all users (demo query)
 * Returns array of users from the database
 */
export const list = zQuery({
  args: {},
  returns: z.array(
    z.object({
      _id: z.string(),
      _creationTime: z.number(),
      email: z.string().email(),
      name: z.string(),
      createdAt: z.number(),
    })
  ),
  handler: async (ctx) => {
    const users = await ctx.db.query('users').collect()
    return users
  },
})

/**
 * Create a new user (demo mutation)
 * Validates email and name using Zod, returns inserted user ID
 */
export const create = zMutation({
  args: UserSchema.pick({ email: true, name: true }),
  returns: z.object({ id: z.string() }),
  handler: async (ctx, args) => {
    const doc = {
      ...args,
      createdAt: Date.now(),
    } satisfies z.infer<typeof UserSchema>

    const id = await ctx.db.insert(
      'users',
      doc as { email: string; name: string; createdAt: number }
    )
    return { id }
  },
})
