// Using MaterialCommunityIcons on iOS for consistency with Android and web
// This ensures all icon names work across all platforms

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { SymbolWeight } from 'expo-symbols'
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native'

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
}: {
  name: IconName
  size?: number
  color: string | OpaqueColorValue
  style?: StyleProp<TextStyle>
  weight?: SymbolWeight
}) {
  return <MaterialCommunityIcons color={color} size={size} name={name} style={style} />
}
