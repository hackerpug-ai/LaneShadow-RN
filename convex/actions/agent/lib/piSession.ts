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
  const { createSession } = await import('@mariozechner/pi-agent-core')

  const session = createSession({
    model: `openai:${PI_MODEL}`,
    apiKey: OPENAI_API_KEY,
    temperature: PI_TEMPERATURE,
    observer,
    extensions: [extension],
  })

  return session
}
