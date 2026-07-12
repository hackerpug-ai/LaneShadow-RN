import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Agent } from '@mastra/core/agent'
import { describe, expect, it } from 'vitest'
import { ANTHROPIC_API_KEY } from '../../../../lib/env'
import { getAgentModel, getAgentModelInfo, getOrchestratorModel } from '../models'

const packageJsonPath = resolve(__dirname, '../../../../../package.json')
const convexJsonPath = resolve(__dirname, '../../../../../convex.json')

type PackageJson = {
  dependencies: Record<string, string>
}

type ConvexJson = {
  node: {
    nodeVersion: string
    externalPackages: string[]
  }
}

const readPackageJson = (): PackageJson =>
  JSON.parse(readFileSync(packageJsonPath, 'utf8')) as PackageJson

const readConvexJson = (): ConvexJson =>
  JSON.parse(readFileSync(convexJsonPath, 'utf8')) as ConvexJson

const hasAnthropicKey = Boolean(ANTHROPIC_API_KEY)

describe('models orchestrator tier (S2-T1 Mastra spike)', () => {
  it('package.json lists @mastra/core and @ai-sdk/openai-compatible while preserving ai@7 and @ai-sdk/anthropic', () => {
    const { dependencies } = readPackageJson()

    expect(typeof dependencies['@mastra/core']).toBe('string')
    expect(dependencies['@mastra/core'].length).toBeGreaterThan(0)
    expect(typeof dependencies['@ai-sdk/openai-compatible']).toBe('string')
    expect(dependencies['@ai-sdk/openai-compatible'].length).toBeGreaterThan(0)
    expect(dependencies.ai).toMatch(/^\^?7\./)
    expect(dependencies['@ai-sdk/anthropic']).toMatch(/^\^?4\./)

    // EVIDENCE: seeded MUST_OBSERVE values for scenario validation
    // biome-ignore lint/suspicious/noConsole: required stdout evidence artifact for AC-1 scenario
    console.log(
      JSON.stringify({
        ac: 'AC-1',
        mastraCore: dependencies['@mastra/core'],
        aiSdkOpenaiCompatible: dependencies['@ai-sdk/openai-compatible'],
        ai: dependencies.ai,
        aiSdkAnthropic: dependencies['@ai-sdk/anthropic'],
      }),
    )
  })

  it('convex.json preserves nodeVersion 22 and adds @mastra/core + @ai-sdk/openai-compatible to externalPackages without removing existing entries', () => {
    const { node } = readConvexJson()

    expect(node.nodeVersion).toBe('22')
    expect(node.externalPackages).toContain('@mastra/core')
    expect(node.externalPackages).toContain('@ai-sdk/openai-compatible')
    expect(node.externalPackages).toContain('ai')
    expect(node.externalPackages).toContain('@ai-sdk/anthropic')
    expect(node.externalPackages).toContain('@mariozechner/pi-ai')

    // EVIDENCE: seeded MUST_OBSERVE values for scenario validation
    // biome-ignore lint/suspicious/noConsole: required stdout evidence artifact for AC-2 scenario
    console.log(
      JSON.stringify({
        ac: 'AC-2',
        nodeVersion: node.nodeVersion,
        externalPackages: node.externalPackages,
      }),
    )
  })

  it('getOrchestratorModel returns the pinned Mastra router string without touching the existing pi-ai tiers', () => {
    const orchestratorModel = getOrchestratorModel()

    expect(typeof orchestratorModel).toBe('string')
    expect(orchestratorModel).toBe('anthropic/claude-sonnet-4-6')
    expect(orchestratorModel.length).toBeGreaterThan(0)

    // Regression guard: this task must not have touched the existing pi-ai tiers.
    const highInfo = getAgentModelInfo('high')
    expect(highInfo.model).toBe('gpt-4.1')
    const lowInfo = getAgentModelInfo('low')
    expect(lowInfo.model).toBe('gpt-4o-mini')
    expect(() => getAgentModel('high')).not.toThrow()

    // EVIDENCE: seeded MUST_OBSERVE values for scenario validation
    // biome-ignore lint/suspicious/noConsole: required stdout evidence artifact for AC-3 scenario
    console.log(
      JSON.stringify({
        ac: 'AC-3',
        orchestratorModel,
        highModel: highInfo.model,
        lowModel: lowInfo.model,
      }),
    )
  })

  describe('resolves the orchestrator tier through a real @mastra/core Agent against real Anthropic', () => {
    if (!hasAnthropicKey) {
      it.skip('SKIP: ANTHROPIC_API_KEY is absent — integration test requires real Anthropic API', () => {})
      return
    }

    it('returns non-empty result.text containing banana from a real .generate() call', async () => {
      const agent = new Agent({
        id: 'orchestrator-spike-probe',
        name: 'Orchestrator Spike Probe',
        instructions: 'Answer concisely.',
        model: getOrchestratorModel(),
      })

      const result = await agent.generate('Reply with exactly the single word: banana.')

      expect(typeof result.text).toBe('string')
      expect(result.text.length).toBeGreaterThanOrEqual(1)
      expect(result.text.toLowerCase()).toContain('banana')

      // EVIDENCE: seeded MUST_OBSERVE values for scenario validation
      // biome-ignore lint/suspicious/noConsole: required stdout evidence artifact for AC-4 scenario
      console.log(
        JSON.stringify({
          ac: 'AC-4',
          resolvedVia: 'router-string',
          model: getOrchestratorModel(),
          textLength: result.text.length,
          containsBanana: result.text.toLowerCase().includes('banana'),
        }),
      )
    }, 120_000)
  })
})
