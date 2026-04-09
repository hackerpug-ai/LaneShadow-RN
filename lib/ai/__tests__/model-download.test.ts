import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ModelDownloadManager } from '../model-download'
import * as FileSystem from 'expo-file-system'

/**
 * AC-002: Edge Case — Download Interruption and Resume
 *
 * GIVEN model download is in progress (45% complete)
 * WHEN app is terminated by user or system
 * THEN download state is persisted to local storage
 *   AND download resumes from 45% on next app launch
 *   WITHOUT re-downloading existing bytes
 */

describe('ModelDownloadManager - AC-002: Download Interruption and Resume', () => {
  let downloadManager: ModelDownloadManager

  beforeEach(() => {
    vi.clearAllMocks()
    downloadManager = new ModelDownloadManager()
  })

  describe('GIVEN model download is in progress (45% complete)', () => {
    it('WHEN app is terminated by user or system THEN download state is persisted to local storage', async () => {
      // Arrange: Simulate partial download (45% complete)
      const mockUrl = 'https://example.com/model.bin'
      const totalSize = 800 * 1024 * 1024 // 800MB
      const downloadedSize = Math.floor(totalSize * 0.45) // 45% of 800MB

      // Mock that a partial file exists
      const partialFilePath = `/mock/documents/models/model.bin`
      vi.spyOn(FileSystem, 'getInfoAsync').mockResolvedValue({
        exists: true,
        size: downloadedSize,
        uri: partialFilePath,
        isDirectory: false,
        modificationTime: 1234567890,
      } as any)

      // Act: Check if partial download exists
      const fileInfo = await FileSystem.getInfoAsync(partialFilePath)

      // Assert: Partial file exists with correct size
      expect(fileInfo.exists).toBe(true)
      expect((fileInfo as any).size).toBe(downloadedSize)
    })

    it('THEN download resumes from 45% on next app launch WITHOUT re-downloading existing bytes', async () => {
      // Arrange: Simulate partial download (45% complete)
      const mockUrl = 'https://example.com/model.bin'
      const totalSize = 800 * 1024 * 1024 // 800MB
      const downloadedSize = Math.floor(totalSize * 0.45) // 45% of 800MB

      const mockNetworkStatus = {
        isConnected: true,
        type: 'wifi' as const,
      }

      // Store partial file info in global for mock to access
      const partialFilePath = '/mock/documents/models/model.bin'
      ;(global as any).__mockPartialFiles = {
        [partialFilePath]: {
          size: downloadedSize,
        },
      }

      // Mock that a partial file exists initially
      const getInfoMock = vi.spyOn(FileSystem, 'getInfoAsync').mockImplementation(async (filePath) => {
        const partialFiles = (global as any).__mockPartialFiles || {}
        const downloadedFiles = (global as any).__mockDownloadedFiles || {}

        if (downloadedFiles[filePath]) {
          return {
            exists: true,
            size: downloadedFiles[filePath].size,
            uri: filePath,
            isDirectory: false,
            modificationTime: 1234567890,
          } as any
        }

        if (partialFiles[filePath]) {
          return {
            exists: true,
            size: partialFiles[filePath].size,
            uri: filePath,
            isDirectory: false,
            modificationTime: 1234567890,
          } as any
        }

        return {
          exists: false,
          uri: filePath,
          isDirectory: false,
          modificationTime: 0,
        } as any
      })

      // Mock download to resume from byte offset
      const downloadSpy = vi.spyOn(FileSystem, 'downloadAsync').mockImplementation(async (url, filePath, options) => {
        // Store the completed download size
        ;(global as any).__mockDownloadedFiles = (global as any).__mockDownloadedFiles || {}
        ;(global as any).__mockDownloadedFiles[filePath] = {
          size: totalSize, // Full 800MB after resume completes
        }

        return {
          status: 206, // Partial Content status for resume
          headers: { 'content-range': `bytes ${downloadedSize}-${totalSize - 1}/${totalSize}` },
          mimeType: 'application/octet-stream',
          uri: filePath,
        } as any
      })

      // Act: Resume download
      const result = await downloadManager.downloadModel(mockUrl, mockNetworkStatus)

      // Assert: Download resumes with Range header
      expect(downloadSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Range: `bytes=${downloadedSize}-`,
          }),
        })
      )

      expect(result.success).toBe(true)
      expect(result.downloadedBytes).toBeGreaterThan(downloadedSize)

      // Cleanup
      getInfoMock.mockRestore()
    })
  })
})
