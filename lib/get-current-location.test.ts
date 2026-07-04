import * as Location from 'expo-location'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getCurrentLocation } from './get-current-location'

vi.mock('expo-location', () => ({
  Accuracy: { Low: 'low' },
  requestForegroundPermissionsAsync: vi.fn(),
  getCurrentPositionAsync: vi.fn(),
  getLastKnownPositionAsync: vi.fn(),
  reverseGeocodeAsync: vi.fn(),
}))

const mockedLocation = vi.mocked(Location)

describe('getCurrentLocation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-04T12:00:00Z'))
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns coordinates even when reverse geocoding is slow', async () => {
    mockedLocation.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' } as any)
    mockedLocation.getCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: 37.7749, longitude: -122.4194 },
    } as any)
    mockedLocation.getLastKnownPositionAsync.mockResolvedValue(null)
    mockedLocation.reverseGeocodeAsync.mockReturnValue(new Promise(() => {}) as any)

    const locationPromise = getCurrentLocation(1000)
    await vi.advanceTimersByTimeAsync(500)

    await expect(locationPromise).resolves.toEqual({
      lat: 37.7749,
      lng: -122.4194,
      label: 'Current Location',
    })
  })

  it('falls back to last known coordinates when a fresh fix misses the startup budget', async () => {
    mockedLocation.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' } as any)
    mockedLocation.getCurrentPositionAsync.mockReturnValue(new Promise(() => {}) as any)
    mockedLocation.getLastKnownPositionAsync.mockResolvedValue({
      coords: { latitude: 40.7128, longitude: -74.006 },
    } as any)
    mockedLocation.reverseGeocodeAsync.mockResolvedValue([])

    const locationPromise = getCurrentLocation(1000)
    await vi.advanceTimersByTimeAsync(500)

    await expect(locationPromise).resolves.toEqual({
      lat: 40.7128,
      lng: -74.006,
      label: 'Current Location',
    })
    expect(mockedLocation.getLastKnownPositionAsync).toHaveBeenCalledWith({
      maxAge: 600000,
      requiredAccuracy: 5000,
    })
  })

  it('returns null when foreground location permission is denied', async () => {
    mockedLocation.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' } as any)

    await expect(getCurrentLocation(1000)).resolves.toBeNull()
    expect(mockedLocation.getCurrentPositionAsync).not.toHaveBeenCalled()
  })
})
