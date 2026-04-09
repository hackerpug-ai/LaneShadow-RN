import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

/**
 * Model download progress state
 */
export type DownloadState = 'idle' | 'downloading' | 'completed' | 'failed' | 'cancelled'

export interface DownloadProgress {
  state: DownloadState
  progressPercent: number // 0-100
  bytesDownloaded: number
  totalBytes: number
  version: string
  lastUpdate: number
  checksum?: string
  error?: string
}

type DownloadStoreState = DownloadProgress & {
  // Actions
  startDownload: (version: string, totalBytes: number) => void
  updateProgress: (bytesDownloaded: number, totalBytes: number) => void
  completeDownload: (checksum: string, totalBytes: number) => void
  failDownload: (error: string) => void
  cancelDownload: () => void
  resetDownload: () => void
  _hydrated: boolean
}

/**
 * Download progress store managed by Zustand with AsyncStorage persist.
 *
 * Download progress persists across app restarts via AsyncStorage.
 * This enables resume capability after app termination or crashes.
 *
 * CLR-004: Model Download Persistence
 */
export const useDownloadStore = create<DownloadStoreState>()(
  persist(
    (set) => ({
      // Initial state
      state: 'idle',
      progressPercent: 0,
      bytesDownloaded: 0,
      totalBytes: 0,
      version: '',
      lastUpdate: 0,
      _hydrated: false,

      // Actions
      startDownload: (version, totalBytes) =>
        set({
          state: 'downloading',
          progressPercent: 0,
          bytesDownloaded: 0,
          totalBytes,
          version,
          lastUpdate: Date.now(),
          error: undefined,
        }),

      updateProgress: (bytesDownloaded, totalBytes) =>
        set((state) => {
          const progressPercent = Math.floor((bytesDownloaded / totalBytes) * 100)
          return {
            progressPercent,
            bytesDownloaded,
            totalBytes,
            lastUpdate: Date.now(),
          }
        }),

      completeDownload: (checksum, totalBytes) =>
        set({
          state: 'completed',
          progressPercent: 100,
          bytesDownloaded: totalBytes,
          totalBytes,
          checksum,
          lastUpdate: Date.now(),
        }),

      failDownload: (error) =>
        set({
          state: 'failed',
          error,
          lastUpdate: Date.now(),
        }),

      cancelDownload: () =>
        set({
          state: 'cancelled',
          lastUpdate: Date.now(),
        }),

      resetDownload: () =>
        set({
          state: 'idle',
          progressPercent: 0,
          bytesDownloaded: 0,
          totalBytes: 0,
          version: '',
          lastUpdate: 0,
          checksum: undefined,
          error: undefined,
        }),
    }),
    {
      name: 'laneshadow-model-download',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        // Mark as hydrated after rehydration completes
        state._hydrated = true
      },
      partialize: (state) => {
        // Don't persist the _hydrated flag itself
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _hydrated, ...rest } = state
        return rest
      },
    }
  )
)
