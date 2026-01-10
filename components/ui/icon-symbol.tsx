// Fallback for using MaterialCommunityIcons on Android and web.

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { SymbolWeight } from 'expo-symbols'

import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native'

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
}: {
  name: IconName
  size?: number
  color: string | OpaqueColorValue
  style?: StyleProp<TextStyle>
  weight?: SymbolWeight
}) {
  return <MaterialCommunityIcons color={color} size={size} name={name} style={style} />
}
