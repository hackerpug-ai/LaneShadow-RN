/**
 * Pure utility functions for the route detail screen.
 * Extracted for testability and to keep the screen file lean.
 */

import type { WindOverlay, WindSummary } from '../../../server/models/saved-routes'

/**
 * Derive worst wind summary from WindOverlay data.
 * Returns 'unavailable' if overlay is missing or empty.
 */
export const deriveWindSummary = (overlay?: WindOverlay): WindSummary => {
  if (!overlay?.byLeg?.length) return 'unavailable'

  const levels: string[] = []
  for (const leg of overlay.byLeg) {
    for (const segment of leg.segments) {
      levels.push(segment.level)
    }
  }

  if (levels.length === 0) return 'unavailable'
  if (levels.includes('high')) return 'high'
  if (levels.includes('moderate')) return 'moderate'
  if (levels.includes('low')) return 'low'

  return 'unavailable'
}

/**
 * Format distance in meters to human-readable miles string.
 */
export const formatDistance = (meters: number): string => {
  const miles = meters / 1609.344
  if (miles < 0.1) return `${meters}m`
  return `${miles.toFixed(1)} mi`
}

/**
 * Format duration in seconds to human-readable string.
 */
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.round((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes} min`
}

/**
 * Format a savedAt timestamp into a readable date string.
 */
export const formatSavedDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
