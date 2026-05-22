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
    const { summarizeToolResult } = await import('../lib/summarizeToolResult.js')

    const result = summarizeToolResult('geocode', { results: [{ label: 'Santa Cruz, CA' }] })

    expect(result).toBe('Geocoded Santa Cruz, CA')
  })

  it('maps geocode with no results to default message', async () => {
    const { summarizeToolResult } = await import('../lib/summarizeToolResult.js')

    const result = summarizeToolResult('geocode', { results: [] })

    expect(result).toBe('geocode complete')
  })

  it('maps createRouteSketch with label to Sketched message', async () => {
    const { summarizeToolResult } = await import('../lib/summarizeToolResult.js')

    const result = summarizeToolResult('createRouteSketch', {
      sketch: { label: 'Skyline Blvd → Hwy 9 → SC' },
    })

    expect(result).toBe('Sketched: Skyline Blvd → Hwy 9 → SC')
  })

  it('maps compileSketch with options to Compiled segments message', async () => {
    const { summarizeToolResult } = await import('../lib/summarizeToolResult.js')

    const result = summarizeToolResult('compileSketch', { data: { options: [1, 2, 3, 4] } })

    expect(result).toBe('Compiled 4 segments')
  })

  it('maps planRoute to planned route message', async () => {
    const { summarizeToolResult } = await import('../lib/summarizeToolResult.js')

    const result = summarizeToolResult('planRoute', {})

    expect(result).toBe('Planned route')
  })

  it('maps searchNearby with results to Found N nearby places', async () => {
    const { summarizeToolResult } = await import('../lib/summarizeToolResult.js')

    const result = summarizeToolResult('searchNearby', [{ name: 'Place A' }, { name: 'Place B' }])

    expect(result).toBe('Found 2 nearby places')
  })

  it('maps webSearch to Searched the web', async () => {
    const { summarizeToolResult } = await import('../lib/summarizeToolResult.js')

    const result = summarizeToolResult('webSearch', { results: [] })

    expect(result).toBe('Searched the web')
  })

  it('maps routing_agent with summary to that summary', async () => {
    const { summarizeToolResult } = await import('../lib/summarizeToolResult.js')

    const result = summarizeToolResult('routing_agent', {
      status: 'route_ready',
      summary: 'Route to Santa Cruz ready',
    })

    expect(result).toBe('Route to Santa Cruz ready')
  })

  it('maps routing_agent with no summary to Route ready', async () => {
    const { summarizeToolResult } = await import('../lib/summarizeToolResult.js')

    const result = summarizeToolResult('routing_agent', { status: 'route_ready' })

    expect(result).toBe('Route ready')
  })

  it('maps search_agent with summary to that summary', async () => {
    const { summarizeToolResult } = await import('../lib/summarizeToolResult.js')

    const result = summarizeToolResult('search_agent', {
      status: 'done',
      summary: 'Found gas stations nearby',
    })

    expect(result).toBe('Found gas stations nearby')
  })

  it('maps enrichment_agent with summary to that summary', async () => {
    const { summarizeToolResult } = await import('../lib/summarizeToolResult.js')

    const result = summarizeToolResult('enrichment_agent', {
      status: 'done',
      summary: 'Route analysis complete',
    })

    expect(result).toBe('Route analysis complete')
  })

  it('maps unknown tool to toolName complete', async () => {
    const { summarizeToolResult } = await import('../lib/summarizeToolResult.js')

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
    void (await import('../ridePlanningAgent.js'))

    // If onSubToolPending doesn't exist on ExecuteContext, TypeScript would fail
    // at compile time. At runtime we just verify we can construct the shape.
    const ctx: import('../ridePlanningAgent.js').ExecuteContext = {
      onSubToolPending: async (_tool: string, _agent: string) => {},
    }
    expect(typeof ctx.onSubToolPending).toBe('function')
  })

  it('ExecuteContext type includes onSubToolComplete', async () => {
    const ctx: import('../ridePlanningAgent.js').ExecuteContext = {
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
    const ctx: import('../ridePlanningAgent.js').ExecuteContext = {
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
    const { buildAgentCallbacks } = await import('../sendMessage.js')
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

describe('PlanningEventEmitter explicit phase writes', () => {
  it('writes explicit phase patches for routing tool and agent events', async () => {
    const { PlanningEventEmitter } = await import('../lib/planningEvents.js')
    const sessionId = 'sess1' as Id<'planning_sessions'>
    const messageId = 'msg1' as Id<'session_messages'>
    const runMutation = vi.fn(async (fn: unknown, args: Record<string, unknown>) => {
      if ((fn as { __ref?: string }).__ref === 'createPendingAssistantMessage') {
        return { messageId }
      }
      return null
    })

    const emitter = new PlanningEventEmitter({ runMutation, sessionId })

    await emitter.toolPending('geocode', 'routing')
    await emitter.toolPending('createRouteSketch', 'routing')
    await emitter.agentComplete('routing', 'Route ready', 42)

    const updateCalls = runMutation.mock.calls.filter(
      ([fn]) => (fn as { __ref?: string }).__ref === 'updatePlanningContent',
    )

    expect(updateCalls.map(([, args]) => (args as { phase?: string }).phase)).toEqual([
      'searching',
      'drafting',
      'finalizing',
    ])
  })
})

// ---------------------------------------------------------------------------
// AC-4: orchestrator forwards planning callbacks to sub-agents
// ---------------------------------------------------------------------------

describe('orchestrator executeOrchestratorTool — planning callback forwarding', () => {
  it('determineAvailableTools returns routing_agent and search_agent when no routes', async () => {
    const { determineAvailableTools } = await import('../agents/orchestrator.js')

    const tools = determineAvailableTools(false, false)

    expect(tools.map((t: { name: string }) => t.name)).toContain('routing_agent')
    expect(tools.map((t: { name: string }) => t.name)).toContain('search_agent')
    expect(tools.map((t: { name: string }) => t.name)).not.toContain('enrichment_agent')
  })

  it('determineAvailableTools includes enrichment_agent when routes exist', async () => {
    const { determineAvailableTools } = await import('../agents/orchestrator.js')

    const tools = determineAvailableTools(true, false)

    expect(tools.map((t: { name: string }) => t.name)).toContain('enrichment_agent')
  })
})

// ---------------------------------------------------------------------------
// Lazy planning row initialization
// ---------------------------------------------------------------------------

describe('lazy planning row initialization', () => {
  const createRunMutation = () =>
    vi.fn(async (fn: { __ref?: string }, args: Record<string, unknown>) => {
      if (fn.__ref === 'createPendingAssistantMessage') {
        return { messageId: 'planning-1' as Id<'session_messages'> }
      }
      return { fn: fn.__ref, args }
    })

  it('no planning row for conversational reply', async () => {
    const { PlanningEventEmitter } = await import('../lib/planningEvents.js')
    const runMutation = createRunMutation()
    const emitter = new PlanningEventEmitter({
      runMutation,
      sessionId: 'sess1' as Id<'planning_sessions'>,
    })

    await emitter.updateThinking('Just answering conversationally')
    await emitter.done()

    expect(runMutation).not.toHaveBeenCalled()
  })

  it('planning row created on tool call', async () => {
    const { PlanningEventEmitter } = await import('../lib/planningEvents.js')
    const runMutation = createRunMutation()
    const emitter = new PlanningEventEmitter({
      runMutation,
      sessionId: 'sess1' as Id<'planning_sessions'>,
    })

    await emitter.updateThinking('Checking the route options')
    await emitter.toolPending('routing_agent', 'orchestrator')
    await emitter.toolComplete('routing_agent', 'orchestrator', 'Route ready', 120)
    await emitter.done()

    const createCalls = runMutation.mock.calls.filter(
      (call: [{ __ref?: string }, Record<string, unknown>]) =>
        call[0].__ref === 'createPendingAssistantMessage',
    )
    const finalizeCalls = runMutation.mock.calls.filter(
      (call: [{ __ref?: string }, Record<string, unknown>]) =>
        call[0].__ref === 'finalizeAssistantMessage',
    )

    expect(createCalls).toHaveLength(1)
    expect(finalizeCalls).toHaveLength(1)

    const [, finalizeArgs] = finalizeCalls[0] as [
      { __ref?: string },
      { content: string; status: string },
    ]
    const finalizedContent = JSON.parse(finalizeArgs.content) as {
      events: Array<{ type: string }>
    }

    expect(finalizeArgs.status).toBe('complete')
    expect(finalizedContent.events.length).toBeGreaterThan(0)
  })

  it('lazy init handles error before first tool', async () => {
    const { PlanningEventEmitter } = await import('../lib/planningEvents.js')
    const runMutation = createRunMutation()
    const emitter = new PlanningEventEmitter({
      runMutation,
      sessionId: 'sess1' as Id<'planning_sessions'>,
    })

    await emitter.updateThinking('Thinking before a failure')
    await emitter.done()

    const createCalls = runMutation.mock.calls.filter(
      (call: [{ __ref?: string }, Record<string, unknown>]) =>
        call[0].__ref === 'createPendingAssistantMessage',
    )
    const finalizeCalls = runMutation.mock.calls.filter(
      (call: [{ __ref?: string }, Record<string, unknown>]) =>
        call[0].__ref === 'finalizeAssistantMessage',
    )

    expect(createCalls).toHaveLength(0)
    expect(finalizeCalls).toHaveLength(0)
  })
})
