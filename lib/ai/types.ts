/**
 * Types for local model integration
 */

export type NetworkStatus = {
  isConnected: boolean
  type: 'wifi' | 'cellular' | 'none'
}

export type ModelConfig = {
  url: string
  expectedChecksum: string
  sizeBytes: number
}

export type DownloadResult = {
  success: boolean
  filePath?: string
  downloadedBytes: number
  error?: string
}

export type ChecksumResult = {
  valid: boolean
  actualChecksum?: string
  error?: string
}

export type ModelLoadResult = {
  success: boolean
  modelLoaded: boolean
  error?: string
}

export type InferenceResult = {
  success: boolean
  label?: string
  error?: string
}

export type MemoryUsage = {
  usedBytes: number
  totalBytes: number
}

// Forward declarations for classes
export type { ChecksumValidator } from './checksum'
export type { ModelDownloadManager } from './model-download'
export type { LocalModelManager } from './local-model'
