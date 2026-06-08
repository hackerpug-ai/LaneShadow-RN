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

export type { CreativeLabelFadeInProps } from './creative-label-fade-in'
export { CreativeLabelFadeIn } from './creative-label-fade-in'
export type { EnrichedRouteCardProps } from './enriched-route-card'
export { EnrichedRouteCard } from './enriched-route-card'
export type {
  EnrichmentProgress,
  EnrichmentProgressContextValue,
  EnrichmentProgressProviderProps,
  EnrichmentStage,
  EnrichmentStatus as EnrichmentProgressStatus,
} from './enrichment-progress-provider'
export { EnrichmentProgressProvider, useEnrichmentProgress } from './enrichment-progress-provider'
export type { EnrichmentStatusBadgeProps } from './enrichment-status-badge'
export { EnrichmentStatusBadge } from './enrichment-status-badge'
export type { HighlightTag, HighlightTagsStaggerProps } from './highlight-tags-stagger'
export { HighlightTagsStagger } from './highlight-tags-stagger'
export type { ProgressiveEnhancementToastProps } from './progressive-enhancement-toast'
export { ProgressiveEnhancementToast } from './progressive-enhancement-toast'
export type { RationaleRevealProps } from './rationale-reveal'
export { RationaleReveal } from './rationale-reveal'
