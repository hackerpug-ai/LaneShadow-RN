/**
 * Mock for react-native-svg
 * Provides stub implementations for SVG components used in marker rendering
 */
import React from 'react'

const createSvgComponent = (name: string) => {
  const Component = ({ children, testID, ...props }: Record<string, unknown>) =>
    React.createElement(name, { testID, ...props }, children as React.ReactNode)
  Component.displayName = name
  return Component
}

export const Svg = createSvgComponent('Svg')
export const Circle = createSvgComponent('Circle')
export const Path = createSvgComponent('Path')
export const G = createSvgComponent('G')
export const Rect = createSvgComponent('Rect')
export const Line = createSvgComponent('Line')
export const Ellipse = createSvgComponent('Ellipse')
export const Polygon = createSvgComponent('Polygon')
export const Polyline = createSvgComponent('Polyline')
export const Text = createSvgComponent('Text')
export const TSpan = createSvgComponent('TSpan')
export const TextPath = createSvgComponent('TextPath')
export const Use = createSvgComponent('Use')
export const Image = createSvgComponent('Image')
export const Symbol = createSvgComponent('Symbol')
export const Defs = createSvgComponent('Defs')
export const LinearGradient = createSvgComponent('LinearGradient')
export const RadialGradient = createSvgComponent('RadialGradient')
export const Stop = createSvgComponent('Stop')
export const ClipPath = createSvgComponent('ClipPath')
export const Pattern = createSvgComponent('Pattern')
export const Mask = createSvgComponent('Mask')
export const Marker = createSvgComponent('Marker')

export const XmlUri = createSvgComponent('XmlUri')
export const SvgXml = createSvgComponent('SvgXml')
export const SvgCss = createSvgComponent('SvgCss')
export const SvgWithCss = createSvgComponent('SvgWithCss')
export const SvgWithCssUri = createSvgComponent('SvgWithCssUri')

export default Svg
