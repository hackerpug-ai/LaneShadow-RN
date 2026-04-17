/**
 * Persistent Model Download Manager
 *
 * Handles downloading ML models with progress persistence across app restarts.
 * Uses Zustand with AsyncStorage for local state persistence and atomic file writes for crash safety.
 *
 * CLR-004: Model Download Persistence
 */

import * as FileSystem from 'expo-file-system/legacy'
import { useDownloadStore } from '../../stores/download-store'
import { atomicWrite, verifyFile } from './atomic-write'
import type { DownloadResult, ModelConfig, NetworkStatus } from './types'

/**
 * Download progress callback
 */
export type ProgressCallback = (progress: {
  percent: number
  downloadedBytes: number
  totalBytes: number
}) => void

/**
 * Persistent download manager with resume support
 */
export class PersistentDownloadManager {
  private downloadDirectory: string
  private currentDownload: {
    url: string
    filePath: string
    totalBytes: number
    version: string
    abortController: AbortController
  } | null = null

  constructor() {
    this.downloadDirectory = `${FileSystem.documentDirectory!}models/`
    this.ensureDirectoryExists()
  }

  /**
   * Check for existing download progress from Zustand store
   */
  checkExistingProgress(): {
    canResume: boolean
    progress?: { percent: number; downloadedBytes: number; totalBytes: number; version: string }
  } {
    const state = useDownloadStore.getState()

    // Check if there's a resumable download (downloading state OR partial progress)
    const canResume =
      state.state === 'downloading' ||
      (state.state === 'failed' && state.lastError?.retryable && state.progressPercent > 0) ||
      (state.progressPercent > 0 && state.progressPercent < 100)

    if (canResume) {
      return {
        canResume: true,
        progress: {
          percent: state.progressPercent,
          downloadedBytes: state.bytesDownloaded,
          totalBytes: state.totalBytes,
          version: state.version,
        },
      }
    }

    return { canResume: false }
  }

  /**
   * Start or resume model download
   *
   * @param config - Model configuration
   * @param networkStatus - Current network status
   * @param onProgress - Progress callback
   * @returns Download result
   */
  async downloadModel(
    config: ModelConfig,
    networkStatus: NetworkStatus,
    onProgress?: ProgressCallback,
  ): Promise<DownloadResult> {
    // Validate WiFi requirement
    if (!this.isOnWiFi(networkStatus)) {
      return {
        success: false,
        downloadedBytes: 0,
        error: 'Model download requires WiFi connection',
      }
    }

    try {
      // Check available storage space
      const storageInfo = await FileSystem.getFreeDiskStorageAsync()
      const MIN_REQUIRED_BYTES = 2 * 1024 * 1024 * 1024 // 2GB

      if (storageInfo < MIN_REQUIRED_BYTES) {
        const availableGB = (storageInfo / (1024 * 1024 * 1024)).toFixed(2)
        return {
          success: false,
          downloadedBytes: 0,
          error: `Not enough storage. Need 2GB free space. Available: ${availableGB} GB`,
        }
      }

      // Check for existing progress (resume support)
      const existingProgress = this.checkExistingProgress()
      let startByte = 0

      if (existingProgress.canResume && existingProgress.progress) {
        // Verify existing file
        const fileName = this.getFileNameFromUrl(config.url)
        const filePath = `${this.downloadDirectory}${fileName}`

        const fileInfo = await FileSystem.getInfoAsync(filePath)
        if (fileInfo.exists && existingProgress.progress.downloadedBytes > 0) {
          startByte = existingProgress.progress.downloadedBytes
          console.log('[PersistentDownloadManager] Resuming download from byte:', startByte)
        }
      }

      // Generate file path
      const fileName = this.getFileNameFromUrl(config.url)
      const filePath = `${this.downloadDirectory}${fileName}`

      // Set up abort controller for this download
      const abortController = new AbortController()
      this.currentDownload = {
        url: config.url,
        filePath,
        totalBytes: config.totalBytes || 0,
        version: config.version,
        abortController,
      }

      // Initialize download state in store
      useDownloadStore.getState().startDownload(config.version, config.totalBytes || 0)

      // Perform download
      const result =
        startByte > 0
          ? await this.resumeDownload(filePath, startByte, config, onProgress)
          : await this.freshDownload(filePath, config, onProgress)

      this.currentDownload = null
      return result
    } catch (error) {
      this.currentDownload = null

      // Mark download as failed in store
      const errorMessage = error instanceof Error ? error.message : 'Unknown download error'
      useDownloadStore.getState().failDownload(errorMessage)

      return {
        success: false,
        downloadedBytes: 0,
        error: errorMessage,
      }
    }
  }

