/**
 * Background Download Service
 *
 * Manages model downloads that continue when the app is backgrounded.
 * Uses Expo TaskManager and Notifications for background execution.
 *
 * Features:
 * - Continues downloads when app is backgrounded
 * - Posts progress notifications
 * - Handles app lifecycle events
 * - Recovers from app being killed
 */

import * as BackgroundFetch from 'expo-background-fetch'
import * as Notifications from 'expo-notifications'
import * as TaskManager from 'expo-task-manager'
import { AppState, type AppStateStatus } from 'react-native'
import { useDownloadStore } from '../../stores/download-store'
import { PersistentDownloadManager } from './persistent-download-manager'
import type { ModelConfig, NetworkStatus } from './types'

/**
 * Background task name for model downloads
 */
export const BACKGROUND_DOWNLOAD_TASK = 'BACKGROUND_MODEL_DOWNLOAD'

/**
 * Download notification channel ID
 */
export const DOWNLOAD_NOTIFICATION_CHANNEL = 'model-downloads'

/**
 * Progress update interval for background task (30 seconds)
 */
const BACKGROUND_TASK_INTERVAL = 30000

/**
 * Notification update threshold (10% progress)
 */
const NOTIFICATION_UPDATE_THRESHOLD = 10

/**
 * Background download service
 */
export class BackgroundDownloadService {
  private downloadManager: PersistentDownloadManager
  private lastNotificationProgress: number = 0
  private appStateSubscription: any
  private isInitialized: boolean = false

  constructor() {
    this.downloadManager = new PersistentDownloadManager()
  }

  /**
   * Initialize the background download service
   *
   * Must be called during app startup to register tasks and notifications.
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      // Register background task
      await this.registerBackgroundTask()

      // Setup notification channel
      await this.setupNotificationChannel()

      // Configure notification handler
      this.setupNotificationHandler()

      // Subscribe to app state changes
      this.subscribeToAppState()

      // Check for incomplete downloads on startup
      await this.checkForIncompleteDownloads()

      this.isInitialized = true
    } catch (error) {
      throw error
    }
  }

  /**
   * Register the background task with TaskManager
   */
  private async registerBackgroundTask(): Promise<void> {
    TaskManager.defineTask(BACKGROUND_DOWNLOAD_TASK, async ({ data, error }) => {
      try {
        if (error) {
          return
        }

        // Check if there's an active download
        const state = useDownloadStore.getState()

        if (state.state === 'downloading') {
          // Update notification with current progress
          await this.updateProgressNotification(
            state.progressPercent,
            state.bytesDownloaded,
            state.totalBytes,
          )

          // Check if download is complete
          if (state.progressPercent >= 100) {
            await this.showCompletionNotification()
            useDownloadStore.getState().completeDownload(state.checksum || '', state.totalBytes)
          }
        }

        return { success: true }
      } catch (_error) {
        return { success: false }
      }
    })
  }

  /**
   * Setup notification channel for Android
   */
  private async setupNotificationChannel(): Promise<void> {
    await Notifications.setNotificationChannelAsync(DOWNLOAD_NOTIFICATION_CHANNEL, {
      name: 'Model Downloads',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#B87333', // Copper
      sound: 'default',
    })
  }

