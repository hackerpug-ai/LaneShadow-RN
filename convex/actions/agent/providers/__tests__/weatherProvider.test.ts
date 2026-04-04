import { vi, describe, it, expect, beforeEach, afterEach, type Mock } from 'vitest'
import * as reliability from '../../lib/reliability'
import { createWeatherProvider } from '../weatherProvider'

const departureTimeMs = Date.UTC(2026, 0, 13, 12, 0, 0)

const okWeatherPayload = {
  hourly: {
    time: [new Date(departureTimeMs).toISOString()],
    windspeed_10m: [10],
    winddirection_10m: [200],
    windgusts_10m: [15],
  },
}

describe('weather provider reliability', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.resetAllMocks()
  })

  it('retries once on transient HTTP failure then succeeds', async () => {
    let call = 0
    ;(global.fetch as Mock) = vi.fn(async () => {
      call += 1
      if (call === 1) {
        return { ok: false, status: 500, json: async () => ({}) }
      }
      return { ok: true, status: 200, json: async () => okWeatherPayload }
    })

    const provider = createWeatherProvider()
    const points = [{ lat: 37, lng: -122, distanceFromStartMeters: 0 }]
    const result = await provider.getWindAtPoints({ points, departureTimeMs })

    expect(result).toHaveLength(1)
    expect(call).toBe(2) // one retry
  })

  it('bounds concurrency to MAX_CONCURRENT (8)', async () => {
    let active = 0
    let maxSeen = 0
    ;(global.fetch as Mock) = vi.fn(
      (_url: string, { signal }: { signal?: AbortSignal } = {}) =>
        new Promise((resolve, reject) => {
          active += 1
          maxSeen = Math.max(maxSeen, active)
          const settle = () => {
            active -= 1
            resolve({ ok: true, status: 200, json: async () => okWeatherPayload })
          }
          setTimeout(settle, 1)
          signal?.addEventListener('abort', () => {
            const err = new Error('Aborted')
            ;(err as any).name = 'AbortError'
            reject(err)
          })
        })
    )

    const provider = createWeatherProvider()
    const points = Array.from({ length: 20 }).map((_, idx) => ({
      lat: 37 + idx * 0.001,
      lng: -122 - idx * 0.001,
      distanceFromStartMeters: idx * 1000,
    }))

    const result = await provider.getWindAtPoints({ points, departureTimeMs })

    expect(result).toHaveLength(points.length)
    expect(maxSeen).toBeLessThanOrEqual(8)
  })

  it('times out and surfaces timeout error after retry', async () => {
    const withTimeoutSpy = vi
      .spyOn(reliability, 'withTimeout')
      .mockImplementation(async (_op, { label }) => {
        throw new Error(label ? `TIMEOUT:${label}` : 'TIMEOUT')
      })
    ;(global.fetch as Mock) = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => okWeatherPayload,
    }))

    const provider = createWeatherProvider()
    const points = [{ lat: 37, lng: -122, distanceFromStartMeters: 0 }]
    await expect(provider.getWindAtPoints({ points, departureTimeMs })).rejects.toThrow(/TIMEOUT/)
    expect(global.fetch as Mock).not.toHaveBeenCalled()
    withTimeoutSpy.mockRestore()
  })
})
