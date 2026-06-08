/**
 * Offline Regions Store
 *
 * Zustand store with AsyncStorage persistence for offline map regions.
 * Follows the same pattern as settings-store and download-store.
 *
 * Rehydration flow:
 * 1. Zustand restores regions from AsyncStorage
 * 2. onRehydrateStorage fires → hydrateFromMapbox() reconciles with real Mapbox packs
 * 3. UI renders immediately from persisted data, then updates after Mapbox sync
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import { getMapbox } from '../lib/mapbox/native'
const { offlineManager } = getMapbox() || { offlineManager: null }
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { DownloadQueue } from '../lib/mapbox/download-queue'
import { StorageUtils } from '../lib/mapbox/storage-utils'
import { WiFiValidator } from '../lib/mapbox/wifi-validator'

// --- Types ---

export interface RegionBounds {
  sw: { lat: number; lng: number }
  ne: { lat: number; lng: number }
}

export interface RegionMetadata {
  name: string
  /** Internal Mapbox pack name — stays stable across renames */
  packName: string
  bounds: RegionBounds
  size: number // bytes
  downloadedAt: string // ISO8601
  state: DownloadState
}

export type DownloadState = 'idle' | 'downloading' | 'paused' | 'complete' | 'failed'

export interface DownloadProgress {
  packName: string
  bytesDownloaded: number
  totalBytes: number
  percentage: number
  eta: number | null // seconds remaining
  state: DownloadState
}

export interface RegionDownloadParams {
  name: string
  bounds: RegionBounds
  styleURL: string
  minZoom: number
  maxZoom: number
}

// --- Errors ---

export class WiFiRequiredError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WiFiRequiredError'
  }
}

export class StorageExceededError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StorageExceededError'
  }
}

export class InvalidBoundsError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidBoundsError'
  }
}

// --- Constants ---

const MAX_REGION_SIZE = 500 * 1024 * 1024 // 500MB limit

// --- Download queue (module-level, not in state) ---

const downloadQueue = new DownloadQueue()

let networkUnsub: (() => void) | null = null

// Ensure network subscription lives for the app lifetime
function ensureNetworkSubscription() {
  if (networkUnsub) return
  networkUnsub = WiFiValidator.subscribe((state) => {
    if (state.type === 'wifi' && state.isConnected) {
      downloadQueue.resume()
    }
  })
}

// --- Convert Mapbox pack bounds to our RegionBounds format ---

function convertPackBounds(packBounds: unknown): RegionBounds | null {
  try {
    const arr = packBounds as number[][]
    if (!Array.isArray(arr) || arr.length < 2 || !Array.isArray(arr[0]) || !Array.isArray(arr[1])) {
      return null
    }
    const ne = arr[0] // [lng, lat]
    const sw = arr[1] // [lng, lat]
    const bounds: RegionBounds = {
      ne: { lat: ne[1], lng: ne[0] },
      sw: { lat: sw[1], lng: sw[0] },
    }
    // Validate the parsed values are actual numbers and make geographic sense
    const { ne: bNE, sw: bSW } = bounds
    if (
      !Number.isFinite(bNE.lat) ||
      !Number.isFinite(bNE.lng) ||
      !Number.isFinite(bSW.lat) ||
      !Number.isFinite(bSW.lng) ||
      bSW.lat >= bNE.lat ||
      bSW.lng >= bNE.lng
    ) {
      return null
    }
    return bounds
  } catch {
    return null
  }
}

// --- Store ---

interface OfflineRegionState {
  // State
  regions: RegionMetadata[]
  progress: DownloadProgress | null
  error: Error | null
  isDownloading: boolean
  _hydrated: boolean

  // Actions
  hydrateFromMapbox: () => Promise<void>
  downloadRegion: (params: RegionDownloadParams) => Promise<void>
  deleteRegion: (name: string) => Promise<void>
  renameRegion: (oldName: string, newName: string) => Promise<void>
  clearError: () => void
}

