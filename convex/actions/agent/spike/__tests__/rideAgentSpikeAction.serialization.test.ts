/**
 * S2-T5-COLDSTART-FIX — Unit tests for the spike action return serialization.
 *
 * The Convex ACTION boundary must return a Convex-serializable shape. Mastra's
 * FullOutput<undefined> embeds `messages[].createdAt` as JS Date objects, which
 * Convex's wire format rejects:
 *
 *   Error: Date "2026-07-13T17:59:08.508Z" is not a supported Convex type
 *   (present at path .result.messages[0].createdAt)
 *
 * The fix extracts ONLY the serializable fields the caller needs:
 *   { text, workingMemory, tripwireHandled }
 *
 * These tests verify the pure serialization transform (zero I/O) — the correct
 * tier for a pure function. They construct a realistic FullOutput-shaped object
 * WITH Date instances and assert the output contains no Dates and exactly the
 * three fields.
 */
// @vitest-environment node

import { describe, expect, it } from 'vitest'
import type { SpikeTurnOutput } from '../rideAgentSpike'
import { serializeSpikeTurnOutput } from '../rideAgentSpikeAction'

/**
 * Recursively scan a value for any Date instance. Convex's wire format cannot
 * transport Date objects, so the serialized output must contain NONE.
 */
function containsDate(value: unknown): boolean {
  if (value instanceof Date) return true
  if (Array.isArray(value)) return value.some((v) => containsDate(v))
  if (value !== null && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).some((v) => containsDate(v))
  }
  return false
}

/** Build a realistic SpikeTurnOutput mimicking Mastra's FullOutput shape. */
function makeOutput(overrides: {
  text?: string
  tripwire?: unknown
  finishReason?: string
}): SpikeTurnOutput {
  return {
    result: {
      text: overrides.text ?? 'Found 3 twisty routes near Ogden.',
      toolCalls: [],
      toolResults: [],
      finishReason: overrides.finishReason ?? 'stop',
      tripwire: overrides.tripwire,
      // The offending field — Date objects that Convex rejects.
      messages: [
        {
          role: 'assistant',
          content: 'Found 3 twisty routes near Ogden.',
          createdAt: new Date('2026-07-13T17:59:08.508Z') as unknown as string,
        },
      ],
    } as unknown as SpikeTurnOutput['result'],
    workingMemory: {
      sessionId: 'spike-ogden-1',
      center: { lat: 41.223, lng: -112.011 },
      place: 'Ogden, UT, USA',
    },
    tripwireHandled: false,
  }
}

describe('S2-T5-COLDSTART-FIX serializeSpikeTurnOutput — Convex-wire-safe return shape', () => {
  it('returns exactly { text, workingMemory, tripwireHandled } — no result field leaks', () => {
    const output = serializeSpikeTurnOutput(makeOutput({}))

    expect(Object.keys(output).sort()).toEqual(['text', 'tripwireHandled', 'workingMemory'])
    expect(output).not.toHaveProperty('result')
  })

  it('strips all Date objects — output is Convex-serializable', () => {
    const input = makeOutput({})
    // Sanity: the input DOES contain a Date (the bug condition).
    expect(containsDate(input)).toBe(true)

    const output = serializeSpikeTurnOutput(input)

    expect(containsDate(output)).toBe(false)
  })

  it('passes through result.text as the text field', () => {
    const output = serializeSpikeTurnOutput(makeOutput({ text: 'banana' }))

    expect(output.text).toBe('banana')
    expect(typeof output.text).toBe('string')
  })

  it('defaults text to empty string when result.text is undefined (Mastra edge case)', () => {
    const input = makeOutput({})
    // Simulate the Mastra edge case where text is undefined.
    ;(input.result as { text?: string }).text = undefined

    const output = serializeSpikeTurnOutput(input)

    expect(output.text).toBe('')
    // Never throws at the serialization boundary.
    expect(typeof output.text).toBe('string')
  })

  it('passes through workingMemory unchanged (already serializable)', () => {
    const wm = {
      sessionId: 'spike-sac-2',
      center: { lat: 38.58, lng: -121.49 },
      place: 'Sacramento, CA, USA',
    }
    const input = makeOutput({})
    input.workingMemory = wm

    const output = serializeSpikeTurnOutput(input)

    expect(output.workingMemory).toEqual(wm)
  })

  it('passes through workingMemory when center is absent (turn 1, pre-geocode)', () => {
    const input = makeOutput({})
    input.workingMemory = { sessionId: 'spike-fresh' }

    const output = serializeSpikeTurnOutput(input)

    expect(output.workingMemory).toEqual({ sessionId: 'spike-fresh' })
  })

  it('passes through tripwireHandled boolean', () => {
    const blocked = makeOutput({ tripwire: { reason: 'blocked' }, finishReason: 'other' })
    // Mimic runSpikeTurn's tripwire derivation.
    blocked.tripwireHandled = true

    const output = serializeSpikeTurnOutput(blocked)

    expect(output.tripwireHandled).toBe(true)
    expect(typeof output.tripwireHandled).toBe('boolean')
  })
})
