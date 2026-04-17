/**
 * Skeleton Loading Components
 *
 * Barrel export for all skeleton loading components used for
 * progressive enhancement UI.
 *
 * Components:
 * - LabelSkeleton: Shimmer effect for text placeholders (short/medium/long)
 * - WeatherBadgeSkeleton: Pulse animation for weather badge placeholders
 * - CardSkeleton: Shimmer effect for card content placeholders
 * - RouteDetailsSkeleton: Multi-section skeleton for route details
 * - SkeletonWrapper: HOC for wrapping content with skeleton + fade transitions
 */

export type { CardSkeletonProps } from './card-skeleton'
export { CardSkeleton } from './card-skeleton'
export type { LabelSkeletonProps, LabelSkeletonWidth } from './label-skeleton'
export { LabelSkeleton } from './label-skeleton'
export type { RouteDetailsSkeletonProps } from './route-details-skeleton'
export { RouteDetailsSkeleton } from './route-details-skeleton'
export type { SkeletonWrapperProps } from './skeleton-wrapper'
export { SkeletonWrapper } from './skeleton-wrapper'
export type { WeatherBadgeSkeletonProps } from './weather-badge-skeleton'
export { WeatherBadgeSkeleton } from './weather-badge-skeleton'
