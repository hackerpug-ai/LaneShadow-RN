/**
 * Mock for @rnmapbox/maps
 * Provides stub implementations for Mapbox map components
 */
import React from 'react'

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

const Mapbox = {
  setAccessToken: () => {},
}

export default Mapbox
