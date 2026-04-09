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

export const SESSION_MESSAGE_KIND = {
  TEXT: 'text',
  ROUTING_CARD: 'routing_card',
  WEATHER_CARD: 'weather_card',
  SAVED_ROUTE_CARD: 'saved_route_card',
  REASONING: 'reasoning',
  AGENT_TURN: 'agent_turn',
  TOOL_RESULT_HIDDEN: 'tool_result_hidden',
  PLANNING: 'planning',
  LOCATION_SEARCH_CARD: 'location_search_card',
} as const
export type SessionMessageKind = (typeof SESSION_MESSAGE_KIND)[keyof typeof SESSION_MESSAGE_KIND]

export const sessionMessageKindValidator = v.union(
  v.literal('text'),
  v.literal('routing_card'),
  v.literal('weather_card'),
  v.literal('saved_route_card'),
  v.literal('reasoning'),
  v.literal('agent_turn'),
  v.literal('tool_result_hidden'),
  v.literal('planning'),
  v.literal('location_search_card')
)

export const SESSION_MESSAGE_STATUS = {
  STREAMING: 'streaming',
  RUNNING: 'running',
  COMPLETE: 'complete',
  FAILED: 'failed',
} as const
export type SessionMessageStatus = (typeof SESSION_MESSAGE_STATUS)[keyof typeof SESSION_MESSAGE_STATUS]

export const sessionMessageStatusValidator = v.union(
  v.literal('streaming'),  // assistant text currently arriving token-by-token
  v.literal('running'),    // long-running tool card still working
  v.literal('complete'),   // terminal success
  v.literal('failed')      // terminal failure
)

export const sessionMessageAttachmentValidator = v.union(
  v.object({
    type: v.literal('route_options'),
    routePlanId: v.id('route_plans'),
  }),
  v.object({
    type: v.literal('location_search'),
    searchQuery: v.string(),
    results: v.array(v.object({
      id: v.string(),
      name: v.string(),
      address: v.string(),
      types: v.optional(v.array(v.string())),
      location: v.object({ lat: v.number(), lng: v.number() }),
      detourMinutes: v.optional(v.number()),
      distanceMeters: v.optional(v.number()),
    })),
  })
)
export type SessionMessageAttachment = Infer<typeof sessionMessageAttachmentValidator>

/**
 * WIDEN phase of widen-migrate-narrow: `kind` and `status` are optional here
 * so existing rows remain valid. Migration backfillSessionMessageKindStatus
 * sets defaults (kind='text', status='complete'), then a follow-up commit
 * narrows these fields to required.
 */
export const sessionMessageValidator = v.object({
  sessionId: v.id('planning_sessions'),
  role: sessionMessageRoleValidator,
  content: v.string(),
  attachments: v.optional(v.array(sessionMessageAttachmentValidator)),
  createdAt: v.number(),
  /** Discriminates content type. Defaults to 'text' for pre-migration rows. */
  kind: v.optional(sessionMessageKindValidator),
  /** Per-message lifecycle state. Defaults to 'complete' for pre-migration rows. */
  status: v.optional(sessionMessageStatusValidator),
  /**
   * Full pi-ai Message payload (AssistantMessage, ToolResultMessage, etc.)
   * carried on hidden agent_turn / tool_result_hidden / reasoning rows so the
   * ReAct loop can reconstruct its tool-call history on every turn. Optional
   * during widen phase; narrows once agent rewrite lands.
   */
  piMessage: v.optional(v.any()),
})
export type SessionMessage = Infer<typeof sessionMessageValidator>
