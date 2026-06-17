'use node'

import type { Id } from '../../../_generated/dataModel'
import type { BudgetTracker } from '../budgetTracker'
import type { AgentContext, ExecuteContext } from '../ridePlanningAgent'

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

export type DiscoveryAgentResult =
  | { status: 'discovered'; routePlanId: Id<'route_plans'>; summary: string }
  | { status: 'no_routes'; message: string }
  | { status: 'needs_clarification'; question: string }
  | { status: 'failed'; reason: string }

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
