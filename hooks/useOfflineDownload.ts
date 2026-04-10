/**
 * React hook for offline download state management.
 *
 * Provides reactive access to download progress, queue status,
 * and region metadata.
 */

import { useCallback, useEffect, useState } from 'react'
import {
  offlineRegionManager,
  type DownloadProgress,
  type DownloadState,
  type RegionBounds,
  type RegionMetadata,
  WiFiRequiredError,
  StorageExceededError,
  InvalidBoundsError,
} from '../lib/mapbox/offline-manager'

export interface OfflineDownloadState {
  /** Current download progress (null if no active download) */
  progress: DownloadProgress | null
  /** All downloaded region metadata */
  regions: RegionMetadata[]
  /** Download queue status */
  queueStatus: { status: string; pendingCount: number; queuedIds: string[] }
  /** Total storage used by offline regions */
  totalStorageUsed: number
  /** Error from last download attempt */
  error: Error | null
  /** Whether a download is in progress */
  isDownloading: boolean
}

export function useOfflineDownload() {
  const [progress, setProgress] = useState<DownloadProgress | null>(null)
  const [regions, setRegions] = useState<RegionMetadata[]>([])
  const [error, setError] = useState<Error | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const refreshRegions = useCallback(() => {
    setRegions(offlineRegionManager.getRegionMetadata())
  }, [])

  // Subscribe to progress updates
  useEffect(() => {
    // The progress callbacks are managed per-download in the manager
    // This hook tracks the most recent progress
    refreshRegions()
  }, [refreshRegions])

  const downloadRegion = useCallback(
    async (params: {
      name: string
      bounds: RegionBounds
      styleURL: string
      minZoom: number
      maxZoom: number
    }) => {
      setError(null)
      setIsDownloading(true)

      try {
        await offlineRegionManager.downloadRegion({
          ...params,
          onProgress: (p) => {
            setProgress(p)
            if (p.state === 'complete' || p.state === 'failed') {
              setIsDownloading(false)
              refreshRegions()
            }
          },
        })
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)))
        setIsDownloading(false)
      }
    },
    [refreshRegions],
  )

  const deleteRegion = useCallback(
    async (name: string) => {
      await offlineRegionManager.deletePack(name)
      refreshRegions()
    },
    [refreshRegions],
  )

  const pauseDownload = useCallback(async (name: string) => {
    await offlineRegionManager.pauseDownload(name)
  }, [])

  const resumeDownload = useCallback(async (name: string) => {
    await offlineRegionManager.resumeDownload(name)
  }, [])

  return {
    progress,
    regions,
    error,
    isDownloading,
    queueStatus: offlineRegionManager.getQueueStatus(),
    totalStorageUsed: offlineRegionManager.getTotalStorageUsed(),
    downloadRegion,
    deleteRegion,
    pauseDownload,
    resumeDownload,
    refreshRegions,
  } satisfies OfflineDownloadState & {
    downloadRegion: typeof downloadRegion
    deleteRegion: typeof deleteRegion
    pauseDownload: typeof pauseDownload
    resumeDownload: typeof resumeDownload
    refreshRegions: typeof refreshRegions
  }
}
