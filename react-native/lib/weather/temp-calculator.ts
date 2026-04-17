/**
 * Temperature Range Calculator
 *
 * Pure functions for calculating temperature range (high/low) from TemperatureOverlay data.
 * All temperatures are displayed in Fahrenheit for US locale.
 */

import type { TemperatureOverlay } from '../../models/saved-routes'

/**
 * Temperature range result type
 */
export type TempRangeResult =
  | { status: 'range'; highF: number; lowF: number }
  | { status: 'consistent'; tempF: number }
  | { status: 'unavailable' }

/**
 * Converts Celsius to Fahrenheit, rounded to nearest degree
 */
const celsiusToFahrenheit = (celsius: number): number => {
  return Math.round((celsius * 9) / 5 + 32)
}

/**
 * Checks if temperatures are "consistent" (within 2 degrees of each other)
 */
const isConsistentTemp = (highF: number, lowF: number): boolean => {
  return Math.abs(highF - lowF) <= 2
}

/**
 * Extracts all temperature values from TemperatureOverlay
 */
const extractTemperatures = (overlay: TemperatureOverlay | undefined): number[] => {
  if (!overlay?.byLeg?.length) return []

  const temperatures: number[] = []

  for (const leg of overlay.byLeg) {
    for (const segment of leg.segments) {
      if (segment.temperatureCelsius !== undefined) {
        temperatures.push(celsiusToFahrenheit(segment.temperatureCelsius))
      }
    }
  }

  return temperatures
}

/**
 * Calculates the temperature range for a route
 *
 * @param overlay - Temperature overlay data with segments by leg
 * @returns Temperature range result
 */
export const calculateTempRange = (overlay: TemperatureOverlay | undefined): TempRangeResult => {
  const temps = extractTemperatures(overlay)

  // No temperature data available
  if (temps.length === 0) {
    return { status: 'unavailable' }
  }

  const highF = Math.max(...temps)
  const lowF = Math.min(...temps)

  // Check if temperatures are consistent (AC2)
  if (isConsistentTemp(highF, lowF)) {
    return { status: 'consistent', tempF: highF }
  }

  // Return high/low range (AC1)
  return { status: 'range', highF, lowF }
}

/**
 * Formats temperature range result into human-readable text
 *
 * @param result - Temperature range calculation result
 * @returns Formatted string for display
 */
export const formatTempRange = (result: TempRangeResult): string => {
  switch (result.status) {
    case 'unavailable':
      return 'Temperature data unavailable'
    case 'consistent':
      return `Around ${result.tempF}°F`
    case 'range':
      return `High ${result.highF}°F / Low ${result.lowF}°F`
  }
}

/**
 * Checks if a temperature result has extreme values
 * (below 40F for cold, above 90F for hot)
 */
export const hasExtremeTemp = (result: TempRangeResult): 'cold' | 'hot' | null => {
  if (result.status === 'unavailable') {
    return null
  }

  if (result.status === 'consistent') {
    const { tempF } = result
    if (tempF < 40) return 'cold'
    if (tempF > 90) return 'hot'
    return null
  }

  const { highF, lowF } = result

  if (lowF < 40) return 'cold'
  if (highF > 90) return 'hot'

  return null
}

/**
 * Main function to calculate and format temperature range
 *
 * @param overlay - Temperature overlay data
 * @returns Formatted temperature range string
 */
export const getTempRangeDisplay = (overlay: TemperatureOverlay | undefined): string => {
  const result = calculateTempRange(overlay)
  return formatTempRange(result)
}
