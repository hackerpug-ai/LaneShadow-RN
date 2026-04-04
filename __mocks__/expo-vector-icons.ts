/**
 * Stub for @expo/vector-icons. The real package ships .js files containing
 * inline JSX (expected to be processed by Metro), which vitest + vite cannot
 * parse. Tests only need a component-shaped stub that renders nothing.
 */
import React from 'react'

const createIconComponent = (name: string) => {
  const Icon = (props: Record<string, unknown>) =>
    React.createElement('View', {
      testID: (props as { testID?: string }).testID ?? `icon-${name}`,
      'data-name': (props as { name?: string }).name,
    })
  Icon.displayName = name
  Icon.glyphMap = {} as Record<string, number>
  return Icon
}

export const MaterialCommunityIcons = createIconComponent('MaterialCommunityIcons')
export const MaterialIcons = createIconComponent('MaterialIcons')
export const Ionicons = createIconComponent('Ionicons')
export const Feather = createIconComponent('Feather')
export const FontAwesome = createIconComponent('FontAwesome')
export const FontAwesome5 = createIconComponent('FontAwesome5')
export const FontAwesome6 = createIconComponent('FontAwesome6')
export const AntDesign = createIconComponent('AntDesign')
export const Entypo = createIconComponent('Entypo')
export const EvilIcons = createIconComponent('EvilIcons')
export const Fontisto = createIconComponent('Fontisto')
export const Foundation = createIconComponent('Foundation')
export const Octicons = createIconComponent('Octicons')
export const SimpleLineIcons = createIconComponent('SimpleLineIcons')
export const Zocial = createIconComponent('Zocial')

export default {
  MaterialCommunityIcons,
  MaterialIcons,
  Ionicons,
  Feather,
  FontAwesome,
  FontAwesome5,
  FontAwesome6,
  AntDesign,
  Entypo,
  EvilIcons,
  Fontisto,
  Foundation,
  Octicons,
  SimpleLineIcons,
  Zocial,
}
