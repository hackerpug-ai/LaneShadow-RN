'use node'

import { readFileSync } from 'fs'
import { join } from 'path'
import { describe, expect, it } from 'vitest'

/**
 * Provider Migration Tests (AI-002 + AI-003)
 *
 * These tests verify that:
 * 1. AI_PROVIDER and AI_MODEL are no longer exported from env.ts
 * 2. All agent call sites use getAgentModel() from models.ts
 * 3. No hardcoded provider/model strings remain in agent code
 */

describe('Provider Migration (AI-002+AI-003)', () => {
  describe('AC-1: Env exports removed', () => {
    it('should not export AI_PROVIDER from env.ts', () => {
      const envPath = join(__dirname, '../../../lib/env.ts')
      const envContent = readFileSync(envPath, 'utf-8')

      // Should not export AI_PROVIDER
      expect(envContent).not.toContain('export const AI_PROVIDER')
      // Should have comment pointing to models.ts
      expect(envContent).toContain('models.ts')
    })

    it('should not export AI_MODEL from env.ts', () => {
      const envPath = join(__dirname, '../../../lib/env.ts')
      const envContent = readFileSync(envPath, 'utf-8')

      expect(envContent).not.toContain('export const AI_MODEL')
    })

    it('should document CEREBRAS_API_KEY in .env.example', () => {
      const envExamplePath = join(process.cwd(), '.env.example')
      const envExampleContent = readFileSync(envExamplePath, 'utf-8')

      expect(envExampleContent).toContain('CEREBRAS_API_KEY')
    })
  })

  describe('AC-2: High-reasoning agents use getAgentModel(high)', () => {
    it('should use getAgentModel in orchestrator.ts', () => {
      const orchestratorPath = join(__dirname, '../agents/orchestrator.ts')
      const orchestratorContent = readFileSync(orchestratorPath, 'utf-8')

      // Should import getAgentModel
      expect(orchestratorContent).toContain("from '../lib/models'")
      expect(orchestratorContent).toContain('getAgentModel')

      // Should not use getModel with hardcoded provider
      expect(orchestratorContent).not.toContain("getModel('anthropic'")
      expect(orchestratorContent).not.toContain('claude-sonnet-4-6')

      // Should use getAgentModel('high')
      expect(orchestratorContent).toContain("getAgentModel('high')")
    })

    it('should use getAgentModel in generateTripPlan.ts', () => {
      const generateTripPlanPath = join(__dirname, '../generateTripPlan.ts')
      const generateTripPlanContent = readFileSync(generateTripPlanPath, 'utf-8')

      // Should import getAgentModel
      expect(generateTripPlanContent).toContain('getAgentModel')
      expect(generateTripPlanContent).toMatch(/from ['"]\.\/lib\/models['"]/)

      // Should not use getModel with hardcoded provider
      expect(generateTripPlanContent).not.toContain("getModel('anthropic'")
      expect(generateTripPlanContent).not.toContain('claude-sonnet-4-6')

      // Should use getAgentModel('high')
      expect(generateTripPlanContent).toContain("getAgentModel('high')")
    })
  })

  describe('AC-3: Low-reasoning agents use getAgentModel(low)', () => {
    it('should use getAgentModel in routingAgent.ts', () => {
      const routingAgentPath = join(__dirname, '../agents/routingAgent.ts')
      const routingAgentContent = readFileSync(routingAgentPath, 'utf-8')

      // Should import getAgentModel
      expect(routingAgentContent).toContain("from '../lib/models'")
      expect(routingAgentContent).toContain('getAgentModel')

      // Should not use getModel with hardcoded provider
      expect(routingAgentContent).not.toContain("getModel('anthropic'")
      expect(routingAgentContent).not.toContain('claude-haiku')

      // Should use getAgentModel('low')
      expect(routingAgentContent).toContain("getAgentModel('low')")
    })

    it('should use getAgentModel in searchAgent.ts', () => {
      const searchAgentPath = join(__dirname, '../agents/searchAgent.ts')
      const searchAgentContent = readFileSync(searchAgentPath, 'utf-8')

      // Should import getAgentModel
      expect(searchAgentContent).toContain("from '../lib/models'")
      expect(searchAgentContent).toContain('getAgentModel')

      // Should not use getModel with hardcoded provider
      expect(searchAgentContent).not.toContain("getModel('anthropic'")
      expect(searchAgentContent).not.toContain('claude-haiku')

      // Should use getAgentModel('low')
      expect(searchAgentContent).toContain("getAgentModel('low')")
    })

    it('should use getAgentModel in enrichmentAgent.ts', () => {
      const enrichmentAgentPath = join(__dirname, '../agents/enrichmentAgent.ts')
      const enrichmentAgentContent = readFileSync(enrichmentAgentPath, 'utf-8')

      // Should import getAgentModel
      expect(enrichmentAgentContent).toContain("from '../lib/models'")
      expect(enrichmentAgentContent).toContain('getAgentModel')

      // Should not use getModel with hardcoded provider
      expect(enrichmentAgentContent).not.toContain("getModel('anthropic'")
      expect(enrichmentAgentContent).not.toContain('claude-haiku')

      // Should use getAgentModel('low')
      expect(enrichmentAgentContent).toContain("getAgentModel('low')")
    })

    it('should use getAgentModel in enrichRoute.ts', () => {
      const enrichRoutePath = join(__dirname, '../tools/enrichRoute.ts')
      const enrichRouteContent = readFileSync(enrichRoutePath, 'utf-8')

      // Should import getAgentModel
      expect(enrichRouteContent).toContain("from '../lib/models'")
      expect(enrichRouteContent).toContain('getAgentModel')

      // Should not use getModel with hardcoded provider
      expect(enrichRouteContent).not.toContain("getModel('openai'")

      // Should use getAgentModel('low')
      expect(enrichRouteContent).toContain("getAgentModel('low')")
    })
  })

  describe('AC-4: sendMessage uses getAgentModelInfo for metadata', () => {
    it('should use getAgentModelInfo in sendMessage.ts', () => {
      const sendMessagePath = join(__dirname, '../sendMessage.ts')
      const sendMessageContent = readFileSync(sendMessagePath, 'utf-8')

      // Should import getAgentModelInfo
      expect(sendMessageContent).toContain('getAgentModelInfo')
      expect(sendMessageContent).toMatch(/from ['"]\.\/lib\/models['"]/)

      // Should use getAgentModelInfo for metadata
      expect(sendMessageContent).toContain('getAgentModelInfo')
    })
  })

  describe('AC-5: No hardcoded provider strings remain', () => {
    it('should not have hardcoded claude model names in agents', () => {
      const agentFiles = [
        'agents/orchestrator.ts',
        'agents/routingAgent.ts',
        'agents/searchAgent.ts',
        'agents/enrichmentAgent.ts',
        'generateTripPlan.ts',
        'tools/enrichRoute.ts',
        'sendMessage.ts',
      ]

      for (const file of agentFiles) {
        const filePath = join(__dirname, '..', file)
        const content = readFileSync(filePath, 'utf-8')

        // Should not have hardcoded claude model names
        expect(content).not.toMatch(/claude-(sonnet|haiku|opus)/)
        // Should not have getModel with anthropic/openai provider strings
        expect(content).not.toMatch(/getModel\('(anthropic|openai)/)
      }
    })
  })
})
