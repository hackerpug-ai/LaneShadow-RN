import { useAuth } from '@clerk/clerk-expo'
import React, { useCallback } from 'react'
import { StyleSheet, View } from 'react-native'
import { Button, Text } from 'react-native-paper'

export const HomeScreen = () => {
  const { signOut, sessionId } = useAuth()

  const handleSignOut = useCallback(async () => {
    await signOut()
  }, [signOut])

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall">Home</Text>
      <Text variant="bodyMedium">Session: {sessionId ?? 'none'}</Text>
      <Button mode="contained" onPress={handleSignOut} style={styles.button}>
        Sign out
      </Button>
    </View>
  )
}

export default HomeScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 16,
    justifyContent: 'center',
  },
  button: {
    marginTop: 12,
  },
})
