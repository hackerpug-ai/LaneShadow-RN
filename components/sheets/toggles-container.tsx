/**
 * Toggles Container Component
 * Unified container for route preference toggles with semantic styling
 *
 * Design: .spec/designs/home.planridesheet.design.html
 * - Background container with rounded corners
 * - Icon containers with subtle backgrounds
 * - Border separators between items
 *
 * Following project patterns: semantic theme, composition over inheritance
 */

import { View, StyleSheet, ViewStyle } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { IconSymbol } from '../ui/icon-symbol'
import { Switch } from '../ui/switch'

export type TogglesContainerProps = {
  avoidHighways: boolean
  onToggleAvoidHighways: () => void
  avoidTolls: boolean
  onToggleAvoidTolls: () => void
  style?: ViewStyle
}

/**
 * TogglesContainer component
 * Renders route preference toggles in a unified container
 */
export const TogglesContainer = ({
  avoidHighways,
  onToggleAvoidHighways,
  avoidTolls,
  onToggleAvoidTolls,
  style,
}: TogglesContainerProps) => {
  const { semantic } = useSemanticTheme()

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: semantic.color.input.default,
          borderRadius: semantic.radius.lg,
          borderWidth: 1,
          borderColor: semantic.color.divider.default,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {/* Avoid Highways Toggle */}
      <View
        style={[
          styles.toggleRow,
          {
            paddingHorizontal: semantic.space.lg,
            paddingVertical: semantic.space.lg,
            borderBottomWidth: 1,
            borderBottomColor: semantic.color.divider.default,
          },
        ]}
      >
        <View style={styles.toggleLabel}>
          <View
            style={[
              styles.iconContainer,
              {
                width: 32,
                height: 32,
                borderRadius: semantic.radius.md,
                backgroundColor: semantic.color.surface.default,
              },
            ]}
          >
            <IconSymbol
              name="road-variant"
              size={20}
              color={semantic.color.onSurface.muted}
            />
          </View>
          <Text
            variant="bodyMedium"
            style={{ color: semantic.color.onSurface.default, fontWeight: '500' }}
          >
            Avoid highways
          </Text>
        </View>
        <Switch
          value={avoidHighways}
          onValueChange={onToggleAvoidHighways}
          testID="pref-avoid-highways"
        />
      </View>

      {/* Avoid Tolls Toggle */}
      <View
        style={[
          styles.toggleRow,
          {
            paddingHorizontal: semantic.space.lg,
            paddingVertical: semantic.space.lg,
          },
        ]}
      >
        <View style={styles.toggleLabel}>
          <View
            style={[
              styles.iconContainer,
              {
                width: 32,
                height: 32,
                borderRadius: semantic.radius.md,
                backgroundColor: semantic.color.surface.default,
              },
            ]}
          >
            <IconSymbol name="cash" size={20} color={semantic.color.onSurface.muted} />
          </View>
          <Text
            variant="bodyMedium"
            style={{ color: semantic.color.onSurface.default, fontWeight: '500' }}
          >
            Avoid tolls
          </Text>
        </View>
        <Switch
          value={avoidTolls}
          onValueChange={onToggleAvoidTolls}
          testID="pref-avoid-tolls"
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
