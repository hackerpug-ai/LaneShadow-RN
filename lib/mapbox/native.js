import { NativeModules } from 'react-native'

export const isMapboxAvailable = NativeModules.RNMBXModule != null

let _mapbox: any = null

export function getMapbox() {
  if (_mapbox) return _mapbox
  if (!isMapboxAvailable) return null
  try {
    _mapbox = require('@rnmapbox/maps')
    _mapbox.default.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '')
    return _mapbox
  } catch {
    return null
  }
}

export function requireMapboxModules() {
  const mod = getMapbox()
  if (!mod) {
    return {
      Camera: null,
      LineLayer: null,
      MapView: null,
      MarkerView: null,
      ShapeSource: null,
      UserLocation: null,
      offlineManager: null,
    }
  }
  return {
    Camera: mod.Camera,
    LineLayer: mod.LineLayer,
    MapView: mod.MapView,
    MarkerView: mod.MarkerView,
    ShapeSource: mod.ShapeSource,
    UserLocation: mod.UserLocation,
    offlineManager: mod.offlineManager,
  }
}
