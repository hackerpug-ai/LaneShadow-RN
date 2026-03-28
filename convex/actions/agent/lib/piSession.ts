'use node'

import type { ActionCtx } from '../../../_generated/server'
import { OPENAI_API_KEY, PI_MODEL, PI_TEMPERATURE } from '../../../lib/env'
import { createPiObserver } from './piObserver'
import { createRoutePlanningExtension } from '../extensions/routePlanningExtension'

/**
 * Creates a configured pi AgentSession for route planning.
 *
 * This factory:
 * - Validates OPENAI_API_KEY is configured
 * - Creates event observer for logging
 * - Initializes route planning extension with tools
 * - Returns AgentSession ready for prompting
 *
 * @throws {Error} If OPENAI_API_KEY is not configured
 */
export const createAgentSession = async (ctx: ActionCtx) => {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required for route planning')
  }

  const observer = createPiObserver(ctx)
  const extension = createRoutePlanningExtension(ctx)

  // Import pi SDK dynamically to avoid module resolution issues
  const { Agent } = await import('@mariozechner/pi-agent-core')
  const { getModel } = await import('@mariozechner/pi-ai')

  const agent = new Agent({
    getApiKey: async (provider: string) => {
      if (provider === 'openai') {
        return OPENAI_API_KEY
      }
      return undefined
    },
  })

  // Subscribe observer to agent events
  agent.subscribe(observer)

  // Set model
  const model = getModel('openai', PI_MODEL as any)
  agent.setModel(model)

  // Set system prompt from extension
  agent.setSystemPrompt(extension.systemPrompt)

  // Set tools from extension
  agent.setTools(extension.tools)

  return agent
}
