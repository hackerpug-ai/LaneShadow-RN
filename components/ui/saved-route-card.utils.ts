/**
 * Utility functions for SavedRouteCard
 */

/**
 * Format a timestamp into a readable date string (e.g., 'Mar 15, 2026')
 * Uses Intl.DateTimeFormat — no external date library needed.
 */
export const formatDate = (timestamp: number): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(timestamp))
}
