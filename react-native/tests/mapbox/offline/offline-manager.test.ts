import { offlineManager } from '@rnmapbox/maps'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock AsyncStorage for Zustand persist
vi.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>()
  return {
    default: {
      getItem: vi.fn(async (key: string) => store.get(key) ?? null),
      setItem: vi.fn(async (key: string, value: string) => {
        store.set(key, value)
      }),
      removeItem: vi.fn(async (key: string) => {
        store.delete(key)
      }),
      clear: vi.fn(async () => {
        store.clear()
      }),
    },
    __esModule: true,
  }
})

// Mock type with test helpers
type MockOfflineManager = typeof offlineManager & {
  _resetPacks: () => void
  _setPack: (name: string, pack: unknown) => void
}

const mockManager = offlineManager as MockOfflineManager

// Reset the mock's internal pack store before each test
beforeEach(() => {
  mockManager._resetPacks()
})

// --- Storage Utils ---

describe('StorageUtils', () => {
  it('estimates region size based on bounds and zoom', async () => {
    const { StorageUtils } = await import('../../../lib/mapbox/storage-utils')
    const bounds: [[number, number], [number, number]] = [
      [-122.5, 37.7],
      [-122.4, 37.8],
    ]
    const size = StorageUtils.estimateRegionSize(bounds, 10, 14)
    expect(size).toBeGreaterThan(0)
  })

  it('formats bytes correctly', async () => {
    const { StorageUtils } = await import('../../../lib/mapbox/storage-utils')
    expect(StorageUtils.formatBytes(500)).toBe('500 B')
    expect(StorageUtils.formatBytes(2048)).toBe('2.0 KB')
    expect(StorageUtils.formatBytes(5 * 1024 * 1024)).toBe('5 MB')
    expect(StorageUtils.formatBytes(2 * 1024 * 1024 * 1024)).toBe('2.0 GB')
  })

  it('checks storage availability', async () => {
    const { StorageUtils } = await import('../../../lib/mapbox/storage-utils')
    const hasSpace = await StorageUtils.hasEnoughStorage(1024)
    expect(hasSpace).toBe(true)
  })
})

// --- WiFi Validator ---

describe('WiFiValidator', () => {
  it('returns wifi by default', async () => {
    const { WiFiValidator } = await import('../../../lib/mapbox/wifi-validator')
    const isWiFi = await WiFiValidator.isWiFi()
    expect(isWiFi).toBe(true)
  })

  it('can be configured with custom network state', async () => {
    const { WiFiValidator } = await import('../../../lib/mapbox/wifi-validator')
    WiFiValidator.configure({
      getNetworkState: async () => ({ type: 'cellular', isConnected: true }),
      subscribe: () => () => {},
    })
    const isWiFi = await WiFiValidator.isWiFi()
    expect(isWiFi).toBe(false)
    // Reset
    WiFiValidator.configure({
      getNetworkState: async () => ({ type: 'wifi', isConnected: true }),
      subscribe: () => () => {},
    })
  })
})

// --- Download Queue ---

describe('DownloadQueue', () => {
  it('processes items sequentially', async () => {
    const { DownloadQueue } = await import('../../../lib/mapbox/download-queue')
    const queue = new DownloadQueue()
    const order: string[] = []

    queue.enqueue({
      id: 'first',
      execute: async () => {
        order.push('first')
      },
    })
    queue.enqueue({
      id: 'second',
      execute: async () => {
        order.push('second')
      },
    })

    await new Promise((r) => setTimeout(r, 50))
    expect(order).toEqual(['first', 'second'])
  })

  it('reports correct pending count', async () => {
    const { DownloadQueue } = await import('../../../lib/mapbox/download-queue')
    const queue = new DownloadQueue()
    expect(queue.pendingCount).toBe(0)

    queue.enqueue({ id: 'a', execute: async () => {} })
    queue.enqueue({ id: 'b', execute: async () => {} })
    expect(queue.pendingCount).toBe(1)
  })

  it('allows dequeue of pending items', async () => {
    const { DownloadQueue } = await import('../../../lib/mapbox/download-queue')
    const queue = new DownloadQueue()
    queue.enqueue({ id: 'a', execute: async () => new Promise((r) => setTimeout(r, 1000)) })
    queue.enqueue({ id: 'b', execute: async () => {} })

    const removed = queue.dequeue('b')
    expect(removed).toBe(true)
    expect(queue.queuedIds).not.toContain('b')
  })
})

