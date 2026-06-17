/**
 * Type definitions for SavedRouteCard
 */

import type { Bounds } from '../../shared/models/saved-routes'

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
  /** Route bounds for thumbnail rendering */
  bounds?: Bounds
  /** Thumbnail rotation (deprecated - use bounds instead) */
  thumbnailRotation?: number
}
