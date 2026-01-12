import React from 'react'
import { StyleSheet, View } from 'react-native'
import Svg, { Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'

type TopographicBackgroundProps = {
  opacity?: number
}

/**
 * Background Decoration (Topographic Texture Simulation)
 * Mirrors `.spec/designs/login.designs.html` behavior:
 * - full-screen layer
 * - pointer-events none
 * - low opacity
 * - subtle radial glow + contour-like lines
 */
export const TopographicBackground = ({ opacity = 0.1 }: TopographicBackgroundProps) => {
  const { semantic } = useSemanticTheme()

  // Keep strokes consistent with semantic spacing (avoid hardcoded “magic” thickness)
  const strokeWidth = Math.max(1, Math.round(semantic.space.xs / 2))

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <Svg width="100%" height="100%" viewBox="0 0 360 800" style={{ opacity }}>
        <Defs>
          <RadialGradient id="topoGlow" cx="20%" cy="25%" rx="60%" ry="60%">
            <Stop offset="0%" stopColor={semantic.color.primary.default} stopOpacity="0.22" />
            <Stop offset="55%" stopColor={semantic.color.primary.default} stopOpacity="0.08" />
            <Stop offset="100%" stopColor={semantic.color.primary.default} stopOpacity="0" />
          </RadialGradient>
        </Defs>

        <Rect x="0" y="0" width="360" height="800" fill="url(#topoGlow)" />

        {/* Contour-like lines: keep very subtle (equivalent to bg-white/10-ish). */}
        <Path
          d="M-40 110 C 40 30, 150 30, 230 110 S 420 190, 520 110"
          stroke={semantic.color.onSurface.default}
          strokeOpacity="0.06"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Path
          d="M-60 170 C 20 90, 150 90, 260 170 S 470 250, 590 170"
          stroke={semantic.color.onSurface.default}
          strokeOpacity="0.05"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Path
          d="M-80 230 C 0 150, 150 150, 280 230 S 520 330, 660 230"
          stroke={semantic.color.onSurface.default}
          strokeOpacity="0.045"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Path
          d="M-100 300 C -10 220, 160 220, 300 300 S 560 420, 700 300"
          stroke={semantic.color.onSurface.default}
          strokeOpacity="0.04"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Path
          d="M-120 380 C -20 300, 170 300, 320 380 S 600 510, 760 380"
          stroke={semantic.color.onSurface.default}
          strokeOpacity="0.035"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Path
          d="M-140 470 C -30 390, 180 390, 340 470 S 640 620, 820 470"
          stroke={semantic.color.onSurface.default}
          strokeOpacity="0.03"
          strokeWidth={strokeWidth}
          fill="none"
        />
      </Svg>
    </View>
  )
}

