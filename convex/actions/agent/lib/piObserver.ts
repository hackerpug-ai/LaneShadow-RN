'use node'

import type { ActionCtx } from '../../../_generated/server'
import { backend } from '../../../lib/logger'
import { PI_OBSERVABILITY_ENABLED } from '../../../lib/env'
import type { AgentEvent } from '@mariozechner/pi-agent-core/dist/types'

/**
 * Pi event observer for Agent lifecycle.
 * Listens to AgentEvent stream and logs relevant events.
 */
export const createPiObserver = (ctx: ActionCtx, userId?: string) => {
  const effectiveUserId = userId ?? 'anonymous'
  const sessionId = crypto.randomUUID()

  return (event: AgentEvent) => {
    if (!PI_OBSERVABILITY_ENABLED) return

    switch (event.type) {
      case 'agent_start':
        backend.info('pi.agent', 'Agent session started', {
          userId: effectiveUserId,
          sessionId,
        })
        break

      case 'agent_end':
        backend.info('pi.agent', 'Agent session ended', {
          userId: effectiveUserId,
          sessionId,
          messageCount: event.messages.length,
        })
        break

      case 'turn_start':
        backend.info('pi.agent', 'Turn started', {
          userId: effectiveUserId,
          sessionId,
        })
        break

      case 'turn_end':
        backend.info('pi.agent', 'Turn ended', {
          userId: effectiveUserId,
          sessionId,
          toolResultCount: event.toolResults.length,
        })
        break

      case 'message_start':
        backend.info('pi.agent', 'Message started', {
          userId: effectiveUserId,
          sessionId,
          role: event.message.role,
        })
        break

      case 'message_update':
        backend.debug('pi.agent', 'Message updated', {
          userId: effectiveUserId,
          sessionId,
          role: event.message.role,
        })
        break

      case 'message_end':
        backend.info('pi.agent', 'Message ended', {
          userId: effectiveUserId,
          sessionId,
          role: event.message.role,
        })
        break

      case 'tool_execution_start':
        backend.info('pi.tool', 'Tool execution started', {
          userId: effectiveUserId,
          sessionId,
          toolName: event.toolName,
          argKeys: Object.keys(event.args || {}),
        })
        break

      case 'tool_execution_update':
        backend.debug('pi.tool', 'Tool execution updated', {
          userId: effectiveUserId,
          sessionId,
          toolName: event.toolName,
        })
        break

      case 'tool_execution_end':
        if (event.isError) {
          backend.error('pi.tool', 'Tool execution failed', new Error(event.result?.toString?.() || 'Unknown error'), {
            userId: effectiveUserId,
            sessionId,
            toolName: event.toolName,
          })
        } else {
          backend.info('pi.tool', 'Tool execution completed', {
            userId: effectiveUserId,
            sessionId,
            toolName: event.toolName,
          })
        }
        break
    }
  }
}
