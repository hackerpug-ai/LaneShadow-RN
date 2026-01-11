import { useRouter } from 'expo-router'
import React, { useCallback, useState } from 'react'
import { View } from 'react-native'
import { Button, HelperText, Text, TextInput } from 'react-native-paper'
import { AuthCard } from '../../components/auth/auth-card'
import { AuthScreenLayout } from '../../components/auth/auth-screen-layout'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { useSession } from '../../providers/session-provider'

export const SignUpScreen = () => {
  const router = useRouter()
  const { semantic } = useSemanticTheme()
  const { signUpWithEmail } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetErrors = () => setError(null)

  const handleSignUp = useCallback(async () => {
    resetErrors()
    if (!email || !password || !confirmPassword) {
      setError('Please fill all fields.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await signUpWithEmail({ email, password, name })
      router.replace('/(app)')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [confirmPassword, email, name, password, router, signUpWithEmail])

  return (
    <AuthScreenLayout title="Create your account" subtitle="Join Lane Shadow to save and replay rides">
      <AuthCard>
        <View style={{ gap: semantic.space.md }}>
          <TextInput
            label="Name"
            autoCapitalize="words"
            value={name}
            onChangeText={setName}
            mode="outlined"
          />
          <TextInput
            label="Email"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            mode="outlined"
          />
          <TextInput
            label="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            mode="outlined"
          />
          <TextInput
            label="Confirm password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            mode="outlined"
          />
          <Button mode="contained" onPress={handleSignUp} loading={loading} disabled={loading}>
            Create account
          </Button>
          <Button onPress={() => router.push('/(auth)/sign-in')} disabled={loading}>
            Already have an account? Sign in
          </Button>
          {error ? (
            <HelperText type="error" visible>
              {error}
            </HelperText>
          ) : null}
        </View>
      </AuthCard>
    </AuthScreenLayout>
  )
}

export default SignUpScreen
