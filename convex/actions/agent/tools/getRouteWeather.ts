'use node'
import { createWeatherProvider } from '../providers/weatherProvider'
import { traceableToolAsync } from '../lib/tracing'

const MAX_WEATHER_SAMPLES = 5
const MIN_WEATHER_SAMPLES = 3
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
  const provider = createWeatherProvider()

  try {
    const weatherSamples = await provider.getWeatherAtPoints({
      points: sampledPoints,
      departureTimeMs,
    })

    const segments: WeatherSegment[] = weatherSamples.map((sample) => ({
      lat: sample.lat,
      lng: sample.lng,
      tempC: sample.tempC,
      windSpeedKph: sample.windSpeed,
      rainProbabilityPct: sample.rainProbabilityPct,
      fog: sample.visibilityM < FOG_VISIBILITY_THRESHOLD_M,
    }))

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
