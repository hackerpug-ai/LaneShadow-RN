/**
 * S2-T4 deployed-action observability seam tests.
 *
 * These tests do not replace the real LangSmith integration suite. They cover
 * the Convex action boundary deterministically: the deployed handler must use
 * the observed Mastra path, inject ctx.runQuery, derive a stable trace ID per
 * session, and await telemetry flushing before returning (or rethrowing).
 */
// @vitest-environment node

import { describe, expect, it, vi } from 'vitest'
import type { ActionCtx } from '../../../../_generated/server'
import type { SpikeTurnOutput } from '../rideAgentSpike'
import {
  createRunSpikeTurnActionHandler,
  type FlushableSpikeObservabilityBundle,
  flushSpikeObservability,
  type SpikeActionDependencies,
  stableSpikeTraceId,
} from '../rideAgentSpikeAction'

function makeBundle(events: string[]): FlushableSpikeObservabilityBundle {
  return {
    observability: {
      flush: async () => {
        events.push('observability.flush')
      },
      shutdown: async () => {
        events.push('observability.shutdown')
      },
    },
    otlpExporter: {
      flush: async () => {
        events.push('otlp.flush')
      },
    },
  }
}

function makeOutput(sessionId: string): SpikeTurnOutput {
  return {
    result: { text: `reply for ${sessionId}` },
    workingMemory: { sessionId },
    tripwireHandled: false,
  } as unknown as SpikeTurnOutput
}

function makeCtx(runQuery: ReturnType<typeof vi.fn>): ActionCtx {
  return { runQuery } as unknown as ActionCtx
}

describe('S2-T4 deployed spike action observability seam', () => {
  it('derives a stable 32-hex trace ID without retaining per-session state', () => {
    const first = stableSpikeTraceId('session-alpha')
    const second = stableSpikeTraceId('session-alpha')

    expect(first).toBe(second)
    expect(first).toMatch(/^[0-9a-f]{32}$/)
    expect(stableSpikeTraceId('session-beta')).not.toBe(first)
  })

  it('uses runObservedSpikeTurn, threads ctx.runQuery, and flushes before returning', async () => {
    const events: string[] = []
    const observedInputs: Parameters<SpikeActionDependencies['runObservedTurn']>[0][] = []
    const runQuery = vi.fn(async () => [])
    const bundle = makeBundle(events)

    const runObservedTurn: SpikeActionDependencies['runObservedTurn'] = async (input) => {
      events.push('observed.turn')
      observedInputs.push(input)
      const rows = await input.queryNearestCuratedRoutes?.({
        center: { lat: 41.223, lng: -112.011 },
        limit: 3,
      })
      expect(rows).toEqual([])
      return makeOutput(input.sessionId)
    }

    const handler = createRunSpikeTurnActionHandler({
      createObservability: () => bundle,
      runObservedTurn,
      flushObservability: async () => {
        events.push('telemetry.flush')
      },
    })

    const result = await handler(makeCtx(runQuery), {
      sessionId: 'session-alpha',
      userMessage: 'twisty roads near Ogden',
    })

    expect(result).toEqual({
      text: 'reply for session-alpha',
      workingMemory: { sessionId: 'session-alpha' },
      tripwireHandled: false,
    })
    expect(observedInputs).toHaveLength(1)
    expect(observedInputs[0].observability).toBe(bundle.observability)
    expect(observedInputs[0].traceId).toBe(stableSpikeTraceId('session-alpha'))
    expect(observedInputs[0].promptVersion).toBe('spike-observability-v1')
    expect(observedInputs[0].tier).toBe('orchestrator')
    expect(runQuery).toHaveBeenCalledOnce()
    expect(runQuery.mock.calls[0]?.[1]).toMatchObject({
      center: { lat: 41.223, lng: -112.011 },
      sort: 'nearest',
      limit: 3,
    })
    expect(events).toEqual(['observed.turn', 'telemetry.flush'])
  })

  it('flushes observability, the real OTLP exporter, then shuts down in order', async () => {
    const events: string[] = []
    await flushSpikeObservability(makeBundle(events))

    expect(events).toEqual(['observability.flush', 'otlp.flush', 'observability.shutdown'])
  })

  it('flushes even when the observed turn fails, preserving the original failure', async () => {
    const events: string[] = []
    const expected = new Error('model unavailable')
    const handler = createRunSpikeTurnActionHandler({
      createObservability: () => makeBundle(events),
      runObservedTurn: async () => {
        events.push('observed.turn')
        throw expected
      },
      flushObservability: async () => {
        events.push('telemetry.flush')
      },
    })

    await expect(
      handler(makeCtx(vi.fn(async () => [])), {
        sessionId: 'session-failure',
        userMessage: 'twisty roads near Ogden',
      }),
    ).rejects.toBe(expected)
    expect(events).toEqual(['observed.turn', 'telemetry.flush'])
  })

  it('preserves a primary turn failure when telemetry flush also fails', async () => {
    const primaryError = new Error('model unavailable')
    const flushError = new Error('LangSmith unavailable')
    const handler = createRunSpikeTurnActionHandler({
      createObservability: () => makeBundle([]),
      runObservedTurn: async () => {
        throw primaryError
      },
      flushObservability: async () => {
        throw flushError
      },
    })

    await expect(
      handler(makeCtx(vi.fn(async () => [])), {
        sessionId: 'session-primary-failure',
        userMessage: 'twisty roads near Ogden',
      }),
    ).rejects.toBe(primaryError)
    expect((primaryError as Error & { cause?: unknown }).cause).toBe(flushError)
  })

  it('surfaces a telemetry flush failure when the turn itself succeeds', async () => {
    const flushError = new Error('LangSmith unavailable')
    const handler = createRunSpikeTurnActionHandler({
      createObservability: () => makeBundle([]),
      runObservedTurn: async (input) => makeOutput(input.sessionId),
      flushObservability: async () => {
        throw flushError
      },
    })

    await expect(
      handler(makeCtx(vi.fn(async () => [])), {
        sessionId: 'session-flush-failure',
        userMessage: 'twisty roads near Ogden',
      }),
    ).rejects.toBe(flushError)
  })
})
