/**
 * Date Formatting Utilities
 *
 * Shared date formatters for consistent relative date displays
 * Used across feed, reports, and detail views
 */

import { format } from 'date-fns'

/**
 * Format relative date - Full version
 * Returns: "Just now", "5 minutes ago", "2 hours ago", "Yesterday", "Monday", "March 15, 2024"
 */
export const formatRelativeDate = (ms: number): string => {
  const date = new Date(ms)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  // Within the last hour
  if (diffMinutes < 60) {
    if (diffMinutes <= 1) return 'Just now'
    return `${diffMinutes} minutes ago`
  }

  // Within the last 24 hours
  if (diffHours < 24) {
    if (diffHours === 1) return '1 hour ago'
    return `${diffHours} hours ago`
  }

  // Yesterday
  if (diffDays === 1) return 'Yesterday'

  // Within the last week
  if (diffDays < 7) return format(date, 'EEEE') // Day name

  // Older
  return format(date, 'MMMM d, yyyy')
}

/**
 * Format relative date - Short version
 * Returns: "Just now", "5m ago", "2h ago", "Yesterday", "Mon", "Mar 15"
 */
export const formatRelativeDateShort = (ms: number): string => {
  const date = new Date(ms)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  // Within the last hour
  if (diffMinutes < 60) {
    if (diffMinutes <= 1) return 'Just now'
    return `${diffMinutes}m ago`
  }

  // Within the last 24 hours
  if (diffHours < 24) {
    return `${diffHours}h ago`
  }

  // Yesterday
  if (diffDays === 1) return 'Yesterday'

  // Within the last week
  if (diffDays < 7) return format(date, 'EEEE') // Day name

  // Older
  return format(date, 'MMM d, yyyy')
}
