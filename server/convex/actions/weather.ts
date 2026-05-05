'use node'
import { ConvexError } from 'convex/values'
import { ERROR_CODES } from '../errors'
import { requireIdentity } from '../guards'
import { retryOnce, withTimeout } from './agent/lib/reliability'

const OPEN_METEO_ENDPOINT = 'https://api.open-meteo.com/v1/forecast'
const DEFAULT_WEATHER_TIMEOUT_MS = 8_000

// WMO code to condition mapping (deterministic lookup)
const wmoCodeToCondition = (code: number): string => {
  // 0: Clear sky
  if (code === 0) return 'CLEAR'
  // 1, 2, 3: Mainly clear, partly cloudy, and overcast
  if (code >= 1 && code <= 3) return 'CLOUDY'
  // 45, 48: Fog
  if (code === 45 || code === 48) return 'FOG'
  // 51-55: Drizzle
  if (code >= 51 && code <= 55) return 'RAIN'
  // 56-57: Freezing Drizzle
  if (code === 56 || code === 57) return 'RAIN'
  // 61-65: Rain
  if (code >= 61 && code <= 65) return 'RAIN'
  // 66-67: Freezing Rain
  if (code === 66 || code === 67) return 'RAIN'
  // 71-77: Snow fall
  if (code >= 71 && code <= 77) return 'SNOW'
  // 80-82: Rain showers
  if (code >= 80 && code <= 82) return 'RAIN'
  // 85-86: Snow showers
  if (code === 85 || code === 86) return 'SNOW'
  // 95: Thunderstorm
  if (code === 95) return 'STORM'
  // 96-99: Thunderstorm with hail
  if (code >= 96 && code <= 99) return 'STORM'
  // Default fallback
  return 'CLEAR'
}

// Celsius to Fahrenheit conversion (rounded)
const celsiusToFahrenheit = (celsius: number): number => {
  return Math.round(celsius * (9 / 5) + 32)
}

// Severity classification based on thresholds
const getSeverity = (precipitationProbability: number, windSpeed: number): string => {
  // Warning threshold: precip >= 70 OR wind >= 70 km/h
  if (precipitationProbability >= 70 || windSpeed >= 70) {
    return 'warning'
  }
  // Advisory threshold: precip >= 40 OR wind >= 40 km/h
  if (precipitationProbability >= 40 || windSpeed >= 40) {
    return 'advisory'
  }
  // Otherwise normal
  return 'normal'
}

// Mark retryable errors
const markRetryable = (error: Error, retryable: boolean) => {
  ;(error as any).retryable = retryable
  return error
}

const isRetryableWeatherError = (error: unknown): boolean => {
  if (error && typeof error === 'object' && 'retryable' in error) {
    return Boolean((error as any).retryable)
  }
  if (error instanceof Error && error.message.startsWith('TIMEOUT')) {
    return true
  }
  return false
}

export const getCurrentWeather = async (
  ctx: any,
  args: { lat: number; lng: number },
): Promise<{
  tempF: number
  condition: string
  severity: string
}> => {
  // Require authentication
  await requireIdentity(ctx)

  const { lat, lng } = args

  // Build URL for current weather
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

          if (!current) {
            throw new Error('Open-Meteo response missing current data')
          }

          const tempC = current.temperature_2m
          const precipitationProbability = current.precipitation_probability ?? 0
          const windSpeed = current.windspeed_10m ?? 0
          const weatherCode = current.weathercode ?? 0

          return {
            tempF: celsiusToFahrenheit(tempC),
            condition: wmoCodeToCondition(weatherCode),
            severity: getSeverity(precipitationProbability, windSpeed),
          }
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') {
            throw markRetryable(new Error('Open-Meteo request aborted'), true)
          }
          if (error instanceof Error) {
            throw error
          }
          throw new Error('Unknown weather provider error')
        }
      },
      { ms: DEFAULT_WEATHER_TIMEOUT_MS, label: 'weather' },
    )

  try {
    return await retryOnce(fetchOnce, {
      shouldRetry: isRetryableWeatherError,
    })
  } catch (_error) {
    throw new ConvexError({
      code: ERROR_CODES.WEATHER_UNAVAILABLE,
      message: 'Weather service unavailable',
    })
  }
}
