/**
 * Pure selection rule for the route-plan home's active chat session.
 *
 * Cold app opens must start in the no-route discovery state. A prior session is
 * active only when the rider explicitly opens it via URL params, or when the
 * current screen created a planning session for a newly sent message.
 */
export function resolveActiveChatSessionId(args: {
  sessionIdParam?: string | string[] | null
  planningSessionId?: string | null
}): string | null {
  const { sessionIdParam, planningSessionId } = args
  const explicitParam = Array.isArray(sessionIdParam) ? sessionIdParam[0] : sessionIdParam

  if (explicitParam?.trim()) return explicitParam
  if (planningSessionId?.trim()) return planningSessionId
  return null
}
