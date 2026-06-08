/**
 * Lightweight hook returning just calculated progress and estimated time remaining.
 *
 * Uses calculateProgress and estimateTimeRemaining from status-tracker.
 * Ticks at regular intervals during active enrichment phases.
 */

import { useEffect, useState } from 'react'
import {
  calculateProgress,
  estimateTimeRemaining,
} from '../server/lib/enrichment/status-tracker'
import { useEnrichmentProgress } from '../components/enrichment/enrichment-progress-provider'

export interface UseEnrichmentProgressCalculationResult {
  progress: number
  estimatedTimeRemaining: number
}

const TICK_INTERVAL_MS = 100

export function useEnrichmentProgressCalculation(): UseEnrichmentProgressCalculationResult {
  const { progress: contextProgress } = useEnrichmentProgress()

  const status = contextProgress.status === 'failed' ? 'error' : contextProgress.status
  const phaseStartTime =
    contextProgress.progress > 0 ? Date.now() - (contextProgress.progress / 100) * 3900 : null

  const [progress, setProgress] = useState(() => calculateProgress(status, phaseStartTime))
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(() =>
    estimateTimeRemaining(status, phaseStartTime),
  )

  useEffect(() => {
    setProgress(calculateProgress(status, phaseStartTime))
    setEstimatedTimeRemaining(estimateTimeRemaining(status, phaseStartTime))

    if (status !== 'partial' && status !== 'draft') {
      return
    }

    const interval = setInterval(() => {
      setProgress(calculateProgress(status, phaseStartTime))
      setEstimatedTimeRemaining(estimateTimeRemaining(status, phaseStartTime))
    }, TICK_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [status, phaseStartTime])

  return { progress, estimatedTimeRemaining }
}
