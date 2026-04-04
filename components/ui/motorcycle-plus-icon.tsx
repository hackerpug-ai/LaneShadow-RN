import { View, StyleSheet } from 'react-native'

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'

import { useSemanticTheme } from '../../hooks/use-semantic-theme'

export type MotorcyclePlusIconProps = {
  size?: number
  color?: string
}

/**
 * Composite icon: motorbike glyph with a small plus-circle overlay in the bottom-right.
 * Follows the composition idiom established in components/map/compass-plus-icon.tsx.
 */
export const MotorcyclePlusIcon = ({ size = 22, color }: MotorcyclePlusIconProps) => {
  const { semantic } = useSemanticTheme()

  const baseColor = color ?? semantic.color.onSurface.default
  const overlaySize = Math.round(size * 0.55)

  return (
    <View style={{ width: size, height: size }}>
      <MaterialCommunityIcons name="motorbike" size={size} color={baseColor} />
      <View
        style={[
          styles.overlay,
          {
            width: overlaySize,
            height: overlaySize,
            bottom: -Math.round(overlaySize * 0.2),
            right: -Math.round(overlaySize * 0.2),
          },
        ]}
      >
        <MaterialCommunityIcons
          name="plus-circle"
          size={overlaySize}
          color={semantic.color.primary.default}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
