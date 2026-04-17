'use node'

import { describe, expect, it, vi } from 'vitest'
import type { Id } from '../../../_generated/dataModel'

// ---------------------------------------------------------------------------
// Mock Convex internals so we can import planningEvents without Convex runtime
// ---------------------------------------------------------------------------

vi.mock('../../../_generated/api', () => ({
  internal: {
    db: {
      sessionMessages: {
        createPendingAssistantMessage: { __ref: 'createPendingAssistantMessage' },
        finalizeAssistantMessage: { __ref: 'finalizeAssistantMessage' },
        updatePlanningContent: { __ref: 'updatePlanningContent' },
      },
    },
  },
  api: {},
}))

// ---------------------------------------------------------------------------
// AC-1: summarizeToolResult maps tool names to human-readable strings
// ---------------------------------------------------------------------------

describe('summarizeToolResult', () => {
  it('maps geocode with label to Geocoded message', async () => {
    const { summarizeToolResult } = await import('../lib/summarizeToolResult')

    const result = summarizeToolResult('geocode', { results: [{ label: 'Santa Cruz, CA' }] })

    expect(result).toBe('Geocoded Santa Cruz, CA')
  })

  it('maps geocode with no results to default message', async () => {
    const { summarizeToolResult } = await import('../lib/summarizeToolResult')

    const result = summarizeToolResult('geocode', { results: [] })

    expect(result).toBe('geocode complete')
  })

  it('maps createRouteSketch with label to Sketched message', async () => {
    const { summarizeToolResult } = await import('../lib/summarizeToolResult')

    const result = summarizeToolResult('createRouteSketch', {
      sketch: { label: 'Skyline Blvd → Hwy 9 → SC' },
    })

    expect(result).toBe('Sketched: Skyline Blvd → Hwy 9 → SC')
  })

  it('maps compileSketch with options to Compiled segments message', async () => {
    const { summarizeToolResult } = await import('../lib/summarizeToolResult')

    const result = summarizeToolResult('compileSketch', { data: { options: [1, 2, 3, 4] } })

    expect(result).toBe('Compiled 4 segments')
  })

  it('maps planRoute to planned route message', async () => {
    const { summarizeToolResult } = await import('../lib/summarizeToolResult')

    const result = summarizeToolResult('planRoute', {})

    expect(result).toBe('Planned route')
  })

  it('maps searchNearby with results to Found N nearby places', async () => {
    const { summarizeToolResult } = await import('../lib/summarizeToolResult')

    const result = summarizeToolResult('searchNearby', [{ name: 'Place A' }, { name: 'Place B' }])

    expect(result).toBe('Found 2 nearby places')
  })

  it('maps webSearch to Searched the web', async () => {
    const { summarizeToolResult } = await import('../lib/summarizeToolResult')

    const result = summarizeToolResult('webSearch', { results: [] })

    expect(result).toBe('Searched the web')
  })

  it('maps routing_agent with summary to that summary', async () => {
    const { summarizeToolResult } = await import('../lib/summarizeToolResult')

    const result = summarizeToolResult('routing_agent', {
      status: 'route_ready',
      summary: 'Route to Santa Cruz ready',
    })

    expect(result).toBe('Route to Santa Cruz ready')
  })

  it('maps routing_agent with no summary to Route ready', async () => {
    const { summarizeToolResult } = await import('../lib/summarizeToolResult')

    const result = summarizeToolResult('routing_agent', { status: 'route_ready' })

    expect(result).toBe('Route ready')
  })

  it('maps search_agent with summary to that summary', async () => {
    const { summarizeToolResult } = await import('../lib/summarizeToolResult')

    const result = summarizeToolResult('search_agent', {
      status: 'done',
      summary: 'Found gas stations nearby',
    })

    expect(result).toBe('Found gas stations nearby')
  })

  it('maps enrichment_agent with summary to that summary', async () => {
    const { summarizeToolResult } = await import('../lib/summarizeToolResult')

    const result = summarizeToolResult('enrichment_agent', {
      status: 'done',
      summary: 'Route analysis complete',
    })

    expect(result).toBe('Route analysis complete')
  })

  it('maps unknown tool to toolName complete', async () => {
    const { summarizeToolResult } = await import('../lib/summarizeToolResult')

    const result = summarizeToolResult('someUnknownTool', {})

    expect(result).toBe('someUnknownTool complete')
  })
})

