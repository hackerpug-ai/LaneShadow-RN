/**
 * Stub for @expo/vector-icons. The real package ships .js files containing
 * inline JSX (expected to be processed by Metro), which vitest + vite cannot
 * parse. Tests only need a component-shaped stub that renders nothing.
 *
 * This module is used for BOTH:
 *   1. `import { MaterialCommunityIcons } from '@expo/vector-icons'` (named)
 *   2. `import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'` (default, deep path)
 *
 * The Vite stub plugin redirects both to this one file, so we expose a
 * single generic component as BOTH named exports AND as the default.
 * When imported via deep path, the default export is expected to be the
 * icon component itself, not a package-shaped object.
 */
import React from 'react'

type IconProps = {
  name?: string
  size?: number
  color?: string
  testID?: string
  style?: unknown
}

const IconStub = (props: IconProps) =>
  React.createElement('View', {
    testID: props.testID ?? `icon-${props.name ?? 'generic'}`,
    'data-icon-name': props.name,
    'data-icon-size': props.size,
    'data-icon-color': props.color,
    style: props.style,
  })
IconStub.displayName = 'IconStub'
;(IconStub as unknown as { glyphMap: Record<string, number> }).glyphMap = {}

// Named exports for consumers of `@expo/vector-icons` (base package).
export const MaterialCommunityIcons = IconStub
export const MaterialIcons = IconStub
export const Ionicons = IconStub
export const Feather = IconStub
export const FontAwesome = IconStub
export const FontAwesome5 = IconStub
export const FontAwesome6 = IconStub
export const AntDesign = IconStub
export const Entypo = IconStub
export const EvilIcons = IconStub
export const Fontisto = IconStub
export const Foundation = IconStub
export const Octicons = IconStub
export const SimpleLineIcons = IconStub
export const Zocial = IconStub

// Default export: the icon component itself. Deep-path imports like
// `@expo/vector-icons/MaterialCommunityIcons` expect the default export to
// be the component directly.
export default IconStub
