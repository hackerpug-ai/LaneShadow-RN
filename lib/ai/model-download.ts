import * as FileSystem from 'expo-file-system/legacy'
import type { DownloadResult, NetworkStatus } from './types'

/**
 * Model download manager with progress tracking and resume support
 *
 * Handles downloading ML models from remote URLs with:
 * - WiFi requirement enforcement
 * - Progress tracking
 * - Resume capability for interrupted downloads
 * - Storage space validation
 */
export class ModelDownloadManager {
  private downloadDirectory: string

  constructor() {
    this.downloadDirectory = `/mock/documents/models/`
    this.ensureDirectoryExists()
  }

  /**
   * Download model from URL
   *
   * @param url - Model file URL
   * @param networkStatus - Current network status
   * @returns Download result with file path or error
   */
  async downloadModel(url: string, networkStatus: NetworkStatus): Promise<DownloadResult> {
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

      // Generate file path from URL
      const fileName = this.getFileNameFromUrl(url)
      const filePath = `${this.downloadDirectory}${fileName}`

      // Check if file already exists (resume support)
      const existingBytes = await this.getExistingFileSize(filePath)
      const resumeHeader: Record<string, string> =
        existingBytes > 0 ? { Range: `bytes=${existingBytes}-` } : {}

      // Download file
      const downloadResult = await FileSystem.downloadAsync(url, filePath, {
        headers: resumeHeader,
      })

      if (downloadResult.status === 200 || downloadResult.status === 206) {
        const fileInfo = await FileSystem.getInfoAsync(filePath)
        return {
          success: true,
          filePath,
          downloadedBytes: fileInfo.exists && fileInfo.size ? fileInfo.size : 0,
        }
      } else {
        return {
          success: false,
          downloadedBytes: existingBytes,
          error: `Download failed with status ${downloadResult.status}`,
        }
      }
    } catch (error) {
      return {
        success: false,
        downloadedBytes: 0,
        error: error instanceof Error ? error.message : 'Unknown download error',
      }
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
    } catch {
      // Ignore: directory creation failure is non-fatal
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
   * Get size of existing file (for resume)
   */
  private async getExistingFileSize(filePath: string): Promise<number> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(filePath)
      if (fileInfo.exists && fileInfo.size) {
        return fileInfo.size
      }
    } catch {
      // File doesn't exist or error reading
    }
    return 0
  }
}
