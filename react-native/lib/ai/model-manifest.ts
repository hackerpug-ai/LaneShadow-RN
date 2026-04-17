/**
 * Model Manifest Service
 *
 * Manages remote model manifest checking and version management.
 *
 * Features:
 * - Fetches remote manifest from CDN
 * - Compares local vs remote versions
 * - Queues background downloads for updates
 * - Implements rollback for failed updates
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import { useDownloadStore } from '../../stores/download-store'

/**
 * Model manifest entry
 */
export interface ModelManifestEntry {
  id: string
  version: string
  url: string
  checksum: string
  sizeBytes: number
  minAppVersion: string
  releaseDate: string
  changelog?: string[]
}

/**
 * Model manifest response
 */
export interface ModelManifest {
  models: ModelManifestEntry[]
  lastUpdated: number
}

/**
 * Local model metadata
 */
export interface LocalModelMetadata {
  id: string
  version: string
  checksum: string
  downloadDate: number
  sizeBytes: number
  lastValidated: number
}

/**
 * Model update check result
 */
export interface ModelUpdateCheck {
  hasUpdate: boolean
  currentVersion?: string
  availableVersion?: string
  updateSize?: number
  changelog?: string[]
}

/**
 * Manifest storage key
 */
const MANIFEST_CACHE_KEY = 'model-manifest-cache'
const MANIFEST_CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Default manifest URL (should be configured via env vars)
 */
const DEFAULT_MANIFEST_URL = 'https://cdn.example.com/models/manifest.json'

/**
 * Model manifest service
 */
export class ModelManifestService {
  private manifestUrl: string
  private cachedManifest: ModelManifest | null = null

  constructor(manifestUrl: string = DEFAULT_MANIFEST_URL) {
    this.manifestUrl = manifestUrl
  }

