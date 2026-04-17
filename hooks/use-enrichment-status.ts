/**
 * useEnrichmentStatus - Hook for tracking enrichment status for route plans
 *
 * Queries route_enrichments table and provides reactive status updates
 * for route option cards to display enrichment progress
 */

import { useQuery } from 'convex/react'
import { useMemo } from 'react'
import { api } from '../convex/_generated/api'
import type { Id } from '../convex/_generated/dataModel'

/**
 * Enrichment status types matching the backend schema
 */
export type EnrichmentStatus = 'pending' | 'running' | 'completed' | 'cancelled' | 'failed'

/**
 * Enrichment phase types
 */
export type EnrichmentPhase = 'fast' | 'extended'

/**
 * Enrichment data returned from the hook
 */
export interface EnrichmentData {
  status: EnrichmentStatus
  phase: EnrichmentPhase
  enrichments?: {
    routeOptionId: string
    label: string
    rationale: string
    highlights: string[]
    elevation?: unknown
    weather?: unknown
  }[]
  error?: string
}

/**
 * Result type for useEnrichmentStatus hook
 */
export interface UseEnrichmentStatusResult {
  enrichment: EnrichmentData | null
  isLoading: boolean
  isError: boolean
}

/**
 * Hook to track enrichment status for a route plan
 *
 * Usage:
 * ```tsx
 * const { enrichment } = useEnrichmentStatus(routePlanId)
 *
 * if (enrichment?.status === 'running') {
 *   return <EnrichmentIndicator status="running" phase={enrichment.phase} />
 * }
 * ```
 */
export const useEnrichmentStatus = (
  routePlanId: Id<'route_plans'> | null | undefined,
): UseEnrichmentStatusResult => {
  // Query enrichment record for this route plan
  const enrichmentRecord = useQuery(
    api.db.routeEnrichments.getByRoutePlanId,
    routePlanId ? { routePlanId } : 'skip',
  )

  // Transform backend data to hook format (memoized for stability)
  const enrichmentData = useMemo<EnrichmentData | null>(() => {
    if (!enrichmentRecord) return null

    return {
      status: enrichmentRecord.status as EnrichmentStatus,
      phase: enrichmentRecord.phase as EnrichmentPhase,
      enrichments: enrichmentRecord.enrichments,
      error: enrichmentRecord.error ?? undefined,
    }
  }, [enrichmentRecord])

  return {
    enrichment: enrichmentData,
    isLoading: false, // Query is reactive (no loading state needed)
    isError: enrichmentRecord?.status === 'failed',
  }
}
