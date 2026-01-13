import { StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../../hooks/use-semantic-theme'

const SettingsScreen = () => {
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
      <Text variant="headlineSmall" style={{ color: semantic.color.onSurface.default }}>
        Settings
      </Text>
      <Text variant="bodyMedium" style={{ color: semantic.color.onSurface.muted }}>
        Placeholder screen for app settings.
      </Text>
    </View>
  )
}

export default SettingsScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
