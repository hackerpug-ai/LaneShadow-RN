import { useOAuth, useSignIn } from '@clerk/clerk-expo'
import { useRouter } from 'expo-router'
import React, { useCallback, useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import { Button, Text, TextInput } from 'react-native-paper'

export const SignInScreen = () => {
  const router = useRouter()
  const { signIn, setActive, isLoaded } = useSignIn()
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' })

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleEmailSignIn = useCallback(async () => {
    if (!isLoaded) return
    setLoading(true)
    try {
      const result = await signIn.create({
        identifier: email,
        password,
      })

      if (result.status === 'complete' && result.createdSessionId) {
        await setActive({ session: result.createdSessionId })
        router.replace('/(app)')
      } else {
        Alert.alert('Sign-in incomplete', 'Please complete the sign-in flow.')
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      Alert.alert('Sign-in failed', message)
    } finally {
      setLoading(false)
    }
  }, [email, password, isLoaded, router, setActive, signIn])

  const handleGoogle = useCallback(async () => {
    setLoading(true)
    try {
      const { createdSessionId } = await startOAuthFlow()
      if (createdSessionId) {
        await setActive({ session: createdSessionId })
        router.replace('/(app)')
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      Alert.alert('Google sign-in failed', message)
    } finally {
      setLoading(false)
    }
  }, [router, setActive, startOAuthFlow])

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall">Sign In</Text>
      <TextInput
        label="Email"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
      />
      <TextInput
        label="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />
      <Button mode="contained" onPress={handleEmailSignIn} loading={loading} disabled={loading}>
        Sign in with email
      </Button>
      <Button
        mode="outlined"
        onPress={handleGoogle}
        loading={loading}
        disabled={loading}
        style={styles.oauth}
      >
        Sign in with Google
      </Button>
      <Button onPress={() => router.push('/(auth)/sign-up')} disabled={loading}>
        Need an account? Sign up
      </Button>
    </View>
  )
}

export default SignInScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 16,
    justifyContent: 'center',
  },
  input: {
    width: '100%',
  },
  oauth: {
    marginTop: 8,
  },
})
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
