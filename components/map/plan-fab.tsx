import { StyleSheet, View } from 'react-native'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { FAB } from '../ui/fab'

export type PlanFabProps = {
  onPress: () => void
}

export const PlanFab = ({ onPress }: PlanFabProps) => {
  const { semantic } = useSemanticTheme()

  return (
    <View
      style={[
        styles.container,
        {
          padding: semantic.space.md,
        },
      ]}
      pointerEvents="box-none"
    >
      <FAB icon="compass" label="Plan ride" onPress={onPress} testID="plan-fab" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
})
