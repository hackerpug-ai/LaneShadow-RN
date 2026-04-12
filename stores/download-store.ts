import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

/**
 * Model download progress state
 */
export type DownloadState = 'idle' | 'downloading' | 'completed' | 'failed' | 'cancelled'

/**
 * Download error types
 */
export type DownloadErrorType = 'network' | 'storage' | 'checksum' | 'unknown'

/**
 * Download error metadata
 */
export interface DownloadError {
  type: DownloadErrorType
  message: string
  retryable: boolean
  timestamp: number
}

/**
 * Model metadata for local storage
 */
export interface ModelMetadata {
  version: string
  checksum: string
  downloadDate: number
  sizeBytes: number
  lastValidated: number
}

export interface DownloadProgress {
  state: DownloadState
  progressPercent: number // 0-100
  bytesDownloaded: number
  totalBytes: number
  version: string
  lastUpdate: number
  checksum?: string
  error?: string
  // NEW: Background support
  isBackgroundTask: boolean
  appStateOnStart: 'active' | 'background'
  notificationId?: string
  taskId?: string
  // NEW: Model metadata
  modelMetadata: ModelMetadata | null
  // NEW: Error recovery
  lastError: DownloadError | null
}

type DownloadStoreState = DownloadProgress & {
  // Actions
  startDownload: (version: string, totalBytes: number) => void
  updateProgress: (bytesDownloaded: number, totalBytes: number) => void
  completeDownload: (checksum: string, totalBytes: number) => void
  failDownload: (error: string, errorType?: DownloadErrorType) => void
  cancelDownload: () => void
  resetDownload: () => void
  // NEW: Background actions
  setBackgroundTask: (taskId: string, notificationId?: string) => void
  setAppStateOnStart: (appState: 'active' | 'background') => void
  clearBackgroundTask: () => void
  // NEW: Model metadata actions
  setModelMetadata: (metadata: ModelMetadata) => void
  clearModelMetadata: () => void
  // NEW: Dev menu actions
  clearModel: () => void
  resetSetup: () => void
  // NEW: Error recovery
  setError: (error: DownloadError) => void
  clearError: () => void
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
      // NEW: Background support
      isBackgroundTask: false,
      appStateOnStart: 'active',
      notificationId: undefined,
      taskId: undefined,
      // NEW: Model metadata
      modelMetadata: null,
      // NEW: Error recovery
      lastError: null,

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
          isBackgroundTask: false,
          appStateOnStart: 'active',
        }),

      updateProgress: (bytesDownloaded, totalBytes) =>
        set((state) => {
          const progressPercent = Math.min(100, Math.floor((bytesDownloaded / totalBytes) * 100))
          return {
            progressPercent,
            bytesDownloaded,
            totalBytes,
            lastUpdate: Date.now(),
          }
        }),

      completeDownload: (checksum, totalBytes) =>
        set((state) => ({
          state: 'completed',
          progressPercent: 100,
          bytesDownloaded: totalBytes,
          totalBytes,
          checksum,
          lastUpdate: Date.now(),
          // Save model metadata on completion
          modelMetadata: {
            version: state.version,
            checksum,
            downloadDate: Date.now(),
            sizeBytes: totalBytes,
            lastValidated: Date.now(),
          },
          // Clear background task
          isBackgroundTask: false,
          taskId: undefined,
          notificationId: undefined,
        })),

      failDownload: (error, errorType = 'unknown') =>
        set({
          state: 'failed',
          error,
          lastUpdate: Date.now(),
          lastError: {
            type: errorType,
            message: error,
            retryable: errorType === 'network' || errorType === 'storage',
            timestamp: Date.now(),
          },
        }),

      cancelDownload: () =>
        set({
          state: 'cancelled',
          lastUpdate: Date.now(),
          isBackgroundTask: false,
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
          isBackgroundTask: false,
          appStateOnStart: 'active',
          notificationId: undefined,
          taskId: undefined,
          modelMetadata: null,
          lastError: null,
        }),

      // NEW: Background actions
      setBackgroundTask: (taskId, notificationId) =>
        set({
          isBackgroundTask: true,
          taskId,
          notificationId,
        }),

      setAppStateOnStart: (appState) =>
        set({
          appStateOnStart: appState,
        }),

      clearBackgroundTask: () =>
        set({
          isBackgroundTask: false,
          taskId: undefined,
          notificationId: undefined,
        }),

      // NEW: Model metadata actions
      setModelMetadata: (metadata) =>
        set({
          modelMetadata: metadata,
        }),

      clearModelMetadata: () =>
        set({
          modelMetadata: null,
        }),

      // NEW: Dev menu actions
      clearModel: () =>
        set({
          modelMetadata: null,
          state: 'idle',
          progressPercent: 0,
          bytesDownloaded: 0,
          totalBytes: 0,
          version: '',
          checksum: undefined,
          error: undefined,
          lastUpdate: 0,
        }),

      resetSetup: () =>
        set({
          state: 'idle',
          progressPercent: 0,
          bytesDownloaded: 0,
          totalBytes: 0,
          version: '',
          checksum: undefined,
          error: undefined,
          lastUpdate: 0,
          modelMetadata: null,
          lastError: null,
        }),

      // NEW: Error recovery
      setError: (error) =>
        set({
          lastError: error,
        }),

      clearError: () =>
        set({
          lastError: null,
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
         
        const { _hydrated, ...rest } = state
        return rest
      },
    }
  )
)
