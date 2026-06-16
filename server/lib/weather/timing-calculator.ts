/**
 * Rain Timing Calculator
 *
 * Pure functions for calculating rain timing based on departure time and route segments.
 * All functions are timezone-aware and use 12-hour time format.
 */

import type { RainOverlay, RouteLeg } from '../../../server/models/saved-routes'

/**
 * Result type for rain timing calculation
 */
export type RainTimingResult =
  | { status: 'no-rain' }
  | { status: 'throughout' }
  | { status: 'range'; startHour: number; endHour: number; startMinute: number; endMinute: number }
  | { status: 'unavailable' }

/**
 * Checks if a rain level indicates actual rain (not 'none')
 */
const isRainyLevel = (level: string): boolean => {
  return level !== 'none'
}

/**
 * Calculates cumulative time to reach the end of a specific leg
 */
const calculateArrivalTime = (
  departureTime: number,
  legs: RouteLeg[],
  targetLegIndex: number,
): number => {
  let cumulativeDuration = 0

  for (const leg of legs) {
    if (leg.legIndex > targetLegIndex) break
    cumulativeDuration += leg.durationSeconds
  }

  return departureTime + cumulativeDuration * 1000
}

/**
 * Calculates the time range when rain is expected during a route
 *
 * @param rainOverlay - Rain overlay data with segments by leg
 * @param legs - Route legs with duration information
 * @param departureTime - Departure time in milliseconds
 * @returns Rain timing result
 */
export const calculateRainTiming = (
  rainOverlay: RainOverlay | undefined,
  legs: RouteLeg[],
  departureTime: number,
): RainTimingResult => {
  // Handle missing or empty overlay
  if (!rainOverlay?.byLeg?.length) {
    return { status: 'unavailable' }
  }

  // Find all legs with rain segments
  const rainyLegs = rainOverlay.byLeg
    .filter((legData) => legData.segments.some((seg) => isRainyLevel(seg.level)))
    .map((legData) => legData.legIndex)
    .sort((a, b) => a - b)

  // No rain found
  if (rainyLegs.length === 0) {
    return { status: 'no-rain' }
  }

  // Calculate arrival times for first and last rainy legs
  const firstRainyLegIndex = rainyLegs[0]
  const lastRainyLegIndex = rainyLegs[rainyLegs.length - 1]

  const rainStartTime = calculateArrivalTime(departureTime, legs, firstRainyLegIndex)
  const rainEndTime = calculateArrivalTime(departureTime, legs, lastRainyLegIndex)

  // Check if entire route has rain (all legs have rain)
  const totalLegs = legs.length
  const legsWithRain = new Set(rainyLegs)

  // If first leg (index 0) has rain and all legs have rain, it's throughout
  if (legsWithRain.has(0) && legsWithRain.size === totalLegs) {
    return { status: 'throughout' }
  }

  // Return time range
  const startDate = new Date(rainStartTime)
  const endDate = new Date(rainEndTime)

  return {
    status: 'range',
    startHour: startDate.getHours(),
    startMinute: startDate.getMinutes(),
    endHour: endDate.getHours(),
    endMinute: endDate.getMinutes(),
  }
}

/**
 * Formats an hour in 12-hour format with am/pm
 */
const formatHour = (hour: number, minute: number): string => {
  const period = hour >= 12 ? 'pm' : 'am'
  const displayHour = hour % 12 || 12 // Convert 0 to 12, 13+ to 1-12
  const displayMinute = minute > 0 ? `:${minute.toString().padStart(2, '0')}` : ''
  return `${displayHour}${displayMinute}${period}`
}

/**
 * Formats rain timing result into human-readable text
 *
 * @param result - Rain timing calculation result
 * @returns Formatted string for display
 */
export const formatRainTiming = (result: RainTimingResult): string | null => {
  switch (result.status) {
    case 'no-rain':
      return null
    case 'throughout':
      return 'Rain throughout ride'
    case 'unavailable':
      return 'Rain data unavailable'
    case 'range': {
      const start = formatHour(result.startHour, result.startMinute)
      const end = formatHour(result.endHour, result.endMinute)
      return `Rain expected ${start}-${end}`
    }
  }
}

/**
 * Main function to calculate and format rain timing
 *
 * @param rainOverlay - Rain overlay data
 * @param legs - Route legs with duration information
 * @param departureTime - Departure time in milliseconds
 * @returns Formatted rain timing string or null if no rain
 */
export const getRainTimingDisplay = (
  rainOverlay: RainOverlay | undefined,
  legs: RouteLeg[],
  departureTime: number,
): string | null => {
  const result = calculateRainTiming(rainOverlay, legs, departureTime)
  return formatRainTiming(result)
}
