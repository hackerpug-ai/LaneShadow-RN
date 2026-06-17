import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { ConvexError } from 'convex/values'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ERROR_CODES } from '../errors'

const expectedDayOfWeek = new Intl.DateTimeFormat('en-US', { weekday: 'long' })
  .format(new Date('2026-05-05T12:00:00.000Z'))
  .toUpperCase()

describe('weather contract', () => {
  const mockCtx = {
    auth: {
      getUserIdentity: async () => ({
        subject: 'user_123',
        tokenIdentifier: 'token_123',
      }),
    },
    runQuery: vi.fn(async () => ({})),
  } as const

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-05T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.resetAllMocks()
  })

  it('returns the mobile weather DTO including uppercase dayOfWeek', async () => {
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        current: {
          temperature_2m: 20,
          precipitation_probability: 5,
          windspeed_10m: 10,
          weathercode: 0,
        },
      }),
    })) as unknown as typeof fetch

    const { getCurrentWeatherHandler } = await import('../actions/weather.js')

    const result = await getCurrentWeatherHandler(mockCtx, { lat: 36.97, lng: -122.03 })

    expect(result).toEqual({
      tempF: 68,
      condition: 'CLEAR',
      severity: 'normal',
      dayOfWeek: expectedDayOfWeek,
    })
  })

  it('retries one transient 503 from Open-Meteo and then succeeds', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          current: {
            temperature_2m: 18,
            precipitation_probability: 10,
            windspeed_10m: 10,
            weathercode: 1,
          },
        }),
      }) as unknown as typeof fetch

    const { getCurrentWeatherHandler } = await import('../actions/weather.js')

    const result = await getCurrentWeatherHandler(mockCtx, { lat: 36.97, lng: -122.03 })

    expect(result).toMatchObject({
      tempF: 64,
      condition: 'CLOUDY',
      severity: 'normal',
      dayOfWeek: expectedDayOfWeek,
    })
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('does not retry a non-transient 400 from Open-Meteo', async () => {
    global.fetch = vi.fn(async () => ({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
    })) as unknown as typeof fetch

    const { getCurrentWeatherHandler } = await import('../actions/weather.js')

    await expect(
      getCurrentWeatherHandler(mockCtx, { lat: 36.97, lng: -122.03 }),
    ).rejects.toMatchObject({
      data: {
        code: ERROR_CODES.WEATHER_UNAVAILABLE,
      },
    })

    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('does not retry a 429 because only transient 5xx failures are retryable', async () => {
    global.fetch = vi.fn(async () => ({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
    })) as unknown as typeof fetch

    const { getCurrentWeatherHandler } = await import('../actions/weather.js')

    await expect(
      getCurrentWeatherHandler(mockCtx, { lat: 36.97, lng: -122.03 }),
    ).rejects.toMatchObject({
      data: {
        code: ERROR_CODES.WEATHER_UNAVAILABLE,
      },
    })

    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('throws UNAUTHENTICATED before calling the provider', async () => {
    global.fetch = vi.fn() as typeof fetch

    const unauthenticatedCtx = {
      auth: {
        getUserIdentity: async () => null,
      },
      runQuery: vi.fn(async () => ({})),
    }

    const { getCurrentWeatherHandler } = await import('../actions/weather.js')

    await expect(
      getCurrentWeatherHandler(unauthenticatedCtx, { lat: 36.97, lng: -122.03 }),
    ).rejects.toThrow(ConvexError)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('keeps the native weather action contracts aligned with the documented public endpoint', () => {
    const iosSource = readFileSync(
      resolve(__dirname, '../../../ios/LaneShadow/Services/ConvexClient+LaneShadow.swift'),
      'utf8',
    )
    const androidSource = readFileSync(
      resolve(
        __dirname,
        '../../../android/app/src/main/java/com/laneshadow/services/ConvexClientProvider.kt',
      ),
      'utf8',
    )

    expect(iosSource).toContain('case getCurrentWeather = "actions/weather:getCurrentWeather"')
    expect(androidSource).toContain('name = "actions/weather:getCurrentWeather"')
  })
})