  /**
   * Fetch remote manifest from CDN
   */
  async fetchManifest(forceRefresh: boolean = false): Promise<ModelManifest> {
    try {
      // Check cache first
      if (!forceRefresh && this.cachedManifest) {
        return this.cachedManifest
      }

      // Check AsyncStorage cache
      const cached = await AsyncStorage.getItem(MANIFEST_CACHE_KEY)
      if (cached && !forceRefresh) {
        const { manifest, timestamp } = JSON.parse(cached)
        const age = Date.now() - timestamp

        if (age < MANIFEST_CACHE_DURATION) {
          this.cachedManifest = manifest
          return manifest
        }
      }

      // Fetch from remote
      const response = await fetch(this.manifestUrl, {
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Manifest fetch failed: ${response.status}`)
      }

      const manifest: ModelManifest = await response.json()

      // Cache in memory
      this.cachedManifest = manifest

      // Cache in AsyncStorage
      await AsyncStorage.setItem(
        MANIFEST_CACHE_KEY,
        JSON.stringify({
          manifest,
          timestamp: Date.now(),
        }),
      )

      console.log('[ModelManifestService] Manifest fetched successfully')
      return manifest
    } catch (error) {
      console.error('[ModelManifestService] Failed to fetch manifest:', error)

      // Return cached manifest if available
      if (this.cachedManifest) {
        console.log('[ModelManifestService] Using cached manifest')
        return this.cachedManifest
      }

      throw error
    }
  }

  /**
   * Get local model metadata
   */
  async getLocalModelMetadata(modelId: string): Promise<LocalModelMetadata | null> {
    try {
      const key = `model-metadata-${modelId}`
      const data = await AsyncStorage.getItem(key)

      if (!data) {
        return null
      }

      return JSON.parse(data)
    } catch (error) {
      console.error('[ModelManifestService] Failed to get local metadata:', error)
      return null
    }
  }

  /**
   * Save local model metadata
   */
  async saveLocalModelMetadata(metadata: LocalModelMetadata): Promise<void> {
    try {
      const key = `model-metadata-${metadata.id}`
      await AsyncStorage.setItem(key, JSON.stringify(metadata))
      console.log('[ModelManifestService] Local metadata saved')
    } catch (error) {
      console.error('[ModelManifestService] Failed to save local metadata:', error)
      throw error
    }
  }

  /**
   * Check for model updates
   */
  async checkForUpdates(modelId: string): Promise<ModelUpdateCheck> {
    try {
      const manifest = await this.fetchManifest()
      const localMetadata = await this.getLocalModelMetadata(modelId)

      if (!localMetadata) {
        // No local model - first download needed
        const remoteModel = manifest.models.find((m) => m.id === modelId)

        if (!remoteModel) {
          throw new Error(`Model ${modelId} not found in manifest`)
        }

        return {
          hasUpdate: true,
          availableVersion: remoteModel.version,
          updateSize: remoteModel.sizeBytes,
          changelog: remoteModel.changelog,
        }
      }

      // Compare versions
      const remoteModel = manifest.models.find((m) => m.id === modelId)

      if (!remoteModel) {
        // Model removed from manifest
        console.warn('[ModelManifestService] Model not found in remote manifest')
        return {
          hasUpdate: false,
          currentVersion: localMetadata.version,
        }
      }

      if (remoteModel.version !== localMetadata.version) {
        // Update available
        return {
          hasUpdate: true,
          currentVersion: localMetadata.version,
          availableVersion: remoteModel.version,
          updateSize: remoteModel.sizeBytes,
          changelog: remoteModel.changelog,
        }
      }

      // Up to date
      return {
        hasUpdate: false,
        currentVersion: localMetadata.version,
      }
    } catch (error) {
      console.error('[ModelManifestService] Failed to check for updates:', error)
      throw error
    }
  }

  /**
   * Get model manifest entry by ID
   */
  async getModelEntry(modelId: string): Promise<ModelManifestEntry> {
    const manifest = await this.fetchManifest()
    const entry = manifest.models.find((m) => m.id === modelId)

    if (!entry) {
      throw new Error(`Model ${modelId} not found in manifest`)
    }

    return entry
  }

  /**
   * Validate model checksum
   */
  async validateModelChecksum(modelId: string, filePath: string): Promise<boolean> {
    try {
      const localMetadata = await this.getLocalModelMetadata(modelId)

      if (!localMetadata) {
        return false
      }

      // Import checksum validator
      const { ChecksumValidator } = await import('./checksum')
      const validator = new ChecksumValidator()

      const result = await validator.validate(filePath, localMetadata.checksum)

      if (result.valid) {
        // Update last validated timestamp
        localMetadata.lastValidated = Date.now()
        await this.saveLocalModelMetadata(localMetadata)
      }

      return result.valid
    } catch (error) {
      console.error('[ModelManifestService] Checksum validation failed:', error)
      return false
    }
  }

  /**
   * Clear manifest cache
   */
  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(MANIFEST_CACHE_KEY)
      this.cachedManifest = null
      console.log('[ModelManifestService] Manifest cache cleared')
    } catch (error) {
      console.error('[ModelManifestService] Failed to clear cache:', error)
    }
  }

  /**
   * Get all available models from manifest
   */
  async getAvailableModels(): Promise<ModelManifestEntry[]> {
    const manifest = await this.fetchManifest()
    return manifest.models
  }

  /**
   * Check if app version meets minimum requirement
   */
  async checkMinAppVersion(modelId: string, appVersion: string): Promise<boolean> {
    try {
      const entry = await this.getModelEntry(modelId)

      // Simple version comparison (assumes semver)
      const minVersion = entry.minAppVersion
      const currentVersion = appVersion

      // Parse versions
      const [minMajor, minMinor, minPatch] = minVersion.split('.').map(Number)
      const [currMajor, currMinor, currPatch] = currentVersion.split('.').map(Number)

      // Compare
      if (currMajor > minMajor) return true
      if (currMajor < minMajor) return false
      if (currMinor > minMinor) return true
      if (currMinor < minMinor) return false
      return currPatch >= minPatch
    } catch (error) {
      console.error('[ModelManifestService] Failed to check min app version:', error)
      return false
    }
  }

  /**
   * Prepare for model update (backup current model)
   */
  async prepareUpdate(modelId: string): Promise<void> {
    const localMetadata = await this.getLocalModelMetadata(modelId)

    if (localMetadata) {
      // Save current model metadata for rollback
      await AsyncStorage.setItem(`model-backup-${modelId}`, JSON.stringify(localMetadata))
      console.log('[ModelManifestService] Update backup prepared')
    }
  }

  /**
   * Commit update (remove backup)
   */
  async commitUpdate(modelId: string): Promise<void> {
    await AsyncStorage.removeItem(`model-backup-${modelId}`)
    console.log('[ModelManifestService] Update committed')
  }

  /**
   * Rollback update (restore from backup)
   */
  async rollbackUpdate(modelId: string): Promise<LocalModelMetadata | null> {
    try {
      const backupKey = `model-backup-${modelId}`
      const backupData = await AsyncStorage.getItem(backupKey)

      if (!backupData) {
        console.warn('[ModelManifestService] No backup found for rollback')
        return null
      }

      const backup: LocalModelMetadata = JSON.parse(backupData)

      // Restore metadata
      await this.saveLocalModelMetadata(backup)

      // Remove backup
      await AsyncStorage.removeItem(backupKey)

      console.log('[ModelManifestService] Update rolled back to version:', backup.version)
      return backup
    } catch (error) {
      console.error('[ModelManifestService] Rollback failed:', error)
      return null
    }
  }
}

/**
 * Singleton instance
 */
let modelManifestServiceInstance: ModelManifestService | null = null

export function getModelManifestService(): ModelManifestService {
  if (!modelManifestServiceInstance) {
    const manifestUrl = process.env.EXPO_PUBLIC_MODEL_MANIFEST_URL || DEFAULT_MANIFEST_URL
    modelManifestServiceInstance = new ModelManifestService(manifestUrl)
  }
  return modelManifestServiceInstance
}
