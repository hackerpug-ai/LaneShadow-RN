import { Infer, v } from 'convex/values'

export const ORG_FIELDS = {
  clerkOrgId: v.string(),
  name: v.string(),
  slug: v.optional(v.string()),
  imageUrl: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
  /**
   * Timestamp of the most recent local (app) edit to this org profile.
   * Webhook updates should not overwrite changes that are newer than this value.
   */
  lastLocalUpdateAt: v.number(),
} as const

export const orgValidator = v.object(ORG_FIELDS)
export type Org = Infer<typeof orgValidator>
