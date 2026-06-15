'use node'

import { type Tool } from '@mariozechner/pi-ai'

export const discoveryAgentTools = [
  {
    name: 'discoverCuratedRoutes',
    description: 'Find curated motorcycle routes based on archetypes, location, and preferences',
    parameters: {
      type: 'object',
      properties: {
        intent: {
          type: 'object',
          properties: {
            archetypes: { type: 'array', items: { type: 'string' } },
            state: { type: 'string' },
            center: { type: 'object', properties: { lat: { type: 'number' }, lng: { type: 'number' } }, required: ['lat', 'lng'] },
            sort: { enum: ['best', 'nearest'] },
            limit: { type: 'number' }
          }
        }
      },
      required: ['intent']
    }
  }
]

export function getDiscoveryAgentTools(): Tool[] {
  return discoveryAgentTools as Tool[]
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