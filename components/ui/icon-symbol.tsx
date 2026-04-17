// Fallback for using MaterialCommunityIcons on Android and web.

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import type { SymbolWeight } from 'expo-symbols'

import type { OpaqueColorValue, StyleProp, TextStyle } from 'react-native'

export type IconName = keyof typeof MaterialCommunityIcons.glyphMap

/**
 * An icon component that uses native SF Symbols on iOS, and Material Community Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Community Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  testID,
}: {
  name: IconName
  size?: number
  color: string | OpaqueColorValue
  style?: StyleProp<TextStyle>
  weight?: SymbolWeight
  testID?: string
}) {
  return (
    <MaterialCommunityIcons color={color} size={size} name={name} style={style} testID={testID} />
  )
}
