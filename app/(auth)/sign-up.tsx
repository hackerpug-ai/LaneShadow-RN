import { useSignUp } from '@clerk/clerk-expo'
import { useRouter } from 'expo-router'
import React, { useCallback, useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import { Button, Text, TextInput } from 'react-native-paper'

export const SignUpScreen = () => {
  const router = useRouter()
  const { signUp, setActive, isLoaded } = useSignUp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignUp = useCallback(async () => {
    if (!isLoaded) return
    setLoading(true)
    try {
      const result = await signUp.create({
        emailAddress: email,
        password,
      })

      if (result.status === 'complete' && result.createdSessionId) {
        await setActive({ session: result.createdSessionId })
        router.replace('/(app)')
      } else {
        Alert.alert('Sign-up incomplete', 'Please complete the sign-up flow.')
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      Alert.alert('Sign-up failed', message)
    } finally {
      setLoading(false)
    }
  }, [email, password, isLoaded, router, setActive, signUp])

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall">Sign Up</Text>
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
      <Button mode="contained" onPress={handleSignUp} loading={loading} disabled={loading}>
        Create account
      </Button>
      <Button onPress={() => router.push('/(auth)/sign-in')} disabled={loading}>
        Already have an account? Sign in
      </Button>
    </View>
  )
}

export default SignUpScreen

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
})
