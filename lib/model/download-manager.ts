/**
 * Model Download Manager - Gatekeeper Integration
 *
 * Integrates the persistent download manager with the gatekeeper system.
 * Provides progress tracking and resume capability for model downloads.
 *
 * CLR-004: Model Download Persistence
 */

import { PersistentDownloadManager } from '../ai/persistent-download-manager'
import { ChecksumValidator } from '../ai/checksum'
import * as FileSystem from 'expo-file-system/legacy'
import { useDownloadStore } from '../../stores/download-store'

/**
 * Model download progress state
 */
export interface ModelDownloadProgress {
  state: 'downloading' | 'completed' | 'failed' | 'paused'
  progress: number // 0-100
  bytesDownloaded: number
  totalBytes: number
  estimatedTimeRemaining: number // seconds
  lastUpdated: number
  networkType: 'wifi' | 'cellular'
}

/**
 * Network status for download validation
 */
export interface NetworkStatus {
  isConnected: boolean
  type: 'wifi' | 'cellular' | 'none'
}

/**
 * Download manager class for gatekeeper integration
 *
 * This class provides the interface that the gatekeeper expects
 * for starting and managing model downloads with full persistence.
 */
export class GatekeeperDownloadManager {
  private persistentManager: PersistentDownloadManager
  private checksumValidator: ChecksumValidator
  private modelFilePath: string

  constructor() {
    this.persistentManager = new PersistentDownloadManager()
    this.checksumValidator = new ChecksumValidator()
    this.modelFilePath = `${FileSystem.documentDirectory!}models/qwen2.5-0.5b-instruct-q4_k_m.gguf`
  }

  /**
   * Start model download
   *
   * This method is called by the gatekeeper when the user
   * initiates the download flow.
   *
   * CLR-004: Implements full download with Zustand persistence
   */
  async startDownload(networkStatus?: NetworkStatus): Promise<void> {
    console.log('[GatekeeperDownloadManager] Starting model download...')

    try {
      // Model configuration (should come from app config/env)
      const config = {
        url: 'https://huggingface.co/bartowski/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/Qwen2.5-0.5B-Instruct-Q4_K_M.gguf',
        version: 'qwen2.5-0.5b-q4_k_m-v1',
        totalBytes: 398 * 1024 * 1024, // 398MB
      }

      // Default network status if not provided
      const actualNetworkStatus: NetworkStatus = networkStatus || {
        isConnected: true,
        type: 'wifi',
      }

      // Start download with progress tracking
      const result = await this.persistentManager.downloadModel(
        config,
        actualNetworkStatus,
        (progress) => {
          console.log('[GatekeeperDownloadManager] Download progress:', progress)
          // Progress is automatically persisted to Zustand store by PersistentDownloadManager
        }
      )

      if (!result.success) {
        throw new Error(result.error || 'Download failed')
      }

      // Validate checksum after successful download
      console.log('[GatekeeperDownloadManager] Download complete, validating checksum...')
      const expectedChecksum = '6eb923e7d26e9cea28811e1a8e852009b21242fb157b26149d3b188f3a8c8653'
      const checksumResult = await this.checksumValidator.validate(
        result.filePath!,
        expectedChecksum
      )

      if (!checksumResult.valid) {
        // Delete corrupted file
        await FileSystem.deleteAsync(result.filePath!, { idempotent: true })
        throw new Error('Checksum validation failed - model corrupted')
      }

      // Mark download as complete in Zustand store
      this.persistentManager.markComplete(
        checksumResult.actualChecksum || expectedChecksum,
        result.downloadedBytes
      )

      console.log('[GatekeeperDownloadManager] Download complete and validated')
    } catch (error) {
      console.error('[GatekeeperDownloadManager] Download failed:', error)
      throw error
    }
  }

  /**
   * Get current download progress
   *
   * This method checks Zustand store for the current download state
   * and returns the progress percentage.
   *
   * CLR-004: Queries Zustand for persisted progress
   */
  async getProgress(): Promise<ModelDownloadProgress | null> {
    const state = useDownloadStore.getState()

    if (state.state === 'idle' || state.state === 'cancelled') {
      return null
    }

    // Calculate estimated time remaining
    const bytesRemaining = state.totalBytes - state.bytesDownloaded
    const averageSpeed = 2 * 1024 * 1024 // Assume 2MB/s average
    const estimatedTimeRemaining = Math.ceil(bytesRemaining / averageSpeed)

    return {
      state: state.state === 'downloading' ? 'downloading' : state.state === 'completed' ? 'completed' : 'failed',
      progress: state.progressPercent,
      bytesDownloaded: state.bytesDownloaded,
      totalBytes: state.totalBytes,
      estimatedTimeRemaining,
      lastUpdated: state.lastUpdate,
      networkType: 'wifi', // Default to WiFi since we require it
    }
  }

  /**
   * Check if download can be resumed
   *
   * Returns true if there's an existing download that can be resumed.
   */
  async canResume(): Promise<boolean> {
    const existingProgress = this.persistentManager.checkExistingProgress()
    return existingProgress.canResume
  }

  /**
   * Cancel download
   *
   * This method cancels the current download and cleans up
   * any partial files.
   *
   * CLR-004: Resets progress in Zustand store
   */
  async cancelDownload(): Promise<void> {
    console.log('[GatekeeperDownloadManager] Cancelling download...')

    try {
      this.persistentManager.cancelDownload()

      // Clean up partial file
      await FileSystem.deleteAsync(this.modelFilePath, { idempotent: true })

      console.log('[GatekeeperDownloadManager] Download cancelled and cleaned up')
    } catch (error) {
      console.error('[GatekeeperDownloadManager] Failed to cancel download:', error)
      throw error
    }
  }
}
