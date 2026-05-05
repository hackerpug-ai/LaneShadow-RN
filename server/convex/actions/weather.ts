'use node'

import { ConvexError, v } from 'convex/values'
import { action } from '../_generated/server'
import { ERROR_CODES } from '../errors'
import { requireIdentity } from '../guards'
import { retryOnce, withTimeout } from './agent/lib/reliability'

const OPEN_METEO_ENDPOINT = 'https://api.open-meteo.com/v1/forecast'
const DEFAULT_WEATHER_TIMEOUT_MS = 8_000

const wmoCodeToCondition = (code: number): string => {
  if (code === 0) return 'CLEAR'
  if (code >= 1 && code <= 3) return 'CLOUDY'
  if (code === 45 || code === 48) return 'FOG'
  if (code >= 51 && code <= 55) return 'RAIN'
  if (code === 56 || code === 57) return 'RAIN'
  if (code >= 61 && code <= 65) return 'RAIN'
  if (code === 66 || code === 67) return 'RAIN'
  if (code >= 71 && code <= 77) return 'SNOW'
  if (code >= 80 && code <= 82) return 'RAIN'
  if (code === 85 || code === 86) return 'SNOW'
  if (code === 95) return 'STORM'
  if (code >= 96 && code <= 99) return 'STORM'
  return 'CLEAR'
}

const celsiusToFahrenheit = (celsius: number): number => {
  return Math.round(celsius * (9 / 5) + 32)
}

const getSeverity = (precipitationProbability: number, windSpeed: number): string => {
  if (precipitationProbability >= 70 || windSpeed >= 70) return 'warning'
  if (precipitationProbability >= 40 || windSpeed >= 40) return 'advisory'
  return 'normal'
}

const getConditionWithWindOverride = (
  wmoCondition: string,
  windSpeed: number,
  precipitationProbability: number,
): string => {
  if (windSpeed >= 40 && precipitationProbability < 40) return 'WIND'
  return wmoCondition
}

const markRetryable = (error: Error, retryable: boolean) => {
  ;(error as any).retryable = retryable
  return error
}

const isRetryableWeatherError = (error: unknown): boolean => {
  if (error && typeof error === 'object' && 'retryable' in error) {
    return Boolean((error as any).retryable)
  }
  if (error instanceof Error && error.message.startsWith('TIMEOUT')) return true
  return false
}

type WeatherCondition = 'CLEAR' | 'CLOUDY' | 'RAIN' | 'SNOW' | 'FOG' | 'WIND' | 'STORM'
type WeatherSeverity = 'normal' | 'advisory' | 'warning'

async function getCurrentWeatherHandler(
  ctx: any,
  args: { lat: number; lng: number },
): Promise<{ tempF: number; condition: WeatherCondition; severity: WeatherSeverity }> {
  await requireIdentity(ctx)

  const { lat, lng } = args
  const url = `${OPEN_METEO_ENDPOINT}?latitude=${lat}&longitude=${lng}&current=temperature_2m,precipitation_probability,windspeed_10m,weathercode&timezone=auto`

  const fetchOnce = async () =>
    withTimeout(
      async (signal) => {
        try {
          const response = await fetch(url, { signal })
          if (!response.ok) {
            throw markRetryable(
              new Error(`Open-Meteo request failed: ${response.status}`),
              response.status >= 500 || response.status === 429,
            )
          }
          const data: any = await response.json()
          const current = data?.current
          if (!current) throw new Error('Open-Meteo response missing current data')

          const tempC = current.temperature_2m
          const precipitationProbability = current.precipitation_probability ?? 0
          const windSpeed = current.windspeed_10m ?? 0
          const weatherCode = current.weathercode ?? 0

          const wmoCondition = wmoCodeToCondition(weatherCode)
          const condition = getConditionWithWindOverride(
            wmoCondition,
            windSpeed,
            precipitationProbability,
          )
          const severity = getSeverity(precipitationProbability, windSpeed)

          return {
            tempF: celsiusToFahrenheit(tempC),
            condition: condition as WeatherCondition,
            severity: severity as WeatherSeverity,
          }
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') {
            throw markRetryable(new Error('Open-Meteo request aborted'), true)
          }
          if (error instanceof Error) throw error
          throw new Error('Unknown weather provider error')
        }
      },
      { ms: DEFAULT_WEATHER_TIMEOUT_MS, label: 'weather' },
    )

  try {
    return await retryOnce(fetchOnce, { shouldRetry: isRetryableWeatherError })
  } catch (_error) {
    throw new ConvexError({
      code: ERROR_CODES.WEATHER_UNAVAILABLE,
      message: 'Weather service unavailable',
    })
  }
}

export { getCurrentWeatherHandler }

const WeatherConditionValidator = v.union(
  v.literal('CLEAR'),
  v.literal('CLOUDY'),
  v.literal('RAIN'),
  v.literal('SNOW'),
  v.literal('FOG'),
  v.literal('WIND'),
  v.literal('STORM'),
)

const WeatherSeverityValidator = v.union(
  v.literal('normal'),
  v.literal('advisory'),
  v.literal('warning'),
)

export const getCurrentWeather = action({
  args: {
    lat: v.number(),
    lng: v.number(),
  },
  returns: v.object({
    tempF: v.number(),
    condition: WeatherConditionValidator,
    severity: WeatherSeverityValidator,
  }),
  handler: getCurrentWeatherHandler,
})
