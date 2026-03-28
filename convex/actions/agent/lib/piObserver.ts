'use node'

import type { ActionCtx } from '../../../_generated/server'
import { backend } from '../../../lib/logger'
import { PI_OBSERVABILITY_ENABLED } from '../../../lib/env'

/**
 * Pi event observer for AgentSession lifecycle.
 * Replaces LangSmith tracing with pi event system.
 */
export const createPiObserver = (ctx: ActionCtx, userId?: string) => {
  const effectiveUserId = userId ?? 'anonymous'
  const sessionId = crypto.randomUUID()

  return {
    onSessionStart: (metadata: { model: string; temperature: number }) => {
      if (!PI_OBSERVABILITY_ENABLED) return
      backend.info('pi.session', 'Agent session started', {
        userId: effectiveUserId,
        sessionId,
        model: metadata.model,
        temperature: metadata.temperature,
      })
    },

    onSessionEnd: (result: { success: boolean; error?: string }) => {
      if (!PI_OBSERVABILITY_ENABLED) return
      backend.info('pi.session', 'Agent session ended', {
        userId: effectiveUserId,
        sessionId,
        success: result.success,
        error: result.error,
      })
    },

    onToolStart: (toolName: string, args: any) => {
      if (!PI_OBSERVABILITY_ENABLED) return
      backend.info('pi.tool', 'Tool execution started', {
        userId: effectiveUserId,
        sessionId,
        toolName,
        argKeys: Object.keys(args),
      })
    },

    onToolEnd: (toolName: string, result: any) => {
      if (!PI_OBSERVABILITY_ENABLED) return
      backend.info('pi.tool', 'Tool execution completed', {
        userId: effectiveUserId,
        sessionId,
        toolName,
      })
    },

    onToolError: (toolName: string, error: Error) => {
      if (!PI_OBSERVABILITY_ENABLED) return
      backend.error('pi.tool', 'Tool execution failed', error, {
        userId: effectiveUserId,
        sessionId,
        toolName,
      })
    },

    onLlmRequestStart: (params: { model: string; promptTokens: number }) => {
      if (!PI_OBSERVABILITY_ENABLED) return
      backend.info('pi.llm', 'LLM request started', {
        userId: effectiveUserId,
        sessionId,
        model: params.model,
        promptTokens: params.promptTokens,
      })
    },

    onLlmRequestEnd: (result: { totalTokens: number; finishReason: string }) => {
      if (!PI_OBSERVABILITY_ENABLED) return
      backend.info('pi.llm', 'LLM request completed', {
        userId: effectiveUserId,
        sessionId,
        totalTokens: result.totalTokens,
        finishReason: result.finishReason,
      })
    },
  }
}
