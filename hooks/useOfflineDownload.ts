/**
 * React hook for offline download state management.
 *
 * Backward-compat shim over `useOfflineStore` (Zustand).
 * Prefer using `useOfflineStore` directly in new code.
 */

import type { DownloadProgress, RegionBounds, RegionMetadata } from '../stores/offline-store'
import { getTotalStorageUsed, useOfflineStore } from '../stores/offline-store'

export type { DownloadProgress, OfflineDownloadState, RegionBounds, RegionMetadata }

interface OfflineDownloadState {
  progress: DownloadProgress | null
  regions: RegionMetadata[]
  queueStatus: { status: string; pendingCount: number; queuedIds: string[] }
  totalStorageUsed: number
  error: Error | null
  isDownloading: boolean
}

export function useOfflineDownload() {
  const store = useOfflineStore()

  return {
    progress: store.progress,
    regions: store.regions,
    error: store.error,
    isDownloading: store.isDownloading,
    totalStorageUsed: getTotalStorageUsed(),
    queueStatus: { status: 'idle', pendingCount: 0, queuedIds: [] },
    downloadRegion: store.downloadRegion,
    deleteRegion: store.deleteRegion,
    renameRegion: store.renameRegion,
    pauseDownload: async () => {},
    resumeDownload: async () => {},
    refreshRegions: () => {},
  } satisfies OfflineDownloadState & {
    downloadRegion: typeof store.downloadRegion
    deleteRegion: typeof store.deleteRegion
    renameRegion: typeof store.renameRegion
    pauseDownload: () => Promise<void>
    resumeDownload: () => Promise<void>
    refreshRegions: () => void
  }
}
