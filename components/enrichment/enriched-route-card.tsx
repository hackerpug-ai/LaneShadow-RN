/**
 * EnrichedRouteCard Component
 *
 * Wrapper around RouteOptionCard that adds enrichment status indicator
 * Displays enrichment progress when pending/running
 * Shows error state with retry option when enrichment fails
 *
 * Per spec requirements:
 * - Given User views route options, When enrichment status changes, Then UI updates reactively
 * - Given Enrichment running, When status updates, Then Progressive indicator shows current phase
 * - Given Enrichment completes, When results ready, Then Labels update with rich content
 * - Given Enrichment fails, When error occurs, Then Error indicator shown with retry option
 */

import type { Id } from '../../convex/_generated/dataModel'
import { useMemo } from 'react'
import { RouteOptionCard } from '../ui/route-option-card'
import type { RouteOptionCardProps } from '../ui/route-option-card'
import { EnrichmentStatusIndicator } from '../planning/enrichment-status-indicator'
import { useEnrichmentStatus } from '../../hooks/use-enrichment-status'

/**
 * Props for EnrichedRouteCard
 * Extends RouteOptionCardProps with routePlanId for enrichment tracking
 */
export interface EnrichedRouteCardProps extends RouteOptionCardProps {
  /** Route plan ID for enrichment tracking */
  routePlanId: Id<'route_plans'> | null | undefined
  /** Optional callback for retry on enrichment failure */
  onEnrichmentRetry?: () => void
}

/**
 * EnrichedRouteCard component
 *
 * Wraps RouteOptionCard with enrichment status indicator
 * Shows enrichment progress when pending/running
 * Hides indicator when enrichment completes (per spec)
 */
export const EnrichedRouteCard = ({
  routePlanId,
  onEnrichmentRetry,
  ...routeCardProps
}: EnrichedRouteCardProps): React.ReactNode => {
  // Track enrichment status for this route plan
  const { enrichment } = useEnrichmentStatus(routePlanId)

  // Determine if we should show enrichment indicator
  const showEnrichmentIndicator = useMemo(() => {
    if (!enrichment) return false
    // Show indicator for pending, running, or failed status
    // Hide for completed or cancelled (per spec)
    return ['pending', 'running', 'failed'].includes(enrichment.status)
  }, [enrichment])

  // Merge enrichment results into weather summary when available
  const enrichedWeatherSummary = useMemo(() => {
    if (!enrichment?.enrichments || enrichment.status !== 'completed') {
      return routeCardProps.weatherSummary
    }

    // Find enrichment for this route option (by matching name)
    const routeEnrichment = enrichment.enrichments.find((e) =>
      e.label.toLowerCase().includes(routeCardProps.name.toLowerCase())
    )

    // If we have enrichment data, prefer it
    if (routeEnrichment) {
      // Merge highlights with existing weather summary
      const highlightsText = routeEnrichment.highlights.length > 0
        ? routeEnrichment.highlights.slice(0, 2).join(' • ')
        : null

      return highlightsText || routeCardProps.weatherSummary
    }

    return routeCardProps.weatherSummary
  }, [enrichment, routeCardProps.name, routeCardProps.weatherSummary])

  // Map enrichment status to EnrichmentStatusIndicator status format
  const indicatorStatus = useMemo(() => {
    if (!enrichment) return 'pending' as const
    if (enrichment.status === 'running') {
      return enrichment.phase === 'fast' ? ('running-fast' as const) : ('running-extended' as const)
    }
    return enrichment.status as 'completed' | 'failed' | 'cancelled' | 'pending'
  }, [enrichment])

  return (
    <>
      {/* Enrichment indicator (shown above card) */}
      {showEnrichmentIndicator && (
        <EnrichmentStatusIndicator
          status={indicatorStatus}
          phase={enrichment!.phase}
          error={enrichment!.error}
          onPress={onEnrichmentRetry}
          variant="inline"
          testID={`enrichment-indicator-${routeCardProps.name}`}
        />
      )}

      {/* Route option card with potentially enriched weather summary */}
      <RouteOptionCard
        {...routeCardProps}
        weatherSummary={enrichedWeatherSummary}
      />
    </>
  )
}
