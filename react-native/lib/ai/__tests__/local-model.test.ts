import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ChecksumValidator } from '../checksum'
import { LocalModelManager } from '../local-model'
import { ModelDownloadManager } from '../model-download'

/**
 * AC-001: Happy Path — Successful Model Download and Loading
 *
 * GIVEN user is on WiFi connection and app launches for first time
 * WHEN model download completes and file passes checksum validation
 * THEN model loads into memory successfully
 *   AND subsequent inference requests complete in <0.5s
 *   AND memory usage remains <1.5GB
 */

describe('LocalModelManager - AC-001: Happy Path', () => {
  let localModelManager: LocalModelManager
  let downloadManager: ModelDownloadManager
  let checksumValidator: ChecksumValidator

  beforeEach(() => {
    // Reset mocks and create fresh instances
    vi.clearAllMocks()
    downloadManager = new ModelDownloadManager()
    checksumValidator = new ChecksumValidator()
    localModelManager = new LocalModelManager(downloadManager, checksumValidator)
  })

  describe('GIVEN user is on WiFi connection and app launches for first time', () => {
    it('WHEN model download completes and file passes checksum validation THEN model loads into memory successfully', async () => {
      // Arrange: Mock WiFi connection and first launch
      const mockNetworkStatus = {
        isConnected: true,
        type: 'wifi' as const,
      }

      const mockModelConfig = {
        url: 'https://example.com/model.bin',
        expectedChecksum: '616263313233646566343536', // hex for 'abc123def456'
        sizeBytes: 800 * 1024 * 1024, // 800MB
      }

      // Act: Download and load model
      const downloadResult = await downloadManager.downloadModel(
        mockModelConfig.url,
        mockNetworkStatus,
      )

      expect(downloadResult.success).toBe(true)
      expect(downloadResult.downloadedBytes).toBe(mockModelConfig.sizeBytes)

      // Validate checksum
      const checksumResult = await checksumValidator.validate(
        downloadResult.filePath!,
        mockModelConfig.expectedChecksum,
      )

      expect(checksumResult.valid).toBe(true)

      // Load model into memory
      const loadResult = await localModelManager.loadModel(downloadResult.filePath!)

      // Assert: Model loaded successfully
      expect(loadResult.success).toBe(true)
      expect(loadResult.modelLoaded).toBe(true)
    })

    it('THEN subsequent inference requests complete in <0.5s', async () => {
      // Arrange: Model already loaded in memory
      const mockModelPath = '/mock/path/to/model.bin'
      await localModelManager.loadModel(mockModelPath)

      // Act: Perform inference
      const startTime = Date.now()
      const inferenceResult = await localModelManager.generateLegLabel({
        from: 'San Francisco',
        to: 'Los Angeles',
      })
      const endTime = Date.now()
      const inferenceTime = endTime - startTime

      // Assert: Inference completes in <0.5s (500ms)
      expect(inferenceResult.success).toBe(true)
      expect(inferenceResult.label).toContain('→')
      expect(inferenceTime).toBeLessThan(500)
    })

    it('THEN memory usage remains <1.5GB', async () => {
      // Arrange: Model loaded
      const mockModelPath = '/mock/path/to/model.bin'
      await localModelManager.loadModel(mockModelPath)

      // Act: Get memory usage
      const memoryUsage = await localModelManager.getMemoryUsage()

      // Assert: Memory usage < 1.5GB (1.5 * 1024 * 1024 * 1024 bytes)
      const MAX_MEMORY_BYTES = 1.5 * 1024 * 1024 * 1024
      expect(memoryUsage.usedBytes).toBeLessThan(MAX_MEMORY_BYTES)
    })
  })
})
