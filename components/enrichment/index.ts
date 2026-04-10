/**
 * Enrichment components barrel export
 *
 * Components:
 * - EnrichedRouteCard: Route card with enrichment status
 * - EnrichmentProgressProvider: Context provider for enrichment progress
 * - EnrichmentStatusBadge: Badge showing enrichment status (draft/partial/complete/failed)
 * - ProgressiveEnhancementToast: Floating glassmorphic toast with progress bar
 * - CreativeLabelFadeIn: Animated fade-in for creative route labels
 * - RationaleReveal: Expandable rationale text with fade-in
 * - HighlightTagsStagger: Staggered fade-in for highlight tags
 */

export { EnrichedRouteCard } from './enriched-route-card'
export type { EnrichedRouteCardProps } from './enriched-route-card'

export { EnrichmentProgressProvider, useEnrichmentProgress } from './enrichment-progress-provider'
export type {
  EnrichmentProgress,
  EnrichmentProgressProviderProps,
  EnrichmentProgressContextValue,
  EnrichmentStage,
  EnrichmentStatus as EnrichmentProgressStatus,
} from './enrichment-progress-provider'

export { EnrichmentStatusBadge } from './enrichment-status-badge'
export type { EnrichmentStatusBadgeProps } from './enrichment-status-badge'

export { ProgressiveEnhancementToast } from './progressive-enhancement-toast'
export type { ProgressiveEnhancementToastProps } from './progressive-enhancement-toast'

export { CreativeLabelFadeIn } from './creative-label-fade-in'
export type { CreativeLabelFadeInProps } from './creative-label-fade-in'

export { RationaleReveal } from './rationale-reveal'
export type { RationaleRevealProps } from './rationale-reveal'

export { HighlightTagsStagger } from './highlight-tags-stagger'
export type { HighlightTagsStaggerProps, HighlightTag } from './highlight-tags-stagger'
