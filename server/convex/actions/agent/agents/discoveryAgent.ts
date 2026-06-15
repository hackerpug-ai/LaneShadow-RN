import { v } from 'convex/values'
import { Tool } from '../types'
import { discoverCuratedRoutesSchema, executeDiscoverCuratedRoutes } from '../tools/discoverCuratedRoutes'

export const discoveryAgentTools = [
  discoverCuratedRoutesSchema,
]

export function getDiscoveryAgentTools(): Tool[] {
  return discoveryAgentTools as Tool[]
}

export async function executeDiscoveryAgentTool(
  ctx: any,
  call: any,
  executeCtx?: any,
): Promise<unknown> {
  return executeDiscoverCuratedRoutes(ctx, call, executeCtx)
}

export async function executeDiscoveryAgent(
  ctx: any,
  executeCtx: any,
  budgetTracker: any,
  userMessage: string,
): Promise<unknown> {
  return runAgent({
    ctx,
    executeCtx,
    budgetTracker,
    agentType: 'discovery',
    userMessage,
    tools: discoveryAgentTools,
    executeTool: executeDiscoveryAgentTool,
  })
}

export const discoveryAgent = {
  name: 'discovery_agent',
  description:
    'Specialist for discovering curated motorcycle routes based on rider preferences and location. Call when the rider wants to explore routes matching specific archetypes or in certain areas.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: "The rider's discovery request, including location and route preferences.",
      },
    },
    required: ['query'],
  } as any,
}

export const discoveryAgentTool: Tool = {
  name: 'discovery_agent',
  description:
    'Specialist for discovering curated motorcycle routes based on rider preferences and location. Call when the rider wants to explore routes matching specific archetypes or in certain areas.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: "The rider's discovery request, including location and route preferences.",
      },
    },
    required: ['query'],
  } as any,
}