import React from 'react'
import Svg, { Circle, Path } from 'react-native-svg'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'

type LaneShadowLogoProps = {
  size: number
}

export const LaneShadowLogo = ({ size }: LaneShadowLogoProps) => {
  const { semantic } = useSemanticTheme()

  // Derive thickness from semantic scale so it stays consistent across themes.
  // Target: thick “route” glyph like the HTML mock.
  const strokeWidth = Math.max(2, Math.round(semantic.space.sm / 3)) // usually 3
  const dotRadius = Math.max(2, Math.round(semantic.space.xs / 1.5)) // usually 3

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* Thick S-curve “route” glyph with two filled endpoints (matches login mock). */}
      <Circle cx="8" cy="6" r={dotRadius} fill={semantic.color.onPrimary.default} />
      <Circle
        cx="16"
        cy="18"
        r={dotRadius}
        fill={semantic.color.onPrimary.default}
      />
      <Path
        d="M8 6 V12 C8 15 12 15 12 12 V10 C12 7 16 7 16 10 V18"
        stroke={semantic.color.onPrimary.default}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  )
}
