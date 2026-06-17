'use node'

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockFindScenicWaypoints = vi.fn()
const mockCompileSketch = vi.fn()

vi.mock('../../tools/findScenicWaypoints', () => ({
  findScenicWaypoints: mockFindScenicWaypoints,
}))

vi.mock('../../tools/compileSketch', () => ({
  compileSketch: mockCompileSketch,
}))

describe('planRideOrchestrator failure logging', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('calls console.warn once per failed variant before throwing NO_ROUTES_GENERATED', async () => {
    mockFindScenicWaypoints.mockResolvedValue([
      { id: 'variant-1' },
      { id: 'variant-2' },
      { id: 'variant-3' },
    ])
    mockCompileSketch
      .mockRejectedValueOnce(new Error('first failure'))
      .mockRejectedValueOnce(new Error('second failure'))
      .mockRejectedValueOnce(new Error('third failure'))

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { planRideOrchestrator } = await import('../planRideOrchestrator.js')

    await expect(
      planRideOrchestrator({
        planInput: {
          start: { lat: 37.7749, lng: -122.4194, label: 'San Francisco' },
          end: { lat: 34.0522, lng: -118.2437, label: 'Los Angeles' },
          departureTime: 1_700_000_000_000,
          preferences: { scenicBias: 'default', avoidHighways: false, avoidTolls: false },
        },
        departureTimeMs: 1_700_000_000_000,
      }),
    ).rejects.toThrow('NO_ROUTES_GENERATED')

    expect(warnSpy).toHaveBeenCalledTimes(3)
    warnSpy.mockRestore()
  })
})
