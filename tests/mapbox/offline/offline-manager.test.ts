import { describe, it, expect, beforeEach, vi } from 'vitest'
import { offlineManager } from '@rnmapbox/maps'

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
    const bounds: [[number, number], [number, number]] = [[-122.5, 37.7], [-122.4, 37.8]]
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
      execute: async () => { order.push('first') },
    })
    queue.enqueue({
      id: 'second',
      execute: async () => { order.push('second') },
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

// --- Offline Region Manager ---

describe('OfflineRegionManager', () => {
  async function getFreshManager() {
    const mod = await import('../../../lib/mapbox/offline-manager')
    mod.OfflineRegionManager.resetInstance()
    const manager = mod.OfflineRegionManager.getInstance()
    await manager.initialize()
    return { manager, mod }
  }

  const VALID_BOUNDS = {
    sw: { lat: 37.7, lng: -122.5 },
    ne: { lat: 37.8, lng: -122.4 },
  }

  it('initializes and returns singleton', async () => {
    const { manager } = await getFreshManager()
    expect(manager).toBeDefined()

    const mod = await import('../../../lib/mapbox/offline-manager')
    const same = mod.OfflineRegionManager.getInstance()
    expect(same).toBe(manager)
  })

  it('downloads a region and stores metadata', async () => {
    const { manager } = await getFreshManager()
    await manager.downloadRegion({
      name: 'test-region',
      bounds: VALID_BOUNDS,
      styleURL: 'mapbox://styles/mapbox/streets-v12',
      minZoom: 10,
      maxZoom: 14,
    })

    await new Promise((r) => setTimeout(r, 100))

    const meta = manager.getRegion('test-region')
    expect(meta).toBeDefined()
    expect(meta!.name).toBe('test-region')
    expect(meta!.state).toBe('complete')
  })

  it('reports progress via callback', async () => {
    const { manager } = await getFreshManager()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const progressCalls: any[] = []

    await manager.downloadRegion({
      name: 'progress-test',
      bounds: VALID_BOUNDS,
      styleURL: 'mapbox://styles/mapbox/streets-v12',
      minZoom: 10,
      maxZoom: 14,
      onProgress: (p) => progressCalls.push(p),
    })

    await new Promise((r) => setTimeout(r, 100))

    const completion = progressCalls.find((p) => p.state === 'complete')
    expect(completion).toBeDefined()
    expect(completion!.percentage).toBe(100)
  })

  it('rejects downloads over cellular', async () => {
    const { WiFiValidator } = await import('../../../lib/mapbox/wifi-validator')
    WiFiValidator.configure({
      getNetworkState: async () => ({ type: 'cellular', isConnected: true }),
      subscribe: () => () => {},
    })

    const { manager } = await getFreshManager()
    await expect(
      manager.downloadRegion({
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

  it('rejects invalid bounds (SW >= NE)', async () => {
    const { manager } = await getFreshManager()
    await expect(
      manager.downloadRegion({
        name: 'invalid-bounds',
        bounds: { sw: { lat: 37.8, lng: -122.4 }, ne: { lat: 37.7, lng: -122.5 } },
        styleURL: 'mapbox://styles/mapbox/streets-v12',
        minZoom: 10,
        maxZoom: 14,
      }),
    ).rejects.toThrow('Invalid bounds')
  })

  it('deletes a pack and removes metadata', async () => {
    const { manager } = await getFreshManager()
    await manager.downloadRegion({
      name: 'delete-test',
      bounds: VALID_BOUNDS,
      styleURL: 'mapbox://styles/mapbox/streets-v12',
      minZoom: 10,
      maxZoom: 14,
    })

    await new Promise((r) => setTimeout(r, 100))
    expect(manager.getRegion('delete-test')).toBeDefined()

    await manager.deletePack('delete-test')
    expect(manager.getRegion('delete-test')).toBeUndefined()
  })

  it('tracks total storage used', async () => {
    const { manager } = await getFreshManager()
    const before = manager.getTotalStorageUsed()

    await manager.downloadRegion({
      name: 'storage-test',
      bounds: VALID_BOUNDS,
      styleURL: 'mapbox://styles/mapbox/streets-v12',
      minZoom: 10,
      maxZoom: 14,
    })

    await new Promise((r) => setTimeout(r, 100))
    const after = manager.getTotalStorageUsed()
    expect(after).toBeGreaterThan(before)
  })

  it('reports queue status', async () => {
    const { manager } = await getFreshManager()
    const status = manager.getQueueStatus()
    expect(status).toHaveProperty('status')
    expect(status).toHaveProperty('pendingCount')
    expect(status).toHaveProperty('queuedIds')
  })
})
