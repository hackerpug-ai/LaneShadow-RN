import { type Infer, v } from 'convex/values'

export const SESSION_MESSAGE_ROLE = {
  RIDER: 'rider',
  SYSTEM: 'system',
} as const
export type SessionMessageRole = (typeof SESSION_MESSAGE_ROLE)[keyof typeof SESSION_MESSAGE_ROLE]

export const sessionMessageRoleValidator = v.union(v.literal('rider'), v.literal('system'))

export const SESSION_MESSAGE_KIND = {
  TEXT: 'text',
  ROUTING_CARD: 'routing_card',
  WEATHER_CARD: 'weather_card',
  SAVED_ROUTE_CARD: 'saved_route_card',
  REASONING: 'reasoning',
  AGENT_TURN: 'agent_turn',
  TOOL_RESULT_HIDDEN: 'tool_result_hidden',
  PLANNING: 'planning',
  THINKING_CARD: 'thinking_card',
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
  v.literal('thinking_card'),
)

export const SESSION_MESSAGE_STATUS = {
  STREAMING: 'streaming',
  RUNNING: 'running',
  COMPLETE: 'complete',
  FAILED: 'failed',
} as const
export type SessionMessageStatus =
  (typeof SESSION_MESSAGE_STATUS)[keyof typeof SESSION_MESSAGE_STATUS]

export const sessionMessageStatusValidator = v.union(
  v.literal('streaming'), // assistant text currently arriving token-by-token
  v.literal('running'), // long-running tool card still working
  v.literal('complete'), // terminal success
  v.literal('failed'), // terminal failure
)

export const PLANNING_PHASE = {
  PARSING: 'parsing',
  SEARCHING: 'searching',
  DRAFTING: 'drafting',
  ENRICHING: 'enriching',
  FINALIZING: 'finalizing',
} as const
export type PlanningPhase = (typeof PLANNING_PHASE)[keyof typeof PLANNING_PHASE]

export const planningPhaseValidator = v.union(
  v.literal('parsing'),
  v.literal('searching'),
  v.literal('drafting'),
  v.literal('enriching'),
  v.literal('finalizing'),
)

export const sessionMessageAttachmentValidator = v.object({
  type: v.literal('route_options'),
  routePlanId: v.id('route_plans'),
})
export type SessionMessageAttachment = Infer<typeof sessionMessageAttachmentValidator>

/**
 * Individual step in a thinking card timeline.
 *
 * - 'thinking': Agent reasoning delta (text-only)
 * - 'tool_start': Tool invocation started (toolName required)
 * - 'tool_finish': Tool invocation finished (toolName required)
 */
export const thinkingStepValidator = v.object({
  type: v.union(v.literal('thinking'), v.literal('tool_start'), v.literal('tool_finish')),
  toolName: v.optional(v.string()),
  summary: v.string(),
  detail: v.optional(v.string()),
  timestamp: v.number(),
})
export type ThinkingStep = Infer<typeof thinkingStepValidator>

type PlanningEventContent = {
  events?: Array<{
    type?: 'tool_pending' | 'tool_complete' | 'agent_complete'
    tool?: string
  }>
}

const SEARCHING_TOOL_NAMES = new Set(['geocode', 'search_agent', 'webSearch'])
const DRAFTING_TOOL_NAMES = new Set([
  'createRouteSketch',
  'compileSketch',
  'planRoute',
  'routing_agent',
])
const ENRICHING_TOOL_NAMES = new Set([
  'searchNearby',
  'getRouteWeather',
  'webSearchResults',
  'enrichment_agent',
])

const PLANNING_PHASE_ORDER: Record<PlanningPhase, number> = {
  [PLANNING_PHASE.PARSING]: 0,
  [PLANNING_PHASE.SEARCHING]: 1,
  [PLANNING_PHASE.DRAFTING]: 2,
  [PLANNING_PHASE.ENRICHING]: 3,
  [PLANNING_PHASE.FINALIZING]: 4,
}

export const derivePlanningPhaseFromToolName = (toolName?: string): PlanningPhase | null => {
  if (!toolName) return null
  if (SEARCHING_TOOL_NAMES.has(toolName)) return PLANNING_PHASE.SEARCHING
  if (DRAFTING_TOOL_NAMES.has(toolName)) return PLANNING_PHASE.DRAFTING
  if (ENRICHING_TOOL_NAMES.has(toolName)) return PLANNING_PHASE.ENRICHING
  return null
}

