'use node'

import type { Id } from '../../../_generated/dataModel'
import type { AgentContext, ExecuteContext } from '../ridePlanningAgent'
import type { BudgetTracker } from '../budgetTracker'

// -----------------------------------------------------------------------------
// Sub-agent result types
// -----------------------------------------------------------------------------

export type RoutingAgentResult =
  | { status: 'route_ready'; routePlanId: Id<'route_plans'>; summary: string }
  | { status: 'needs_clarification'; question: string }
  | { status: 'failed'; reason: string }

export type EnrichmentAgentResult =
  | { status: 'answered'; data: unknown; summary: string }
  | { status: 'not_applicable'; reason: string }

export type SearchAgentResult =
  | { status: 'answered'; data: unknown; summary: string }
  | { status: 'not_applicable'; reason: string }

// -----------------------------------------------------------------------------
// Sub-agent config (shared across all sub-agents in the orchestrator)
// -----------------------------------------------------------------------------

/**
 * Configuration passed from the orchestrator to each sub-agent.
 * Each sub-agent selects its own model internally — this config does NOT
 * include a model field.
 */
export type SubAgentConfig = {
  ctx: AgentContext
  executeCtx?: ExecuteContext
  budgetTracker: BudgetTracker
  userMessage: string
}
