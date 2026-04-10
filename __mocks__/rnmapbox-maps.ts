/**
 * Mock for @rnmapbox/maps
 * Provides stub implementations for Mapbox map components and offline manager
 */
import React from 'react'
import { vi } from 'vitest'

const createMapComponent = (name: string) => {
  const Component = ({
    children,
    testID,
    id,
    ...props
  }: Record<string, unknown>) =>
    React.createElement(name, { testID, id, ...props }, children as React.ReactNode)
  Component.displayName = name
  return Component
}

export const MapView = createMapComponent('MapView')
export const Camera = createMapComponent('Camera')
export const MarkerView = createMapComponent('MarkerView')
export const ShapeSource = createMapComponent('ShapeSource')
export const LineLayer = createMapComponent('LineLayer')
export const SymbolLayer = createMapComponent('SymbolLayer')
export const CircleLayer = createMapComponent('CircleLayer')
export const FillLayer = createMapComponent('FillLayer')
export const RasterLayer = createMapComponent('RasterLayer')
export const HeatmapLayer = createMapComponent('HeatmapLayer')
export const UserLocation = createMapComponent('UserLocation')
export const Light = createMapComponent('Light')
export const Images = createMapComponent('Images')
export const Style = createMapComponent('Style')

/**
 * Mock OfflinePack for testing
 */
export interface OfflinePack {
  name: string
  bounds: {
    ne: { lat: number; lng: number }
    sw: { lat: number; lng: number }
  }
  styleURL: string
  minZoom: number
  maxZoom: number
  metadata: Record<string, unknown>
}

/**
 * Mock offline manager with in-memory pack storage for tests
 */
const packs = new Map<string, OfflinePack>()

export const offlineManager = {
  createPack: vi.fn(async (options: {
    name: string
    styleURL: string
    bounds: Array<{ ne: [number, number]; sw: [number, number] }>
    minZoom: number
    maxZoom: number
    metadata?: Record<string, unknown>
  }) => {
    const pack: OfflinePack = {
      name: options.name,
      bounds: {
        ne: { lat: options.bounds[0].ne[1], lng: options.bounds[0].ne[0] },
        sw: { lat: options.bounds[0].sw[1], lng: options.bounds[0].sw[0] },
      },
      styleURL: options.styleURL,
      minZoom: options.minZoom,
      maxZoom: options.maxZoom,
      metadata: options.metadata ?? {},
    }
    packs.set(options.name, pack)
    return pack
  }),

  deletePack: vi.fn(async (name: string) => {
    packs.delete(name)
  }),

  getPacks: vi.fn(async () => {
    return Array.from(packs.values())
  }),

  getPack: vi.fn(async (name: string) => {
    return packs.get(name) ?? null
  }),

  setPackSizeThrottledTrigger: vi.fn(),

  setTileCountLimit: vi.fn(),

  subscribe: vi.fn(() => ({ remove: vi.fn() })),

  _resetPacks: () => {
    packs.clear()
  },

  _setPack: (name: string, pack: OfflinePack) => {
    packs.set(name, pack)
  },
}

const Mapbox = {
  setAccessToken: () => {},
  offlineManager,
}

export default Mapbox
