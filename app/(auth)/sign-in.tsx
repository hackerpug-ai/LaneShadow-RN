import { useRouter } from 'expo-router'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Button, Text } from 'react-native-paper'

/**
 * Sign-In Screen (Placeholder)
 * No-auth template - replace with your auth logic
 * For production: integrate with WorkOS, Firebase, or other auth provider
 */
export const SignInScreen = () => {
  const router = useRouter()

  const handleSignIn = () => {
    // Placeholder: navigate to home
    // Replace with real auth logic
    router.replace('/(app)/' as any)
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        React Native + Convex
      </Text>

      <Text variant="bodyMedium" style={styles.subtitle}>
        Auth Placeholder Template
      </Text>

      <Text variant="bodySmall" style={styles.description}>
        This is a no-auth starter template. Add your authentication provider here.
      </Text>

      <Button mode="contained" onPress={handleSignIn} style={styles.button}>
        Continue
      </Button>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    marginTop: 24,
  },
})

export default SignInScreen
