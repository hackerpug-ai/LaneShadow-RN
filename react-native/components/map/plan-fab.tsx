import { StyleSheet, View } from 'react-native'
import { Icon, Text } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { Button } from '../ui/button'

export type PlanFabProps = {
  onPress: () => void
}

export const PlanFab = ({ onPress }: PlanFabProps) => {
  const { semantic } = useSemanticTheme()
  const insets = useSafeAreaInsets()

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.container,
        {
          paddingHorizontal: semantic.space.xl,
          paddingBottom: insets.bottom + semantic.space.lg,
        },
      ]}
    >
      <Button
        variant="default"
        size="sm"
        onPress={onPress}
        icon={<Icon source="map-plus" size={24} color={semantic.color.onSurface.default} />}
        textStyle={{ color: semantic.color.onSurface.default }}
        style={[
          styles.button,
          {
            backgroundColor: semantic.color.primary.default,
            borderRadius: semantic.radius.xl,
            shadowColor: semantic.color.primary.default,
            shadowOffset: { width: 0, height: semantic.space.xs },
            shadowRadius: semantic.space.md,
            elevation: 4,
          },
        ]}
        testID="plan-fab"
        accessibilityLabel="Plan ride"
      >
        <Text
          variant="labelLarge"
          numberOfLines={1}
          style={{ color: semantic.color.onSurface.default }}
        >
          Plan Ride
        </Text>
      </Button>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  button: {
    shadowOpacity: 0.35,
  },
})
