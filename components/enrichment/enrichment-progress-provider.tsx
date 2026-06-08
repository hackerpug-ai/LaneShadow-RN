/**
 * EnrichmentProgressProvider
 *
 * Context provider for enrichment progress state.
 * Tracks stages (draft -> partial -> complete), broadcasts progress to child
 * components, and manages toast visibility with auto-dismiss on completion.
 *
 * Accessibility:
 *   - Screen reader announcements on status transitions
 *   - Respects reduce-motion for auto-dismiss timing
 *
 * Following react-rules.md: named export, no unnecessary useCallback/useMemo.
 */

import type React from 'react'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { AccessibilityInfo } from 'react-native'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EnrichmentStatus = 'draft' | 'partial' | 'complete' | 'failed'

export interface EnrichmentStage {
  name: string
  complete: boolean
}

export interface EnrichmentProgress {
  routeId: string
  status: EnrichmentStatus
  stage: string
  progress: number // 0-100
  stages: EnrichmentStage[]
}

export interface EnrichmentProgressContextValue {
  /** Current enrichment progress state */
  progress: EnrichmentProgress
  /** Whether the toast is visible */
  toastVisible: boolean
  /** Update the enrichment progress */
  updateProgress: (update: Partial<EnrichmentProgress>) => void
  /** Dismiss the toast manually */
  dismissToast: () => void
  /** Show the toast */
  showToast: () => void
}

export interface EnrichmentProgressProviderProps {
  /** Route ID being enriched */
  routeId: string
  /** Initial progress state */
  initialProgress?: Partial<EnrichmentProgress>
  /** Auto-dismiss toast after completion (ms), default 3000 */
  autoDismissDelay?: number
  /** Children that can consume the context */
  children: React.ReactNode
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AUTO_DISMISS_DELAY_MS = 3000

const DEFAULT_STAGES: EnrichmentStage[] = [
  { name: 'Leg labels', complete: false },
  { name: 'Weather data', complete: false },
  { name: 'Elevation', complete: false },
  { name: 'Scenic analysis', complete: false },
]

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const EnrichmentProgressContext = createContext<EnrichmentProgressContextValue | null>(null)

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Hook to access enrichment progress from a descendant component.
 */
export const useEnrichmentProgress = (): EnrichmentProgressContextValue => {
  const context = useContext(EnrichmentProgressContext)
  if (!context) {
    throw new Error('useEnrichmentProgress must be used within an EnrichmentProgressProvider')
  }
  return context
}

// ---------------------------------------------------------------------------
// Accessibility announcements
// ---------------------------------------------------------------------------

const STATUS_ANNOUNCEMENTS: Record<EnrichmentStatus, string> = {
  draft: 'Route enrichment starting',
  partial: 'Route partially enriched',
  complete: 'Route enrichment complete',
  failed: 'Route enrichment failed',
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export const EnrichmentProgressProvider = ({
  routeId,
  initialProgress,
  autoDismissDelay = AUTO_DISMISS_DELAY_MS,
  children,
}: EnrichmentProgressProviderProps): React.ReactNode => {
  const [progress, setProgress] = useState<EnrichmentProgress>({
    routeId,
    status: initialProgress?.status ?? 'draft',
    stage: initialProgress?.stage ?? 'Preparing...',
    progress: initialProgress?.progress ?? 0,
    stages: initialProgress?.stages ?? DEFAULT_STAGES,
  })

  const [toastVisible, setToastVisible] = useState(false)

  // Auto-dismiss toast when enrichment completes
  useEffect(() => {
    if (progress.status === 'complete' && toastVisible) {
      const timer = setTimeout(() => {
        setToastVisible(false)
      }, autoDismissDelay)
      return () => clearTimeout(timer)
    }
  }, [progress.status, toastVisible, autoDismissDelay])

  // Announce status changes to screen readers
  useEffect(() => {
    const announcement = STATUS_ANNOUNCEMENTS[progress.status]
    if (announcement) {
      AccessibilityInfo.announceForAccessibility(announcement)
    }
  }, [progress.status])

  const updateProgress = useCallback((update: Partial<EnrichmentProgress>) => {
    setProgress((prev) => {
      const next = { ...prev, ...update }
      // Keep routeId immutable
      next.routeId = prev.routeId
      return next
    })
  }, [])

  const dismissToast = useCallback(() => {
    setToastVisible(false)
  }, [])

  const showToast = useCallback(() => {
    setToastVisible(true)
  }, [])

  const contextValue: EnrichmentProgressContextValue = {
    progress,
    toastVisible,
    updateProgress,
    dismissToast,
    showToast,
  }

  return (
    <EnrichmentProgressContext.Provider value={contextValue}>
      {children}
    </EnrichmentProgressContext.Provider>
  )
}

EnrichmentProgressProvider.displayName = 'EnrichmentProgressProvider'
