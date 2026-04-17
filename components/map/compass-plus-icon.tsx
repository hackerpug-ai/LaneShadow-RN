import Svg, { Circle, G, Line, Path } from 'react-native-svg'

import { useSemanticTheme } from '../../hooks/use-semantic-theme'

export type CompassPlusIconProps = {
  size?: number
}

/**
 * Compass icon with a plus badge in the bottom-right quadrant.
 * Uses semantic theme colors and spacing-derived stroke widths.
 */
export const CompassPlusIcon = ({ size = 28 }: CompassPlusIconProps) => {
  const { semantic } = useSemanticTheme()

  const strokeWidth = Math.max(1.5, semantic.space.xs / 3)
  const badgeRadius = Math.max(6, semantic.space.md) / 2
  const center = size / 2
  const radius = (size - strokeWidth * 2) / 2

  const needlePath = `M ${center} ${center - radius * 0.6} L ${center + radius * 0.2} ${
    center + radius * 0.4
  } L ${center - radius * 0.2} ${center + radius * 0.4} Z`

  const badgeCenterX = center + radius * 0.5
  const badgeCenterY = center + radius * 0.5

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img">
      <G
        stroke={semantic.color.onPrimary.default}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <Circle cx={center} cy={center} r={radius} fill={semantic.color.primary.default} />
        <Path d={needlePath} fill={semantic.color.onPrimary.default} />
        <Line x1={center} y1={center - radius * 0.75} x2={center} y2={center - radius * 0.4} />
        <Line x1={center} y1={center + radius * 0.1} x2={center} y2={center + radius * 0.35} />
      </G>

      {/* Plus badge */}
      <G>
        <Circle
          cx={badgeCenterX}
          cy={badgeCenterY}
          r={badgeRadius}
          fill={semantic.color.onSurface.default}
        />
        <Line
          x1={badgeCenterX - badgeRadius * 0.5}
          y1={badgeCenterY}
          x2={badgeCenterX + badgeRadius * 0.5}
          y2={badgeCenterY}
          stroke={semantic.color.surface.default}
          strokeWidth={strokeWidth * 0.9}
          strokeLinecap="round"
        />
        <Line
          x1={badgeCenterX}
          y1={badgeCenterY - badgeRadius * 0.5}
          x2={badgeCenterX}
          y2={badgeCenterY + badgeRadius * 0.5}
          stroke={semantic.color.surface.default}
          strokeWidth={strokeWidth * 0.9}
          strokeLinecap="round"
        />
      </G>
    </Svg>
  )
}
