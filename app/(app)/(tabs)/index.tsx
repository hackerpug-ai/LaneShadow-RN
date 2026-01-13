import { useAuth } from '@clerk/clerk-expo'
import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { BottomSheetWrapper } from '../../../components/sheets/bottom-sheet-wrapper'
import { Button } from '../../../components/ui/button'
import { useSemanticTheme } from '../../../hooks/use-semantic-theme'

const HomeScreen = () => {
  const { signOut, sessionId } = useAuth()
  const { semantic } = useSemanticTheme()
  const [sheetAVisible, setSheetAVisible] = useState(false)
  const [sheetBVisible, setSheetBVisible] = useState(false)

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: semantic.color.background.default,
          padding: semantic.space.lg,
          gap: semantic.space.md,
        },
      ]}
    >
      <Text variant="headlineSmall" style={{ color: semantic.color.onSurface.default }}>
        Home
      </Text>
      <Text variant="bodyMedium" style={{ color: semantic.color.onSurface.muted }}>
        Session: {sessionId ?? 'none'}
      </Text>

      <Button
        variant="secondary"
        onPress={() => {
          void signOut()
        }}
        style={styles.fullWidth}
        accessibilityLabel="Sign out"
      >
        Sign out
      </Button>

      <Button
        variant="outline"
        onPress={() => setSheetAVisible(true)}
        style={styles.fullWidth}
        accessibilityLabel="Open sheet A stack demo"
      >
        Open Sheet A (stack demo)
      </Button>

      <BottomSheetWrapper
        isVisible={sheetAVisible}
        onClose={() => setSheetAVisible(false)}
        testID="sheet-a"
        preset="half"
      >
        <Text variant="titleMedium" style={{ color: semantic.color.onSurface.default }}>
          Sheet A
        </Text>
        <Text variant="bodyMedium" style={{ color: semantic.color.onSurface.muted }}>
          This sheet demonstrates stackBehavior="push".
        </Text>
        <Button
          variant="default"
          onPress={() => setSheetBVisible(true)}
          style={styles.fullWidth}
          accessibilityLabel="Open sheet B"
        >
          Open Sheet B
        </Button>
      </BottomSheetWrapper>

      <BottomSheetWrapper
        isVisible={sheetBVisible}
        onClose={() => setSheetBVisible(false)}
        testID="sheet-b"
        preset="content"
      >
        <Text variant="titleMedium" style={{ color: semantic.color.onSurface.default }}>
          Sheet B
        </Text>
        <Text variant="bodyMedium" style={{ color: semantic.color.onSurface.muted }}>
          Closing this keeps Sheet A mounted.
        </Text>
        <Button
          onPress={() => setSheetBVisible(false)}
          style={styles.fullWidth}
          accessibilityLabel="Close sheet B"
        >
          Close Sheet B
        </Button>
      </BottomSheetWrapper>
    </View>
  )
}

export default HomeScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
})
