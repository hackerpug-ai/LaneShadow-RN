'use node'
import { traceableToolAsync } from '../lib/tracing'

const MAX_WEATHER_SAMPLES = 5
const MIN_WEATHER_SAMPLES = 3
const OPEN_METEO_ENDPOINT = 'https://api.open-meteo.com/v1/forecast'
const FOG_VISIBILITY_THRESHOLD_M = 1000

export type LatLng = {
  lat: number
  lng: number
}

export type WeatherSegment = {
  lat: number
  lng: number
  tempC: number
  windSpeedKph: number
  rainProbabilityPct: number
  fog: boolean
}

export type RouteWeatherOk = {
  status: 'ok'
  segments: WeatherSegment[]
  routeWeatherSummary: string
}

export type RouteWeatherUnavailable = {
  status: 'unavailable'
}

export type RouteWeatherResult = RouteWeatherOk | RouteWeatherUnavailable

export type GetRouteWeatherParams = {
  polyline: LatLng[]
  departureTimeMs: number
}

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

/**
 * Sample a polyline down to 3-5 representative points (start, intermediate, end).
 */
const samplePolyline = (polyline: LatLng[]): LatLng[] => {
  if (polyline.length <= MIN_WEATHER_SAMPLES) return polyline

  const targetCount = Math.min(MAX_WEATHER_SAMPLES, Math.max(MIN_WEATHER_SAMPLES, polyline.length))
  const selected: LatLng[] = []
  const lastIndex = polyline.length - 1
  const slots = targetCount - 1

  for (let i = 0; i <= slots; i += 1) {
    const idx = Math.round((i * lastIndex) / slots)
    selected.push(polyline[idx])
  }

  return selected
}

const fetchWeatherForPoint = async (
  lat: number,
  lng: number,
  departureTimeMs: number
): Promise<WeatherSegment> => {
  const dateStr = toUtcDateString(departureTimeMs)
  const url =
    `${OPEN_METEO_ENDPOINT}?latitude=${lat}&longitude=${lng}` +
    `&hourly=windspeed_10m,winddirection_10m,windgusts_10m,temperature_2m,precipitation_probability,visibility` +
    `&timezone=UTC&start_date=${dateStr}&end_date=${dateStr}`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Open-Meteo request failed: ${response.status}`)
  }

  const data: any = await response.json()
  const times: string[] | undefined = data?.hourly?.time
  const speeds: number[] | undefined = data?.hourly?.windspeed_10m
  const temps: number[] | undefined = data?.hourly?.temperature_2m
  const rainProbs: number[] | undefined = data?.hourly?.precipitation_probability
  const visibilities: number[] | undefined = data?.hourly?.visibility

  if (!times || !speeds || !temps || times.length === 0) {
    throw new Error('Open-Meteo response missing required hourly data')
  }

  const idx = pickNearestHourIndex(times, departureTimeMs)
  const windSpeedKph = speeds[idx] ?? 0
  const tempC = temps[idx] ?? 0
  const rainProbabilityPct = rainProbs ? (rainProbs[idx] ?? 0) : 0
  const visibilityM = visibilities ? (visibilities[idx] ?? 10000) : 10000
  const fog = visibilityM < FOG_VISIBILITY_THRESHOLD_M

  return { lat, lng, tempC, windSpeedKph, rainProbabilityPct, fog }
}

const buildSummary = (segments: WeatherSegment[]): string => {
  if (!segments.length) return 'No weather data available.'

  const temps = segments.map((s) => s.tempC)
  const minTemp = Math.min(...temps)
  const maxTemp = Math.max(...temps)
  const maxWind = Math.max(...segments.map((s) => s.windSpeedKph))
  const maxRain = Math.max(...segments.map((s) => s.rainProbabilityPct))
  const hasFog = segments.some((s) => s.fog)

  const parts: string[] = []

  const tempStr =
    minTemp === maxTemp ? `${Math.round(minTemp)}°C` : `${Math.round(minTemp)}–${Math.round(maxTemp)}°C`
  parts.push(`Temperature: ${tempStr}`)

  if (maxWind >= 50) {
    parts.push(`Strong winds up to ${Math.round(maxWind)} km/h`)
  } else if (maxWind >= 20) {
    parts.push(`Moderate winds up to ${Math.round(maxWind)} km/h`)
  } else {
    parts.push(`Light winds (${Math.round(maxWind)} km/h)`)
  }

  if (maxRain >= 50) {
    parts.push(`High chance of rain (${maxRain}%)`)
  } else if (maxRain >= 20) {
    parts.push(`Some chance of rain (${maxRain}%)`)
  } else {
    parts.push(`Low rain probability (${maxRain}%)`)
  }

  if (hasFog) {
    parts.push('Fog expected along part of the route')
  }

  return parts.join('. ') + '.'
}

const getRouteWeatherImpl = async ({
  polyline,
  departureTimeMs,
}: GetRouteWeatherParams): Promise<RouteWeatherResult> => {
  if (!polyline.length) {
    return {
      status: 'ok',
      segments: [],
      routeWeatherSummary: 'No route points provided.',
    }
  }

  const sampledPoints = samplePolyline(polyline)

  try {
    const segments = await Promise.all(
      sampledPoints.map((pt) => fetchWeatherForPoint(pt.lat, pt.lng, departureTimeMs))
    )

    const routeWeatherSummary = buildSummary(segments)

    return { status: 'ok', segments, routeWeatherSummary }
  } catch {
    return { status: 'unavailable' }
  }
}

export const getRouteWeather = traceableToolAsync(getRouteWeatherImpl, {
  name: 'getRouteWeather',
  runType: 'tool',
  tags: ['planning', 'weather'],
})
