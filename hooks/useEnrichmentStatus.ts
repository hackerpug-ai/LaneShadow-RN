/**
 * React hook for reactive enrichment status tracking.
 *
 * Integrates with EnrichmentProgressProvider context and provides
 * computed progress, estimated time remaining, and a retry function.
 * Triggers toast callback only on complete (not partial).
 * Cleans up interval on unmount.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  type EnrichmentStatus,
  useEnrichmentProgress,
} from '../components/enrichment/enrichment-progress-provider'
import { calculateProgress, estimateTimeRemaining } from '../shared/lib/enrichment/status-tracker'
import { shouldShowToast } from '../shared/lib/enrichment/toast-notifications'

export type { EnrichmentStatus }

export interface UseEnrichmentStatusResult {
  status: EnrichmentStatus
  progress: number
  estimatedTimeRemaining: number
  error?: Error
  retry: () => void
}

export interface UseEnrichmentStatusOptions {
  /** Called only when status transitions to 'complete' */
  onComplete?: () => void
}

const TICK_INTERVAL_MS = 100

export function useEnrichmentStatus(
  options?: UseEnrichmentStatusOptions,
): UseEnrichmentStatusResult {
  const { progress: contextProgress, updateProgress } = useEnrichmentProgress()

  const status = contextProgress.status
  const phaseStartTime =
    contextProgress.progress > 0 ? Date.now() - (contextProgress.progress / 100) * 3900 : null

  // Local reactive state for live progress updates
  const [liveProgress, setLiveProgress] = useState(() =>
    calculateProgress(status === 'failed' ? 'error' : status, phaseStartTime),
  )
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(() =>
    estimateTimeRemaining(status === 'failed' ? 'error' : status, phaseStartTime),
  )
  const [error, setError] = useState<Error | undefined>()

  // Track previous status for toast logic
  const prevStatusRef = useRef<EnrichmentStatus>(status)

  // Tick interval for live progress updates during active enrichment
  useEffect(() => {
    const normalizedStatus = status === 'failed' ? 'error' : status

    setLiveProgress(calculateProgress(normalizedStatus, phaseStartTime))
    setEstimatedTimeRemaining(estimateTimeRemaining(normalizedStatus, phaseStartTime))

    if (normalizedStatus !== 'partial' && normalizedStatus !== 'draft') {
      return
    }

    const interval = setInterval(() => {
      setLiveProgress(calculateProgress(normalizedStatus, phaseStartTime))
      setEstimatedTimeRemaining(estimateTimeRemaining(normalizedStatus, phaseStartTime))
    }, TICK_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [status, phaseStartTime])

  // Toast callback: only fires on transition to 'complete'
  useEffect(() => {
    const prevStatus = prevStatusRef.current
    prevStatusRef.current = status

    if (
      shouldShowToast(
        prevStatus === 'failed' ? 'error' : prevStatus,
        status === 'failed' ? 'error' : status,
      )
    ) {
      options?.onComplete?.()
    }
  }, [status, options])

  // Retry: reset to partial status
  const retry = useCallback(() => {
    setError(undefined)
    updateProgress({ status: 'partial', progress: 50 })
  }, [updateProgress])

  return {
    status,
    progress: liveProgress,
    estimatedTimeRemaining,
    error,
    retry,
  }
}
