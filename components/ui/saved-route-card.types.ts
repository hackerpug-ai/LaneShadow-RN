/**
 * Type definitions for SavedRouteCard
 */

export type SavedRouteCardProps = {
  /** Route name */
  name: string
  /** Route path (origin → destination) */
  path: string
  /** Pre-formatted date string (e.g., 'Mar 15, 2026') */
  dateSaved?: string
  /** Duration stat */
  duration?: string
  /** Distance stat */
  distance?: string
  /** Optional press handler */
  onPress?: () => void
  /** Thumbnail rotation */
  thumbnailRotation?: number
}
