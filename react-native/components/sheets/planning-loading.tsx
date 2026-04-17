import { StyleSheet, View } from 'react-native'
import { ActivityIndicator, Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { Button } from '../ui/button'

export type RoutePlannerLoadingProps = {
  isVisible: boolean
  onCancel: () => void
}

export const RoutePlannerLoading = ({
  isVisible,
  onCancel,
}: RoutePlannerLoadingProps): React.ReactNode => {
  const { semantic } = useSemanticTheme()

  if (!isVisible) return null

  return (
    <View
      style={[styles.container, { backgroundColor: semantic.color.scrim.default }]}
      testID="planning-loading-overlay"
      accessibilityRole="progressbar"
      accessibilityLabel="Planning your route"
    >
      <View style={[styles.content, { gap: semantic.space.lg }]}>
        <ActivityIndicator
          size={semantic.space.xl}
          color={semantic.color.primary.default}
          animating={true}
        />
        <Text variant="bodyMedium" style={{ color: semantic.color.onSurface.default }}>
          Planning your route...
        </Text>
        <Button variant="outline" size="lg" onPress={onCancel} testID="planning-loading-cancel">
          Cancel
        </Button>
      </View>
    </View>
  )
}

RoutePlannerLoading.displayName = 'RoutePlannerLoading'

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
