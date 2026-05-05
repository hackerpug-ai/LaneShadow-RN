import { ConvexError } from 'convex/values'
import { afterEach, describe, expect, it, type Mock, vi } from 'vitest'
import { getCurrentWeatherHandler } from '../actions/weather'
import { ERROR_CODES } from '../errors'

describe('getCurrentWeather', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  const mockCtx = {
    auth: {
      getUserIdentity: async () => ({
        subject: 'user_123',
        tokenIdentifier: 'token_123',
      }),
    },
    runQuery: vi.fn(async () => ({})),
  } as any

  it('getCurrentWeather happy path clear sky', async () => {
    ;(global.fetch as Mock) = vi.fn(
      async () =>
        ({
          ok: true,
          json: async () => ({
            current: {
              temperature_2m: 20,
              precipitation_probability: 5,
              windspeed_10m: 10,
              weathercode: 0,
            },
          }),
        }) as Response,
    )

    const result = await getCurrentWeatherHandler(mockCtx, {
      lat: 36.97,
      lng: -122.03,
    })

    expect(result).toEqual({
      tempF: 68,
      condition: 'CLEAR',
      severity: 'normal',
    })
  })

  it('getCurrentWeather severity advisory rain probability', async () => {
    ;(global.fetch as Mock) = vi.fn(
      async () =>
        ({
          ok: true,
          json: async () => ({
            current: {
              temperature_2m: 15,
              precipitation_probability: 45,
              windspeed_10m: 15,
              weathercode: 61,
            },
          }),
        }) as Response,
    )

    const result = await getCurrentWeatherHandler(mockCtx, {
      lat: 36.97,
      lng: -122.03,
    })

    expect(result).toEqual({
      tempF: 59,
      condition: 'RAIN',
      severity: 'advisory',
    })
  })

  it('getCurrentWeather severity warning storm', async () => {
    ;(global.fetch as Mock) = vi.fn(
      async () =>
        ({
          ok: true,
          json: async () => ({
            current: {
              temperature_2m: 10,
              precipitation_probability: 75,
              windspeed_10m: 20,
              weathercode: 95,
            },
          }),
        }) as Response,
    )

    const result = await getCurrentWeatherHandler(mockCtx, {
      lat: 36.97,
      lng: -122.03,
    })

    expect(result).toEqual({
      tempF: 50,
      condition: 'STORM',
      severity: 'warning',
    })
  })

  it('getCurrentWeather severity advisory wind speed', async () => {
    ;(global.fetch as Mock) = vi.fn(
      async () =>
        ({
          ok: true,
          json: async () => ({
            current: {
              temperature_2m: 18,
              precipitation_probability: 10,
              windspeed_10m: 55,
              weathercode: 0,
            },
          }),
        }) as Response,
    )

    const result = await getCurrentWeatherHandler(mockCtx, {
      lat: 36.97,
      lng: -122.03,
    })

    expect(result).toEqual({
      tempF: 64,
      condition: 'WIND',
      severity: 'advisory',
    })
  })

  it('getCurrentWeather throws WEATHER_UNAVAILABLE on 503', async () => {
    let callCount = 0
    ;(global.fetch as Mock) = vi.fn(async () => {
      callCount++
      return {
        ok: false,
        status: 503,
        json: async () => ({}),
      } as Response
    })

    try {
      await getCurrentWeatherHandler(mockCtx, {
        lat: 36.97,
        lng: -122.03,
      })
    } catch (error) {
      expect(error).toBeInstanceOf(ConvexError)
      const convexError = error as ConvexError<any>
      expect(convexError.data).toEqual({
        code: ERROR_CODES.WEATHER_UNAVAILABLE,
        message: 'Weather service unavailable',
      })
    }

    expect(callCount).toBe(2)
  })

  it('getCurrentWeather throws UNAUTHENTICATED', async () => {
    const unauthenticatedCtx = {
      auth: {
        getUserIdentity: async () => null,
      },
      runQuery: vi.fn(async () => ({})),
    } as any

    ;(global.fetch as Mock) = vi.fn(
      async () =>
        ({
          ok: true,
          json: async () => ({}),
        }) as Response,
    )

    try {
      await getCurrentWeatherHandler(unauthenticatedCtx, {
        lat: 36.97,
        lng: -122.03,
      })
    } catch (error) {
      expect(error).toBeInstanceOf(ConvexError)
      const convexError = error as ConvexError<any>
      expect(convexError.data).toEqual({
        code: ERROR_CODES.UNAUTHENTICATED,
        message: 'Authentication required',
      })
    }

    expect(global.fetch).not.toHaveBeenCalled()
  })

  describe('wmoCodeToCondition lookup table', () => {
    it('maps WMO codes to conditions', async () => {
      const testCases = [
        { code: 71, expected: 'SNOW' },
        { code: 51, expected: 'RAIN' },
        { code: 45, expected: 'FOG' },
        { code: 61, expected: 'RAIN' },
        { code: 0, expected: 'CLEAR' },
        { code: 1, expected: 'CLOUDY' },
        { code: 95, expected: 'STORM' },
        { code: 96, expected: 'STORM' },
      ]

      for (const { code, expected } of testCases) {
        ;(global.fetch as Mock) = vi.fn(
          async () =>
            ({
              ok: true,
              json: async () => ({
                current: {
                  temperature_2m: 20,
                  precipitation_probability: 0,
                  windspeed_10m: 10,
                  weathercode: code,
                },
              }),
            }) as Response,
        )

        const result = await getCurrentWeatherHandler(mockCtx, {
          lat: 36.97,
          lng: -122.03,
        })

        expect(result.condition).toBe(expected)
      }
    })
  })

  describe('celsiusToFahrenheit conversion', () => {
    it('converts Celsius to Fahrenheit', async () => {
      const testCases = [
        { celsius: 0, expected: 32 },
        { celsius: 100, expected: 212 },
        { celsius: 20, expected: 68 },
      ]

      for (const { celsius, expected } of testCases) {
        ;(global.fetch as Mock) = vi.fn(
          async () =>
            ({
              ok: true,
              json: async () => ({
                current: {
                  temperature_2m: celsius,
                  precipitation_probability: 0,
                  windspeed_10m: 10,
                  weathercode: 0,
                },
              }),
            }) as Response,
        )

        const result = await getCurrentWeatherHandler(mockCtx, {
          lat: 36.97,
          lng: -122.03,
        })

        expect(result.tempF).toBe(expected)
      }
    })
  })

  describe('wind override logic', () => {
    it('returns WIND when wind >= 40 km/h and precip < 40%', async () => {
      ;(global.fetch as Mock) = vi.fn(
        async () =>
          ({
            ok: true,
            json: async () => ({
              current: {
                temperature_2m: 20,
                precipitation_probability: 10,
                windspeed_10m: 45,
                weathercode: 0,
              },
            }),
          }) as Response,
      )

      const result = await getCurrentWeatherHandler(mockCtx, {
        lat: 36.97,
        lng: -122.03,
      })

      expect(result.condition).toBe('WIND')
      expect(result.severity).toBe('advisory')
    })

    it('returns WIND when wind >= 70 km/h and precip < 40% (warning)', async () => {
      ;(global.fetch as Mock) = vi.fn(
        async () =>
          ({
            ok: true,
            json: async () => ({
              current: {
                temperature_2m: 20,
                precipitation_probability: 10,
                windspeed_10m: 75,
                weathercode: 0,
              },
            }),
          }) as Response,
      )

      const result = await getCurrentWeatherHandler(mockCtx, {
        lat: 36.97,
        lng: -122.03,
      })

      expect(result.condition).toBe('WIND')
      expect(result.severity).toBe('warning')
    })

    it('does NOT override to WIND when precip >= 40%', async () => {
      ;(global.fetch as Mock) = vi.fn(
        async () =>
          ({
            ok: true,
            json: async () => ({
              current: {
                temperature_2m: 20,
                precipitation_probability: 50,
                windspeed_10m: 45,
                weathercode: 61,
              },
            }),
          }) as Response,
      )

      const result = await getCurrentWeatherHandler(mockCtx, {
        lat: 36.97,
        lng: -122.03,
      })

      expect(result.condition).toBe('RAIN')
      expect(result.severity).toBe('advisory')
    })

    it('does NOT override to WIND when wind < 40 km/h', async () => {
      ;(global.fetch as Mock) = vi.fn(
        async () =>
          ({
            ok: true,
            json: async () => ({
              current: {
                temperature_2m: 20,
                precipitation_probability: 10,
                windspeed_10m: 35,
                weathercode: 0,
              },
            }),
          }) as Response,
      )

      const result = await getCurrentWeatherHandler(mockCtx, {
        lat: 36.97,
        lng: -122.03,
      })

      expect(result.condition).toBe('CLEAR')
      expect(result.severity).toBe('normal')
    })
  })
})
