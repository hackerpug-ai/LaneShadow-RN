import { Infer, v } from 'convex/values'

export const ORG_MEMBERSHIP_FIELDS = {
  orgId: v.id('orgs'),
  userId: v.id('users'),
  role: v.string(),
  clerkMembershipId: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
} as const

export const orgMembershipValidator = v.object(ORG_MEMBERSHIP_FIELDS)
export type OrgMembership = Infer<typeof orgMembershipValidator>
