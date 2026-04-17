/**
 * Offline Region Download Manager for Mapbox.
 *
 * Thin wrapper around the Mapbox offline SDK providing:
 * - Sequential download queue
 * - WiFi-only enforcement
 * - Storage limit detection
 * - Bounds validation
 *
 * State management is handled by `stores/offline-store.ts` (Zustand).
 * This module only wraps Mapbox SDK calls and validation logic.
 *
 * @see https://github.com/rnmapbox/maps
 */

import { offlineManager } from '@rnmapbox/maps'
// Import for internal use
import {
  InvalidBoundsError,
  StorageExceededError,
  WiFiRequiredError,
} from '../../stores/offline-store'
import { DownloadQueue } from './download-queue'
import { StorageUtils } from './storage-utils'
import { WiFiValidator } from './wifi-validator'

// --- Types (re-exported from store for backward compat) ---

export type {
  DownloadProgress,
  DownloadState,
  RegionBounds,
  RegionDownloadParams,
  RegionMetadata,
} from '../../stores/offline-store'

export {
  InvalidBoundsError,
  StorageExceededError,
  WiFiRequiredError,
} from '../../stores/offline-store'

const MAX_REGION_SIZE = 500 * 1024 * 1024 // 500MB limit

// --- Offline Region Manager (Singleton) ---
// Thin wrapper — no state ownership

class OfflineRegionManager {
  private static instance: OfflineRegionManager | null = null
  private queue: DownloadQueue
  private networkUnsub: (() => void) | null = null

  private constructor() {
    this.queue = new DownloadQueue()
  }

  static getInstance(): OfflineRegionManager {
    if (!OfflineRegionManager.instance) {
      OfflineRegionManager.instance = new OfflineRegionManager()
    }
    return OfflineRegionManager.instance
  }

  static resetInstance(): void {
    if (OfflineRegionManager.instance) {
      OfflineRegionManager.instance.cleanup()
    }
    OfflineRegionManager.instance = null
  }

  /** Validate WiFi, bounds, and storage before a download */
  async validateDownload(
    bounds: { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } },
    minZoom: number,
    maxZoom: number,
  ): Promise<number> {
    // Validate WiFi
    const isWiFi = await WiFiValidator.isWiFi()
    if (!isWiFi) {
      throw new WiFiRequiredError('WiFi required for offline downloads')
    }

    // Validate bounds
    const { sw, ne } = bounds
    if (sw.lat >= ne.lat || sw.lng >= ne.lng) {
      throw new InvalidBoundsError('Invalid bounds: SW must be south-west of NE')
    }
    const latRange = ne.lat - sw.lat
    const lngRange = ne.lng - sw.lng
    if (latRange > 10 || lngRange > 10) {
      throw new InvalidBoundsError('Region too large. Maximum 10 degrees in each direction.')
    }

    // Estimate size
    const boundsArray: [[number, number], [number, number]] = [
      [bounds.sw.lng, bounds.sw.lat],
      [bounds.ne.lng, bounds.ne.lat],
    ]
    const estimatedSize = StorageUtils.estimateRegionSize(boundsArray, minZoom, maxZoom)

    if (estimatedSize > MAX_REGION_SIZE) {
      throw new StorageExceededError(
        `Region too large (${StorageUtils.formatBytes(estimatedSize)}). Maximum is ${StorageUtils.formatBytes(MAX_REGION_SIZE)}.`,
      )
    }

    const hasSpace = await StorageUtils.hasEnoughStorage(estimatedSize)
    if (!hasSpace) {
      throw new StorageExceededError(
        `Not enough storage. Need ${StorageUtils.formatBytes(estimatedSize)} free.`,
      )
    }

    return estimatedSize
  }

  /** Check if a pack with the given name already exists */
  async packExists(name: string): Promise<boolean> {
    const packs = await offlineManager.getPacks()
    return packs.some((p) => p.name === name)
  }

  /** Get all offline pack names from Mapbox */
  async getPackNames(): Promise<string[]> {
    const packs = await offlineManager.getPacks()
    return packs.map((p) => p.name)
  }

  /** Get download queue status */
  getQueueStatus(): { status: string; pendingCount: number; queuedIds: string[] } {
    return {
      status: this.queue.getStatus(),
      pendingCount: this.queue.pendingCount,
      queuedIds: this.queue.queuedIds,
    }
  }

  /** Subscribe to network changes (auto-resume queue on WiFi) */
  subscribeToNetwork(): void {
    this.networkUnsub = WiFiValidator.subscribe((state) => {
      if (state.type === 'wifi' && state.isConnected) {
        this.queue.resume()
      }
    })
  }

  private cleanup(): void {
    this.networkUnsub?.()
    this.queue.clear()
  }
}

// Singleton export — used by tests only
export const offlineRegionManager = OfflineRegionManager.getInstance()
export { OfflineRegionManager }