// --- Offline Store (Zustand) ---

describe('useOfflineStore', () => {
  const VALID_BOUNDS = {
    sw: { lat: 37.7, lng: -122.5 },
    ne: { lat: 37.8, lng: -122.4 },
  }

  it('starts with empty regions', async () => {
    const { useOfflineStore } = await import('../../../stores/offline-store')
    const state = useOfflineStore.getState()
    expect(state.regions).toEqual([])
    expect(state.isDownloading).toBe(false)
  })

  it('downloads a region and adds it to the store', async () => {
    const { useOfflineStore } = await import('../../../stores/offline-store')

    await useOfflineStore.getState().downloadRegion({
      name: 'test-region',
      bounds: VALID_BOUNDS,
      styleURL: 'mapbox://styles/mapbox/streets-v12',
      minZoom: 10,
      maxZoom: 14,
    })

    await new Promise((r) => setTimeout(r, 200))

    const state = useOfflineStore.getState()
    const region = state.regions.find((r) => r.name === 'test-region')
    expect(region).toBeDefined()
    expect(region!.state).toBe('complete')
  })

  it('rejects downloads over cellular', async () => {
    const { WiFiValidator } = await import('../../../lib/mapbox/wifi-validator')
    WiFiValidator.configure({
      getNetworkState: async () => ({ type: 'cellular', isConnected: true }),
      subscribe: () => () => {},
    })

    const { useOfflineStore } = await import('../../../stores/offline-store')
    await expect(
      useOfflineStore.getState().downloadRegion({
        name: 'cellular-test',
        bounds: VALID_BOUNDS,
        styleURL: 'mapbox://styles/mapbox/streets-v12',
        minZoom: 10,
        maxZoom: 14,
      }),
    ).rejects.toThrow('WiFi required')

    WiFiValidator.configure({
      getNetworkState: async () => ({ type: 'wifi', isConnected: true }),
      subscribe: () => () => {},
    })
  })

  it('deletes a region and removes it from the store', async () => {
    const { useOfflineStore } = await import('../../../stores/offline-store')

    await useOfflineStore.getState().downloadRegion({
      name: 'delete-test',
      bounds: VALID_BOUNDS,
      styleURL: 'mapbox://styles/mapbox/streets-v12',
      minZoom: 10,
      maxZoom: 14,
    })

    await new Promise((r) => setTimeout(r, 200))
    expect(useOfflineStore.getState().regions.find((r) => r.name === 'delete-test')).toBeDefined()

    await useOfflineStore.getState().deleteRegion('delete-test')
    expect(useOfflineStore.getState().regions.find((r) => r.name === 'delete-test')).toBeUndefined()
  })

  it('renames a region', async () => {
    const { useOfflineStore } = await import('../../../stores/offline-store')

    await useOfflineStore.getState().downloadRegion({
      name: 'original-name',
      bounds: VALID_BOUNDS,
      styleURL: 'mapbox://styles/mapbox/streets-v12',
      minZoom: 10,
      maxZoom: 14,
    })

    await new Promise((r) => setTimeout(r, 200))

    await useOfflineStore.getState().renameRegion('original-name', 'new-name')

    const state = useOfflineStore.getState()
    expect(state.regions.find((r) => r.name === 'original-name')).toBeUndefined()
    const renamed = state.regions.find((r) => r.name === 'new-name')
    expect(renamed).toBeDefined()
    expect(renamed!.packName).toBe('original-name') // packName stays stable
  })

  it('tracks total storage used', async () => {
    const { useOfflineStore, getTotalStorageUsed } = await import('../../../stores/offline-store')

    const before = getTotalStorageUsed()

    await useOfflineStore.getState().downloadRegion({
      name: 'storage-test',
      bounds: VALID_BOUNDS,
      styleURL: 'mapbox://styles/mapbox/streets-v12',
      minZoom: 10,
      maxZoom: 14,
    })

    await new Promise((r) => setTimeout(r, 200))
    const after = getTotalStorageUsed()
    expect(after).toBeGreaterThan(before)
  })
})