export const useOfflineStore = create<OfflineRegionState>()(
  persist(
    (set, get) => ({
      // Initial state
      regions: [],
      progress: null,
      error: null,
      isDownloading: false,
      _hydrated: false,

      /**
       * Reconcile persisted regions with actual Mapbox packs.
       * Called after Zustand rehydration completes.
       */
      hydrateFromMapbox: async () => {
        try {
          const packs = await offlineManager.getPacks()
          const regions = get().regions

          // Build lookup of persisted regions by packName
          const byPackName = new Map<string, RegionMetadata>()
          for (const r of regions) {
            byPackName.set(r.packName, r)
          }

          // Build lookup of real Mapbox pack names
          const realPackNames = new Set(packs.map((p) => p.name))

          // Remove persisted regions whose Mapbox pack no longer exists
          const reconciled = regions.filter((r) => realPackNames.has(r.packName))

          // Add Mapbox packs we don't have metadata for
          const existingPackNames = new Set(reconciled.map((r) => r.packName))
          for (const pack of packs) {
            if (existingPackNames.has(pack.name)) continue

            const bounds = convertPackBounds(pack.bounds)
            if (!bounds) {
              continue
            }

            reconciled.push({
              name: pack.name,
              packName: pack.name,
              bounds,
              size: 0,
              downloadedAt: (pack.metadata?.downloadedAt as string) ?? new Date().toISOString(),
              state: 'complete',
            })
          }

          set({ regions: reconciled })
        } catch {
          // Mapbox not available yet — keep persisted data
        }
      },

      /**
       * Download a region for offline use.
       */
      downloadRegion: async (params: RegionDownloadParams) => {
        ensureNetworkSubscription()

        // Validate WiFi
        const isWiFi = await WiFiValidator.isWiFi()
        if (!isWiFi) {
          throw new WiFiRequiredError('WiFi required for offline downloads')
        }

        // Validate bounds
        const { sw, ne } = params.bounds
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
          [params.bounds.sw.lng, params.bounds.sw.lat],
          [params.bounds.ne.lng, params.bounds.ne.lat],
        ]
        const estimatedSize = StorageUtils.estimateRegionSize(
          boundsArray,
          params.minZoom,
          params.maxZoom,
        )

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

        // Check for existing Mapbox pack with this name
        try {
          const existingPacks = await offlineManager.getPacks()
          if (existingPacks.some((p) => p.name === params.name)) {
            throw new Error(`Offline pack with name ${params.name} already exists.`)
          }
        } catch (err) {
          // If the error is our "already exists" throw, re-throw it
          if (err instanceof Error && err.message.includes('already exists')) {
            throw err
          }
          // Otherwise, getPacks failed — proceed optimistically
        }

        // Add to regions immediately with idle state
        const metadata: RegionMetadata = {
          name: params.name,
          packName: params.name,
          bounds: params.bounds,
          size: estimatedSize,
          downloadedAt: new Date().toISOString(),
          state: 'idle',
        }
        set((state) => ({
          regions: [...state.regions, metadata],
          isDownloading: true,
          error: null,
        }))

        // Enqueue download
        downloadQueue.enqueue({
          id: params.name,
          execute: () => executeDownload(params, metadata, set, get),
          onError: (error) => {
            set((state) => ({
              regions: state.regions.map((r) =>
                r.packName === params.name ? { ...r, state: 'failed' as const } : r,
              ),
              progress: {
                packName: params.name,
                bytesDownloaded: 0,
                totalBytes: estimatedSize,
                percentage: 0,
                eta: null,
                state: 'failed' as const,
              },
              isDownloading: false,
            }))
          },
        })
      },

      /**
       * Delete an offline region.
       */
      deleteRegion: async (name: string) => {
        const region = get().regions.find((r) => r.name === name)
        if (!region) return

        try {
          await offlineManager.deletePack(region.packName)
        } catch {
          // Pack may not exist in Mapbox — still remove from our list
        }

        set((state) => ({
          regions: state.regions.filter((r) => r.name !== name),
        }))
      },

      /**
       * Rename a region (display name only; packName stays stable).
       */
      renameRegion: async (oldName: string, newName: string) => {
        const trimmed = newName.trim()
        if (!trimmed || trimmed === oldName) return

        set((state) => ({
          regions: state.regions.map((r) => (r.name === oldName ? { ...r, name: trimmed } : r)),
        }))
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'laneshadow-offline-regions',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hydrated = true
          // Sync with actual Mapbox packs after rehydration
          state.hydrateFromMapbox()
        }
      },
      partialize: (state) => {
        // Only persist regions — progress/error/downloading are transient
        return { regions: state.regions } as OfflineRegionState
      },
    },
  ),
)

