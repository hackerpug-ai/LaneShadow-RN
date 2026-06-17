import { describe, expect, it, vi } from 'vitest'

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
}))

describe('PlanningEventEmitter monotone phase writes', () => {
  it('keeps drafting phase for stale searching tool events after drafting', async () => {
    const { PlanningEventEmitter } = await import('../planningEvents.js')
    const sessionId = 'sess1' as never
    const messageId = 'msg1' as never
    const runMutation = vi.fn(async (fn: unknown, args: Record<string, unknown>) => {
      if (
        (fn as { __ref?: string }).__ref === 'createPendingAssistantMessage' ||
        args.kind === 'planning'
      ) {
        return { messageId }
      }
      return null
    })

    const emitter = new PlanningEventEmitter({ runMutation, sessionId })

    await emitter.toolPending('createRouteSketch', 'routing')
    await emitter.toolPending('geocode', 'routing')

    const updateCalls = runMutation.mock.calls.filter(
      ([fn, args]) =>
        (fn as { __ref?: string }).__ref === 'updatePlanningContent' ||
        (args as Record<string, unknown>).content !== undefined,
    )

    expect(updateCalls.map(([, args]) => (args as { phase?: string }).phase)).toEqual([
      'drafting',
      'drafting',
    ])
  })
})