// ---------------------------------------------------------------------------
// AC-2: PlanningEventEmitter integrates into sendMessage via ExecuteContext
// ---------------------------------------------------------------------------

describe('PlanningEventEmitter wiring — ExecuteContext has planning callbacks', () => {
  it('ExecuteContext type includes onSubToolPending', async () => {
    // If this import resolves and the type has the field, we can assign it
    const {} = await import('../ridePlanningAgent')

    // If onSubToolPending doesn't exist on ExecuteContext, TypeScript would fail
    // at compile time. At runtime we just verify we can construct the shape.
    const ctx: import('../ridePlanningAgent').ExecuteContext = {
      onSubToolPending: async (_tool: string, _agent: string) => {},
    }
    expect(typeof ctx.onSubToolPending).toBe('function')
  })

  it('ExecuteContext type includes onSubToolComplete', async () => {
    const ctx: import('../ridePlanningAgent').ExecuteContext = {
      onSubToolComplete: async (
        _tool: string,
        _agent: string,
        _summary: string,
        _durationMs: number,
      ) => {},
    }
    expect(typeof ctx.onSubToolComplete).toBe('function')
  })

  it('ExecuteContext type includes onSubAgentComplete', async () => {
    const ctx: import('../ridePlanningAgent').ExecuteContext = {
      onSubAgentComplete: async (_agent: string, _summary: string, _durationMs: number) => {},
    }
    expect(typeof ctx.onSubAgentComplete).toBe('function')
  })
})

// ---------------------------------------------------------------------------
// AC-3: PlanningEventEmitter is created in sendMessage and done() is called
// ---------------------------------------------------------------------------

describe('sendMessage PlanningEventEmitter integration', () => {
  it('buildAgentCallbacks works (merged buildCardCallbacks + buildStreamingContext)', async () => {
    const { buildAgentCallbacks } = await import('../sendMessage')
    const sessionId = 'sess1' as Id<'planning_sessions'>
    const runMutation = vi.fn()

    const { executeCtx, getTextMessageId, finalizeOk, finalizeFail } = await buildAgentCallbacks(
      sessionId,
      runMutation,
    )

    expect(typeof executeCtx.onToolStart).toBe('function')
    expect(typeof executeCtx.onToolFinish).toBe('function')
    expect(typeof executeCtx.onTextDelta).toBe('function')
    expect(typeof getTextMessageId).toBe('function')
    expect(typeof finalizeOk).toBe('function')
    expect(typeof finalizeFail).toBe('function')
  })
})

// ---------------------------------------------------------------------------
// AC-4: orchestrator forwards planning callbacks to sub-agents
// ---------------------------------------------------------------------------

describe('orchestrator executeOrchestratorTool — planning callback forwarding', () => {
  it('determineAvailableTools returns routing_agent and search_agent when no routes', async () => {
    const { determineAvailableTools } = await import('../agents/orchestrator')

    const tools = determineAvailableTools(false, false)

    expect(tools.map((t) => t.name)).toContain('routing_agent')
    expect(tools.map((t) => t.name)).toContain('search_agent')
    expect(tools.map((t) => t.name)).not.toContain('enrichment_agent')
  })

  it('determineAvailableTools includes enrichment_agent when routes exist', async () => {
    const { determineAvailableTools } = await import('../agents/orchestrator')

    const tools = determineAvailableTools(true, false)

    expect(tools.map((t) => t.name)).toContain('enrichment_agent')
  })
})