  /**
   * Setup notification tap handler
   */
  private setupNotificationHandler(): void {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    })

    // Add notification response listener
    Notifications.addNotificationResponseReceivedListener((response) => {
      // Handle navigation to download screen
      // This will be implemented by the UI layer
    })
  }

  /**
   * Subscribe to app state changes
   */
  private subscribeToAppState(): void {
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange)
  }

  /**
   * Handle app state changes (foreground/background)
   */
  private handleAppStateChange = async (nextAppState: AppStateStatus): Promise<void> => {
    const state = useDownloadStore.getState()

    if (nextAppState === 'background' && state.state === 'downloading') {
      // Register background task when app goes to background
      try {
        const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_DOWNLOAD_TASK)
        if (!isRegistered) {
          // Register background fetch task
          await BackgroundFetch.registerTaskAsync(BACKGROUND_DOWNLOAD_TASK, {
            minimumInterval: BACKGROUND_TASK_INTERVAL / 1000, // Convert to seconds
            stopOnTerminate: false,
            startOnBoot: false,
          })

          // Mark as background task in store
          useDownloadStore
            .getState()
            .setBackgroundTask(BACKGROUND_DOWNLOAD_TASK, 'model-download-progress')
        }

        // Show initial notification
        await this.updateProgressNotification(
          state.progressPercent,
          state.bytesDownloaded,
          state.totalBytes,
        )
      } catch (_error) {}
    } else if (nextAppState === 'active') {
      // Unregister background task when app comes to foreground
      try {
        const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_DOWNLOAD_TASK)
        if (isRegistered) {
          await TaskManager.unregisterTaskAsync(BACKGROUND_DOWNLOAD_TASK)
        }

        // Dismiss progress notification
        await Notifications.dismissAllNotificationsAsync()
      } catch (_error) {}
    }
  }

  /**
   * Check for incomplete downloads on app startup
   */
  private async checkForIncompleteDownloads(): Promise<void> {
    const state = useDownloadStore.getState()

    if (state.state === 'downloading' && state.progressPercent < 100) {
      // Show notification to user about incomplete download
      await this.showResumeNotification(state.progressPercent)
    }
  }

  /**
   * Update progress notification
   */
  private async updateProgressNotification(
    progress: number,
    downloadedBytes: number,
    totalBytes: number,
  ): Promise<void> {
    // Only update if progress changed by at least NOTIFICATION_UPDATE_THRESHOLD
    if (Math.abs(progress - this.lastNotificationProgress) < NOTIFICATION_UPDATE_THRESHOLD) {
      return
    }

    this.lastNotificationProgress = progress

    const _downloadedMB = Math.round(downloadedBytes / (1024 * 1024))
    const _totalMB = Math.round(totalBytes / (1024 * 1024))
    const percent = Math.floor(progress)

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'LaneShadow',
        body: `Downloading your AI ride planner... ${percent}%`,
        data: {
          progress,
          downloadedBytes,
          totalBytes,
          type: 'download-progress',
        },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Show immediately
      identifier: 'model-download-progress',
    })
  }

  /**
   * Show completion notification
   */
  private async showCompletionNotification(): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '✨ Your Shadow is awake!',
        body: 'Model download complete. Start planning your next ride.',
        data: {
          type: 'download-complete',
        },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null,
      identifier: 'model-download-complete',
    })
  }

  /**
   * Show resume notification for incomplete download
   */
  private async showResumeNotification(progress: number): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚠️ Download interrupted',
        body: `Download paused at ${Math.floor(progress)}%. Tap to resume.`,
        data: {
          type: 'download-resume',
          progress,
        },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null,
      identifier: 'model-download-resume',
    })
  }

  /**
   * Start a new download with background support
   */
  async startDownload(
    config: ModelConfig,
    networkStatus: NetworkStatus,
    onProgress?: (progress: {
      percent: number
      downloadedBytes: number
      totalBytes: number
    }) => void,
  ): Promise<void> {
    try {
      // Initialize download in store
      useDownloadStore.getState().startDownload(config.version, config.totalBytes || 0)

      // Start download via persistent manager
      const result = await this.downloadManager.downloadModel(config, networkStatus, (progress) => {
        // Update store
        useDownloadStore.getState().updateProgress(progress.downloadedBytes, progress.totalBytes)

        // Call UI callback
        onProgress?.(progress)

        // Update notification if significant progress
        if (
          Math.abs(progress.percent - this.lastNotificationProgress) >=
          NOTIFICATION_UPDATE_THRESHOLD
        ) {
          this.updateProgressNotification(
            progress.percent,
            progress.downloadedBytes,
            progress.totalBytes,
          )
        }
      })

      if (!result.success) {
        throw new Error(result.error || 'Download failed')
      }

      // Mark complete
      useDownloadStore.getState().completeDownload('', result.downloadedBytes)

      // Show completion notification
      await this.showCompletionNotification()
    } catch (error) {
      useDownloadStore
        .getState()
        .failDownload(error instanceof Error ? error.message : 'Unknown download error')
      throw error
    }
  }

  /**
   * Cancel current download
   */
  async cancelDownload(): Promise<void> {
    this.downloadManager.cancelDownload()
    useDownloadStore.getState().cancelDownload()

    // Dismiss notifications
    await Notifications.dismissAllNotificationsAsync()
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove()
    }
  }
}

/**
 * Singleton instance
 */
let backgroundDownloadServiceInstance: BackgroundDownloadService | null = null

export function getBackgroundDownloadService(): BackgroundDownloadService {
  if (!backgroundDownloadServiceInstance) {
    backgroundDownloadServiceInstance = new BackgroundDownloadService()
  }
  return backgroundDownloadServiceInstance
}
