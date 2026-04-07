'use node'

/**
 * Thin wrapper around the orchestrator — preserves the public API so that
 * sendMessage.ts and tests can continue importing from this module.
 *
 * The monolithic agent that previously lived here has been decomposed into:
 * - orchestrator.ts (intent classification + sub-agent dispatch)
 * - routingAgent.ts (route creation)
 * - enrichmentAgent.ts (route analysis)
 * - searchAgent.ts (nearby/web search)
 */

import type { ActionCtx } from '../../_generated/server'
import type { Id } from '../../_generated/dataModel'
import type { AssistantMessage, Message, ToolResultMessage } from '@mariozechner/pi-ai'
import { executeOrchestrator, buildOrchestratorPrompt } from './agents/orchestrator'

// -----------------------------------------------------------------------------
// Re-exported types (used by sub-agents, runAgent, sendMessage)
// -----------------------------------------------------------------------------

export type AgentContext = {
  planningSessionId: Id<'planning_sessions'>
  clerkUserId: string
  piMessages: Message[]
  currentLocation?: { lat: number; lng: number }
  runQuery: ActionCtx['runQuery']
  runMutation: ActionCtx['runMutation']
}

export type ToolResult =
  | { type: 'routes'; data: { planId: string; options: any[] }; routePlanId: Id<'route_plans'> }
  | { type: 'error'; message: string; hint?: string; retryGuidance?: string; routePlanId?: Id<'route_plans'> }
  | { type: 'confirmation'; message: string }
  | { type: 'search_results'; data: any[] }
  | { type: 'weather'; data: any }
  | { type: 'chat'; message: string; hint?: string; retryGuidance?: string }

export type ExecuteContext = {
  onToolStart?: (toolName: string, args: unknown) => Promise<{ messageId: Id<'session_messages'> } | void>
  onToolFinish?: (toolCallId: string, toolName: string, messageId: Id<'session_messages'> | undefined, result: unknown) => Promise<void>
  onTextDelta?: (delta: string) => Promise<void>
  onThinkingDelta?: (delta: string) => Promise<void>
  onToolPending?: (partial: { name: string }) => Promise<void>
  onStepStart?: (step: number, maxSteps: number) => Promise<void>
  onAgentTurn?: (assistant: AssistantMessage) => Promise<void>
  onToolResultPiMessage?: (toolCallId: string, result: ToolResultMessage) => Promise<void>
  onFinalAssistant?: (assistant: AssistantMessage) => Promise<void>
  /** Planning event callbacks — wired by sendMessage to PlanningEventEmitter */
  onSubToolPending?: (tool: string, agent: string) => Promise<void>
  onSubToolComplete?: (tool: string, agent: string, summary: string, durationMs: number) => Promise<void>
  onSubAgentComplete?: (agent: string, summary: string, durationMs: number) => Promise<void>
}

// -----------------------------------------------------------------------------
// extractRouteAttachments (kept for test backward compat)
// -----------------------------------------------------------------------------

export function extractRouteAttachments(
  toolResults: { toolName: string; result: unknown }[]
): { type: string; routePlanId?: Id<'route_plans'> }[] {
  const attachments: { type: string; routePlanId?: Id<'route_plans'> }[] = []

  for (const tr of toolResults) {
    if (tr.toolName === 'planRoute' || tr.toolName === 'compileSketch') {
      const result = tr.result as any
      if (result?.type === 'routes' && result?.routePlanId) {
        attachments.push({
          type: 'route_options',
          routePlanId: result.routePlanId,
        })
      }
    }
  }

  return attachments
}

// -----------------------------------------------------------------------------
// buildSystemPrompt (delegates to orchestrator — kept for test backward compat)
// -----------------------------------------------------------------------------

export const buildSystemPrompt = async (ctx: AgentContext): Promise<string> => {
  return buildOrchestratorPrompt(ctx, ['routing_agent', 'search_agent', 'enrichment_agent'])
}

// -----------------------------------------------------------------------------
// Main Entry Point — delegates to orchestrator
// -----------------------------------------------------------------------------

export async function executeRidePlanningAgent(
  ctx: AgentContext,
  userMessage: string,
  executeCtx?: ExecuteContext
): Promise<{ response: string; attachments?: { type: string; routePlanId?: Id<'route_plans'> }[] }> {
  const result = await executeOrchestrator(ctx, userMessage, executeCtx)
  return {
    response: result.response,
    attachments: result.attachments,
  }
}
