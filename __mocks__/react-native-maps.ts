/**
 * Mock for react-native-maps
 * Provides stub implementations for map components
 */
import React from 'react'

const createMapComponent = (name: string) => {
  const Component = ({ children, testID, ...props }: Record<string, unknown>) =>
    React.createElement(name, { testID, ...props }, children as React.ReactNode)
  Component.displayName = name
  return Component
}

export const MapView = createMapComponent('MapView')
export const Polyline = createMapComponent('Polyline')
export const Marker = createMapComponent('Marker')
export const Callout = createMapComponent('Callout')
export const Circle = createMapComponent('Circle')
export const Polygon = createMapComponent('Polygon')

export default {
  MapView,
  Polyline,
  Marker,
  Callout,
  Circle,
  Polygon,
}
