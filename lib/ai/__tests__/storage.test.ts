import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ModelDownloadManager } from '../model-download'
import * as FileSystem from 'expo-file-system/legacy'

/**
 * AC-004: Error Case — Insufficient Storage Space
 *
 * GIVEN device has <2GB free storage space
 * WHEN user initiates model download
 * THEN download is blocked BEFORE any bytes are written
 *   AND user sees error message: "Not enough storage. Need 2GB free space. Available: X GB"
 *   AND app remains functional (setup wizard doesn't crash)
 */

describe('ModelDownloadManager - AC-004: Insufficient Storage Space', () => {
  let downloadManager: ModelDownloadManager

  beforeEach(() => {
    vi.clearAllMocks()
    downloadManager = new ModelDownloadManager()
  })

  describe('GIVEN device has <2GB free storage space', () => {
    it('WHEN user initiates model download THEN download is blocked BEFORE any bytes are written', async () => {
      // Arrange: Device has only 1GB free storage (<2GB requirement)
      const availableStorageGB = 1
      const availableStorageBytes = availableStorageGB * 1024 * 1024 * 1024

      vi.spyOn(FileSystem, 'getFreeDiskStorageAsync').mockResolvedValue(availableStorageBytes)

      const mockUrl = 'https://example.com/model.bin'
      const mockNetworkStatus = {
        isConnected: true,
        type: 'wifi' as const,
      }

      // Mock download to ensure it's never called
      const downloadSpy = vi.spyOn(FileSystem, 'downloadAsync')

      // Act: Attempt download
      const result = await downloadManager.downloadModel(mockUrl, mockNetworkStatus)

      // Assert: Download is blocked
      expect(result.success).toBe(false)
      expect(result.downloadedBytes).toBe(0) // No bytes written
      expect(downloadSpy).not.toHaveBeenCalled() // Download never attempted
    })

    it('AND user sees error message: "Not enough storage. Need 2GB free space. Available: X GB"', async () => {
      // Arrange: Device has only 1.5GB free storage
      const availableStorageGB = 1.5
      const availableStorageBytes = Math.floor(availableStorageGB * 1024 * 1024 * 1024)

      vi.spyOn(FileSystem, 'getFreeDiskStorageAsync').mockResolvedValue(availableStorageBytes)

      const mockUrl = 'https://example.com/model.bin'
      const mockNetworkStatus = {
        isConnected: true,
        type: 'wifi' as const,
      }

      // Act: Attempt download
      const result = await downloadManager.downloadModel(mockUrl, mockNetworkStatus)

      // Assert: User sees appropriate error message
      expect(result.success).toBe(false)
      expect(result.error).toContain('Not enough storage')
      expect(result.error).toContain('Need 2GB free space')
      expect(result.error).toContain('Available:')
      expect(result.error).toContain('1.5') // Shows actual available GB
    })

    it('AND app remains functional (setup wizard does not crash)', async () => {
      // Arrange: Device has insufficient storage
      const availableStorageBytes = 1 * 1024 * 1024 * 1024 // 1GB

      vi.spyOn(FileSystem, 'getFreeDiskStorageAsync').mockResolvedValue(availableStorageBytes)

      const mockUrl = 'https://example.com/model.bin'
      const mockNetworkStatus = {
        isConnected: true,
        type: 'wifi' as const,
      }

      // Act & Assert: Attempt download doesn't throw exception
      await expect(
        downloadManager.downloadModel(mockUrl, mockNetworkStatus)
      ).resolves.toBeDefined()

      // Verify the result structure is valid
      const result = await downloadManager.downloadModel(mockUrl, mockNetworkStatus)
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('downloadedBytes')
      expect(result).toHaveProperty('error')
    })
  })
})
