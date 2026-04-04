import { Infer, v } from 'convex/values'

export const SESSION_MESSAGE_ROLE = {
  RIDER: 'rider',
  SYSTEM: 'system',
} as const
export type SessionMessageRole = (typeof SESSION_MESSAGE_ROLE)[keyof typeof SESSION_MESSAGE_ROLE]

export const sessionMessageRoleValidator = v.union(
  v.literal('rider'),
  v.literal('system')
)

export const sessionMessageAttachmentValidator = v.object({
  type: v.literal('route_options'),
  routePlanId: v.id('route_plans'),
})

export const sessionMessageValidator = v.object({
  sessionId: v.id('planning_sessions'),
  role: sessionMessageRoleValidator,
  content: v.string(),
  attachments: v.optional(v.array(sessionMessageAttachmentValidator)),
  createdAt: v.number(),
})
export type SessionMessage = Infer<typeof sessionMessageValidator>