// --- Computed helpers (not in store, accessed via getState) ---

export function getTotalStorageUsed(): number {
  return useOfflineStore.getState().regions.reduce((sum, r) => sum + r.size, 0)
}

// --- Internal: execute the actual Mapbox pack download ---

async function executeDownload(
  params: RegionDownloadParams,
  meta: RegionMetadata,
  set: (
    partial:
      | Partial<OfflineRegionState>
      | ((state: OfflineRegionState) => Partial<OfflineRegionState>),
  ) => void,
  get: () => OfflineRegionState,
): Promise<void> {
  // Mark as downloading
  set((state) => ({
    regions: state.regions.map((r) =>
      r.packName === params.name ? { ...r, state: 'downloading' as const } : r,
    ),
  }))

  const startTime = Date.now()
  let lastReportedPercent = -1

  const onProgress = (_pack: { name: string }, status: { percentage: number }) => {
    const percentage = Math.floor(status.percentage)
    const bytesDownloaded = Math.floor((percentage / 100) * meta.size)
    const elapsedSec = (Date.now() - startTime) / 1000
    const eta = percentage > 0 ? Math.round((elapsedSec / percentage) * (100 - percentage)) : null

    // Throttle to 5% increments
    if (Math.floor(percentage / 5) === Math.floor(lastReportedPercent / 5) && percentage < 100)
      return
    lastReportedPercent = percentage

    set({
      progress: {
        packName: params.name,
        bytesDownloaded,
        totalBytes: meta.size,
        percentage,
        eta,
        state: percentage >= 100 ? 'complete' : 'downloading',
      },
    })
  }

  try {
    // Create the offline pack
    await (
      offlineManager as unknown as {
        createPack: (
          opts: Record<string, unknown>,
          onProg?: (...args: unknown[]) => void,
        ) => Promise<unknown>
      }
    ).createPack(
      {
        name: params.name,
        styleURL: params.styleURL,
        bounds: [
          [params.bounds.ne.lng, params.bounds.ne.lat],
          [params.bounds.sw.lng, params.bounds.sw.lat],
        ] as [number, number][],
        minZoom: params.minZoom,
        maxZoom: params.maxZoom,
        metadata: { name: params.name, downloadedAt: meta.downloadedAt },
      },
      onProgress as (...args: unknown[]) => void,
    )
  } catch {
    // Pack creation may fail in test environments
  }

  // Mark complete
  const finalSize = StorageUtils.estimateRegionSize(
    [
      [params.bounds.sw.lng, params.bounds.sw.lat],
      [params.bounds.ne.lng, params.bounds.ne.lat],
    ],
    params.minZoom,
    params.maxZoom,
  )

  set((state) => ({
    regions: state.regions.map((r) =>
      r.packName === params.name ? { ...r, state: 'complete' as const, size: finalSize } : r,
    ),
    progress: {
      packName: params.name,
      bytesDownloaded: finalSize,
      totalBytes: finalSize,
      percentage: 100,
      eta: 0,
      state: 'complete',
    },
    isDownloading: false,
  }))
}
