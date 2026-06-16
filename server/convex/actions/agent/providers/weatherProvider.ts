'use node'
import type { RouteIndexPoint } from '../../../../models/saved-routes'
import { createConcurrencyLimiter, retryOnce, withTimeout } from '../lib/reliability'

export type WindSample = {
  lat: number
  lng: number
  windSpeed: number
  windDirectionDeg: number
  windGust?: number
  unit: 'km/h' | 'm/s'
  timeIso: string
}

export type FullWeatherSample = {
  lat: number
  lng: number
  windSpeed: number
  windDirectionDeg: number
  windGust?: number
  unit: 'km/h' | 'm/s'
  timeIso: string
  tempC: number
  rainProbabilityPct: number
  visibilityM: number
}

export type WeatherProvider = {
  getWindAtPoints: (params: {
    points: RouteIndexPoint[]
    departureTimeMs: number
  }) => Promise<WindSample[]>
  getWeatherAtPoints: (params: {
    points: { lat: number; lng: number }[]
    departureTimeMs: number
  }) => Promise<FullWeatherSample[]>
}

const OPEN_METEO_ENDPOINT = 'https://api.open-meteo.com/v1/forecast'
const MAX_PROBED_POINTS = 25
const MAX_CONCURRENT = 8
const DEFAULT_WEATHER_TIMEOUT_MS = 8_000

const toUtcDateString = (timeMs: number): string => {
  const d = new Date(timeMs)
  const year = d.getUTCFullYear()
  const month = `${d.getUTCMonth() + 1}`.padStart(2, '0')
  const day = `${d.getUTCDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

const pickNearestHourIndex = (times: string[], targetMs: number): number => {
  let bestIdx = 0
  let bestDiff = Number.POSITIVE_INFINITY
  for (let i = 0; i < times.length; i += 1) {
    const ts = Date.parse(times[i])
    const diff = Math.abs(ts - targetMs)
    if (diff < bestDiff) {
      bestDiff = diff
      bestIdx = i
    }
  }
  return bestIdx
}

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

const fetchFullWeatherForPoint = async (
  lat: number,
  lng: number,
  departureTimeMs: number,
): Promise<FullWeatherSample> => {
  const dateStr = toUtcDateString(departureTimeMs)
  const url =
    `${OPEN_METEO_ENDPOINT}?latitude=${lat}&longitude=${lng}` +
    `&hourly=windspeed_10m,winddirection_10m,windgusts_10m,temperature_2m,precipitation_probability,visibility` +
    `&timezone=UTC&start_date=${dateStr}&end_date=${dateStr}`

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
          const times: string[] | undefined = data?.hourly?.time
          const speeds: number[] | undefined = data?.hourly?.windspeed_10m
          const directions: number[] | undefined = data?.hourly?.winddirection_10m
          const gusts: number[] | undefined = data?.hourly?.windgusts_10m
          const temps: number[] | undefined = data?.hourly?.temperature_2m
          const rainProbs: number[] | undefined = data?.hourly?.precipitation_probability
          const visibilities: number[] | undefined = data?.hourly?.visibility

          if (!times || !speeds || !directions || !temps || times.length === 0) {
            throw new Error('Open-Meteo response missing hourly data')
          }

          const idx = pickNearestHourIndex(times, departureTimeMs)

          return {
            lat,
            lng,
            windSpeed: speeds[idx],
            windDirectionDeg: directions[idx],
            windGust: gusts ? gusts[idx] : undefined,
            unit: 'km/h' as const,
            timeIso: times[idx],
            tempC: temps[idx],
            rainProbabilityPct: rainProbs ? (rainProbs[idx] ?? 0) : 0,
            visibilityM: visibilities ? (visibilities[idx] ?? 10000) : 10000,
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

  return await retryOnce(fetchOnce, {
    shouldRetry: isRetryableWeatherError,
  })
}

const fetchWindForPoint = async (
  lat: number,
  lng: number,
  departureTimeMs: number,
): Promise<WindSample> => {
  const dateStr = toUtcDateString(departureTimeMs)
  const url = `${OPEN_METEO_ENDPOINT}?latitude=${lat}&longitude=${lng}&hourly=windspeed_10m,winddirection_10m,windgusts_10m&timezone=UTC&start_date=${dateStr}&end_date=${dateStr}`

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
          const times: string[] | undefined = data?.hourly?.time
          const speeds: number[] | undefined = data?.hourly?.windspeed_10m
          const directions: number[] | undefined = data?.hourly?.winddirection_10m
          const gusts: number[] | undefined = data?.hourly?.windgusts_10m

          if (!times || !speeds || !directions || times.length === 0) {
            throw new Error('Open-Meteo response missing hourly data')
          }

          const idx = pickNearestHourIndex(times, departureTimeMs)
          const windSpeed = speeds[idx]
          const windDirectionDeg = directions[idx]
          const windGust = gusts ? gusts[idx] : undefined
          const timeIso = times[idx]

          return {
            lat,
            lng,
            windSpeed,
            windDirectionDeg,
            windGust,
            unit: 'km/h' as const,
            timeIso,
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

  return await retryOnce(fetchOnce, {
    shouldRetry: isRetryableWeatherError,
  })
}

export const createWeatherProvider = (): WeatherProvider => {
  const getWindAtPoints: WeatherProvider['getWindAtPoints'] = async ({
    points,
    departureTimeMs,
  }) => {
    if (!points.length) return []

    const cappedPoints = points.slice(0, MAX_PROBED_POINTS)
    const limiter = createConcurrencyLimiter(MAX_CONCURRENT)

    const samples = await Promise.all(
      cappedPoints.map((pt) => limiter(() => fetchWindForPoint(pt.lat, pt.lng, departureTimeMs))),
    )

    return samples
  }

  const getWeatherAtPoints: WeatherProvider['getWeatherAtPoints'] = async ({
    points,
    departureTimeMs,
  }) => {
    if (!points.length) return []

    const cappedPoints = points.slice(0, MAX_PROBED_POINTS)
    const limiter = createConcurrencyLimiter(MAX_CONCURRENT)

    const samples = await Promise.all(
      cappedPoints.map((pt) =>
        limiter(() => fetchFullWeatherForPoint(pt.lat, pt.lng, departureTimeMs)),
      ),
    )

    return samples
  }

  return { getWindAtPoints, getWeatherAtPoints }
}

/**
 * Note for callers (planRide orchestration):
 * - This provider will throw on HTTP/parse failures. The caller should catch
 *   and downgrade to soft-fail (`conditionsStatus: 'unavailable'`) per Task 06/07.
 */
