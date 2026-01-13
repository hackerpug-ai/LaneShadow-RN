import { AppleMaps, GoogleMaps } from 'expo-maps'
import { Platform, StyleSheet } from 'react-native'
import type { ReactNode } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'

export type MapViewProps = {
  children?: ReactNode
  style?: StyleProp<ViewStyle>
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
})

export const MapViewWrapper = ({ style, children }: MapViewProps) => {
  const MapComponent = Platform.OS === 'ios' ? AppleMaps.View : GoogleMaps.View
  return <MapComponent style={[styles.map, style]}>{children}</MapComponent>
}