  /**
   * Fresh download from beginning
   */
  private async freshDownload(
    filePath: string,
    config: ModelConfig,
    onProgress?: ProgressCallback,
  ): Promise<DownloadResult> {
    console.log('[PersistentDownloadManager] Starting fresh download')

    try {
      // Create a DownloadResumable for progress tracking
      const downloadResumable = FileSystem.createDownloadResumable(
        config.url,
        filePath,
        {},
        (data) => this.handleProgress(data, config, onProgress),
      )

      // Start the download
      const result = await downloadResumable.downloadAsync()

      if (!result || result.status !== 200) {
        throw new Error(`Download failed with status ${result?.status}`)
      }

      // Verify file size
      const fileInfo = await FileSystem.getInfoAsync(filePath)
      const finalBytes = (fileInfo as any).size || 0

      return {
        success: true,
        filePath,
        downloadedBytes: finalBytes,
      }
    } catch (error) {
      // Clean up partial file on failure
      await this.deleteFile(filePath)
      throw error
    }
  }

  /**
   * Resume existing download
   */
  private async resumeDownload(
    filePath: string,
    startByte: number,
    config: ModelConfig,
    onProgress?: ProgressCallback,
  ): Promise<DownloadResult> {
    console.log('[PersistentDownloadManager] Resuming download from byte:', startByte)

    try {
      // Create a DownloadResumable with Range header for resume
      const downloadResumable = FileSystem.createDownloadResumable(
        config.url,
        filePath,
        {
          headers: {
            Range: `bytes=${startByte}-`,
          },
        },
        (data) => this.handleProgress(data, config, onProgress, startByte),
      )

      // Resume the download
      const result = await downloadResumable.downloadAsync()

      if (!result || (result.status !== 206 && result.status !== 200)) {
        throw new Error(`Resume failed with status ${result?.status}`)
      }

      // Verify final file size
      const fileInfo = await FileSystem.getInfoAsync(filePath)
      const finalBytes = (fileInfo as any).size || 0

      return {
        success: true,
        filePath,
        downloadedBytes: finalBytes,
      }
    } catch (error) {
      throw error
    }
  }

  /**
   * Handle download progress updates
   *
   * Updates Zustand store to persist progress locally.
   */
  private handleProgress(
    data: { totalBytesWritten: number; totalBytesExpectedToWrite: number },
    config: ModelConfig,
    onProgress?: ProgressCallback,
    offset: number = 0,
  ): void {
    const downloadedBytes = data.totalBytesWritten + offset
    // Use config.totalBytes as the authoritative total — the server's
    // totalBytesExpectedToWrite can differ (gzip, chunked encoding, partial responses)
    const totalBytes = config.totalBytes || data.totalBytesExpectedToWrite || downloadedBytes

    // Update local callback
    onProgress?.({
      percent: Math.min(100, Math.floor((downloadedBytes / totalBytes) * 100)),
      downloadedBytes,
      totalBytes,
    })

    // Update Zustand store (persists to AsyncStorage automatically)
    useDownloadStore.getState().updateProgress(downloadedBytes, totalBytes)
  }

  /**
   * Mark download as complete with checksum
   *
   * Called after successful download and checksum validation.
   */
  markComplete(checksum: string, totalBytes: number): void {
    useDownloadStore.getState().completeDownload(checksum, totalBytes)
    console.log('[PersistentDownloadManager] Download marked complete')
  }

  /**
   * Reset download progress
   *
   * Used when starting over or clearing corrupted state.
   */
  resetProgress(): void {
    useDownloadStore.getState().resetDownload()
    console.log('[PersistentDownloadManager] Download progress reset')
  }

  /**
   * Cancel current download
   */
  cancelDownload(): void {
    if (this.currentDownload) {
      this.currentDownload.abortController.abort()
      this.currentDownload = null

      // Update store to cancelled state
      useDownloadStore.getState().cancelDownload()

      console.log('[PersistentDownloadManager] Download cancelled')
    }
  }

  /**
   * Check if device is on WiFi
   */
  private isOnWiFi(networkStatus: NetworkStatus): boolean {
    return networkStatus.isConnected && networkStatus.type === 'wifi'
  }

  /**
   * Ensure download directory exists
   */
  private async ensureDirectoryExists(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.downloadDirectory)
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.downloadDirectory, { intermediates: true })
      }
    } catch (error) {
      console.error('[PersistentDownloadManager] Failed to create download directory:', error)
    }
  }

  /**
   * Get file name from URL
   */
  private getFileNameFromUrl(url: string): string {
    const urlParts = url.split('/')
    return urlParts[urlParts.length - 1] || 'model.bin'
  }

  /**
   * Helper function for safe file deletion
   */
  private async deleteFile(filePath: string): Promise<void> {
    try {
      await FileSystem.deleteAsync(filePath, { idempotent: true })
    } catch (error) {
      console.error('[PersistentDownloadManager] Failed to delete file:', error)
    }
  }
}