export const mergePlanningPhase = (
  currentPhase: PlanningPhase | null | undefined,
  nextPhase: PlanningPhase | null | undefined,
): PlanningPhase | null => {
  if (currentPhase === undefined || currentPhase === null) return nextPhase ?? null
  if (nextPhase === undefined || nextPhase === null) return currentPhase
  return PLANNING_PHASE_ORDER[nextPhase] > PLANNING_PHASE_ORDER[currentPhase]
    ? nextPhase
    : currentPhase
}

const parsePlanningContent = (content: string): PlanningEventContent | null => {
  if (!content.trim().startsWith('{')) return null
  try {
    return JSON.parse(content) as PlanningEventContent
  } catch {
    return null
  }
}

const derivePlanningPhaseFromThinkingSteps = (
  thinkingSteps?: ThinkingStep[],
): PlanningPhase | null => {
  let lastKnownPhase: PlanningPhase | null = null
  for (const step of thinkingSteps ?? []) {
    if (step.type === 'tool_finish' && step.toolName === 'routing_agent') {
      lastKnownPhase = mergePlanningPhase(lastKnownPhase, PLANNING_PHASE.FINALIZING)
      continue
    }
    const nextPhase = derivePlanningPhaseFromToolName(step.toolName)
    if (nextPhase !== null) {
      lastKnownPhase = mergePlanningPhase(lastKnownPhase, nextPhase)
    }
  }
  return lastKnownPhase
}

const derivePlanningPhaseFromPlanningContent = (content: string): PlanningPhase | null => {
  const parsed = parsePlanningContent(content)
  let lastKnownPhase: PlanningPhase | null = null

  for (const event of parsed?.events ?? []) {
    if (event.type === 'agent_complete') {
      lastKnownPhase = mergePlanningPhase(lastKnownPhase, PLANNING_PHASE.FINALIZING)
      continue
    }
    const nextPhase = derivePlanningPhaseFromToolName(event.tool)
    if (nextPhase !== null) {
      lastKnownPhase = mergePlanningPhase(lastKnownPhase, nextPhase)
    }
  }

  return lastKnownPhase
}

/**
 * Canonical planning-phase contract for session messages.
 *
 * - Structured planning activity is authoritative: derive from
 *   `thinkingSteps[].toolName`, then from structured planning-event JSON stored
 *   in `content`, then from the terminal `status`.
 * - Planning rows may also persist `phase` for client convenience, but stored
 *   values are treated as a cache and must never override newer structured
 *   activity.
 * - Pre-migration rows may omit `phase` and `thinkingSteps`; those rows fall
 *   back to the persisted `phase`, then to the documented default for active
 *   planning rows.
 * - This contract never inspects human-readable text substrings.
 */
export const derivePlanningPhase = (message: SessionMessage): PlanningPhase | null => {
  if (message.kind !== SESSION_MESSAGE_KIND.PLANNING) {
    return null
  }

  if (message.status === SESSION_MESSAGE_STATUS.COMPLETE) {
    return PLANNING_PHASE.FINALIZING
  }

  const thinkingStepPhase = derivePlanningPhaseFromThinkingSteps(message.thinkingSteps)
  if (thinkingStepPhase !== null) {
    return thinkingStepPhase
  }

  const contentPhase = derivePlanningPhaseFromPlanningContent(message.content)
  if (contentPhase !== null) {
    return contentPhase
  }

  if (message.phase !== undefined) {
    return message.phase
  }

  if (
    message.status === SESSION_MESSAGE_STATUS.STREAMING ||
    message.status === SESSION_MESSAGE_STATUS.RUNNING ||
    message.status === undefined
  ) {
    return PLANNING_PHASE.PARSING
  }

  return null
}

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
  /**
   * Structured thinking steps for thinking_card rows.
   * Captures agent reasoning deltas and tool activity (start/finish).
   */
  thinkingSteps: v.optional(v.array(thinkingStepValidator)),
  /** Canonical phase for planning rows; optional for backward compatibility. */
  phase: v.optional(planningPhaseValidator),
})
export type SessionMessage = Infer<typeof sessionMessageValidator>
