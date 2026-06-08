// Using MaterialCommunityIcons on iOS for consistency with Android and web
// This ensures all icon names work across all platforms

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import type { SymbolWeight } from 'expo-symbols'
import type { OpaqueColorValue, StyleProp, TextStyle } from 'react-native'

export type IconName = keyof typeof MaterialCommunityIcons.glyphMap

/**
 * An icon component that uses Material Community Icons on all platforms.
 * This ensures consistent icon names and appearance across iOS, Android, and web.
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
