import { StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../../hooks/use-semantic-theme'

const SavedRoutesScreen = () => {
  const { semantic } = useSemanticTheme()

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: semantic.color.background.default,
          padding: semantic.space.lg,
        },
      ]}
    >
      <Text variant='headlineSmall' style={{ color: semantic.color.onSurface.default }}>
        Saved Routes
      </Text>
      <Text variant='bodyMedium' style={{ color: semantic.color.onSurface.muted }}>
        Placeholder screen for Saved Routes list.
      </Text>
    </View>
  )
}

export default SavedRoutesScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
