import { StyleSheet, View } from 'react-native'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'

export const SheetHandle = () => {
  const { semantic } = useSemanticTheme()

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.handle,
          {
            backgroundColor: semantic.color.onSurface.subtle,
          },
        ]}
        testID="sheet-handle"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: 999,
  },
})
