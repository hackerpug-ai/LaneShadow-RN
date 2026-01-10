import { zodOutputToConvex } from 'convex-helpers/server/zod'
import { z } from 'zod'

/**
 * Zod-first schema for User
 * Define data shape with Zod for runtime validation
 */
export const UserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
  createdAt: z.number().describe('Timestamp in milliseconds'),
})

/**
 * TypeScript type inferred from Zod schema
 * Use this type for application code
 */
export type User = z.infer<typeof UserSchema>

/**
 * Convex validator derived from Zod schema
 * Use in convex/schema.ts for database table definitions
 * Use with zMutation/zQuery to validate function args
 */
export const UserValidator = zodOutputToConvex(UserSchema)
