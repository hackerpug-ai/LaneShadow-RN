import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'

export const ConnectionBanner = () => {
  const { semantic } = useSemanticTheme()

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: semantic.color.warning.default,
          padding: semantic.space.md,
        },
      ]}
    >
      <Text
        variant="bodySmall"
        style={{
          color: semantic.color.onPrimary.default,
          textAlign: 'center',
        }}
      >
        📡 Connection Required - Some features may be limited
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
})

