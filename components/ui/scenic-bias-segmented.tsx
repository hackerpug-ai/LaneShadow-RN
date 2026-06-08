import type { ViewStyle } from 'react-native'
import { StyleSheet, View } from 'react-native'
import { SegmentedButtons, Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'

export type ScenicBias = 'default' | 'high'

export type ScenicBiasSegmentedProps = {
  value: ScenicBias
  onValueChange: (next: ScenicBias) => void
  style?: ViewStyle
}

const withAlpha = (color: string, alpha: number): string => {
  if (color.startsWith('#')) {
    const hex = color.slice(1)
    const isShort = hex.length === 3 || hex.length === 4
    const isLong = hex.length === 6 || hex.length === 8
    if (!isShort && !isLong) return color

    const expand = (value: string) => value + value
    const toInt = (value: string) => Number.parseInt(value, 16)

    const r = toInt(isShort ? expand(hex[0] ?? '0') : hex.slice(0, 2) || '00')
    const g = toInt(isShort ? expand(hex[1] ?? '0') : hex.slice(2, 4) || '00')
    const b = toInt(isShort ? expand(hex[2] ?? '0') : hex.slice(4, 6) || '00')
    return `rgba(${r},${g},${b},${alpha})`
  }

  const rgbMatch = color.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/)
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch
    return `rgba(${r},${g},${b},${alpha})`
  }

  const rgbaMatch = color.match(/^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\s*\)$/)
  if (rgbaMatch) {
    const [, r, g, b] = rgbaMatch
    return `rgba(${r},${g},${b},${alpha})`
  }

  return color
}

export const ScenicBiasSegmented = ({
  value,
  onValueChange,
  style,
}: ScenicBiasSegmentedProps): React.ReactNode => {
  const { semantic } = useSemanticTheme()

  const buttonPaddingY = semantic.space.sm + semantic.space.xs

  return (
    <View style={[styles.container, { gap: semantic.space.sm }, style]}>
      <Text
        variant="labelSmall"
        style={{
          color: withAlpha(semantic.color.onSurface.muted ?? '', 0.8),
          marginLeft: semantic.space.xs,
        }}
      >
        Scenic Bias
      </Text>
      <SegmentedButtons
        value={value}
        onValueChange={(next) => onValueChange(next as ScenicBias)}
        style={[
          styles.segmentedContainer,
          {
            backgroundColor: semantic.color.input.default,
            borderRadius: semantic.radius.xl,
            padding: semantic.space.xs,
          },
        ]}
        theme={{
          colors: {
            secondaryContainer: 'transparent',
            onSecondaryContainer: semantic.color.onSurface.default,
            primary: semantic.color.primary.default,
            outline: 'transparent',
            onSurface: semantic.color.onSurface.muted,
          },
        }}
        buttons={[
          {
            value: 'default',
            label: 'Default',
            icon: 'arrow-right',
            checkedColor: semantic.color.onSurface.default,
            uncheckedColor: semantic.color.onSurface.muted,
            style: [
              styles.segmentedButton,
              {
                paddingVertical: buttonPaddingY,
                paddingHorizontal: semantic.space.md,
                borderRadius: semantic.radius.lg,
                backgroundColor:
                  value === 'default' ? semantic.color.background.default : 'transparent',
              },
            ],
            labelStyle: [
              semantic.type.label.md,
              {
                color:
                  value === 'default'
                    ? semantic.color.onSurface.default
                    : semantic.color.onSurface.muted,
              },
            ],
          },
          {
            value: 'high',
            label: 'High Scenic',
            icon: 'image',
            checkedColor: semantic.color.onPrimary.default,
            uncheckedColor: semantic.color.onSurface.muted,
            style: [
              styles.segmentedButton,
              {
                paddingVertical: buttonPaddingY,
                paddingHorizontal: semantic.space.md,
                borderRadius: semantic.radius.lg,
                backgroundColor: value === 'high' ? semantic.color.primary.default : 'transparent',
              },
            ],
            labelStyle: [
              semantic.type.label.md,
              {
                color:
                  value === 'high'
                    ? semantic.color.onPrimary.default
                    : semantic.color.onSurface.muted,
              },
            ],
          },
        ]}
      />
    </View>
  )
}

ScenicBiasSegmented.displayName = 'ScenicBiasSegmented'

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
  },
  segmentedContainer: {
    width: '100%',
  },
  segmentedButton: {
    flex: 1,
  },
})
